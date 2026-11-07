package local.morphtv.legacy;
import java.io.*;
import java.net.*;
import java.util.*;
final class Playlist {
 static final int MAX_BYTES=2097152, MAX_ITEMS=5000, MAX_REDIRECTS=3;
 static final class Entry {final String title,url;Entry(String t,String u){title=t;url=u;}}
 static boolean valid(String value){try{URI u=new URI(value);return ("http".equalsIgnoreCase(u.getScheme())||"https".equalsIgnoreCase(u.getScheme()))&&u.getHost()!=null&&u.getUserInfo()==null;}catch(Exception e){return false;}}
 static List<Entry> parse(String value)throws IOException{
  if(value.length()>MAX_BYTES)throw new IOException("[SIZE] Playlist too large");
  List<Entry> items=new ArrayList<Entry>();String title="";boolean header=false;
  BufferedReader r=new BufferedReader(new StringReader(value.replace("﻿","")));String line;
  while((line=r.readLine())!=null){line=line.trim();if(line.length()==0)continue;
   if(!header){if(!line.startsWith("#EXTM3U"))throw new IOException("[FORMAT] Expected an M3U playlist");header=true;continue;}
   if(line.startsWith("#EXTINF:")){int comma=line.indexOf(',');title=comma<0?"Channel":line.substring(comma+1).trim();}
   else if(!line.startsWith("#")&&valid(line)){items.add(new Entry(title.length()==0?"Channel "+(items.size()+1):title,line));title="";if(items.size()>=MAX_ITEMS)break;}
  }return items;
 }
 static List<Entry> fetch(String address)throws Exception{
  if(!valid(address))throw new IOException("[URL] Use an HTTP or HTTPS playlist URL");
  String current=address;int hops=0;
  while(true){
   HttpURLConnection c=null;
   try{
    c=(HttpURLConnection)new URL(current).openConnection();c.setConnectTimeout(10000);c.setReadTimeout(10000);c.setInstanceFollowRedirects(false);
    int code=c.getResponseCode();
    if(code==301||code==302||code==303||code==307||code==308){
     String to=c.getHeaderField("Location");c.disconnect();c=null;
     if(to==null||to.length()==0)throw new IOException("[HTTP "+code+"] Redirect without Location");
     String next=new URL(new URL(current),to).toString();
     if(!valid(next))throw new IOException("[REDIRECT "+(hops+1)+"] Target is not a plain HTTP/HTTPS URL");
     if(current.startsWith("https:")&&next.startsWith("http:"))throw new IOException("[REDIRECT "+(hops+1)+"] Refused HTTPS to HTTP downgrade");
     hops++;
     if(hops>MAX_REDIRECTS)throw new IOException("[REDIRECT "+hops+"] Too many redirects. Open the final URL directly: host "+hostOf(next));
     current=next;continue;
    }
    if(code!=200)throw new IOException("[HTTP "+code+"] Provider response "+code);
    InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;
    try{while((n=in.read(b))!=-1){if(out.size()+n>MAX_BYTES)throw new IOException("[SIZE] Playlist exceeds 2 MB");out.write(b,0,n);}}finally{in.close();}
    return parse(new String(out.toByteArray(),"UTF-8"));
   }catch(UnknownHostException e){throw new IOException("[DNS] Host not found: "+hostOf(current));}
   catch(SocketTimeoutException e){throw new IOException("[TIMEOUT] Network timed out after 10 s");}
   catch(javax.net.ssl.SSLHandshakeException e){throw new IOException("[TLS] Provider TLS is incompatible with this device. No certificate checks were bypassed.");}
   catch(javax.net.ssl.SSLException e){throw new IOException("[TLS] Secure connection failed. No certificate checks were bypassed.");}
   catch(IOException e){throw e;}
   catch(Exception e){throw new IOException("[NET] "+e.getClass().getSimpleName());}
   finally{if(c!=null)c.disconnect();}
  }
 }
 static String hostOf(String value){try{return new URI(value).getHost();}catch(Exception e){return "?";}}
}
