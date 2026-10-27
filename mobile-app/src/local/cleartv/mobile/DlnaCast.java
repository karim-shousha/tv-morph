package local.cleartv.mobile;

import java.io.*;
import java.net.*;
import java.util.*;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.*;
import org.json.*;

/** A small UPnP AVTransport controller. Discovery never starts playback. */
final class DlnaCast {
    private static final class Device {
        String id,name,host,type; URL control; long found;
    }
    private static final Map<String,Device> devices=new HashMap<>();
    static boolean privateIP(String host){return host.matches("10\\.(?:[0-9]{1,3}\\.){2}[0-9]{1,3}")||host.matches("192\\.168\\.[0-9]{1,3}\\.[0-9]{1,3}")||host.matches("172\\.(?:1[6-9]|2[0-9]|3[01])\\.[0-9]{1,3}\\.[0-9]{1,3}");}
    static URL localURL(String address,String host)throws Exception{
        URL url=new URL(address);
        if(!"http".equals(url.getProtocol())||!privateIP(url.getHost())||!url.getHost().equals(host)||url.getUserInfo()!=null)throw new IOException("Invalid receiver endpoint");
        return url;
    }
    static String read(InputStream input,int max)throws Exception{
        if(input==null)return "";
        try(InputStream in=input;ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] buffer=new byte[4096];int count;
            while((count=in.read(buffer))!=-1){if(out.size()+count>max)throw new IOException("Receiver response too large");out.write(buffer,0,count);}
            return out.toString("UTF-8");
        }
    }
    static Document xml(String value)throws Exception{
        if(value.toUpperCase(Locale.ROOT).contains("<!DOCTYPE")||value.toUpperCase(Locale.ROOT).contains("<!ENTITY"))throw new IOException("Unsupported XML declaration");
        DocumentBuilderFactory f=DocumentBuilderFactory.newInstance();f.setNamespaceAware(true);f.setExpandEntityReferences(false);
        javax.xml.parsers.DocumentBuilder builder=f.newDocumentBuilder();
        builder.setEntityResolver((publicId,systemId)->{throw new org.xml.sax.SAXException("External entities disabled");});
        return builder.parse(new ByteArrayInputStream(value.getBytes("UTF-8")));
    }
    static String text(Element node,String key){NodeList list=node.getElementsByTagNameNS("*",key);return list.getLength()==0?"":list.item(0).getTextContent().trim();}
    static Device description(URL url,String host)throws Exception{
        HttpURLConnection connection=(HttpURLConnection)url.openConnection();connection.setConnectTimeout(1000);connection.setReadTimeout(1000);connection.setInstanceFollowRedirects(false);
        Document document;
        try{if(connection.getResponseCode()!=200)throw new IOException("Description unavailable");document=xml(read(connection.getInputStream(),256*1024));}finally{connection.disconnect();}
        NodeList candidates=document.getElementsByTagNameNS("*","device");
        for(int n=0;n<candidates.getLength();n++){
            Element device=(Element)candidates.item(n);
            // Only the device's own declared type, not an embedded child's type.
            String kind="";for(Node child=device.getFirstChild();child!=null;child=child.getNextSibling())if(child instanceof Element&&"deviceType".equals(child.getLocalName()))kind=child.getTextContent();
            if(!kind.contains(":MediaRenderer:"))continue;
            NodeList services=device.getElementsByTagNameNS("*","service");
            for(int i=0;i<services.getLength();i++){
                Element service=(Element)services.item(i);String type=text(service,"serviceType");
                if(!type.matches("urn:schemas-upnp-org:service:AVTransport:[1-3]"))continue;
                String base=text(document.getDocumentElement(),"URLBase");URL origin=base.isEmpty()?url:localURL(base,host);
                Device result=new Device();result.host=host;result.name=text(device,"friendlyName");if(result.name.isEmpty())result.name="DLNA · "+host;
                result.type=type;result.control=localURL(new URL(origin,text(service,"controlURL")).toString(),host);
                result.id=UUID.randomUUID().toString();result.found=System.currentTimeMillis();return result;
            }
        }
        throw new IOException("No MediaRenderer AVTransport service");
    }
    static synchronized JSONArray discover()throws Exception{
        devices.clear();Map<String,URL> locations=new LinkedHashMap<>();
        try(DatagramSocket socket=new DatagramSocket()){
            socket.setSoTimeout(350);
            String request="M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: \"ssdp:discover\"\r\nMX: 2\r\nST: urn:schemas-upnp-org:device:MediaRenderer:1\r\n\r\n";
            byte[] bytes=request.getBytes("UTF-8");socket.send(new DatagramPacket(bytes,bytes.length,InetAddress.getByName("239.255.255.250"),1900));
            long end=System.currentTimeMillis()+3000;
            while(System.currentTimeMillis()<end&&locations.size()<8){
                DatagramPacket packet=new DatagramPacket(new byte[8192],8192);
                try{socket.receive(packet);}catch(SocketTimeoutException timeout){continue;}
                String host=packet.getAddress().getHostAddress();if(!privateIP(host))continue;
                String message=new String(packet.getData(),0,packet.getLength(),"UTF-8");if(!message.startsWith("HTTP/1.1 200"))continue;
                for(String line:message.split("\r?\n"))if(line.toLowerCase(Locale.ROOT).startsWith("location:"))try{URL location=localURL(line.substring(9).trim(),host);locations.put(location.toString(),location);}catch(Exception ignored){}
            }
        }
        JSONArray result=new JSONArray();Set<String> endpoints=new HashSet<>();
        for(URL location:locations.values())try{Device device=description(location,location.getHost());if(!endpoints.add(device.control.toString()))continue;devices.put(device.id,device);result.put(new JSONObject().put("id",device.id).put("name",device.name).put("ip",device.host));}catch(Exception ignored){}
        return result;
    }
    static String escape(String value){return value.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;").replace("'","&apos;");}
    static void soap(Device device,String action,String args)throws Exception{
        String body="<?xml version=\"1.0\" encoding=\"utf-8\"?><s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\"><s:Body><u:"+action+" xmlns:u=\""+device.type+"\"><InstanceID>0</InstanceID>"+args+"</u:"+action+"></s:Body></s:Envelope>";
        byte[] bytes=body.getBytes("UTF-8");HttpURLConnection connection=(HttpURLConnection)device.control.openConnection();
        connection.setConnectTimeout(2500);connection.setReadTimeout(4000);connection.setInstanceFollowRedirects(false);connection.setRequestMethod("POST");connection.setDoOutput(true);connection.setFixedLengthStreamingMode(bytes.length);
        connection.setRequestProperty("Content-Type","text/xml; charset=\"utf-8\"");connection.setRequestProperty("SOAPAction","\""+device.type+"#"+action+"\"");
        try{try(OutputStream out=connection.getOutputStream()){out.write(bytes);}int status=connection.getResponseCode();String response=read(status>=400?connection.getErrorStream():connection.getInputStream(),128*1024);
            if(status<200||status>=300||response.contains(":Fault")||response.contains("<Fault")){
                String code="";try{code=text(xml(response).getDocumentElement(),"errorCode");}catch(Exception ignored){}
                throw new IOException(action+" rejected by receiver"+(code.isEmpty()?" (HTTP "+status+")":" (UPnP "+code+")"));
            }
        }finally{connection.disconnect();}
    }
    private static Device device(String id)throws Exception{Device d=devices.get(id);if(d==null||System.currentTimeMillis()-d.found>600000)throw new IOException("Scan and select the receiver again");return d;}
    static synchronized JSONObject send(String id,String address,String kind)throws Exception{
        Device d=device(id);if(address.length()>8192)throw new IOException("Media URL too long");URL media=new URL(address);
        if(!Arrays.asList("http","https").contains(media.getProtocol())||media.getHost().isEmpty()||media.getUserInfo()!=null)throw new IOException("Use a direct HTTP/HTTPS media URL without login credentials");
        boolean audio="audio".equals(kind);String mime=audio?"audio/mpeg":"video/mp4",file=media.getPath().toLowerCase(Locale.ROOT);
        if(file.endsWith(".m3u8"))mime="application/vnd.apple.mpegurl";else if(file.endsWith(".ts"))mime="video/mp2t";else if(file.endsWith(".aac"))mime="audio/aac";
        String metadata="<DIDL-Lite xmlns=\"urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:upnp=\"urn:schemas-upnp-org:metadata-1-0/upnp/\"><item id=\"0\" parentID=\"-1\" restricted=\"1\"><dc:title>Morph TV media</dc:title><upnp:class>object.item."+(audio?"audioItem.musicTrack":"videoItem")+"</upnp:class><res protocolInfo=\"http-get:*:"+mime+":*\">"+escape(address)+"</res></item></DIDL-Lite>";
        soap(d,"SetAVTransportURI","<CurrentURI>"+escape(address)+"</CurrentURI><CurrentURIMetaData>"+escape(metadata)+"</CurrentURIMetaData>");
        soap(d,"Play","<Speed>1</Speed>");
        return new JSONObject().put("accepted",true);
    }
    static synchronized JSONObject control(String id,String action)throws Exception{
        if(!Arrays.asList("Play","Pause","Stop").contains(action))throw new IOException("Unsupported DLNA control");
        soap(device(id),action,"Play".equals(action)?"<Speed>1</Speed>":"");return new JSONObject().put("accepted",true);
    }
}
