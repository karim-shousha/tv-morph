package local.tvmorph.tv;
/** Bounded first-picture recovery. Never treats a paused, buffering or audio-only stream as a bad decoder. */
final class VideoStartRecovery {
 static final int NONE=0,QUALITY=1,ENGINE=2,UNSUPPORTED=3;private long since=-1,lastPosition=-1;private boolean quality,engine;
 void reset(){since=-1;lastPosition=-1;quality=false;engine=false;}
 void skipQuality(){engine=true;since=-1;}
 int observe(long now,boolean playing,boolean expected,boolean rendered,long position){if(!playing||!expected||rendered||position<1000){since=-1;lastPosition=position;return NONE;}if(lastPosition>=0&&position<=lastPosition){since=-1;lastPosition=position;return NONE;}lastPosition=position;if(since<0){since=now;return NONE;}if(now-since<8000)return NONE;since=now;if(!quality){quality=true;return QUALITY;}if(!engine){engine=true;return ENGINE;}return UNSUPPORTED;}
}
