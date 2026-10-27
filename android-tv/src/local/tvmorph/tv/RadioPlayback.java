package local.tvmorph.tv;
import android.webkit.*;import android.app.*;import android.content.*;import android.media.*;import android.os.*;import org.json.*;import java.util.*;

/** Audio belongs to the foreground Morph TV session, independently of its radio screen. */
final class RadioPlayback {
 static final String ID="local.tvmorph.tv.radio";
 private static RadioPlayback instance;
 static RadioPlayback get(Context c){if(instance==null)instance=new RadioPlayback(c.getApplicationContext());return instance;}
 interface Listener{void changed(String id,String state,String message);}
 private final Context app;private final Handler handler=new Handler(Looper.getMainLooper());private MediaPlayer player;private WebView alternate;private AudioFocusRequest focus;private int generation,visible,focusEpoch;private boolean prepared;private String selected="",state="stopped",message="",viewer="";private Listener listener;
 private RadioPlayback(Context c){app=c;((Application)c).registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks(){
  public void onActivityStarted(Activity a){visible++;handler.removeCallbacks(background);if(a instanceof PlayerActivity||a instanceof InputActivity||a instanceof TimeUpActivity)stop();}
  public void onActivityStopped(Activity a){visible=Math.max(0,visible-1);if(visible==0)handler.postDelayed(background,500);}
  public void onActivityCreated(Activity a,Bundle b){}public void onActivityResumed(Activity a){}public void onActivityPaused(Activity a){}public void onActivitySaveInstanceState(Activity a,Bundle b){}public void onActivityDestroyed(Activity a){}
 });}
 private final Runnable background=()->{if(visible==0)stop();};
 void attach(Listener l){listener=l;if(!selected.isEmpty())l.changed(selected,state,message);}
 void detach(Listener l){if(listener==l)listener=null;}
 private String t(String ar,String en){return UiSettings.text(app,ar,en);}
 private String currentViewer(){return UiSettings.prefs(app).getString("viewerId","default");}
 private void publish(String next,String text){state=next;message=text;if(listener!=null)listener.changed(selected,state,message);}
 JSONObject status(){if(!viewer.isEmpty()&&!viewer.equals(currentViewer()))handler.post(()->stop());try{return new JSONObject().put("id",selected).put("state",state).put("message",message).put("active",player!=null||alternate!=null);}catch(Exception e){return new JSONObject();}}
 private void release(){generation++;focusEpoch++;prepared=false;handler.removeCallbacks(timeout);ParentalTimer.leave(ID);if(alternate!=null){alternate.removeJavascriptInterface("RadioSession");alternate.destroy();alternate=null;}if(player!=null){player.release();player=null;}if(focus!=null){((AudioManager)app.getSystemService(Context.AUDIO_SERVICE)).abandonAudioFocusRequest(focus);focus=null;}}
 private final Runnable timeout=()->{if(!prepared){if(alternate==null&&!selected.isEmpty())playAlternate(selected);else{release();publish("failed",t("تعذر الاتصال. اضغط إعادة الاتصال للمحاولة.","Connection failed. Select Reconnect to try again."));}}};
 void stop(){release();viewer="";publish("stopped",t("تم إيقاف الراديو","Radio stopped"));}
 void play(String id){JSONObject station=null;try{JSONArray rows=RadioActivity.catalog(app);for(int i=0;i<rows.length();i++)if(id.equals(rows.getJSONObject(i).optString("id")))station=rows.getJSONObject(i);}catch(Exception ignored){}if(station==null)return;
  if(!station.optBoolean("available",true)||ParentalTimer.remaining(app,ID)==0){stop();return;}release();selected=id;viewer=currentViewer();final int run=generation;final JSONObject row=station;publish("connecting",t("جاري الاتصال…","Connecting…"));
  player=new MediaPlayer();player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
  player.setOnPreparedListener(p->{if(run!=generation)return;prepared=true;handler.removeCallbacks(timeout);if(!audioFocus()){stop();return;}try{p.start();ParentalTimer.enter(app,ID);publish("playing",t("على الهواء","On air"));}catch(Exception e){stop();}});
  player.setOnErrorListener((p,w,e)->{if(run==generation)playAlternate(id);return true;});
  player.setOnCompletionListener(p->{if(run==generation)stop();});
  try{java.util.Map<String,String> headers=new java.util.HashMap<>();headers.put("User-Agent","MorphTV/0.8.102");headers.put("Icy-MetaData","0");player.setVolume(1f,1f);player.setDataSource(app,android.net.Uri.parse(row.getString("streamUrl")),headers);player.prepareAsync();handler.postDelayed(timeout,12000);}catch(Exception e){playAlternate(id);}
 }
 private boolean audioFocus(){final int focusRun=generation,requestEpoch=++focusEpoch;AudioManager audio=(AudioManager)app.getSystemService(Context.AUDIO_SERVICE);if(focus!=null)audio.abandonAudioFocusRequest(focus);focus=new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build()).setOnAudioFocusChangeListener(change->{if(focusRun==generation&&requestEpoch==focusEpoch&&change<0)pause();}).build();return audio.requestAudioFocus(focus)==AudioManager.AUDIOFOCUS_REQUEST_GRANTED;}
 // The alternate audio element belongs to the session, never the disposable radio Activity.
 void playAlternate(String id){JSONObject station=null;try{JSONArray rows=RadioActivity.catalog(app);for(int i=0;i<rows.length();i++)if(id.equals(rows.getJSONObject(i).optString("id")))station=rows.getJSONObject(i);}catch(Exception ignored){}if(station==null||!station.optBoolean("available",true)||ParentalTimer.remaining(app,ID)==0){stop();return;}
  String url=station.optString("streamUrl");if(!url.startsWith("https://")&&!url.startsWith("http://")){stop();return;}release();selected=id;viewer=currentViewer();final int run=generation;publish("connecting",t("جاري الاتصال…","Connecting…"));
  alternate=new WebView(app);alternate.getSettings().setJavaScriptEnabled(true);alternate.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);alternate.getSettings().setMediaPlaybackRequiresUserGesture(false);alternate.getSettings().setAllowFileAccess(false);alternate.getSettings().setAllowContentAccess(false);
  alternate.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){return true;}@Override public void onReceivedSslError(WebView v,SslErrorHandler h,android.net.http.SslError error){h.cancel();}});
  alternate.addJavascriptInterface(new AlternateEvents(run),"RadioSession");
  String source=JSONObject.quote(url).replace("<","\\u003c");
  alternate.loadDataWithBaseURL("https://morphtv.herroshetta.com/","<audio id='a'></audio><script>var a=document.getElementById('a');a.onplaying=function(){RadioSession.event('playing')};a.onpause=function(){RadioSession.event('paused')};a.onerror=function(){RadioSession.event('failed')};a.onended=function(){RadioSession.event('ended')};a.src="+source+";a.play().catch(function(){RadioSession.event('failed')});</script>","text/html","UTF-8",null);handler.postDelayed(timeout,15000);
 }
 private final class AlternateEvents{private final int run;AlternateEvents(int value){run=value;}@JavascriptInterface public void event(String value){handler.post(()->{if(run!=generation||alternate==null)return;if(value.equals("playing")){prepared=true;handler.removeCallbacks(timeout);ParentalTimer.enter(app,ID);publish("playing",t("على الهواء","On air"));}else if(value.equals("paused")){ParentalTimer.leave(ID);publish("paused",t("متوقف مؤقتًا","Paused"));}else if(value.equals("ended"))stop();else if(value.equals("failed")){release();publish("failed",t("تعذر الاتصال بالبث","Could not connect to the stream"));}});}}
 private void pause(){if(!prepared)return;if(alternate!=null)alternate.evaluateJavascript("document.getElementById('a').pause()",null);else if(player!=null)try{player.pause();}catch(Exception ignored){}ParentalTimer.leave(ID);publish("paused",t("متوقف مؤقتًا","Paused"));}
 void toggle(){if(!prepared||(player==null&&alternate==null))return;if("playing".equals(state)){pause();return;}if(ParentalTimer.remaining(app,ID)==0){stop();return;}// Chromium owns audio focus for its audio element; do not compete with it.
 if(alternate!=null||audioFocus())try{if(alternate!=null)alternate.evaluateJavascript("document.getElementById('a').play().catch(function(){RadioSession.event('failed')})",null);else{player.start();ParentalTimer.enter(app,ID);publish("playing",t("على الهواء","On air"));}}catch(Exception e){stop();}}

}

