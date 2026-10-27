package local.cleartv.mobile;
import java.util.*;import java.util.regex.*;
/** Public APK response only; contains no phone files, credentials or device data. */
public final class ApkDownload {
 public static LanHttp.Response response(byte[] apk,String method,String path,Map<String,String> headers)throws Exception{
  if((!method.equals("GET")&&!method.equals("HEAD"))||!path.split("\\?",2)[0].equals("/tv-morph.apk"))return new LanHttp.Response(404,"text/plain",new byte[0]);
  int start=0,end=apk.length-1;boolean partial=headers.containsKey("range");
  if(partial){Matcher m=Pattern.compile("bytes=(\\d+)-(\\d*)").matcher(headers.get("range"));if(!m.matches())return new LanHttp.Response(416,"text/plain",new byte[0]);try{start=Integer.parseInt(m.group(1));end=m.group(2).isEmpty()?end:Math.min(end,Integer.parseInt(m.group(2)));}catch(NumberFormatException e){return new LanHttp.Response(416,"text/plain",new byte[0]);}if(start>end)return new LanHttp.Response(416,"text/plain",new byte[0]);}
  LanHttp.Response r=new LanHttp.Response(partial?206:200,"application/vnd.android.package-archive",partial?Arrays.copyOfRange(apk,start,end+1):apk);
  r.headers.put("Content-Disposition","attachment; filename=\"TV-Morph-TV.apk\"");r.headers.put("Accept-Ranges","bytes");if(partial)r.headers.put("Content-Range","bytes "+start+"-"+end+"/"+apk.length);return r;
 }
}
