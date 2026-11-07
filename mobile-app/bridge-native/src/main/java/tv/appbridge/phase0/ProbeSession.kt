package tv.appbridge.phase0

import android.content.Context
import android.hardware.display.DisplayManager
import tv.appbridge.phase0.probe.ProbeLog
import tv.appbridge.phase0.probe.VirtualDisplaySession

/**
 * Process-wide holder so a virtual display survives across MainActivity
 * instances (each `am start --es probe ...` delivers to the same process
 * via launchMode=singleTop). Uses application context: no activity leaks.
 */
object ProbeSession {
    private var session: VirtualDisplaySession? = null
    var presentation: SecondaryPresentation? = null

    fun sessionOf(ctx: Context): VirtualDisplaySession {
        var s = session
        if (s == null) {
            s = VirtualDisplaySession(ctx.applicationContext)
            session = s
        }
        return s
    }

    fun showOverlay(ctx: Context): String {
        val s = session ?: return "no session"
        if (!s.isActive()) return "no virtual display"
        return try {
            presentation?.dismiss()
            val dm = ctx.applicationContext.getSystemService(DisplayManager::class.java)
            val d = dm.getDisplay(s.displayId)
                ?: return "display ${s.displayId} not visible to app"
            SecondaryPresentation(ctx.applicationContext, d).also {
                presentation = it
                it.show()
            }
            ProbeLog.report("probe" to "overlay", "result" to "SHOWN", "displayId" to s.displayId)
            "overlay shown on display ${s.displayId}"
        } catch (t: Throwable) {
            ProbeLog.error("overlay", t)
            "overlay FAILED: ${t.message}"
        }
    }

    fun release(ctx: Context): String {
        return try {
            presentation?.dismiss()
        } catch (_: Throwable) {
        } finally {
            presentation = null
        }.let { session?.stop() ?: "nothing to release" }
    }
}
