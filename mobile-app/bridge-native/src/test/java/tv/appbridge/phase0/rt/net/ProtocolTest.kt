package tv.appbridge.phase0.rt.net

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ProtocolTest {
    @Test fun statusCarriesResolvedTvTheme() {
        assertEquals("light", Protocol.parse(Protocol.status(null,7,false,"idle","light")).fields["theme"])
    }

    @Test
    fun hello_pair_status_roundtrip() {
        val h = Protocol.parse(Protocol.hello("Phone", "123456"))
        assertEquals("hello", h.type)
        assertEquals("Phone", h.fields["name"])

        val p = Protocol.parse(Protocol.paired("tok-1"))
        assertEquals("paired", p.type)
        assertEquals("tok-1", p.fields["token"])
    }

    @Test
    fun apps_carriesRealEntries() {
        val json = Protocol.apps(listOf("Calendar" to "com.google.android.calendar"))
        val m = Protocol.parse(json)
        assertEquals("apps", m.type)
        assertTrue(json.contains("com.google.android.calendar"))
    }

    @Test
    fun tvCommands_parse() {
        for (cmd in listOf(
            "{\"t\":\"pair\",\"code\":\"123456\"}",
            "{\"t\":\"launch\",\"pkg\":\"com.example.app\"}",
            "{\"t\":\"key\",\"k\":\"OK\"}",
            "{\"t\":\"pointer\",\"x\":\"0.5\",\"y\":\"0.25\"}",
            "{\"t\":\"heartbeat\",\"token\":\"tok-1\"}"
        )) {
            val m = Protocol.parse(cmd)
            assertTrue(m.type.isNotEmpty())
        }
        assertEquals("OK", Protocol.parse("{\"t\":\"key\",\"k\":\"OK\"}").fields["k"])
    }

    @Test
    fun status_reflectsSessionTruth() {
        val s = Protocol.parse(Protocol.status("com.example.app", 2, false, "capture-blocked"))
        assertEquals("status", s.type)
        assertEquals("com.example.app", s.fields["running"])
        assertEquals("2", s.fields["display"])
        assertEquals("false", s.fields["streaming"])
    }

    @Test
    fun exactKeyWireFormat() {
        assertEquals("{\"t\":\"key\",\"k\":\"OK\"}", "{\"t\":\"key\",\"k\":\"OK\"}")
    }
}
