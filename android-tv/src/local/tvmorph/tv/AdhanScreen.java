package local.tvmorph.tv;

import android.app.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.view.*;
import android.widget.*;
import java.io.InputStream;

/** Foreground dialog: keep the existing activity and playback resume owner intact. */
final class AdhanScreen {
 static Dialog show(Activity owner,String prayer,Runnable stop)throws Exception{
  String lang=UiSettings.language(owner);String[] words;
  if(lang.equals("ar"))words=new String[]{"حان وقت الصلاة","المشاهدة تستكمل بعد انتهاء الأذان إذا كان الفيديو يعمل.","إيقاف الأذان والرجوع","الفجر","الظهر","العصر","المغرب","العشاء"};
  else if(lang.equals("fr"))words=new String[]{"C’est l’heure de la prière","La vidéo reprend après l’Adhan si elle était en cours.","Arrêter l’Adhan et revenir","Fajr","Dhuhr","Asr","Maghrib","Isha"};
  else if(lang.equals("zh"))words=new String[]{"礼拜时间到了","宣礼结束后，之前正在播放的视频将继续。","停止宣礼并返回","晨礼","晌礼","晡礼","昏礼","宵礼"};
  else if(lang.equals("ja"))words=new String[]{"礼拝の時間です","再生中だった動画はアザーンの終了後に再開します。","アザーンを停止して戻る","ファジュル","ズフル","アスル","マグリブ","イシャー"};
  else words=new String[]{"It is time for prayer","Video resumes after the Adhan if it was playing.","Stop Adhan and return","Fajr","Dhuhr","Asr","Maghrib","Isha"};
  android.util.DisplayMetrics metrics=owner.getResources().getDisplayMetrics();float density=metrics.density;boolean compact=metrics.widthPixels/density<700||metrics.heightPixels/density<450;
  Dialog dialog=new Dialog(owner,android.R.style.Theme_Black_NoTitleBar_Fullscreen);FrameLayout root=new FrameLayout(owner);root.setBackgroundColor(0xff071a2a);
  ImageView image=new ImageView(owner);image.setScaleType(ImageView.ScaleType.CENTER_CROP);try(InputStream in=owner.getAssets().open("tv/assets/prayer-pause-v1.webp")){BitmapFactory.Options options=new BitmapFactory.Options();options.inPreferredConfig=Bitmap.Config.RGB_565;image.setImageBitmap(BitmapFactory.decodeStream(in,null,options));}catch(Exception missing){/* Solid background remains readable when artwork is unavailable. */}root.addView(image,new FrameLayout.LayoutParams(-1,-1));
  View shade=new View(owner);shade.setBackground(new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT,new int[]{0xdd04101a,0x3304101a}));root.addView(shade,new FrameLayout.LayoutParams(-1,-1));
  LinearLayout content=new LinearLayout(owner);content.setOrientation(LinearLayout.VERTICAL);content.setGravity(Gravity.CENTER_VERTICAL);content.setPadding((int)(40*density),(int)(24*density),(int)(40*density),(int)(24*density));content.setLayoutDirection(lang.equals("ar")?View.LAYOUT_DIRECTION_RTL:View.LAYOUT_DIRECTION_LTR);
  FrameLayout.LayoutParams cp=new FrameLayout.LayoutParams(compact?-1:(int)(metrics.widthPixels*.68),-1,Gravity.LEFT);root.addView(content,cp);
  TextView brand=text(owner,"MORPH TV",compact?16:22);brand.setTextColor(0xff9ddff1);content.addView(brand);content.addView(text(owner,words[0],compact?30:48));String[] names={"Fajr","Dhuhr","Asr","Maghrib","Isha"};String name="";for(int i=0;i<names.length;i++)if(names[i].equals(prayer))name=words[i+3];if(!name.isEmpty())content.addView(text(owner,name,compact?25:36));content.addView(text(owner,words[1],compact?16:23));
  Button button=new Button(owner);button.setText(words[2]);button.setAllCaps(false);button.setTextColor(0xffffffff);button.setTextSize(compact?16:24);button.setMinHeight((int)(56*density));button.setPadding((int)(22*density),0,(int)(22*density),0);GradientDrawable bg=new GradientDrawable();bg.setColors(new int[]{0xff163b5d,0xff0b2239});bg.setOrientation(GradientDrawable.Orientation.TL_BR);bg.setCornerRadius(14*density);bg.setStroke((int)(2*density),LauncherDialog.accent(owner));button.setBackground(bg);button.setBackgroundTintList(null);button.setStateListAnimator(null);button.setElevation(0);button.setOnClickListener(v->stop.run());LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-2,-2);bp.topMargin=(int)(24*density);content.addView(button,bp);
  dialog.setContentView(root);dialog.setOnCancelListener(d->stop.run());dialog.setOnDismissListener(d->image.setImageDrawable(null));dialog.show();Window window=dialog.getWindow();if(window!=null){window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);window.setLayout(-1,-1);}button.requestFocus();return dialog;
 }
 private static TextView text(Activity owner,String value,int size){TextView text=new TextView(owner);text.setText(value);text.setTextColor(0xffffffff);text.setTextSize(size);text.setPadding(0,8,0,8);return text;}
 private AdhanScreen(){}
}
