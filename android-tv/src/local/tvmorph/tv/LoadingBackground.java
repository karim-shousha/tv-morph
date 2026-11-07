package local.tvmorph.tv;
import android.content.Context;
import android.graphics.*;
import android.graphics.drawable.Drawable;
/** Static shader-only counterpart of the cinematic boot background. */
final class LoadingBackground extends Drawable {
 private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);private Shader base,glow;private Bitmap artwork;private final Matrix artworkMatrix=new Matrix();private static java.lang.ref.WeakReference<Bitmap> cachedArtwork=new java.lang.ref.WeakReference<>(null);
 LoadingBackground(Context context){paint.setFilterBitmap(true);synchronized(LoadingBackground.class){artwork=cachedArtwork.get();if(artwork==null){for(String path:new String[]{"tv/assets/morph-loading-background.webp","iptv/morph-loading-background.webp","morph-loading-background.webp"}){try(java.io.InputStream in=context.getAssets().open(path)){artwork=BitmapFactory.decodeStream(in);if(artwork!=null){cachedArtwork=new java.lang.ref.WeakReference<>(artwork);break;}}catch(java.io.IOException ignored){}}}}}
 static int logoWidth(Context context){android.util.DisplayMetrics m=context.getResources().getDisplayMetrics();return Math.round(960f*Math.min(m.widthPixels/1920f,m.heightPixels/1080f));}
 @Override protected void onBoundsChange(Rect b){base=new LinearGradient(b.left,b.top,b.right,b.bottom,new int[]{0xff070c1b,0xff091426,0xff10253b},new float[]{0,.55f,1},Shader.TileMode.CLAMP);glow=new RadialGradient(b.left+b.width()*.51f,b.top+b.height()*.48f,Math.max(1,b.width()*.46f),new int[]{0x4216396a,0x0016396a},null,Shader.TileMode.CLAMP);}
 @Override public void draw(Canvas canvas){if(artwork!=null){Rect b=getBounds();float scale=Math.max(b.width()/(float)artwork.getWidth(),b.height()/(float)artwork.getHeight());artworkMatrix.setScale(scale,scale);artworkMatrix.postTranslate(b.left+(b.width()-artwork.getWidth()*scale)/2,b.top+(b.height()-artwork.getHeight()*scale)/2);paint.setShader(null);canvas.drawBitmap(artwork,artworkMatrix,paint);return;}paint.setShader(base);canvas.drawRect(getBounds(),paint);paint.setShader(glow);canvas.drawRect(getBounds(),paint);paint.setShader(null);}
 @Override public void setAlpha(int alpha){}
 @Override public void setColorFilter(ColorFilter filter){}
 @Override public int getOpacity(){return PixelFormat.OPAQUE;}
}
