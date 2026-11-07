import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import '../../../core/widgets/theme_backdrop.dart';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/her_theme_data.dart';
import '../../../core/widgets/app_page_header.dart';
import '../../../core/widgets/her_components.dart';
import '../data/quran_repository.dart';
import 'widgets/quran_reading_screen.dart';
import 'widgets/quran_theme.dart';

export 'widgets/quran_reading_screen.dart';

class QuranReaderScreen extends StatefulWidget {
  const QuranReaderScreen({super.key, this.initialSurah, this.initialAyah});
  final int? initialSurah;
  final int? initialAyah;

  @override
  State<QuranReaderScreen> createState() => _QuranReaderScreenState();
}

class _QuranReaderScreenState extends State<QuranReaderScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this);
  final _search = TextEditingController();
  List<QuranAyah> _ayat = const [];
  QuranPosition? _lastPosition;
  String _query = '';
  String? _loadError;

  @override
  void initState() {
    super.initState();
    _load();
    _search.addListener(() => setState(() => _query = _search.text));
  }

  Future<void> _load() async {
    setState(() => _loadError = null);
    try {
      final results = await Future.wait<dynamic>([
        QuranRepository.instance.load(),
        QuranRepository.instance.loadLastPosition(),
      ]);
      if (mounted) {
        setState(() {
          _ayat = results[0] as List<QuranAyah>;
          _lastPosition = results[1] as QuranPosition?;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loadError = 'تعذر تحميل المصحف. تحقّق من المساحة وحاول مجددًا.');
      }
    }
  }

  @override
  void dispose() {
    _tabs.dispose();
    _search.dispose();
    super.dispose();
  }

  void _open(int surah, {int? ayah}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => QuranReadingScreen(surah: surah, initialAyah: ayah),
      ),
    ).then((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    final normalized = QuranRepository.normalize(_query);
    final matches = normalized.isEmpty
        ? const <QuranAyah>[]
        : _ayat
              .where(
                (ayah) =>
                    QuranRepository.normalize(ayah.text).contains(normalized),
              )
              .take(60)
              .toList();
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              AppPageHeader(
                  logoOnly: true,
                title: 'القرآن الكريم',
                subtitle: 'تلاوة وتدبر في كل وقت',
                onBack: () => Navigator.maybePop(context),
              ),
              TabBar(
                controller: _tabs,
                indicatorColor: quranDeepRose,
                labelColor: quranDeepRose,
                unselectedLabelColor:
                    context.herTheme.tabStyle.unselectedForeground,
                labelStyle: PhoneDesignTokens.uiText(fontWeight: FontWeight.w900),
                tabs: const [
                  Tab(text: 'السور'),
                  Tab(text: 'الأجزاء'),
                ],
              ),
              Expanded(
                child: _loadError != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(28),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.menu_book_rounded,
                                size: 44,
                                color: quranDeepRose,
                              ),
                              const SizedBox(height: 10),
                              Text(
                                _loadError!,
                                textAlign: TextAlign.center,
                                style: PhoneDesignTokens.uiText(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: context.herTheme.bodySecondary,
                                ),
                              ),
                              const SizedBox(height: 12),
                              HERPillButton(
                                label: 'إعادة المحاولة',
                                onPressed: _load,
                              ),
                            ],
                          ),
                        ),
                      )
                    : _ayat.isEmpty
                    ? Center(
                        child: CircularProgressIndicator(
                          color: quranDeepRose,
                        ),
                      )
                    : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(18, 10, 18, 6),
                    child: SizedBox(
                      height: 42,
                      child: ThemeRoleBackdrop(role: 'searchField', radius: 20, child: TextField(
                        controller: _search,
                        textDirection: TextDirection.rtl,
                        style: PhoneDesignTokens.uiText(fontSize: 12),
                        decoration: herSearchInputDecorationFor(
                          context.herTheme,
                          'ابحث في آيات القرآن',
                          icon: Icons.search_rounded,
                        ).copyWith(
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                      )),
                    ),
                  ),
                  if (_lastPosition != null && _query.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 4,
                      ),
                      child: HERListCard(
                        title:
                            'متابعة القراءة: ${QuranRepository.surahNames[_lastPosition!.surah - 1]} • آية ${_lastPosition!.ayah}',
                        icon: Icons.bookmark_rounded,
                        iconKind: HerIconKind.rose,
                        trailing: const Icon(
                          Icons.arrow_back_ios_new_rounded,
                          size: 15,
                        ),
                        onTap: () => _open(
                          _lastPosition!.surah,
                          ayah: _lastPosition!.ayah,
                        ),
                      ),
                    ),
                  Expanded(
                    child: _query.isNotEmpty
                        ? _searchResults(matches)
                        : TabBarView(
                            controller: _tabs,
                            children: [_surahList(), _juzList()],
                          ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(18, 0, 18, 0),
                    child: SafeArea(
                      top: false,
                      minimum: const EdgeInsets.only(bottom: 18),
                      child: Text(
                        'النص العثماني: Tanzil.net • يُعرض كما هو دون تعديل',
                        style: PhoneDesignTokens.uiText(
                          fontSize: 9.5,
                          color: context.herTheme.bodySecondary,
                        ),
                        textAlign: TextAlign.center,
                      ),
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

  Widget _surahList() => ListView.separated(
    padding: const EdgeInsets.fromLTRB(18, 8, 18, 28),
    itemCount: 114,
    separatorBuilder: (_, _) => const SizedBox(height: 8),
    itemBuilder: (context, index) {
      final surah = index + 1;
      return _libraryTile(
        leading: '$surah',
        title: QuranRepository.surahNames[index],
        subtitle: '${QuranRepository.ayahCounts[index]} آية',
        onTap: () => _open(surah),
        highlighted: _lastPosition?.surah == surah,
      );
    },
  );

  Widget _searchResults(List<QuranAyah> matches) {
    if (matches.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 28),
          child: Text(
            'لم نجد آيات مطابقة للبحث.',
            style: PhoneDesignTokens.uiText(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: context.herTheme.bodySecondary,
            ),
          ),
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(18, 8, 18, 24),
      itemCount: matches.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final ayah = matches[index];
        return _libraryTile(
          leading: '${ayah.ayah}',
          title: ayah.text,
          subtitle:
              '${QuranRepository.surahNames[ayah.surah - 1]} • آية ${ayah.ayah}',
          onTap: () => _open(ayah.surah, ayah: ayah.ayah),
          arabic: true,
        );
      },
    );
  }

  Widget _juzList() {
    const starts = <(int, int)>[
      (1, 1),
      (2, 142),
      (2, 253),
      (3, 93),
      (4, 24),
      (4, 148),
      (5, 82),
      (6, 111),
      (7, 88),
      (8, 41),
      (9, 93),
      (11, 6),
      (12, 53),
      (15, 1),
      (17, 1),
      (18, 75),
      (21, 1),
      (23, 1),
      (25, 21),
      (27, 56),
      (29, 46),
      (33, 31),
      (36, 28),
      (39, 32),
      (41, 47),
      (46, 1),
      (51, 31),
      (58, 1),
      (67, 1),
      (78, 1),
    ];
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(18, 8, 18, 28),
      itemCount: starts.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final start = starts[index];
        return _libraryTile(
          leading: '${index + 1}',
          title: 'الجزء ${index + 1}',
          subtitle:
              'يبدأ من ${QuranRepository.surahNames[start.$1 - 1]} • آية ${start.$2}',
          onTap: () => _open(start.$1, ayah: start.$2),
        );
      },
    );
  }

  /// Surah row — unified pink HERCard + rose number badge + white numeral.
  Widget _libraryTile({
    required String leading,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool arabic = false,
    bool highlighted = false,
  }) {
    final theme = context.herTheme;
    // Phase 1: structural list row (reads `structure.listRow`, never
    // Cards>Wide). Kind wash stays explicit; isolation is the point.
    // No tint: the row family owns surface/opacity/border centrally.
    return HERListRow(
      radius: 18,
      padding: EdgeInsets.zero,
      onTap: onTap,
      child: ListTile(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
        ),
        leading: Container(
          width: 40,
          height: 40,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: theme.actions.primary,
            shape: BoxShape.circle,
          ),
          child: Text(
            leading,
            style: PhoneDesignTokens.uiText(
              color: theme.actions.primaryForeground,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
          title: Text(
            title,
            maxLines: arabic ? 2 : 1,
            overflow: TextOverflow.ellipsis,
            style: PhoneDesignTokens.uiText(fontSize:16,fontWeight:FontWeight.w600,color:context.herTheme.cardTitle),
          ),
          subtitle: Text(
            subtitle,
            style: PhoneDesignTokens.uiText(
              fontSize: 10.5,
              color: theme.bodySecondary,
            ),
          ),
          trailing: highlighted
              ? Icon(Icons.bookmark_rounded, color: quranRoseIcon)
              : const Icon(Icons.chevron_left_rounded),
        ),
    );
  }
}
