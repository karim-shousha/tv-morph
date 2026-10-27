package local.tvmorph.tv;
import android.content.Context;import android.os.Bundle;import android.view.WindowManager;import org.json.JSONObject;
/** Phone-local IPTV uses the same encrypted catalog, library and native player as TV. */
public final class PhoneIptvActivity extends IptvActivity {
 public static void prepare(Context c,JSONObject saved,String language)throws Exception{IptvStore.get(c).importPhoneProfile(saved);if(java.util.Arrays.asList("ar","en","fr","zh","ja").contains(language))UiSettings.prefs(c).edit().putString("language",language).apply();}
 public static JSONObject summary(Context c)throws Exception{return IptvStore.get(c).summary();}
 public static JSONObject saveProfile(Context c,JSONObject profile)throws Exception{return IptvStore.get(c).connect(profile);}
 public static void clearSaved(Context c){IptvStore.get(c).clear();}
 @Override protected boolean standalone(){return true;}
 @Override public void onCreate(Bundle state){super.onCreate(state);getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);}
}
