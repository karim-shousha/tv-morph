package tv.appbridge.phase0.rt.ui

/** A saved pairing is not proof that the runtime helper is running. */
object PhoneSetupState {
    fun initial(ready: Boolean, paired: Boolean, restored: Int? = null): Int {
        if (ready) return 5
        if (paired) return 4
        return (restored ?: 1).coerceIn(1, 3)
    }
    fun normalizeCode(value: String): String = value.trim().map { char ->
        Character.digit(char, 10).let { digit -> if (digit in 0..9) ('0'.code + digit).toChar() else char }
    }.joinToString("")
}
