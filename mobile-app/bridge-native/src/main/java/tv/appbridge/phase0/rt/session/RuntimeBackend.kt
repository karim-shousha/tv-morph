package tv.appbridge.phase0.rt.session

/**
 * Privileged runtime operations. Implementations:
 *  - ShizukuBackend: executes the exact shell commands proven in Phase 0.5
 *    (settings/am/input) inside the phone via Shizuku (user-authorized).
 *  - NoopBackend: reports precisely what is missing. Never fakes success.
 */
interface RuntimeBackend {
    val name: String
    fun isAvailable(): Boolean
    fun statusLine(): String

    data class ExecResult(val code: Int, val out: String, val err: String)

    fun exec(cmd: List<String>): ExecResult
    fun createOverlayDisplay(w: Int, h: Int, dpi: Int): Boolean
    fun clearOverlayDisplay()
    fun launchOnDisplay(packageName: String, activityClass: String?, displayId: Int): ExecResult
    fun inputKey(displayId: Int, keyCode: Int): ExecResult
    fun inputTap(displayId: Int, x: Int, y: Int): ExecResult
    fun forceStop(packageName: String): ExecResult
}
