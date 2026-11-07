import 'package:flutter/services.dart';

/// Native feedback is more reliable than Flutter's light haptic presets on
/// Android devices that suppress UI haptics. The native side still respects
/// the phone's vibration and media-volume settings.
class DeviceFeedbackService {
  DeviceFeedbackService._();

  static final instance = DeviceFeedbackService._();
  static const _channel = MethodChannel('her/device_feedback');

  Future<void> vibrate({int durationMs = 55}) async {
    try {
      await _channel.invokeMethod<void>('vibrate', {'durationMs': durationMs});
    } catch (_) {
      await HapticFeedback.vibrate();
    }
  }

  Future<void> tapSound() async {
    try {
      await _channel.invokeMethod<void>('tapSound');
    } catch (_) {
      await SystemSound.play(SystemSoundType.click);
    }
  }
}
