package local.tvmorph.tv;
import android.util.JsonReader;import android.util.JsonToken;import java.io.*;import java.util.*;import org.json.*;
/** Keep only one raw provider row at a time; never materialize the full JSON response. */
final class ProviderCatalog {
 interface Row {JSONObject map(JSONObject item)throws JSONException;}
 private static final Set<String> FIELDS=new HashSet<>(Arrays.asList("stream_id","series_id","name","category_id","added","last_modified","rating","rating_5based","container_extension","direct_source","cover_big","cover","stream_icon","movie_image","logo","logo_url","tvg-logo","image","backdrop_path","backdrop","year","releaseDate","releasedate","release_date","released","premiered"));
 static final class Result {final JSONArray rows=new JSONArray();int total;boolean complete;}
 static Result read(InputStream in,int limit,Row mapper)throws IOException{
  Result result=new Result();try(JsonReader r=new JsonReader(new InputStreamReader(in,"UTF-8"))){
   r.beginArray();while(r.hasNext()){
    if(r.peek()!=JsonToken.BEGIN_OBJECT){r.skipValue();continue;}
    JSONObject item=new JSONObject();r.beginObject();while(r.hasNext()){String key=r.nextName();if(!FIELDS.contains(key)){r.skipValue();continue;}JsonToken token=r.peek();
     if(token==JsonToken.STRING||token==JsonToken.NUMBER){String v=r.nextString();if(v.length()>65536)throw new IOException("Provider catalog field too large.");item.put(key,v);}
     else if(key.equals("backdrop_path")&&token==JsonToken.BEGIN_ARRAY){r.beginArray();String first="";while(r.hasNext()){if(first.isEmpty()&&r.peek()==JsonToken.STRING)first=r.nextString();else r.skipValue();}r.endArray();item.put(key,first);}
     else r.skipValue();
    }r.endObject();JSONObject normalized=mapper.map(item);if(normalized!=null){result.total++;if(limit<=0||result.rows.length()<limit)result.rows.put(normalized);if(limit>0&&result.rows.length()>=limit)return result;}
   }r.endArray();result.complete=true;if(r.peek()!=JsonToken.END_DOCUMENT)throw new IOException("Provider returned invalid JSON.");return result;
  }catch(IllegalStateException|JSONException invalid){throw new IOException("Provider returned invalid JSON.",invalid);}
 }
}
