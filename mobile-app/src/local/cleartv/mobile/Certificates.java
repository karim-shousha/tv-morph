package local.cleartv.mobile;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.*;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.spec.*;
import java.util.*;
import org.json.*;

final class Certificates {
    interface Status {void update(String text);}
    static final String CA="https://svdca.samsungqbe.com";
    final Activity activity;final Vault vault;final Status status;
    Certificates(Activity a,Status s){activity=a;vault=new Vault(a);status=s;}
    static final class Bundle {PrivateKey key;List<X509Certificate> author,distributor;}
    private static JSONObject form(String s)throws Exception{JSONObject out=new JSONObject();for(String part:s.split("&")){int i=part.indexOf('=');if(i>=0)out.put(URLDecoder.decode(part.substring(0,i),"UTF-8"),URLDecoder.decode(part.substring(i+1),"UTF-8"));}return out;}
    JSONObject login()throws Exception{
        byte[] saved=vault.get("samsung-auth.bin");if(saved!=null){JSONObject a=new JSONObject(new String(saved,"UTF-8"));if(a.optLong("validUntil")>System.currentTimeMillis()+60000)return a;}
        try(ServerSocket server=SamsungLogin.listen()){server.setSoTimeout(300000);
            String url=SamsungLogin.authorizationURL();
            status.update("كمّل تسجيل الدخول في صفحة سامسونج، وبعدها ارجع للتطبيق.");activity.runOnUiThread(()->activity.startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url))));
            long deadline=System.currentTimeMillis()+300000;
            while(System.currentTimeMillis()<deadline){try(Socket request=server.accept()){request.setSoTimeout(5000);InputStream in=request.getInputStream();ByteArrayOutputStream header=new ByteArrayOutputStream();int tail=0;while(header.size()<16384){int c=in.read();if(c<0)break;header.write(c);tail=(tail<<8)|c;if(tail==0x0d0a0d0a)break;}String h=header.toString("UTF-8"),first=h.split("\r\n")[0];String[] words=first.split(" ");String target=words.length>1?words[1]:"";if(!SamsungLogin.callbackPath(target)){respond(request,"404 Not Found","Not found");continue;}
                int length=0;for(String line:h.split("\r\n"))if(line.toLowerCase(Locale.US).startsWith("content-length:"))length=Integer.parseInt(line.substring(15).trim());if(length>1024*1024)throw new IOException("Invalid login response");String body=new String(SdbClient.exact(in,length),"UTF-8");JSONObject fields=form(body);if(!fields.has("code")&&target.contains("?"))fields=form(target.substring(target.indexOf('?')+1));String code=fields.optString("code");JSONObject token=new JSONObject(code);if(token.optString("access_token").isEmpty()||token.optString("userId").isEmpty())throw new IOException("Samsung login did not return an authorization");
                token.put("validUntil",System.currentTimeMillis()+Math.min(86400,token.optLong("access_token_expires_in",3600))*1000);vault.put("samsung-auth.bin",token.toString().getBytes(StandardCharsets.UTF_8));respond(request,"200 OK","<html dir='rtl'><meta charset='utf-8'><body style='background:#121722;color:white;font:24px sans-serif;padding:50px'>تم تسجيل الدخول. ارجع لتطبيق Morph TV.</body></html>");return token;
            }}throw new IOException("انتهت مهلة تسجيل الدخول. اضغط تثبيت للمحاولة من جديد.");
        }
    }
    static void respond(Socket s,String status,String body)throws IOException{byte[] b=body.getBytes(StandardCharsets.UTF_8);s.getOutputStream().write(("HTTP/1.1 "+status+"\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: "+b.length+"\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.US_ASCII));s.getOutputStream().write(b);s.getOutputStream().flush();}
    private String post(String endpoint,JSONObject auth,String csr,boolean distributor,boolean vd)throws Exception{
        String boundary="ClearTV"+UUID.randomUUID().toString().replace("-","");ByteArrayOutputStream body=new ByteArrayOutputStream();
        Map<String,String> fields=new LinkedHashMap<>();fields.put("access_token",auth.getString("access_token"));fields.put("user_id",auth.getString("userId"));if(vd)fields.put("platform","VD");if(distributor){fields.put("privilege_level","Public");fields.put("developer_type","Individual");}
        for(Map.Entry<String,String> e:fields.entrySet())body.write(("--"+boundary+"\r\nContent-Disposition: form-data; name=\""+e.getKey()+"\"\r\n\r\n"+e.getValue()+"\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(("--"+boundary+"\r\nContent-Disposition: form-data; name=\"csr\"; filename=\"request.csr\"\r\nContent-Type: application/octet-stream\r\n\r\n"+csr+"\r\n--"+boundary+"--\r\n").getBytes(StandardCharsets.UTF_8));
        HttpURLConnection c=(HttpURLConnection)new URL(CA+endpoint).openConnection();c.setConnectTimeout(15000);c.setReadTimeout(45000);c.setInstanceFollowRedirects(false);c.setRequestMethod("POST");c.setDoOutput(true);c.setRequestProperty("Content-Type","multipart/form-data; boundary="+boundary);c.setFixedLengthStreamingMode(body.size());
        try{c.getOutputStream().write(body.toByteArray());int code=c.getResponseCode();if(code!=200)throw new IOException("Samsung certificate service returned HTTP "+code+". No installation was attempted.");return new String(Network.read(c.getInputStream(),1024*1024),StandardCharsets.UTF_8);}finally{c.disconnect();}
    }
    static X509Certificate certificate(byte[] data)throws Exception{return (X509Certificate)CertificateFactory.getInstance("X.509").generateCertificate(new ByteArrayInputStream(data));}
    List<X509Certificate> chain(byte[] leaf,String ca)throws Exception{return Arrays.asList(certificate(leaf),certificate(Network.read(activity.getAssets().open(ca),100000)));}
    Bundle get(String duid)throws Exception{
        Bundle b=new Bundle();byte[] key=vault.get("author-key.bin");KeyPair pair;if(key==null){pair=WidgetSigner.newKey();vault.put("author-key.bin",pair.getPrivate().getEncoded());}else{PrivateKey k=KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(key));RSAPrivateCrtKey r=(RSAPrivateCrtKey)k;pair=new KeyPair(KeyFactory.getInstance("RSA").generatePublic(new RSAPublicKeySpec(r.getModulus(),r.getPublicExponent())),k);}b.key=pair.getPrivate();
        byte[] author=vault.get("author-cert.bin"),dist=vault.get("distributor-cert.bin");boolean authorOK=valid(author),distOK=valid(dist);if(distOK){String san=String.valueOf(certificate(dist).getSubjectAlternativeNames());distOK=san.contains("URN:tizen:deviceid="+duid);}
        JSONObject auth=null;if(!authorOK||!distOK)auth=login();
        if(!authorOK){status.update("جاري إصدار شهادة مالك التطبيق من سامسونج…");author=post("/apis/v3/authors",auth,WidgetSigner.csr(pair,"Morph TV Mobile",null),false,true).getBytes(StandardCharsets.US_ASCII);certificate(author).verify(certificate(Network.read(activity.getAssets().open("ca-author.cer"),100000)).getPublicKey());vault.put("author-cert.bin",author);}
        if(!distOK){status.update("جاري ربط شهادة التثبيت بالتلفزيون…");String csr=WidgetSigner.csr(pair,"TizenSDK",duid);post("/apis/v1/distributors",auth,csr,true,true);dist=post("/apis/v3/distributors",auth,csr,true,false).getBytes(StandardCharsets.US_ASCII);X509Certificate leaf=certificate(dist);leaf.verify(certificate(Network.read(activity.getAssets().open("ca-distributor.crt"),100000)).getPublicKey());if(!String.valueOf(leaf.getSubjectAlternativeNames()).contains("URN:tizen:deviceid="+duid))throw new IOException("The certificate is not registered for this TV");vault.put("distributor-cert.bin",dist);}
        b.author=chain(author,"ca-author.cer");b.distributor=chain(dist,"ca-distributor.crt");return b;
    }
    boolean valid(byte[] data){try{if(data==null)return false;certificate(data).checkValidity(new Date(System.currentTimeMillis()+24*60*60*1000));return true;}catch(Exception e){return false;}}
}
