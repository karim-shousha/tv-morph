package local.morphtv.legacy;
import android.app.*;import android.os.*;import android.content.*;import android.content.pm.*;import android.graphics.Color;import android.graphics.Typeface;import android.graphics.drawable.GradientDrawable;import android.view.*;import android.widget.*;import java.util.*;
public final class HomeActivity extends Activity {
 private android.graphics.Bitmap brandBitmap;private LinearLayout content;private boolean arabic,atHome;private long backAt;private int accent;private boolean alive=true;private final java.util.concurrent.ExecutorService worker=java.util.concurrent.Executors.newSingleThreadExecutor();
 private boolean iptvOnly(){return getPackageName().equals("local.morph.iptv.legacy");}
 private String productName(){return iptvOnly()?"Morph IPTV":"Morph Launcher";}
 private String t(String en,String ar){return arabic?ar:en;}
 private int dp(int value){return (int)(value*getResources().getDisplayMetrics().density+.5f);}
 public void onCreate(Bundle b){super.onCreate(b);arabic=getPreferences(0).getBoolean("arabic",false);home();welcome();}
 private void welcome(){if(getPreferences(0).getBoolean("welcomeSupportV1",false))return;
  final String[] row=arabic?new String[]{"أهلًا بيك في Morph TV","التطبيق مجاني. لو حابب تدعم تطويره وتحسينه، تقدر تساهم بالمبلغ اللي تختاره. الدعم اختياري ودفعة واحدة، وتقدر تبدأ الاستخدام فورًا.","ابدأ الاستخدام","ادعم التطوير"}:new String[]{"Welcome to Morph TV","The app is free. If you wish, contribute any amount to support development and improvements. Support is optional and one-time. You can start using the app immediately.","Start using the app","Support development"};
  AlertDialog dialog=new AlertDialog.Builder(this).setTitle(row[0]).setMessage(row[1]).setPositiveButton(row[2],null).setNegativeButton(row[3],new android.content.DialogInterface.OnClickListener(){public void onClick(android.content.DialogInterface d,int which){try{startActivity(new Intent(Intent.ACTION_VIEW,android.net.Uri.parse("https://donate.stripe.com/9B66oI2xb4yCdar0VB6EU03")));}catch(Exception e){message(t("Open morph-tv.com on your phone to support development.","افتح morph-tv.com من موبايلك لدعم التطوير."));}}}).create();
  dialog.setOnDismissListener(new android.content.DialogInterface.OnDismissListener(){public void onDismiss(android.content.DialogInterface d){getPreferences(0).edit().putBoolean("welcomeSupportV1",true).apply();}});dialog.show();
 }
 private void page(String title){atHome=false;arabic=getPreferences(0).getBoolean("arabic",false);accent=getPreferences(0).getInt("accent",0xffd2def4);android.widget.FrameLayout root=new FrameLayout(this);root.setBackground(new LegacyBackground(this));
  ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);scroll.setBackgroundColor(0x00000000);content=new LinearLayout(this);content.setOrientation(1);content.setPadding(dp(32),dp(18),dp(32),dp(28));scroll.addView(content);root.addView(scroll);setContentView(root);
  ImageView brand=new ImageView(this);brand.setContentDescription(productName());brand.setScaleType(ImageView.ScaleType.FIT_CENTER);if(brandBitmap==null){android.graphics.BitmapFactory.Options options=new android.graphics.BitmapFactory.Options();options.inSampleSize=4;brandBitmap=android.graphics.BitmapFactory.decodeResource(getResources(),getResources().getIdentifier("launcher_wordmark","drawable",getPackageName()),options);}brand.setImageBitmap(brandBitmap);LinearLayout.LayoutParams brandSize=new LinearLayout.LayoutParams(dp(230),dp(64));brandSize.gravity=Gravity.LEFT;content.addView(brand,brandSize);text(title,30,Color.WHITE);
 }
 private void text(String value,int size,int color){TextView v=new TextView(this);v.setText(value);v.setTextSize(size);v.setTextColor(color);v.setPadding(0,dp(6),0,dp(8));content.addView(v);}
 private GradientDrawable surface(boolean focused){GradientDrawable g=new GradientDrawable(GradientDrawable.Orientation.TL_BR,new int[]{focused?((accent&0xffffff)|0x66000000):0x66515c77,0x9937425f});g.setCornerRadius(dp(14));g.setStroke(dp(focused?3:1),focused?Color.WHITE:0xff657591);return g;}
 private Button button(LinearLayout parent,String label,final Runnable action){final Button v=new Button(this);v.setText(label);v.setTextColor(Color.WHITE);v.setTextSize(17);v.setAllCaps(false);v.setFocusable(true);v.setMinHeight(dp(62));v.setBackground(surface(false));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(dp(4),dp(5),dp(4),dp(5));parent.addView(v,p);
  v.setOnFocusChangeListener(new View.OnFocusChangeListener(){public void onFocusChange(View w,boolean f){v.setBackground(surface(f));if(f)v.requestRectangleOnScreen(new android.graphics.Rect(0,0,v.getWidth(),v.getHeight()),false);}});
  v.setOnClickListener(new View.OnClickListener(){public void onClick(View w){action.run();}});return v;
 }
 private void home(){page(iptvOnly()?"Morph IPTV":t("Your screen. More possibilities.","شاشتك. بإمكانيات أكتر."));atHome=true;text(t("Android 4.4+ · lightweight native edition","أندرويد ٤٫٤ فأحدث · نسخة خفيفة"),17,0xffbfcdeb);
  Button first=button(content,iptvOnly()?t("Open M3U playlist","فتح قائمة M3U"):"▶  Morph IPTV",new Runnable(){public void run(){playlistSettings();}});
  if(!iptvOnly()){
  button(content,"Cleaner",new Runnable(){public void run(){startActivity(new Intent(HomeActivity.this,local.tvmorph.tv.CleanerActivity.class));}});
  button(content,t("Your apps","تطبيقاتك"),new Runnable(){public void run(){apps();}});
  button(content,t("Device settings","إعدادات الجهاز"),new Runnable(){public void run(){try{startActivity(new Intent(android.provider.Settings.ACTION_SETTINGS));}catch(Exception e){message(t("Settings unavailable","الإعدادات غير متاحة"));}}});}
  button(content,t("Appearance / Language","المظهر / اللغة"),new Runnable(){public void run(){settings();}});
   text(t("M3U playback. Xtream account login, EPG and modern player features require Android 8+. Playback depends on device codecs and provider TLS support.","تشغيل قوائم M3U. حسابات Xtream وEPG وخصائص المشغل الحديثة تحتاج أندرويد ٨ فأحدث. التشغيل يعتمد على ترميز الجهاز واتصال المزوّد."),14,0xffc2cde0);first.requestFocus();
 }
 private void apps(){page(t("Your apps","تطبيقاتك"));final PackageManager pm=getPackageManager();List<ResolveInfo> list=pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER),0);Collections.sort(list,new ResolveInfo.DisplayNameComparator(pm));Set<String> seen=new HashSet<String>();
  for(final ResolveInfo item:list){final String pkg=item.activityInfo.packageName;if(pkg.equals(getPackageName())||!seen.add(pkg))continue;button(content,item.loadLabel(pm).toString(),new Runnable(){public void run(){try{Intent i=pm.getLaunchIntentForPackage(pkg);if(i!=null)startActivity(i);else message("App unavailable");}catch(Exception e){message("Could not open app");}}});}backButton();
 }
 protected void onResume(){super.onResume();LegacyUpdate.resume(this);}
 private void settings(){page(t("Appearance / Language","المظهر / اللغة"));button(content,t("App update","تحديث التطبيق"),new Runnable(){public void run(){LegacyUpdate.check(HomeActivity.this,arabic);}});button(content,"العربية / English",new Runnable(){public void run(){getPreferences(0).edit().putBoolean("arabic",!arabic).commit();settings();}});
  final int[] colors={0xffd2def4,0xff864bda,0xff087e91};String[] names={"Blue / أزرق","Violet / بنفسجي","Teal / فيروزي"};for(int i=0;i<colors.length;i++){final int c=colors[i];button(content,names[i],new Runnable(){public void run(){getPreferences(0).edit().putInt("accent",c).commit();settings();}});}backButton();
 }
 private void playlistSettings(){page(t("Morph IPTV · M3U playlist","Morph IPTV · قائمة M3U"));text(t("Enter your own provider playlist URL. It is used for this request only and is not saved.","أدخل رابط قائمة اشتراكك. يُستخدم للطلب الحالي فقط ولا يتم حفظه."),16,Color.WHITE);
  final EditText input=new EditText(this);input.setSingleLine(true);input.setTextColor(Color.WHITE);input.setHintTextColor(0xffaebbd0);input.setHint("https://provider.example/playlist.m3u");input.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_VARIATION_URI);input.setLayoutDirection(View.LAYOUT_DIRECTION_LTR);content.addView(input,new LinearLayout.LayoutParams(-1,dp(56)));
  final Button load=button(content,t("Load playlist","تحميل القائمة"),new Runnable(){public void run(){final String url=input.getText().toString().trim();if(!Playlist.valid(url)){message(t("Use a complete HTTP/HTTPS URL","اكتب رابط HTTP/HTTPS كامل"));return;}input.setText("");loadPlaylist(url);}});
   text(t("Up to 5,000 items / 2 MB. Up to 3 redirects followed (no HTTPS downgrade). HTTP links are unencrypted. DRM and newer codecs may not play. No certificate checks are bypassed.","الحد ٥٠٠٠ عنصر / ٢ ميجابايت. تُتابع ٣ تحويلات كحد أقصى. روابط HTTP غير مشفرة. قد لا يعمل DRM والترميز الحديث. لا يتم تجاوز التحقق من الشهادات."),14,0xffc2cde0);backButton();input.requestFocus();
 }
 private void loadPlaylist(final String url){page(t("Loading playlist…","جارٍ تحميل القائمة…"));backButton();final LinearLayout pending=content;
  worker.execute(new Runnable(){public void run(){
   try{
    final List<Playlist.Entry> entries=Playlist.fetch(url);
    runOnUiThread(new Runnable(){public void run(){if(!alive||content!=pending)return;channels(entries);}});
    }catch(final Exception error){
     runOnUiThread(new Runnable(){public void run(){
      if(alive&&content==pending){page(t("Could not load playlist","تعذر تحميل القائمة"));text(shortCause(error),16,Color.WHITE);text(t("No retry was made. No credentials or playlist URL were saved.","لم تتم إعادة المحاولة. لم يتم حفظ أي بيانات."),14,0xffc2cde0);backButton();}
     }});
    }
  }});
 }
 private void channels(final List<Playlist.Entry> entries){
  content=null;LinearLayout root=new LinearLayout(this);root.setOrientation(1);root.setPadding(dp(24),dp(12),dp(24),dp(12));root.setBackgroundColor(0xff08152b);
  button(root,t("Back to Home","الرجوع للرئيسية"),new Runnable(){public void run(){home();}});
  ListView list=new ListView(this);root.addView(list,new LinearLayout.LayoutParams(-1,0,1));
  list.setAdapter(new BaseAdapter(){public int getCount(){return entries.size();}public Object getItem(int p){return entries.get(p);}public long getItemId(int p){return p;}public View getView(int p,View old,android.view.ViewGroup parent){TextView row=old instanceof TextView?(TextView)old:new TextView(HomeActivity.this);row.setText(entries.get(p).title);row.setTextSize(20);row.setTextColor(Color.WHITE);row.setPadding(dp(16),dp(18),dp(16),dp(18));return row;}});
  list.setSelector(surface(true));list.setOnItemClickListener(new AdapterView.OnItemClickListener(){public void onItemClick(AdapterView<?> parent,View v,int p,long id){startActivity(new Intent(HomeActivity.this,PlayerActivity.class).putExtra("url",entries.get(p).url).putExtra("name",entries.get(p).title).putExtra("accent",accent));}});
  setContentView(root);list.requestFocus();
 }
  private void backButton(){button(content,t("Back to Home","الرجوع للرئيسية"),new Runnable(){public void run(){home();}});}
  private String shortCause(Exception error){
   String m=error==null?"":String.valueOf(error.getMessage());
   if(m==null||m.length()==0)m=error==null?"Unknown error":error.getClass().getSimpleName();
   int cut=m.indexOf("host ");
   if(m.startsWith("[DNS]"))return arabic?"تعذر الوصول للمضيف. تحقق من الشبكة وDNS.":"DNS / network unreachable. Check the connection.";
   if(m.startsWith("[TIMEOUT]"))return arabic?"انتهت مهلة الاتصال (١٠ ثوانٍ).":"Connection timed out (10 s).";
   if(m.startsWith("[TLS]"))return arabic?"تشفير المزوّد غير متوافق مع هذا الجهاز.":"Provider TLS is incompatible with this device.";
   if(m.startsWith("[HTTP"))return (arabic?"استجابة المزوّد: ":"Provider response: ")+m.substring(0,Math.min(m.length(),64));
   if(m.startsWith("[REDIRECT"))return (arabic?"إعادة توجيه: ":"Redirect: ")+m.substring(0,Math.min(m.length(),96));
   if(m.startsWith("[SIZE]"))return arabic?"القائمة أكبر من الحد (٢ ميجابايت / ٥٠٠٠ عنصر).":"Playlist exceeds the 2 MB / 5000-item limit.";
   if(m.startsWith("[FORMAT]")||m.startsWith("[URL]"))return arabic?"رابط قائمة M3U غير صالح.":"Not a valid M3U playlist URL.";
   return m.substring(0,Math.min(m.length(),96));
  }
 private void message(String value){Toast.makeText(this,value,Toast.LENGTH_LONG).show();}
 public void onBackPressed(){if(!atHome){home();return;}long now=SystemClock.elapsedRealtime();if(backAt!=0&&now-backAt<2200){finish();return;}backAt=now;message(t("Press Back again to exit","اضغط رجوع مرة أخرى للخروج"));}
 protected void onDestroy(){alive=false;worker.shutdownNow();if(brandBitmap!=null){brandBitmap.recycle();brandBitmap=null;}super.onDestroy();}
}


