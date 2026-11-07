package tv.appbridge.phase0.rt.ui

/** Shared semantic colors; every screen and dialog uses the same selected theme. */
data class HostPalette(val background: Int, val surface: Int, val foreground: Int, val muted: Int,
    val border: Int, val accent: Int, val accentEnd: Int, val link: Int, val soft: Int,
    val success: Int, val danger: Int, val dangerSoft: Int, val glow: Int) {
    companion object {
        val LIGHT = HostPalette(0xFFF2F5FF.toInt(), -1, 0xFF14263E.toInt(), 0xFF566B84.toInt(),
            0xFFD8E1EF.toInt(), 0xFF0878E8.toInt(), 0xFF0866CC.toInt(), 0xFF0765C4.toInt(),
            0xFFE6F0FF.toInt(), 0xFF09734F.toInt(), 0xFFB4233B.toInt(), 0xFFFFE9ED.toInt(), 0xFFE9F0FF.toInt())
        val DARK = HostPalette(0xFF0C0E19.toInt(), 0xFF171A2A.toInt(), 0xFFF5F4FF.toInt(), 0xFFACADC3.toInt(),
            0xFF2B2D42.toInt(), 0xFF875BFF.toInt(), 0xFF7044EE.toInt(), 0xFFC3A6FF.toInt(),
            0xFF2A2241.toInt(), 0xFF83DCB4.toInt(), 0xFFFFB3BA.toInt(), 0xFF382331.toInt(), 0xFF151126.toInt())
        fun isLight(choice: String, systemDark: Boolean) = tv.appbridge.phase0.rt.pure.ThemeChoice.resolve(choice, systemDark) == "light"
    }
}
