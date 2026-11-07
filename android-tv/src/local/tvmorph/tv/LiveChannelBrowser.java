package local.tvmorph.tv;

import android.widget.FrameLayout;
import android.graphics.Color;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Lightweight two-column category drawer. Playback and provider APIs stay shared. */
final class LiveChannelBrowser {
  private final PlayerActivity owner;
  private final ExecutorService worker=Executors.newSingleThreadExecutor(),artwork=Executors.newFixedThreadPool(2);
  private LinearLayout panel;private FrameLayout host;
  private LinearLayout categories,channels;
  private ScrollView categoryScroll,channelScroll;
  private TextView status,title;private Button categoryBack;

  private String category="",kind="live",series="",season="";
  private int generation;
  private boolean dead,navigating;private View origin,categoryOrigin;

  LiveChannelBrowser(PlayerActivity value){owner=value;}
  private String t(String ar,String en){return UiSettings.language(owner).equals("ar")?ar:en;}
  private int dp(int n){return (int)(n*owner.getResources().getDisplayMetrics().density+.5f);}
  private Button button(String text,Runnable action){Button b=new PlayerSettingRow(owner,text,false,false);b.setText(text);b.setTextColor(PlayerPalette.text(owner));b.setTextSize(13*Math.min(1.1f,UiSettings.fontScale(owner)));b.setAllCaps(false);b.setSingleLine(true);b.setIncludeFontPadding(true);b.setEllipsize(android.text.TextUtils.TruncateAt.END);b.setGravity(Gravity.CENTER_VERTICAL);b.setPadding(dp(12),dp(3),dp(26),dp(3));b.setBackgroundColor(Color.TRANSPARENT);b.setOnFocusChangeListener((v,focus)->{v.invalidate();v.setScaleX(focus?1.015f:1f);v.setScaleY(focus?1.015f:1f);});b.setOnClickListener(v->action.run());return b;}
  private android.graphics.drawable.GradientDrawable background(boolean focused){int surface=UiSettings.color(owner,"uiSurface",0xff09111f)&0x00ffffff;android.graphics.drawable.GradientDrawable d=new android.graphics.drawable.GradientDrawable();d.setColor(PlayerPalette.alpha(PlayerPalette.surface(owner),owner.phonePalette()?200:190));d.setCornerRadius(dp(20));d.setStroke(dp(focused?2:1),focused?PlayerPalette.accent(owner):PlayerPalette.alpha(PlayerPalette.accent(owner),65));return d;}
  private void add(LinearLayout parent,View child){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(43));p.setMargins(dp(3),dp(3),dp(3),dp(3));parent.addView(child,p);}

  private boolean motion(){try{return UiSettings.get(owner).optJSONObject("visualEffects").optBoolean("motion",true);}catch(Exception ignored){return true;}}
  void open(){
    kind=owner.getIntent().getStringExtra("itemKind");if(!"vod".equals(kind)&&!"episode".equals(kind))kind="live";
    series=owner.getIntent().getStringExtra("itemCategory");if(series==null)series="";
    season=owner.getIntent().getStringExtra("itemSeason");if(season==null)season="";
    if(dead)return;if(showing()){dismiss();return;}
    origin=owner.getCurrentFocus();host=(FrameLayout)owner.findViewById(android.R.id.content);
    panel=new LinearLayout(owner);panel.setOrientation(LinearLayout.VERTICAL);panel.setPadding(dp(14),dp(14),dp(14),dp(14));panel.setBackground(background(false));
    LinearLayout header=new LinearLayout(owner);header.setGravity(Gravity.CENTER_VERTICAL);
    title=new TextView(owner);title.setTextColor(PlayerPalette.text(owner));title.setTextSize(16);header.addView(title,new LinearLayout.LayoutParams(0,-2,1));
    categoryBack=button(t("‹ الأقسام","‹ Categories"),this::backToCategories);categoryBack.setContentDescription(t("الرجوع للأقسام","Back to categories"));header.addView(categoryBack,new LinearLayout.LayoutParams(dp(100),dp(36)));categoryBack.setVisibility(View.GONE);panel.addView(header);
    status=new TextView(owner);status.setTextColor(0xffc4dfeb);status.setTextSize(11);status.setPadding(dp(4),dp(4),dp(4),dp(8));panel.addView(status);
    categories=new LinearLayout(owner);categories.setOrientation(LinearLayout.VERTICAL);channels=new LinearLayout(owner);channels.setOrientation(LinearLayout.VERTICAL);
    categoryScroll=new ScrollView(owner);categoryScroll.addView(categories);channelScroll=new ScrollView(owner);channelScroll.addView(channels);
    LinearLayout columns=new LinearLayout(owner);columns.setOrientation(LinearLayout.VERTICAL);columns.addView(categoryScroll,new LinearLayout.LayoutParams(-1,0,1));columns.addView(channelScroll,new LinearLayout.LayoutParams(-1,0,1));panel.addView(columns,new LinearLayout.LayoutParams(-1,0,1));
    int width=owner.getResources().getDisplayMetrics().widthPixels,height=owner.getResources().getDisplayMetrics().heightPixels;FrameLayout.LayoutParams placement=new FrameLayout.LayoutParams((int)(width*(width<height?.92f:.25f)),-1,Gravity.LEFT|Gravity.TOP);placement.setMargins(PlayerCinemaChrome.size(owner,38),PlayerCinemaChrome.headerBottom(owner),0,dp(104));host.addView(panel,placement);owner.setBrowserPanelVisible(true);
    showCategories();loadCategories();if(motion()){panel.setTranslationX(-dp(16));panel.setAlpha(0f);panel.animate().translationX(0f).alpha(1f).setDuration(150).start();}
  }
  private void showCategories(){if(panel==null)return;navigating=true;try{categoryScroll.setVisibility(View.VISIBLE);channelScroll.setVisibility(View.GONE);title.setText(t("الأقسام","Categories"));status.setText(t("اختر قسمًا لعرض محتواه. التشغيل الحالي مستمر.","Choose a category to browse. Current playback continues."));if(categoryOrigin!=null&&categoryOrigin.getParent()==categories)categoryOrigin.requestFocus();else if(categories.getChildCount()>0)categories.getChildAt(0).requestFocus();if(categoryBack!=null)categoryBack.setVisibility(View.GONE);}finally{navigating=false;}}
  private void showContent(){if(panel==null)return;navigating=true;try{if(categoryBack!=null){categoryBack.setVisibility(View.VISIBLE);categoryBack.requestFocus();}categoryScroll.setVisibility(View.GONE);channelScroll.setVisibility(View.VISIBLE);title.setText(t("المحتوى","Content"));}finally{navigating=false;}}
  private void loadCategories(){
    status.setText(t("جاري تحميل الأقسام…","Loading categories…"));category=owner.getIntent().getStringExtra("itemCategory");if(category==null)category="";final String type="episode".equals(kind)?"series":kind;final int run=++generation;
    worker.execute(()->{try{JSONArray rows="episode".equals(kind)?new JSONArray():IptvParentalStore.filter(owner,IptvStore.get(owner).categories(type).getJSONArray("items"),type,true);owner.runOnUiThread(()->{if(!valid(run))return;categories.removeAllViews();if("episode".equals(kind)&&!series.isEmpty())add(categories,button(t("حلقات المسلسل الحالي","Current series episodes"),()->load(series,0)));add(categories,button(t("كل المحتوى","All content"),()->load("",0)));for(int i=0;i<rows.length();i++){JSONObject row=rows.optJSONObject(i);if(row==null)continue;String id=row.optString("category_id",row.optString("id")),name=row.optString("category_name",row.optString("name"));Button entry=button(name,()->load(id,0));add(categories,entry);if(id.equals(category))categoryOrigin=entry;}load("episode".equals(kind)?series:category,0);});}catch(Exception e){error(run);}});
  }
  private boolean valid(int run){return !dead&&showing()&&run==generation&&!owner.isFinishing();}
  private void error(int run){owner.runOnUiThread(()->{if(valid(run)){status.setText(t("تعذر تحميل القائمة. أعد اختيار القسم للمحاولة.","Could not load this list. Choose the category again to retry."));if(categories.getChildCount()==0)add(categories,button(t("إعادة المحاولة","Retry"),this::loadCategories));}});}
  private void load(String selected,int page){
    if(categoryScroll.hasFocus())categoryOrigin=owner.getCurrentFocus();category=selected;final String requestSeason=season,requestKind=kind;final int run=++generation;showContent();status.setText(t("جاري تحميل المحتوى…","Loading content…"));channels.removeAllViews();
    worker.execute(()->{try{JSONObject result=IptvStore.get(owner).list(new JSONObject().put("kind",requestKind).put("category",selected).put("season",requestSeason).put("page",page).put("pageSize",30));owner.runOnUiThread(()->{if(!valid(run))return;JSONArray rows=IptvParentalStore.filter(owner,result.optJSONArray("items"),requestKind,false);if(rows!=null)for(int i=0;i<rows.length();i++){JSONObject item=rows.optJSONObject(i);if(item!=null)add(channels,iconRow(item));}if(page==0&&selected.equals(owner.getIntent().getStringExtra("itemCategory"))){String playing=owner.getIntent().getStringExtra("itemId");boolean present=false;for(int i=0;i<channels.getChildCount();i++)if(playing!=null&&playing.equals(channels.getChildAt(i).getTag()))present=true;if(!present&&playing!=null&&!playing.isEmpty()){try{JSONObject current=new JSONObject().put("id",playing).put("name",owner.getIntent().getStringExtra("name")).put("kind",kind).put("category",selected).put("icon",owner.getIntent().getStringExtra("poster"));View pinned=iconRow(current);add(channels,pinned);channels.removeView(pinned);channels.addView(pinned,0);}catch(org.json.JSONException ignored){}}}if(page>0)add(channels,button(t("السابق","Previous"),()->load(selected,page-1)));if(result.optBoolean("hasMore"))add(channels,button(t("التالي","Next"),()->load(selected,page+1)));if(channels.getChildCount()==0)add(channels,button(t("لا يوجد محتوى في هذا القسم","No content in this category"),this::showCategories));status.setText(t("اختر عنوانًا للتشغيل.","Choose a title to play."));View current=null;String playing=owner.getIntent().getStringExtra("itemId");for(int i=0;i<channels.getChildCount();i++){View row=channels.getChildAt(i);if(playing!=null&&playing.equals(row.getTag())){current=row;break;}}if(current!=null){if(current instanceof android.view.ViewGroup)((android.view.ViewGroup)current).getChildAt(((android.view.ViewGroup)current).getChildCount()-1).requestFocus();else current.requestFocus();}else if(channels.getChildCount()>0){channels.getChildAt(0).requestFocus();}});}catch(Exception e){error(run);}});
  }
 
 private View iconRow(JSONObject item){LinearLayout row=new LinearLayout(owner);row.setTag(item.optString("id"));row.setOrientation(LinearLayout.HORIZONTAL);row.setGravity(Gravity.CENTER_VERTICAL);ImageView icon=new ImageView(owner);icon.setScaleType(ImageView.ScaleType.FIT_CENTER);icon.setPadding(dp(6),dp(4),dp(6),dp(4));LinearLayout.LayoutParams ip=new LinearLayout.LayoutParams(dp(38),dp(36));row.addView(icon,ip);Button b=button(item.optString("name"),()->choose(item));b.setGravity(Gravity.START|Gravity.CENTER_VERTICAL);row.addView(b,new LinearLayout.LayoutParams(0,-1,1));if(item.optString("id").equals(owner.getIntent().getStringExtra("itemId"))){b.setActivated(true);row.setTag(item.optString("id"));}String url=item.optString("icon",item.optString("stream_icon",item.optString("seriesPoster","")));loadIcon(icon,url);return row;}
 private void loadIcon(ImageView v,String url){if(url==null||url.isEmpty()){v.setVisibility(View.GONE);return;}final int run=generation;artwork.execute(()->{if(!valid(run))return;try{java.net.HttpURLConnection c=(java.net.HttpURLConnection)new java.net.URL(url).openConnection();c.setConnectTimeout(5000);c.setReadTimeout(5000);java.io.InputStream in=c.getInputStream();java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream();byte[] buf=new byte[8192];int n,total=0;while((n=in.read(buf))!=-1){total+=n;if(total>400000)break;out.write(buf,0,n);}in.close();c.disconnect();byte[] data=out.toByteArray();android.graphics.BitmapFactory.Options options=new android.graphics.BitmapFactory.Options();options.inJustDecodeBounds=true;android.graphics.BitmapFactory.decodeByteArray(data,0,data.length,options);options.inSampleSize=1;while(Math.max(options.outWidth,options.outHeight)/options.inSampleSize>192)options.inSampleSize*=2;options.inJustDecodeBounds=false;android.graphics.Bitmap bm=android.graphics.BitmapFactory.decodeByteArray(data,0,data.length,options);if(bm==null)return;owner.runOnUiThread(()->{if(valid(run))v.setImageBitmap(bm);});}catch(Exception ignored){}});}
 private void choose(JSONObject item){if(!"series".equals(item.optString("kind"))&&IptvActivity.protectedSelection(owner,item)){dismiss();return;}if("series".equals(item.optString("kind"))){kind="episode";season="";series=item.optString("id");load(series,0);return;}final int run=++generation;status.setText(t("جاري فتح المحتوى…","Opening content…"));worker.execute(()->{try{IptvActivity.play(owner,item);owner.runOnUiThread(()->{if(valid(run))dismiss();});}catch(Exception e){error(run);}});}
  void alignAboveDock(int bottom){if(panel==null)return;FrameLayout.LayoutParams p=(FrameLayout.LayoutParams)panel.getLayoutParams();if(p.bottomMargin!=bottom){p.bottomMargin=bottom;panel.setLayoutParams(p);}}
  void close(){dead=true;generation++;dismiss();worker.shutdownNow();artwork.shutdownNow();}
 boolean movingInternally(){return navigating;}
 boolean contains(View view){if(panel==null||view==null)return false;View node=view;while(node!=null){if(node==panel)return true;node=node.getParent() instanceof View?(View)node.getParent():null;}return false;}
 boolean inContent(){return showing()&&channelScroll!=null&&channelScroll.hasFocus();}
 boolean focusContent(){if(!showing())return false;return categoryScroll.hasFocus();}
 View returnFocus(){return origin;}
 void backToCategories(){generation++;showCategories();}
 boolean showing(){return panel!=null&&panel.getParent()!=null;}
 void dismiss(){generation++;if(artwork instanceof java.util.concurrent.ThreadPoolExecutor)((java.util.concurrent.ThreadPoolExecutor)artwork).getQueue().clear();if(panel!=null&&host!=null)host.removeView(panel);panel=null;owner.setBrowserPanelVisible(false);}
}


