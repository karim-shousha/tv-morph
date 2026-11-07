package local.morph.reviewcheck;
import android.app.*;import android.os.*;import android.content.*;import android.webkit.*;import java.lang.reflect.*;import java.util.concurrent.*;import org.json.*;
/** DOM-only installed-build verification. Never captures screen pixels or modifies saved accounts. */
public class MobileReviewInstrumentation extends Instrumentation {
 WebView web;
 String js(String code)throws Exception{CountDownLatch done=new CountDownLatch(1);String[] value={null};runOnMainSync(()->web.evaluateJavascript(code,r->{value[0]=r;done.countDown();}));if(!done.await(8,TimeUnit.SECONDS))throw new AssertionError("DOM timeout");return value[0];}
 public void onCreate(Bundle args){super.onCreate(args);start();}
 public void onStart(){Bundle out=new Bundle();try{
 Activity main=startActivitySync(new Intent().setClassName(getTargetContext().getPackageName(),"local.cleartv.mobile.MainActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));Field field=main.getClass().getDeclaredField("web");field.setAccessible(true);web=(WebView)field.get(main);
 Thread.sleep(1200);js("window.__startupMaxY=scrollY;window.__startupTimer=setInterval(function(){__startupMaxY=Math.max(__startupMaxY,scrollY)},50);true");Thread.sleep(5000);
 JSONObject style=new JSONObject(js("(function(){clearInterval(__startupTimer);var s=getComputedStyle(document.querySelector('.studio-reconnect')),g=getComputedStyle(document.getElementById('m30-gear-btn'));return {scrollY:scrollY,maxY:__startupMaxY,reconnect:s.backgroundColor,gear:g.backgroundColor,textSizeVisible:Array.from(document.querySelectorAll('.font-size-panel')).some(function(e){return e.getClientRects().length>0;})};})()"));
 if(style.optInt("scrollY")!=0||style.optInt("maxY")!=0)throw new AssertionError("Startup must remain at the top: "+style);
 if(!style.getString("reconnect").equals("rgba(0, 0, 0, 0)")||!style.getString("gear").equals("rgba(0, 0, 0, 0)"))throw new AssertionError("Header backgrounds: "+style);
 if(style.optBoolean("textSizeVisible"))throw new AssertionError("Text-size controls must stay hidden");
 js("Morph30.show('remote');true");Thread.sleep(150);
 if(!"true".equals(js("document.querySelector('#m30-control-segment [data-msub=remote]').getAttribute('aria-selected')==='true'")))throw new AssertionError("Remote must be visibly selected");
 js("Morph30.show('cast');true");Thread.sleep(150);
 if(!"true".equals(js("(function(){var s=document.getElementById('dlna-panel').innerText;return document.documentElement.lang==='ar'?!/[A-Za-z]{2,}/.test(s.replace(/DLNA/g,'')):!/[\\u0600-\\u06ff]/.test(s);})()")))throw new AssertionError("DLNA language mismatch");
 js("document.getElementById('m30-gear-btn').click();true");Thread.sleep(100);
 if(!"true".equals(js("(function(){var e=document.getElementById('m30-gear-sheet'),r=e.getBoundingClientRect();return r.x===0&&r.y===0&&Math.abs(r.width-innerWidth)<1&&Math.abs(r.height-innerHeight)<1&&getComputedStyle(e).backgroundColor===(document.documentElement.dataset.appAppearance==='dark'?'rgb(44, 60, 87)':'rgb(244, 247, 251)');})()")))throw new AssertionError("Settings must be an opaque full-screen page: "+js("(function(){var e=document.getElementById('m30-gear-sheet'),r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,w:r.width,h:r.height,vw:innerWidth,vh:innerHeight,bg:s.backgroundColor,hidden:e.hidden,display:s.display,opacity:s.opacity};})()"));
 js("document.getElementById('m30-settings-close').click();true");

 for(String mode:new String[]{"dark","light"}){
  js("MorphAppearance.set('"+mode+"');true");Thread.sleep(150);
  if(!mode.equals(getTargetContext().getSharedPreferences("cleartv",0).getString("appearance","")))throw new AssertionError("Native theme choice must match web choice");
  WebView host=web;
  for(String name:new String[]{"local.tvmorph.tv.PhoneIptvActivity","local.tvmorph.tv.NetworkActivity"}){
   Activity page=startActivitySync(new Intent().setClassName(getTargetContext().getPackageName(),name).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
   Field view=null;for(Class<?> c=page.getClass();c!=null;c=c.getSuperclass())try{view=c.getDeclaredField("web");break;}catch(NoSuchFieldException ignored){}
   view.setAccessible(true);web=(WebView)view.get(page);
   long until=SystemClock.uptimeMillis()+12000;while(SystemClock.uptimeMillis()<until&&!"true".equals(js("document.documentElement.dataset.appAppearance==='"+mode+"'")))Thread.sleep(80);
   if(!"true".equals(js("document.documentElement.dataset.appAppearance==='"+mode+"'")))throw new AssertionError(name+" must use "+mode);
   if(mode.equals("light")&&!"true".equals(js("getComputedStyle(document.body).backgroundColor==='rgb(244, 247, 251)'")))throw new AssertionError(name+" must render the light surface: "+js("getComputedStyle(document.body).backgroundColor"));
   runOnMainSync(page::finish);Thread.sleep(150);web=host;
  }
 }
 js("Morph30.show('home');window.scrollTo(0,0);true");out.putString("result","PASS installed APK: both saved themes propagate to native phone IPTV and local-network pages; no startup auto-scroll over 5 seconds; transparent Reconnect/settings; text-size controls hidden; selected Remote tab; one-language DLNA. No screenshots or saved-account changes.");out.putString("styles",style.toString());finish(Activity.RESULT_OK,out);
 }catch(Throwable e){out.putString("error",android.util.Log.getStackTraceString(e));finish(Activity.RESULT_CANCELED,out);}}
}
