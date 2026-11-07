package tv.appbridge.phase0.rt.tv

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class TvDiscoveryTest {
    @Test fun returnsTheActualDeviceNameAndModel() {
        val samsung=TvDiscovery.parseDescription("<device><friendlyName>[TV] Samsung 7 Series (55)</friendlyName><manufacturer>Samsung Electronics</manufacturer><modelName>UN55RU7100FXZC</modelName></device>","10.0.0.153")
        assertEquals("[TV] Samsung 7 Series (55)",samsung?.name)
        assertEquals("UN55RU7100FXZC",samsung?.model)
        val fire=TvDiscovery.parseDescription("<device><friendlyName>Living Room Fire TV</friendlyName><manufacturer>HISENSE</manufacturer><modelName>43A4NF</modelName></device>","10.0.0.168")
        assertEquals("firetv",fire?.brand)
        assertEquals("Living Room Fire TV",fire?.name)
        val lg=TvDiscovery.parseDescription("<device><friendlyName>LG OLED &amp; Family</friendlyName><manufacturer>LG Electronics</manufacturer><modelName>OLED55</modelName></device>","10.0.0.169")
        assertEquals("lg",lg?.brand)
        assertEquals("LG OLED & Family",lg?.name)
        assertNull(TvDiscovery.parseDescription("<device><friendlyName>Basement TV</friendlyName><manufacturer>Google Inc.</manufacturer><modelName>Eureka Dongle</modelName></device>","10.0.0.161"))
    }
    @org.junit.Test fun recognizesAndroidBridgeReceiver() {
        val response = "HTTP/1.1 200 OK\r\nST: urn:morph-tv-com:device:BridgeReceiver:1\r\nSERVER: Android UPnP/1.0 MorphBridge/0.6.0\r\n\r\n"
        val found = TvDiscovery.parseResponse(response, "10.0.0.155")
        org.junit.Assert.assertEquals("android", found?.brand)
        org.junit.Assert.assertEquals("10.0.0.155", found?.ip)
    }

    @Test
    fun msearch_hasTargetAndMx() {
        val m = String(TvDiscovery.buildMSearch("urn:samsung.com:device:RemoteControlReceiver:1"))
        assertTrue(m.startsWith("M-SEARCH * HTTP/1.1"))
        assertTrue(m.contains("ST: urn:samsung.com:device:RemoteControlReceiver:1"))
        assertTrue(m.contains("239.255.255.250:1900"))
        assertTrue(m.contains("MAN: \"ssdp:discover\"\r\n"))
    }

    @Test
    fun parseSamsung_response() {
        val raw = "HTTP/1.1 200 OK\r\n" +
            "ST: urn:samsung.com:device:RemoteControlReceiver:1\r\n" +
            "LOCATION: http://192.168.1.50:9197/dmr\r\n" +
            "SERVER: SHP, Samsung TV, UPnP/1.0\r\n\r\n"
        val f = TvDiscovery.parseResponse(raw, "192.168.1.50")
        assertNotNull(f)
        assertEquals("192.168.1.50", f!!.ip)
        assertEquals("samsung", f.brand)
    }

    @Test
    fun parseLg_response() {
        val raw = "HTTP/1.1 200 OK\r\n" +
            "ST: urn:lge.com:service:webos-second-screen:1\r\n" +
            "LOCATION: http://192.168.1.51:3000/\r\n\r\n"
        val f = TvDiscovery.parseResponse(raw, "192.168.1.51")
        assertNotNull(f)
        assertEquals("lg", f!!.brand)
    }

    @Test
    fun parseNonTv_rejected() {
        val raw = "HTTP/1.1 200 OK\r\nST: urn:schemas-upnp-org:device:MediaRenderer:1\r\n\r\n"
        assertNull(TvDiscovery.parseResponse(raw, "192.168.1.60"))
        assertNull(TvDiscovery.parseResponse("garbage", "192.168.1.60"))
    }
    @Test fun choosesOnlyAnUnambiguousOrRememberedTv() {
        val first = TvDiscovery.Found("192.168.1.20", "android", "TV one")
        val second = TvDiscovery.Found("192.168.1.21", "android", "TV two")
        assertEquals(first, TvDiscovery.chooseCandidate(listOf(first), "192.168.0.99"))
        assertEquals(second, TvDiscovery.chooseCandidate(listOf(first, second), second.ip))
        assertNull(TvDiscovery.chooseCandidate(listOf(first, second), ""))
        assertNull(TvDiscovery.chooseCandidate(emptyList(), ""))
    }
}
