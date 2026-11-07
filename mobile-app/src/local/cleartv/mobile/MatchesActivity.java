package local.cleartv.mobile;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONObject;

/** A full phone page. The IPTV activity/player remains intact underneath. */
public final class MatchesActivity extends Activity {
    private WebView web;
    private boolean loading;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(PhoneDesignTokens.BACKGROUND_BASE);getWindow().setNavigationBarColor(PhoneDesignTokens.BACKGROUND_BASE);getWindow().getDecorView().setSystemUiVisibility(0);
        android.content.SharedPreferences prefs = getSharedPreferences("cleartv", MODE_PRIVATE);
        boolean dark = prefs.getBoolean("appearanceChosen", false) && "dark".equals(prefs.getString("appearance", "light"));
        String language = "ar".equals(prefs.getString("language", "ar")) ? "ar" : "en";
        web = new WebView(this);
        web.setBackgroundColor(dark ? PhoneDesignTokens.BACKGROUND_BASE : PhoneDesignTokens.LIGHT_BACKGROUND_BASE);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        if (android.os.Build.VERSION.SDK_INT >= 29) { web.setForceDarkAllowed(false); web.getSettings().setForceDark(android.webkit.WebSettings.FORCE_DARK_OFF); }
        web.getSettings().setAllowFileAccess(true);
        web.addJavascriptInterface(new Bridge(), "MatchesNative");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.getUrl().toString().startsWith("file:///android_asset/ui/");
            }
        });
        setContentView(web);
        try {
            String html = new String(Network.read(getAssets().open("ui/matches-screen.html"), 128 * 1024), "UTF-8");
            html = html.replace("{{LANG}}", language).replace("{{APPEARANCE}}", dark ? "dark" : "light");
            web.loadDataWithBaseURL("file:///android_asset/ui/", html, "text/html", "UTF-8", null);
        } catch (Exception e) { finish(); }
    }
    @Override public void onBackPressed(){if(web==null){finish();return;}web.evaluateJavascript("!!(window.MorphMatches&&MorphMatches.back&&MorphMatches.back())",value->{if(!"true".equals(value))finish();});}
    private final class Bridge {
        @JavascriptInterface public void navigate(String page){if(!java.util.Arrays.asList("home","play","control","more").contains(page))return;runOnUiThread(()->{startActivity(new android.content.Intent(MatchesActivity.this,MainActivity.class).addFlags(android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT|android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("phonePage",page));finish();});}
        @JavascriptInterface public void back() { runOnUiThread(() -> onBackPressed()); }
        @JavascriptInterface public synchronized void request(String id, boolean force) {
            if (loading || id == null || !id.matches("[0-9]{1,10}")) return;
            loading = true;
            new Thread(() -> {
                String value; boolean ok;
                try { value = MatchSchedule.load(MatchesActivity.this, force).toString(); ok = true; }
                catch (Exception e) { value = JSONObject.quote("match_schedule_unavailable"); ok = false; }
                final String script = "window.matchResult(" + JSONObject.quote(id) + "," + ok + "," + value + ")";
                loading = false;
                runOnUiThread(() -> { if (!isDestroyed() && web != null) web.evaluateJavascript(script, null); });
            }, "morph-match-schedule").start();
        }
    }
    @Override protected void onDestroy() {
        if (web != null) { web.removeJavascriptInterface("MatchesNative"); web.destroy(); web = null; }
        super.onDestroy();
    }
}
