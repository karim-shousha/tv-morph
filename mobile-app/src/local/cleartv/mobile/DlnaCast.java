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
        String id,name,host,type,renderType; URL control,renderControl; long found;
        Boolean seekOk,volumeOk;
    }
    private static final Map<String,Device> devices=new HashMap<>();
    static boolean octet(String s){if(s.isEmpty()||s.length()>3)return false;for(int i=0;i<s.length();i++)if(!Character.isDigit(s.charAt(i)))return false;try{int v=Integer.parseInt(s);return v>=0&&v<=255&&!(s.length()>1&&s.charAt(0)=='0');}catch(NumberFormatException e){return false;}}
    static boolean privateIP(String host){if(host==null)return false;String[] p=host.split("\\.",-1);if(p.length==4){if(!octet(p[0])||!octet(p[1])||!octet(p[2])||!octet(p[3]))return false;int a=Integer.parseInt(p[0]),b=Integer.parseInt(p[1]);return a==10||(a==192&&b==168)||(a==172&&b>=16&&b<=31);}return false;}
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
        HttpURLConnection connection=(HttpURLConnection)url.openConnection();connection.setConnectTimeout(2500);connection.setReadTimeout(4000);connection.setInstanceFollowRedirects(false);
        Document document;
        try{if(connection.getResponseCode()!=200)throw new IOException("Description unavailable");document=xml(read(connection.getInputStream(),256*1024));}finally{connection.disconnect();}
        NodeList candidates=document.getElementsByTagNameNS("*","device");
        for(int n=0;n<candidates.getLength();n++){
            Element device=(Element)candidates.item(n);
            // Only the device's own declared type, not an embedded child's type.
            String kind="";for(Node child=device.getFirstChild();child!=null;child=child.getNextSibling())if(child instanceof Element&&"deviceType".equals(child.getLocalName()))kind=child.getTextContent();
            if(!kind.contains(":MediaRenderer:"))continue;
            NodeList services=device.getElementsByTagNameNS("*","service");
                Device result=null;
                String base=text(document.getDocumentElement(),"URLBase");URL origin=base.isEmpty()?url:localURL(base,host);
                for(int i=0;i<services.getLength();i++){
                    Element service=(Element)services.item(i);String type=text(service,"serviceType");
                    if(type.matches("urn:schemas-upnp-org:service:AVTransport:[1-9][0-9]*")){
                        if(result==null){result=new Device();result.host=host;result.name=text(device,"friendlyName");if(result.name.isEmpty())result.name="DLNA · "+host;}
                        result.type=type;result.control=localURL(new URL(origin,text(service,"controlURL")).toString(),host);
                    }else if(type.matches("urn:schemas-upnp-org:service:RenderingControl:[1-9][0-9]*")){
                        if(result==null){result=new Device();result.host=host;result.name=text(device,"friendlyName");if(result.name.isEmpty())result.name="DLNA · "+host;}
                        try{result.renderControl=localURL(new URL(origin,text(service,"controlURL")).toString(),host);result.renderType=type;}catch(Exception ignored){}
                    }
                }
                if(result==null||result.control==null)continue;
                result.id=UUID.randomUUID().toString();result.found=System.currentTimeMillis();return result;
        }
        throw new IOException("No MediaRenderer AVTransport service");
    }
    static synchronized JSONArray discover()throws Exception{
        devices.clear();Map<String,URL> locations=new LinkedHashMap<>();
        try(DatagramSocket socket=new DatagramSocket()){
            socket.setSoTimeout(350);
            String request="M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: \"ssdp:discover\"\r\nMX: 2\r\nST: urn:schemas-upnp-org:device:MediaRenderer:1\r\n\r\n";
            String request2=request.replace("MediaRenderer:1","MediaRenderer:2");
            byte[] bytes=request.getBytes("UTF-8"),bytes2=request2.getBytes("UTF-8");socket.send(new DatagramPacket(bytes,bytes.length,InetAddress.getByName("239.255.255.250"),1900));socket.send(new DatagramPacket(bytes2,bytes2.length,InetAddress.getByName("239.255.255.250"),1900));
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
    static String soap(Device device,String action,String args)throws Exception{
        String body="<?xml version=\"1.0\" encoding=\"utf-8\"?><s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\"><s:Body><u:"+action+" xmlns:u=\""+device.type+"\"><InstanceID>0</InstanceID>"+args+"</u:"+action+"></s:Body></s:Envelope>";
        byte[] bytes=body.getBytes("UTF-8");HttpURLConnection connection=(HttpURLConnection)device.control.openConnection();
        connection.setConnectTimeout(2500);connection.setReadTimeout(4000);connection.setInstanceFollowRedirects(false);connection.setRequestMethod("POST");connection.setDoOutput(true);connection.setFixedLengthStreamingMode(bytes.length);
        connection.setRequestProperty("Content-Type","text/xml; charset=\"utf-8\"");connection.setRequestProperty("SOAPAction","\""+device.type+"#"+action+"\"");
        try{try(OutputStream out=connection.getOutputStream()){out.write(bytes);}int status=connection.getResponseCode();String response=read(status>=400?connection.getErrorStream():connection.getInputStream(),128*1024);
            if(status<200||status>=300||response.contains(":Fault")||response.contains("<Fault")){
                String code="";try{code=text(xml(response).getDocumentElement(),"errorCode");}catch(Exception ignored){}
                throw new IOException(action+" rejected by receiver"+(code.isEmpty()?" (HTTP "+status+")":" (UPnP "+code+")"));
            }
            return response;
        }finally{connection.disconnect();}
    }
    private static Device device(String id)throws Exception{Device d=devices.get(id);if(d==null||System.currentTimeMillis()-d.found>600000)throw new IOException("Scan and select the receiver again");return d;}
    static synchronized JSONObject connect(String id)throws Exception {
        Device d=device(id);soap(d,"GetTransportInfo","");d.found=System.currentTimeMillis();return new JSONObject().put("connected",true);
    }
    static synchronized String host(String id)throws Exception{return device(id).host;}
    static synchronized JSONObject send(String id,String address,String kind)throws Exception{return send(id,address,kind,"","Morph TV media");}
    static synchronized JSONObject send(String id,String address,String kind,String contentType,String title)throws Exception{
        Device d=device(id);if(address.length()>8192)throw new IOException("Media URL too long");URL media=new URL(address);
        if(!Arrays.asList("http","https").contains(media.getProtocol())||media.getHost().isEmpty()||media.getUserInfo()!=null)throw new IOException("Use a direct HTTP/HTTPS media URL without login credentials");
        boolean audio="audio".equals(kind);String mime=audio?"audio/mpeg":"image".equals(kind)?"image/jpeg":"video/mp4",file=media.getPath().toLowerCase(Locale.ROOT);
        if(file.endsWith(".m3u8"))mime="application/vnd.apple.mpegurl";else if(file.endsWith(".ts"))mime="video/mp2t";else if(file.endsWith(".aac"))mime="audio/aac";
        if(contentType.matches("(?:audio|video|image)/[a-zA-Z0-9.+-]+"))mime=contentType;
        String itemClass=audio?"audioItem.musicTrack":"image".equals(kind)?"imageItem.photo":"videoItem";
        String metadata="<DIDL-Lite xmlns=\"urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:upnp=\"urn:schemas-upnp-org:metadata-1-0/upnp/\"><item id=\"0\" parentID=\"-1\" restricted=\"1\"><dc:title>"+escape(title)+"</dc:title><upnp:class>object.item."+itemClass+"</upnp:class><res protocolInfo=\"http-get:*:"+mime+":*\">"+escape(address)+"</res></item></DIDL-Lite>";
        soap(d,"SetAVTransportURI","<CurrentURI>"+escape(address)+"</CurrentURI><CurrentURIMetaData>"+escape(metadata)+"</CurrentURIMetaData>");
        // Some renderers acknowledge SetURI before leaving TRANSITIONING.
        // Wait for that state to settle instead of immediately sending an invalid Play.
        for(int attempt=0;attempt<4;attempt++){
            String transport;
            try{transport=text(xml(soap(d,"GetTransportInfo","")).getDocumentElement(),"CurrentTransportState");}catch(Exception unsupported){break;}
            if(!transport.equals("TRANSITIONING"))break;
            Thread.sleep(250);
        }
        soap(d,"Play","<Speed>1</Speed>");d.found=System.currentTimeMillis();
        return new JSONObject().put("accepted",true);
    }
    static synchronized JSONObject control(String id,String action)throws Exception{
        if(!Arrays.asList("Play","Pause","Stop").contains(action))throw new IOException("Unsupported DLNA control");
        Device d=device(id);soap(d,action,"Play".equals(action)?"<Speed>1</Speed>":"");d.found=System.currentTimeMillis();return new JSONObject().put("accepted",true);
    }
    static String rcSoap(Device d,String action,String args)throws Exception{
        if(d.renderControl==null||d.renderType==null)throw new IOException("Volume control is not supported by this receiver");
        String body="<?xml version=\"1.0\" encoding=\"utf-8\"?><s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\"><s:Body><u:"+action+" xmlns:u=\""+d.renderType+"\"><InstanceID>0</InstanceID><Channel>Master</Channel>"+args+"</u:"+action+"></s:Body></s:Envelope>";
        byte[] bytes=body.getBytes("UTF-8");HttpURLConnection connection=(HttpURLConnection)d.renderControl.openConnection();
        connection.setConnectTimeout(2500);connection.setReadTimeout(4000);connection.setInstanceFollowRedirects(false);connection.setRequestMethod("POST");connection.setDoOutput(true);connection.setFixedLengthStreamingMode(bytes.length);
        connection.setRequestProperty("Content-Type","text/xml; charset=\"utf-8\"");connection.setRequestProperty("SOAPAction","\""+d.renderType+"#"+action+"\"");
        try{try(OutputStream out=connection.getOutputStream()){out.write(bytes);}int status=connection.getResponseCode();String response=read(status>=400?connection.getErrorStream():connection.getInputStream(),128*1024);
            if(status<200||status>=300||response.contains(":Fault")||response.contains("<Fault>"))throw new IOException(action+" not supported by this receiver (HTTP "+status+")");
            return response;
        }finally{connection.disconnect();}
    }
    static String relTime(long seconds){if(seconds<0)seconds=0;long h=seconds/3600,m=(seconds%3600)/60,s=seconds%60;return String.format(Locale.ROOT,"%02d:%02d:%02d",h,m,s);}
    static long parseTime(String value){try{String[] p=value.split(":");if(p.length!=3)return -1;return Long.parseLong(p[0])*3600+Long.parseLong(p[1])*60+Long.parseLong(p[2]);}catch(Exception e){return -1;}}
    /** Capability probe: Seek via CurrentTransportActions, volume via RenderingControl presence + GetVolume. Cached per device. */
    static synchronized JSONObject caps(String id)throws Exception{
        Device d=device(id);
        if(d.seekOk==null){
            boolean seek=false;
            try{String actions=text(xml(soap(d,"GetCurrentTransportActions","")).getDocumentElement(),"Actions");
                for(String a:actions.split(","))if(a.trim().equalsIgnoreCase("Seek"))seek=true;
            }catch(Exception ignored){}
            d.seekOk=seek;
        }
        if(d.volumeOk==null){
            boolean volume=false;
            if(d.renderControl!=null){try{String v=text(xml(rcSoap(d,"GetVolume","")).getDocumentElement(),"CurrentVolume");int level=Integer.parseInt(v.trim());volume=level>=0&&level<=100;}catch(Exception ignored){}}
            d.volumeOk=volume;
        }
        d.found=System.currentTimeMillis();
        return new JSONObject().put("seek",d.seekOk).put("volume",d.volumeOk);
    }
    static synchronized JSONObject position(String id)throws Exception{
        Device d=device(id);String response=soap(d,"GetPositionInfo","");
        Element root=xml(response).getDocumentElement();
        long rel=parseTime(text(root,"RelTime")),dur=parseTime(text(root,"TrackDuration"));
        String state="";try{state=text(xml(soap(d,"GetTransportInfo","")).getDocumentElement(),"CurrentTransportState");}catch(Exception ignored){}
        d.found=System.currentTimeMillis();
        return new JSONObject().put("position",rel).put("duration",dur).put("state",state);
    }
    static synchronized JSONObject seek(String id,long seconds)throws Exception{
        Device d=device(id);
        if(d.seekOk!=null&&!d.seekOk)throw new IOException("Seek is not supported by this receiver");
        try{soap(d,"Seek","<Unit>REL_TIME</Unit><Target>"+relTime(seconds)+"</Target>");}
        catch(Exception e){d.seekOk=false;throw new IOException("Seek is not supported by this receiver");}
        d.found=System.currentTimeMillis();return new JSONObject().put("accepted",true).put("target",seconds);
    }
    static synchronized JSONObject volume(String id,int level)throws Exception{
        Device d=device(id);if(level<0)level=0;if(level>100)level=100;
        try{rcSoap(d,"SetVolume","<DesiredVolume>"+level+"</DesiredVolume>");}
        catch(Exception e){d.volumeOk=false;throw e;}
        d.found=System.currentTimeMillis();return new JSONObject().put("accepted",true).put("volume",level);
    }
    static synchronized JSONObject mute(String id,boolean on)throws Exception{
        Device d=device(id);
        try{rcSoap(d,"SetMute","<DesiredMute>"+(on?"1":"0")+"</DesiredMute>");}
        catch(Exception e){d.volumeOk=false;throw e;}
        d.found=System.currentTimeMillis();return new JSONObject().put("accepted",true).put("mute",on);
    }
}
