package tv.appbridge.phase0.probe

import android.content.Context
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.media.ImageReader
import android.view.Display

/**
 * Owns one app-created virtual display backed by an [ImageReader] surface.
 *
 * No permission is required to create this; the security question Phase 0
 * answers is what content may be placed on it (own activities vs. other
 * apps' activities), which [LaunchProbe] tests empirically.
 */
class VirtualDisplaySession(private val context: Context) {

    var displayId: Int = Display.INVALID_DISPLAY
        private set
    var name: String = ""
        private set

    private var reader: ImageReader? = null
    private var vd: android.hardware.display.VirtualDisplay? = null

    fun isActive(): Boolean = vd != null

    fun start(
        width: Int = 1280,
        height: Int = 720,
        densityDpi: Int = 213
    ): String {
        stop()
        return try {
            name = "AppBridgeVD"
            val r = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
            r.setOnImageAvailableListener({ img ->
                // Drain frames so the producer never stalls; Phase 0 does not
                // process pixels (encoding is covered by EncodeProbe).
                img.acquireLatestImage()?.close()
            }, null)
            reader = r
            val dm = context.getSystemService(DisplayManager::class.java)
            // Phase 0 finding (API 33, empirical): VIRTUAL_DISPLAY_FLAG_PUBLIC
            // makes this a "screen sharing virtual display" and throws
            // SecurityException without a MediaProjection token.
            // OWN_CONTENT_ONLY is the only unprivileged creation mode; it is
            // then an open question what the system lets us PUT on it.
            val flags = DisplayManager.VIRTUAL_DISPLAY_FLAG_OWN_CONTENT_ONLY
            val display = dm.createVirtualDisplay(name, width, height, densityDpi, r.surface, flags)
            vd = display
            displayId = display.display.displayId
            ProbeLog.report(
                "probe" to "vd_create",
                "result" to "CREATED",
                "displayId" to displayId,
                "size" to "${width}x$height",
                "density" to densityDpi
            )
            "CREATED displayId=$displayId ${width}x$height dpi=$densityDpi"
        } catch (t: Throwable) {
            ProbeLog.error("vd_create", t)
            "FAILED: ${t.javaClass.simpleName}: ${t.message}"
        }
    }

    fun stop(): String {
        return try {
            vd?.release()
            vd = null
            reader?.close()
            reader = null
            val old = displayId
            displayId = Display.INVALID_DISPLAY
            if (old != Display.INVALID_DISPLAY) {
                ProbeLog.report("probe" to "vd_destroy", "result" to "RELEASED", "displayId" to old)
                "RELEASED displayId=$old"
            } else {
                "nothing to release"
            }
        } catch (t: Throwable) {
            ProbeLog.error("vd_destroy", t)
            "FAILED: ${t.message}"
        }
    }

    fun describeDisplays(): String {
        val dm = context.getSystemService(DisplayManager::class.java)
        val sb = StringBuilder()
        for (d in dm.displays) {
            val line = "display id=${d.displayId} name='${d.name}' " +
                "size=${d.mode.physicalWidth}x${d.mode.physicalHeight} " +
                "flags=${d.flags} rot=${d.rotation} state=${d.state}"
            sb.append(line).append('\n')
            ProbeLog.report("probe" to "displays", "result" to "ROW", "row" to line)
        }
        return sb.toString().ifEmpty { "(no displays reported)" }
    }
}
