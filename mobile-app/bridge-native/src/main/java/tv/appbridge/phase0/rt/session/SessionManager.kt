package tv.appbridge.phase0.rt.session

import android.content.Context
import android.hardware.display.DisplayManager
import android.view.Display
import tv.appbridge.phase0.rt.data.AppStore
import tv.appbridge.phase0.rt.net.Protocol
import tv.appbridge.phase0.rt.net.WsServer
import tv.appbridge.phase0.rt.pure.StreamPointer
import tv.appbridge.phase0.probe.ProbeLog
import java.util.UUID

/**
 * Control-plane state machine. All privileged work goes through the
 * RuntimeBackend; every failure is reported to the TV as an error message.
 * Never invents success: launch/input results reflect backend results.
 */
class SessionManager(private val context: Context) {

    interface Events {
        fun onStateChanged()
    }

    var events: Events? = null

    val appStore = AppStore(context)
    var backend: RuntimeBackend = NoopBackend("not initialized")
        private set

    fun setBackend(b: RuntimeBackend) {
        backend = b
        changed()
    }

    // ---- session state ----
    var pairingCode: String? = null
        private set
    var pairingExpiresAt: Long = 0
        private set
    var tvToken: String? = null
        private set
    var tvConnected: Boolean = false
        private set
    var tvPlusState: String = "unknown"
        private set
    var tvPhoneSetupSupported = false
        private set
    var trialRemainingMs: Long = 0
        private set
    private fun readTvEntitlement(fields: Map<String,String>) {
        tvPhoneSetupSupported = fields["phoneSetupVersion"] == "1"
        tvPlusState = fields["tvPlus"]?.takeIf { it in listOf("active","inactive","unknown") } ?: "unknown"
        trialRemainingMs = fields["trialRemainingMs"]?.toLongOrNull()?.coerceIn(0,72L*60*60*1000) ?: 0
    }
    var lastHeartbeat: Long = 0
        private set
    var overlayDisplayId: Int = Display.INVALID_DISPLAY
        private set
    var overlayOurs: Boolean = false
    var runningPackage: String? = null
        private set
    var lastError: String? = null
        private set
    @Volatile var selectedTvIp: String? = null
        private set

    fun selectTv(ip: String) {
        require(ip.matches(Regex("(?:[0-9]{1,3}\\.){3}[0-9]{1,3}")))
        // Re-selecting the active TV must not silently invalidate its controls.
        if (ip == selectedTvIp && tvConnected && tvToken != null) { changed(); return }
        selectedTvIp = ip
        newPairingCode()
    }

    fun disconnectTv() {
        context.getSharedPreferences("appbridge_net", Context.MODE_PRIVATE).edit().putBoolean("tv_auto_connect",false).apply()
        TvPhoneSetup.cancel()
        if (runningPackage != null) stopApp()
        releaseDisplay()
        tvToken = null; tvConnected = false; selectedTvIp = null
        pairingCode = null; pairingExpiresAt = 0
        tvPhoneSetupSupported = false
        SessionService.ws?.push("{\"t\":\"disconnected\"}")
        changed()
    }

    fun discoveryFor(ip: String): String? {
        if (ip != selectedTvIp || System.currentTimeMillis() >= pairingExpiresAt || pairingCode == null) return null
        return "{\"ip\":\"${localIp()}\",\"code\":\"$pairingCode\"}"
    }

    // Video: live only while an MpStreamSource runs (projection display +
    // consent + mediaProjection FGS). The source shows the projection
    // display's OWN content; a privileged helper must place the app there.
    val streaming: Boolean get() = SessionService.streamSource?.isRunning == true
    val videoDetail: String
        get() = if (streaming) "live: independent app display 720p H.264/fMP4"
        else "capture-blocked: no active projection stream"

    fun newPairingCode(): String {
        TvPhoneSetup.cancel()
        tvPhoneSetupSupported = false
        val code = (100000..999999).random().toString()
        pairingCode = code
        pairingExpiresAt = System.currentTimeMillis() + 10 * 60 * 1000
        tvToken = null
        tvPlusState = "unknown"
        trialRemainingMs = 0
        tvConnected = false
        SessionService.ws?.push(Protocol.error("auth", "Pairing changed; reconnect to the selected phone."))
        changed()
        ProbeLog.report("probe" to "pair", "result" to "CODE_ISSUED")
        return code
    }

    fun localIp(): String {
        // Resolve a LAN address even when a VPN is the active network or the
        // deprecated Wi-Fi integer address is unavailable on newer phones.
        try {
            val cm = context.getSystemService(android.net.ConnectivityManager::class.java)
            for (network in cm.allNetworks) {
                val caps = cm.getNetworkCapabilities(network) ?: continue
                if (caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_VPN))continue
                if (!caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI) &&
                    !caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_ETHERNET)) continue
                val ip = cm.getLinkProperties(network)?.linkAddresses?.map { it.address }
                    ?.firstOrNull { it is java.net.Inet4Address && it.isSiteLocalAddress && !it.isLoopbackAddress }
                if (ip != null) return ip.hostAddress ?: continue
            }
        } catch (_: Exception) { }
        try {
            val wm = context.applicationContext.getSystemService(android.net.wifi.WifiManager::class.java)
            @Suppress("DEPRECATION") val ip = wm?.connectionInfo?.ipAddress ?: 0
            if (ip != 0) return "%d.%d.%d.%d".format(ip and 0xFF, ip shr 8 and 0xFF, ip shr 16 and 0xFF, ip shr 24 and 0xFF)
        } catch (_: Exception) { }
        try {
            for (network in java.net.NetworkInterface.getNetworkInterfaces().toList()) {
                if (!network.isUp || network.isLoopback || !network.name.matches(Regex("(?:wlan|wifi|eth|en|ap).*"))) continue
                val ip = network.inetAddresses.toList().firstOrNull {
                    it is java.net.Inet4Address && it.isSiteLocalAddress && !it.isLoopbackAddress
                }
                if (ip != null) return ip.hostAddress ?: continue
            }
        } catch (_: Exception) { }
        return "unknown"
    }

    fun findDisplays(): List<Display> {
        return try {
            context.getSystemService(DisplayManager::class.java).displays.toList()
        } catch (t: Throwable) {
            emptyList()
        }
    }

    /** Returns secondary display id or INVALID_DISPLAY; creates overlay if backend allows. */
    fun ensureSecondaryDisplay(): Int {
        // Launch onto the encoder's display, never an arbitrary overlay or DeX display.
        val captureId = SessionService.streamSource?.displayId ?: Display.INVALID_DISPLAY
        if (captureId == Display.INVALID_DISPLAY) {
            lastError = "Prepare the independent app display on the phone first."
            changed()
            return Display.INVALID_DISPLAY
        }
        val dm = try {
            context.getSystemService(DisplayManager::class.java)
        } catch (t: Throwable) {
            return Display.INVALID_DISPLAY
        }
        dm.displays.firstOrNull { it.displayId == captureId && it.displayId != Display.DEFAULT_DISPLAY }?.let {
            overlayDisplayId = it.displayId
            changed()
            return it.displayId
        }
        if (!backend.isAvailable()) {
            lastError = "no secondary display and no privileged backend to create one"
            changed()
            return Display.INVALID_DISPLAY
        }
        lastError = "Capture display is no longer available; restart stream on the phone."
        changed()
        return Display.INVALID_DISPLAY
    }

    fun releaseDisplay() {
        stopStream()
        if (overlayOurs) backend.clearOverlayDisplay()
        overlayOurs = false
        overlayDisplayId = Display.INVALID_DISPLAY
        changed()
    }

    fun handleMessage(text: String): String? {
        val msg = try {
            Protocol.parse(text)
        } catch (t: Throwable) {
            return Protocol.error("bad_message", "unparseable")
        }
        return when (msg.type) {
            "pair" -> {
                val code = msg.fields["code"]
                if (code != null && code == pairingCode && System.currentTimeMillis() < pairingExpiresAt) {
                    readTvEntitlement(msg.fields)
                    tvToken = UUID.randomUUID().toString()
                    tvConnected = true
                    lastHeartbeat = System.currentTimeMillis()
                    changed()
                    ProbeLog.report("probe" to "pair", "result" to "PAIRED")
                    Protocol.paired(tvToken!!)
                } else {
                    Protocol.error("pair_failed", "wrong or expired code")
                }
            }
            "phone_setup" -> {
                if (!authed(msg)) return Protocol.error("auth", "not paired")
                val result = TvPhoneSetup.submit(context, msg.fields["code"] ?: "")
                if (result == "invalid") Protocol.error("phone_setup", "Enter the six digits shown in Android settings") else statusJson()
            }
            "phone_setup_cancel" -> {
                if (!authed(msg)) return Protocol.error("auth", "not paired")
                TvPhoneSetup.cancel(); statusJson()
            }
            "launch" -> {
                if (!authed(msg)) return Protocol.error("auth", "not paired")
                val pkg = msg.fields["pkg"] ?: return Protocol.error("launch", "missing pkg")
                launchApp(pkg)
            }
            "key" -> {
                if (!authed(msg)) return Protocol.error("auth", "not paired")
                val k = msg.fields["k"] ?: return Protocol.error("key", "missing k")
                sendKey(k)
            }
            "stop" -> {
                if (!authed(msg)) return Protocol.error("auth", "not paired")
                stopApp()
            }
            "test" -> {
                if (!authed(msg)) return Protocol.error("auth", "not paired")
                testOutput()
                statusJson()
            }
            "pointer" -> {
                if (!authed(msg)) return Protocol.error("auth", "not paired")
                val x = msg.fields["x"]?.toFloatOrNull()
                val y = msg.fields["y"]?.toFloatOrNull()
                if (x == null || y == null) return Protocol.error("pointer", "bad coords")
                sendPointer(x, y)
            }
            "scroll" -> {
                if (!authed(msg)) return Protocol.error("auth", "not paired")
                val dy = msg.fields["dy"]?.toFloatOrNull()
                if (dy == null || !dy.isFinite() || dy == 0f) return Protocol.error("scroll", "bad direction")
                sendScroll(dy,msg.fields["x"]?.toFloatOrNull() ?: .5f)
            }
            "apps" -> pushApps()
            "heartbeat" -> {
                if (!authed(msg)) return Protocol.error("auth", "not paired")
                lastHeartbeat = System.currentTimeMillis()
                readTvEntitlement(msg.fields)
                changed()
                statusJson()
            }
            "bye" -> {
                if (!authed(msg)) return Protocol.error("auth", "not paired")
                disconnectTv()
                null
            }
            else -> Protocol.error("unknown", msg.type)
        }
    }

    private fun authed(msg: Protocol.Msg): Boolean =
        msg.fields["token"] != null && msg.fields["token"] == tvToken

    fun pushApps(): String {
        val discovered = try {
            appStore.discover()
        } catch (t: Throwable) {
            emptyList()
        }
        val sel = appStore.selected(discovered)
        val icons = sel.mapNotNull { e -> appStore.iconData(e)?.let { e.packageName to it } }.toMap()
        return Protocol.apps(sel.map { it.label to it.packageName }, icons)
    }

    fun statusJson(): String {
        return Protocol.status(runningPackage, overlayDisplayId, streaming, statusDetail(), tv.appbridge.phase0.rt.ui.MorphHostShell.appearance(context), TvPhoneSetup.state)
    }

    fun statusDetail(): String {
        val b = backend.statusLine()
        return if (runningPackage != null) "running=$runningPackage display=$overlayDisplayId backend=[$b]"
        else "idle display=$overlayDisplayId backend=[$b]"
    }

    private fun launchApp(pkg: String): String {
        if (!appStore.isSelected(pkg)) return Protocol.error("launch", "App is not selected on the phone")
        // Pairing can complete before the independent-app helper is ready.
        // Reuse an available helper automatically on the first TV launch.
        if (!streaming && backend.isAvailable() && !startIndependent()) {
            return Protocol.error("launch", lastError ?: "Could not prepare the independent app display")
        }
        val displayId = ensureSecondaryDisplay()
        if (displayId == Display.INVALID_DISPLAY) {
            lastError = "التلفزيون متصل. افتح Bridge على الموبايل واضغط تجهيز تشغيل التطبيقات."
            changed()
            return Protocol.error("launch", lastError!!)
        }
        val entry = try {
            appStore.discover().firstOrNull { it.packageName == pkg }
        } catch (t: Throwable) {
            null
        }
        prepareFirstLaunch(pkg, displayId)?.let { return Protocol.error("launch", it.err) }
        startSelectedAudio(pkg)?.let { lastError = it.err; return Protocol.error("launch", it.err) }
        val r = backend.launchOnDisplay(pkg, entry?.activityClass, displayId)
        return if (r.code == 0 && !r.out.contains("Error:") && !r.out.contains("Exception")) {
            runningPackage = pkg
            lastError = null
            changed()
            ProbeLog.report("probe" to "session", "result" to "LAUNCH_OK", "package" to pkg, "displayId" to displayId)
            statusJson()
        } else {
            lastError = r.err.ifEmpty { r.out.ifEmpty { "launch failed code=${r.code}" } }
            changed()
            Protocol.error("launch", lastError!!)
        }
    }

    private fun sendKey(k: String): String {
        val displayId = overlayDisplayId
        if (displayId == Display.INVALID_DISPLAY) return Protocol.error("key", "no session display")
        val code = when (k) {
            "UP" -> 19
            "DOWN" -> 20
            "LEFT" -> 21
            "RIGHT" -> 22
            "OK" -> 23
            "BACK" -> 4
            "HOME" -> 3
            "PLAY_PAUSE" -> 85
            else -> return Protocol.error("key", "unknown key $k")
        }
        val r = backend.inputKey(displayId, code)
        return if (r.code == 0) statusJson() else Protocol.error("key", r.err.ifEmpty { "input failed" })
    }

    private fun sendPointer(x: Float, y: Float): String {
        val displayId = overlayDisplayId
        if (displayId == Display.INVALID_DISPLAY) return Protocol.error("pointer", "no session display")
        val dm = try {
            context.getSystemService(DisplayManager::class.java)
        } catch (t: Throwable) {
            return Protocol.error("pointer", "no display service")
        }
        val d = dm.getDisplay(displayId) ?: return Protocol.error("pointer", "display gone")
        val w = d.mode.physicalWidth
        val h = d.mode.physicalHeight
        val pt = StreamPointer.toDisplayPixels(x, y, w, h)
            ?: return Protocol.error("pointer", "outside stream")
        val r = backend.inputTap(displayId, pt.first, pt.second)
        return if (r.code == 0) statusJson() else Protocol.error("pointer", r.err.ifEmpty { "tap failed" })
    }

    private fun sendScroll(direction: Float, x: Float): String {
        val id = overlayDisplayId
        if (id <= 0) return Protocol.error("scroll", "no independent display")
        val display = context.getSystemService(DisplayManager::class.java).getDisplay(id)
            ?: return Protocol.error("scroll", "display gone")
        val width = display.mode.physicalWidth
        val height = display.mode.physicalHeight
        val from = (height * if (direction > 0) 0.76f else 0.24f).toInt()
        val to = (height * if (direction > 0) 0.24f else 0.76f).toInt()
        if(!x.isFinite()||x !in 0f..1f)return Protocol.error("scroll","outside stream")
        val column=(x.coerceIn(.08f,.92f)*width).toInt()
        val result = backend.exec(listOf("input", "-d", id.toString(), "swipe", column.toString(), from.toString(),
            column.toString(), to.toString(), "180"))
        return if (result.code == 0) statusJson() else Protocol.error("scroll", result.err)
    }

    fun stopApp(): String {
        stopSelectedAudio()
        val pkg = runningPackage
        if (pkg == context.packageName) {
            // Finish only the diagnostic windows; keep our control servers alive.
            context.sendBroadcast(android.content.Intent(tv.appbridge.phase0.TestActivity.ACTION_FINISH).setPackage(context.packageName))
        } else if (pkg != null) backend.forceStop(pkg)
        runningPackage = null
        changed()
        SessionService.ws?.push(statusJson())
        return statusJson()
    }

    fun startStream(resultCode: Int, data: android.content.Intent): String {
        stopStream()
        return try {
            // The mediaProjection FGS (ProjectionService, stream mode) must
            // own the token: getMediaProjection() throws without it.
            val svc = android.content.Intent(context, tv.appbridge.phase0.probe.ProjectionService::class.java).apply {
                putExtra(tv.appbridge.phase0.probe.ProjectionService.EXTRA_CODE, resultCode)
                putExtra(tv.appbridge.phase0.probe.ProjectionService.EXTRA_DATA, data)
                putExtra(tv.appbridge.phase0.probe.ProjectionService.EXTRA_STREAM, true)
            }
            context.startForegroundService(svc)
            changed()
            ProbeLog.report("probe" to "session", "result" to "STREAM_STARTING")
            statusJson()
        } catch (t: Throwable) {
            ProbeLog.error("session_stream", t)
            Protocol.error("stream", t.message ?: "start failed")
        }
    }

    @Synchronized
    fun startIndependent(): Boolean {
        if ((SessionService.streamSource?.displayId ?: -1) > 0) return true
        val shell = backend as? ShizukuBackend
        if (shell == null || !shell.isAvailable()) {
            lastError = "افتح إعدادات Morph Bridge ثم تجهيز الموبايل لتشغيل المساعد الداخلي."
            changed()
            return false
        }
        stopStream()
        return try {
            val source = tv.appbridge.phase0.rt.video.ShellStreamSource(shell)
            SessionService.streamSource = source
            SessionService.setVideoSource(source)
            source.start()
            val deadline = System.currentTimeMillis() + 10000
            while (source.isRunning && source.displayId < 0 && System.currentTimeMillis() < deadline) Thread.sleep(100)
            check(source.displayId > 0) { source.error ?: "Independent display timed out" }
            lastError = null
            changed()
            true
        } catch (t: Throwable) {
            lastError = t.message
            stopStream()
            changed()
            false
        }
    }

    fun stopStream(): String {
        stopSelectedAudio()
        try {
            SessionService.streamSource?.stop()
        } catch (_: Throwable) {
        }
        try {
            SessionService.setVideoSource(null)
        } catch (_: Throwable) {
        }
        changed()
        return statusJson()
    }

    /** Local (on-phone) launch bookkeeping: the on-device user is always authorized. */
    fun markRunning(pkg: String?) {
        runningPackage = pkg
        changed()
    }

    fun launchLocal(pkg: String, activityClass: String?): RuntimeBackend.ExecResult {
        val displayId = ensureSecondaryDisplay()
        if (displayId == Display.INVALID_DISPLAY) {
            return RuntimeBackend.ExecResult(-3, "", lastError ?: "no display")
        }
        prepareFirstLaunch(pkg, displayId)?.let { return it }
        startSelectedAudio(pkg)?.let { lastError = it.err; return it }
        val r = backend.launchOnDisplay(pkg, activityClass, displayId)
        if (r.code == 0 && !r.out.contains("Error:") && !r.out.contains("Exception")) {
            runningPackage = pkg
            lastError = null
            changed()
            // Tell the paired TV right away so it opens the running app.
            try {
                SessionService.ws?.push(pushApps())
                SessionService.ws?.push(statusJson())
            } catch (_: Throwable) {
            }
        } else {
            lastError = r.err.ifEmpty { r.out.ifEmpty { "launch failed code=${r.code}" } }
            changed()
            // Failure must also reach the TV (never fail silently).
            try {
                SessionService.ws?.push(
                    tv.appbridge.phase0.rt.net.Protocol.error("launch", lastError!!))
                SessionService.ws?.push(statusJson())
            } catch (_: Throwable) {
            }
        }
        return r
    }

    private var audioPackage: String? = null
    private val preparedDisplays = HashSet<String>()

    @Synchronized
    private fun prepareFirstLaunch(pkg: String, displayId: Int): RuntimeBackend.ExecResult? {
        val key = "$displayId:$pkg"
        if (pkg == context.packageName || key in preparedDisplays) return null
        // Some phone apps retain a renderer/configuration for the old display.
        // Restart the selected app once for a new virtual display; preserve data.
        val result = backend.forceStop(pkg)
        if (result.code != 0) return result
        preparedDisplays.add(key)
        return null
    }
    var keepAppsOnTv: Boolean
        get() = context.getSharedPreferences("appbridge_net", Context.MODE_PRIVATE).getBoolean("keep_apps_on_tv", true)
        set(value) {
            runningPackage?.takeIf { it != context.packageName }?.let { pkg ->
                val result = (backend as? ShizukuBackend)?.configureGuard(pkg, overlayDisplayId, blockExternalPages, value)
                check(result?.code == 0) { "تعذر تحديث حماية الشاشة المستقلة. شغّل مساعد Bridge من تجهيز الموبايل." }
            }
            context.getSharedPreferences("appbridge_net", Context.MODE_PRIVATE).edit().putBoolean("keep_apps_on_tv", value).apply()
        }
    var blockExternalPages: Boolean
        get() = context.getSharedPreferences("appbridge_net", Context.MODE_PRIVATE).getBoolean("block_external_pages", true)
        set(value) {
            context.getSharedPreferences("appbridge_net", Context.MODE_PRIVATE).edit().putBoolean("block_external_pages", value).apply()
            runningPackage?.takeIf { it != context.packageName }?.let { pkg ->
                (backend as? ShizukuBackend)?.configureGuard(pkg, overlayDisplayId, value, keepAppsOnTv)
            }
        }

    fun testOutput() {
        val id = ensureSecondaryDisplay()
        check(id > 0) { lastError ?: "Prepare the display first" }
        startSelectedAudio(context.packageName)
        val result = backend.exec(listOf("am", "start", "--user", "0", "--display", id.toString(), "-f", "0x18000000",
            "-n", "${context.packageName}/tv.appbridge.phase0.TestActivity", "--ei", "expectedDisplay", id.toString(), "--ez", "audio_test", "true"))
        check(result.code == 0) { result.err }
        runningPackage = context.packageName
        SessionService.ws?.push(statusJson())
        changed()
    }

    private fun startSelectedAudio(pkg: String): RuntimeBackend.ExecResult? {
        if (audioPackage == pkg && SessionService.audioSource?.running == true) {
            if (keepAppsOnTv && pkg != context.packageName) {
                val result = (backend as? ShizukuBackend)?.configureGuard(pkg, overlayDisplayId, blockExternalPages, true)
                if (result?.code != 0) return RuntimeBackend.ExecResult(-4, "", "تعذر تفعيل حماية الشاشة المستقلة. شغّل مساعد Bridge من تجهيز الموبايل.")
            }
            return null
        }
        stopSelectedAudio()
        val shell = backend as? ShizukuBackend ?: return null
        if (pkg != context.packageName) {
            val protection = shell.configureGuard(pkg, overlayDisplayId, blockExternalPages, keepAppsOnTv)
            if (protection.code != 0) {
                ProbeLog.report("probe" to "app_guard", "result" to "UNAVAILABLE", "message" to protection.err)
                if (keepAppsOnTv) return RuntimeBackend.ExecResult(-4, "", "تعذر تفعيل حماية الشاشة المستقلة. شغّل مساعد Bridge من تجهيز الموبايل، وأعد الاتصال بالتلفزيون.")
            }
        }
        try {
            @Suppress("DEPRECATION")
            val uid = context.packageManager.getApplicationInfo(pkg, 0).uid
            val audio = tv.appbridge.phase0.rt.video.ShellAudioSource(shell, uid)
            audio.start()
            SessionService.audioSource = audio
            SessionService.http?.audioSource = audio
            audioPackage = pkg
        } catch (t: Throwable) { ProbeLog.error("selected_audio_start", t) }
        return null
    }

    private fun stopSelectedAudio() {
        try { (backend as? ShizukuBackend)?.configureGuard("", -1, false) } catch (_: Throwable) {}
        try { SessionService.audioSource?.stop() } catch (_: Throwable) {}
        SessionService.audioSource = null
        SessionService.http?.audioSource = null
        audioPackage = null
    }

    /** Adopt a secondary display created externally (PC adb script). */
    fun adoptDisplay(id: Int) {
        overlayDisplayId = id
        changed()
    }

    fun onWsConnected(push: (String) -> Unit) {
        tvConnected = false
        push(Protocol.hello("AppBridge", pairingCode?.let { "1" }))
        push(pushApps())
        push(statusJson())
        changed()
    }

    fun onWsDisconnected() {
        TvPhoneSetup.cancel()
        tvConnected = false
        changed()
    }

    private fun changed() {
        try {
            events?.onStateChanged()
        } catch (_: Throwable) {
        }
    }
}
