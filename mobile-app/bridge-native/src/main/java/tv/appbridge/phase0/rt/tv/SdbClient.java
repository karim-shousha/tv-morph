package tv.appbridge.phase0.rt.tv;

import java.io.*;
import java.net.*;
import java.nio.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Small sequential SDB client. No desktop daemon or command-line executable.
 *
 * Adapted with permission from the owner's Morph TV mobile project
 * (local.cleartv.mobile.SdbClient), which itself builds on ADB-protocol
 * framing. Used here to talk to a Samsung TV in Developer Mode
 * (port 26101): read DUID, push the AppBridge WGT, run vd_appinstall.
 * Failures (no dev mode, refused port, install rejection) surface verbatim.
 */
public final class SdbClient implements Closeable {
    private Socket socket;
    private InputStream in;
    private OutputStream out;
    private int next=97,local,remote,max=4096;
    private boolean adb;
    private final ByteArrayOutputStream pending=new ByteArrayOutputStream();
    public interface Progress { void update(int percent); }
    interface Auth { byte[] sign(byte[] token)throws Exception; byte[] publicKey()throws Exception; }
    static int code(String s){return ByteBuffer.wrap(s.getBytes(StandardCharsets.US_ASCII)).order(ByteOrder.LITTLE_ENDIAN).getInt();}
    static byte[] le(int n){return ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(n).array();}
    static byte[] bytes(String s){return s.getBytes(StandardCharsets.UTF_8);}
    static class Frame {int cmd,a,b;byte[] data;}
    static byte[] exact(InputStream in,int size)throws IOException{byte[] b=new byte[size];int pos=0;while(pos<size){int n=in.read(b,pos,size-pos);if(n<0)throw new EOFException("The TV closed the connection");pos+=n;}return b;}
    private void send(String cmd,int a,int b,byte[] data)throws IOException{
        int sum=0;for(byte v:data)sum+=v&255;
        ByteBuffer h=ByteBuffer.allocate(24).order(ByteOrder.LITTLE_ENDIAN);
        h.putInt(code(cmd)).putInt(a).putInt(b).putInt(data.length).putInt(sum).putInt(code(cmd)^-1);
        out.write(h.array());out.write(data);out.flush();
    }
    private Frame read()throws IOException{
        ByteBuffer h=ByteBuffer.wrap(exact(in,24)).order(ByteOrder.LITTLE_ENDIAN);Frame f=new Frame();f.cmd=h.getInt();f.a=h.getInt();f.b=h.getInt();int size=h.getInt(),sum=h.getInt(),magic=h.getInt();
        if(size<0||size>4*1024*1024||magic!=(f.cmd^-1))throw new IOException("Invalid SDB response");
        f.data=exact(in,size);int actual=0;for(byte v:f.data)actual+=v&255;if(sum!=actual)throw new IOException("SDB checksum mismatch");return f;
    }
    public SdbClient(String ip)throws IOException {
        IOException last=null;
        for(int attempt=0;attempt<3;attempt++){
            try{socket=new Socket();socket.connect(new InetSocketAddress(ip,26101),5000);socket.setSoTimeout(6000);in=socket.getInputStream();out=socket.getOutputStream();send("CNXN",0x01000000,4096,bytes("host::cleartv-mobile\0"));Frame f=read();
                if(f.cmd==code("AUTH"))throw new IOException("This model needs secure developer authentication, which this preview does not support yet");
                if(f.cmd!=code("CNXN"))throw new IOException("Developer connection refused");max=Math.min(4096,f.b>0?f.b:4096);socket.setSoTimeout(20000);return;
            }catch(IOException e){last=e;close();try{Thread.sleep(350);}catch(InterruptedException x){Thread.currentThread().interrupt();}}
        }
        throw new IOException(connectionFailure(last),last);
    }
    static String connectionFailure(IOException error){
        if(error.getMessage()!=null&&error.getMessage().toLowerCase(java.util.Locale.US).contains("reset"))return "التلفزيون قفل اتصال التثبيت. لو أدوات التطوير على الكمبيوتر متصلة بالتلفزيون، افصلها وجرب تاني.";
        if(error instanceof ConnectException)return "Samsung installation port 26101 refused the connection. Confirm Host PC IP matches this phone, then fully restart the TV. The app has not been sent.";
        if(error instanceof SocketTimeoutException)return "Samsung installation connection timed out. Check the TV IP and local network access. The app has not been sent.";
        return error.getMessage()==null?"Samsung developer connection failed.":error.getMessage();
    }
    /** Standard ADB transport for an explicitly selected, user-authorised Fire TV. */
    SdbClient(String ip,int port,Auth auth)throws IOException{
        adb=true;
        try{
            socket=new Socket();socket.connect(new InetSocketAddress(ip,port),5000);socket.setSoTimeout(45000);in=socket.getInputStream();out=socket.getOutputStream();
            send("CNXN",0x01000000,4096,bytes("host::tvmorph\0"));
            for(int attempt=0;attempt<4;attempt++){
                Frame f=read();
                if(f.cmd==code("CNXN")){max=Math.min(4096,f.b>0?f.b:4096);socket.setSoTimeout(20000);return;}
                if(f.cmd!=code("AUTH")||f.a!=1||f.data.length!=20)throw new IOException("Unsupported ADB handshake");
                if(attempt==0)send("AUTH",2,0,auth.sign(f.data));
                else if(attempt==1)send("AUTH",3,0,auth.publicKey());
                else throw new IOException("ADB authorisation was rejected. Approve the phone on the TV and retry.");
            }
            throw new IOException("ADB authorisation did not complete");
        }catch(Exception e){close();throw new IOException("Android TV ADB: "+e.getMessage(),e);}
    }
    private void open(String service)throws IOException{
        local=next++;remote=0;pending.reset();send("OPEN",local,0,bytes(service+"\0"));
        while(true){Frame f=read();if(f.cmd==code("OKAY")&&f.b==local){remote=f.a;return;}if(f.cmd==code("WRTE")&&f.b==local){remote=f.a;pending.write(f.data);send("OKAY",local,remote,new byte[0]);return;}if(f.cmd==code("CLSE")&&f.b==local)throw new IOException("The TV rejected "+service.split(":")[0]);}
    }
    private void channelClose(){try{send("CLSE",local,remote,new byte[0]);}catch(Exception ignored){}}
    public synchronized String shell(String command)throws IOException{
        return shellUntil(command,null);
    }
    public synchronized String shellUntil(String command,java.util.regex.Pattern complete)throws IOException{
        open("shell:"+command);ByteArrayOutputStream result=new ByteArrayOutputStream();result.write(pending.toByteArray());pending.reset();
        if(complete!=null&&complete.matcher(result.toString("UTF-8")).find()){channelClose();return result.toString("UTF-8").trim();}
        while(true){Frame f=read();if(f.b!=local)continue;if(f.cmd==code("WRTE")){result.write(f.data);if(result.size()>4*1024*1024)throw new IOException("TV output too large");send("OKAY",local,remote,new byte[0]);if(complete!=null&&complete.matcher(result.toString("UTF-8")).find()){channelClose();return result.toString("UTF-8").trim();}}else if(f.cmd==code("CLSE")){channelClose();return new String(result.toByteArray(),StandardCharsets.UTF_8).trim();}}
    }
    private void writeChannel(byte[] data)throws IOException{
        for(int pos=0;pos<data.length;pos+=max){send("WRTE",local,remote,Arrays.copyOfRange(data,pos,Math.min(data.length,pos+max)));
            while(true){Frame f=read();if(f.b!=local)continue;if(f.cmd==code("OKAY"))break;if(f.cmd==code("WRTE")){pending.write(f.data);send("OKAY",local,remote,new byte[0]);}else if(f.cmd==code("CLSE"))throw new IOException("TV closed the file transfer");}}
    }
    private void sync(String cmd,byte[] data)throws IOException{ByteArrayOutputStream packet=new ByteArrayOutputStream();packet.write(bytes(cmd));packet.write(le(data.length));packet.write(data);writeChannel(packet.toByteArray());}
    public synchronized void push(byte[] file,String path,Progress progress)throws IOException{
        open("sync:");sync("SEND",bytes(adb?path+",33188":path));
        for(int pos=0;pos<file.length;pos+=65536){sync("DATA",Arrays.copyOfRange(file,pos,Math.min(file.length,pos+65536)));if(progress!=null)progress.update((int)(Math.min(file.length,pos+65536)*100L/file.length));}
        if(adb){ByteArrayOutputStream done=new ByteArrayOutputStream();done.write(bytes("DONE"));done.write(le((int)(System.currentTimeMillis()/1000)));writeChannel(done.toByteArray());}
        else sync("DONE",le((int)(System.currentTimeMillis()/1000)));
        while(pending.size()<8){Frame f=read();if(f.b!=local)continue;if(f.cmd==code("WRTE")){pending.write(f.data);send("OKAY",local,remote,new byte[0]);}else if(f.cmd==code("CLSE"))throw new IOException("File transfer was not confirmed");}
        byte[] response=pending.toByteArray();String status=new String(response,0,4,StandardCharsets.US_ASCII);channelClose();pending.reset();
        if(!status.equals("OKAY"))throw new IOException("File transfer failed: "+new String(response,StandardCharsets.UTF_8));
    }
    public void timeout(int millis)throws IOException{socket.setSoTimeout(millis);}
    public void close(){try{if(socket!=null)socket.close();}catch(IOException ignored){}}
    public static void main(String[] args)throws Exception{try(SdbClient s=new SdbClient(args[0])){System.out.println(s.shell("0 getduid"));if(args.length>1){byte[] b=java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(args[1]));s.push(b,"/home/owner/share/tmp/sdk_tools/ClearMobile.wgt",null);System.out.println("Transferred "+b.length+" bytes");}}}
}
