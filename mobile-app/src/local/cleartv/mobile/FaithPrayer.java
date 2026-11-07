package local.cleartv.mobile;

import android.app.*;
import android.content.*;
import android.os.Build;
import android.provider.Settings;
import android.net.Uri;
import org.json.*;
import java.util.*;
import java.text.SimpleDateFormat;

/** Private local settings and OS alarms. Does not contact HER, Morph or any server. */
final class FaithPrayer {
    static final String PREFS = "morph-faith-prayer";
    static final String[] VOICES = {"egypt", "masr", "algeria", "ezeldeen", "makka", "Qatar", "tarekahmed"};
    static final String[] VOICES_AR = {"مصر — الأذان الرئيسي", "مصر — صوت آخر", "الجزائر", "عز الدين", "مكة", "قطر", "طارق أحمد"};
    static final String[] VOICES_EN = {"Egypt · Main", "Egypt · Alternative", "Algeria", "Ezz El-Din", "Makkah", "Qatar", "Tarek Ahmed"};
    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    static boolean host(Context c) { return prefs(c).getBoolean("hostEnabled", false); }
    static JSONObject settings(Context c) { try { return new JSONObject(prefs(c).getString("settings", "{}")); } catch (Exception e) { return new JSONObject(); } }
    static boolean prayerEnabled(JSONObject config,int prayer,boolean sound) {
        if(prayer<0||prayer>=FaithPrayerMath.KEYS.length||prayer==1)return false;
        String key=FaithPrayerMath.KEYS[prayer];JSONObject enabled=config.optJSONObject("enabledPrayers"),adhan=config.optJSONObject("adhanPrayers");
        return (enabled==null||enabled.optBoolean(key,true))&&(!sound||(config.optBoolean("enabled")&&(adhan==null||adhan.optBoolean(key,true))));
    }
    static boolean notifications(Context c) {
        return c.getSystemService(NotificationManager.class).areNotificationsEnabled()
            && (Build.VERSION.SDK_INT < 33 || c.checkSelfPermission("android.permission.POST_NOTIFICATIONS") == android.content.pm.PackageManager.PERMISSION_GRANTED);
    }
    static boolean exact(Context c) {
        if (Build.VERSION.SDK_INT < 31) return true;
        try { return (Boolean) AlarmManager.class.getMethod("canScheduleExactAlarms").invoke(c.getSystemService(AlarmManager.class)); }
        catch (Exception e) { return false; }
    }
    static Map<String,Integer> offsets(JSONObject config) {
        Map<String,Integer> values = new HashMap<>(); JSONObject obj = config.optJSONObject("adjustments");
        if (obj != null) for (String key : FaithPrayerMath.KEYS) values.put(key, Math.max(-30, Math.min(30, obj.optInt(key))));
        return values;
    }
    static Date[] times(JSONObject config, long now, int offset) {
        return FaithPrayerMath.times(config.optDouble("latitude"), config.optDouble("longitude"), TimeZone.getTimeZone(config.optString("timezone")), now, offset, config.optString("method", "egyptian"), config.optBoolean("hanafi"), offsets(config));
    }
    static synchronized void schedule(Context c) {
        SharedPreferences p = prefs(c); AlarmManager manager = c.getSystemService(AlarmManager.class);
        PendingIntent pending = PendingIntent.getBroadcast(c, 7301, new Intent(c, FaithAlarmReceiver.class).setAction("local.cleartv.mobile.FAITH_ADHAN"), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        manager.cancel(pending); p.edit().remove("nextAt").remove("nextPrayer").apply();
        JSONObject config = settings(c);
        if (!host(c) || (!config.optBoolean("enabled")&&!config.optBoolean("reminders")) || !config.optBoolean("configured") || !notifications(c) || !exact(c)) return;
        long now = System.currentTimeMillis(), next = Long.MAX_VALUE; int nextIndex = -1;
        try {
            for (int day = 0; day < 3; day++) {
                Date[] dates = times(config, now, day);
                for (int i = 0; i < dates.length; i++) if (i != 1 && prayerEnabled(config,i,false) && dates[i] != null && dates[i].getTime() > now + 1000 && dates[i].getTime() < next) { next = dates[i].getTime(); nextIndex = i; }
            }
            if (nextIndex >= 0) { manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pending); p.edit().putLong("nextAt", next).putInt("nextPrayer", nextIndex).apply(); }
        } catch (Exception ignored) { }
    }
    static JSONObject snapshot(Context c) throws Exception {
        JSONObject config = settings(c);if(!FaithVoicePacks.available(c,config.optString("voice","egypt")))config.put("voice","egypt");JSONObject result = new JSONObject().put("settings", config).put("notifications", notifications(c)).put("exactAlarms", exact(c)).put("hostEnabled", host(c)).put("voicePackInstalled",FaithVoicePacks.installed(c));
        result.put("cities", new JSONArray(new String(Network.read(c.getAssets().open("faith-cities.json"), 64 * 1024), "UTF-8")));
        JSONArray voices = new JSONArray(); for (int i = 0; i < VOICES.length; i++) voices.put(new JSONObject().put("id", VOICES[i]).put("ar", VOICES_AR[i]).put("en", VOICES_EN[i]).put("available",FaithVoicePacks.available(c,VOICES[i]))); result.put("voices", voices);
        result.put("deviceTimezone", TimeZone.getDefault().getID()); result.put("playing", FaithAdhanService.isPlaying());
        JSONArray today = new JSONArray();
        if (config.optBoolean("configured")) {
            long now = System.currentTimeMillis(); Date[] moments = times(config, now, 0);
            TimeZone zone = TimeZone.getTimeZone(config.optString("timezone")); SimpleDateFormat clock = new SimpleDateFormat("HH:mm", Locale.ROOT); clock.setTimeZone(zone); SimpleDateFormat date = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT); date.setTimeZone(zone); result.put("date", date.format(new Date(now)));
            for (int i = 0; i < moments.length; i++) if (moments[i] != null) today.put(new JSONObject().put("key", FaithPrayerMath.KEYS[i]).put("ar", FaithPrayerMath.AR[i]).put("en", FaithPrayerMath.EN[i]).put("at", moments[i].getTime()).put("time", clock.format(moments[i])));
        }
        return result.put("today", today).put("nextAt", prefs(c).getLong("nextAt", 0)).put("scheduled", prefs(c).getLong("nextAt", 0) > System.currentTimeMillis());
    }
    static JSONObject command(Activity owner, JSONObject request) throws Exception {
        String operation = request.optString("operation", "info");
        if (operation.equals("host")) {
            prefs(owner).edit().putBoolean("hostEnabled", request.optBoolean("enabled")).apply();
            if (!request.optBoolean("enabled")){
                JSONObject quiet=settings(owner);quiet.put("enabled",false).put("reminders",false);
                prefs(owner).edit().putString("settings",quiet.toString()).apply();
                owner.stopService(new Intent(owner, FaithAdhanService.class));owner.getSystemService(NotificationManager.class).cancel(7314);
            }
            schedule(owner); return snapshot(owner);
        }
        if(operation.equals("stop")){owner.stopService(new Intent(owner, FaithAdhanService.class));return snapshot(owner);}
        // Turning sound off must work immediately, even with an unfinished location form.
        if(operation.equals("disable")){
            JSONObject quiet=settings(owner);quiet.put("enabled",false);
            prefs(owner).edit().putString("settings",quiet.toString()).apply();
            owner.stopService(new Intent(owner,FaithAdhanService.class));
            schedule(owner);return snapshot(owner);
        }
        if (!host(owner)) throw new IllegalStateException("faith_disabled");
        if(operation.equals("importVoices")){FaithVoicePacks.choose(owner);return snapshot(owner);}
        if(operation.equals("removeVoices")){FaithVoicePacks.remove(owner);return snapshot(owner);}
        if (operation.equals("notifications")) {
            owner.getSystemService(NotificationManager.class).createNotificationChannel(new NotificationChannel("morph-faith-prayer-reminders","ar".equals(owner.getSharedPreferences("cleartv",0).getString("language","ar"))?"تنبيهات الصلاة":"Prayer reminders",NotificationManager.IMPORTANCE_DEFAULT));
            owner.runOnUiThread(() -> { if (Build.VERSION.SDK_INT >= 33 && owner.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) owner.requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 7311); else { Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, owner.getPackageName()); owner.startActivity(intent); } });
        } else if (operation.equals("alarmAccess")) {
            owner.runOnUiThread(() -> { if (Build.VERSION.SDK_INT >= 31) owner.startActivity(new Intent("android.settings.REQUEST_SCHEDULE_EXACT_ALARM", Uri.parse("package:" + owner.getPackageName()))); });
        } else if (operation.equals("save")) {
            JSONObject incoming = request.getJSONObject("settings"), clean = new JSONObject();
            double lat = incoming.getDouble("latitude"), lon = incoming.getDouble("longitude"); String timezone = incoming.getString("timezone"), voice = incoming.optString("voice", "egypt"), method = incoming.optString("method", "egyptian");
            if (!Double.isFinite(lat) || !Double.isFinite(lon) || lat < -89 || lat > 89 || lon < -180 || lon > 180 || !Arrays.asList(TimeZone.getAvailableIDs()).contains(timezone) || !FaithVoicePacks.available(owner,voice) || !Arrays.asList("egyptian","umm_al_qura","isna","karachi","dubai","kuwait","qatar","singapore","moonsighting","mwl").contains(method)) throw new IllegalArgumentException("invalid_prayer_settings");
            clean.put("configured", true).put("latitude", lat).put("longitude", lon).put("timezone", timezone).put("city", incoming.optString("city", "").substring(0, Math.min(100, incoming.optString("city", "").length()))).put("voice", voice).put("method", method).put("hanafi", incoming.optBoolean("hanafi"));
            clean.put("adjustments", new JSONObject(offsets(incoming)));
            for(String map:new String[]{"enabledPrayers","adhanPrayers"}){JSONObject values=incoming.optJSONObject(map);if(values!=null){JSONObject saved=new JSONObject();for(String key:FaithPrayerMath.KEYS)saved.put(key,values.optBoolean(key,true));clean.put(map,saved);}}

            boolean enabled = incoming.optBoolean("enabled") && notifications(owner) && exact(owner);
            clean.put("enabled", enabled).put("reminders",incoming.optBoolean("reminders")&&notifications(owner)&&exact(owner)); prefs(owner).edit().putString("settings", clean.toString()).apply();
            if (!enabled || FaithAdhanService.isPlaying() && FaithAdhanService.activePrayer()>=0 && !prayerEnabled(clean,FaithAdhanService.activePrayer(),true)) owner.stopService(new Intent(owner, FaithAdhanService.class));
            schedule(owner); JSONObject result = snapshot(owner); if ((incoming.optBoolean("enabled")||incoming.optBoolean("reminders")) && (!notifications(owner)||!exact(owner))) result.put("permissionNeeded", true); return result;
        } else if (operation.equals("preview")) {
            String voice = request.optString("voice", "egypt"); if (!FaithVoicePacks.available(owner,voice)) throw new IllegalArgumentException("voice_pack_required");
            owner.runOnUiThread(() -> owner.startForegroundService(new Intent(owner, FaithAdhanService.class).putExtra("voice", voice).putExtra("preview", true)));
        } else if (operation.equals("stop")) owner.stopService(new Intent(owner, FaithAdhanService.class));
        return snapshot(owner);
    }
    static void reminder(Context c,int prayer){
        if(!host(c)||!notifications(c)||prayer<0||prayer>=FaithPrayerMath.KEYS.length)return;
        boolean ar="ar".equals(c.getSharedPreferences("cleartv",0).getString("language","ar"));NotificationManager manager=c.getSystemService(NotificationManager.class);String id="morph-faith-prayer-reminders";
        manager.createNotificationChannel(new NotificationChannel(id,ar?"تنبيهات الصلاة":"Prayer reminders",NotificationManager.IMPORTANCE_DEFAULT));
        PendingIntent open=PendingIntent.getActivity(c,7316,new Intent(c,MainActivity.class).putExtra("openWorship",true).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification notice=new Notification.Builder(c,id).setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setColor(0xff2463eb).setContentTitle(ar?"حان وقت "+FaithPrayerMath.AR[prayer]:"Time for "+FaithPrayerMath.EN[prayer]).setContentText(ar?"افتح عباداتي لعرض مواقيت الصلاة":"Open My Worship for prayer times").setContentIntent(open).setAutoCancel(true).build();manager.notify(7314,notice);
    }
}
