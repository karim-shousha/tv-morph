package local.tvmorph.tv;
/** A second Back press returns only from the app explicitly opened by Morph TV. */
final class BackReturnPolicy {
 private long first=-10000;private String target="",foreground="";private boolean consumeUp;
 void arm(String pkg){target=pkg==null?"":pkg;foreground="";first=-10000;consumeUp=false;}
 void disarm(){target="";first=-10000;}
 void window(String pkg){foreground=pkg==null?"":pkg;if(!foreground.equals(target))first=-10000;}
 boolean key(boolean enabled,int action,int key,int repeats,long now){
  if(key!=4)return false;
  if(action==1&&consumeUp){consumeUp=false;return true;}
  if(!enabled||target.isEmpty()||!target.equals(foreground)||action!=0||repeats!=0)return false;
  if(now-first>=0&&now-first<=650){first=-10000;consumeUp=true;target="";return true;}
  first=now;return false;
 }
}
