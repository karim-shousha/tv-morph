package tv.appbridge.phase0.rt.session

import android.os.Binder
import android.os.Parcel
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/** Shizuku instantiates an IBinder, not an Android Service. */
class ShellUserService : Binder() {
    init { attachInterface(null, DESCRIPTOR) }
    companion object {
        const val TRANSACTION_EXEC = 1
        const val DESCRIPTOR = "tv.appbridge.shell"
        const val TRANSACTION_START = 2
        const val TRANSACTION_STOP = 3
        const val TRANSACTION_DISPLAY = 4
        const val TRANSACTION_OPEN = 5
        const val TRANSACTION_AUDIO_START = 6
        const val TRANSACTION_AUDIO_OPEN = 7
        const val TRANSACTION_AUDIO_STOP = 8
        const val TRANSACTION_GUARD = 9
    }

    private var runtimeProcess: Process? = null
    private var audioProcess: Process? = null
    private var sourceApk: String? = null
    private val runtimeDir = java.io.File("/data/local/tmp/appbridge-runtime")
    @Volatile private var guardedPackage = ""
    @Volatile private var guardedDisplay = -1
    @Volatile private var blockExternalPages = true
    @Volatile private var keepOnTv = true
    private var guardThread: Thread? = null

    @Synchronized
    private fun configureGuard(value: String): RuntimeBackend.ExecResult {
        val parts = value.split('|')
        guardedPackage = parts.getOrElse(0) { "" }
        guardedDisplay = parts.getOrNull(1)?.toIntOrNull() ?: -1
        blockExternalPages = parts.getOrNull(2) != "0"
        keepOnTv = parts.getOrNull(3) != "0"
        if (guardedPackage.isEmpty() || guardedDisplay <= 0) return RuntimeBackend.ExecResult(0, "guard stopped", "")
        if (guardThread?.isAlive == true) return RuntimeBackend.ExecResult(0, "guard updated", "")
        return try {
            val manager = Class.forName("android.app.ActivityTaskManager").getMethod("getService").invoke(null)
            val getRoots = manager.javaClass.getMethod("getAllRootTaskInfos").apply { isAccessible = true }
            val move = manager.javaClass.getMethod("moveRootTaskToDisplay", Int::class.javaPrimitiveType, Int::class.javaPrimitiveType).apply { isAccessible = true }
            getRoots.invoke(manager) // Fail visibly before claiming protection is active.
            guardThread = Thread({
                var lastBack = 0L
                // Older Android versions keep the launch-intent flag fallback.
                val recents = try { TvTaskRecents() } catch (t: Throwable) {
                    android.util.Log.w("APPBRIDGE-PROBE", "probe=tv_recents result=UNSUPPORTED", t)
                    null
                }
                var recentsErrorReported = false
                while (runtimeProcess?.isAlive == true) {
                    try {
                        if (guardedPackage.isEmpty() || guardedDisplay <= 0) { Thread.sleep(350); continue }
                        val selected = guardedPackage; val target = guardedDisplay
                        val roots = getRoots.invoke(manager) as List<*>
                        for (root in roots.filterNotNull()) {
                            val type = root.javaClass
                            val display = type.getField("displayId").getInt(root)
                            val top = type.getField("topActivity").get(root) as? android.content.ComponentName
                            val base = type.getField("baseActivity").get(root) as? android.content.ComponentName
                            val visible = try { type.getField("isVisible").getBoolean(root) }
                                catch (_: NoSuchFieldException) { type.getField("visible").getBoolean(root) }
                            val action = tv.appbridge.phase0.rt.pure.ExternalPagePolicy.decide(target, selected, display,
                                top?.packageName, base?.packageName, visible, blockExternalPages, top?.className ?: "", keepOnTv)
                            if (action == tv.appbridge.phase0.rt.pure.ExternalPagePolicy.Action.MOVE_SELECTED_APP) {
                                val taskId = type.getField("taskId").getInt(root)
                                move.invoke(manager, taskId, target)
                                android.util.Log.i("APPBRIDGE-PROBE", "probe=app_guard result=MOVED_TO_TV package=$selected displayId=$target")
                            } else if (action == tv.appbridge.phase0.rt.pure.ExternalPagePolicy.Action.CLOSE_EXTERNAL_PAGE &&
                                android.os.SystemClock.uptimeMillis() - lastBack > 800) {
                                runCmd(listOf("input", "-d", target.toString(), "keyevent", "4"))
                                lastBack = android.os.SystemClock.uptimeMillis()
                                android.util.Log.i("APPBRIDGE-PROBE", "probe=app_guard result=EXTERNAL_PAGE_CLOSED displayId=$target")
                                break
                            }
                        }
                        try { recents?.update(selected, target, keepOnTv) }
                        catch (t: Throwable) {
                            if (!recentsErrorReported) {
                                android.util.Log.w("APPBRIDGE-PROBE", "probe=tv_recents result=ERROR", t)
                                recentsErrorReported = true
                            }
                        }
                        Thread.sleep(350)
                    } catch (_: InterruptedException) { break }
                    catch (t: Throwable) {
                        android.util.Log.e("APPBRIDGE-PROBE", "probe=app_guard result=ERROR", t)
                        break
                    }
                }
            }, "AppBridgeAppGuard").apply { isDaemon = true; start() }
            RuntimeBackend.ExecResult(0, "guard active", "")
        } catch (t: Throwable) { RuntimeBackend.ExecResult(-1, "", "App protection unavailable: ${t.message}") }
    }

    @Synchronized
    private fun startRuntime(apk: String): RuntimeBackend.ExecResult {
        return try {
            runtimeProcess?.destroy()
            sourceApk = apk
            runtimeDir.mkdirs()
            val jar = java.io.File(runtimeDir, "server.jar")
            java.util.zip.ZipFile(apk).use { zip ->
                zip.getInputStream(zip.getEntry("assets/scrcpy-server-v5.0.1")).use { input ->
                    jar.outputStream().use { input.copyTo(it) }
                }
            }
            val log = java.io.File(runtimeDir, "server.log")
            val pb = ProcessBuilder(
                "app_process", "/", "com.genymobile.scrcpy.Server", "5.0.1",
                "scid=2a41bc03", "tunnel_forward=true", "audio=false", "control=false",
                "new_display=1280x720/160", "vd_system_decorations=false", "vd_destroy_content=true",
                "max_fps=30", "video_bit_rate=2500000",
                "send_device_meta=false", "send_dummy_byte=false", "cleanup=false", "power_on=false",
                "video_codec_options=profile=1,level=512,frame-rate=30,i-frame-interval=1", "clipboard_autosync=false"
            )
            pb.environment()["CLASSPATH"] = jar.absolutePath
            runtimeProcess = pb.redirectErrorStream(true).redirectOutput(log).start()
            RuntimeBackend.ExecResult(0, "scrcpy_2a41bc03", "")
        } catch (t: Throwable) { RuntimeBackend.ExecResult(-1, "", t.toString()) }
    }

    @Synchronized
    private fun startAudio(uid: Int): RuntimeBackend.ExecResult = try {
        require(uid >= 10000) { "Audio must target the selected app UID" }
        audioProcess?.destroy()
        val jar = java.io.File(runtimeDir, "audio-server.jar")
        java.util.zip.ZipFile(sourceApk ?: error("Start display first")).use { zip ->
            zip.getInputStream(zip.getEntry("assets/scrcpy-audio-appbridge.jar")).use { input -> jar.outputStream().use { input.copyTo(it) } }
        }
        val pb = ProcessBuilder("app_process", "/", "com.genymobile.scrcpy.Server", "5.0.1",
            "scid=2a41bc06", "video=false", "control=false", "audio=true", "audio_source=playback",
            "audio_target_uid=$uid", "audio_dup=false", "audio_codec=aac", "audio_bit_rate=128000",
            "tunnel_forward=true", "send_device_meta=false", "send_dummy_byte=false", "cleanup=false", "power_on=false")
        pb.environment()["CLASSPATH"] = jar.absolutePath
        audioProcess = pb.redirectErrorStream(true).redirectOutput(java.io.File(runtimeDir, "audio.log")).start()
        RuntimeBackend.ExecResult(0, "scrcpy_2a41bc06", "")
    } catch (t: Throwable) { RuntimeBackend.ExecResult(-1, "", t.toString()) }

    override fun onTransact(code: Int, data: Parcel, reply: Parcel?, flags: Int): Boolean {
        if (code == TRANSACTION_OPEN || code == TRANSACTION_AUDIO_OPEN) {
            data.enforceInterface(DESCRIPTOR)
            try {
                var connected: android.net.LocalSocket? = null
                val deadline = System.currentTimeMillis() + 10000
                while (connected == null && System.currentTimeMillis() < deadline) {
                    val candidate = android.net.LocalSocket()
                    try {
                        val name = if (code == TRANSACTION_OPEN) "scrcpy_2a41bc03" else "scrcpy_2a41bc06"
                        candidate.connect(android.net.LocalSocketAddress(name, android.net.LocalSocketAddress.Namespace.ABSTRACT))
                        connected = candidate
                    } catch (_: java.io.IOException) { candidate.close(); Thread.sleep(100) }
                }
                val socket = connected ?: error("Video socket unavailable")
                socket.use {
                    android.os.ParcelFileDescriptor.dup(it.fileDescriptor).use { fd ->
                        reply!!.writeNoException()
                        fd.writeToParcel(reply, 0)
                    }
                }
            } catch (t: Exception) { reply?.writeException(t) }
            return true
        }
        if (code !in TRANSACTION_EXEC..TRANSACTION_GUARD) return super.onTransact(code, data, reply, flags)
        data.enforceInterface(DESCRIPTOR)
        val result = when (code) {
            TRANSACTION_GUARD -> configureGuard(data.readString() ?: "")
            TRANSACTION_START -> startRuntime(data.readString() ?: "")
            TRANSACTION_STOP -> { guardedPackage = ""; runtimeProcess?.destroy(); audioProcess?.destroy(); runtimeProcess = null; audioProcess = null; RuntimeBackend.ExecResult(0, "", "") }
            TRANSACTION_AUDIO_START -> startAudio(data.readString()?.toIntOrNull() ?: -1)
            TRANSACTION_AUDIO_STOP -> { audioProcess?.destroy(); audioProcess = null; RuntimeBackend.ExecResult(0, "", "") }
            TRANSACTION_DISPLAY -> {
                val log = try { java.io.File(runtimeDir, "server.log").readText() } catch (_: Throwable) { "" }
                val id = Regex("New display:.*\\(id=(\\d+)\\)").find(log)?.groupValues?.get(1)
                RuntimeBackend.ExecResult(if (id != null) 0 else -1, id ?: "", log.takeLast(1200))
            }
            else -> runCmd(data.createStringArrayList() ?: arrayListOf())
        }
        reply?.writeNoException()
        reply?.writeInt(result.code)
        reply?.writeString(result.out)
        reply?.writeString(result.err)
        return true
    }

    private fun runCmd(argv: List<String>): RuntimeBackend.ExecResult {
        fastInput(argv)?.let { return it }
        val readers = Executors.newFixedThreadPool(2)
        var proc: Process? = null
        return try {
            require(argv.isNotEmpty()) { "Empty command" }
            val child = ProcessBuilder(argv).start()
            proc = child
            val stdout = readers.submit<String> { child.inputStream.bufferedReader().use { it.readText() } }
            val stderr = readers.submit<String> { child.errorStream.bufferedReader().use { it.readText() } }
            if (!child.waitFor(30, TimeUnit.SECONDS)) {
                child.destroyForcibly()
                RuntimeBackend.ExecResult(124, "", "Command timed out")
            } else {
                RuntimeBackend.ExecResult(child.exitValue(), stdout.get(2, TimeUnit.SECONDS), stderr.get(2, TimeUnit.SECONDS))
            }
        } catch (t: Throwable) {
            RuntimeBackend.ExecResult(-1, "", "${t.javaClass.simpleName}: ${t.message}")
        } finally {
            proc?.destroy()
            readers.shutdownNow()
        }
    }

    /** Avoid spawning an input CLI process for every TV click/key. */
    private fun fastInput(argv: List<String>): RuntimeBackend.ExecResult? {
        if (argv.size < 5 || argv[0] != "input" || argv[1] != "-d") return null
        val display = argv[2].toIntOrNull() ?: return null
        if (display <= 0) return RuntimeBackend.ExecResult(-1, "", "Primary-display input is forbidden")
        if (argv[3] !in listOf("keyevent", "tap", "swipe")) return null
        return try {
            val global = try { Class.forName("android.hardware.input.InputManagerGlobal") }
                catch (_: ClassNotFoundException) { Class.forName("android.hardware.input.InputManager") }
            val manager = global.getMethod("getInstance").invoke(null)
            val inject = global.getMethod("injectInputEvent", android.view.InputEvent::class.java, Int::class.javaPrimitiveType)
            val setDisplay = android.view.InputEvent::class.java.getMethod("setDisplayId", Int::class.javaPrimitiveType)
            val now = android.os.SystemClock.uptimeMillis()
            fun send(event: android.view.InputEvent): Boolean {
                setDisplay.invoke(event, display)
                return inject.invoke(manager, event, 1) as Boolean
            }
            val ok = if (argv[3] == "keyevent" && argv.size == 5) {
                val key = argv[4].toInt()
                val down = android.view.KeyEvent(now, now, android.view.KeyEvent.ACTION_DOWN, key, 0, 0,
                    android.view.KeyCharacterMap.VIRTUAL_KEYBOARD, 0, 0, android.view.InputDevice.SOURCE_KEYBOARD)
                val up = android.view.KeyEvent(now, now, android.view.KeyEvent.ACTION_UP, key, 0, 0,
                    android.view.KeyCharacterMap.VIRTUAL_KEYBOARD, 0, 0, android.view.InputDevice.SOURCE_KEYBOARD)
                val sent = send(down); send(up) && sent
            } else if (argv[3] == "tap" && argv.size == 6) {
                val x = argv[4].toFloat(); val y = argv[5].toFloat()
                val down = android.view.MotionEvent.obtain(now, now, android.view.MotionEvent.ACTION_DOWN, x, y, 0)
                val up = android.view.MotionEvent.obtain(now, now, android.view.MotionEvent.ACTION_UP, x, y, 0)
                try {
                    down.source = android.view.InputDevice.SOURCE_TOUCHSCREEN
                    up.source = android.view.InputDevice.SOURCE_TOUCHSCREEN
                    val sent = send(down); send(up) && sent
                } finally { down.recycle(); up.recycle() }
            } else if (argv[3] == "swipe" && argv.size == 9) {
                val x1 = argv[4].toFloat(); val y1 = argv[5].toFloat()
                val x2 = argv[6].toFloat(); val y2 = argv[7].toFloat()
                val duration = argv[8].toInt().coerceIn(100, 500)
                fun touch(action: Int, x: Float, y: Float): Boolean {
                    val event = android.view.MotionEvent.obtain(now, android.os.SystemClock.uptimeMillis(), action, x, y, 0)
                    return try { event.source = android.view.InputDevice.SOURCE_TOUCHSCREEN; send(event) }
                    finally { event.recycle() }
                }
                var sent = touch(android.view.MotionEvent.ACTION_DOWN, x1, y1)
                try {
                    for (step in 1..12) {
                        Thread.sleep((duration / 12).toLong())
                        val t = step / 12f
                        sent = touch(android.view.MotionEvent.ACTION_MOVE, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t) && sent
                    }
                } finally { sent = touch(android.view.MotionEvent.ACTION_UP, x2, y2) && sent }
                sent
            } else return null
            RuntimeBackend.ExecResult(if (ok) 0 else -1, "direct input display=$display", if (ok) "" else "Input injection rejected")
        } catch (_: ReflectiveOperationException) {
            // Older ROMs may expose a different API. The tested CLI remains
            // the fallback and still targets the secondary display explicitly.
            null
        }
    }
}
