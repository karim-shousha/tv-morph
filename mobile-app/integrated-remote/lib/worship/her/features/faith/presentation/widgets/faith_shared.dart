import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_decorations.dart';
import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/theme/theme_palette.dart';
import '../../../../core/widgets/app_page_header.dart';
import '../../../../core/widgets/her_components.dart';

// Shared UI helpers extracted verbatim from prayer_dashboard_screen.dart
// (rename-only: _x -> public name, no layout/behavior change).
// Challenge color system shared by the dashboard and its tiles
// (same rose family as TasbihChallengeScreen — HER semantic tokens so CMS
// theme changes show through).
// Prayer core → rose primary actions; headings burgundy; secondary muted.
Color get roseInk => HerThemeEngine.current.bodyPrimary;
Color get roseSub => HerThemeEngine.current.bodySecondary;
Color get roseIcon => HerThemeEngine.current.headingPrimary;
Color get roseChip => HerThemeEngine.current.washes.neutral;
Color get roseBorder => HerThemeEngine.current.cards.border;

/// Prayer controls follow the current action fill and neutral surface.
/// Older published switch tokens can still carry the pale pink identity tint.
HerSwitchStyle faithPrayerSwitchStyle(BuildContext context) =>
    context.herTheme.switchStyle;

/// Shared worship-card surface. It takes the visible pink wash and
/// transparency from the same CMS token as «رحلتك اليوم», so Faith does not
/// carry a separate hard-coded cream/white recipe. The Tasbih screen
/// intentionally does not use this helper because it has its own language.
Color faithCreamSurface(
  BuildContext context, [
  HerIconKind kind = HerIconKind.rose,
]) => herJourneyCardColorOf(context.herTheme, kind);

/// Translucent rose card used across the dashboard (no opaque white).
///
/// Tone translucent so seasonal/dark theme backgrounds breathe through
/// instead of being covered by flat white.
BoxDecoration roseCardDeco({double radius = 22, bool elevated = true}) =>
    AppDecorations.roseCard(radius: radius, elevated: elevated);

List<Widget> faithBackActions(BuildContext context) => [
  Padding(
    padding: const EdgeInsetsDirectional.only(end: 12),
    child: HerBackButton(onPressed: () => Navigator.maybePop(context)),
  ),
];

Widget faithHeaderMark() => IgnorePointer(
  child: Padding(
    padding: const EdgeInsetsDirectional.only(start: 8),
    child: Image.asset(
      'assets/morph-wordmark-hq.webp',
      fit: BoxFit.contain,
      alignment: Alignment.centerRight,
    ),
  ),
);

BoxDecoration faithCard(
  BuildContext c,
  Color color, {
  bool elevated = false,
  bool glass = false,
}) => AppDecorations.componentCardFor(
  c.herTheme,
  'secondaryCard',
  radius: PhoneDesignTokens.cardRadius,
  elevated: elevated,
);

TextStyle faithText(
  BuildContext c,
  double size,
  FontWeight weight, [
  Color? color,
]) => TextStyle(
  fontFamily: 'MorphSans',
  fontSize: size <= 12
      ? PhoneDesignTokens.captionSize
      : size <= 16
      ? PhoneDesignTokens.bodySize
      : size <= 20
      ? PhoneDesignTokens.sectionSize
      : size <= 24
      ? PhoneDesignTokens.titleSize
      : size,
  fontWeight: weight,
  color:
      size <= 22 &&
          weight.value >= FontWeight.w800.value &&
          (color == null || color == HerThemeEngine.current.bodyPrimary)
      ? HerThemeEngine.current.sectionTitle
      : color ?? HerThemeEngine.current.bodyPrimary,
  height: 1.35,
);
String faithDuration(Duration v) {
  if (v.isNegative) return '00:00:00';
  String pad(int n) => n.toString().padLeft(2, '0');
  return '${pad(v.inHours)}:${pad(v.inMinutes.remainder(60))}:${pad(v.inSeconds.remainder(60))}';
}

String faithFormatTime(DateTime d) {
  var hour = d.hour % 12;
  if (hour == 0) hour = 12;
  return '$hour:${d.minute.toString().padLeft(2, '0')} ${d.hour < 12 ? 'ص' : 'م'}';
}

double qiblaDelta(double a, double b) {
  final d = (a - b).abs() % 360;
  return d > 180 ? 360 - d : d;
}

class FaithImportanceSlide {
  const FaithImportanceSlide(this.title, this.body, this.reference);
  final String title;
  final String body;
  final String reference;
}
