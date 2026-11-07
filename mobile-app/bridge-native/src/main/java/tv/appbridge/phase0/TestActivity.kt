package tv.appbridge.phase0

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.widget.LinearLayout
import android.widget.TextView
import tv.appbridge.phase0.probe.ProbeLog

/**
 * Target activity for the "launch OWN activity on virtual display" probe.
 * Reports which display it actually landed on - this is the in-app half of
 * placement verification (the other half is `dumpsys activity` over adb).
 */
class TestActivity : Activity() {
    private var testPlayer: android.media.MediaPlayer? = null
    private val finishReceiver = object : android.content.BroadcastReceiver() {
        override fun onReceive(context: android.content.Context?, intent: android.content.Intent?) { finish() }
    }

    companion object {
        const val EXTRA_EXPECTED_DISPLAY = "expectedDisplay"
        const val ACTION_FINISH = "tv.appbridge.FINISH_OUTPUT_TEST"
    }

    @Suppress("DEPRECATION")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val filter = android.content.IntentFilter(ACTION_FINISH)
        if (android.os.Build.VERSION.SDK_INT >= 33) registerReceiver(finishReceiver, filter, RECEIVER_NOT_EXPORTED)
        else {
            @Suppress("DEPRECATION")
            registerReceiver(finishReceiver, filter)
        }
        val expected = intent.getIntExtra(EXTRA_EXPECTED_DISPLAY, -999)
        val actual = currentDisplay()
        val match = expected == actual
        ProbeLog.report(
            "probe" to "launch_own_placed",
            "result" to if (match) "ON_TARGET_DISPLAY" else "PLACEMENT_MISMATCH",
            "expected" to expected, "actual" to actual
        )

        val title = TextView(this).apply {
            text = "AppBridge TestActivity"
            textSize = 34f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        }
        val detail = TextView(this).apply {
            text = "expected display=$expected\nactual display=$actual\n" +
                if (match) "ON TARGET DISPLAY" else "NOT on target display"
            textSize = 24f
            setTextColor(if (match) Color.rgb(150, 255, 150) else Color.rgb(255, 150, 150))
            gravity = Gravity.CENTER
        }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.rgb(30, 60, 40))
            setPadding(40, 40, 40, 40)
            addView(title)
            addView(detail)
        }
        // Touch anywhere (except the text) reaches here for logging.
        root.setOnTouchListener { _, ev ->
            if (ev.action == MotionEvent.ACTION_DOWN) {
                ProbeLog.report(
                    "probe" to "touch_rx", "result" to "RECEIVED",
                    "x" to ev.x, "y" to ev.y,
                    "displayId" to currentDisplay()
                )
            }
            false
        }
        setContentView(root)
        if (intent.getBooleanExtra("audio_test", false)) {
            title.text = "AppBridge TV • Picture + Audio test"
            val handler = android.os.Handler(mainLooper)
            handler.postDelayed({
                if (!isFinishing) try {
                    val fd = assets.openFd("test-tone.wav")
                    testPlayer = android.media.MediaPlayer().apply {
                        setAudioAttributes(android.media.AudioAttributes.Builder()
                            .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
                            .setContentType(android.media.AudioAttributes.CONTENT_TYPE_MUSIC).build())
                        setDataSource(fd.fileDescriptor, fd.startOffset, fd.length)
                        prepare(); start()
                    }
                    fd.close()
                } catch (t: Throwable) { ProbeLog.error("audio_test", t) }
            }, 2000)
        }
    }

    override fun onDestroy() {
        try { unregisterReceiver(finishReceiver) } catch (_: Throwable) {}
        testPlayer?.release(); super.onDestroy()
    }

    @Suppress("DEPRECATION")
    fun currentDisplay(): Int {
        return try {
            windowManager.defaultDisplay.displayId
        } catch (t: Throwable) {
            -1
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        ProbeLog.report(
            "probe" to "key_rx", "result" to "RECEIVED",
            "key" to keyCode, "displayId" to currentDisplay()
        )
        return super.onKeyDown(keyCode, event)
    }
}
