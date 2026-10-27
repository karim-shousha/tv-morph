package local.tvmorph.tv;

import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.StatFs;
import android.provider.Settings;
import java.util.*;

/** User-confirmed system screens; never disables system packages or clears app data. */
final class AppMaintenance {
 private static String t(TvActivity a,String ar,String en){return UiSettings.text(a,ar,en);}
 static boolean removable(TvActivity a,ApplicationInfo info){return !info.packageName.equals(a.getPackageName())&&(info.flags&(ApplicationInfo.FLAG_SYSTEM|ApplicationInfo.FLAG_UPDATED_SYSTEM_APP))==0;}
 static void show(TvActivity a){
  PackageManager pm=a.getPackageManager();Map<String,ApplicationInfo> found=new HashMap<>();
  for(String category:new String[]{Intent.CATEGORY_LEANBACK_LAUNCHER,Intent.CATEGORY_LAUNCHER})for(ResolveInfo r:pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(category),0)){ApplicationInfo info=r.activityInfo.applicationInfo;if(!info.packageName.equals(a.getPackageName()))found.put(info.packageName,info);}
  List<ApplicationInfo> apps=new ArrayList<>(found.values());Collections.sort(apps,(x,y)->String.valueOf(x.loadLabel(pm)).compareToIgnoreCase(String.valueOf(y.loadLabel(pm))));
  StatFs disk=new StatFs(a.getFilesDir().getAbsolutePath());String storage=android.text.format.Formatter.formatFileSize(a,disk.getAvailableBytes())+t(a," متاح من "," free of ")+android.text.format.Formatter.formatFileSize(a,disk.getTotalBytes());
  String[] names=new String[apps.size()];for(int i=0;i<apps.size();i++){ApplicationInfo info=apps.get(i);names[i]=String.valueOf(info.loadLabel(pm))+(removable(a,info)?"":t(a," · تطبيق نظام"," · System app"));}
  new AlertDialog.Builder(a).setTitle(t(a,"إدارة التطبيقات والمساحة","Apps & storage")+"\n"+storage).setItems(names,(d,i)->choose(a,apps.get(i))).setNeutralButton(t(a,"إعدادات مساحة التخزين","Storage settings"),(d,w)->open(a,new Intent(Settings.ACTION_INTERNAL_STORAGE_SETTINGS))).setNegativeButton(t(a,"إغلاق","Close"),null).show();
 }
 private static void choose(TvActivity a,ApplicationInfo info){String name=String.valueOf(info.loadLabel(a.getPackageManager()));boolean canRemove=removable(a,info);String[] options=canRemove?new String[]{t(a,"تفاصيل التطبيق ومسح الكاش يدويًا","App details & manual cache cleanup"),t(a,"طلب حذف التطبيق","Request uninstall")}:new String[]{t(a,"تفاصيل تطبيق النظام","System app details")};new AlertDialog.Builder(a).setTitle(name).setItems(options,(d,i)->{if(i==0)open(a,new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+info.packageName)));else new AlertDialog.Builder(a).setTitle(t(a,"حذف التطبيق؟","Uninstall app?")).setMessage(name+"\n"+t(a,"قد تُحذف بياناته المحلية. هتظهر شاشة تأكيد النظام بعد المتابعة.","Its local data may be removed. The system confirmation opens next.")).setPositiveButton(t(a,"متابعة","Continue"),(x,w)->{try{ApplicationInfo current=a.getPackageManager().getApplicationInfo(info.packageName,0);if(removable(a,current))open(a,new Intent(Intent.ACTION_DELETE,Uri.parse("package:"+current.packageName)));}catch(Exception e){unavailable(a);}}).setNegativeButton(t(a,"إلغاء","Cancel"),null).show();}).setNegativeButton(t(a,"رجوع","Back"),(d,w)->show(a)).show();}
 private static void open(TvActivity a,Intent intent){try{a.startActivity(intent);}catch(RuntimeException e){unavailable(a);}}
 private static void unavailable(TvActivity a){new AlertDialog.Builder(a).setMessage(t(a,"النظام لا يوفّر الشاشة دي. افتح إعدادات التلفزيون ← التطبيقات أو التخزين.","This system does not provide this screen. Open TV Settings → Apps or Storage.")).setPositiveButton("OK",null).show();}
}
