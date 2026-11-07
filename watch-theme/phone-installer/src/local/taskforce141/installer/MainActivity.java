package local.taskforce141.installer;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.graphics.Color;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        int padding = (int)(24 * getResources().getDisplayMetrics().density);
        layout.setPadding(padding,padding * 2,padding,padding);
        layout.setBackgroundColor(Color.rgb(8,11,9));
        TextView title = new TextView(this);
        title.setText("TASK FORCE / 141");
        title.setTextColor(Color.rgb(255,211,56));
        title.setTextSize(25);
        layout.addView(title);
        TextView info = new TextView(this);
        info.setText("Experimental Galaxy Watch Tizen companion package\n\n" +
            "Keep your watch connected to Galaxy Wearable by Bluetooth. " +
            "Galaxy Wearable may detect the bundled 141 App Grid widget after installation.\n\n" +
            "Check the watch app list for 141 App Grid. If it does not appear, installation has not been confirmed. " +
            "Opening this screen does not mean the watch app was installed.\n\n" +
            "This is an experimental installer, not a firmware upgrade. It does not replace Home, notifications, or system settings.\n\n" +
            "No Internet, contacts, location, storage, microphone or health permissions are requested by this phone app.");
        info.setTextColor(Color.rgb(228,235,220));
        info.setTextSize(16);
        info.setPadding(0,padding,0,padding);
        layout.addView(info);
        Button open = new Button(this);
        open.setText("Open Galaxy Wearable");
        open.setOnClickListener(new View.OnClickListener() {
          @Override public void onClick(View view) {
            Intent intent=getPackageManager().getLaunchIntentForPackage("com.samsung.android.app.watchmanager");
            if(intent!=null) startActivity(intent);
          }
        });
        layout.addView(open);
        setContentView(layout);
    }
}
