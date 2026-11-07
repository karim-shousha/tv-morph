package tv.appbridge.phase0.rt.video

import tv.appbridge.phase0.rt.session.ShizukuBackend
import tv.appbridge.phase0.rt.session.SessionService
import tv.appbridge.phase0.probe.ProbeLog
import java.io.DataInputStream
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.TimeUnit

/** Captures ONLY a newly created display. No MediaProjection or display-0 fallback. */
class ShellStreamSource(private val backend: ShizukuBackend) : RuntimeVideoSource {
    override var width = 1280
        private set
    override var height = 720
        private set
    @Volatile override var displayId = -1
        private set
    @Volatile override var isRunning = false
        private set
    @Volatile var error: String? = null
        private set
    @Volatile private var socket: java.io.InputStream? = null
    @Volatile private var initBytes: ByteArray? = null
    private class Sink {
        val queue = ArrayBlockingQueue<ByteArray>(120)
        @Volatile var waitingForKey = true
        @Volatile var closed = false
    }
    private val sinks = CopyOnWriteArrayList<Sink>()
    private var worker: Thread? = null
    private val frameLock = Any()
    private val latestGop = ArrayList<ByteArray>()
    private var gopBytes = 0
    @Volatile var frames = 0
        private set

    fun start() {
        check(!isRunning)
        val result = backend.startRuntime()
        check(result.code == 0) { result.err }
        isRunning = true
        worker = Thread({ readStream() }, "AppBridgeIndependentVideo").apply { start() }
    }

    private fun readStream() {
        try {
            // Transfer an already-open descriptor from shell; apps cannot connect
            // to a shell-domain abstract socket on production SELinux policies.
            val s = android.os.ParcelFileDescriptor.AutoCloseInputStream(backend.openRuntimeSocket())
            socket = s
            val input = DataInputStream(s)
            check(input.readInt() == 0x68323634) { "Expected H.264" }
            var sps: ByteArray? = null
            var pps: ByteArray? = null
            var seq = 1
            var origin = -1L
            val timeline = VideoSampleTimeline()
            while (isRunning) {
                val high = input.readInt()
                if (high < 0) {
                    width = input.readInt(); height = input.readInt()
                    val display = backend.runtimeDisplay()
                    val firstDisplay = displayId < 0
                    displayId = display.out.toIntOrNull() ?: -1
                    check(displayId > 0) { "No independent display: ${display.err}" }
                    if (firstDisplay) {
                        backend.exec(listOf("wm", "set-ignore-orientation-request", "-d", displayId.toString(), "true"))
                        backend.exec(listOf("wm", "user-rotation", "-d", displayId.toString(), "lock", "0"))
                    }
                    SessionService.manager?.adoptDisplay(displayId)
                    ProbeLog.report("probe" to "independent_stream", "result" to "DISPLAY_READY", "displayId" to displayId)
                    continue
                }
                val flags = (high.toLong() shl 32) or (input.readInt().toLong() and 0xffffffffL)
                val size = input.readInt()
                check(size in 1..8_000_000) { "Invalid video packet size" }
                val bytes = ByteArray(size); input.readFully(bytes)
                val units = Fmp4Muxer.splitAnnexB(bytes)
                if ((flags and (1L shl 62)) != 0L) {
                    units.forEach {
                        when (it[0].toInt() and 31) { 7 -> sps = it; 8 -> pps = it }
                    }
                    if (sps != null && pps != null) synchronized(frameLock) {
                        timeline.reset()
                        initBytes = Fmp4Muxer.initSegment(sps!!, pps!!, width, height)
                        latestGop.clear(); gopBytes = 0
                        for (sink in sinks) {
                            sink.waitingForKey = true
                            if (!sink.queue.offer(initBytes!!)) sink.closed = true
                        }
                    }
                    continue
                }
                if (initBytes == null) continue
                val key = (flags and (1L shl 61)) != 0L
                val pts = flags and ((1L shl 61) - 1)
                if (origin < 0) origin = pts
                val time = (pts - origin) * 90 / 1000
                val sample = timeline.push(units, time, key) ?: continue
                val fragment = Fmp4Muxer.fragment(seq++, sample)
                frames++
                if (frames <= 3 || frames % 60 == 0) ProbeLog.report("probe" to "independent_frames", "result" to "ENCODED", "frames" to frames, "key" to key, "bytes" to size)
                synchronized(frameLock) {
                    if (sample.isIdr) { latestGop.clear(); gopBytes = 0 }
                    if ((sample.isIdr || latestGop.isNotEmpty()) && latestGop.size < 110 && gopBytes + fragment.size < 8_000_000) {
                        latestGop.add(fragment); gopBytes += fragment.size
                    }
                    for (sink in sinks) {
                        if (sink.waitingForKey && !sample.isIdr) continue
                        sink.waitingForKey = false
                        if (!sink.queue.offer(fragment)) sink.closed = true
                    }
                }
            }
        } catch (t: Throwable) {
            if (isRunning) { error = t.message; ProbeLog.error("independent_stream", t) }
        } finally {
            isRunning = false
            displayId = -1
            try { socket?.close() } catch (_: Throwable) {}
            sinks.forEach { it.closed = true }
            try { backend.stopRuntime() } catch (_: Throwable) {}
        }
    }

    override fun stop() {
        isRunning = false
        try { socket?.close() } catch (_: Throwable) {}
        try { backend.stopRuntime() } catch (_: Throwable) {}
        if (Thread.currentThread() != worker) worker?.join(3000)
    }

    override fun run(init: (ByteArray) -> Unit, frag: (ByteArray) -> Unit, stop: () -> Boolean) {
        val sink = Sink()
        try {
            while (isRunning && initBytes == null && !stop()) Thread.sleep(50)
            synchronized(frameLock) {
                val header = initBytes ?: return
                // Queue before registering to preserve init/GOP/live ordering.
                sink.queue.offer(header)
                latestGop.forEach { sink.queue.offer(it) }
                sink.waitingForKey = latestGop.isEmpty()
                sinks.add(sink)
            }
            while (isRunning && !sink.closed && !stop()) {
                sink.queue.poll(500, TimeUnit.MILLISECONDS)?.let { frag(it) }
            }
        } finally { sinks.remove(sink) }
    }
}
