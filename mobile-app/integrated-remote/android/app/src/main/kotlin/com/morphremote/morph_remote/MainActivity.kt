package local.cleartv.mobile

import android.content.Context
import android.content.Intent
import android.app.Activity
import org.json.JSONObject
import org.json.JSONArray
import java.util.concurrent.Executors
import android.net.wifi.WifiManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class RemoteActivity : FlutterActivity() {
    private var multicastLock: WifiManager.MulticastLock? = null
    private val channelName = "morph_remote/multicast"
    private val faithWorker = Executors.newSingleThreadExecutor()

    // MethodChannel accepts plain maps/lists, not org.json containers.
    private fun channelValue(value: Any?): Any? = when(value) {
        null, JSONObject.NULL -> null
        is JSONObject -> value.keys().asSequence().associateWith { channelValue(value.opt(it)) }
        is JSONArray -> (0 until value.length()).map { channelValue(value.opt(it)) }
        else -> value
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // Shared Her feedback channel used by Tasbih and the Qibla acknowledgement.
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "her/device_feedback")
            .setMethodCallHandler { call, result ->
                try {
                    when (call.method) {
                        "vibrate" -> {
                            val duration = (call.argument<Int>("durationMs") ?: 55).toLong().coerceIn(20, 350)
                            val vibrator = if (android.os.Build.VERSION.SDK_INT >= 31)
                                getSystemService(android.os.VibratorManager::class.java).defaultVibrator
                            else @Suppress("DEPRECATION") (getSystemService(Context.VIBRATOR_SERVICE) as android.os.Vibrator)
                            if (vibrator.hasVibrator()) vibrator.vibrate(android.os.VibrationEffect.createOneShot(duration, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
                            result.success(null)
                        }
                        "tapSound" -> {
                            val tone = android.media.ToneGenerator(android.media.AudioManager.STREAM_MUSIC, 65)
                            tone.startTone(android.media.ToneGenerator.TONE_PROP_BEEP2, 55)
                            android.os.Handler(mainLooper).postDelayed({ tone.release() }, 90)
                            result.success(null)
                        }
                        else -> result.notImplemented()
                    }
                } catch (e: Exception) { result.error("FEEDBACK", e.message, null) }
            }
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "morph_tv/host")
            .setMethodCallHandler { call, result ->
                when(call.method) {
                    "settings" -> result.success(mapOf("appearance" to intent.getStringExtra("appearance"), "locale" to intent.getStringExtra("locale"), "section" to intent.getStringExtra("section"), "destination" to intent.getStringExtra("destination")))
                    "navigate" -> { val page=call.argument<String>("page"); if(page in listOf("home","play","control","design","more","matches")){setResult(Activity.RESULT_OK,Intent().putExtra("page",page));result.success(true);finish()}else result.error("PAGE","Unknown phone page",null) }
                    "close" -> { result.success(true); finish() }
                    "classicKeyboard" -> {
                        val targetIp = call.argument<String>("ip") ?: ""
                        val linkedIp = getSharedPreferences("cleartv", android.content.Context.MODE_PRIVATE).getString("tvIp", "")
                        if (targetIp != linkedIp || targetIp.isEmpty()) {
                            result.error("MORPH_LINK_REQUIRED", "Link this TV using its Morph code from Devices first.", null)
                        } else {
                            // The original host connector handles each TV platform.
                            setResult(android.app.Activity.RESULT_OK, Intent().putExtra("classicKeyboard", true))
                            result.success(true)
                            finish()
                        }
                    }

                    "morphText" -> {
                        val ip = call.argument<String>("ip") ?: ""
                        val text = call.argument<String>("text") ?: ""
                        if (text.isEmpty() || text.length > 500) {
                            result.success(false)
                        } else Thread {
                            val sent = try {
                                AndroidTv.request(ip, "/remote/text", org.json.JSONObject().put("text", text), AndroidTv.token(this, ip)).optBoolean("sent")
                            } catch (_: Exception) { false }
                            runOnUiThread { result.success(sent) }
                        }.start()
                    }
                    else -> result.notImplemented()
                }
            }
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "morph_tv/faith")
            .setMethodCallHandler { call, result ->
                when(call.method) {
                    "close" -> {
                        val page = call.argument<String>("page")
                        if(page in listOf("home", "design", "control", "play", "more")) {
                            setResult(Activity.RESULT_OK, Intent().putExtra("page", page))
                        }
                        result.success(true)
                        finish()
                    }
                    "prayer" -> {
                        val payload = JSONObject(call.arguments as? Map<*, *> ?: emptyMap<String, Any>())
                        faithWorker.execute {
                            try {
                                val response = channelValue(FaithPrayer.command(this, payload))
                                runOnUiThread { if(!isDestroyed) result.success(response) }
                            } catch(e: Exception) {
                                runOnUiThread { if(!isDestroyed) result.error("FAITH_COMMAND", e.message, null) }
                            }
                        }
                    }
                    else -> result.notImplemented()
                }
            }
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "acquire" -> {
                        try {
                            if (multicastLock == null) {
                                val wm = applicationContext.getSystemService(
                                    Context.WIFI_SERVICE) as WifiManager
                                multicastLock = wm.createMulticastLock("morph_remote_lock").apply {
                                    setReferenceCounted(false)
                                }
                            }
                            if (multicastLock?.isHeld != true) {
                                multicastLock?.acquire()
                            }
                            result.success(multicastLock?.isHeld == true)
                        } catch (e: Exception) {
                            result.error("LOCK_FAILED", e.message, null)
                        }
                    }
                    "release" -> {
                        try {
                            if (multicastLock?.isHeld == true) {
                                multicastLock?.release()
                            }
                            result.success(true)
                        } catch (e: Exception) {
                            result.error("LOCK_FAILED", e.message, null)
                        }
                    }
                    "isHeld" -> result.success(multicastLock?.isHeld == true)
                    else -> result.notImplemented()
                }
            }
    }

    override fun onDestroy() {
        faithWorker.shutdown()
        try {
            if (multicastLock?.isHeld == true) multicastLock?.release()
        } catch (_: Exception) {}
        multicastLock = null
        super.onDestroy()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if(requestCode == FaithVoicePacks.PICKER && resultCode == Activity.RESULT_OK) {
            val uri = data?.data ?: return
            faithWorker.execute {
                try { contentResolver.openInputStream(uri)?.use { FaithVoicePacks.install(this, it) } }
                catch(_: Exception) { /* The faith settings refresh reports installed state on resume. */ }
            }
        }
    }
}
