package tv.appbridge.phase0.rt.tv

import tv.appbridge.phase0.probe.ProbeLog
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.HttpURLConnection
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.URL
import java.net.Socket
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * TV discovery on the LAN (patterns adapted with permission from the
 * owner's Morph Remote project: SSDP M-SEARCH to 239.255.255.250:1900
 * with Samsung/LG search targets, then per-brand verification).
 * Found TVs fill the manual-IP field; manual IP always stays available.
 */
object TvDiscovery {

    data class Found(val ip: String, val brand: String, val detail: String, val name: String = "", val model: String = "")

    private val TARGETS = listOf(
        "urn:samsung.com:device:RemoteControlReceiver:1" to "samsung",
        "urn:samsung.com:service:MultiScreenService:1" to "samsung",
        "urn:lge.com:service:webos-second-screen:1" to "lg",
        "urn:morph-tv-com:device:BridgeReceiver:1" to "android",
        "urn:dial-multiscreen-org:service:dial:1" to "dial",
        "ssdp:all" to "all"
    )

    /** Restore a known reachable TV, or fill the IP when discovery is unambiguous. */
    fun chooseCandidate(found: List<Found>, currentIp: String): Found? =
        found.firstOrNull { it.ip == currentIp } ?: found.singleOrNull()

    fun buildMSearch(st: String, mx: Int = 2): ByteArray {
        return ("M-SEARCH * HTTP/1.1\r\n" +
            "HOST: 239.255.255.250:1900\r\n" +
            "MAN: \"ssdp:discover\"\r\n" +
            "MX: $mx\r\n" +
            "ST: $st\r\n\r\n").toByteArray(Charsets.UTF_8)
    }

    /** Parse one SSDP response datagram; null when not a TV candidate. */
    fun parseResponse(text: String, fromIp: String): Found? {
        if (!text.startsWith("HTTP/1.1 200") && !text.startsWith("NOTIFY")) return null
        var st = ""
        var location = ""
        var server = ""
        for (line in text.lines()) {
            val i = line.indexOf(':')
            if (i < 0) continue
            val k = line.substring(0, i).trim().uppercase()
            val v = line.substring(i + 1).trim()
            when (k) {
                "ST", "NT" -> st = v
                "LOCATION" -> location = v
                "SERVER" -> server = v
            }
        }
        val brand = TARGETS.filter { it.second !in listOf("dial", "all") }.firstOrNull { st.contains(it.first, ignoreCase = true) }?.second
            ?: return null
        val detail = when {
            server.isNotEmpty() -> server.take(120)
            location.isNotEmpty() -> location.take(120)
            else -> st.take(80)
        }
        return Found(fromIp, brand, detail)
    }

    /** Blocking SSDP scan; call off the UI thread. */
    fun scan(windowMs: Long = 4500, localIp: String? = null): List<Found> {
        val out = LinkedHashMap<String, Found>()
        val descriptions = LinkedHashMap<String, String>()
        var sock: DatagramSocket? = null
        try {
            sock = DatagramSocket(null)
            sock.reuseAddress = true
            val lan = localIp?.takeIf { it.matches(Regex("(?:[0-9]{1,3}\\.){3}[0-9]{1,3}")) }
            sock.bind(if (lan == null) InetSocketAddress(0) else InetSocketAddress(InetAddress.getByName(lan), 0))
            sock.soTimeout = 800
            val group = InetAddress.getByName("239.255.255.250")
            for ((st, _) in TARGETS) {
                val msg = buildMSearch(st)
                try {
                    sock.send(DatagramPacket(msg, msg.size, group, 1900))
                } catch (_: Throwable) {
                }
            }
            val deadline = System.currentTimeMillis() + windowMs
            val buf = ByteArray(4096)
            while (System.currentTimeMillis() < deadline) {
                try {
                    val p = DatagramPacket(buf, buf.size)
                    sock.receive(p)
                    val text = String(p.data, 0, p.length, Charsets.UTF_8)
                    val f = try {
                        parseResponse(text, p.address.hostAddress ?: continue)
                    } catch (_: Throwable) {
                        null
                    }
                    if (f != null) out.putIfAbsent(f.ip, f)
                    val location = text.lines().firstOrNull { it.startsWith("LOCATION:", true) }?.substringAfter(':')?.trim()
                    if (location != null) try {
                        val url = URL(location)
                        if (url.protocol == "http" && url.host == p.address.hostAddress && url.userInfo == null) descriptions.putIfAbsent(url.host, location)
                    } catch (_: Exception) {}
                } catch (_: Throwable) {
                }
            }
        } catch (t: Throwable) {
            ProbeLog.error("tv_scan", t)
        } finally {
            try {
                sock?.close()
            } catch (_: Throwable) {
            }
        }
        // Same native Android-TV Remote endpoint used by the owner's Morph TV
        // discovery. This finds TVs before their bridge receiver is installed,
        // including networks that suppress multicast discovery responses.
        val pool = Executors.newFixedThreadPool(12)
        try {
            pool.invokeAll(descriptions.map { (address, location) -> Callable {
                try { parseDescription(readHttp(location), address) } catch (_: Exception) { null }
            } }, 3, TimeUnit.SECONDS).forEach { task ->
                val tv = if (task.isCancelled) null else try { task.get() } catch (_: Exception) { null }
                if (tv != null) out[tv.ip] = tv
            }
        } finally { pool.shutdownNow() }
        if (localIp != null) discoverAndroid(localIp).forEach { out.putIfAbsent(it.ip, it) }
        ProbeLog.report("probe" to "tv_scan", "result" to "DONE", "found" to out.size)
        return out.values.toList()
    }

    private fun discoverAndroid(localIp: String): List<Found> {
        if (!localIp.matches(Regex("(?:[0-9]{1,3}\\.){3}[0-9]{1,3}"))) return emptyList()
        val prefix = localIp.substringBeforeLast('.') + "."
        val workers = Executors.newFixedThreadPool(48)
        return try {
            workers.invokeAll((1..254).map { host -> Callable {
                val candidate = prefix + host
                if (candidate == localIp) null else {
                    fun open(port: Int): Boolean = try { Socket().use { it.connect(InetSocketAddress(candidate, port), 200) }; true } catch (_: Exception) { false }
                    when {
                        open(8001) -> samsungDevice(candidate)
                        open(60000) -> try { parseDescription(readHttp("http://$candidate:60000/dd.xml"), candidate) } catch (_: Exception) { null }
                        open(6466) -> {
                            val xml = try { readHttp("http://$candidate:8008/ssdp/device-desc.xml") } catch (_: Exception) { "" }
                            Found(candidate, "android", "Android TV Remote service", descriptionTag(xml, "friendlyName"), descriptionTag(xml, "modelName"))
                        }
                        else -> null
                    }
                }
            } }, 7, TimeUnit.SECONDS).mapNotNull {
                if (it.isCancelled) null else try { it.get() } catch (_: Exception) { null }
            }
        } finally { workers.shutdownNow() }
    }

    /** Device descriptions distinguish Fire TV from ordinary Chromecast/DIAL receivers. */
    private fun descriptionTag(xml: String, name: String): String =
        Regex("<$name(?:\\s[^>]*)?>(.*?)</$name>", RegexOption.IGNORE_CASE).find(xml)?.groupValues?.get(1)?.trim()
            ?.replace("&amp;", "&")?.replace("&lt;", "<")?.replace("&gt;", ">")?.replace("&quot;", "\"")?.replace("&apos;", "'").orEmpty()
    fun parseDescription(xml: String, ip: String): Found? {
        fun tag(name: String) = descriptionTag(xml, name)
        val name = tag("friendlyName")
        val maker = tag("manufacturer")
        val model = tag("modelName")
        val brand = when {
            maker.contains("Samsung", true) -> "samsung"
            maker.contains("Amazon", true) || name.contains("Fire TV", true) || model.contains("Fire TV", true) -> "firetv"
            maker.contains("LG Electronics", true) -> "lg"
            else -> return null
        }
        return Found(ip, brand, "$name - $model".take(120), name, model)
    }

    private fun readHttp(url: String): String {
        val c = URL(url).openConnection() as HttpURLConnection
        c.connectTimeout = 700; c.readTimeout = 900; c.instanceFollowRedirects = false
        return try {
            if (c.responseCode != 200) throw java.io.IOException("No device response")
            c.inputStream.bufferedReader().use { it.readText().take(32768) }
        } finally { c.disconnect() }
    }

    /** Only a confirmed Samsung device JSON qualifies; an open port is insufficient. */
    fun verifySamsung(ip: String): String? = samsungDevice(ip)?.name
    fun probeKnown(ip: String, brand: String): Found? = try {
        when(brand){
            "samsung" -> samsungDevice(ip)
            "firetv" -> parseDescription(readHttp("http://$ip:60000/dd.xml"),ip)
            "android" -> {
                val xml=readHttp("http://$ip:8008/ssdp/device-desc.xml")
                val name=descriptionTag(xml,"friendlyName")
                if(name.isBlank())null else Found(ip,"android",name,name,descriptionTag(xml,"modelName"))
            }
            else -> null
        }
    } catch (_: Exception){null}
    private fun samsungDevice(ip: String): Found? = try {
        val body = readHttp("http://$ip:8001/api/v2/")
        if (!body.contains("\"device\"") || !body.contains("\"modelName\"")) null
        else {
            fun field(key: String) = Regex("\"$key\"\\s*:\\s*\"([^\"]{1,100})\"").find(body)?.groupValues?.get(1).orEmpty()
            val name=field("name").ifBlank { "Samsung TV" };val model=field("modelName")
            Found(ip,"samsung",name,name,model)
        }
    } catch (_: Exception) { null }
}
