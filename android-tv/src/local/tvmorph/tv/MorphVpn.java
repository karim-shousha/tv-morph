package local.tvmorph.tv;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import com.wireguard.android.backend.GoBackend;
import com.wireguard.android.backend.Tunnel;
import com.wireguard.config.Config;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.*;
import java.util.concurrent.*;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import org.json.*;

/** User-owned WireGuard profiles. Keys stay encrypted in app-private storage. */
final class MorphVpn {
 interface Reply { void send(String id,boolean success,Object value); }
 private static final int PICK=9680,CONSENT=9681;
 private static final ExecutorService jobs=Executors.newSingleThreadExecutor();
 private static GoBackend backend;
 private static final Map<String,Tunnel> tunnels=new HashMap<>();
 private final Activity owner;private final Reply reply;
 private String pending="",pendingProfile="";
 MorphVpn(Activity owner,Reply reply){this.owner=owner;this.reply=reply;}
 private File folder(){File f=new File(owner.getFilesDir(),"vpn-profiles");f.mkdirs();return f;}
 private synchronized GoBackend backend(){if(backend==null)backend=new GoBackend(owner.getApplicationContext());return backend;}
 private static synchronized Tunnel tunnel(final String id){Tunnel t=tunnels.get(id);if(t==null){t=new Tunnel(){public String getName(){return "morph"+id.substring(0,8);}public void onStateChange(State state){}};tunnels.put(id,t);}return t;}
 private JSONArray index()throws Exception{File f=new File(folder(),"index.json");if(!f.exists())return new JSONArray();return new JSONArray(new String(read(new FileInputStream(f),65536),StandardCharsets.UTF_8));}
 private void save(JSONArray rows)throws Exception{File file=new File(folder(),"index.json"),temp=new File(folder(),"index.tmp");try(FileOutputStream out=new FileOutputStream(temp)){out.write(rows.toString().getBytes(StandardCharsets.UTF_8));out.getFD().sync();}if(!temp.renameTo(file))throw new IOException("Could not save VPN profiles");}
 private javax.crypto.SecretKey key()throws Exception{KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);String alias="morph-vpn-profile-v1";if(!ks.containsAlias(alias)){KeyGenerator gen=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");gen.init(new KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());gen.generateKey();}return (javax.crypto.SecretKey)ks.getKey(alias,null);}
 private byte[] encrypt(byte[] plain)throws Exception{Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,key());ByteArrayOutputStream out=new ByteArrayOutputStream();out.write(c.getIV().length);out.write(c.getIV());out.write(c.doFinal(plain));return out.toByteArray();}
 private byte[] decrypt(byte[] encrypted)throws Exception{int n=encrypted[0]&255;if(n!=12||encrypted.length<n+18)throw new IOException("Invalid encrypted profile");Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Arrays.copyOfRange(encrypted,1,n+1)));return c.doFinal(Arrays.copyOfRange(encrypted,n+1,encrypted.length));}
 private static byte[] read(InputStream source,int limit)throws Exception{if(source==null)throw new IOException("File unavailable");try(InputStream in=source;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[4096];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>limit)throw new IOException("Profile is too large");out.write(buffer,0,n);}return out.toByteArray();}}
 private Config config(byte[] bytes)throws Exception{String text=new String(bytes,StandardCharsets.UTF_8);if(text.indexOf('\0')>=0||text.matches("(?s).*\\b(?:PreUp|PostUp|PreDown|PostDown)\\s*=.*"))throw new IOException("Configuration scripts are not allowed");return Config.parse(new BufferedReader(new StringReader(text)));}
 private JSONObject row(String id)throws Exception{if(!id.matches("[a-f0-9]{16}"))throw new IOException("Unknown VPN profile");JSONArray rows=index();for(int i=0;i<rows.length();i++)if(rows.getJSONObject(i).getString("id").equals(id))return rows.getJSONObject(i);throw new IOException("Unknown VPN profile");}
 private JSONObject status()throws Exception{JSONArray rows=index(),result=new JSONArray();for(int i=0;i<rows.length();i++){JSONObject p=rows.getJSONObject(i);result.put(new JSONObject().put("id",p.getString("id")).put("name",p.getString("name")).put("running",backend().getState(tunnel(p.getString("id")))==Tunnel.State.UP));}return new JSONObject().put("available",true).put("canImport",true).put("profiles",result);}
 void request(String id,String action,String profile){owner.runOnUiThread(()->{if(owner.isFinishing())return;if(!pending.isEmpty()){reply.send(id,false,"A VPN operation is already in progress");return;}pending=id;pendingProfile=profile==null?"":profile;try{if(action.equals("import")){owner.startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION),PICK);return;}if(action.equals("connect")){row(pendingProfile);Intent consent=android.net.VpnService.prepare(owner);if(consent!=null){owner.startActivityForResult(consent,CONSENT);return;}}work(action,null);}catch(Exception error){finish(false,"VPN action could not start. Check the configuration or device support.");}});}
 private void finish(boolean ok,Object value){final String id=pending;pending="";pendingProfile="";owner.runOnUiThread(()->reply.send(id,ok,value));}
 private void work(String action,Uri uri){final String profile=pendingProfile;jobs.execute(()->{try{if(action.equals("status")){finish(true,status());return;}if(action.equals("import")){byte[] plain=read(owner.getContentResolver().openInputStream(uri),65536);config(plain);String name="WireGuard";try(android.database.Cursor cursor=owner.getContentResolver().query(uri,new String[]{android.provider.OpenableColumns.DISPLAY_NAME},null,null,null)){if(cursor!=null&&cursor.moveToFirst())name=cursor.getString(0);}name=name.replaceFirst("(?i)\\.conf$","");if(name.length()>60)name=name.substring(0,60);String id=UUID.randomUUID().toString().replace("-","").substring(0,16);try(FileOutputStream out=new FileOutputStream(new File(folder(),id+".enc"))){out.write(encrypt(plain));}Arrays.fill(plain,(byte)0);JSONArray rows=index();rows.put(new JSONObject().put("id",id).put("name",name));save(rows);finish(true,status());return;}row(profile);Tunnel tunnel=tunnel(profile);if(action.equals("connect")){Config c=config(decrypt(read(new FileInputStream(new File(folder(),profile+".enc")),65536+64)));backend().setState(tunnel,Tunnel.State.UP,c);}else if(action.equals("disconnect"))backend().setState(tunnel,Tunnel.State.DOWN,null);else if(action.equals("remove")){if(backend().getState(tunnel)==Tunnel.State.UP)throw new IOException("Disconnect before deleting");JSONArray rows=index(),keep=new JSONArray();for(int i=0;i<rows.length();i++)if(!rows.getJSONObject(i).getString("id").equals(profile))keep.put(rows.getJSONObject(i));save(keep);if(!new File(folder(),profile+".enc").delete())throw new IOException("Could not delete profile");}else throw new IOException("Unknown VPN action");finish(true,status());}catch(Exception error){finish(false,"VPN operation failed. Check your WireGuard file, endpoint and system permission.");}});}
 boolean result(int request,int result,Intent data){if(request!=PICK&&request!=CONSENT)return false;if(result!=Activity.RESULT_OK){finish(false,"VPN action cancelled");return true;}if(request==PICK){if(data==null||data.getData()==null)finish(false,"No VPN file selected");else work("import",data.getData());}else work("connect",null);return true;}
}
