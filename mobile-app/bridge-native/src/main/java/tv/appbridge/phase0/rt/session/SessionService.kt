package tv.appbridge.phase0.rt.session

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.IBinder
import tv.appbridge.phase0.rt.net.HttpVideoServer
import tv.appbridge.phase0.rt.net.Protocol
import tv.appbridge.phase0.rt.net.WsServer
import tv.appbridge.phase0.probe.ProbeLog

/**
 * App-scoped session holder: foreground service (dataSync) hosting the
 * WebSocket control server + HTTP status/video server. Started on demand
 * from the host UI; survives activity navigation. Stopped explicitly.
 */
class SessionService : Service() {

    companion object {
        @Volatile var manager: SessionManager? = null
        @Volatile var ws: WsServer? = null
        @Volatile var http: HttpVideoServer? = null
        @Volatile var streamSource: tv.appbridge.phase0.rt.video.RuntimeVideoSource? = null
        @Volatile var audioSource: tv.appbridge.phase0.rt.video.ShellAudioSource? = null

        fun ensure(context: android.content.Context): SessionManager {
            var m = manager
            if (m == null) {
                m = SessionManager(context.applicationContext)
                manager = m
            }
            return m
        }

        fun setVideoSource(s: HttpVideoServer.Source?) {
            http?.source = s
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        val m = ensure(this)
        val ar = getSharedPreferences("cleartv", MODE_PRIVATE).getString("language", "ar") == "ar"
        try {
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(
                NotificationChannel("session", "Morph Bridge", NotificationManager.IMPORTANCE_LOW)
            )
            startForeground(
                4711,
                Notification.Builder(this, "session")
                    .setContentTitle("Morph TV · Bridge")
                    .setContentText(if(ar) "خدمة الاتصال بالتلفزيون جاهزة" else "TV connection service ready")
                    .setSmallIcon(android.R.drawable.ic_menu_info_details)
                    .setContentIntent(android.app.PendingIntent.getActivity(this,4712,Intent(this,tv.appbridge.phase0.rt.ui.HostActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT),android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE))
                    .addAction(android.app.Notification.Action.Builder(null,if(ar) "إيقاف Bridge" else "Stop Bridge",android.app.PendingIntent.getService(this,4713,Intent(this,SessionService::class.java).putExtra("stop",true),android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE)).build())
                    .build(),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            )
        } catch (t: Throwable) {
            ProbeLog.error("session_fgs", t)
            stopSelf()
            return
        }
        if (ws == null) {
            val server = WsServer(Protocol.PORT_WS, object : WsServer.Listener {
                override fun onMessage(text: String, reply: (String) -> Unit) {
                    val resp = m.handleMessage(text)
                    if (resp != null) reply(resp)
                }

                override fun onConnected() {
                    m.onWsConnected { msg -> ws?.push(msg) }
                }

                override fun onDisconnected() = m.onWsDisconnected()
            })
            server.start()
            ws = server
        }
        if (http == null) {
            val server = HttpVideoServer(Protocol.PORT_HTTP, { m.statusJson() }, { m.discoveryFor(it) })
            server.start()
            http = server
        }
        ProbeLog.report("probe" to "session", "result" to "SERVICE_UP")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.getBooleanExtra("stop", false) == true) {
            shutdown()
            stopSelf()
            return START_NOT_STICKY
        }
        return START_STICKY
    }

    private fun shutdown() {
        TvPhoneSetup.cancel()
        try { manager?.stopStream() } catch (_: Throwable) {}
        try { ws?.push(Protocol.error("bye", "session stopping")) } catch (_: Throwable) {}
        try { ws?.stop() } catch (_: Throwable) {}
        try { http?.stop() } catch (_: Throwable) {}
        ws = null
        http = null
        try { manager?.releaseDisplay() } catch (_: Throwable) {}
        ProbeLog.report("probe" to "session", "result" to "SERVICE_DOWN")
    }

    override fun onDestroy() {
        shutdown()
        super.onDestroy()
    }
}
