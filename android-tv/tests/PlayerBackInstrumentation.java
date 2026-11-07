package local.tvmorph.playerbackcheck;
import android.app.*;
import android.content.*;
import android.os.*;
import android.view.*;
import android.webkit.WebView;
import java.lang.reflect.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

public final class PlayerBackInstrumentation extends Instrumentation {
 private Activity home,player;private Bundle args;
 private final AtomicReference<Activity> resumed=new AtomicReference<>();
 @Override public void onCreate(Bundle value){super.onCreate(value);args=value;start();}
 private void check(boolean value,String message){if(!value)throw new AssertionError(message);}
 private Object field(Activity activity,String name)throws Exception{Class<?> type=activity.getClass();while(type!=null){try{Field f=type.getDeclaredField(name);f.setAccessible(true);return f.get(activity);}catch(NoSuchFieldException missing){type=type.getSuperclass();}}throw new NoSuchFieldException(name);}
 private void awaitHome()throws Exception{long end=SystemClock.uptimeMillis()+5000;while(SystemClock.uptimeMillis()<end&&resumed.get()!=home)Thread.sleep(20);check(resumed.get()==home&&!home.isFinishing(),"Back must resume the original launcher Activity");}
 private void launch(boolean live)throws Exception{
  // Match the production IPTV launch guard before directly opening the fixture player.
  if(home!=null&&home.getClass().getName().contains("IptvActivity")){Field f=home.getClass().getDeclaredField("returningFromPlayer");f.setAccessible(true);runOnMainSync(()->{try{f.setBoolean(home,true);}catch(Exception failure){throw new RuntimeException(failure);}});}
  Intent intent=new Intent().setClassName(getTargetContext().getPackageName(),"local.tvmorph.tv.PlayerActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).putExtra("url",args.getString("url")).putExtra("name","Player Back QA").putExtra("itemKind",live?"live":"vod").putExtra("itemId","player-back-qa").putExtra("live",live);
  player=startActivitySync(intent);long end=SystemClock.uptimeMillis()+25000;
  while(SystemClock.uptimeMillis()<end&&!Boolean.TRUE.equals(field(player,"prepared")))Thread.sleep(30);
  check(Boolean.TRUE.equals(field(player,"prepared")),"Fixture must decode before testing Back");waitForIdleSync();
 }
 @Override public void onStart(){Bundle result=new Bundle();try{
  Application app=(Application)getTargetContext().getApplicationContext();
  app.registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks(){
   public void onActivityResumed(Activity a){resumed.set(a);}
   public void onActivityCreated(Activity a,Bundle b){}public void onActivityStarted(Activity a){}public void onActivityPaused(Activity a){}public void onActivityStopped(Activity a){}public void onActivitySaveInstanceState(Activity a,Bundle b){}public void onActivityDestroyed(Activity a){}
  });
  if(getTargetContext().getPackageName().equals("local.tvmorph.tv")&&!args.getString("entry","local.tvmorph.tv.TvActivity").endsWith("TvActivity")){startActivitySync(new Intent().setClassName(getTargetContext().getPackageName(),"local.tvmorph.tv.TvActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));Thread.sleep(800);}
  home=startActivitySync(new Intent().setClassName(getTargetContext().getPackageName(),args.getString("entry","local.tvmorph.tv.TvActivity")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
  launch(false);
  final View back=player.getWindow().getDecorView().findViewWithTag("player-back");
  check(back!=null&&back.isShown()&&back.isEnabled()&&back.isFocusable(),"Visible native Back button must be usable");
  runOnMainSync(()->back.performClick());awaitHome();
  launch(false);
  final View gear=(View)field(player,"gearButton");runOnMainSync(()->gear.performClick());waitForIdleSync();
  check(((View)field(player,"rightPanel")).getVisibility()==View.VISIBLE,"Settings must open");
  sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);waitForIdleSync();
  check(!player.isFinishing()&&((View)field(player,"rightPanel")).getVisibility()!=View.VISIBLE,"First Back closes settings without exiting playback");
  sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);awaitHome();
  launch(true);
  sendKeySync(new KeyEvent(KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_BACK));
  sendKeySync(new KeyEvent(SystemClock.uptimeMillis(),SystemClock.uptimeMillis(),KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_BACK,1));
  check(!player.isFinishing(),"A held Back must wait for its key release");
  sendKeySync(new KeyEvent(KeyEvent.ACTION_UP,KeyEvent.KEYCODE_BACK));awaitHome();
  WebView web=(WebView)field(home,"web");CountDownLatch done=new CountDownLatch(1);final String[] exit={null};
  runOnMainSync(()->web.evaluateJavascript("String(window.ClearTV&&ClearTV.exitBackAt||0)",value->{exit[0]=value;done.countDown();}));
  done.await(3,TimeUnit.SECONDS);check("\"0\"".equals(exit[0]),"Player Back must not leak into launcher exit handling");
  result.putString("result","PASS native Android: visible Back returns to original launcher, settings close first, live held Back finishes only on release, no Back leaks to launcher exit");finish(Activity.RESULT_OK,result);
 }catch(Throwable failure){result.putString("error",android.util.Log.getStackTraceString(failure));if(player!=null&&!player.isFinishing())runOnMainSync(()->player.finish());finish(Activity.RESULT_CANCELED,result);}}
}
