package tv.appbridge.phase0.rt.video

import android.hardware.display.DisplayManager
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.projection.MediaProjectionManager
import tv.appbridge.phase0.rt.net.HttpVideoServer
import tv.appbridge.phase0.probe.ProbeLog
import java.nio.ByteBuffer

/**
 * Real video source for the TV pipeline: MediaProjection display (PUBLIC,
 * app-owned, consent + mediaProjection FGS) -> hardware H.264 encoder ->
 * fMP4 fragments -> HTTP chunked stream.
 *
 * Proven pixel path (Phase "capture" investigation): activities placed on
 * the projection display BY A PRIVILEGED HELPER (am --display via Shizuku
 * backend or PC script) render INTO this encoder. Standard-mode placement
 * remains denied — the source reports that boundary, it does not bypass it.
 */
class MpStreamSource(private val context: android.content.Context) : RuntimeVideoSource {

    override val width = 1280
    override val height = 720

    @Volatile private var running = false
    @Volatile override var displayId: Int = android.view.Display.INVALID_DISPLAY
        private set
    private var worker: Thread? = null

    fun start(projection: android.media.projection.MediaProjection) {
        if (running) return
        running = true
        worker = Thread({ runWithProjection(projection) }, "AppBridgeStream").apply { isDaemon = true; start() }
    }

    override fun stop() {
        running = false
        try {
            worker?.join(3000)
        } catch (_: Throwable) {
        }
        worker = null
    }

    override val isRunning: Boolean get() = running

    fun runWithProjection(projection: android.media.projection.MediaProjection) {
        running = true
        var codec: MediaCodec? = null
        var vd: android.hardware.display.VirtualDisplay? = null
        var frames = 0
        var inited = false
        var seq = 1
        var prevPts = -1L
        val callback = object : android.media.projection.MediaProjection.Callback() {
            override fun onStop() { running = false }
        }
        projection.registerCallback(callback, android.os.Handler(android.os.Looper.getMainLooper()))
        try {
            val format = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, width, height).apply {
                setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
                setInteger(MediaFormat.KEY_BIT_RATE, 4_000_000)
                setInteger(MediaFormat.KEY_FRAME_RATE, 30)
                setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1)
                setInteger(MediaFormat.KEY_PROFILE, MediaCodecInfo.CodecProfileLevel.AVCProfileBaseline)
                setInteger(MediaFormat.KEY_LEVEL, MediaCodecInfo.CodecProfileLevel.AVCLevel31)
            }
            codec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC)
            codec.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            val surface = codec.createInputSurface()
            codec.start()
            vd = projection.createVirtualDisplay(
                "AppBridgeStream", width, height, 213,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_PUBLIC or DisplayManager.VIRTUAL_DISPLAY_FLAG_OWN_CONTENT_ONLY,
                surface, null, null
            )
            displayId = vd.display.displayId
            tv.appbridge.phase0.rt.session.SessionService.manager?.adoptDisplay(displayId)
            ProbeLog.report("probe" to "stream_src", "result" to "STARTED")
            val bufInfo = MediaCodec.BufferInfo()
            var sps: ByteArray? = null
            var pps: ByteArray? = null
            while (running) {
                val idx = codec.dequeueOutputBuffer(bufInfo, 200_000)
                when {
                    idx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                        val of = codec.outputFormat
                        sps = csd(of, "csd-0")
                        pps = csd(of, "csd-1")
                        if (sps != null && pps != null && !inited) {
                            inited = true
                            val initBytes = Fmp4Muxer.initSegment(sps!!, pps!!, width, height)
                            cachedInit = initBytes
                            onInitCb?.invoke(initBytes)
                            ProbeLog.report("probe" to "stream_src", "result" to "INIT_SENT")
                        }
                    }
                    idx >= 0 -> {
                        if (bufInfo.size > 0 &&
                            (bufInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) == 0 &&
                            inited
                        ) {
                            val out = ByteArray(bufInfo.size)
                            codec.getOutputBuffer(idx)?.apply {
                                position(bufInfo.offset)
                                limit(bufInfo.offset + bufInfo.size)
                                get(out)
                            }
                            val pts90 = bufInfo.presentationTimeUs * 90L / 1000L
                            val dur = if (prevPts < 0) 3000 else (pts90 - prevPts).toInt().coerceIn(500, 9000)
                            val units = Fmp4Muxer.splitAnnexB(out)
                            val isIdr = units.any { it.isNotEmpty() && it[0].toInt() and 0x1F == 5 }
                            val withParam = if (isIdr) listOf(sps!!, pps!!) + units else units
                            val frag = Fmp4Muxer.fragment(
                                seq++, Fmp4Muxer.Sample(withParam, pts90, dur, isIdr))
                            onFragCb?.invoke(frag)
                            frames++
                            prevPts = pts90
                            if (frames % 30 == 0) {
                                ProbeLog.report("probe" to "stream_src", "result" to "PROGRESS",
                                    "frames" to frames)
                            }
                        }
                        codec.releaseOutputBuffer(idx, false)
                    }
                }
            }
            ProbeLog.report("probe" to "stream_src", "result" to "STOPPED", "frames" to frames)
        } catch (t: Throwable) {
            ProbeLog.error("stream_src", t)
        } finally {
            displayId = android.view.Display.INVALID_DISPLAY
            projection.unregisterCallback(callback)
            try { vd?.release() } catch (_: Throwable) {}
            try { codec?.stop(); codec?.release() } catch (_: Throwable) {}
            try { projection?.stop() } catch (_: Throwable) {}
            running = false
        }
    }

    @Volatile private var onInitCb: ((ByteArray) -> Unit)? = null
    @Volatile private var onFragCb: ((ByteArray) -> Unit)? = null
    @Volatile private var cachedInit: ByteArray? = null

    override fun run(init: (ByteArray) -> Unit, frag: (ByteArray) -> Unit, stop: () -> Boolean) {
        // Late joiners need the init segment first or nothing is playable.
        try {
            cachedInit?.let { init(it) }
        } catch (_: Throwable) {
        }
        onInitCb = init
        onFragCb = frag
        try {
            while (running && !stop()) {
                Thread.sleep(200)
            }
        } catch (_: Throwable) {
        } finally {
            onInitCb = null
            onFragCb = null
        }
    }

    private fun csd(format: MediaFormat, key: String): ByteArray? {
        return try {
            val bb: ByteBuffer = format.getByteBuffer(key) ?: return null
            val b = ByteArray(bb.remaining())
            bb.get(b)
            b
        } catch (_: Throwable) {
            null
        }
    }
}
