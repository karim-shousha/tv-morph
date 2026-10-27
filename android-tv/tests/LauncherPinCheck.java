package local.tvmorph.tv;
public final class LauncherPinCheck {
 private static void check(boolean value,String name){if(!value)throw new AssertionError(name);}
 public static void main(String[] args)throws Exception{
  String pin="472638",first=PinSecret.create(pin),second=PinSecret.create(pin);
  check(!first.equals(second),"Per-PIN random salt");check(!first.contains(pin),"No plaintext PIN");check(PinSecret.matches(pin,first),"Correct PIN");check(!PinSecret.matches("000000",first),"Incorrect PIN");check(!PinSecret.matches(pin,"broken"),"Malformed verifier");check(!PinSecret.matches(pin,"1$%%%$%%%"),"Malformed Base64");check(!PinSecret.valid("123")&&!PinSecret.valid("123456789")&&!PinSecret.valid("abcd"),"PIN limits");
  HomeOverridePolicy p=new HomeOverridePolicy();String own="local.tvmorph.tv",home="com.amazon.tv.launcher",activity="com.amazon.tv.launcher.ui.HomeActivity";
  check(!p.shouldLaunch(false,own,home,activity,home,activity,10000),"Disabled override");check(!p.shouldLaunch(true,own,home,activity,home,"com.amazon.tv.launcher.ui.SettingsActivity",10000),"Keep Fire TV settings available");check(!p.shouldLaunch(true,own,home,activity,"com.netflix.ninja",activity,10000),"Do not hijack other apps");check(p.shouldLaunch(true,own,home,activity,home,activity,10000),"Exact Home match");check(!p.shouldLaunch(true,own,home,activity,home,activity,10100),"Debounce repeated window event");check(p.shouldLaunch(true,own,home,activity,home,activity,12000),"Return to Home again");check(p.shouldLaunch(true,own,home,activity,home,activity,14000),"Third Home event");check(p.shouldLaunch(true,own,home,activity,home,activity,16000),"Fourth Home event");check(!p.shouldLaunch(true,own,home,activity,home,activity,18000)&&p.paused,"Stop competing-launcher loop");
  HomeOverridePolicy stable=new HomeOverridePolicy();check(stable.shouldLaunch(true,own,home,activity,home,activity,10000),"First normal return");stable.settled();check(stable.shouldLaunch(true,own,home,activity,home,activity,12000),"Settled launcher accepts later Home presses");
  check(!new HomeOverridePolicy().shouldLaunch(true,own,own,"local.tvmorph.tv.TvActivity",own,"local.tvmorph.tv.TvActivity",10000),"Never override self");check(new HomeOverridePolicy().shouldLaunch(true,own,"example.home",".MainActivity","example.home",".MainActivity",10000),"Relative activity names");
  System.out.println("PASS: salted PBKDF2 PIN verification and launcher opt-in, exact activity filtering, debounce and loop circuit breaker.");
 }
}
