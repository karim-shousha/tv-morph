import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/widgets/her_components.dart';
import '../../../../core/data/remote_content_repository.dart';
import '../../data/faith_content.dart';
import '../../data/quran_repository.dart';
import '../../../../core/widgets/app_page_header.dart';
import '../widgets/faith_shared.dart';
import '../widgets/faith_share_card.dart';
import '../quran_reader_screen.dart';

class AyahScreen extends StatefulWidget {
  const AyahScreen({super.key});
  @override
  State<AyahScreen> createState() => _AyahScreenState();
}

class _AyahScreenState extends State<AyahScreen> {
  List<AyahOfDay> allItems = ayatOfDay;
  List<QuranAyah> _highlights = const [];
  List<FaithImportanceSlide> _importanceSlides = _fallbackImportanceSlides;
  final PageController _importanceController = PageController();
  Timer? _importanceTimer;
  int _importanceIndex = 0;
  bool _loading = true;

  static const _highlightReferences = <(int, int)>[(13, 28), (94, 5), (2, 286)];
  static const _fallbackImportanceSlides = <FaithImportanceSlide>[
    FaithImportanceSlide(
      'صحبة يومية مع القرآن',
      'اجعل لكتاب الله مساحة ثابتة في يومك، ولو آية واحدة تقرأها بهدوء.',
      'ورد صغير • أثر مستمر',
    ),
    FaithImportanceSlide(
      'ورتّل القرآن ترتيلًا',
      'اقرأ على مهل، وخذ وقتك مع كل آية؛ فالمقصود حضور القلب لا السرعة.',
      'سورة المزمل • 4',
    ),
    FaithImportanceSlide(
      'خيركم من تعلم القرآن وعلمه',
      'الاستمرار في القراءة والتعلّم من أجمل ما يُهدى للنفس كل يوم.',
      'صحيح البخاري • 5027',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _loadContent();
    _importanceTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!_importanceController.hasClients || _importanceSlides.length < 2) {
        return;
      }
      _importanceIndex = (_importanceIndex + 1) % _importanceSlides.length;
      _importanceController.animateToPage(
        _importanceIndex,
        duration: const Duration(milliseconds: 480),
        curve: Curves.easeOutCubic,
      );
    });
  }

  @override
  void dispose() {
    _importanceTimer?.cancel();
    _importanceController.dispose();
    super.dispose();
  }

  Future<void> _loadContent() async {
    final quranFuture = QuranRepository.instance.load();
    final quran = await quranFuture;
    if (!mounted) return;
    // Render bundled Quran content immediately. Remote CMS data is optional
    // and must never leave the daily verse behind an endless loader.
    final highlights = _highlightReferences
        .map(
          (reference) => quran.firstWhere(
            (ayah) => ayah.surah == reference.$1 && ayah.ayah == reference.$2,
          ),
        )
        .toList();
    final bundledFullVerses = ayatOfDay.map((item) {
      final verse = quran.firstWhere(
        (ayah) => ayah.surah == item.surahNumber && ayah.ayah == item.ayah,
      );
      return AyahOfDay(
        item.surahNumber,
        item.surah,
        item.ayah,
        verse.text,
        isExcerpt: false,
      );
    }).toList();
    setState(() {
      allItems = bundledFullVerses;
      _highlights = highlights;
      _loading = false;
    });
    final remoteResults = await Future.wait([
      RemoteContentRepository.instance
          .loadItems('faith_ayah')
          .timeout(const Duration(seconds: 4), onTimeout: () => null),
      RemoteContentRepository.instance
          .loadItems('faith_daily_card')
          .timeout(const Duration(seconds: 4), onTimeout: () => null),
    ]);
    if (!mounted) return;
    final remote = remoteResults[0];
    final cards = remoteResults[1];
    final cycle = (remote ?? const <Map<String, dynamic>>[])
        .where((item) => item['categoryId'] == 'ورد 30 يومًا')
        .map(
          (item) => AyahOfDay(
            0,
            (item['titleAr'] as String?)?.trim().isNotEmpty == true
                ? item['titleAr'] as String
                : 'إضافة من الإدارة',
            0,
            (item['bodyAr'] as String? ?? '').trim(),
            isExcerpt: false,
          ),
        )
        .where((item) => item.text.isNotEmpty)
        .toList();
    final importanceSlides = (cards ?? const <Map<String, dynamic>>[])
        .where((item) => item['categoryId'] == 'quran_importance')
        .map(
          (item) => FaithImportanceSlide(
            (item['titleAr'] as String? ?? '').trim(),
            (item['bodyAr'] as String? ?? '').trim(),
            (item['subtitleAr'] as String? ?? '').trim(),
          ),
        )
        .where((item) => item.title.isNotEmpty && item.body.isNotEmpty)
        .toList();
    setState(() {
      allItems = cycle.length >= 30 ? cycle : bundledFullVerses;
      if (importanceSlides.isNotEmpty) {
        _importanceSlides = importanceSlides;
        _importanceIndex %= _importanceSlides.length;
      }
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final today = DateUtils.dateOnly(DateTime.now());
    final days = today.difference(DateTime(2026, 1, 1)).inDays;
    // The day is the only selector. Content finishes loading before the first
    // card is shown, so the verse cannot visibly swap after opening the page.
    final dailyIndex = days % allItems.length;
    final ayah = allItems[dailyIndex];
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              AppPageHeader(
                  logoOnly: true,
                title: 'آية اليوم',
                subtitle: 'ورد يومي يطمئن قلبك',
                onBack: () => Navigator.maybePop(context),
              ),
              Expanded(
                child: _loading
                    ? Center(
                        child: CircularProgressIndicator(
                          color: context.herTheme.headingPrimary,
                        ),
                      )
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(16, 14, 16, 72),
                        children: [
                          _importanceSlider(context),
                          const SizedBox(height: 14),
                          // Verse of the day — content family (long-form
                          // readable surface owned centrally).
                          HERCard(
                            role: HERCardRole.content,
                            radius: 22,
                            padding: const EdgeInsets.all(19),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const HERIconContainer(
                                      Icons.menu_book_rounded,
                                      kind: HerIconKind.knowledge,
                                      size: 30,
                                      iconSize: 15,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'ورد اليوم • ${dailyIndex + 1} / ${allItems.length}',
                                      style: faithText(
                                        context,
                                        11,
                                        FontWeight.w900,
                                        context.herTheme.headingPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 11),
                                Text(
                                  ayah.text,
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.amiri(
                                    fontSize: 25,
                                    height: 1.9,
                                    fontWeight: FontWeight.w700,
                                    color: context.herTheme.bodyPrimary,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  ayah.ayah > 0
                                      ? 'سورة ${ayah.surah} • الآية ${ayah.ayah}'
                                      : ayah.surah,
                                  style: faithText(
                                    context,
                                    11,
                                    FontWeight.w800,
                                    context.herTheme.headingPrimary,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'هذه آيتكَ لليوم؛ ستبقى نفسها حتى بداية يوم جديد.',
                                  style: faithText(
                                    context,
                                    10,
                                    FontWeight.w600,
                                    context.herTheme.bodySecondary,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    Expanded(
                                      // Central secondary action (no local
                                      // outlined recipe, no local alpha).
                                      child: HERSecondaryButton(
                                        label: 'نسخ',
                                        icon: Icons.copy_rounded,
                                        height: 46,
                                        fontSize: 11,
                                        iconSize: 16,
                                        onPressed: () async {
                                          await Clipboard.setData(
                                            ClipboardData(
                                              text:
                                                  '${ayah.text}\n— سورة ${ayah.surah}${ayah.ayah > 0 ? ' • الآية ${ayah.ayah}' : ''}',
                                            ),
                                          );
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(
                                              context,
                                            ).showSnackBar(
                                              const SnackBar(
                                                content: Text('نُسخت الآية 🤍'),
                                              ),
                                            );
                                          }
                                        },
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      // Cleanup: central Primary (pinned pink
                                      // + white); metrics preserved.
                                      child: HERPrimaryButton(
                                        label: 'مشاركة الآية',
                                        icon: Icons.share_rounded,
                                        onPressed: () => shareFaithCard(
                                          context: context,
                                          title: 'آية اليوم',
                                          body: ayah.text,
                                          reference:
                                              'سورة ${ayah.surah}${ayah.ayah > 0 ? ' • الآية ${ayah.ayah}' : ''}',
                                        ),
                                        radius: 22,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        iconSize: 16,
                                        presentation:
                                            HERButtonPresentation.flat,
                                        expanded: false,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const HERIconContainer(
                                Icons.auto_stories_rounded,
                                kind: HerIconKind.knowledge,
                                size: 34,
                                iconSize: 17,
                              ),
                              const SizedBox(width: 7),
                              Text(
                                'آيات مختارة للطمأنينة',
                                style: faithText(context, 14, FontWeight.w900),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ..._highlights.map(
                            (item) => _highlightCard(context, item),
                          ),
                          const SizedBox(height: 4),
                          // Quran entry CTA — medium content role with a
                          // central knowledge icon (no local Ink recipe).
                          HERCard(
                            role: HERCardRole.medium,
                            radius: 20,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const QuranReaderScreen(),
                              ),
                            ),
                            child: Row(
                              children: [
                                const HERIconContainer(
                                  Icons.menu_book_rounded,
                                  kind: HerIconKind.knowledge,
                                  size: 38,
                                  iconSize: 19,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    'تابع القراءة في المصحف الكامل',
                                    style: faithText(
                                      context,
                                      12,
                                      FontWeight.w900,
                                    ),
                                  ),
                                ),
                                Icon(
                                  Icons.arrow_back_ios_new_rounded,
                                  size: 16,
                                  color: context.herTheme.headingPrimary,
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

  Widget _importanceSlider(BuildContext context) {
    final theme = context.herTheme;
    final slides = _importanceSlides;
    // Slide family owns surface/opacity/border + indicators; per-slide
    // artwork stays a central icon (Quran learning → knowledge kind).
    const icons = [
      Icons.auto_stories_rounded,
      Icons.spa_rounded,
      Icons.favorite_rounded,
    ];
    return Column(
      children: [
        SizedBox(
          // The supporting Quran slide should introduce the page, not take
          // the same vertical weight as the verse itself.
          height: 136,
          child: PageView.builder(
            controller: _importanceController,
            itemCount: slides.length,
            onPageChanged: (value) => setState(() => _importanceIndex = value),
            itemBuilder: (context, index) {
              final slide = slides[index];
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: herSlideDecoration(theme, radius: 25),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            slide.title,
                            style: faithText(
                              context,
                              16,
                              FontWeight.w900,
                              theme.sectionTitle,
                            ),
                          ),
                          const SizedBox(height: 5),
                          Text(
                            slide.body,
                            style: faithText(
                              context,
                              10.5,
                              FontWeight.w600,
                              theme.bodySecondary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            slide.reference,
                            style: faithText(
                              context,
                              9.5,
                              FontWeight.w800,
                              theme.headingPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    HERIconContainer(
                      icons[index % icons.length],
                      kind: HerIconKind.knowledge,
                      size: 46,
                      iconSize: 24,
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 9),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            slides.length,
            (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: index == _importanceIndex ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: index == _importanceIndex
                    ? theme.slides.indicatorActive
                    : theme.slides.indicatorInactive,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // Calm highlight cards — content family (one readable surface, no
  // local secondaryCard recipe, no legacy icon tint).
  Widget _highlightCard(BuildContext context, QuranAyah item) => Padding(
    padding: const EdgeInsets.only(bottom: 9),
    child: HERCard(
      role: HERCardRole.content,
      radius: 22,
      elevated: false,
      padding: const EdgeInsets.fromLTRB(15, 13, 15, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.text,
            textAlign: TextAlign.right,
            style: GoogleFonts.amiri(
              fontSize: 20,
              height: 1.72,
              fontWeight: FontWeight.w700,
              color: context.herTheme.bodyPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${QuranRepository.surahNames[item.surah - 1]} • الآية ${item.ayah}',
            style: faithText(
              context,
              10,
              FontWeight.w800,
              herIconGlyphOf(context.herTheme, HerIconKind.knowledge),
            ),
          ),
        ],
      ),
    ),
  );
}
