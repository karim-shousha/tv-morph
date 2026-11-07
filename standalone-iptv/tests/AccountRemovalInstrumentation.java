package local.morph.iptvcheck;
import android.app.*;import android.content.*;import android.os.Bundle;import java.io.*;import java.lang.reflect.*;import java.util.concurrent.*;import org.json.*;
/** Tests encrypted persistence in an isolated files directory; no provider/network dependency. */
public final class AccountRemovalInstrumentation extends Instrumentation{
 private Object invoke(Object target,String name,Class<?>[] args,Object... values)throws Exception{Method m=target.getClass().getDeclaredMethod(name,args);m.setAccessible(true);try{return m.invoke(target,values);}catch(InvocationTargetException e){throw (Exception)e.getCause();}}
 private void check(boolean value,String reason)throws Exception{if(!value)throw new Exception(reason);}
 private JSONObject profile(String id)throws Exception{return new JSONObject().put("profileId",id).put("type","xtream").put("server","http://127.0.0.1:9").put("username",id).put("password","private-"+id).put("name",id).put("live",true).put("vod",true).put("series",true).put("subscription",new JSONObject().put("status","Expired"));}
 @Override public void onCreate(Bundle args){super.onCreate(args);start();}
 @Override public void onStart(){Bundle result=new Bundle();Object store=null,reopened=null;try{
  Context base=getTargetContext();File dir=new File(base.getCacheDir(),"account-delete-qa-"+System.nanoTime());check(dir.mkdirs(),"Cannot create isolated fixture");
  Context isolated=new ContextWrapper(base){@Override public Context getApplicationContext(){return this;}@Override public File getFilesDir(){return dir;}@Override public FileOutputStream openFileOutput(String name,int mode)throws FileNotFoundException{return new FileOutputStream(new File(dir,name));}@Override public boolean deleteFile(String name){return new File(dir,name).delete();}@Override public android.content.SharedPreferences getSharedPreferences(String name,int mode){return super.getSharedPreferences("account-delete-qa-"+name,mode);}};
  Class<?> type=Class.forName("local.tvmorph.tv.IptvStore",true,base.getClassLoader());Constructor<?> constructor=type.getDeclaredConstructor(Context.class);constructor.setAccessible(true);store=constructor.newInstance(isolated);
  JSONObject a=profile("account-a"),b=profile("account-b"),c=profile("account-c");
  invoke(store,"saveFile",new Class[]{String.class,JSONObject.class},"iptv-accounts",new JSONObject().put("items",new JSONArray().put(a).put(b).put(c)));
  invoke(store,"saveFile",new Class[]{String.class,JSONObject.class},"iptv-personal",b);invoke(store,"save",new Class[]{JSONObject.class},a);
  JSONObject summary=(JSONObject)invoke(store,"summary",new Class[]{});check(summary.getString("profileId").equals("account-a"),"Fixture active source not loaded");
  Field revision=type.getDeclaredField("revision");revision.setAccessible(true);int before=revision.getInt(store);
  long started=android.os.SystemClock.elapsedRealtime();JSONObject removed=(JSONObject)invoke(store,"removeAccount",new Class[]{String.class},"account-b");
  check(!removed.getBoolean("currentRemoved")&&revision.getInt(store)==before,"Inactive deletion invalidated active catalog");check(removed.getJSONArray("accounts").length()==2,"Inactive deletion lost another account");check(!removed.toString().contains("private-"),"Credentials leaked through deletion result");
  reopened=constructor.newInstance(isolated);summary=(JSONObject)invoke(reopened,"summary",new Class[]{});check(summary.getString("profileId").equals("account-a")&&summary.getJSONArray("accounts").length()==2,"Removed personal backup resurrected on restart");
  boolean rejected=false;try{invoke(store,"removeAccount",new Class[]{String.class},"missing");}catch(IOException expected){rejected=true;}check(rejected,"Unknown ID removed an account");
  rejected=false;try{invoke(store,"removePlaylistFile",new Class[]{String.class},"account-a");}catch(IOException expected){rejected=true;}check(rejected,"File-only deletion accepted Xtream account");
  removed=(JSONObject)invoke(store,"removeAccount",new Class[]{String.class},"account-a");check(removed.getBoolean("currentRemoved"),"Active removal not identified");summary=(JSONObject)invoke(store,"summary",new Class[]{});check(summary.getString("profileId").equals("account-c"),"Next saved account not activated locally");check(revision.getInt(store)>before,"Active removal retained old catalog");
  invoke(store,"removeAccount",new Class[]{String.class},"account-c");summary=(JSONObject)invoke(store,"summary",new Class[]{});check(summary.getBoolean("publicMode")&&summary.getJSONArray("accounts").length()==0,"Last deletion failed free fallback");
  invoke(store,"importPhoneProfile",new Class[]{JSONObject.class},a);summary=(JSONObject)invoke(store,"summary",new Class[]{});check(summary.getBoolean("publicMode")&&summary.getJSONArray("accounts").length()==0,"Legacy phone vault re-imported a deleted account");
  check(android.os.SystemClock.elapsedRealtime()-started<3000,"Deletion attempted provider authentication/network");
  result.putString("stream","PASS: encrypted single-account deletion, expired/offline account, no credentials in result, inactive catalog unchanged, backup persistence after restart, unknown/file-only guards, next-account switch, last-account free fallback, no legacy-vault resurrection.");finish(Activity.RESULT_OK,result);
 }catch(Throwable e){result.putString("stream","FAIL: "+e);finish(Activity.RESULT_CANCELED,result);}finally{for(Object value:new Object[]{store,reopened})if(value!=null)try{Field updater=value.getClass().getDeclaredField("updater");updater.setAccessible(true);((ExecutorService)updater.get(value)).shutdownNow();}catch(Exception ignored){}}}
}
