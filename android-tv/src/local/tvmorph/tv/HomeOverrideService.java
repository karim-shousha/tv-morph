package local.tvmorph.tv;
import android.accessibilityservice.*;import android.content.*;import android.content.pm.*;import android.os.*;import android.view.accessibility.*;

/** Opt-in navigation: no screen contents, typed text, gestures or networking. */
public final class HomeOverrideService extends AccessibilityService {
 private static HomeOverrideService active;
 private final Handler homeHandler=new Handler(Looper.getMainLooper());private Runnable pendingHome;
 private void cancelPendingHome(){if(pendingHome!=null)homeHandler.removeCallbacks(pendingHome);pendingHome=null;}
 private static final java.util.ArrayDeque<String> homeWindows=new java.util.ArrayDeque<>();
 private static synchronized void rememberWindow(AccessibilityEvent event){
  if(event.getPackageName()==null||event.getClassName()==null)return;
  String value=event.getPackageName()+"/"+event.getClassName();
  if(value.startsWith("local.tvmorph.tv/")||value.equals(homeWindows.peekLast()))return;
  if(homeWindows.size()>=8)homeWindows.removeFirst();homeWindows.addLast(value);
 }
 static synchronized String diagnostics(Context c){
  ComponentName resolved=home(c);
  StringBuilder report=new StringBuilder("Service running: "+running()+"\nHome: "+(resolved==null?"unknown":resolved.flattenToShortString())+"\nRecent windows (oldest first):");
  for(String entry:homeWindows)report.append("\n\n").append(entry);
  if(homeWindows.isEmpty())report.append("\nNo window events received yet.");
  return report.toString();
 }
private final android.content.BroadcastReceiver screenOff=new android.content.BroadcastReceiver(){public void onReceive(Context c,Intent i){if(Intent.ACTION_SCREEN_OFF.equals(i.getAction()))ParentalTimer.sleep();}};private HomeOverridePolicy policy=new HomeOverridePolicy();private ComponentName target;private String returnPackage="";private boolean returnSeenTarget;private BackReturnPolicy backReturn=new BackReturnPolicy();
 static ComponentName home(Context c){try{ResolveInfo info=c.getPackageManager().resolveActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME),PackageManager.MATCH_DEFAULT_ONLY);if(info!=null&&info.activityInfo!=null&&!info.activityInfo.packageName.equals("android"))return new ComponentName(info.activityInfo.packageName,info.activityInfo.name);}catch(RuntimeException ignored){}return null;}
 static void externalForeground(Context c,Intent intent){if(active==null)return;try{ResolveInfo info=c.getPackageManager().resolveActivity(intent,0);if(info!=null&&info.activityInfo!=null)ParentalTimer.window(c,info.activityInfo.packageName);}catch(RuntimeException ignored){}}
 static boolean running(){return active!=null;}
 static boolean granted(Context c){AccessibilityManager m=(AccessibilityManager)c.getSystemService(ACCESSIBILITY_SERVICE);if(m==null)return false;for(AccessibilityServiceInfo i:m.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)){ResolveInfo r=i.getResolveInfo();if(r!=null&&r.serviceInfo!=null&&r.serviceInfo.packageName.equals(c.getPackageName())&&r.serviceInfo.name.equals(HomeOverrideService.class.getName()))return true;}return false;}
 static boolean projectivyEnabled(Context c){AccessibilityManager m=(AccessibilityManager)c.getSystemService(ACCESSIBILITY_SERVICE);if(m!=null)for(AccessibilityServiceInfo i:m.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)){ResolveInfo r=i.getResolveInfo();if(r!=null&&r.serviceInfo!=null&&r.serviceInfo.packageName.equals("com.spocky.projengmenu"))return true;}return false;}
 static void settled(android.app.Activity a){HomeOverrideService service=active;if(service!=null)new Handler(Looper.getMainLooper()).postDelayed(()->{if(active==service&&!a.isDestroyed()&&a.hasWindowFocus())service.policy.settled();},1800);}
 static void refresh(){if(active!=null){active.policy=new HomeOverridePolicy();active.backReturn=new BackReturnPolicy();active.returnPackage="";active.configure();}}
 static void externalOpened(Context caller,Intent intent){HomeOverrideService service=active;if(service==null||!UiSettings.prefs(caller).getBoolean("returnExternal",false))return;try{ResolveInfo info=caller.getPackageManager().resolveActivity(intent,0);if(info==null||info.activityInfo==null)return;String pkg=info.activityInfo.packageName;if(pkg.equals(caller.getPackageName()))return;service.returnPackage=pkg;service.returnSeenTarget=false;service.backReturn.arm(pkg);service.configure();}catch(RuntimeException ignored){}}
 private void configure(){target=home(this);AccessibilityServiceInfo info=getServiceInfo();if(info==null)info=new AccessibilityServiceInfo();info.eventTypes=AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;info.feedbackType=AccessibilityServiceInfo.FEEDBACK_GENERIC;info.notificationTimeout=120;boolean back=UiSettings.prefs(this).getBoolean("returnExternal",false);info.flags=back?AccessibilityServiceInfo.FLAG_REQUEST_FILTER_KEY_EVENTS:0;java.util.HashSet<String> packages=new java.util.HashSet<>();packages.add(getPackageName());if(target!=null)packages.add(target.getPackageName());if(back&&!returnPackage.isEmpty())packages.add(returnPackage);info.packageNames=null;setServiceInfo(info);}
 @Override protected boolean onKeyEvent(android.view.KeyEvent event){boolean handled=backReturn.key(UiSettings.prefs(this).getBoolean("returnExternal",false),event.getAction(),event.getKeyCode(),event.getRepeatCount(),event.getEventTime());if(handled&&event.getAction()==android.view.KeyEvent.ACTION_DOWN)launchHome();return handled;}

 @Override protected void onServiceConnected(){active=this;configure();registerReceiver(screenOff,new IntentFilter(Intent.ACTION_SCREEN_OFF));/* BootReceiver owns startup. Service reconnection must never interrupt an external app. */}
 @Override public void onAccessibilityEvent(AccessibilityEvent e){
  if(e==null||e.getEventType()!=AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED)return;cancelPendingHome();rememberWindow(e);if(e.getPackageName()!=null){String pkg=e.getPackageName().toString();try{android.content.pm.ApplicationInfo ai=getPackageManager().getApplicationInfo(pkg,0);boolean system=(ai.flags&android.content.pm.ApplicationInfo.FLAG_SYSTEM)!=0;boolean launchable=getPackageManager().getLeanbackLaunchIntentForPackage(pkg)!=null||getPackageManager().getLaunchIntentForPackage(pkg)!=null;String ime=android.provider.Settings.Secure.getString(getContentResolver(),android.provider.Settings.Secure.DEFAULT_INPUT_METHOD);boolean keyboard=ime!=null&&ime.startsWith(pkg+"/");if(!keyboard&&(!system||launchable||pkg.equals(getPackageName())))ParentalTimer.window(this,pkg);}catch(android.content.pm.PackageManager.NameNotFoundException ignored){}}backReturn.window(String.valueOf(e.getPackageName()));if(!returnPackage.isEmpty()&&returnPackage.equals(String.valueOf(e.getPackageName())))returnSeenTarget=true;if(returnSeenTarget&&getPackageName().equals(String.valueOf(e.getPackageName()))){returnPackage="";returnSeenTarget=false;backReturn.disarm();configure();}if(target==null)return;
  final ComponentName expected=target;final String eventPackage=String.valueOf(e.getPackageName()),eventClass=String.valueOf(e.getClassName());
  if(!expected.getPackageName().equals(eventPackage))return;
  pendingHome=()->{
   pendingHome=null;if(active!=this||!expected.equals(target))return;
   boolean enabled=UiSettings.prefs(this).getBoolean("overrideHome",false);
   boolean launch=policy.shouldLaunch(enabled,getPackageName(),expected.getPackageName(),expected.getClassName(),eventPackage,eventClass,SystemClock.elapsedRealtime());
   if(policy.paused&&enabled){UiSettings.prefs(this).edit().putBoolean("overrideHome",false).apply();android.widget.Toast.makeText(this,UiSettings.text(this,"تم إيقاف تجاوز Home لتجنب التعارض مع Launcher آخر. راجع إعدادات الواجهة.","Home override paused to avoid a competing launcher loop. Review TV home settings."),1).show();}
   if(launch)launchHome();
  };
  homeHandler.postDelayed(pendingHome,350);

 }
 private void launchHome(){try{startActivity(new Intent(this,TvActivity.class).setAction(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).putExtra("bootLaunch",true).putExtra("homeOverrideLaunch",true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP));}catch(RuntimeException ignored){}
 }
 @Override public void onInterrupt(){}
 @Override public void onDestroy(){cancelPendingHome();try{unregisterReceiver(screenOff);}catch(Exception ignored){}ParentalTimer.sleep();if(active==this)active=null;super.onDestroy();}
}
