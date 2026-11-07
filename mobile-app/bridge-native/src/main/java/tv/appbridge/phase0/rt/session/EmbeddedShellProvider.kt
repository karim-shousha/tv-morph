package tv.appbridge.phase0.rt.session

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.os.Binder
import android.os.Bundle
import android.os.IBinder

/** Accept a Binder only from the owner's authorized adb shell. No public command endpoint. */
class EmbeddedShellProvider : ContentProvider() {
    companion object {
        @Volatile var shell: IBinder? = null
            private set
        fun ready() = shell?.isBinderAlive == true && shell?.pingBinder() == true
    }
    override fun onCreate() = true
    override fun call(method: String, arg: String?, extras: Bundle?): Bundle {
        if (Binder.getCallingUid() != 2000 && Binder.getCallingUid() != 0) throw SecurityException("Authorized shell required")
        require(method == "publish")
        val incoming = extras?.getBinder("shell") ?: error("Missing shell Binder")
        require(incoming.interfaceDescriptor == ShellUserService.DESCRIPTOR)
        shell = incoming
        incoming.linkToDeath({ if (shell === incoming) shell = null }, 0)
        return Bundle().apply { putBoolean("ready", true); putBinder("owner", Binder()) }
    }
    override fun query(uri: Uri, projection: Array<out String>?, selection: String?, selectionArgs: Array<out String>?, sortOrder: String?): Cursor? = null
    override fun getType(uri: Uri): String? = null
    override fun insert(uri: Uri, values: ContentValues?): Uri? = null
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?) = 0
    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?) = 0
}

/** Started from this APK by locally paired adb; remains a shell process, not a root process. */
object EmbeddedShellMain {
    @JvmStatic fun main(args: Array<String>) {
        require(android.os.Process.myUid() == 2000) { "ADB shell required" }
        require(args.size == 1 && args[0] == "local.cleartv.mobile")
        android.os.Looper.prepareMainLooper()
        val service = ShellUserService()
        val bundle = Bundle().apply { putBinder("shell", service) }
        val authority = "${args[0]}.embedded-shell"
        val manager = Class.forName("android.app.ActivityManager").getMethod("getService").invoke(null)
        val token = Binder()
        val acquire = manager.javaClass.getMethod("getContentProviderExternal", String::class.java,
            Int::class.javaPrimitiveType, IBinder::class.java, String::class.java).apply { isAccessible = true }
        val holder = acquire.invoke(manager, authority, 0, token, "Morph Bridge helper") ?: error("Host provider unavailable")
        val provider = holder.javaClass.getField("provider").get(holder)
        val result = try {
            if (android.os.Build.VERSION.SDK_INT >= 31) {
                val attribution = android.content.AttributionSource.Builder(2000).setPackageName("com.android.shell").build()
                val call = provider.javaClass.getMethod("call", android.content.AttributionSource::class.java,
                    String::class.java, String::class.java, String::class.java, Bundle::class.java).apply { isAccessible = true }
                call.invoke(provider, attribution, authority, "publish", null, bundle) as? Bundle
            } else {
                val call = provider.javaClass.getMethod("call", String::class.java, String::class.java,
                    String::class.java, String::class.java, String::class.java, Bundle::class.java).apply { isAccessible = true }
                call.invoke(provider, "com.android.shell", null, authority, "publish", null, bundle) as? Bundle
            }
        } finally {
            manager.javaClass.getMethod("removeContentProviderExternal", String::class.java, IBinder::class.java)
                .apply { isAccessible = true }.invoke(manager, authority, token)
        }
        check(result?.getBoolean("ready") == true) { "Helper registration failed" }
        checkNotNull(result).getBinder("owner")!!.linkToDeath({
            val data = android.os.Parcel.obtain(); val reply = android.os.Parcel.obtain()
            try {
                data.writeInterfaceToken(ShellUserService.DESCRIPTOR)
                service.transact(ShellUserService.TRANSACTION_STOP, data, reply, 0)
            } finally {
                data.recycle(); reply.recycle()
                android.os.Process.killProcess(android.os.Process.myPid())
            }
        }, 0)
        android.os.Looper.loop()
    }
}
