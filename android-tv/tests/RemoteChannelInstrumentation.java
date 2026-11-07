package local.tvmorph.channelcheck;
import android.app.*;import android.os.*;import android.content.*;import android.view.*;import android.webkit.*;import android.widget.*;import java.lang.reflect.*;import java.util.concurrent.*;
/** A detached player fixture exercises real key dispatch without opening media or modifying accounts. */
public class RemoteChannelInstrumentation extends Instrumentation {
 Class<?> playerClass,iptvClass;Activity player,source;WebView web;Object previousSource;
 void set(Class<?> type,Object instance,String name,Object value)throws Exception{Field f=type.getDeclaredField(name);f.setAccessible(true);f.set(instance,value);}
 String js(String code)throws Exception{CountDownLatch done=new CountDownLatch(1);String[] value={null};runOnMainSync(()->web.evaluateJavascript(code,r->{value[0]=r;done.countDown();}));if(!done.await(5,TimeUnit.SECONDS))throw new AssertionError("JS callback timeout");return value[0];}
 public void onCreate(Bundle args){super.onCreate(args);start();}
 public void onStart(){Bundle result=new Bundle();try{
 playerClass=Class.forName("local.tvmorph.tv.PlayerActivity",true,getTargetContext().getClassLoader());iptvClass=Class.forName("local.tvmorph.tv.IptvActivity",true,getTargetContext().getClassLoader());
 Field active=iptvClass.getDeclaredField("channelSource");active.setAccessible(true);previousSource=active.get(null);
 runOnMainSync(()->{try{player=(Activity)playerClass.newInstance();source=(Activity)iptvClass.newInstance();player.setIntent(new Intent().putExtra("itemId","fixture-live"));set(playerClass,player,"live",true);set(playerClass,player,"controls",new LinearLayout(getTargetContext()));web=new WebView(getTargetContext());web.getSettings().setJavaScriptEnabled(true);set(iptvClass,source,"web",web);active.set(null,source);web.loadDataWithBaseURL(null,"<script>window.zaps=[];window.IptvUI={changeLive:function(delta,id){zaps.push([delta,id])}};</script>","text/html","UTF-8",null);}catch(Exception error){throw new RuntimeException(error);}});
 for(int i=0;i<40&&!"true".equals(js("!!window.IptvUI"));i++)Thread.sleep(25);
 runOnMainSync(()->{if(!player.dispatchKeyEvent(new KeyEvent(0,166))||!player.dispatchKeyEvent(new KeyEvent(1,166)))throw new AssertionError("CH+ must be consumed with controls visible");long now=SystemClock.uptimeMillis();player.dispatchKeyEvent(new KeyEvent(now,now,0,166,1));});
 if(!"[[1,\"fixture-live\"]]".equals(js("JSON.stringify(zaps)" ).replace("\\\"","\"").replaceAll("^\"|\"$","")))throw new AssertionError("CH+ must zap once: "+js("JSON.stringify(zaps)"));
 runOnMainSync(()->{try{set(playerClass,player,"lastChannelKey",0L);}catch(Exception e){throw new RuntimeException(e);}if(!player.dispatchKeyEvent(new KeyEvent(0,167))||!player.dispatchKeyEvent(new KeyEvent(1,167)))throw new AssertionError("CH- must be consumed with controls visible");});
 if(!"2".equals(js("zaps.length"))||!"-1".equals(js("zaps[1][0]")))throw new AssertionError("CH- must select the previous channel once");
 result.putString("result","PASS real Android player CH+ and CH- with visible controls; one zap per press; repeat/key-up consumed; existing channel source used. No media, account changes or screenshots.");finish(Activity.RESULT_OK,result);
 }catch(Throwable error){result.putString("error",android.util.Log.getStackTraceString(error));finish(Activity.RESULT_CANCELED,result);}finally{runOnMainSync(()->{try{set(iptvClass,null,"channelSource",previousSource);if(web!=null)web.destroy();}catch(Exception ignored){}});}}
}
