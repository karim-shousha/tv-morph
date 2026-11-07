package tv.appbridge.phase0.rt.session

import android.content.Context
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import io.github.muntashirakon.adb.AbsAdbConnectionManager
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PrivateKey
import java.security.cert.Certificate
import java.util.concurrent.TimeUnit

/** Bootstrap only: after startup all runtime traffic uses our shell Binder. */
object EmbeddedAdb {
    @Volatile var pairingPort = 0
    @Volatile var connectionPort = 0
    private val lock = Any()
    fun isPaired(context: Context) = context.getSharedPreferences("embedded_adb", Context.MODE_PRIVATE).getInt("identity_version", 0) == 1 && context.getSharedPreferences("embedded_adb", Context.MODE_PRIVATE).getBoolean("paired", false)
    private class Connection(context: Context) : AbsAdbConnectionManager() {
        private val identity = EmbeddedAdbIdentity.load(context)
        init {
            setApi(Build.VERSION.SDK_INT)
            setHostAddress("127.0.0.1")
            setTimeout(12, TimeUnit.SECONDS)
        }
        override fun getPrivateKey(): PrivateKey = identity.privateKey
        override fun getCertificate(): Certificate = identity.certificate
        override fun getDeviceName() = "Morph Bridge"
    }

    fun pair(context: Context, port: Int, enteredCode: String) = synchronized(lock) {
        val code=enteredCode.map { ch -> Character.digit(ch,10).let { if(it in 0..9) ('0'.code+it).toChar() else ch } }.joinToString("")
        require(Build.VERSION.SDK_INT >= 30) { "التجهيز المدمج محتاج أندرويد 11 أو أحدث" }
        require(port in 1..65535 && code.matches(Regex("[0-9]{6}"))) { "اكتب منفذ الاقتران وكود الاقتران المكوّن من ٦ أرقام" }
        Connection(context).use { adb ->
            check(adb.pair("127.0.0.1", port, code)) { "تعذر الاقتران. افتح كود جديد وجرب تاني" }
        }
        context.getSharedPreferences("embedded_adb", Context.MODE_PRIVATE).edit().putBoolean("paired", true).putInt("identity_version", 1).apply()
    }
    fun pairAndStart(context: Context, pairPort: Int, code: String, connectPort: Int) {
        pair(context, pairPort, code)
        start(context, connectPort)
    }

    fun start(context: Context, port: Int) = synchronized(lock) {
        if (EmbeddedShellProvider.ready()) return@synchronized
        check(isPaired(context)) { "ابدأ بخطوة الاقتران بكود أولًا، ثم شغّل المساعد" }
        require(port != pairingPort || port == 0) { "منفذ الاتصال مختلف عن منفذ الاقتران. خده من صفحة التصحيح اللاسلكي الرئيسية" }
        require(port in 1..65535) { "لم يظهر منفذ الاتصال بعد. ارجع لصفحة التصحيح اللاسلكي" }
        Connection(context).use { adb ->
            check(adb.connect("127.0.0.1", port)) { "تعذر الاتصال بالمساعد. تأكد إن التصحيح اللاسلكي مفتوح" }
            val apk = context.applicationInfo.sourceDir
            val pkg = context.packageName
            // All values originate from Android PackageManager, not user input.
            fun quoted(value: String) = "'" + value.replace("'", "'\\''") + "'"
            val command = "CLASSPATH=${quoted(apk)} nohup app_process / tv.appbridge.phase0.rt.session.EmbeddedShellMain ${quoted(pkg)} >/data/local/tmp/morph-helper.log 2>&1 </dev/null & sleep 1"
            adb.openStream("shell:$command").use { stream ->
                // libadb signals normal remote shell closure with IOException rather than EOF.
                // The Binder acknowledgement below decides whether startup actually succeeded.
                try { stream.openInputStream().readBytes() }
                catch (error: java.io.IOException) { if (!stream.isClosed) throw error }
            }
            val end = System.currentTimeMillis() + 10000
            while (!EmbeddedShellProvider.ready() && System.currentTimeMillis() < end) Thread.sleep(100)
            check(EmbeddedShellProvider.ready()) { "الاقتران نجح لكن تشغيل المساعد تعذر. ارجع للتطبيق وحاول تشغيله مرة تانية" }
        }
        context.getSharedPreferences("embedded_adb", Context.MODE_PRIVATE).edit().putInt("port", port).apply()
    }
}
