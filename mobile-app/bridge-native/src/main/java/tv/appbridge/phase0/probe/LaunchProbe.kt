package tv.appbridge.phase0.probe

import android.app.ActivityManager
import android.app.ActivityOptions
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import tv.appbridge.phase0.TestActivity

/**
 * Attempts real activity launches on a target display.
 *
 * There is NO public pre-flight API for "may app X start on display Y" -
 * [preflightInfo] says so explicitly after a reflective lookup - therefore
 * the empirical startActivity attempt (plus external `dumpsys activity`
 * verification) is the ground truth. Any exception is reported verbatim;
 * nothing is relabeled as success.
 */
object LaunchProbe {

    fun preflightInfo(): String {
        // Known internal enforcement point (not SDK): ActivityTaskManagerService
        // internal check. Confirm there is no public equivalent.
        val candidates = listOf(
            "android.app.ActivityManager#isActivityStartAllowedOnDisplay",
            "android.view.Display#isActivityStartAllowedOnDisplay",
            "android.app.ActivityOptions#isActivityStartAllowedOnDisplay"
        )
        val found = candidates.filter { cand ->
            try {
                val (cls, m) = cand.split("#")
                Class.forName(cls).methods.any { it.name == m }
            } catch (t: Throwable) {
                false
            }
        }
        val msg = if (found.isEmpty()) {
            "no public preflight API on this device; empirical launch is ground truth"
        } else {
            "unexpected public API present: $found"
        }
        ProbeLog.report("probe" to "preflight", "result" to "INFO", "detail" to msg)
        return msg
    }

    /**
     * If the public ActivityManager.isActivityStartAllowedOnDisplay exists,
     * log its exact signature and invoke it for the given target. All
     * reflection failures are reported, never thrown.
     */
    fun preflightVerdict(context: Context, displayId: Int, intent: Intent, tag: String) {
        try {
            val cls = Class.forName("android.app.ActivityManager")
            val methods = cls.methods.filter { it.name == "isActivityStartAllowedOnDisplay" }
            if (methods.isEmpty()) {
                ProbeLog.report("probe" to "preflight_call", "result" to "ABSENT", "tag" to tag)
                return
            }
            val am = context.getSystemService(ActivityManager::class.java)
            for (m in methods) {
                val sig = m.toString()
                ProbeLog.report("probe" to "preflight_sig", "result" to "INFO", "tag" to tag, "sig" to sig)
                try {
                    val params = m.parameterTypes
                    val args: Array<Any?>? = when {
                        params.size == 3 &&
                            params[0].isAssignableFrom(Context::class.java) &&
                            params[1] == Int::class.javaPrimitiveType &&
                            params[2].isAssignableFrom(Intent::class.java) ->
                            arrayOf(context, displayId, intent)
                        else -> null
                    }
                    if (args == null) {
                        ProbeLog.report("probe" to "preflight_call", "result" to "SKIPPED_SIG",
                            "tag" to tag, "sig" to sig)
                        continue
                    }
                    val target = if (java.lang.reflect.Modifier.isStatic(m.modifiers)) null else am
                    val verdict = m.invoke(target, *args)
                    ProbeLog.report("probe" to "preflight_call", "result" to "VERDICT",
                        "tag" to tag, "displayId" to displayId,
                        "allowed" to verdict, "sig" to sig)
                } catch (t: Throwable) {
                    ProbeLog.report("probe" to "preflight_call", "result" to "INVOKE_FAILED",
                        "tag" to tag, "exc" to (t.javaClass.name + ": " + t.message))
                }
            }
        } catch (t: Throwable) {
            ProbeLog.error("preflight_call", t)
        }
    }

    fun launchOwn(context: Context, displayId: Int): String {
        return try {
            val opts = ActivityOptions.makeBasic().setLaunchDisplayId(displayId)
            val intent = Intent(context, TestActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_MULTIPLE_TASK)
                putExtra(TestActivity.EXTRA_EXPECTED_DISPLAY, displayId)
            }
            context.startActivity(intent, opts.toBundle())
            ProbeLog.report(
                "probe" to "launch_own", "result" to "START_NO_EXCEPTION",
                "displayId" to displayId,
                "note" to "verify placement with dumpsys/TestActivity"
            )
            "startActivity returned without exception (placement must be verified via dumpsys)"
        } catch (t: Throwable) {
            ProbeLog.error("launch_own", t)
            "FAILED: ${t.javaClass.simpleName}: ${t.message}"
        }
    }

    data class AppEntry(val label: String, val packageName: String) {
        override fun toString(): String = "$label ($packageName)"
    }

    fun listLaunchable(pm: PackageManager, limit: Int = 60): List<AppEntry> {
        val main = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val out = if (Build.VERSION.SDK_INT >= 33) {
            pm.queryIntentActivities(main, PackageManager.ResolveInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            pm.queryIntentActivities(main, 0)
        }.map {
            AppEntry(
                it.loadLabel(pm).toString(),
                it.activityInfo.packageName
            )
        }.sortedBy { it.label.lowercase() }
        ProbeLog.report(
            "probe" to "app_list", "result" to "OK",
            "count" to out.size,
            "sample" to out.take(10).joinToString("|") { it.packageName }
        )
        return out.take(limit)
    }

    fun launchThirdParty(context: Context, pm: PackageManager, packageName: String, displayId: Int): String {
        return try {
            val base = pm.getLaunchIntentForPackage(packageName)
                ?: run {
                    ProbeLog.report(
                        "probe" to "launch_3p", "result" to "NO_LAUNCH_INTENT",
                        "package" to packageName, "displayId" to displayId
                    )
                    return "NO_LAUNCH_INTENT for $packageName"
                }
            base.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_MULTIPLE_TASK)
            val opts = ActivityOptions.makeBasic().setLaunchDisplayId(displayId)
            context.startActivity(base, opts.toBundle())
            ProbeLog.report(
                "probe" to "launch_3p", "result" to "START_NO_EXCEPTION",
                "package" to packageName, "displayId" to displayId,
                "note" to "verify placement with dumpsys; system may reroute to default display"
            )
            "startActivity returned without exception for $packageName " +
                "(placement must be verified via dumpsys - Android may reroute)"
        } catch (t: Throwable) {
            ProbeLog.error("launch_3p", t)
            "FAILED: ${t.javaClass.simpleName}: ${t.message}"
        }
    }
}
