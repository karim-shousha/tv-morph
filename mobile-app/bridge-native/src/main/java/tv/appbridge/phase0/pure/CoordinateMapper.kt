package tv.appbridge.phase0.pure

import kotlin.math.min

/**
 * Maps TV pointer coordinates to phone virtual-display coordinates.
 *
 * Pure Kotlin (no Android dependency) so it is unit-testable on the JVM.
 * Both spaces are described in pixels; mapping preserves aspect ratio with
 * letterboxing (fit-center), matching how the TV receiver will render the
 * 1280x720 phone stream inside its own viewport.
 */
object CoordinateMapper {

    data class Fit(val scale: Float, val offsetX: Float, val offsetY: Float)

    /** Fit-center transform that maps [srcW]x[srcH] into [dstW]x[dstH]. */
    fun fitCenter(srcW: Float, srcH: Float, dstW: Float, dstH: Float): Fit {
        require(srcW > 0 && srcH > 0 && dstW > 0 && dstH > 0)
        val scale = min(dstW / srcW, dstH / srcH)
        val offsetX = (dstW - srcW * scale) / 2f
        val offsetY = (dstH - srcH * scale) / 2f
        return Fit(scale, offsetX, offsetY)
    }

    /**
     * Convert a TV-space pointer (pixels in the TV viewport) into
     * virtual-display pixels. Returns null when the pointer falls in the
     * letterbox area (i.e. outside the streamed image).
     */
    fun tvToDisplay(
        tvX: Float, tvY: Float,
        tvW: Float, tvH: Float,
        dispW: Float, dispH: Float
    ): Pair<Float, Float>? {
        val fit = fitCenter(dispW, dispH, tvW, tvH)
        val dx = (tvX - fit.offsetX) / fit.scale
        val dy = (tvY - fit.offsetY) / fit.scale
        if (dx < 0 || dy < 0 || dx > dispW || dy > dispH) return null
        return dx to dy
    }

    /** Inverse of [tvToDisplay] (display pixels -> TV viewport pixels). */
    fun displayToTv(
        dx: Float, dy: Float,
        tvW: Float, tvH: Float,
        dispW: Float, dispH: Float
    ): Pair<Float, Float> {
        val fit = fitCenter(dispW, dispH, tvW, tvH)
        return (dx * fit.scale + fit.offsetX) to (dy * fit.scale + fit.offsetY)
    }
}
