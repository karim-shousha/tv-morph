package tv.appbridge.phase0.rt.pure

/** Scope protection to the bridged app/display; never close the phone browser. */
object ExternalPagePolicy {
    enum class Action { NONE, MOVE_SELECTED_APP, CLOSE_EXTERNAL_PAGE }
    private val browsers = setOf("com.android.chrome", "com.chrome.beta", "com.chrome.dev",
        "com.sec.android.app.sbrowser", "com.sec.android.app.sbrowser.beta", "org.mozilla.firefox", "com.microsoft.emmx")

    fun decide(targetDisplay: Int, selected: String, display: Int, top: String?, base: String?,
               visible: Boolean, blockPages: Boolean, className: String = "", keepOnTv: Boolean = true): Action {
        if (targetDisplay <= 0 || selected.isEmpty() || !visible || top == null) return Action.NONE
        if (keepOnTv && display == 0 && base == selected) return Action.MOVE_SELECTED_APP
        if (display == targetDisplay && blockPages && top != selected &&
            (top in browsers || className.contains("CustomTabActivity"))) return Action.CLOSE_EXTERNAL_PAGE
        return Action.NONE
    }
}
