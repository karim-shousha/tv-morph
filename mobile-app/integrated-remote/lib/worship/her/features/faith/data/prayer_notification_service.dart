import 'faith_repository.dart';
import 'adhan_playback_service.dart';
import '../../../../native_bridge.dart';

class PrayerNotificationService {
  dynamic get lastTestReport => null;
  String? get lastSoundCheckError => 'الفحص المجدول غير متاح من هذه الشاشة.';
  static final instance = PrayerNotificationService();
  static const adhanPrayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  static String adhanChannelIdFor(FaithSettings s) =>
      'morph-faith-adhan-playback';
  static bool ownsNotificationId(int? id) => id == 7310 || id == 7314;
  static String adhanTestPrayerKey(FaithSettings s) => adhanPrayerOrder
      .firstWhere((key) => s.adhanPrayers[key] ?? false, orElse: () => '');
  static String? adhanTestBlockerReason(FaithSettings s) => s.notificationOnly
      ? 'فعّل صوت الأذان أولًا.'
      : adhanTestPrayerKey(s).isEmpty
      ? 'فعّل صوت صلاة واحدة على الأقل.'
      : null;
  static FaithSettings withSoundEnabled(FaithSettings s) => s.copyWith(
    notificationOnly: false,
    adhanPrayers: s.adhanPrayers.values.every((v) => !v)
        ? {for (final key in adhanPrayerOrder) key: true}
        : s.adhanPrayers,
  );
  Future<void> initialize() async {}
  Future<void> reschedule(FaithSettings s) => MorphFaithNative.sync(s);
  Future<({bool notifications, bool exactAlarms})> grantStatus() async {
    final v = await MorphFaithNative.call('info');
    return (
      notifications: v['notifications'] == true,
      exactAlarms: v['exactAlarms'] == true,
    );
  }

  Future<bool> requestPermission() async {
    var v = await MorphFaithNative.call('notifications');
    if (v['exactAlarms'] != true) await MorphFaithNative.call('alarmAccess');
    return v['notifications'] == true;
  }

  Future<bool> canScheduleExactAlarms() async =>
      (await grantStatus()).exactAlarms;
  Future<bool> playSoundTest(FaithSettings s) =>
      AdhanPlaybackService.instance.playFullAdhan(voiceId: s.adhanVoice);
  Future<bool> scheduleSoundCheck(FaithSettings s, {dynamic delay}) =>
      playSoundTest(s);
  Future<Map<String, Object?>> scheduleInventory(FaithSettings s) async =>
      Map<String, Object?>.from(await MorphFaithNative.call('info'));
}
