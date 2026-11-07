package local.tvmorph.tv;
import java.net.*;import java.io.*;import org.json.*;
/** Restricted HTTPS transport for the QR mailbox; no WebView origin permissions are broadened. */
final class PhoneQrRelay {
 static JSONObject request(JSONObject payload)throws Exception{
  String action=payload.optString("action");
  if(!java.util.Arrays.asList("create","poll","send","ack","cancel","status").contains(action))throw new IOException("Invalid QR action");
  byte[] body=payload.toString().getBytes("UTF-8");if(body.length>2900000)throw new IOException("QR request too large");
  HttpURLConnection c=(HttpURLConnection)new URL("https://morph-tv.com/api/iptv-link").openConnection();
  try{c.setRequestMethod("POST");c.setConnectTimeout(10000);c.setReadTimeout(16000);c.setInstanceFollowRedirects(false);c.setDoOutput(true);c.setRequestProperty("Content-Type","application/json");c.setFixedLengthStreamingMode(body.length);try(OutputStream out=c.getOutputStream()){out.write(body);}int status=c.getResponseCode();if(status!=200)throw new IOException("QR unavailable ("+status+")");try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>2900000)throw new IOException("QR reply too large");out.write(buffer,0,n);}return new JSONObject(new String(out.toByteArray(),"UTF-8"));}}
  finally{c.disconnect();}
 }
}
