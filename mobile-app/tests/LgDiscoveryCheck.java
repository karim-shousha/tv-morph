package local.cleartv.mobile;
import org.json.*;
public class LgDiscoveryCheck {
    static String xml(String maker,String type){return "<root><device><deviceType>urn:schemas-upnp-org:device:"+type+":1</deviceType><manufacturer>"+maker+"</manufacturer><modelName>OLED TEST</modelName><friendlyName>Living room</friendlyName></device></root>";}
    public static void main(String[] args)throws Exception{
        JSONObject tv=LgDiscovery.parse(xml("LG Electronics","MediaRenderer"),"10.0.0.42");
        if(tv==null||!tv.getString("brand").equals("lg")||!tv.getString("name").equals("Living room")||tv.getBoolean("developerReady"))throw new Exception("LG parsing failed");
        if(LgDiscovery.parse(xml("Acme","MediaRenderer"),"10.0.0.42")!=null)throw new Exception("Wrong manufacturer accepted");
        if(LgDiscovery.parse(xml("LG Electronics","MediaServer"),"10.0.0.42")!=null)throw new Exception("Non-renderer accepted");
        JSONObject vidaa=LgDiscovery.parse(xml("Hisense","Basic").replace("OLED TEST","VIDAA Smart TV"),"10.0.0.43");if(vidaa==null||!vidaa.optString("brand").equals("vidaa")||vidaa.optBoolean("developerReady"))throw new Exception("VIDAA misclassified");JSONObject ambiguous=LgDiscovery.parse(xml("Hisense","MediaRenderer"),"10.0.0.44");if(ambiguous==null||!ambiguous.optString("brand").equals("auto"))throw new Exception("Hisense assumed Android");
        JSONObject versioned=LgDiscovery.parse(xml("Hisense","MediaRenderer").replace("</device>","<operatingSystem>VIDAA</operatingSystem><osVersion>9</osVersion><softwareVersion>Q0623</softwareVersion></device>"),"10.0.0.45");if(!versioned.optString("brand").equals("vidaa")||!versioned.optString("os").contains("9")||!versioned.optString("firmware").equals("Q0623"))throw new Exception("Advertised OS/firmware not read");
        boolean rejected=false;try{LgDiscovery.parse("<!DOCTYPE root [<!ENTITY x SYSTEM 'file:///etc/hosts'>]>"+xml("LG Electronics","MediaRenderer"),"10.0.0.42");}catch(Exception expected){rejected=true;}
        if(!rejected)throw new Exception("DOCTYPE accepted");
        System.out.println("PASS: Android LG descriptor parsing, brand/device filtering, unconfirmed readiness and DOCTYPE rejection.");
    }
}
