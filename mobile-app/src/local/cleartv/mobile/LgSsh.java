package local.cleartv.mobile;
import com.jcraft.jsch.*;
import java.io.IOException;
import java.util.Locale;
/** Compatibility is confined to the explicitly selected, host-verified LG session. */
final class LgSsh {
 static void configure(Session session){append(session,"server_host_key","ssh-rsa");append(session,"PubkeyAcceptedAlgorithms","ssh-rsa");append(session,"kex","diffie-hellman-group14-sha1");append(session,"kex","diffie-hellman-group1-sha1");session.setConfig("StrictHostKeyChecking","yes");session.setConfig("PreferredAuthentications","publickey");}
 private static void append(Session session,String key,String algorithm){String current=session.getConfig(key);if(!java.util.Arrays.asList(current.split(",")).contains(algorithm))session.setConfig(key,current+","+algorithm);}
 static void validateKey(byte[] key,byte[] phrase)throws Exception{KeyPair pair=KeyPair.load(new JSch(),key,null);try{if(pair.isEncrypted()&&!pair.decrypt(phrase))throw new IOException("LG: الـPassphrase غير صحيح. اكتبه كما يظهر على الشاشة، بدون مسافات.");}finally{pair.dispose();}}
 static String failure(Exception error){String detail=String.valueOf(error.getMessage()).toLowerCase(Locale.ROOT);if(detail.contains("auth fail")||detail.contains("auth cancel"))return "LG رفض مفتاح الدخول. فعّل Key Server وأعد ربط المفتاح بالـPassphrase الحالي.";if(detail.contains("algorithm")||detail.contains("negotiation"))return "LG: تعذّر توافق بروتوكول SSH. ابعت موديل الشاشة وإصدار webOS للدعم.";if(detail.contains("hostkey")||detail.contains("host key"))return "LG: بصمة الشاشة مختلفة أو لم تتم الموافقة عليها. تأكد من عنوان الشاشة قبل إعادة الربط.";return "LG: تعذّر اتصال SSH على 9922. تأكد من نفس الشبكة وصلاحية Developer Mode.";}
}
