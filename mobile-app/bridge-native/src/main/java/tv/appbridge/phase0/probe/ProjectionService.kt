package tv.appbridge.phase0.probe

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.display.DisplayManager
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder

/**
 * Hosts MediaProjection capture inside a mediaProjection-type foreground
 * service, as required since Android 10 (Q) / tightened in 13+:
 * getMediaProjection() throws SecurityException without one.
 */
class ProjectionService : Service() {

    companion object {
        const val EXTRA_CODE = "code"
        const val EXTRA_DATA = "data"
        const val EXTRA_HOLD_MS = "hold_ms"
        const val EXTRA_STREAM = "stream"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val code = intent?.getIntExtra(EXTRA_CODE, 0) ?: 0
        val holdMs = intent?.getLongExtra(EXTRA_HOLD_MS, 4000L) ?: 4000L
        val data: Intent? = if (Build.VERSION.SDK_INT >= 33) {
            intent?.getParcelableExtra(EXTRA_DATA, Intent::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent?.getParcelableExtra(EXTRA_DATA)
        }
        if (data == null) {
            ProbeLog.report("probe" to "encode_fgs", "result" to "NO_DATA")
            stopSelf()
            return START_NOT_STICKY
        }
        try {
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(
                NotificationChannel("probe", "Probe", NotificationManager.IMPORTANCE_LOW)
            )
            val notif = Notification.Builder(this, "probe")
                .setContentTitle("AppBridge Phase0 capture probe")
                .setContentText("Encoding virtual display to H.264")
                .setSmallIcon(android.R.drawable.ic_menu_info_details)
                .build()
            startForeground(
                4601, notif,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            )
        } catch (t: Throwable) {
            ProbeLog.error("encode_fgs", t)
            stopSelf()
            return START_NOT_STICKY
        }
        Thread({
            if (intent?.getBooleanExtra(EXTRA_STREAM, false) == true) {
                runStream(code, data)
            } else {
                runEncode(code, data, holdMs)
            }
        }, "AppBridgeEncode").start()
        return START_NOT_STICKY
    }

    /**
     * Product streaming mode: the mediaProjection FGS (this service) owns
     * the token; MpStreamSource encodes the projection display into fMP4
     * for the TV. Blocks until SessionManager.stopStream().
     */
    private fun runStream(resultCode: Int, data: Intent) {
        var projection: android.media.projection.MediaProjection? = null
        try {
            val mpm = getSystemService(MediaProjectionManager::class.java)
            projection = mpm.getMediaProjection(resultCode, data)
            val src = tv.appbridge.phase0.rt.video.MpStreamSource(this)
            tv.appbridge.phase0.rt.session.SessionService.streamSource = src
            tv.appbridge.phase0.rt.session.SessionService.setVideoSource(src)
            ProbeLog.report("probe" to "stream_svc", "result" to "STARTED")
            src.runWithProjection(projection)
            projection = null // owned/released by the source now
            ProbeLog.report("probe" to "stream_svc", "result" to "ENDED")
        } catch (t: Throwable) {
            ProbeLog.error("stream_svc", t)
        } finally {
            try {
                tv.appbridge.phase0.rt.session.SessionService.setVideoSource(null)
            } catch (_: Throwable) {
            }
            try {
                tv.appbridge.phase0.rt.session.SessionService.streamSource = null
            } catch (_: Throwable) {
            }
            try { projection?.stop() } catch (_: Throwable) {}
            stopSelf()
        }
    }

    private fun runEncode(resultCode: Int, data: Intent, holdMs: Long) {
        var projection: android.media.projection.MediaProjection? = null
        var codec: MediaCodec? = null
        var vd: android.hardware.display.VirtualDisplay? = null
        try {
            val mpm = getSystemService(MediaProjectionManager::class.java)
            projection = mpm.getMediaProjection(resultCode, data)
            val format = MediaFormat.createVideoFormat(
                MediaFormat.MIMETYPE_VIDEO_AVC, EncodeProbe.WIDTH, EncodeProbe.HEIGHT
            ).apply {
                setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
                setInteger(MediaFormat.KEY_BIT_RATE, 4_000_000)
                setInteger(MediaFormat.KEY_FRAME_RATE, 30)
                setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1)
            }
            codec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC)
            codec.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            val surface = codec.createInputSurface()
            codec.start()
            vd = projection.createVirtualDisplay(
                "AppBridgeEncode", EncodeProbe.WIDTH, EncodeProbe.HEIGHT, 213,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_PUBLIC, surface, null, null
            )
            var frames = 0
            var sawFormat = false
            val bufInfo = MediaCodec.BufferInfo()
            val deadline = System.currentTimeMillis() + holdMs
            var lastReport = 0
            while (System.currentTimeMillis() < deadline && frames < 100000) {
                val idx = codec.dequeueOutputBuffer(bufInfo, 100_000)
                if (idx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                    sawFormat = true
                } else if (idx >= 0) {
                    if (bufInfo.size > 0) frames++
                    codec.releaseOutputBuffer(idx, false)
                }
                if (frames - lastReport >= 30) {
                    lastReport = frames
                    ProbeLog.report("probe" to "encode_h264", "result" to "PROGRESS",
                        "frames" to frames, "elapsed" to (System.currentTimeMillis() - (deadline - holdMs)))
                }
            }
            ProbeLog.report(
                "probe" to "encode_h264", "result" to if (frames > 0) "FRAMES_PRODUCED" else "NO_FRAMES",
                "frames" to frames, "formatSeen" to sawFormat,
                "width" to EncodeProbe.WIDTH, "height" to EncodeProbe.HEIGHT, "mime" to "video/avc"
            )
        } catch (t: Throwable) {
            ProbeLog.error("encode_h264", t)
        } finally {
            try { vd?.release() } catch (_: Throwable) {}
            try { codec?.stop(); codec?.release() } catch (_: Throwable) {}
            try { projection?.stop() } catch (_: Throwable) {}
            stopSelf()
        }
    }
}
