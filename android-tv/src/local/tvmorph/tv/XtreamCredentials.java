package local.tvmorph.tv;
import java.net.*;import java.io.*;import java.util.*;import org.json.*;
/** Accept a provider base or an Xtream get.php/player_api.php URL. Never log credentials. */
final class XtreamCredentials {
 static JSONObject normalize(JSONObject input)throws Exception{
  JSONObject out=new JSONObject(input.toString());String address=input.optString("server").trim().replaceAll("[\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]","");
  if(!address.contains("://"))address="http://"+address;
  URI u;try{u=new URI(address);}catch(URISyntaxException invalid){throw new IOException("رابط المزوّد غير صحيح. راجع العنوان والمنفذ بدون مسافات.");}if(!Arrays.asList("http","https").contains(u.getScheme())||u.getHost()==null||u.getUserInfo()!=null||u.getFragment()!=null)throw new IOException("اكتب رابط مزوّد IPTV صحيحًا يبدأ بـ http:// أو https://");
  String path=u.getRawPath()==null?"":u.getRawPath(),user=input.optString("username").trim(),password=input.optString("password");
  boolean api=path.matches("(?i).*/(?:get|player_api)\\.php");
  if(u.getRawQuery()!=null){if(!api)throw new IOException("استخدم رابط السيرفر أو رابط Xtream الذي يحتوي username وpassword، وليس رابط فيديو أو قائمة M3U عامة.");Map<String,String> q=new HashMap<>();for(String part:u.getRawQuery().split("&")){int at=part.indexOf('=');if(at>0)q.put(URLDecoder.decode(part.substring(0,at),"UTF-8"),URLDecoder.decode(part.substring(at+1),"UTF-8"));}if(user.isEmpty())user=q.getOrDefault("username","");if(password.isEmpty())password=q.getOrDefault("password","");}
  if(api)path=path.substring(0,path.lastIndexOf('/'));
  out.put("server",u.getScheme()+"://"+u.getRawAuthority()+path.replaceAll("/+$",""));out.put("username",user);out.put("password",password);
  if(user.isEmpty()||password.isEmpty()||user.length()>256||password.length()>512)throw new IOException("أدخل اسم المستخدم وكلمة السر، أو رابط Xtream كاملًا بالبيانات.");
  return out;
 }
}
