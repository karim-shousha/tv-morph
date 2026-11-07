package local.cleartv.bridgewizardcheck;

import android.app.*;
import android.content.*;
import android.os.*;
import android.view.*;
import android.widget.*;
import java.lang.reflect.*;
import java.util.*;

/** Native AR/EN setup and app-picker regression checks, using emulator fixtures only. */
public final class BridgeWizardInstrumentation extends Instrumentation {
 private boolean runtimeOnly,discoveryOnly,cleanerOnly;private String updateUrl;
 @Override public void onCreate(Bundle args){super.onCreate(args);runtimeOnly=args!=null&&"true".equals(args.getString("runtimeOnly"));discoveryOnly=args!=null&&"true".equals(args.getString("discoveryOnly"));cleanerOnly=args!=null&&"true".equals(args.getString("cleanerOnly"));updateUrl=args==null?null:args.getString("updateUrl");start();}
 private String js(android.webkit.WebView web,String script)throws Exception{java.util.concurrent.CountDownLatch done=new java.util.concurrent.CountDownLatch(1);String[] value={null};runOnMainSync(()->web.evaluateJavascript(script,r->{value[0]=r;done.countDown();}));if(!done.await(3,java.util.concurrent.TimeUnit.SECONDS))throw new AssertionError("Renderer blocked waiting for Cleaner scan");return value[0];}
 private Field field(Object a,String name)throws Exception {Field f=a.getClass().getDeclaredField(name);f.setAccessible(true);return f;}
 private void set(Object a,String name,Object value)throws Exception {field(a,name).set(a,value);}
 private static void nodes(View v,List<View> out){out.add(v);if(v instanceof ViewGroup){ViewGroup g=(ViewGroup)v;for(int i=0;i<g.getChildCount();i++)nodes(g.getChildAt(i),out);}}
 private List<View> views(Activity a){List<View> all=new ArrayList<>();nodes(a.getWindow().getDecorView(),all);return all;}
 private Button button(Activity a,String... keys){for(View v:views(a))if(v instanceof Button)for(String key:keys)if(((Button)v).getText().toString().contains(key))return (Button)v;throw new AssertionError("Missing action "+Arrays.toString(keys));}
 private void click(Button b){runOnMainSync(b::performClick);waitForIdleSync();}
 private int inputs(Activity a){int n=0;for(View v:views(a))if(v instanceof EditText)n++;return n;}
 private void render(Activity a)throws Exception {Method m=a.getClass().getDeclaredMethod("render");m.setAccessible(true);m.invoke(a);}
 private void page(Activity a,int n){runOnMainSync(()->{try{((Handler)field(a,"handler").get(a)).removeCallbacksAndMessages(null);set(a,"stage",n);set(a,"manual",false);set(a,"notificationGuide",false);render(a);}catch(Exception e){throw new RuntimeException(e);}});waitForIdleSync();}
 private void capture(Activity a,String name)throws Exception {
  runOnMainSync(()->{try{
   View v=((ViewGroup)a.findViewById(android.R.id.content)).getChildAt(0);float density=a.getResources().getDisplayMetrics().density;
   int width=Math.round(390*density),height=Math.round(844*density);v.scrollTo(0,0);
   v.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(height,View.MeasureSpec.EXACTLY));v.layout(0,0,width,height);
   if(name.startsWith("apps-before-helper"))for(View child:views(a))if(child instanceof GridView){
    if(child.getHeight()<Math.round(220*density))throw new AssertionError("App picker must have at least 220dp for browsing multiple rows; got "+child.getHeight()/density);
    if(((GridView)child).getAdapter().getCount()<12)throw new AssertionError("Incomplete scrolling fixture");
   }
   android.graphics.Bitmap image=android.graphics.Bitmap.createBitmap(width,height,android.graphics.Bitmap.Config.ARGB_8888);v.draw(new android.graphics.Canvas(image));
   java.io.File dir=new java.io.File(a.getExternalFilesDir(null),"bridge-wizard-qa");dir.mkdirs();
   try(java.io.FileOutputStream out=new java.io.FileOutputStream(new java.io.File(dir,name+".png"))){image.compress(android.graphics.Bitmap.CompressFormat.PNG,100,out);}image.recycle();
  }catch(Exception e){throw new RuntimeException(e);}});
 }
 @Override public void onStart(){Bundle result=new Bundle();Activity a=null;SharedPreferences prefs=getTargetContext().getSharedPreferences("cleartv",0);String language=prefs.getString("language","ar");
  try{
   if(cleanerOnly){
    a=startActivitySync(new Intent().setClassName(getTargetContext().getPackageName(),"local.tvmorph.tv.CleanerActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    android.webkit.WebView web=(android.webkit.WebView)field(a,"web").get(a);
    for(int i=0;i<30&&!"true".equals(js(web,"!!(window.MorphCleaner&&MorphCleaner.isOpen())"));i++)Thread.sleep(100);
    if(!"true".equals(js(web,"MorphCleaner.isOpen()")))throw new AssertionError("Cleaner failed to open");
    java.util.concurrent.ExecutorService worker=(java.util.concurrent.ExecutorService)field(a,"worker").get(a);java.util.concurrent.CountDownLatch release=new java.util.concurrent.CountDownLatch(1),entered=new java.util.concurrent.CountDownLatch(1);
    worker.execute(()->{entered.countDown();try{release.await();}catch(InterruptedException expected){Thread.currentThread().interrupt();}});entered.await(2,java.util.concurrent.TimeUnit.SECONDS);
    try{
     if(!"true".equals(js(web,"MorphCleaner.scan('cache');document.getElementById('morph-cleaner').getAttribute('aria-busy')==='true'")))throw new AssertionError("Scan must remain pending without blocking rendering");
     runOnMainSync(()->web.evaluateJavascript("document.querySelector('#morph-cleaner header button').click()",null));
     long until=System.currentTimeMillis()+2000;while(!a.isFinishing()&&!a.isDestroyed()&&System.currentTimeMillis()<until)Thread.sleep(25);
     if(!a.isFinishing()&&!a.isDestroyed())throw new AssertionError("Close failed while native scan was pending");
    }finally{release.countDown();}
    a=null;result.putString("result","PASS native Cleaner closes during pending scan without blocking rendering or running file operations");finish(Activity.RESULT_OK,result);return;
   }
   if(updateUrl!=null){
    Class<?> type=Class.forName("local.cleartv.mobile.AndroidTv");Method token=type.getDeclaredMethod("token",Context.class,String.class);token.setAccessible(true);
    String authorization=(String)token.invoke(null,getTargetContext(),"10.0.0.137");
    if(updateUrl.equals("check")){result.putString("result","TV update authorization available");finish(Activity.RESULT_OK,result);return;}
    Method request=type.getDeclaredMethod("request",String.class,String.class,org.json.JSONObject.class,String.class);request.setAccessible(true);
    Object reply=request.invoke(null,"10.0.0.137","/update",new org.json.JSONObject().put("url",updateUrl),authorization);
    result.putString("result",String.valueOf(reply));finish(Activity.RESULT_OK,result);return;
   }
   if(discoveryOnly){
    Class<?> managerType=Class.forName("tv.appbridge.phase0.rt.session.SessionManager");Object manager=managerType.getConstructor(Context.class).newInstance(getTargetContext());
    String ip=(String)managerType.getMethod("localIp").invoke(manager);
    Class<?> type=Class.forName("tv.appbridge.phase0.rt.tv.TvDiscovery");Object scanner=type.getField("INSTANCE").get(null);
    android.net.wifi.WifiManager wifi=(android.net.wifi.WifiManager)getTargetContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
    android.net.wifi.WifiManager.MulticastLock lock=wifi.createMulticastLock("morph-discovery-qa");lock.acquire();Object found;
    try{found=type.getMethod("scan",long.class,String.class).invoke(scanner,4500L,ip);}finally{lock.release();}
    result.putString("devices",String.valueOf(found));result.putString("result","PASS real phone LAN discovery");finish(Activity.RESULT_OK,result);return;
   }
   Class<?> provider=Class.forName("tv.appbridge.phase0.rt.session.EmbeddedShellProvider");Object companion=provider.getField("Companion").get(null);
   if(runtimeOnly){
    long end=System.currentTimeMillis()+40000;while(!(Boolean)companion.getClass().getMethod("ready").invoke(companion)&&System.currentTimeMillis()<end)Thread.sleep(100);
    if(!(Boolean)companion.getClass().getMethod("ready").invoke(companion))throw new AssertionError("Real helper Binder not ready");
    Class<?> backend=Class.forName("tv.appbridge.phase0.rt.session.ShizukuBackend");Object shell=backend.getConstructor(Context.class).newInstance(getTargetContext());
    Object execution=backend.getMethod("exec",List.class).invoke(shell,Arrays.asList("id"));
    if((Integer)execution.getClass().getMethod("getCode").invoke(execution)!=0||!((String)execution.getClass().getMethod("getOut").invoke(execution)).contains("uid=2000"))throw new AssertionError("Real shell check failed");
    result.putString("result","PASS real embedded helper Binder and uid=2000 shell");finish(Activity.RESULT_OK,result);return;
   }
   Class<?> managerType=Class.forName("tv.appbridge.phase0.rt.session.SessionManager");Object session=managerType.getConstructor(Context.class).newInstance(getTargetContext());Method handle=managerType.getMethod("handleMessage",String.class);
   if(!((String)handle.invoke(session,"{\"t\":\"phone_setup\",\"code\":\"123456\",\"token\":\"wrong\"}")).contains("auth"))throw new AssertionError("Setup requires TV authentication");
   set(session,"tvToken","qa-token");
   if(!((String)handle.invoke(session,"{\"t\":\"phone_setup\",\"code\":\"123456\",\"token\":\"qa-token\"}")).contains("expired"))throw new AssertionError("Setup requires explicit arming");
   Class<?> setupType=Class.forName("tv.appbridge.phase0.rt.session.TvPhoneSetup");Object setup=setupType.getField("INSTANCE").get(null);setupType.getMethod("arm",Context.class).invoke(setup,getTargetContext());
   if(!((String)handle.invoke(session,"{\"t\":\"phone_setup\",\"code\":\"12\",\"token\":\"qa-token\"}")).contains("phone_setup"))throw new AssertionError("Invalid code must be rejected");
   handle.invoke(session,"{\"t\":\"phone_setup_cancel\",\"token\":\"qa-token\"}");
   if(!"idle".equals(setupType.getMethod("getState").invoke(setup)))throw new AssertionError("Setup cancellation failed");
   for(String lang:new String[]{"ar","en"}){
    prefs.edit().putString("language",lang).commit();
    a=startActivitySync(new Intent().setClassName("local.cleartv.mobile","tv.appbridge.phase0.rt.ui.PhoneSetupActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));final Activity guide=a;
    for(int n=1;n<=3;n++){page(a,n);if(inputs(a)!=0)throw new AssertionError("Setup guide must not expose manual fields initially");}
    button(a,"إظهار خانة الكود على التلفزيون","Show code entry on the TV");runOnMainSync(()->{try{set(guide,"notificationGuide",true);render(guide);}catch(Exception e){throw new RuntimeException(e);}});click(button(a,"الإشعار مش ظاهر","No notification"));
    if(inputs(a)!=2)throw new AssertionError("Manual pairing fallback requires port and code");
    click(button(a,"تأكيد الكود","Confirm code"));if(field(a,"busy").getBoolean(a))throw new AssertionError("Invalid pairing input started work");
    page(a,4);click(button(a,"إدخال منفذ الاتصال","Enter connection port"));if(inputs(a)!=1)throw new AssertionError("Helper port is separate from pairing code");
    page(a,3);runOnMainSync(()->guide.onRequestPermissionsResult(81,new String[]{"android.permission.POST_NOTIFICATIONS"},new int[]{-1}));if(field(a,"stage").getInt(a)!=3)throw new AssertionError("Notification denial changed setup stage");
    runOnMainSync(guide::finish);a=null;
    a=startActivitySync(new Intent().setClassName("local.cleartv.mobile","tv.appbridge.phase0.rt.ui.HostActivity").putExtra("setupTvFirst",true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));final Activity host=a;
    for(int stage=1;stage<=5;stage++){
     final int n=stage;runOnMainSync(()->{try{
      ((Handler)field(host,"flowHandler").get(host)).removeCallbacksAndMessages(null);set(host,"busy",false);set(host,"step",n);set(host,"awaitingPhoneSetup",false);set(host,"autoScanStarted",true);set(host,"appsLoading",false);
      Object mgr=field(host,"mgr").get(host);set(mgr,"tvConnected",n==1||n==3);set(mgr,"tvPhoneSetupSupported",true);set(host,"selectedIp","192.168.1.8");set(host,"selectedBrand","android");
      Field binder=provider.getDeclaredField("shell");binder.setAccessible(true);binder.set(null,null);
      Class<?> entry=Class.forName("tv.appbridge.phase0.rt.data.AppStore$Entry");List<Object> apps=new ArrayList<>();
      for(int i=0;i<12;i++)apps.add(entry.getConstructor(String.class,String.class,String.class).newInstance("Sample "+i,"local.fixture.app"+i,"Main"));set(host,"apps",apps);render(host);
     }catch(Exception e){throw new RuntimeException(e);}});waitForIdleSync();
     if(stage==1){button(host,"التالي","Next");capture(host,"apps-before-helper-"+lang);}
     if(stage==3){Field phase=setupType.getDeclaredField("state");phase.setAccessible(true);Object previous=phase.get(null);phase.set(null,"pairing");runOnMainSync(()->{try{Method update=host.getClass().getDeclaredMethod("updateStatus");update.setAccessible(true);update.invoke(host);}catch(Exception e){throw new RuntimeException(e);}});if(((Button)field(host,"actionButton").get(host)).isEnabled())throw new AssertionError("Pairing action must stay disabled while pairing");phase.set(null,previous);}
     if("en".equals(lang))for(View v:views(host))if(v instanceof TextView){String text=((TextView)v).getText()+" "+(((TextView)v).getHint()==null?"":((TextView)v).getHint());if(text.matches("(?s).*[\\u0600-\\u06ff].*"))throw new AssertionError("Arabic leaked into English page "+stage);}
     if(stage==2||stage==3||stage==4)capture(host,"host-"+stage+"-"+lang);
    }
    runOnMainSync(()->{try{Object manager=field(host,"mgr").get(host);set(manager,"tvConnected",false);set(host,"step",3);set(host,"flowTvConnected",false);set(host,"awaitingPhoneSetup",true);render(host);set(manager,"tvConnected",true);Object events=manager.getClass().getMethod("getEvents").invoke(manager);Method callback=events.getClass().getDeclaredMethod("onStateChanged");callback.setAccessible(true);callback.invoke(events);if(field(host,"step").getInt(host)!=1)throw new AssertionError("First TV confirmation must open apps automatically");}catch(Exception e){throw new RuntimeException(e);}});
    Object rememberedManager=field(host,"mgr").get(host);
    runOnMainSync(()->{try{set(rememberedManager,"tvConnected",true);}catch(Exception e){throw new RuntimeException(e);}});
    runOnMainSync(host::finish);a=null;waitForIdleSync();
    a=startActivitySync(new Intent().setClassName("local.cleartv.mobile","tv.appbridge.phase0.rt.ui.HostActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    if(field(a,"step").getInt(a)!=1)throw new AssertionError("Reopening a connected TV must resume apps without repeating setup");
    rememberedManager.getClass().getMethod("disconnectTv").invoke(rememberedManager);
    if(getTargetContext().getSharedPreferences("appbridge_net",0).getBoolean("tv_auto_connect",true))throw new AssertionError("Explicit disconnect must stop automatic reconnection");
    final Activity resumedHost=a;runOnMainSync(resumedHost::finish);a=null;
   }
   result.putString("result","PASS AR/EN native wizard, authenticated setup, manual fallback, notification denial, app picker >=220dp with 12 apps and plain Next action");finish(Activity.RESULT_OK,result);
  }catch(Throwable error){result.putString("error",android.util.Log.getStackTraceString(error));finish(Activity.RESULT_CANCELED,result);}
  finally{prefs.edit().putString("language",language).commit();if(a!=null){Activity last=a;runOnMainSync(last::finish);}}
 }
}
