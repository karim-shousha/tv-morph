package local.tvmorph.tv;
import android.content.Context;import android.media.*;import android.media.tv.TvView;import android.os.*;
/** Audio focus belongs to the visible input session, never to the idle launcher. */
final class InputAudioSession {
 private final AudioManager manager;private final TvView view;private AudioFocusRequest request;private boolean granted;private int epoch;
 InputAudioSession(Context context,TvView input){manager=(AudioManager)context.getSystemService(Context.AUDIO_SERVICE);view=input;}
 boolean acquire(){if(granted){volume(1f);return true;}release();if(manager==null)return false;final int run=++epoch;request=new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MOVIE).build()).setOnAudioFocusChangeListener(change->{if(run!=epoch||request==null)return;granted=change==AudioManager.AUDIOFOCUS_GAIN;volume(granted?1f:0f);},new Handler(Looper.getMainLooper())).build();try{granted=manager.requestAudioFocus(request)==AudioManager.AUDIOFOCUS_REQUEST_GRANTED;}catch(RuntimeException blocked){granted=false;}volume(granted?1f:0f);return granted;}
 void volume(float value){try{view.setStreamVolume(value);}catch(RuntimeException ignored){}}
 void release(){epoch++;AudioFocusRequest old=request;request=null;granted=false;volume(0f);if(manager!=null&&old!=null)try{manager.abandonAudioFocusRequest(old);}catch(RuntimeException ignored){}}
}
