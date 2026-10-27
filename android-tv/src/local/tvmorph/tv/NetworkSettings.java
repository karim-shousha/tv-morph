package local.tvmorph.tv;
import android.app.*;import android.content.*;import android.provider.Settings;
final class NetworkSettings {
 static void open(Activity a){for(String action:new String[]{Settings.ACTION_WIFI_SETTINGS,Settings.ACTION_WIRELESS_SETTINGS,Settings.ACTION_SETTINGS}){try{a.startActivity(new Intent(action));return;}catch(ActivityNotFoundException|SecurityException ignored){}}String lang=UiSettings.language(a);String message=lang.equals("ar")?"افتح إعدادات التلفزيون ← الشبكة والإنترنت ← Wi-Fi.":lang.equals("fr")?"Ouvrez Paramètres du téléviseur → Réseau et Internet → Wi-Fi.":lang.equals("zh")?"打开电视设置 → 网络和互联网 → Wi-Fi。":lang.equals("ja")?"テレビの設定 → ネットワークとインターネット → Wi-Fi を開いてください。":"Open TV Settings → Network & Internet → Wi-Fi.";new AlertDialog.Builder(a).setTitle("Wi-Fi").setMessage(message).setPositiveButton(lang.equals("ar")?"تمام":lang.equals("fr")?"Fermer":lang.equals("zh")?"确定":lang.equals("ja")?"閉じる":"OK",null).show();}
}
