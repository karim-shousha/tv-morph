/// Visible build identity. BUILD_ID is injected at build time:
///   flutter build apk --debug --dart-define=BUILD_ID=20261031-001
/// Falls back to 'dev' for local runs. Shown in Settings + diagnostics
/// so a phone screenshot proves WHICH build is installed.
class BuildInfo {
  static const String appVersion = '0.8.273';
  static const int buildNumber = 277;
  static const String buildId =
      String.fromEnvironment('BUILD_ID', defaultValue: 'dev');
  static const String discoveryImpl = 'disc-4/targeted+stages';

  static String get short => 'v$appVersion+$buildNumber $buildId';
}
