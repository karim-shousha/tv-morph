package local.cleartv.mobile;
import org.json.*;import java.net.*;import java.io.*;
final class DeviceCompatibility {
 static JSONObject inspect(String ip,String platform)throws Exception{
  if(!Network.local(ip))throw new IOException("Enter a private local IPv4 address");
  JSONObject r=new JSONObject().put("ip",ip).put("platform",platform).put("receiver",false).put("paired",false).put("adb",false);
  try{JSONObject d=AndroidTv.request(ip,"/info",null,null);if(d.optString("service").equals("tv-morph-android")){r.put("platform","android").put("receiver",true).put("model",d.optString("model")).put("os",d.optString("os")).put("version",d.optString("version")).put("selfUpdate",d.optBoolean("selfUpdate")).put("capabilities",d.optJSONObject("capabilities"));}}catch(Exception ignored){}
  if(platform.equals("android")||platform.equals("firetv")||r.optBoolean("receiver"))try(Socket socket=new Socket()){socket.connect(new InetSocketAddress(ip,5555),1800);r.put("adb",true);}catch(Exception ignored){}
  return r;
 }
}
