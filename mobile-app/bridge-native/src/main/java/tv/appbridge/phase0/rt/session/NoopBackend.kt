package tv.appbridge.phase0.rt.session

import tv.appbridge.phase0.probe.ProbeLog

/**
 * Used when no privileged backend is available. Every operation reports the
 * missing prerequisite instead of pretending to work.
 */
class NoopBackend(private val reason: String) : RuntimeBackend {
    override val name = "none"
    override fun isAvailable() = false
    override fun statusLine() = "No privileged backend: $reason"

    private fun denied(op: String): RuntimeBackend.ExecResult {
        ProbeLog.report("probe" to "backend", "result" to "UNAVAILABLE", "op" to op, "reason" to reason)
        return RuntimeBackend.ExecResult(-1, "", "UNAVAILABLE: $reason")
    }

    override fun exec(cmd: List<String>) = denied("exec")
    override fun createOverlayDisplay(w: Int, h: Int, dpi: Int) = false
    override fun clearOverlayDisplay() {}
    override fun launchOnDisplay(packageName: String, activityClass: String?, displayId: Int) =
        denied("launch")

    override fun inputKey(displayId: Int, keyCode: Int) = denied("input")
    override fun inputTap(displayId: Int, x: Int, y: Int) = denied("input")
    override fun forceStop(packageName: String) = denied("force-stop")
}
