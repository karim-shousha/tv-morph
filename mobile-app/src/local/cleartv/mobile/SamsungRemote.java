package local.cleartv.mobile;
import android.content.Context;import org.json.*;import java.net.*;import java.util.*;import java.io.*;
/** Experimental unencrypted Samsung LAN remote endpoint; no TLS verification bypass. */
final class SamsungRemote implements AutoCloseable{
 private Inspector channel;
 SamsungRemote(Context context,String ip)throws Exception{
  if(!Network.local(ip))throw new IOException("Local TV address required");String file="samsung-remote-"+ip.replace('.','_');byte[] saved=new Vault(context).get(file);String token=saved==null?"":new String(saved,"UTF-8");String name=Base64.getEncoder().encodeToString("Morph TV".getBytes("UTF-8"));
  try{channel=new Inspector("ws://"+ip+":8001/api/v2/channels/samsung.remote.control?name="+URLEncoder.encode(name,"UTF-8")+(token.isEmpty()?"":"&token="+URLEncoder.encode(token,"UTF-8")));channel.timeout(30000);long until=System.currentTimeMillis()+30000;while(System.currentTimeMillis()<until){JSONObject event=channel.readJson();String type=event.optString("event");if(type.equals("ms.channel.unauthorized"))throw new IOException("وافق على طلب Morph TV على شاشة التلفزيون، ثم جرّب تاني.");if(type.equals("ms.channel.connect")){JSONObject data=event.optJSONObject("data");if(data!=null&&!data.optString("token").isEmpty())new Vault(context).put(file,data.getString("token").getBytes("UTF-8"));return;}}throw new IOException("لم يتم تأكيد سماح الريموت.");}catch(Exception e){close();throw new IOException("الريموت الشبكي مش جاهز. وافق على طلب الشاشة لو ظهر. بعض موديلات Samsung تحتاج اتصال آمن غير مدعوم هنا بعد.",e);}
 }
 void key(String key)throws Exception{Set<String> keys=new HashSet<>(Arrays.asList("UP","DOWN","LEFT","RIGHT","ENTER","RETURN","HOME","VOLUP","VOLDOWN","MUTE","PLAY","PAUSE","CHUP","CHDOWN","SOURCE"));if(!keys.contains(key))throw new IOException("Unsupported key");channel.sendJson(new JSONObject().put("method","ms.remote.control").put("params",new JSONObject().put("Cmd","Click").put("DataOfCmd","KEY_"+key).put("Option","false").put("TypeOfRemote","SendRemoteKey")));}
 void text(String text)throws Exception{if(text.length()>500)throw new IOException("الحد الأقصى ٥٠٠ حرف.");channel.sendJson(new JSONObject().put("method","ms.remote.control").put("params",new JSONObject().put("Cmd",Base64.getEncoder().encodeToString(text.getBytes("UTF-8"))).put("DataOfCmd","base64").put("TypeOfRemote","SendInputString")));}
 public void close(){if(channel!=null)channel.close();}
}
