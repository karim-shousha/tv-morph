package local.cleartv.mobile;
import java.nio.file.*;import java.util.*;import org.json.*;
public class LgInstallCheck {
 public static void main(String[] a)throws Exception{
  if(LgInstallProtocol.local("8.8.8.8")||LgInstallProtocol.local("10.0.0.1;cmd")||LgInstallProtocol.local("127.0.0.1"))throw new AssertionError("Invalid host accepted");
  if(!LgInstallProtocol.local(a[0]))throw new AssertionError("Test host");
  if(LgInstallProtocol.installState(new JSONObject("{\"returnValue\":true,\"details\":{\"state\":\"installing\"}}"))!=0)throw new AssertionError("Premature install success");
  try{LgInstallProtocol.installState(new JSONObject("{\"returnValue\":false}"));throw new AssertionError("Failure accepted");}catch(java.io.IOException expected){}
  if(LgInstallProtocol.hasPackage(new JSONObject("{\"returnValue\":true,\"apps\":[{\"id\":\"com.zainbot.morphtv.preview\",\"version\":\"0.0.9\"}]}")))throw new AssertionError("Wrong version");
  byte[] ipk=Files.readAllBytes(Paths.get(a[1]));String mode=a[2];byte[] key=LgInstallProtocol.key(a[0]);byte[] phrase=(mode.equals("wrong")?"wrong":"fake-lg-test-passphrase").getBytes("UTF-8");
  if(mode.equals("corrupt"))ipk[100]^=1;
  try{JSONObject result=LgInstallProtocol.install(a[0],key,phrase,ipk,fp->!mode.equals("reject"),message->{});if(!mode.equals("success"))throw new AssertionError("Expected failure");if(!result.getBoolean("installed")||result.getBoolean("launched"))throw new AssertionError("Result");}
  catch(Exception e){if(mode.equals("success"))throw e;}
  if(!mode.equals("corrupt")&&(!allZero(key)||!allZero(phrase)))throw new AssertionError("Secret retained");
  System.out.println("PASS LG transport "+mode);
 }
 static boolean allZero(byte[] b){for(byte v:b)if(v!=0)return false;return true;}
}
