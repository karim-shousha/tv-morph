package local.tvmorph.cleanercheck;
import android.app.*;import android.content.*;import android.os.*;import android.view.*;import android.webkit.*;import java.lang.reflect.*;import java.util.concurrent.*;
public final class CleanerPresentationCheck extends Instrumentation {
 private Activity activity;private WebView web;
 public void onCreate(Bundle b){super.onCreate(b);start();}
 private void check(boolean value,String message){if(!value)throw new AssertionError(message);}
 private String js(final String script)throws Exception{final String[] value={null};final CountDownLatch done=new CountDownLatch(1);runOnMainSync(()->web.evaluateJavascript(script,result->{value[0]=result;done.countDown();}));check(done.await(5,TimeUnit.SECONDS),"WebView callback timed out");return value[0];}
 private void waitJs(String script)throws Exception{long end=SystemClock.uptimeMillis()+20000;while(SystemClock.uptimeMillis()<end){if("true".equals(js(script)))return;Thread.sleep(50);}throw new AssertionError("Timed out: "+script);}
 public void onStart(){Bundle result=new Bundle();try{
  getTargetContext().getSharedPreferences("CleanerActivity",0).edit().remove("folder").commit();
  String theme="{\"language\":\"ar\",\"tokens\":{\"--ui-panel-bg\":\"#102030\",\"--ui-bg-raised\":\"#223344\",\"--ui-text\":\"#f3e2d1\"}}";
  activity=startActivitySync(new Intent().setClassName(getTargetContext().getPackageName(),"local.tvmorph.tv.CleanerActivity").putExtra("cleanerTheme",theme).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
  Field field=activity.getClass().getDeclaredField("web");field.setAccessible(true);web=(WebView)field.get(activity);
  waitJs("!!window.MorphCleaner&&!!document.getElementById('morph-cleaner')");
  check("\"rgb(16, 32, 48)\"".equals(js("getComputedStyle(document.getElementById('morph-cleaner')).backgroundColor")),"Native Cleaner must preserve the exact host panel theme");
  check("\"rtl\"".equals(js("document.getElementById('morph-cleaner').dir")),"Native Arabic direction must follow host language");
  check(js("document.querySelector('[data-cleaner-scope=installers]').textContent").contains("ملفات"),"Native Arabic labels must follow host language");
  check("true".equals(js("(function(){var f=document.querySelector('#morph-cleaner>footer').getBoundingClientRect(),l=document.querySelector('.cleaner-list').getBoundingClientRect();return f.bottom<=innerHeight+1&&l.bottom<=f.top+1})()")),"Native footer must stay visible without overlapping files");
  js("document.querySelector('[data-cleaner-scope=installers]').click();true");Thread.sleep(1200);String notice=js("document.querySelector('.cleaner-status').textContent");if(!notice.contains("غير متاح")&&!notice.contains("تم إلغاء"))sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);
  waitJs("document.querySelector('.cleaner-status').textContent.indexOf('تم إلغاء')>=0||document.querySelector('.cleaner-status').textContent.indexOf('غير متاح')>=0");
  check("\"false\"".equals(js("document.getElementById('morph-cleaner').getAttribute('aria-busy')")),"Folder cancellation must leave scan usable");
  result.putString("result","PASS native Cleaner: exact theme handoff, Arabic labels/RTL, visible footer, installation-file scan reports folder cancellation/unavailability and leaves retry usable");finish(Activity.RESULT_OK,result);
 }catch(Throwable error){result.putString("error",android.util.Log.getStackTraceString(error));finish(Activity.RESULT_CANCELED,result);}finally{if(activity!=null)runOnMainSync(()->activity.finish());}}
}
