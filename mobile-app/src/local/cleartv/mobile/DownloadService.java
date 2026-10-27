package local.cleartv.mobile;
import android.app.*;import android.content.*;import android.os.*;
/** Explicit ten-minute foreground download session, started by the user's share button. */
public class DownloadService extends Service {
 private LanHttp server;private final Handler timer=new Handler(Looper.getMainLooper());private volatile long expires;
 private final Runnable stop=()->stopSelf();
 @Override public IBinder onBind(Intent intent){return null;}
 @Override public int onStartCommand(Intent intent,int flags,int id){
  if(intent!=null&&"stop".equals(intent.getAction())){stopSelf();return START_NOT_STICKY;}
  NotificationManager notifications=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
  notifications.createNotificationChannel(new NotificationChannel("tv-download",MobileStrings.t(this,"تنزيل تطبيق التلفزيون"),NotificationManager.IMPORTANCE_LOW));
  PendingIntent stopIntent=PendingIntent.getService(this,0,new Intent(this,DownloadService.class).setAction("stop"),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  startForeground(42,new Notification.Builder(this,"tv-download").setSmallIcon(android.R.drawable.stat_sys_download).setContentTitle(MobileStrings.t(this,"Morph TV · تحميل التلفزيون جاهز")).setContentText(MobileStrings.t(this,"الرابط متاح على شبكتك لمدة ١٠ دقائق، حتى لو خرجت من التطبيق.")).setOngoing(true).addAction(new Notification.Action.Builder(null,MobileStrings.t(this,"إيقاف التحميل"),stopIntent).build()).build());
  expires=System.currentTimeMillis()+600000;timer.removeCallbacks(stop);timer.postDelayed(stop,600000);
  if(server==null)try{final byte[] apk=ReceiverApk.read(getAssets().open("android-tv.apk"));server=new LanHttp(8788,(method,path,headers,body)->System.currentTimeMillis()>expires?new LanHttp.Response(410,"text/plain",new byte[0]):ApkDownload.response(apk,method,path,headers));}catch(Exception e){stopSelf();}
  return START_NOT_STICKY;
 }
 @Override public void onDestroy(){timer.removeCallbacks(stop);if(server!=null)server.close();stopForeground(true);super.onDestroy();}
}
