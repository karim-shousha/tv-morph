package local.cleartv.mobile;
import android.content.Context;import java.io.*;import org.json.*;
/** Product payloads are shipped inside the signed phone APK, never selected by a remote URL. */
final class InstallPackage {
 final String id,version,sha;final byte[] data;
 private InstallPackage(String id,String version,String sha,byte[] data){this.id=id;this.version=version;this.sha=sha;this.data=data;}
 static InstallPackage iptv(Context context,String platform)throws Exception{
  if(!java.util.Arrays.asList("android","webos","tizen4").contains(platform))throw new IOException("Unsupported install target");
  JSONObject all=new JSONObject(new String(LgInstallProtocol.read(context.getAssets().open("install-products.json"),16384),java.nio.charset.StandardCharsets.UTF_8));JSONObject item=all.getJSONObject("iptv").getJSONObject(platform);
  String asset=item.getString("asset"),id=item.getString("id"),version=item.getString("version"),sha=item.getString("sha256");
  if(!asset.equals("iptv-"+platform+(platform.equals("android")?".apk":platform.equals("webos")?".ipk":".wgt"))||!sha.matches("[a-f0-9]{64}")||!version.matches("[0-9]+\\.[0-9]+\\.[0-9]+"))throw new IOException("Invalid bundled install metadata");
  if(!(platform.equals("android")&&id.equals("local.morph.iptv")||platform.equals("webos")&&id.equals("com.morphtv.iptv")||platform.equals("tizen4")&&id.startsWith("MIptvTz4X1.")))throw new IOException("Wrong product identity");
  byte[] data=ReceiverApk.read(context.getAssets().open(asset));if(data.length!=item.getLong("bytes")||!sha.equals(LgInstallProtocol.digest(data)))throw new IOException("Bundled IPTV package integrity check failed");
  return new InstallPackage(id,version,sha,data);
 }
}
