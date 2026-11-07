package local.tvmorph.tv;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.SystemClock;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

/** Device-wide trial, separate from profiles. Existing Plus remains the paid authority. */
final class BridgeAccess {
    static final long TRIAL_MS=72L*60*60*1000;
    private static final ExecutorService worker=Executors.newSingleThreadExecutor();
    static JSONObject status(Context context,boolean begin){return BridgeTrial.status(context,begin);}
    static void require(Activity host,Runnable allowed,Runnable blocked){
        if(status(host,true).optLong("remainingMs")>0){allowed.run();return;}
        worker.execute(()->{
            boolean paid=PlusAccess.verified(host);
            host.runOnUiThread(()->{if(!host.isFinishing()&&!host.isDestroyed()){if(paid)allowed.run();else blocked.run();}});
        });
    }
    private BridgeAccess(){}
}
