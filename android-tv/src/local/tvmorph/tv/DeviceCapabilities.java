package local.tvmorph.tv;
import android.app.ActivityManager;import android.content.*;import android.os.Build;import android.provider.Settings;import org.json.JSONObject;
final class DeviceCapabilities {
 static JSONObject info(Context c)throws Exception{
  ActivityManager am=(ActivityManager)c.getSystemService(Context.ACTIVITY_SERVICE);ActivityManager.MemoryInfo memory=new ActivityManager.MemoryInfo();if(am!=null)am.getMemoryInfo(memory);
  return new JSONObject().put("sdk",Build.VERSION.SDK_INT).put("ramMB",memory.totalMem/1048576).put("lowMemory",am!=null&&(Build.VERSION.SDK_INT<=28||am.isLowRamDevice()||memory.totalMem>0&&memory.totalMem<=3072L*1048576)).put("homeSelected",HomeOverrideService.home(c)!=null&&HomeOverrideService.home(c).getPackageName().equals(c.getPackageName())).put("overlayGranted",Settings.canDrawOverlays(c)).put("bootEnabled",UiSettings.prefs(c).getBoolean("launchAtBoot",false)).put("bootVerified",false).put("liteMode",true);
 }
}
