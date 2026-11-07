package local.tvmorph.tv;
import java.lang.ref.WeakReference;

/** Phone alarm audio uses the existing player's pause/resume contract. */
public final class PhoneFaithAudio {
 private static WeakReference<PlayerActivity> interrupted=new WeakReference<>(null);
 private static boolean wasPlaying;
 public static void begin(){PlayerActivity current=PlayerActivity.active;if(current!=null&&current.phonePalette()&&!current.isFinishing()){interrupted=new WeakReference<>(current);wasPlaying=current.pauseForAdhan();}}
 public static void end(){PlayerActivity old=interrupted.get();boolean resume=wasPlaying;interrupted.clear();wasPlaying=false;if(old!=null&&!old.isDestroyed())old.endAdhan(resume&&PlayerActivity.active==old);}
 public static void cancel(android.content.Context context,boolean resume){wasPlaying=resume;try{if(!context.stopService(new android.content.Intent().setClassName(context.getPackageName(),context.getPackageName()+".FaithAdhanService")))end();}catch(Exception ignored){end();}}
 private PhoneFaithAudio(){}
}
