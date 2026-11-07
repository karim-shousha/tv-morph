package tv.appbridge.phase0.probe

import android.content.Context
import android.view.MotionEvent

/**
 * Phase 0.5 secondary-display input probe (in-app side).
 *
 * Documents what a STOCK app can and cannot do:
 *  1. Reports whether MotionEvent.setDisplayId exists on this release
 *     (the API scrcpy-class tools use to aim injected events).
 *  2. Attempts injection through the hidden InputManager WITHOUT holding
 *     INJECT_EVENTS and records the denial. Never bypasses anything.
 *
 * Display-targeted injection that WORKS is the shell path
 * (`adb shell input -d <displayId> ...`), exercised from the host side in
 * tools/Run-Phase05-Probe.ps1 against TestActivity's key/touch logging.
 */
object SecondaryInputProbe {

    fun run(context: Context, displayId: Int) {
        // 1) setDisplayId availability (hidden on retail SDKs: verify).
        val setter = try {
            MotionEvent::class.java.getMethod(
                "setDisplayId", Int::class.javaPrimitiveType
            )
        } catch (t: Throwable) {
            null
        }
        ProbeLog.report(
            "probe" to "sinput_api", "result" to if (setter != null) "SET_DISPLAY_ID_PRESENT" else "ABSENT",
            "displayId" to displayId
        )

        // 2) Injection attempt without permission: must fail, and we log how.
        try {
            val cls = Class.forName("android.hardware.input.InputManager")
            val getInstance = cls.getDeclaredMethod("getInstance")
            @Suppress("JavaReflectionAccess")
            getInstance.isAccessible = true
            val mgr = getInstance.invoke(null)
            val inject = cls.methods.firstOrNull { it.name == "injectInputEvent" }
            if (inject == null) {
                ProbeLog.report("probe" to "sinput_inject", "result" to "METHOD_NOT_FOUND")
                return
            }
            val downTime = android.os.SystemClock.uptimeMillis()
            val ev = MotionEvent.obtain(downTime, downTime, MotionEvent.ACTION_DOWN, 640f, 360f, 0)
            try {
                if (setter == null) {
                    ProbeLog.report("probe" to "sinput_inject", "result" to "NO_SETTER_ABORT")
                    return
                }
                @Suppress("JavaReflectionAccess")
                setter.isAccessible = true
                setter.invoke(ev, displayId)
            } catch (t: Throwable) {
                ProbeLog.report("probe" to "sinput_inject", "result" to "SET_ID_FAILED",
                    "exc" to (t.javaClass.name + ": " + t.message))
                return
            }
            @Suppress("JavaReflectionAccess")
            inject.isAccessible = true
            val mode = 2 // INPUT_EVENT_INJECTION_MODE_ASYNC
            val rc = inject.invoke(mgr, ev, mode)
            // Reaching here without exception would be unexpected.
            ProbeLog.report("probe" to "sinput_inject", "result" to "UNEXPECTED_SUCCESS",
                "rc" to rc, "displayId" to displayId)
            ev.recycle()
        } catch (t: Throwable) {
            val cause = (t as? java.lang.reflect.InvocationTargetException)?.targetException ?: t
            ProbeLog.report("probe" to "sinput_inject", "result" to "DENIED_AS_EXPECTED",
                "exc" to (cause.javaClass.name + ": " + cause.message))
        }
    }
}
