package local.morph.datacheck;
import android.app.*;import android.os.*;import android.content.*;import java.io.*;import java.util.*;import java.security.*;
public final class DataPreservationInstrumentation extends Instrumentation {
 String mode;public void onCreate(Bundle b){super.onCreate(b);mode=b.getString("mode","before");start();}
 public void onStart(){Bundle out=new Bundle();try{
 Context c=getTargetContext();File dir=new File(c.getApplicationInfo().dataDir,"shared_prefs");TreeMap<String,String> selected=new TreeMap<>();
 File[] files=dir.listFiles();if(files!=null)for(File f:files){if(!f.getName().endsWith(".xml"))continue;String file=f.getName().substring(0,f.getName().length()-4);Map<String,?> all=c.getSharedPreferences(file,0).getAll();for(String key:all.keySet())if(key.toLowerCase(java.util.Locale.ROOT).matches(".*(account|profile|favorit|tvip|tvbrand|token|identity|paired|devices|credential|subscription).*")){Object value=all.get(key);String stable=value instanceof Set?new TreeSet((Set)value).toString():String.valueOf(value);byte[] hash=MessageDigest.getInstance("SHA-256").digest(stable.getBytes("UTF-8"));StringBuilder hex=new StringBuilder();for(byte b:hash)hex.append(String.format("%02x",b&255));selected.put(file+":"+key,hex.toString());}}
 if(selected.isEmpty()){out.putString("result","SKIP: emulator has no persisted account/device preferences to compare.");finish(Activity.RESULT_OK,out);return;}
 File receipt=new File(c.getExternalFilesDir(null),"navy283-data-receipt.txt");String data=selected.toString();
 if(mode.equals("before")){try(FileOutputStream f=new FileOutputStream(receipt)){f.write(data.getBytes("UTF-8"));}out.putString("result","Recorded "+selected.size()+" account/device preference digests, no values exposed.");}
 else {byte[] b=new byte[(int)receipt.length()];try(FileInputStream f=new FileInputStream(receipt)){if(f.read(b)!=b.length)throw new AssertionError("Receipt incomplete");}if(!data.equals(new String(b,"UTF-8")))throw new AssertionError("Persisted account/device values changed across upgrade");out.putString("result","PASS: all "+selected.size()+" account/device preference digests unchanged after in-place update.");receipt.delete();}
 finish(Activity.RESULT_OK,out);
 }catch(Throwable e){out.putString("error",android.util.Log.getStackTraceString(e));finish(Activity.RESULT_CANCELED,out);}}
}
