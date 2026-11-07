package local.tvmorph.tv;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.net.Inet4Address;
import java.net.NetworkInterface;
import java.util.Collections;

/** Built-in TV endpoint for the independent Bridge display running on the phone. */
public final class BridgeReceiverActivity extends Activity {
    static volatile BridgeReceiverActivity active;
    private WebView browser;
    private BridgeReceiverDiscovery discovery;
    private android.app.AlertDialog textEntry;
    private boolean receiverForeground;
    private final android.os.Handler accessHandler=new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable accessCheck=()->BridgeAccess.require(this,this::scheduleAccess,()->{
        if(!receiverForeground)return;startActivity(new android.content.Intent(this,TvActivity.class).addFlags(android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT|android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("bridgePlus",true));finish();
    });
    private void scheduleAccess(){if(!receiverForeground)return;long left=BridgeAccess.status(this,false).optLong("remainingMs");accessHandler.postDelayed(accessCheck,left>0?Math.min(60000,left):300000);}

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);overridePendingTransition(0,0);networkContext=getApplicationContext();
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        browser = new WebView(this);
        browser.setBackgroundColor(0xff07101e);
        browser.setVisibility(android.view.View.INVISIBLE);
        browser.getSettings().setJavaScriptEnabled(true);
        browser.getSettings().setDomStorageEnabled(true);
        browser.getSettings().setMediaPlaybackRequiresUserGesture(false);
        browser.getSettings().setUseWideViewPort(true);
        browser.getSettings().setLoadWithOverviewMode(true);
        browser.getSettings().setSupportZoom(false);
        // Only bundled HTML may navigate; its paired phone serves LAN media.
        browser.getSettings().setAllowUniversalAccessFromFileURLs(true);
        browser.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        browser.setWebViewClient(new WebViewClient() {
            // Show the fitted Bridge page only after its local artwork is committed.
            @Override public void onPageFinished(WebView view, String url) {
                view.postVisualStateCallback(1, new WebView.VisualStateCallback() {
                    @Override public void onComplete(long requestId) {
                        if (!isFinishing() && browser == view) view.setVisibility(android.view.View.VISIBLE);
                    }
                });
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.getUrl().toString().startsWith("file:///android_asset/tv/bridge-receiver/");
            }
        });
        browser.setWebChromeClient(new android.webkit.WebChromeClient());
        browser.addJavascriptInterface(new DeviceBridge(), "MorphDevice");
        setContentView(browser);
        PageFirstFrame.awaitVisible(this,browser);
        browser.loadUrl("file:///android_asset/tv/bridge-receiver/index.html");
        browser.requestFocus();
    }

    private static android.content.Context networkContext;
    static String localIp() {
        try {
            android.net.ConnectivityManager cm=(android.net.ConnectivityManager)networkContext.getSystemService(CONNECTIVITY_SERVICE);
            for(android.net.Network network:cm.getAllNetworks()) {
                android.net.NetworkCapabilities caps=cm.getNetworkCapabilities(network);
                if(caps==null||caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_VPN)||(!caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI)&&!caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_ETHERNET)))continue;
                android.net.LinkProperties links=cm.getLinkProperties(network);
                if(links!=null)for(android.net.LinkAddress link:links.getLinkAddresses()) {
                    java.net.InetAddress address=link.getAddress();
                    if(address instanceof Inet4Address&&address.isSiteLocalAddress()&&!address.isLoopbackAddress())return address.getHostAddress();
                }
            }
        }catch(Exception ignored){}
        try {
            for (NetworkInterface network : Collections.list(NetworkInterface.getNetworkInterfaces()))
                if(network.isUp()&&!network.isLoopback())for (java.net.InetAddress address : Collections.list(network.getInetAddresses()))
                    if (address instanceof Inet4Address && !address.isLoopbackAddress() && !address.isLinkLocalAddress())
                        return address.getHostAddress();
        } catch (Exception ignored) {}
        return "";
    }

    private volatile String bridgePlusState="unknown";
    private final class DeviceBridge {
        @JavascriptInterface public String billingJson(){try{org.json.JSONObject result=BridgeTrial.status(BridgeReceiverActivity.this,false);result.put("plus",bridgePlusState);return result.toString();}catch(Exception e){return "{}";}}
        @JavascriptInterface public String launcherSettings() { try{return UiSettings.get(BridgeReceiverActivity.this).toString();}catch(Exception e){return "{}";} }
        @JavascriptInterface public String localIp() { return BridgeReceiverActivity.localIp(); }
        @JavascriptInterface public void exit() { runOnUiThread(() -> finish()); }
        @JavascriptInterface public void editInput(String id,String value) {
            if(!"inPhoneSetupCode".equals(id))return;
            runOnUiThread(()->{
                if(isFinishing()||textEntry!=null&&textEntry.isShowing())return;
                android.widget.EditText field=new android.widget.EditText(BridgeReceiverActivity.this);
                boolean code=true;
                field.setSingleLine(true);field.setText(value);
                field.setInputType(code?android.text.InputType.TYPE_CLASS_NUMBER:android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_VARIATION_URI);
                field.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(code?6:15)});
                field.setImeOptions(android.view.inputmethod.EditorInfo.IME_ACTION_DONE|android.view.inputmethod.EditorInfo.IME_FLAG_NO_EXTRACT_UI|android.view.inputmethod.EditorInfo.IME_FLAG_NO_FULLSCREEN);
                final boolean[] saved={false};
                textEntry=new android.app.AlertDialog.Builder(BridgeReceiverActivity.this)
                    .setTitle(code?UiSettings.text(BridgeReceiverActivity.this,"كود أندرويد الظاهر على الموبايل","Android code shown on your phone"):UiSettings.text(BridgeReceiverActivity.this,"عنوان IP الموبايل","Phone IP address"))
                    .setView(field).setPositiveButton(UiSettings.text(BridgeReceiverActivity.this,"اتصال","Connect"),(dialog,which)->{
                        saved[0]=true;((android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE)).hideSoftInputFromWindow(field.getWindowToken(),0);inputResult(id,field.getText().toString(),false);
                    }).setNegativeButton(UiSettings.text(BridgeReceiverActivity.this,"إلغاء","Cancel"),null).create();
                textEntry.setOnDismissListener(dialog->{textEntry=null;if(!saved[0])inputResult(id,value,true);});
                textEntry.setOnShowListener(dialog->{field.requestFocus();field.setSelection(field.length());textEntry.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE|WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);((android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE)).showSoftInput(field,android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);});
                field.setOnEditorActionListener((view,action,event)->{if((action==android.view.inputmethod.EditorInfo.IME_ACTION_DONE||action==android.view.inputmethod.EditorInfo.IME_ACTION_GO||action==android.view.inputmethod.EditorInfo.IME_ACTION_NEXT||(event!=null&&event.getKeyCode()==KeyEvent.KEYCODE_ENTER&&event.getAction()==KeyEvent.ACTION_DOWN))&&textEntry!=null){textEntry.getButton(android.content.DialogInterface.BUTTON_POSITIVE).performClick();return true;}return false;});
                textEntry.show();
            });
        }
    }
    private void inputResult(String id,String value,boolean cancelled){if(browser!=null)browser.evaluateJavascript("window.MorphReceiverInput&&window.MorphReceiverInput("+org.json.JSONObject.quote(id)+","+org.json.JSONObject.quote(value)+","+cancelled+")",null);}

    @Override protected void onStart() {
        super.onStart();receiverForeground=true;
        discovery = new BridgeReceiverDiscovery(this);
        discovery.start();
        scheduleAccess();
    }
    @Override protected void onStop() {
        receiverForeground=false;
        accessHandler.removeCallbacks(accessCheck);
        if (discovery != null) discovery.close();
        discovery = null;
        super.onStop();
    }
    @Override public void onBackPressed() {
        if (textEntry != null && textEntry.isShowing()) { textEntry.dismiss(); return; }
        if (browser == null) { finish(); return; }
        browser.evaluateJavascript("(function(){if(window.MorphReceiverBack){MorphReceiverBack();return true;}return false;})()", handled -> {
            if (!"true".equals(handled) && !isFinishing()) finish();
        });
    }
    void key(String key) {
        if ("RETURN".equals(key) || "BACK".equals(key)) { onBackPressed(); return; }
        if ("HOME".equals(key)) { finish(); return; }
        int code;
        switch (key) {
            case "UP": code=38; break; case "DOWN": code=40; break;
            case "LEFT": code=37; break; case "RIGHT": code=39; break;
            case "ENTER": case "OK": code=13; break;
            default: return;
        }
        if (browser != null) browser.evaluateJavascript("if(window.MorphReceiverKey){MorphReceiverKey("+code+",false,false);MorphReceiverKey("+code+",true,false);}",null);
    }
    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        if(textEntry!=null&&textEntry.isShowing())return super.dispatchKeyEvent(event);
        int nativeCode=event.getKeyCode();
        if(nativeCode==KeyEvent.KEYCODE_BACK||nativeCode==KeyEvent.KEYCODE_ESCAPE||nativeCode==KeyEvent.KEYCODE_BUTTON_B){
            if(event.getAction()==KeyEvent.ACTION_UP&&!event.isCanceled())onBackPressed();
            return true;
        }
        int code;
        switch (nativeCode) {
            case KeyEvent.KEYCODE_DPAD_LEFT: code=37; break;
            case KeyEvent.KEYCODE_DPAD_UP: code=38; break;
            case KeyEvent.KEYCODE_DPAD_RIGHT: code=39; break;
            case KeyEvent.KEYCODE_DPAD_DOWN: code=40; break;
            case KeyEvent.KEYCODE_DPAD_CENTER: case KeyEvent.KEYCODE_ENTER: case KeyEvent.KEYCODE_BUTTON_A: code=13; break;
            case KeyEvent.KEYCODE_CHANNEL_UP: case KeyEvent.KEYCODE_PAGE_UP: case KeyEvent.KEYCODE_MEDIA_REWIND: code=427; break;
            case KeyEvent.KEYCODE_CHANNEL_DOWN: case KeyEvent.KEYCODE_PAGE_DOWN: case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD: code=428; break;
            case KeyEvent.KEYCODE_PROG_RED: code=403; break;
            case KeyEvent.KEYCODE_PROG_GREEN: code=404; break;
            case KeyEvent.KEYCODE_PROG_YELLOW: code=405; break;
            case KeyEvent.KEYCODE_PROG_BLUE: case KeyEvent.KEYCODE_MENU: code=406; break;
            default: return super.dispatchKeyEvent(event);
        }
        if (browser != null && (event.getAction()==KeyEvent.ACTION_DOWN || event.getAction()==KeyEvent.ACTION_UP)) {
            browser.evaluateJavascript("window.MorphReceiverKey&&window.MorphReceiverKey("+code+","+(event.getAction()==KeyEvent.ACTION_UP)+","+(event.getRepeatCount()>0)+")",null);
            return true;
        }
        return super.dispatchKeyEvent(event);
    }
 @Override public void finish(){super.finish();overridePendingTransition(0,0);}
    @Override protected void onPause() {
        if(active==this)active=null;
        if(browser!=null){browser.evaluateJavascript("window.dispatchEvent(new Event('blur'))",null);browser.onPause();}
        super.onPause();
    }
    @Override protected void onResume(){super.onResume();active=this;new Thread(()->{try{boolean token=!new org.json.JSONObject(PlusIdentity.read(this)).optString("token").isEmpty();bridgePlusState=PlusAccess.verified(this)?"active":token?"unknown":"inactive";}catch(Exception ignored){bridgePlusState="unknown";}},"bridge-plus-status").start();if(browser!=null)browser.onResume();}
    @Override protected void onDestroy(){if(active==this)active=null;if(textEntry!=null){textEntry.setOnDismissListener(null);textEntry.dismiss();textEntry=null;}if(browser!=null){browser.removeJavascriptInterface("MorphDevice");browser.destroy();browser=null;}super.onDestroy();}
}
