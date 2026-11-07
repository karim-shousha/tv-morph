package local.tvmorph.tv;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.ContextThemeWrapper;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;
import java.util.WeakHashMap;

/** Presentation for launcher-owned native menus. System settings and playback keep their owners. */
final class LauncherDialog {
 private static final WeakHashMap<View,Boolean> styled=new WeakHashMap<>();
 static int accent(Context c){return UiSettings.color(c,"uiAction",0xff857454);}
 static int base(Context c){return "night".equals(UiSettings.prefs(c).getString("theme","night"))?0xff07101e:UiSettings.color(c,"uiBg",0xff07101e);}
 private static int alpha(int color,int a){return color&0xffffff|a<<24;}
 private static int dp(Context c,int value){return Math.max(1,Math.round(c.getResources().getDisplayMetrics().density*value));}
 static GradientDrawable surface(Context c,boolean focus){int a=accent(c),b=base(c);GradientDrawable d=new GradientDrawable(GradientDrawable.Orientation.TL_BR,new int[]{alpha(focus?a:b,focus?65:235),alpha(b,245)});d.setCornerRadius(dp(c,18));d.setStroke(dp(c,1),alpha(a,focus?220:70));return d;}
 private static void views(View v){v.setElevation(0);v.setStateListAnimator(null);Context c=v.getContext();if(v instanceof TextView){TextView t=(TextView)v;t.setTextColor(0xfff2f4f8);if(v instanceof EditText)t.setHintTextColor(0xffacb9cd);}
  if(v instanceof ListView)((ListView)v).setSelector(surface(c,true));
  if((v instanceof android.widget.Button||v instanceof EditText)&&!styled.containsKey(v)){styled.put(v,true);v.setBackground(surface(c,v.hasFocus()));View.OnFocusChangeListener prior=v.getOnFocusChangeListener();v.setOnFocusChangeListener((node,focus)->{node.setBackground(surface(node.getContext(),focus));if(prior!=null)prior.onFocusChange(node,focus);});}
  if(v instanceof ViewGroup){ViewGroup g=(ViewGroup)v;for(int i=0;i<g.getChildCount();i++)views(g.getChildAt(i));}
 }
 private static void apply(AlertDialog dialog){Window w=dialog.getWindow();if(w==null)return;Context c=dialog.getContext();w.setElevation(0);w.setBackgroundDrawable(surface(c,false));views(w.getDecorView());int width=Math.min(dp(c,760),(int)(c.getResources().getDisplayMetrics().widthPixels*.90f));w.setLayout(width,ViewGroup.LayoutParams.WRAP_CONTENT);}
 static final class Builder extends AlertDialog.Builder {
  Builder(Context c){super(new ContextThemeWrapper(c,android.R.style.Theme_Material_Dialog_Alert));}
  @Override public AlertDialog create(){AlertDialog dialog=super.create();dialog.getWindow().getDecorView().post(()->apply(dialog));return dialog;}
  @Override public AlertDialog show(){AlertDialog dialog=create();dialog.show();apply(dialog);return dialog;}
 }
}
