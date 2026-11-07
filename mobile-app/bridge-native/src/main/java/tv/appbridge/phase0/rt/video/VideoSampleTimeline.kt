package tv.appbridge.phase0.rt.video

/** One-frame lookahead: each picture lasts until the next picture's timestamp. */
class VideoSampleTimeline {
    private var pending: Fmp4Muxer.Sample? = null

    fun reset() { pending = null }

    fun push(units: List<ByteArray>, pts90: Long, key: Boolean): Fmp4Muxer.Sample? {
        val previous = pending
        pending = Fmp4Muxer.Sample(units, pts90, 0, key)
        if (previous == null || pts90 <= previous.pts90) return null
        val duration = pts90 - previous.pts90
        require(duration <= Int.MAX_VALUE) { "Video timestamp gap too large" }
        return previous.copy(duration90 = duration.toInt())
    }
}
