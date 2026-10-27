package local.tvmorph.tv;
import java.util.Locale;
/** Infer common media containers only when the provider omitted a media MIME type. */
final class UsbMediaTypes{
 static String resolve(String type,String name){String t=type==null?"":type.toLowerCase(Locale.ROOT);if(t.startsWith("video/")||t.startsWith("audio/")||t.startsWith("image/"))return t;String n=name==null?"":name.toLowerCase(Locale.ROOT);int dot=n.lastIndexOf('.');String e=dot<0?"":n.substring(dot+1);if(e.isEmpty())return null;
 if((" mp4 m4v mkv avi mov webm ts tp trp mts m2ts mpg mpeg mpe m2v vob vro wmv asf flv 3gp 3g2 divx ogv rm rmvb ").contains(" "+e+" "))return e.equals("mkv")?"video/x-matroska":e.equals("ts")||e.equals("m2ts")||e.equals("mts")?"video/mp2t":e.equals("mp4")||e.equals("m4v")?"video/mp4":"video/*";
 if((" mp3 aac m4a wav flac ogg oga opus wma aif aiff ac3 eac3 dts ape alac ").contains(" "+e+" "))return "audio/*";
 if((" jpg jpeg png webp bmp gif heic heif avif tif tiff ").contains(" "+e+" "))return "image/*";return null;}
 private UsbMediaTypes(){}
}
