package local.tvmorph.tv;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Public launcher intents only; no installed-package sweep or broad permission. */
final class LaunchableApps {
 static final class Entry {
  final ResolveInfo info;
  final String category;
  Entry(ResolveInfo info,String category){this.info=info;this.category=category;}
 }
 static List<Entry> list(PackageManager manager,String self){
  List<Entry> result=new ArrayList<>();
  Set<String> seen=new HashSet<>();
  for(String category:new String[]{Intent.CATEGORY_LEANBACK_LAUNCHER,Intent.CATEGORY_LAUNCHER}){
   for(ResolveInfo info:manager.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(category),0)){
    if(info.activityInfo==null||info.activityInfo.applicationInfo==null||!info.activityInfo.enabled||!info.activityInfo.exported||!info.activityInfo.applicationInfo.enabled)continue;
    String id=info.activityInfo.packageName;
    if(id.equals(self)||!seen.add(id))continue;
    result.add(new Entry(info,category));
   }
  }
  return result;
 }
}
