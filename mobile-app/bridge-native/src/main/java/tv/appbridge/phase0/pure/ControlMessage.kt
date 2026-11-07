package tv.appbridge.phase0.pure

/**
 * Minimal v0 control-message schema (Phase 4 draft, implemented here only so
 * the mapping/serialization logic has JVM unit tests before any TV code or
 * networking exists).
 *
 * Wire format: one flat JSON object per line, e.g.
 *   {"t":"key","k":"OK"}
 *   {"t":"pointer","x":0.512,"y":0.301}
 *
 * Deliberately hand-rolled (no org.json): this file must compile on plain JVM
 * unit tests where android.jar stubs throw.
 */
object ControlMessage {

    const val T_KEY = "key"
    const val T_POINTER = "pointer"
    const val T_SCROLL = "scroll"

    val KEYS = setOf(
        "UP", "DOWN", "LEFT", "RIGHT", "OK", "BACK", "HOME",
        "PLAY_PAUSE", "POINTER_MODE", "LONG_OK"
    )

    data class Msg(val type: String, val fields: Map<String, String>) {
        fun toJson(): String {
            val sb = StringBuilder().append("{\"t\":\"").append(esc(type)).append('"')
            for ((k, v) in fields) {
                sb.append(",\"").append(esc(k)).append("\":\"").append(esc(v)).append('"')
            }
            return sb.append('}').toString()
        }
    }

    fun key(name: String): Msg {
        require(name in KEYS) { "unknown key: $name" }
        return Msg(T_KEY, mapOf("k" to name))
    }

    /** Normalized pointer position; x,y must be in 0..1. */
    fun pointer(x: Float, y: Float): Msg {
        require(x in 0f..1f && y in 0f..1f) { "pointer out of range: $x,$y" }
        return Msg(T_POINTER, mapOf("x" to x.toString(), "y" to y.toString()))
    }

    fun scroll(dx: Float, dy: Float): Msg =
        Msg(T_SCROLL, mapOf("dx" to dx.toString(), "dy" to dy.toString()))

    /** Tiny parser for flat string-valued objects produced by [Msg.toJson]. */
    fun parse(json: String): Msg {
        val body = json.trim().removePrefix("{").removeSuffix("}")
        val map = LinkedHashMap<String, String>()
        var i = 0
        while (i < body.length) {
            val k0 = body.indexOf('"', i)
            if (k0 < 0) break
            val k1 = body.indexOf('"', k0 + 1)
            val key = unesc(body.substring(k0 + 1, k1))
            val c = body.indexOf(':', k1)
            val v0 = body.indexOf('"', c)
            val v1 = body.indexOf('"', v0 + 1)
            map[key] = unesc(body.substring(v0 + 1, v1))
            i = v1 + 1
        }
        val t = map.remove("t") ?: error("missing type field in: $json")
        return Msg(t, map)
    }

    private fun esc(s: String): String =
        s.replace("\\", "\\\\").replace("\"", "\\\"")

    private fun unesc(s: String): String {
        val sb = StringBuilder()
        var i = 0
        while (i < s.length) {
            val c = s[i]
            if (c == '\\' && i + 1 < s.length) {
                sb.append(s[i + 1])
                i += 2
            } else {
                sb.append(c)
                i++
            }
        }
        return sb.toString()
    }
}
