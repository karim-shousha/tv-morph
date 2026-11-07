package local.morphtv.legacy;

import android.content.Context;
import android.graphics.*;
import android.graphics.drawable.Drawable;

/** Static counterpart of premium-reference-background.svg for the first native frame. */
final class LegacyBackground extends Drawable {
 private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
 private final Context context;
 LegacyBackground(Context context){this.context=context;}
 @Override public void draw(Canvas canvas){
  int save=canvas.save();Rect b=getBounds();canvas.translate(b.left,b.top);canvas.scale(b.width()/1920f,b.height()/1080f);
  paint.setShader(new LinearGradient(0,324,1920,432,new int[]{0xff151629,0xff37425f,0xff6e6b80},new float[]{0,.56f,1},Shader.TileMode.CLAMP));canvas.drawRect(0,0,1920,1080,paint);
  // Match the SVG's elliptical radial highlight without a blur pass.
  int highlight=canvas.save();canvas.translate(1516.8f,75.6f);canvas.scale(1920f,1080f);paint.setShader(new RadialGradient(0,0,.55f,new int[]{0x669d9ca7,0x0052617e},null,Shader.TileMode.CLAMP));canvas.drawRect(-1,-1,1,1,paint);canvas.restoreToCount(highlight);
  paint.setShader(new LinearGradient(0,1080,1920,0,new int[]{0xff27344c,0xff536075},null,Shader.TileMode.CLAMP));Path rear=new Path();rear.moveTo(810,1080);rear.cubicTo(1050,803,1500,637,1920,372);rear.lineTo(1920,1080);rear.close();canvas.drawPath(rear,paint);
  paint.setShader(new LinearGradient(0,0,1920,864,new int[]{0xff273149,0xff1a263e},null,Shader.TileMode.CLAMP));Path front=new Path();front.moveTo(425,1080);front.cubicTo(605,806,1115,617,1920,458);front.lineTo(1920,1080);front.close();canvas.drawPath(front,paint);paint.setShader(null);canvas.restoreToCount(save);
 }
 private static int fallback(String theme){if(theme.equals("ahly"))return 0xff250b16;if(theme.equals("emerald"))return 0xff091e20;if(theme.equals("amber"))return 0xff221711;if(theme.equals("violet"))return 0xff1b112b;return 0xff101c35;}
 @Override public void setAlpha(int alpha){}
 @Override public void setColorFilter(ColorFilter filter){}
 @Override public int getOpacity(){return PixelFormat.OPAQUE;}
}
