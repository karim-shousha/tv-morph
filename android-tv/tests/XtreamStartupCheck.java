package local.tvmorph.tv;
import org.json.*;
import com.sun.net.httpserver.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
/** A slow optional metadata endpoint must never delay a known playback URL. */
public class XtreamStartupCheck {
 public static void main(String[] args)throws Exception{
  boolean baseline=args.length>0&&args[0].equals("baseline");AtomicInteger requests=new AtomicInteger();
  HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/player_api.php",exchange->{requests.incrementAndGet();try{Thread.sleep(1500);}catch(InterruptedException ignored){}String base="http://127.0.0.1:"+server.getAddress().getPort();byte[] body=("{\"info\":{},\"movie_data\":{\"container_extension\":\"mkv\",\"direct_source\":\""+base+"/repaired.mkv\"},\"episodes\":{\"1\":[{\"id\":\"71\",\"container_extension\":\"mkv\",\"direct_source\":\""+base+"/episode.mkv\"}]}}").getBytes(StandardCharsets.UTF_8);exchange.sendResponseHeaders(200,body.length);exchange.getResponseBody().write(body);exchange.close();});server.start();
  try{String base="http://127.0.0.1:"+server.getAddress().getPort();long[] times=new long[3];
   for(int i=0;i<3;i++){Xtream x=new Xtream(new JSONObject().put("server",base).put("username","fixture").put("password","fixture"));JSONObject item=new JSONObject().put("kind","vod").put("id","7").put("ext","mp4");long start=System.nanoTime();String url=x.stream(item);times[i]=(System.nanoTime()-start)/1000000;if(!baseline&&(!url.endsWith("/7.mp4")||requests.get()!=0))throw new AssertionError("Metadata blocked the fast path");}
   java.util.Arrays.sort(times);System.out.println((baseline?"BASELINE":"UPDATED")+" VOD URL median ms="+times[1]+" metadata requests="+requests.get());
   Xtream x=new Xtream(new JSONObject().put("server",base).put("username","fixture").put("password","fixture"));JSONObject episode=new JSONObject().put("kind","episode").put("id","71").put("category","7").put("ext","mp4");long start=System.nanoTime();String url=x.stream(episode);long elapsed=(System.nanoTime()-start)/1000000;System.out.println((baseline?"BASELINE":"UPDATED")+" episode URL ms="+elapsed);
   if(!baseline){if(elapsed>200||requests.get()!=0)throw new AssertionError("Episode waited for metadata");java.lang.reflect.Method resolve=Xtream.class.getDeclaredMethod("resolveStream",JSONObject.class);String repaired=(String)resolve.invoke(x,episode);if(!repaired.endsWith("/episode.mkv")||!x.stream(episode).equals(repaired)||!x.originalStream(episode).endsWith("/71.mkv"))throw new AssertionError("Metadata repair lost");System.out.println("PASS: no metadata on startup; deferred container/direct-source recovery preserved");}
  }finally{server.stop(0);}
 }
}
