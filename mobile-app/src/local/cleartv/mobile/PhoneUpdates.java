package local.cleartv.mobile;
import android.content.Context;import org.json.*;import java.io.IOException;

/** Read-only HTTPS release check. Never installs or changes TV state. */
final class PhoneUpdates {
 static JSONObject info(Context context)throws Exception{
  String installed=context.getPackageManager().getPackageInfo(context.getPackageName(),0).versionName.replaceFirst("[-+].*$","");
  JSONObject catalog=new JSONObject(Network.get("https://morphtv.herroshetta.com/catalog.json?t="+System.currentTimeMillis(),8000));
  String latest="";JSONArray platforms=catalog.optJSONArray("platforms");if(platforms!=null)for(int i=0;i<platforms.length();i++){JSONObject row=platforms.optJSONObject(i);if(row!=null&&"phone".equals(row.optString("id"))){latest=row.optString("version");break;}}
  if(!installed.matches("[0-9]+\\.[0-9]+\\.[0-9]+")||!latest.matches("[0-9]+\\.[0-9]+\\.[0-9]+"))throw new IOException("Could not verify the phone release version.");
  return new JSONObject().put("installed",installed).put("latest",latest).put("download","https://morphtv.herroshetta.com/download/phone");
 }
}
