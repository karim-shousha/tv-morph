package local.tvmorph.tv;
import android.content.Context;
import android.graphics.Color;
/** Shared dark surfaces and accent for the native player and both side panels. */
final class PlayerPalette {
  static boolean phone(Context context){return context instanceof PlayerActivity&&((PlayerActivity)context).phonePalette();}
  static int accent(Context context){if(phone(context))return 0xff2463eb;String theme=UiSettings.prefs(context).getString("theme","night");return theme.equals("night")||theme.equals("blue")?0xffd2def4:UiSettings.color(context,"uiAccent",0xffd2def4);}
  static boolean daylight(Context context){return phone(context)&&!"dark".equals(context.getSharedPreferences("cleartv",Context.MODE_PRIVATE).getString("appearance","light"));}
  static int text(Context context){return daylight(context)?0xff193352:0xfff7f9ff;}
  static int shade(int color,float factor){return Color.rgb(Math.min(255,Math.round(Color.red(color)*factor)),Math.min(255,Math.round(Color.green(color)*factor)),Math.min(255,Math.round(Color.blue(color)*factor)));}
  static int alpha(int color,int opacity){return (color&0xffffff)|(opacity<<24);}
  static int surface(Context context){if(phone(context))return daylight(context)?0xfff4f7fb:0xff263a55;String theme=UiSettings.prefs(context).getString("theme","night");return theme.equals("night")||theme.equals("blue")?0xff29384f:UiSettings.color(context,"uiSurface",0xff29384f);}
}
