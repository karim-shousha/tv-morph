package local.cleartv.mobile;
import android.content.Context;import java.io.*;import java.net.*;import org.json.*;
/** Installs only our bundled signed receiver through the TV's authorised ADB service. */
final class FireTvInstaller {
 static JSONObject probe(String ip)throws Exception{if(!Network.local(ip))throw new IOException("Enter a local Fire TV IP address");try{return AndroidTv.probe(ip).put("fireTV",true);}catch(Exception ignored){}try(Socket socket=new Socket()){socket.connect(new InetSocketAddress(ip,5555),1800);}catch(Exception e){throw new IOException("فعّل ADB Debugging في Fire TV وتأكد إن الجهازين على نفس الشبكة، أو ثبّت APK باستخدام Downloader أول مرة.");}return new JSONObject().put("ip",ip).put("brand","android").put("fireTV",true).put("name","Fire TV").put("model","ADB network service detected").put("developerReady",false).put("hint","خدمة ADB ظاهرة. اضغط تثبيت على Fire TV ووافق على رسالة السماح على الشاشة؛ التثبيت لم يتم بعد.");}
 static JSONObject install(Context context,String ip,SdbClient.Progress progress)throws Exception{return install(context,ip,progress,"launcher");}
 static JSONObject install(Context context,String ip,SdbClient.Progress progress,String product)throws Exception{
  if(!product.equals("launcher")&&!product.equals("iptv"))throw new IOException("Unknown product");
  if(!Network.local(ip))throw new IOException("Enter the TV local IP and connect both devices to the same router.");
  Vault vault=new Vault(context);byte[] saved=vault.get("fire-adb-identity");AdbIdentity identity=new AdbIdentity(saved);if(saved==null)vault.put("fire-adb-identity",identity.encoded());
  String path="/data/local/tmp/tvmorph-receiver-install.apk";
  try(SdbClient adb=new SdbClient(ip,5555,identity)){
   int sdk;try{sdk=Integer.parseInt(adb.shell("getprop ro.build.version.sdk").trim());}catch(Exception e){throw new IOException("Could not read the TV Android version.");}
   if(sdk<26)throw new IOException("This TV needs Android 8 or later; its system version is too old.");
   byte[] apk=product.equals("iptv")?InstallPackage.iptv(context,"android").data:ReceiverApk.read(context.getAssets().open("android-tv.apk"));
   try{
    adb.push(apk,path,progress);
    adb.timeout(60000);String reply=adb.shell("pm install -r --user 0 "+path);
    if(!reply.matches("(?s).*\\bSuccess\\b.*"))throw new IOException("TV installation was not confirmed: "+reply.substring(Math.max(0,reply.length()-400)));
    String launch=adb.shell("am start -n "+(product.equals("iptv")?"local.morph.iptv/local.morph.iptv.MainActivity":"local.tvmorph.tv/.TvActivity"));
    return new JSONObject().put("installed",true).put("launched",!launch.contains("Error")).put("pairingRequired",product.equals("launcher")).put("product",product);
   }finally{try{adb.shell("rm -f "+path);}catch(Exception ignored){}}
  }catch(java.net.SocketTimeoutException e){throw new IOException("Approve Allow USB debugging on the TV, then retry.");}
 }
 static JSONObject prepareHome(Context context,String ip)throws Exception{
  if(!Network.local(ip))throw new IOException("Enter the selected TV local IP first.");
  Vault vault=new Vault(context);byte[] saved=vault.get("fire-adb-identity");AdbIdentity identity=new AdbIdentity(saved);if(saved==null)vault.put("fire-adb-identity",identity.encoded());
  try(SdbClient adb=new SdbClient(ip,5555,identity)){
   String installed=adb.shell("dumpsys package local.tvmorph.tv");java.util.regex.Matcher version=java.util.regex.Pattern.compile("versionCode=(\\d+)").matcher(installed);
   if(!version.find()||Integer.parseInt(version.group(1))<69)throw new IOException("Update Morph TV on this TV first (0.8.65 or later).");
   String old=adb.shell("settings get secure enabled_accessibility_services").trim();String merged=HomeServiceSettings.updated(old,true);String service=HomeServiceSettings.OWN;
   adb.shell("settings put secure enabled_accessibility_services '"+merged+"'");adb.shell("settings put secure accessibility_enabled 1");
   String check=adb.shell("settings get secure enabled_accessibility_services");if(!check.contains(service))throw new IOException("The TV did not allow activation. Enable Morph TV manually in Accessibility settings.");
   String launch=adb.shell("am start -n local.tvmorph.tv/.TvActivity --ez showStartup true");if(launch.contains("Error"))throw new IOException("Permission is ready. Open Morph TV Settings > General > TV home & startup.");
   return new JSONObject().put("permissionReady",true).put("finishOnTV",true).put("homeVerified",false).put("bootVerified",false);
  }
 }

 static JSONObject disableHome(Context context,String ip)throws Exception{
  if(!Network.local(ip))throw new IOException("Enter the selected TV local IP first.");Vault vault=new Vault(context);byte[] saved=vault.get("fire-adb-identity");if(saved==null)throw new IOException("Prepare Home from this phone first, or disable Morph TV in TV Accessibility settings.");
  try(SdbClient adb=new SdbClient(ip,5555,new AdbIdentity(saved))){String old=adb.shell("settings get secure enabled_accessibility_services").trim();String merged=HomeServiceSettings.updated(old,false);adb.shell("settings put secure enabled_accessibility_services '"+merged+"'");if(merged.isEmpty())adb.shell("settings put secure accessibility_enabled 0");String check=adb.shell("settings get secure enabled_accessibility_services");if(check.contains("HomeOverrideService"))throw new IOException("The TV did not confirm disabling the service.");return new JSONObject().put("disabled",true).put("bootSettingUnchanged",true);}
 }

}
