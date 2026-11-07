package local.cleartv.mobile;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import java.io.IOException;

/** The phone shell delegates to the independent Bridge library. */
final class BridgeLaunch {
    private BridgeLaunch() {}

    static void open(Activity host) throws IOException {
        if (Build.VERSION.SDK_INT < 29)
            throw new IOException("Bridge requires Android 10 or later.");
        Intent intent = new Intent().setClassName(host, "tv.appbridge.phase0.rt.ui.HostActivity");
        intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (host.getPackageManager().resolveActivity(intent, 0) == null)
            throw new IOException("Bridge is unavailable in this build.");
        host.runOnUiThread(() -> host.startActivity(intent));
    }
}
