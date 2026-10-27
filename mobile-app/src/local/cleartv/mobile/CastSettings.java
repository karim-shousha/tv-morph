package local.cleartv.mobile;

import android.app.Activity;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.provider.Settings;

/** Opens the phone's own Cast picker; never captures or starts sharing itself. */
final class CastSettings {
    static boolean open(Activity activity) {
        try {
            activity.startActivity(new Intent(Settings.ACTION_CAST_SETTINGS));
            return true;
        } catch (ActivityNotFoundException | SecurityException unavailable) {
            return false;
        }
    }
}
