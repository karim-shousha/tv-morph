package local.tvmorph.tv;

import android.app.Activity;
import android.os.*;
import android.media.AudioManager;
import android.net.Uri;
import android.view.View;import android.view.ViewGroup;import android.view.TextureView;
import androidx.media3.common.*;import androidx.media3.datasource.*;import androidx.media3.exoplayer.*;import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import android.webkit.WebView;
import android.widget.*;
import org.json.JSONObject;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

/** A single muted native preview. Coalesces pending work; never records viewing history. */
final class LivePreview {
 interface Resolver {String stream(JSONObject item)throws Exception;}
 private final Activity activity;private final FrameLayout root;private final WebView web;private final Resolver resolver;
 private final Handler main=new Handler(Looper.getMainLooper());private final ExecutorService worker=Executors.newSingleThreadExecutor();
 private final AtomicInteger generation=new AtomicInteger();private final AtomicReference<Job> pending=new AtomicReference<>();private final AtomicBoolean resolving=new AtomicBoolean();
 private volatile boolean enabled,closed;private FrameLayout holder;private ExoPlayer video;private String current="";private Runnable timeout;
 private static final class Job{final JSONObject item;final int token;Job(JSONObject value,int token){this.item=value;this.token=token;}}
 LivePreview(Activity activity,FrameLayout root,WebView web,Resolver resolver){this.activity=activity;this.root=root;this.web=web;this.resolver=resolver;}
 void active(boolean value){enabled=value;if(!value)stop();}
 void request(String data){if(!enabled||closed)return;try{JSONObject value=new JSONObject(data);if(!"live".equals(value.optString("kind"))||!value.optString("id").matches("[0-9]{1,14}"))return;pending.set(new Job(value,generation.incrementAndGet()));schedule();}catch(Exception ignored){}}
 private void schedule(){if(closed||!resolving.compareAndSet(false,true))return;try{worker.execute(()->{try{Job job;while((job=pending.getAndSet(null))!=null){final Job next=job;try{String url=resolver.stream(next.item);main.post(()->{if(enabled&&!closed&&next.token==generation.get()&&!activity.isFinishing())show(next,url);});}catch(Exception failure){main.post(()->{if(next.token==generation.get()){clear();state(next.item.optString("id"),"error");}});}}}finally{resolving.set(false);if(pending.get()!=null&&!closed)schedule();}});}catch(RejectedExecutionException ignored){resolving.set(false);}}
 private void show(Job job,String url){
  clear();final int token=job.token;current=job.item.optString("id");
  double vw=job.item.optDouble("viewportWidth",0),vh=job.item.optDouble("viewportHeight",0);if(vw<=0||vh<=0)return;
  double sx=web.getWidth()/vw,sy=web.getHeight()/vh;int left=Math.max(0,(int)(job.item.optDouble("x")*sx)),top=Math.max(0,(int)(job.item.optDouble("y")*sy));
  int width=Math.min(web.getWidth()-left,(int)(job.item.optDouble("width")*sx)),height=Math.min(web.getHeight()-top,(int)(job.item.optDouble("height")*sy));if(width<40||height<30){current="";return;}
  TextureView texture=new TextureView(activity);texture.setFocusable(false);texture.setFocusableInTouchMode(false);texture.setClickable(false);texture.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
  FrameLayout.LayoutParams layout=new FrameLayout.LayoutParams(width,height);layout.leftMargin=left;layout.topMargin=top;holder=new FrameLayout(activity);holder.setFocusable(false);holder.setFocusableInTouchMode(false);holder.setClickable(false);holder.setDescendantFocusability(ViewGroup.FOCUS_BLOCK_DESCENDANTS);holder.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);holder.setBackgroundColor(0xff040b14);holder.addView(texture,new FrameLayout.LayoutParams(-1,-1,android.view.Gravity.CENTER));root.addView(holder,layout);
  try{String agent="MorphTV/"+activity.getPackageManager().getPackageInfo(activity.getPackageName(),0).versionName;DefaultHttpDataSource.Factory http=new DefaultHttpDataSource.Factory().setUserAgent(agent).setConnectTimeoutMs(8000).setReadTimeoutMs(12000);DefaultLoadControl load=new DefaultLoadControl.Builder().setBufferDurationsMs(1500,8000,500,1000).setTargetBufferBytes(8*1024*1024).setPrioritizeTimeOverSizeThresholds(false).setBackBuffer(0,false).build();
   final ExoPlayer player=new ExoPlayer.Builder(activity,new DefaultRenderersFactory(activity).setEnableDecoderFallback(true)).setLoadControl(load).setMediaSourceFactory(new DefaultMediaSourceFactory(new DefaultDataSource.Factory(activity,http))).build();video=player;player.setAudioAttributes(new androidx.media3.common.AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MOVIE).build(),false);player.setVolume(0f);player.setTrackSelectionParameters(player.getTrackSelectionParameters().buildUpon().setTrackTypeDisabled(C.TRACK_TYPE_AUDIO,true).build());player.setVideoTextureView(texture);
   player.addListener(new Player.Listener(){@Override public void onPlaybackStateChanged(int state){if(token!=generation.get()||video!=player)return;if(state==Player.STATE_READY){if(timeout!=null)main.removeCallbacks(timeout);state(current,"playing");}else if(state==Player.STATE_ENDED){String id=current;clear();state(id,"error");}}@Override public void onPlayerError(PlaybackException error){if(token==generation.get()&&video==player){String id=current;clear();state(id,"error");}}});
   timeout=()->{if(token==generation.get()&&video==player){String id=current;clear();state(id,"error");}};main.postDelayed(timeout,15000);player.setMediaItem(MediaItem.fromUri(url));player.prepare();player.setPlayWhenReady(true);
  }catch(Exception failure){String id=current;clear();state(id,"error");}
 }
 private void state(String id,String value){if(!closed&&web!=null)web.evaluateJavascript("if(window.TvIptvLayout&&TvIptvLayout.previewState)TvIptvLayout.previewState("+JSONObject.quote(id)+","+JSONObject.quote(value)+")",null);}
 private void clear(){if(timeout!=null){main.removeCallbacks(timeout);timeout=null;}if(video!=null){ExoPlayer old=video;video=null;old.release();if(holder!=null){root.removeView(holder);holder=null;}}current="";}
 void stop(){generation.incrementAndGet();pending.set(null);if(Looper.myLooper()==Looper.getMainLooper())clear();else main.post(this::clear);}
 void close(){closed=true;enabled=false;stop();worker.shutdownNow();}
}
