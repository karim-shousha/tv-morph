package tv.appbridge.phase0.rt.session

import android.content.ComponentName
import android.content.Context
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.IBinder
import android.os.Parcel
import rikka.shizuku.Shizuku
import tv.appbridge.phase0.probe.ProbeLog
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

/**
 * Runs the Phase-0.5-proven shell commands on-device through Shizuku
 * (user must install Shizuku and grant this app access — explicit,
 * revocable, no silent privilege). Commands execute in a Shizuku daemon
 * process as shell via [ShellUserService]. Results (including failures)
 * are reported, never faked.
 */
class ShizukuBackend(private val context: Context) : RuntimeBackend {

    override val name get() = if (EmbeddedShellProvider.ready()) "Morph Bridge" else "Shizuku"

    companion object {
        @Volatile private var binderSeen = false
        @Volatile private var listenerAdded = false

        /** Shizuku delivers its binder asynchronously; wait for it. */
        fun awaitBinder(timeoutMs: Long = 10000): Boolean {
            try {
                if (Shizuku.pingBinder()) {
                    binderSeen = true
                    return true
                }
            } catch (_: Throwable) {
            }
            synchronized(this) {
                if (!listenerAdded) {
                    listenerAdded = true
                    try {
                        Shizuku.addBinderReceivedListenerSticky(
                            object : Shizuku.OnBinderReceivedListener {
                                override fun onBinderReceived() {
                                    binderSeen = true
                                }
                            }
                        )
                    } catch (_: Throwable) {
                    }
                }
            }
            if (binderSeen) return true
            val deadline = System.currentTimeMillis() + timeoutMs
            while (System.currentTimeMillis() < deadline) {
                try {
                    if (Shizuku.pingBinder()) {
                        binderSeen = true
                        return true
                    }
                } catch (_: Throwable) {
                }
                if (binderSeen) return true
                Thread.sleep(250)
            }
            return binderSeen
        }
    }

    override fun isAvailable(): Boolean {
        if (EmbeddedShellProvider.ready()) return true
        return try {
            // Availability is a snapshot: UI callers must not wait for a helper
            // that the user has not started. Explicit setup/binding awaits it.
            Shizuku.pingBinder() &&
                Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
        } catch (t: Throwable) {
            false
        }
    }

    override fun statusLine(): String {
        if (EmbeddedShellProvider.ready()) return "Morph Bridge internal helper connected"
        val binder = try {
            Shizuku.pingBinder()
        } catch (t: Throwable) {
            false
        }
        val perm = try {
            Shizuku.checkSelfPermission()
        } catch (t: Throwable) {
            -1
        }
        return "Shizuku binder=$binder perm=$perm(0=granted)"
    }

    fun requestPermission(listener: (Boolean) -> Unit) {
        Thread({
            try {
                if (!awaitBinder()) {
                    ProbeLog.report("probe" to "shizuku_perm", "result" to "NO_BINDER")
                    listener(false)
                    return@Thread
                }
                val l = object : Shizuku.OnRequestPermissionResultListener {
                    override fun onRequestPermissionResult(requestCode: Int, grantResult: Int) {
                        Shizuku.removeRequestPermissionResultListener(this)
                        listener(grantResult == PackageManager.PERMISSION_GRANTED)
                    }
                }
                Shizuku.addRequestPermissionResultListener(l)
                Shizuku.requestPermission(46001)
            } catch (t: Throwable) {
                ProbeLog.error("shizuku_perm", t)
                listener(false)
            }
        }, "ShizukuPerm").start()
    }

    private val binderRef = AtomicReference<IBinder?>()

    private fun serviceBinder(): IBinder? {
        EmbeddedShellProvider.shell?.takeIf { it.isBinderAlive }?.let { return it }
        binderRef.get()?.let { if (it.isBinderAlive) return it }
        return try {
            val args = Shizuku.UserServiceArgs(
                ComponentName(context.packageName, ShellUserService::class.java.name)
            ).daemon(false).processNameSuffix("appbridge_shell").version(11)
            val latch = CountDownLatch(1)
            val holder = AtomicReference<IBinder?>()
            val conn = object : ServiceConnection {
                override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
                    holder.set(service)
                    latch.countDown()
                }

                override fun onServiceDisconnected(name: ComponentName?) {
                    binderRef.set(null)
                }
            }
            Shizuku.bindUserService(args, conn)
            if (!latch.await(20, TimeUnit.SECONDS)) {
                ProbeLog.report("probe" to "shizuku_bind", "result" to "TIMEOUT")
                return null
            }
            binderRef.set(holder.get())
            holder.get()
        } catch (t: Throwable) {
            ProbeLog.error("shizuku_bind", t)
            null
        }
    }

    override fun exec(cmd: List<String>): RuntimeBackend.ExecResult {
        if (!isAvailable()) {
            return RuntimeBackend.ExecResult(-1, "", "shizuku not available: ${statusLine()}")
        }
        return try {
            val binder = serviceBinder()
                ?: return RuntimeBackend.ExecResult(-1, "", "user service bind failed")
            val data = Parcel.obtain()
            val reply = Parcel.obtain()
            try {
                data.writeInterfaceToken(ShellUserService.DESCRIPTOR)
                data.writeStringList(cmd)
                check(binder.transact(ShellUserService.TRANSACTION_EXEC, data, reply, 0)) { "Shell transaction rejected" }
                reply.readException()
                val code = reply.readInt()
                val out = reply.readString() ?: ""
                val err = reply.readString() ?: ""
                ProbeLog.report(
                    "probe" to "shizuku_exec", "result" to if (code == 0) "OK" else "EXIT_$code",
                    "cmd" to cmd.joinToString(" ").take(160), "out" to out.take(200)
                )
                RuntimeBackend.ExecResult(code, out, err)
            } finally {
                data.recycle()
                reply.recycle()
            }
        } catch (t: Throwable) {
            ProbeLog.error("shizuku_exec", t)
            RuntimeBackend.ExecResult(-1, "", t.javaClass.simpleName + ": " + t.message)
        }
    }

    private fun runtimeCall(code: Int, apk: String? = null): RuntimeBackend.ExecResult {
        val binder = serviceBinder() ?: return RuntimeBackend.ExecResult(-1, "", "Shizuku service unavailable")
        val data = Parcel.obtain()
        val reply = Parcel.obtain()
        return try {
            data.writeInterfaceToken(ShellUserService.DESCRIPTOR)
            if (apk != null) data.writeString(apk)
            check(binder.transact(code, data, reply, 0))
            reply.readException()
            RuntimeBackend.ExecResult(reply.readInt(), reply.readString() ?: "", reply.readString() ?: "")
        } finally { data.recycle(); reply.recycle() }
    }

    fun startRuntime() = runtimeCall(ShellUserService.TRANSACTION_START, context.applicationInfo.sourceDir)
    fun runtimeDisplay() = runtimeCall(ShellUserService.TRANSACTION_DISPLAY)
    fun stopRuntime() = runtimeCall(ShellUserService.TRANSACTION_STOP)
    fun startAudio(uid: Int) = runtimeCall(ShellUserService.TRANSACTION_AUDIO_START, uid.toString())
    fun stopAudio() = runtimeCall(ShellUserService.TRANSACTION_AUDIO_STOP)
    fun configureGuard(pkg: String, display: Int, blockPages: Boolean, keepOnTv: Boolean = true) =
        runtimeCall(ShellUserService.TRANSACTION_GUARD, "$pkg|$display|${if (blockPages) 1 else 0}|${if (keepOnTv) 1 else 0}")

    fun openRuntimeSocket(audio: Boolean = false): android.os.ParcelFileDescriptor {
        val binder = serviceBinder() ?: error("Shizuku service unavailable")
        val data = Parcel.obtain()
        val reply = Parcel.obtain()
        return try {
            data.writeInterfaceToken(ShellUserService.DESCRIPTOR)
            check(binder.transact(if (audio) ShellUserService.TRANSACTION_AUDIO_OPEN else ShellUserService.TRANSACTION_OPEN, data, reply, 0))
            reply.readException()
            android.os.ParcelFileDescriptor.CREATOR.createFromParcel(reply)
        } finally { data.recycle(); reply.recycle() }
    }

    override fun createOverlayDisplay(w: Int, h: Int, dpi: Int): Boolean {
        val r = exec(listOf("settings", "put", "global", "overlay_display_devices", "${w}x$h/$dpi"))
        return r.code == 0
    }

    override fun clearOverlayDisplay() {
        exec(listOf("settings", "put", "global", "overlay_display_devices", "null"))
    }

    override fun launchOnDisplay(
        packageName: String,
        activityClass: String?,
        displayId: Int
    ): RuntimeBackend.ExecResult {
        if (displayId <= 0) return RuntimeBackend.ExecResult(-3, "", "رفض فتح التطبيق على شاشة الموبايل. جهّز الشاشة المستقلة أولًا.")
        val comp = if (activityClass != null) {
            "$packageName/$activityClass"
        } else {
            val pm = context.packageManager
            val intent = pm.getLaunchIntentForPackage(packageName)
                ?: return RuntimeBackend.ExecResult(-2, "", "NO_LAUNCH_INTENT")
            intent.component!!.flattenToShortString()
        }
        val tvOnly = context.getSharedPreferences("appbridge_net", Context.MODE_PRIVATE)
            .getBoolean("keep_apps_on_tv", true)
        val launchFlags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
            android.content.Intent.FLAG_ACTIVITY_MULTIPLE_TASK or
            (if (tvOnly) android.content.Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS else 0)
        return exec(
            listOf(
                "am", "start", "--user", "0", "--display", displayId.toString(), "--windowingMode", "1",
                "-f", "0x${launchFlags.toString(16)}", "-n", comp
            )
        )
    }

    override fun inputKey(displayId: Int, keyCode: Int): RuntimeBackend.ExecResult =
        exec(listOf("input", "-d", displayId.toString(), "keyevent", keyCode.toString()))

    override fun inputTap(displayId: Int, x: Int, y: Int): RuntimeBackend.ExecResult =
        exec(listOf("input", "-d", displayId.toString(), "tap", x.toString(), y.toString()))

    override fun forceStop(packageName: String): RuntimeBackend.ExecResult =
        exec(listOf("am", "force-stop", packageName))
}
