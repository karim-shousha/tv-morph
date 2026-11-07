package tv.appbridge.phase0.rt.video

import org.junit.Assert.*
import org.junit.Test

class VideoSampleTimelineTest {
    private val picture = listOf(byteArrayOf(0x65))

    @Test fun variableFrameIntervalsHaveNoHolesOrOverlaps() {
        val timeline = VideoSampleTimeline()
        val times = listOf(0L, 3000L, 6010L, 24000L, 27000L, 270000L)
        val samples = times.mapNotNull { timeline.push(picture, it, it == 0L) }
        samples.forEachIndexed { i, sample ->
            assertEquals(times[i], sample.pts90)
            assertEquals(times[i + 1], sample.pts90 + sample.duration90)
        }
        assertTrue(samples.first().isIdr)
        assertFalse(samples.last().isIdr)
    }

    @Test fun codecResetDoesNotPublishOldPicture() {
        val timeline = VideoSampleTimeline()
        assertNull(timeline.push(picture, 100L, true))
        timeline.reset()
        assertNull(timeline.push(picture, 200L, true))
        assertEquals(200L, timeline.push(picture, 3200L, false)!!.pts90)
    }
}
