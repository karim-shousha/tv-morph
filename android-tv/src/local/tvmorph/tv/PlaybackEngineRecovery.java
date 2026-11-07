package local.tvmorph.tv;
/** At most one decoder/parser fallback per explicit playback attempt. */
final class PlaybackEngineRecovery {
 private boolean tried;
 boolean tryAlternate(int extra,boolean local){
  if(tried||(extra!=-1010&&extra!=-1007&&extra!=Integer.MIN_VALUE))return false;
  tried=true;return true;
 }
 void reset(){tried=false;}
}
