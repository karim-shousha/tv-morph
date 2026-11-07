package tv.appbridge.phase0.rt.tv

import org.junit.Assert.*
import org.junit.Test
import java.math.BigInteger
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.security.KeyPairGenerator
import java.security.interfaces.RSAPublicKey
import javax.crypto.Cipher

class AdbKeyCodecTest {
    private val keys = KeyPairGenerator.getInstance("RSA").apply { initialize(2048) }.generateKeyPair()
    @Test fun encodesAndroidRsaPublicKey() {
        val key = keys.public as RSAPublicKey
        val bytes = AdbKeyCodec.publicKey(key)
        assertEquals(524, bytes.size)
        val b = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)
        assertEquals(64, b.int)
        val inverse = b.int.toLong() and 0xffffffffL
        val modulus = ByteArray(256).also { b.get(it) }
        assertEquals(key.modulus, BigInteger(1, modulus.reversedArray()))
        val rr = ByteArray(256).also { b.get(it) }
        assertEquals(BigInteger.ONE.shiftLeft(4096).mod(key.modulus), BigInteger(1, rr.reversedArray()))
        assertEquals(65537, b.int)
        val base = BigInteger.ONE.shiftLeft(32)
        assertEquals(base.subtract(BigInteger.ONE), key.modulus.multiply(BigInteger.valueOf(inverse)).mod(base))
    }
    @Test fun signsTokenWithoutHashingItTwice() {
        val token = ByteArray(20) { it.toByte() }
        val signature = AdbKeyCodec.sign(keys.private, token)
        val decoded = Cipher.getInstance("RSA/ECB/PKCS1Padding").run { init(Cipher.DECRYPT_MODE, keys.public); doFinal(signature) }
        assertEquals(35, decoded.size)
        assertArrayEquals(token, decoded.copyOfRange(15, 35))
    }
}
