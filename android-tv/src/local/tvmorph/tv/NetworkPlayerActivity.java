package local.tvmorph.tv;
/** Adjacent receiver channels stay within the selected bouquet in the network browser. */
public class NetworkPlayerActivity extends PlayerActivity {
 @Override public boolean dispatchKeyEvent(android.view.KeyEvent e){int c=e.getKeyCode();if(getIntent().getBooleanExtra("live",false)&&(c==android.view.KeyEvent.KEYCODE_CHANNEL_UP||c==android.view.KeyEvent.KEYCODE_CHANNEL_DOWN||c==android.view.KeyEvent.KEYCODE_DPAD_UP||c==android.view.KeyEvent.KEYCODE_DPAD_DOWN)){if(e.getAction()==android.view.KeyEvent.ACTION_DOWN&&e.getRepeatCount()==0)adjacent(c==android.view.KeyEvent.KEYCODE_CHANNEL_UP||c==android.view.KeyEvent.KEYCODE_DPAD_UP?1:-1);return true;}return super.dispatchKeyEvent(e);}
 @Override protected void adjacent(int delta){NetworkActivity owner=NetworkOwner.current;if(owner!=null&&owner.web!=null)owner.runOnUiThread(()->{if(owner.web!=null)owner.web.evaluateJavascript("window.NetworkUI&&NetworkUI.adjacent("+delta+")",result->{if("true".equals(result))finish();});});}
}
final class NetworkOwner {static volatile NetworkActivity current;}
