package local.tvmorph.tv;

/** Matches the Home activity only, never another screen in the same package. */
final class HomeOverridePolicy {
 private long last=-10000,window=-10000;private int launches;
 boolean paused;
 void settled(){window=-10000;launches=0;}
 boolean shouldLaunch(boolean enabled,String own,String homePackage,String homeClass,String eventPackage,String eventClass,long now){
  if(!enabled||paused||homePackage==null||homeClass==null||homePackage.equals(own)||!homePackage.equals(eventPackage))return false;
  if(homeClass.startsWith("."))homeClass=homePackage+homeClass;
  if(eventClass!=null&&eventClass.startsWith("."))eventClass=eventPackage+eventClass;
  if(!homeClass.equals(eventClass)||now-last<1800)return false;
  if(now-window>10000){window=now;launches=0;}
  if(++launches>4){paused=true;return false;}
  last=now;return true;
 }
}
