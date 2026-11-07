package local.tvmorph.receivercheck;
import android.app.*;import android.content.*;import android.os.*;import android.webkit.WebView;import android.view.*;import android.widget.*;
import java.lang.reflect.*;import java.util.*;import java.util.concurrent.*;import org.json.JSONObject;

/** Real Android editor activation and device-wide trial persistence. */
public class ReceiverReviewInstrumentation extends Instrumentation {
 Activity screen;WebView web;
 @Override public void onCreate(Bundle args){super.onCreate(args);start();}
 Object field(String name)throws Exception{Field f=screen.getClass().getDeclaredField(name);f.setAccessible(true);return f.get(screen);}
 String js(String code)throws Exception{CountDownLatch done=new CountDownLatch(1);String[] value={null};runOnMainSync(()->web.evaluateJavascript(code,v->{value[0]=v;done.countDown();}));if(!done.await(5,TimeUnit.SECONDS))throw new AssertionError("WebView did not respond");return value[0];}
 void check(boolean value,String message){if(!value)throw new AssertionError(message);}
 EditText editor(View view){if(view instanceof EditText)return (EditText)view;if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++){EditText found=editor(((ViewGroup)view).getChildAt(i));if(found!=null)return found;}return null;}
 @Override public void onStart(){Bundle result=new Bundle();try{
  Context context=getTargetContext();SharedPreferences prefs=context.getSharedPreferences("morph-bridge-trial",0);Map<String,?> old=new HashMap<>(prefs.getAll());
  try{
   prefs.edit().clear().commit();Class<?> access=Class.forName("local.tvmorph.tv.BridgeAccess",true,context.getClassLoader());Method status=access.getDeclaredMethod("status",Context.class,boolean.class);status.setAccessible(true);
   JSONObject first=(JSONObject)status.invoke(null,context,true);long start=first.getLong("startedAt");check(start>0,"Trial begins on first launch");check(first.getLong("remainingMs")>259190000,"72-hour duration");
   check(((JSONObject)status.invoke(null,context,false)).getLong("startedAt")==start,"Trial remains the same across repeated checks");
   prefs.edit().putLong("start",System.currentTimeMillis()-259200001L).commit();check(((JSONObject)status.invoke(null,context,false)).getBoolean("expired"),"Trial expires after 72 hours");
  }finally{SharedPreferences.Editor restore=prefs.edit().clear();for(Map.Entry<String,?> e:old.entrySet()){if(e.getValue() instanceof Long)restore.putLong(e.getKey(),(Long)e.getValue());else if(e.getValue() instanceof Boolean)restore.putBoolean(e.getKey(),(Boolean)e.getValue());}restore.commit();}
  screen=startActivitySync(new Intent().setClassName(context.getPackageName(),"local.tvmorph.tv.BridgeReceiverActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));web=(WebView)field("browser");
  long until=SystemClock.elapsedRealtime()+7000;while(SystemClock.elapsedRealtime()<until&&!"true".equals(js("typeof window.MorphReceiverKey==='function'")))Thread.sleep(50);
  final int height=web.getHeight();js("window.MorphReceiverKey(13,false,false)");
  AlertDialog dialog=null;until=SystemClock.elapsedRealtime()+3000;while(SystemClock.elapsedRealtime()<until){dialog=(AlertDialog)field("textEntry");if(dialog!=null&&dialog.isShowing())break;Thread.sleep(40);}
  check(dialog!=null&&dialog.isShowing(),"D-pad OK opens the system text editor");Thread.sleep(600);check(web.getHeight()==height,"Keyboard must not shrink the receiver");
  final AlertDialog input=dialog;runOnMainSync(()->{EditText text=editor(input.getWindow().getDecorView());check(text!=null,"Native EditText exists");text.setText("10.0.2.2");input.getButton(-1).performClick();});
  until=SystemClock.elapsedRealtime()+3000;while(SystemClock.elapsedRealtime()<until&&!"\"10.0.2.2\"".equals(js("document.getElementById('inIp').value")))Thread.sleep(40);
  check("\"10.0.2.2\"".equals(js("document.getElementById('inIp').value")),"Typed IP reaches the receiver");
  result.putString("result","PASS native IP editor via D-pad, stable keyboard viewport, saved value, and persistent 72-hour trial expiry");
  runOnMainSync(()->screen.finish());finish(Activity.RESULT_OK,result);
 }catch(Throwable error){result.putString("error",android.util.Log.getStackTraceString(error));if(screen!=null)runOnMainSync(()->screen.finish());finish(Activity.RESULT_CANCELED,result);}}
}
