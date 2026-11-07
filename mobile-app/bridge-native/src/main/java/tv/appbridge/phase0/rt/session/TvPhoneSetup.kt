package tv.appbridge.phase0.rt.session

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import tv.appbridge.phase0.rt.ui.PhoneSetupState

/** The user explicitly opens a short-lived code-entry session on their paired TV. */
object TvPhoneSetup {
    @Volatile var state = "idle"
        private set
    private var expires = 0L
    @Volatile private var generation = 0
    private var attempts = 0
    private var busy = false
    private var discovery: AutoCloseable? = null
    private val handler = Handler(Looper.getMainLooper())
    @Synchronized fun arm(context: Context) {
        if (busy) return
        generation++; attempts = 0; expires = SystemClock.elapsedRealtime() + 180000; state = "waiting"
        discovery?.close(); discovery = PhoneAdbDiscovery.start(context.applicationContext, keepAlive = true)
        val batch = generation
        handler.postDelayed({ synchronized(this) { if (batch == generation && !busy) cancel("expired") } }, 180000)
        publish()
    }
    @Synchronized fun cancel(value: String = "idle") {
        generation++; expires = 0; busy = false; state = value; discovery?.close(); discovery = null; publish()
    }
    private fun publish() {
        // UI actions may arm/cancel setup; socket writes must run off the UI thread.
        Thread { SessionService.manager?.let { SessionService.ws?.push(it.statusJson()) } }.start()
    }
    @Synchronized fun submit(context: Context, value: String): String {
        if (busy) return "pairing"
        if (SystemClock.elapsedRealtime() >= expires || attempts >= 5) { cancel("expired"); return "expired" }
        val code = PhoneSetupState.normalizeCode(value)
        if (!code.matches(Regex("[0-9]{6}"))) return "invalid"
        val port = EmbeddedAdb.pairingPort
        if (port !in 1..65535) { state = "no_port"; publish(); return state }
        attempts++
        start(context.applicationContext, code, port)
        return "pairing"
    }

    @Synchronized fun resume(context: Context) {
        if (busy || EmbeddedShellProvider.ready()) return
        if (!EmbeddedAdb.isPaired(context)) return
        generation++; expires = SystemClock.elapsedRealtime() + 45000
        discovery?.close(); discovery = PhoneAdbDiscovery.start(context.applicationContext, keepAlive = true)
        start(context.applicationContext, null, 0)
    }
    private fun start(app: Context, code: String?, pairPort: Int) {
        val batch = generation
        busy = true; state = "pairing"; publish()
        Thread {
            var paired = code == null; var ready = false
            try {
                if (code != null) { EmbeddedAdb.pair(app, pairPort, code); paired = true }
                val end = SystemClock.elapsedRealtime() + 45000
                var starts = 0
                while (batch == generation && SystemClock.elapsedRealtime() < end && starts < 3 && !ready) {
                    val port = EmbeddedAdb.connectionPort
                    if (port in 1..65535 && port != EmbeddedAdb.pairingPort && port != pairPort) {
                        starts++
                        try { EmbeddedAdb.start(app, port); ready = EmbeddedShellProvider.ready() } catch (_: Exception) { }
                    }
                    if (!ready) Thread.sleep(750)
                }
            } catch (_: Exception) { }
            synchronized(this) {
                if (batch != generation) return@Thread
                busy = false
                state = if (ready) "ready" else if (paired) "start_failed" else if (SystemClock.elapsedRealtime() >= expires) "expired" else "failed"
                if (paired || state == "expired") { expires = 0; discovery?.close(); discovery = null }
                publish()
            }
        }.start()
    }
}
