package local.tvmorph.tv;
import android.content.*;import android.database.*;import android.net.Uri;import android.os.*;import android.provider.OpenableColumns;import java.io.*;
/** One verified update file, read-only via a temporary installer URI grant. */
public final class UpdateProvider extends ContentProvider{
 public boolean onCreate(){return true;}private File file(Uri uri)throws FileNotFoundException{if(!uri.getPath().equals("/tv-morph.apk"))throw new FileNotFoundException();File f=new File(getContext().getCacheDir(),"verified-update.apk");if(!f.isFile())throw new FileNotFoundException();return f;}
 public String getType(Uri uri){return "application/vnd.android.package-archive";}public ParcelFileDescriptor openFile(Uri uri,String mode)throws FileNotFoundException{if(!"r".equals(mode))throw new FileNotFoundException();return ParcelFileDescriptor.open(file(uri),ParcelFileDescriptor.MODE_READ_ONLY);}
 public Cursor query(Uri uri,String[] projection,String selection,String[] args,String sort){try{File f=file(uri);String[] columns=projection==null?new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE}:projection;MatrixCursor c=new MatrixCursor(columns);Object[] row=new Object[columns.length];for(int i=0;i<columns.length;i++)row[i]=columns[i].equals(OpenableColumns.DISPLAY_NAME)?"TV-Morph-TV.apk":columns[i].equals(OpenableColumns.SIZE)?f.length():null;c.addRow(row);return c;}catch(Exception e){return null;}}
 public Uri insert(Uri u,ContentValues v){throw new UnsupportedOperationException();}public int delete(Uri u,String w,String[] a){throw new UnsupportedOperationException();}public int update(Uri u,ContentValues v,String w,String[] a){throw new UnsupportedOperationException();}
}
