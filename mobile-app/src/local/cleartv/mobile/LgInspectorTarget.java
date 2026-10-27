package local.cleartv.mobile;
import java.net.URI;
import java.net.URLDecoder;
import java.util.Arrays;
import org.json.JSONObject;
final class LgInspectorTarget {
 static String socket(JSONObject target,String ip,String app)throws Exception{
  String page=target.optString("url");if(!page.contains("/"+app+"/"))return null;
  String address=target.optString("webSocketDebuggerUrl");
  if(address.isEmpty())for(String field:new String[]{"devtoolsFrontendUrl","inspectorUrl"}){
   String front=target.optString(field);int at=front.indexOf("ws=");if(at<0)continue;String value=front.substring(at+3).split("&",2)[0];value=URLDecoder.decode(value,"UTF-8");address=value.startsWith("ws://")?value:"ws://"+value;break;
  }
  if(address.isEmpty())return null;URI uri=new URI(address);
  if(!"ws".equals(uri.getScheme())||uri.getPort()!=9998||uri.getUserInfo()!=null||!Arrays.asList("127.0.0.1","localhost",ip).contains(uri.getHost()))return null;
  return uri.getRawPath()+(uri.getRawQuery()==null?"":"?"+uri.getRawQuery());
 }
}
