package local.tvmorph.tv;
import android.content.*;
final class PlaybackMemory{
 static String key(String profile,String kind,String id){return profile+":"+kind+":"+id;}
 static String account(Context c,String account){String viewer=UiSettings.prefs(c).getString("viewerId","default");return viewer.equals("default")?account:account+"@"+viewer;}
 static int resumable(int position,int duration){if(position<3000)return 0;if(duration>0&&(duration-position<30000||position>duration*.97))return 0;return position;}
 static android.content.SharedPreferences prefs(Context c){return c.getSharedPreferences("tvmorph-playback",0);}
 static int get(Context c,String key){return key==null?0:prefs(c).getInt(key,0);}
 static void put(Context c,String key,int position,int duration){if(key==null||key.isEmpty())return;int value=resumable(position,duration);android.content.SharedPreferences.Editor e=prefs(c).edit();if(value>0)e.putInt(key,value);else e.remove(key);e.apply();}
 static void clear(Context c){String viewer=UiSettings.prefs(c).getString("viewerId","default");android.content.SharedPreferences.Editor e=prefs(c).edit();for(String key:prefs(c).getAll().keySet()){String account=key.split(":",2)[0];if(viewer.equals("default")?!account.contains("@"):account.endsWith("@"+viewer))e.remove(key);}e.apply();}
}
