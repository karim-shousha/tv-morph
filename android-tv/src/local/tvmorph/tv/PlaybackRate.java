package local.tvmorph.tv;
import android.media.MediaPlayer;
import android.media.PlaybackParams;

/** Apply an explicit VOD rate without turning paused playback into autoplay. */
final class PlaybackRate {
 static final float[] VALUES={0.5f,0.75f,1f,1.25f,1.5f,2f,3f};
 static float apply(MediaPlayer player,float rate){
  boolean allowed=false;for(float value:VALUES)if(value==rate)allowed=true;
  if(!allowed||player==null)throw new IllegalArgumentException("Unsupported playback rate");
  boolean playing=player.isPlaying();float previous=player.getPlaybackParams().getSpeed();if(previous<=0||Float.isNaN(previous)||Float.isInfinite(previous))previous=1f;
  try{
   player.setPlaybackParams(new PlaybackParams().allowDefaults().setSpeed(rate).setPitch(1f));
   float actual=player.getPlaybackParams().getSpeed();
   if(Float.isNaN(actual)||Float.isInfinite(actual)||Math.abs(actual-rate)>0.02f)throw new IllegalStateException("Playback rate was not accepted");
   return actual;
  }catch(RuntimeException rejected){
   try{player.setPlaybackParams(new PlaybackParams().allowDefaults().setSpeed(previous).setPitch(1f));}catch(RuntimeException ignored){}
   throw rejected;
  }finally{if(!playing)try{player.pause();}catch(RuntimeException ignored){}}
 }
 private PlaybackRate(){}
}
