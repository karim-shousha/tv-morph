package tv.appbridge.phase0.pure

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertNotNull
import org.junit.Test

class CoordinateMapperTest {

    @Test
    fun fitCenter_sameAspect_fillsExactly() {
        val fit = CoordinateMapper.fitCenter(1280f, 720f, 1920f, 1080f)
        assertEquals(1.5f, fit.scale, 1e-5f)
        assertEquals(0f, fit.offsetX, 1e-5f)
        assertEquals(0f, fit.offsetY, 1e-5f)
    }

    @Test
    fun fitCenter_narrowDisplay_letterboxesSides() {
        // 720x1280 portrait stream inside a 1920x1080 TV viewport.
        val fit = CoordinateMapper.fitCenter(720f, 1280f, 1920f, 1080f)
        assertEquals(1080f / 1280f, fit.scale, 1e-5f)
        // Scaled width = 720 * scale = 607.5 -> side bars of (1920-607.5)/2.
        assertEquals((1920f - 720f * fit.scale) / 2f, fit.offsetX, 1e-3f)
        assertEquals(0f, fit.offsetY, 1e-5f)
    }

    @Test
    fun tvToDisplay_center_roundtrips() {
        val (dx, dy) = CoordinateMapper.tvToDisplay(
            960f, 540f, 1920f, 1080f, 1280f, 720f
        )!!
        assertEquals(640f, dx, 1e-3f)
        assertEquals(360f, dy, 1e-3f)
        val (tx, ty) = CoordinateMapper.displayToTv(dx, dy, 1920f, 1080f, 1280f, 720f)
        assertEquals(960f, tx, 1e-3f)
        assertEquals(540f, ty, 1e-3f)
    }

    @Test
    fun tvToDisplay_letterboxArea_returnsNull() {
        // Portrait stream on landscape TV: x=50 is inside the left bar.
        val fit = CoordinateMapper.fitCenter(720f, 1280f, 1920f, 1080f)
        assertNotNull(fit)
        val res = CoordinateMapper.tvToDisplay(50f, 540f, 1920f, 1080f, 720f, 1280f)
        assertNull("expected null for pointer inside letterbox bar, got $res", res)
    }

    @Test
    fun tvToDisplay_corners_mapExactly() {
        val (x0, y0) = CoordinateMapper.tvToDisplay(0f, 0f, 1920f, 1080f, 1280f, 720f)!!
        assertEquals(0f, x0, 1e-3f)
        assertEquals(0f, y0, 1e-3f)
        val (x1, y1) = CoordinateMapper.tvToDisplay(1920f, 1080f, 1920f, 1080f, 1280f, 720f)!!
        assertEquals(1280f, x1, 1e-3f)
        assertEquals(720f, y1, 1e-3f)
    }
}
