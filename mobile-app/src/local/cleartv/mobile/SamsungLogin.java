package local.cleartv.mobile;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.URLEncoder;

/** The Samsung certificate service registers an exact loopback callback. */
final class SamsungLogin {
    static final int PORT=4794;
    static final String PATH="/signin/callback";
    static final String REDIRECT="http://localhost:4794/signin/callback";
    static ServerSocket listen()throws IOException{
        try{return new ServerSocket(PORT,4,InetAddress.getByName("127.0.0.1"));}
        catch(IOException e){throw new IOException("تعذّر فتح اتصال تسجيل Samsung المحلي. اقفل محاولة التثبيت السابقة وافتح التطبيق من جديد.",e);}
    }
    static String authorizationURL()throws IOException{
        return "https://account.samsung.com/mobile/account/check.do?serviceID=v285zxnl3h&actionID=StartOAuth2&accessToken=Y&redirect_uri="+URLEncoder.encode(REDIRECT,"UTF-8");
    }
    static boolean callbackPath(String target){return target!=null&&target.split("\\?",2)[0].equals(PATH);}
}
