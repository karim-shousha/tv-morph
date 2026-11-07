package local.tvmorph.tv;
/** Event-only buffering measurements; no polling, URLs, credentials or network requests. */
final class PlaybackDiagnostics {
 private long started,total;private int count;private boolean active,counted;
 void begin(long now,boolean rebuffer){if(active)return;active=true;started=now;counted=rebuffer;if(rebuffer)count++;}
 void end(long now){if(!active)return;if(counted)total+=Math.max(0,now-started);active=false;counted=false;}
 long millis(long now){return total+(active&&counted?Math.max(0,now-started):0);}
 int count(){return count;}
 boolean active(){return active;}
 void reset(){started=total=0;count=0;active=counted=false;}
}
