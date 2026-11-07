package local.cleartv.mobile;
import android.app.Activity;import java.io.IOException;import java.util.Locale;import java.util.UUID;import org.json.JSONObject;
/** Same SDB/certificate/signer pipeline as the bundled installer, for a selected local WGT. */
final class SamsungWgtInstaller {
 static String duid(SdbClient client)throws Exception{String value=client.shell("0 getduid").trim();if(!value.matches("[A-Za-z0-9:#=+/.\\-]{4,160}"))throw new IOException("Could not read the TV DUID. Check Samsung Developer Mode.");return value;}
 static JSONObject install(Activity activity,String ip,SamsungWidget widget,Certificates.Status status)throws Exception{
  if(!Network.local(ip))throw new IOException("Select a Samsung TV on your local Wi-Fi first.");status.update("Samsung: checking Developer Mode…");String device;try(SdbClient tv=new SdbClient(ip)){device=duid(tv);}
  Certificates.Bundle certificate=new Certificates(activity,status).get(device,widget.level);status.update("Samsung: signing "+widget.name+" ("+widget.level+")…");byte[] signed=widget.sign(certificate);String path="/home/owner/share/tmp/sdk_tools/MorphImport-"+widget.sha256+".wgt";
  try(SdbClient tv=new SdbClient(ip)){if(!device.equals(duid(tv)))throw new IOException("The TV at this IP changed. Select your TV again.");try{status.update("Samsung: uploading "+widget.name+"…");tv.push(signed,path,percent->status.update("Samsung WGT: "+percent+"%"));status.update("Samsung: installing "+widget.name+"…");String log=tv.shell("0 vd_appinstall "+widget.packageId+" "+path);if(!log.toLowerCase(Locale.US).contains("install completed"))throw new IOException(MainActivity.installError(log));}finally{try{tv.shell("0 rm -f "+path);}catch(Exception ignored){}}}
  return new JSONObject().put("installed",true).put("name",widget.name).put("appId",widget.appId).put("certificateLevel",widget.level);
 }
}
