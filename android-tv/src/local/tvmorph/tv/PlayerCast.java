package local.tvmorph.tv;

import android.app.*;
import android.content.*;
import android.net.wifi.WifiManager;
import android.os.*;
import android.widget.Toast;
import java.io.*;
import java.net.*;
import java.util.*;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.*;

/** Direct, local-network DLNA hand-off for a player URL. It never exposes a media URL outside the chosen renderer. */
final class PlayerCast {
  private static final class Receiver {String name,service,control;}
  private PlayerCast(){}
  static void open(Activity activity,String mediaUrl,String title){
    final ProgressDialog wait=ProgressDialog.show(activity,"Cast",UiSettings.text(activity,"جاري البحث عن شاشات على نفس الشبكة…","Searching for receivers on this network…"),true,false);
    new Thread(()->{List<Receiver> found;String failure=null;WifiManager.MulticastLock lock=null;
      try{WifiManager wifi=(WifiManager)activity.getApplicationContext().getSystemService(Context.WIFI_SERVICE);if(wifi!=null){lock=wifi.createMulticastLock("morph-player-cast");lock.setReferenceCounted(false);lock.acquire();}found=discover();}
      catch(Exception e){found=Collections.emptyList();failure=e.getMessage();}
      finally{if(lock!=null&&lock.isHeld())lock.release();}
      final List<Receiver> receivers=found;final String message=failure;
      activity.runOnUiThread(()->{if(activity.isFinishing())return;wait.dismiss();if(receivers.isEmpty()){Toast.makeText(activity,message==null?UiSettings.text(activity,"لم نجد شاشة DLNA. تأكد أن الهاتف والشاشة على نفس الواي فاي وأن المشاركة مفعلة.","No DLNA receiver found. Put both devices on the same Wi-Fi and enable media sharing."):message,Toast.LENGTH_LONG).show();return;}String[] names=new String[receivers.size()];for(int i=0;i<names.length;i++)names[i]=receivers.get(i).name;new AlertDialog.Builder(activity).setTitle(UiSettings.text(activity,"اختار شاشة للكاست","Choose a screen to cast to")).setItems(names,(d,index)->send(activity,receivers.get(index),mediaUrl,title)).setNegativeButton(UiSettings.text(activity,"إلغاء","Cancel"),null).show();});
    },"morph-cast-discovery").start();
  }
  private static List<Receiver> discover()throws Exception{
    LinkedHashMap<String,String> locations=new LinkedHashMap<>();try(DatagramSocket socket=new DatagramSocket()){
      socket.setSoTimeout(350);String query="M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: \"ssdp:discover\"\r\nMX: 2\r\nST: urn:schemas-upnp-org:device:MediaRenderer:1\r\n\r\n";byte[] request=query.getBytes("UTF-8");socket.send(new DatagramPacket(request,request.length,InetAddress.getByName("239.255.255.250"),1900));long end=System.currentTimeMillis()+3200;
      while(System.currentTimeMillis()<end&&locations.size()<8){DatagramPacket packet=new DatagramPacket(new byte[8192],8192);try{socket.receive(packet);}catch(SocketTimeoutException e){continue;}String host=packet.getAddress().getHostAddress();if(!privateAddress(host))continue;String data=new String(packet.getData(),0,packet.getLength(),"UTF-8");if(!data.startsWith("HTTP/1.1 200"))continue;for(String line:data.split("\\r?\\n"))if(line.regionMatches(true,0,"location:",0,9)){String location=line.substring(9).trim();if(safeHttp(location))locations.put(location,host);}}
    }
    ArrayList<Receiver> result=new ArrayList<>();HashSet<String> controls=new HashSet<>();for(Map.Entry<String,String> e:locations.entrySet())try{Receiver r=describe(e.getKey(),e.getValue());if(r!=null&&controls.add(r.control))result.add(r);}catch(Exception ignored){}return result;
  }
  private static Receiver describe(String location,String host)throws Exception{
    HttpURLConnection c=(HttpURLConnection)new URL(location).openConnection();c.setConnectTimeout(2500);c.setReadTimeout(4000);c.setInstanceFollowRedirects(false);String raw;try{if(c.getResponseCode()!=200)return null;raw=read(c.getInputStream(),256*1024);}finally{c.disconnect();}Document doc=xml(raw);NodeList devices=doc.getElementsByTagNameNS("*","device");for(int x=0;x<devices.getLength();x++){Element device=(Element)devices.item(x);String type=child(device,"deviceType");if(!type.contains(":MediaRenderer:"))continue;NodeList services=device.getElementsByTagNameNS("*","service");for(int i=0;i<services.getLength();i++){Element s=(Element)services.item(i);String service=child(s,"serviceType");if(!service.matches("urn:schemas-upnp-org:service:AVTransport:[1-9][0-9]*"))continue;String path=child(s,"controlURL");URL endpoint=new URL(new URL(location),path);if(!endpoint.getHost().equals(host)||!safeHttp(endpoint.toString()))continue;Receiver r=new Receiver();r.name=child(device,"friendlyName");if(r.name.isEmpty())r.name="DLNA · "+host;r.service=service;r.control=endpoint.toString();return r;}}
    return null;
  }
  private static void send(Activity activity,Receiver receiver,String address,String title){
    final ProgressDialog wait=ProgressDialog.show(activity,"Cast",UiSettings.text(activity,"جاري إرسال البث إلى الشاشة…","Sending stream to the selected screen…"),true,false);new Thread(()->{String problem=null;try{if(!safeHttp(address))throw new IOException("Cast needs a direct HTTP/HTTPS stream URL.");String meta="<DIDL-Lite xmlns=\"urn:schemas-upnp-org:metadata-1-0/DIDL-Lite\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:upnp=\"urn:schemas-upnp-org:metadata-1-0/upnp/\"><item id=\"0\" parentID=\"-1\" restricted=\"1\"><dc:title>"+escape(title)+"</dc:title><upnp:class>object.item.videoItem</upnp:class><res protocolInfo=\"http-get:*:application/vnd.apple.mpegurl:*\">"+escape(address)+"</res></item></DIDL-Lite>";soap(receiver,"SetAVTransportURI","<CurrentURI>"+escape(address)+"</CurrentURI><CurrentURIMetaData>"+escape(meta)+"</CurrentURIMetaData>");soap(receiver,"Play","<Speed>1</Speed>");}catch(Exception e){problem=e.getMessage();}final String error=problem;activity.runOnUiThread(()->{if(activity.isFinishing())return;wait.dismiss();Toast.makeText(activity,error==null?UiSettings.text(activity,"بدأ البث على الشاشة المختارة.","Playback started on the selected screen."):error,Toast.LENGTH_LONG).show();});},"morph-cast-send").start();}
  private static void soap(Receiver receiver,String action,String arguments)throws Exception{String body="<?xml version=\"1.0\"?><s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\"><s:Body><u:"+action+" xmlns:u=\""+receiver.service+"\"><InstanceID>0</InstanceID>"+arguments+"</u:"+action+"></s:Body></s:Envelope>";byte[] bytes=body.getBytes("UTF-8");HttpURLConnection c=(HttpURLConnection)new URL(receiver.control).openConnection();c.setConnectTimeout(2500);c.setReadTimeout(7000);c.setInstanceFollowRedirects(false);c.setRequestMethod("POST");c.setDoOutput(true);c.setFixedLengthStreamingMode(bytes.length);c.setRequestProperty("Content-Type","text/xml; charset=utf-8");c.setRequestProperty("SOAPAction","\""+receiver.service+"#"+action+"\"");try{try(OutputStream out=c.getOutputStream()){out.write(bytes);}int code=c.getResponseCode();if(code<200||code>=300)throw new IOException(action+" rejected by receiver (HTTP "+code+").");}finally{c.disconnect();}}
  private static boolean safeHttp(String value){try{URL u=new URL(value);return ("http".equals(u.getProtocol())||"https".equals(u.getProtocol()))&&u.getHost()!=null&&!u.getHost().isEmpty()&&u.getUserInfo()==null;}catch(Exception e){return false;}}
  private static boolean privateAddress(String host){String[] p=host.split("\\.",-1);if(p.length!=4)return false;try{int a=Integer.parseInt(p[0]),b=Integer.parseInt(p[1]),c=Integer.parseInt(p[2]),d=Integer.parseInt(p[3]);if(a<0||a>255||b<0||b>255||c<0||c>255||d<0||d>255)return false;return a==10||(a==192&&b==168)||(a==172&&b>=16&&b<=31);}catch(Exception e){return false;}}
  private static String child(Element parent,String name){NodeList children=parent.getElementsByTagNameNS("*",name);return children.getLength()==0?"":children.item(0).getTextContent().trim();}
  private static Document xml(String text)throws Exception{if(text.toUpperCase(Locale.ROOT).contains("<!DOCTYPE")||text.toUpperCase(Locale.ROOT).contains("<!ENTITY"))throw new IOException("Unsupported receiver description");DocumentBuilderFactory f=DocumentBuilderFactory.newInstance();f.setNamespaceAware(true);f.setExpandEntityReferences(false);DocumentBuilder b=f.newDocumentBuilder();b.setEntityResolver((publicId,systemId)->{throw new org.xml.sax.SAXException("External entities disabled");});return b.parse(new ByteArrayInputStream(text.getBytes("UTF-8")));}
  private static String read(InputStream in,int limit)throws Exception{try(InputStream input=in;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[4096];int count;while((count=input.read(buffer))!=-1){if(out.size()+count>limit)throw new IOException("Receiver response is too large");out.write(buffer,0,count);}return out.toString("UTF-8");}}
  private static String escape(String value){return value==null?"":value.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;").replace("'","&apos;");}
}
