package local.tvmorph.tv;
import android.app.*;
import android.content.*;
import android.content.pm.*;
import android.provider.Settings;
import java.util.*;

/** Opens existing, exported settings screens; never changes secure settings itself. */
final class SystemSettingsTools {
 private static String t(Activity a,String en,String ar,String fr,String zh,String ja){String l=UiSettings.language(a);return l.equals("ar")?ar:l.equals("fr")?fr:l.equals("zh")?zh:l.equals("ja")?ja:en;}
 static void show(Activity a){
  String[] labels={t(a,"Home / Launcher settings","إعدادات الواجهة الرئيسية","Écran d’accueil","主屏幕设置","ホーム設定"),t(a,"Accessibility settings","تسهيلات الاستخدام","Accessibilité","无障碍设置","ユーザー補助"),t(a,"Developer settings","إعدادات المطوّر","Options développeur","开发者设置","開発者設定"),t(a,"System settings","إعدادات النظام","Réglages système","系统设置","システム設定"),t(a,"Home diagnostics","تشخيص الواجهة الرئيسية","Diagnostic de l’accueil","主屏幕诊断","ホーム診断")};
  new AlertDialog.Builder(a).setTitle(t(a,"Android settings tools","أدوات إعدادات أندرويد","Outils de réglages Android","Android 设置工具","Android 設定ツール")).setItems(labels,(d,w)->{if(w==4)new AlertDialog.Builder(a).setTitle(t(a,"Home diagnostics","تشخيص الواجهة الرئيسية","Diagnostic de l’accueil","主屏幕诊断","ホーム診断")).setMessage(HomeOverrideService.diagnostics(a)).setPositiveButton("OK",null).show();else find(a,w);}).setNegativeButton(t(a,"Back","رجوع","Retour","返回","戻る"),null).show();
 }
 static void openSystem(Activity a){find(a,3);}
 private static void find(Activity a,int kind){
  String action=kind==0?Settings.ACTION_HOME_SETTINGS:kind==1?Settings.ACTION_ACCESSIBILITY_SETTINGS:kind==2?Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS:Settings.ACTION_SETTINGS;
  LinkedHashMap<String,Intent> choices=new LinkedHashMap<>();
  PackageManager pm=a.getPackageManager();
  for(ResolveInfo r:pm.queryIntentActivities(new Intent(action),0)){
   ActivityInfo i=r.activityInfo;if(i!=null&&i.exported&&i.enabled&&!i.name.contains("EmptyStub")&&!i.name.contains("FallbackHome")){ComponentName component=new ComponentName(i.packageName,i.name);choices.put(String.valueOf(i.loadLabel(pm))+"\n"+component.flattenToShortString(),new Intent(action).setComponent(component));}
  }
  for(PackageInfo pkg:pm.getInstalledPackages(PackageManager.GET_ACTIVITIES)){
   if(pkg.activities==null||pkg.applicationInfo==null||(pkg.applicationInfo.flags&ApplicationInfo.FLAG_SYSTEM)==0)continue;
   for(ActivityInfo i:pkg.activities){
    String name=i.name.toLowerCase(Locale.US),pack=i.packageName.toLowerCase(Locale.US);
    if(!i.exported||!i.enabled||!(pack.contains("setting")||pack.contains("system")))continue;
    if(name.matches(".*(factory|reset|recovery|format|wipe|engineering).*"))continue;
    boolean match=kind==0?(name.contains("home")||name.contains("defaultapp")):kind==1?name.contains("accessibility"):kind==2?(name.contains("development")||name.contains("developer")):(name.endsWith(".settings")||name.endsWith(".mainsettings")||name.endsWith(".settingsactivity")||name.endsWith(".mainactivity"));
    if(!match||i.permission!=null&&a.checkSelfPermission(i.permission)!=PackageManager.PERMISSION_GRANTED)continue;
    ComponentName component=new ComponentName(i.packageName,i.name);String label=String.valueOf(i.loadLabel(pm))+"\n"+component.flattenToShortString();
    choices.put(label,new Intent(Intent.ACTION_MAIN).setComponent(component));
   }
  }
  if(choices.isEmpty()){
   new AlertDialog.Builder(a).setTitle(t(a,"No accessible settings screen","صفحة الإعدادات غير متاحة","Aucun écran accessible","设置页面不可用","設定画面がありません")).setMessage(t(a,"No accessible system screen for this option. Developer/ADB access may be needed.","النظام لا يعرض صفحة متاحة لهذا الاختيار. قد نحتاج وصول المطوّر أو ADB.","Aucun écran système accessible. Un accès développeur/ADB peut être nécessaire.","没有可访问的系统页面，可能需要开发者或 ADB 访问。","対応する設定画面がありません。開発者または ADB 接続が必要な場合があります。")).setPositiveButton("OK",(d,w)->show(a)).show();return;
  }
  if(kind==3&&choices.size()==1){try{a.startActivity(choices.values().iterator().next());return;}catch(RuntimeException ignored){}}
  String[] names=choices.keySet().toArray(new String[0]);
  new AlertDialog.Builder(a).setTitle(t(a,"Choose an existing system screen","اختار صفحة نظام متاحة","Choisir un écran système","选择系统页面","システム画面を選択")).setItems(names,(d,w)->{try{a.startActivity(choices.get(names[w]));}catch(RuntimeException e){new AlertDialog.Builder(a).setMessage(t(a,"The firmware blocked this screen. Try another listed screen.","النظام منع فتح الصفحة. جرّب صفحة أخرى من القائمة.","Le système bloque cet écran. Essayez un autre écran.","系统阻止了此页面，请尝试其他页面。","システムがこの画面を拒否しました。別の画面を試してください。")).setPositiveButton("OK",(x,y)->find(a,kind)).show();}}).setNegativeButton(t(a,"Back","رجوع","Retour","返回","戻る"),(d,w)->show(a)).show();
 }
}
