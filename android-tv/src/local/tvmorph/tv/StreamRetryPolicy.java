package local.tvmorph.tv;
/** A bounded recovery burst. Only a stable playback window or explicit Retry resets it. */
final class StreamRetryPolicy {
 static final int FAIL=0,RECONNECT=1,ALTERNATE=2;
 private int attempts,lastRetriedSource=-1;
 int decide(int source,boolean live,boolean alternate,int what,int extra){
  boolean network="network".equals(StreamFallback.category(what,extra));
  if(live&&network&&attempts<2&&lastRetriedSource!=source&&(extra==-1005||!alternate)){
   attempts++;lastRetriedSource=source;return RECONNECT;
  }
  if(live&&alternate)return ALTERNATE;
  return FAIL;
 }
 int delayMillis(){return Math.min(2500,1000*attempts);}
 void reset(){attempts=0;lastRetriedSource=-1;}
}
