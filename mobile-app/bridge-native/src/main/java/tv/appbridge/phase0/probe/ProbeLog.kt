package tv.appbridge.phase0.probe

import android.util.Log

/**
 * Structured log reporter. Every probe result is emitted as ONE logcat line
 * with tag APPBRIDGE-PROBE in `key=value` form so results can be scraped
 * over adb without touching the UI:
 *
 *   adb logcat -s APPBRIDGE-PROBE
 */
object ProbeLog {
    const val TAG = "APPBRIDGE-PROBE"

    fun report(vararg kv: Pair<String, Any?>) {
        val line = kv.joinToString(" ") { (k, v) ->
            val s = v?.toString()?.replace("\n", "\\n") ?: "null"
            "$k=$s"
        }
        Log.i(TAG, line)
    }

    fun error(probe: String, t: Throwable) {
        report(
            "probe" to probe,
            "result" to "EXCEPTION",
            "exc" to (t.javaClass.name + ": " + t.message)
        )
        Log.e(TAG, "probe=$probe failed", t)
    }
}
