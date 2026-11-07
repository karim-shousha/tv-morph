package local.tvmorph.tv;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.*;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.view.View;
import android.view.animation.LinearInterpolator;

/** First native frame matches the shared 1920×1080 web loader; no artificial wait. */
final class StartupCover extends View {
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);
    private final RectF logoBox=new RectF();
    private final StaticLayout slogan, status;
    private final Shader rule=new LinearGradient(360,585,1560,585,new int[]{0x0093bbda,0x4793bbda,0x0093bbda},null,Shader.TileMode.CLAMP);
    private Bitmap logo;
    private final boolean iptv;
    private ValueAnimator animator;
    private float progress=.5f;
    private final boolean motion;

    StartupCover(Context context){this(context,false);}
    StartupCover(Context context,boolean iptv){
        super(context);this.iptv=iptv;
        setBackground(new LoadingBackground(context));
        String lang=UiSettings.prefs(context).getString("language","en");
        boolean ar=lang.equals("ar"),fr=lang.equals("fr");
        slogan=paragraph(iptv?(ar?"كل ترفيهك. في مكان واحد.":fr?"Tous vos divertissements. Au même endroit.":"All your entertainment. One place."):ar?"شاشتك. عالمك. بطريقتك.":fr?"Votre écran. Votre univers. À votre façon.":"Your screen. Your world. Your way.",32,0xffd8e5f4);
        status=paragraph(iptv?(ar?"جارٍ تجهيز مكتبتك…":fr?"Préparation de votre bibliothèque…":"Preparing your library…"):ar?"جارٍ تجهيز شاشتك…":fr?"Préparation de votre écran…":"Preparing your screen…",24,0xffa9bbd0);
        try(java.io.InputStream stream=context.getAssets().open(iptv?"iptv/morph-loading-symbol.webp":"tv/assets/morph-loading-symbol.webp")){
            BitmapFactory.Options options=new BitmapFactory.Options();options.inScaled=false;
            logo=BitmapFactory.decodeStream(stream,null,options);
        }catch(java.io.IOException ignored){}
        // A transient loading indicator remains active in Light mode, just like
        // the shared IPTV loader. Respect the system animation setting.
        motion=ValueAnimator.areAnimatorsEnabled();
        setContentDescription(iptv?"Morph IPTV. Loading":"Morph Launcher. Loading");
    }
    private StaticLayout paragraph(String text,float size,int color){
        TextPaint p=new TextPaint(Paint.ANTI_ALIAS_FLAG);p.setTextSize(size);p.setColor(color);p.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));
        return StaticLayout.Builder.obtain(text,0,text.length(),p,1680).setAlignment(Layout.Alignment.ALIGN_CENTER).setIncludePad(false).build();
    }
    private void animateIfVisible(){
        if(!motion||getWindowVisibility()!=VISIBLE||!isShown()||!isAttachedToWindow()){if(animator!=null){animator.cancel();animator=null;}return;}
        if(animator!=null)return;
        animator=ValueAnimator.ofFloat(0,1);animator.setDuration(1600);animator.setRepeatCount(ValueAnimator.INFINITE);animator.setInterpolator(new LinearInterpolator());
        animator.addUpdateListener(value->{progress=(Float)value.getAnimatedValue();invalidate();});animator.start();
    }
    @Override protected void onAttachedToWindow(){super.onAttachedToWindow();animateIfVisible();}
    @Override protected void onDetachedFromWindow(){if(animator!=null){animator.cancel();animator=null;}super.onDetachedFromWindow();}
    @Override protected void onVisibilityChanged(View changed,int visibility){super.onVisibilityChanged(changed,visibility);animateIfVisible();if(changed==this&&visibility==GONE){logo=null;setBackground(null);}}
    @Override protected void onWindowVisibilityChanged(int visibility){super.onWindowVisibilityChanged(visibility);animateIfVisible();}
    private void words(Canvas canvas,String text,float x,float y,float size,int color,Paint.Align align){paint.setColor(color);paint.setTextSize(size);paint.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));paint.setTextAlign(align);canvas.drawText(text,x,y,paint);}
    @Override protected void onDraw(Canvas canvas){
        super.onDraw(canvas);
        float scale=Math.min(getWidth()/1920f,getHeight()/1080f);int saved=canvas.save();canvas.translate((getWidth()-1920*scale)/2,(getHeight()-1080*scale)/2);canvas.scale(scale,scale);
        paint.setTypeface(Typeface.create("sans-serif",Typeface.BOLD));paint.setTextSize(112);paint.setTextAlign(Paint.Align.LEFT);
        String brandName=iptv?"orph IPTV":"orph Launcher";
        float brandLeft=(1920-(268+paint.measureText(brandName)))/2;
        logoBox.set(brandLeft,300,brandLeft+260,560);
        if(logo!=null){canvas.drawBitmap(logo,null,logoBox,paint);}
        paint.setColor(0xfff4f5f8);Paint.FontMetrics font=paint.getFontMetrics();canvas.drawText(brandName,brandLeft+268,430-(font.ascent+font.descent)/2,paint);
        paint.setShader(rule);canvas.drawRect(360,585,1560,586,paint);paint.setShader(null);
        int textSave=canvas.save();canvas.translate(120,610);slogan.draw(canvas);canvas.translate(0,132);status.draw(canvas);canvas.restoreToCount(textSave);
        paint.setColor(0x2b83abce);canvas.drawRect(836,710,1084,713,paint);
        int barSave=canvas.save();canvas.clipRect(836,710,1084,713);float left=motion?746+338*progress:915;
        // Keep the launcher segment visible after drawing the translucent track.
        if(!iptv)paint.setAlpha(255);
        paint.setShader(new LinearGradient(left,710,left+90,710,new int[]{0x0062e7f3,0xff62e7f3,0xff8bbdff},null,Shader.TileMode.CLAMP));canvas.drawRect(left,710,left+90,713,paint);paint.setShader(null);canvas.restoreToCount(barSave);
        words(canvas,"Developed by Karim Aboushousha",92,1008,18,0xff8ba5bd,Paint.Align.LEFT);
        words(canvas,"morph-tv.com",1828,1008,18,0xff8ba5bd,Paint.Align.RIGHT);
        canvas.restoreToCount(saved);
    }
}
