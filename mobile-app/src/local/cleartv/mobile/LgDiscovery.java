package local.cleartv.mobile;

import java.net.*;
import java.io.*;
import java.util.*;import java.util.concurrent.*;
import javax.xml.parsers.*;
import org.w3c.dom.*;
import org.json.*;

/** SSDP identification only. No pairing, SSH keys or installation claims. */
final class LgDiscovery {
    static String text(Element device,String tag){NodeList list=device.getElementsByTagName(tag);return list.getLength()==0?"":list.item(0).getTextContent().trim();}
    static JSONObject parse(String xml,String ip)throws Exception {
        // Android's parser does not implement the desktop Xerces DOCTYPE feature.
        // Reject declarations before parsing, and never resolve external entities.
        if(java.util.regex.Pattern.compile("<!\\s*(?:DOCTYPE|ENTITY)",java.util.regex.Pattern.CASE_INSENSITIVE).matcher(xml).find())throw new IOException("DTD declarations are not allowed");
        DocumentBuilderFactory f=DocumentBuilderFactory.newInstance();
        f.setExpandEntityReferences(false);
        DocumentBuilder builder=f.newDocumentBuilder();
        builder.setEntityResolver((publicId,systemId)->{throw new org.xml.sax.SAXException("External entities are not allowed");});
        Document d=builder.parse(new ByteArrayInputStream(xml.getBytes("UTF-8")));
        NodeList devices=d.getElementsByTagName("device");
        for(int i=0;i<devices.getLength();i++){
            Element e=(Element)devices.item(i);String maker=text(e,"manufacturer").toLowerCase(Locale.US);
            String type=text(e,"deviceType"),model=text(e,"modelName"),name=text(e,"friendlyName");
            String declaredOS=text(e,"operatingSystem");if(declaredOS.isEmpty())declaredOS=text(e,"osName");String osVersion=text(e,"osVersion"),firmware=text(e,"softwareVersion");if(firmware.isEmpty())firmware=text(e,"firmwareVersion");String details=(model+" "+name+" "+maker+" "+text(e,"modelDescription")+" "+declaredOS).toLowerCase(Locale.US);boolean fire=details.contains("fire tv")||details.contains("firetv")||details.contains("fire os")||details.contains("fireos");String brand=fire?"android":details.contains("vidaa")?"vidaa":maker.equals("lg")||maker.startsWith("lg electronics")?"lg":details.contains("android")||details.contains("google tv")?"android":maker.contains("samsung")?"samsung":maker.contains("hisense")||maker.contains("sony")||maker.equals("tcl")?"auto":"";if(brand.isEmpty())continue;
            if(!type.contains("MediaRenderer")&&!type.toLowerCase(Locale.US).contains("tv")&&!(type.contains("Basic")&&(details.contains("vidaa")||maker.contains("hisense")&&details.contains("tv"))))continue;
            String system=fire?"Fire OS":brand.equals("vidaa")?"VIDAA":brand.equals("lg")?"webOS":brand.equals("android")?"Android TV":brand.equals("samsung")?"Tizen":"TV";String osLabel=system+(osVersion.isEmpty()?"":" "+osVersion)+(firmware.isEmpty()?"":" · Firmware "+firmware);
            return new JSONObject().put("fireTV",fire).put("systemSource","network").put("osVersion",osVersion).put("firmware",firmware).put("ip",ip).put("brand",brand).put("name",name.isEmpty()?text(e,"manufacturer")+" TV":name).put("model",model).put("os",osLabel).put("developerReady",false).put("hint",brand.equals("vidaa")?"تم اكتشاف VIDAA. نسخة Android APK لا تعمل عليه؛ التثبيت والريموت غير متاحين لهذا النظام حاليًا.":brand.equals("lg")?"تم اكتشاف LG. اختر الشاشة، ثم اربط النسخة الموجودة بالمفتاح أو ثبّت التطبيق من خطوات تجهيز LG.":brand.equals("android")?"تم تحديد Android. نزّل Morph TV وافتحه على الشاشة.":"تم اكتشاف التلفزيون، لكن النظام محتاج تحقق. التطبيق يختار المسار وفق خدمات الجهاز المعلنة.");
        }
        return null;
    }
    static List<JSONObject> discover(String target)throws Exception {
        Map<String,String> locations=new LinkedHashMap<>();
        try(DatagramSocket s=new DatagramSocket()){
            s.setSoTimeout(350);InetAddress host=InetAddress.getByName(target==null?"239.255.255.250":target);
            String[] targets={"urn:schemas-upnp-org:device:MediaRenderer:1","ssdp:all","urn:dial-multiscreen-org:service:dial:1"};
            for(String targetType:targets){String request="M-SEARCH * HTTP/1.1\r\nHOST:239.255.255.250:1900\r\nMAN:\"ssdp:discover\"\r\nMX:2\r\nST:"+targetType+"\r\n\r\n";byte[] data=request.getBytes("US-ASCII");s.send(new DatagramPacket(data,data.length,host,1900));if(target!=null)s.send(new DatagramPacket(data,data.length,InetAddress.getByName("239.255.255.250"),1900));}
            long until=System.currentTimeMillis()+2600;byte[] buf=new byte[8192];
            while(System.currentTimeMillis()<until){try{
                DatagramPacket p=new DatagramPacket(buf,buf.length);s.receive(p);String ip=p.getAddress().getHostAddress();
                if(!Network.local(ip)||(target!=null&&!target.equals(ip)))continue;
                String response=new String(p.getData(),0,p.getLength(),"UTF-8");
                for(String line:response.split("\r?\n"))if(line.toLowerCase(Locale.US).startsWith("location:")){
                    URL url=new URL(line.substring(9).trim());
                    if(url.getProtocol().equals("http")&&url.getHost().equals(ip)&&url.getUserInfo()==null&&locations.size()<24)locations.put(ip+"|"+url.toString(),url.toString());
                }
            }catch(SocketTimeoutException ignored){}}
        }
        List<JSONObject> result=new ArrayList<>();Map<String,JSONObject> accepted=new LinkedHashMap<>();ExecutorService pool=Executors.newFixedThreadPool(4);List<Future<JSONObject>> tasks=new ArrayList<>();
        for(Map.Entry<String,String> location:locations.entrySet())tasks.add(pool.submit(()->{try{String ip=location.getKey().split("\\|",2)[0];return parse(Network.get(location.getValue(),1200),ip);}catch(Exception e){return null;}}));
        long deadline=System.currentTimeMillis()+5000;try{for(Future<JSONObject> task:tasks){long remaining=deadline-System.currentTimeMillis();if(remaining<=0)break;try{JSONObject tv=task.get(remaining,TimeUnit.MILLISECONDS);if(tv!=null){String ip=tv.getString("ip");JSONObject old=accepted.get(ip);if(old==null||old.optString("brand").equals("auto"))accepted.put(ip,tv);}}catch(Exception ignored){}}}finally{pool.shutdownNow();}result.addAll(accepted.values());return result;
    }
}
