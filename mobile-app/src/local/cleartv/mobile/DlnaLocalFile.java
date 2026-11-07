package local.cleartv.mobile;

import android.content.*;
import android.content.res.AssetFileDescriptor;
import android.net.Uri;
import android.provider.OpenableColumns;
import java.io.*;
import java.net.*;
import java.util.Locale;
import org.json.JSONObject;

/** Holds only the picker grant; no broad storage permission or file copy is needed. */
final class DlnaLocalFile {
    final ContentResolver resolver;final Uri uri;final String name,mime;final long size;
    DlnaLocalFile(Context context,Uri uri)throws Exception {
        if(uri==null||!"content".equals(uri.getScheme()))throw new IOException("Choose a media file using the file picker.");
        this.uri=uri;resolver=context.getContentResolver();String label="Media",type=resolver.getType(uri);long length=-1;
        try(android.database.Cursor c=resolver.query(uri,new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE},null,null,null)){if(c!=null&&c.moveToFirst()){if(!c.isNull(0))label=c.getString(0);if(!c.isNull(1))length=c.getLong(1);}}
        if(type==null||type.equals("application/octet-stream")){int dot=label.lastIndexOf('.');if(dot>=0)type=android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(label.substring(dot+1).toLowerCase(Locale.ROOT));}
        if(type==null||!type.matches("(?:video|audio|image)/[a-zA-Z0-9.+-]+"))throw new IOException("Select a video, audio file or photo.");
        try(AssetFileDescriptor fd=resolver.openAssetFileDescriptor(uri,"r")){if(fd==null)throw new IOException("File is unavailable.");if(length<0)length=fd.getLength();if(length<0)length=fd.getParcelFileDescriptor().getStatSize();}
        if(length<=0)throw new IOException("Download this file to the phone first, then select it again.");
        name=label;mime=type;size=length;
    }
    String kind(){return mime.startsWith("audio/")?"audio":mime.startsWith("image/")?"image":"video";}
    JSONObject info()throws Exception{return new JSONObject().put("name",name).put("mime",mime).put("kind",kind()).put("bytes",size);}
    DlnaMediaServer serve(String host)throws Exception {
        if(!Network.local(host))throw new IOException("Select a local DLNA receiver first.");
        InetAddress receiver=InetAddress.getByName(host),local;
        try(DatagramSocket route=new DatagramSocket()){route.connect(receiver,1900);local=route.getLocalAddress();}
        if(!Network.local(local.getHostAddress()))throw new IOException("Connect the phone and receiver to the same Wi-Fi.");
        DlnaMediaServer.Source source=new DlnaMediaServer.Source(){public long length(){return size;}public String mime(){return mime;}public InputStream open(long offset)throws Exception {
            AssetFileDescriptor fd=resolver.openAssetFileDescriptor(uri,"r");if(fd==null)throw new IOException("File is unavailable.");
            try{FileInputStream in=fd.createInputStream();in.getChannel().position(fd.getStartOffset()+offset);return in;
            }catch(Exception error){fd.close();throw new IOException("Choose a file stored locally on the phone.");}
        }};
        // Check seek access before asking the TV to play it.
        try(InputStream check=source.open(0)){}
        int dot=name.lastIndexOf('.');return new DlnaMediaServer(local,receiver,source,dot<0?"":name.substring(dot));
    }
}
