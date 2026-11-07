package tv.appbridge.phase0.rt.pure

/**
 * Pointer mapping for the TV->phone direction (pure Kotlin, JVM-tested).
 *
 * Contract: the TV renders the phone stream fit-center inside its viewport
 * and sends the pointer position NORMALIZED to the stream image itself
 * (0..1 in each axis, letterbox area excluded TV-side). The phone maps that
 * into physical pixels of the secondary display. Anything outside 0..1 is
 * rejected (returns null) — no clamping, no guessing.
 */
object StreamPointer {
    fun toDisplayPixels(nx: Float, ny: Float, dispW: Int, dispH: Int): Pair<Int, Int>? {
        if (nx < 0f || ny < 0f || nx > 1f || ny > 1f) return null
        if (dispW <= 0 || dispH <= 0) return null
        return (nx * dispW).toInt().coerceIn(0, dispW - 1) to
            (ny * dispH).toInt().coerceIn(0, dispH - 1)
    }
}
