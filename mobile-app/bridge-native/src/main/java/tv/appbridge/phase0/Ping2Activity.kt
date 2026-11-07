package tv.appbridge.phase0

import android.app.Activity
import android.os.Bundle
import android.widget.TextView

/** Bisect: new activity in the ORIGINAL package. */
class Ping2Activity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val t = TextView(this)
        t.text = "ping2"
        setContentView(t)
    }
}
