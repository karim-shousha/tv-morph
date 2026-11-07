package local.tvmorph.tv;
import android.app.Activity;
import android.content.Intent;

/** Launch external apps in their own task so splash task-root checks work. */
final class ExternalLaunch {
 static Intent returning(Intent original){
  Intent result=new Intent(original);
  result.setFlags((original.getFlags()&~(Intent.FLAG_ACTIVITY_NEW_DOCUMENT|Intent.FLAG_ACTIVITY_MULTIPLE_TASK|Intent.FLAG_ACTIVITY_TASK_ON_HOME|Intent.FLAG_ACTIVITY_CLEAR_TASK))|Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
  return result;
 }
 static void open(Activity caller,Intent intent){Intent target=returning(intent);HomeOverrideService.externalOpened(caller,target);caller.startActivity(target);HomeOverrideService.externalForeground(caller,target);}
}
