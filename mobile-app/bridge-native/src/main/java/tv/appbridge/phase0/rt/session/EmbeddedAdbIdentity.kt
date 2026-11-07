package tv.appbridge.phase0.rt.session

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.AtomicFile
import java.io.ByteArrayInputStream
import java.math.BigInteger
import java.security.*
import java.security.cert.Certificate
import java.security.cert.CertificateFactory
import java.security.spec.PKCS8EncodedKeySpec
import java.text.SimpleDateFormat
import java.util.*
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.security.auth.x500.X500Principal

/** Conscrypt's ADB client requires RSA operations unavailable on opaque keystore keys.
 * Keep the TLS identity encrypted at rest with an Android Keystore AES key.
 * noBackupFilesDir prevents restoring an identity without its device-bound wrapping key. */
internal object EmbeddedAdbIdentity {
    data class Identity(val privateKey: PrivateKey, val certificate: Certificate)
    private var cached: Identity? = null
    @Synchronized fun load(context: Context): Identity {
        cached?.let { return it }
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        val alias = "morph_adb_identity_wrap_v1"
        if (!store.containsAlias(alias)) KeyGenerator.getInstance("AES", "AndroidKeyStore").apply {
            init(KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setKeySize(256).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
        }.generateKey()
        val wrappingKey = store.getKey(alias, null) as SecretKey
        val file = AtomicFile(java.io.File(context.noBackupFilesDir, "bridge-adb-identity-v1"))
        val identity = if (file.baseFile.exists()) {
            val sealed = file.openRead().use { it.readBytes() }
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, wrappingKey, GCMParameterSpec(128, sealed.copyOfRange(0,12)))
            val plain = cipher.doFinal(sealed.copyOfRange(12,sealed.size))
            try {
                java.io.DataInputStream(ByteArrayInputStream(plain)).use { input ->
                    val key = ByteArray(input.readInt().also { require(it in 1..8192) }); input.readFully(key)
                    try { Identity(KeyFactory.getInstance("RSA").generatePrivate(PKCS8EncodedKeySpec(key)),
                        CertificateFactory.getInstance("X.509").generateCertificate(input)) }
                    finally { key.fill(0) }
                }
            } finally { plain.fill(0) }
        } else {
            val pair = KeyPairGenerator.getInstance("RSA").apply { initialize(2048) }.generateKeyPair()
            val certificate = certificate(pair)
            val plain = java.io.ByteArrayOutputStream().apply {
                java.io.DataOutputStream(this).use { output ->
                    val key = pair.private.encoded
                    try { output.writeInt(key.size); output.write(key); output.write(certificate.encoded) }
                    finally { key.fill(0) }
                }
            }.toByteArray()
            try {
                val cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, wrappingKey)
                val sealed = cipher.iv + cipher.doFinal(plain)
                val output = file.startWrite()
                try { output.write(sealed); file.finishWrite(output) }
                catch (error: Throwable) { file.failWrite(output); throw error }
            } finally { plain.fill(0) }
            Identity(pair.private, certificate)
        }
        cached = identity
        return identity
    }
    private fun der(tag: Int, bytes: ByteArray): ByteArray {
        val length = if (bytes.size < 128) byteArrayOf(bytes.size.toByte()) else {
            val raw = BigInteger.valueOf(bytes.size.toLong()).toByteArray().dropWhile { it == 0.toByte() }.toByteArray()
            byteArrayOf((0x80 or raw.size).toByte()) + raw
        }
        return byteArrayOf(tag.toByte()) + length + bytes
    }
    private fun certificate(pair: KeyPair): Certificate {
        // Minimal X.509 certificate; the pairing protocol authenticates this identity with its code.
        val algorithm = byteArrayOf(0x30,0x0d,0x06,0x09,0x2a,0x86.toByte(),0x48,0x86.toByte(),0xf7.toByte(),0x0d,0x01,0x01,0x0b,0x05,0x00)
        val name = X500Principal("CN=Morph Bridge").encoded
        val format = SimpleDateFormat("yyyyMMddHHmmss'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }
        fun date(millis: Long) = der(0x18, format.format(Date(millis)).toByteArray(Charsets.US_ASCII))
        val now = System.currentTimeMillis()
        val validity = der(0x30, date(now-86400000) + date(now+3650L*86400000))
        val serial = der(0x02, BigInteger(128, SecureRandom()).add(BigInteger.ONE).toByteArray())
        val tbs = der(0x30, serial + algorithm + name + validity + name + pair.public.encoded)
        val signature = Signature.getInstance("SHA256withRSA").apply { initSign(pair.private); update(tbs) }.sign()
        val encoded = der(0x30, tbs + algorithm + der(0x03, byteArrayOf(0) + signature))
        return CertificateFactory.getInstance("X.509").generateCertificate(ByteArrayInputStream(encoded))
    }
}
