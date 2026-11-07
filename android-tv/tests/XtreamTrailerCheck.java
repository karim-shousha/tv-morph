package local.tvmorph.tv;
import org.json.*;import com.sun.net.httpserver.*;import java.net.*;import java.nio.charset.StandardCharsets;import java.util.concurrent.atomic.AtomicInteger;
public class XtreamTrailerCheck{
 static void ok(boolean value,String message){if(!value)throw new AssertionError(message);}
 public static void main(String[] args)throws Exception{
  ok(Xtream.youtubeId("dQw4w9WgXcQ").equals("dQw4w9WgXcQ"),"raw id");
  ok(Xtream.youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ").equals("dQw4w9WgXcQ"),"watch url");
  ok(Xtream.youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PLx").equals("dQw4w9WgXcQ"),"watch url with params");
  ok(Xtream.youtubeId("https://youtu.be/dQw4w9WgXcQ").equals("dQw4w9WgXcQ"),"short url");
  ok(Xtream.youtubeId("https://youtu.be/dQw4w9WgXcQ?t=10").equals("dQw4w9WgXcQ"),"short url with param");
  ok(Xtream.youtubeId("https://www.youtube.com/embed/dQw4w9WgXcQ").equals("dQw4w9WgXcQ"),"embed url");
  ok(Xtream.youtubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ").equals("dQw4w9WgXcQ"),"shorts url");
  ok(Xtream.youtubeId("https://m.youtube.com/watch?v=dQw4w9WgXcQ").equals("dQw4w9WgXcQ"),"mobile url");
  ok(Xtream.youtubeId("  dQw4w9WgXcQ  ").equals("dQw4w9WgXcQ"),"padded id");
  ok(Xtream.youtubeId("https://vimeo.com/123456789").isEmpty(),"non-youtube rejected");
  ok(Xtream.youtubeId("https://www.youtube.com/watch?v=short").isEmpty(),"short id rejected");
  ok(Xtream.youtubeId("not a url at all").isEmpty(),"garbage rejected");
  ok(Xtream.youtubeId("").isEmpty(),"empty rejected");
  ok(Xtream.youtubeId(null).isEmpty(),"null rejected");
  ok(Xtream.youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQeviltoolongid").isEmpty(),"long id rejected");
  ok(Xtream.youtubeId("javascript:alert(1)").isEmpty(),"scheme rejected");
  AtomicInteger calls=new AtomicInteger();
  HttpServer server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/player_api.php",exchange->{calls.incrementAndGet();String q=exchange.getRequestURI().getRawQuery();String body;
   if(q.contains("action=get_vod_info")&&q.contains("vod_id=7"))body="{\"info\":{\"name\":\"Fixture Film\",\"youtube_trailer\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\",\"rating\":\"8.1\"},\"movie_data\":{\"container_extension\":\"mp4\"}}";
   else if(q.contains("action=get_series_info")&&q.contains("series_id=9"))body="{\"info\":{\"name\":\"Fixture Series\",\"youtube_trailer\":\"https://youtu.be/9bZkp7q19f0\"},\"episodes\":{}}";
   else if(q.contains("vod_id=8"))body="{\"info\":{\"name\":\"No Trailer Film\"},\"movie_data\":{\"container_extension\":\"mp4\"}}";
   else if(q.contains("vod_id=10"))body="{\"info\":{\"name\":\"Bad Trailer\",\"youtube_trailer\":\"https://evil.invalid/x\"},\"movie_data\":{}}";
   else body="{}";
   byte[] data=body.getBytes(StandardCharsets.UTF_8);exchange.sendResponseHeaders(200,data.length);exchange.getResponseBody().write(data);exchange.close();});
  server.start();
  try{
   String base="http://127.0.0.1:"+server.getAddress().getPort();
   Xtream x=new Xtream(new JSONObject().put("server",base).put("username","fixture").put("password","fixture"));
   JSONObject film=x.details(new JSONObject().put("kind","vod").put("id","7"));
   ok(film.optString("trailerYoutubeId").equals("dQw4w9WgXcQ"),"vod trailer id, got: "+film.optString("trailerYoutubeId"));
   ok(film.optString("rating").equals("8.1"),"existing fields preserved");
   JSONObject series=x.details(new JSONObject().put("kind","series").put("id","9"));
   ok(series.optString("trailerYoutubeId").equals("9bZkp7q19f0"),"series trailer id");
   JSONObject plain=x.details(new JSONObject().put("kind","vod").put("id","8"));
   ok(!plain.has("trailerYoutubeId"),"missing trailer leaves no key");
   JSONObject bad=x.details(new JSONObject().put("kind","vod").put("id","10"));
   ok(!bad.has("trailerYoutubeId"),"untrusted host leaves no key");
   System.out.println("PASS native trailer id normalization (16 cases) and provider get_vod_info/get_series_info extraction with untrusted-host rejection. HTTP fixture.");
  }finally{server.stop(0);}
 }
}
