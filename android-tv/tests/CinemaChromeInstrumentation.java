package local.tvmorph.playercheck;
import android.app.*;
import android.content.*;
import android.os.*;
import android.view.*;
import android.widget.*;
import android.graphics.*;
import java.lang.reflect.*;
public class CinemaChromeInstrumentation extends Instrumentation {
 Activity player;Bundle arguments;
 private Object field(String name)throws Exception{Field f=player.getClass().getDeclaredField(name);f.setAccessible(true);return f.get(player);}
 private Object uncheckedField(String name){try{return field(name);}catch(Exception e){throw new RuntimeException(e);}}
 private void call(String name)throws Exception{Method m=player.getClass().getDeclaredMethod(name);m.setAccessible(true);m.invoke(player);}
 private void main(Runnable action){runOnMainSync(action);waitForIdleSync();}
 private void check(boolean ok,String message){if(!ok)throw new AssertionError(message);}
 private void invoke(String name){main(()->{try{call(name);}catch(Exception e){throw new RuntimeException(e);}});}
 private void click(View view){main(()->view.performClick());}
 private int[] box(View view){int[] p=new int[2];view.getLocationOnScreen(p);return new int[]{p[0],p[1],view.getWidth(),view.getHeight()};}
 private void sameBox(int[] a,int[] b){check(java.util.Arrays.equals(a,b),"Dock moved or resized when a side panel opened");}
 private void launch(String path)throws Exception{Intent intent=new Intent().setClassName("local.tvmorph.tv","local.tvmorph.tv.PlayerActivity").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).putExtra("url","http://10.0.2.2:8766/"+path).putExtra("name","Morph TV · Playback Test").putExtra("itemKind","vod").putExtra("itemId","chrome-test").putExtra("playerMetadata","{\"year\":\"2026\",\"genre\":\"Test video\",\"plot\":\"Generated local video · Native Android player verification\"}").putExtra("live",false);player=startActivitySync(intent);long deadline=SystemClock.uptimeMillis()+25000;while(SystemClock.uptimeMillis()<deadline&&!Boolean.TRUE.equals(field("prepared")))Thread.sleep(50);check(Boolean.TRUE.equals(field("prepared")),"Sample video must prepare");waitForIdleSync();}
 private View header(String title)throws Exception{return ((LinearLayout)field("rightPanel")).findViewWithTag("section:"+title);}
 private View options(String title)throws Exception{return ((LinearLayout)field("rightPanel")).findViewWithTag("choices:"+title);}
 @Override public void onCreate(Bundle args){super.onCreate(args);arguments=args==null?new Bundle():args;start();}
 @Override public void onStart(){Bundle result=new Bundle();try{setInTouchMode(false);getTargetContext().getSharedPreferences("tvmorph-ui",0).edit().putBoolean("systemVodPlayer",false).putString("language","en").commit();launch("layout.mp4");invoke("toggle");invoke("show");
 View controls=(View)field("controls");int[] dock=box(controls);check(dock[2]>controls.getRootView().getWidth()*.90f,"Timeline spans the screen");check(dock[3]<controls.getRootView().getHeight()*.25f,"Compact transparent transport");
 Object chrome=field("cinemaChrome");Field topField=chrome.getClass().getDeclaredField("top");topField.setAccessible(true);LinearLayout top=(LinearLayout)topField.get(chrome);check(box(top)[1]<dock[1],"Tools above video");check(top.getChildAt(0)==field("channelTitle"),"Title in top bar");check(top.getChildCount()==2,"Title and tools only, no clock");
 LinearLayout actions=(LinearLayout)field("actionRow");for(String caption:new String[]{"−10","+10"}){Button skip=null;for(int i=0;i<actions.getChildCount();i++){View v=actions.getChildAt(i);if(v instanceof Button&&caption.contentEquals(((Button)v).getText()))skip=(Button)v;}check(skip!=null,"Skip preserved: "+caption);final Button selected=skip;main(()->selected.requestFocus());for(int n=0;n<3;n++){sendKeyDownUpSync(KeyEvent.KEYCODE_DPAD_CENTER);Thread.sleep(150);check(player.getCurrentFocus()==selected,"Skip focus stays fixed");}}
 main(()->((View)uncheckedField("gearButton")).requestFocus());invoke("toggleRightPanel");ScrollView settings=(ScrollView)field("settingScroll");check(box(settings)[1]>box(top)[1],"Settings below top tools");check(box(settings)[1]+settings.getHeight()<=dock[1],"Settings above timeline");sameBox(dock,box(controls));
 for(String label:new String[]{"Video Quality","Audio Track","Subtitles","Aspect Ratio","Playback Speed","Stream Information"}){View h=header(label);check(h!=null,"Feature retained: "+label);if(options(label)==null)click(h);check(options(label)!=null,"Feature opens: "+label);click(h);check(options(label)==null,"Feature closes: "+label);}
 sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);check(settings.getVisibility()==View.GONE,"Back closes settings");check(player.getCurrentFocus()==field("gearButton"),"Back preserves top Settings focus");Thread.sleep(300);check(player.getCurrentFocus()==field("gearButton"),"Top focus remains stable");invoke("openSubtitlesMenu");check(header("Subtitles")!=null&&header("Aspect Ratio")==null,"Dedicated Subtitles menu instead of duplicate settings");sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);invoke("show");Object browser=field("channelBrowser");main(()->{try{Method open=browser.getClass().getDeclaredMethod("open");open.setAccessible(true);open.invoke(browser);}catch(Exception e){throw new RuntimeException(e);}});Thread.sleep(250);Field panelField=browser.getClass().getDeclaredField("panel");panelField.setAccessible(true);View panel=(View)panelField.get(browser);check(box(panel)[1]+panel.getHeight()<=dock[1],"Drawer reaches down to player without overlap");check(panel.getWidth()<controls.getRootView().getWidth()*.3f,"Narrow one-column drawer");Field categoriesField=browser.getClass().getDeclaredField("channelScroll");categoriesField.setAccessible(true);check(((View)categoriesField.get(browser)).getVisibility()==View.GONE,"No blank second column while browsing categories");sameBox(dock,box(controls));invoke("hidePlaybackChrome");check(top.getVisibility()==View.GONE&&controls.getVisibility()==View.GONE,"Clean playback hides all chrome");
 result.putString("result","PASS cinema player: transparent full-width seek, tools above, all settings retained, narrow in-place drawer, stable top-menu focus, stable repeated skip focus, clean playback.");main(()->player.finish());finish(Activity.RESULT_OK,result);
 }catch(Throwable e){result.putString("error",android.util.Log.getStackTraceString(e));if(player!=null)main(()->player.finish());finish(Activity.RESULT_CANCELED,result);}}
}
