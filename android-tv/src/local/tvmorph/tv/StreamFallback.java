package local.tvmorph.tv;
import java.net.URI;import java.util.*;
/** Alternate only the provider live container; never guess movie/episode extensions. */
final class StreamFallback {
 static List<String> sources(String address,boolean live){List<String> out=new ArrayList<>();try{URI uri=new URI(address);if(!Arrays.asList("http","https").contains(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null)return out;out.add(address);String path=uri.getRawPath();if(live&&path!=null&&path.matches("(?i).*/live/[^/]+/[^/]+/[0-9]{1,14}\\.(ts|m3u8)")){int query=address.indexOf('?'),fragment=address.indexOf('#'),end=query>=0?query:fragment>=0?fragment:address.length();String main=address.substring(0,end),suffix=address.substring(end);int dot=main.lastIndexOf('.');out.add(main.substring(0,dot)+(main.substring(dot).equalsIgnoreCase(".ts")?".m3u8":".ts")+suffix);}}catch(Exception ignored){}return out;}
 static String category(int what,int extra){if(extra==-1010)return "unsupported";if(extra==-1007)return "malformed";if(extra==-1001||extra==-1002||extra==-1003||extra==-1004||extra==-1005||extra==-110)return "network";if(what==100)return "engine";return "unknown";}
}
