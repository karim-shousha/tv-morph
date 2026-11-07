package local.cleartv.mobile;

import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;

/** Streams one explicitly selected file to one selected receiver, without buffering the file. */
final class DlnaMediaServer implements AutoCloseable {
    interface Source { long length(); String mime(); InputStream open(long offset)throws Exception; }
    private final ServerSocket server;
    private final Source source;
    private final InetAddress receiver;
    private final String path;
    private final Set<Socket> clients=Collections.synchronizedSet(new HashSet<Socket>());
    private final ExecutorService workers=new ThreadPoolExecutor(3,3,0L,TimeUnit.MILLISECONDS,new ArrayBlockingQueue<Runnable>(3));
    private volatile boolean closed;
    final String url;
    DlnaMediaServer(InetAddress local,InetAddress receiver,Source source,String suffix)throws Exception {
        this.source=source;this.receiver=receiver;
        if(source.length()<=0||!source.mime().matches("[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+"))throw new IOException("Choose a local media file with a known size.");
        path="/media/"+UUID.randomUUID().toString()+UUID.randomUUID().toString()+(suffix.matches("\\.[a-zA-Z0-9]{1,8}")?suffix:"");
        server=new ServerSocket();server.bind(new InetSocketAddress(local,0));server.setSoTimeout(30000);
        url="http://"+local.getHostAddress()+":"+server.getLocalPort()+path;
        final long until=System.nanoTime()+TimeUnit.HOURS.toNanos(6);
        Thread accept=new Thread(()->{try{while(!closed&&System.nanoTime()<until){try{Socket s=server.accept();if(!receiver.equals(s.getInetAddress())){s.close();continue;}synchronized(clients){if(closed){s.close();break;}clients.add(s);}try{workers.execute(()->serve(s));}catch(RejectedExecutionException full){clients.remove(s);s.close();}}catch(SocketTimeoutException ignored){}}}catch(IOException ignored){}finally{close();}},"Morph-DLNA-file");accept.setDaemon(true);accept.start();
    }
    static long[] range(String value,long length)throws IOException {
        if(value==null)return new long[]{0,length-1};
        if(!value.matches("bytes=(?:[0-9]+-[0-9]*|-[0-9]+)"))throw new IOException("Invalid range");
        try{String[] parts=value.substring(6).split("-",-1);long start,end;
            if(parts[0].isEmpty()){long count=Long.parseLong(parts[1]);if(count<=0)throw new IOException("Invalid range");start=Math.max(0,length-count);end=length-1;}
            else{start=Long.parseLong(parts[0]);end=parts[1].isEmpty()?length-1:Math.min(length-1,Long.parseLong(parts[1]));}
            if(start<0||start>=length||end<start)throw new IOException("Unsatisfied range");return new long[]{start,end};
        }catch(NumberFormatException error){throw new IOException("Invalid range");}
    }
    private static String line(InputStream in)throws IOException {ByteArrayOutputStream out=new ByteArrayOutputStream();int b;while((b=in.read())!=-1){if(b==10)break;if(b!=13)out.write(b);if(out.size()>4096)throw new IOException("Header too large");}if(b==-1&&out.size()==0)throw new EOFException();return out.toString("US-ASCII");}
    private void headers(OutputStream out,int status,long size,String extra)throws IOException {out.write(("HTTP/1.1 "+status+" Response\r\nContent-Type: "+source.mime()+"\r\nContent-Length: "+size+"\r\nAccept-Ranges: bytes\r\nConnection: close\r\nCache-Control: no-store\r\ntransferMode.dlna.org: Streaming\r\n"+extra+"\r\n").getBytes("US-ASCII"));out.flush();}
    private void serve(Socket s){try(Socket socket=s){socket.setSoTimeout(5000);final long headerDeadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(10);InputStream in=new FilterInputStream(socket.getInputStream()){public int read()throws IOException{long remaining=TimeUnit.NANOSECONDS.toMillis(headerDeadline-System.nanoTime());if(remaining<=0)throw new SocketTimeoutException();socket.setSoTimeout((int)Math.min(5000,Math.max(1,remaining)));return super.read();}};OutputStream out=socket.getOutputStream();String[] request=line(in).split(" ");
        if(request.length!=3||!path.equals(request[1])){headers(out,404,0,"");return;}
        if(!request[0].equals("GET")&&!request[0].equals("HEAD")){headers(out,405,0,"Allow: GET, HEAD\r\n");return;}
        String range=null;int bytes=0;long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(10);try{for(String h;!(h=line(in)).isEmpty();){bytes+=h.length();if(bytes>8192||System.nanoTime()>deadline)throw new IOException("Headers too large or slow");int at=h.indexOf(':');if(at>0&&h.substring(0,at).equalsIgnoreCase("Range")){if(range!=null)throw new IOException("Duplicate range");range=h.substring(at+1).trim();}}}catch(IOException bad){headers(out,400,0,"");return;}
        long[] span;try{span=range(range,source.length());}catch(IOException bad){headers(out,416,0,"Content-Range: bytes */"+source.length()+"\r\n");return;}
        long count=span[1]-span[0]+1;String extra=range==null?"":"Content-Range: bytes "+span[0]+"-"+span[1]+"/"+source.length()+"\r\n";
        if(request[0].equals("HEAD")){headers(out,range==null?200:206,count,extra);return;}
        try(InputStream file=source.open(span[0])){headers(out,range==null?200:206,count,extra);byte[] buffer=new byte[65536];while(count>0&&!closed){int n=file.read(buffer,0,(int)Math.min(buffer.length,count));if(n<0)break;out.write(buffer,0,n);count-=n;}out.flush();}
    }catch(Exception ignored){}finally{clients.remove(s);}}
    public void close(){if(closed)return;closed=true;try{server.close();}catch(IOException ignored){}synchronized(clients){for(Socket s:clients)try{s.close();}catch(IOException ignored){}clients.clear();}workers.shutdownNow();}
}
