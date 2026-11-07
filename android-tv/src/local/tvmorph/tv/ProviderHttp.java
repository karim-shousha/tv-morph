package local.tvmorph.tv;
import java.net.*;import java.io.*;import java.util.*;import org.json.*;
/** Bounded metadata redirects. Never copies credentials/headers to a new URL or disables TLS. */
final class ProviderHttp {
 static final int LIMIT=24*1024*1024;
 interface Body<T>{T read(InputStream in)throws IOException;}
 static Object json(String address,String agent)throws IOException{return json(address,agent,"application/json");}
 static Object json(String address,String agent,String accept)throws IOException{return exchange(address,agent,accept,45,LIMIT,in->{ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1)out.write(buffer,0,n);try{Object value=new JSONTokener(out.toString("UTF-8")).nextValue();if(!(value instanceof JSONObject)&&!(value instanceof JSONArray))throw new IOException("Provider returned invalid JSON.");return value;}catch(JSONException bad){throw new IOException("Provider returned invalid JSON.");}});}
 static <T>T catalog(String address,String agent,Body<T> body)throws IOException{return catalog(address,agent,"application/json",body);}
 static <T>T catalog(String address,String agent,String accept,Body<T> body)throws IOException{return exchange(address,agent,accept,180,512L*1024*1024,body);}
 private static <T>T exchange(String address,String agent,String accept,int seconds,long limit,Body<T> body)throws IOException {
  long deadline=System.nanoTime()+java.util.concurrent.TimeUnit.SECONDS.toNanos(seconds);try{URI uri=new URI(address);for(int hops=0;hops<=5;hops++){
   if(!Arrays.asList("http","https").contains(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null||uri.getFragment()!=null)throw new IOException("Invalid provider redirect.");
   if(System.nanoTime()>=deadline)throw new SocketTimeoutException();
   HttpURLConnection c=(HttpURLConnection)uri.toURL().openConnection();
   try{int remaining=(int)Math.max(1,java.util.concurrent.TimeUnit.NANOSECONDS.toMillis(deadline-System.nanoTime()));c.setConnectTimeout(Math.min(8000,remaining));c.setReadTimeout(Math.min(12000,remaining));c.setInstanceFollowRedirects(false);c.setRequestProperty("User-Agent",agent);c.setRequestProperty("Accept",accept);c.setRequestProperty("Accept-Encoding","gzip");int status=c.getResponseCode();
    if(Arrays.asList(301,302,303,307,308).contains(status)){String location=c.getHeaderField("Location");if(location==null||hops==5)throw new IOException("Provider redirect limit or missing destination.");URI next=uri.resolve(location);if("https".equals(uri.getScheme())&&!"https".equals(next.getScheme()))throw new IOException("Provider redirected HTTPS to an insecure URL.");uri=next;continue;}
    if(status!=200)throw new IOException("IPTV provider HTTP "+status+".");
    final long expires=deadline;try(InputStream raw=c.getInputStream();InputStream decoded="gzip".equalsIgnoreCase(c.getContentEncoding())?new java.util.zip.GZIPInputStream(raw):raw;InputStream bounded=new FilterInputStream(decoded){long count;private void guard()throws IOException{long left=java.util.concurrent.TimeUnit.NANOSECONDS.toMillis(expires-System.nanoTime());if(left<=0)throw new SocketTimeoutException();c.setReadTimeout((int)Math.min(12000,left));}private int checked(int n)throws IOException{if(n>0)count+=n;if(count>limit)throw new IOException("Provider response too large.");if(System.nanoTime()>=expires)throw new SocketTimeoutException();return n;}@Override public int read()throws IOException{guard();int n=in.read();checked(n<0?0:1);return n;}@Override public int read(byte[] b,int off,int len)throws IOException{guard();return checked(in.read(b,off,len));}}){return body.read(bounded);}
   }finally{c.disconnect();}
  }throw new IOException("Provider redirect limit.");
  }catch(SocketTimeoutException timeout){throw new IOException("IPTV provider request timed out.");}catch(URISyntaxException bad){throw new IOException("Invalid provider URL.");}
 }
}
