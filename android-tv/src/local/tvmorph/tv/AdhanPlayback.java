package local.tvmorph.tv;
import android.app.*;import android.content.*;import android.content.res.AssetFileDescriptor;import android.media.*;import android.os.*;import org.json.*;

/** A foreground app scheduler, independent of the Home WebView and IPTV activity. */
final class AdhanPlayback {
 private static AdhanPlayback instance;
 static AdhanPlayback get(Context c){if(instance==null)instance=new AdhanPlayback((Application)c.getApplicationContext());return instance;}
 private final Application app;private final Handler handler=new Handler(Looper.getMainLooper());private Activity foreground;private JSONObject schedule=new JSONObject();private long previous=System.currentTimeMillis();private MediaPlayer audio;private PlayerActivity interrupted;private boolean resumeVideo;private Dialog dialog;
 private AdhanPlayback(Application a){app=a;a.registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks(){
  public void onActivityResumed(Activity a){foreground=a;previous=System.currentTimeMillis();}
  public void onActivityPaused(Activity a){if(foreground==a){foreground=null;handler.postDelayed(()->{if(foreground==null)stop(false);},300);}}
  public void onActivityCreated(Activity a,Bundle b){}public void onActivityStarted(Activity a){}public void onActivityStopped(Activity a){}public void onActivitySaveInstanceState(Activity a,Bundle b){}public void onActivityDestroyed(Activity a){if(interrupted==a)stop(false);}
 });handler.post(tick);}
 void update(String value){try{JSONObject next=new JSONObject(value);handler.post(()->{schedule=next;if(!next.optBoolean("enabled"))stop(true);});}catch(JSONException ignored){}}
 void cancel(){handler.post(()->stop(true));}
 private final Runnable tick=new Runnable(){public void run(){long now=System.currentTimeMillis();if(schedule.optBoolean("enabled")&&foreground!=null&&!(foreground instanceof TimeUpActivity)){JSONArray items=schedule.optJSONArray("items");if(items!=null)for(int i=0;i<items.length();i++){JSONObject p=items.optJSONObject(i);if(p==null||!p.optBoolean("adhan")||!AdhanWindow.due(p.optLong("at"),previous,now,true))continue;String key=p.optString("name")+"|"+p.optLong("at");SharedPreferences prefs=app.getSharedPreferences("morph-adhan",0);if(key.equals(prefs.getString("last","")))continue;prefs.edit().putString("last",key).apply();start(p.optString("name"));break;}}previous=now;handler.postDelayed(this,1000);}};
 private void start(String prayer){stop(true);Activity owner=foreground;if(owner==null||owner.isFinishing())return;try{
  RadioPlayback.get(app).stop();interrupted=owner instanceof PlayerActivity?(PlayerActivity)owner:null;resumeVideo=interrupted!=null&&interrupted.pauseForAdhan();
  MediaPlayer current=new MediaPlayer();audio=current;current.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
  String voice="makka".equals(schedule.optString("voice"))?"makka":"egypt";
  try(AssetFileDescriptor fd=app.getAssets().openFd("tv/assets/prayer-"+voice+".mp3")){current.setDataSource(fd.getFileDescriptor(),fd.getStartOffset(),fd.getLength());}
  float volume=Math.max(0,Math.min(100,schedule.optInt("volume",60)))/100f;current.setVolume(volume,volume);current.setLooping(false);
  current.setOnCompletionListener(p->stop(true));current.setOnErrorListener((p,w,e)->{stop(true);return true;});current.setOnPreparedListener(p->{if(audio==p&&foreground!=null)p.start();else stop(false);});current.prepareAsync();
  dialog=AdhanScreen.show(owner,prayer,()->stop(true));handler.postDelayed(limit,270000);
 }catch(Exception e){stop(true);}}
 private final Runnable limit=()->stop(true);
 private void stop(boolean resume){handler.removeCallbacks(limit);MediaPlayer old=audio;audio=null;if(old!=null){old.setOnCompletionListener(null);old.setOnErrorListener(null);old.release();}Dialog oldDialog=dialog;dialog=null;if(oldDialog!=null)oldDialog.dismiss();PlayerActivity oldPlayer=interrupted;boolean wasPlaying=resumeVideo;interrupted=null;resumeVideo=false;if(oldPlayer!=null){oldPlayer.endAdhan(resume&&wasPlaying&&foreground==oldPlayer);}}
}
