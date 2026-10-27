package local.tvmorph.tv;
import android.app.Activity;
import android.content.Intent;

/** Keep the caller below external apps; never clear or force a new external task. */
final class ExternalLaunch {
 static final int REQUEST=4702;
 static Intent returning(Intent original){
  Intent result=new Intent(original);
  result.setFlags(original.getFlags()&~(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_NEW_DOCUMENT|Intent.FLAG_ACTIVITY_MULTIPLE_TASK|Intent.FLAG_ACTIVITY_TASK_ON_HOME|Intent.FLAG_ACTIVITY_CLEAR_TASK|Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED));
  return result;
 }
 static void open(Activity caller,Intent intent){Intent target=returning(intent);HomeOverrideService.externalOpened(caller,target);caller.startActivityForResult(target,REQUEST);HomeOverrideService.externalForeground(caller,target);}
}
