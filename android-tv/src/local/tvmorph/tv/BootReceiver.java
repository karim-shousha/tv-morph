package local.tvmorph.tv;
import android.content.*;
/** Opt-in boot launch. Device firmware can restrict background activity starts. */
public final class BootReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context context,Intent intent){
  if(!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())||!UiSettings.prefs(context).getBoolean("launchAtBoot",false))return;
  try{context.startActivity(new Intent(context,TvActivity.class).putExtra("bootLaunch",true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP));}catch(RuntimeException ignored){}
 }
}
