import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/theme/her_theme_data.dart';
import '../../../core/widgets/app_page_header.dart';
import '../../../core/widgets/her_components.dart';
import 'tafsir_reader_screen.dart';
import 'widgets/faith_shared.dart';

/// A gentle, local-first companion for memorisation, review and foundational
/// Quran learning. It deliberately stores only the user's own checklist — no
/// worship details are sent to the network.
class QuranCompanionScreen extends StatefulWidget {
  const QuranCompanionScreen({
    super.key,
    required this.onOpenQuran,
    required this.onAchievement,
  });

  final VoidCallback onOpenQuran;
  final Future<void> Function(String title) onAchievement;

  @override
  State<QuranCompanionScreen> createState() => _QuranCompanionScreenState();
}

class _QuranCompanionScreenState extends State<QuranCompanionScreen> {
  static const _dailyTarget = 3;
  int _memorised = 0;
  bool _reviewed = false;
  bool _learned = false;
  bool _loading = true;
  int _tipIndex = 0;
  Timer? _tipTimer;

  static const _dailyTips = [
    (
      'ابدأ بالقليل الثابت',
      'ثلاث آيات متقنة كل يوم أجمل من مقدار كبير ينقطع سريعًا.',
    ),
    (
      'اسمعي قبل أن تحفظي',
      'استمع للمقطع من قارئ متقن ثم ردّده آية آية بهدوء.',
    ),
    (
      'المراجعة قبل الجديد',
      'ابدأ دقائق بمراجعة محفوظ الأمس قبل إضافة آيات جديدة.',
    ),
    (
      'صححي التلاوة',
      'اعرضي ما تحفظينه على معلّمة أو معلّم متقن متى تيسّر ذلك.',
    ),
    (
      'اربط المعنى بالحفظ',
      'قراءة معنى الآية باختصار تعين على ثباتها وتدبرها.',
    ),
    (
      'حدّد وقتًا ثابتًا',
      'اختار وقتًا هادئًا قصيرًا، ثم اجعله موعدك اليومي مع القرآن.',
    ),
    (
      'كرّري بصوت مسموع',
      'التكرار الهادئ بصوتك يثبّت الآية أسرع من القراءة الصامتة وحدها.',
    ),
    (
      'قسّمي الآية الطويلة',
      'خذها مقاطع قصيرة، وثبّت كل مقطع قبل الانتقال لما بعده.',
    ),
    (
      'اكتب كلمة مفتاح',
      'اكتب كلمة تذكّرك بمعنى الآية لتستدعيها بسهولة وقت المراجعة.',
    ),
    (
      'اختمي بيوم مراجعة',
      'اجعل يومًا في الأسبوع للمراجعة فقط؛ فالثبات أهم من السرعة.',
    ),
  ];

  String get _todayKey {
    final now = DateTime.now();
    return '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';
  }

  String get _storagePrefix => 'morph_quran_companion_$_todayKey';

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _tipIndex = (now.year * 372 + now.month * 31 + now.day) % _dailyTips.length;
    _tipTimer = Timer.periodic(const Duration(seconds: 6), (_) {
      if (mounted) {
        setState(() => _tipIndex = (_tipIndex + 1) % _dailyTips.length);
      }
    });
    _load();
  }

  @override
  void dispose() {
    _tipTimer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _memorised = prefs.getInt('${_storagePrefix}_memorised') ?? 0;
      _reviewed = prefs.getBool('${_storagePrefix}_reviewed') ?? false;
      _learned = prefs.getBool('${_storagePrefix}_learned') ?? false;
      _loading = false;
    });
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('${_storagePrefix}_memorised', _memorised);
    await prefs.setBool('${_storagePrefix}_reviewed', _reviewed);
    await prefs.setBool('${_storagePrefix}_learned', _learned);
  }

  Future<void> _completeIfReady() async {
    if (_memorised < _dailyTarget || !_reviewed || !_learned) return;
    await widget.onAchievement('صحبة القرآن والعلم — ورد يومي مكتمل');
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('أحسنتَ 🤍 اكتمل وردك اليومي بلطف.')),
      );
    }
  }

  Future<void> _changeMemorised(int delta) async {
    final next = (_memorised + delta).clamp(0, _dailyTarget);
    if (next == _memorised) return;
    setState(() => _memorised = next);
    await _save();
    await _completeIfReady();
  }

  Future<void> _toggleReview() async {
    setState(() => _reviewed = !_reviewed);
    await _save();
    await _completeIfReady();
  }

  Future<void> _toggleLearning() async {
    setState(() => _learned = !_learned);
    await _save();
    await _completeIfReady();
  }

  Widget _sectionTitle(BuildContext context, String title, String subtitle) =>
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: faithText(context, 15, FontWeight.w900)),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: faithText(
              context,
              10.5,
              FontWeight.w600,
              context.herTheme.bodySecondary,
            ),
          ),
        ],
      );

  Widget _wirdProgress(BuildContext context, double value) {
    final progress = value.clamp(0.0, 1.0);
    final theme = context.herTheme;
    final isDark = theme.surfaces.background.computeLuminance() < .42;
    final colors = progress < .34
        ? [theme.accents.learning, theme.accents.emotional]
        : progress < .67
        ? [theme.accents.emotional, theme.accents.energy]
        : [theme.accents.wellness, theme.accents.energy];
    final track = Color.alphaBlend(
      (isDark ? theme.text.primary : theme.actions.primary).withValues(
        alpha: isDark ? .26 : .18,
      ),
      theme.surfaces.surface,
    );
    final radius = BorderRadius.circular(9);
    return Semantics(
      value: '${(progress * 100).round()}%',
      child: SizedBox(
        height: 12,
        child: Container(
          decoration: BoxDecoration(color: track, borderRadius: radius),
          child: ClipRRect(
            borderRadius: radius,
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              child: FractionallySizedBox(
                widthFactor: progress,
                child: SizedBox.expand(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: radius,
                      gradient: LinearGradient(
                        begin: AlignmentDirectional.centerStart,
                        end: AlignmentDirectional.centerEnd,
                        colors: colors,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: colors.last.withValues(alpha: .44),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Color _contentInk(BuildContext context, {bool muted = false}) {
    final theme = context.herTheme;
    return herForegroundOnDecoration(
      theme,
      herRoleCardDecoration(theme, HERCardRole.content),
      configured: muted ? theme.bodySecondary : theme.headingPrimary,
    );
  }

  Widget _compactMemorisationCard(BuildContext context) => ConstrainedBox(
    constraints: const BoxConstraints(minHeight:PhoneDesignTokens.compactTileMinHeight),
    child: HERCard(
      role: HERCardRole.content,
      radius: 17,
      padding: const EdgeInsets.all(8),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          HERIconContainer(
            Icons.bookmark_added_rounded,
            kind: HerIconKind.rose,
            size: 34,
            iconSize: 17,
          ),
          const SizedBox(height: 5),
          Text(
            'حفظ اليوم',
            textAlign: TextAlign.center,
            style: faithText(context, 10.5, FontWeight.w900),
          ),
          Text(
            '$_memorised / $_dailyTarget آيات',
            textAlign: TextAlign.center,
            style: faithText(
              context,
              8.5,
              FontWeight.w700,
              context.herTheme.bodySecondary,
            ),
          ),
          const SizedBox(height: 2),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              InkResponse(
                onTap: _memorised == 0 ? null : () => _changeMemorised(-1),
                radius: 15,
                child: Icon(
                  Icons.remove_circle_outline,
                  size: 19,
                  color: _memorised == 0
                      ? _contentInk(context, muted: true)
                      : _contentInk(context),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 7),
                child: Text(
                  '$_memorised',
                  style: faithText(
                    context,
                    13,
                    FontWeight.w900,
                    _contentInk(context),
                  ),
                ),
              ),
              InkResponse(
                onTap: _memorised >= _dailyTarget
                    ? null
                    : () => _changeMemorised(1),
                radius: 15,
                child: Icon(
                  Icons.add_circle_rounded,
                  size: 19,
                  color: _memorised >= _dailyTarget
                      ? _contentInk(context, muted: true)
                      : _contentInk(context),
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );

  Widget _compactCheckCard({
    required BuildContext context,
    required IconData icon,
    required HerIconKind kind,
    required String title,
    required String subtitle,
    required bool done,
    required Future<void> Function() onTap,
  }) => ConstrainedBox(
    constraints: const BoxConstraints(minHeight:PhoneDesignTokens.compactTileMinHeight),
    child: HERCard(
      role: HERCardRole.content,
      radius: 17,
      padding: const EdgeInsets.all(8),
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          HERIconContainer(icon, kind: kind, size: 34, iconSize: 17),
          const SizedBox(height: 5),
          Text(
            title,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: faithText(context, 10.5, FontWeight.w900),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: faithText(
              context,
              8.2,
              FontWeight.w600,
              context.herTheme.bodySecondary,
            ),
          ),
          const SizedBox(height: 3),
          Icon(
            done ? Icons.check_circle_rounded : Icons.circle_outlined,
            color: done
                ? _contentInk(context)
                : _contentInk(context, muted: true),
            size: 18,
          ),
        ],
      ),
    ),
  );

  Widget _compactBookCard(BuildContext context, {required TafsirBook book}) {
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight:PhoneDesignTokens.compactTileMinHeight),
      child: HERCard(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => TafsirReaderScreen(book: book)),
        ),
        role: HERCardRole.content,
        radius: 17,
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            HERIconContainer(
              Icons.auto_stories_rounded,
              kind: book.kind,
              size: 34,
              iconSize: 17,
            ),
            const SizedBox(height: 5),
            Text(
              book.title,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: faithText(context, 10, FontWeight.w900),
            ),
            const SizedBox(height: 2),
            Text(
              book.source,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: faithText(
                context,
                7.8,
                FontWeight.w700,
                context.herTheme.bodySecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final progress =
        (_memorised / _dailyTarget + (_reviewed ? 1 : 0) + (_learned ? 1 : 0)) /
        3;
    final tip = _dailyTips[_tipIndex];
    return HerAccentIconScope(
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Scaffold(
          body: SafeArea(
            child: Column(
              children: [
                AppPageHeader(
                  logoOnly: true,
                  title: 'صحبة القرآن والعِلم',
                  subtitle: 'حفظ ومراجعة وعلم يسير كل يوم',
                  onBack: () => Navigator.maybePop(context),
                ),
                Expanded(
                  child: _loading
                      ? const Center(child: CircularProgressIndicator())
                      : ListView(
                          padding: const EdgeInsets.fromLTRB(16, 14, 16, 32),
                          children: [
                            HERCard(
                              role: HERCardRole.wide,
                              radius: 22,
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const HERIconContainer(
                                        Icons.menu_book_rounded,
                                        kind: HerIconKind.knowledge,
                                        size: 46,
                                        iconSize: 24,
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'ورد صغير… أثر ثابت',
                                              style: faithText(
                                                context,
                                                14,
                                                FontWeight.w900,
                                              ),
                                            ),
                                            Text(
                                              'اختار ما يناسبك، والتقدم محفوظ لليوم فقط.',
                                              style: faithText(
                                                context,
                                                10,
                                                FontWeight.w600,
                                                context.herTheme.bodySecondary,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Text(
                                        '${(progress * 100).round()}%',
                                        style: PhoneDesignTokens.uiText(
                                          color:
                                              context
                                                      .herTheme
                                                      .surfaces
                                                      .background
                                                      .computeLuminance() <
                                                  .42
                                              ? context.herTheme.status.gold
                                              : context
                                                    .herTheme
                                                    .actions
                                                    .primary,
                                          fontSize: 17,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 11),
                                  _wirdProgress(context, progress),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            _sectionTitle(
                              context,
                              'ورد الحفظ والمراجعة',
                              'هدف اليوم ٣ آيات — قابل للزيادة لاحقًا',
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: _compactMemorisationCard(context),
                                ),
                                const SizedBox(width: 7),
                                Expanded(
                                  child: _compactCheckCard(
                                    context: context,
                                    icon: Icons.replay_rounded,
                                    kind: HerIconKind.warm,
                                    title: 'مراجعة يومية',
                                    subtitle: 'راجع محفوظك بهدوء.',
                                    done: _reviewed,
                                    onTap: _toggleReview,
                                  ),
                                ),
                                const SizedBox(width: 7),
                                Expanded(
                                  child: _compactCheckCard(
                                    context: context,
                                    icon: Icons.lightbulb_rounded,
                                    kind: HerIconKind.knowledge,
                                    title: 'علم وتدبّر',
                                    subtitle: 'اقرأ معنى آية موثوقة.',
                                    done: _learned,
                                    onTap: _toggleLearning,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            HERPrimaryButton(
                              label: 'افتح المصحف للورد',
                              icon: Icons.menu_book_rounded,
                              onPressed: widget.onOpenQuran,
                              height: 42,
                              radius: 21,
                              expanded: true,
                            ),
                            const SizedBox(height: 14),
                            _sectionTitle(
                              context,
                              'نصائح للحفظ',
                              '١٠ نصائح تتبدل تلقائيًا لتثبّت الورد',
                            ),
                            const SizedBox(height: 8),
                            HERCard(
                              role: HERCardRole.content,
                              radius: 18,
                              padding: const EdgeInsets.all(13),
                              child: Row(
                                children: [
                                  HERIconContainer(
                                    Icons.tips_and_updates_rounded,
                                    kind: HerIconKind.warm,
                                    size: 40,
                                    iconSize: 20,
                                  ),
                                  const SizedBox(width: 9),
                                  Expanded(
                                    child: AnimatedSwitcher(
                                      duration: const Duration(
                                        milliseconds: 420,
                                      ),
                                      transitionBuilder: (child, animation) =>
                                          FadeTransition(
                                            opacity: animation,
                                            child: SlideTransition(
                                              position: Tween<Offset>(
                                                begin: const Offset(0, .12),
                                                end: Offset.zero,
                                              ).animate(animation),
                                              child: child,
                                            ),
                                          ),
                                      child: Column(
                                        key: ValueKey(_tipIndex),
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            tip.$1,
                                            style: faithText(
                                              context,
                                              12,
                                              FontWeight.w900,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            tip.$2,
                                            style: faithText(
                                              context,
                                              10,
                                              FontWeight.w600,
                                              context.herTheme.bodySecondary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    '${_tipIndex + 1}/10',
                                    style: faithText(
                                      context,
                                      9,
                                      FontWeight.w900,
                                      _contentInk(context),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 18),
                            _sectionTitle(
                              context,
                              'مكتبتي الشرعية',
                              'مراجع موثوقة ودليل استخدام عملي لكل كتاب',
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: _compactBookCard(
                                    context,
                                    book: const TafsirBook(
                                      id: 2012,
                                      title: 'التفسير الميسّر',
                                      source: 'مجمع الملك فهد',
                                      kind: HerIconKind.knowledge,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 7),
                                Expanded(
                                  child: _compactBookCard(
                                    context,
                                    book: const TafsirBook(
                                      id: 2003,
                                      title: 'المختصر في التفسير',
                                      source: 'مركز تفسير',
                                      kind: HerIconKind.emotional,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 7),
                                Expanded(
                                  child: _compactBookCard(
                                    context,
                                    book: const TafsirBook(
                                      id: 3,
                                      title: 'تيسير الكريم الرحمن',
                                      source: 'تفسير السعدي',
                                      kind: HerIconKind.warm,
                                    ),
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
      ),
    );
  }
}
