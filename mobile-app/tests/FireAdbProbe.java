package local.cleartv.mobile;
import java.nio.file.*;
public class FireAdbProbe {
 public static void main(String[] args)throws Exception{
  Path identityPath=Paths.get(".tools/tizen/private/fire-tv-test-identity.pk8");AdbIdentity identity=new AdbIdentity(Files.exists(identityPath)?Files.readAllBytes(identityPath):null);if(!Files.exists(identityPath))Files.write(identityPath,identity.encoded());
  System.out.println("Waiting for the TV approval prompt...");
  try(SdbClient client=new SdbClient(args[0],5555,identity)){
   System.out.println("Connected; Android SDK "+client.shell("getprop ro.build.version.sdk")+"; model "+client.shell("getprop ro.product.model"));
   if(args.length>1){String target="/data/local/tmp/tvmorph-probe.apk";try{client.push(Files.readAllBytes(Paths.get(args[1])),target,null);client.timeout(60000);String reply=client.shell("pm install -r --user 0 "+target);System.out.println("Install response: "+reply);if(!reply.matches("(?s).*\\bSuccess\\b.*"))throw new Exception("Installation not confirmed");System.out.println(client.shell("am start -n local.tvmorph.tv/.TvActivity"));}finally{client.shell("rm -f "+target);}}
  }
 }
}
