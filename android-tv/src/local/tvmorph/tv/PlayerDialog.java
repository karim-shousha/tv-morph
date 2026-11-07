package local.tvmorph.tv;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.style.RelativeSizeSpan;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.CheckedTextView;
import android.widget.TextView;

/** Presentation for the shared Android player. Click, retry and engine ownership stay in PlayerActivity. */
final class PlayerDialog {
  private static final int PRIMARY=0xff2563eb;
  private PlayerDialog() {}

  static AlertDialog.Builder builder(final Activity owner) {
    return new AlertDialog.Builder(owner) {
      @Override public AlertDialog show() {
        AlertDialog dialog=super.show();
        style(owner,dialog);
        return dialog;
      }
    };
  }

  private static int unit(Activity owner,int value) {
    if(PlayerPalette.phone(owner))return Math.round(value*owner.getResources().getDisplayMetrics().density);
    return Math.max(1,Math.round(value*PlayerCinemaChrome.unit((PlayerActivity)owner)));
  }
  private static void textSize(Activity owner,TextView text,int phone,int tv) {
    boolean mobile=PlayerPalette.phone(owner);
    text.setTextSize(mobile?TypedValue.COMPLEX_UNIT_SP:TypedValue.COMPLEX_UNIT_PX,
        (mobile?phone:Math.max(16,unit(owner,tv)))*UiSettings.fontScale(owner));
  }
  private static double luminance(int color) {
    double[] c={Color.red(color)/255.0,Color.green(color)/255.0,Color.blue(color)/255.0};
    for(int i=0;i<c.length;i++)c[i]=c[i]<=.04045?c[i]/12.92:Math.pow((c[i]+.055)/1.055,2.4);
    return .2126*c[0]+.7152*c[1]+.0722*c[2];
  }
  private static int foreground(int background) {
    int light=0xfff3f6ff,dark=0xff17253d;double b=luminance(background);
    return (luminance(light)+.05)/(b+.05)>=(b+.05)/(luminance(dark)+.05)?light:dark;
  }
  private static GradientDrawable surface(Activity owner,int fill,int stroke,int border) {
    GradientDrawable shape=new GradientDrawable();shape.setColor(fill);
    shape.setCornerRadius(unit(owner,12));shape.setStroke(Math.max(1,unit(owner,stroke)),border);return shape;
  }
  private static void textTree(Activity owner,View view,int ink) {
    if(view instanceof TextView&&!(view instanceof Button)) {
      TextView text=(TextView)view;text.setTextColor(ink);textSize(owner,text,16,22);
      text.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));text.setLineSpacing(0,1.3f);
      if(text instanceof CheckedTextView)((CheckedTextView)text).setCheckMarkTintList(ColorStateList.valueOf(PRIMARY));
    }
    if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)textTree(owner,((ViewGroup)view).getChildAt(i),ink);
  }
  private static void style(final Activity owner,final AlertDialog dialog) {
    final Window window=dialog.getWindow();if(window==null||owner.isFinishing())return;
    final int background=PlayerPalette.surface(owner),ink=foreground(background);
    window.setBackgroundDrawable(surface(owner,background,1,PlayerPalette.alpha(ink,55)));
    window.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);window.setDimAmount(.5f);
    int screen=owner.getResources().getDisplayMetrics().widthPixels,edge=unit(owner,20);
    int width=Math.min(screen-edge*2,unit(owner,PlayerPalette.phone(owner)?560:1000));
    window.setLayout(width,WindowManager.LayoutParams.WRAP_CONTENT);
    window.getDecorView().setLayoutDirection(UiSettings.language(owner).equals("ar")?View.LAYOUT_DIRECTION_RTL:View.LAYOUT_DIRECTION_LTR);
    textTree(owner,window.getDecorView(),ink);
    int titleId=owner.getResources().getIdentifier("alertTitle","id","android");
    TextView title=dialog.findViewById(titleId);
    if(title!=null){textSize(owner,title,20,28);title.setTypeface(Typeface.create("sans-serif",Typeface.BOLD));}
    TextView message=dialog.findViewById(android.R.id.message);
    if(message!=null){
      String content=message.getText().toString();int code=content.indexOf("\n");
      if(code>=0){SpannableString copy=new SpannableString(content);copy.setSpan(new RelativeSizeSpan(.85f),code,copy.length(),Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);message.setText(copy);}
    }
    for(final int which:new int[]{AlertDialog.BUTTON_POSITIVE,AlertDialog.BUTTON_NEGATIVE,AlertDialog.BUTTON_NEUTRAL}) {
      final Button button=dialog.getButton(which);if(button==null)continue;
      final boolean primary=which==AlertDialog.BUTTON_POSITIVE;
      button.setAllCaps(false);button.setMaxLines(2);button.setMinHeight(Math.max(44,unit(owner,48)));
      button.setMinimumHeight(Math.max(44,unit(owner,48)));button.setMinWidth(unit(owner,88));
      button.setPadding(unit(owner,14),unit(owner,8),unit(owner,14),unit(owner,8));
      textSize(owner,button,14,20);button.setTextColor(primary?Color.WHITE:ink);
      button.setBackground(surface(owner,primary?PRIMARY:Color.TRANSPARENT,1,primary?PRIMARY:PlayerPalette.alpha(ink,55)));
      button.setOnFocusChangeListener((view,focused)->button.setBackground(surface(owner,primary?PRIMARY:Color.TRANSPARENT,focused?3:1,focused?(primary?Color.WHITE:PRIMARY):primary?PRIMARY:PlayerPalette.alpha(ink,55))));
    }
    if(dialog.getListView()!=null){
      dialog.getListView().setSelector(surface(owner,PlayerPalette.alpha(PRIMARY,35),2,PRIMARY));
      dialog.getListView().post(()->textTree(owner,dialog.getListView(),ink));
    }else if(dialog.getButton(AlertDialog.BUTTON_POSITIVE)!=null)dialog.getButton(AlertDialog.BUTTON_POSITIVE).requestFocus();
  }
}
