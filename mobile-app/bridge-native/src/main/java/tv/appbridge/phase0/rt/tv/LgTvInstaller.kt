package tv.appbridge.phase0.rt.tv

import android.content.Context
import com.jcraft.jsch.ChannelExec
import com.jcraft.jsch.ChannelSftp
import com.jcraft.jsch.JSch
import com.jcraft.jsch.Session
import com.jcraft.jsch.SftpProgressMonitor
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

/** LG Developer Mode's SSH/SFTP + public Luna install API, like ares-install. */
object LgTvInstaller {
    const val ASSET = "tv/Morph-Bridge-LG.ipk"
    private const val APP = "tv.appbridge.webos"
    fun install(context: Context, ip: String, passphrase: String, status: (String) -> Unit) {
        require(passphrase.isNotBlank()) { "اكتب Passphrase اللي في تطبيق Developer Mode على LG" }
        status("قراءة مفتاح LG… فعّل Key Server على التلفزيون")
        val http = URL("http://$ip:9991/webos_rsa").openConnection() as HttpURLConnection
        http.connectTimeout = 4000; http.readTimeout = 5000
        val key = try {
            check(http.responseCode == 200) { "تعذر قراءة مفتاح LG. فعّل Key Server" }
            http.inputStream.use { input ->
                val out = java.io.ByteArrayOutputStream(); val buffer = ByteArray(4096)
                while (true) { val n = input.read(buffer); if (n < 0) break; check(out.size()+n<=32768); out.write(buffer,0,n) }
                out.toByteArray()
            }
        } finally { http.disconnect() }
        val jsch = JSch()
        val secret = passphrase.toByteArray()
        try { jsch.addIdentity("Morph-LG", key, null, secret) }
        finally { key.fill(0); secret.fill(0) }
        val known = context.getSharedPreferences("morph_lg_hosts", Context.MODE_PRIVATE)
        val saved = known.getString(ip, null)
        if (saved != null) jsch.setKnownHosts(saved.byteInputStream())
        val session = jsch.getSession("prisoner", ip, 9922).apply {
            setConfig("StrictHostKeyChecking", if (saved == null) "no" else "yes")
            setConfig("PreferredAuthentications", "publickey")
            // LG's developer Dropbear versions can still advertise RSA/SHA-1.
            setConfig("server_host_key", JSch.getConfig("server_host_key") + ",ssh-rsa")
            setConfig("PubkeyAcceptedAlgorithms", JSch.getConfig("PubkeyAcceptedAlgorithms") + ",ssh-rsa")
            timeout = 120000
        }
        val remote = "/media/developer/temp/morph-${UUID.randomUUID()}.ipk"
        try {
            status("الاتصال الآمن بتلفزيون LG…")
            session.connect(12000)
            if (saved == null) known.edit().putString(ip,"[$ip]:9922 ${session.hostKey.type} ${session.hostKey.key}\n").apply()
            val sftp = session.openChannel("sftp") as ChannelSftp
            try {
                sftp.connect(5000)
                try { sftp.stat("/media/developer/temp") } catch (_: Exception) { sftp.mkdir("/media/developer/temp") }
                val length = context.assets.open(ASSET).use { it.available().toLong() }.coerceAtLeast(1)
                var sent = 0L; var last = -1
                context.assets.open(ASSET).use { input -> sftp.put(input, remote, object : SftpProgressMonitor {
                    override fun init(op: Int, src: String?, dest: String?, max: Long) {}
                    override fun count(bytes: Long): Boolean { sent += bytes; val percent=(sent*100/length).toInt().coerceAtMost(100); if(percent!=last){last=percent;status("رفع تطبيق LG: $percent%")};return true }
                    override fun end() {}
                }) }
            } finally { sftp.disconnect() }
            status("جاري تثبيت Morph Bridge على LG…")
            val data = "{\"id\":\"$APP\",\"ipkUrl\":\"$remote\",\"subscribe\":true}"
            exec(session, "/usr/bin/luna-send-pub -i luna://com.webos.appInstallService/dev/install '$data'", true)
            status("تم التثبيت. جاري فتح التطبيق…")
            exec(session, "/usr/bin/luna-send-pub -n 1 luna://com.webos.applicationManager/launch '{\"id\":\"$APP\"}'", false)
        } finally {
            if (session.isConnected) try { exec(session, "rm -f $remote", false) } catch (_: Exception) { }
            session.disconnect(); jsch.removeAllIdentity()
        }
    }
    private fun exec(session: Session, command: String, installing: Boolean): String {
        val channel = session.openChannel("exec") as ChannelExec
        try {
            channel.setCommand(command)
            val stream = channel.inputStream; val errors = channel.errStream
            channel.connect(5000)
            val out = java.io.ByteArrayOutputStream(); val buffer = ByteArray(4096)
            val end = System.currentTimeMillis() + if (installing) 120000 else 15000
            while (System.currentTimeMillis() < end) {
                for (input in listOfNotNull(stream, errors)) while (input.available() > 0) {
                    val n = input.read(buffer,0,minOf(buffer.size,input.available())); if (n <= 0) break
                    check(out.size()+n<=65536) { "رد LG أكبر من المسموح" };out.write(buffer,0,n)
                }
                val text = out.toString("UTF-8")
                check(!Regex("\"returnValue\"\\s*:\\s*false|\"state\"\\s*:\\s*\"[^\"]*FAILED", RegexOption.IGNORE_CASE).containsMatchIn(text)) { "LG رفض العملية: ${text.take(800)}" }
                if (installing && Regex("\"state\"\\s*:\\s*\"(?:installed|SUCCESS)\"", RegexOption.IGNORE_CASE).containsMatchIn(text)) return text
                if (channel.isClosed) {
                    check(!installing && channel.exitStatus == 0) { "LG لم يؤكد نجاح العملية: ${text.take(800)}" }
                    return text
                }
                Thread.sleep(50)
            }
            error("انتهت مهلة رد تلفزيون LG")
        } finally { channel.disconnect() }
    }
}
