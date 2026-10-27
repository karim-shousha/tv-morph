package local.cleartv.mobile;
import android.content.*;import android.graphics.*;import android.net.Uri;import java.io.*;import java.util.*;
final class ImageAsset{
 static String read(Context context,Uri uri,String role)throws Exception{
  byte[] raw=Network.read(context.getContentResolver().openInputStream(uri),12*1024*1024);BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(raw,0,raw.length,bounds);if(bounds.outWidth<1||bounds.outHeight<1||bounds.outWidth>20000||bounds.outHeight>20000)throw new IOException("الصورة غير مدعومة أو أبعادها كبيرة جدًا.");
  BitmapFactory.Options options=new BitmapFactory.Options();options.inSampleSize=1;int limit=role.equals("logo")?600:1400;while(Math.max(bounds.outWidth,bounds.outHeight)/options.inSampleSize>limit*2)options.inSampleSize*=2;Bitmap bitmap=BitmapFactory.decodeByteArray(raw,0,raw.length,options);if(bitmap==null)throw new IOException("تعذّر فتح الصورة.");
  try{android.media.ExifInterface exif=new android.media.ExifInterface(new ByteArrayInputStream(raw));int orientation=exif.getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION,1);Matrix matrix=new Matrix();if(orientation==3)matrix.postRotate(180);else if(orientation==6)matrix.postRotate(90);else if(orientation==8)matrix.postRotate(270);if(!matrix.isIdentity()){Bitmap next=Bitmap.createBitmap(bitmap,0,0,bitmap.getWidth(),bitmap.getHeight(),matrix,true);if(next!=bitmap)bitmap.recycle();bitmap=next;}}catch(Exception ignored){}

  for(int i=0;i<12;i++){int longest=Math.max(bitmap.getWidth(),bitmap.getHeight());if(longest>limit){Bitmap next=Bitmap.createScaledBitmap(bitmap,Math.max(1,bitmap.getWidth()*limit/longest),Math.max(1,bitmap.getHeight()*limit/longest),true);if(next!=bitmap)bitmap.recycle();bitmap=next;}
   ByteArrayOutputStream out=new ByteArrayOutputStream();boolean alpha=bitmap.hasAlpha();bitmap.compress(alpha?Bitmap.CompressFormat.PNG:Bitmap.CompressFormat.JPEG,85,out);if(out.size()<=160000){bitmap.recycle();return "data:image/"+(alpha?"png":"jpeg")+";base64,"+Base64.getEncoder().encodeToString(out.toByteArray());}limit=Math.max(100,limit*4/5);
  }bitmap.recycle();throw new IOException("الصورة كبيرة؛ جرّب صورة أبسط.");
 }
}
