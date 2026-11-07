package tv.appbridge.phase0.probe

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.media.ImageReader
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import java.io.File
import java.io.FileOutputStream

/**
 * Phase 0.5 capture-identification probe: captures MediaProjection frames
 * into PNG files so a human can see WHICH display MediaProjection actually
 * captures (primary display? secondary overlay? projection-owned mirror?).
 * This answers the "do not confuse MP-owned display with the ADB-created
 * secondary display" requirement with pixels, not assumptions.
 *
 * Files: <app-external-files>/mp_shot_<n>.png (no storage permission needed).
 */
class MpShotService : Service() {

    companion object {
        const val EXTRA_CODE = "code"
        const val EXTRA_DATA = "data"
        const val EXTRA_HOLD_MS = "hold_ms"
        const val EXTRA_FLAGS = "flags"
        const val EXTRA_PREFIX = "prefix"
        const val EXTRA_MAX = "max_shots"
        const val SHOTS = 3
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val code = intent?.getIntExtra(EXTRA_CODE, 0) ?: 0
        val data: Intent? = if (Build.VERSION.SDK_INT >= 33) {
            intent?.getParcelableExtra(EXTRA_DATA, Intent::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent?.getParcelableExtra(EXTRA_DATA)
        }
        if (data == null) {
            ProbeLog.report("probe" to "mp_shot", "result" to "NO_DATA")
            stopSelf()
            return START_NOT_STICKY
        }
        try {
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(
                NotificationChannel("probe", "Probe", NotificationManager.IMPORTANCE_LOW)
            )
            startForeground(
                4602,
                Notification.Builder(this, "probe")
                    .setContentTitle("AppBridge Phase0.5 capture probe")
                    .setContentText("Saving MediaProjection frames to PNG")
                    .setSmallIcon(android.R.drawable.ic_menu_info_details)
                    .build(),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            )
        } catch (t: Throwable) {
            ProbeLog.error("mp_shot", t)
            stopSelf()
            return START_NOT_STICKY
        }
        Thread({ runShot(code, data,
            intent?.getLongExtra(EXTRA_HOLD_MS, 8000L) ?: 8000L,
            intent?.getIntExtra(EXTRA_FLAGS,
                android.hardware.display.DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR)
                ?: android.hardware.display.DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            intent?.getStringExtra(EXTRA_PREFIX) ?: "mp_shot_",
            intent?.getIntExtra(EXTRA_MAX, 12) ?: 12
        ) }, "AppBridgeShot").start()
        return START_NOT_STICKY
    }

    private fun runShot(resultCode: Int, data: Intent, holdMs: Long, flags: Int, prefix: String, maxShots: Int) {
        var projection: android.media.projection.MediaProjection? = null
        var reader: ImageReader? = null
        var vd: android.hardware.display.VirtualDisplay? = null
        try {
            val mpm = getSystemService(MediaProjectionManager::class.java)
            projection = mpm.getMediaProjection(resultCode, data)
            reader = ImageReader.newInstance(1280, 720, PixelFormat.RGBA_8888, 2)
            vd = projection.createVirtualDisplay(
                "AppBridgeShot", 1280, 720, 213,
                flags,
                reader.surface, null, null
            )
            val dir = getExternalFilesDir(null) ?: filesDir
            var saved = 0
            val deadline = System.currentTimeMillis() + holdMs
            while (saved < maxShots && System.currentTimeMillis() < deadline) {
                val img = reader.acquireLatestImage()
                if (img == null) {
                    Thread.sleep(300)
                    continue
                }
                img.use {
                    val plane = it.planes[0]
                    val rowStride = plane.rowStride
                    val pixStride = plane.pixelStride
                    val w = it.width
                    val h = it.height
                    val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
                    plane.buffer.rewind()
                    if (rowStride == w * 4 && pixStride == 4) {
                        bmp.copyPixelsFromBuffer(plane.buffer)
                    } else {
                        // Generic path: read RGBA quads honoring strides.
                        val buf = plane.buffer
                        val px = IntArray(w)
                        for (y in 0 until h) {
                            for (x in 0 until w) {
                                val off = y * rowStride + x * pixStride
                                val r = buf.get(off).toInt() and 0xFF
                                val g = buf.get(off + 1).toInt() and 0xFF
                                val b = buf.get(off + 2).toInt() and 0xFF
                                val a = buf.get(off + 3).toInt() and 0xFF
                                px[x] = (a shl 24) or (r shl 16) or (g shl 8) or b
                            }
                            bmp.setPixels(px, 0, w, 0, y, w, 1)
                        }
                    }
                    val f = File(dir, "$prefix$saved.png")
                    FileOutputStream(f).use { out -> bmp.compress(Bitmap.CompressFormat.PNG, 100, out) }
                    bmp.recycle()
                    ProbeLog.report(
                        "probe" to "mp_shot", "result" to "SAVED",
                        "file" to f.absolutePath, "bytes" to f.length()
                    )
                    saved++
                }
            }
            if (saved == 0) {
                ProbeLog.report("probe" to "mp_shot", "result" to "NO_FRAMES")
            }
        } catch (t: Throwable) {
            ProbeLog.error("mp_shot", t)
        } finally {
            try { vd?.release() } catch (_: Throwable) {}
            try { reader?.close() } catch (_: Throwable) {}
            try { projection?.stop() } catch (_: Throwable) {}
            stopSelf()
        }
    }
}
