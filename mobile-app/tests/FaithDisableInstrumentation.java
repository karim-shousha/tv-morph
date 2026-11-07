package local.morph.faithdisable;
import android.app.*;import android.content.*;import android.os.*;import android.webkit.*;import org.json.*;import java.lang.reflect.*;import java.util.concurrent.*;import java.util.concurrent.atomic.*;

/** Exercises the actual phone alarm/audio service and the WebView's off switch. */
public final class FaithDisableInstrumentation extends Instrumentation {
 Context context;Activity main;Class<?> prayer,service;WebView web;int checks;
 Object call(String name,Class<?>[] types,Object...args)throws Exception{Method m=prayer.getDeclaredMethod(name,types);m.setAccessible(true);return m.invoke(null,args);}
 JSONObject cmd(String operation)throws Exception{return command(new JSONObject().put("operation",operation));}
 JSONObject command(JSONObject data)throws Exception{return (JSONObject)call("command",new Class[]{Activity.class,JSONObject.class},main,data);}
 void check(boolean ok,String message){if(!ok)throw new AssertionError(message);checks++;Bundle b=new Bundle();b.putString("check",message);sendStatus(1,b);}
 boolean playing()throws Exception{Method m=service.getDeclaredMethod("isPlaying");m.setAccessible(true);return (Boolean)m.invoke(null);}
 void audio(boolean value)throws Exception{long end=SystemClock.uptimeMillis()+8000;while(SystemClock.uptimeMillis()<end){if(playing()==value)return;Thread.sleep(50);}throw new AssertionError("Audio state "+value);}
 String js(String expression)throws Exception{CountDownLatch latch=new CountDownLatch(1);AtomicReference<String> value=new AtomicReference<>();runOnMainSync(()->web.evaluateJavascript("(function(){"+expression+"})()",v->{value.set(v);latch.countDown();}));if(!latch.await(10,TimeUnit.SECONDS))throw new AssertionError("WebView timeout");return value.get();}
 void preview()throws Exception{command(new JSONObject().put("operation","preview").put("voice","egypt"));audio(true);}
 @Override public void onCreate(Bundle args){super.onCreate(args);start();}
 @Override public void onStart(){Bundle result=new Bundle();try{
  context=getTargetContext();prayer=Class.forName("local.cleartv.mobile.FaithPrayer",true,context.getClassLoader());service=Class.forName("local.cleartv.mobile.FaithAdhanService",true,context.getClassLoader());
  main=startActivitySync(new Intent().setClassName(context.getPackageName(),context.getPackageName()+".MainActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));Field f=main.getClass().getDeclaredField("web");f.setAccessible(true);web=(WebView)f.get(main);
  long end=SystemClock.uptimeMillis()+15000;while(SystemClock.uptimeMillis()<end&&!"true".equals(js("return !!window.MorphWorship;")))Thread.sleep(100);
  if(Build.VERSION.SDK_INT>=33)getUiAutomation().grantRuntimePermission(context.getPackageName(),"android.permission.POST_NOTIFICATIONS");
  command(new JSONObject().put("operation","host").put("enabled",true));
  JSONObject config=new JSONObject().put("latitude",30.0444).put("longitude",31.2357).put("timezone","Africa/Cairo").put("city","Cairo").put("method","egyptian").put("voice","egypt").put("enabled",true);
  command(new JSONObject().put("operation","save").put("settings",config));preview();
  JSONObject state=cmd("disable");audio(false);check(!state.getJSONObject("settings").optBoolean("enabled")&&!state.optBoolean("scheduled"),"Disable stops real audio and removes the pending automatic alarm");
  context.startForegroundService(new Intent(context,service).putExtra("prayer",0).putExtra("voice","egypt"));Thread.sleep(400);check(!playing(),"A stale alarm cannot restart disabled Adhan");
  command(new JSONObject().put("operation","save").put("settings",config));preview();command(new JSONObject().put("operation","host").put("enabled",false));audio(false);
  state=command(new JSONObject().put("operation","host").put("enabled",true));check(!state.getJSONObject("settings").optBoolean("enabled")&&!state.optBoolean("scheduled"),"Reopening Worship does not silently re-enable automatic audio");
  preview();Notification[] notices=java.util.Arrays.stream(context.getSystemService(NotificationManager.class).getActiveNotifications()).map(n->n.getNotification()).toArray(Notification[]::new);boolean stopped=false;for(Notification n:notices)if(n.actions!=null&&n.actions.length>0){n.actions[0].actionIntent.send();stopped=true;break;}check(stopped,"Playback notification exposes a Stop action");audio(false);
  js("localStorage.setItem('morph.first-run.pearl.v1','1');var t=document.getElementById('worship-enable');t.checked=true;t.dispatchEvent(new Event('change'));return true;");Thread.sleep(300);
  command(new JSONObject().put("operation","save").put("settings",config));preview();
  js("MorphWorship.openPrayer();return true;");Thread.sleep(300);js("var d=document.querySelector('.wf-prayer-settings');d.open=true;var t=document.getElementById('worship-adhan-enabled');t.checked=false;t.dispatchEvent(new Event('change'));return true;");audio(false);
  state=cmd("info");check(!state.getJSONObject("settings").optBoolean("enabled"),"The WebView off switch persists immediately without pressing Save");
  check("true".equals(js("document.querySelector('.wf-prayer-settings').open=false;var s=document.querySelector('.wf-prayer-stop');return !!s&&s.getBoundingClientRect().height>0;")),"Stop audio remains visible while prayer settings are collapsed");
  command(new JSONObject().put("operation","host").put("enabled",false));result.putString("result","PASS "+checks+" checks");finish(Activity.RESULT_OK,result);
 }catch(Throwable e){try{if(main!=null)main.stopService(new Intent(context,service));}catch(Exception ignored){}result.putString("error",android.util.Log.getStackTraceString(e));finish(Activity.RESULT_CANCELED,result);}}
}
