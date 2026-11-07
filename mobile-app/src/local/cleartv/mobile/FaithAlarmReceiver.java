package local.cleartv.mobile;
import android.content.*;
import org.json.JSONObject;

/** Recomputes offline after each prayer, reboot, clock change or timezone change. */
public final class FaithAlarmReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        boolean alarm = "local.cleartv.mobile.FAITH_ADHAN".equals(intent.getAction());
        long expected = FaithPrayer.prefs(context).getLong("nextAt", 0), now = System.currentTimeMillis();
        int prayer = FaithPrayer.prefs(context).getInt("nextPrayer", -1);
        JSONObject config = FaithPrayer.settings(context);
        if (alarm && FaithPrayer.host(context) && (config.optBoolean("enabled")||config.optBoolean("reminders")) && expected > 0 && now >= expected - 1000 && now - expected < 10 * 60000L && prayer >= 0) {
            String last = prayer + ":" + expected;
            if (!last.equals(FaithPrayer.prefs(context).getString("lastPlayed", ""))) {
                FaithPrayer.prefs(context).edit().putString("lastPlayed", last).apply();
                if(FaithPrayer.prayerEnabled(config,prayer,true)){try { context.startForegroundService(new Intent(context, FaithAdhanService.class).putExtra("prayer", prayer).putExtra("voice", config.optString("voice", "egypt"))); } catch (Exception ignored) { FaithPrayer.reminder(context,prayer); }}else if(config.optBoolean("reminders")&&FaithPrayer.prayerEnabled(config,prayer,false))FaithPrayer.reminder(context,prayer);
            }
        }
        FaithPrayer.schedule(context);
    }
}
