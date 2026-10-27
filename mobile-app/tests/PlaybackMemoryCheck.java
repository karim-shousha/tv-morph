package local.tvmorph.tv;
import android.content.Context;import org.json.*;
public final class PlaybackMemoryCheck{
 public static void run(Context context)throws Exception{
  String movie=PlaybackMemory.key("fixture","vod","1"),episode=PlaybackMemory.key("fixture","episode","1");PlaybackMemory.put(context,movie,90000,600000);PlaybackMemory.put(context,episode,180000,1200000);if(PlaybackMemory.get(context,movie)!=90000||PlaybackMemory.get(context,episode)!=180000)throw new Exception("Movie/episode resume isolation failed");
  PlaybackMemory.put(context,movie,590000,600000);if(PlaybackMemory.get(context,movie)!=0)throw new Exception("Completed movie should restart");
  UiSettings.save(context,new JSONObject().put("language","en").put("scale","fill").put("resume",false));JSONObject settings=UiSettings.get(context);if(!settings.getString("language").equals("en")||!settings.getString("scale").equals("fill")||settings.getBoolean("resume"))throw new Exception("Settings persistence failed");
  UiSettings.save(context,new JSONObject().put("language","bad").put("scale","invalid"));if(!UiSettings.get(context).getString("scale").equals("fill"))throw new Exception("Invalid scale accepted");PlaybackMemory.clear(context);if(PlaybackMemory.get(context,episode)!=0)throw new Exception("Resume clear failed");UiSettings.save(context,new JSONObject().put("language","ar").put("scale","fit").put("resume",true));
 }
}
