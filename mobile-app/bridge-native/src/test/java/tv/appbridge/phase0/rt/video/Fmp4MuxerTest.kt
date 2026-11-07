package tv.appbridge.phase0.rt.video

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.nio.ByteBuffer

class Fmp4MuxerTest {

    private val sps = byteArrayOf(0x67, 0x42, 0x00, 0x1F, 0x01, 0x02, 0x03)
    private val pps = byteArrayOf(0x68, 0xCE.toByte(), 0x06, 0xE2.toByte())

    private fun boxes(data: ByteArray): List<Pair<String, Int>> {
        val out = ArrayList<Pair<String, Int>>()
        var i = 0
        while (i + 8 <= data.size) {
            val size = ByteBuffer.wrap(data, i, 4).int
            if (size < 8 || i + size > data.size) break
            out.add(String(data, i + 4, 4, Charsets.US_ASCII) to size)
            i += size
        }
        return out
    }

    @Test
    fun initSegment_hasFtypAndMoovWithAvcC() {
        val init = Fmp4Muxer.initSegment(sps, pps, 1280, 720)
        val top = boxes(init)
        assertEquals("ftyp", top[0].first)
        assertEquals("moov", top[1].first)
        val ftypMajor = String(init, 8, 4, Charsets.US_ASCII)
        assertEquals("isom", ftypMajor)
        // moov must embed avcC containing our SPS bytes
        val moov = init.copyOfRange(top[0].second, top[0].second + top[1].second)
        val hex = moov.joinToString("") { "%02x".format(it) }
        assertTrue("avcC box missing", hex.contains("61766343"))
        assertTrue("SPS missing from init", hex.contains("6742001f"))
        assertTrue("PPS missing from init", hex.contains("68ce06e2"))
        // avcC header prefix must be intact: version + profile/compat/level.
        // (hex index of "avcC" / 2 = byte offset of 'a'; content starts +4.)
        val ai = hex.indexOf("61766343") / 2 + 4
        val avcc = moov.copyOfRange(ai, ai + 16)
        assertEquals(1, avcc[0].toInt())
        assertEquals(0x42.toByte(), avcc[1])
        assertEquals(0x00.toByte(), avcc[2])
        assertEquals(0x1F.toByte(), avcc[3])
        assertEquals(0xFF.toByte(), avcc[4])
        assertEquals(0xE1.toByte(), avcc[5])
    }

    @Test
    fun initSegment_stripsAnnexBStartCodesFromCsd() {
        val spsSc = byteArrayOf(0, 0, 0, 1) + sps
        val ppsSc = byteArrayOf(0, 0, 1) + pps
        val init = Fmp4Muxer.initSegment(spsSc, ppsSc, 1280, 720)
        val top = boxes(init)
        val moov = init.copyOfRange(top[0].second, top[0].second + top[1].second)
        val hex = moov.joinToString("") { "%02x".format(it) }
        // SPS stored raw (no 00000001 prefix inside avcC).
        assertTrue("SPS must be stored without start code", hex.contains("e100076742001f"))
    }

    @Test
    fun fragment_sequenceAndMdatRoundtrip() {
        val nals = listOf(
            byteArrayOf(0x65, 0x11, 0x22), // IDR slice
            byteArrayOf(0x41, 0x33)        // non-IDR slice
        )
        val f1 = Fmp4Muxer.fragment(7, Fmp4Muxer.Sample(nals, 0, 3000, true))
        val top = boxes(f1)
        assertEquals("moof", top[0].first)
        assertEquals("mdat", top[1].first)
        val marker = "trun".toByteArray()
        val trunType = f1.indices.first { i -> i + 4 <= f1.size && f1.copyOfRange(i, i + 4).contentEquals(marker) }
        val dataOffset = ByteBuffer.wrap(f1, trunType + 12, 4).int
        assertEquals("trun must point to the first mdat byte", top[0].second + 8, dataOffset)
        assertEquals("trun has exactly the fields declared by its flags", 32, ByteBuffer.wrap(f1, trunType - 4, 4).int)
        // mdat payload: length-prefixed NALs
        val mdat = f1.copyOfRange(top[0].second + 8, f1.size)
        val bb = ByteBuffer.wrap(mdat)
        assertEquals(3, bb.int)
        assertEquals(0x65.toByte(), bb.get())
        bb.get(); bb.get()
        assertEquals(2, bb.int)
        assertEquals(0x41.toByte(), bb.get())
        // second fragment keeps sequence caller-side; size grows sanely
        val f2 = Fmp4Muxer.fragment(8, Fmp4Muxer.Sample(nals, 3000, 3000, false))
        assertTrue(f2.size == f1.size)
        val tfdtType = f2.indices.first { i -> i + 4 <= f2.size && String(f2, i, 4, Charsets.US_ASCII) == "tfdt" }
        assertEquals("64-bit decode time requires tfdt version 1 in the high byte", 0x01000000,
            ByteBuffer.wrap(f2, tfdtType + 4, 4).int)
        assertEquals(3000L, ByteBuffer.wrap(f2, tfdtType + 8, 8).long)
    }

    @Test
    fun splitAnnexB_threeAndFourByteCodes() {
        val data = byteArrayOf(
            0, 0, 0, 1, 0x67, 0x42,
            0, 0, 1, 0x68, 0xCE.toByte(),
            0, 0, 0, 1, 0x65, 0x11, 0x22
        )
        val nals = Fmp4Muxer.splitAnnexB(data)
        assertEquals(3, nals.size)
        assertEquals(0x67.toByte(), nals[0][0])
        assertEquals(0x68.toByte(), nals[1][0])
        assertEquals(0x65.toByte(), nals[2][0])
        assertEquals(3, nals[2].size)
    }

    @Test
    fun splitAnnexB_emptyAndGarbage() {
        assertTrue(Fmp4Muxer.splitAnnexB(ByteArray(0)).isEmpty())
        val one = Fmp4Muxer.splitAnnexB(byteArrayOf(1, 2, 3))
        assertEquals(1, one.size)
    }
}
