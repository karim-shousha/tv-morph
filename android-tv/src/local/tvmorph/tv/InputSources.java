package local.tvmorph.tv;
import android.app.Activity;import android.content.*;import android.content.pm.*;import org.json.*;import java.util.*;
/** Firmware source selectors discovered from real exported system activities, never guessed HDMI ports. */
final class InputSources {
 static final String PREFIX="system-inputs:";
 static final String VIEW_INPUTS="com.android.tv.action.VIEW_INPUTS";
 static Map<String,Intent> choices(Activity a){LinkedHashMap<String,Intent> out=new LinkedHashMap<>();PackageManager pm=a.getPackageManager();
  // Ask the firmware first. Hisense/VU can expose a generic MainActivity for
  // this action, so class-name guesses alone miss the real source panel.
  try{Intent sources=new Intent(VIEW_INPUTS).addCategory(Intent.CATEGORY_DEFAULT);for(ResolveInfo r:pm.queryIntentActivities(sources,0)){ActivityInfo i=r.activityInfo;if(i==null||!i.exported||!i.enabled||i.applicationInfo==null||(i.applicationInfo.flags&ApplicationInfo.FLAG_SYSTEM)==0||i.permission!=null&&!i.permission.isEmpty()&&a.checkSelfPermission(i.permission)!=PackageManager.PERMISSION_GRANTED)continue;ComponentName c=new ComponentName(i.packageName,i.name);out.put(PREFIX+c.flattenToString(),new Intent(sources).setComponent(c));}}catch(RuntimeException ignored){}
  try{for(PackageInfo p:pm.getInstalledPackages(PackageManager.GET_ACTIVITIES)){if(p.applicationInfo==null||(p.applicationInfo.flags&ApplicationInfo.FLAG_SYSTEM)==0||p.activities==null)continue;for(ActivityInfo i:p.activities){String n=i.name.toLowerCase(Locale.ROOT);if(!i.exported||!i.enabled||i.permission!=null&&a.checkSelfPermission(i.permission)!=PackageManager.PERMISSION_GRANTED)continue;if(!SourceSelectorPolicy.matches(i.name))continue;ComponentName c=new ComponentName(i.packageName,i.name);out.putIfAbsent(PREFIX+c.flattenToString(),new Intent(Intent.ACTION_MAIN).setComponent(c));}}}catch(RuntimeException ignored){}
  try{Intent live=new Intent(Intent.ACTION_MAIN).addCategory("android.intent.category.LIVE_TV");for(ResolveInfo r:pm.queryIntentActivities(live,0)){ActivityInfo i=r.activityInfo;if(i!=null&&i.exported&&i.enabled&&(i.permission==null||a.checkSelfPermission(i.permission)==PackageManager.PERMISSION_GRANTED)){ComponentName c=new ComponentName(i.packageName,i.name);out.putIfAbsent(PREFIX+c.flattenToString(),new Intent(live).setComponent(c));}}}catch(RuntimeException ignored){}

  return out;
 }
 static String preferred(Activity a){String best=null;int score=0;for(Map.Entry<String,Intent> entry:choices(a).entrySet()){ComponentName component=entry.getValue().getComponent();if(component==null)continue;int candidate=VIEW_INPUTS.equals(entry.getValue().getAction())?100:SourceSelectorPolicy.rank(component.getClassName());if(candidate>score){score=candidate;best=entry.getKey();}}return best;}
 static boolean openPicker(Activity a){String id=preferred(a);return id!=null&&open(a,id);}
 static JSONArray list(Activity a)throws Exception{JSONArray rows=new JSONArray();int count=0;for(Map.Entry<String,Intent> entry:choices(a).entrySet()){if(count++>=8)break;String label=UiSettings.text(a,"قائمة مصادر التلفزيون","TV source selector");if(entry.getKey().equals(PREFIX+"settings"))label=UiSettings.text(a,"مصادر التلفزيون من إعدادات الجهاز","TV sources in device settings");else try{label+=" · "+a.getPackageManager().getActivityInfo(entry.getValue().getComponent(),0).loadLabel(a.getPackageManager());}catch(Exception ignored){}rows.put(new JSONObject().put("id",entry.getKey()).put("type","SOURCE").put("number",0).put("title",label).put("systemPicker",true).put("connected",JSONObject.NULL));}return rows;}
 static boolean open(Activity a,String id){Intent intent=choices(a).get(id);if(intent==null)return false;InputAudioHandoff.prepare(a);try{ExternalLaunch.open(a,intent);return true;}catch(RuntimeException unavailable){return false;}}
}
