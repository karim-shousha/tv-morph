package tv.appbridge.phase0.rt.tv

import android.content.Context
import tv.appbridge.phase0.probe.ProbeLog
import java.util.Locale
import java.util.UUID

/**
 * Sends the AppBridge Samsung WGT from the phone to a Samsung TV over
 * SDB (port 26101, Developer Mode), then installs it with vd_appinstall.
 * Transport adapted with permission from the owner's Morph TV mobile
 * project (SdbClient); per-device Samsung certificate issuance (account
 * bound, cloud CA) is intentionally NOT reimplemented — the bundled WGT
 * carries the lab signature and the TV's verdict is reported verbatim.
 */
object SendToTv {

    fun installFile(ip: String, file: java.io.File, info: WgtPackage, status: (String) -> Unit) {
        val current = WgtPackage.inspect(file)
        check(current == info) { "ملف WGT اتغيّر. اختاره من جديد" }
        val remote = "/home/owner/share/tmp/sdk_tools/Morph-${UUID.randomUUID().toString().replace("-", "")}.wgt"
        status("الاتصال بتلفزيون سامسونج…")
        SdbClient(ip).use { tv ->
            duid(tv)
            try {
                status("رفع ${info.name}…")
                tv.push(file.readBytes(), remote) { status("رفع ملف WGT: $it%") }
                tv.timeout(120000)
                status("التلفزيون بيثبّت ${info.name}…")
                val result = tv.shell("0 vd_appinstall ${info.appId} $remote")
                check(result.contains("install completed", ignoreCase = true)) { "التلفزيون رفض التثبيت:\n${result.take(1600)}" }
                status("تم تثبيت ${info.name} بنجاح")
            } finally { try { tv.shell("0 rmfile $remote") } catch (_: Exception) { } }
        }
    }

    const val PACKAGE_ID = "AppBridge1"
    const val APP_ID = "AppBridge1.TV"
    const val ASSET_PATH = "tv/AppBridge-Samsung.wgt"

    data class Result(val ok: Boolean, val log: List<String>)

    fun send(context: Context, ip: String, onStatus: (String) -> Unit): Result {
        val log = ArrayList<String>()
        fun say(s: String) {
            log.add(s)
            onStatus(s)
            ProbeLog.report("probe" to "sendtv", "result" to "LOG", "msg" to s.take(200))
        }
        return try {
            val cleanIp = Regex("\\d{1,3}(\\.\\d{1,3}){3}").find(ip)?.value
                ?: throw IllegalArgumentException("Enter the Samsung TV IP first (or use Find TVs).")
            val ipAddr = cleanIp
            say("Reading bundled TV app…")
            val wgt = context.assets.open(ASSET_PATH).use { it.readBytes() }
            if (wgt.size < 1024 || wgt.size > 8 * 1024 * 1024) {
                throw IllegalStateException("Bundled WGT looks wrong (${wgt.size} bytes).")
            }
            say("WGT ${wgt.size} bytes. Checking Samsung Developer Mode at $ip…")
            val device: String
            SdbClient(ipAddr).use { tv -> device = duid(tv) }
            say("TV DUID ok. Uploading AppBridge TV (per-device Samsung signing is not " +
                "included; the TV decides on the lab signature)…")
            val path = "/home/owner/share/tmp/sdk_tools/AppBridge-" +
                UUID.randomUUID().toString().replace("-", "") + ".wgt"
            SdbClient(ipAddr).use { tv ->
                if (device != duid(tv)) {
                    throw IllegalStateException("The TV at this IP changed. Select your TV again.")
                }
                tv.push(wgt, path) { p -> say("Uploading… $p%") }
                say("Installing on TV…")
                val out = tv.shell("0 vd_appinstall $APP_ID $path")
                say("TV says: ${out.take(300)}")
                if (!out.lowercase(Locale.US).contains("install completed")) {
                    throw IllegalStateException("TV did not confirm install: ${out.take(300)}")
                }
                try {
                    tv.shell("0 rmfile $path")
                } catch (_: Throwable) {
                }
            }
            say("Installed on the Samsung TV.")
            ProbeLog.report("probe" to "sendtv", "result" to "INSTALLED", "ip" to ip)
            Result(true, log)
        } catch (t: Throwable) {
            val msg = t.message ?: t.javaClass.simpleName
            say("Failed: $msg")
            ProbeLog.error("sendtv", t)
            Result(false, log)
        }
    }

    private fun duid(tv: SdbClient): String {
        val value = tv.shell("0 getduid").trim()
        if (!value.matches(Regex("[A-Za-z0-9:#=+/.\\-]{4,160}"))) {
            throw IllegalStateException("Could not read the TV DUID. Check Samsung Developer Mode.")
        }
        return value
    }
}
