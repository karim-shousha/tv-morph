package local.cleartv.mobile;
import android.content.Context;
import java.io.*;
import org.json.*;
/** Validate against the same packaged catalog used by the phone theme picker. */
final class ThemePackIds {
 static void require(Context context,String id)throws Exception {
  StringBuilder text=new StringBuilder();
  try(Reader in=new InputStreamReader(context.getAssets().open("ui/theme-packs-manifest.js"),"UTF-8")){
   char[] buffer=new char[4096];int n;while((n=in.read(buffer))!=-1)text.append(buffer,0,n);
  }
  String source=text.toString();JSONArray packs=new JSONObject(source.substring(source.indexOf('{'),source.lastIndexOf('}')+1)).getJSONArray("packs");
  for(int i=0;i<packs.length();i++)if(packs.getJSONObject(i).getString("id").equals(id))return;
  throw new IOException("Unknown theme pack. Update Morph TV on the phone and TV.");
 }
}
