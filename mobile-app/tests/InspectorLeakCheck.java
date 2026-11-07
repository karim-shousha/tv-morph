package local.cleartv.mobile;
import java.net.*;import java.io.*;import java.util.concurrent.*;
public class InspectorLeakCheck {
 public static void main(String[] args)throws Exception{
  try(ServerSocket server=new ServerSocket(0,50,InetAddress.getLoopbackAddress())){
   ExecutorService worker=Executors.newSingleThreadExecutor();Future<Integer> closed=worker.submit(()->{int n=0;for(int i=0;i<20;i++)try(Socket s=server.accept()){s.setSoTimeout(2000);InputStream in=s.getInputStream();int tail=0,v;while((v=in.read())!=-1){tail=(tail<<8)|v;if(tail==0x0d0a0d0a)break;}s.getOutputStream().write("HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\n\r\n".getBytes("US-ASCII"));s.getOutputStream().flush();if(in.read()!=-1)throw new AssertionError("failed handshake retained socket");n++;}return n;});
   try{for(int i=0;i<20;i++){try{new Inspector("ws://127.0.0.1:"+server.getLocalPort()+"/denied");throw new AssertionError("rejected handshake accepted");}catch(IOException expected){}}if(closed.get(5,TimeUnit.SECONDS)!=20)throw new AssertionError();}finally{worker.shutdownNow();}
  }
  System.out.println("PASS: all 20 rejected inspector handshakes close sockets immediately.");
 }
}
