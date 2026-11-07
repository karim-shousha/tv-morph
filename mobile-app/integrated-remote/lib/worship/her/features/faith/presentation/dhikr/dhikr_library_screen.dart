import '../widgets/phone_reading_card.dart';
import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/her_banner_ad.dart';
import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/widgets/her_components.dart';
import '../../../../core/data/remote_content_repository.dart';
import '../../data/faith_content.dart';
import '../../data/faith_repository.dart';
import '../../../../core/widgets/app_page_header.dart';
import '../widgets/faith_shared.dart';
import '../widgets/faith_share_card.dart';

class DhikrLibraryScreen extends StatefulWidget {
  const DhikrLibraryScreen({
    super.key,
    required this.onAchievement,
    this.initialCategory = _DhikrLibraryScreenState._allCategory,
  });
  final Future<void> Function(String title) onAchievement;

  /// Lets the dashboard deep-link straight into a specific ward
  /// (e.g. morning vs evening adhkar).
  final String initialCategory;
  @override
  State<DhikrLibraryScreen> createState() => _DhikrLibraryScreenState();
}

class _DhikrLibraryScreenState extends State<DhikrLibraryScreen> {
  static const _allCategory = 'الكل';
  final counts = <String, int>{};
  Future<void> _challengeProgressQueue = Future.value();
  String selected = 'أذكار الصباح';
  List<FaithText> allItems = verifiedAdhkar;
  @override
  void initState() {
    super.initState();
    selected = widget.initialCategory;
    _loadDailyCounts();
    _loadPublishedAdhkar();
  }

  /// Daily dhikr progress survives leaving the page: counts are per-day.
  Future<void> _loadDailyCounts() async {
    final saved = await FaithRepository.instance.loadDhikrDaily(DateTime.now());
    if (!mounted || saved.isEmpty) return;
    setState(() => counts.addAll(saved));
  }

  Future<void> _tapDhikr(FaithText item) async {
    HapticFeedback.selectionClick();
    final current = counts[item.title] ?? 0;
    final reachesTarget = current < item.count && current + 1 >= item.count;
    setState(() => counts[item.title] = math.min(item.count, current + 1));
    if (current < item.count) {
      unawaited(
        FaithRepository.instance.incrementDhikrDaily(
          DateTime.now(),
          item.title,
        ),
      );
      _challengeProgressQueue = _challengeProgressQueue
          .then(
            (_) => FaithRepository.instance.recordChallengeProgress(
              CircleWard.dhikr,
              1,
            ),
          )
          .then<void>((_) {});
    }
    if (reachesTarget && mounted) {
      widget.onAchievement('ورد ذكر مكتمل: ${item.title}');
      unawaited(FaithRepository.instance.recordCircleWard(CircleWard.dhikr));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('أحسنتَ 🤍 وردك اكتمل وأضفنا لكَ 25 نقطة.'),
        ),
      );
    }
  }

  Future<void> _loadPublishedAdhkar() async {
    final remote = await RemoteContentRepository.instance.loadItems(
      'faith_dhikr',
    );
    if (!mounted || remote == null || remote.isEmpty) return;
    final additions = remote
        .map(
          (item) => FaithText(
            category: (item['categoryId'] as String?)?.trim().isNotEmpty == true
                ? item['categoryId'] as String
                : 'إضافات الإدارة',
            title: (item['titleAr'] as String? ?? '').trim(),
            text: (item['bodyAr'] as String? ?? '').trim(),
            reference:
                (item['subtitleAr'] as String? ?? 'مرجع يُراجع من الإدارة')
                    .trim(),
            count:
                int.tryParse(
                  RegExp(r'العدد:\s*(\d+)')
                          .firstMatch(item['subtitleAr'] as String? ?? '')
                          ?.group(1) ??
                      '',
                ) ??
                1,
            kind: 'ذكر من الإدارة',
          ),
        )
        .where((item) => item.title.isNotEmpty && item.text.isNotEmpty)
        .toList();
    // Once the CMS is populated it is the editorial source of truth. Keeping
    // the bundled list only as an offline fallback prevents every imported
    // item from appearing twice in the library.
    if (additions.isNotEmpty) setState(() => allItems = additions);
  }

  @override
  Widget build(BuildContext context) {
    final categories = allItems.map((item) => item.category).toSet().toList();
    final effective = selected == _allCategory || categories.contains(selected)
        ? selected
        : _allCategory;
    final items = allItems.where(
      (item) => effective == _allCategory || item.category == effective,
    );
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              AppPageHeader(
                logoOnly: true,
                title: 'الأذكار',
                subtitle: 'وردك اليومي وحصنك',
                onBack: () => Navigator.maybePop(context),
              ),
              Expanded(
                child: Stack(
                  children: [
                    Column(
                      children: [
                        // Intro banner — content family (long-form readable
                        // surface owned centrally); artwork behind stays special.
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                          child: const PhonePageIntro(
                            title: 'الأذكار',
                            subtitle: 'وردك اليومي، بقراءة واضحة وتقدّم محفوظ.',
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
                          child: InputDecorator(
                            decoration:
                                herInputDecoration(
                                  'اختار باب الذكر',
                                  icon: Icons.menu_book_rounded,
                                ).copyWith(
                                  labelText: 'باب الذكر',
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 4,
                                  ),
                                ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: effective,
                                isExpanded: true,
                                items: [
                                  const DropdownMenuItem(
                                    value: _allCategory,
                                    child: Text('الكل'),
                                  ),
                                  ...categories.map(
                                    (category) => DropdownMenuItem(
                                      value: category,
                                      child: Text(
                                        category,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ),
                                ],
                                onChanged: (value) {
                                  if (value != null) {
                                    setState(() => selected = value);
                                  }
                                },
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: ListView(
                            padding: EdgeInsets.fromLTRB(
                              16,
                              0,
                              16,
                              48 + MediaQuery.paddingOf(context).bottom,
                            ),
                            children: items
                                .map((item) {
                                  final current = counts[item.title] ?? 0;
                                  return PhoneReadingCard(
                                    key: ValueKey(item.title),
                                    title: item.title,
                                    body: item.text,
                                    reference: item.reference,
                                    progress: current >= item.count
                                        ? 'اكتمل'
                                        : item.count > 1
                                        ? '$current / ${item.count}'
                                        : 'تم الذكر',
                                    onRepeat: () => _tapDhikr(item),
                                    onShare: () => shareFaithCard(
                                      context: context,
                                      title: item.title,
                                      body: item.text,
                                      reference: item.reference,
                                    ),
                                  );
                                })
                                .toList()
                                .indexed
                                .expand(
                                  (entry) => <Widget>[
                                    if (entry.$1 == (items.length > 2 ? 2 : 0))
                                      const HerBannerAd(
                                        inline: true,
                                        placement: 'dhikr',
                                      ),
                                    entry.$2,
                                  ],
                                )
                                .toList(),
                          ),
                        ),
                      ],
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
