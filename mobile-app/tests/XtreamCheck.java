package local.tvmorph.tv;
import android.content.Context;import local.cleartv.mobile.LanHttp;import org.json.*;import java.net.*;import java.util.*;import java.io.*;
public class XtreamCheck{
 public static void run(Context context)throws Exception{
  final int[] liveRequests={0};try(LanHttp fixture=new LanHttp(18789,(method,path,headers,body)->{
   Map<String,String> q=new HashMap<>();for(String pair:path.substring(path.indexOf('?')+1).split("&")){String[] kv=pair.split("=",2);q.put(kv[0],kv.length>1?URLDecoder.decode(kv[1],"UTF-8"):"");}
   if(!"fixture user".equals(q.get("username"))||!"fixture&pass".equals(q.get("password")))return LanHttp.Response.json("{\"user_info\":{\"auth\":0}}");
   String action=q.get("action");if("get_live_streams".equals(action))liveRequests[0]++;if(action==null)return LanHttp.Response.json("{\"user_info\":{\"auth\":1,\"status\":\"Active\",\"exp_date\":\"2000000000\"}}");
   if(action.endsWith("categories"))return LanHttp.Response.json("[{\"category_id\":\"1\",\"category_name\":\"أخبار\"}]");
   if(action.equals("get_vod_info"))return LanHttp.Response.json("{\"info\":{\"plot\":\"Fixture plot\",\"genre\":\"Drama\",\"movie_image\":\"https://example.test/poster.png\",\"rating\":\"8.1\"}}");
   if(action.equals("get_series_info"))return LanHttp.Response.json("{\"episodes\":{\"1\":[{\"id\":\"81\",\"title\":\"الحلقة الأولى\",\"container_extension\":\"mp4\"}]}}");
   if(action.equals("get_series"))return LanHttp.Response.json("[{\"series_id\":\"7\",\"name\":\"مسلسل اختبار\",\"category_id\":\"1\"}]");
   return LanHttp.Response.json("[{\"stream_id\":\"11\",\"name\":\"قناة اختبار\",\"category_id\":\"1\",\"container_extension\":\"mp4\"}]");
  })){
   JSONObject account=new JSONObject().put("server","http://127.0.0.1:18789").put("username","fixture user").put("password","fixture&pass").put("name","Test library").put("format","m3u8");Xtream client=new Xtream(account);
   if(!client.auth().getBoolean("connected"))throw new Exception("Auth failed");
   if(!client.categories("live").getJSONObject(0).getString("category_name").equals("أخبار"))throw new Exception("Categories lost Arabic");
   JSONObject channel=client.list("live","").getJSONObject(0);if(!channel.getString("name").equals("قناة اختبار"))throw new Exception("Channel normalization failed");
   if(!client.stream(channel).endsWith("/live/fixture%20user/fixture%26pass/11.m3u8"))throw new Exception("HLS URL escaping failed");
   if(!client.stream(client.list("vod","").getJSONObject(0)).contains("/movie/"))throw new Exception("VOD path failed");
   if(!client.episodes("7").getJSONObject(0).getString("name").contains("الحلقة"))throw new Exception("Episodes failed");
   JSONObject metadata=client.details(new JSONObject().put("kind","vod").put("id","11"));if(!metadata.optString("plot").equals("Fixture plot")||metadata.toString().contains("password")||!metadata.optString("icon").endsWith("poster.png"))throw new Exception("Safe VOD metadata missing");
   IptvStore store=IptvStore.get(context);store.connect(account);byte[] encrypted;try(FileInputStream in=context.openFileInput("iptv-account")){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[1024];int n;while((n=in.read(b))!=-1)out.write(b,0,n);encrypted=out.toByteArray();}if(new String(encrypted,"ISO-8859-1").contains("fixture&pass"))throw new Exception("Secret stored in plaintext");
   JSONObject result=store.list(new JSONObject().put("kind","live").put("search","اختبار"));if(result.getInt("total")!=1||result.toString().contains("password"))throw new Exception("Search or secret filtering failed");int before=liveRequests[0];store.list(new JSONObject().put("kind","live"));if(liveRequests[0]!=before)throw new Exception("Cache miss before refresh");store.refresh();store.list(new JSONObject().put("kind","live"));if(liveRequests[0]!=before+1)throw new Exception("Refresh did not refetch provider");store.clear();if(new File(context.getFilesDir(),"iptv-account").exists())throw new Exception("Account clear failed");
  }
 }
}
