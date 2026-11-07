package local.tvmorph.seekcheck;
import android.app.*;import android.content.*;import android.os.*;import android.view.*;import android.widget.*;import java.lang.reflect.*;
/** Regression: repeated remote skip clicks retain the originating control. */
public class SeekFocusInstrumentation extends Instrumentation {
 Activity player;
 Object field(String name)throws Exception{Field f=player.getClass().getDeclaredField(name);f.setAccessible(true);return f.get(player);}
 void main(Runnable action){runOnMainSync(action);waitForIdleSync();}
 void check(boolean ok,String message){if(!ok)throw new AssertionError(message);}
 Button find(LinearLayout row,String text){for(int i=0;i<row.getChildCount();i++){View v=row.getChildAt(i);if(v instanceof Button&&text.contentEquals(((Button)v).getText()))return (Button)v;}throw new AssertionError("Missing control "+text);}
 @Override public void onCreate(Bundle args){super.onCreate(args);start();}
 @Override public void onStart(){Bundle result=new Bundle();try{
  setInTouchMode(false);getTargetContext().getSharedPreferences("tvmorph-ui",0).edit().putBoolean("systemVodPlayer",false).putString("language","en").commit();
  Intent intent=new Intent().setClassName("local.tvmorph.tv","local.tvmorph.tv.PlayerActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).putExtra("url","http://10.0.2.2:8766/layout.mp4").putExtra("name","Local skip focus check").putExtra("itemKind","vod").putExtra("itemId","local-seek-focus-check").putExtra("live",false);
  player=startActivitySync(intent);long until=SystemClock.uptimeMillis()+30000;while(SystemClock.uptimeMillis()<until&&!Boolean.TRUE.equals(field("prepared")))Thread.sleep(50);check(Boolean.TRUE.equals(field("prepared")),"Owned sample prepares");
  final View controls=(View)field("controls");final LinearLayout actions=(LinearLayout)field("actionRow");final SeekBar timeline=(SeekBar)field("timeline");
  main(()->controls.setVisibility(View.VISIBLE));
  for(String text:new String[]{"+10","−10"}){final Button button=find(actions,text);main(()->button.requestFocus());for(int n=0;n<3;n++){sendKeyDownUpSync(n%2==0?KeyEvent.KEYCODE_DPAD_CENTER:KeyEvent.KEYCODE_ENTER);waitForIdleSync();check(player.getCurrentFocus()==button,text+" keeps focus immediately after click "+n);Thread.sleep(400);waitForIdleSync();check(player.getCurrentFocus()==button,text+" keeps focus after seek/buffering callback "+n);check(controls.getVisibility()==View.VISIBLE,"Repeated seek keeps controls visible");}Thread.sleep(1000);check(player.getCurrentFocus()==button,text+" remains selected after settling");}
  final Button forward=find(actions,"+10");main(()->forward.requestFocus());sendKeyDownUpSync(KeyEvent.KEYCODE_DPAD_UP);check(player.getCurrentFocus()==timeline,"Intentional Up still reaches timeline");
  main(()->{try{Method m=player.getClass().getDeclaredMethod("seek",int.class);m.setAccessible(true);m.invoke(player,10000);}catch(Exception e){throw new RuntimeException(e);}});check(player.getCurrentFocus()==timeline,"Timeline skip keeps timeline focus");
  sendKeyDownUpSync(KeyEvent.KEYCODE_DPAD_DOWN);check(player.getCurrentFocus()!=timeline&&player.getCurrentFocus().getParent()==actions,"Intentional Down returns to action row");
  main(()->forward.requestFocus());result.putString("result","PASS: +10 and -10 retain focus across repeated CENTER/ENTER clicks and seek callbacks; timeline and deliberate Up/Down navigation preserved.");main(()->player.finish());finish(Activity.RESULT_OK,result);
 }catch(Throwable e){result.putString("error",android.util.Log.getStackTraceString(e));if(player!=null)main(()->player.finish());finish(Activity.RESULT_CANCELED,result);}}
}
