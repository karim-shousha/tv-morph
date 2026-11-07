package tv.appbridge.phase0.rt.video

import tv.appbridge.phase0.rt.net.HttpVideoServer
import tv.appbridge.phase0.rt.session.ShizukuBackend
import tv.appbridge.phase0.probe.ProbeLog
import java.io.DataInputStream
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.TimeUnit

/** UID-filtered playback capture with loopback-only routing (no phone speaker). */
class ShellAudioSource(private val backend: ShizukuBackend, private val uid: Int) : HttpVideoServer.Source {
    override val width = 0
    override val height = 0
    @Volatile var running = false
        private set
    @Volatile var error: String? = null
        private set
    @Volatile private var initBytes: ByteArray? = null
    @Volatile private var input: java.io.InputStream? = null
    private var worker: Thread? = null
    private val sinks = CopyOnWriteArrayList<ArrayBlockingQueue<ByteArray>>()

    fun start() {
        val r = backend.startAudio(uid)
        check(r.code == 0) { r.err }
        running = true
        worker = Thread({ receive() }, "AppBridgeSelectedAudio").apply { start() }
    }

    private fun receive() {
        try {
            val stream = android.os.ParcelFileDescriptor.AutoCloseInputStream(backend.openRuntimeSocket(audio = true))
            input = stream
            val reader = DataInputStream(stream)
            check(reader.readInt() == 0x00616163) { "Selected app audio capture unavailable" }
            var origin = -1L
            var seq = 1
            while (running) {
                val flags = reader.readLong()
                val size = reader.readInt()
                check(size in 1..100000) { "Invalid AAC packet" }
                val bytes = ByteArray(size); reader.readFully(bytes)
                if ((flags and (1L shl 62)) != 0L) {
                    initBytes = Fmp4Muxer.audioInit(bytes)
                    ProbeLog.report("probe" to "selected_audio", "result" to "AAC_READY", "uid" to uid)
                    continue
                }
                if (initBytes == null) continue
                val pts = flags and ((1L shl 61) - 1)
                if (origin < 0) origin = pts
                val fragment = Fmp4Muxer.audioFragment(seq++, bytes, (pts - origin) * 48 / 1000)
                for (queue in sinks) if (!queue.offer(fragment)) sinks.remove(queue)
            }
        } catch (t: Throwable) {
            if (running) { error = t.message; ProbeLog.error("selected_audio", t) }
        } finally {
            running = false
            try { input?.close() } catch (_: Throwable) {}
            try { backend.stopAudio() } catch (_: Throwable) {}
        }
    }

    fun stop() {
        running = false
        try { input?.close() } catch (_: Throwable) {}
        try { backend.stopAudio() } catch (_: Throwable) {}
        if (Thread.currentThread() != worker) worker?.join(3000)
    }

    override fun run(init: (ByteArray) -> Unit, frag: (ByteArray) -> Unit, stop: () -> Boolean) {
        val queue = ArrayBlockingQueue<ByteArray>(180)
        try {
            val deadline = System.currentTimeMillis() + 10000
            while (running && initBytes == null && !stop() && System.currentTimeMillis() < deadline) Thread.sleep(30)
            init(initBytes ?: return)
            sinks.add(queue)
            while (running && sinks.contains(queue) && !stop()) queue.poll(300, TimeUnit.MILLISECONDS)?.let { frag(it) }
        } finally { sinks.remove(queue) }
    }
}
