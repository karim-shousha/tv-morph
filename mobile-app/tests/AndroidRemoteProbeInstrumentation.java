package local.morph.remotecheck;
import android.app.*;import android.os.*;import android.content.*;import org.json.*;import java.util.*;import java.io.*;import java.net.*;import java.security.*;import java.security.cert.*;import java.security.spec.*;import javax.net.ssl.*;
/** Read existing credentials in-process. Never exports certificates, keys or user text. */
public class AndroidRemoteProbeInstrumentation extends Instrumentation {
 static byte[] join(byte[]... values)throws Exception{ByteArrayOutputStream b=new ByteArrayOutputStream();for(byte[] v:values)b.write(v);return b.toByteArray();}
 static byte[] vi(int n){ByteArrayOutputStream b=new ByteArrayOutputStream();while(n>127){b.write((n&127)|128);n>>>=7;}b.write(n);return b.toByteArray();}
 static byte[] num(int f,int n)throws Exception{return join(vi(f<<3),vi(n));}
 static byte[] bytes(int f,byte[] data)throws Exception{return join(vi(f*8+2),vi(data.length),data);}
 static byte[] str(int f,String s)throws Exception{return bytes(f,s.getBytes("UTF-8"));}
 static int read(InputStream in)throws Exception{int n=0,shift=0,c;do{c=in.read();if(c<0)throw new EOFException();n|=(c&127)<<shift;shift+=7;if(shift>35)throw new IOException("varint");}while(c>127);return n;}
 static Map<Integer,byte[]> fields(byte[] data)throws Exception{Map<Integer,byte[]> out=new HashMap<>();ByteArrayInputStream in=new ByteArrayInputStream(data);while(in.available()>0){int tag=read(in),kind=tag&7;byte[] value;if(kind==2){value=new byte[read(in)];if(in.read(value)!=value.length)throw new IOException("truncated");}else if(kind==0)value=vi(read(in));else throw new IOException("wire");out.put(tag>>3,value);}return out;}
 static void send(OutputStream out,byte[] body)throws Exception{out.write(vi(body.length));out.write(body);out.flush();}
 static byte[] pem(String s){return android.util.Base64.decode(s.replaceAll("-----[^-]+-----","").replaceAll("\\s",""),android.util.Base64.DEFAULT);}
 public void onCreate(Bundle args){super.onCreate(args);start();}
 @SuppressWarnings("unchecked") public void onStart(){Bundle result=new Bundle();JSONArray attempts=new JSONArray();try{
  Context c=getTargetContext();Class<?> storage=c.getClassLoader().loadClass("com.it_nomads.fluttersecurestorage.FlutterSecureStorage");Object vault=storage.getConstructor(Context.class,Map.class).newInstance(c,new HashMap<String,Object>());
  try{Class<?> host=c.getClassLoader().loadClass("local.cleartv.mobile.AndroidTv");java.lang.reflect.Method token=host.getDeclaredMethod("token",Context.class,String.class);token.setAccessible(true);String saved=(String)token.invoke(null,c,"10.0.0.137");java.lang.reflect.Method request=host.getDeclaredMethod("request",String.class,String.class,JSONObject.class,String.class);request.setAccessible(true);JSONObject reply=(JSONObject)request.invoke(null,"10.0.0.137","/remote/key",new JSONObject().put("key","INPUT"),saved);result.putString("nativeInput",reply.toString());}catch(Exception unavailable){result.putString("nativeInput","No existing authenticated Morph TV host link");}
  Map<String,String> all=(Map<String,String>)storage.getMethod("readAll").invoke(vault);int count=0;
  for(String key:all.keySet()){if(!key.endsWith("_cert")||!key.contains("morph_remote_secret_"))continue;String privateKey=all.get(key.substring(0,key.length()-5)+"_key");if(privateKey==null||count++>=3)continue;
   JSONObject report=new JSONObject();try{
    java.security.cert.Certificate cert=CertificateFactory.getInstance("X.509").generateCertificate(new ByteArrayInputStream(pem(all.get(key))));PrivateKey pk=KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(pem(privateKey)));
    KeyStore store=KeyStore.getInstance(KeyStore.getDefaultType());store.load(null,null);store.setKeyEntry("remote",pk,new char[0],new java.security.cert.Certificate[]{cert});KeyManagerFactory km=KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());km.init(store,new char[0]);
    TrustManager[] trust={new X509TrustManager(){public void checkClientTrusted(X509Certificate[] a,String b){}public void checkServerTrusted(X509Certificate[] a,String b){}public X509Certificate[] getAcceptedIssuers(){return new X509Certificate[0];}}};SSLContext tls=SSLContext.getInstance("TLS");tls.init(km.getKeyManagers(),trust,null);
    try(SSLSocket socket=(SSLSocket)tls.getSocketFactory().createSocket()){
     socket.connect(new InetSocketAddress("10.0.0.137",6466),3000);socket.setSoTimeout(1000);socket.startHandshake();report.put("tls",true);InputStream in=socket.getInputStream();OutputStream out=socket.getOutputStream();long end=System.currentTimeMillis()+6500;Set<Integer> seen=new TreeSet<>();int active=615;
     while(System.currentTimeMillis()<end){try{int n=read(in);if(n>65536)throw new IOException("oversize");byte[] b=new byte[n];new DataInputStream(in).readFully(b);Map<Integer,byte[]> f=fields(b);seen.addAll(f.keySet());
      if(f.containsKey(1)){Map<Integer,byte[]> config=fields(f.get(1));int supported=read(new ByteArrayInputStream(config.get(1)));report.put("features",supported);active&=supported;send(out,bytes(1,join(num(1,active),bytes(2,join(num(3,1),str(4,"1"),str(5,"morph-remote-probe"),str(6,"1"))))));}
      if(f.containsKey(2))send(out,bytes(2,num(1,active)));
      if(f.containsKey(8))send(out,bytes(9,fields(f.get(8)).get(1)==null?num(1,0):bytesValue(1,fields(f.get(8)).get(1))));
      if(f.containsKey(20)){Map<Integer,byte[]> ime=fields(f.get(20));if(ime.containsKey(1)){byte[] app=fields(ime.get(1)).get(12);if(app!=null)report.put("foregroundApp",new String(app,"UTF-8"));}}
      if(f.containsKey(21)){Map<Integer,byte[]> ime=fields(f.get(21));report.put("imeCounterReceived",ime.containsKey(1));report.put("imeFieldReceived",ime.containsKey(2));}
      if(f.containsKey(3))report.put("remoteError",true);
      if(f.containsKey(40))report.put("started",true);
     }catch(SocketTimeoutException idle){}}
     report.put("messageFields",seen.toString());
    }
   }catch(Exception error){report.put("error",error.getClass().getSimpleName());}attempts.put(report);
  }
  result.putString("diagnostics",new JSONObject().put("storedAndroidIdentities",count).put("attempts",attempts).toString());result.putBoolean("passed",true);
 }catch(Throwable error){result.putString("error",android.util.Log.getStackTraceString(error));}finish(result.getBoolean("passed")?Activity.RESULT_OK:Activity.RESULT_CANCELED,result);}
 static byte[] bytesValue(int field,byte[] encoded)throws Exception{return join(vi(field<<3),encoded);}
}
