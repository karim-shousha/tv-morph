package local.tvmorph.tv;

/** Shared clock policy: foreground crossings only, never catch up after returning. */
final class AdhanWindow {
 static boolean due(long at,long previous,long now,boolean foreground){
  return foreground && now>previous && now-previous<90000 && at>previous && at<=now && now-at<90000;
 }
}
