package local.cleartv.bridgecheck;

import android.app.*;
import android.content.*;
import android.os.*;
import android.view.View;
import android.webkit.WebView;
import java.lang.reflect.*;
import java.util.concurrent.*;

/** Regression: a blocked TV-network queue cannot delay the local Bridge page. */
public final class BridgeLaunchInstrumentation extends Instrumentation {
    @Override public void onCreate(Bundle args){super.onCreate(args);start();}
    @Override public void onStart(){
        Bundle result=new Bundle();Activity host=null,bridge=null;
        CountDownLatch release=new CountDownLatch(1);
        try{
            host=startActivitySync(new Intent().setClassName("local.cleartv.mobile","local.cleartv.mobile.MainActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            Field field=host.getClass().getDeclaredField("worker");field.setAccessible(true);
            ExecutorService worker=(ExecutorService)field.get(host);
            CountDownLatch blocked=new CountDownLatch(1);
            worker.execute(()->{blocked.countDown();try{release.await(12,TimeUnit.SECONDS);}catch(InterruptedException ignored){Thread.currentThread().interrupt();}});
            if(!blocked.await(2,TimeUnit.SECONDS))throw new AssertionError("Could not hold the TV network queue");
            Field webField=host.getClass().getDeclaredField("web");webField.setAccessible(true);
            WebView web=(WebView)webField.get(host);
            long deadline=SystemClock.elapsedRealtime()+12000;
            while(!"true".equals(js(web,"!!document.querySelector('#phone-bridge-open svg')"))&&SystemClock.elapsedRealtime()<deadline)Thread.sleep(50);
            if(!"true".equals(js(web,"!!document.querySelector('#phone-bridge-open svg') && !document.querySelector('#phone-bridge-open img')")))throw new AssertionError("Installed bottom bar must use a line SVG without a logo image");
            result.putString("icon","PASS actual installed WebView uses the same line SVG family, no image");
            ActivityMonitor monitor=addMonitor("tv.appbridge.phase0.rt.ui.HostActivity",null,false);
            long start=SystemClock.elapsedRealtime();
            js(web,"document.getElementById('phone-bridge-open').click();true");
            bridge=monitor.waitForActivityWithTimeout(3000);removeMonitor(monitor);
            if(bridge==null)throw new AssertionError("Bridge queued behind blocked TV requests");
            long opened=SystemClock.elapsedRealtime()-start;
            final Activity screen=bridge;
            CountDownLatch drew=new CountDownLatch(1);
            runOnMainSync(()->{
                View root=screen.getWindow().getDecorView();
                root.getViewTreeObserver().addOnDrawListener(drew::countDown);
                root.invalidate();
            });
            if(!drew.await(2,TimeUnit.SECONDS))throw new AssertionError("Bridge did not draw its first page");
            long drawn=SystemClock.elapsedRealtime()-start;
            if(release.getCount()!=1)throw new AssertionError("Network queue unexpectedly released before first frame");
            if(opened>1500||drawn>2000)throw new AssertionError("Bridge startup still blocks: opened="+opened+", drawn="+drawn);
            result.putLong("activityOpenedMs",opened);result.putLong("firstFrameMs",drawn);
            result.putString("result","PASS Bridge opens and draws while the TV network worker is blocked");
            final android.content.SharedPreferences prefs=getTargetContext().getSharedPreferences("cleartv",0);
            final boolean oldChosen=prefs.getBoolean("appearanceChosen",false);
            final String oldAppearance=prefs.getString("appearance","light");
            if(screen.getWindow().getDecorView().findViewWithTag("morph-bridge-wordmark")==null||screen.getWindow().getDecorView().findViewWithTag("morph-bridge-back")==null)throw new AssertionError("Embedded page requires Morph TV wordmark and persistent header Back");
            Method redraw=screen.getClass().getDeclaredMethod("render");redraw.setAccessible(true);
            Field page=screen.getClass().getDeclaredField("step");page.setAccessible(true);
            Field caller=screen.getClass().getDeclaredField("lastMainStep");caller.setAccessible(true);
            runOnMainSync(()->{try{screen.getWindow().getDecorView().findViewWithTag("morph-bridge-settings").performClick();}catch(Exception e){throw new RuntimeException(e);}});
            if(page.getInt(screen)!=4)throw new AssertionError("Settings icon did not open embedded settings");
            final java.util.List<String> labels=new java.util.ArrayList<>();runOnMainSync(()->collectText(screen.getWindow().getDecorView(),labels));
            if(labels.contains("المظهر")||labels.stream().anyMatch(s->s.contains("☀")||s.contains("☾")))throw new AssertionError("Bridge must not expose a separate theme picker");
            runOnMainSync(()->screen.getWindow().getDecorView().findViewWithTag("morph-bridge-back").performClick());
            if(page.getInt(screen)!=1||screen.isFinishing())throw new AssertionError("Header Back must restore Apps, without leaving Morph TV");
            for(String appearance:new String[]{"dark","light"}){
                prefs.edit().putBoolean("appearanceChosen",true).putString("appearance",appearance).commit();
                runOnMainSync(()->{try{redraw.invoke(screen);}catch(Exception e){throw new RuntimeException(e);}});
                Field root=screen.getClass().getDeclaredField("root");root.setAccessible(true);
                int color=((android.graphics.drawable.ColorDrawable)((View)root.get(screen)).getBackground()).getColor();
                if(color!=(appearance.equals("dark")?0xff2c3b57:0xfff4f7fb))throw new AssertionError("Bridge appearance must follow host "+appearance);
            }
            runOnMainSync(()->{try{page.setInt(screen,2);redraw.invoke(screen);screen.onBackPressed();if(page.getInt(screen)!=1)throw new AssertionError("TV step Back must restore Apps");page.setInt(screen,3);redraw.invoke(screen);screen.onBackPressed();if(page.getInt(screen)!=2)throw new AssertionError("Run step Back must restore TV");caller.setInt(screen,2);page.setInt(screen,4);redraw.invoke(screen);screen.onBackPressed();if(page.getInt(screen)!=2)throw new AssertionError("Settings Back must restore its exact caller");page.setInt(screen,1);redraw.invoke(screen);}catch(Exception e){throw new RuntimeException(e);}});
            prefs.edit().putBoolean("appearanceChosen",oldChosen).putString("appearance",oldAppearance).commit();
            runOnMainSync(()->{try{redraw.invoke(screen);}catch(Exception e){throw new RuntimeException(e);}});
            result.putString("shell","PASS Morph header, persistent Back, shared light/dark colors, no independent appearance; step Back and settings caller preserved");
            Field loading=screen.getClass().getDeclaredField("appsLoading");loading.setAccessible(true);
            long loadDeadline=SystemClock.elapsedRealtime()+5000;
            while(loading.getBoolean(screen)&&SystemClock.elapsedRealtime()<loadDeadline)Thread.sleep(50);
            final android.widget.ListView[] realList={null};
            runOnMainSync(()->{realList[0]=findList(screen.getWindow().getDecorView());});
            if(realList[0]==null||realList[0].getAdapter().getCount()<1)throw new AssertionError("Real installed apps must populate");
            final android.widget.CheckBox[] firstChoice={null};
            runOnMainSync(()->{android.view.View row=realList[0].getChildAt(0);if(row instanceof android.view.ViewGroup){android.view.ViewGroup group=(android.view.ViewGroup)row;for(int i=0;i<group.getChildCount();i++)if(group.getChildAt(i) instanceof android.widget.CheckBox)firstChoice[0]=(android.widget.CheckBox)group.getChildAt(i);}if(firstChoice[0]!=null){boolean original=firstChoice[0].isChecked();firstChoice[0].performClick();if(firstChoice[0].isChecked()==original)throw new AssertionError("App selection did not toggle");firstChoice[0].performClick();}});
            if(firstChoice[0]==null)throw new AssertionError("App list selection control missing");
            result.putString("selection","PASS actual installed app icon rows and checkbox toggles");
            java.io.File screenshot=new java.io.File(getTargetContext().getExternalFilesDir(null),"bridge-integrated-review.png");
            try(java.io.FileOutputStream image=new java.io.FileOutputStream(screenshot)){getUiAutomation().takeScreenshot().compress(android.graphics.Bitmap.CompressFormat.PNG,100,image);}
            result.putString("screenshot",screenshot.getAbsolutePath());
            Class<?> entryClass=Class.forName("tv.appbridge.phase0.rt.data.AppStore$Entry",true,screen.getClassLoader());
            java.util.List<Object> apps=new java.util.ArrayList<>();
            for(int i=0;i<400;i++)apps.add(entryClass.getConstructor(String.class,String.class,String.class).newInstance("Fixture "+i,"test.fixture"+i,"Main"));
            Field appField=screen.getClass().getDeclaredField("apps");appField.setAccessible(true);
            Method render=screen.getClass().getDeclaredMethod("render");render.setAccessible(true);
            long renderStart=SystemClock.elapsedRealtime();
            runOnMainSync(()->{try{appField.set(screen,apps);render.invoke(screen);}catch(Exception e){throw new RuntimeException(e);}});
            waitForIdleSync();
            final int[] listCounts={0,0};
            runOnMainSync(()->{android.widget.ListView list=findList(screen.getWindow().getDecorView());if(list!=null){listCounts[0]=list.getAdapter().getCount();listCounts[1]=list.getChildCount();}});
            if(listCounts[0]!=400||listCounts[1]<1||listCounts[1]>50)throw new AssertionError("App list must recycle visible rows, adapter="+listCounts[0]+", drawn="+listCounts[1]);
            result.putLong("render400AppsMs",SystemClock.elapsedRealtime()-renderStart);
            result.putInt("visibleAppRows",listCounts[1]);
            runOnMainSync(screen::finish);
            Activity setup=startActivitySync(new Intent().setClassName("local.cleartv.mobile","tv.appbridge.phase0.rt.ui.PhoneSetupActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            final int[] fields={0};
            runOnMainSync(()->countFields(setup.getWindow().getDecorView(),fields));
            if(fields[0]!=3)throw new AssertionError("Setup needs separate pairing port, pairing code and connection port: "+fields[0]);
            runOnMainSync(setup::finish);
            result.putString("setup","PASS three explicit setup fields render without crashing");
            getTargetContext().stopService(new Intent().setClassName("local.cleartv.mobile","tv.appbridge.phase0.rt.session.SessionService"));
            finish(Activity.RESULT_OK,result);
        }catch(Throwable error){result.putString("error",android.util.Log.getStackTraceString(error));finish(Activity.RESULT_CANCELED,result);}
        finally{release.countDown();}
    }
    private static void countFields(View node,int[] fields){
        if(node instanceof android.widget.EditText)fields[0]++;
        if(node instanceof android.view.ViewGroup){android.view.ViewGroup group=(android.view.ViewGroup)node;for(int i=0;i<group.getChildCount();i++)countFields(group.getChildAt(i),fields);}
    }
    private static void collectText(View node,java.util.List<String> labels){
        if(node instanceof android.widget.TextView)labels.add(((android.widget.TextView)node).getText().toString());
        if(node instanceof android.view.ViewGroup){android.view.ViewGroup group=(android.view.ViewGroup)node;for(int i=0;i<group.getChildCount();i++)collectText(group.getChildAt(i),labels);}
    }
    private String js(WebView web,String script)throws Exception{
        CountDownLatch done=new CountDownLatch(1);String[] value={""};
        runOnMainSync(()->web.evaluateJavascript(script,v->{value[0]=v;done.countDown();}));
        if(!done.await(3,TimeUnit.SECONDS))throw new AssertionError("WebView evaluation blocked");return value[0];
    }
    private static android.widget.ListView findList(View node){
        if(node instanceof android.widget.ListView)return (android.widget.ListView)node;
        if(node instanceof android.view.ViewGroup){android.view.ViewGroup group=(android.view.ViewGroup)node;for(int i=0;i<group.getChildCount();i++){android.widget.ListView list=findList(group.getChildAt(i));if(list!=null)return list;}}return null;
    }
}
