package local.tvmorph.tv;

import android.content.Context;
import android.graphics.*;
import android.widget.Button;

/** Vector controls: independent of the device's emoji and system button theme. */
final class PlayerChromeButton extends Button {
  private final Paint p=new Paint(3);
  private final boolean main;private String caption;private boolean textOnly,glyphOnly;private boolean videoOverlay;private float glyphScale=.4f;
  void videoOverlay(boolean enlarged){videoOverlay=true;glyphScale=enlarged?.56f:.4f;invalidate();}
  private int ink(){return videoOverlay?Color.WHITE:PlayerPalette.text(getContext());}
  void glyphOnly(boolean value){glyphOnly=value;invalidate();}
  void textOnly(boolean value){textOnly=value;invalidate();}
  void caption(String value){caption=value;invalidate();}
  PlayerChromeButton(Context c,String label,boolean primary){super(c);main=primary;setText(label);setBackgroundColor(Color.TRANSPARENT);setPadding(0,0,0,0);setMinWidth(0);setMinimumWidth(0);setMinHeight(0);setMinimumHeight(0);setLayerType(LAYER_TYPE_SOFTWARE,null);setFocusable(true);setContentDescription(label);}
  @Override protected void onDraw(Canvas canvas){
    p.clearShadowLayer();if(textOnly){p.setStyle(Paint.Style.FILL);p.setColor(PlayerPalette.text(getContext()));p.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));p.setTextSize(Math.max(12,getHeight()*.32f));p.setTextAlign(Paint.Align.CENTER);p.setUnderlineText(isFocused());canvas.drawText(caption==null?getText().toString():caption,getWidth()/2f,getHeight()*.61f,p);p.setUnderlineText(false);return;}boolean phone=PlayerPalette.phone(getContext());int accent=PlayerPalette.accent(getContext()),surface=PlayerPalette.surface(getContext());float size=Math.min(getWidth(),getHeight());if(caption!=null){p.setStyle(Paint.Style.FILL);p.setColor(isFocused()?PlayerPalette.alpha(ink(),40):PlayerPalette.alpha(surface,18));canvas.drawRoundRect(2,size*.05f,getWidth()-2,getHeight()-size*.05f,size*.23f,size*.23f,p);if(isFocused()){p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(Math.max(1,size*.02f));p.setColor(ink());canvas.drawRoundRect(2,size*.05f,getWidth()-2,getHeight()-size*.05f,size*.23f,size*.23f,p);}}canvas.save();canvas.translate(caption==null?(getWidth()-size)/2:0,(getHeight()-size)/2);canvas.scale(size/100,size/100);
    p.clearShadowLayer();p.setStyle(Paint.Style.FILL);p.setColor(phone?(main||videoOverlay&&isFocused()?accent:isFocused()?(PlayerPalette.daylight(getContext())?0xffe8efff:0xff426180):0x00ffffff):(main?PlayerPalette.alpha(ink(),42):isFocused()?PlayerPalette.alpha(ink(),52):PlayerPalette.alpha(surface,24)));if(caption==null&&!glyphOnly)canvas.drawRoundRect(5,5,95,95,23,23,p);
    if(isFocused()&&!glyphOnly){p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(2);p.setColor(phone?accent:ink());if(caption==null&&!glyphOnly)canvas.drawRoundRect(5,5,95,95,23,23,p);}
    if(videoOverlay)p.setShadowLayer(5,0,2,0xcc000000);float currentGlyph=glyphOnly&&isFocused()?glyphScale*1.12f:glyphScale;canvas.translate((1-currentGlyph)*50,(1-currentGlyph)*50);canvas.scale(currentGlyph,currentGlyph);p.setColor(isEnabled()?ink():PlayerPalette.alpha(ink(),110));p.setStrokeWidth(6);p.setStrokeCap(Paint.Cap.ROUND);p.setStrokeJoin(Paint.Join.ROUND);
    p.setStyle(Paint.Style.STROKE);String s=getText().toString();if(main)p.setColor(phone?Color.WHITE:ink());
    if(s.equals("Back")){path(canvas,new float[]{58,14,22,50,58,86},false);canvas.drawLine(22,50,92,50,p);}
    else if(s.equals("Ⅱ")){p.setStyle(Paint.Style.FILL);canvas.drawRoundRect(25,15,40,85,5,5,p);canvas.drawRoundRect(60,15,75,85,5,5,p);}
    else if(s.equals("▶")){p.setStyle(Paint.Style.FILL);path(canvas,new float[]{30,15,85,50,30,85},true);}
    else if(s.contains("☷")){for(int y=22;y<=78;y+=28){canvas.drawPoint(12,y,p);canvas.drawLine(32,y,88,y,p);}}
    else if(s.equals("♡")||s.equals("♥")){p.setStyle(s.equals("♥")?Paint.Style.FILL:Paint.Style.STROKE);Path h=new Path();h.moveTo(50,85);h.cubicTo(36,72,4,48,12,28);h.cubicTo(20,7,43,14,50,30);h.cubicTo(63,6,87,13,90,30);h.cubicTo(98,50,67,73,50,85);canvas.drawPath(h,p);}
    else if(s.contains("⏮")||s.contains("⏭")){if(s.contains("⏮")){canvas.scale(-1,1,50,50);}p.setStyle(Paint.Style.FILL);path(canvas,new float[]{15,22,49,50,15,78},true);path(canvas,new float[]{47,22,81,50,47,78},true);canvas.drawRoundRect(82,22,88,78,2,2,p);}
    else if(s.contains("10")){canvas.drawArc(6,6,94,94,s.startsWith("+")?190:35,285,false,p);path(canvas,s.startsWith("+")?new float[]{6,26,10,2,28,17}:new float[]{76,9,94,14,89,34},false);p.setStyle(Paint.Style.FILL);p.setTextAlign(Paint.Align.CENTER);p.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));p.setTextSize(33);canvas.drawText(s.startsWith("+")?"+10":"−10",50,62,p);}
    else if(s.equals("⚙")){canvas.drawCircle(50,50,26,p);canvas.drawCircle(50,50,10,p);for(int i=0;i<8;i++){canvas.save();canvas.rotate(i*45,50,50);canvas.drawLine(50,8,50,20,p);canvas.restore();}}
    else if(s.equals("▣")){canvas.drawRoundRect(8,18,92,78,6,6,p);canvas.drawLine(6,94,6,94,p);canvas.drawArc(-17,60,37,114,270,90,false,p);canvas.drawArc(-4,73,24,101,270,90,false,p);}
    else if(s.equals("▭")){canvas.drawRoundRect(8,18,92,82,6,6,p);p.setStyle(Paint.Style.FILL);canvas.drawRoundRect(53,48,84,74,3,3,p);}
    else if(s.equals("Audio")||s.equals("Muted")){path(canvas,new float[]{12,36,32,36,53,17,53,83,32,64,12,64},true);if(s.equals("Muted")){canvas.drawLine(68,33,92,67,p);canvas.drawLine(92,33,68,67,p);}else{canvas.drawArc(40,26,80,74,-60,120,false,p);canvas.drawArc(42,9,102,91,-60,120,false,p);}}
    else if(s.equals("▤")){canvas.drawRoundRect(7,18,93,82,6,6,p);canvas.drawLine(20,59,43,59,p);canvas.drawLine(56,59,80,59,p);canvas.drawLine(30,72,70,72,p);}
    else {p.setStyle(Paint.Style.FILL);p.setTextSize(30);p.setTextAlign(Paint.Align.CENTER);canvas.drawText(s,50,60,p);}
    canvas.restore();if(caption!=null){p.setStyle(Paint.Style.FILL);p.setColor(ink());p.setTextSize(Math.max(12,getHeight()*.25f));p.setTextAlign(Paint.Align.LEFT);canvas.drawText(caption,size*1.08f,getHeight()*.59f,p);}
  }
  private void path(Canvas c,float[] xy,boolean close){Path path=new Path();path.moveTo(xy[0],xy[1]);for(int i=2;i<xy.length;i+=2)path.lineTo(xy[i],xy[i+1]);if(close)path.close();c.drawPath(path,p);}
}

