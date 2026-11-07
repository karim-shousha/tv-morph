package tv.appbridge.phase0.rt.tv

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PrivateKey
import java.security.interfaces.RSAPublicKey
import java.util.UUID

/** Phone-to-TV ADB install. The TV owner must enable debugging and approve this phone. */
object AndroidTvInstaller {
    const val ASSET = "tv/Morph-Bridge-Android-TV.apk"
    const val PACKAGE = "com.morphtv.bridge.receiver"
    private const val KEY_ALIAS = "morph_bridge_tv_adb"

    private fun identity(): SdbClient.Auth {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        if (!store.containsAlias(KEY_ALIAS)) {
            KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore").apply {
                initialize(KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_SIGN)
                    .setKeySize(2048).setDigests(KeyProperties.DIGEST_NONE)
                    .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1).build())
            }.generateKeyPair()
        }
        val privateKey = store.getKey(KEY_ALIAS, null) as PrivateKey
        val publicKey = store.getCertificate(KEY_ALIAS).publicKey as RSAPublicKey
        return object : SdbClient.Auth {
            override fun sign(token: ByteArray) = AdbKeyCodec.sign(privateKey, token)
            override fun publicKey(): ByteArray =
                (Base64.encodeToString(AdbKeyCodec.publicKey(publicKey), Base64.NO_WRAP) + " morph-bridge@android\u0000").toByteArray()
        }
    }

    fun install(context: Context, ip: String, port: Int, status: (String) -> Unit) {
        require(port in 1..65535) { "اكتب منفذ ADB صحيح" }
        val apk = context.assets.open(ASSET).use { it.readBytes() }
        require(apk.size in 1024..32_000_000) { "ملف استقبال Android TV غير صالح" }
        status("الاتصال بالتلفزيون… وافق على رسالة السماح على الشاشة")
        val remote = "/data/local/tmp/morph-bridge-${UUID.randomUUID()}.apk"
        try {
            SdbClient(ip, port, identity()).use { tv ->
                status("جاري رفع نسخة Android TV…")
                tv.push(apk, remote) { status("رفع التطبيق: $it%") }
                tv.timeout(90000)
                try {
                    status("جاري التثبيت على التلفزيون…")
                    val installed = tv.shell("pm install -r $remote")
                    check(installed.lineSequence().any { it.trim() == "Success" }) { "التلفزيون رفض التثبيت: ${installed.take(500)}" }
                    status("تم التثبيت. جاري فتح Morph Bridge…")
                    val opened = tv.shell("am start -W -n $PACKAGE/.ReceiverActivity")
                    check(!opened.contains("Error:") && !opened.contains("Exception")) { "التثبيت نجح لكن فتح التطبيق تعذر: ${opened.take(300)}" }
                } finally { try { tv.shell("rm -f $remote") } catch (_: Exception) { } }
            }
        } catch (e: Exception) {
            throw IllegalStateException("${e.message}\nفعّل Network/USB debugging على التلفزيون، ووافق على اتصال الموبايل. الربط العادي بالريموت وحده لا يثبت تطبيقات.", e)
        }
    }
}
