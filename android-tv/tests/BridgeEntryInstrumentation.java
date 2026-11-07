package local.tvmorph.pagecheck;
import android.app.*;
import android.content.*;
import android.os.*;
import android.webkit.WebView;
import java.lang.reflect.Field;
import java.util.concurrent.*;
/** Runs against the installed signed launcher without changing user settings. */
public class BridgeEntryInstrumentation extends Instrumentation {
 @Override public void onCreate(Bundle args){super.onCreate(args);start();}
 private WebView web(Activity owner,String field)throws Exception {Field f=owner.getClass().getDeclaredField(field);f.setAccessible(true);return (WebView)f.get(owner);}
 private String eval(WebView browser,String expression)throws Exception {CountDownLatch done=new CountDownLatch(1);String[] answer={null};runOnMainSync(()->browser.evaluateJavascript(expression,v->{answer[0]=v;done.countDown();}));if(!done.await(5,TimeUnit.SECONDS))throw new AssertionError("Javascript timed out");return answer[0];}
 private void check(WebView browser,String expression)throws Exception {for(int i=0;i<60;i++){if("true".equals(eval(browser,expression)))return;Thread.sleep(100);}throw new AssertionError(expression+" returned "+eval(browser,expression));}
 private Activity open(String name){return startActivitySync(new Intent().setClassName("local.tvmorph.tv","local.tvmorph.tv."+name).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));}
 private android.widget.EditText editor(android.view.View view){if(view instanceof android.widget.EditText)return (android.widget.EditText)view;if(view instanceof android.view.ViewGroup){android.view.ViewGroup group=(android.view.ViewGroup)view;for(int i=0;i<group.getChildCount();i++){android.widget.EditText found=editor(group.getChildAt(i));if(found!=null)return found;}}return null;}
 @Override public void onStart(){Bundle result=new Bundle();try{
  Activity home=open("TvActivity");WebView hw=web(home,"web");check(hw,"!!window.ReferencePreview&&!!document.getElementById('reference-card-bridge')");Thread.sleep(500);
  ActivityMonitor monitor=addMonitor("local.tvmorph.tv.BridgeReceiverActivity",null,false);
  eval(hw,"document.getElementById('reference-card-bridge').click();true");
  Activity bridge=waitForMonitorWithTimeout(monitor,5000);if(bridge==null)throw new AssertionError("Home card did not open native Bridge");WebView bw=web(bridge,"browser");
  check(bw,"!!window.MorphReceiverInput&&!!window.MorphDevice");
  eval(bw,"window.editorSaves=[];window.MorphReceiverInput=function(id,value,cancelled){editorSaves.push({id:id,value:value,cancelled:cancelled});};MorphDevice.editInput('inPhoneSetupCode','123456');true");
  Field entry=bridge.getClass().getDeclaredField("textEntry");entry.setAccessible(true);
  android.app.AlertDialog dialog=null;for(int i=0;i<50&&dialog==null;i++){Thread.sleep(50);dialog=(android.app.AlertDialog)entry.get(bridge);}
  if(dialog==null)throw new AssertionError("Native Android code editor did not open");final android.app.AlertDialog activeDialog=dialog;
  runOnMainSync(()->{android.widget.EditText field=editor(activeDialog.getWindow().getDecorView());if(field==null)throw new AssertionError("Missing code field");field.onEditorAction(android.view.inputmethod.EditorInfo.IME_ACTION_DONE);});
  check(bw,"editorSaves.length===1&&editorSaves[0].value==='123456'&&!editorSaves[0].cancelled");Thread.sleep(300);
  if(entry.get(bridge)!=null)throw new AssertionError("Keyboard Done must close the native editor exactly once");
  StringBuilder trace=new StringBuilder();long origin=SystemClock.uptimeMillis();
  for(int i=0;i<8;i++){final int index=i;runOnMainSync(()->trace.append(index+":"+(SystemClock.uptimeMillis()-origin)+":alpha="+bw.getAlpha()+";"));android.graphics.Bitmap shot=getUiAutomation().takeScreenshot();try(java.io.FileOutputStream file=new java.io.FileOutputStream(new java.io.File(getTargetContext().getExternalFilesDir(null),"bridge-entry-"+i+".png"))){shot.compress(android.graphics.Bitmap.CompressFormat.PNG,100,file);}shot.recycle();Thread.sleep(90);}
  result.putString("trace",trace.toString());result.putString("layout",eval(bw,"JSON.stringify({ready:document.readyState,body:document.body.className,app:document.getElementById('app').getBoundingClientRect().toJSON(),layers:Array.from(document.querySelectorAll('body>*')).map(function(n){return [n.tagName,n.id,getComputedStyle(n).position,getComputedStyle(n).zIndex]})})"));
  result.putString("result","PASS native Bridge entry and keyboard Done closes the editor with exactly one code confirmation");finish(Activity.RESULT_OK,result);
 }catch(Throwable error){result.putString("error",android.util.Log.getStackTraceString(error));finish(Activity.RESULT_CANCELED,result);}}
}
