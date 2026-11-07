package local.cleartv.mobile;
import android.app.Activity;
import java.io.*;import java.net.URI;import java.util.regex.*;import java.util.zip.*;import org.json.*;
/** Explicit, previewed cleanup. Never uninstalls apps or touches their private data. */
final class SamsungMaintenance {
 private static final String APP="MorphCln01.Cleanup";
 private static final java.util.Map<String,Integer> sessions=new java.util.concurrent.ConcurrentHashMap<>();
 private static String debug(String ip,Pattern ports)throws Exception{
  String reply="";for(String suffix:new String[]{""," 30"})try(SdbClient tv=new SdbClient(ip)){tv.timeout(5000);try{reply=tv.shellUntil("0 debug "+APP+suffix,ports);if(ports.matcher(reply).find())return reply;}catch(IOException notReady){reply="";}}return reply;
 }
 private static Inspector attach(String ip,int p)throws Exception{
  JSONArray targets=new JSONArray(Network.get("http://"+ip+":"+p+"/json",2000));for(int i=0;i<targets.length();i++){String url=targets.getJSONObject(i).optString("webSocketDebuggerUrl");URI uri=new URI(url);if(!ip.equals(uri.getHost())||uri.getPort()!=p)continue;Inspector inspector=new Inspector(url);try{if(Boolean.TRUE.equals(inspector.evaluate("!!window.MorphInstallCleanup")))return inspector;}catch(Exception ignored){}inspector.close();}throw new IOException("Cleanup session unavailable.");
 }
 private static Inspector session(Activity activity,String ip,Certificates.Status status)throws Exception{
  if(!Network.local(ip))throw new IOException("Choose your Samsung TV on the local network first.");
  Integer cached=sessions.get(ip);if(cached!=null)try{return attach(ip,cached);}catch(Exception ignored){sessions.remove(ip);}
  Pattern ports=Pattern.compile("port[:\\s]+(\\d+)");String reply="";
  reply=debug(ip,ports);
  Matcher port=ports.matcher(reply);
  if(!port.find()){
   status.update("Preparing the small TV cleanup helper. No installed apps are removed.");
   ByteArrayOutputStream bytes=new ByteArrayOutputStream();try(ZipOutputStream zip=new ZipOutputStream(bytes)){for(String name:new String[]{"config.xml","index.html","cleanup.js"}){zip.putNextEntry(new ZipEntry(name));try(InputStream in=activity.getAssets().open("samsung-maintenance/"+name)){byte[] buf=new byte[8192];int n;while((n=in.read(buf))!=-1)zip.write(buf,0,n);}zip.closeEntry();}}
   SamsungWidget widget=SamsungWidget.read(new ByteArrayInputStream(bytes.toByteArray()));
   SamsungWgtInstaller.install(activity,ip,widget,status);
   reply=debug(ip,ports);
   port=ports.matcher(reply);if(!port.find())throw new IOException("The TV could not open the cleanup helper. Fully restart it and retry.");
  }
  int p=Integer.parseInt(port.group(1));if(p<1||p>65535)throw new IOException("Invalid cleanup connection.");
  Exception last=null;for(int attempt=0;attempt<8;attempt++){try{Inspector inspector=attach(ip,p);sessions.put(ip,p);return inspector;}catch(Exception e){last=e;}Thread.sleep(250);}
  throw new IOException("The TV cleanup helper is not responding.",last);
 }
 static JSONObject run(Activity activity,String ip,boolean clear,int revision,Certificates.Status status)throws Exception{
  try(Inspector inspector=session(activity,ip,status)){
   inspector.evaluate(clear?"MorphInstallCleanup.clear("+revision+")":"MorphInstallCleanup.scan()");
   for(int i=0;i<180;i++){Object value=inspector.evaluate("JSON.stringify(MorphInstallCleanup.state)");JSONObject result=new JSONObject(String.valueOf(value));if(!result.optBoolean("busy"))return result;Thread.sleep(250);}
   throw new IOException("Cleanup did not finish in time. Scan again to check the actual result.");
  }
 }
}
