package local.tvmorph.tv;
import org.json.*;import com.sun.net.httpserver.*;import java.net.*;import java.nio.charset.StandardCharsets;import java.util.concurrent.atomic.AtomicInteger;
public class XtreamAuthCheck{
 static void ok(boolean value,String message){if(!value)throw new AssertionError(message);}
 public static void main(String[] args)throws Exception{
  JSONObject base=new JSONObject().put("username","fixture").put("password","fixture");
  JSONObject noPort=XtreamCredentials.normalize(new JSONObject(base.toString()).put("server","example.com"));
  ok(noPort.getString("server").equals("http://example.com"),"missing port tolerated, got: "+noPort.getString("server"));
  JSONObject withPort=XtreamCredentials.normalize(new JSONObject(base.toString()).put("server","http://example.com:8080/"));
  ok(withPort.getString("server").equals("http://example.com:8080"),"explicit port kept, got: "+withPort.getString("server"));
  JSONObject trailing=XtreamCredentials.normalize(new JSONObject(base.toString()).put("server","example.com:"));
  ok(trailing.getString("server").equals("http://example.com"),"trailing colon trimmed, got: "+trailing.getString("server"));
  JSONObject httpsNoPort=XtreamCredentials.normalize(new JSONObject(base.toString()).put("server","https://example.com"));
  ok(httpsNoPort.getString("server").equals("https://example.com"),"https without port kept");
  JSONObject full=XtreamCredentials.normalize(new JSONObject(base.toString()).put("server","http://example.com:8080/get.php?username=fixture&password=fixture"));
  ok(full.getString("server").equals("http://example.com:8080")&&full.getString("username").equals("fixture"),"xtream url preserved");
  try{XtreamCredentials.normalize(new JSONObject(base.toString()).put("server","not a url at all !!!"));throw new AssertionError("garbage accepted");}catch(java.io.IOException expected){}
  AtomicInteger mode=new AtomicInteger(0);
  HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/player_api.php",exchange->{int m=mode.get();String body=m==0?"{\"user_info\":{\"auth\":1,\"status\":\"Active\"}}":"{}";byte[] data=body.getBytes(StandardCharsets.UTF_8);exchange.sendResponseHeaders(m==0?200:(m==1?403:401),m==0?data.length:-1);if(m==0){exchange.getResponseBody().write(data);}exchange.close();});
  server.start();
  try{
   String root="http://127.0.0.1:"+server.getAddress().getPort();
   Xtream x=new Xtream(new JSONObject().put("server",root).put("username","fixture").put("password","fixture"));
   JSONObject connected=x.auth();
   ok(connected.optBoolean("connected"),"auth success still works");
   mode.set(2);
   try{x.auth();throw new AssertionError("401 accepted");}catch(java.io.IOException e){ok(e.getMessage().contains("اسم المستخدم")||e.getMessage().contains("كلمة السر"),"401 hints credentials, got: "+e.getMessage());}
   mode.set(1);
   try{x.auth();throw new AssertionError("403 accepted");}catch(java.io.IOException e){ok(e.getMessage().contains("403")&&e.getMessage().contains("المنفذ"),"403 hints port, got: "+e.getMessage());}
   System.out.println("PASS native account without port accepted, trailing colon trimmed, auth 401/403 mapped to actionable Arabic guidance. HTTP fixture.");
  }finally{server.stop(0);}
 }
}
