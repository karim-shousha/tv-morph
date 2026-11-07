import 'package:adhan_dart/adhan_dart.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;
import 'faith_repository.dart';

class PrayerMoment {
  const PrayerMoment(
    this.key,
    this.name,
    this.time,
    this.icon, {
    this.optional = false,
  });
  final String key, name;
  final DateTime time;
  final String icon;
  final bool optional;
}

class PrayerSchedule {
  const PrayerSchedule({
    required this.today,
    required this.tomorrow,
    required this.zone,
  });
  final List<PrayerMoment> today, tomorrow;
  final tz.Location zone;
  PrayerMoment nextAt(DateTime now) {
    for (final item in today.where((item) => !item.optional)) {
      if (item.time.isAfter(now)) return item;
    }
    return tomorrow.firstWhere((item) => item.key == 'fajr');
  }
}

/// Offline calculation using Adhan Dart's MIT-licensed astronomical engine.
/// The schedule is calculated per calendar day, never as a repeating clock time.
class PrayerCalculationService {
  PrayerCalculationService._();
  static final instance = PrayerCalculationService._();
  bool _initialized = false;

  PrayerSchedule calculate(FaithSettings settings, {DateTime? now}) {
    if (!_initialized) {
      tz_data.initializeTimeZones();
      _initialized = true;
    }
    tz.Location zone;
    try {
      zone = tz.getLocation(settings.timezone);
    } catch (_) {
      zone = tz.local;
    }
    final localNow = tz.TZDateTime.from(now ?? DateTime.now(), zone);
    return PrayerSchedule(
      today: _forDate(
        settings,
        DateTime(localNow.year, localNow.month, localNow.day),
        zone,
      ),
      tomorrow: _forDate(
        settings,
        DateTime(localNow.year, localNow.month, localNow.day + 1),
        zone,
      ),
      zone: zone,
    );
  }

  List<PrayerMoment> _forDate(
    FaithSettings settings,
    DateTime date,
    tz.Location zone,
  ) {
    final params = _parameters(settings)
      ..madhab = settings.hanafi ? Madhab.hanafi : Madhab.shafi;
    final manual = settings.adjustments;
    params.adjustments = {
      Prayer.fajr: manual['fajr'] ?? 0,
      Prayer.dhuhr: manual['dhuhr'] ?? 0,
      Prayer.asr: manual['asr'] ?? 0,
      Prayer.maghrib: manual['maghrib'] ?? 0,
      Prayer.isha: manual['isha'] ?? 0,
    };
    final times = PrayerTimes(
      // Adhan walks neighbouring dates with 24-hour durations. A device-local
      // midnight can repeat a calendar date when the phone exits DST, even
      // when the selected prayer city uses another timezone. Use a UTC civil
      // date for astronomy, then convert the resulting instants to the city.
      date: DateTime.utc(date.year, date.month, date.day),
      coordinates: Coordinates(settings.latitude, settings.longitude),
      calculationParameters: params,
      // Use the same minute for the displayed time and the scheduled adhan.
      // Keeping hidden seconds made a displayed 14:45 ring at 14:45:53.
      precision: false,
    );
    DateTime local(DateTime value) => tz.TZDateTime.from(value, zone);
    return [
      PrayerMoment('fajr', 'الفجر', local(times.fajr), '🌅'),
      PrayerMoment(
        'sunrise',
        'الشروق',
        local(times.sunrise),
        '☀️',
        optional: true,
      ),
      PrayerMoment('dhuhr', 'الظهر', local(times.dhuhr), '☀️'),
      PrayerMoment('asr', 'العصر', local(times.asr), '🌤️'),
      PrayerMoment('maghrib', 'المغرب', local(times.maghrib), '🌙'),
      PrayerMoment('isha', 'العشاء', local(times.isha), '🌌'),
    ];
  }

  CalculationParameters _parameters(FaithSettings s) =>
      switch (s.calculationMethod) {
        'isna' => CalculationMethodParameters.northAmerica(),
        'egyptian' => CalculationMethodParameters.egyptian(),
        'umm_al_qura' => CalculationMethodParameters.ummAlQura(),
        'karachi' => CalculationMethodParameters.karachi(),
        'dubai' => CalculationMethodParameters.dubai(),
        'kuwait' => CalculationMethodParameters.kuwait(),
        'qatar' => CalculationMethodParameters.qatar(),
        'singapore' => CalculationMethodParameters.singapore(),
        'turkiye' => CalculationMethodParameters.turkiye(),
        'moonsighting' => CalculationMethodParameters.moonsightingCommittee(),
        _ => CalculationMethodParameters.muslimWorldLeague(),
      };

  double qiblaBearing(FaithSettings settings) =>
      Qibla.qibla(Coordinates(settings.latitude, settings.longitude));

  String suggestedMethodFor(FaithSettings settings) {
    final tzName = settings.timezone;
    if (tzName.startsWith('Africa/Cairo')) return 'egyptian';
    if (tzName.startsWith('Asia/Riyadh') || tzName.startsWith('Asia/Makkah')) {
      return 'umm_al_qura';
    }
    if (tzName.startsWith('Asia/Dubai')) return 'dubai';
    if (tzName.startsWith('Asia/Kuwait')) return 'kuwait';
    if (tzName.startsWith('Asia/Qatar')) return 'qatar';
    if (tzName.startsWith('Asia/Singapore')) return 'singapore';
    if (tzName.startsWith('America/') || tzName.startsWith('Europe/London')) {
      return 'moonsighting';
    }
    return 'mwl';
  }
}

const calculationMethods = <String, String>{
  'mwl': 'رابطة العالم الإسلامي',
  'isna': 'ISNA — أمريكا الشمالية',
  'egyptian': 'الهيئة المصرية العامة للمساحة',
  'umm_al_qura': 'أم القرى — مكة',
  'karachi': 'جامعة العلوم الإسلامية — كراتشي',
  'dubai': 'دبي',
  'kuwait': 'الكويت',
  'qatar': 'قطر',
  'singapore': 'سنغافورة',
  'turkiye': 'تركيا — ديانت',
  'moonsighting': 'لجنة تحرّي الهلال',
};

class ManualCity {
  const ManualCity(
    this.country,
    this.city,
    this.latitude,
    this.longitude,
    this.timezone,
  );
  final String country, city, timezone;
  final double latitude, longitude;
  String get label => country.trim().isEmpty ? city : '$city، $country';

  factory ManualCity.fromGeocoded({
    required String label,
    required double latitude,
    required double longitude,
    required String deviceTimezone,
    String? countryCode,
  }) => ManualCity(
    '',
    label,
    latitude,
    longitude,
    // A manually searched Egyptian city must use Egypt's DST rules, even
    // when the phone uses another timezone. Country comes from the geocoder,
    // never from the user's spelling or a guessed geographic rectangle.
    countryCode?.toUpperCase() == 'EG' ? 'Africa/Cairo' : deviceTimezone,
  );
}

const manualCities = <ManualCity>[
  ManualCity('كندا', 'مونتريال', 45.5017, -73.5673, 'America/Toronto'),
  ManualCity('مصر', 'القاهرة', 30.0444, 31.2357, 'Africa/Cairo'),
  ManualCity('مصر', 'الجيزة', 30.0131, 31.2089, 'Africa/Cairo'),
  ManualCity('مصر', 'الإسكندرية', 31.2001, 29.9187, 'Africa/Cairo'),
  ManualCity('مصر', 'المنصورة', 31.0409, 31.3785, 'Africa/Cairo'),
  ManualCity('مصر', 'الإسماعيلية', 30.5965, 32.2715, 'Africa/Cairo'),
  ManualCity('مصر', 'الغردقة', 27.2579, 33.8116, 'Africa/Cairo'),
  ManualCity('مصر', 'الأقصر', 25.6872, 32.6396, 'Africa/Cairo'),
  ManualCity('مصر', 'أسوان', 24.0889, 32.8998, 'Africa/Cairo'),
  ManualCity('السعودية', 'مكة المكرمة', 21.3891, 39.8579, 'Asia/Riyadh'),
  ManualCity('الإمارات', 'دبي', 25.2048, 55.2708, 'Asia/Dubai'),
  ManualCity('الكويت', 'مدينة الكويت', 29.3759, 47.9774, 'Asia/Kuwait'),
  ManualCity('قطر', 'الدوحة', 25.2854, 51.5310, 'Asia/Qatar'),
  ManualCity(
    'الولايات المتحدة',
    'نيويورك',
    40.7128,
    -74.0060,
    'America/New_York',
  ),
  ManualCity('المملكة المتحدة', 'لندن', 51.5072, -0.1276, 'Europe/London'),
  ManualCity('فرنسا', 'باريس', 48.8566, 2.3522, 'Europe/Paris'),
  ManualCity('ألمانيا', 'برلين', 52.5200, 13.4050, 'Europe/Berlin'),
];
