package tv.appbridge.phase0.pure

import org.junit.Assert.assertEquals
import org.junit.Assert.fail
import org.junit.Test

class ControlMessageTest {

    @Test
    fun key_roundtrips() {
        for (k in ControlMessage.KEYS) {
            val parsed = ControlMessage.parse(ControlMessage.key(k).toJson())
            assertEquals(ControlMessage.T_KEY, parsed.type)
            assertEquals(k, parsed.fields["k"])
        }
    }

    @Test
    fun key_rejectsUnknown() {
        try {
            ControlMessage.key("SELF_DESTRUCT")
            fail("expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            // expected
        }
    }

    @Test
    fun pointer_roundtrips() {
        val parsed = ControlMessage.parse(ControlMessage.pointer(0.5f, 0.25f).toJson())
        assertEquals(ControlMessage.T_POINTER, parsed.type)
        assertEquals("0.5", parsed.fields["x"])
        assertEquals("0.25", parsed.fields["y"])
    }

    @Test
    fun pointer_rejectsOutOfRange() {
        try {
            ControlMessage.pointer(1.5f, 0.5f)
            fail("expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            // expected
        }
    }

    @Test
    fun scroll_roundtrips() {
        val parsed = ControlMessage.parse(ControlMessage.scroll(0f, -120f).toJson())
        assertEquals(ControlMessage.T_SCROLL, parsed.type)
        assertEquals("-120.0", parsed.fields["dy"])
    }

    @Test
    fun exactWireFormat_keyOk() {
        assertEquals("{\"t\":\"key\",\"k\":\"OK\"}", ControlMessage.key("OK").toJson())
    }
}
