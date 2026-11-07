package local.tvmorph.tv;
import android.app.Activity;import android.content.Intent;import android.os.Bundle;
/** TV Home opens the launcher; handheld app re-entry restores its existing task. */
public final class LauncherActivity extends Activity {
 @Override public void onCreate(Bundle state){super.onCreate(state);if(!getPackageManager().hasSystemFeature("android.software.leanback")){android.app.ActivityManager manager=(android.app.ActivityManager)getSystemService(ACTIVITY_SERVICE);for(android.app.ActivityManager.AppTask task:manager.getAppTasks()){android.app.ActivityManager.RecentTaskInfo info=task.getTaskInfo();if(info.baseActivity!=null&&info.baseActivity.getClassName().equals(TvActivity.class.getName())){task.moveToFront();finish();return;}}}startActivity(new Intent(this,TvActivity.class).setAction(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP));finish();}
}
