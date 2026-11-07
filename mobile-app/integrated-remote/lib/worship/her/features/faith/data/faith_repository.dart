import '../../../core/services/home_widget_service.dart';
import 'dart:async';
import 'adhan_voices.dart';
import 'dart:math' as math;

import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/companion/companion_event.dart';
import '../../../core/data/local_account_repository.dart';

/// Recovery (RC1): legacy installs may hold a wrong Dart type under a known
/// key (e.g. an int where a double is expected — see the tolerant font-size
/// read in [QuranRepository]). Typed SharedPreferences getters THROW on
/// mismatch, which used to fail the whole Faith dashboard. This wrapper
/// returns the established default for the single unreadable value, keeps
/// every other value, and NEVER deletes or overwrites storage. [fellBack] is
/// true only when a present-but-wrong-typed value was ignored; absent keys
/// are normal for new users and do not count.
class _TolerantPrefs {
  _TolerantPrefs(this._prefs);
  final SharedPreferences _prefs;
  bool fellBack = false;

  Object? _raw(String key) {
    try {
      return _prefs.get(key);
    } catch (_) {
      fellBack = true;
      return null;
    }
  }

  bool getBool(String key, bool fallback) {
    final value = _raw(key);
    if (value == null) return fallback;
    if (value is bool) return value;
    fellBack = true;
    return fallback;
  }

  bool? getBoolOrNull(String key) {
    final value = _raw(key);
    if (value == null) return null;
    if (value is bool) return value;
    fellBack = true;
    return null;
  }

  int getInt(String key, int fallback) {
    final value = _raw(key);
    if (value == null) return fallback;
    if (value is int) return value;
    // Backward-compatible numeric form only: a whole double reads as int.
    if (value is double && value == value.truncateToDouble()) {
      return value.toInt();
    }
    fellBack = true;
    return fallback;
  }

  double getDouble(String key, double fallback) {
    final value = _raw(key);
    if (value == null) return fallback;
    if (value is double) return value;
    // Backward-compatible numeric form only: an int reads as double.
    if (value is int) return value.toDouble();
    fellBack = true;
    return fallback;
  }

  String getString(String key, String fallback) {
    final value = _raw(key);
    if (value == null) return fallback;
    if (value is String) return value;
    fellBack = true;
    return fallback;
  }

  String? getStringOrNull(String key) {
    final value = _raw(key);
    if (value == null) return null;
    if (value is String) return value;
    fellBack = true;
    return null;
  }

  List<String> getStringList(String key, List<String> fallback) {
    final value = _raw(key);
    if (value == null) return fallback;
    if (value is List && value.every((item) => item is String)) {
      return value.cast<String>();
    }
    fellBack = true;
    return fallback;
  }
}

/// Private worship preferences. They stay on-device unless an authenticated
/// user uses account backup, which lets them be restored after a reinstall.
class FaithRepository {
  FaithRepository._();
  static final instance = FaithRepository._();
  static const _prefix = 'morph_faith_';

  /// This is separate from notification consent. Faith content is completely
  /// opt-in, so declining it never surfaces it again on the home dashboard.
  Future<bool?> faithAccessChoice() async {
    final prefs = await SharedPreferences.getInstance();
    if (!prefs.containsKey('${_prefix}access_approved')) return null;
    // A malformed legacy opt-in must behave as unanswered, not make the
    // navigation action throw before the Faith screen can open.
    return _TolerantPrefs(prefs).getBoolOrNull('${_prefix}access_approved');
  }

  Future<void> saveFaithAccessChoice(bool approved) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('${_prefix}access_approved', approved);
  }

  /// Notification consent is a user choice, never an onboarding default.
  Future<bool> hasAnsweredPrayerNotificationPrompt() async {
    final prefs = await SharedPreferences.getInstance();
    return _TolerantPrefs(
      prefs,
    ).getBool('${_prefix}notification_prompt_answered', false);
  }

  Future<void> markPrayerNotificationPromptAnswered() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('${_prefix}notification_prompt_answered', true);
  }

  Future<FaithSettings> loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final t = _TolerantPrefs(prefs);
    // One calm, reliable adhan is bundled. Existing selections migrate to it
    // so previously scheduled reminders remain valid after the update.
    final adhanVoice = adhanVoiceFor(
      t.getString('${_prefix}adhan_voice', 'beautiful-cc0'),
    ).id;
    // Every read below is individually tolerant: one legacy wrong-typed
    // value falls back to that field's established default without
    // affecting any other setting and without touching storage.
    final notificationOnly = t.getBool('${_prefix}notification_only', false);
    return FaithSettings(
      automaticLocation: t.getBool('${_prefix}automatic_location', true),
      locationConfigured: t.getBool('${_prefix}location_configured', false),
      // Never show a random city's prayer times to a new user. A real city is
      // saved only after they choose the GPS option or select it manually.
      latitude: t.getDouble('${_prefix}latitude', 0),
      longitude: t.getDouble('${_prefix}longitude', 0),
      city: t.getString('${_prefix}city', 'حدّد موقعك أولًا'),
      timezone: t.getString('${_prefix}timezone', 'UTC'),
      calculationMethod: t.getString('${_prefix}method', 'moonsighting'),
      hanafi: t.getBool('${_prefix}hanafi', false),
      hijriAdjustment: t.getInt('${_prefix}hijri_adjustment', 0),
      prayerNotifications: t.getBool('${_prefix}prayer_notifications', false),
      notificationOffset: t.getInt('${_prefix}notification_offset', 0),
      // Optional reminders are opt-in. Prayer-time alerts remain a separate
      // choice, so a new install never starts background reminder work by
      // itself.
      smartReminders: t.getBool('${_prefix}smart_reminders', false),
      betweenPrayerReminders: t.getBool('${_prefix}between_reminders', false),
      reminderCount: t.getInt('${_prefix}reminder_count', 1),
      vibration: t.getBool('${_prefix}vibration', true),
      // New installs receive the full adhan experience. Existing devices keep
      // their saved choice, including an explicitly selected silent mode.
      notificationOnly: notificationOnly,
      adhanVoice: adhanVoice,
      // Migrate the former global sound preference into per-prayer choices.
      // A user who had chosen silent keeps every prayer silent.
      adhanPrayers: {
        for (final key in const ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'])
          key: t.getBool('${_prefix}adhan_$key', !notificationOnly),
      },
      salawatReminders: t.getBool('${_prefix}salawat_reminders', false),
      enabledPrayers: {
        'fajr': t.getBool('${_prefix}notify_fajr', true),
        'dhuhr': t.getBool('${_prefix}notify_dhuhr', true),
        'asr': t.getBool('${_prefix}notify_asr', true),
        'maghrib': t.getBool('${_prefix}notify_maghrib', true),
        'isha': t.getBool('${_prefix}notify_isha', true),
      },
      adjustments: {
        'fajr': t.getInt('${_prefix}adjust_fajr', 0),
        'dhuhr': t.getInt('${_prefix}adjust_dhuhr', 0),
        'asr': t.getInt('${_prefix}adjust_asr', 0),
        'maghrib': t.getInt('${_prefix}adjust_maghrib', 0),
        'isha': t.getInt('${_prefix}adjust_isha', 0),
      },
    );
  }

  Future<void> saveSettings(FaithSettings value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(
      '${_prefix}automatic_location',
      value.automaticLocation,
    );
    await prefs.setBool(
      '${_prefix}location_configured',
      value.locationConfigured,
    );
    await prefs.setDouble('${_prefix}latitude', value.latitude);
    await prefs.setDouble('${_prefix}longitude', value.longitude);
    await prefs.setString('${_prefix}city', value.city);
    await prefs.setString('${_prefix}timezone', value.timezone);
    await prefs.setString('${_prefix}method', value.calculationMethod);
    await prefs.setBool('${_prefix}hanafi', value.hanafi);
    await prefs.setInt('${_prefix}hijri_adjustment', value.hijriAdjustment);
    await prefs.setBool(
      '${_prefix}prayer_notifications',
      value.prayerNotifications,
    );
    await prefs.setInt(
      '${_prefix}notification_offset',
      value.notificationOffset,
    );
    await prefs.setBool('${_prefix}smart_reminders', value.smartReminders);
    await prefs.setBool(
      '${_prefix}between_reminders',
      value.betweenPrayerReminders,
    );
    await prefs.setInt('${_prefix}reminder_count', value.reminderCount);
    await prefs.setBool('${_prefix}vibration', value.vibration);
    await prefs.setBool('${_prefix}notification_only', value.notificationOnly);
    await prefs.setString('${_prefix}adhan_voice', value.adhanVoice);
    await prefs.setBool('${_prefix}salawat_reminders', value.salawatReminders);
    for (final entry in value.adhanPrayers.entries) {
      await prefs.setBool('${_prefix}adhan_${entry.key}', entry.value);
    }
    for (final entry in value.enabledPrayers.entries) {
      await prefs.setBool('${_prefix}notify_${entry.key}', entry.value);
    }
    for (final entry in value.adjustments.entries) {
      await prefs.setInt('${_prefix}adjust_${entry.key}', entry.value);
    }
    await HomeWidgetService.instance.syncContent(settings: value);
    unawaited(LocalAccountRepository.instance.syncCurrentData());
  }

  Future<TasbihState> loadTasbih() async {
    final prefs = await SharedPreferences.getInstance();
    if (HomeWidgetService.instance.supported) await prefs.reload();
    final t = _TolerantPrefs(prefs);
    final day = _dayKey(DateTime.now());
    final storedDay = t.getStringOrNull('${_prefix}tasbih_day');
    return TasbihState(
      dhikr: t.getString('${_prefix}tasbih_dhikr', 'سبحان الله'),
      current: storedDay == day ? t.getInt('${_prefix}tasbih_current', 0) : 0,
      target: t.getInt('${_prefix}tasbih_target', 33),
      dailyTotal: storedDay == day ? t.getInt('${_prefix}tasbih_total', 0) : 0,
      completedTargets: storedDay == day
          ? t.getInt('${_prefix}tasbih_done', 0)
          : 0,
      soundEnabled: t.getBool('${_prefix}tasbih_sound', true),
      hapticEnabled: t.getBool('${_prefix}tasbih_haptic', true),
    );
  }

  Future<void> saveTasbih(TasbihState value) async {
    final prefs = await SharedPreferences.getInstance();
    final nativeSaved = await HomeWidgetService.instance.writeTasbih({
      'dhikr': value.dhikr,
      'current': value.current,
      'target': value.target,
      'dailyTotal': value.dailyTotal,
      'completedTargets': value.completedTargets,
      'soundEnabled': value.soundEnabled,
      'hapticEnabled': value.hapticEnabled,
    });
    if (!nativeSaved) {
      await prefs.setString('${_prefix}tasbih_day', _dayKey(DateTime.now()));
      await prefs.setString('${_prefix}tasbih_dhikr', value.dhikr);
      await prefs.setInt('${_prefix}tasbih_current', value.current);
      await prefs.setInt('${_prefix}tasbih_target', value.target);
      await prefs.setInt('${_prefix}tasbih_total', value.dailyTotal);
      await prefs.setInt('${_prefix}tasbih_done', value.completedTargets);
      await prefs.setBool('${_prefix}tasbih_sound', value.soundEnabled);
      await prefs.setBool('${_prefix}tasbih_haptic', value.hapticEnabled);
    } else {
      await prefs.reload();
    }
    await _finishTasbihSave(value, prefs);
  }

  Future<TasbihState> incrementTasbih() async {
    final native = await HomeWidgetService.instance.incrementTasbih();
    if (native != null) {
      final value = TasbihState(
        dhikr: native['dhikr'] as String,
        current: native['current'] as int,
        target: native['target'] as int,
        dailyTotal: native['dailyTotal'] as int,
        completedTargets: native['completedTargets'] as int,
        soundEnabled: native['soundEnabled'] as bool,
        hapticEnabled: native['hapticEnabled'] as bool,
      );
      final prefs = await SharedPreferences.getInstance();
      await prefs.reload();
      await _finishTasbihSave(value, prefs);
      return value;
    }
    final current = await loadTasbih();
    final next = current.copyWith(
      current: current.current + 1,
      dailyTotal: current.dailyTotal + 1,
      completedTargets:
          current.completedTargets +
          (current.current + 1 == current.target ? 1 : 0),
    );
    await saveTasbih(next);
    return next;
  }

  Future<void> _finishTasbihSave(
    TasbihState value,
    SharedPreferences prefs,
  ) async {
    // Any counting day is an active dhikr day; used for the weekly streak.
    if (value.dailyTotal > 0) {
      final days =
          (prefs.getStringList('${_prefix}tasbih_active_days') ??
                  const <String>[])
              .toSet()
            ..add(_dayKey(DateTime.now()));
      final weekAgo = DateTime.now().subtract(const Duration(days: 7));
      days.removeWhere((day) {
        final parts = day.split('-').map(int.tryParse).toList();
        if (parts.length != 3 || parts.any((part) => part == null)) return true;
        return DateTime(
          parts[0]!,
          parts[1]!,
          parts[2]!,
        ).isBefore(DateTime(weekAgo.year, weekAgo.month, weekAgo.day));
      });
      await prefs.setStringList('${_prefix}tasbih_active_days', days.toList());
    }
    unawaited(LocalAccountRepository.instance.syncCurrentData());
  }

  /// Active dhikr days within the last 7 days (0..7).
  Future<int> tasbihActiveDaysThisWeek() async {
    final prefs = await SharedPreferences.getInstance();
    final days = {
      ...?prefs.getStringList('${_prefix}tasbih_active_days'),
      ...await HomeWidgetService.instance.tasbihDays(),
    };
    final weekAgo = DateTime.now().subtract(const Duration(days: 7));
    final cutoff = DateTime(weekAgo.year, weekAgo.month, weekAgo.day);
    var count = 0;
    for (final day in days) {
      final parts = day.split('-').map(int.tryParse).toList();
      if (parts.length != 3 || parts.any((part) => part == null)) continue;
      if (!DateTime(parts[0]!, parts[1]!, parts[2]!).isBefore(cutoff)) {
        count++;
      }
    }
    return count;
  }

  /// The weekly challenge is independent from the daily counter so changing a
  /// daily ward never erases the week's progress.
  ///
  /// v2 (unified): progress is counts-vs-targets only. Legacy wards are kept
  /// in storage for compatibility but no longer drive any UI. On first load,
  /// users of the old version get a one-time proportional migration so no one
  /// loses this week's progress.
  Future<TasbihCircleState> loadTasbihCircle() async {
    final prefs = await SharedPreferences.getInstance();
    final t = _TolerantPrefs(prefs);
    final weekKey = _weekKey(DateTime.now());
    final sameWeek = t.getString('${_prefix}tasbih_circle_week', '') == weekKey;
    final tasbihGoal = t.getInt('${_prefix}tasbih_circle_tasbih_goal', 3);
    final dhikrGoal = t.getInt('${_prefix}tasbih_circle_dhikr_goal', 3);
    final quranGoal = t.getInt('${_prefix}tasbih_circle_quran_goal', 3);
    final tasbihTarget = t.getInt('${_prefix}tasbih_circle_tasbih_target', 100);
    final quranTarget = t.getInt('${_prefix}tasbih_circle_quran_target', 7);
    final dhikrTarget = t.getInt('${_prefix}tasbih_circle_dhikr_target', 7);
    var tasbihCount = sameWeek
        ? t.getInt('${_prefix}tasbih_circle_tasbih_count', 0)
        : 0;
    var quranPages = sameWeek
        ? t.getInt('${_prefix}tasbih_circle_quran_pages', 0)
        : 0;
    var dhikrCount = sameWeek
        ? t.getInt('${_prefix}tasbih_circle_dhikr_count', 0)
        : 0;
    // Migration writes are skipped when any read fell back: fallbacks are
    // render-only and must never persist over unreadable stored values.
    final wardsT = t.getInt('${_prefix}tasbih_circle_tasbih', 0);
    final wardsD = t.getInt('${_prefix}tasbih_circle_dhikr', 0);
    final wardsQ = t.getInt('${_prefix}tasbih_circle_quran', 0);
    final migrated = t.getBool('${_prefix}tasbih_circle_v2', false);
    if (sameWeek && !t.fellBack && !migrated) {
      if (tasbihCount + dhikrCount + quranPages == 0 &&
          wardsT + wardsD + wardsQ > 0) {
        tasbihCount = math.min(
          tasbihTarget,
          (wardsT * tasbihTarget / math.max(tasbihGoal, 1)).round(),
        );
        dhikrCount = math.min(
          dhikrTarget,
          (wardsD * dhikrTarget / math.max(dhikrGoal, 1)).round(),
        );
        quranPages = math.min(
          quranTarget,
          (wardsQ * quranTarget / math.max(quranGoal, 1)).round(),
        );
        await prefs.setInt('${_prefix}tasbih_circle_tasbih_count', tasbihCount);
        await prefs.setInt('${_prefix}tasbih_circle_dhikr_count', dhikrCount);
        await prefs.setInt('${_prefix}tasbih_circle_quran_pages', quranPages);
      }
      await prefs.setBool('${_prefix}tasbih_circle_v2', true);
    }
    return TasbihCircleState(
      joined: t.getBool('${_prefix}tasbih_circle_joined', false),
      weekKey: weekKey,
      tasbihWards: sameWeek
          ? t.getInt('${_prefix}tasbih_circle_tasbih', 0).clamp(0, 5)
          : 0,
      dhikrWards: sameWeek
          ? t.getInt('${_prefix}tasbih_circle_dhikr', 0).clamp(0, 5)
          : 0,
      quranWards: sameWeek
          ? t.getInt('${_prefix}tasbih_circle_quran', 0).clamp(0, 5)
          : 0,
      tasbihGoal: tasbihGoal,
      dhikrGoal: dhikrGoal,
      quranGoal: quranGoal,
      lastTasbihDay: t.getStringOrNull('${_prefix}tasbih_circle_tasbih_day'),
      lastDhikrDay: t.getStringOrNull('${_prefix}tasbih_circle_dhikr_day'),
      lastQuranDay: t.getStringOrNull('${_prefix}tasbih_circle_quran_day'),
      tasbihCount: tasbihCount,
      tasbihTarget: tasbihTarget,
      quranPages: quranPages,
      quranTarget: quranTarget,
      dhikrCount: dhikrCount,
      dhikrTarget: dhikrTarget,
    );
  }

  Future<void> saveTasbihCircle(TasbihCircleState value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('${_prefix}tasbih_circle_joined', value.joined);
    await prefs.setString('${_prefix}tasbih_circle_week', value.weekKey);
    await prefs.setInt('${_prefix}tasbih_circle_tasbih', value.tasbihWards);
    await prefs.setInt('${_prefix}tasbih_circle_dhikr', value.dhikrWards);
    await prefs.setInt('${_prefix}tasbih_circle_quran', value.quranWards);
    await prefs.setInt('${_prefix}tasbih_circle_tasbih_goal', value.tasbihGoal);
    await prefs.setInt('${_prefix}tasbih_circle_dhikr_goal', value.dhikrGoal);
    await prefs.setInt('${_prefix}tasbih_circle_quran_goal', value.quranGoal);
    await prefs.setInt(
      '${_prefix}tasbih_circle_tasbih_count',
      value.tasbihCount,
    );
    await prefs.setInt(
      '${_prefix}tasbih_circle_tasbih_target',
      value.tasbihTarget,
    );
    await prefs.setInt('${_prefix}tasbih_circle_quran_pages', value.quranPages);
    await prefs.setInt(
      '${_prefix}tasbih_circle_quran_target',
      value.quranTarget,
    );
    await prefs.setInt('${_prefix}tasbih_circle_dhikr_count', value.dhikrCount);
    await prefs.setInt(
      '${_prefix}tasbih_circle_dhikr_target',
      value.dhikrTarget,
    );
    await _setOrRemove(
      prefs,
      '${_prefix}tasbih_circle_tasbih_day',
      value.lastTasbihDay,
    );
    await _setOrRemove(
      prefs,
      '${_prefix}tasbih_circle_dhikr_day',
      value.lastDhikrDay,
    );
    await _setOrRemove(
      prefs,
      '${_prefix}tasbih_circle_quran_day',
      value.lastQuranDay,
    );
    // Never treat opening the system share sheet as a completed invitation.
    // This also clears the old optimistic counter for existing users.
    await prefs.setInt('${_prefix}tasbih_circle_invites', 0);
    unawaited(LocalAccountRepository.instance.syncCurrentData());
  }

  /// Stamps one active day per track. Since the v2 unification, progress is
  /// counts-vs-targets only; the legacy wards counters are frozen and no
  /// longer incremented. Callers stay unchanged.
  Future<TasbihCircleState?> recordCircleWard(CircleWard ward) async {
    final current = await loadTasbihCircle();
    if (!current.joined) return null;
    final today = _dayKey(DateTime.now());
    final recordedToday = switch (ward) {
      CircleWard.tasbih => current.lastTasbihDay == today,
      CircleWard.dhikr => current.lastDhikrDay == today,
      CircleWard.quran => current.lastQuranDay == today,
    };
    if (recordedToday) return current;
    final next = switch (ward) {
      CircleWard.tasbih => current.copyWith(lastTasbihDay: today),
      CircleWard.dhikr => current.copyWith(lastDhikrDay: today),
      CircleWard.quran => current.copyWith(lastQuranDay: today),
    };
    await saveTasbihCircle(next);
    // Phase 2 companion: at most one ward-track per day reaches here (the
    // early return above drops repeats), and same-day coalescing in the
    // tracker collapses the rest to a single persistent event.
    CompanionEventTracker.instance.record(
      type: CompanionEventType.challengeProgress,
      source: 'challenge',
      referenceId: ward.name,
    );
    return next;
  }

  Future<TasbihCircleState?> recordChallengeProgress(
    CircleWard ward,
    int amount,
  ) async {
    final current = await loadTasbihCircle();
    if (!current.joined || amount <= 0) return null;
    final next = switch (ward) {
      CircleWard.tasbih => current.copyWith(
        tasbihCount: math.min(
          current.tasbihTarget,
          current.tasbihCount + amount,
        ),
      ),
      CircleWard.quran => current.copyWith(
        quranPages: math.min(current.quranTarget, current.quranPages + amount),
      ),
      CircleWard.dhikr => current.copyWith(
        dhikrCount: math.min(current.dhikrTarget, current.dhikrCount + amount),
      ),
    };
    await saveTasbihCircle(next);
    return next;
  }

  /// Records a completed surah as one reading unit in the weekly challenge.
  /// Each surah can only be counted once per challenge week, so repeatedly
  /// tapping its final ayah never inflates the Quran progress.
  Future<TasbihCircleState?> recordCompletedQuranSurah(int surah) async {
    final current = await loadTasbihCircle();
    if (!current.joined || surah < 1 || surah > 114) return null;
    final prefs = await SharedPreferences.getInstance();
    final key = '${_prefix}tasbih_circle_completed_surahs_${current.weekKey}';
    final completed = (prefs.getStringList(key) ?? const <String>[]).toSet();
    if (!completed.add('$surah')) return null;
    await prefs.setStringList(key, completed.toList());
    final next = current.copyWith(
      quranPages: math.min(current.quranTarget, current.quranPages + 1),
    );
    await saveTasbihCircle(next);
    return next;
  }

  /// Starts the current week's challenge over without removing its companion
  /// circle or changing the goals the user chose.
  Future<TasbihCircleState> resetTasbihChallengeProgress() async {
    final current = await loadTasbihCircle();
    final next = TasbihCircleState(
      joined: current.joined,
      weekKey: current.weekKey,
      tasbihWards: 0,
      dhikrWards: 0,
      quranWards: 0,
      tasbihGoal: current.tasbihGoal,
      dhikrGoal: current.dhikrGoal,
      quranGoal: current.quranGoal,
      tasbihCount: 0,
      tasbihTarget: current.tasbihTarget,
      quranPages: 0,
      quranTarget: current.quranTarget,
      dhikrCount: 0,
      dhikrTarget: current.dhikrTarget,
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(
      '${_prefix}tasbih_circle_completed_surahs_${current.weekKey}',
    );
    await saveTasbihCircle(next);
    return next;
  }

  /// Public day key so dashboard widgets and the repository share one format.
  static String dayKeyFor(DateTime date) =>
      '${date.year}-${date.month}-${date.day}';

  /// Public week key (Monday-based) for companionship streaks and seen-state.
  static String weekKeyFor(DateTime date) => _weekKey(date);

  // -- Social challenge helpers (companionship) -------------------------------

  Future<void> saveOwnCircleName(String name) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('${_prefix}circle_display_name', name);
  }

  Future<String?> loadOwnCircleName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('${_prefix}circle_display_name');
  }

  Future<bool> hasSeenCompletedInit(String weekKey) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('${_prefix}seen_completed_init_$weekKey') ?? false;
  }

  Future<Set<String>> loadSeenCompleted(String weekKey) async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList('${_prefix}seen_completed_$weekKey') ??
            const <String>[])
        .toSet();
  }

  Future<void> saveSeenCompleted(String weekKey, Set<String> names) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
      '${_prefix}seen_completed_$weekKey',
      names.toList(),
    );
    await prefs.setBool('${_prefix}seen_completed_init_$weekKey', true);
  }

  /// Weeks in a row where the user and at least one companion both completed.
  /// Returns (streak, lastRecordedWeek).
  Future<(int, String?)> loadCompanionStreak() async {
    final prefs = await SharedPreferences.getInstance();
    return (
      prefs.getInt('${_prefix}companion_streak') ?? 0,
      prefs.getString('${_prefix}companion_last_week'),
    );
  }

  Future<int> recordCompanionWeek(String weekKey, bool together) async {
    final prefs = await SharedPreferences.getInstance();
    final previous = weekKeyFor(
      DateTime.now().subtract(const Duration(days: 7)),
    );
    final last = prefs.getString('${_prefix}companion_last_week');
    var streak = prefs.getInt('${_prefix}companion_streak') ?? 0;
    if (last == weekKey) return streak;
    if (together) {
      streak = (last == previous) ? streak + 1 : 1;
      await prefs.setString('${_prefix}companion_last_week', weekKey);
      await prefs.setInt('${_prefix}companion_streak', streak);
    }
    return streak;
  }

  // ---------------------------------------------------------------------------
  // Daily worship: prayer checklist, rest mode, dhikr counts, khatma, favorites
  // ---------------------------------------------------------------------------

  static const _prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  /// Prayer status per key: 0 = untouched, 1 = prayed, 2 = qada/made-up.
  Future<Map<String, int>> loadPrayerDay(DateTime date) async {
    final prefs = await SharedPreferences.getInstance();
    final t = _TolerantPrefs(prefs);
    final day = dayKeyFor(date);
    // One bad stored value defaults that prayer only; the rest load on.
    return {
      for (final key in _prayers)
        key: t.getInt('${_prefix}prayer_day_${day}_$key', 0),
    };
  }

  Future<Map<String, int>> savePrayerStatus(
    DateTime date,
    String prayerKey,
    int status,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    final day = dayKeyFor(date);
    final previous = _TolerantPrefs(
      prefs,
    ).getInt('${_prefix}prayer_day_${day}_$prayerKey', 0);
    await prefs.setInt('${_prefix}prayer_day_${day}_$prayerKey', status);
    // Phase 1 companion signal: prayer key + status only (counts, no text).
    CompanionEventTracker.instance.record(
      type: CompanionEventType.prayerUpdated,
      source: 'worship',
      metadata: {'prayer': prayerKey, 'status': status},
    );
    if ((status == 1) != (previous == 1)) {
      // Tolerant read: a legacy wrong-typed counter must not break saving
      // this completion. The increment is user-initiated, so persisting the
      // corrected counter here is explicit user action, not a silent reset.
      final current = _TolerantPrefs(
        prefs,
      ).getInt('${_prefix}stat_total_prayers', 0);
      await prefs.setInt(
        '${_prefix}stat_total_prayers',
        (current + (status == 1 ? 1 : -1)).clamp(0, 1 << 31),
      );
    }
    unawaited(LocalAccountRepository.instance.syncCurrentData());
    return loadPrayerDay(date);
  }

  /// Gentle "rest mode" (e.g. menstruation): pauses the prayer streak without
  /// guilt and surfaces dhikr/quran suggestions instead.
  Future<bool> loadRestMode(DateTime date) async {
    final prefs = await SharedPreferences.getInstance();
    return _TolerantPrefs(
      prefs,
    ).getBool('${_prefix}prayer_rest_${dayKeyFor(date)}', false);
  }

  Future<void> saveRestMode(DateTime date, bool resting) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('${_prefix}prayer_rest_${dayKeyFor(date)}', resting);
    unawaited(LocalAccountRepository.instance.syncCurrentData());
  }

  /// Counts of prayed prayers for the last 7 days (oldest → today).
  Future<List<int>> last7DaysPrayerCounts() async {
    final prefs = await SharedPreferences.getInstance();
    final t = _TolerantPrefs(prefs);
    final now = DateTime.now();
    final counts = <int>[];
    for (var i = 6; i >= 0; i--) {
      final day = dayKeyFor(now.subtract(Duration(days: i)));
      var count = 0;
      for (final key in _prayers) {
        // A bad historical entry counts as zero for that entry only.
        if (t.getInt('${_prefix}prayer_day_${day}_$key', 0) == 1) {
          count++;
        }
      }
      counts.add(count);
    }
    return counts;
  }

  /// Daily dhikr counters (title → taps today). Persisted per day.
  Future<Map<String, int>> loadDhikrDaily(DateTime date) async {
    final prefs = await SharedPreferences.getInstance();
    final day = dayKeyFor(date);
    final keys =
        prefs.getStringList('${_prefix}dhikr_daily_keys_$day') ??
        const <String>[];
    return {
      for (final k in keys)
        k: prefs.getInt('${_prefix}dhikr_daily_${day}_$k') ?? 0,
    };
  }

  Future<int> incrementDhikrDaily(DateTime date, String title) async {
    final prefs = await SharedPreferences.getInstance();
    final day = dayKeyFor(date);
    final keys =
        (prefs.getStringList('${_prefix}dhikr_daily_keys_$day') ??
                const <String>[])
            .toSet()
          ..add(title);
    await prefs.setStringList('${_prefix}dhikr_daily_keys_$day', keys.toList());
    final next = (prefs.getInt('${_prefix}dhikr_daily_${day}_$title') ?? 0) + 1;
    await prefs.setInt('${_prefix}dhikr_daily_${day}_$title', next);
    return next;
  }

  Future<void> resetDhikrDaily(DateTime date) async {
    final prefs = await SharedPreferences.getInstance();
    final day = dayKeyFor(date);
    final keys =
        prefs.getStringList('${_prefix}dhikr_daily_keys_$day') ??
        const <String>[];
    for (final k in keys) {
      await prefs.remove('${_prefix}dhikr_daily_${day}_$k');
    }
    await prefs.remove('${_prefix}dhikr_daily_keys_$day');
  }

  // -- Khatma (simple Juz tracker 1..30) -------------------------------------

  Future<int> loadKhatmaJuz() async {
    final prefs = await SharedPreferences.getInstance();
    return _TolerantPrefs(prefs).getInt('${_prefix}khatma_juz', 1).clamp(1, 30);
  }

  Future<int> saveKhatmaJuz(int juz) async {
    final prefs = await SharedPreferences.getInstance();
    final value = juz.clamp(1, 30);
    await prefs.setInt('${_prefix}khatma_juz', value);
    unawaited(LocalAccountRepository.instance.syncCurrentData());
    return value;
  }

  Future<int> loadCompletedKhatmas() async {
    final prefs = await SharedPreferences.getInstance();
    return _TolerantPrefs(prefs).getInt('${_prefix}khatma_completed', 0);
  }

  Future<int> completeKhatma() async {
    final prefs = await SharedPreferences.getInstance();
    final next =
        _TolerantPrefs(prefs).getInt('${_prefix}khatma_completed', 0) + 1;
    await prefs.setInt('${_prefix}khatma_completed', next);
    await prefs.setInt('${_prefix}khatma_juz', 1);
    unawaited(LocalAccountRepository.instance.syncCurrentData());
    return next;
  }

  // -- Dua favorites + personal duas ------------------------------------------

  Future<Set<String>> loadDuaFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList('${_prefix}dua_favorites') ?? const <String>[])
        .toSet();
  }

  Future<bool> toggleDuaFavorite(String title) async {
    final prefs = await SharedPreferences.getInstance();
    final favs =
        (prefs.getStringList('${_prefix}dua_favorites') ?? const <String>[])
            .toSet();
    final nowFav = !favs.contains(title);
    if (nowFav) {
      favs.add(title);
    } else {
      favs.remove(title);
    }
    await prefs.setStringList('${_prefix}dua_favorites', favs.toList());
    return nowFav;
  }

  /// Personal duas stored as `title||text` entries.
  Future<List<(String, String)>> loadCustomDuas() async {
    final prefs = await SharedPreferences.getInstance();
    final raw =
        prefs.getStringList('${_prefix}custom_duas') ?? const <String>[];
    return [
      for (final entry in raw)
        if (entry.contains('||'))
          (entry.split('||').first, entry.split('||').sublist(1).join('||')),
    ];
  }

  Future<void> addCustomDua(String title, String text) async {
    final prefs = await SharedPreferences.getInstance();
    final raw =
        prefs.getStringList('${_prefix}custom_duas') ?? const <String>[];
    await prefs.setStringList('${_prefix}custom_duas', [
      ...raw,
      '$title||$text',
    ]);
    unawaited(LocalAccountRepository.instance.syncCurrentData());
  }

  Future<void> removeCustomDuaAt(int index) async {
    final prefs = await SharedPreferences.getInstance();
    final raw =
        prefs.getStringList('${_prefix}custom_duas') ?? const <String>[];
    if (index < 0 || index >= raw.length) return;
    await prefs.setStringList(
      '${_prefix}custom_duas',
      [...raw]..removeAt(index),
    );
  }

  // -- Lifetime gentle stats ----------------------------------------------------

  Future<Map<String, int>> loadFaithStats() async {
    final prefs = await SharedPreferences.getInstance();
    final t = _TolerantPrefs(prefs);
    // One bad stat defaults that stat only.
    return {
      'prayers': t.getInt('${_prefix}stat_total_prayers', 0),
      'tasbihDone': t.getInt('${_prefix}tasbih_done_all', 0),
      'khatmas': t.getInt('${_prefix}khatma_completed', 0),
    };
  }

  Future<void> bumpTasbihDoneStat() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(
      '${_prefix}tasbih_done_all',
      _TolerantPrefs(prefs).getInt('${_prefix}tasbih_done_all', 0) + 1,
    );
  }

  Future<void> _setOrRemove(
    SharedPreferences prefs,
    String key,
    String? value,
  ) => value == null ? prefs.remove(key) : prefs.setString(key, value);

  static String _dayKey(DateTime date) => dayKeyFor(date);

  static String _weekKey(DateTime date) {
    final monday = DateTime(
      date.year,
      date.month,
      date.day,
    ).subtract(Duration(days: date.weekday - DateTime.monday));
    return _dayKey(monday);
  }
}

class FaithSettings {
  const FaithSettings({
    required this.automaticLocation,
    this.locationConfigured = false,
    required this.latitude,
    required this.longitude,
    required this.city,
    required this.timezone,
    required this.calculationMethod,
    required this.hanafi,
    required this.hijriAdjustment,
    required this.prayerNotifications,
    required this.notificationOffset,
    required this.smartReminders,
    required this.betweenPrayerReminders,
    required this.reminderCount,
    required this.vibration,
    required this.notificationOnly,
    required this.adhanVoice,
    this.adhanPrayers = const {},
    this.salawatReminders = false,
    required this.enabledPrayers,
    required this.adjustments,
  });

  /// Render-only fallback used when settings storage itself is unreachable.
  /// Mirrors every default in [FaithRepository.loadSettings] exactly; never
  /// persisted, never a substitute for real prayer configuration.
  factory FaithSettings.defaults() => const FaithSettings(
    automaticLocation: true,
    locationConfigured: false,
    latitude: 0,
    longitude: 0,
    city: 'حدّد موقعك أولًا',
    timezone: 'UTC',
    calculationMethod: 'moonsighting',
    hanafi: false,
    hijriAdjustment: 0,
    prayerNotifications: false,
    notificationOffset: 0,
    smartReminders: false,
    betweenPrayerReminders: false,
    reminderCount: 1,
    vibration: true,
    notificationOnly: false,
    adhanVoice: 'beautiful-cc0',
    adhanPrayers: {
      'fajr': true,
      'dhuhr': true,
      'asr': true,
      'maghrib': true,
      'isha': true,
    },
    salawatReminders: false,
    enabledPrayers: {
      'fajr': true,
      'dhuhr': true,
      'asr': true,
      'maghrib': true,
      'isha': true,
    },
    adjustments: {'fajr': 0, 'dhuhr': 0, 'asr': 0, 'maghrib': 0, 'isha': 0},
  );
  final bool automaticLocation,
      locationConfigured,
      hanafi,
      prayerNotifications,
      smartReminders,
      betweenPrayerReminders,
      vibration,
      notificationOnly,
      salawatReminders;
  final double latitude, longitude;
  final String city, timezone, calculationMethod, adhanVoice;
  final int hijriAdjustment, notificationOffset, reminderCount;
  final Map<String, bool> enabledPrayers;
  final Map<String, bool> adhanPrayers;
  final Map<String, int> adjustments;

  FaithSettings copyWith({
    bool? automaticLocation,
    bool? locationConfigured,
    double? latitude,
    double? longitude,
    String? city,
    String? timezone,
    String? calculationMethod,
    String? adhanVoice,
    bool? hanafi,
    int? hijriAdjustment,
    bool? prayerNotifications,
    int? notificationOffset,
    bool? smartReminders,
    bool? betweenPrayerReminders,
    int? reminderCount,
    bool? vibration,
    bool? notificationOnly,
    bool? salawatReminders,
    Map<String, bool>? enabledPrayers,
    Map<String, bool>? adhanPrayers,
    Map<String, int>? adjustments,
  }) => FaithSettings(
    automaticLocation: automaticLocation ?? this.automaticLocation,
    locationConfigured: locationConfigured ?? this.locationConfigured,
    latitude: latitude ?? this.latitude,
    longitude: longitude ?? this.longitude,
    city: city ?? this.city,
    timezone: timezone ?? this.timezone,
    calculationMethod: calculationMethod ?? this.calculationMethod,
    adhanVoice: adhanVoice ?? this.adhanVoice,
    hanafi: hanafi ?? this.hanafi,
    hijriAdjustment: hijriAdjustment ?? this.hijriAdjustment,
    prayerNotifications: prayerNotifications ?? this.prayerNotifications,
    notificationOffset: notificationOffset ?? this.notificationOffset,
    smartReminders: smartReminders ?? this.smartReminders,
    betweenPrayerReminders:
        betweenPrayerReminders ?? this.betweenPrayerReminders,
    reminderCount: reminderCount ?? this.reminderCount,
    vibration: vibration ?? this.vibration,
    notificationOnly: notificationOnly ?? this.notificationOnly,
    salawatReminders: salawatReminders ?? this.salawatReminders,
    enabledPrayers: enabledPrayers ?? this.enabledPrayers,
    adhanPrayers: adhanPrayers ?? this.adhanPrayers,
    adjustments: adjustments ?? this.adjustments,
  );
}

class TasbihState {
  const TasbihState({
    required this.dhikr,
    required this.current,
    required this.target,
    required this.dailyTotal,
    required this.completedTargets,
    this.soundEnabled = true,
    this.hapticEnabled = true,
  });
  final String dhikr;
  final int current, target, dailyTotal, completedTargets;
  final bool soundEnabled, hapticEnabled;
  TasbihState copyWith({
    String? dhikr,
    int? current,
    int? target,
    int? dailyTotal,
    int? completedTargets,
    bool? soundEnabled,
    bool? hapticEnabled,
  }) => TasbihState(
    dhikr: dhikr ?? this.dhikr,
    current: current ?? this.current,
    target: target ?? this.target,
    dailyTotal: dailyTotal ?? this.dailyTotal,
    completedTargets: completedTargets ?? this.completedTargets,
    soundEnabled: soundEnabled ?? this.soundEnabled,
    hapticEnabled: hapticEnabled ?? this.hapticEnabled,
  );
}

class TasbihCircleState {
  const TasbihCircleState({
    required this.joined,
    required this.weekKey,
    required this.tasbihWards,
    required this.dhikrWards,
    required this.quranWards,
    this.tasbihGoal = 3,
    this.dhikrGoal = 3,
    this.quranGoal = 3,
    this.lastTasbihDay,
    this.lastDhikrDay,
    this.lastQuranDay,
    this.tasbihCount = 0,
    this.tasbihTarget = 100,
    this.quranPages = 0,
    this.quranTarget = 7,
    this.dhikrCount = 0,
    this.dhikrTarget = 7,
  });

  final bool joined;
  final String weekKey;

  /// Legacy v1 day counters. Frozen since the v2 unification: kept in storage
  /// for compatibility, never incremented, never shown.
  final int tasbihWards, dhikrWards, quranWards;
  final int tasbihGoal, dhikrGoal, quranGoal;
  final String? lastTasbihDay, lastDhikrDay, lastQuranDay;
  final int tasbihCount,
      tasbihTarget,
      quranPages,
      quranTarget,
      dhikrCount,
      dhikrTarget;

  /// Unified v2 progress: counts vs targets across the three tracks.
  int get totalCount => tasbihCount + dhikrCount + quranPages;
  int get totalTarget => tasbihTarget + dhikrTarget + quranTarget;
  double get progress =>
      totalTarget == 0 ? 0 : (totalCount / totalTarget).clamp(0.0, 1.0);
  bool get isComplete =>
      totalTarget > 0 &&
      tasbihCount >= tasbihTarget &&
      dhikrCount >= dhikrTarget &&
      quranPages >= quranTarget;

  /// (value, target, unit-label) for one track, in display order Quran/Dhikr/Tasbih.
  (int, int, String) trackProgress(CircleWard ward) => switch (ward) {
    CircleWard.quran => (quranPages, quranTarget, 'صفحة'),
    CircleWard.dhikr => (dhikrCount, dhikrTarget, 'ورد'),
    CircleWard.tasbih => (tasbihCount, tasbihTarget, 'تسبيحة'),
  };

  TasbihCircleState copyWith({
    bool? joined,
    String? weekKey,
    int? tasbihWards,
    int? dhikrWards,
    int? quranWards,
    int? tasbihGoal,
    int? dhikrGoal,
    int? quranGoal,
    String? lastTasbihDay,
    String? lastDhikrDay,
    String? lastQuranDay,
    int? tasbihCount,
    int? tasbihTarget,
    int? quranPages,
    int? quranTarget,
    int? dhikrCount,
    int? dhikrTarget,
  }) => TasbihCircleState(
    joined: joined ?? this.joined,
    weekKey: weekKey ?? this.weekKey,
    tasbihWards: tasbihWards ?? this.tasbihWards,
    dhikrWards: dhikrWards ?? this.dhikrWards,
    quranWards: quranWards ?? this.quranWards,
    tasbihGoal: tasbihGoal ?? this.tasbihGoal,
    dhikrGoal: dhikrGoal ?? this.dhikrGoal,
    quranGoal: quranGoal ?? this.quranGoal,
    lastTasbihDay: lastTasbihDay ?? this.lastTasbihDay,
    lastDhikrDay: lastDhikrDay ?? this.lastDhikrDay,
    lastQuranDay: lastQuranDay ?? this.lastQuranDay,
    tasbihCount: tasbihCount ?? this.tasbihCount,
    tasbihTarget: tasbihTarget ?? this.tasbihTarget,
    quranPages: quranPages ?? this.quranPages,
    quranTarget: quranTarget ?? this.quranTarget,
    dhikrCount: dhikrCount ?? this.dhikrCount,
    dhikrTarget: dhikrTarget ?? this.dhikrTarget,
  );
}

enum CircleWard { tasbih, dhikr, quran }
