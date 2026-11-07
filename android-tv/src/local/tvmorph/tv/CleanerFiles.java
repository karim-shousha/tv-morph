package local.tvmorph.tv;
import android.content.*;import android.database.Cursor;import android.net.Uri;import android.os.Build;import android.provider.DocumentsContract;import java.io.*;import java.util.*;import org.json.*;
/** Accessible app/shared folders or a user-granted document tree. IDs stay scoped to the exact scanned roots. */
public final class CleanerFiles {
 private final Context context;private final Map<String,Entry> entries=new HashMap<String,Entry>();private long bytes;private int count;private JSONArray errors;private boolean truncated;private long deadline;private int visited;
 private static final class Entry {File file;Uri uri;long size,modified;String name,root;}
 public CleanerFiles(Context c){context=c;}
 private static String kind(String n){int i=n.lastIndexOf('.');return i>0?n.substring(i+1).toUpperCase(java.util.Locale.US):"File";}
 private void add(Entry e,String path,JSONArray files)throws Exception{String id=UUID.randomUUID().toString();entries.put(id,e);files.put(new JSONObject().put("id",id).put("name",e.name).put("path",path).put("size",e.size).put("modified",e.modified).put("hidden",e.name.startsWith(".")).put("kind",kind(e.name)));bytes+=e.size;count++;}
 private void walk(File root,File folder,int depth,boolean installers,JSONArray out)throws Exception{
  if(depth>8||count>=2000||visited++>=10000||System.currentTimeMillis()>deadline){truncated=true;return;}File[] children=folder.listFiles();if(children==null){errors.put("Cannot read: "+folder.getAbsolutePath());return;}
  for(File f:children){if(count>=2000||visited>=10000||System.currentTimeMillis()>deadline){truncated=true;break;}String actual=f.getCanonicalPath(),base=root.getCanonicalPath();if(!actual.equals(f.getAbsolutePath())||!actual.startsWith(base+File.separator))continue;if(f.isDirectory()){walk(root,f,depth+1,installers,out);continue;}if(!f.isFile()||installers&&!f.getName().toLowerCase(java.util.Locale.US).matches(".*\\.(apk|wgt|ipk|tpk|rpm|msi|exe|dmg)$"))continue;Entry e=new Entry();e.file=f;e.root=base;e.name=f.getName();e.size=f.length();e.modified=f.lastModified();add(e,actual,out);}
 }
 private static Object method(String n,Class<?>[] types,Object... args)throws Exception{return DocumentsContract.class.getMethod(n,types).invoke(null,args);}
 private void tree(Uri root,String document,String display,int depth,boolean installers,Set<String> seen,JSONArray out)throws Exception{
  if(depth>8||count>=2000||visited++>=10000||System.currentTimeMillis()>deadline){truncated=true;return;}if(!seen.add(document))return;
  Uri children=(Uri)method("buildChildDocumentsUriUsingTree",new Class<?>[]{Uri.class,String.class},root,document);
  Cursor c=context.getContentResolver().query(children,new String[]{"document_id","_display_name","mime_type","_size","last_modified"},null,null,null);if(c==null)throw new IOException("Folder provider did not return files.");
  try{while(c.moveToNext()){if(count>=2000||visited>=10000||System.currentTimeMillis()>deadline){truncated=true;break;}String id=c.getString(0),name=c.getString(1),mime=c.getString(2);if("vnd.android.document/directory".equals(mime)){tree(root,id,display+"/"+name,depth+1,installers,seen,out);continue;}if(installers&&!name.toLowerCase(java.util.Locale.US).matches(".*\\.(apk|wgt|ipk|tpk|rpm|msi|exe|dmg)$"))continue;Entry e=new Entry();e.uri=(Uri)method("buildDocumentUriUsingTree",new Class<?>[]{Uri.class,String.class},root,id);e.name=name;e.size=c.isNull(3)?0:c.getLong(3);e.modified=c.isNull(4)?0:c.getLong(4);add(e,display+"/"+name,out);}}finally{c.close();}
 }
 public synchronized JSONObject scan(String scope,Uri grant)throws Exception{
  entries.clear();bytes=0;count=0;visited=0;deadline=System.currentTimeMillis()+15000;errors=new JSONArray();truncated=false;JSONArray out=new JSONArray();
  if("cache".equals(scope)){File cache=context.getCacheDir().getCanonicalFile();walk(cache,cache,0,false,out);File external=context.getExternalCacheDir();if(external!=null)external=external.getCanonicalFile();if(external!=null&&external.isDirectory())walk(external,external,0,false,out);}
  else if(Build.VERSION.SDK_INT>=21&&grant!=null){try{String id=(String)method("getTreeDocumentId",new Class<?>[]{Uri.class},grant);tree(grant,id,"Selected folder",0,"installers".equals(scope),new HashSet<String>(),out);}catch(Exception e){errors.put("Selected folder: "+e.getMessage());}}
  else {
   java.util.LinkedHashSet<String> seenRoots=new java.util.LinkedHashSet<String>();
   java.util.ArrayList<File> accessible=new java.util.ArrayList<File>();
   if("installers".equals(scope))accessible.add(context.getFilesDir());
   File externalFiles=context.getExternalFilesDir(null);if(externalFiles!=null)accessible.add(externalFiles);
   File downloads=android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);if(downloads!=null&&downloads.isDirectory()&&downloads.canRead())accessible.add(downloads);
   for(File folder:accessible){File actual=folder.getCanonicalFile();if(actual.isDirectory()&&actual.canRead()&&seenRoots.add(actual.getAbsolutePath()))walk(actual,actual,0,"installers".equals(scope),out);}
  }
  return new JSONObject().put("files",out).put("bytes",bytes).put("errors",errors).put("truncated",truncated);
 }
 public synchronized JSONObject remove(String raw)throws Exception{
  JSONArray ids=new JSONArray(raw),gone=new JSONArray(),failed=new JSONArray();long freed=0;if(ids.length()>2000)throw new IOException("Selection is too large.");
  for(int i=0;i<ids.length();i++){String id=ids.getString(i);Entry e=entries.get(id);if(e==null){failed.put("Selection expired. Scan again.");continue;}try{boolean deleted=false;if(e.file!=null){File f=e.file;String p=f.getCanonicalPath();if(e.root==null||!p.startsWith(e.root+File.separator)||!p.equals(f.getAbsolutePath())||!f.isFile()||f.length()!=e.size||f.lastModified()!=e.modified)throw new IOException("File changed or is outside the scanned folder.");deleted=f.delete();}else{Cursor c=context.getContentResolver().query(e.uri,new String[]{"_size","last_modified","mime_type"},null,null,null);try{if(c==null||!c.moveToFirst()||(!c.isNull(0)&&c.getLong(0)!=e.size)||(!c.isNull(1)&&c.getLong(1)!=e.modified)||"vnd.android.document/directory".equals(c.getString(2)))throw new IOException("File changed. Scan again.");}finally{if(c!=null)c.close();}deleted=DocumentsContract.deleteDocument(context.getContentResolver(),e.uri);}if(!deleted)throw new IOException("The system refused deletion.");gone.put(id);freed+=e.size;entries.remove(id);}catch(Exception x){failed.put(e.name+": "+x.getMessage());}}
  return new JSONObject().put("ids",gone).put("bytes",freed).put("errors",failed);
 }
}
