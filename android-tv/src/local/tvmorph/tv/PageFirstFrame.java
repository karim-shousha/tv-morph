package local.tvmorph.tv;

import android.app.Activity;
import android.view.View;
import android.view.ViewTreeObserver;
import android.webkit.WebView;

/** Keep the previous window until a local WebView can draw its committed page. */
final class PageFirstFrame {
    static void awaitVisible(Activity activity, WebView web) {
        View root = activity.getWindow().getDecorView();
        android.widget.FrameLayout content = activity.findViewById(android.R.id.content);
        android.widget.LinearLayout loading=new android.widget.LinearLayout(activity);
        loading.setTag("morph-page-loading");loading.setOrientation(1);loading.setGravity(android.view.Gravity.CENTER);loading.setBackgroundColor(0xff07101e);
        android.widget.LinearLayout brand=new android.widget.LinearLayout(activity);brand.setGravity(android.view.Gravity.CENTER);brand.setLayoutDirection(View.LAYOUT_DIRECTION_LTR);
        android.widget.ImageView symbol=new android.widget.ImageView(activity);symbol.setScaleType(android.widget.ImageView.ScaleType.FIT_CENTER);
        try(java.io.InputStream in=activity.getAssets().open("tv/assets/morph-header-symbol.webp")){symbol.setImageBitmap(android.graphics.BitmapFactory.decodeStream(in));brand.addView(symbol,new android.widget.LinearLayout.LayoutParams(100,90));}catch(Exception ignored){}
        android.widget.TextView title=new android.widget.TextView(activity);title.setText(symbol.getDrawable()==null?"Morph Launcher":"orph Launcher");title.setGravity(android.view.Gravity.CENTER);title.setTextColor(0xfff2f5fa);title.setTextSize(30);brand.addView(title,new android.widget.LinearLayout.LayoutParams(-2,-2));loading.addView(brand,new android.widget.LinearLayout.LayoutParams(-2,-2));
        android.widget.ProgressBar spinner=new android.widget.ProgressBar(activity);spinner.setIndeterminateTintList(android.content.res.ColorStateList.valueOf(0xffe5c687));android.widget.LinearLayout.LayoutParams sp=new android.widget.LinearLayout.LayoutParams(48,48);sp.topMargin=26;sp.gravity=android.view.Gravity.CENTER_HORIZONTAL;loading.addView(spinner,sp);
        android.widget.TextView note=new android.widget.TextView(activity);note.setText(FamilyText.t(activity,"جاري تجهيز الصفحة…","Loading your page…"));note.setGravity(android.view.Gravity.CENTER);note.setTextColor(0xffd1ddeb);note.setTextSize(20);note.setPadding(24,24,24,0);loading.addView(note,new android.widget.LinearLayout.LayoutParams(-2,-2));
        final boolean[] shown={false};
        Runnable showLoading=()->{if(activity.isFinishing()||web.getVisibility()==View.VISIBLE)return;shown[0]=true;content.addView(loading,new android.widget.FrameLayout.LayoutParams(-1,-1));root.invalidate();};
        Runnable recovery = () -> {
            if (!activity.isFinishing() && web.getVisibility() != View.VISIBLE) web.setVisibility(View.VISIBLE);
        };
        root.getViewTreeObserver().addOnPreDrawListener(new ViewTreeObserver.OnPreDrawListener() {
            @Override public boolean onPreDraw() {
                if (web.getVisibility() != View.VISIBLE && !activity.isFinishing()) return shown[0];
                content.removeView(loading);
                web.removeCallbacks(showLoading);
                web.removeCallbacks(recovery);
                if (root.getViewTreeObserver().isAlive()) root.getViewTreeObserver().removeOnPreDrawListener(this);
                return true;
            }
        });
        // Recovery only: an unavailable renderer must not leave a window waiting forever.
        web.postDelayed(showLoading, 300);
        web.postDelayed(recovery, 5000);
    }
}
