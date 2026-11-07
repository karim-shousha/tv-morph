package tv.appbridge.phase0.rt.tv

import java.math.BigInteger
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.security.PrivateKey
import java.security.Signature
import java.security.interfaces.RSAPublicKey

/** ADB AUTH uses a pre-hashed SHA-1 token and Android's little-endian RSA format. */
object AdbKeyCodec {
    private val sha1DigestInfo = byteArrayOf(0x30,0x21,0x30,0x09,0x06,0x05,0x2b,0x0e,0x03,0x02,0x1a,0x05,0x00,0x04,0x14)
    fun sign(key: PrivateKey, token: ByteArray): ByteArray {
        require(token.size == 20) { "Invalid ADB authentication token" }
        return Signature.getInstance("NONEwithRSA").run {
            initSign(key); update(sha1DigestInfo + token); sign()
        }
    }
    fun publicKey(key: RSAPublicKey): ByteArray {
        require(key.modulus.bitLength() == 2048) { "ADB needs a 2048-bit RSA identity" }
        val two32 = BigInteger.ONE.shiftLeft(32)
        val n0inv = two32.subtract(key.modulus.mod(two32).modInverse(two32)).toInt()
        fun little(value: BigInteger): ByteArray {
            val raw = value.toByteArray().reversedArray()
            return ByteArray(256).also { raw.copyInto(it, endIndex = minOf(raw.size, it.size)) }
        }
        return ByteBuffer.allocate(524).order(ByteOrder.LITTLE_ENDIAN)
            .putInt(64).putInt(n0inv).put(little(key.modulus))
            .put(little(BigInteger.ONE.shiftLeft(4096).mod(key.modulus)))
            .putInt(key.publicExponent.toInt()).array()
    }
}
