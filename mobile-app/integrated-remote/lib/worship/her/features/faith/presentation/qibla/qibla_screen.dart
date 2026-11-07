import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/widgets/her_components.dart';
import '../../../../core/services/device_feedback_service.dart';
import '../../../../core/data/remote_content_repository.dart';
import '../../data/faith_repository.dart';
import '../../data/prayer_calculation_service.dart';
import '../../../../core/widgets/app_page_header.dart';
import '../widgets/faith_shared.dart';

class QiblaScreen extends StatefulWidget {
  const QiblaScreen({super.key, required this.settings});
  final FaithSettings settings;
  @override
  State<QiblaScreen> createState() => _QiblaScreenState();
}

class _QiblaScreenState extends State<QiblaScreen> with WidgetsBindingObserver {
  StreamSubscription<CompassEvent>? subscription;
  CompassEvent? event;
  bool aligned = false;
  String _qiblaTitle = '';
  String _qiblaReference = 'البقرة • 144';
  String _qiblaText =
      'قَدْ نَرَىٰ تَقَلُّبَ وَجْهِكَ فِي السَّمَاءِ ۖ فَلَنُوَلِّيَنَّكَ قِبْلَةً تَرْضَاهَا ۚ فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ ۚ وَحَيْثُ مَا كُنتُمْ فَوَلُّوا وُجُوهَكُمْ شَطْرَهُ ۗ وَإِنَّ الَّذِينَ أُوتُوا الْكِتَابَ لَيَعْلَمُونَ أَنَّهُ الْحَقُّ مِن رَّبِّهِمْ ۗ وَمَا اللَّهُ بِغَافِلٍ عَمَّا يَعْمَلُونَ';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(_loadQiblaVerse());
    _startCompass();
  }

  void _startCompass() {
    if(kIsWeb)return;
    if (subscription != null) return;
    subscription = FlutterCompass.events?.listen((value) {
      final bearing = PrayerCalculationService.instance.qiblaBearing(
        widget.settings,
      );
      final heading = value.heading;
      final isAligned = heading != null && qiblaDelta(bearing, heading) <= 8;
      // One clear acknowledgement when the pointer reaches the direction;
      // do not repeatedly vibrate while the phone stays aligned.
      if (isAligned && !aligned) {
        // selectionClick/mediumImpact can be imperceptible on several Android
        // motors. A single full vibration is clearer, while the guard keeps it
        // from repeating until the user leaves the correct direction.
        unawaited(DeviceFeedbackService.instance.vibrate(durationMs: 170));
      }
      if (mounted) {
        setState(() {
          event = value;
          aligned = isAligned;
        });
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startCompass();
    } else {
      // The compass is useful only while its screen is visible. Releasing its
      // sensor stream makes the page inert when HER is backgrounded.
      unawaited(subscription?.cancel() ?? Future<void>.value());
      subscription = null;
    }
  }

  Future<void> _loadQiblaVerse() async {
    final remote = await RemoteContentRepository.instance.loadItems(
      'faith_daily_card',
    );
    if (!mounted || remote == null) return;
    final items = remote
        .where((card) => card['categoryId'] == 'qibla_verse')
        .toList();
    if (items.isEmpty) return;
    final item = items.first;
    final reference = (item['subtitleAr'] as String? ?? '').trim();
    final text = (item['bodyAr'] as String? ?? '').trim();
    if (text.isEmpty) return;
    setState(() {
      // This card deliberately presents the verse without a separate heading.
      _qiblaTitle = '';
      if (reference.isNotEmpty) _qiblaReference = reference;
      _qiblaText = text;
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bearing = PrayerCalculationService.instance.qiblaBearing(
      widget.settings,
    );
    final heading = event?.heading;
    final accuracy = event?.accuracy;
    final theme = context.herTheme;
    final dark = theme.surfaces.background.computeLuminance() < .42;
    final alignmentGlow = HSLColor.fromColor(
      theme.status.success,
    ).withSaturation(.85).withLightness(dark ? .62 : .46).toColor();
    final unavailable = event == null || heading == null;
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              AppPageHeader(
                  logoOnly: true,
                title: 'اتجاه القبلة',
                subtitle: 'وجّه وجهك شطر المسجد الحرام',
                onBack: () => Navigator.maybePop(context),
              ),
              Expanded(
                child: Stack(
                  children: [
                    Center(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 24,
                        ),
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 380),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _qiblaVerse(context),
                              const SizedBox(height: 16),
                              // City pill — central selectable-control family
                              // (no feature-local rose recipe).
                              HERChip(
                                label: widget.settings.city,
                                icon: Icons.location_on_rounded,
                                dense: true,
                              ),
                              const SizedBox(height: 20),
                              LayoutBuilder(
                                builder: (context, constraints) {
                                  final dialSize = math.min(
                                    300.0,
                                    constraints.maxWidth,
                                  );
                                  return AnimatedContainer(
                                    duration: const Duration(milliseconds: 250),
                                    width: dialSize,
                                    height: dialSize,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      // HER calm wash (approved blush gradient);
                                      // ring + needle use HER rose/sage hues.
                                      gradient: aligned
                                          ? RadialGradient(
                                              colors: [
                                                theme.surfaces.surface,
                                                alignmentGlow.withValues(
                                                  alpha: .18,
                                                ),
                                              ],
                                            )
                                          : LinearGradient(
                                              colors: [
                                                theme.washes.emotional,
                                                theme.washes.neutral,
                                              ],
                                            ),
                                      border: Border.all(
                                        color: aligned
                                            ? alignmentGlow
                                            : context
                                                  .herTheme
                                                  .palette
                                                  .iconCreamGlyphColor,
                                        width: aligned ? 6 : 4,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color:
                                              (aligned
                                                      ? alignmentGlow
                                                      : roseIcon)
                                                  .withValues(
                                                    alpha: aligned ? .65 : .16,
                                                  ),
                                          blurRadius: aligned ? 40 : 14,
                                          spreadRadius: aligned ? 7 : 0,
                                        ),
                                      ],
                                    ),
                                    child: Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        Positioned.fill(child: CustomPaint(
                                          painter: _QiblaDialPainter(
                                            lineColor: context
                                                .herTheme
                                                .headingPrimary
                                                .withValues(alpha: .32),
                                            accentColor: aligned
                                                ? alignmentGlow
                                                : context
                                                      .herTheme
                                                      .palette
                                                      .iconCreamGlyphColor,
                                          ),
                                        )),
                                        for (final x in const [
                                          ('N', Alignment.topCenter),
                                          ('E', Alignment.centerRight),
                                          ('S', Alignment.bottomCenter),
                                          ('W', Alignment.centerLeft),
                                        ])
                                          Align(
                                            alignment: x.$2,
                                            child: Padding(
                                              padding: const EdgeInsets.all(18),
                                              child: Text(
                                                x.$1,
                                                style: faithText(
                                                  context,
                                                  13,
                                                  FontWeight.w900,
                                                  context.herTheme.bodyPrimary,
                                                ),
                                              ),
                                            ),
                                          ),
                                        Transform.rotate(
                                          angle:
                                              ((heading ?? 0) - bearing) *
                                              math.pi /
                                              180,
                                          child: Icon(
                                            Icons.navigation_rounded,
                                            size: 112,
                                            color: aligned
                                                ? alignmentGlow
                                                : PhoneDesignTokens.accent,
                                            shadows: aligned
                                                ? [
                                                    Shadow(
                                                      color: alignmentGlow
                                                          .withValues(
                                                            alpha: .55,
                                                          ),
                                                      blurRadius: 18,
                                                    ),
                                                  ]
                                                : null,
                                          ),
                                        ),
                                        Positioned(
                                          top: 39,
                                          child: Text(
                                            '✦',
                                            style: TextStyle(
                                              fontSize: 24,
                                              color: aligned
                                                  ? alignmentGlow
                                                  : context
                                                        .herTheme
                                                        .palette
                                                        .iconCreamGlyphColor,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                              const SizedBox(height: 20),
                              // Degree card — content family (role owns
                              // surface/opacity/border); dial stays special.
                              HERCard(
                                role: HERCardRole.medium,
                                radius: 22,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 12,
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'اتجاه القبلة',
                                      style: faithText(
                                        context,
                                        12,
                                        FontWeight.w800,
                                        context.herTheme.bodySecondary,
                                      ),
                                    ),
                                    Text(
                                      '${bearing.round()}°',
                                      textDirection: TextDirection.ltr,
                                      style: faithText(
                                        context,
                                        26,
                                        FontWeight.w900,
                                        context.herTheme.headingPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                aligned
                                    ? 'أنتَ الآن باتجاه القبلة 🕋'
                                    : unavailable
                                    ? 'البوصلة غير متاحة على هذا الجهاز.'
                                    : 'حرّكي الهاتف بهدوء حتى تتطابق العلامة.',
                                style: faithText(
                                  context,
                                  12,
                                  FontWeight.w600,
                                  aligned
                                      ? context.herTheme.headingPrimary
                                      : context.herTheme.bodySecondary,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              if (accuracy != null && accuracy > 20)
                                Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: Text(
                                    'حرّكي الهاتف على شكل 8 لتحسين دقة البوصلة.',
                                    style: faithText(
                                      context,
                                      11,
                                      FontWeight.w700,
                                      context
                                          .herTheme
                                          .palette
                                          .iconCreamGlyphColor,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              if (unavailable)
                                Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: Text(
                                    'يمكنك استخدام الدرجة المعروضة كاتجاه خريطة من موقعك إلى الكعبة.',
                                    style: faithText(
                                      context,
                                      11,
                                      FontWeight.w600,
                                      context.herTheme.headingPrimary,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                            ],
                          ),
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

  // Verse card — content family (long-form readable surface owned
  // centrally). Compass artwork below stays special and untouched.
  Widget _qiblaVerse(BuildContext context) => HERCard(
    role: HERCardRole.content,
    radius: 24,
    padding: const EdgeInsets.fromLTRB(22, 28, 22, 20),
    child: Column(
      children: [
        if (_qiblaTitle.trim().isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              HERIconContainer(
                Icons.auto_stories_rounded,
                kind: HerIconKind.knowledge,
                size: 34,
                iconSize: 17,
              ),
              const SizedBox(width: 7),
              Text(
                _qiblaTitle,
                style: faithText(
                  context,
                  11,
                  FontWeight.w800,
                  context.herTheme.cardTitle,
                ),
              ),
            ],
          ),
          const SizedBox(height: 9),
        ],
        Text(
          _qiblaText,
          softWrap: true,
          textDirection: TextDirection.rtl,
          textHeightBehavior: const TextHeightBehavior(
            applyHeightToFirstAscent: true,
            applyHeightToLastDescent: true,
          ),
          textAlign: TextAlign.center,
          style: GoogleFonts.amiri(
            fontSize: 18,
            height: 1.72,
            fontWeight: FontWeight.w700,
            color: context.herTheme.bodyPrimary,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          _qiblaReference,
          style: faithText(
            context,
            10,
            FontWeight.w700,
            context.herTheme.bodySecondary,
          ),
        ),
      ],
    ),
  );
}

/// A lightweight, responsive dial instead of a bitmap. It stays crisp on
/// every phone size and gives the qibla screen a distinct focal point.
class _QiblaDialPainter extends CustomPainter {
  const _QiblaDialPainter({required this.lineColor, required this.accentColor});
  final Color lineColor;
  final Color accentColor;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.shortestSide / 2;
    final fine = Paint()
      ..color = lineColor
      ..strokeWidth = 1;
    final strong = Paint()
      ..color = accentColor.withValues(alpha: .7)
      ..strokeWidth = 2;
    for (var i = 0; i < 72; i++) {
      final angle = i * math.pi * 2 / 72 - math.pi / 2;
      final outer = Offset(
        center.dx + math.cos(angle) * (radius - 12),
        center.dy + math.sin(angle) * (radius - 12),
      );
      final innerRadius = radius - (i % 9 == 0 ? 31 : 22);
      final inner = Offset(
        center.dx + math.cos(angle) * innerRadius,
        center.dy + math.sin(angle) * innerRadius,
      );
      canvas.drawLine(outer, inner, i % 9 == 0 ? strong : fine);
    }
    canvas.drawCircle(
      center,
      radius - 47,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5
        ..color = lineColor,
    );
    canvas.drawCircle(
      center,
      radius - 82,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..color = lineColor.withValues(alpha: .55),
    );
    for (var i = 0; i < 8; i++) {
      final angle = i * math.pi / 4;
      final a = Offset(
        center.dx + math.cos(angle) * 88,
        center.dy + math.sin(angle) * 88,
      );
      final b = Offset(
        center.dx + math.cos(angle + math.pi / 2) * 45,
        center.dy + math.sin(angle + math.pi / 2) * 45,
      );
      canvas.drawLine(
        a,
        b,
        Paint()
          ..color = lineColor.withValues(alpha: .4)
          ..strokeWidth = 1,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _QiblaDialPainter oldDelegate) =>
      oldDelegate.lineColor != lineColor ||
      oldDelegate.accentColor != accentColor;
}
