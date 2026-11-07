package local.tvmorph.tv;
import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;
/** Upgrade identity, isolated by entitlement scope. Server verification is mandatory. */
public final class PlusIdentity {
 private static String defaultScope(Context c){return c.getPackageName().equals("local.cleartv.mobile")?"studio":"tv";}
 private static boolean validScope(String scope){return "tv".equals(scope)||"studio".equals(scope);}
 public static String read(Context c){return read(c,defaultScope(c));}
 public static synchronized String read(Context c,String scope){
  if(!validScope(scope))return "{}";
  SharedPreferences prefs=c.getSharedPreferences("morph-plus-identity",0);
  String current=prefs.getString("identity-"+scope,"");
  if(!current.isEmpty())return current;
  try{JSONObject old=new JSONObject(prefs.getString("identity","{}"));
   String oldScope=old.optString("scope",defaultScope(c));if(oldScope.isEmpty())oldScope=defaultScope(c);
   if(scope.equals(oldScope)&&save(c,old.put("scope",scope).toString()))return prefs.getString("identity-"+scope,"{}");
  }catch(Exception ignored){}
  return "{}";
 }
 public static void clear(Context c){clear(c,defaultScope(c));}
 public static synchronized void clear(Context c,String scope){
  if(!validScope(scope))return;
  try{JSONObject value=new JSONObject(read(c,scope));value.remove("token");save(c,value.toString());}catch(Exception ignored){}
  // Remove the old backup too, so it cannot resurrect an explicitly released token.
  try{SharedPreferences prefs=c.getSharedPreferences("morph-plus-identity",0);JSONObject old=new JSONObject(prefs.getString("identity","{}"));String oldScope=old.optString("scope",defaultScope(c));if(oldScope.isEmpty())oldScope=defaultScope(c);if(scope.equals(oldScope))prefs.edit().remove("identity").commit();}catch(Exception ignored){}
  PlusAccess.invalidate();
 }
 public static synchronized boolean save(Context c,String raw){try{
  if(raw==null||raw.length()>1024)return false;JSONObject v=new JSONObject(raw);
  String scope=v.optString("scope",defaultScope(c));if(scope.isEmpty())scope=defaultScope(c);
  if(!validScope(scope)||!v.optString("device").matches("[A-Za-z0-9_-]{20,80}")||(!v.optString("token").isEmpty()&&!v.optString("token").matches("[A-Za-z0-9_-]{32,128}")))return false;
  return c.getSharedPreferences("morph-plus-identity",0).edit().putString("identity-"+scope,new JSONObject().put("device",v.getString("device")).put("token",v.optString("token")).put("scope",scope).toString()).commit();
 }catch(Exception ignored){return false;}}
}
