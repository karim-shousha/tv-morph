package com.morphtv.bridge.receiver

import android.content.Context
import android.net.wifi.WifiManager
import java.net.DatagramPacket
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.MulticastSocket

/** Respond to the host's explicit Morph receiver SSDP query while the app is open. */
class ReceiverDiscovery(private val context: Context, private val ip: () -> String) {
    private var socket: MulticastSocket? = null
    private var lock: WifiManager.MulticastLock? = null
    @Volatile private var running = false

    fun start() {
        running = true
        Thread({
            try {
                val wm = context.applicationContext.getSystemService(WifiManager::class.java)
                lock = wm?.createMulticastLock("morph-receiver")?.apply { setReferenceCounted(false); acquire() }
                val s = MulticastSocket(null)
                socket = s
                s.reuseAddress = true; s.bind(InetSocketAddress(1900)); s.soTimeout = 1000
                @Suppress("DEPRECATION")
                val address=ip()
                if(address.isNotEmpty())java.net.NetworkInterface.getByInetAddress(InetAddress.getByName(address))?.let { s.networkInterface=it }
                s.joinGroup(InetAddress.getByName("239.255.255.250"))
                val buffer = ByteArray(4096)
                while (running) {
                    try {
                        val packet = DatagramPacket(buffer, buffer.size)
                        s.receive(packet)
                        val query = String(packet.data, 0, packet.length, Charsets.UTF_8)
                        if (!query.startsWith("M-SEARCH") || !query.contains(TARGET, true) || ip().isEmpty()) continue
                        val response = ("HTTP/1.1 200 OK\r\nCACHE-CONTROL: max-age=30\r\nEXT:\r\n" +
                            "ST: $TARGET\r\nUSN: uuid:morph-bridge-${ip()}::$TARGET\r\n" +
                            "SERVER: Android UPnP/1.0 MorphBridge/0.6.0\r\n\r\n").toByteArray()
                        s.send(DatagramPacket(response, response.size, packet.address, packet.port))
                    } catch (_: java.net.SocketTimeoutException) { }
                }
            } catch (_: Throwable) {
                // Manual IP pairing remains available when LAN multicast is blocked.
            } finally {
                socket?.close()
                try { lock?.release() } catch (_: Throwable) { }
            }
        }, "MorphReceiverDiscovery").start()
    }
    fun close() { running = false; socket?.close() }
    companion object { const val TARGET = "urn:morph-tv-com:device:BridgeReceiver:1" }
}
