package local.tvmorph.tv;
import android.app.Activity;import android.content.Intent;import android.media.tv.TvContract;
final class InputLaunch {
 static void open(Activity owner,String id,boolean passthrough){InputAudioHandoff.prepare(owner);try{ExternalLaunch.open(owner,new Intent(Intent.ACTION_VIEW,passthrough?TvContract.buildChannelUriForPassthroughInput(id):TvContract.buildChannelsUriForInput(id)));}catch(RuntimeException blocked){if(!passthrough)throw blocked;owner.startActivity(new Intent(owner,InputActivity.class).putExtra("inputId",id));}}
}
