package local.tvmorph.pagecheck;
import android.app.*;
import android.content.*;
import android.os.*;
import android.webkit.WebView;
import java.lang.reflect.Field;
import java.util.concurrent.*;
/** Runs against the installed signed launcher without changing user settings. */
public class LauncherPagesInstrumentation extends Instrumentation {
 @Override public void onCreate(Bundle args){super.onCreate(args);start();}
 private WebView web(Activity owner,String field)throws Exception {Field f=owner.getClass().getDeclaredField(field);f.setAccessible(true);return (WebView)f.get(owner);}
 private String eval(WebView browser,String expression)throws Exception {CountDownLatch done=new CountDownLatch(1);String[] answer={null};runOnMainSync(()->browser.evaluateJavascript(expression,v->{answer[0]=v;done.countDown();}));if(!done.await(5,TimeUnit.SECONDS))throw new AssertionError("Javascript timed out");return answer[0];}
 private void check(WebView browser,String expression)throws Exception {for(int i=0;i<60;i++){if("true".equals(eval(browser,expression)))return;Thread.sleep(100);}throw new AssertionError(expression+" returned "+eval(browser,expression));}
 private Activity open(String name){return startActivitySync(new Intent().setClassName("local.tvmorph.tv","local.tvmorph.tv."+name).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));}
 private void waitClosed(Activity owner)throws Exception {for(int i=0;i<40&&!owner.isFinishing();i++)Thread.sleep(50);if(!owner.isFinishing())throw new AssertionError("Back did not close "+owner.getClass().getSimpleName());}
 private Activity launchBridge(Activity home,WebView hw)throws Exception {ActivityMonitor monitor=addMonitor("local.tvmorph.tv.BridgeReceiverActivity",null,false);eval(hw,"ClearTV.Catalog.launch(ClearTV.Catalog.get('local.tvmorph.tv.bridge'));true");Activity bridge=waitForMonitorWithTimeout(monitor,5000);removeMonitor(monitor);if(bridge==null)throw new AssertionError("Bridge did not open");check(web(bridge,"browser"),"!!window.MorphReceiverBack&&!!document.getElementById('bridge-back')");return bridge;}
 private void phoneBack(Activity home)throws Exception {Field token=home.getClass().getDeclaredField("token");token.setAccessible(true);java.util.Map<String,String> headers=new java.util.HashMap<>();headers.put("x-tv-morph-token",String.valueOf(token.get(home)));java.lang.reflect.Method handle=home.getClass().getDeclaredMethod("handle",String.class,String.class,java.util.Map.class,byte[].class);handle.setAccessible(true);Object response=handle.invoke(home,"POST","/remote/key",headers,"{\"key\":\"RETURN\"}".getBytes("UTF-8"));Field code=response.getClass().getDeclaredField("code");code.setAccessible(true);if(code.getInt(response)!=200)throw new AssertionError("Remote route failed");}
 @Override public void onStart(){Bundle result=new Bundle();try{
  Activity radio=open("RadioActivity");WebView rw=web(radio,"web");
  check(rw,"!!(window.RadioUI&&window.MorphRadioPlayer&&window.RadioNavigation)&&document.querySelectorAll('.station').length===12");
  check(rw,"(function(){var p=document.querySelector('.now-playing'),style=getComputedStyle(p),overlay=getComputedStyle(p,'::after');return style.backgroundColor==='rgba(0, 0, 0, 0)'&&style.backgroundImage==='none'&&(overlay.content==='none'||overlay.content==='normal');})()");
  Thread.sleep(250);runOnMainSync(()->{if(rw.getVisibility()!=android.view.View.VISIBLE||rw.getAlpha()!=1f)throw new AssertionError("Radio frame was not revealed");});
  result.putString("maskSupport",eval(rw,"JSON.stringify({standard:CSS.supports('mask-composite','exclude'),webkit:CSS.supports('-webkit-mask-composite','xor')})"));
  android.graphics.Bitmap shot=getUiAutomation().takeScreenshot();try(java.io.FileOutputStream file=new java.io.FileOutputStream(new java.io.File(getTargetContext().getExternalFilesDir(null),"radio-cleanup-final.png"))){shot.compress(android.graphics.Bitmap.CompressFormat.PNG,100,file);}shot.recycle();
  check(rw,"document.documentElement.id==='radio-root'&&document.querySelectorAll('main>.now-playing').length===1&&!document.querySelector('.library-content,.library-sidebar,.radio-top-nav,.radio-hero')");
  check(rw,"!Array.from(document.querySelectorAll('script[src],link[href]')).some(function(n){return /premium-radio|cinematic|radio-layout|media-theme|internal-pages/.test(n.src||n.href);})");
  check(rw,"(function(){document.getElementById('radio-player-settings').click();RadioUI.remote('RETURN');return document.getElementById('radio-player-tools').hidden;})()");
  check(rw,"(function(){document.getElementById('radio-screen-off').click();var dark=RadioScreen.isDark();RadioUI.remote('RIGHT');return dark&&!RadioScreen.isDark();})()");
  sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK);Thread.sleep(200);if(!radio.isFinishing())throw new AssertionError("Radio Back did not finish Activity");
  Activity network=open("NetworkActivity");WebView nw=web(network,"web");
  check(nw,"!!window.NetworkUI&&!!window.ReferenceNetwork&&document.documentElement.id==='reference-network'");
  check(nw,"!Array.from(document.querySelectorAll('script[src],link[href]')).some(function(n){return /premium-network/.test(n.src||n.href);})");
  check(nw,"(function(){document.getElementById('manual').click();var shown=!document.getElementById('overlay').hidden;NetworkUI.back();return shown&&document.getElementById('overlay').hidden;})()");
  runOnMainSync(()->network.finish());
  Activity bridge=open("BridgeReceiverActivity");WebView bw=web(bridge,"browser");
  check(bw,"(function(){var image=document.querySelector('.bridge-connect-art');return image&&image.complete&&image.naturalWidth>0&&image.src.indexOf('bridge-devices-v2.webp')>=0;})()");
  check(bw,"(function(){var m=getComputedStyle(document.body).backgroundImage.match(/url\\(\"?([^\"\\)]+)\"?\\)/);if(!m)return false;if(!window.bridgeBackgroundProbe){window.bridgeBackgroundProbe=new Image();bridgeBackgroundProbe.src=m[1];}return bridgeBackgroundProbe.complete&&bridgeBackgroundProbe.naturalWidth>0;})()");
  result.putString("alignment",eval(bw,"JSON.stringify({dir:document.documentElement.dir,lang:document.documentElement.lang,nodes:Array.from(document.querySelectorAll('.reference-step-icon,.pair-copy>.eyebrow,.pair-copy>h1,.pair-copy>.muted')).map(function(n){return [n.className,n.getBoundingClientRect().left,n.getBoundingClientRect().right,getComputedStyle(n).direction]})})"));
  check(bw,"(function(){var icon=document.querySelector('.reference-step-icon').getBoundingClientRect();return Array.from(document.querySelectorAll('.pair-copy>.eyebrow,.pair-copy>h1,.pair-copy>.muted')).every(function(n){var r=n.getBoundingClientRect();return Math.abs((document.documentElement.dir==='rtl'?r.right-icon.right:r.left-icon.left))<2;});})()");
  Thread.sleep(200);runOnMainSync(()->{if(bw.getVisibility()!=android.view.View.VISIBLE||bw.getAlpha()!=1f)throw new AssertionError("Bridge frame was not revealed");});
  android.graphics.Bitmap bridgeShot=getUiAutomation().takeScreenshot();try(java.io.FileOutputStream file=new java.io.FileOutputStream(new java.io.File(getTargetContext().getExternalFilesDir(null),"bridge-cleanup-final.png"))){bridgeShot.compress(android.graphics.Bitmap.CompressFormat.PNG,100,file);}bridgeShot.recycle();
  eval(bw,"document.getElementById('btnDiag').click();true");check(bw,"!document.getElementById('screen-diag').classList.contains('hidden')");sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK);check(bw,"!document.getElementById('screen-pair').classList.contains('hidden')");
  eval(bw,"window.bridgeBackTrace=[];document.addEventListener('keydown',function(e){bridgeBackTrace.push({code:e.keyCode,key:e.key});},true);");
  sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK);Thread.sleep(500);
  if(!bridge.isFinishing()){result.putString("bridgeBackTrace",eval(bw,"JSON.stringify(window.bridgeBackTrace)"));throw new AssertionError("Hardware Back did not close Bridge");}
  Activity home=open("TvActivity");WebView hw=web(home,"web");check(hw,"!!window.ReferencePreview");eval(hw,"ClearTV.showView('settings');true");
  Activity remoteBridge=launchBridge(home,hw);phoneBack(home);waitClosed(remoteBridge);check(hw,"!document.getElementById('view-settings').hidden");
  Activity buttonBridge=launchBridge(home,hw);eval(web(buttonBridge,"browser"),"document.getElementById('bridge-back').click();true");waitClosed(buttonBridge);
  Activity escapeBridge=launchBridge(home,hw);sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_ESCAPE);waitClosed(escapeBridge);
  sendKeyDownUpSync(android.view.KeyEvent.KEYCODE_BACK);check(hw,"!document.getElementById('view-home').hidden");
  result.putString("result","PASS installed Android WebViews: one radio layout, 12 stations, no obsolete assets, settings and dark-screen Back, native Radio Back, current network shell and dialog Back, direct current Bridge artwork.");finish(Activity.RESULT_OK,result);
 }catch(Throwable error){result.putString("error",android.util.Log.getStackTraceString(error));finish(Activity.RESULT_CANCELED,result);}}
}
