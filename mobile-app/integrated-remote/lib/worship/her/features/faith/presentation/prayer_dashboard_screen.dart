import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import '../data/adhan_playback_service.dart';
import '../data/adhan_diagnostics.dart';
import '../data/adhan_voices.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/widgets/her_banner_ad.dart';
import 'package:flutter/foundation.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hijri_date/hijri.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/her_theme_data.dart';
import '../../../core/theme/theme_palette.dart';
import '../../../core/widgets/app_page_header.dart';
import '../../../core/widgets/her_components.dart';
import '../../../core/services/her_audio_service.dart';
import '../../../core/data/remote_content_repository.dart';
import '../data/faith_repository.dart';
import '../data/prayer_calculation_service.dart';
import '../data/prayer_notification_service.dart';
import '../data/quran_repository.dart';
import 'quran_reader_screen.dart';

import 'prayer/dashboard_widgets.dart';
import 'prayer/prayer_history_screen.dart';
import 'widgets/faith_shared.dart';
import 'widgets/faith_tip_carousel.dart';
import 'settings/prayer_settings_screen.dart';
import 'location/manual_location_sheet.dart';
import 'qibla/qibla_screen.dart';
import 'dhikr/dhikr_library_screen.dart';
import 'dua/dua_library_screen.dart';
import 'ayah/ayah_screen.dart';
import 'tasbih/tasbih_screen.dart';
import 'quran_companion_screen.dart';

export 'prayer/dashboard_widgets.dart';
export 'widgets/faith_shared.dart';
export 'widgets/faith_tip_carousel.dart';
export 'settings/prayer_settings_screen.dart';
export 'location/manual_location_sheet.dart';
export 'qibla/qibla_screen.dart';
export 'dhikr/dhikr_library_screen.dart';
export 'dua/dua_library_screen.dart';
export 'ayah/ayah_screen.dart';
export 'tasbih/tasbih_screen.dart';

class PrayerDashboardScreen extends StatefulWidget {
  const PrayerDashboardScreen({
    super.key,
    required this.onBack,
    required this.onAchievement,
    this.onSettingsChanged,
    this.openRequest,
  });
  final VoidCallback onBack;
  final Future<void> Function(String title) onAchievement;
  final ValueChanged<FaithSettings>? onSettingsChanged;
  final ValueNotifier<String?>? openRequest;
  @override
  State<PrayerDashboardScreen> createState() => _PrayerDashboardScreenState();
}

/// Local layout editor, matching the drag-and-drop customisation on Home.
/// It only stores display order; worship data and reminders are untouched.
class _FaithLayoutEditor extends StatefulWidget {
  const _FaithLayoutEditor({
    required this.wirdOrder,
    required this.myDayOrder,
    required this.quickOrder,
    required this.onWirdChanged,
    required this.onMyDayChanged,
    required this.onQuickChanged,
    required this.onReset,
  });
  final List<String> wirdOrder, myDayOrder, quickOrder;
  final ValueChanged<List<String>> onWirdChanged,
      onMyDayChanged,
      onQuickChanged;
  final VoidCallback onReset;

  @override
  State<_FaithLayoutEditor> createState() => _FaithLayoutEditorState();
}

class _FaithLayoutEditorState extends State<_FaithLayoutEditor> {
  var _page = 0;
  late final List<List<String>> _orders = [
    List.of(widget.wirdOrder),
    List.of(widget.myDayOrder),
    List.of(widget.quickOrder),
  ];
  static const _titles = ['وردي اليومي', 'يومي مع الله', 'كروت الورد'];
  static const _labels = [
    {
      'next': 'مواقيت الصلاة',
      'entries': 'الموقع والإعدادات',
      'quick': 'وردي اليومي',
      'tips': 'رسائل وإرشادات',
      'content': 'محتوى الورد',
    },
    {
      'prayers': 'صلواتي اليوم',
      'rhythm': 'إيقاع الأسبوع',
      'day': 'يومي مع الله',
      'quran': 'صحبة القرآن',
    },
    {
      'quran': 'القرآن',
      'qibla': 'القبلة',
      'tasbih': 'السبحة',
      'dhikr': 'الأذكار',
      'dua': 'الأدعية',
      'ayah': 'آية اليوم',
    },
  ];

  void _changed() {
    final next = List.of(_orders[_page]);
    switch (_page) {
      case 0:
        widget.onWirdChanged(next);
      case 1:
        widget.onMyDayChanged(next);
      case 2:
        widget.onQuickChanged(next);
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = _orders[_page];
    final colors = Theme.of(context).colorScheme;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'اختار قسمًا ثم اسحب من علامة الترتيب. التعديل يُحفظ على هاتفك.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            height: 1.6,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 10),
        SegmentedButton<int>(
          segments: [
            for (var i = 0; i < _titles.length; i++)
              ButtonSegment(value: i, label: Text(_titles[i])),
          ],
          selected: {_page},
          showSelectedIcon: false,
          onSelectionChanged: (value) => setState(() => _page = value.first),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 270,
          child: ReorderableListView.builder(
            itemCount: order.length,
            onReorder: (oldIndex, newIndex) {
              setState(() {
                if (newIndex > oldIndex) newIndex--;
                order.insert(newIndex, order.removeAt(oldIndex));
              });
              _changed();
            },
            itemBuilder: (context, index) {
              final key = order[index];
              return HERCard(
                key: ValueKey('${_page}_$key'),
                radius: 16,
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 3,
                ),
                child: ListTile(
                  dense: true,
                  title: Text(
                    _labels[_page][key]!,
                    style: TextStyle(
                      color: context.herTheme.cardTitle,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  trailing: ReorderableDragStartListener(
                    index: index,
                    child: const Icon(Icons.drag_handle_rounded),
                  ),
                ),
              );
            },
          ),
        ),
        TextButton.icon(
          onPressed: widget.onReset,
          icon: const Icon(Icons.restart_alt_rounded),
          label: const Text('استعادة الترتيب الأساسي'),
        ),
      ],
    );
  }
}

class _PrayerDashboardScreenState extends State<PrayerDashboardScreen> {
  FaithSettings? _settings;
  int _tabIndex = 0;
  static const _defaultWirdOrder = [
    'next',
    'entries',
    'quick',
    'tips',
    'content',
  ];
  static const _defaultMyDayOrder = ['prayers', 'rhythm', 'day', 'quran'];
  static const _defaultQuickOrder = [
    'quran',
    'qibla',
    'tasbih',
    'dhikr',
    'dua',
    'ayah',
  ];
  List<String> _wirdOrder = List.of(_defaultWirdOrder);
  List<String> _myDayOrder = List.of(_defaultMyDayOrder);
  List<String> _quickOrder = List.of(_defaultQuickOrder);
  TasbihCircleState? _circle;
  Timer? _clock;
  DateTime _now = DateTime.now();
  bool _locating = false;
  List<DashboardVerse> _dashboardVerses = _fallbackDashboardVerses;
  // Daily worship state (prayer checklist, rest mode, khatma, weekly rhythm).
  Map<String, int> _prayerDay = const {
    'fajr': 0,
    'dhuhr': 0,
    'asr': 0,
    'maghrib': 0,
    'isha': 0,
  };
  bool _resting = false;
  int _khatmaJuz = 1;
  // STEP 2: historical displays removed, but these data sources stay loaded
  // and refreshed (presentation removed, tracking intact) for رحلتي later.
  // ignore: unused_field
  int _khatmaDone = 0;
  List<int> _weekPrayers = const [0, 0, 0, 0, 0, 0, 0];
  // ignore: unused_field
  Map<String, int> _faithStats = const {
    'prayers': 0,
    'tasbihDone': 0,
    'khatmas': 0,
  };
  QuranPosition? _lastPosition;

  /// Load-failure flag: a corrupt legacy preference (wrong stored type) or
  /// a stalled read must surface a calm retry card — never an endless
  /// spinner while [_settings] stays null (regression guard).
  bool _loadError = false;

  static const _fallbackDashboardVerses = <DashboardVerse>[
    DashboardVerse(
      'طه',
      46,
      'قَالَ لَا تَخَافَآ إِنَّنِى مَعَكُمَآ أَسْمَعُ وَأَرَىٰ',
    ),
    DashboardVerse(
      'الرعد',
      28,
      'ٱلَّذِينَ ءَامَنُوا۟ وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ ٱللَّهِ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ',
    ),
    DashboardVerse('الشرح', 5, 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا'),
    DashboardVerse(
      'الزمر',
      53,
      'قُلْ يَٰعِبَادِىَ ٱلَّذِينَ أَسْرَفُوا۟ عَلَىٰٓ أَنفُسِهِمْ لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ إِنَّ ٱللَّهَ يَغْفِرُ ٱلذُّنُوبَ جَمِيعًا إِنَّهُۥ هُوَ ٱلْغَفُورُ ٱلرَّحِيمُ',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _load();
    _loadLayout();
    widget.openRequest?.addListener(_openRequestedDestination);
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => _openRequestedDestination(),
    );
    // The screen-level clock only refreshes prayer math every 30s. The live
    // HH:MM:SS countdown owns its own 1s ticker so the whole page is not
    // rebuilt every second.
    _clock = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  List<String> _normaliseOrder(List<String>? saved, List<String> defaults) {
    final valid = (saved ?? const <String>[]).where(defaults.contains).toList();
    return [...valid, ...defaults.where((key) => !valid.contains(key))];
  }

  Future<void> _loadLayout() async {
    // Layout is cosmetic. An old/corrupt saved order must not surface an
    // asynchronous framework error or interfere with opening عباداتي.
    List<String>? wird;
    List<String>? myDay;
    List<String>? quick;
    try {
      final prefs = await SharedPreferences.getInstance();
      final rawWird = prefs.get('morph_faith_wird_order_v1');
      final rawMyDay = prefs.get('morph_faith_my_day_order_v1');
      final rawQuick = prefs.get('morph_faith_quick_order_v1');
      wird = rawWird is List && rawWird.every((value) => value is String)
          ? rawWird.cast<String>()
          : null;
      myDay = rawMyDay is List && rawMyDay.every((value) => value is String)
          ? rawMyDay.cast<String>()
          : null;
      quick = rawQuick is List && rawQuick.every((value) => value is String)
          ? rawQuick.cast<String>()
          : null;
    } catch (_) {
      // Defaults below keep the dashboard usable if local storage is busy.
    }
    if (!mounted) return;
    setState(() {
      _wirdOrder = _normaliseOrder(wird, _defaultWirdOrder);
      _myDayOrder = _normaliseOrder(myDay, _defaultMyDayOrder);
      _quickOrder = _normaliseOrder(quick, _defaultQuickOrder);
    });
  }

  Future<void> _saveLayout(String key, List<String> value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(key, value);
  }

  void _showFaithCustomizer() => showHerSheet<void>(
    context,
    title: 'رتّب ركن العبادات',
    child: _FaithLayoutEditor(
      wirdOrder: _wirdOrder,
      myDayOrder: _myDayOrder,
      quickOrder: _quickOrder,
      onWirdChanged: (next) {
        setState(() => _wirdOrder = next);
        _saveLayout('morph_faith_wird_order_v1', next);
      },
      onMyDayChanged: (next) {
        setState(() => _myDayOrder = next);
        _saveLayout('morph_faith_my_day_order_v1', next);
      },
      onQuickChanged: (next) {
        setState(() => _quickOrder = next);
        _saveLayout('morph_faith_quick_order_v1', next);
      },
      onReset: () {
        setState(() {
          _wirdOrder = List.of(_defaultWirdOrder);
          _myDayOrder = List.of(_defaultMyDayOrder);
          _quickOrder = List.of(_defaultQuickOrder);
        });
        _saveLayout('morph_faith_wird_order_v1', _wirdOrder);
        _saveLayout('morph_faith_my_day_order_v1', _myDayOrder);
        _saveLayout('morph_faith_quick_order_v1', _quickOrder);
      },
    ),
  );

  @override
  void dispose() {
    _clock?.cancel();
    widget.openRequest?.removeListener(_openRequestedDestination);
    super.dispose();
  }

  void _openRequestedDestination() {
    final destination = widget.openRequest?.value;
    if (!mounted || destination == null) return;
    if (const {
          'prayer_times',
          'qibla',
          'prayer_settings',
        }.contains(destination) &&
        _settings == null) {
      return;
    }
    widget.openRequest!.value = null;
    // Deep invite links arrive as 'join:CODE' (see InviteLinkService).

    switch (destination) {
      case 'prayer_times':
        final settings = _settings!;
        _showPrayerTimesSheet(
          context,
          settings,
          PrayerCalculationService.instance.calculate(settings),
        );
        break;
      case 'qibla':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => QiblaScreen(settings: _settings!)),
        );
        break;
      case 'prayer_settings':
        _openSettings(_settings!);
        break;
      case 'ayah':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AyahScreen()),
        );
        break;
      case 'quran_reader':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const QuranReaderScreen()),
        );
        break;
      case 'dhikrMorning':
      case 'dhikrEvening':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => DhikrLibraryScreen(
              onAchievement: widget.onAchievement,
              initialCategory: destination == 'dhikrMorning'
                  ? 'أذكار الصباح'
                  : 'أذكار المساء',
            ),
          ),
        );
        break;
      case 'kahf':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const QuranReaderScreen(initialSurah: 18),
          ),
        );
        break;
      case 'salawat':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => TasbihScreen(onAchievement: widget.onAchievement),
          ),
        );
        break;
      case 'quran_companion':
        _openQuranCompanion();
        break;
      case 'dhikr':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) =>
                DhikrLibraryScreen(onAchievement: widget.onAchievement),
          ),
        );
        break;
      case 'tasbih':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => TasbihScreen(onAchievement: widget.onAchievement),
          ),
        );
        break;

      case 'dua':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const DuaLibraryScreen()),
        );
        break;
    }
  }

  /// Runs one startup read with its own budget. Any failure — corrupt
  /// value, stalled channel, unexpected error — yields that domain's safe
  /// default so one bad read can never block the dashboard.
  static Future<T> _guardedLoad<T>(Future<T> future, T fallback) async {
    try {
      return await future.timeout(const Duration(seconds: 10));
    } catch (_) {
      return fallback;
    }
  }

  Future<void> _load() async {
    if (_loadError && mounted) setState(() => _loadError = false);
    // Fault-isolated startup (RC1 recovery): 9 independent reads, each with
    // its own fallback. The repositories are additionally tolerant per key,
    // so these fallbacks only trigger if storage itself is unreachable.
    // Whole-page retry below is kept strictly for a genuinely unrecoverable
    // initialization failure outside these reads.
    List<dynamic> results;
    try {
      final now = DateTime.now();
      results = await Future.wait<dynamic>([
        _guardedLoad(
          FaithRepository.instance.loadSettings(),
          FaithSettings.defaults(),
        ),
        _guardedLoad(
          FaithRepository.instance.loadTasbihCircle(),
          TasbihCircleState(
            joined: false,
            weekKey: FaithRepository.dayKeyFor(now),
            tasbihWards: 0,
            dhikrWards: 0,
            quranWards: 0,
          ),
        ),
        _guardedLoad(FaithRepository.instance.loadPrayerDay(now), const {
          'fajr': 0,
          'dhuhr': 0,
          'asr': 0,
          'maghrib': 0,
          'isha': 0,
        }),
        _guardedLoad(FaithRepository.instance.loadRestMode(now), false),
        _guardedLoad(FaithRepository.instance.loadKhatmaJuz(), 1),
        _guardedLoad(FaithRepository.instance.loadCompletedKhatmas(), 0),
        _guardedLoad(
          FaithRepository.instance.last7DaysPrayerCounts(),
          List<int>.filled(7, 0),
        ),
        _guardedLoad(FaithRepository.instance.loadFaithStats(), const {
          'prayers': 0,
          'tasbihDone': 0,
          'khatmas': 0,
        }),
        _guardedLoad(QuranRepository.instance.loadLastPosition(), null),
      ]).timeout(const Duration(seconds: 15));
    } catch (_) {
      // Unreachable through the guarded reads above; retained for a truly
      // unrecoverable initialization failure, never for a preference read.
      if (!mounted) return;
      setState(() => _loadError = true);
      return;
    }
    unawaited(_loadDashboardVerses());
    final settings = results[0] as FaithSettings;
    if (!mounted) return;
    setState(() {
      _settings = settings;
      _circle = results[1] as TasbihCircleState;
      _prayerDay = results[2] as Map<String, int>;
      _resting = false;
      _khatmaJuz = results[4] as int;
      _khatmaDone = results[5] as int;
      _weekPrayers = results[6] as List<int>;
      _faithStats = results[7] as Map<String, int>;
      _lastPosition = results[8] as QuranPosition?;
    });
    widget.onSettingsChanged?.call(settings);
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => _openRequestedDestination(),
    );
    unawaited(_loadDashboardVerses());
  }

  Future<void> _loadDashboardVerses() async {
    final remote = await RemoteContentRepository.instance.loadItems(
      'faith_daily_card',
    );
    if (!mounted || remote == null) return;
    final verses = remote
        .where((item) => item['categoryId'] == 'prayer_verse')
        .map((item) {
          final reference = (item['subtitleAr'] as String? ?? '').trim();
          final ayah =
              int.tryParse(
                RegExp(r'\d+').firstMatch(reference)?.group(0) ?? '',
              ) ??
              0;
          return DashboardVerse(
            (item['titleAr'] as String? ?? '').trim(),
            ayah,
            (item['bodyAr'] as String? ?? '').trim(),
          );
        })
        .where((item) => item.surah.isNotEmpty && item.text.isNotEmpty)
        .toList();
    if (verses.isNotEmpty) setState(() => _dashboardVerses = verses);
  }

  Future<void> _save(FaithSettings value, {bool reschedule = true}) async {
    final changedChoice =
        _settings?.prayerNotifications != value.prayerNotifications;
    setState(() => _settings = value);
    await FaithRepository.instance.saveSettings(value);
    if (changedChoice) {
      await FaithRepository.instance.markPrayerNotificationPromptAnswered();
    }
    widget.onSettingsChanged?.call(value);
    if (reschedule && value.locationConfigured) {
      // A valid GPS update must not be reported as failed because Android is
      // temporarily busy recreating notification alarms.
      try {
        await PrayerNotificationService.instance.reschedule(value);
      } catch (_) {
        // The service retries on the next launch or settings change.
      }
    }
  }

  Future<void> _chooseManualLocation(FaithSettings settings) async {
    final selected = await showHerSheet<ManualCity>(
      context,
      title: 'اختيار المدينة',
      child: ManualLocationSheet(initialTimezone: settings.timezone),
    );
    if (selected == null || !mounted) return;
    final base = settings.copyWith(
      automaticLocation: false,
      locationConfigured: true,
      city: selected.label,
      latitude: selected.latitude,
      longitude: selected.longitude,
      timezone: selected.timezone,
    );
    await _save(
      base.copyWith(
        calculationMethod: PrayerCalculationService.instance.suggestedMethodFor(
          base,
        ),
      ),
    );
  }

  Future<void> _useLocation() async {
    setState(() => _locating = true);
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw const LocationServiceDisabledException();
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw const PermissionDeniedException('location-permission-denied');
      }
      // This is a single, user-triggered location lookup — never a background
      // stream. Prefer the system's cached fix and give a new fix a short,
      // bounded window so an indoor GPS search cannot drain power.
      Position? cachedPosition;
      try {
        cachedPosition = await Geolocator.getLastKnownPosition();
      } catch (_) {}
      Position position;
      try {
        position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.low,
            timeLimit: Duration(seconds: 12),
          ),
        );
      } on TimeoutException {
        if (cachedPosition == null) rethrow;
        position = cachedPosition;
      }
      String city = 'موقعي الحالي';
      try {
        final marks = await placemarkFromCoordinates(
          position.latitude,
          position.longitude,
        );
        if (marks.isNotEmpty) {
          final m = marks.first;
          final parts = [m.locality, m.administrativeArea, m.country]
              .whereType<String>()
              .map((part) => part.trim())
              .where((part) => part.isNotEmpty)
              .toSet()
              .toList();
          if (parts.isNotEmpty) city = parts.join('، ');
        }
      } catch (_) {}
      String timezone = 'UTC';
      try {
        timezone = (await FlutterTimezone.getLocalTimezone()).identifier;
      } catch (_) {}
      // Egypt follows one IANA timezone. Prefer it when the device coordinate
      // is inside Egypt, even if the phone's timezone has been set incorrectly.
      if (position.latitude >= 21.5 &&
          position.latitude <= 31.8 &&
          position.longitude >= 24.5 &&
          position.longitude <= 37.2) {
        timezone = 'Africa/Cairo';
      }
      if (!mounted || _settings == null) {
        return;
      }
      final old = _settings!;
      final base = old.copyWith(
        automaticLocation: true,
        locationConfigured: true,
        latitude: position.latitude,
        longitude: position.longitude,
        city: city,
        timezone: timezone,
      );
      await _save(
        base.copyWith(
          calculationMethod: PrayerCalculationService.instance
              .suggestedMethodFor(base),
        ),
      );
    } on LocationServiceDisabledException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('فعّل خدمة الموقع/GPS من الهاتف، ثم أعد المحاولة.'),
          ),
        );
      }
    } on PermissionDeniedException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'الموقع غير متاح. يمكنك اختيار المدينة يدويًا من إعدادات مواقيت الصلاة.',
            ),
            action: SnackBarAction(
              label: 'الإعدادات',
              onPressed: Geolocator.openAppSettings,
            ),
          ),
        );
      }
    } on TimeoutException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تعذّر الحصول على إشارة GPS الآن. جرّبي قرب نافذة أو اختار مدينتك يدويًا.',
            ),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تعذّر تحديد الموقع الآن. يمكنك اختيار المدينة يدويًا.',
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = _settings;
    if (settings == null) {
      if (_loadError) {
        return Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const HERIconContainer(
                  Icons.mosque_rounded,
                  kind: HerIconKind.rose,
                  size: 52,
                  iconSize: 27,
                ),
                const SizedBox(height: 12),
                Text(
                  'تعذّر فتح ركن العبادات مؤقتًا',
                  textAlign: TextAlign.center,
                  style: faithText(context, 15, FontWeight.w900, roseInk),
                ),
                const SizedBox(height: 6),
                Text(
                  'بياناتك محفوظة. حاول مرة أخرى.',
                  textAlign: TextAlign.center,
                  style: faithText(context, 12, FontWeight.w600, roseSub),
                ),
                const SizedBox(height: 14),
                HERPrimaryButton(
                  label: 'حاول مرة أخرى',
                  icon: Icons.refresh_rounded,
                  onPressed: _load,
                  expanded: false,
                ),
              ],
            ),
          ),
        );
      }
      return Center(
        child: CircularProgressIndicator(color: AppColors.actionPrimary),
      );
    }
    final schedule = PrayerCalculationService.instance.calculate(
      settings,
      now: _now,
    );
    final next = schedule.nextAt(_now);
    final isFriday = schedule.today.first.time.weekday == DateTime.friday;
    return HerIconPaletteScope(
      policy: HerIconPalettePolicy.faith,
      child: HerAccentIconScope(
        child: Directionality(
          textDirection: TextDirection.rtl,
          child: ColoredBox(
            // Transparent so the global theme background image shows through.
            color: Colors.transparent,
            child: Column(
              children: [
                AppPageHeader(
                  title: '',
                  subtitle: '',
                  logoOnly: true,
                  onBack: widget.onBack,
                  headerImageKey: 'prayer',
                  trailingAction: IconButton(tooltip:'إيقاف الأذان',icon:const Icon(Icons.volume_off_outlined,size:19),onPressed:() async {await AdhanPlaybackService.instance.stop();}),
                ),
                _faithTabBar(context),
                Expanded(
                  child: IndexedStack(
                    index: _tabIndex,
                    children: [
                      _wirdTab(context, settings, schedule, next, isFriday),
                      _myDayTab(context, settings, schedule, next),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// ── تقسيم عباداتي لصفحتين مثل الرياضة ──────────────────────────
  /// شريط التبويبين تحت الهيدر: وردي اليومي + يومي مع الله.
  Widget _faithTabBar(BuildContext context) {
    final tabs = [
      (label: 'وردي اليومي', icon: Icons.spa_rounded, kind: HerIconKind.rose),
      (
        label: 'يومي مع الله',
        icon: Icons.wb_twilight_rounded,
        kind: HerIconKind.warm,
      ),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
      child: Row(
        children: [
          for (var i = 0; i < tabs.length; i++) ...[
            Expanded(child: _faithTabButton(i, tabs[i])),
            if (i != tabs.length - 1) const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }

  Widget _faithTabButton(
    int index,
    ({IconData icon, String label, HerIconKind kind}) tab,
  ) {
    final selected = _tabIndex == index;
    // Theme-aware tabs: brand gradient when selected, theme surface
    // otherwise — hardcoded light washes wash out in night mode.
    final theme = context.herTheme;
    return InkWell(
      onTap: () => setState(() => _tabIndex = index),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          gradient: selected
              ? LinearGradient(
                  colors: [
                    theme.buttonStyles.primary.gradientStart,
                    theme.buttonStyles.primary.gradientEnd,
                  ],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                )
              : null,
          color: selected ? null : theme.cards.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected
                ? theme.buttonStyles.primary.borderColor
                : theme.cards.border,
          ),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected
                    ? theme.buttonStyles.primary.foreground.withValues(
                        alpha: .16,
                      )
                    : theme.actions.primary.withValues(alpha: .14),
              ),
              child: Icon(
                tab.icon,
                size: 14,
                color: selected
                    ? theme.buttonStyles.primary.foreground
                    : theme.actions.primary,
              ),
            ),
            const SizedBox(width: 5),
            Flexible(
              child: Text(
                tab.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: PhoneDesignTokens.uiText(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w900,
                  color: selected
                      ? theme.buttonStyles.primary.foreground
                      : theme.text.primary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// الصفحة 1: وردي اليومي — المواقيت أولًا ثم الشبكة والسلايدر.
  Widget _wirdTab(
    BuildContext context,
    FaithSettings settings,
    PrayerSchedule schedule,
    PrayerMoment next,
    bool isFriday,
  ) {
    final sections = <String, Widget>{
      'next': _nextHero(context, settings, schedule, next),
      'entries': _faithEntryGrid(context),
      'quick': Column(
        children: [
          _blockTitle(
            context,
            'وردي اليومي',
            'أقسامك في متناول يدك',
            Icons.spa_rounded,
          ),
          const SizedBox(height: 8),
          _quickGrid(context, settings),
        ],
      ),
      'tips': Column(
        children: [
          // STEP 2: one canonical tip surface — on Friday the Friday tips
          // replace (not stack with) the prayer tips.
          if (isFriday)
            const FaithTipCarousel(category: 'friday')
          else
            const FaithTipCarousel(category: 'prayer'),
        ],
      ),
      'content': Column(
        children: [
          _blockTitle(
            context,
            'محتوى الورد',
            'خطوة صغيرة ثابتة أجمل من الكمال المتقطع',
            Icons.spa_rounded,
          ),
          const SizedBox(height: 8),
          _morningEveningCard(context),
          const SizedBox(height: 10),
          _dailyFaith(context),
        ],
      ),
    };
    return GestureDetector(
      onLongPress: _showFaithCustomizer,
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (final key in _wirdOrder) ...[
              if (key == _wirdOrder[1])
                const HerBannerAd(inline: true, placement: 'faith'),
              sections[key]!,
              const SizedBox(height: 12),
            ],
          ],
        ),
      ),
    );
  }

  /// الصفحة 2: يومي مع الله — صلواتي فوق، ثم النبض والإحصائيات والقراءة.
  Widget _myDayTab(
    BuildContext context,
    FaithSettings settings,
    PrayerSchedule schedule,
    PrayerMoment next,
  ) {
    final sections = <String, Widget>{
      'prayers': Column(
        children: [
          _blockTitle(
            context,
            'صلواتي اليوم',
            'سجّل صلاتك بلطف — من دون ضغط أو ذنب',
            Icons.mosque_rounded,
          ),
          const SizedBox(height: 8),
          _prayerChecklist(context, schedule.today),
        ],
      ),
      'rhythm': _weekRhythm(context),
      'day': Column(
        children: [
          _blockTitle(
            context,
            'يومي مع الله',
            'نبض صلواتك اليوم بلطف',
            Icons.wb_twilight_rounded,
          ),
          const SizedBox(height: 8),
          _myDayHeader(context, settings, next),
        ],
      ),
      'quran': Column(
        children: [
          _quranSpotlight(context),
          const SizedBox(height: 16),
          _blockTitle(
            context,
            'رحلتك وتذكيراتك',
            'أثرك التراكمي بلطف، من دون ضغط',
            Icons.favorite_rounded,
          ),
        ],
      ),
    };
    return GestureDetector(
      onLongPress: _showFaithCustomizer,
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (final key in _myDayOrder) ...[
              if (key == _myDayOrder[1])
                const HerBannerAd(inline: true, placement: 'faith'),
              sections[key]!,
              const SizedBox(height: 12),
            ],
          ],
        ),
      ),
    );
  }

  /// شبكة 2×3: (قرآن / قبلة / سبحة) + (أذكار / أدعية / آية اليوم).
  /// Surfaces share the home quick-action family; icon kinds retain meaning.
  Widget _quickGrid(BuildContext context, FaithSettings settings) {
    final actions = <String, QuickAction>{
      'quran': QuickAction(
        'القرآن',
        Icons.menu_book_rounded,
        _openQuranIndex,
        HerIconKind.knowledge,
      ),
      'qibla': QuickAction(
        'القبلة',
        Icons.explore_rounded,
        () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => QiblaScreen(settings: settings)),
        ),
        HerIconKind.warm,
      ),
      'tasbih': QuickAction(
        'السبحة',
        Icons.touch_app_rounded,
        () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => TasbihScreen(onAchievement: widget.onAchievement),
          ),
        ),
        HerIconKind.burgundy,
      ),
      'dhikr': QuickAction(
        'الأذكار',
        Icons.auto_awesome_rounded,
        () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) =>
                DhikrLibraryScreen(onAchievement: widget.onAchievement),
          ),
        ),
        HerIconKind.rose,
      ),
      'dua': QuickAction(
        'الأدعية',
        Icons.volunteer_activism_rounded,
        () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const DuaLibraryScreen()),
        ),
        HerIconKind.neutral,
      ),
      'ayah': QuickAction(
        'آية اليوم',
        Icons.auto_stories_rounded,
        () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AyahScreen()),
        ),
        HerIconKind.emotional,
      ),
    };
    final ordered = _quickOrder.map((key) => actions[key]!).toList();
    Widget row(List<QuickAction> items) => Row(
      children: [
        for (var i = 0; i < items.length; i++) ...[
          Expanded(child: SquareQuickTile(action: items[i])),
          if (i != items.length - 1) const SizedBox(width: 8),
        ],
      ],
    );
    return Column(
      children: [
        row(ordered.take(3).toList()),
        const SizedBox(height: 8),
        row(ordered.skip(3).toList()),
      ],
    );
  }

  /// مدخل التحدي بنفس مقاس ولغة مداخل ركن العبادات.
  /// STEP 2: static entry — weekly totals live in TasbihChallengeScreen
  /// (canonical home). This tile navigates; it does not report numbers.

  /// الموقع والمواقيت لهما مكان واحد داخل «إعدادات الصلاة». هنا نترك فقط
  /// مداخل العبادات الفعلية، حتى لا تتكرر نفس الإعدادات في واجهتين.
  Widget _faithEntryGrid(BuildContext context) {
    Widget tile(Widget child) =>
        Expanded(child: SizedBox(height: 94, child: child));
    return Row(children: [tile(_quranCompanionShortcut(context))]);
  }

  String _hijriToday(FaithSettings s) {
    HijriDate.setLocal('ar');
    final hijri = HijriDate.fromDate(
      DateTime.now().add(Duration(days: s.hijriAdjustment)),
    );
    return '${hijri.hDay} ${hijri.longMonthName} ${hijri.hYear}';
  }

  Widget _quranCompanionShortcut(BuildContext context) => _miniCard(
    context,
    icon: Icons.auto_stories_rounded,
    kind: HerIconKind.knowledge,
    title: 'صحبة القرآن',
    subtitle: 'حفظ ومراجعة',
    iconSize: 30,
    iconIconSize: 16,
    onTap: _openQuranCompanion,
  );

  void _openQuranCompanion() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => QuranCompanionScreen(
          onOpenQuran: _openQuranIndex,
          onAchievement: widget.onAchievement,
        ),
      ),
    );
  }

  Widget _miniCard(
    BuildContext context, {
    required IconData icon,
    required HerIconKind kind,
    required String title,
    required String subtitle,
    String? badge,
    double iconSize = 38,
    double iconIconSize = 20,
    required VoidCallback? onTap,
  }) => Opacity(
    opacity: onTap == null ? .6 : 1,
    // Scoped daily shortcuts leave the other wide cards unchanged.
    child: HERShortcutCard(
      radius: 22,
      padding: const EdgeInsets.fromLTRB(7, 10, 7, 9),
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              HERIconContainer(
                icon,
                kind: kind,
                size: iconSize,
                iconSize: iconIconSize,
              ),
              if (badge != null)
                Positioned(
                  top: -6,
                  left: -8,
                  child: HERBadge(badge, kind: kind),
                ),
            ],
          ),
          const SizedBox(height: 5),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: faithText(
              context,
              11,
              FontWeight.w900,
              herShortcutForeground(context.herTheme),
            ),
          ),
          Text(
            subtitle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: faithText(
              context,
              9,
              FontWeight.w600,
              herShortcutForeground(context.herTheme, subtitle: true),
            ),
          ),
        ],
      ),
    ),
  );

  /// ── ركن عباداتي: بطاقات اليوم ──────────────────────────────────────

  /// Section heading in challenge style: pink avatar + ink title.
  Widget _blockTitle(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
  ) => HERSectionHeader(title, subtitle, icon, kind: HerIconKind.rose);

  /// ملخص اليوم: صلوات + تسبيح + ختمة في بطاقة واحدة دافئة.
  /// STEP 2 (Faith cleanup): TODAY-only header — prayer status.
  /// Challenge/Khatma numbers live in their own screens now; this card no
  /// longer blends weekly/lifetime percentages into a combined dashboard.
  Widget _myDayHeader(
    BuildContext context,
    FaithSettings settings,
    PrayerMoment next,
  ) {
    final prayed = _prayerDay.values.where((v) => v == 1).length;
    final dayProgress = (prayed / 5).clamp(0.0, 1.0);
    return HERCard(
      role: HERCardRole.wide,
      radius: 20,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const HERIconContainer(
                Icons.wb_twilight_rounded,
                kind: HerIconKind.rose,
                size: 38,
                iconSize: 21,
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _resting
                          ? 'يوم راحة بلطف — وردك ذكر وقرآن 🤍'
                          : prayed == 5
                          ? 'ما شاء الله — يوم كامل بفضل الله ✨'
                          : 'يومي مع الله — $prayed من 5 صلوات',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: faithText(context, 13, FontWeight.w900, roseInk),
                    ),
                    Text(
                      'القادمة: ${next.name} • ${faithFormatTime(next.time)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: faithText(context, 10.5, FontWeight.w700, roseSub),
                    ),
                  ],
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${(dayProgress * 100).round()}٪',
                    style: PhoneDesignTokens.uiText(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: roseIcon,
                    ),
                  ),
                  InkWell(
                    onTap: () => Share.share(
                      'يومي مع الله 🤍\n'
                      'الصلوات: $prayed من 5\n'
                      '— من ركن عباداتي في Morph',
                      subject: 'يومي مع الله',
                    ),
                    borderRadius: BorderRadius.circular(14),
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Icon(
                        Icons.share_rounded,
                        size: 16,
                        color: roseIcon,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          _faithGradientProgress(context, dayProgress),
          const SizedBox(height: 7),
          // STEP 2: single TODAY chip — challenge/khatma chips removed
          // (they live in the Challenge screen / Quran spotlight).
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _dayChip(context, Icons.mosque_rounded, 'الصلوات', '$prayed/5'),
            ],
          ),
        ],
      ),
    );
  }

  /// التقدم اليومي لا يكتفي بلون واحد: يبدأ بالوردي الهادئ ثم يزداد عمقًا
  /// مع اكتمال العبادة، ليكون إنجاز «يوم كامل» واضحًا بصريًا.
  Widget _faithGradientProgress(BuildContext context, double value) {
    final theme = context.herTheme;
    final progress = value.clamp(0.0, 1.0);
    return Container(
      height: 10,
      decoration: BoxDecoration(
        color: herIconWashOf(theme, HerIconKind.rose),
        borderRadius: BorderRadius.circular(8),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) => Align(
          alignment: Alignment.centerRight,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 420),
            curve: Curves.easeOutCubic,
            width: constraints.maxWidth * progress,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              gradient: LinearGradient(
                begin: Alignment.centerRight,
                end: Alignment.centerLeft,
                colors: [
                  theme.actions.primary,
                  Color.lerp(
                    theme.actions.primary,
                    theme.actions.secondary,
                    .48,
                  )!,
                  Color.alphaBlend(
                    theme.actions.primary.withValues(alpha: .72),
                    theme.surfaces.background,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _dayChip(
    BuildContext context,
    IconData icon,
    String label,
    String value,
  ) => HERChip(label: '$label $value', icon: icon, dense: true);

  /// Checklist الصلوات: صليتها / قضاء / لسه — مع وضع الراحة.
  Widget _prayerChecklist(BuildContext context, List<PrayerMoment> prayers) {
    const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const names = {
      'fajr': 'الفجر',
      'dhuhr': 'الظهر',
      'asr': 'العصر',
      'maghrib': 'المغرب',
      'isha': 'العشاء',
    };
    return HERCard(
      role: HERCardRole.wide,
      radius: 22,
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 10),
      child: Column(
        children: [
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: TextButton.icon(
              key: const Key('prayer-history-entry'),
              icon: const Icon(Icons.calendar_month_rounded),
              label: const Text('التقويم · تسجيل يوم سابق'),
              onPressed: () async {
                await Navigator.push<void>(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const PrayerHistoryScreen(),
                  ),
                );
                if (mounted) await _load();
              },
            ),
          ),
          Row(
            children: [
              Expanded(
                child: Text(
                  _resting ? 'وضع الراحة مفعّل' : 'سجّل صلاتك',
                  style: faithText(context, 13, FontWeight.w900, roseInk),
                ),
              ),
            ],
          ),
          if (_resting)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'في أيام العذر الشرعي لا تُحسب الصلوات — ثباتك على الذكر والقرآن هو وردك الجميل.',
                style: faithText(
                  context,
                  10,
                  FontWeight.w600,
                  context.herPalette.textSecondary,
                ),
              ),
            ),
          const SizedBox(height: 8),
          Row(
            children: [
              for (var i = 0; i < order.length; i++) ...[
                Expanded(
                  child: _prayerCheckTile(context, order[i], names[order[i]]!),
                ),
                if (i != order.length - 1) const SizedBox(width: 6),
              ],
            ],
          ),
        ],
      ),
    );
  }

  /// بلاطة الصلاة: بدون خلفية بينك — علامة الصح وحدها كفاية.
  Widget _prayerCheckTile(BuildContext context, String key, String name) {
    final status = _prayerDay[key] ?? 0;
    final done = status == 1;
    final qada = status == 2;
    return InkWell(
      onTap: _resting
          ? null
          : () async {
              // دورة لطيفة: لسه → صليتها → قضاء → لسه
              final next = status == 0
                  ? 1
                  : status == 1
                  ? 2
                  : 0;
              final messenger = ScaffoldMessenger.of(context);
              final updated = await FaithRepository.instance.savePrayerStatus(
                DateTime.now(),
                key,
                next,
              );
              final week = await FaithRepository.instance
                  .last7DaysPrayerCounts();
              final stats = await FaithRepository.instance.loadFaithStats();
              if (!mounted) return;
              setState(() {
                _prayerDay = updated;
                _weekPrayers = week;
                _faithStats = stats;
              });
              if (next == 1) {
                await widget.onAchievement('صلاة $name');
                if (!mounted) return;
                final prayed = updated.values.where((v) => v == 1).length;
                messenger.showSnackBar(
                  SnackBar(
                    content: Text(
                      prayed == 5
                          ? 'ما شاء الله أتممتَ صلوات اليوم الخمس 🤍'
                          : 'تقبّل الله 🤍 سجّلنا صلاة $name ($prayed/5).',
                    ),
                  ),
                );
              }
            },
      borderRadius: BorderRadius.circular(15),
      child: Opacity(
        opacity: _resting ? .5 : 1,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(15),
            color: qada
                // Wave 1: qada tint is a translucent warm wash, not a legacy
                // cardSoft surface (aliases collapse to one surface).
                ? AppColors.iconWarm.withValues(alpha: .25)
                : AppColors.softSurface.withValues(alpha: .5),
            border: Border.all(
              color: done
                  ? AppColors.actionPrimary.withValues(alpha: .65)
                  : qada
                  ? AppColors.iconWarm
                  : roseBorder,
              width: 1,
            ),
          ),
          child: Column(
            children: [
              Icon(
                done
                    ? Icons.check_circle_rounded
                    : qada
                    ? Icons.history_rounded
                    : Icons.circle_outlined,
                size: 24,
                color: done
                    ? AppColors.actionPrimary
                    : qada
                    ? AppColors.iconWarm
                    : AppColors.actionPrimary.withValues(alpha: .35),
              ),
              const SizedBox(height: 4),
              Text(
                name,
                style: faithText(context, 10, FontWeight.w900, roseInk),
              ),
              Text(
                done
                    ? 'صليتها'
                    : qada
                    ? 'قضاء'
                    : 'لسه',
                style: faithText(
                  context,
                  8.5,
                  FontWeight.w700,
                  done ? AppColors.actionPrimary : roseSub,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// إيقاع الأسبوع: 7 أعمدة صغيرة بعدد الصلوات كل يوم.
  /// Restored per product decision: "يومي مع الله" is the specialized faith
  /// dashboard, so the weekly prayer rhythm belongs here (NOT lifetime stats,
  /// NOT blended percentages — those stay removed).
  static String _weekDayShort(DateTime date) => switch (date.weekday) {
    DateTime.monday => 'ن',
    DateTime.tuesday => 'ث',
    DateTime.wednesday => 'ر',
    DateTime.thursday => 'خ',
    DateTime.friday => 'ج',
    DateTime.saturday => 'س',
    _ => 'ح',
  };

  Widget _weekRhythm(BuildContext context) {
    const todayIndex = 6;
    return HERCard(
      role: HERCardRole.wide,
      radius: 22,
      padding: const EdgeInsets.all(13),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'إيقاع الأسبوع',
                  style: faithText(context, 12.5, FontWeight.w900, roseInk),
                ),
                Text(
                  'كل عمود = عدد صلوات اليوم',
                  style: faithText(context, 9.5, FontWeight.w600, roseSub),
                ),
              ],
            ),
          ),
          Row(
            children: [
              for (var i = 0; i < 7; i++)
                Padding(
                  padding: EdgeInsets.only(left: i == 6 ? 0 : 6),
                  child: Column(
                    children: [
                      Container(
                        width: 22,
                        height: 44,
                        alignment: Alignment.bottomCenter,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          color: context.herPalette.surface.withValues(
                            alpha: .7,
                          ),
                          border: Border.all(
                            color: i == todayIndex
                                ? context.herPalette.primary
                                : context.herPalette.border,
                          ),
                        ),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 420),
                          curve: Curves.easeOutCubic,
                          width: 22,
                          height: (44 * (_weekPrayers[i] / 5)).clamp(3.0, 44.0),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            gradient: _weekPrayers[i] == 0
                                ? null
                                : LinearGradient(
                                    begin: Alignment.bottomCenter,
                                    end: Alignment.topCenter,
                                    colors: [
                                      context.herTheme.actions.primary,
                                      context.herTheme.accents.emotional
                                          .withValues(alpha: .72),
                                      context.herTheme.accents.emotional,
                                    ],
                                  ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        i == todayIndex
                            ? 'اليوم'
                            : _weekDayShort(
                                DateTime.now().subtract(Duration(days: 6 - i)),
                              ),
                        style: faithText(
                          context,
                          8,
                          FontWeight.w800,
                          i == todayIndex
                              ? context.herPalette.primary
                              : context.herPalette.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  /// ورد الصباح والمساء: دخول مباشر على الورد المناسب للوقت.
  Widget _morningEveningCard(BuildContext context) {
    final hour = DateTime.now().hour;
    final isMorning = hour >= 4 && hour < 15;
    return HERCard(
      role: HERCardRole.wide,
      radius: 20,
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
      child: Row(
        children: [
          HERIconContainer(
            isMorning ? Icons.wb_sunny_rounded : Icons.nights_stay_rounded,
            kind: HerIconKind.warm,
            size: 42,
            iconSize: 23,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              isMorning ? 'ورد الصباح' : 'ورد المساء',
              style: faithText(context, 13, FontWeight.w900, roseInk),
            ),
          ),
          HERSoftButton(
            label: isMorning ? 'ابدأ وردك ☀️' : 'ابدأ وردك 🌙',
            kind: HerIconKind.warm,
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => DhikrLibraryScreen(
                  onAchievement: widget.onAchievement,
                  initialCategory: isMorning ? 'أذكار الصباح' : 'أذكار المساء',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Refreshes Quran state after returning from the reader.
  Future<void> _refreshQuranState() async {
    final results = await Future.wait<dynamic>([
      QuranRepository.instance.loadLastPosition(),
      FaithRepository.instance.loadKhatmaJuz(),
      FaithRepository.instance.loadCompletedKhatmas(),
    ]);
    if (!mounted) return;
    setState(() {
      _lastPosition = results[0] as QuranPosition?;
      _khatmaJuz = results[1] as int;
      _khatmaDone = results[2] as int;
    });
  }

  Future<void> _advanceKhatma(BuildContext context) async {
    if (_khatmaJuz >= 30) {
      final messenger = ScaffoldMessenger.of(context);
      final done = await FaithRepository.instance.completeKhatma();
      final juz = await FaithRepository.instance.loadKhatmaJuz();
      if (!mounted) return;
      setState(() {
        _khatmaDone = done;
        _khatmaJuz = juz;
      });
      await widget.onAchievement('ختمة قرآن كاملة');
      if (!mounted) return;
      messenger.showSnackBar(
        const SnackBar(
          content: Text('مبارك الختمة 🤍 تقبّل الله وبداية جديدة.'),
        ),
      );
    } else {
      final juz = await FaithRepository.instance.saveKhatmaJuz(_khatmaJuz + 1);
      if (mounted) setState(() => _khatmaJuz = juz);
    }
  }

  void _openQuranIndex() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const QuranReaderScreen()),
    ).then((_) => _refreshQuranState());
  }

  void _openQuranReading() {
    final last = _lastPosition;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => QuranReaderScreen(
          initialSurah: last?.surah,
          initialAyah: last?.ayah,
        ),
      ),
    ).then((_) => _refreshQuranState());
  }

  /// Quran spotlight: full-width section, central rose icon accents.
  Widget _quranSpotlight(BuildContext context) {
    final last = _lastPosition;
    return HERCard(
      role: HERCardRole.wide,
      radius: 22,
      padding: const EdgeInsets.all(13),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const HERIconContainer(
                Icons.auto_stories_rounded,
                kind: HerIconKind.rose,
                size: 46,
                iconSize: 25,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'القرآن الكريم',
                      style: faithText(context, 15, FontWeight.w900, roseInk),
                    ),
                    // STEP 2: resume-first subtitle — the X/30 khatma counter
                    // stays on the progress control below (functional advance),
                    // not as the headline. Tracking untouched.
                    Text(
                      last == null
                          ? 'وردك ونور يومك — ابدأ من حيث تحبين'
                          : 'وردك ونور يومك — كمّل من حيث وقفتَ',
                      style: faithText(context, 10, FontWeight.w600, roseSub),
                    ),
                  ],
                ),
              ),
              HERPillButton(
                label: 'المصحف',
                icon: Icons.menu_book_rounded,
                onPressed: _openQuranIndex,
              ),
            ],
          ),
          if (last != null) ...[
            const SizedBox(height: 8),
            // Continue-reading row — structural list row (never a card).
            HERListRow(
              radius: 14,
              padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 9),
              onTap: _openQuranReading,
              child: Row(
                children: [
                  const HERIconContainer(
                    Icons.bookmark_rounded,
                    kind: HerIconKind.rose,
                    size: 30,
                    iconSize: 16,
                  ),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      'متابعة: ${QuranRepository.surahNames[last.surah - 1]} • آية ${last.ayah}',
                      style: faithText(context, 11.5, FontWeight.w800, roseInk),
                    ),
                  ),
                  Icon(
                    Icons.arrow_back_ios_new_rounded,
                    size: 15,
                    color: roseIcon,
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 9),
          Row(
            children: [
              Expanded(
                child: HERProgress(_khatmaJuz / 30, kind: HerIconKind.rose),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: () => _advanceKhatma(context),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 4,
                  ),
                  child: Text(
                    _khatmaJuz >= 30 ? 'إتمام الختمة ✨' : 'الجزء التالي',
                    style: faithText(
                      context,
                      10.5,
                      FontWeight.w900,
                      AppColors.actionPrimary,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            // Cleanup: central Primary (pinned pink + white); the old
            // dark-burgundy fill converges to the pin. Metrics kept.
            child: HERPrimaryButton(
              label: last == null ? 'ابدأ القراءة' : 'أكمّل القراءة',
              icon: Icons.menu_book_rounded,
              onPressed: _openQuranReading,
              height: 42,
              radius: 22,
              fontSize: 13,
              fontWeight: FontWeight.w900,
              iconSize: 19,
              presentation: HERButtonPresentation.flat,
              expanded: false,
            ),
          ),
        ],
      ),
    );
  }

  /// Hero الصلاة القادمة — قابل للضغط: يفتح popup المواقيت الكاملة.
  Widget _nextHero(BuildContext context, FaithSettings settings, PrayerSchedule schedule, PrayerMoment next) {
    final p=PhoneDesignTokens.palette(context.herTheme.surfaces.background.computeLuminance()<.38);
    return Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[
      Row(children:[Icon(Icons.mosque_outlined,size:21,color:p.link),const SizedBox(width:8),Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
        Text('مواقيت الصلاة',style:PhoneDesignTokens.uiText(fontSize:18,fontWeight:FontWeight.w600,color:p.text)),
        Text(settings.city,style:PhoneDesignTokens.uiText(fontSize:11,color:p.muted)),
      ]))]),const SizedBox(height:10),
      InkWell(onTap:()=>_showPrayerTimesSheet(context,settings,schedule),borderRadius:BorderRadius.circular(13),child:Container(
        decoration:p.cardDecoration(),padding:const EdgeInsets.all(14),child:Row(children:[
          Icon(Icons.nightlight_round,size:38,color:p.link),const SizedBox(width:12),
          Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
            Text('الصلاة القادمة',style:PhoneDesignTokens.uiText(fontSize:11,color:p.link)),
            Text(next.name,style:PhoneDesignTokens.uiText(fontSize:21,fontWeight:FontWeight.w600,color:p.text)),
            Text(faithFormatTime(next.time),textDirection:TextDirection.ltr,style:PhoneDesignTokens.uiText(fontSize:14,color:p.text)),
          ])),Column(crossAxisAlignment:CrossAxisAlignment.end,children:[
            Text('المتبقي',style:PhoneDesignTokens.uiText(fontSize:11,color:p.muted)),
            CountdownText(target:next.time,style:PhoneDesignTokens.uiText(fontSize:13,fontWeight:FontWeight.w600,color:p.link)),
          ]),
        ]))),const SizedBox(height:10),
      Container(decoration:p.cardDecoration(elevated:false),child:Column(children:[
        for(var i=0;i<schedule.today.length;i++)...[
          if(i>0)Divider(height:1,thickness:.5,color:p.border),
          InkWell(onTap:()=>_showPrayerTimesSheet(context,settings,schedule),child:Padding(padding:const EdgeInsets.symmetric(horizontal:12,vertical:9),child:Row(children:[
            Icon(schedule.today[i].key==next.key?Icons.nightlight_round:Icons.access_time_rounded,size:18,color:p.link),const SizedBox(width:10),
            Expanded(child:Text(schedule.today[i].name,style:PhoneDesignTokens.uiText(fontSize:13,color:p.text))),
            Text(faithFormatTime(schedule.today[i].time),textDirection:TextDirection.ltr,style:PhoneDesignTokens.uiText(fontSize:13,color:schedule.today[i].key==next.key?p.link:p.muted)),
            const SizedBox(width:4),Icon(Icons.chevron_left,size:15,color:p.muted),
          ]))),
        ],
      ])),
    ]);
  }

  /// Popup المواقيت الكاملة: تُفتح من الهيرو لتوفير مساحة الصفحة.
  Future<void> _showPrayerTimesSheet(
    BuildContext context,
    FaithSettings settings,
    PrayerSchedule schedule,
  ) async {
    var current = settings;
    await showHerSheet<void>(
      context,
      child: StatefulBuilder(
        builder: (sheetContext, setSheet) {
          // Recomputed every rebuild so a location change refreshes times.
          final sched = PrayerCalculationService.instance.calculate(
            current,
            now: DateTime.now(),
          );
          return Directionality(
            textDirection: TextDirection.rtl,
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.sizeOf(sheetContext).height * .82,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        const HERIconContainer(
                          Icons.access_time_rounded,
                          kind: HerIconKind.rose,
                          size: 38,
                          iconSize: 20,
                        ),
                        const SizedBox(width: 9),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'مواقيت اليوم',
                                style: faithText(
                                  context,
                                  16,
                                  FontWeight.w900,
                                  roseInk,
                                ),
                              ),
                              Text(
                                current.city,
                                style: faithText(
                                  context,
                                  10.5,
                                  FontWeight.w600,
                                  roseSub,
                                ),
                              ),
                            ],
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.pop(sheetContext);
                            _openSettings(current);
                          },
                          child: Text(
                            'الإعدادات',
                            style: PhoneDesignTokens.uiText(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              color: roseIcon,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Location row — structural list row (never a card);
                    // the family owns surface/opacity/border.
                    HERListRow(
                      radius: 14,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 11,
                        vertical: 8,
                      ),
                      onTap: _locating
                          ? null
                          : () async {
                              await _useLocation();
                              if (!mounted) return;
                              final fresh = _settings;
                              if (fresh != null) {
                                current = fresh;
                                setSheet(() {});
                              }
                            },
                      child: Row(
                        children: [
                          Icon(
                            current.locationConfigured
                                ? Icons.my_location_rounded
                                : Icons.location_searching_rounded,
                            size: 17,
                            color: roseIcon,
                          ),
                          const SizedBox(width: 7),
                          Expanded(
                            child: Text(
                              current.locationConfigured
                                  ? '${current.city} • ${_hijriToday(current)}'
                                  : 'حدّد موقعك لمواقيت دقيقة',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: faithText(
                                context,
                                10.5,
                                FontWeight.w800,
                                roseInk,
                              ),
                            ),
                          ),
                          Text(
                            _locating
                                ? 'جارٍ…'
                                : current.locationConfigured
                                ? 'تغيير'
                                : 'تحديد',
                            style: faithText(
                              context,
                              10.5,
                              FontWeight.w900,
                              roseIcon,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () async {
                        await _chooseManualLocation(current);
                        if (!mounted) return;
                        current = _settings ?? current;
                        setSheet(() {});
                      },
                      child: const Text('اختيار المدينة يدويًا'),
                    ),
                    _schedule(
                      context,
                      sched.today,
                      current,
                      onSaved: (v) async {
                        current = v;
                        setSheet(() {});
                        await _save(v);
                      },
                      onChanged: () => setSheet(() {}),
                    ),
                    const SizedBox(height: 8),
                    _prayerNotificationsToggle(
                      context,
                      current,
                      onSaved: (v) async {
                        current = v;
                        setSheet(() {});
                        await _save(v);
                      },
                    ),
                    const SizedBox(height: 8),
                    _prayerAlertPreferences(
                      context,
                      current,
                      onSaved: (v) async {
                        current = v;
                        setSheet(() {});
                        await _save(v);
                      },
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  String _prayerMomentArtwork(String key) => switch (key) {
    'fajr' => 'assets/images/faith/prayer-moments/fajr.webp',
    'dhuhr' => 'assets/images/faith/prayer-moments/dhuhr.webp',
    'asr' => 'assets/images/faith/prayer-moments/asr.webp',
    'maghrib' => 'assets/images/faith/prayer-moments/maghrib.webp',
    'isha' => 'assets/images/faith/prayer-moments/isha.webp',
    _ => 'assets/images/faith/prayer-moments/fajr.webp',
  };

  Future<void> _showAdhanSheet(
    BuildContext context,
    FaithSettings settings, {
    Future<void> Function(FaithSettings)? onSaved,
  }) async {
    var current = settings;
    String? playingId;
    await showHerSheet<void>(
      context,
      child: StatefulBuilder(
        builder: (sheetContext, setSheet) => Directionality(
          textDirection: TextDirection.rtl,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'اختيار صوت المؤذن',
                style: faithText(context, 16, FontWeight.w900),
              ),
              const SizedBox(height: 8),
              for (final voice in adhanVoices)
                ListTile(
                  title: Text(voice.name),
                  leading: Icon(
                    current.adhanVoice == voice.id
                        ? Icons.radio_button_checked
                        : Icons.radio_button_unchecked,
                  ),
                  onTap: () async {
                    final next = current.copyWith(adhanVoice: voice.id);
                    if (onSaved != null) {
                      await onSaved(next);
                    } else {
                      await _save(next);
                    }
                    if (sheetContext.mounted) setSheet(() => current = next);
                  },
                  trailing: IconButton(
                    tooltip: playingId == voice.id
                        ? 'إيقاف الصوت'
                        : 'استماع إلى ${voice.name}',
                    icon: Icon(
                      playingId == voice.id
                          ? Icons.stop_rounded
                          : Icons.play_arrow_rounded,
                    ),
                    onPressed: () async {
                      try {
                        await HerAudioService.initialize();
                        if (!sheetContext.mounted) return;
                        if (playingId == voice.id) {
                          await AdhanPlaybackService.instance.stop();
                          if (sheetContext.mounted) {
                            setSheet(() => playingId = null);
                          }
                          return;
                        }
                        await AdhanPlaybackService.instance.stop();
                        final started = await AdhanPlaybackService.instance
                            .playFullAdhan(voiceId: voice.id);
                        if (!started) throw StateError('Adhan playback failed');
                        if (!sheetContext.mounted) {
                          await AdhanPlaybackService.instance.stop();
                          return;
                        }
                        if (sheetContext.mounted) {
                          setSheet(() => playingId = voice.id);
                        }
                      } catch (_) {
                        if (sheetContext.mounted) {
                          setSheet(() => playingId = null);
                          ScaffoldMessenger.of(sheetContext).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'تعذر تشغيل الصوت الآن. حاول مرة أخرى.',
                              ),
                            ),
                          );
                        }
                      }
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
    if (playingId != null) {
      await AdhanPlaybackService.instance.stop();
    }
  }

  Widget _prayerStatusDot(BuildContext context, String key) {
    final status = _prayerDay[key] ?? 0;
    if (status == 1) {
      return Icon(
        Icons.check_circle_rounded,
        size: 17,
        color: context.herTheme.actions.primary,
      );
    }
    if (status == 2) {
      return Icon(Icons.history_rounded, size: 17, color: AppColors.iconWarm);
    }
    return const SizedBox(width: 17);
  }

  Widget _schedule(
    BuildContext context,
    List<PrayerMoment> prayers,
    FaithSettings s, {
    Future<void> Function(FaithSettings)? onSaved,
    VoidCallback? onChanged,
  }) => HERCard(
    role: HERCardRole.wide,
    radius: 20,
    elevated: false,
    padding: EdgeInsets.zero,
    child: Column(
      children: prayers.map((prayer) {
        final enabled = s.enabledPrayers[prayer.key] ?? false;
        final adhanEnabled = s.adhanPrayers[prayer.key] ?? false;
        return Opacity(
          opacity: prayer.optional
              ? context.herTheme.states.disabledOpacity
              : 1,
          child: ListTile(
            dense: true,
            onTap: prayer.optional
                ? null
                // الضغط على وقت الصلاة يفتح بطاقة مدمجة:
                // تسجيل الصلاة وتنبيهها من بطاقة الوقت نفسها.
                : () => _showPrayerTapSheet(
                    context,
                    prayer,
                    s,
                    onSaved: onSaved,
                    onChanged: onChanged,
                  ),
            leading: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(prayer.icon, style: const TextStyle(fontSize: 20)),
                const SizedBox(width: 6),
                _prayerStatusDot(context, prayer.key),
              ],
            ),
            title: Text(
              prayer.name,
              style: faithText(context, 13, FontWeight.w800, roseInk),
            ),
            subtitle: prayer.optional
                ? Text(
                    'وقت الشروق — ليس صلاة مفروضة',
                    style: faithText(context, 9.5, FontWeight.w500, roseSub),
                  )
                : (_prayerDay[prayer.key] == 2
                      ? Text(
                          'مسجلة قضاء — اضغط لتعديلها من بطاقة صلواتي',
                          style: faithText(
                            context,
                            9.5,
                            FontWeight.w600,
                            AppColors.iconWarm,
                          ),
                        )
                      : null),
            trailing: prayer.optional
                ? Text(
                    faithFormatTime(prayer.time),
                    style: faithText(context, 13, FontWeight.w800, roseIcon),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        tooltip: adhanEnabled
                            ? 'إيقاف صوت أذان ${prayer.name}'
                            : 'تفعيل صوت أذان ${prayer.name}',
                        icon: Icon(
                          adhanEnabled
                              ? Icons.volume_up_rounded
                              : Icons.volume_off_rounded,
                          size: 20,
                          color: adhanEnabled ? roseIcon : roseSub,
                        ),
                        onPressed: s.prayerNotifications && enabled
                            ? () => (onSaved ?? _save)(
                                s.copyWith(
                                  adhanPrayers: {
                                    ...s.adhanPrayers,
                                    prayer.key: !adhanEnabled,
                                  },
                                ),
                              )
                            : null,
                      ),
                      Text(
                        faithFormatTime(prayer.time),
                        style: faithText(
                          context,
                          13,
                          FontWeight.w800,
                          roseIcon,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Switch(
                        value: enabled,
                        activeTrackColor: faithPrayerSwitchStyle(
                          context,
                        ).trackSelected,
                        activeThumbColor: faithPrayerSwitchStyle(
                          context,
                        ).thumbSelected,
                        inactiveTrackColor: faithPrayerSwitchStyle(
                          context,
                        ).trackUnselected,
                        inactiveThumbColor: faithPrayerSwitchStyle(
                          context,
                        ).thumbUnselected,
                        trackOutlineColor: WidgetStatePropertyAll(
                          faithPrayerSwitchStyle(context).border,
                        ),
                        onChanged: (v) => (onSaved ?? _save)(
                          s.copyWith(
                            enabledPrayers: {
                              ...s.enabledPrayers,
                              prayer.key: v,
                            },
                          ),
                        ),
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ],
                  ),
          ),
        );
      }).toList(),
    ),
  );

  /// بطاقة الضغط على وقت الصلاة: تسجيل + تنبيه + تذكيرات مدمجة.
  Future<void> _showPrayerTapSheet(
    BuildContext context,
    PrayerMoment prayer,
    FaithSettings s, {
    Future<void> Function(FaithSettings)? onSaved,
    VoidCallback? onChanged,
  }) async {
    var current = s;
    await showHerSheet<void>(
      context,
      title: 'صلاة ${prayer.name} • ${faithFormatTime(prayer.time)}',
      child: StatefulBuilder(
        builder: (sheetContext, setSheet) => Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            HERPrimaryButton(
              label: 'سجّلها صليتها 🤍',
              icon: Icons.check_circle_rounded,
              onPressed: () async {
                final updated = await FaithRepository.instance.savePrayerStatus(
                  DateTime.now(),
                  prayer.key,
                  1,
                );
                final week = await FaithRepository.instance
                    .last7DaysPrayerCounts();
                final stats = await FaithRepository.instance.loadFaithStats();
                if (mounted) {
                  setState(() {
                    _prayerDay = updated;
                    _weekPrayers = week;
                    _faithStats = stats;
                  });
                  onChanged?.call();
                }
                await widget.onAchievement('صلاة ${prayer.name}');
                if (sheetContext.mounted) Navigator.pop(sheetContext);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        'بارك الله فيكَ 🤍 سُجّل إنجاز صلاة ${prayer.name} في يومكَ.',
                      ),
                    ),
                  );
                }
              },
            ),
            const SizedBox(height: 10),
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              activeTrackColor: faithPrayerSwitchStyle(context).trackSelected,
              activeThumbColor: faithPrayerSwitchStyle(context).thumbSelected,
              inactiveTrackColor: faithPrayerSwitchStyle(
                context,
              ).trackUnselected,
              inactiveThumbColor: faithPrayerSwitchStyle(
                context,
              ).thumbUnselected,
              trackOutlineColor: WidgetStatePropertyAll(
                faithPrayerSwitchStyle(context).border,
              ),
              title: Text(
                'تنبيه صلاة ${prayer.name}',
                style: faithText(context, 12.5, FontWeight.w800, roseInk),
              ),
              subtitle: Text(
                'الصوت يُفعّل من زر السماعة بجانب هذه الصلاة.',
                style: faithText(context, 10, FontWeight.w600, roseSub),
              ),
              value: current.enabledPrayers[prayer.key] ?? false,
              onChanged: (v) async {
                current = current.copyWith(
                  enabledPrayers: {...current.enabledPrayers, prayer.key: v},
                );
                setSheet(() {});
                await (onSaved ?? _save)(current);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _prayerNotificationsToggle(
    BuildContext context,
    FaithSettings settings, {
    Future<void> Function(FaithSettings)? onSaved,
  }) => HERCard(
    role: HERCardRole.wide,
    radius: 20,
    elevated: false,
    padding: EdgeInsets.zero,
    child: SwitchListTile.adaptive(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      secondary: const HERIconContainer(
        Icons.mosque_rounded,
        kind: HerIconKind.knowledge,
        size: 38,
        iconSize: 20,
      ),
      activeTrackColor: faithPrayerSwitchStyle(context).trackSelected,
      activeThumbColor: faithPrayerSwitchStyle(context).thumbSelected,
      inactiveTrackColor: faithPrayerSwitchStyle(context).trackUnselected,
      inactiveThumbColor: faithPrayerSwitchStyle(context).thumbUnselected,
      trackOutlineColor: WidgetStatePropertyAll(
        faithPrayerSwitchStyle(context).border,
      ),
      title: Text(
        'مواقيت الصلاة',
        style: faithText(context, 12.5, FontWeight.w900, roseInk),
      ),
      subtitle: Text(
        settings.prayerNotifications
            ? 'تنبيه عند أوقات الصلاة حسب موقعك المختار.'
            : 'فعّل التنبيهات والأذان حسب موقعك المختار.',
        style: faithText(context, 10, FontWeight.w600, roseSub),
      ),
      value: settings.prayerNotifications,
      onChanged: (enabled) async {
        final save = onSaved ?? _save;
        if (enabled) {
          final permitted = await PrayerNotificationService.instance
              .requestPermission();
          if (!permitted) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'يلزم السماح بالإشعارات لتشغيل تنبيهات الصلاة.',
                  ),
                ),
              );
            }
            return;
          }
        }
        await save(
          settings.copyWith(
            prayerNotifications: enabled,
            betweenPrayerReminders: enabled
                ? settings.betweenPrayerReminders
                : false,
          ),
        );
      },
    ),
  );

  /// Honest capability status: when prayer alerts are ON but the OS grants are
  /// missing, the toggles alone would promise an adhan that cannot sound
  /// (notifications off) or cannot arrive on time (exact alarms off). This
  /// row appears ONLY in the degraded case and offers a one-tap repair.
  /// Never prompts by itself — [grantStatus] only reads existing grants.
  Widget _grantStatusRow(
    BuildContext context,
    FaithSettings settings,
    Future<void> Function(FaithSettings) save,
  ) {
    return FutureBuilder<({bool notifications, bool exactAlarms})>(
      future: PrayerNotificationService.instance.grantStatus(),
      builder: (context, snapshot) {
        final status = snapshot.data;
        if (status == null) return const SizedBox.shrink();
        final noNotifications = !status.notifications;
        final noExact = !status.exactAlarms;
        if (!noNotifications && !noExact) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
          child: Row(
            children: [
              const Icon(Icons.warning_amber_rounded, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  noNotifications
                      ? 'إشعارات النظام متوقفة — لن يصل صوت الأذان.'
                      : 'إذن التنبيهات الدقيقة متوقف — قد يتأخر الأذان عن موعده.',
                  style: faithText(context, 10.5, FontWeight.w700, roseSub),
                ),
              ),
              TextButton(
                onPressed: () async {
                  await PrayerNotificationService.instance.requestPermission();
                  await save(settings);
                },
                child: const Text('إصلاح'),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Debug/QA-only schedule inventory (next prayer, pending alarms, grants).
  /// Never shown in release builds.
  Widget _debugScheduleInventory(BuildContext context, FaithSettings settings) {
    if (!kDebugMode) return const SizedBox.shrink();
    return FutureBuilder<Map<String, Object?>>(
      future: PrayerNotificationService.instance.scheduleInventory(settings),
      builder: (context, snapshot) {
        final data = snapshot.data;
        if (data == null) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.fromLTRB(14, 4, 14, 8),
          child: Text(
            'DEBUG: next=${data['nextPrayer']}@${data['nextPrayerAt']} '
            'pending=${data['pendingPrayerAlarms']} '
            'notif=${data['notificationsEnabled']} exact=${data['exactAlarms']}',
            style: faithText(context, 9, FontWeight.w500, roseSub),
            textDirection: TextDirection.ltr,
          ),
        );
      },
    );
  }

  /// Keep delivery preferences beside the prayer schedule itself.
  /// They previously lived behind the sound sheet, so users could enable a
  /// prayer alert without discovering whether it vibrates or plays audio.
  Widget _prayerAlertPreferences(
    BuildContext context,
    FaithSettings settings, {
    Future<void> Function(FaithSettings)? onSaved,
  }) {
    final save = onSaved ?? _save;
    final switches = faithPrayerSwitchStyle(context);
    return HERCard(
      role: HERCardRole.wide,
      radius: 20,
      elevated: false,
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          if (settings.prayerNotifications)
            _grantStatusRow(context, settings, save),
          _debugScheduleInventory(context, settings),
          SwitchListTile.adaptive(
            contentPadding: const EdgeInsets.symmetric(horizontal: 14),
            secondary: const HERIconContainer(
              Icons.volume_up_rounded,
              kind: HerIconKind.rose,
              size: 38,
              iconSize: 20,
            ),
            activeTrackColor: switches.trackSelected,
            activeThumbColor: switches.thumbSelected,
            inactiveTrackColor: switches.trackUnselected,
            inactiveThumbColor: switches.thumbUnselected,
            trackOutlineColor: WidgetStatePropertyAll(switches.border),
            title: Text(
              'تشغيل صوت الأذان',
              style: faithText(context, 12.5, FontWeight.w900, roseInk),
            ),
            subtitle: Text(
              settings.notificationOnly
                  ? 'التنبيهات تصل الآن بلا صوت.'
                  : 'يعمل الأذان للصلاة التي فُعّل زر السماعة بجانبها.',
              style: faithText(context, 10, FontWeight.w600, roseSub),
            ),
            value: !settings.notificationOnly,
            onChanged: settings.prayerNotifications
                ? (enabled) async {
                    if (!enabled) {
                      await save(settings.copyWith(notificationOnly: true));
                      return;
                    }
                    // Repair trap: legacy silent installs carry every
                    // per-prayer adhan as off, which would keep every real
                    // notification — and the test — silent behind an ON
                    // master switch. Restore all per-prayer adhans then.
                    await save(
                      PrayerNotificationService.withSoundEnabled(settings),
                    );
                  }
                : null,
          ),
          const Divider(height: 1),
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 14),
            leading: const HERIconContainer(
              Icons.notifications_active_rounded,
              kind: HerIconKind.knowledge,
              size: 38,
              iconSize: 20,
            ),
            title: Text(
              'اختيار صوت المؤذن',
              style: faithText(context, 12.5, FontWeight.w900, roseInk),
            ),
            subtitle: Text(
              adhanVoiceFor(settings.adhanVoice).name,
              style: faithText(context, 10, FontWeight.w600, roseSub),
            ),
            trailing: const Icon(Icons.chevron_left_rounded),
            onTap: () => _showAdhanSheet(context, settings, onSaved: save),
          ),
          if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android)
            ListTile(
              leading: const Icon(Icons.volume_up_rounded),
              title: const Text('اختبار تشغيل صوت الأذان'),
              subtitle: const Text('تشغيل مباشر للصوت مع فحص سبب الصمت'),
              onTap: () async {
                final service = PrayerNotificationService.instance;
                try {
                  final started = await service.playSoundTest(settings);
                  final device = await AdhanAudioProbe.readChannel(
                    PrayerNotificationService.adhanChannelIdFor(settings),
                  );
                  if (!context.mounted) return;
                  await showDialog<void>(
                    context: context,
                    builder: (dialogContext) => AlertDialog(
                      title: const Text('فحص صوت الأذان'),
                      content: SingleChildScrollView(
                        child: Text(
                          [
                            if (!started)
                              'تعذر بدء التشغيل. راجع تفعيل صوت الأذان والسماح بالإشعارات.',
                            ...?service.lastTestReport?.linesAr,
                            if (device?['soundReadable'] == false)
                              'ملف صوت قناة الإشعار غير متاح.',
                            if (device?['interruptionFilter'] != null &&
                                device?['interruptionFilter'] != 1)
                              'وضع عدم الإزعاج مفعّل؛ راجع السماح لتنبيهات الأذان.',
                            'ظهور الإشعار وحده لا يؤكد سماع الصوت.',
                          ].join('\n'),
                        ),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () {
                            AdhanPlaybackService.instance.stop();
                            Navigator.pop(dialogContext);
                          },
                          child: const Text('إيقاف وإغلاق'),
                        ),
                      ],
                    ),
                  );
                } catch (_) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('تعذر فحص الصوت. حاول تاني.'),
                      ),
                    );
                  }
                }
              },
            ),
          if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android)
            ListTile(
              leading: const Icon(Icons.settings_rounded),
              title: const Text('إعدادات صوت الأذان في الهاتف'),
              subtitle: const Text(
                'فتح قناة الأذان المستخدمة مباشرة؛ تأكدي أنها تنبيه بصوت',
              ),
              onTap: () async {
                try {
                  await AdhanAudioProbe.openChannelSettings(
                    PrayerNotificationService.adhanChannelIdFor(settings),
                  );
                } catch (_) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'افتح إعدادات الهاتف ← التطبيقات ← Morph TV ← الإشعارات.',
                        ),
                      ),
                    );
                  }
                }
              },
            ),
          if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android)
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 14),
              leading: const Icon(Icons.schedule_rounded),
              title: const Text('فحص الأذان في الخلفية'),
              subtitle: const Text(
                'تنبيه تجريبي بعد 20 ثانية بنفس طريقة أذان الموعد',
              ),
              onTap: () async {
                final messenger = ScaffoldMessenger.of(context);
                final service = PrayerNotificationService.instance;
                try {
                  final permitted = await service.requestPermission();
                  if (!permitted) {
                    messenger.showSnackBar(
                      const SnackBar(
                        content: Text(
                          'يلزم السماح بإشعارات التطبيق والتنبيهات الدقيقة لبدء الفحص.',
                        ),
                      ),
                    );
                    return;
                  }
                  final ok = await service.scheduleSoundCheck(settings);
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(
                        ok
                            ? 'الفحص اتحدد بعد 20 ثانية. ارجع للشاشة الرئيسية أو اقفل الشاشة وانتظر الأذان.'
                            : service.lastSoundCheckError ??
                                  'تعذر جدولة الفحص. حاول تاني.',
                      ),
                    ),
                  );
                } catch (_) {
                  messenger.showSnackBar(
                    const SnackBar(content: Text('تعذر بدء الفحص. حاول تاني.')),
                  );
                }
              },
            ),
          const Divider(height: 1),
          SwitchListTile.adaptive(
            contentPadding: const EdgeInsets.symmetric(horizontal: 14),
            secondary: const HERIconContainer(
              Icons.auto_awesome_rounded,
              kind: HerIconKind.rose,
              size: 38,
              iconSize: 20,
            ),
            activeTrackColor: switches.trackSelected,
            activeThumbColor: switches.thumbSelected,
            inactiveTrackColor: switches.trackUnselected,
            inactiveThumbColor: switches.thumbUnselected,
            trackOutlineColor: WidgetStatePropertyAll(switches.border),
            title: Text(
              'تنبيه صلِّ على النبي ﷺ',
              style: faithText(context, 12.5, FontWeight.w900, roseInk),
            ),
            subtitle: Text(
              'تذكير لطيف بعد الظهر؛ يعمل فقط مع تنبيهات العبادة.',
              style: faithText(context, 10, FontWeight.w600, roseSub),
            ),
            value: settings.salawatReminders,
            onChanged: settings.prayerNotifications
                ? (value) => save(settings.copyWith(salawatReminders: value))
                : null,
          ),
          const Divider(height: 1),
          SwitchListTile.adaptive(
            contentPadding: const EdgeInsets.symmetric(horizontal: 14),
            secondary: const HERIconContainer(
              Icons.vibration_rounded,
              kind: HerIconKind.rose,
              size: 38,
              iconSize: 20,
            ),
            activeTrackColor: switches.trackSelected,
            activeThumbColor: switches.thumbSelected,
            inactiveTrackColor: switches.trackUnselected,
            inactiveThumbColor: switches.thumbUnselected,
            trackOutlineColor: WidgetStatePropertyAll(switches.border),
            title: Text(
              'اهتزاز التنبيه',
              style: faithText(context, 12.5, FontWeight.w900, roseInk),
            ),
            subtitle: Text(
              'اهتزاز هادئ مع تنبيه الصلاة.',
              style: faithText(context, 10, FontWeight.w600, roseSub),
            ),
            value: settings.vibration,
            onChanged: settings.prayerNotifications
                ? (value) => save(settings.copyWith(vibration: value))
                : null,
          ),
        ],
      ),
    );
  }

  Widget _dailyFaith(BuildContext context) {
    final verses = _dashboardVerses;
    final date = DateUtils.dateOnly(DateTime.now());
    final ayah =
        verses[date.difference(DateTime(2026, 1, 1)).inDays % verses.length];
    return HERCard(
      role: HERCardRole.wide,
      radius: 20,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const AyahScreen()),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.menu_book_rounded, size: 15, color: roseIcon),
              const SizedBox(width: 5),
              Text(
                'آية اليوم • سورة ${ayah.surah} ${ayah.ayah}',
                style: faithText(context, 10.5, FontWeight.w800, roseIcon),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            ayah.text,
            textAlign: TextAlign.center,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.amiri(
              fontSize: 18,
              height: 1.75,
              fontWeight: FontWeight.w700,
              color: context.herPalette.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'اضغط لمزيد من الآيات والورد اليومي',
            style: faithText(
              context,
              9.5,
              FontWeight.w600,
              context.herPalette.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openSettings(FaithSettings settings) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PrayerSettingsScreen(
          settings: settings,
          onSaved: _save,
          onUseLocation: _useLocation,
        ),
      ),
    );
  }
}
