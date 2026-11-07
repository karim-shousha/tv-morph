package local.morphtv.legacy;
import android.content.*;import android.database.*;import android.net.Uri;import android.os.ParcelFileDescriptor;import android.provider.OpenableColumns;import java.io.*;
/** Only the verified update is shared, read-only, with the Android installer. */
public final class LegacyUpdateProvider extends ContentProvider {
 public boolean onCreate(){return true;}
 private File file(Uri u)throws FileNotFoundException{if(!"/update.apk".equals(u.getPath()))throw new FileNotFoundException();File f=new File(getContext().getCacheDir(),"verified-legacy-update.apk");if(!f.isFile())throw new FileNotFoundException();return f;}
 public String getType(Uri u){return "application/vnd.android.package-archive";}
 public ParcelFileDescriptor openFile(Uri u,String mode)throws FileNotFoundException{if(!"r".equals(mode))throw new FileNotFoundException();return ParcelFileDescriptor.open(file(u),ParcelFileDescriptor.MODE_READ_ONLY);}
 public Cursor query(Uri u,String[] projection,String selection,String[] args,String sort){try{File f=file(u);MatrixCursor c=new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE});c.addRow(new Object[]{"Morph-update.apk",f.length()});return c;}catch(Exception e){return null;}}
 public Uri insert(Uri u,ContentValues v){throw new UnsupportedOperationException();}public int delete(Uri u,String w,String[] a){throw new UnsupportedOperationException();}public int update(Uri u,ContentValues v,String w,String[] a){throw new UnsupportedOperationException();}
}
