package local.tvmorph.tv;

/** Only an explicit entry request may open IPTV when restoring the app. */
final class LaunchPolicy {
 static boolean pendingIptv(boolean homeEntry,boolean explicitRequest){return !homeEntry&&explicitRequest;}
 static boolean forwardRestoredIptv(boolean restored,boolean iptvShortcut){return !restored||iptvShortcut;}
}
