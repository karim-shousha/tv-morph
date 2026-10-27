package local.tvmorph.tv;
/** Smooth preview only. Playback is sought once, when the arrow is released. */
final class SeekHoldPolicy {
 private int key;private long started,last,eventAt;private double target;private long limit;
 boolean begin(int code,boolean repeat,long now,long position,long duration){if(key==0&&repeat)return false;if(key==code){eventAt=now;return true;}key=code;started=last=eventAt=now;limit=Math.max(0,duration-1000);target=Math.max(0,Math.min(limit,position+(code==21?-10000:10000)));return true;}
 long advance(long now){if(key==0)return Math.round(target);long from=Math.max(last,started+350),dt=Math.max(0,Math.min(64,now-from));double speed=Math.min(240,30+Math.max(0,now-started-350)*.02);target=Math.max(0,Math.min(limit,target+(key==21?-1:1)*dt*speed));last=now;return position();}
 boolean active(){return key!=0;}boolean held(long now){return active()&&now-started>=350;}boolean stale(long now){return active()&&now-eventAt>1200;}long position(){return Math.round(target);}
 void reset(){key=0;started=last=eventAt=0;}
}
