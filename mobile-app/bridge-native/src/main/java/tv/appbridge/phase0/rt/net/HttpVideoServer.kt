package tv.appbridge.phase0.rt.net

import tv.appbridge.phase0.probe.ProbeLog
import java.net.ServerSocket
import java.net.Socket
import kotlin.concurrent.thread

/**
 * Minimal HTTP/1.1 server for TV status + video transport (zero deps).
 * GET /status -> session JSON. GET /stream -> fragmented MP4 while a
 * capture source is registered, else 503 with a machine-readable reason.
 * No source is registered in this build (capture blocked — see
 * KNOWN_LIMITATIONS); the endpoint reports that honestly instead of
 * serving primary-screen mirroring.
 */
class HttpVideoServer(private val port: Int, private val status: () -> String, private val discover: (String) -> String? = { null }) {

    /** Pluggable frame source; null = no capture backend. */
    interface Source {
        val width: Int
        val height: Int
        /** Blocks; calls init once then frag per fragment until stopped. */
        fun run(init: (ByteArray) -> Unit, frag: (ByteArray) -> Unit, stop: () -> Boolean)
    }

    @Volatile var source: Source? = null
    @Volatile var audioSource: Source? = null
    @Volatile private var running = false
    private var server: ServerSocket? = null

    fun start() {
        if (running) return
        running = true
        thread(name = "AppBridgeHttp", isDaemon = true) { loop() }
    }

    fun stop() {
        running = false
        try { server?.close() } catch (_: Throwable) {}
        server = null
    }

    private fun loop() {
        try {
            server = ServerSocket(port)
            ProbeLog.report("probe" to "http", "result" to "LISTENING", "port" to port)
            while (running) {
                val sock = try {
                    server!!.accept()
                } catch (t: Throwable) {
                    break
                }
                thread(name = "AppBridgeHttpConn", isDaemon = true) { handle(sock) }
            }
        } catch (t: Throwable) {
            if (running) ProbeLog.error("http_listen", t)
        }
    }

    private fun handle(sock: Socket) {
        try {
            sock.use { s ->
                s.tcpNoDelay = true
                val input = s.getInputStream().bufferedReader(Charsets.UTF_8)
                val out = s.getOutputStream()
                val req = input.readLine() ?: return
                // consume headers
                var line: String?
                do {
                    line = input.readLine()
                } while (line != null && line.isNotEmpty())
                when {
                    req.startsWith("GET /discover ") -> {
                        val json = discover(s.inetAddress.hostAddress ?: "")
                        val body = (json ?: "{}").toByteArray()
                        out.write(("HTTP/1.1 ${if (json == null) "403 Forbidden" else "200 OK"}\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: ${body.size}\r\nConnection: close\r\n\r\n").toByteArray())
                        out.write(body)
                    }
                    req.startsWith("GET /status") -> {
                        val body = status().toByteArray()
                        out.write(
                            ("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n" +
                                "Access-Control-Allow-Origin: *\r\nContent-Length: ${body.size}\r\nConnection: close\r\n\r\n")
                                .toByteArray()
                        )
                        out.write(body)
                    }
                    req.startsWith("GET /stream") || req.startsWith("GET /audio") -> {
                        val src = if (req.startsWith("GET /audio")) audioSource else source
                        if (src == null) {
                            val body = ("{\"t\":\"error\",\"code\":\"capture-blocked\"," +
                                "\"message\":\"no secondary-display frame source\"}")
                                .toByteArray()
                            out.write(
                                ("HTTP/1.1 503 Service Unavailable\r\n" +
                                    "Content-Type: application/json\r\n" +
                                    "Access-Control-Allow-Origin: *\r\nContent-Length: ${body.size}\r\nConnection: close\r\n\r\n")
                                    .toByteArray()
                            )
                            out.write(body)
                        } else {
                            streamFmp4(out, src)
                        }
                    }
                    else -> out.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n".toByteArray())
                }
                out.flush()
            }
        } catch (t: Throwable) {
            ProbeLog.error("http_conn", t)
        }
    }

    private fun streamFmp4(out: java.io.OutputStream, src: Source) {
        try {
            out.write(
                ("HTTP/1.1 200 OK\r\nContent-Type: ${if (src.width == 0) "audio/mp4" else "video/mp4"}\r\n" +
                    "Access-Control-Allow-Origin: *\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n").toByteArray()
            )
            var stopped = false
            val chunk = { bytes: ByteArray ->
                val head = "${bytes.size.toString(16)}\r\n".toByteArray()
                synchronized(out) {
                    out.write(head)
                    out.write(bytes)
                    out.write("\r\n".toByteArray())
                    out.flush()
                }
            }
            src.run({ init -> chunk(init) }, { frag -> chunk(frag) }) { stopped }
        } catch (t: Throwable) {
            ProbeLog.error("http_stream", t)
        }
    }
}
