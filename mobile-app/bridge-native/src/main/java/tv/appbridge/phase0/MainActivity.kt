package tv.appbridge.phase0

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ListView
import android.widget.ScrollView
import android.widget.TextView
import tv.appbridge.phase0.probe.EncodeProbe
import tv.appbridge.phase0.probe.InputProbe
import tv.appbridge.phase0.probe.LaunchProbe
import tv.appbridge.phase0.probe.ProbeLog

/**
 * Phase 0 experiment console.
 *
 * Two equivalent drivers:
 *  1. On-screen buttons (manual testing on a physical phone).
 *  2. `adb shell am start -n .../.MainActivity --es probe <name> [--es pkg <package>]`
 *     (scripted testing; launchMode=singleTop keeps one instance / one process
 *     so the virtual display survives between steps).
 *
 * The UI is STATIC after onCreate: probe results go only to logcat
 * (tag APPBRIDGE-PROBE). Rationale: this emulator image crashes in
 * hardware-accelerated text shaping (Paint.getRunAdvance) when a TextView
 * redraws with changed text, which would kill the process under test.
 */
class MainActivity : Activity() {

    companion object {
        const val RC_SHOT = 4602
        const val RC_HOLD = 4603
        const val RC_SHOTHOLD = 4604
        const val RC_STREAM = 4606
        const val EXTRA_PROBE = "probe"
        const val EXTRA_PKG = "pkg"
        const val P_DUMP = "dump"
        const val P_CREATE = "create"
        const val P_OWN = "own"
        const val P_THIRDP = "thirdp"
        const val P_INPUT = "input"
        const val P_ALL = "all"
        const val P_RELEASE = "release"
        const val P_PINGGO = "pinggo"
        const val P_ENCODE = "encode"
        const val P_ENCODE_HOLD = "encode_hold"
        const val P_MPSHOT = "mp_shot"
        const val P_SHOTHOLD = "shot_hold"
        const val P_STREAM = "stream"
        const val P_STOPSTREAM = "stopstream"
        const val P_SINPUT = "sinput"
    }

    private lateinit var encodeProbe: EncodeProbe
    private var apps: List<LaunchProbe.AppEntry> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        encodeProbe = EncodeProbe(this)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 24, 24, 24)
        }
        root.addView(TextView(this).apply {
            text = "AppBridge TV - Phase 0 probes (build v5-static)"
            textSize = 22f
        })
        root.addView(TextView(this).apply {
            text = "Results go to logcat (tag APPBRIDGE-PROBE). " +
                "Drive manually here or via adb --es probe <dump|create|own|thirdp|input|all|release>."
            textSize = 14f
        })

        fun btn(label: String, probe: String): Button =
            Button(this).apply {
                text = label
                setOnClickListener { runProbe(probe, null) }
            }

        root.addView(btn("1. Dump displays", P_DUMP))
        root.addView(btn("2. Create virtual display 1280x720", P_CREATE))
        root.addView(btn("3. Launch OWN activity on virtual display", P_OWN))
        root.addView(btn("4. Launch 3rd-party package on virtual display", P_THIRDP))
        root.addView(btn("5. Input-injection probe", P_INPUT))
        root.addView(btn("6. MediaProjection + H.264 consent probe", P_ENCODE))
        root.addView(btn("RUN ALL (1,2,3,5)", P_ALL))
        root.addView(btn("Release virtual display", P_RELEASE))

        root.addView(TextView(this).apply {
            text = "Launchable apps (tap = attempt launch on virtual display):"
            textSize = 14f
        })
        val list = ListView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 700
            )
        }
        refreshApps(list)
        root.addView(list)

        val page = ScrollView(this).apply { addView(root) }
        setContentView(page)

        intent.getStringExtra(EXTRA_PROBE)?.let { runProbe(it, intent.getStringExtra(EXTRA_PKG)) }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent.getStringExtra(EXTRA_PROBE)?.let { runProbe(it, intent.getStringExtra(EXTRA_PKG)) }
    }

    private fun refreshApps(list: ListView) {
        try {
            apps = LaunchProbe.listLaunchable(packageManager)
            list.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, apps)
            list.setOnItemClickListener { _, _, pos, _ ->
                val id = ProbeSession.sessionOf(this).displayId
                if (id < 0) {
                    ProbeLog.report("probe" to "tap_launch", "result" to "NO_DISPLAY")
                    return@setOnItemClickListener
                }
                LaunchProbe.launchThirdParty(this, packageManager, apps[pos].packageName, id)
            }
        } catch (t: Throwable) {
            ProbeLog.error("app_list", t)
        }
    }

    /** Entry point for buttons AND adb-driven probes. No UI mutation. */
    fun runProbe(name: String, pkg: String?) {
        ProbeLog.report("probe" to "dispatch", "result" to "RUN", "name" to name)
        val s = ProbeSession.sessionOf(this)
        when (name) {
            P_DUMP -> s.describeDisplays()
            P_CREATE -> {
                s.start()
                ProbeSession.showOverlay(this)
            }
            P_OWN -> {
                if (s.displayId < 0) {
                    ProbeLog.report("probe" to "launch_own", "result" to "NO_DISPLAY")
                } else {
                    LaunchProbe.preflightInfo()
                    val probe = android.content.Intent(this, TestActivity::class.java)
                    LaunchProbe.preflightVerdict(this, s.displayId, probe, "own")
                    LaunchProbe.launchOwn(this, s.displayId)
                }
            }
            P_THIRDP -> {
                if (s.displayId < 0) {
                    ProbeLog.report("probe" to "launch_3p", "result" to "NO_DISPLAY")
                } else {
                    val target = pkg
                        ?: apps.firstOrNull { it.packageName != packageName }?.packageName
                        ?: "com.android.settings"
                    ProbeLog.report("probe" to "launch_3p_target", "result" to "INFO", "package" to target)
                    val base = packageManager.getLaunchIntentForPackage(target)
                    if (base != null) {
                        LaunchProbe.preflightVerdict(this, s.displayId, base, "thirdp:$target")
                    }
                    LaunchProbe.launchThirdParty(this, packageManager, target, s.displayId)
                }
            }
            P_INPUT -> InputProbe.run(this)
            P_ENCODE -> encodeProbe.requestConsent()
            P_ENCODE_HOLD -> requestEncodeHold()
            P_MPSHOT -> requestShotConsent()
            P_SHOTHOLD -> requestShotHold()
            P_STREAM -> requestStreamProbe()
            P_STOPSTREAM -> {
                tv.appbridge.phase0.rt.session.SessionService.manager?.stopStream()
                ProbeLog.report("probe" to "stream_probe", "result" to "STOPPED")
            }
            P_SINPUT -> {
                val id = ProbeSession.sessionOf(this).displayId
                tv.appbridge.phase0.probe.SecondaryInputProbe.run(this, id)
            }
            P_ALL -> {
                s.describeDisplays()
                s.start()
                ProbeSession.showOverlay(this)
                LaunchProbe.preflightInfo()
                if (s.displayId >= 0) LaunchProbe.launchOwn(this, s.displayId)
                InputProbe.run(this)
            }
            P_RELEASE -> ProbeSession.release(this)
            P_PINGGO -> {
                try {
                    startActivity(Intent(this, Ping2Activity::class.java))
                    ProbeLog.report("probe" to "pinggo", "result" to "STARTED")
                } catch (t: Throwable) {
                    ProbeLog.error("pinggo", t)
                }
            }
            else -> ProbeLog.report("probe" to "dispatch", "result" to "UNKNOWN", "name" to name)
        }
    }

    @Deprecated("Used deliberately: no AndroidX in Phase 0")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == EncodeProbe.RC_CAPTURE) {
            encodeProbe.onConsentResult(resultCode, data, done = { msg ->
                ProbeLog.report("probe" to "encode_done", "result" to "INFO", "msg" to msg.take(300))
            })
        } else if (requestCode == RC_SHOT) {
            if (resultCode != Activity.RESULT_OK || data == null) {
                ProbeLog.report("probe" to "mp_shot", "result" to "DENIED_BY_USER")
            } else {
                try {
                    val svc = Intent(this, tv.appbridge.phase0.probe.MpShotService::class.java).apply {
                        putExtra(tv.appbridge.phase0.probe.MpShotService.EXTRA_CODE, resultCode)
                        putExtra(tv.appbridge.phase0.probe.MpShotService.EXTRA_DATA, data)
                    }
                    startForegroundService(svc)
                    ProbeLog.report("probe" to "mp_shot", "result" to "SERVICE_STARTED")
                } catch (t: Throwable) {
                    ProbeLog.error("mp_shot", t)
                }
            }
        } else if (requestCode == RC_HOLD) {
            val done: (String) -> Unit = { msg ->
                ProbeLog.report("probe" to "encode_done", "result" to "INFO", "msg" to msg.take(300))
            }
            encodeProbe.onConsentResult(resultCode, data, done, 60000L)
        } else if (requestCode == RC_SHOTHOLD) {
            if (resultCode != Activity.RESULT_OK || data == null) {
                ProbeLog.report("probe" to "mp_shot_hold", "result" to "DENIED_BY_USER")
            } else {
                try {
                    val svc = Intent(this, tv.appbridge.phase0.probe.MpShotService::class.java).apply {
                        putExtra(tv.appbridge.phase0.probe.MpShotService.EXTRA_CODE, resultCode)
                        putExtra(tv.appbridge.phase0.probe.MpShotService.EXTRA_DATA, data)
                        putExtra(tv.appbridge.phase0.probe.MpShotService.EXTRA_HOLD_MS, 60000L)
                        putExtra(tv.appbridge.phase0.probe.MpShotService.EXTRA_FLAGS,
                            android.hardware.display.DisplayManager.VIRTUAL_DISPLAY_FLAG_PUBLIC)
                        putExtra(tv.appbridge.phase0.probe.MpShotService.EXTRA_PREFIX, "a1_")
                        putExtra(tv.appbridge.phase0.probe.MpShotService.EXTRA_MAX, 60)
                    }
                    startForegroundService(svc)
                    ProbeLog.report("probe" to "mp_shot_hold", "result" to "SERVICE_STARTED")
                } catch (t: Throwable) {
                    ProbeLog.error("mp_shot_hold", t)
                }
            }
        } else if (requestCode == RC_STREAM) {
            if (resultCode != Activity.RESULT_OK || data == null) {
                ProbeLog.report("probe" to "stream_probe", "result" to "DENIED_BY_USER")
            } else {
                Thread({
                    val m = tv.appbridge.phase0.rt.session.SessionService.ensure(this)
                    try {
                        startService(Intent(this,
                            tv.appbridge.phase0.rt.session.SessionService::class.java))
                    } catch (t: Throwable) {
                        ProbeLog.error("stream_probe_svc", t)
                    }
                    m.startStream(resultCode, data)
                    ProbeLog.report("probe" to "stream_probe", "result" to "START_CALLED")
                }).start()
            }
        }
    }

    private fun requestShotConsent() {
        try {
            val mpm = getSystemService(android.media.projection.MediaProjectionManager::class.java)
            startActivityForResult(mpm.createScreenCaptureIntent(), RC_SHOT)
            ProbeLog.report("probe" to "mp_shot", "result" to "DIALOG_SHOWN")
        } catch (t: Throwable) {
            ProbeLog.error("mp_shot", t)
        }
    }

    private fun requestEncodeHold() {
        try {
            val mpm = getSystemService(android.media.projection.MediaProjectionManager::class.java)
            startActivityForResult(mpm.createScreenCaptureIntent(), RC_HOLD)
            ProbeLog.report("probe" to "encode_hold", "result" to "DIALOG_SHOWN")
        } catch (t: Throwable) {
            ProbeLog.error("encode_hold", t)
        }
    }

    private fun requestShotHold() {
        try {
            val mpm = getSystemService(android.media.projection.MediaProjectionManager::class.java)
            startActivityForResult(mpm.createScreenCaptureIntent(), RC_SHOTHOLD)
            ProbeLog.report("probe" to "mp_shot_hold", "result" to "DIALOG_SHOWN")
        } catch (t: Throwable) {
            ProbeLog.error("mp_shot_hold", t)
        }
    }

    private fun requestStreamProbe() {
        try {
            val mpm = getSystemService(android.media.projection.MediaProjectionManager::class.java)
            startActivityForResult(mpm.createScreenCaptureIntent(), RC_STREAM)
            ProbeLog.report("probe" to "stream_probe", "result" to "DIALOG_SHOWN")
        } catch (t: Throwable) {
            ProbeLog.error("stream_probe", t)
        }
    }
}
