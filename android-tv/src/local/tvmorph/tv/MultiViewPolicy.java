package local.tvmorph.tv;

/** Pure state shared by the four-player controller and its regression tests. */
final class MultiViewPolicy {
 static final int COUNT=4;
 int layout=0,audio=0;boolean muted=false;
 int visible(){return layout==1?2:layout==3?3:4;}
 boolean audible(int slot){return !muted&&slot==audio&&slot<visible();}
 void sound(int slot){if(slot<0||slot>=visible())return;audio=slot;muted=false;}
 void layout(int value){layout=value>=0&&value<=3?value:0;if(audio>=visible())audio=0;}
 float[] rectangle(int slot){
  if(slot<0||slot>=visible())return new float[]{0,0,0,0};
  if(layout==1)return new float[]{slot*.5f,0,.5f,1};
  if(layout==3)return slot==0?new float[]{0,0,.5f,1}:new float[]{.5f,(slot-1)*.5f,.5f,.5f};
  if(layout==2)return slot==0?new float[]{0,0,1,.67f}:new float[]{(slot-1)/3f,.67f,1/3f,.33f};
  return new float[]{(slot%2)*.5f,(slot/2)*.5f,.5f,.5f};
 }
}
