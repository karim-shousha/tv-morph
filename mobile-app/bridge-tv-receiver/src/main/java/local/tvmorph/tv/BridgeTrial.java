package local.tvmorph.tv;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.SystemClock;
import org.json.JSONObject;
/** Shared device trial ledger for the launcher and standalone TV Bridge. */
public final class BridgeTrial {
    public static final long TRIAL_MS=72L*60*60*1000;
    public static synchronized JSONObject status(Context context,boolean begin){
        SharedPreferences prefs=context.getSharedPreferences("morph-bridge-trial",Context.MODE_PRIVATE);
        long wall=System.currentTimeMillis(),elapsed=SystemClock.elapsedRealtime();
        long start=prefs.getLong("start",0),last=prefs.getLong("last",wall),uptime=prefs.getLong("uptime",elapsed);
        if(start==0&&begin)start=wall;
        long now=Math.max(wall,last+(elapsed>=uptime?elapsed-uptime:0));
        boolean rollback=prefs.getBoolean("rollback",false)||wall+300000<last;
        if(start>0)prefs.edit().putLong("start",start).putLong("last",now).putLong("uptime",elapsed).putBoolean("rollback",rollback).apply();
        long remaining=start==0?TRIAL_MS:rollback?0:Math.max(0,TRIAL_MS-(now-start));
        JSONObject result=new JSONObject();
        try{result.put("startedAt",start).put("endsAt",start==0?0:start+TRIAL_MS).put("remainingMs",remaining).put("expired",remaining==0);}catch(Exception ignored){}
        return result;
    }
    private BridgeTrial(){}
}
