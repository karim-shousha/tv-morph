package local.cleartv.mobile;
import android.app.*;import android.content.*;import android.content.res.AssetFileDescriptor;import android.media.*;import android.os.*;import java.util.Arrays;

/** Bundled full-length muezzins, foreground playback, explicit stop and transient focus. */
public final class FaithAdhanService extends Service {
    private MediaPlayer player; private AudioFocusRequest focus; private static volatile boolean playing; private static volatile int currentPrayer=-1;
    static boolean isPlaying() { return playing; }
    static int activePrayer() { return currentPrayer; }
    @Override public IBinder onBind(Intent intent) { return null; }
    @Override public int onStartCommand(Intent intent, int flags, int id) {
        if (intent == null || "stop".equals(intent.getAction()) || !FaithPrayer.host(this)) { release(); stopSelf(); return START_NOT_STICKY; }
        release(); String voice = intent.getStringExtra("voice"); if (!FaithVoicePacks.available(this,voice)) voice = "egypt";
        boolean ar = "ar".equals(getSharedPreferences("cleartv", 0).getString("language", "ar")); int prayer = intent.getIntExtra("prayer", -1);
        NotificationManager manager = getSystemService(NotificationManager.class); String channel = "morph-faith-adhan-playback";
        NotificationChannel nc = new NotificationChannel(channel, ar ? "أذان عباداتي" : "My Worship Adhan", NotificationManager.IMPORTANCE_LOW); nc.setSound(null, null); manager.createNotificationChannel(nc);
        PendingIntent stop = PendingIntent.getService(this, 7312, new Intent(this, FaithAdhanService.class).setAction("stop"), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        PendingIntent open = PendingIntent.getActivity(this, 7313, new Intent(this, MainActivity.class).putExtra("openWorship",true).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        String title = prayer >= 0 && prayer < FaithPrayerMath.AR.length ? (ar ? "حان وقت " + FaithPrayerMath.AR[prayer] : "Time for " + FaithPrayerMath.EN[prayer]) : (ar ? "تجربة صوت المؤذن" : "Muezzin preview");
        Notification notification = new Notification.Builder(this, channel).setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setColor(0xff2463eb).setContentTitle(title).setContentText(ar ? "الأذان يعمل من الملفات المحفوظة على جهازك" : "Playing the bundled adhan offline").setContentIntent(open).setOngoing(true).addAction(new Notification.Action.Builder(null, ar ? "إيقاف" : "Stop", stop).build()).build();
        startForeground(7310, notification);
        if(!intent.getBooleanExtra("preview",false)&&!FaithPrayer.prayerEnabled(FaithPrayer.settings(this),prayer,true)){release();stopSelf();return START_NOT_STICKY;}
        try {
            AudioAttributes attributes = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build();
            focus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT).setAudioAttributes(attributes).setOnAudioFocusChangeListener(change -> { if (change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) stopSelf(); }).build();
            AudioManager audio = getSystemService(AudioManager.class); if (audio.requestAudioFocus(focus) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) { FaithPrayer.reminder(this,prayer);stopSelf(); return START_NOT_STICKY; }
            local.tvmorph.tv.PhoneFaithAudio.begin();player = new MediaPlayer(); player.setAudioAttributes(attributes); player.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            if("egypt".equals(voice)){try (AssetFileDescriptor file = getAssets().openFd("faith-adhan/egypt.mp3")) { player.setDataSource(file.getFileDescriptor(), file.getStartOffset(), file.getLength()); }}else player.setDataSource(new java.io.File(FaithVoicePacks.directory(this),voice+".mp3").getAbsolutePath());
            player.setOnCompletionListener(p -> stopSelf()); player.setOnErrorListener((p, what, extra) -> { FaithPrayer.reminder(this,prayer);stopSelf(); return true; }); player.prepare(); player.start(); currentPrayer=prayer; playing = true;
        } catch (Exception e) { FaithPrayer.reminder(this,prayer);stopSelf(); }
        return START_NOT_STICKY;
    }
    private void release() { playing = false; currentPrayer=-1; if (player != null) { try { player.stop(); } catch (Exception ignored) {} player.release(); player = null; } if (focus != null) { getSystemService(AudioManager.class).abandonAudioFocusRequest(focus); focus = null; }local.tvmorph.tv.PhoneFaithAudio.end(); }
    @Override public void onDestroy() { release(); stopForeground(true); super.onDestroy(); }
}
