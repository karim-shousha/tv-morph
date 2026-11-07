package local.cleartv.mobile;
import android.content.Context;import org.json.*;import java.io.IOException;import java.net.URI;

/** Read-only release check. Test builds have an explicit packaged channel marker. */
final class PhoneUpdates {
 static final String HOST="https://morph-tv.com";
 private static volatile String checkedDownload="",checkedChannel="";
 static String channel(Context c){try(java.io.InputStream in=c.getAssets().open("phone-update-channel.json")){java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream();byte[] data=new byte[256];int n;while((n=in.read(data))!=-1)out.write(data,0,n);return "test".equals(new JSONObject(out.toString("UTF-8")).optString("channel"))?"test":"public";}catch(Exception e){return "public";}}
 static boolean validDownload(String value,boolean test){try{URI uri=new URI(value);String path=uri.getPath();return "https".equals(uri.getScheme())&&"morph-tv.com".equals(uri.getHost())&&uri.getUserInfo()==null&&uri.getQuery()==null&&uri.getFragment()==null&&(uri.getPort()==-1||uri.getPort()==443)&&path!=null&&!path.contains("..")&&(test?path.startsWith("/test-releases/")&&path.endsWith(".apk"):path.equals("/download/phone"));}catch(Exception e){return false;}}
 static JSONObject info(Context context)throws Exception{
  String installed=context.getPackageManager().getPackageInfo(context.getPackageName(),0).versionName.replaceFirst("[-+].*$","");
  String channel=channel(context);boolean test=channel.equals("test");
  JSONObject catalog=new JSONObject(Network.get(HOST+(test?"/test-releases/mobile-latest.json":"/catalog.json")+"?t="+System.currentTimeMillis(),8000));
  String latest="",download=HOST+"/download/phone";
  if(test){if(!"manual-test".equals(catalog.optString("channel")))throw new IOException("Invalid update channel");latest=catalog.optString("version");download=catalog.optString("url");if(!catalog.optString("sha256").matches("[0-9a-f]{64}")||catalog.optLong("bytes")<=0)throw new IOException("Invalid test release");}
  else{JSONArray platforms=catalog.optJSONArray("platforms");if(platforms!=null)for(int i=0;i<platforms.length();i++){JSONObject row=platforms.optJSONObject(i);if(row!=null&&"phone".equals(row.optString("id"))){latest=row.optString("version");break;}}}
  if(!installed.matches("[0-9]+\\.[0-9]+\\.[0-9]+")||!latest.matches("[0-9]+\\.[0-9]+\\.[0-9]+")||!validDownload(download,test))throw new IOException("Could not verify the phone release.");
  checkedDownload=download;checkedChannel=channel;
  return new JSONObject().put("installed",installed).put("latest",latest).put("download",download).put("channel",channel);
 }
 static String downloadURL(Context context)throws Exception{String current=channel(context);if(!checkedChannel.equals(current)||checkedDownload.isEmpty())info(context);if(!validDownload(checkedDownload,current.equals("test")))throw new IOException("Invalid phone update URL");return checkedDownload;}
}
