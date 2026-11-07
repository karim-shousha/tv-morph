import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Android WifiManager MulticastLock wrapper.
///
/// Without a held MulticastLock, Android filters multicast/broadcast
/// reception and most phones receive ZERO SSDP responses and ZERO mDNS
/// answers — the #1 cause of "no TVs found" on real hardware.
/// iOS/macOS/desktop: no-op returning true.
class MulticastLock {
  static const _ch = MethodChannel('morph_remote/multicast');

  static Future<bool> acquire() async {
    if (defaultTargetPlatform != TargetPlatform.android) return true;
    try {
      final held = await _ch.invokeMethod<bool>('acquire');
      return held ?? false;
    } on MissingPluginException {
      return false;
    } catch (_) {
      return false;
    }
  }

  static Future<void> release() async {
    if (defaultTargetPlatform != TargetPlatform.android) return;
    try {
      await _ch.invokeMethod<bool>('release');
    } catch (_) {}
  }
}
