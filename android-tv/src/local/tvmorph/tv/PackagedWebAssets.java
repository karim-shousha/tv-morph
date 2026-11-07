package local.tvmorph.tv;
import android.content.Context;import android.content.SharedPreferences;import android.webkit.WebView;
/** Invalidate only HTTP/resource cache on an APK upgrade; saved accounts and DOM storage remain. */
final class PackagedWebAssets {
 static String prepare(Context context,WebView web,String page){String build="unknown";try{android.content.pm.PackageInfo info=context.getPackageManager().getPackageInfo(context.getPackageName(),0);build=info.versionCode+"-"+info.lastUpdateTime;SharedPreferences p=context.getSharedPreferences("morph-web-assets",0);if(!build.equals(p.getString("build",""))){web.clearCache(true);p.edit().putString("build",build).apply();}}catch(android.content.pm.PackageManager.NameNotFoundException ignored){}return "file:///android_asset/"+page+"?build="+build;}
}
