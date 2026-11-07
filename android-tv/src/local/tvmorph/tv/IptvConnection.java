package local.tvmorph.tv;
import org.json.*;
/** Prefer credential-based API for provider playlist links; generic M3U remains the fallback. */
final class IptvConnection {
 static final class Result{final Xtream client;final JSONObject auth;Result(Xtream c,JSONObject a){client=c;auth=a;}}
 static Result open(JSONObject config)throws Exception{
  JSONObject api=XtreamCredentials.playlistAccount(config);
  if(api!=null){try{Xtream client=new Xtream(api);return new Result(client,client.auth());}catch(Exception unavailable){/* This provider may expose only a playlist. Retain its original URL for fallback. */}}
  Xtream client=new Xtream(config);return new Result(client,client.auth());
 }
}
