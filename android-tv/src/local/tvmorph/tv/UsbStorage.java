package local.tvmorph.tv;
import android.app.*;import android.content.*;import android.os.*;import android.os.storage.*;import android.net.Uri;import android.provider.DocumentsContract;import org.json.*;
/** Removable, mounted volumes only. Discovery never requests broad file access. */
final class UsbStorage {
 static JSONArray list(Context c){JSONArray out=new JSONArray();try{StorageManager manager=(StorageManager)c.getSystemService(Context.STORAGE_SERVICE);if(manager!=null)for(StorageVolume v:manager.getStorageVolumes())if(v.isRemovable()&&(Environment.MEDIA_MOUNTED.equals(v.getState())||Environment.MEDIA_MOUNTED_READ_ONLY.equals(v.getState()))){String id=v.getUuid();if(id==null||id.isEmpty())continue;out.put(new JSONObject().put("id","usb:"+id).put("type","USB").put("number",0).put("title",v.getDescription(c)).put("connected",true));}}catch(Exception ignored){}return out;}
 static void open(Activity a,String id){try{JSONArray rows=list(a);boolean found=false;for(int i=0;i<rows.length();i++)if(rows.getJSONObject(i).optString("id").equals(id))found=true;if(!found){android.widget.Toast.makeText(a,UiSettings.text(a,"الفلاشة اتفصلت أو النظام لم يركبها بعد.","USB drive is disconnected or not mounted yet."),1).show();return;}a.startActivity(new Intent(a,UsbFilesActivity.class).putExtra("volume",id.substring(4)));}catch(Exception e){android.widget.Toast.makeText(a,UiSettings.text(a,"تعذّر فتح ملفات الفلاشة.","USB files could not open."),1).show();}}
 private UsbStorage(){}
}
