package local.tvmorph.tv;
/** The firmware selector must not be confused with Android unknown-app installation settings. */
public final class SourceSelectorPolicyCheck {
 public static void main(String[] args){
  String[] valid={"com.mediatek.wwtv.tvcenter.nav.inputpanel.InputsPanelActivity","com.google.android.tvlauncher.inputs.InputsPanelActivity","com.vendor.tv.SourceSelectActivity","com.vendor.tv.InputSourceActivity"};
  String[] invalid={"com.android.tv.settings.device.apps.specialaccess.ExternalSourcesActivity","com.android.tv.settings.device.apps.AppManagementActivity","com.vendor.tv.factory.InputSourceTestActivity","com.vendor.tv.keyboard.InputMethodActivity","com.vendor.tv.MainActivity"};
  for(String n:valid)if(!SourceSelectorPolicy.matches(n))throw new AssertionError("Missed native source selector: "+n);
  for(String n:invalid)if(SourceSelectorPolicy.matches(n))throw new AssertionError("Unrelated settings classified as sources: "+n);
  if(SourceSelectorPolicy.rank(valid[0])<=SourceSelectorPolicy.rank("com.vendor.tv.TvInputSettingsActivity"))throw new AssertionError("Source panels must precede generic input settings");
  System.out.println("PASS: native input-panel discovery; no unknown-app-install/factory/keyboard false positives");
 }
}
