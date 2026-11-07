package local.tvmorph.tv;
import android.app.Activity;
/** Explicit source changes release this app's audio without changing device mute/volume. */
final class InputAudioHandoff {
 static void prepare(Activity owner){RadioPlayback.get(owner).stop();AdhanPlayback.get(owner).stopForInput();PlayerActivity player=PlayerActivity.active;if(player!=null)player.leaveForInput();}
 private InputAudioHandoff(){}
}
