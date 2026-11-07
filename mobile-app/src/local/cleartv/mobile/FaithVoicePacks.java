package local.cleartv.mobile;
import android.app.Activity;import android.content.*;import org.json.*;import java.io.*;import java.util.*;import java.util.zip.*;import java.security.MessageDigest;

/** Optional offline voice archive. Egypt is the only mandatory bundled voice. */
final class FaithVoicePacks {
 static final int PICKER=7315;
 static File directory(Context c){return new File(c.getFilesDir(),"faith-voices-v1");}
 static boolean available(Context c,String id){return Arrays.asList(FaithPrayer.VOICES).contains(id)&&("egypt".equals(id)||new File(directory(c),id+".mp3").isFile());}
 static boolean installed(Context c){for(String id:FaithPrayer.VOICES)if(!"egypt".equals(id)&&!available(c,id))return false;return true;}
 static void choose(Activity owner){owner.runOnUiThread(()->{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*").putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"application/zip","application/x-zip-compressed","application/octet-stream"});owner.startActivityForResult(i,PICKER);});}
 static JSONObject manifest(Context c)throws Exception{return new JSONObject(new String(Network.read(c.getAssets().open("faith-voice-pack.json"),64*1024),"UTF-8"));}
 static void download(Context c)throws Exception{
  java.net.HttpURLConnection connection=(java.net.HttpURLConnection)new java.net.URL("https://morph-tv.com/packs/adhan/voices-v1.zip").openConnection();connection.setConnectTimeout(10000);connection.setReadTimeout(20000);connection.setInstanceFollowRedirects(false);
  try{if(connection.getResponseCode()!=200||connection.getContentLengthLong()>12*1024*1024)throw new IOException("voice_pack_unavailable");try(InputStream source=connection.getInputStream()){install(c,new FilterInputStream(source){long count;@Override public int read()throws IOException{int value=super.read();if(value>=0&&++count>12*1024*1024)throw new IOException("voice_pack_too_large");return value;}@Override public int read(byte[] b,int off,int len)throws IOException{int n=super.read(b,off,len);if(n>0&&(count+=n)>12*1024*1024)throw new IOException("voice_pack_too_large");return n;}});}}finally{connection.disconnect();}
 }
 static String sha(byte[] bytes)throws Exception{StringBuilder out=new StringBuilder();for(byte value:MessageDigest.getInstance("SHA-256").digest(bytes))out.append(String.format(Locale.ROOT,"%02x",value&255));return out.toString();}
 static synchronized void install(Context c,InputStream input)throws Exception{
  JSONObject expected=manifest(c);JSONArray rows=expected.getJSONArray("voices");Map<String,JSONObject> approved=new HashMap<>();for(int i=0;i<rows.length();i++)approved.put(rows.getJSONObject(i).getString("file"),rows.getJSONObject(i));
  Map<String,byte[]> files=new HashMap<>();int total=0;JSONObject supplied=null;
  try(ZipInputStream zip=new ZipInputStream(input)){ZipEntry entry;Set<String> seen=new HashSet<>();while((entry=zip.getNextEntry())!=null){String name=entry.getName();if(entry.isDirectory()||name.contains("/")||name.contains("\\")||name.contains("..")||!seen.add(name)||seen.size()>7||(!name.equals("manifest.json")&&!approved.containsKey(name)))throw new IOException("invalid_voice_pack");int max=name.equals("manifest.json")?64*1024:5*1024*1024;ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;while((n=zip.read(b))!=-1){total+=n;if(out.size()+n>max||total>20*1024*1024)throw new IOException("voice_pack_too_large");out.write(b,0,n);}byte[] data=out.toByteArray();if(name.equals("manifest.json"))supplied=new JSONObject(new String(data,"UTF-8"));else{JSONObject row=approved.get(name);if(data.length!=row.getInt("bytes")||!sha(data).equals(row.getString("sha256")))throw new IOException("unverified_voice");files.put(name,data);}}}
  if(supplied==null||!"morph-faith-voices".equals(supplied.optString("product"))||supplied.optInt("version")!=1||files.size()!=approved.size())throw new IOException("incomplete_voice_pack");
  File target=directory(c),stage=new File(c.getFilesDir(),"faith-voices-import-"+UUID.randomUUID());if(!stage.mkdir())throw new IOException("voice_storage_unavailable");
  try{for(Map.Entry<String,byte[]> file:files.entrySet())try(FileOutputStream out=new FileOutputStream(new File(stage,file.getKey()))){out.write(file.getValue());out.getFD().sync();}
   File previous=new File(c.getFilesDir(),"faith-voices-previous");deleteKnown(previous);if(target.exists()&&!target.renameTo(previous))throw new IOException("voice_pack_busy");if(!stage.renameTo(target)){if(previous.exists())previous.renameTo(target);throw new IOException("voice_pack_not_saved");}deleteKnown(previous);
  }finally{deleteKnown(stage);}
 }
 private static void deleteKnown(File folder){if(!folder.isDirectory())return;for(String id:FaithPrayer.VOICES)if(!id.equals("egypt"))new File(folder,id+".mp3").delete();folder.delete();}
 static synchronized void remove(Context c){c.stopService(new Intent(c,FaithAdhanService.class));deleteKnown(directory(c));}
}
