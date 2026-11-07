package tv.appbridge.phase0.probe

import android.app.Activity
import android.content.Intent
import android.media.projection.MediaProjectionManager

/**
 * Probe #6: with EXPLICIT user consent (system screen-capture dialog),
 * capture a display into a hardware H.264 encoder and count produced frames.
 *
 * Flow: [requestConsent] -> system dialog -> caller forwards the result to
 * [onConsentResult] -> [ProjectionService] (a mediaProjection-type foreground
 * service, mandatory for getMediaProjection() on modern Android) does the
 * encoder + virtual display work and reports frame counts to logcat.
 */
class EncodeProbe(private val activity: Activity) {

    companion object {
        const val RC_CAPTURE = 4601
        const val WIDTH = 1280
        const val HEIGHT = 720
    }

    fun requestConsent(): String {
        return try {
            val mpm = activity.getSystemService(MediaProjectionManager::class.java)
            activity.startActivityForResult(mpm.createScreenCaptureIntent(), RC_CAPTURE)
            ProbeLog.report("probe" to "encode_consent", "result" to "DIALOG_SHOWN")
            "system consent dialog shown - accept or deny it on the device"
        } catch (t: Throwable) {
            ProbeLog.error("encode_consent", t)
            "FAILED: ${t.message}"
        }
    }

    fun onConsentResult(resultCode: Int, data: Intent?, done: (String) -> Unit, holdMs: Long = 4000L) {
        if (resultCode != Activity.RESULT_OK || data == null) {
            ProbeLog.report("probe" to "encode_consent", "result" to "DENIED_BY_USER")
            done("consent DENIED by user (resultCode=$resultCode) - capture correctly gated")
            return
        }
        // Since Android 10/13 getMediaProjection() requires a
        // mediaProjection-type foreground service: hand off to one.
        try {
            val svc = Intent(activity, ProjectionService::class.java).apply {
                putExtra(ProjectionService.EXTRA_CODE, resultCode)
                putExtra(ProjectionService.EXTRA_DATA, data)
                putExtra(ProjectionService.EXTRA_HOLD_MS, holdMs)
            }
            activity.startForegroundService(svc)
            ProbeLog.report("probe" to "encode_fgs", "result" to "SERVICE_STARTED")
            done("consent granted - capture running in foreground service, see logcat")
        } catch (t: Throwable) {
            ProbeLog.error("encode_fgs", t)
            done("FAILED to start capture service: ${t.message}")
        }
    }
}
