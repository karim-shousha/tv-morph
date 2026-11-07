package local.tvmorph.tv;
import java.net.URI;import java.util.*;
/** Bounded private provider playback hints. Never serialized into the catalog/UI. */
final class ProviderPlayback {
 private static final long TTL=300000;private static final int LIMIT=512;
 private static final class Hint{String ext,direct;long at;Hint(String e,String d,long n){ext=e;direct=d;at=n;}}
 private final LinkedHashMap<String,Hint> hints=new LinkedHashMap<>();
 static String extension(String raw){String v=raw==null?"":raw.trim().toLowerCase(Locale.US);if(v.startsWith("."))v=v.substring(1);return v.matches("[a-z0-9]{1,8}")&&!Arrays.asList("null","none","undefined").contains(v)?v:"";}
 static String direct(String base,String raw){if(raw==null||raw.length()>4096||raw.trim().isEmpty()||Arrays.asList("null","undefined","none","n/a","false","0").contains(raw.trim().toLowerCase(Locale.US)))return "";try{URI u=new URI(base+"/").resolve(raw.trim().replace(" ","%20"));if(!Arrays.asList("http","https").contains(u.getScheme())||u.getHost()==null||u.getUserInfo()!=null||u.getFragment()!=null||u.getRawPath()==null||u.getRawPath().isEmpty())return "";return u.toASCIIString();}catch(Exception e){return "";}}
 synchronized void put(String base,String kind,String id,String ext,String direct,long now){if(!Arrays.asList("vod","episode").contains(kind)||!id.matches("[0-9]{1,14}"))return;String e=extension(ext),d=direct(base,direct),key=kind+":"+id;hints.remove(key);if(e.isEmpty()&&d.isEmpty())return;hints.put(key,new Hint(e,d,now));while(hints.size()>LIMIT)hints.remove(hints.keySet().iterator().next());}
 private Hint get(String key,long now){Hint h=hints.get(key);if(h!=null&&(now<h.at||now-h.at>=TTL)){hints.remove(key);return null;}return h;}
 synchronized String direct(String kind,String id,long now){Hint h=get(kind+":"+id,now);return h==null?"":h.direct;}
 synchronized String extension(String kind,String id,String fallback,long now){Hint h=get(kind+":"+id,now);String e=h==null?"":h.ext;if(e.isEmpty())e=extension(fallback);return e.isEmpty()?"mp4":e;}
 synchronized void clear(){hints.clear();}
}
