package local.cleartv.mobile;
import java.io.*;import java.nio.file.*;import java.net.*;import java.util.*;
public final class ReceiverApkCheck {
 public static void main(String[] args)throws Exception{
  byte[] expected=Files.readAllBytes(Paths.get(args[0]));if(expected.length<=16*1024*1024)throw new AssertionError("Regression fixture must exceed old limit");
  byte[] apk=ReceiverApk.read(new ByteArrayInputStream(expected));if(!Arrays.equals(apk,expected))throw new AssertionError("APK changed");
  boolean rejected=false;try{ReceiverApk.read(new ByteArrayInputStream(new byte[ReceiverApk.MAX_BYTES+1]));}catch(IOException e){rejected=true;}if(!rejected)throw new AssertionError("Bounded read");
  try(LanHttp server=new LanHttp(18988,(m,p,h,b)->ApkDownload.response(apk,m,p,h))){
   HttpURLConnection c=(HttpURLConnection)new URL("http://127.0.0.1:18988/tv-morph.apk").openConnection();if(c.getResponseCode()!=200)throw new AssertionError("HTTP");byte[] received=ReceiverApk.read(c.getInputStream());if(!Arrays.equals(received,expected))throw new AssertionError("LAN transfer changed APK");c.disconnect();
  }
  System.out.println("PASS: actual >16 MiB signed APK read and served intact over LAN; oversize >32 MiB rejected. Bytes="+apk.length);
 }
}
