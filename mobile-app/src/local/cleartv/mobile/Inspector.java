package local.cleartv.mobile;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
import org.json.*;

/** Short-lived, masked WebSocket connection to the TV's authorised developer inspector. */
public final class Inspector implements Closeable {
    private Socket socket;private InputStream in;private OutputStream out;private int sequence=0;
    public Inspector(String target)throws Exception{
        URI u=new URI(target);socket=new Socket();socket.connect(new InetSocketAddress(u.getHost(),u.getPort()),5000);socket.setSoTimeout(15000);in=socket.getInputStream();out=socket.getOutputStream();byte[] nonce=new byte[16];new SecureRandom().nextBytes(nonce);String key=Base64.getEncoder().encodeToString(nonce);
        out.write(("GET "+u.getRawPath()+(u.getRawQuery()==null?"":"?"+u.getRawQuery())+" HTTP/1.1\r\nHost: "+u.getHost()+":"+u.getPort()+"\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: "+key+"\r\n\r\n").getBytes(StandardCharsets.US_ASCII));out.flush();
        ByteArrayOutputStream headers=new ByteArrayOutputStream();int tail=0;while(headers.size()<16384){int c=in.read();if(c<0)throw new EOFException();headers.write(c);tail=(tail<<8)|c;if(tail==0x0d0a0d0a)break;}
        String h=headers.toString("US-ASCII"),accept=Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-1").digest((key+"258EAFA5-E914-47DA-95CA-C5AB0DC85B11").getBytes(StandardCharsets.US_ASCII)));
        if(!h.startsWith("HTTP/1.1 101")||!h.toLowerCase(Locale.US).contains("sec-websocket-accept: "+accept.toLowerCase(Locale.US)))throw new IOException("Inspector handshake rejected");
    }
    public void sendJson(JSONObject value)throws Exception{send(1,value.toString().getBytes(StandardCharsets.UTF_8));}
    public JSONObject readJson()throws Exception{return new JSONObject(receive());}
    public void timeout(int ms)throws Exception{socket.setSoTimeout(ms);}
    private void send(int opcode,byte[] data)throws IOException{out.write(128|opcode);int len=data.length;if(len<126)out.write(128|len);else if(len<=65535){out.write(254);out.write(len>>>8);out.write(len);}else{out.write(255);for(int i=7;i>=0;i--)out.write((int)((long)len>>>(i*8)));}byte[] mask=new byte[4];new SecureRandom().nextBytes(mask);out.write(mask);byte[] encoded=data.clone();for(int i=0;i<len;i++)encoded[i]^=mask[i%4];out.write(encoded);out.flush();}
    private String receive()throws IOException{ByteArrayOutputStream message=new ByteArrayOutputStream();while(true){int a=in.read(),b=in.read();if(a<0||b<0)throw new EOFException();int opcode=a&15;long len=b&127;if(len==126)len=((in.read()&255)<<8)|(in.read()&255);else if(len==127){len=0;for(int i=0;i<8;i++)len=(len<<8)|(in.read()&255);}if(len>8*1024*1024)throw new IOException("Inspector message too large");byte[] mask=(b&128)!=0?SdbClient.exact(in,4):null,data=SdbClient.exact(in,(int)len);if(mask!=null)for(int i=0;i<data.length;i++)data[i]^=mask[i%4];if(opcode==8)throw new IOException("TV inspector disconnected");if(opcode==9){send(10,data);continue;}if(opcode==1||opcode==0){message.write(data);if((a&128)!=0)return message.toString("UTF-8");}}}
    public Object evaluate(String expression)throws Exception{int id=++sequence;JSONObject params=new JSONObject().put("expression",expression).put("returnByValue",true).put("awaitPromise",true);send(1,new JSONObject().put("id",id).put("method","Runtime.evaluate").put("params",params).toString().getBytes(StandardCharsets.UTF_8));while(true){JSONObject r=new JSONObject(receive());if(r.optInt("id")!=id)continue;if(r.has("error"))throw new IOException("TV inspector rejected the request");JSONObject body=r.getJSONObject("result");if(body.has("exceptionDetails"))throw new IOException("The TV app could not apply this change");return body.getJSONObject("result").opt("value");}}
    public void close(){try{if(socket!=null)socket.close();}catch(IOException ignored){}}
}
