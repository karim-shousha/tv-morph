package local.cleartv.mobile;
import android.app.Instrumentation;
import android.os.Bundle;
public class LgInstrumentation extends Instrumentation {
    @Override public void onCreate(Bundle arguments){super.onCreate(arguments);start();}
    @Override public void onStart(){Bundle result=new Bundle();try{LgDiscoveryCheck.main(new String[0]);RemoteCheck.run(getTargetContext());ImageAssetCheck.run(getTargetContext());local.tvmorph.tv.XtreamCheck.run(getTargetContext());local.tvmorph.tv.PlaybackMemoryCheck.run(getTargetContext());local.tvmorph.tv.RadioPlaybackCheck.run(getTargetContext());local.tvmorph.tv.UpdaterCheck.run(getTargetContext());result.putString("result","PASS: update source/signature/provider checks; eight live radio streams prepared on Android; discovery/security, simulated remote UTF-8, image alpha/size, Xtream fixture auth/categories/live/VOD/episodes, encrypted storage, resume isolation/completion and UI settings");finish(-1,result);}catch(Throwable e){result.putString("result","FAIL: "+e.toString());finish(0,result);}}
}
