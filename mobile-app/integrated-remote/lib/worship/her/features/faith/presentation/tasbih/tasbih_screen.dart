import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'package:morph_remote/worship/her/core/widgets/her_semantic_icon.dart';
import 'package:morph_remote/worship/her/core/theme/her_modern_accents.dart';
import '../../../../core/services/home_widget_service.dart';
import '../../../../core/widgets/theme_backdrop.dart';
import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';
import '../../../../core/theme/app_decorations.dart';
import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/widgets/her_components.dart';
import '../../../../core/widgets/app_page_header.dart';
import '../../../../core/services/device_feedback_service.dart';
import '../../data/faith_repository.dart';
import '../dua/dua_library_screen.dart';

class TasbihScreen extends StatefulWidget {
  const TasbihScreen({
    super.key,
    required this.onAchievement,
    this.initialDhikr,
  });
  final String? initialDhikr;
  final Future<void> Function(String title) onAchievement;
  @override
  State<TasbihScreen> createState() => _TasbihScreenState();
}

class _TasbihScreenState extends State<TasbihScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  TasbihState? state;
  TasbihCircleState? circle;
  late final AnimationController controller;
  late final AudioPlayer _tapPlayer;
  Future<void> _tasbihWriteQueue = Future.value();
  static const presets = [
    'أستغفر الله',
    'سبحان الله',
    'الحمد لله',
    'الله أكبر',
    'لا إله إلا الله',
    'الصلاة على النبي ﷺ',
  ];
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 180),
    );
    _tapPlayer = AudioPlayer();
    unawaited(_tapPlayer.setReleaseMode(ReleaseMode.stop));
    FaithRepository.instance.loadTasbih().then((value) async {
      var selected = value;
      if (widget.initialDhikr != null && mounted) {
        selected = value.copyWith(dhikr: widget.initialDhikr, current: 0);
        final saved = await HomeWidgetService.instance.writeTasbih({
          'dhikr': widget.initialDhikr!,
          'current': 0,
        });
        if (!saved) await FaithRepository.instance.saveTasbih(selected);
      }
      if (mounted) setState(() => state = selected);
    });
    FaithRepository.instance.loadTasbihCircle().then((value) {
      if (mounted) setState(() => circle = value);
    });
  }

  /// Normal card surfaces come from the central card roles
  /// (via context.herTheme) — no page-local card recipe.
  Future<void> _customTarget(TasbihState current) async {
    final controller = TextEditingController(text: '${current.target}');
    final picked = await showHerSheet<int>(
      context,
      title: 'هدف مخصص',
      // Keyboard-safe route (scroll-controlled sheet) + internal scroll.
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * 0.85,
        ),
        child: SingleChildScrollView(
          padding: EdgeInsets.only(
            bottom: MediaQuery.viewInsetsOf(context).bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: controller,
                keyboardType: TextInputType.number,
                autofocus: true,
                maxLength: 5,
                decoration: herInputDecoration('مثال: 500'),
              ),
              const SizedBox(height: 14),
              HERPrimaryButton(
                label: 'ابدأ',
                onPressed: () => Navigator.pop(
                  context,
                  (int.tryParse(controller.text) ?? 0).clamp(1, 10000),
                ),
              ),
              const SizedBox(height: 4),
              HERSecondaryButton(
                label: 'إلغاء',
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ),
    );
    controller.dispose();
    if (picked == null || picked == current.target) return;
    await _set(current.copyWith(target: picked, current: 0));
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState lifecycle) {
    if (lifecycle == AppLifecycleState.resumed) {
      unawaited(_reloadWidgetCounter());
    }
  }

  Future<void> _reloadWidgetCounter() async {
    await _tasbihWriteQueue;
    final updated = await FaithRepository.instance.loadTasbih();
    if (mounted) setState(() => state = updated);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    controller.dispose();
    _tapPlayer.dispose();
    super.dispose();
  }

  Future<void> _tap() {
    final write = _tasbihWriteQueue.then((_) => _performTap());
    _tasbihWriteQueue = write.catchError((Object error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تعذّر حفظ التسبيحة، حاول تاني')),
        );
      }
    });
    return _tasbihWriteQueue;
  }

  Future<void> _performTap() async {
    final old = state!;
    final wasComplete = circle?.isComplete ?? false;
    final next = await FaithRepository.instance.incrementTasbih();
    final reached = next.current == next.target;
    if (!mounted) return;
    // The weekly challenge follows the real tasbih counter: one tap here is
    // one tasbih there.  This also keeps custom weekly goals such as 100 or
    // 500 meaningful instead of treating a completed daily preset as a ward.
    final currentCircle = circle;
    final nextCircle = currentCircle?.joined == true
        ? currentCircle!.copyWith(
            tasbihCount: math.min(
              currentCircle.tasbihTarget,
              currentCircle.tasbihCount + 1,
            ),
          )
        : null;
    if (old.hapticEnabled) {
      // This is deliberately stronger than selectionClick, which is nearly
      // silent on many Samsung and budget Android vibration motors.
      unawaited(DeviceFeedbackService.instance.vibrate(durationMs: 82));
    }
    if (old.soundEnabled) {
      // A tiny, bundled button tone provides tactile feedback without
      // interrupting any Quran, radio, or music session in the app.
      try {
        await _tapPlayer.setVolume(.72);
        await _tapPlayer.play(AssetSource('sounds/bloom/button.wav'));
      } catch (_) {
        // Keep an audible fallback if transient asset playback is declined.
        unawaited(DeviceFeedbackService.instance.tapSound());
      }
    }
    controller.forward(from: 0);
    setState(() {
      state = next;
      if (nextCircle != null) circle = nextCircle;
    });
    if (nextCircle != null) {
      await FaithRepository.instance.saveTasbihCircle(nextCircle);
    }
    if (reached && mounted) {
      unawaited(FaithRepository.instance.bumpTasbihDoneStat());
      await widget.onAchievement('سبحة مكتملة: ${next.dhikr}');
      if (mounted) _showCompletionDialog(next.dhikr, next.target);
      final updated = await FaithRepository.instance.recordCircleWard(
        CircleWard.tasbih,
      );
      if (updated != null && mounted) setState(() => circle = updated);
      // Unified v2 completion: every track reached its weekly target.
      // Shown once per week: only on the transition into completion.
      final effective = updated ?? nextCircle;
      if (effective != null &&
          effective.isComplete &&
          !wasComplete &&
          mounted) {
        await widget.onAchievement('أتممتَ تحدي الورد الأسبوعي');
        if (mounted) _showCircleCompletionDialog();
      }
    }
  }

  void _showCompletionDialog(String dhikr, int target) => showHerDialog<void>(
    context,
    title: 'وردك اكتمل ✨',
    icon: Icons.workspace_premium_rounded,
    iconKind: HerIconKind.rose,
    child: Text(
      'أتممتَ $target من «$dhikr». الذكر سكينة للقلب، وكل عودة صغيرة إليه خطوة جميلة. حصلتَ على 25 نقطة في إنجازاتكَ.',
      style: PhoneDesignTokens.uiText(
        height: 1.7,
        color: context.herTheme.text.secondary,
      ),
    ),
    actions: [
      HERSecondaryButton(
        label: 'الحمد لله',
        onPressed: () => Navigator.pop(context),
      ),
    ],
  );

  Future<void> _set(TasbihState value) {
    final before = state!;
    final fields = <String, Object>{
      if (before.dhikr != value.dhikr) 'dhikr': value.dhikr,
      if (before.current != value.current) 'current': value.current,
      if (before.target != value.target) 'target': value.target,
      if (before.soundEnabled != value.soundEnabled)
        'soundEnabled': value.soundEnabled,
      if (before.hapticEnabled != value.hapticEnabled)
        'hapticEnabled': value.hapticEnabled,
    };
    final write = _tasbihWriteQueue.then((_) async {
      final native = await HomeWidgetService.instance.writeTasbih(fields);
      if (!native) await FaithRepository.instance.saveTasbih(value);
      final latest = await FaithRepository.instance.loadTasbih();
      if (mounted) setState(() => state = latest);
    });
    _tasbihWriteQueue = write.catchError((Object error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تعذّر حفظ الإعداد، حاول تاني')),
        );
      }
    });
    return _tasbihWriteQueue;
  }

  // NOTE: legacy circle join/invite removed with the dead in-tasbih
  // challenge card (zero-consumer verified). Joining lives in
  // TasbihChallengeScreen; the tasbih counter still syncs progress above.
  Future<void> _shareReward(TasbihState s) => Share.share(
    'أهديكَ ثواب ذكر «${s.dhikr}» — وصلتُ إلى ${s.current} من ${s.target} اليوم في Morph 🤍\nالذكر راحة لقلبك في زحمة الحياة.',
    subject: 'مشاركة الأجر',
  );

  void _showCircleCompletionDialog() => showHerDialog<void>(
    context,
    title: 'أتممتَ تحدي الأسبوع ✨',
    icon: Icons.workspace_premium_rounded,
    iconKind: HerIconKind.rose,
    child: Text(
      'أكملتَ أوراد القرآن والأذكار والتسبيح لهذا الأسبوع. حصلتَ على شارة «ثابت على الذِّكر»؛ وشارك رفاقكَ لتكون سببًا في خير مستمر.',
      style: PhoneDesignTokens.uiText(
        height: 1.7,
        color: context.herTheme.text.secondary,
      ),
    ),
    actions: [
      HERSecondaryButton(
        label: 'الحمد لله',
        onPressed: () => Navigator.pop(context),
      ),
    ],
  );

  // ============================================================
  // BUILD — نفس شكل التصميم: خلفية الصورة + عدّاد داخل الدايرة
  // بهوية الألوان الجديدة (روز/عنابي/كريمي/ذهبي هادئ).
  // ============================================================
  @override
  Widget build(BuildContext context) {
    final s = state;
    if (s == null) {
      return Scaffold(
        body: Center(
          child: CircularProgressIndicator(
            color: PhoneDesignTokens.accent,
          ),
        ),
      );
    }
    final progress = (s.current / s.target).clamp(0.0, 1.0);
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        extendBodyBehindAppBar: true,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          automaticallyImplyLeading: false,
          toolbarHeight: 0,
        ),
        body: Stack(
          children: [
            // --- بدون صورة خلفية: أرضية سادة بنفس canvas باقي عباداتي
            // (التحدي/الأذكار/الأدعية) ليلًا ونهارًا بلا اختلاف.
            SafeArea(
              child: Center(
                // صفحة ثابتة بدون سكرول: كل الأقسام ظاهرة دائمًا،
                // والعدّاد ياخد المساحة المتبقية ويصغر تلقائيًا.
                child: Padding(
                  padding: const EdgeInsets.only(bottom:10),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 430),
                    child: Column(
                      children: [
                        _headerRow(context),
                        Expanded(child:Padding(padding:const EdgeInsets.symmetric(horizontal:14),child:Column(children:[
                        const SizedBox(height: 7),
                        _ayahBanner(context),
                        const SizedBox(height: 7),
                        _modeRow(context),
                        const SizedBox(height: 7),
                        _dhikrChips(context, s),
                        const SizedBox(height: 4),
                        // --- العدّاد داخل دايرة الماندالا ---
                        Expanded(
                          child: Center(
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              child: _counterInMandala(context, s, progress),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        _targetRow(context, s),
                        const SizedBox(height: 7),
                        _statsRow(context, s),
                        const SizedBox(height: 8),
                        _bottomActions(context, s),
                        ]))),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- الهيدر الموحد (مكتبة HER): زر الرجوع شمال + العنوان في النص + اللوجو يمين ---
  Widget _headerRow(BuildContext context) => AppPageHeader(
                  logoOnly: true,
    title: 'السبحة',
    subtitle: 'ذكر يطمئن قلبك .. في كل وقت',
    onBack: () => Navigator.maybePop(context),
  );

  // --- بانر آية اليوم (نص فقط بدون صورة) ---
  // Content family: long-form readable surface owned centrally.
  Widget _ayahBanner(BuildContext context) => HERCard(
    role: HERCardRole.content,
    radius: 20,
    padding: const EdgeInsets.only(top: 9),
    child: Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: context.herTheme.washes.emotional,
                  borderRadius: BorderRadius.circular(11),
                  border: Border.all(color: context.herTheme.cards.border),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    HerSemanticIcon(
                      Icons.menu_book_rounded,
                      size: 14,
                      color: PhoneDesignTokens.accent,
                      accent: HerModernAccentId.lavender,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'آية اليوم',
                      style: PhoneDesignTokens.uiText(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: context.herTheme.sectionTitle,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 3),
              Text(
                'فَاذْكُرُونِي أَذْكُرْكُمْ',
                style: GoogleFonts.amiri(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: context.herTheme.bodyPrimary,
                ),
              ),
              Text(
                'سورة البقرة - 152  •  اللهم اجعلنا من الذاكرين الشاكرين 🤍',
                textAlign: TextAlign.center,
                style: PhoneDesignTokens.uiText(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w700,
                  color: context.herTheme.bodySecondary,
                ),
              ),
              const SizedBox(height: 6),
            ],
          ),
        ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: context.herTheme.washes.emotional,
            borderRadius: const BorderRadius.vertical(
              bottom: Radius.circular(20),
            ),
          ),
          child: Text(
            '❝  الذكر حياة .. به تطمئن القلوب  ❞',
            textAlign: TextAlign.center,
            style: PhoneDesignTokens.uiText(
              fontSize: 11.5,
              fontWeight: FontWeight.w900,
              color: context.herTheme.sectionTitle,
            ),
          ),
        ),
      ],
    ),
  );

  // --- وردك الخاص / لمسة واحدة (مدمج بأيقونات صغيرة) ---
  // Emphasis card uses the central Primary CTA gradient (Pink Master);
  // the companion card uses the medium content role. No local recipes.
  Widget _modeRow(BuildContext context) {
    final theme = context.herTheme;
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              gradient: theme.buttonStyles.primary.gradient(),
              borderRadius: BorderRadius.circular(15),
              boxShadow: [
                BoxShadow(
                  color: context.herTheme.actions.primary.withValues(
                    alpha: .08,
                  ),
                  blurRadius: 18,
                  offset: const Offset(0, 7),
                ),
              ],
            ),
            child: Row(
              children: [
                Icon(
                  Icons.touch_app_rounded,
                  color: context.herTheme.actions.primaryForeground,
                  size: 18,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'وردك الخاص',
                        style: PhoneDesignTokens.uiText(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w900,
                          color: context.herTheme.actions.primaryForeground,
                        ),
                      ),
                      Text(
                        'لمسة واحدة لكل تسبيحة',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: PhoneDesignTokens.uiText(
                          fontSize: 8.5,
                          fontWeight: FontWeight.w600,
                          color: context.herTheme.actions.primaryForeground
                              .withValues(alpha: .9),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 7),
        Expanded(
          child: HERCard(
            role: HERCardRole.medium,
            radius: 15,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Row(
              children: [
                HERIconContainer(
                  Icons.spa_outlined,
                  kind: HerIconKind.rose,
                  size: 34,
                  iconSize: 18,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'لمسة واحدة',
                        style: PhoneDesignTokens.uiText(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w900,
                          color: theme.sectionTitle,
                        ),
                      ),
                      Text(
                        'ركزي مع الذكر فقط',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: PhoneDesignTokens.uiText(
                          fontSize: 8.5,
                          fontWeight: FontWeight.w600,
                          color: theme.bodySecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // --- شرائح الأذكار + أدعية/صلاة على النبي ---
  Widget _dhikrChips(BuildContext context, TasbihState s) => Column(
    children: [
      SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        reverse: true,
        child: Row(
          children: presets
              .take(5)
              .map(
                (preset) => Padding(
                  padding: const EdgeInsets.only(left: 7),
                  child: _dhikrChip(
                    label: preset,
                    selected: preset == s.dhikr,
                    onTap: () => _set(s.copyWith(dhikr: preset, current: 0)),
                  ),
                ),
              )
              .toList(),
        ),
      ),
      const SizedBox(height: 7),
      Row(
        children: [
          Expanded(
            child: _wideChip(
              icon: Icons.menu_book_rounded,
              label: 'أدعية من القرآن والسنة',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const DuaLibraryScreen()),
              ),
            ),
          ),
          const SizedBox(width: 7),
          Expanded(
            child: _wideChip(
              icon: Icons.emoji_flags_rounded,
              label: 'الصلاة على النبي ﷺ',
              selected: s.dhikr == 'الصلاة على النبي ﷺ',
              onTap: () =>
                  _set(s.copyWith(dhikr: 'الصلاة على النبي ﷺ', current: 0)),
            ),
          ),
        ],
      ),
    ],
  );

  // Selectable controls — central HERChip family (selected wash +
  // border owned by the theme, no page-local chip recipe).
  // Dense metrics keep the fixed (non-scrolling) tasbih column compact.
  Widget _dhikrChip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) => HERChip(label: label, selected: selected, onTap: onTap, dense: true);

  Widget _wideChip({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool selected = false,
  }) => Center(
    child: HERChip(
      label: label,
      icon: icon,
      selected: selected,
      onTap: onTap,
      dense: true,
    ),
  );

  // --- العدّاد شفّاف داخل دايرة الماندالا (جزء منها) ---
  Widget _counterInMandala(
    BuildContext context,
    TasbihState s,
    double progress,
  ) => LayoutBuilder(
    builder: (context, constraints) {
      final size = math.min(288.0, constraints.maxWidth - 90);
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // أزرار الصوت والاهتزاز (زجاجية صغيرة على الشمال)
          SizedBox(
            width: 72,
            child: Column(
              children: [
                _miniToggle(
                  icon: s.soundEnabled
                      ? Icons.volume_up_rounded
                      : Icons.volume_off_rounded,
                  label: 'صوت\nهادئ',
                  enabled: s.soundEnabled,
                  onTap: () => _set(s.copyWith(soundEnabled: !s.soundEnabled)),
                ),
                const SizedBox(height: 8),
                _miniToggle(
                  icon: s.hapticEnabled
                      ? Icons.vibration_rounded
                      : Icons.phone_android_rounded,
                  label: 'اهتزاز\nخفيف',
                  enabled: s.hapticEnabled,
                  onTap: () =>
                      _set(s.copyWith(hapticEnabled: !s.hapticEnabled)),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // الدايرة: حلقة تقدّم رفيعة + هالة بيضاء شفافة
          // لتندمج مع ماندالا الخلفية بدل تغطيتها.
          GestureDetector(
            onTap: _tap,
            child: ScaleTransition(
              scale: Tween(begin: 1.0, end: .95).animate(
                CurvedAnimation(parent: controller, curve: Curves.easeOut),
              ),
              child: Semantics(
                button: true,
                label: 'عدّاد ${s.dhikr}. ${s.current} من ${s.target}',
                child: SizedBox(
                  width: size,
                  height: size,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // هالة بسطح الثيم (معتم ليلًا، أبيض شفاف نهارًا)
                      // لقراءة الأرقام فوق أي خلفية بنفس لغة HERCard.
                      ThemeRoleBackdrop(
                        role: 'counter',
                        radius: 22,
                        child: Container(
                          width: size - 46,
                          height: size - 46,
                          decoration: AppDecorations.componentCardFor(
                            context.herTheme,
                            'counter',
                            radius: (size - 46) / 2,
                            elevated: false,
                          ),
                        ),
                      ),
                      // زخرفة ماندالا إضافية تندمج مع دايرة الصورة
                      CustomPaint(
                        size: Size.square(size),
                        painter: _MandalaRingPainter(
                          color: context.herTheme.status.gold.withValues(
                            alpha: .30,
                          ),
                        ),
                      ),
                      SizedBox(
                        width: size - 30,
                        height: size - 30,
                        child: CircularProgressIndicator(
                          value: progress,
                          strokeWidth: 7,
                          strokeCap: StrokeCap.round,
                          color: PhoneDesignTokens.accent,
                          backgroundColor: PhoneDesignTokens.accent
                              .withValues(alpha: .12),
                        ),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            s.dhikr,
                            textAlign: TextAlign.center,
                            style: PhoneDesignTokens.uiText(
                              fontSize: 19,
                              fontWeight: FontWeight.w900,
                              color: context.herTheme.sectionTitle,
                            ),
                          ),
                          Text(
                            '${s.current}',
                            textDirection: TextDirection.ltr,
                            style: PhoneDesignTokens.uiText(
                              fontSize: 56,
                              height: 1.0,
                              fontWeight: FontWeight.w900,
                              color: PhoneDesignTokens.accent,
                            ),
                          ),
                          Container(
                            width: 74,
                            height: 1.5,
                            color: context.herTheme.cards.border,
                          ),
                          const SizedBox(height: 5),
                          Text(
                            'من ${s.target}',
                            style: PhoneDesignTokens.uiText(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: context.herTheme.bodySecondary,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            s.current >= s.target ? 'أحسنتَ 🤍' : 'اضغط للعد',
                            style: PhoneDesignTokens.uiText(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: context.herTheme.bodySecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      );
    },
  );

  // Small toggles — small content role + semantic glyph roles.
  // No page-local card recipe, no local alpha.
  Widget _miniToggle({
    required IconData icon,
    required String label,
    required bool enabled,
    required VoidCallback onTap,
  }) {
    final theme = context.herTheme;
    return HERCard(
      role: HERCardRole.small,
      radius: 16,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 22,
            color: enabled
                ? PhoneDesignTokens.accent
                : theme.states.unselectedForeground,
          ),
          const SizedBox(height: 3),
          Text(
            label,
            textAlign: TextAlign.center,
            style: PhoneDesignTokens.uiText(
              fontSize: 9.5,
              height: 1.25,
              fontWeight: FontWeight.w800,
              color: theme.sectionTitle,
            ),
          ),
        ],
      ),
    );
  }

  // --- أهداف العد 33/34/100/مخصص ---
  Widget _targetRow(BuildContext context, TasbihState s) =>
      SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        reverse: true,
        child: Row(
          children: [
            for (final target in [33, 34, 100])
              Padding(
                padding: const EdgeInsets.only(left: 8),
                child: _targetChip(
                  label: '$target',
                  selected: s.target == target,
                  onTap: () => _set(s.copyWith(target: target, current: 0)),
                ),
              ),
            _targetChip(
              label: (s.target == 33 || s.target == 34 || s.target == 100)
                  ? '⚙ مخصص'
                  : '${s.target} ✎',
              selected: s.target != 33 && s.target != 34 && s.target != 100,
              onTap: () => _customTarget(s),
            ),
          ],
        ),
      );

  Widget _targetChip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) => HERChip(label: label, selected: selected, onTap: onTap, dense: true);

  // --- أهدافي اليوم / سجل اليوم / مشاركة الأجر ---
  // Medium content role for all three; progress uses the primary action +
  // central emotional wash (no local alpha on card surfaces).
  Widget _statsRow(BuildContext context, TasbihState s) {
    final theme = context.herTheme;
    final goalProgress = (s.completedTargets / 5).clamp(0.0, 1.0);
    return Row(
      children: [
        Expanded(
          child: _statCard(
            title: 'أهدافي اليوم',
            child: Column(
              children: [
                SizedBox(
                  width: 56,
                  height: 56,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CircularProgressIndicator(
                        value: goalProgress,
                        strokeWidth: 7,
                        color: PhoneDesignTokens.accent,
                        backgroundColor: theme.washes.emotional,
                      ),
                      Text(
                        '${s.completedTargets}/5',
                        textDirection: TextDirection.ltr,
                        style: PhoneDesignTokens.uiText(
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: theme.sectionTitle,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'أذكار مكتملة',
                  style: PhoneDesignTokens.uiText(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: theme.bodySecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _statCard(
            title: 'سجل اليوم',
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [_bar(10, .45), _bar(16, .7), _bar(24, 1.0)],
                ),
                const SizedBox(height: 4),
                Text(
                  '${s.completedTargets} أذكار',
                  style: PhoneDesignTokens.uiText(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: theme.sectionTitle,
                  ),
                ),
                Text(
                  'إجمالي التسبيحات ${s.dailyTotal}',
                  textAlign: TextAlign.center,
                  style: PhoneDesignTokens.uiText(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: theme.bodySecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _statCard(
            title: 'مشاركة الأجر',
            onTap: () => _shareReward(s),
            child: Column(
              children: [
                // Central icon family: rose kind owns container + glyph.
                const HERIconContainer(
                  Icons.favorite_rounded,
                  kind: HerIconKind.rose,
                  size: 46,
                  iconSize: 22,
                ),
                const SizedBox(height: 4),
                Text(
                  'أهدي ثواب هذا الذكر لمن تحب',
                  textAlign: TextAlign.center,
                  style: PhoneDesignTokens.uiText(
                    fontSize: 9,
                    height: 1.35,
                    fontWeight: FontWeight.w700,
                    color: theme.bodySecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _bar(double h, double fill) {
    final theme = context.herTheme;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 2.5),
      width: 9,
      height: 26,
      decoration: BoxDecoration(
        color: theme.washes.emotional,
        borderRadius: BorderRadius.circular(6),
      ),
      alignment: Alignment.bottomCenter,
      child: Container(
        height: h * fill + 4,
        decoration: BoxDecoration(
          color: PhoneDesignTokens.accent,
          borderRadius: BorderRadius.circular(6),
        ),
      ),
    );
  }

  Widget _statCard({
    required String title,
    required Widget child,
    VoidCallback? onTap,
  }) => HERCard(
    role: HERCardRole.medium,
    radius: 18,
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
    onTap: onTap,
    child: Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Flexible(
              child: Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: PhoneDesignTokens.uiText(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  color: context.herTheme.sectionTitle,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        child,
      ],
    ),
  );

  // --- إعادة العد + اضغط للعد ---
  // Central button family: secondary reset + primary counter CTA.
  Widget _bottomActions(BuildContext context, TasbihState s) => Column(
    children: [
      const SizedBox(height: 8),
      Row(
        children: [
          Expanded(
            child: HERSecondaryButton(
              label: 'إعادة العد',
              icon: Icons.restart_alt_rounded,
              onPressed: () => _set(s.copyWith(current: 0)),
            ),
          ),
          const SizedBox(width: 9),
          Expanded(
            flex: 2,
            // Phase 1.5: owned by `buttonStyles.primary`; original metrics
            // (w900 label, 24 icon) preserved via parameters, not local style.
            child: HERPrimaryButton(
              label: 'اضغط للعد',
              icon: Icons.touch_app_rounded,
              onPressed: _tap,
              height: 50,
              radius: 22,
              fontWeight: FontWeight.w900,
              iconSize: 24,
              expanded: false,
            ),
          ),
        ],
      ),
    ],
  );

  // NOTE: legacy in-tasbih challenge card removed (zero-consumer verified).
  // The weekly challenge lives in TasbihChallengeScreen only.
}

/// حلقة ماندالا رفيعة مزدوجة تندمج مع دايرة الخلفية.
class _MandalaRingPainter extends CustomPainter {
  _MandalaRingPainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.shortestSide / 2;
    final outer = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    final inner = Paint()
      ..color = color.withValues(alpha: .7)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    canvas.drawCircle(center, radius - 4, outer);
    canvas.drawCircle(center, radius - 12, inner);
    // لمسات زخرفية خفيفة حول الدايرة (12 ورقة)
    final petal = Paint()
      ..color = color.withValues(alpha: .55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    for (var i = 0; i < 24; i++) {
      final angle = (i / 24) * math.pi * 2;
      final p1 = Offset(
        center.dx + (radius - 4) * math.cos(angle),
        center.dy + (radius - 4) * math.sin(angle),
      );
      final p2 = Offset(
        center.dx + (radius + 7) * math.cos(angle + .09),
        center.dy + (radius + 7) * math.sin(angle + .09),
      );
      canvas.drawLine(p1, p2, petal);
    }
  }

  @override
  bool shouldRepaint(covariant _MandalaRingPainter oldDelegate) =>
      oldDelegate.color != color;
}
