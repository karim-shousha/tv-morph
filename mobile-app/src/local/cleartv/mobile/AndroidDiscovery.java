package local.cleartv.mobile;
import android.content.Context;import android.net.nsd.*;import java.util.*;import java.util.concurrent.*;import org.json.*;
/** Android TV Remote v2 mDNS service identifies the platform before our APK exists. */
final class AndroidDiscovery{
 static List<JSONObject> discover(Context context)throws Exception{
  NsdManager manager=(NsdManager)context.getSystemService(Context.NSD_SERVICE);List<JSONObject> found=Collections.synchronizedList(new ArrayList<>());Set<String> names=Collections.synchronizedSet(new HashSet<>());CountDownLatch ended=new CountDownLatch(1);ExecutorService resolver=Executors.newSingleThreadExecutor();
  NsdManager.DiscoveryListener listener=new NsdManager.DiscoveryListener(){
   public void onDiscoveryStarted(String type){}public void onDiscoveryStopped(String type){ended.countDown();}public void onStartDiscoveryFailed(String type,int error){ended.countDown();}public void onStopDiscoveryFailed(String type,int error){ended.countDown();}public void onServiceLost(NsdServiceInfo info){}
   public void onServiceFound(NsdServiceInfo service){if(!names.add(service.getServiceName()))return;resolver.submit(()->{CountDownLatch resolved=new CountDownLatch(1);try{manager.resolveService(service,new NsdManager.ResolveListener(){public void onResolveFailed(NsdServiceInfo s,int error){resolved.countDown();}public void onServiceResolved(NsdServiceInfo info){try{String ip=info.getHost().getHostAddress();if(!Network.local(ip))return;found.add(new JSONObject().put("ip",ip).put("brand","android").put("name",info.getServiceName()).put("model","Android TV Remote service").put("os","Android / Google TV · الإصدار غير معلن").put("developerReady",false).put("hint","تم تحديد Android TV من خدمة الشبكة. نزّل Morph TV وافتحه على الشاشة، ثم اربط بالكود."));}catch(Exception ignored){}finally{resolved.countDown();}}});resolved.await(1200,TimeUnit.MILLISECONDS);}catch(Exception ignored){}});}
  };
  manager.discoverServices("_androidtvremote2._tcp.",NsdManager.PROTOCOL_DNS_SD,listener);try{ended.await(4,TimeUnit.SECONDS);}finally{try{manager.stopServiceDiscovery(listener);}catch(Exception ignored){}resolver.shutdownNow();}synchronized(found){return new ArrayList<>(found);}
 }
}
