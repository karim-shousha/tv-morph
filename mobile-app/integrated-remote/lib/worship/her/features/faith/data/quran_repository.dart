import 'dart:convert';

import 'dart:async';

import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/data/local_account_repository.dart';

class QuranAyah {
  const QuranAyah({
    required this.surah,
    required this.ayah,
    required this.text,
  });

  final int surah;
  final int ayah;
  final String text;
}

class QuranPosition {
  const QuranPosition(this.surah, this.ayah);
  final int surah;
  final int ayah;
}

/// A local, read-only Uthmani Quran text. It never needs an internet
/// connection and is deliberately kept separate from user generated content.
class QuranRepository {
  QuranRepository._();
  static final instance = QuranRepository._();

  static const _lastPositionKey = 'morph_quran_last_position';
  static const _fontSizeKey = 'morph_quran_font_size';

  static const surahNames = <String>[
    'الفاتحة',
    'البقرة',
    'آل عمران',
    'النساء',
    'المائدة',
    'الأنعام',
    'الأعراف',
    'الأنفال',
    'التوبة',
    'يونس',
    'هود',
    'يوسف',
    'الرعد',
    'إبراهيم',
    'الحجر',
    'النحل',
    'الإسراء',
    'الكهف',
    'مريم',
    'طه',
    'الأنبياء',
    'الحج',
    'المؤمنون',
    'النور',
    'الفرقان',
    'الشعراء',
    'النمل',
    'القصص',
    'العنكبوت',
    'الروم',
    'لقمان',
    'السجدة',
    'الأحزاب',
    'سبأ',
    'فاطر',
    'يس',
    'الصافات',
    'ص',
    'الزمر',
    'غافر',
    'فصلت',
    'الشورى',
    'الزخرف',
    'الدخان',
    'الجاثية',
    'الأحقاف',
    'محمد',
    'الفتح',
    'الحجرات',
    'ق',
    'الذاريات',
    'الطور',
    'النجم',
    'القمر',
    'الرحمن',
    'الواقعة',
    'الحديد',
    'المجادلة',
    'الحشر',
    'الممتحنة',
    'الصف',
    'الجمعة',
    'المنافقون',
    'التغابن',
    'الطلاق',
    'التحريم',
    'الملك',
    'القلم',
    'الحاقة',
    'المعارج',
    'نوح',
    'الجن',
    'المزمل',
    'المدثر',
    'القيامة',
    'الإنسان',
    'المرسلات',
    'النبأ',
    'النازعات',
    'عبس',
    'التكوير',
    'الانفطار',
    'المطففين',
    'الانشقاق',
    'البروج',
    'الطارق',
    'الأعلى',
    'الغاشية',
    'الفجر',
    'البلد',
    'الشمس',
    'الليل',
    'الضحى',
    'الشرح',
    'التين',
    'العلق',
    'القدر',
    'البينة',
    'الزلزلة',
    'العاديات',
    'القارعة',
    'التكاثر',
    'العصر',
    'الهمزة',
    'الفيل',
    'قريش',
    'الماعون',
    'الكوثر',
    'الكافرون',
    'النصر',
    'المسد',
    'الإخلاص',
    'الفلق',
    'الناس',
  ];

  static const ayahCounts = <int>[
    7,
    286,
    200,
    176,
    120,
    165,
    206,
    75,
    129,
    109,
    123,
    111,
    43,
    52,
    99,
    128,
    111,
    110,
    98,
    135,
    112,
    78,
    118,
    64,
    77,
    227,
    93,
    88,
    69,
    60,
    34,
    30,
    73,
    54,
    45,
    83,
    182,
    88,
    75,
    85,
    54,
    53,
    89,
    59,
    37,
    35,
    38,
    29,
    18,
    45,
    60,
    49,
    62,
    55,
    78,
    96,
    29,
    22,
    24,
    13,
    14,
    11,
    11,
    18,
    12,
    12,
    30,
    52,
    52,
    44,
    28,
    28,
    20,
    56,
    40,
    31,
    50,
    40,
    46,
    42,
    29,
    19,
    36,
    25,
    22,
    17,
    19,
    26,
    30,
    20,
    15,
    21,
    11,
    8,
    8,
    19,
    5,
    8,
    8,
    11,
    11,
    8,
    3,
    9,
    5,
    4,
    7,
    3,
    6,
    3,
    5,
    4,
    5,
    6,
  ];

  List<QuranAyah>? _cached;

  Future<List<QuranAyah>> load() async {
    if (_cached != null) return _cached!;
    final text = await rootBundle.loadString('assets/data/quran-uthmani.txt');
    final lines = const LineSplitter()
        .convert(text)
        .where((line) => line.trim().isNotEmpty)
        .toList();
    if (lines.length != 6236) {
      throw StateError('ملف المصحف غير مكتمل.');
    }
    final ayat = <QuranAyah>[];
    var offset = 0;
    for (var surah = 1; surah <= ayahCounts.length; surah++) {
      for (var ayah = 1; ayah <= ayahCounts[surah - 1]; ayah++) {
        ayat.add(QuranAyah(surah: surah, ayah: ayah, text: lines[offset++]));
      }
    }
    return _cached = ayat;
  }

  int offsetForSurah(int surah) =>
      ayahCounts.take(surah - 1).fold(0, (total, count) => total + count);

  Future<QuranPosition?> loadLastPosition() async {
    // Tolerant: a legacy wrong-typed value means "no resume position",
    // never a Faith failure. The stored value is left untouched.
    Object? value;
    try {
      value = (await SharedPreferences.getInstance()).get(_lastPositionKey);
    } catch (_) {
      return null;
    }
    if (value is! String) return null;
    final parts = value.split(':');
    if (parts.length != 2) return null;
    final surah = int.tryParse(parts[0]);
    final ayah = int.tryParse(parts[1]);
    if (surah == null ||
        ayah == null ||
        surah < 1 ||
        surah > 114 ||
        ayah < 1 ||
        ayah > ayahCounts[surah - 1]) {
      return null;
    }
    return QuranPosition(surah, ayah);
  }

  Future<void> saveLastPosition(QuranPosition position) async {
    await (await SharedPreferences.getInstance()).setString(
      _lastPositionKey,
      '${position.surah}:${position.ayah}',
    );
    unawaited(LocalAccountRepository.instance.syncCurrentData());
  }

  /// Tolerant read: very old installs stored this as int, which makes
  /// getDouble throw and used to hang the reader on a spinner forever.
  Future<double> loadFontSize() async {
    Object? value;
    try {
      value = (await SharedPreferences.getInstance()).get(_fontSizeKey);
    } catch (_) {
      return 25;
    }
    if (value is double) return value;
    if (value is int) return value.toDouble();
    return 25;
  }

  Future<void> saveFontSize(double value) async {
    await (await SharedPreferences.getInstance()).setDouble(
      _fontSizeKey,
      value,
    );
  }

  static String normalize(String value) => value
      .replaceAll(RegExp(r'[\u064B-\u065F\u0670]'), '')
      .replaceAll('ٱ', 'ا')
      .replaceAll('أ', 'ا')
      .replaceAll('إ', 'ا')
      .replaceAll('آ', 'ا')
      .replaceAll('ى', 'ي')
      .replaceAll('ة', 'ه')
      .replaceAll('ـ', '')
      .trim();

  /// The Tanzil source keeps the opening basmala together with the first
  /// ayah for the surahs that begin with it.  In the common Hafs numbering
  /// used by this reader it is numbered only in Al-Fatihah; elsewhere it is
  /// an unnumbered opening line and the remaining text is still ayah 1.
  static String withoutOpeningBasmala(String value) => value.replaceFirst(
    RegExp(r'^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*'),
    '',
  );
}
