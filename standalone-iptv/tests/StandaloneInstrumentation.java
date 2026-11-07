package local.morph.iptvcheck;
import android.app.*;import android.content.*;import android.os.*;import android.webkit.*;import java.lang.reflect.*;import java.util.concurrent.*;import org.json.*;
public class StandaloneInstrumentation extends Instrumentation {
 Activity activity;WebView web;
 void check(boolean ok,String message){if(!ok)throw new AssertionError(message);}
 String js(String source)throws Exception{CountDownLatch latch=new CountDownLatch(1);String[] result={""};runOnMainSync(()->web.evaluateJavascript(source,value->{result[0]=value;latch.countDown();}));if(!latch.await(8,TimeUnit.SECONDS))throw new AssertionError("Web callback timed out");return result[0];}
 Activity launch(){return startActivitySync(new Intent().setClassName("local.morph.iptv","local.morph.iptv.MainActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));}
 @Override public void onCreate(Bundle args){super.onCreate(args);start();}
 @Override public void onStart(){Bundle result=new Bundle();try{
  getTargetContext().getSharedPreferences("tvmorph-ui",0).edit().putString("language","en").commit();
  Class<?> phone=Class.forName("local.tvmorph.tv.PhoneIptvActivity",true,getTargetContext().getClassLoader());phone.getMethod("saveProfile",Context.class,JSONObject.class).invoke(null,getTargetContext(),new JSONObject().put("type","m3u").put("server","http://10.0.2.2:8766/owned.m3u").put("name","Owned local verification"));
  activity=launch();Field f=activity.getClass().getSuperclass().getDeclaredField("web");f.setAccessible(true);web=(WebView)f.get(activity);long until=SystemClock.uptimeMillis()+25000;while(SystemClock.uptimeMillis()<until&&!"true".equals(js("!!(window.IptvTvBridge&&document.body.dataset.source)")))Thread.sleep(100);
  check("true".equals(js("window.MorphIptvStandalone===true")),"Standalone flag reaches shared frontend");check("true".equals(js("!document.getElementById('nav-home')&&!!document.getElementById('stream-home')")),"Direct IPTV UI without Morph TV launcher");
  check("true".equals(js("IptvNative.supportsLivePreview()")),"TV product retains native live preview");
  check("true".equals(js("!!IptvTvBridge.homeInfo().configured")),"Owned M3U profile is available");
  android.content.pm.PackageManager pm=getTargetContext().getPackageManager();Intent launch=new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER).setPackage("local.morph.iptv");check(pm.queryIntentActivities(launch,0).size()==1,"Exactly one phone launcher entry");Intent leanback=new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER).setPackage("local.morph.iptv");check(pm.queryIntentActivities(leanback,0).size()==1,"Exactly one TV launcher entry");
  js("document.getElementById('home-open').click();true");sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK);Thread.sleep(200);check(!activity.isFinishing(),"First Back keeps the standalone product open");check("true".equals(js("document.getElementById('iptv-exit-hint').textContent.indexOf('exit')>=0")),"Exit hint belongs to standalone product");sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK);Thread.sleep(300);check(activity.isFinishing(),"Second Back exits without opening Morph TV");
  activity=launch();waitForIdleSync();check(!activity.isFinishing(),"Standalone relaunch does not loop or redirect to host");runOnMainSync(()->activity.finish());
  result.putString("result","PASS: direct IPTV startup, owned M3U, native live preview, one launcher entry per surface, double-Back exit and relaunch.");finish(Activity.RESULT_OK,result);
 }catch(Throwable e){result.putString("error",android.util.Log.getStackTraceString(e));if(activity!=null)runOnMainSync(()->activity.finish());finish(Activity.RESULT_CANCELED,result);}}
}
