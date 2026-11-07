package tv.appbridge.phase0.rt.net

import tv.appbridge.phase0.probe.ProbeLog
import java.io.InputStream
import java.io.OutputStream
import java.net.ServerSocket
import java.net.Socket
import java.security.MessageDigest
import java.util.Base64
import kotlin.concurrent.thread

/**
 * Minimal RFC 6455 WebSocket server (text messages only), zero dependencies.
 * One client at a time is enough for the POC (single TV); extra connections
 * are rejected politely. Callbacks fire on socket threads.
 */
class WsServer(private val port: Int, private val listener: Listener) {

    interface Listener {
        fun onMessage(text: String, reply: (String) -> Unit)
        fun onConnected()
        fun onDisconnected()
    }

    @Volatile private var running = false
    private var server: ServerSocket? = null
    @Volatile private var client: Socket? = null
    @Volatile private var out: OutputStream? = null

    fun start() {
        if (running) return
        running = true
        thread(name = "AppBridgeWs", isDaemon = true) { acceptLoop() }
    }

    fun stop() {
        running = false
        try { client?.close() } catch (_: Throwable) {}
        try { server?.close() } catch (_: Throwable) {}
        client = null
        server = null
    }

    fun isClientConnected(): Boolean = client?.isConnected == true

    fun push(text: String): Boolean {
        return try {
            val o = out ?: return false
            sendText(o, text)
            true
        } catch (t: Throwable) {
            false
        }
    }

    private fun acceptLoop() {
        try {
            server = ServerSocket(port)
            ProbeLog.report("probe" to "ws", "result" to "LISTENING", "port" to port)
            while (running) {
                val sock = try {
                    server!!.accept()
                } catch (t: Throwable) {
                    if (running) ProbeLog.error("ws_accept", t)
                    break
                }
                if (client != null) {
                    try { sock.close() } catch (_: Throwable) {}
                    continue
                }
                thread(name = "AppBridgeWsClient", isDaemon = true) { handle(sock) }
            }
        } catch (t: Throwable) {
            if (running) ProbeLog.error("ws_listen", t)
        }
    }

    private fun handle(sock: Socket) {
        try {
            sock.soTimeout = 0
            val input = sock.getInputStream()
            val output = sock.getOutputStream()
            if (!handshake(input, output)) {
                sock.close()
                return
            }
            client = sock
            out = output
            listener.onConnected()
            readLoop(input)
        } catch (t: Throwable) {
            ProbeLog.error("ws_client", t)
        } finally {
            try { sock.close() } catch (_: Throwable) {}
            if (client === sock) {
                client = null
                out = null
                listener.onDisconnected()
            }
        }
    }

    private fun handshake(input: InputStream, output: OutputStream): Boolean {
        val head = readHttpHead(input, 8192) ?: return false
        val key = head.lines()
            .firstOrNull { it.startsWith("Sec-WebSocket-Key:", ignoreCase = true) }
            ?.substringAfter(":")?.trim() ?: return false
        val accept = Base64.getEncoder().encodeToString(
            MessageDigest.getInstance("SHA-1")
                .digest((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").toByteArray())
        )
        val resp = "HTTP/1.1 101 Switching Protocols\r\n" +
            "Upgrade: websocket\r\nConnection: Upgrade\r\n" +
            "Sec-WebSocket-Accept: $accept\r\n\r\n"
        output.write(resp.toByteArray())
        output.flush()
        return true
    }

    private fun readHttpHead(input: InputStream, max: Int): String? {
        val buf = ByteArrayOutput()
        var b = 0
        var last4 = byteArrayOf(0, 0, 0, 0)
        while (buf.size() < max) {
            val r = input.read()
            if (r < 0) return null
            b = r
            last4 = byteArrayOf(last4[1], last4[2], last4[3], b.toByte())
            buf.write(b)
            if (last4.contentEquals(byteArrayOf(13, 10, 13, 10))) break
        }
        return String(buf.bytes(), Charsets.UTF_8)
    }

    private fun readLoop(input: InputStream) {
        while (running && client != null) {
            val msg = readFrame(input) ?: break
            if (msg != null) {
                try {
                    listener.onMessage(msg) { reply -> push(reply) }
                } catch (t: Throwable) {
                    ProbeLog.error("ws_msg", t)
                }
            }
        }
    }

    /** Returns text, null on empty control handling, throws/breaks on close/error. */
    private fun readFrame(input: InputStream): String? {
        val b0 = input.read()
        if (b0 < 0) throw java.io.EOFException()
        val b1 = input.read()
        if (b1 < 0) throw java.io.EOFException()
        val opcode = b0 and 0x0F
        val masked = (b1 and 0x80) != 0
        var len = (b1 and 0x7F).toLong()
        if (len == 126L) len = readN(input, 2).let { ((it[0].toInt() and 0xFF) shl 8) or (it[1].toInt() and 0xFF) }.toLong()
        else if (len == 127L) len = java.nio.ByteBuffer.wrap(readN(input, 8)).long
        val mask = if (masked) readN(input, 4) else null
        if (len > 4 * 1024 * 1024) throw java.io.IOException("frame too large: $len")
        val payload = readN(input, len.toInt())
        if (mask != null) for (i in payload.indices) payload[i] = (payload[i].toInt() xor mask[i % 4].toInt()).toByte()
        return when (opcode) {
            0x1 -> String(payload, Charsets.UTF_8)
            0x8 -> throw java.io.EOFException() // close
            0x9 -> { // ping -> pong
                val o = out
                if (o != null) sendFrame(o, 0xA, payload)
                null
            }
            0xA -> null // pong
            else -> null // ignore continuation/binary for POC
        }
    }

    private fun readN(input: InputStream, n: Int): ByteArray {
        val out = ByteArray(n)
        var off = 0
        while (off < n) {
            val r = input.read(out, off, n - off)
            if (r < 0) throw java.io.EOFException()
            off += r
        }
        return out
    }

    private fun sendText(o: OutputStream, text: String) =
        sendFrame(o, 0x1, text.toByteArray(Charsets.UTF_8))

    private fun sendFrame(o: OutputStream, opcode: Int, payload: ByteArray) {
        synchronized(o) {
            o.write(0x80 or opcode)
            val n = payload.size
            when {
                n < 126 -> o.write(n)
                n < 65536 -> {
                    o.write(126)
                    o.write((n shr 8) and 0xFF); o.write(n and 0xFF)
                }
                else -> {
                    o.write(127)
                    val bb = java.nio.ByteBuffer.allocate(8).putLong(n.toLong()).array()
                    o.write(bb)
                }
            }
            o.write(payload)
            o.flush()
        }
    }

    private class ByteArrayOutput {
        private var buf = ByteArray(1024)
        private var n = 0
        fun write(b: Int) {
            if (n >= buf.size) buf = buf.copyOf(buf.size * 2)
            buf[n++] = b.toByte()
        }
        fun size() = n
        fun bytes() = buf.copyOf(n)
    }
}
