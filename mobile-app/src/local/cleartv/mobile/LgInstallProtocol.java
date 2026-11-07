package local.cleartv.mobile;
import com.jcraft.jsch.*;
import java.io.*;import java.net.*;import java.nio.charset.StandardCharsets;import java.security.*;import java.util.*;import org.json.*;
/** Developer Mode transport matching @webos-tools/cli, fixed package only. No root or launch. */
final class LgInstallProtocol {
 // webOS uses two separate services: SSH installs/control on 9922,
 // and the Developer Mode HTTP key server on 9991.
 static final int SSH_PORT=9922, KEY_SERVER_PORT=9991;
 static final String APP="com.zainbot.morphtv.preview",VERSION="1.1.324",SHA="728f423008e062c0d49ca9e16489c3ea31658abfab9d0f012640bff2cd59899b";
 interface Trust {boolean accept(String fingerprint);}
 interface Progress {void update(String text);}
 static boolean local(String ip){try{String[] parts=ip.split("\\.");if(parts.length!=4)return false;int[] n=new int[4];for(int i=0;i<4;i++){if(!parts[i].matches("[0-9]{1,3}"))return false;n[i]=Integer.parseInt(parts[i]);if(n[i]>255)return false;}return n[0]==10||n[0]==192&&n[1]==168||n[0]==172&&n[1]>=16&&n[1]<=31;}catch(Exception e){return false;}}
 static String digest(byte[] b)throws Exception{return hex(MessageDigest.getInstance("SHA-256").digest(b));}
 static String hex(byte[] b){StringBuilder s=new StringBuilder();for(byte v:b)s.append(String.format(java.util.Locale.ROOT,"%02x",v&255));return s.toString();}
 static String fingerprint(byte[] b){try{return "SHA256:"+Base64.getEncoder().withoutPadding().encodeToString(MessageDigest.getInstance("SHA-256").digest(b));}catch(Exception e){throw new IllegalStateException(e);}}
 static byte[] key(String ip)throws Exception{
  if(!local(ip))throw new IOException("Use the TV private IPv4 address.");HttpURLConnection c=(HttpURLConnection)new URL("http://"+ip+":"+KEY_SERVER_PORT+"/webos_rsa").openConnection();c.setConnectTimeout(8000);c.setReadTimeout(8000);c.setInstanceFollowRedirects(false);
  try{if(c.getResponseCode()!=200)throw new IOException("Open LG Developer Mode and enable Key Server.");byte[] b=read(c.getInputStream(),32768);String s=new String(b,StandardCharsets.US_ASCII);if(!s.startsWith("-----BEGIN ")||!s.contains("PRIVATE KEY-----"))throw new IOException("LG did not return a Developer Mode key.");return b;}catch(IOException e){throw new IOException("LG Key Server 9991: افتح Developer Mode وفعّل Key Server، وتأكد من عنوان الشاشة ونفس شبكة Wi-Fi. اتصال SSH يستخدم 9922 بشكل منفصل.",e);}finally{c.disconnect();}
 }
 static byte[] read(InputStream in,int max)throws IOException{try(InputStream src=in;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[4096];int n;while((n=src.read(b))!=-1){if(out.size()+n>max)throw new IOException("Response too large");out.write(b,0,n);}return out.toByteArray();}}
 static JSONObject install(String ip,byte[] secret,byte[] phrase,byte[] ipk,Trust trust,Progress progress)throws Exception{
  return install(ip,secret,phrase,ipk,trust,progress,false);
 }
 static JSONObject install(String ip,byte[] secret,byte[] phrase,byte[] ipk,Trust trust,Progress progress,boolean authenticateOnly)throws Exception{return install(ip,secret,phrase,ipk,trust,progress,authenticateOnly,null);}
 static JSONObject install(String ip,byte[] secret,byte[] phrase,byte[] ipk,Trust trust,Progress progress,boolean authenticateOnly,InstallPackage product)throws Exception{
  String expectedSha=product==null?SHA:product.sha,app=product==null?APP:product.id,version=product==null?VERSION:product.version;
  if(!local(ip))throw new IOException("Use a private TV IPv4 address.");if(!expectedSha.equals(digest(ipk)))throw new IOException("LG package integrity check failed. Nothing sent.");
  JSch ssh=new JSch();Session session=null;ChannelSftp sftp=null;String remote="/media/developer/temp/morphtv-"+UUID.randomUUID().toString()+".ipk";
  try{
   LgSsh.validateKey(secret,phrase);ssh.addIdentity("LG Developer Mode",secret,null,phrase);
   ssh.setHostKeyRepository(new HostKeyRepository(){private HostKey approved;public int check(String host,byte[] key){if(approved!=null)return Arrays.equals(Base64.getDecoder().decode(approved.getKey()),key)?OK:CHANGED;if(!trust.accept(fingerprint(key)))return NOT_INCLUDED;try{approved=new HostKey(host,key);return OK;}catch(Exception e){return NOT_INCLUDED;}}public void add(HostKey h,UserInfo u){}public void remove(String h,String t){}public void remove(String h,String t,byte[] k){}public String getKnownHostsRepositoryID(){return "Morph LG confirmed TV";}public HostKey[] getHostKey(){return approved==null?new HostKey[0]:new HostKey[]{approved};}public HostKey[] getHostKey(String h,String t){return getHostKey();}});
   session=ssh.getSession("prisoner",ip,SSH_PORT);LgSsh.configure(session);session.setTimeout(15000);session.setServerAliveInterval(10000);session.setServerAliveCountMax(1);progress.update("LG: Connecting through SSH on port 9922…");session.connect(15000);
   if(authenticateOnly)return new JSONObject().put("authenticated",true).put("launched",false);
   sftp=(ChannelSftp)session.openChannel("sftp");sftp.connect(10000);try{sftp.stat("/media/developer/temp");}catch(SftpException e){sftp.mkdir("/media/developer/temp");}
   progress.update("Sending verified LG package…");sftp.put(new ByteArrayInputStream(ipk),remote);if(sftp.stat(remote).getSize()!=ipk.length)throw new IOException("LG upload size mismatch. Installation was not requested.");
   byte[] uploaded=read(sftp.get(remote),32*1024*1024);boolean same=expectedSha.equals(digest(uploaded));Arrays.fill(uploaded,(byte)0);if(!same)throw new IOException("LG upload integrity mismatch. Installation was not requested.");
   JSONObject args=new JSONObject().put("id",app).put("ipkUrl",remote).put("subscribe",true);progress.update("Installing on LG. Do not power off the TV…");
   run(session,"/usr/bin/luna-send-pub -i luna://com.webos.appInstallService/dev/install '"+args.toString()+"'",true,90000);
   JSONObject apps=run(session,"/usr/bin/luna-send-pub -n 1 luna://com.webos.applicationManager/dev/listApps '{}'",false,15000);
   if(!hasPackage(apps,app,version))throw new IOException("Installation response received, but LG did not confirm the bundled package version. No retry was made.");
   return new JSONObject().put("installed",true).put("verified",true).put("appId",app).put("version",version).put("launched",false).put("phonePairing",false);
  }finally{if(sftp!=null){try{sftp.rm(remote);}catch(Exception ignored){}sftp.disconnect();}if(session!=null)session.disconnect();try{ssh.removeAllIdentity();}catch(Exception ignored){}Arrays.fill(secret,(byte)0);Arrays.fill(phrase,(byte)0);}
 }
 static boolean hasPackage(JSONObject response){return hasPackage(response,APP,VERSION);}
 static boolean hasPackage(JSONObject response,String app,String version){JSONArray apps=response.optJSONArray("apps");if(!response.optBoolean("returnValue",false)||apps==null)return false;for(int i=0;i<apps.length();i++){JSONObject a=apps.optJSONObject(i);if(a!=null&&app.equals(a.optString("id"))&&version.equals(a.optString("version")))return true;}return false;}
 static int installState(JSONObject value)throws IOException{if(value.has("returnValue")&&!value.optBoolean("returnValue"))throw new IOException("LG rejected installation. No retry was made.");String state=value.optJSONObject("details")==null?"":value.optJSONObject("details").optString("state");if(state.toLowerCase(Locale.ROOT).contains("fail"))throw new IOException("LG reported installation failure. No retry was made.");return state.equalsIgnoreCase("installed")||state.equalsIgnoreCase("SUCCESS")?1:0;}
 static JSONObject run(Session session,String command,boolean install,long timeout)throws Exception{
  ChannelExec channel=(ChannelExec)session.openChannel("exec");channel.setCommand(command);channel.setInputStream(null);InputStream in=channel.getInputStream();ByteArrayOutputStream err=new ByteArrayOutputStream();channel.setErrStream(err);channel.connect(10000);long until=System.currentTimeMillis()+timeout;ByteArrayOutputStream line=new ByteArrayOutputStream();int total=0;
  try{while(System.currentTimeMillis()<until){while(in.available()>0){int v=in.read();if(v<0)break;if(++total>1048576||err.size()>65536)throw new IOException("Unexpected LG response size.");if(v=='\n'){String text=new String(line.toByteArray(),StandardCharsets.UTF_8).trim();line.reset();if(text.startsWith("{")){JSONObject obj=new JSONObject(text);if(!install||installState(obj)==1)return obj;}}else line.write(v);}if(channel.isClosed()){if(line.size()>0){JSONObject obj=new JSONObject(new String(line.toByteArray(),StandardCharsets.UTF_8).trim());if(!install||installState(obj)==1)return obj;}break;}Thread.sleep(50);}throw new IOException("LG did not confirm completion before timeout. No retry was made; check the TV Apps list before trying again.");}finally{channel.disconnect();}
 }
}
