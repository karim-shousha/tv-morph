package local.tvmorph.tv;
import android.app.Activity;
import android.view.KeyEvent;
/** Open the firmware's exported source selector; never replace it with an app dialog. */
final class TvSourceKey {
 static boolean handle(Activity owner,KeyEvent event){
  if(event.getKeyCode()!=KeyEvent.KEYCODE_TV_INPUT)return false;
  if(InputSources.preferred(owner)==null)return false;
  if(event.getAction()==KeyEvent.ACTION_DOWN&&event.getRepeatCount()==0)return show(owner);
  return true;
 }
 static boolean show(Activity owner){return InputSources.openPicker(owner);}
 private TvSourceKey(){}
}
