package local.tvmorph.tv;
import java.net.*;import java.io.*;import java.util.*;
/** Local destinations only. Resolution is checked on every request. No redirects. */
final class LanPolicy {
 static boolean local(InetAddress a){byte[] b=a.getAddress();if(a.isLoopbackAddress()||a.isAnyLocalAddress()||a.isMulticastAddress())return false;if(b.length==4){int x=b[0]&255,y=b[1]&255;return x==10||x==192&&y==168||x==172&&y>=16&&y<=31;}return (b[0]&254)==252||a.isLinkLocalAddress();}
 static URI validate(String value)throws IOException{try{if(value==null||value.length()>4096)throw new Exception();URI u=new URI(value);if(!Arrays.asList("http","https").contains(u.getScheme())||u.getHost()==null||u.getUserInfo()!=null||u.getFragment()!=null||u.getPort()==0||u.getPort()>65535)throw new Exception();for(InetAddress a:InetAddress.getAllByName(u.getHost()))if(!local(a))throw new Exception();return u;}catch(Exception e){throw new IOException("Use a local HTTP/HTTPS address on your home network; credentials belong in the password fields.");}}
 static String origin(URI u){return u.getScheme()+"://"+u.getRawAuthority();}
 static boolean sameHost(URI a,URI b){return a.getHost().equalsIgnoreCase(b.getHost());}
}
