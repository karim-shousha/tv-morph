package tv.appbridge.phase0.rt.pure

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class StreamPointerTest {

    @Test
    fun center_maps() {
        assertEquals(640 to 360, StreamPointer.toDisplayPixels(0.5f, 0.5f, 1280, 720))
    }

    @Test
    fun corners_map() {
        assertEquals(0 to 0, StreamPointer.toDisplayPixels(0f, 0f, 1280, 720))
        assertEquals(1279 to 719, StreamPointer.toDisplayPixels(1f, 1f, 1280, 720))
    }

    @Test
    fun outOfRange_rejected() {
        assertNull(StreamPointer.toDisplayPixels(-0.1f, 0.5f, 1280, 720))
        assertNull(StreamPointer.toDisplayPixels(0.5f, 1.1f, 1280, 720))
        assertNull(StreamPointer.toDisplayPixels(0.5f, 0.5f, 0, 720))
    }
}
