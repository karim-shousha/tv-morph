package local.cleartv.mobile;
import android.app.*;import android.widget.*;import android.text.InputType;import java.io.*;import java.util.*;import java.util.concurrent.*;import java.nio.charset.StandardCharsets;import org.json.*;
final class LgInstaller {
 static JSONObject install(Activity a,String ip,LgInstallProtocol.Progress progress)throws Exception{
  return pair(a,ip,progress,true);
 }
 static String credentialName(String ip){return "lg-dev-"+ip.replace('.','_');}
 static JSONObject pair(Activity a,String ip,LgInstallProtocol.Progress progress,boolean install)throws Exception{
  if(!LgInstallProtocol.local(ip))throw new IOException("اكتب عنوان IP المحلي لشاشة LG.");
  final byte[][] phrase={null};CountDownLatch ready=new CountDownLatch(1);
  a.runOnUiThread(()->{EditText input=new EditText(a);input.setSingleLine(true);input.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);input.setHint("Passphrase");new AlertDialog.Builder(a).setTitle("LG · Developer Mode").setMessage("شغّل Dev Mode وKey Server على شاشة LG "+ip+". أدخل Passphrase الظاهر عليها. "+(install?"سيتم تثبيت Morph TV على LG فقط. ":"لن نعيد تثبيت التطبيق. ")+"بالموافقة سيتم حفظ مفتاح الاتصال والرمز مشفّرين على موبايلك للتحكم داخل Morph TV أثناء فتحه. يمكنك مسحهما من زر إلغاء ربط LG. لا يتم إرسالهما لأي خادم.").setView(input).setPositiveButton(install?"تثبيت وربط LG":"ربط وحفظ مشفّر",(d,w)->{phrase[0]=input.getText().toString().trim().getBytes(StandardCharsets.UTF_8);input.setText("");ready.countDown();}).setNegativeButton("إلغاء",(d,w)->ready.countDown()).setOnCancelListener(d->ready.countDown()).show();});
  if(!ready.await(120,TimeUnit.SECONDS)||phrase[0]==null)throw new IOException("تم إلغاء تثبيت LG.");
  byte[] key=null,record=null;try{if(phrase[0].length<1||phrase[0].length>128)throw new IOException("راجع Passphrase من شاشة LG.");progress.update("قراءة مفتاح Developer Mode من شاشة LG…");key=LgInstallProtocol.key(ip);record=new JSONObject().put("key",Base64.getEncoder().encodeToString(key)).put("phrase",Base64.getEncoder().encodeToString(phrase[0])).toString().getBytes(StandardCharsets.UTF_8);byte[] ipk=LgInstallProtocol.read(a.getAssets().open("lg-preview.ipk"),8*1024*1024);JSONObject result=LgInstallProtocol.install(ip,key,phrase[0],ipk,fingerprint->confirm(a,ip,fingerprint),progress,!install);new Vault(a).put(credentialName(ip),record);return result.put("credentialsSaved",true).put("controlRequiresOpenApp",true);}catch(com.jcraft.jsch.JSchException e){throw new IOException(LgSsh.failure(e),e);}finally{if(key!=null)Arrays.fill(key,(byte)0);if(record!=null)Arrays.fill(record,(byte)0);Arrays.fill(phrase[0],(byte)0);}
 }
 static boolean confirm(Activity a,String ip,String fingerprint){
  android.content.SharedPreferences p=a.getSharedPreferences("lg-hosts",0);String old=p.getString(ip,"");if(!old.isEmpty())return old.equals(fingerprint);
  CountDownLatch latch=new CountDownLatch(1);boolean[] yes={false};a.runOnUiThread(()->new AlertDialog.Builder(a).setTitle("تأكيد شاشة LG").setMessage("ده أول اتصال بالشاشة "+ip+". تأكد إنه عنوان شاشتك على شبكة موثوقة. بصمة الاتصال:\n"+fingerprint+"\nهل تثق في الشاشة؟").setPositiveButton("أثق في الشاشة",(d,w)->{yes[0]=true;p.edit().putString(ip,fingerprint).apply();latch.countDown();}).setNegativeButton("إلغاء",(d,w)->latch.countDown()).setOnCancelListener(d->latch.countDown()).show());try{return latch.await(120,TimeUnit.SECONDS)&&yes[0];}catch(InterruptedException e){Thread.currentThread().interrupt();return false;}
 }
}
