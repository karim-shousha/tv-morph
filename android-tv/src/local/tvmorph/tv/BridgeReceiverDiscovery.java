package local.tvmorph.tv;

import android.content.Context;
import android.net.wifi.WifiManager;
import java.net.DatagramPacket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.MulticastSocket;
import java.nio.charset.StandardCharsets;

/** Respond only while the receiver Activity is visible; manual pairing remains available. */
final class BridgeReceiverDiscovery implements AutoCloseable {
    static final String TARGET="urn:morph-tv-com:device:BridgeReceiver:1";
    private final Context context;
    private volatile boolean running;
    private volatile MulticastSocket socket;
    BridgeReceiverDiscovery(Context context){this.context=context.getApplicationContext();}
    void start(){running=true;new Thread(this::listen,"MorphBridgeDiscovery").start();}
    private void listen(){
        WifiManager.MulticastLock lock=null;
        MulticastSocket active=null;
        try{
            WifiManager wifi=(WifiManager)context.getSystemService(Context.WIFI_SERVICE);
            if(wifi!=null){lock=wifi.createMulticastLock("morph-bridge-receiver");lock.setReferenceCounted(false);lock.acquire();}
            active=new MulticastSocket(null);socket=active;
            if(!running)return;
            active.setReuseAddress(true);active.bind(new InetSocketAddress(1900));active.setSoTimeout(1000);
            String localIp=BridgeReceiverActivity.localIp();
            if(!localIp.isEmpty()){
                java.net.NetworkInterface lan=java.net.NetworkInterface.getByInetAddress(InetAddress.getByName(localIp));
                if(lan!=null)active.setNetworkInterface(lan);
            }
            active.joinGroup(InetAddress.getByName("239.255.255.250"));
            byte[] buffer=new byte[4096];
            while(running){
                try{
                    DatagramPacket packet=new DatagramPacket(buffer,buffer.length);active.receive(packet);
                    String query=new String(packet.getData(),0,packet.getLength(),StandardCharsets.UTF_8);
                    String ip=BridgeReceiverActivity.localIp();
                    if(!query.startsWith("M-SEARCH")||!query.toLowerCase(java.util.Locale.ROOT).contains(TARGET.toLowerCase(java.util.Locale.ROOT))||ip.isEmpty())continue;
                    byte[] response=("HTTP/1.1 200 OK\r\nCACHE-CONTROL: max-age=30\r\nEXT:\r\nST: "+TARGET+"\r\nUSN: uuid:morph-bridge-"+ip+"::"+TARGET+"\r\nSERVER: Android UPnP/1.0 MorphBridge/0.7.0\r\n\r\n").getBytes(StandardCharsets.UTF_8);
                    active.send(new DatagramPacket(response,response.length,packet.getAddress(),packet.getPort()));
                }catch(java.net.SocketTimeoutException ignored){}
            }
        }catch(Exception ignored){}finally{if(active!=null)active.close();if(lock!=null&&lock.isHeld())lock.release();}
    }
    @Override public void close(){running=false;MulticastSocket active=socket;if(active!=null)active.close();}
}
