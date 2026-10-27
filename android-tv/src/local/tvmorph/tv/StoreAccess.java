package local.tvmorph.tv;
import android.content.*;import android.os.Build;import android.net.Uri;
final class StoreAccess {
 static final String[] AMAZON={"com.amazon.venezia","com.amazon.tv.appstore"};
 static boolean installed(Context c,String id){try{return c.getPackageManager().getApplicationInfo(id,0).enabled;}catch(Exception e){return false;}}
 static String kind(Context c){if("Amazon".equalsIgnoreCase(Build.MANUFACTURER)||c.getPackageManager().hasSystemFeature("amazon.hardware.fire_tv"))return "amazon";if(installed(c,"com.android.vending"))return "google";for(String id:AMAZON)if(installed(c,id))return "amazon";return "none";}
 static String packageId(Context c){if(kind(c).equals("google"))return "com.android.vending";for(String id:AMAZON)if(installed(c,id))return id;return kind(c).equals("amazon")?AMAZON[0]:"local.tvmorph.tv.store";}
 static boolean start(Context c,Intent intent){if(intent==null)return false;try{if(c instanceof android.app.Activity)ExternalLaunch.open((android.app.Activity)c,intent);else c.startActivity(intent);return true;}catch(RuntimeException e){return false;}}
 static boolean open(Context c,String query){String kind=kind(c);if(kind.equals("none"))return false;String[] packages=kind.equals("amazon")?AMAZON:new String[]{"com.android.vending"};String term=query==null?"":query.trim();
  for(String id:packages){if(!installed(c,id))continue;if(!term.isEmpty()){Uri uri=Uri.parse(kind.equals("amazon")?"amzn://apps/android":"market://search").buildUpon().appendQueryParameter(kind.equals("amazon")?"s":"q",term).build();if(start(c,new Intent(Intent.ACTION_VIEW,uri).setPackage(id)))return true;}
   if(start(c,c.getPackageManager().getLeanbackLaunchIntentForPackage(id)))return true;if(start(c,c.getPackageManager().getLaunchIntentForPackage(id)))return true;
   if(term.isEmpty()&&kind.equals("amazon")&&start(c,new Intent(Intent.ACTION_VIEW,Uri.parse("amzn://apps/android")).setPackage(id)))return true;
  }return false;
 }
}
