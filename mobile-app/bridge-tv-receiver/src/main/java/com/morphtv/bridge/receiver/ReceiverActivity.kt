package com.morphtv.bridge.receiver

import android.annotation.SuppressLint
import android.app.Activity
import android.net.ConnectivityManager
import android.os.Bundle
import android.view.KeyEvent
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import java.net.Inet4Address

/** TV receiver only. APK execution stays on the paired phone's independent display. */
class ReceiverActivity : Activity() {
    private lateinit var browser: WebView
    private var discovery: ReceiverDiscovery? = null
    private var textEntry: android.app.AlertDialog? = null
    @Volatile private var browserKeys = false
    @Volatile private var ignoreBackUntil = 0L

    @SuppressLint("SetJavaScriptEnabled", "JavascriptInterface")
    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        browser = WebView(this)
        browser.setBackgroundColor(0xFF07101E.toInt())
        browser.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(false)
            // Only our bundled page can navigate in this WebView. It consumes
            // the user's paired LAN HTTP/fMP4 endpoints, never remote HTML.
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }
        browser.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
                !request.url.toString().startsWith("file:///android_asset/")
        }
        browser.webChromeClient = WebChromeClient()
        browser.addJavascriptInterface(DeviceBridge(), "MorphDevice")
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        setContentView(browser)
        browser.loadUrl("file:///android_asset/index.html")
        browser.requestFocus()
    }

    private fun localIp(): String {
        try {
            val cm = getSystemService(ConnectivityManager::class.java)
            for(network in cm.allNetworks) {
                val caps = cm.getNetworkCapabilities(network) ?: continue
                if(caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_VPN))continue
                if(!caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI) && !caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_ETHERNET)) continue
                val address=cm.getLinkProperties(network)?.linkAddresses?.map { it.address }?.filterIsInstance<Inet4Address>()?.firstOrNull { it.isSiteLocalAddress && !it.isLoopbackAddress }
                if(address!=null)return address.hostAddress ?: continue
            }
        }catch (_: Exception) { }
        return ""
    }

    inner class DeviceBridge {
        @JavascriptInterface fun useBrowserKeys(value: Boolean) {
            browserKeys=value
            if(!value)ignoreBackUntil=android.os.SystemClock.uptimeMillis()+180
        }

        @JavascriptInterface fun bridgeTrialJson(): String = local.tvmorph.tv.BridgeTrial.status(this@ReceiverActivity,true).toString()
        @JavascriptInterface fun plusIdentityJson(): String = getSharedPreferences("morph-plus-identity",0).getString("identity","{}") ?: "{}"
        @JavascriptInterface fun savePlusIdentity(raw: String): Boolean {
            return try {
                if(raw.length>1024)return false
                val value=org.json.JSONObject(raw)
                val token=value.optString("token")
                if(!value.optString("device").matches(Regex("[A-Za-z0-9_-]{20,80}")) || (token.isNotEmpty() && !token.matches(Regex("[A-Za-z0-9_-]{32,128}"))))return false
                getSharedPreferences("morph-plus-identity",0).edit().putString("identity",value.put("scope","tv").toString()).commit()
            }catch (_: Exception) { false }
        }

        @JavascriptInterface fun editInput(id: String, value: String) {
            if(id != "inPhoneSetupCode")return
            runOnUiThread {
                if(isFinishing || textEntry?.isShowing==true)return@runOnUiThread
                val code=true
                val field=android.widget.EditText(this@ReceiverActivity).apply {
                    setSingleLine(true);setText(value)
                    inputType=if(code)android.text.InputType.TYPE_CLASS_NUMBER else android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_URI
                    filters=arrayOf(android.text.InputFilter.LengthFilter(if(code)6 else 15))
                    imeOptions=android.view.inputmethod.EditorInfo.IME_ACTION_DONE or android.view.inputmethod.EditorInfo.IME_FLAG_NO_EXTRACT_UI
                }
                var saved=false
                fun result(text:String,cancelled:Boolean){browser.evaluateJavascript("window.MorphReceiverInput&&MorphReceiverInput("+org.json.JSONObject.quote(id)+","+org.json.JSONObject.quote(text)+","+cancelled+")",null)}
                val dialog=android.app.AlertDialog.Builder(this@ReceiverActivity).setTitle(if(code)"Android code shown on your phone" else "Phone IP address").setView(field)
                    .setPositiveButton("Connect"){_,_->saved=true;(getSystemService(INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager).hideSoftInputFromWindow(field.windowToken,0);result(field.text.toString(),false)}.setNegativeButton("Cancel",null).create()
                textEntry=dialog
                dialog.setOnDismissListener{ textEntry=null;if(!saved)result(value,true) }
                dialog.setOnShowListener{field.requestFocus();field.setSelection(field.length());dialog.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE)}
                field.setOnEditorActionListener{_,action,_->if(action in listOf(android.view.inputmethod.EditorInfo.IME_ACTION_DONE,android.view.inputmethod.EditorInfo.IME_ACTION_GO,android.view.inputmethod.EditorInfo.IME_ACTION_NEXT)){dialog.getButton(android.content.DialogInterface.BUTTON_POSITIVE).performClick();true}else false}
                dialog.show()
            }
        }

        @JavascriptInterface fun localIp(): String = this@ReceiverActivity.localIp()
        @JavascriptInterface fun exit() { runOnUiThread { finish() } }
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val back=event.keyCode==KeyEvent.KEYCODE_BACK || event.keyCode==KeyEvent.KEYCODE_ESCAPE
        if(back && android.os.SystemClock.uptimeMillis()<ignoreBackUntil)return true
        if(browserKeys){
            if(back){if(event.action==KeyEvent.ACTION_DOWN && event.repeatCount==0)browser.evaluateJavascript("window.MorphBridgeLicenseBack&&MorphBridgeLicenseBack()",null);return true}
            return super.dispatchKeyEvent(event)
        }

        val code = when (event.keyCode) {
            KeyEvent.KEYCODE_DPAD_LEFT -> 37
            KeyEvent.KEYCODE_DPAD_UP -> 38
            KeyEvent.KEYCODE_DPAD_RIGHT -> 39
            KeyEvent.KEYCODE_DPAD_DOWN -> 40
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_BUTTON_A -> 13
            KeyEvent.KEYCODE_BACK, KeyEvent.KEYCODE_ESCAPE, KeyEvent.KEYCODE_BUTTON_B -> 10009
            KeyEvent.KEYCODE_CHANNEL_UP, KeyEvent.KEYCODE_PAGE_UP, KeyEvent.KEYCODE_MEDIA_REWIND -> 427
            KeyEvent.KEYCODE_CHANNEL_DOWN, KeyEvent.KEYCODE_PAGE_DOWN, KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> 428
            KeyEvent.KEYCODE_PROG_RED -> 403
            KeyEvent.KEYCODE_PROG_GREEN -> 404
            KeyEvent.KEYCODE_PROG_YELLOW -> 405
            KeyEvent.KEYCODE_PROG_BLUE, KeyEvent.KEYCODE_MENU -> 406
            else -> return super.dispatchKeyEvent(event)
        }
        if (::browser.isInitialized && event.action in listOf(KeyEvent.ACTION_DOWN, KeyEvent.ACTION_UP)) {
            val up = event.action == KeyEvent.ACTION_UP
            browser.evaluateJavascript("window.MorphReceiverKey && window.MorphReceiverKey($code,$up,${event.repeatCount > 0})", null)
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onStart() { super.onStart();discovery=ReceiverDiscovery(this,::localIp).also{it.start()} }
    override fun onStop() { discovery?.close();discovery=null;super.onStop() }
    override fun onPause() {
        if (::browser.isInitialized) {
            browser.evaluateJavascript("window.dispatchEvent(new Event('blur'))", null)
            browser.onPause()
        }
        super.onPause()
    }
    override fun onResume() { super.onResume(); if (::browser.isInitialized) browser.onResume() }
    override fun onDestroy() {
        discovery?.close()
        textEntry?.dismiss()
        if (::browser.isInitialized) { browser.removeJavascriptInterface("MorphDevice"); browser.destroy() }
        super.onDestroy()
    }
}
