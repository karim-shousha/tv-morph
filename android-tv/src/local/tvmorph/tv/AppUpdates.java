package local.tvmorph.tv;
import android.app.Activity;
/** Same verified installer for the phone, embedded TV and standalone IPTV hosts. */
public final class AppUpdates {
 public static void check(Activity activity){OfficialUpdate.check(activity,true);}
 public static void resume(Activity activity){TvUpdater.resume(activity);}
 private AppUpdates(){}
}
