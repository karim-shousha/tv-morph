package local.cleartv.mobile;
import java.io.*;
/** Shared receiver limit, matching the TV updater's 32 MiB limit. */
final class ReceiverApk {
 static final int MAX_BYTES=32*1024*1024;
 static byte[] read(InputStream source)throws IOException {
  try(InputStream in=source;ByteArrayOutputStream out=new ByteArrayOutputStream()){
   byte[] buffer=new byte[32768];int n;
   while((n=in.read(buffer))!=-1){if(n>MAX_BYTES-out.size())throw new IOException("TV update exceeds 32 MiB");out.write(buffer,0,n);}
   return out.toByteArray();
  }
 }
}
