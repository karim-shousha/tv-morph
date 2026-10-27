package local.cleartv.mobile;
import android.content.Context;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import org.json.JSONObject;
/** Bundled translations shared by WebView and native notifications. */
final class MobileStrings {
 private static JSONObject catalog;
 static synchronized String t(Context context,String source){
  try{
   if(catalog==null){try(InputStream in=context.getAssets().open("ui/locale-data.json");ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1)out.write(buffer,0,n);catalog=new JSONObject(out.toString("UTF-8"));}}
   String language=context.getSharedPreferences("cleartv",Context.MODE_PRIVATE).getString("language","ar");
   JSONObject row=catalog.optJSONObject(source);if(row!=null)return row.optString(language,row.optString("en",source));
  }catch(Exception ignored){}
  return source;
 }
}
