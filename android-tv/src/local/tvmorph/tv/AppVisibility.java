package local.tvmorph.tv;
import android.app.*;import android.os.Bundle;
/** Distinguish returning from another app from returning from our own player. */
public final class AppVisibility {
 private static final long SESSION=android.os.SystemClock.elapsedRealtimeNanos();
 static long session(){return SESSION;}
 private static boolean installed,background;private static int started;
 private static java.lang.ref.WeakReference<Activity> lastResumed=new java.lang.ref.WeakReference<>(null);
 static boolean resumedSame(Activity activity){return lastResumed.get()==activity;}
 public static boolean install(Application application){if(installed)return false;installed=true;UiSettings.prefs(application).edit().putString("performanceTier","performance").putString("performanceMode","light").putString("visualEffects","{\"blur\":false,\"glow\":false,\"motion\":false}").apply();application.registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks(){
  public void onActivityStarted(Activity a){boolean reopen=background&&started==0;started++;background=false;if(reopen&&a instanceof IptvActivity){IptvActivity iptv=(IptvActivity)a;if(iptv.hasResumed&&!iptv.explicitReentry)iptv.returnFromBackground=true;}}
  public void onActivityStopped(Activity a){started=Math.max(0,started-1);if(started==0&&!a.isChangingConfigurations())background=true;}
  public void onActivityCreated(Activity a,Bundle state){}public void onActivityResumed(Activity a){lastResumed=new java.lang.ref.WeakReference<>(a);}public void onActivityPaused(Activity a){}public void onActivitySaveInstanceState(Activity a,Bundle state){}public void onActivityDestroyed(Activity a){}
 });return true;}
 private AppVisibility(){}
}
