package tv.appbridge.phase0.probe

import android.content.Context
import android.content.pm.PackageManager

/**
 * Investigates whether standard (non-privileged) APIs can deliver input to
 * the secondary display.
 *
 * Expected outcome on a stock app: INJECT_EVENTS is a signature-level
 * permission (denied), and the hidden InputManager.injectInputEvent path is
 * unreachable. This probe DOCUMENTS the denial instead of working around it.
 * The viable unprivileged path - drawing a TV-driven pointer inside content
 * shown on the secondary display (see SecondaryPresentation) - needs no
 * permission and is demonstrated separately.
 */
object InputProbe {

    fun run(context: Context): String {
        val sb = StringBuilder()

        // 1) INJECT_EVENTS permission state for this (non-platform) app.
        val pm = context.packageManager
        val granted = try {
            // NOTE: android.permission.INJECT_EVENTS is a signature-level
            // permission with no public Manifest.permission constant, hence
            // the literal.
            pm.checkPermission(
                "android.permission.INJECT_EVENTS",
                context.packageName
            ) == PackageManager.PERMISSION_GRANTED
        } catch (t: Throwable) {
            sb.append("checkPermission threw: ${t.message}\n")
            false
        }
        sb.append("INJECT_EVENTS granted=${granted} (expected false for standard apps)\n")
        ProbeLog.report("probe" to "input_perm", "result" to if (granted) "GRANTED_UNEXPECTED" else "DENIED_EXPECTED")

        // 2) Hidden InputManager.injectInputEvent reachability.
        try {
            val cls = Class.forName("android.hardware.input.InputManager")
            val getInstance = cls.getDeclaredMethod("getInstance")
            val inject = cls.methods.firstOrNull { it.name == "injectInputEvent" }
            if (inject == null) {
                sb.append("hidden injectInputEvent method: NOT FOUND\n")
                ProbeLog.report("probe" to "input_inject", "result" to "METHOD_NOT_FOUND")
            } else {
                @Suppress("JavaReflectionMemberAccess")
                getInstance.isAccessible = true
                val mgr = getInstance.invoke(null)
                @Suppress("JavaReflectionMemberAccess")
                inject.isAccessible = true
                sb.append("hidden injectInputEvent: reachable via reflection " +
                    "(invocation NOT attempted - would require INJECT_EVENTS)\n")
                ProbeLog.report(
                    "probe" to "input_inject", "result" to "REFLECTIVELY_VISIBLE",
                    "manager" to (mgr != null),
                    "note" to "invocation not attempted without permission"
                )
            }
        } catch (t: Throwable) {
            sb.append("hidden injectInputEvent: BLOCKED (${t.javaClass.simpleName}: ${t.message})\n")
            ProbeLog.error("input_inject", t)
        }

        // 3) Unprivileged alternative.
        sb.append("Unprivileged path: TV-driven pointer overlay inside secondary-display " +
            "content (Presentation) - no permission required; see Probe #2 overlay.\n")
        ProbeLog.report("probe" to "input_overlay", "result" to "AVAILABLE_BY_DESIGN")
        return sb.toString()
    }
}
