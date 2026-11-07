import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;

import '../../../core/theme/her_theme_data.dart';
import '../../../core/widgets/app_page_header.dart';
import '../../../core/widgets/her_components.dart';
import '../data/quran_repository.dart';
import 'widgets/faith_shared.dart';

/// A live, verse-by-verse reader. Content stays at its maintained source
/// instead of being copied into the application or a HER server.
class TafsirReaderScreen extends StatefulWidget {
  const TafsirReaderScreen({
    super.key,
    required this.book,
    this.initialSurah,
    this.initialAyah,
  });

  final TafsirBook book;
  final int? initialSurah;
  final int? initialAyah;

  @override
  State<TafsirReaderScreen> createState() => _TafsirReaderScreenState();
}

class TafsirBook {
  const TafsirBook({
    required this.id,
    required this.title,
    required this.source,
    required this.kind,
  });

  final int id;
  final String title;
  final String source;
  final HerIconKind kind;
}

class _TafsirReaderScreenState extends State<TafsirReaderScreen> {
  static const _baseUrl = 'https://api.quranpedia.net/v1';
  late int _surah;
  late int _ayah;
  String? _text;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _surah = (widget.initialSurah ?? 1).clamp(
      1,
      QuranRepository.surahNames.length,
    );
    _ayah = (widget.initialAyah ?? 1).clamp(
      1,
      QuranRepository.ayahCounts[_surah - 1],
    );
    _loadTafsir();
  }

  Future<void> _loadTafsir() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/ayah/$_surah/$_ayah/book/${widget.book.id}'),
          )
          .timeout(const Duration(seconds: 12));
      if (response.statusCode != 200) throw StateError('تعذّر جلب التفسير');
      final data = jsonDecode(utf8.decode(response.bodyBytes)) as Map;
      final content = (data['content'] as List? ?? const [])
          .whereType<Map>()
          .map((entry) => '${entry['text'] ?? ''}')
          .where((text) => text.trim().isNotEmpty)
          .join('\n\n');
      if (content.trim().isEmpty) throw StateError('لا يوجد نص لهذه الآية');
      if (!mounted) return;
      setState(() => _text = _plainText(content));
    } catch (_) {
      if (!mounted) return;
      setState(
        () => _error =
            'تعذّر تحميل التفسير الآن. تحقّق من الإنترنت ثم أعد المحاولة.',
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _plainText(String value) => value
      .replaceAll(RegExp(r'<br\\s*/?>', caseSensitive: false), '\n')
      .replaceAll(RegExp(r'</p\\s*>', caseSensitive: false), '\n')
      .replaceAll(RegExp(r'<[^>]*>'), '')
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&quot;', '"')
      .replaceAll('&amp;', '&')
      .replaceAll(RegExp(r'\n{3,}'), '\n\n')
      .trim();

  Future<void> _setSurah(int value) async {
    setState(() {
      _surah = value;
      _ayah = 1;
    });
    await _loadTafsir();
  }

  Future<void> _moveAyah(int delta) async {
    final max = QuranRepository.ayahCounts[_surah - 1];
    final next = _ayah + delta;
    if (next < 1 || next > max) return;
    setState(() => _ayah = next);
    await _loadTafsir();
  }

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    final controlsDecoration = herRoleCardDecoration(
      theme,
      HERCardRole.content,
    );
    final controlsInk = herForegroundOnDecoration(
      theme,
      controlsDecoration,
      configured: theme.headingPrimary,
    );
    final mutedInk = herForegroundOnDecoration(
      theme,
      controlsDecoration,
      configured: theme.bodySecondary,
    );
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              AppPageHeader(
                  logoOnly: true,
                title: widget.book.title,
                subtitle: '${widget.book.source} • تفسير آية بآية',
                onBack: () => Navigator.maybePop(context),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 32),
                  children: [
                    HERCard(
                      role: HERCardRole.content,
                      radius: 20,
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              HERIconContainer(
                                Icons.auto_stories_rounded,
                                kind: widget.book.kind,
                                size: 40,
                                iconSize: 20,
                              ),
                              const SizedBox(width: 9),
                              Expanded(
                                child: Text(
                                  'اختار موضع القراءة',
                                  style: faithText(
                                    context,
                                    12,
                                    FontWeight.w900,
                                  ),
                                ),
                              ),
                              HERBadge('مصدر موثوق', kind: widget.book.kind),
                            ],
                          ),
                          const SizedBox(height: 10),
                          DropdownButtonFormField<int>(
                            initialValue: _surah,
                            isExpanded: true,
                            decoration: InputDecoration(
                              labelText: 'السورة',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                            ),
                            items: List.generate(
                              QuranRepository.surahNames.length,
                              (index) => DropdownMenuItem(
                                value: index + 1,
                                child: Text(
                                  '${index + 1}. ${QuranRepository.surahNames[index]}',
                                ),
                              ),
                            ),
                            onChanged: (value) {
                              if (value != null && value != _surah) {
                                _setSurah(value);
                              }
                            },
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              IconButton(
                                tooltip: 'الآية السابقة',
                                color: controlsInk,
                                disabledColor: mutedInk,
                                onPressed: _ayah > 1
                                    ? () => _moveAyah(-1)
                                    : null,
                                icon: const Icon(Icons.arrow_forward_rounded),
                              ),
                              Expanded(
                                child: Text(
                                  'الآية $_ayah من ${QuranRepository.ayahCounts[_surah - 1]}',
                                  textAlign: TextAlign.center,
                                  style: faithText(
                                    context,
                                    12,
                                    FontWeight.w900,
                                    controlsInk,
                                  ),
                                ),
                              ),
                              IconButton(
                                tooltip: 'الآية التالية',
                                color: controlsInk,
                                disabledColor: mutedInk,
                                onPressed:
                                    _ayah <
                                        QuranRepository.ayahCounts[_surah - 1]
                                    ? () => _moveAyah(1)
                                    : null,
                                icon: const Icon(Icons.arrow_back_rounded),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    FutureBuilder<List<QuranAyah>>(
                      future: QuranRepository.instance.load(),
                      builder: (context, snapshot) {
                        final index =
                            QuranRepository.instance.offsetForSurah(_surah) +
                            _ayah -
                            1;
                        final ayah = snapshot.data != null
                            ? snapshot.data![index]
                            : null;
                        if (ayah == null) return const SizedBox.shrink();
                        return HERCard(
                          role: HERCardRole.wide,
                          radius: 20,
                          padding: const EdgeInsets.all(14),
                          child: Text(
                            ayah.text,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.amiri(
                              fontSize: 25,
                              height: 1.95,
                              fontWeight: FontWeight.w700,
                              color: theme.bodyPrimary,
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 10),
                    HERCard(
                      role: HERCardRole.content,
                      radius: 20,
                      padding: const EdgeInsets.all(15),
                      child: _loading
                          ? const SizedBox(
                              height: 140,
                              child: Center(child: CircularProgressIndicator()),
                            )
                          : _error != null
                          ? Column(
                              children: [
                                Text(
                                  _error!,
                                  textAlign: TextAlign.center,
                                  style: faithText(
                                    context,
                                    11,
                                    FontWeight.w700,
                                    theme.bodySecondary,
                                  ),
                                ),
                                const SizedBox(height: 9),
                                HERPillButton(
                                  label: 'إعادة المحاولة',
                                  icon: Icons.refresh_rounded,
                                  onPressed: _loadTafsir,
                                ),
                              ],
                            )
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'التفسير',
                                  style: faithText(
                                    context,
                                    13,
                                    FontWeight.w900,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                SelectableText(
                                  _text ?? '',
                                  textAlign: TextAlign.right,
                                  style: PhoneDesignTokens.uiText(
                                    fontSize: 13,
                                    height: 2,
                                    fontWeight: FontWeight.w600,
                                    color: theme.bodyPrimary,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'المصدر: ${widget.book.source} عبر الموسوعة القرآنية.',
                                  style: faithText(
                                    context,
                                    9,
                                    FontWeight.w600,
                                    theme.bodySecondary,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
