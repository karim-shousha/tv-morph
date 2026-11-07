package local.cleartv.mobile;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import org.json.JSONObject;

/** Local page launches must never queue behind TV scans or network requests. */
final class PhoneUiLaunch {
    interface Reply {void send(String id,boolean ok,Object value);}
    static boolean dispatch(Activity host,String id,String action,Reply reply){
        if(!action.equals("bridgeOpen")&&!action.equals("remoteOpen")&&!action.equals("matchesOpen")&&!action.equals("cleanerOpen"))return false;
        host.runOnUiThread(()->{
            try{
                JSONObject result=new JSONObject().put("opened",true);
                if(action.equals("cleanerOpen")){host.startActivity(new Intent(host,local.tvmorph.tv.CleanerActivity.class));
                }else if(action.equals("bridgeOpen")){
                    BridgeLaunch.open(host);result.put("embedded",true);
                }else if(action.equals("matchesOpen")){
                    host.startActivity(new Intent(host,MatchesActivity.class));
                }else{
                    SharedPreferences prefs=host.getSharedPreferences("cleartv",Activity.MODE_PRIVATE);
                    Intent intent=new Intent().setClassName(host,"local.cleartv.mobile.RemoteActivity");
                    intent.putExtra("appearance",prefs.getBoolean("appearanceChosen",false)?prefs.getString("appearance","light"):"light");
                    intent.putExtra("locale",prefs.getString("language","ar"));
                    if(host.getPackageManager().resolveActivity(intent,0)==null)throw new java.io.IOException("Install the integrated Morph TV build to use Morph Remote.");
                    host.startActivityForResult(intent,7341);result.put("embedded",true);
                }
                reply.send(id,true,result);
            }catch(Exception error){reply.send(id,false,error.getMessage()==null?"Could not open this page.":error.getMessage());}
        });
        return true;
    }
    private PhoneUiLaunch(){}
}
