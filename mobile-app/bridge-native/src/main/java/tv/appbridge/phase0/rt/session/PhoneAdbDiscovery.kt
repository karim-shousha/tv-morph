package tv.appbridge.phase0.rt.session

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.Handler
import android.os.Looper
import java.net.NetworkInterface

/** Only accept advertisements belonging to this phone, never a nearby Android TV. */
object PhoneAdbDiscovery {
    private val handler = Handler(Looper.getMainLooper())
    private val listeners = ArrayList<NsdManager.DiscoveryListener>()
    private val observers = LinkedHashSet<() -> Unit>()
    private var generation=0
    private val persistent = LinkedHashSet<() -> Unit>()
    private val services = HashMap<String, Pair<Boolean, Int>>()
    private var expiration: Runnable? = null
    private fun expireLater(nsd: NsdManager) {
        expiration?.let { handler.removeCallbacks(it) }
        expiration = Runnable {
            if (persistent.isNotEmpty()) { expireLater(nsd); return@Runnable }
            generation++
            for (listener in listeners) try { nsd.stopServiceDiscovery(listener) } catch (_: Exception) {}
            listeners.clear(); observers.clear(); services.clear()
            EmbeddedAdb.pairingPort = 0; EmbeddedAdb.connectionPort = 0
        }.also { handler.postDelayed(it, 120000) }
    }
    fun start(context: Context, keepAlive: Boolean = false, changed: () -> Unit = {}): AutoCloseable {
        handler.post {
            observers.add(changed)
            if (keepAlive) persistent.add(changed)
            val nsd = context.applicationContext.getSystemService(NsdManager::class.java)
            expireLater(nsd)
            changed()
            if (listeners.isNotEmpty()) return@post
            val batch=++generation
            val addresses = NetworkInterface.getNetworkInterfaces().toList().flatMap { it.inetAddresses.toList() }.map { it.address.toList() }.toSet()
            for ((service, pairing) in listOf("_adb-tls-pairing._tcp." to true, "_adb-tls-connect._tcp." to false)) {
                val listener = object : NsdManager.DiscoveryListener {
                    override fun onDiscoveryStarted(type: String) {}
                    override fun onDiscoveryStopped(type: String) {}
                    override fun onStartDiscoveryFailed(type: String, error: Int) {}
                    override fun onStopDiscoveryFailed(type: String, error: Int) {}
                    override fun onServiceLost(info: NsdServiceInfo) {
                        handler.post {
                            if (batch != generation) return@post
                            val lost = services.remove(service + info.serviceName) ?: return@post
                            if (lost.first && EmbeddedAdb.pairingPort == lost.second) EmbeddedAdb.pairingPort = 0
                            if (!lost.first && EmbeddedAdb.connectionPort == lost.second) EmbeddedAdb.connectionPort = 0
                            observers.toList().forEach { it() }
                        }
                    }
                    override fun onServiceFound(info: NsdServiceInfo) {
                        @Suppress("DEPRECATION")
                        nsd.resolveService(info, object : NsdManager.ResolveListener {
                            override fun onResolveFailed(info: NsdServiceInfo, error: Int) {}
                            override fun onServiceResolved(resolved: NsdServiceInfo) {
                                @Suppress("DEPRECATION")
                                val local = resolved.host?.address?.toList() in addresses
                                if (!local || resolved.port !in 1..65535) return
                                handler.post {
                                    if (batch != generation) return@post
                                    services[service + info.serviceName] = pairing to resolved.port
                                    if (pairing) EmbeddedAdb.pairingPort = resolved.port else EmbeddedAdb.connectionPort = resolved.port
                                    observers.toList().forEach { it() }
                                }
                            }
                        })
                    }
                }
                listeners.add(listener)
                try { nsd.discoverServices(service, NsdManager.PROTOCOL_DNS_SD, listener) } catch (_: Exception) {}
            }

        }
        return AutoCloseable { handler.post {
            observers.remove(changed); persistent.remove(changed)
            if(observers.isEmpty()){
                expiration?.let { handler.removeCallbacks(it) }; expiration = null
                generation++
                val nsd=context.applicationContext.getSystemService(NsdManager::class.java)
                for(listener in listeners)try{nsd.stopServiceDiscovery(listener)}catch(_:Exception){}
                listeners.clear(); services.clear()
                EmbeddedAdb.pairingPort = 0; EmbeddedAdb.connectionPort = 0
            }
        } }
    }
}
