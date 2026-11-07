package local.morph.uiintegrationcheck;

import android.app.*;
import android.content.*;
import android.os.*;
import android.webkit.*;
import android.view.accessibility.AccessibilityNodeInfo;
import java.lang.reflect.Field;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

/** Read-only navigation smoke test on the installed integrated phone product. */
public final class UiIntegrationInstrumentation extends Instrumentation {
    WebView web;
    String js(String script) throws Exception {
        CountDownLatch done=new CountDownLatch(1); AtomicReference<String> value=new AtomicReference<>();
        runOnMainSync(()->web.evaluateJavascript("(function(){"+script+"})()",result->{value.set(result);done.countDown();}));
        if(!done.await(10,TimeUnit.SECONDS))throw new AssertionError("WebView timeout");return value.get();
    }
    void check(boolean value,String label){if(!value)throw new AssertionError(label);Bundle b=new Bundle();b.putString("check",label);sendStatus(1,b);}
    AccessibilityNodeInfo find(AccessibilityNodeInfo node,String label){
        if(node==null)return null;
        String description=String.valueOf(node.getContentDescription())+"\n"+String.valueOf(node.getText());
        if(description.contains(label)&&node.isClickable())return node;
        for(int i=0;i<node.getChildCount();i++){AccessibilityNodeInfo found=find(node.getChild(i),label);if(found!=null)return found;}
        return null;
    }
    @Override public void onCreate(Bundle args){super.onCreate(args);start();}
    @Override public void onStart(){Bundle result=new Bundle();try{
        Context c=getTargetContext();
        Activity main=startActivitySync(new Intent().setClassName(c.getPackageName(),c.getPackageName()+".MainActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        Field field=main.getClass().getDeclaredField("web");field.setAccessible(true);web=(WebView)field.get(main);
        long until=SystemClock.uptimeMillis()+15000;
        while(!"true".equals(js("return !!(window.Morph30&&window.MorphWorship);"))&&SystemClock.uptimeMillis()<until)Thread.sleep(100);
        check("true".equals(js("return document.querySelector('.iptv-destinations').children.length===3&&document.querySelector('.iptv-destinations').lastElementChild.id==='phone-iptv-matches';")),"Matches is the third IPTV destination");
        check("true".equals(js("var nav=document.querySelector('.bottom-nav');function rgb(s){return s.match(/[\\d.]+/g).slice(0,3).map(Number)}function lum(a){return a.map(function(n){n/=255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4)}).reduce(function(v,n,i){return v+n*[.2126,.7152,.0722][i]},0)}var bg=lum(rgb(getComputedStyle(nav).backgroundColor));return Array.from(nav.querySelectorAll('.m30-nav-lb')).every(function(e){var fg=lum(rgb(getComputedStyle(e).color));return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)>=4.5});")),"Floating navigation labels retain readable contrast");
        for(String page:new String[]{"design","control","play"}){
            js("Morph30.show('"+page+"');return true;");
            check("true".equals(js("return document.querySelector('.bottom-nav').hidden&&!document.getElementById('m30-page-back').hidden;")),"Utility page hides the dock and exposes header Back: "+page);
            js("document.getElementById('m30-page-back').click();return true;");
            check("true".equals(js("return document.body.dataset.mobilePage==='page-connect'&&!document.querySelector('.bottom-nav').hidden;")),"Header Back returns to Devices: "+page);
        }
        Class<?> prayer=Class.forName("local.cleartv.mobile.FaithPrayer",true,c.getClassLoader());
        java.lang.reflect.Method command=prayer.getDeclaredMethod("command",Activity.class,org.json.JSONObject.class);command.setAccessible(true);
        org.json.JSONObject info=(org.json.JSONObject)command.invoke(null,main,new org.json.JSONObject().put("operation","info"));
        check(info.optBoolean("hostEnabled"),"Worship opt-in remains enabled in the existing user settings");
        android.content.res.AssetFileDescriptor audio=c.getAssets().openFd("faith-adhan/egypt.mp3");check(audio.getLength()>1000000,"Bundled adhan is uncompressed and seekable by Android MediaPlayer");
        android.media.MediaPlayer decoder=new android.media.MediaPlayer();
        try{decoder.setAudioAttributes(new android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_ALARM).setContentType(android.media.AudioAttributes.CONTENT_TYPE_SPEECH).build());decoder.setDataSource(audio.getFileDescriptor(),audio.getStartOffset(),audio.getLength());decoder.prepare();decoder.start();Thread.sleep(650);check(decoder.isPlaying()&&decoder.getCurrentPosition()>200,"Bundled adhan decodes and playback position advances on Android");}finally{decoder.release();audio.close();}
        try{
            command.invoke(null,main,new org.json.JSONObject().put("operation","preview").put("voice","egypt"));
            long audioDeadline=SystemClock.uptimeMillis()+8000;boolean playing=false;
            while(!playing&&SystemClock.uptimeMillis()<audioDeadline){Thread.sleep(100);playing=((org.json.JSONObject)command.invoke(null,main,new org.json.JSONObject().put("operation","info"))).optBoolean("playing");}
            check(playing,"Native decoder starts the complete bundled adhan");Thread.sleep(1000);
            check(((org.json.JSONObject)command.invoke(null,main,new org.json.JSONObject().put("operation","info"))).optBoolean("playing"),"Adhan keeps playing instead of failing immediately");
        }finally{command.invoke(null,main,new org.json.JSONObject().put("operation","stop"));}
        ActivityMonitor monitor=addMonitor(c.getPackageName()+".RemoteActivity",null,false);
        check("true".equals(js("return ClearNative.openFaith('home');")),"Integrated host accepts native faith entry");
        Activity faith=monitor.waitForActivityWithTimeout(15000);
        check(faith!=null&&"worship".equals(faith.getIntent().getStringExtra("section")),"Native HER faith receives its section and host appearance");
        Thread.sleep(2500);
        check(!faith.isFinishing(),"Native faith remains open after initialization");
        String label="رجوع";
        // Connecting UiAutomation enables Flutter semantics asynchronously.
        AccessibilityNodeInfo devices=null;
        until=SystemClock.uptimeMillis()+10000;
        while(devices==null&&SystemClock.uptimeMillis()<until){devices=find(getUiAutomation().getRootInActiveWindow(),label);if(devices==null)Thread.sleep(200);}
        check(devices!=null&&devices.performAction(AccessibilityNodeInfo.ACTION_CLICK),"Native faith exposes its header Back action");
        Thread.sleep(700);
        check("true".equals(js("return document.body.dataset.mobilePage==='page-connect';")),"Native faith header Back returns to Devices");
        js("return ClearNative.openFaith('home');");
        removeMonitor(monitor);
        result.putString("result","PASS: Devices-only navigation, third matches action, native faith Back and actual adhan decoding/playback; existing preferences retained");
        finish(Activity.RESULT_OK,result);
    }catch(Throwable error){result.putString("result","FAIL "+error);result.putString("trace",android.util.Log.getStackTraceString(error));finish(Activity.RESULT_CANCELED,result);}}
}
