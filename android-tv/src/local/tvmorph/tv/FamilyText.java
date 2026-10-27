package local.tvmorph.tv;
import android.content.Context;import java.util.*;
final class FamilyText {
private static final Map<String,String[]> rows=new HashMap<>();static{
rows.put("Phone parental-control request — enter the parent PIN to approve",new String[]{"Demande du téléphone — saisissez le PIN parental pour confirmer","手机请求家长控制操作，请输入家长 PIN 批准","スマートフォンからの管理リクエストです。保護者 PIN で承認してください"});
rows.put("Set a parent PIN in Morph TV Settings > Parental controls, then retry.",new String[]{"Définissez un PIN dans Paramètres Morph TV > Contrôle parental, puis réessayez.","请先在 Morph TV 设置 > 家长控制中设置 PIN，然后重试。","Morph TV の設定 > 保護者による管理で PIN を設定し、再試行してください。"});
rows.put("Parental controls",new String[]{"Contrôle parental","家长控制","保護者による管理"});
rows.put("PIN · 4–8 digits",new String[]{"PIN · 4 à 8 chiffres","PIN · 4–8 位数字","PIN · 4～8 桁"});
rows.put("App locked",new String[]{"Application verrouillée","应用已锁定","アプリはロック中"});
rows.put("Unlock",new String[]{"Déverrouiller","解锁","解除"});
rows.put("Cancel",new String[]{"Annuler","取消","キャンセル"});
rows.put("Too many attempts. Wait ",new String[]{"Trop de tentatives. Attendez ","尝试过多，请等待 ","試行回数が多すぎます。待機: "});
rows.put(" seconds.",new String[]{" secondes."," 秒。"," 秒。"});
rows.put("Use 4–8 digits.",new String[]{"Utilisez 4 à 8 chiffres.","请输入 4–8 位数字。","4～8 桁の数字を入力してください。"});
rows.put("Incorrect PIN.",new String[]{"PIN incorrect.","PIN 不正确。","PIN が違います。"});
rows.put("New PIN · 4–8 digits",new String[]{"Nouveau PIN · 4 à 8 chiffres","新 PIN · 4–8 位数字","新しい PIN · 4～8 桁"});
rows.put("Confirm PIN",new String[]{"Confirmer le PIN","确认 PIN","PIN を確認"});
rows.put("Set app-lock PIN",new String[]{"Définir le PIN parental","设置家长 PIN","保護者 PIN を設定"});
rows.put("Set app PIN",new String[]{"Définir le PIN de cette application","设置此应用 PIN","このアプリの PIN を設定"});
rows.put("Save",new String[]{"Enregistrer","保存","保存"});
rows.put("PINs do not match.",new String[]{"Les PIN sont différents.","两次 PIN 不一致。","PIN が一致しません。"});
rows.put("Could not save PIN. Try again.",new String[]{"Impossible de sauvegarder. Réessayez.","无法保存 PIN，请重试。","保存できません。再試行してください。"});
rows.put("App locks",new String[]{"Contrôle parental","家长控制","保護者による管理"});
rows.put("Set PIN",new String[]{"Définir le PIN","设置 PIN","PIN を設定"});
rows.put("Back",new String[]{"Retour","返回","戻る"});
rows.put("Choose locked apps",new String[]{"Choisir les applications verrouillées","选择要锁定的应用","ロックするアプリを選択"});
rows.put("Change PIN",new String[]{"Modifier le PIN parental","更改家长 PIN","保護者 PIN を変更"});
rows.put("Remove PIN and locks",new String[]{"Supprimer le PIN et les restrictions","删除 PIN 和限制","PIN と制限を解除"});
rows.put("Remove all app locks?",new String[]{"Supprimer toutes les restrictions et durées ?","删除所有应用锁和时长限制？","すべてのロックと時間制限を解除しますか？"});
rows.put("Remove locks",new String[]{"Supprimer les restrictions","删除限制","制限を解除"});
rows.put("Could not read TV apps.",new String[]{"Impossible de lire les applications.","无法读取电视应用。","アプリを読み込めません。"});
rows.put("App time allowances",new String[]{"Temps autorisé par application","应用可用时长","アプリごとの利用時間"});
rows.put("No time limit",new String[]{"Aucune limite","不限制时长","時間制限なし"});
rows.put("15 minutes",new String[]{"15 minutes","15 分钟","15 分"});
rows.put("30 minutes",new String[]{"30 minutes","30 分钟","30 分"});
rows.put("60 minutes",new String[]{"60 minutes","60 分钟","60 分"});
rows.put("Custom minutes",new String[]{"Durée personnalisée","自定义分钟数","分数を指定"});
rows.put("Minutes (1–1440)",new String[]{"Minutes (1–1440)","分钟数（1–1440）","分数（1～1440）"});
rows.put("Enter a number from 1 to 1440.",new String[]{"Saisissez un nombre de 1 à 1440.","请输入 1 到 1440。","1～1440 を入力してください。"});
rows.put("Time saved.",new String[]{"Durée enregistrée.","时长已保存。","利用時間を保存しました。"});
rows.put("Time is up",new String[]{"Temps écoulé","使用时间已到","時間になりました"});
rows.put("Remaining minutes: ",new String[]{"Minutes restantes : ","剩余分钟：","残りの分数: "});
rows.put("Open Accessibility settings",new String[]{"Ouvrir les paramètres d’accessibilité","打开无障碍设置","ユーザー補助設定を開く"});
rows.put("Time limits for external apps require the Morph TV navigation service. Enable it manually in TV Settings → Accessibility. The service observes the foreground app package name to count use, without reading screen contents. Time is a saved allowance, not an automatic daily reset.",new String[]{"Les limites des applications externes nécessitent le service de navigation Morph TV. Activez-le manuellement dans les paramètres d’accessibilité du téléviseur. Le service observe le nom de l’application au premier plan, sans lire le contenu de l’écran. Le temps restant est conservé, sans renouvellement quotidien automatique.","外部应用的时长限制需要 Morph TV 导航服务。请在电视设置 → 无障碍中手动启用。服务仅观察前台应用包名，不读取屏幕内容。剩余时长会保存，不会每天自动重置。","外部アプリの時間制限には Morph TV ナビゲーションサービスが必要です。テレビの設定 → ユーザー補助から手動で有効にしてください。画面内容を読まず、前面のアプリ名で利用時間を計測します。残り時間は保存され、毎日自動ではリセットされません。"});
rows.put("Set a parent PIN to manage individual app locks and time allowances. Each app can have its own PIN. External app timers need the optional navigation service. Your PIN is not stored as plain text or sent to the phone.",new String[]{"Définissez un PIN parental pour gérer séparément les verrous et les durées. Chaque application peut avoir son propre PIN. Les minuteries externes nécessitent le service de navigation facultatif. Le PIN n’est ni stocké en clair ni envoyé au téléphone.","设置家长 PIN 以分别管理各应用的锁和时长。每个应用可以使用自己的 PIN。外部应用计时需要可选导航服务。PIN 不会明文保存，也不会发送到手机。","保護者 PIN でアプリごとのロックと利用時間を管理します。各アプリに固有の PIN を設定できます。外部アプリの計時には任意のナビゲーションサービスが必要です。PIN は平文で保存されず、スマートフォンにも送信されません。"});
}
static String t(Context c,String ar,String en){String l=UiSettings.language(c);if(l.equals("ar"))return ar;String[] r=rows.get(en);int i=l.equals("fr")?0:l.equals("zh")?1:l.equals("ja")?2:-1;return r!=null&&i>=0?r[i]:en;}
}
