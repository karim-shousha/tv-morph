package tv.appbridge.phase0.rt.video

import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer

/**
 * Minimal fragmented-MP4 muxer for a single H.264 track (pure Kotlin, no
 * Android dependency — JVM unit-tested). Produces an init segment
 * (ftyp+moov, avcC from the encoder's SPS/PPS) plus one moof+mdat fragment
 * per encoded access unit. This is what the TV's MSE SourceBuffer will
 * consume (where the TV supports MSE/fMP4 — verified per-device later).
 */
object Fmp4Muxer {

    const val TIMESCALE = 90000

    fun initSegment(sps: ByteArray, pps: ByteArray, width: Int, height: Int): ByteArray {
        val out = ByteArrayOutputStream()
        out.write(box("ftyp", bytes("isom"), int(0), bytes("isom")))
        val avcC = avcCBox(sps, pps)
        val avc1 = box("avc1",
            ByteArray(6) + short(1) + ByteArray(16) +
                short(width) + short(height) +
                int(0x00480000) + int(0x00480000) + int(0) + short(1) +
                ByteArray(32) + short(0x0018) + short(-1) + avcC
        )
        val stsd = box("stsd", int(0) + int(1) + avc1)
        val stts = box("stts", int(0) + int(0))
        val stsc = box("stsc", int(0) + int(0))
        val stsz = box("stsz", int(0) + int(0) + int(0))
        val stco = box("stco", int(0) + int(0))
        val stbl = box("stbl", stsd + stts + stsc + stsz + stco)
        val dref = box("dref", int(0) + int(1) + box("url ", int(1)))
        val dinf = box("dinf", dref)
        val vmhd = box("vmhd", int(1) + short(0) + short(0) + short(0) + short(0))
        val minf = box("minf", vmhd + dinf + stbl)
        val hdlr = box("hdlr", int(0) + int(0) + bytes("vide") + ByteArray(12) + bytes("Video") + byte(0))
        val mdhd = box("mdhd", int(0) + int(0) + int(0) + int(TIMESCALE) + int(0) + short(0x55C4) + short(0))
        val mdia = box("mdia", mdhd + hdlr + minf)
        val tkhd = box("tkhd", int(7) + int(0) + int(0) + int(1) + int(0) + int(0) +
            int(0) + int(0) + short(0) + short(0) + short(0) + short(0) +
            int(0x00010000) + int(0) + int(0) + int(0) + int(0x00010000) + int(0) +
            int(0) + int(0) + int(0x40000000) + int(width shl 16) + int(height shl 16))
        val trak = box("trak", tkhd + mdia)
        val trex = box("trex", int(0) + int(1) + int(1) + int(0) + int(0) + int(0))
        val mvex = box("mvex", trex)
        val mvhd = box("mvhd", int(0) + int(0) + int(0) + int(TIMESCALE) + int(0) +
            int(0x00010000) + short(0x0100) + short(0) + ByteArray(8) +
            int(0x00010000) + int(0) + int(0) + int(0) + int(0x00010000) + int(0) +
            int(0) + int(0) + int(0x40000000) + ByteArray(24) + int(2))
        val moov = box("moov", mvhd + trak + mvex)
        out.write(moov)
        return out.toByteArray()
    }

    data class Sample(val nalUnits: List<ByteArray>, val pts90: Long, val duration90: Int, val isIdr: Boolean)

    /** One fragment per sample; returns moof+mdat bytes. */
    fun fragment(sequence: Int, s: Sample): ByteArray {
        val mdatPayload = ByteArrayOutputStream()
        for (nal in s.nalUnits) {
            mdatPayload.write(int(nal.size))
            mdatPayload.write(nal)
        }
        val mdatBytes = mdatPayload.toByteArray()
        return fragmentPayload(sequence, mdatBytes, s.pts90, s.duration90, s.isIdr)
    }

    fun audioFragment(sequence: Int, aac: ByteArray, pts48: Long): ByteArray =
        fragmentPayload(sequence, aac, pts48, 1024, true)

    private fun fragmentPayload(sequence: Int, mdatBytes: ByteArray, pts: Long, duration: Int, key: Boolean): ByteArray {
        val flags = if (key) 0x02000000 else 0x01010000
        fun trun(offset: Int) = box("trun", int(0x00000305) + int(1) +
            int(offset) + int(flags) + int(duration) + int(mdatBytes.size))
        val tfhd = box("tfhd", int(0x020000) + int(1))
        val tfdt = box("tfdt", int(0x01000000) + long(pts))
        val mfhd = box("mfhd", int(0) + int(sequence))
        val provisional = box("moof", mfhd + box("traf", tfhd + tfdt + trun(0)))
        val moof = box("moof", mfhd + box("traf", tfhd + tfdt + trun(provisional.size + 8)))
        val out = ByteArrayOutputStream()
        out.write(moof)
        out.write(box("mdat", mdatBytes))
        return out.toByteArray()
    }

    /** Separate AAC-LC MSE stream. The selected UID's audio is the only source. */
    fun audioInit(config: ByteArray): ByteArray {
        fun descriptor(tag: Int, payload: ByteArray): ByteArray {
            require(payload.size < 128)
            return byte(tag) + byte(payload.size) + payload
        }
        val decoder = descriptor(4, byte(0x40) + byte(0x15) + ByteArray(3) + int(128000) + int(128000) + descriptor(5, config))
        val esds = box("esds", int(0) + descriptor(3, short(1) + byte(0) + decoder + descriptor(6, byte(2))))
        val mp4a = box("mp4a", ByteArray(6) + short(1) + ByteArray(8) + short(2) + short(16) + short(0) + short(0) + int(48000 shl 16) + esds)
        val stbl = box("stbl", box("stsd", int(0) + int(1) + mp4a) +
            box("stts", int(0) + int(0)) + box("stsc", int(0) + int(0)) +
            box("stsz", int(0) + int(0) + int(0)) + box("stco", int(0) + int(0)))
        val dinf = box("dinf", box("dref", int(0) + int(1) + box("url ", int(1))))
        val minf = box("minf", box("smhd", int(0) + short(0) + short(0)) + dinf + stbl)
        val mdhd = box("mdhd", int(0) + int(0) + int(0) + int(48000) + int(0) + short(0x55C4) + short(0))
        val hdlr = box("hdlr", int(0) + int(0) + bytes("soun") + ByteArray(12) + bytes("Audio") + byte(0))
        val mdia = box("mdia", mdhd + hdlr + minf)
        val matrix = int(0x10000) + int(0) + int(0) + int(0) + int(0x10000) + int(0) + int(0) + int(0) + int(0x40000000)
        val tkhd = box("tkhd", int(7) + int(0) + int(0) + int(1) + int(0) + int(0) + ByteArray(8) +
            short(0) + short(0) + short(0x0100) + short(0) + matrix + int(0) + int(0))
        val mvhd = box("mvhd", int(0) + int(0) + int(0) + int(48000) + int(0) + int(0x10000) + short(0x0100) +
            short(0) + ByteArray(8) + matrix + ByteArray(24) + int(2))
        val trex = box("trex", int(0) + int(1) + int(1) + int(1024) + int(0) + int(0))
        return box("ftyp", bytes("isom"), int(0), bytes("isom")) + box("moov", mvhd + box("trak", tkhd + mdia) + box("mvex", trex))
    }

    /** Split Annex-B stream into raw NAL units (no start codes). */
    fun splitAnnexB(data: ByteArray): List<ByteArray> {
        val starts = ArrayList<Pair<Int, Int>>()
        var i = 0
        while (i < data.size - 3) {
            if (data[i] == 0.toByte() && data[i + 1] == 0.toByte() &&
                (data[i + 2] == 1.toByte() || (i + 3 < data.size && data[i + 2] == 0.toByte() && data[i + 3] == 1.toByte()))
            ) {
                val len = if (data[i + 2] == 1.toByte()) 3 else 4
                starts.add(i to len)
                i += len
            } else {
                i++
            }
        }
        if (starts.isEmpty()) return if (data.isEmpty()) emptyList() else listOf(data)
        val out = ArrayList<ByteArray>()
        for (k in starts.indices) {
            val (pos, len) = starts[k]
            val end = if (k + 1 < starts.size) starts[k + 1].first else data.size
            out.add(data.copyOfRange(pos + len, end))
        }
        return out
    }

    // ---- box helpers ----
    private fun box(type: String, vararg payloads: ByteArray): ByteArray {
        val total = 8 + payloads.sumOf { it.size }
        val bb = ByteBuffer.allocate(total)
        bb.putInt(total)
        bb.put(type.toByteArray(Charsets.US_ASCII))
        payloads.forEach { bb.put(it) }
        return bb.array()
    }

    private fun avcCBox(spsIn: ByteArray, ppsIn: ByteArray): ByteArray {
        // Encoder csd buffers sometimes carry Annex-B start codes; avcC
        // must hold raw NALs only.
        val sps = stripStartCode(spsIn)
        val pps = stripStartCode(ppsIn)
        val out = ByteArrayOutputStream()
        out.write(1)
        out.write(if (sps.size > 3) sps[1].toInt() and 0xFF else 0x42)
        out.write(if (sps.size > 3) sps[2].toInt() and 0xFF else 0x00)
        out.write(if (sps.size > 3) sps[3].toInt() and 0xFF else 0x1F)
        out.write(0xFF)
        out.write(0xE1)
        out.write(sps.size shr 8 and 0xFF)
        out.write(sps.size and 0xFF)
        out.write(sps)
        out.write(1)
        out.write(pps.size shr 8 and 0xFF)
        out.write(pps.size and 0xFF)
        out.write(pps)
        return box("avcC", out.toByteArray())
    }

    private fun stripStartCode(nal: ByteArray): ByteArray {
        var i = 0
        while (i + 2 < nal.size && nal[i] == 0.toByte() && nal[i + 1] == 0.toByte()) {
            if (nal[i + 2] == 1.toByte()) {
                i += 3
                break
            }
            if (i + 3 < nal.size && nal[i + 2] == 0.toByte() && nal[i + 3] == 1.toByte()) {
                i += 4
                break
            }
            break
        }
        return if (i > 0) nal.copyOfRange(i, nal.size) else nal
    }

    private fun int(v: Int) = ByteBuffer.allocate(4).putInt(v).array()
    private fun short(v: Int) = ByteBuffer.allocate(2).putShort(v.toShort()).array()
    private fun long(v: Long) = ByteBuffer.allocate(8).putLong(v).array()
    private fun byte(v: Byte) = byteArrayOf(v)
    private fun byte(v: Int) = byteArrayOf(v.toByte())
    private fun bytes(s: String) = s.toByteArray(Charsets.US_ASCII)
}
