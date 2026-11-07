import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class QuranReciter {
  const QuranReciter(this.id, this.name);
  final String id;
  final String name;
}

/// Per-surah audio from Islamic Network and MP3Quran.
/// Nothing is bundled with the app: audio streams by default and downloads
/// only when the user explicitly asks, into app-private storage.
const quranReciters = <QuranReciter>[
  QuranReciter('ar.alafasy', 'مشاري راشد العفاسي'),
  QuranReciter('ar.ahmedajamy', 'أحمد بن علي العجمي'),
];

String quranReciterName(String id) => quranReciters
    .firstWhere(
      (reciter) => reciter.id == id,
      orElse: () => quranReciters.first,
    )
    .name;

class QuranAudioRepository {
  QuranAudioRepository._({
    Future<Directory> Function()? directory,
    http.Client Function()? client,
  }) : _directory = directory ?? getApplicationDocumentsDirectory,
       _client = client ?? http.Client.new;
  factory QuranAudioRepository.forTesting({
    required Future<Directory> Function() directory,
    http.Client Function()? client,
  }) => QuranAudioRepository._(directory: directory, client: client);
  final Future<Directory> Function() _directory;
  final http.Client Function() _client;
  static final instance = QuranAudioRepository._();

  static const _reciterKey = 'morph_quran_reciter';

  String surahUrl(int surah, String reciter) {
    if (reciter == 'ar.ahmedajamy') {
      return 'https://cdn.mp3quran.net/audio/ahmad-ajmi/r1/${surah.toString().padLeft(3, '0')}.mp3';
    }
    return 'https://cdn.islamic.network/quran/audio-surah/128/$reciter/$surah.mp3';
  }

  Future<String> loadReciter() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_reciterKey);
    if (saved != null && quranReciters.any((reciter) => reciter.id == saved)) {
      return saved;
    }
    return quranReciters.first.id;
  }

  Future<void> saveReciter(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_reciterKey, id);
  }

  Future<Directory> _audioDir(String reciter) async {
    final base = await _directory();
    final dir = Directory('${base.path}/quran_audio/$reciter');
    if (!await dir.exists()) await dir.create(recursive: true);
    return dir;
  }

  Future<File> localFile(int surah, String reciter) async {
    final dir = await _audioDir(reciter);
    return File('${dir.path}/$surah.mp3');
  }

  Future<bool> isDownloaded(int surah, String reciter) async {
    // Storage can be temporarily unavailable while a device is starting or a
    // platform implementation fails. Treat that as "not downloaded" so the
    // reader stays usable instead of surfacing an uncaught platform error.
    try {
      final file = await localFile(surah, reciter);
      return await file.exists() && await file.length() > 0;
    } catch (_) {
      return false;
    }
  }

  Future<double> downloadedMegabytes(int surah, String reciter) async {
    try {
      final file = await localFile(surah, reciter);
      if (!await file.exists()) return 0;
      return await file.length() / (1024 * 1024);
    } catch (_) {
      return 0;
    }
  }

  /// Downloads one surah, yielding 0..1 progress. Streams to a `.part` file
  /// first so an interrupted download never looks like a complete surah.
  Stream<double> download(int surah, String reciter) async* {
    final client = _client();
    File? partial;
    try {
      final request = http.Request('GET', Uri.parse(surahUrl(surah, reciter)));
      final response = await client
          .send(request)
          .timeout(const Duration(seconds: 30));
      if (response.statusCode != 200) {
        throw StateError('تعذر تحميل الصوت (${response.statusCode}).');
      }
      final total = response.contentLength ?? 0;
      final dir = await _audioDir(reciter);
      final target = File('${dir.path}/$surah.mp3');
      final tmp = File('${dir.path}/$surah.part');
      partial = tmp;
      final sink = tmp.openWrite();
      var received = 0;
      try {
        await for (final chunk in response.stream.timeout(
          const Duration(seconds: 30),
        )) {
          received += chunk.length;
          sink.add(chunk);
          yield total > 0 ? (received / total).clamp(0.0, 1.0) : 0;
        }
      } finally {
        await sink.close();
      }
      if (received == 0 || (total > 0 && received != total)) {
        throw StateError('تعذر إكمال تحميل السورة.');
      }
      await tmp.rename(target.path);
      yield 1;
    } finally {
      client.close();
      if (partial != null && await partial.exists()) await partial.delete();
    }
  }

  Future<void> delete(int surah, String reciter) async {
    try {
      final dir = await _audioDir(reciter);
      final file = File('${dir.path}/$surah.mp3');
      if (await file.exists()) await file.delete();
      // An interrupted download leaves `$surah.part` behind; clear it too.
      final tmp = File('${dir.path}/$surah.part');
      if (await tmp.exists()) await tmp.delete();
    } catch (_) {
      // A missing file is already the desired end state.
    }
  }
}
