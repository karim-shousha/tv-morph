import 'dart:io';

import 'package:flutter/services.dart';

import '../../../core/services/her_audio_service.dart';

/// TEMPORARY QA diagnostics for the HER adhan normal-mode audio failure.
/// Read by the test-button diagnostic dialog and logcat. Remove the dialog
/// surface (and this file, if unused) once normal-mode audio is physically
/// proven. No secrets are ever collected: only stream volumes, ringer mode,
/// player state and position facts.
/// Android snapshot of the audio streams the adhan can be routed to.
/// Adhan playback and notification audio share the preview's media stream.
class AdhanStreamSnapshot {
  const AdhanStreamSnapshot({
    required this.ringerMode,
    required this.alarmVolume,
    required this.alarmMax,
    required this.musicVolume,
    required this.musicMax,
    required this.ringVolume,
    required this.ringMax,
  });

  /// AudioManager ringer mode: 0 silent, 1 vibrate, 2 normal, -1 unknown.
  final int ringerMode;
  final int alarmVolume;
  final int alarmMax;
  final int musicVolume;
  final int musicMax;
  final int ringVolume;
  final int ringMax;

  String get ringerLabel => switch (ringerMode) {
    2 => 'عادي',
    1 => 'اهتزاز',
    0 => 'صامت',
    _ => 'غير معروف',
  };

  bool get mediaAudible => musicMax > 0 && musicVolume > 0;
}

class AdhanAudioProbe {
  static const _channel = MethodChannel('her/device_feedback');

  static Future<Map<String, dynamic>?> readChannel(String id) async {
    if (!Platform.isAndroid) return null;
    try {
      final value = await _channel.invokeMethod<Map>('adhanChannelState', id);
      return value == null ? null : Map<String, dynamic>.from(value);
    } catch (_) {
      return null;
    }
  }

  static Future<void> openChannelSettings(String id) async {
    if (Platform.isAndroid) await _channel.invokeMethod('openAdhanChannel', id);
  }

  /// Best-effort read of Android stream volumes. Null on non-Android, on
  /// older engines, or whenever the platform call fails — never throws.
  static Future<AdhanStreamSnapshot?> readStreams() async {
    if (!Platform.isAndroid) return null;
    try {
      final result = await _channel.invokeMethod('audioStreams');
      if (result is! Map) return null;
      int value(Object? raw) => raw is int ? raw : int.tryParse('$raw') ?? -1;
      return AdhanStreamSnapshot(
        ringerMode: value(result['ringerMode']),
        alarmVolume: value(result['alarmVolume']),
        alarmMax: value(result['alarmMax']),
        musicVolume: value(result['musicVolume']),
        musicMax: value(result['musicMax']),
        ringVolume: value(result['ringVolume']),
        ringMax: value(result['ringMax']),
      );
    } catch (_) {
      return null;
    }
  }
}

/// TEMPORARY QA verdict of one test-button tap: which audio path actually
/// ran, what the player proved, and what the device streams report.
class AdhanTestReport {
  const AdhanTestReport({
    required this.path,
    required this.start,
    required this.streams,
  });

  /// 'player' when the dedicated full-adhan player verified, 'channel' when
  /// the test fell back to the notification-channel sound, 'none' otherwise.
  final String path;
  final AdhanStartReport? start;
  final AdhanStreamSnapshot? streams;

  /// Arabic lines for the temporary on-device diagnostic dialog.
  List<String> get linesAr {
    final lines = <String>[];
    lines.add(
      'المسار: ${path == 'player'
          ? 'المشغّل الكامل'
          : path == 'channel'
          ? 'صوت قناة التنبيه (احتياطي)'
          : 'لا يوجد صوت'}',
    );
    final report = start;
    if (report == null) {
      lines.add('بدء المشغّل: لم يُطلب');
    } else {
      lines.add('المصدر: ${report.runtimeSource}');
      lines.add('الحالة بعد التشغيل: ${report.stateAfterPlay}');
      lines.add(
        'الموضع: ${report.positionMsEarly ?? '?'}ms ← '
        '${report.positionMsLate ?? '?'}ms',
      );
      lines.add(
        'تقدّم الموضع: ${!report.positionsKnown
            ? 'غير معروف'
            : report.positionAdvances
            ? 'نعم'
            : 'لا'}',
      );
      lines.add(
        'الصوت: ${report.volumeBefore?.toStringAsFixed(2) ?? '?'} ← '
        '${report.volumeAfter?.toStringAsFixed(2) ?? '?'}',
      );
      if (report.error != null) lines.add('الخطأ: ${report.error}');
    }
    final snapshot = streams;
    if (snapshot == null) {
      lines.add('مستويات الصوت: غير متاحة');
    } else {
      lines.add('الرنين: ${snapshot.ringerLabel}');
      lines.add('المنبّه: ${snapshot.alarmVolume}/${snapshot.alarmMax}');
      lines.add('الوسائط: ${snapshot.musicVolume}/${snapshot.musicMax}');
      if (!snapshot.mediaAudible) {
        lines.add('تنبيه: صوت الوسائط صفر — ارفع صوت الوسائط لسماع الأذان.');
      }
    }
    return lines;
  }
}
