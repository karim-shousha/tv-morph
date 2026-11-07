package local.tvmorph.tv;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.*;
import java.util.*;

/** Presentation only. The existing player continues to own every playback action. */
final class PlayerCinemaChrome {
  final PlayerActivity owner;
  final LinearLayout top,tools;
  final View topShade,bottomShade;
  final LinearLayout bottom;
  final List<View> topButtons=new ArrayList<>();
  private int visible=View.VISIBLE;
  static float unit(PlayerActivity c){android.util.DisplayMetrics m=c.getResources().getDisplayMetrics();return Math.min(m.widthPixels/1920f,m.heightPixels/1080f);}
  static int size(PlayerActivity c,int design){return Math.round(design*unit(c));}
  static int headerHeight(PlayerActivity c){return Math.max(PlayerPalette.phone(c)?Math.round(48*c.getResources().getDisplayMetrics().density):48,size(c,88));}
  static int headerBottom(PlayerActivity c){return Math.max(12,size(c,34))+headerHeight(c)+Math.max(8,size(c,16));}
  static void detach(View v){if(v.getParent() instanceof ViewGroup)((ViewGroup)v.getParent()).removeView(v);}
  PlayerCinemaChrome(PlayerActivity c,FrameLayout root,LinearLayout controls,LinearLayout actions,LinearLayout progress,TextView title,SeekBar timeline,TextView elapsed,TextView duration,Button pause){
    owner=c;bottom=controls;
    int width=c.getResources().getDisplayMetrics().widthPixels,edge=Math.max(12,size(c,44));
    topShade=shade(root,true);bottomShade=shade(root,false);
    top=new LinearLayout(c);top.setGravity(Gravity.CENTER_VERTICAL);top.setLayoutDirection(View.LAYOUT_DIRECTION_LTR);
    FrameLayout.LayoutParams tp=new FrameLayout.LayoutParams(-1,headerHeight(c),Gravity.TOP);tp.setMargins(edge,Math.max(12,size(c,34)),edge,0);root.addView(top,tp);
    PlayerChromeButton back=new PlayerChromeButton(c,"Back",false);back.setTag("player-back");back.textOnly(true);back.caption(UiSettings.language(c).equals("ar")?"رجوع":"Back");back.setContentDescription(UiSettings.language(c).equals("ar")?"رجوع إلى القائمة السابقة":"Back to previous list");back.setOnClickListener(v->c.backFromPlayback());back.setOnFocusChangeListener((v,f)->v.invalidate());if(PlayerPalette.phone(c))back.videoOverlay(true);top.addView(back,new LinearLayout.LayoutParams(Math.max(headerHeight(c),size(c,180)),headerHeight(c)));topButtons.add(back);
    detach(title);title.setVisibility(View.VISIBLE);title.setSingleLine(true);title.setTextColor(PlayerPalette.text(c));title.setTextSize(TypedValue.COMPLEX_UNIT_PX,Math.max(16,size(c,34))*UiSettings.fontScale(c));
    top.addView(title,new LinearLayout.LayoutParams(0,-2,1));tools=new LinearLayout(c);tools.setGravity(Gravity.CENTER_VERTICAL);top.addView(tools);
    List<View> buttons=new ArrayList<>();for(int i=0;i<actions.getChildCount();i++)buttons.add(actions.getChildAt(i));
    for(View v:buttons)if(v instanceof Button){String value=((Button)v).getText().toString();if(Arrays.asList("Audio","Muted","▭","▣","⚙","▤").contains(value)){detach(v);if(v instanceof PlayerChromeButton)((PlayerChromeButton)v).glyphOnly(true);int side=PlayerPalette.phone(c)?headerHeight(c):Math.max(44,size(c,76));if(PlayerPalette.phone(c)&&v instanceof PlayerChromeButton)((PlayerChromeButton)v).videoOverlay(true);tools.addView(v,new LinearLayout.LayoutParams(side,side));topButtons.add(v);}}
    if(controls.getChildCount()>0){View card=controls.getChildAt(0);card.setBackgroundColor(Color.TRANSPARENT);card.setPadding(0,0,0,0);}
    progress.removeAllViews();progress.setOrientation(LinearLayout.VERTICAL);progress.addView(timeline,new LinearLayout.LayoutParams(-1,Math.max(40,size(c,44))));
    LinearLayout times=new LinearLayout(c);times.setGravity(Gravity.CENTER_VERTICAL);elapsed.setTextSize(TypedValue.COMPLEX_UNIT_PX,Math.max(12,size(c,21)));duration.setTextSize(TypedValue.COMPLEX_UNIT_PX,Math.max(12,size(c,21)));elapsed.setGravity(Gravity.LEFT);duration.setGravity(Gravity.RIGHT);
    times.addView(elapsed,new LinearLayout.LayoutParams(0,-2,1));times.addView(duration);progress.addView(times);
    List<Button> bottomButtons=new ArrayList<>();for(int i=0;i<actions.getChildCount();i++)if(actions.getChildAt(i) instanceof Button)bottomButtons.add((Button)actions.getChildAt(i));
    actions.removeAllViews();actions.setGravity(Gravity.CENTER_VERTICAL);int control=Math.max(44,size(c,78)),primary=Math.max(48,size(c,90)),browse=Math.max(width<600?44:118,size(c,width<600?78:214));
    int left=0,count=0;
    for(Button b:bottomButtons){
      if(b==pause&&b instanceof PlayerChromeButton)((PlayerChromeButton)b).glyphOnly(true);
      String value=b.getText().toString();boolean category=value.contains("☷"),favorite=value.equals("♡")||value.equals("♥");
      if(width<600&&(value.contains("⏮")||value.contains("⏭")))b.setVisibility(View.GONE);
      if(!category&&!favorite&&count==0){actions.addView(new View(c),new LinearLayout.LayoutParams(0,1,1));count++;}
      int side=b==pause?primary:category?browse:control;
      LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(side,b==pause?primary:control);p.setMargins(Math.max(2,size(c,5)),0,Math.max(2,size(c,5)),0);actions.addView(b,p);if(category||favorite)left+=side+2*Math.max(2,size(c,5));
      if(category&&width>=600&&b instanceof PlayerChromeButton)((PlayerChromeButton)b).caption(UiSettings.language(c).equals("ar")?"القوائم":"Categories");
    }
    actions.addView(new View(c),new LinearLayout.LayoutParams(0,1,1));View balance=new View(c);actions.addView(balance,new LinearLayout.LayoutParams(width<600?control:left,1));
    actions.setLayoutParams(new LinearLayout.LayoutParams(-1,primary+Math.max(8,size(c,14))));
    FrameLayout.LayoutParams cp=(FrameLayout.LayoutParams)controls.getLayoutParams();cp.width=width-edge*2;cp.bottomMargin=Math.max(10,size(c,28));controls.setLayoutParams(cp);
    if(PlayerPalette.phone(c)){
      controls.setBackgroundColor(Color.TRANSPARENT);top.setBackgroundColor(Color.TRANSPARENT);
      for(int i=0;i<controls.getChildCount();i++)controls.getChildAt(i).setBackgroundColor(Color.TRANSPARENT);
      controls.setPadding(12,4,12,4);top.setPadding(12,0,6,0);
      for(TextView label:Arrays.asList(title,elapsed,duration)){label.setTextColor(Color.WHITE);label.setShadowLayer(3,0,1,0xff000000);}
      for(Button button:bottomButtons)if(button instanceof PlayerChromeButton)((PlayerChromeButton)button).videoOverlay(false);
    }
  }
  private View shade(FrameLayout root,boolean upper){View v=new View(owner);GradientDrawable d=new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,upper?new int[]{0xb00b1528,0x000b1528}:new int[]{0x00111d31,0xdf111d31});v.setBackground(d);v.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);FrameLayout.LayoutParams p=new FrameLayout.LayoutParams(-1,Math.max(100,size(owner,upper?280:330)),upper?Gravity.TOP:Gravity.BOTTOM);root.addView(v,p);v.bringToFront();bottom.bringToFront();return v;}
  void visibility(int value){visible=value;top.setVisibility(value);topShade.setVisibility(value);bottomShade.setVisibility(value);}
  boolean containsTop(View v){while(v!=null){if(v==top)return true;v=v.getParent() instanceof View?(View)v.getParent():null;}return false;}
  boolean moveFromTimeline(int code){if(code!=android.view.KeyEvent.KEYCODE_DPAD_UP)return false;if(!topButtons.isEmpty())topButtons.get(topButtons.size()-1).requestFocus();return true;}
  boolean moveFromTop(int code,SeekBar timeline,Button pause){if(code==android.view.KeyEvent.KEYCODE_DPAD_DOWN){if(timeline.isEnabled())timeline.requestFocus();else pause.requestFocus();return true;}if(code==android.view.KeyEvent.KEYCODE_DPAD_UP)return true;return false;}
}
