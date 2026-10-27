package local.cleartv.mobile;
import java.net.*;
import java.util.*;
public class SamsungLoginCheck {
 public static void main(String[] args)throws Exception{
  URI uri=new URI(SamsungLogin.authorizationURL());Map<String,String> query=new HashMap<>();
  for(String part:uri.getRawQuery().split("&")){String[] pair=part.split("=",2);query.put(pair[0],URLDecoder.decode(pair[1],"UTF-8"));}
  if(!"account.samsung.com".equals(uri.getHost())||!SamsungLogin.REDIRECT.equals(query.get("redirect_uri")))throw new AssertionError("Invalid Samsung authorization URL");
  if(!SamsungLogin.callbackPath("/signin/callback?code=test")||SamsungLogin.callbackPath("/signin/callback/random")||SamsungLogin.callbackPath("/other"))throw new AssertionError("Callback routing");
  try(ServerSocket listener=SamsungLogin.listen()){
   if(listener.getLocalPort()!=4794||!listener.getInetAddress().isLoopbackAddress())throw new AssertionError("Callback must bind exact loopback port");
   boolean blocked=false;try(ServerSocket duplicate=SamsungLogin.listen()){}catch(java.io.IOException expected){blocked=true;}
   if(!blocked)throw new AssertionError("Must not silently use an unregistered random port");
  }
  System.out.println("PASS: exact registered callback, loopback-only listener, callback routing and port-conflict handling. No credentials used.");
 }
}
