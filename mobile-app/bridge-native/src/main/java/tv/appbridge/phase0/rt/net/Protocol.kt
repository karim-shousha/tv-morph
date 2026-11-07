package tv.appbridge.phase0.rt.net

/**
 * Wire protocol v1 (phone <-> TV), JSON objects, UTF-8, one per WebSocket
 * text message. Implemented for real in WsServer; parsed/covered by JVM
 * unit tests in ProtocolTest.
 *
 * Phone -> TV:  hello, paired, apps, status, error, stream
 * TV -> phone:  pair, launch, key, pointer, scroll, heartbeat, bye
 */
object Protocol {

    const val PORT_WS = 8187
    const val PORT_HTTP = 8188

    // ---- message builders (also used by tests) ----
    fun hello(name: String, code: String?): String =
        obj("t" to "hello", "name" to name, "pairRequired" to (code != null).toString())

    fun paired(token: String): String = obj("t" to "paired", "token" to token)
    fun apps(list: List<Pair<String, String>>, icons: Map<String, String> = emptyMap()): String {
        val items = list.joinToString(",") { (label, pkg) ->
            val icon = icons[pkg]?.let { ",\"icon\":\"${esc(it)}\"" } ?: ""
            "{\"label\":\"${esc(label)}\",\"pkg\":\"${esc(pkg)}\"$icon}"
        }
        return "{\"t\":\"apps\",\"list\":[$items]}"
    }

    fun status(running: String?, display: Int, streaming: Boolean, detail: String, theme: String = "dark", phoneSetup: String = "idle"): String =
        obj("t" to "status", "running" to (running ?: ""), "display" to display.toString(),
            "streaming" to streaming.toString(), "detail" to detail, "theme" to theme, "phoneSetup" to phoneSetup, "phoneSetupVersion" to "1")

    fun error(code: String, message: String): String =
        obj("t" to "error", "code" to code, "message" to message)

    fun stream(url: String, width: Int, height: Int): String =
        obj("t" to "stream", "url" to url, "w" to width.toString(), "h" to height.toString())

    // ---- minimal parser for flat + apps messages ----
    data class Msg(val type: String, val fields: Map<String, String>)

    fun parse(json: String): Msg {
        val t = Regex("\"t\"\\s*:\\s*\"([^\"]+)\"").find(json)?.groupValues?.get(1)
            ?: error("no type in: $json")
        val fields = Regex("\"([A-Za-z0-9_]+)\"\\s*:\\s*\"([^\"]*)\"")
            .findAll(json).associate { it.groupValues[1] to it.groupValues[2] }
        return Msg(t, fields)
    }

    private fun obj(vararg kv: Pair<String, String>): String =
        kv.joinToString(",", "{", "}") { (k, v) -> "\"${esc(k)}\":\"${esc(v)}\"" }

    private fun esc(s: String): String = s.replace("\\", "\\\\").replace("\"", "\\\"")
}
