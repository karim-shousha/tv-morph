package local.cleartv.mobile;
import java.io.*;import java.net.*;import java.nio.*;import java.util.regex.*;
public class SdbDebugCheck {
 static int[] read(InputStream in)throws Exception{ByteBuffer h=ByteBuffer.wrap(SdbClient.exact(in,24)).order(ByteOrder.LITTLE_ENDIAN);int[] f=new int[4];for(int i=0;i<4;i++)f[i]=h.getInt();SdbClient.exact(in,f[3]);return f;}
 static void send(OutputStream out,String code,int a,int b,String text)throws Exception{byte[] data=text.getBytes("UTF-8");int sum=0;for(byte v:data)sum+=v&255;out.write(ByteBuffer.allocate(24).order(ByteOrder.LITTLE_ENDIAN).putInt(SdbClient.code(code)).putInt(a).putInt(b).putInt(data.length).putInt(sum).putInt(SdbClient.code(code)^-1).array());out.write(data);out.flush();}
 public static void main(String[] args)throws Exception{
  try(ServerSocket server=new ServerSocket(26101,1,InetAddress.getByName("127.0.0.1"))){
   Thread emulator=new Thread(()->{try(Socket peer=server.accept()){
    peer.setSoTimeout(3000);read(peer.getInputStream());send(peer.getOutputStream(),"CNXN",0x1000000,4096,"device::test\0");int[] open=read(peer.getInputStream());
    // Reproduces a TV returning output directly, then keeping the debug shell open.
    send(peer.getOutputStream(),"WRTE",7,open[1],"Application started. port: 7011\n");int[] ack=read(peer.getInputStream());if(ack[0]!=SdbClient.code("OKAY"))throw new AssertionError("Missing ACK");int[] close=read(peer.getInputStream());if(close[0]!=SdbClient.code("CLSE"))throw new AssertionError("Client kept waiting for shell EOF");
   }catch(Exception e){throw new RuntimeException(e);}});emulator.start();
   long start=System.currentTimeMillis();try(SdbClient s=new SdbClient("127.0.0.1")){String reply=s.shellUntil("0 debug Test.Home",Pattern.compile("port[:\\s]+(\\d+)"));if(!reply.contains("7011"))throw new AssertionError("No debug port");}
   if(System.currentTimeMillis()-start>2500)throw new AssertionError("Waited for shell EOF");emulator.join(3500);if(emulator.isAlive())throw new AssertionError("Session did not close");
  }
  System.out.println("PASS: direct WRTE without initial OKAY and a debug shell that stays open do not block port detection.");
 }
}
