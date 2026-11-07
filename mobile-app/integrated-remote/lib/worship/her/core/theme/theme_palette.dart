import 'readable_theme_recipe.dart';
import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';
import 'optimized_image_assets.dart';

/// The visual contract for one reusable UI layer.
///
/// Phase 0: the contract covers the full family recipe — surface gradient +
/// opacity, border (color/opacity/width), radius, and shadow
/// (color/opacity/blur/offset). Every field is optional in CMS JSON and falls
/// back to the Pink Master recipe, so old published themes keep rendering
/// exactly as before.
class ThemeComponentStyle {
  const ThemeComponentStyle({
    required this.gradientStart,
    required this.gradientEnd,
    required this.border,
    required this.opacity,
    this.borderOpacity = 1,
    this.glyphColor,
    this.borderWidth = 1,
    this.radius = 22,
    this.shadowColor = const Color(0x00000000),
    this.shadowOpacity = 0,
    this.shadowBlur = 18,
    this.shadowOffsetX = 0,
    this.shadowOffsetY = 7,
    this.backdropBlur,
    this.gradientDirection,
  });

  final Color gradientStart;
  final Color gradientEnd;
  final Color border;
  final double opacity;
  final double borderOpacity;

  /// Only used by the centrally owned normal icon-circle recipe. Null keeps
  /// the Pink Master primary glyph derivation for legacy theme payloads.
  final Color? glyphColor;
  final double borderWidth;
  final double radius;
  final Color shadowColor;
  final double shadowOpacity;
  final double shadowBlur;
  final double shadowOffsetX;
  final double shadowOffsetY;

  /// Optional glass blur in logical pixels. Null preserves legacy rendering;
  /// zero explicitly disables blur for this component.
  final double? backdropBlur;
  final String? gradientDirection;

  factory ThemeComponentStyle.fromJson(
    Object? value, {
    required ThemeComponentStyle fallback,
  }) {
    final json = value is Map ? value : const <String, dynamic>{};
    double number(String key, double or) {
      final v = json[key];
      final n = v is num ? v.toDouble() : double.tryParse('$v');
      return n ?? or;
    }

    return ThemeComponentStyle(
      gradientStart: ThemePalette._parseColor(
        json['gradientStart'],
        fallback.gradientStart,
      ),
      gradientEnd: ThemePalette._parseColor(
        json['gradientEnd'],
        fallback.gradientEnd,
      ),
      border: ThemePalette._parseColor(json['border'], fallback.border),
      opacity: ThemePalette._opacity(json['opacity'], fallback.opacity),
      borderOpacity: ThemePalette._opacity(
        json['borderOpacity'],
        fallback.borderOpacity,
      ),
      glyphColor: json['glyphColor'] == null
          ? fallback.glyphColor
          : ThemePalette._parseColor(
              json['glyphColor'],
              fallback.glyphColor ?? fallback.gradientStart,
            ),
      borderWidth: number('borderWidth', fallback.borderWidth),
      radius: number('radius', fallback.radius),
      shadowColor: ThemePalette._parseColor(
        json['shadowColor'],
        fallback.shadowColor,
      ),
      shadowOpacity: number('shadowOpacity', fallback.shadowOpacity),
      shadowBlur: number('shadowBlur', fallback.shadowBlur),
      shadowOffsetX: number('shadowOffsetX', fallback.shadowOffsetX),
      shadowOffsetY: number('shadowOffsetY', fallback.shadowOffsetY),
      gradientDirection:
          const {
            'rightToLeft',
            'leftToRight',
            'vertical',
          }.contains(json['gradientDirection'])
          ? json['gradientDirection'] as String
          : fallback.gradientDirection,
      backdropBlur: json['backdropBlur'] == null
          ? fallback.backdropBlur
          : number(
              'backdropBlur',
              fallback.backdropBlur ?? 0,
            ).clamp(0, 24).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'gradientStart': ThemePalette._toHex(gradientStart),
    'gradientEnd': ThemePalette._toHex(gradientEnd),
    'border': ThemePalette._toHex(border),
    'opacity': opacity,
    'borderOpacity': borderOpacity,
    if (glyphColor != null) 'glyphColor': ThemePalette._toHex(glyphColor!),
    'borderWidth': borderWidth,
    'radius': radius,
    'shadowColor': ThemePalette._toHex(shadowColor),
    'shadowOpacity': shadowOpacity,
    'shadowBlur': shadowBlur,
    'shadowOffsetX': shadowOffsetX,
    'shadowOffsetY': shadowOffsetY,
    if (gradientDirection != null) 'gradientDirection': gradientDirection,
    if (backdropBlur != null) 'backdropBlur': backdropBlur,
  };
}

AlignmentGeometry themeGradientBegin(
  String? direction,
  AlignmentGeometry fallback,
) => switch (direction) {
  'rightToLeft' => Alignment.centerRight,
  'leftToRight' => Alignment.centerLeft,
  'vertical' => Alignment.topCenter,
  _ => fallback,
};
AlignmentGeometry themeGradientEnd(
  String? direction,
  AlignmentGeometry fallback,
) => switch (direction) {
  'rightToLeft' => Alignment.centerLeft,
  'leftToRight' => Alignment.centerRight,
  'vertical' => Alignment.bottomCenter,
  _ => fallback,
};

/// The remote theme only accepts named colour tokens. It never carries layout,
/// code, fonts, or arbitrary assets, keeping a CMS update safe for the app.
class ThemePalette {
  const ThemePalette({
    required this.name,
    this.presetVersion = 2,
    this.controlSchemaVersion = 0,
    required this.primary,
    required this.primaryDark,
    required this.primaryLight,
    required this.background,
    required this.surface,
    required this.headerColor,
    required this.border,
    required this.textPrimary,
    required this.textSecondary,
    this.sectionTitleColor,
    // Phase 0: CMS-driven semantic text roles. Null keeps the current
    // derivation (headingPrimary→primary, secondary headings/titles→
    // secondary, body→text.*, caption→text.secondary, onPrimary→button text).
    this.headingPrimaryColor,
    this.headingSecondaryColor,
    this.heroTitleColor,
    this.heroSubtitleColor,
    this.cardTitleColor,
    this.cardSubtitleColor,
    this.sectionSubtitleColor,
    this.bodyPrimaryColor,
    this.bodySecondaryColor,
    this.captionColor,
    this.devotionalTextColor,
    this.onPrimaryColor,
    this.headerTitleColor,
    this.headerHerColor,
    this.headerSubtitleColor,
    required this.pinkSection,
    required this.greenSection,
    required this.purpleSection,
    required this.blueSection,
    required this.peachSection,
    this.accent,
    this.buttonTextColor,
    // Pink Master primary-button pin (#D16F8E). Optional per-palette
    // override; absent (incl. all seasonal presets) keeps the legacy
    // derived CTA. Only the fallback preset sets it today.
    this.primaryButtonColor,
    this.primaryButtonGradientStartColor,
    this.primaryButtonTextColor,
    this.primaryButtonIconColor,
    this.primaryButtonIconBackgroundColor,
    this.primaryButtonBorderColor,
    // Phase 0: secondary + danger button tokens. Null keeps the current
    // recipes (secondary = card surface + secondary fg; danger = solid
    // secondary + white).
    this.secondaryButtonColor,
    this.secondaryButtonTextColor,
    this.secondaryButtonIconColor,
    this.secondaryButtonBorderColor,
    this.dangerButtonColor,
    this.dangerButtonTextColor,
    this.videoActionColor = const Color(0xFF90243C),
    this.videoActionTextColor = Colors.white,
    this.videoActionBorderColor = const Color(0xFF90243C),
    this.profileCardColor = const Color(0xFFFFF8FA),
    this.profileHeroStartColor = const Color(0xFFFCEEF2),
    this.profileHeroEndColor = const Color(0xFFFFFEFE),
    this.profileActionColor = const Color(0xFF90243C),
    this.profileActionTextColor = Colors.white,
    this.profileStatSurfaceColor = const Color(0xFFF5DFE7),
    this.profileStatTextColor = const Color(0xFF90243C),
    this.iconColor = Colors.white,
    this.iconBackgroundColor = const Color(0xFF6F7B5F),
    // Legacy Control Center compatibility. New components must use
    // [iconStyle] / semantic icon kinds instead of these duplicate slots.
    this.iconPinkBackgroundColor = const Color(0xFFC86F8A),
    this.iconCreamBackgroundColor = const Color(0xFFF4E0D3),
    this.iconCreamGlyphColor = const Color(0xFFD2A13E),
    this.sideIconColor,
    this.sideIconBackgroundColor,
    this.fitnessStepsIconColor,
    this.fitnessStepsCircleColor,
    this.fitnessStepsIconOpacity = 1,
    this.fitnessStepsCircleOpacity = 1,
    this.fitnessCaloriesIconColor,
    this.fitnessCaloriesCircleColor,
    this.fitnessCaloriesIconOpacity = 1,
    this.fitnessCaloriesCircleOpacity = 1,
    this.fitnessWorkoutIconColor,
    this.fitnessWorkoutCircleColor,
    this.fitnessWorkoutIconOpacity = 1,
    this.fitnessWorkoutCircleOpacity = 1,
    this.fitnessNutritionIconColor,
    this.fitnessNutritionCircleColor,
    this.fitnessNutritionIconOpacity = 1,
    this.fitnessNutritionCircleOpacity = 1,
    this.iconOpacity = 1,
    this.iconBackgroundOpacity = .92,
    this.iconCircleSize = 28,
    this.iconGlyphSize = 14,
    this.backgroundOverlayOpacity = .08,
    this.cardOpacity = 1,
    this.secondaryCardOpacity = .94,
    this.headerOpacity = .92,
    this.sectionOpacity = .94,
    this.navigationOpacity = .96,
    this.navigationColor = const Color(0xFFC86F8A),
    this.navigationGradientStartColor,
    this.navigationGradientEndColor,
    this.navigationBorderColor,
    this.navigationBorderOpacity = .22,
    this.navigationTextColor = Colors.white,
    this.navigationActiveColor,
    this.navigationInactiveColor,
    this.journeyWaterFillColor = const Color(0xFF3CAED2),
    // Phase 0: centralized state tokens (selected/unselected/disabled/
    // pressed). Colors are nullable CMS overrides; Pink Master derivations
    // in HerThemeData apply when absent. Opacities carry safe defaults.
    this.selectedSurfaceColor,
    this.selectedForegroundColor,
    this.selectedBorderColor,
    this.unselectedSurfaceColor,
    this.unselectedForegroundColor,
    this.unselectedBorderColor,
    this.disabledOpacity = .55,
    this.pressedOverlayOpacity = .12,
    // Phase 0: switch + tab styling tokens (same nullable-override model).
    this.switchTrackSelectedColor,
    this.switchThumbSelectedColor,
    this.switchTrackUnselectedColor,
    this.switchThumbUnselectedColor,
    this.switchBorderColor,
    this.tabSelectedForegroundColor,
    this.tabUnselectedForegroundColor,
    this.tabIndicatorColor,
    this.appGradientStart,
    this.appGradientEnd,
    this.surfaceGradientStart,
    this.surfaceGradientEnd,
    this.surfaceBorder,
    this.cardMediumGradientStart,
    this.cardMediumGradientEnd,
    // Phase 0: CONTENT card family source fields (long-form readable cards:
    // dhikr/dua text, articles). Same nullable-override model as Medium.
    this.cardContentGradientStart,
    this.cardContentGradientEnd,
    this.cardContentBorder,
    this.cardContentOpacity = .95,
    this.secondaryCardGradientStart,
    this.secondaryCardGradientEnd,
    this.secondaryCardBorder,
    this.sectionGradientStart,
    this.sectionGradientEnd,
    this.sectionBorder,
    this.componentStyles = const {},
    this.cardGradientStart,
    this.cardGradientEnd,
    this.backgroundImageUrl = '',
    this.headerImageUrl = '',
    this.pageHeaderImages = const {},
    this.pageHeroImages = const {},
    this.pageHeroCopy = const {},
    this.pageHeaderCopy = const {},
    this.pageHeaderStyles = const {},
    this.welcomeBackgroundImageUrl = '',
    this.welcomeGradientStart = const Color(0xFFFFFDFE),
    this.welcomeGradientEnd = const Color(0xFFFFF8FA),
    this.welcomeLogoImageUrl = '',
    this.welcomeLogoScale = 1.2,
    this.welcomeCopy = const {},
    this.welcomeTitleColor = const Color(0xFFD85478),
    this.welcomeSubtitleColor = const Color(0xFFAD7183),
    this.welcomeFooterColor = const Color(0xFFAD7183),
    this.welcomeGoogleButtonColor = const Color(0xFFC85B80),
    this.welcomeGoogleButtonTextColor = Colors.white,
    this.welcomeGuestButtonColor = Colors.white,
    this.welcomeGuestButtonTextColor = const Color(0xFFC85B80),
    this.welcomeGuestButtonBorderColor = const Color(0xFFF2CBD7),
    this.homeHeaderLogoImageUrl = '',
    this.headerLogoMessage = '',
    this.headerLogoMoodTitles = const {},
    this.headerLogoMoodMessages = const {},
    this.seasonalLogoTitle = '',
    this.seasonalLogoMessage = '',
    this.seasonalLogoImageUrl = '',
    this.seasonalLogoSoundUrl = '',
    this.seasonalLogoSoundVolume = .55,
    this.seasonalLogoCardColor,
    this.seasonalLogoCardOpacity = .92,
    this.seasonalLogoTitleColor,
    this.seasonalLogoMessageColor,
    this.homeMoodMessages = const {},
    this.homeHeroImageUrl = '',
    this.scheduleEnabled = false,
    this.scheduleStart = '',
    this.scheduleEnd = '',
    this.schedulePriority = 0,
    // Modern UI 2.0 (Step 2): authored per-family accent overrides as raw
    // hex (`modernAccents.<family>.<field>`). Absent/empty for every legacy
    // published theme, which then renders via deterministic same-palette
    // fallbacks in HerModernAccents — never a rendering change by default.
    this.modernAccents = const {},
  });

  static const fallback = ThemePalette(
    name: 'HER روشتة',
    controlSchemaVersion: 2,
    // HER | روشتة identity: the logo's HER rose is the broad accent while
    // the deeper روشتة berry owns strong actions. The canvas is white, cards are
    // translucent white-to-blush gradients, small cards use sequential
    // pastel washes, and icons are berry glyphs on light solid circles.
    // This mirrors the published control-centre preset so offline
    // first-frames match the online theme exactly.
    primary: Color(0xFFD85478),
    primaryDark: Color(0xFF963A5B),
    primaryLight: Color(0xFFF8D8E1),
    background: Color(0xFFFFFFFF),
    surface: Color(0xFFFFFEFE),
    headerColor: Color(0xFFFFFFFF),
    border: Color(0xFFD7CCCF),
    textPrimary: Color(0xFF572D3A),
    textSecondary: Color(0xFF916674),
    sectionTitleColor: Color(0xFF572D3A),
    // Blush / blush-rose / soft mauve / pale sky / soft peach sequential wash.
    pinkSection: Color(0xFFFCEBF0),
    greenSection: Color(0xFFFCF1F3),
    purpleSection: Color(0xFFF9EFF4),
    blueSection: Color(0xFFFBEFF3),
    peachSection: Color(0xFFFFF3F3),
    accent: Color(0xFFE47890),
    // Strong CTAs deliberately use the deep روشتة berry gradient. This is
    // independent from the broad HER rose used by the rest of the interface.
    primaryButtonColor: Color(0xFFC85B80),
    primaryButtonGradientStartColor: Color(0xFFA74364),
    primaryButtonTextColor: Colors.white,
    primaryButtonIconColor: Color(0xFF963A5B),
    primaryButtonIconBackgroundColor: Colors.white,
    primaryButtonBorderColor: Colors.white,
    secondaryButtonColor: Color(0xFFFFFEFE),
    secondaryButtonTextColor: Color(0xFF963A5B),
    secondaryButtonIconColor: Color(0xFFD85478),
    secondaryButtonBorderColor: Colors.white,
    headerTitleColor: Color(0xFF963A5B),
    headerHerColor: Color(0xFFFF5C91),
    headerSubtitleColor: Color(0xFFD85478),
    videoActionColor: Color(0xFF963A5B),
    videoActionTextColor: Colors.white,
    videoActionBorderColor: Color(0xFF963A5B),
    profileCardColor: Color(0xFFFFF8FA),
    profileHeroStartColor: Color(0xFFFCEBF0),
    profileHeroEndColor: Color(0xFFFFFEFE),
    profileActionColor: Color(0xFF963A5B),
    profileActionTextColor: Colors.white,
    profileStatSurfaceColor: Color(0xFFF6DCE4),
    profileStatTextColor: Color(0xFF963A5B),
    iconColor: Color(0xFF963A5B),
    iconBackgroundColor: Color(0xFFF8D8E1),
    iconPinkBackgroundColor: Color(0xFFF8D8E1),
    iconCreamBackgroundColor: Color(0xFFFFEEF2),
    iconCreamGlyphColor: Color(0xFFB43054),
    iconBackgroundOpacity: 1,
    backgroundOverlayOpacity: 0,
    cardOpacity: .98,
    secondaryCardOpacity: .95,
    headerOpacity: .96,
    sectionOpacity: .44,
    // Pink Master calibration: the three fitness semantic accents are
    // visually distinct families (lavender / rose-pink / cyan) reusing the
    // approved sunset hues — no invented colors. All three share Small
    // structure + opacity; only the hue differs.
    fitnessStepsIconColor: Color(0xFF8A6FD1),
    fitnessStepsCircleColor: Color(0xFF8A6FD1),
    fitnessCaloriesIconColor: Color(0xFFD85D8A),
    fitnessCaloriesCircleColor: Color(0xFFD85D8A),
    fitnessWorkoutIconColor: Color(0xFF49B9D1),
    fitnessWorkoutCircleColor: Color(0xFF49B9D1),
    // Nutrition olive/sage identity (muted HER olive, not saturated green).
    // Dedicated accent so Steps/Calories/Workout mappings stay untouched.
    fitnessNutritionIconColor: Color(0xFF6F7B5F),
    fitnessNutritionCircleColor: Color(0xFF6F7B5F),
    navigationColor: Color(0xFFD85478),
    navigationTextColor: Colors.white,
    appGradientStart: Color(0xFFFFFFFF),
    appGradientEnd: Color(0xFFFFFFFF),
    cardGradientStart: Color(0xFFFFFDFD),
    cardGradientEnd: Color(0xFFFBEFF3),
    // The home hero is intentionally a soft blush material, never plain
    // white.  It keeps the base HER identity warm while the page canvas stays
    // clean and readable.
    componentStyles: {
      // Base surfaces power Journey and Faith. They intentionally keep their
      // previous quiet neutral material; only generic white cards use glass.
      'surface': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFEFE),
        gradientEnd: Color(0xFFFFF9FB),
        border: Color(0xFFD7CCCF),
        opacity: .52,
        borderOpacity: .78,
        borderWidth: .8,
        shadowColor: Color(0xFFD85478),
        shadowOpacity: .035,
        shadowBlur: 14,
        shadowOffsetY: 5,
      ),
      'secondaryCard': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFEFE),
        gradientEnd: Color(0xFFFFF9FB),
        border: Color(0xFFD7CCCF),
        opacity: .52,
        borderOpacity: .78,
        borderWidth: .8,
        shadowColor: Color(0xFFD85478),
        shadowOpacity: .035,
        shadowBlur: 14,
        shadowOffsetY: 5,
      ),
      'listRow': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFEFE),
        gradientEnd: Color(0xFFFFF9FB),
        border: Color(0xFFD7CCCF),
        opacity: .52,
        borderOpacity: .78,
        borderWidth: .8,
        shadowColor: Color(0xFFD85478),
        shadowOpacity: .035,
        shadowBlur: 14,
        shadowOffsetY: 5,
      ),
      'cardHero': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFEFE),
        gradientEnd: Color(0xFFFFF9FB),
        border: Color(0xFFD7CCCF),
        opacity: .52,
        borderOpacity: .78,
        borderWidth: .8,
        radius: 24,
        shadowColor: Color(0xFFD85478),
        shadowOpacity: .035,
        shadowBlur: 20,
        shadowOffsetX: 0,
        shadowOffsetY: 8,
      ),
      'cardLarge': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFEFE),
        gradientEnd: Color(0xFFFFF9FB),
        border: Color(0xFFD7CCCF),
        opacity: .52,
        borderOpacity: .78,
        borderWidth: .8,
        shadowColor: Color(0xFFD85478),
        shadowOpacity: .035,
        shadowBlur: 14,
        shadowOffsetY: 5,
      ),
      'cardMedium': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFEFE),
        gradientEnd: Color(0xFFFFF9FB),
        border: Color(0xFFD7CCCF),
        opacity: .52,
        borderOpacity: .78,
        borderWidth: .8,
        shadowColor: Color(0xFFD85478),
        shadowOpacity: .035,
        shadowBlur: 14,
        shadowOffsetY: 5,
      ),
      'cardSmall': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFEFE),
        gradientEnd: Color(0xFFFFF9FB),
        border: Color(0xFFD7CCCF),
        opacity: .52,
        borderOpacity: .78,
        borderWidth: .8,
        shadowColor: Color(0xFFD85478),
        shadowOpacity: .035,
        shadowBlur: 14,
        shadowOffsetY: 5,
      ),
      'cardWide': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFEFE),
        gradientEnd: Color(0xFFFFF9FB),
        border: Color(0xFFD7CCCF),
        opacity: .52,
        borderOpacity: .78,
        borderWidth: .8,
        shadowColor: Color(0xFFD85478),
        shadowOpacity: .035,
        shadowBlur: 14,
        shadowOffsetY: 5,
      ),
      'cardJourney': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFEFE),
        gradientEnd: Color(0xFFFFF9FB),
        border: Color(0xFFD7CCCF),
        opacity: .52,
        borderOpacity: .78,
        borderWidth: .8,
        shadowColor: Color(0xFFD85478),
        shadowOpacity: .035,
        shadowBlur: 14,
        shadowOffsetY: 5,
      ),
      'cardContent': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFEFE),
        gradientEnd: Color(0xFFFFF9FB),
        border: Color(0xFFD7CCCF),
        opacity: .52,
        borderOpacity: .78,
        borderWidth: .8,
        shadowColor: Color(0xFFD85478),
        shadowOpacity: .05,
        shadowBlur: 14,
        shadowOffsetY: 5,
      ),
    },
    welcomeGradientStart: Color(0xFFFFFDFE),
    welcomeGradientEnd: Color(0xFFFFF8FA),
    welcomeLogoImageUrl: 'assets/images/her_welcome.webp',
    homeHeaderLogoImageUrl: 'assets/images/logoside.webp',
  );

  /// Offline/first-frame identity. The published configuration can replace
  /// every token, but a missing cache or a slow network must never flash the
  /// retired white theme before the dark default arrives.
  static final darkDefault = ThemePalette.fromJson(
    readableThemeRecipe({
      ...fallback.toJson(),
      'name': 'الأساسي الداكن',
      'presetVersion': 38,
      'controlSchemaVersion': 2,
      'primary': '#A85A74',
      'primaryDark': '#FFE3EC',
      'primaryLight': '#5A3040',
      'background': '#191015',
      'surface': '#281A22',
      'headerColor': '#21151C',
      'border': '#704856',
      'textPrimary': '#FFF5F8',
      'textSecondary': '#E8C2CE',
      'sectionTitleColor': '#FFF5F8',
      'headingPrimaryColor': '#FFF5F8',
      'headingSecondaryColor': '#FFE3EC',
      'heroTitleColor': '#FFF5F8',
      'heroSubtitleColor': '#E8C2CE',
      'cardTitleColor': '#FFF5F8',
      'cardSubtitleColor': '#E8C2CE',
      'sectionSubtitleColor': '#E8C2CE',
      'bodyPrimaryColor': '#FFF5F8',
      'bodySecondaryColor': '#E8C2CE',
      'captionColor': '#E8C2CE',
      'onPrimaryColor': '#FFF5F8',
      'headerTitleColor': '#FFFFFF',
      'headerHerColor': '#FF5C91',
      'headerSubtitleColor': '#E8C2CE',
      'pinkSection': '#633747',
      'greenSection': '#46313D',
      'purpleSection': '#52394F',
      'blueSection': '#403044',
      'peachSection': '#5A3440',
      'accent': '#D88AA6',
      'primaryButtonColor': '#A85A74',
      'primaryButtonGradientStartColor': '#7E3852',
      'primaryButtonTextColor': '#FFF5F8',
      'primaryButtonIconColor': '#7E3852',
      'primaryButtonIconBackgroundColor': '#FFF5F8',
      'primaryButtonBorderColor': '#FFF5F8',
      'secondaryButtonColor': '#5A3040',
      'secondaryButtonTextColor': '#FFE3EC',
      'secondaryButtonIconColor': '#F0A9C0',
      'secondaryButtonBorderColor': '#B8758C',
      'profileCardColor': '#34202A',
      'profileHeroStartColor': '#5A3040',
      'profileHeroEndColor': '#281A22',
      'profileActionColor': '#A85A74',
      'profileActionTextColor': '#FFF5F8',
      'profileStatSurfaceColor': '#5A3040',
      'profileStatTextColor': '#FFF5F8',
      'iconColor': '#FFE3EC',
      'iconBackgroundColor': '#4B2A37',
      'iconPinkBackgroundColor': '#C86789',
      'iconCreamBackgroundColor': '#47313A',
      'iconCreamGlyphColor': '#F3CFAB',
      'sideIconColor': '#FFE3EC',
      'sideIconBackgroundColor': '#4B2A37',
      'navigationColor': '#773D52',
      'navigationTextColor': '#FFF5FA',
      'appGradientStart': '#191015',
      'appGradientEnd': '#34202A',
      // Welcome is a deliberately separate, airy entry surface. The signed-in
      // product canvas remains dark; these two values stay editable in Studio.
      'welcomeGradientStart': '#FFFFFF',
      'welcomeGradientEnd': '#FFF4F7',
      'selectedSurfaceColor': '#5A3040',
      'selectedForegroundColor': '#FFF5F8',
      'selectedBorderColor': '#F0A9C0',
      'unselectedSurfaceColor': '#281A22',
      'unselectedForegroundColor': '#E8C2CE',
      'unselectedBorderColor': '#704856',
      'switchTrackSelectedColor': '#A85A74',
      'switchThumbSelectedColor': '#FFF5F8',
      'switchTrackUnselectedColor': '#704856',
      'switchThumbUnselectedColor': '#E8C2CE',
      'switchBorderColor': '#704856',
      'tabSelectedForegroundColor': '#FFF5F8',
      'tabUnselectedForegroundColor': '#E8C2CE',
      'tabIndicatorColor': '#F0A9C0',
      'componentStyles': {
        for (final role in const [
          'surface',
          'secondaryCard',
          'listRow',
          'cardLarge',
          'cardMedium',
          'cardSmall',
          'cardWide',
          'cardJourney',
          'cardContent',
          'popup',
          'bottomSheet',
          'counter',
          'searchField',
          'journeyPulseCard',
        ])
          role: {
            'gradientStart': '#281A22',
            'gradientEnd': '#34202A',
            'border': '#704856',
            'opacity': 1,
            'borderOpacity': .86,
            'shadowColor': '#000000',
            'shadowOpacity': .18,
          },
        for (final role in const [
          'header',
          'section',
          'titleCard',
          'slide',
          'cardHero',
          'hydrationCard',
          'sleepCard',
          'cycleCalendarCard',
        ])
          role: {
            'gradientStart': '#34202A',
            'gradientEnd': '#5A3040',
            'border': '#8A5968',
            'opacity': 1,
            'borderOpacity': .86,
            'shadowColor': '#000000',
            'shadowOpacity': .20,
          },
        for (final role in const ['iconCard', 'faithDailyStatsIcon'])
          role: {
            'gradientStart': '#4B2A37',
            'gradientEnd': '#4B2A37',
            'border': '#8A5968',
            'opacity': 1,
            'borderOpacity': .72,
            'glyphColor': '#FFE3EC',
          },
      },
    }),
  );

  /// The fixed production contract for the «الوردي الفاتح» (Light Pink) preset.
  ///
  /// The local light choice keeps HER rose as its anchor with one controlled
  /// rose family: blush/ivory surfaces, warm cream support, dusty-rose and
  /// restrained cool rose-grey washes — never random cyan or strong lavender,
  /// so Cycle phase colors and journey tiles stay coherent. Formerly displayed
  /// as «غروب وردي» (see [sunsetPinkFormerName]); old records resolve here.
  /// This is palette data, not screen-local paint, so every shared card keeps
  /// responding consistently to the selected light theme.
  static const sunsetPinkFormerName = 'غروب وردي';
  static const sunsetPink = ThemePalette(
    name: 'الوردي الفاتح',
    presetVersion: 46,
    primary: Color(0xFFC24974),
    primaryDark: Color(0xFF7E2E52),
    primaryLight: Color(0xFFF6DEE7),
    background: Color(0xFFFFFFFF),
    surface: Color(0xFFFFFDFE),
    headerColor: Color(0xFFFFFFFF),
    border: Color(0xFFE7CBD6),
    textPrimary: Color(0xFF4A2536),
    textSecondary: Color(0xFF8A6B77),
    sectionTitleColor: Color(0xFF4A2536),
    pinkSection: Color(0xFFF7DEE7),
    greenSection: Color(0xFFE6EFE3),
    purpleSection: Color(0xFFEFD9E3),
    blueSection: Color(0xFFECE5EA),
    peachSection: Color(0xFFF9E7D2),
    accent: Color(0xFFC9768F),
    buttonTextColor: Color(0xFFFFFFFF),
    primaryButtonColor: Color(0xFFB23A64),
    primaryButtonGradientStartColor: Color(0xFF7E2E52),
    primaryButtonTextColor: Color(0xFFFFFFFF),
    primaryButtonIconColor: Color(0xFF7E2E52),
    primaryButtonIconBackgroundColor: Color(0xFFFFFFFF),
    primaryButtonBorderColor: Color(0xFFE7CBD6),
    secondaryButtonColor: Color(0xFFFFFDFE),
    secondaryButtonTextColor: Color(0xFF7E2E52),
    secondaryButtonIconColor: Color(0xFFC24974),
    secondaryButtonBorderColor: Color(0xFFE7CBD6),
    dangerButtonColor: Color(0xFFA93A5C),
    dangerButtonTextColor: Color(0xFFFFFFFF),
    videoActionColor: Color(0xFF7E2E52),
    videoActionTextColor: Color(0xFFFFFFFF),
    videoActionBorderColor: Color(0xFFB23A64),
    profileCardColor: Color(0xFFFFFDFE),
    profileHeroStartColor: Color(0xFFF7DEE7),
    profileHeroEndColor: Color(0xFFFFFDFE),
    profileActionColor: Color(0xFF7E2E52),
    profileActionTextColor: Color(0xFFFFFFFF),
    profileStatSurfaceColor: Color(0xFFF3D9E2),
    profileStatTextColor: Color(0xFF7E2E52),
    headingPrimaryColor: Color(0xFFB23A64),
    headingSecondaryColor: Color(0xFF7E2E52),
    heroTitleColor: Color(0xFF4A2536),
    heroSubtitleColor: Color(0xFF8A6B77),
    cardTitleColor: Color(0xFF7E2E52),
    cardSubtitleColor: Color(0xFF8A6B77),
    sectionSubtitleColor: Color(0xFF8A6B77),
    bodyPrimaryColor: Color(0xFF4A2536),
    bodySecondaryColor: Color(0xFF8A6B77),
    captionColor: Color(0xFF8A6B77),
    onPrimaryColor: Color(0xFFFFFFFF),
    headerTitleColor: Color(0xFF4A2536),
    headerHerColor: Color(0xFFD1547C),
    headerSubtitleColor: Color(0xFF8A6B77),
    selectedSurfaceColor: Color(0xFFF4DDE6),
    selectedForegroundColor: Color(0xFF7E2E52),
    selectedBorderColor: Color(0xFFC24974),
    unselectedSurfaceColor: Color(0xFFFFFDFE),
    unselectedForegroundColor: Color(0xFF8A6B77),
    unselectedBorderColor: Color(0xFFE7CBD6),
    switchTrackSelectedColor: Color(0xFFC24974),
    switchThumbSelectedColor: Color(0xFFFFFFFF),
    switchTrackUnselectedColor: Color(0xFFE7CBD6),
    switchThumbUnselectedColor: Color(0xFFFFFFFF),
    switchBorderColor: Color(0xFFE7CBD6),
    tabSelectedForegroundColor: Color(0xFF7E2E52),
    tabUnselectedForegroundColor: Color(0xFF8A6B77),
    tabIndicatorColor: Color(0xFFC24974),
    iconColor: Color(0xFF7E2E52),
    iconBackgroundColor: Color(0xFFF6DEE7),
    iconPinkBackgroundColor: Color(0xFFF4DFE7),
    iconCreamBackgroundColor: Color(0xFFF9E7D2),
    iconCreamGlyphColor: Color(0xFF7E2E52),
    sideIconColor: Color(0xFF7E2E52),
    sideIconBackgroundColor: Color(0xFFF6DEE7),
    fitnessStepsIconColor: Color(0xFFA86A86),
    fitnessStepsCircleColor: Color(0xFFF0C4D2),
    fitnessCaloriesIconColor: Color(0xFFB23A64),
    fitnessCaloriesCircleColor: Color(0xFFEFB9CB),
    fitnessWorkoutIconColor: Color(0xFFB26A4A),
    fitnessWorkoutCircleColor: Color(0xFFF0BFAE),
    fitnessNutritionIconColor: Color(0xFFA8763A),
    fitnessNutritionCircleColor: Color(0xFFEFCB9E),
    iconOpacity: 1,
    iconBackgroundOpacity: 1,
    backgroundOverlayOpacity: 1,
    cardOpacity: .98,
    secondaryCardOpacity: .98,
    headerOpacity: 1,
    sectionOpacity: .98,
    navigationOpacity: .98,
    navigationColor: Color(0xFFB23A64),
    navigationTextColor: Color(0xFFFFFFFF),
    navigationActiveColor: Color(0xFFFFFFFF),
    navigationInactiveColor: Color(0xFFF6D3DE),
    appGradientStart: Color(0xFFFFFFFF),
    appGradientEnd: Color(0xFFFFFFFF),
    surfaceGradientStart: Color(0xFFFFFDFE),
    surfaceGradientEnd: Color(0xFFFBF3F6),
    surfaceBorder: Color(0xFFE7CBD6),
    secondaryCardGradientStart: Color(0xFFFFFDFE),
    secondaryCardGradientEnd: Color(0xFFF9EFF3),
    secondaryCardBorder: Color(0xFFE7CBD6),
    sectionGradientStart: Color(0xFFF4DFE7),
    sectionGradientEnd: Color(0xFFF4DFE7),
    sectionBorder: Color(0xFFE7CBD6),
    cardGradientStart: Color(0xFFF4DFE7),
    cardGradientEnd: Color(0xFFF4DFE7),
    welcomeGradientStart: Color(0xFFFFF9FB),
    welcomeGradientEnd: Color(0xFFF6DEE7),
    welcomeTitleColor: Color(0xFFB23A64),
    welcomeSubtitleColor: Color(0xFF8A6B77),
    welcomeFooterColor: Color(0xFF8A6B77),
    welcomeGoogleButtonColor: Color(0xFFB23A64),
    welcomeGoogleButtonTextColor: Color(0xFFFFFFFF),
    welcomeGuestButtonColor: Color(0xFFFFFDFE),
    welcomeGuestButtonTextColor: Color(0xFF7E2E52),
    welcomeGuestButtonBorderColor: Color(0xFFE7CBD6),
    componentStyles: {
      // The focal HER card must read as blush at first glance rather than a
      // white panel: the gentle two-stop gradient remains airy on light UI.
      'cardHero': ThemeComponentStyle(
        gradientStart: Color(0xFFFFF8FA),
        gradientEnd: Color(0xFFF4DCE4),
        border: Color(0xFFEEDDE2),
        opacity: .98,
        radius: 24,
        shadowColor: Color(0xFFB97086),
        shadowOpacity: .06,
        shadowBlur: 20,
        shadowOffsetY: 8,
      ),
      'cardLarge': ThemeComponentStyle(
        gradientStart: Color(0xFFFFF8FA),
        gradientEnd: Color(0xFFF9EEF1),
        border: Color(0xFFEBE2E5),
        opacity: .94,
      ),
      'cardMedium': ThemeComponentStyle(
        gradientStart: Color(0xFFFFF8FA),
        gradientEnd: Color(0xFFF9EEF1),
        border: Color(0xFFEBE2E5),
        opacity: .94,
      ),
      'cardSmall': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFBFC),
        gradientEnd: Color(0xFFFFF3F6),
        border: Color(0xFFEBE2E5),
        opacity: .96,
      ),
      'cardWide': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFBFC),
        gradientEnd: Color(0xFFFFF3F6),
        border: Color(0xFFEBE2E5),
        opacity: .95,
      ),
      'cardJourney': ThemeComponentStyle(
        gradientStart: Color(0xFFFFF6F9),
        gradientEnd: Color(0xFFF4E7EB),
        border: Color(0xFFEBE2E5),
        opacity: .94,
      ),
      'cardContent': ThemeComponentStyle(
        gradientStart: Color(0xFFFFFBFC),
        gradientEnd: Color(0xFFFFF3F6),
        border: Color(0xFFEBE2E5),
        opacity: .95,
      ),
    },
  );

  final String name;
  final int presetVersion;
  final int controlSchemaVersion;
  final Color primary;
  final Color primaryDark;
  final Color primaryLight;
  final Color background;
  final Color surface;

  /// Separates the page-header surface from the app background so a seasonal
  /// theme can give headers their own coordinated colour.
  final Color headerColor;
  final Color border;
  final Color textPrimary;
  final Color textSecondary;

  /// A title is text, not a card. Keeping this token outside component
  /// surfaces lets the control centre change headings without recolouring
  /// the card behind them.
  final Color? sectionTitleColor;
  // Phase 0: semantic text roles (nullable CMS overrides; derivations in
  // HerThemeData apply when absent).
  final Color? headingPrimaryColor;
  final Color? headingSecondaryColor;

  /// Copy inside the large illustrated heroes.  These are deliberately not
  /// aliases for the generic heading/body roles: campaign artwork can need
  /// a different readable ink without recolouring cards or section headers.
  final Color? heroTitleColor;
  final Color? heroSubtitleColor;
  final Color? cardTitleColor;
  final Color? cardSubtitleColor;
  final Color? sectionSubtitleColor;
  final Color? bodyPrimaryColor;
  final Color? bodySecondaryColor;
  final Color? captionColor;

  /// Qur'an, duaa and dhikr copy on dark devotional surfaces.  It is a
  /// separate editorial role so the Control Center can use a calm warm beige
  /// without muting ordinary headings or card text.
  final Color? devotionalTextColor;
  final Color? onPrimaryColor;
  final Color? headerTitleColor;
  final Color? headerHerColor;
  final Color? headerSubtitleColor;
  final Color pinkSection;
  final Color greenSection;
  final Color purpleSection;
  final Color blueSection;
  final Color peachSection;
  final Color? accent;
  final Color? buttonTextColor;

  /// Optional Pink Master primary-button pin (default #D16F8E in fallback).
  /// When set, the normal Primary button resolves to this single color
  /// (gradient stops + flat fill); when absent, the legacy derived CTA
  /// applies. Seasonal presets leave it null — untouched by design.
  final Color? primaryButtonColor;
  final Color? primaryButtonGradientStartColor;
  final Color? primaryButtonTextColor;
  final Color? primaryButtonIconColor;
  final Color? primaryButtonIconBackgroundColor;
  final Color? primaryButtonBorderColor;

  /// Phase 0: secondary + danger button tokens (nullable CMS overrides;
  /// current recipes in HerThemeData apply when absent).
  final Color? secondaryButtonColor;
  final Color? secondaryButtonTextColor;
  final Color? secondaryButtonIconColor;
  final Color? secondaryButtonBorderColor;
  final Color? dangerButtonColor;
  final Color? dangerButtonTextColor;

  /// Dedicated high-contrast treatment for external video actions.
  final Color videoActionColor;
  final Color videoActionTextColor;
  final Color videoActionBorderColor;

  /// Profile-only controls. They do not affect shared cards or actions.
  final Color profileCardColor;
  final Color profileHeroStartColor;
  final Color profileHeroEndColor;
  final Color profileActionColor;
  final Color profileActionTextColor;
  final Color profileStatSurfaceColor;
  final Color profileStatTextColor;

  /// A dedicated icon layer, kept separate from cards and backgrounds so a
  /// theme can retain readable symbols over bright or dark artwork.
  final Color iconColor;

  /// Olive is the foundation; pink and cream complete the three global icon
  /// families. Cream receives burgundy glyphs automatically for contrast.
  final Color iconBackgroundColor;

  /// Compatibility-only; scheduled for removal with the old control centre.
  final Color iconPinkBackgroundColor;
  final Color iconCreamBackgroundColor;
  final Color iconCreamGlyphColor;

  /// Compatibility-only; semantic icon kinds own normal UI rendering.
  final Color? sideIconColor;
  final Color? sideIconBackgroundColor;
  final Color? fitnessStepsIconColor;
  final Color? fitnessStepsCircleColor;
  final double fitnessStepsIconOpacity;
  final double fitnessStepsCircleOpacity;
  final Color? fitnessCaloriesIconColor;
  final Color? fitnessCaloriesCircleColor;
  final double fitnessCaloriesIconOpacity;
  final double fitnessCaloriesCircleOpacity;
  final Color? fitnessWorkoutIconColor;
  final Color? fitnessWorkoutCircleColor;
  final double fitnessWorkoutIconOpacity;
  final double fitnessWorkoutCircleOpacity;

  /// Nutrition olive/sage identity (dedicated accent; Steps/Calories/Workout
  /// mappings are never reused for it).
  final Color? fitnessNutritionIconColor;
  final Color? fitnessNutritionCircleColor;
  final double fitnessNutritionIconOpacity;
  final double fitnessNutritionCircleOpacity;
  final double iconOpacity;
  final double iconBackgroundOpacity;
  final double iconCircleSize;
  final double iconGlyphSize;
  final double backgroundOverlayOpacity;
  final double cardOpacity;
  final double secondaryCardOpacity;
  final double headerOpacity;

  /// Opacity of the five semantic coloured card/slide tokens.
  final double sectionOpacity;
  final double navigationOpacity;
  final Color navigationColor;

  /// Dedicated Floating Bar recipe. Null start/end preserves the legacy
  /// derived gradient for old payloads; new Theme Studio saves own both stops.
  final Color? navigationGradientStartColor;
  final Color? navigationGradientEndColor;
  final Color? navigationBorderColor;
  final double navigationBorderOpacity;

  /// Legacy shared navigation foreground. New themes use the two explicit
  /// state colours below, leaving the Floating Bar independent from all
  /// other theme colour families.
  final Color navigationTextColor;
  final Color? navigationActiveColor;
  final Color? navigationInactiveColor;

  /// The liquid inside the hydration glass.  It is intentionally separate
  /// from both the hydration card and the app action colour.
  final Color journeyWaterFillColor;

  /// Phase 0: centralized state tokens (nullable CMS overrides; Pink Master
  /// derivations in HerThemeData apply when absent).
  final Color? selectedSurfaceColor;
  final Color? selectedForegroundColor;
  final Color? selectedBorderColor;
  final Color? unselectedSurfaceColor;
  final Color? unselectedForegroundColor;
  final Color? unselectedBorderColor;
  final double disabledOpacity;
  final double pressedOverlayOpacity;

  /// Phase 0: switch + tab styling tokens (same nullable-override model).
  final Color? switchTrackSelectedColor;
  final Color? switchThumbSelectedColor;
  final Color? switchTrackUnselectedColor;
  final Color? switchThumbUnselectedColor;
  final Color? switchBorderColor;
  final Color? tabSelectedForegroundColor;
  final Color? tabUnselectedForegroundColor;
  final Color? tabIndicatorColor;

  /// The application canvas can use two editor-controlled colours without
  /// requiring a background image. Null keeps older published themes on the
  /// single `background` colour until they are opened and saved again.
  final Color? appGradientStart;
  final Color? appGradientEnd;

  /// The three shared card materials. Each has its own gradient and frame,
  /// while opacity remains independently controlled by the matching slider.
  final Color? surfaceGradientStart;
  final Color? surfaceGradientEnd;
  final Color? surfaceBorder;

  /// Pink Master calibration: MEDIUM has its own gradient pair (surface →
  /// pinkSection by default), independent from Small and the washes.
  final Color? cardMediumGradientStart;
  final Color? cardMediumGradientEnd;
  // Phase 0: CONTENT family source fields (same model as Medium).
  final Color? cardContentGradientStart;
  final Color? cardContentGradientEnd;
  final Color? cardContentBorder;
  final double cardContentOpacity;
  final Color? secondaryCardGradientStart;
  final Color? secondaryCardGradientEnd;
  final Color? secondaryCardBorder;
  final Color? sectionGradientStart;
  final Color? sectionGradientEnd;
  final Color? sectionBorder;

  /// Root-level roles consumed by every shared component. Flat tokens above
  /// are retained solely to read published themes from before this contract.
  final Map<String, ThemeComponentStyle> componentStyles;

  ThemeComponentStyle componentStyle(String role) {
    final configured = componentStyles[role];
    if (configured != null) return configured;
    return switch (role) {
      'header' => ThemeComponentStyle(
        gradientStart: headerColor,
        gradientEnd: headerColor,
        border: border,
        opacity: headerOpacity,
      ),
      'cardShortcut' => componentStyle('cardWide'),
      'secondaryCard' => ThemeComponentStyle(
        gradientStart: secondaryCardGradientStart ?? surface,
        gradientEnd: secondaryCardGradientEnd ?? surface,
        border: secondaryCardBorder ?? border,
        opacity: secondaryCardOpacity,
      ),
      'popup' => ThemeComponentStyle(
        gradientStart: surfaceGradientStart ?? surface,
        gradientEnd: surfaceGradientEnd ?? surface,
        border: surfaceBorder ?? border,
        // A popup must never inherit the card-layer alpha while an older
        // published theme has no explicit popup record. The dedicated editor
        // control can subsequently choose any value from 0 to 1.
        opacity: 1,
      ),
      // Phase 2 prep: bottom sheets get their OWN layer key so sheet opacity
      // never inherits card/dialog opacity. Same recipe as popup today;
      // modal chrome re-points to it in Phase 2/3.
      'bottomSheet' => ThemeComponentStyle(
        gradientStart: surfaceGradientStart ?? surface,
        gradientEnd: surfaceGradientEnd ?? surface,
        border: surfaceBorder ?? border,
        opacity: 1,
      ),
      'section' || 'titleCard' || 'slide' => ThemeComponentStyle(
        gradientStart: sectionGradientStart ?? cardGradientStart ?? blueSection,
        gradientEnd: sectionGradientEnd ?? cardGradientEnd ?? blueSection,
        border: sectionBorder ?? border,
        opacity: sectionOpacity,
      ),
      'journeyPulseCard' => componentStyle('surface'),
      'hydrationCard' ||
      'sleepCard' ||
      'cycleCalendarCard' => componentStyle('section'),
      'iconCard' => ThemeComponentStyle(
        gradientStart: iconBackgroundColor,
        gradientEnd: iconBackgroundColor,
        border: border,
        opacity: iconBackgroundOpacity,
      ),
      'faithDailyStatsIcon' => componentStyle('iconCard'),
      // The Quran page is its own reading surface. Older published themes
      // inherit the themed surface until an editor chooses its two colours.
      'quranPage' => ThemeComponentStyle(
        gradientStart: surfaceGradientStart ?? surface,
        gradientEnd: surfaceGradientEnd ?? surface,
        border: surfaceBorder ?? border,
        opacity: 1,
      ),
      'counter' => ThemeComponentStyle(
        gradientStart: surfaceGradientStart ?? surface,
        gradientEnd: surfaceGradientEnd ?? surface,
        border: surfaceBorder ?? border,
        opacity: 1,
      ),
      'searchField' => ThemeComponentStyle(
        gradientStart: surfaceGradientStart ?? surface,
        gradientEnd: surfaceGradientEnd ?? surface,
        border: surfaceBorder ?? border,
        opacity: 1,
      ),
      // Phase 0: the Pink Master per-role calibration now lives in DATA
      // (shadow + radius + border width per family), so the control centre
      // can retune it without touching feature code. Values reproduce the
      // previous hard-coded recipe exactly.
      'cardWide' => ThemeComponentStyle(
        gradientStart: secondaryCardGradientStart ?? surface,
        gradientEnd: secondaryCardGradientEnd ?? surface,
        border: secondaryCardBorder ?? border,
        opacity: .90,
        borderWidth: 1,
        radius: 20,
        shadowColor: primary,
        shadowOpacity: .05,
        shadowBlur: 14,
        shadowOffsetX: 0,
        shadowOffsetY: 6,
      ),
      // Hero keeps its richer presence (radius 24, deeper soft shadow);
      // the blush end-stop override stays in HerThemeData (Pink Master).
      'cardHero' => ThemeComponentStyle(
        gradientStart: secondaryCardGradientStart ?? surface,
        gradientEnd: secondaryCardGradientEnd ?? surface,
        border: secondaryCardBorder ?? border,
        opacity: .90,
        borderWidth: 1,
        radius: 24,
        shadowColor: primary,
        shadowOpacity: .12,
        shadowBlur: 20,
        shadowOffsetX: 0,
        shadowOffsetY: 8,
      ),
      'cardLarge' => ThemeComponentStyle(
        gradientStart: cardGradientStart ?? surface,
        gradientEnd: cardGradientEnd ?? surface,
        border: surfaceBorder ?? border,
        opacity: .92,
        borderWidth: 1,
        radius: 22,
        shadowColor: primary,
        shadowOpacity: .08,
        shadowBlur: 18,
        shadowOffsetX: 0,
        shadowOffsetY: 7,
      ),
      'cardMedium' => ThemeComponentStyle(
        gradientStart: cardMediumGradientStart ?? surface,
        gradientEnd: cardMediumGradientEnd ?? pinkSection,
        border: surfaceBorder ?? border,
        opacity: .94,
        borderWidth: 1,
        radius: 20,
        shadowColor: primary,
        shadowOpacity: .07,
        shadowBlur: 16,
        shadowOffsetX: 0,
        shadowOffsetY: 6,
      ),
      'cardSmall' => ThemeComponentStyle(
        gradientStart: surfaceGradientStart ?? surface,
        gradientEnd: surfaceGradientEnd ?? surface,
        border: surfaceBorder ?? border,
        opacity: .96,
        borderWidth: 1,
        radius: 16,
        shadowColor: primary,
        shadowOpacity: .06,
        shadowBlur: 14,
        shadowOffsetX: 0,
        shadowOffsetY: 6,
      ),
      // Journey keeps its own key (same calm values today) so it can never
      // be dragged by Small/Medium/Wide changes.
      // Opacity normalization: the family owns the final surface alpha via
      // sectionOpacity (the approved «رحلتك اليوم» wash look), so reference +
      // worship + library + profile + selfcare + quick-tool cards converge.
      // Future editor control: Cards > Journey > Surface Opacity
      // (publishing cardJourneyOpacity overrides this default per theme).
      'cardJourney' => ThemeComponentStyle(
        gradientStart: surfaceGradientStart ?? surface,
        gradientEnd: surfaceGradientEnd ?? surface,
        border: surfaceBorder ?? border,
        opacity: sectionOpacity,
        borderWidth: 1,
        radius: 22,
        shadowColor: primary,
        shadowOpacity: .08,
        shadowBlur: 18,
        shadowOffsetX: 0,
        shadowOffsetY: 7,
      ),
      // Phase 0: CONTENT family — long-form readable cards (dhikr/dua text,
      // articles). Calm surface like Small, independent key by design.
      'cardContent' => ThemeComponentStyle(
        gradientStart: cardContentGradientStart ?? surface,
        gradientEnd: cardContentGradientEnd ?? surface,
        border: cardContentBorder ?? border,
        opacity: cardContentOpacity,
        borderWidth: 1,
        radius: 20,
        shadowColor: primary,
        shadowOpacity: .06,
        shadowBlur: 14,
        shadowOffsetX: 0,
        shadowOffsetY: 6,
      ),
      'listRow' => ThemeComponentStyle(
        gradientStart: surfaceGradientStart ?? surface,
        gradientEnd: surfaceGradientEnd ?? surface,
        border: surfaceBorder ?? border,
        opacity: cardOpacity,
        borderWidth: 1,
        radius: 18,
        shadowColor: primary,
        shadowOpacity: .08,
        shadowBlur: 18,
        shadowOffsetX: 0,
        shadowOffsetY: 7,
      ),
      _ => ThemeComponentStyle(
        gradientStart: surfaceGradientStart ?? surface,
        gradientEnd: surfaceGradientEnd ?? surface,
        border: surfaceBorder ?? border,
        opacity: cardOpacity,
      ),
    };
  }

  /// Shared gradient behind standard HER cards, including the tiles in
  /// «رحلتك اليوم». The old neutral wash remains the compatibility fallback.
  final Color? cardGradientStart;
  final Color? cardGradientEnd;
  final String backgroundImageUrl;
  final String headerImageUrl;
  final Map<String, String> pageHeaderImages;

  /// Artwork in the introductory card directly below a page header. Unlike
  /// header decoration, this is shown at full size on the left of the card.
  final Map<String, String> pageHeroImages;

  /// Editor-controlled copy for the introductory card below a page header.
  /// It is intentionally separate from header wording because both surfaces
  /// can carry different editorial messages.
  final Map<String, Map<String, String>> pageHeroCopy;

  /// Editor-controlled wording for the named page headers.  Layout remains
  /// native, while the copy can safely change from the control centre.
  final Map<String, Map<String, String>> pageHeaderCopy;

  /// Optional page-specific header foreground roles from the Theme Studio.
  final Map<String, Map<String, Color>> pageHeaderStyles;
  final String welcomeBackgroundImageUrl;

  /// These colours belong only to the welcome screen. They deliberately do
  /// not alter the app canvas, cards, or header when edited in the CMS.
  final Color welcomeGradientStart;
  final Color welcomeGradientEnd;
  final String welcomeLogoImageUrl;

  /// Remote-controlled scale for the welcome artwork.  This is deliberately
  /// layout-only: the CMS can give the brand mark more presence without
  /// changing the selected image or other screens.
  final double welcomeLogoScale;

  /// All visible welcome-screen copy is authored in Theme Studio.
  final Map<String, String> welcomeCopy;

  /// Published colour roles for the welcome screen only. Keeping these
  /// separate from global button and text tokens lets the studio preserve the
  /// white guest action without changing authenticated app screens.
  final Color welcomeTitleColor;
  final Color welcomeSubtitleColor;
  final Color welcomeFooterColor;
  final Color welcomeGoogleButtonColor;
  final Color welcomeGoogleButtonTextColor;
  final Color welcomeGuestButtonColor;
  final Color welcomeGuestButtonTextColor;
  final Color welcomeGuestButtonBorderColor;
  final String homeHeaderLogoImageUrl;
  final String headerLogoMessage;
  final Map<String, String> headerLogoMoodTitles;

  /// Optional copy keyed by the exact mood label selected on Home (for
  /// example `سعيدة` or `قلقة`).  The ordinary logo message remains the
  /// intentional fallback when a particular mood has no configured copy.
  final Map<String, String> headerLogoMoodMessages;

  /// Editor-controlled content and appearance for the brief moment shown
  /// after tapping the HER logo. Empty values retain bundled seasonal art.
  final String seasonalLogoTitle;
  final String seasonalLogoMessage;
  final String seasonalLogoImageUrl;

  /// An optional, short one-shot sound for the logo seasonal moment.
  final String seasonalLogoSoundUrl;
  final double seasonalLogoSoundVolume;
  final Color? seasonalLogoCardColor;
  final double seasonalLogoCardOpacity;
  final Color? seasonalLogoTitleColor;
  final Color? seasonalLogoMessageColor;

  /// Editorial, mood-specific support messages shown on the home screen.
  /// This lives in the remote theme payload so the care team can update the
  /// language without shipping an app release.
  final Map<String, List<String>> homeMoodMessages;
  final String homeHeroImageUrl;

  /// A recurring month/day window (MM-DD) used by the CMS to publish a
  /// seasonal palette automatically. The server resolves it before the app
  /// receives the palette; keeping it here also preserves it in the editor.
  final bool scheduleEnabled;
  final String scheduleStart;
  final String scheduleEnd;
  final int schedulePriority;

  /// Modern UI 2.0 (Step 2) authored accent overrides, keyed by family
  /// (`rose`, `lavender`, `mint`, `softBlue`, `coral`, `sage`) then field
  /// (`accentColor`, `subtleBackground`, `foreground`, `iconBackground`,
  /// `iconForeground`, `progressTrack`, `progressFill`). Raw hex only; every
  /// entry is optional and legacy payloads carry none.
  final Map<String, Map<String, String>> modernAccents;

  factory ThemePalette.fromJson(Map<String, dynamic> json) {
    Color color(String key, Color fallback) => _parseColor(json[key], fallback);
    final name = (json['name'] as String?)?.trim().isNotEmpty == true
        ? (json['name'] as String).trim()
        : fallback.name;
    // The permanent HER base palette has a constrained warm-rose identity.
    // Seasonal presets deliberately bypass this guard so their authored gold,
    // green, or night palettes remain intact.
    final isModernContract = _version(json['controlSchemaVersion']) >= 2;
    final enforcePinkMasterIdentity =
        !isModernContract && _usesPinkMasterIdentity(name);
    final themeBackground = color('background', fallback.background);
    // A deep plum base is a supported HER identity, not a legacy blue theme.
    // The old guard below predates the dark base and treated its neutral
    // #403044 wash as an unwanted blue/periwinkle value, replacing it with
    // the light fallback. That is why only cards using blueSection (cycle,
    // games, and faith tiles) stayed white after a dark theme was published.
    final isDarkHerPalette = themeBackground.computeLuminance() < .18;
    Color ink(String key, Color fallbackColor) {
      final parsed = color(key, fallbackColor);
      return enforcePinkMasterIdentity ? _retintNeutralInk(parsed) : parsed;
    }

    Color wash(String key, Color fallbackColor) {
      final parsed = color(key, fallbackColor);
      return enforcePinkMasterIdentity && !isDarkHerPalette
          ? _guardPinkMasterWash(parsed, fallbackColor)
          : parsed;
    }

    // Existing remote themes predate the welcome-only gradient fields. Their
    // own background and light primary colour make a safe seasonal fallback
    // until an editor chooses two explicit welcome colours.
    final themePrimary = color('primary', fallback.primary);
    final themePrimaryDark = color('primaryDark', fallback.primaryDark);
    final themePrimaryLight = color('primaryLight', fallback.primaryLight);
    final appGradientStart = color('appGradientStart', themeBackground);
    final rawAppGradientEnd = color('appGradientEnd', themeBackground);
    // An older saved dark base used the same near-black colour for both
    // canvas stops. It technically was a gradient, but visually flattened
    // the whole app into black. Restore the intended plum depth without
    // changing any authored gradient that actually has two different stops.
    final appGradientEnd =
        !isModernContract &&
            isDarkHerPalette &&
            rawAppGradientEnd.toARGB32() == appGradientStart.toARGB32()
        ? Color.lerp(themeBackground, themePrimaryLight, .38)!
        : rawAppGradientEnd;
    final rawComponentStyles = json['componentStyles'] is Map
        ? json['componentStyles'] as Map
        : const <String, dynamic>{};
    // Older cached seasonal payloads predate componentStyles and carry a
    // retired pure-white structural frame.  Do not let that one legacy value
    // repaint every card border after the user has chosen a coloured theme.
    // Explicit modern component styles remain authoritative.
    final hasModernComponentStyles = rawComponentStyles.isNotEmpty;
    Color structuralBorder(String key) {
      final base = color('border', fallback.border);
      final candidate = color(key, base);
      final isRetiredWhite =
          candidate.toARGB32() == const Color(0xFFFFFFFF).toARGB32();
      return isRetiredWhite && (!hasModernComponentStyles || isDarkHerPalette)
          ? base
          : candidate;
    }

    ThemeComponentStyle component(String role, ThemeComponentStyle legacy) {
      final parsed = ThemeComponentStyle.fromJson(
        rawComponentStyles[role],
        fallback: legacy,
      );
      // Some previously published Autumn payloads did include
      // `componentStyles`, but carried the retired white frame inside each
      // role.  On a deep palette that frame is a visible regression, not an
      // intentional contrast choice. Keep light themes untouched and retain
      // every other component value (gradient, opacity, shadow and radius).
      if (isModernContract ||
          !isDarkHerPalette ||
          parsed.border.toARGB32() != const Color(0xFFFFFFFF).toARGB32()) {
        return parsed;
      }
      return ThemeComponentStyle(
        gradientStart: parsed.gradientStart,
        gradientEnd: parsed.gradientEnd,
        border: color('border', fallback.border),
        opacity: parsed.opacity,
        borderOpacity: parsed.borderOpacity,
        glyphColor: parsed.glyphColor,
        borderWidth: parsed.borderWidth,
        radius: parsed.radius,
        shadowColor: parsed.shadowColor,
        shadowOpacity: parsed.shadowOpacity,
        shadowBlur: parsed.shadowBlur,
        shadowOffsetX: parsed.shadowOffsetX,
        shadowOffsetY: parsed.shadowOffsetY,
        backdropBlur: parsed.backdropBlur,
        gradientDirection: parsed.gradientDirection,
      );
    }

    return ThemePalette(
      name: name,
      presetVersion: _version(json['presetVersion']),
      controlSchemaVersion: _version(json['controlSchemaVersion']),
      primary: themePrimary,
      primaryDark: themePrimaryDark,
      primaryLight: themePrimaryLight,
      background: themeBackground,
      surface: color('surface', fallback.surface),
      headerColor: color('headerColor', fallback.headerColor),
      border: color('border', fallback.border),
      // Seasonal themes deliberately use their own complete palettes. Do not
      // retint published colours to the base HER rose palette here.
      textPrimary: ink('textPrimary', fallback.textPrimary),
      textSecondary: ink('textSecondary', fallback.textSecondary),
      sectionTitleColor: color(
        'sectionTitleColor',
        ink('textPrimary', fallback.textPrimary),
      ),
      // Phase 0: semantic text roles (absent = HerThemeData derivations).
      headingPrimaryColor: color(
        'headingPrimaryColor',
        color('primary', fallback.primary),
      ),
      headingSecondaryColor: color(
        'headingSecondaryColor',
        color('primaryDark', fallback.primaryDark),
      ),
      heroTitleColor: color(
        'heroTitleColor',
        ink('textPrimary', fallback.textPrimary),
      ),
      heroSubtitleColor: color(
        'heroSubtitleColor',
        ink('textSecondary', fallback.textSecondary),
      ),
      cardTitleColor: color(
        'cardTitleColor',
        color('primaryDark', fallback.primaryDark),
      ),
      cardSubtitleColor: color(
        'cardSubtitleColor',
        ink('textSecondary', fallback.textSecondary),
      ),
      sectionSubtitleColor: color(
        'sectionSubtitleColor',
        ink('textSecondary', fallback.textSecondary),
      ),
      bodyPrimaryColor: color(
        'bodyPrimaryColor',
        ink('textPrimary', fallback.textPrimary),
      ),
      bodySecondaryColor: color(
        'bodySecondaryColor',
        ink('textSecondary', fallback.textSecondary),
      ),
      captionColor: color(
        'captionColor',
        ink('textSecondary', fallback.textSecondary),
      ),
      devotionalTextColor: color(
        'devotionalTextColor',
        themeBackground.computeLuminance() < .18
            ? const Color(0xFFF1D8AD)
            : ink('textPrimary', fallback.textPrimary),
      ),
      onPrimaryColor: color(
        'onPrimaryColor',
        color('buttonTextColor', const Color(0xFFFFFFFF)),
      ),
      headerTitleColor: color('headerTitleColor', fallback.headerTitleColor!),
      headerHerColor: color('headerHerColor', fallback.headerHerColor!),
      headerSubtitleColor: color(
        'headerSubtitleColor',
        fallback.headerSubtitleColor!,
      ),
      pinkSection: wash('pinkSection', fallback.pinkSection),
      greenSection: wash('greenSection', fallback.greenSection),
      purpleSection: wash('purpleSection', fallback.purpleSection),
      blueSection: wash('blueSection', fallback.blueSection),
      peachSection: wash('peachSection', fallback.peachSection),
      cardGradientStart: color(
        'cardGradientStart',
        color('blueSection', fallback.blueSection),
      ),
      cardGradientEnd: color(
        'cardGradientEnd',
        color('blueSection', fallback.blueSection),
      ),
      accent: color('accent', themePrimary),
      primaryButtonColor: color(
        'primaryButtonColor',
        fallback.primaryButtonColor ?? fallback.primary,
      ),
      primaryButtonGradientStartColor: color(
        'primaryButtonGradientStartColor',
        fallback.primaryButtonGradientStartColor!,
      ),
      primaryButtonTextColor: color(
        'primaryButtonTextColor',
        fallback.primaryButtonTextColor!,
      ),
      primaryButtonIconColor: color(
        'primaryButtonIconColor',
        fallback.primaryButtonIconColor!,
      ),
      primaryButtonIconBackgroundColor: color(
        'primaryButtonIconBackgroundColor',
        fallback.primaryButtonIconBackgroundColor!,
      ),
      primaryButtonBorderColor: color(
        'primaryButtonBorderColor',
        fallback.primaryButtonBorderColor!,
      ),
      secondaryButtonColor: color(
        'secondaryButtonColor',
        color('surface', fallback.surface),
      ),
      secondaryButtonTextColor: color(
        'secondaryButtonTextColor',
        color('primaryDark', fallback.primaryDark),
      ),
      secondaryButtonIconColor: color(
        'secondaryButtonIconColor',
        fallback.secondaryButtonIconColor!,
      ),
      secondaryButtonBorderColor: color(
        'secondaryButtonBorderColor',
        fallback.secondaryButtonBorderColor!,
      ),
      dangerButtonColor: color(
        'dangerButtonColor',
        color('primaryDark', fallback.primaryDark),
      ),
      dangerButtonTextColor: color(
        'dangerButtonTextColor',
        const Color(0xFFFFFFFF),
      ),
      videoActionColor: color('videoActionColor', fallback.videoActionColor),
      videoActionTextColor: color(
        'videoActionTextColor',
        fallback.videoActionTextColor,
      ),
      videoActionBorderColor: color(
        'videoActionBorderColor',
        fallback.videoActionBorderColor,
      ),
      profileCardColor: color('profileCardColor', fallback.profileCardColor),
      profileHeroStartColor: color(
        'profileHeroStartColor',
        fallback.profileHeroStartColor,
      ),
      profileHeroEndColor: color(
        'profileHeroEndColor',
        fallback.profileHeroEndColor,
      ),
      profileActionColor: color(
        'profileActionColor',
        fallback.profileActionColor,
      ),
      profileActionTextColor: color(
        'profileActionTextColor',
        fallback.profileActionTextColor,
      ),
      profileStatSurfaceColor: color(
        'profileStatSurfaceColor',
        fallback.profileStatSurfaceColor,
      ),
      profileStatTextColor: color(
        'profileStatTextColor',
        fallback.profileStatTextColor,
      ),
      buttonTextColor: color('buttonTextColor', Colors.white),
      // A remote preset written before the icon controls existed must still
      // look intentional.  Deriving these two values from its own palette
      // avoids the old pink icon layer leaking into a seasonal theme.
      // v9 makes the pink profile theme the application baseline: small
      // glyphs are white on a strong rose circle. Older published palettes
      // migrate to that accessible pairing until an editor saves a custom
      // icon pair from the control centre.
      iconColor: _version(json['presetVersion']) >= 9
          ? color('iconColor', fallback.iconColor)
          : Colors.white,
      iconBackgroundColor: _version(json['presetVersion']) >= 9
          ? color('iconBackgroundColor', fallback.iconBackgroundColor)
          : themePrimary,
      iconPinkBackgroundColor: color(
        'iconPinkBackgroundColor',
        fallback.iconPinkBackgroundColor,
      ),
      iconCreamBackgroundColor: color(
        'iconCreamBackgroundColor',
        fallback.iconCreamBackgroundColor,
      ),
      iconCreamGlyphColor: color(
        'iconCreamGlyphColor',
        fallback.iconCreamGlyphColor,
      ),
      sideIconColor: color(
        'sideIconColor',
        color('iconColor', fallback.iconColor),
      ),
      sideIconBackgroundColor: color(
        'sideIconBackgroundColor',
        color('iconBackgroundColor', fallback.iconBackgroundColor),
      ),
      // Phase 1.5: the static fallback preset never sets fitness colors (only
      // sunsetPink does), so forced `!` crashed fromJson for ANY input.
      // Safe chains below mirror the runtime routing in `herFitnessAccentOf`
      // (steps/calories → primary, workout → primaryDark); no new colors,
      // no contract change — `primary`/`primaryDark` are required non-null.
      fitnessStepsIconColor: color(
        'fitnessStepsIconColor',
        fallback.fitnessStepsIconColor ??
            fallback.fitnessStepsCircleColor ??
            fallback.primary,
      ),
      fitnessStepsCircleColor: color(
        'fitnessStepsCircleColor',
        fallback.fitnessStepsCircleColor ??
            fallback.fitnessStepsIconColor ??
            fallback.primary,
      ),
      fitnessStepsIconOpacity: _opacity(json['fitnessStepsIconOpacity'], 1),
      fitnessStepsCircleOpacity: _opacity(json['fitnessStepsCircleOpacity'], 1),
      fitnessCaloriesIconColor: color(
        'fitnessCaloriesIconColor',
        fallback.fitnessCaloriesIconColor ??
            fallback.fitnessCaloriesCircleColor ??
            fallback.primary,
      ),
      fitnessCaloriesCircleColor: color(
        'fitnessCaloriesCircleColor',
        fallback.fitnessCaloriesCircleColor ??
            fallback.fitnessCaloriesIconColor ??
            fallback.primary,
      ),
      fitnessCaloriesIconOpacity: _opacity(
        json['fitnessCaloriesIconOpacity'],
        1,
      ),
      fitnessCaloriesCircleOpacity: _opacity(
        json['fitnessCaloriesCircleOpacity'],
        1,
      ),
      fitnessWorkoutIconColor: color(
        'fitnessWorkoutIconColor',
        fallback.fitnessWorkoutIconColor ??
            fallback.fitnessWorkoutCircleColor ??
            fallback.primaryDark,
      ),
      fitnessWorkoutCircleColor: color(
        'fitnessWorkoutCircleColor',
        fallback.fitnessWorkoutCircleColor ??
            fallback.fitnessWorkoutIconColor ??
            fallback.primaryDark,
      ),
      fitnessWorkoutIconOpacity: _opacity(json['fitnessWorkoutIconOpacity'], 1),
      fitnessWorkoutCircleOpacity: _opacity(
        json['fitnessWorkoutCircleOpacity'],
        1,
      ),
      fitnessNutritionIconColor: color(
        'fitnessNutritionIconColor',
        fallback.fitnessNutritionIconColor ??
            fallback.fitnessNutritionCircleColor ??
            fallback.primary,
      ),
      fitnessNutritionCircleColor: color(
        'fitnessNutritionCircleColor',
        fallback.fitnessNutritionCircleColor ??
            fallback.fitnessNutritionIconColor ??
            fallback.primary,
      ),
      fitnessNutritionIconOpacity: _opacity(
        json['fitnessNutritionIconOpacity'],
        1,
      ),
      fitnessNutritionCircleOpacity: _opacity(
        json['fitnessNutritionCircleOpacity'],
        1,
      ),
      iconOpacity: _opacity(json['iconOpacity'], fallback.iconOpacity),
      iconBackgroundOpacity: _opacity(
        json['iconBackgroundOpacity'],
        fallback.iconBackgroundOpacity,
      ),
      iconCircleSize: _iconCircleSize(
        json['iconCircleSize'],
        fallback.iconCircleSize,
      ),
      iconGlyphSize: _iconGlyphSize(
        json['iconGlyphSize'],
        fallback.iconGlyphSize,
      ),
      backgroundOverlayOpacity: _opacity(
        json['backgroundOverlayOpacity'],
        fallback.backgroundOverlayOpacity,
      ),
      cardOpacity: _opacity(json['cardOpacity'], fallback.cardOpacity),
      secondaryCardOpacity: _opacity(
        json['secondaryCardOpacity'],
        fallback.secondaryCardOpacity,
      ),
      headerOpacity: _opacity(json['headerOpacity'], fallback.headerOpacity),
      sectionOpacity: _opacity(json['sectionOpacity'], fallback.sectionOpacity),
      navigationOpacity: _opacity(
        json['navigationOpacity'],
        fallback.navigationOpacity,
      ),
      navigationColor: color('navigationColor', fallback.navigationColor),
      navigationGradientStartColor: json['navigationGradientStartColor'] == null
          ? fallback.navigationGradientStartColor
          : color('navigationGradientStartColor', fallback.navigationColor),
      navigationGradientEndColor: json['navigationGradientEndColor'] == null
          ? fallback.navigationGradientEndColor
          : color('navigationGradientEndColor', fallback.navigationColor),
      navigationBorderColor: json['navigationBorderColor'] == null
          ? fallback.navigationBorderColor
          : color('navigationBorderColor', fallback.border),
      navigationBorderOpacity: _opacity(
        json['navigationBorderOpacity'],
        fallback.navigationBorderOpacity,
      ),
      navigationTextColor: color(
        'navigationTextColor',
        fallback.navigationTextColor,
      ),
      navigationActiveColor: json['navigationActiveColor'] == null
          ? fallback.navigationActiveColor
          : color(
              'navigationActiveColor',
              fallback.navigationActiveColor ?? fallback.navigationTextColor,
            ),
      navigationInactiveColor: json['navigationInactiveColor'] == null
          ? fallback.navigationInactiveColor
          : color(
              'navigationInactiveColor',
              fallback.navigationInactiveColor ?? fallback.navigationTextColor,
            ),
      journeyWaterFillColor: color(
        'journeyWaterFillColor',
        fallback.journeyWaterFillColor,
      ),
      // Phase 0: state tokens (absent = Pink Master derivations in
      // HerThemeData: selected = pinkSection wash + primaryDark fg).
      selectedSurfaceColor: color(
        'selectedSurfaceColor',
        color('pinkSection', fallback.pinkSection),
      ),
      selectedForegroundColor: json['selectedForegroundColor'] == null
          ? null
          : color('selectedForegroundColor', fallback.primaryDark),
      selectedBorderColor: color(
        'selectedBorderColor',
        color('primaryDark', fallback.primaryDark),
      ),
      unselectedSurfaceColor: color(
        'unselectedSurfaceColor',
        color('surface', fallback.surface),
      ),
      unselectedForegroundColor: color(
        'unselectedForegroundColor',
        color('textSecondary', fallback.textSecondary),
      ),
      unselectedBorderColor: color(
        'unselectedBorderColor',
        color('border', fallback.border),
      ),
      disabledOpacity: _opacity(
        json['disabledOpacity'],
        fallback.disabledOpacity,
      ),
      pressedOverlayOpacity: _opacity(
        json['pressedOverlayOpacity'],
        fallback.pressedOverlayOpacity,
      ),
      // Phase 0: switch + tab tokens (absent = Pink Master derivations).
      switchTrackSelectedColor: color(
        'switchTrackSelectedColor',
        color('primary', fallback.primary),
      ),
      switchThumbSelectedColor: color(
        'switchThumbSelectedColor',
        const Color(0xFFFFFFFF),
      ),
      switchTrackUnselectedColor: color(
        'switchTrackUnselectedColor',
        color('border', fallback.border),
      ),
      switchThumbUnselectedColor: color(
        'switchThumbUnselectedColor',
        const Color(0xFFFFFFFF),
      ),
      switchBorderColor: color(
        'switchBorderColor',
        color('border', fallback.border),
      ),
      tabSelectedForegroundColor: color(
        'tabSelectedForegroundColor',
        color('primaryDark', fallback.primaryDark),
      ),
      tabUnselectedForegroundColor: color(
        'tabUnselectedForegroundColor',
        color('textSecondary', fallback.textSecondary),
      ),
      tabIndicatorColor: color(
        'tabIndicatorColor',
        color('primary', fallback.primary),
      ),
      appGradientStart: appGradientStart,
      appGradientEnd: appGradientEnd,
      surfaceGradientStart: color(
        'surfaceGradientStart',
        color('surface', fallback.surface),
      ),
      surfaceGradientEnd: color(
        'surfaceGradientEnd',
        color('surface', fallback.surface),
      ),
      surfaceBorder: structuralBorder('surfaceBorder'),
      secondaryCardGradientStart: color(
        'secondaryCardGradientStart',
        color('surface', fallback.surface),
      ),
      secondaryCardGradientEnd: color(
        'secondaryCardGradientEnd',
        color('surface', fallback.surface),
      ),
      secondaryCardBorder: structuralBorder('secondaryCardBorder'),
      cardContentGradientStart: color(
        'cardContentGradientStart',
        color('surface', fallback.surface),
      ),
      cardContentGradientEnd: color(
        'cardContentGradientEnd',
        color('surface', fallback.surface),
      ),
      cardContentBorder: structuralBorder('cardContentBorder'),
      cardContentOpacity: _opacity(
        json['cardContentOpacity'] ?? json['cardOpacity'],
        fallback.cardContentOpacity,
      ),
      sectionGradientStart: color(
        'sectionGradientStart',
        color('cardGradientStart', color('blueSection', fallback.blueSection)),
      ),
      sectionGradientEnd: color(
        'sectionGradientEnd',
        color('cardGradientEnd', color('blueSection', fallback.blueSection)),
      ),
      sectionBorder: structuralBorder('sectionBorder'),
      componentStyles: {
        // Preserve editor-owned roles beyond the legacy card catalogue.
        // Hero actions and reading recipes must survive parsing and caching.
        for (final entry in rawComponentStyles.entries)
          if (entry.value is Map)
            entry.key.toString(): component(
              entry.key.toString(),
              fallback.componentStyle(entry.key.toString()),
            ),
        if ((json['componentStyles'] as Map?)?['floatingBar'] != null)
          'floatingBar': component(
            'floatingBar',
            ThemeComponentStyle(
              gradientStart: color('navigationColor', fallback.navigationColor),
              gradientEnd: color('navigationColor', fallback.navigationColor),
              border: color('border', fallback.border),
              opacity: 1,
            ),
          ),
        'header': component(
          'header',
          ThemeComponentStyle(
            gradientStart: color('headerColor', fallback.headerColor),
            gradientEnd: color('headerColor', fallback.headerColor),
            border: color('border', fallback.border),
            opacity: _opacity(json['headerOpacity'], fallback.headerOpacity),
          ),
        ),
        'surface': component(
          'surface',
          ThemeComponentStyle(
            gradientStart: color(
              'surfaceGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'surfaceGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color('surfaceBorder', color('border', fallback.border)),
            opacity: _opacity(json['cardOpacity'], fallback.cardOpacity),
          ),
        ),
        'secondaryCard': component(
          'secondaryCard',
          ThemeComponentStyle(
            gradientStart: color(
              'secondaryCardGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'secondaryCardGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color(
              'secondaryCardBorder',
              color('border', fallback.border),
            ),
            opacity: _opacity(
              json['secondaryCardOpacity'],
              fallback.secondaryCardOpacity,
            ),
          ),
        ),
        'popup': component(
          'popup',
          ThemeComponentStyle(
            gradientStart: color(
              'surfaceGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'surfaceGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color('surfaceBorder', color('border', fallback.border)),
            opacity: 1,
          ),
        ),
        // Phase 2 prep: independent bottom-sheet layer (same recipe as popup
        // today; modal chrome re-points in Phase 2/3).
        'bottomSheet': component(
          'bottomSheet',
          ThemeComponentStyle(
            gradientStart: color(
              'surfaceGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'surfaceGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color('surfaceBorder', color('border', fallback.border)),
            opacity: 1,
          ),
        ),
        'section': component(
          'section',
          ThemeComponentStyle(
            gradientStart: color(
              'sectionGradientStart',
              color('cardGradientStart', fallback.blueSection),
            ),
            gradientEnd: color(
              'sectionGradientEnd',
              color('cardGradientEnd', fallback.blueSection),
            ),
            border: color('sectionBorder', color('border', fallback.border)),
            opacity: _opacity(json['sectionOpacity'], fallback.sectionOpacity),
          ),
        ),
        'titleCard': component(
          'titleCard',
          ThemeComponentStyle(
            gradientStart: color(
              'sectionGradientStart',
              color('cardGradientStart', fallback.blueSection),
            ),
            gradientEnd: color(
              'sectionGradientEnd',
              color('cardGradientEnd', fallback.blueSection),
            ),
            border: color('sectionBorder', color('border', fallback.border)),
            opacity: _opacity(json['sectionOpacity'], fallback.sectionOpacity),
          ),
        ),
        'slide': component(
          'slide',
          ThemeComponentStyle(
            gradientStart: color(
              'sectionGradientStart',
              color('cardGradientStart', fallback.blueSection),
            ),
            gradientEnd: color(
              'sectionGradientEnd',
              color('cardGradientEnd', fallback.blueSection),
            ),
            border: color('sectionBorder', color('border', fallback.border)),
            opacity: _opacity(json['sectionOpacity'], fallback.sectionOpacity),
          ),
        ),
        'iconCard': component(
          'iconCard',
          ThemeComponentStyle(
            gradientStart: color(
              'iconBackgroundColor',
              fallback.iconBackgroundColor,
            ),
            gradientEnd: color(
              'iconBackgroundColor',
              fallback.iconBackgroundColor,
            ),
            border: color('border', fallback.border),
            opacity: _opacity(
              json['iconBackgroundOpacity'],
              fallback.iconBackgroundOpacity,
            ),
          ),
        ),
        'counter': component(
          'counter',
          ThemeComponentStyle(
            gradientStart: color(
              'surfaceGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'surfaceGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color('surfaceBorder', color('border', fallback.border)),
            opacity: 1,
          ),
        ),
        'searchField': component(
          'searchField',
          ThemeComponentStyle(
            gradientStart: color(
              'surfaceGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'surfaceGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color('surfaceBorder', color('border', fallback.border)),
            opacity: 1,
          ),
        ),
        // Phase 1 additive role keys (editor-overridable; legacy fallbacks
        // preserve current rendering when the key is absent).
        'cardLarge': component(
          'cardLarge',
          ThemeComponentStyle(
            gradientStart: color(
              'cardGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'cardGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color('surfaceBorder', color('border', fallback.border)),
            opacity: _opacity(
              json['cardLargeOpacity'] ?? json['cardOpacity'],
              .92,
            ),
          ),
        ),
        'cardMedium': component(
          'cardMedium',
          ThemeComponentStyle(
            gradientStart: color(
              'cardMediumGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'cardMediumGradientEnd',
              color('pinkSection', fallback.pinkSection),
            ),
            border: color('surfaceBorder', color('border', fallback.border)),
            opacity: _opacity(
              json['cardMediumOpacity'] ?? json['cardOpacity'],
              .94,
            ),
          ),
        ),
        'cardSmall': component(
          'cardSmall',
          ThemeComponentStyle(
            gradientStart: color(
              'surfaceGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'surfaceGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color('surfaceBorder', color('border', fallback.border)),
            opacity: _opacity(
              json['cardSmallOpacity'] ?? json['cardOpacity'],
              .96,
            ),
          ),
        ),
        if ((json['componentStyles'] as Map?)?['cardShortcut'] != null)
          'cardShortcut': component(
            'cardShortcut',
            fallback.componentStyle('cardShortcut'),
          ),
        'cardWide': component(
          'cardWide',
          ThemeComponentStyle(
            gradientStart: color(
              'secondaryCardGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'secondaryCardGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color(
              'secondaryCardBorder',
              color('border', fallback.border),
            ),
            opacity: _opacity(
              json['cardWideOpacity'] ?? json['secondaryCardOpacity'],
              .90,
            ),
          ),
        ),
        'cardJourney': component(
          'cardJourney',
          ThemeComponentStyle(
            gradientStart: color(
              'surfaceGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'surfaceGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color('surfaceBorder', color('border', fallback.border)),
            opacity: _opacity(
              json['cardJourneyOpacity'] ?? json['cardOpacity'],
              fallback.sectionOpacity,
            ),
          ),
        ),
        'cardHero': component(
          'cardHero',
          ThemeComponentStyle(
            gradientStart: color(
              'secondaryCardGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'secondaryCardGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color(
              'secondaryCardBorder',
              color('border', fallback.border),
            ),
            opacity: _opacity(
              json['cardHeroOpacity'] ?? json['secondaryCardOpacity'],
              .90,
            ),
          ),
        ),
        'cardContent': component(
          'cardContent',
          ThemeComponentStyle(
            gradientStart: color(
              'cardContentGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'cardContentGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color(
              'cardContentBorder',
              color('border', fallback.border),
            ),
            opacity: _opacity(
              json['cardContentOpacity'] ?? json['cardOpacity'],
              fallback.cardContentOpacity,
            ),
            // Pink Master recipe (mirrors the componentStyle literal path):
            // long-form readable cards use radius 20 + soft primary shadow.
            borderWidth: 1,
            radius: 20,
            shadowColor: fallback.primary,
            shadowOpacity: .06,
            shadowBlur: 14,
            shadowOffsetX: 0,
            shadowOffsetY: 6,
          ),
        ),
        'listRow': component(
          'listRow',
          ThemeComponentStyle(
            gradientStart: color(
              'surfaceGradientStart',
              color('surface', fallback.surface),
            ),
            gradientEnd: color(
              'surfaceGradientEnd',
              color('surface', fallback.surface),
            ),
            border: color('surfaceBorder', color('border', fallback.border)),
            opacity: _opacity(json['cardOpacity'], fallback.cardOpacity),
          ),
        ),
        'journeyPulseCard': component(
          'journeyPulseCard',
          const ThemeComponentStyle(
            gradientStart: Color(0xFFFFFCFB),
            gradientEnd: Color(0xFFFFFCFB),
            border: Color(0xFFE8CCD5),
            opacity: 1,
          ),
        ),
        'hydrationCard': component(
          'hydrationCard',
          const ThemeComponentStyle(
            gradientStart: Color(0xFFEAF7FB),
            gradientEnd: Color(0xFFDDF4FA),
            border: Color(0xFFA6DDEA),
            opacity: 1,
          ),
        ),
        'sleepCard': component(
          'sleepCard',
          const ThemeComponentStyle(
            gradientStart: Color(0xFFF4EFF9),
            gradientEnd: Color(0xFFECE6F7),
            border: Color(0xFFD7C9EA),
            opacity: 1,
          ),
        ),
        'cycleCalendarCard': component(
          'cycleCalendarCard',
          const ThemeComponentStyle(
            gradientStart: Color(0xFFFCECEF),
            gradientEnd: Color(0xFFFCECEF),
            border: Color(0xFFE8CCD5),
            opacity: 1,
          ),
        ),
        'faithDailyStatsIcon': component(
          'faithDailyStatsIcon',
          const ThemeComponentStyle(
            gradientStart: Color(0xFFCB5C7F),
            gradientEnd: Color(0xFFCB5C7F),
            border: Color(0xFFF0DFE4),
            opacity: 1,
          ),
        ),
      },
      backgroundImageUrl: _url(json['backgroundImageUrl']),
      headerImageUrl: _url(json['headerImageUrl']),
      pageHeaderImages: _pageHeaderImages(json['pageHeaderImages']),
      pageHeroImages: _pageHeaderImages(json['pageHeroImages']),
      pageHeroCopy: _pageHeaderCopy(json['pageHeroCopy']),
      pageHeaderCopy: _pageHeaderCopy(json['pageHeaderCopy']),
      pageHeaderStyles: _pageHeaderStyles(json['pageHeaderStyles']),
      welcomeBackgroundImageUrl: _url(json['welcomeBackgroundImageUrl']),
      welcomeGradientStart: color('welcomeGradientStart', themeBackground),
      welcomeGradientEnd: color('welcomeGradientEnd', themePrimaryLight),
      welcomeLogoImageUrl: _url(json['welcomeLogoImageUrl']),
      welcomeLogoScale: _welcomeLogoScale(json['welcomeLogoScale']),
      welcomeCopy: _stringMap(json['welcomeCopy']),
      welcomeTitleColor: color('welcomeTitleColor', fallback.welcomeTitleColor),
      welcomeSubtitleColor: color(
        'welcomeSubtitleColor',
        fallback.welcomeSubtitleColor,
      ),
      welcomeFooterColor: color(
        'welcomeFooterColor',
        fallback.welcomeFooterColor,
      ),
      welcomeGoogleButtonColor: color(
        'welcomeGoogleButtonColor',
        fallback.welcomeGoogleButtonColor,
      ),
      welcomeGoogleButtonTextColor: color(
        'welcomeGoogleButtonTextColor',
        fallback.welcomeGoogleButtonTextColor,
      ),
      welcomeGuestButtonColor: color(
        'welcomeGuestButtonColor',
        fallback.welcomeGuestButtonColor,
      ),
      welcomeGuestButtonTextColor: color(
        'welcomeGuestButtonTextColor',
        fallback.welcomeGuestButtonTextColor,
      ),
      welcomeGuestButtonBorderColor: color(
        'welcomeGuestButtonBorderColor',
        fallback.welcomeGuestButtonBorderColor,
      ),
      homeHeaderLogoImageUrl: _url(json['homeHeaderLogoImageUrl']),
      headerLogoMessage: (json['headerLogoMessage'] as String? ?? '').trim(),
      headerLogoMoodTitles: _stringMap(json['headerLogoMoodTitles']),
      headerLogoMoodMessages: _stringMap(json['headerLogoMoodMessages']),
      seasonalLogoTitle: (json['seasonalLogoTitle'] as String? ?? '').trim(),
      seasonalLogoMessage: (json['seasonalLogoMessage'] as String? ?? '')
          .trim(),
      seasonalLogoImageUrl: _url(json['seasonalLogoImageUrl']),
      seasonalLogoSoundUrl: _soundUrl(json['seasonalLogoSoundUrl']),
      seasonalLogoSoundVolume: _opacity(json['seasonalLogoSoundVolume'], .55),
      seasonalLogoCardColor: json['seasonalLogoCardColor'] == null
          ? null
          : color('seasonalLogoCardColor', fallback.surface),
      seasonalLogoCardOpacity: _opacity(json['seasonalLogoCardOpacity'], .92),
      seasonalLogoTitleColor: json['seasonalLogoTitleColor'] == null
          ? null
          : color('seasonalLogoTitleColor', fallback.textPrimary),
      seasonalLogoMessageColor: json['seasonalLogoMessageColor'] == null
          ? null
          : color('seasonalLogoMessageColor', fallback.textSecondary),
      homeMoodMessages: _stringListMap(json['homeMoodMessages']),
      homeHeroImageUrl: _url(json['homeHeroImageUrl']),
      scheduleEnabled: json['scheduleEnabled'] == true,
      scheduleStart: _seasonDate(json['scheduleStart']),
      scheduleEnd: _seasonDate(json['scheduleEnd']),
      schedulePriority: _schedulePriority(json['schedulePriority']),
      modernAccents: _modernAccentMap(json['modernAccents']),
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'presetVersion': presetVersion,
    'controlSchemaVersion': controlSchemaVersion,
    'primary': _toHex(primary),
    'primaryDark': _toHex(primaryDark),
    'primaryLight': _toHex(primaryLight),
    'background': _toHex(background),
    'surface': _toHex(surface),
    'headerColor': _toHex(headerColor),
    'border': _toHex(border),
    'textPrimary': _toHex(textPrimary),
    'textSecondary': _toHex(textSecondary),
    'sectionTitleColor': _toHex(sectionTitleColor ?? textPrimary),
    'headingPrimaryColor': _toHex(headingPrimaryColor ?? primary),
    'headingSecondaryColor': _toHex(headingSecondaryColor ?? primaryDark),
    'heroTitleColor': _toHex(heroTitleColor ?? textPrimary),
    'heroSubtitleColor': _toHex(heroSubtitleColor ?? textSecondary),
    'cardTitleColor': _toHex(cardTitleColor ?? primaryDark),
    'cardSubtitleColor': _toHex(cardSubtitleColor ?? textSecondary),
    'sectionSubtitleColor': _toHex(sectionSubtitleColor ?? textSecondary),
    'bodyPrimaryColor': _toHex(bodyPrimaryColor ?? textPrimary),
    'bodySecondaryColor': _toHex(bodySecondaryColor ?? textSecondary),
    'captionColor': _toHex(captionColor ?? textSecondary),
    'devotionalTextColor': _toHex(devotionalTextColor ?? textPrimary),
    'onPrimaryColor': _toHex(onPrimaryColor ?? buttonTextColor ?? Colors.white),
    'headerTitleColor': _toHex(headerTitleColor ?? textPrimary),
    'headerHerColor': _toHex(headerHerColor ?? const Color(0xFFFF5C91)),
    'headerSubtitleColor': _toHex(headerSubtitleColor ?? textSecondary),
    'pinkSection': _toHex(pinkSection),
    'greenSection': _toHex(greenSection),
    'purpleSection': _toHex(purpleSection),
    'blueSection': _toHex(blueSection),
    'peachSection': _toHex(peachSection),
    'accent': _toHex(accent ?? primary),
    'primaryButtonColor': _toHex(primaryButtonColor ?? primary),
    'primaryButtonGradientStartColor': _toHex(
      primaryButtonGradientStartColor ?? primaryDark,
    ),
    'primaryButtonTextColor': _toHex(primaryButtonTextColor ?? Colors.white),
    'primaryButtonIconColor': _toHex(primaryButtonIconColor ?? primaryDark),
    'primaryButtonIconBackgroundColor': _toHex(
      primaryButtonIconBackgroundColor ?? Colors.white,
    ),
    'primaryButtonBorderColor': _toHex(
      primaryButtonBorderColor ?? Colors.white,
    ),
    'secondaryButtonColor': _toHex(secondaryButtonColor ?? surface),
    'secondaryButtonTextColor': _toHex(secondaryButtonTextColor ?? primaryDark),
    'secondaryButtonIconColor': _toHex(secondaryButtonIconColor ?? primary),
    'secondaryButtonBorderColor': _toHex(secondaryButtonBorderColor ?? border),
    'dangerButtonColor': _toHex(dangerButtonColor ?? primaryDark),
    'dangerButtonTextColor': _toHex(dangerButtonTextColor ?? Colors.white),
    'videoActionColor': _toHex(videoActionColor),
    'videoActionTextColor': _toHex(videoActionTextColor),
    'videoActionBorderColor': _toHex(videoActionBorderColor),
    'profileCardColor': _toHex(profileCardColor),
    'profileHeroStartColor': _toHex(profileHeroStartColor),
    'profileHeroEndColor': _toHex(profileHeroEndColor),
    'profileActionColor': _toHex(profileActionColor),
    'profileActionTextColor': _toHex(profileActionTextColor),
    'profileStatSurfaceColor': _toHex(profileStatSurfaceColor),
    'profileStatTextColor': _toHex(profileStatTextColor),
    'buttonTextColor': _toHex(buttonTextColor ?? Colors.white),
    'iconColor': _toHex(iconColor),
    'iconBackgroundColor': _toHex(iconBackgroundColor),
    'iconPinkBackgroundColor': _toHex(iconPinkBackgroundColor),
    'iconCreamBackgroundColor': _toHex(iconCreamBackgroundColor),
    'iconCreamGlyphColor': _toHex(iconCreamGlyphColor),
    'sideIconColor': _toHex(sideIconColor ?? iconColor),
    'sideIconBackgroundColor': _toHex(
      sideIconBackgroundColor ?? iconBackgroundColor,
    ),
    'fitnessStepsIconColor': _toHex(fitnessStepsIconColor ?? primary),
    'fitnessStepsCircleColor': _toHex(fitnessStepsCircleColor ?? primary),
    'fitnessStepsIconOpacity': fitnessStepsIconOpacity,
    'fitnessStepsCircleOpacity': fitnessStepsCircleOpacity,
    'fitnessCaloriesIconColor': _toHex(fitnessCaloriesIconColor ?? primary),
    'fitnessCaloriesCircleColor': _toHex(fitnessCaloriesCircleColor ?? primary),
    'fitnessCaloriesIconOpacity': fitnessCaloriesIconOpacity,
    'fitnessCaloriesCircleOpacity': fitnessCaloriesCircleOpacity,
    'fitnessWorkoutIconColor': _toHex(fitnessWorkoutIconColor ?? primaryDark),
    'fitnessWorkoutCircleColor': _toHex(
      fitnessWorkoutCircleColor ?? primaryDark,
    ),
    'fitnessWorkoutIconOpacity': fitnessWorkoutIconOpacity,
    'fitnessWorkoutCircleOpacity': fitnessWorkoutCircleOpacity,
    'fitnessNutritionIconColor': _toHex(fitnessNutritionIconColor ?? primary),
    'fitnessNutritionCircleColor': _toHex(
      fitnessNutritionCircleColor ?? primary,
    ),
    'fitnessNutritionIconOpacity': fitnessNutritionIconOpacity,
    'fitnessNutritionCircleOpacity': fitnessNutritionCircleOpacity,
    'iconOpacity': iconOpacity,
    'iconBackgroundOpacity': iconBackgroundOpacity,
    'iconCircleSize': iconCircleSize,
    'iconGlyphSize': iconGlyphSize,
    'backgroundOverlayOpacity': backgroundOverlayOpacity,
    'cardOpacity': cardOpacity,
    'secondaryCardOpacity': secondaryCardOpacity,
    'headerOpacity': headerOpacity,
    'sectionOpacity': sectionOpacity,
    'navigationOpacity': navigationOpacity,
    'navigationColor': _toHex(navigationColor),
    'navigationGradientStartColor': _toHex(
      navigationGradientStartColor ?? navigationColor,
    ),
    'navigationGradientEndColor': _toHex(
      navigationGradientEndColor ??
          (Color.lerp(navigationColor, Colors.black, .26) ?? navigationColor),
    ),
    'navigationBorderColor': _toHex(
      navigationBorderColor ?? navigationActiveColor ?? navigationTextColor,
    ),
    'navigationBorderOpacity': navigationBorderOpacity,
    'navigationTextColor': _toHex(navigationTextColor),
    'navigationActiveColor': _toHex(
      navigationActiveColor ?? navigationTextColor,
    ),
    'navigationInactiveColor': _toHex(
      navigationInactiveColor ?? navigationTextColor.withValues(alpha: .62),
    ),
    'journeyWaterFillColor': _toHex(journeyWaterFillColor),
    'selectedSurfaceColor': _toHex(selectedSurfaceColor ?? pinkSection),
    'selectedForegroundColor': _toHex(selectedForegroundColor ?? primaryDark),
    'selectedBorderColor': _toHex(selectedBorderColor ?? primaryDark),
    'unselectedSurfaceColor': _toHex(unselectedSurfaceColor ?? surface),
    'unselectedForegroundColor': _toHex(
      unselectedForegroundColor ?? textSecondary,
    ),
    'unselectedBorderColor': _toHex(unselectedBorderColor ?? border),
    'disabledOpacity': disabledOpacity,
    'pressedOverlayOpacity': pressedOverlayOpacity,
    'switchTrackSelectedColor': _toHex(switchTrackSelectedColor ?? primary),
    'switchThumbSelectedColor': _toHex(
      switchThumbSelectedColor ?? Colors.white,
    ),
    'switchTrackUnselectedColor': _toHex(switchTrackUnselectedColor ?? border),
    'switchThumbUnselectedColor': _toHex(
      switchThumbUnselectedColor ?? Colors.white,
    ),
    'switchBorderColor': _toHex(switchBorderColor ?? border),
    'tabSelectedForegroundColor': _toHex(
      tabSelectedForegroundColor ?? primaryDark,
    ),
    'tabUnselectedForegroundColor': _toHex(
      tabUnselectedForegroundColor ?? textSecondary,
    ),
    'tabIndicatorColor': _toHex(tabIndicatorColor ?? primary),
    'appGradientStart': _toHex(appGradientStart ?? background),
    'appGradientEnd': _toHex(appGradientEnd ?? background),
    'surfaceGradientStart': _toHex(surfaceGradientStart ?? surface),
    'surfaceGradientEnd': _toHex(surfaceGradientEnd ?? surface),
    'surfaceBorder': _toHex(surfaceBorder ?? border),
    'cardMediumGradientStart': _toHex(cardMediumGradientStart ?? surface),
    'cardMediumGradientEnd': _toHex(cardMediumGradientEnd ?? pinkSection),
    'secondaryCardGradientStart': _toHex(secondaryCardGradientStart ?? surface),
    'secondaryCardGradientEnd': _toHex(secondaryCardGradientEnd ?? surface),
    'secondaryCardBorder': _toHex(secondaryCardBorder ?? border),
    'cardContentGradientStart': _toHex(cardContentGradientStart ?? surface),
    'cardContentGradientEnd': _toHex(cardContentGradientEnd ?? surface),
    'cardContentBorder': _toHex(cardContentBorder ?? border),
    'cardContentOpacity': cardContentOpacity,
    'sectionGradientStart': _toHex(
      sectionGradientStart ?? cardGradientStart ?? blueSection,
    ),
    'sectionGradientEnd': _toHex(
      sectionGradientEnd ?? cardGradientEnd ?? blueSection,
    ),
    'sectionBorder': _toHex(sectionBorder ?? border),
    'componentStyles': {
      for (final entry in componentStyles.entries)
        entry.key: entry.value.toJson(),
    },
    'cardGradientStart': _toHex(cardGradientStart ?? blueSection),
    'cardGradientEnd': _toHex(cardGradientEnd ?? blueSection),
    'backgroundImageUrl': backgroundImageUrl,
    'headerImageUrl': headerImageUrl,
    'pageHeaderImages': pageHeaderImages,
    'pageHeroImages': pageHeroImages,
    'pageHeroCopy': pageHeroCopy,
    'pageHeaderCopy': pageHeaderCopy,
    'pageHeaderStyles': {
      for (final entry in pageHeaderStyles.entries)
        entry.key: {
          for (final color in entry.value.entries)
            color.key: _toHex(color.value),
        },
    },
    'welcomeBackgroundImageUrl': welcomeBackgroundImageUrl,
    'welcomeGradientStart': _toHex(welcomeGradientStart),
    'welcomeGradientEnd': _toHex(welcomeGradientEnd),
    'welcomeLogoImageUrl': welcomeLogoImageUrl,
    'welcomeLogoScale': welcomeLogoScale,
    'welcomeCopy': welcomeCopy,
    'welcomeTitleColor': _toHex(welcomeTitleColor),
    'welcomeSubtitleColor': _toHex(welcomeSubtitleColor),
    'welcomeFooterColor': _toHex(welcomeFooterColor),
    'welcomeGoogleButtonColor': _toHex(welcomeGoogleButtonColor),
    'welcomeGoogleButtonTextColor': _toHex(welcomeGoogleButtonTextColor),
    'welcomeGuestButtonColor': _toHex(welcomeGuestButtonColor),
    'welcomeGuestButtonTextColor': _toHex(welcomeGuestButtonTextColor),
    'welcomeGuestButtonBorderColor': _toHex(welcomeGuestButtonBorderColor),
    'homeHeaderLogoImageUrl': homeHeaderLogoImageUrl,
    'headerLogoMessage': headerLogoMessage,
    'headerLogoMoodTitles': headerLogoMoodTitles,
    'headerLogoMoodMessages': headerLogoMoodMessages,
    'seasonalLogoTitle': seasonalLogoTitle,
    'seasonalLogoMessage': seasonalLogoMessage,
    'seasonalLogoImageUrl': seasonalLogoImageUrl,
    'seasonalLogoSoundUrl': seasonalLogoSoundUrl,
    'seasonalLogoSoundVolume': seasonalLogoSoundVolume,
    if (seasonalLogoCardColor != null)
      'seasonalLogoCardColor': _toHex(seasonalLogoCardColor!),
    'seasonalLogoCardOpacity': seasonalLogoCardOpacity,
    if (seasonalLogoTitleColor != null)
      'seasonalLogoTitleColor': _toHex(seasonalLogoTitleColor!),
    if (seasonalLogoMessageColor != null)
      'seasonalLogoMessageColor': _toHex(seasonalLogoMessageColor!),
    'homeMoodMessages': homeMoodMessages,
    'homeHeroImageUrl': homeHeroImageUrl,
    'scheduleEnabled': scheduleEnabled,
    'scheduleStart': scheduleStart,
    'scheduleEnd': scheduleEnd,
    'schedulePriority': schedulePriority,
    // Additive Step 2 payload. Emitted only when at least one family is
    // authored so every legacy `toJson()` stays byte-identical.
    if (modernAccents.isNotEmpty) 'modernAccents': modernAccents,
  };

  /// Parses the additive Step 2 accent map. Unknown families/fields and
  /// malformed hex are discarded (fallbacks apply); absent means legacy.
  static Map<String, Map<String, String>> _modernAccentMap(Object? value) {
    const families = {'rose', 'lavender', 'mint', 'softBlue', 'coral', 'sage'};
    const fields = {
      'accentColor',
      'subtleBackground',
      'foreground',
      'iconBackground',
      'iconForeground',
      'progressTrack',
      'progressFill',
    };
    if (value is! Map) return const {};
    final result = <String, Map<String, String>>{};
    for (final entry in value.entries) {
      final family = entry.key;
      if (family is! String || !families.contains(family)) continue;
      if (entry.value is! Map) continue;
      final parsed = <String, String>{};
      for (final field in (entry.value as Map).entries) {
        if (field.key is! String || !fields.contains(field.key)) continue;
        final hex = field.value is String ? (field.value as String).trim() : '';
        if (!RegExp(r'^#[0-9a-fA-F]{6}$').hasMatch(hex)) continue;
        parsed[field.key as String] = hex.toUpperCase();
      }
      if (parsed.isNotEmpty) result[family] = parsed;
    }
    return result;
  }

  static Color _parseColor(Object? value, Color fallback) {
    final text = value is String ? value.trim().replaceFirst('#', '') : '';
    if (!RegExp(r'^(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$').hasMatch(text)) return fallback;
    return Color(int.parse(text.length == 6 ? 'FF$text' : text, radix: 16));
  }

  static bool _usesPinkMasterIdentity(String name) {
    final normalized = name.replaceAll(RegExp(r'\s+'), '').toLowerCase();
    return const {
      'زهريمشرق',
      'herالوردي',
      'herروشة',
      'herروشتة',
    }.contains(normalized);
  }

  /// Keep neutral published ink within the permanent HER dusty-rose family.
  /// Lightness and alpha are retained, so readability stays editor-owned.
  static Color _retintNeutralInk(Color color) {
    final hsl = HSLColor.fromColor(color);
    if (hsl.saturation >= .08) return color;
    return hsl.withHue(342).withSaturation(.22).toColor();
  }

  /// The base HER palette reserves wash slots for warm blush/mauve shades.
  /// Cyan, blue, and periwinkle input is a legacy visual identity and falls
  /// back to the matching Pink Master wash. Seasonal presets bypass this.
  static Color _guardPinkMasterWash(Color color, Color fallbackColor) {
    final hsl = HSLColor.fromColor(color);
    final isForeignBlue =
        hsl.saturation >= .10 && hsl.hue >= 170 && hsl.hue <= 295;
    return isForeignBlue ? fallbackColor : color;
  }

  static String _toHex(Color color) =>
      '#${color.toARGB32().toRadixString(16).padLeft(8, '0').substring(color.a < 1 ? 0 : 2).toUpperCase()}';

  static double _opacity(Object? value, double fallback) {
    final number = value is num ? value.toDouble() : double.tryParse('$value');
    return number == null || number < 0 || number > 1 ? fallback : number;
  }

  static double _welcomeLogoScale(Object? value) {
    final parsed = value is num ? value.toDouble() : double.tryParse('$value');
    return parsed == null ? 1.2 : parsed.clamp(.7, 1.55).toDouble();
  }

  static double _iconCircleSize(Object? value, double fallback) {
    final parsed = value is num ? value.toDouble() : double.tryParse('$value');
    return parsed == null ? fallback : parsed.clamp(28, 56).toDouble();
  }

  // The glyph intentionally has a smaller valid range than its circle.
  // Keeping these validators separate prevents a dashboard value such as 20
  // from being incorrectly raised to 28, which made every icon look large.
  static double _iconGlyphSize(Object? value, double fallback) {
    final parsed = value is num ? value.toDouble() : double.tryParse('$value');
    return parsed == null ? fallback : parsed.clamp(12, 32).toDouble();
  }

  static int _version(Object? value) {
    final number = value is num ? value.toInt() : int.tryParse('$value');
    return number == null || number < 1 || number > 100 ? 1 : number;
  }

  static String _url(Object? value) {
    final text = value is String ? value.trim() : '';
    // Bundled artwork lives under assets/images/ (theme heroines in the
    // themes/ subfolder, shared brand art such as logoside/her_welcome and
    // review heroines at the images root). The previous themes/-only pattern
    // silently blanked legitimate bundled URLs (header logo, welcome logo,
    // white_light hero), falling back to defaults with no diagnosis.
    if (RegExp(
      r'^assets/images/[a-z0-9_/-]+\.(png|webp|jpe?g)$',
      caseSensitive: false,
    ).hasMatch(text)) {
      return text;
    }
    final uri = Uri.tryParse(text);
    return uri != null && (uri.scheme == 'https' || uri.scheme == 'http')
        ? text
        : '';
  }

  static String _soundUrl(Object? value) {
    final text = value is String ? value.trim() : '';
    if (RegExp(
      r'^assets/sounds/[a-z0-9_/-]+\.(mp3|m4a|wav|ogg)$',
      caseSensitive: false,
    ).hasMatch(text)) {
      return text;
    }
    final uri = Uri.tryParse(text);
    return uri != null && (uri.scheme == 'https' || uri.scheme == 'http')
        ? text
        : '';
  }

  static String _seasonDate(Object? value) {
    final text = value is String ? value.trim() : '';
    return RegExp(r'^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$').hasMatch(text)
        ? text
        : '';
  }

  static int _schedulePriority(Object? value) {
    final number = value is num ? value.toInt() : int.tryParse('$value');
    return number == null ? 0 : number.clamp(-100, 100);
  }

  static Map<String, String> _pageHeaderImages(Object? value) {
    if (value is! Map) return const {};
    return Map.unmodifiable({
      for (final entry in value.entries)
        if (entry.key is String && _url(entry.value).isNotEmpty)
          entry.key as String: _url(entry.value),
    });
  }

  static Map<String, String> _stringMap(Object? value) {
    if (value is! Map) return const {};
    final result = <String, String>{};
    for (final entry in value.entries) {
      if (entry.key is! String || entry.value is! String) continue;
      final key = entry.key.trim();
      final text = entry.value.trim();
      if (key.isNotEmpty && text.isNotEmpty) result[key] = text;
    }
    return Map.unmodifiable(result);
  }

  static Map<String, List<String>> _stringListMap(Object? value) {
    if (value is! Map) return const {};
    final result = <String, List<String>>{};
    for (final entry in value.entries) {
      if (entry.key is! String || entry.value is! List) continue;
      final key = entry.key.trim();
      final messages = (entry.value as List)
          .whereType<String>()
          .map((message) => message.trim())
          .where((String message) => message.isNotEmpty)
          .toList(growable: false);
      if (key.isNotEmpty && messages.isNotEmpty) {
        result[key] = List.unmodifiable(messages);
      }
    }
    return Map.unmodifiable(result);
  }

  static Map<String, Map<String, String>> _pageHeaderCopy(Object? value) {
    if (value is! Map) return const {};
    final result = <String, Map<String, String>>{};
    for (final entry in value.entries) {
      if (entry.key is! String || entry.value is! Map) continue;
      final copy = <String, String>{};
      for (final field in const ['title', 'subtitle']) {
        final text = entry.value[field];
        if (text is String && text.trim().isNotEmpty) copy[field] = text.trim();
      }
      if (copy.isNotEmpty) result[entry.key] = Map.unmodifiable(copy);
    }
    return Map.unmodifiable(result);
  }

  static Map<String, Map<String, Color>> _pageHeaderStyles(Object? value) {
    if (value is! Map) return const {};
    final result = <String, Map<String, Color>>{};
    for (final entry in value.entries) {
      if (entry.key is! String || entry.value is! Map) continue;
      final styles = <String, Color>{};
      for (final field in const ['titleColor', 'subtitleColor', 'herColor']) {
        final raw = entry.value[field];
        if (raw is String) {
          final color = _parseColor(raw, Colors.transparent);
          if (color != Colors.transparent) styles[field] = color;
        }
      }
      if (styles.isNotEmpty) result[entry.key] = Map.unmodifiable(styles);
    }
    return Map.unmodifiable(result);
  }

  /// Selects a page-specific image when present and gracefully falls back to
  /// the shared inner-page header image for older theme configurations.
  String pageHeaderImage(String key) => pageHeaderImages[key] ?? headerImageUrl;

  /// Returns only an explicit page artwork. Widgets retain their bundled
  /// illustration when the control centre has no replacement configured.
  String pageHeroImage(String key) => pageHeroImages[key] ?? '';

  String pageHeroTitle(String key, String fallback) =>
      pageHeroCopy[key]?['title'] ?? fallback;

  String pageHeroSubtitle(String key, String fallback) =>
      pageHeroCopy[key]?['subtitle'] ?? fallback;

  String pageHeaderTitle(String key, String fallback) =>
      pageHeaderCopy[key]?['title'] ?? fallback;

  String pageHeaderSubtitle(String key, String fallback) =>
      pageHeaderCopy[key]?['subtitle'] ?? fallback;

  Color pageHeaderTitleColor(String key, Color fallback) =>
      pageHeaderStyles[key]?['titleColor'] ?? fallback;

  Color pageHeaderSubtitleColor(String key, Color fallback) =>
      pageHeaderStyles[key]?['subtitleColor'] ?? fallback;

  /// Each page header may tune the HER word independently from its title and
  /// subtitle, keeping the brand legible over its own artwork and gradient.
  Color pageHeaderHerColor(String key, Color fallback) =>
      pageHeaderStyles[key]?['herColor'] ?? fallback;

  /// Resolves the HER-logo greeting from the Home check-in. The bundled
  /// messages preserve a useful response even before the first CMS publish;
  /// Theme Studio values always replace them one mood at a time.
  String headerLogoMessageForMood(String? mood) {
    final key = mood?.trim() ?? '';
    final configured = headerLogoMoodMessages[key]?.trim() ?? '';
    if (configured.isNotEmpty) return configured;
    const defaults = <String, String>{
      'سعيدة': 'حلو إن في لحظة منوّرة يومكِ — احتفظي بها لنفسك.',
      'هادئة': 'خد مساحتك بهدوء، وأنا هنا لو احتجت أي خطوة بسيطة.',
      'حزينة':
          'لو الحزن تقيل اليوم، لا تحاول تبرّره أو تسرّعه. اختار شيئًا صغيرًا يخفف الحمل الآن: ماء، مكان هادئ، أو رسالة لشخص آمن.',
      'قلقة':
          'القلب القلق يحاول حمايتك، لكنه لا يحتاج أن يقود كل شيء. ثبّت قدميك، خذ زفيرًا أطول، واختار مهمة واحدة فقط لهذه الساعة.',
      'متعبة':
          'التعب معلومة، وليس تقصيرًا. خفّفي مطلبًا واحدًا اليوم، وكلي أو اشربي شيئًا بسيطًا قبل أن تطلبي من نفسكِ المزيد.',
      'غاضبة':
          'الغضب يشير إلى حدٍّ أو احتياج مهم. ابتعد دقيقة عن الرد، اكتب ما أزعجك، ثم قرر ما تريد قوله بوضوح.',
    };
    return defaults[key] ??
        (headerLogoMessage.isEmpty
            ? 'أنا هنا عشان أساعدك تاخد خطوة لطيفة لنفسك اليوم.'
            : headerLogoMessage);
  }

  String headerLogoTitleForMood(String? mood) {
    final key = mood?.trim() ?? '';
    final configured = headerLogoMoodTitles[key]?.trim() ?? '';
    if (configured.isNotEmpty) return configured;
    return switch (key) {
      'حزينة' => 'الحزن يحتاج مساحة، لا حكمًا',
      'قلقة' => 'خلّينا نعيدكِ للحظة الحالية',
      'متعبة' => 'جسمكِ يستحق التخفيف',
      'غاضبة' => 'خذ مساحة قبل أي قرار',
      'هادئة' => 'مساحتك الهادئة محفوظة',
      'سعيدة' => 'احتفظي بلحظتكِ الجميلة',
      _ => 'أهلًا بكِ في HER',
    };
  }

  /// Applies the single dashboard setting used by every semantic coloured
  /// card.  Keeping this here prevents individual screens from accidentally
  /// replacing the configured alpha with a hard-coded value.
  Color coloredCard(Color color, [double strength = 1]) =>
      color.withValues(alpha: (sectionOpacity * strength).clamp(0.0, 1.0));

  /// Semantic identity tokens. Derived from the base palette so older remote
  /// themes (which only send the base fields) keep working without migration.
  /// Screens must use these instead of hard-coded `Color(0x...)` values.
  Color get ink => textPrimary;
  Color get subtle => textSecondary;
  Color get accentStrong => primaryDark;
  Color get softBorder => border;
  Color get softSurface => surface;
  Color get canvas => background;

  /// The white (or themed) header surface is intentionally independent from
  /// coloured cards, so it can be adjusted from the dashboard on its own.
  Color get headerSurface => headerColor.withValues(alpha: headerOpacity);

  /// Contrast-aware header foreground. LIGHT cream/blush headers keep dark
  /// burgundy text; STRONG rose/burgundy headers switch to white.
  /// Never returns black — normal HER text uses the warm hierarchy.
  Color get headerForeground =>
      headerTitleColor ??
      (headerSurface.computeLuminance() < .42 ? Colors.white : textPrimary);

  Color get headerForegroundMuted =>
      headerSubtitleColor ??
      (headerSurface.computeLuminance() < .42
          ? Colors.white.withValues(alpha: .82)
          : textSecondary);

  /// Foreground for text/icons over strong rose/burgundy accents & gradients.
  Color get onAccentForeground =>
      primary.computeLuminance() < .42 ? Colors.white : textPrimary;

  ImageProvider themeImageProvider(String source) =>
      source.startsWith('assets/')
      ? AssetImage(resolveOptimizedImageAsset(source))
      : NetworkImage(source);
}

class HerThemeTokens extends ThemeExtension<HerThemeTokens> {
  const HerThemeTokens(this.palette);

  final ThemePalette palette;

  @override
  HerThemeTokens copyWith({ThemePalette? palette}) =>
      HerThemeTokens(palette ?? this.palette);

  @override
  HerThemeTokens lerp(ThemeExtension<HerThemeTokens>? other, double t) {
    if (other is! HerThemeTokens) return this;
    Color blend(Color a, Color b) => Color.lerp(a, b, t)!;
    return HerThemeTokens(
      ThemePalette(
        name: t < .5 ? palette.name : other.palette.name,
        presetVersion: t < .5
            ? palette.presetVersion
            : other.palette.presetVersion,
        controlSchemaVersion: t < .5
            ? palette.controlSchemaVersion
            : other.palette.controlSchemaVersion,
        primary: blend(palette.primary, other.palette.primary),
        primaryDark: blend(palette.primaryDark, other.palette.primaryDark),
        primaryLight: blend(palette.primaryLight, other.palette.primaryLight),
        background: blend(palette.background, other.palette.background),
        surface: blend(palette.surface, other.palette.surface),
        headerColor: blend(palette.headerColor, other.palette.headerColor),
        border: blend(palette.border, other.palette.border),
        textPrimary: blend(palette.textPrimary, other.palette.textPrimary),
        textSecondary: blend(
          palette.textSecondary,
          other.palette.textSecondary,
        ),
        sectionTitleColor: blend(
          palette.sectionTitleColor ?? palette.textPrimary,
          other.palette.sectionTitleColor ?? other.palette.textPrimary,
        ),
        headingPrimaryColor: blend(
          palette.headingPrimaryColor ?? palette.primary,
          other.palette.headingPrimaryColor ?? other.palette.primary,
        ),
        headingSecondaryColor: blend(
          palette.headingSecondaryColor ?? palette.primaryDark,
          other.palette.headingSecondaryColor ?? other.palette.primaryDark,
        ),
        heroTitleColor: blend(
          palette.heroTitleColor ?? palette.textPrimary,
          other.palette.heroTitleColor ?? other.palette.textPrimary,
        ),
        heroSubtitleColor: blend(
          palette.heroSubtitleColor ?? palette.textSecondary,
          other.palette.heroSubtitleColor ?? other.palette.textSecondary,
        ),
        cardTitleColor: blend(
          palette.cardTitleColor ?? palette.primaryDark,
          other.palette.cardTitleColor ?? other.palette.primaryDark,
        ),
        cardSubtitleColor: blend(
          palette.cardSubtitleColor ?? palette.textSecondary,
          other.palette.cardSubtitleColor ?? other.palette.textSecondary,
        ),
        sectionSubtitleColor: blend(
          palette.sectionSubtitleColor ?? palette.textSecondary,
          other.palette.sectionSubtitleColor ?? other.palette.textSecondary,
        ),
        bodyPrimaryColor: blend(
          palette.bodyPrimaryColor ?? palette.textPrimary,
          other.palette.bodyPrimaryColor ?? other.palette.textPrimary,
        ),
        bodySecondaryColor: blend(
          palette.bodySecondaryColor ?? palette.textSecondary,
          other.palette.bodySecondaryColor ?? other.palette.textSecondary,
        ),
        captionColor: blend(
          palette.captionColor ?? palette.textSecondary,
          other.palette.captionColor ?? other.palette.textSecondary,
        ),
        devotionalTextColor: blend(
          palette.devotionalTextColor ?? palette.textPrimary,
          other.palette.devotionalTextColor ?? other.palette.textPrimary,
        ),
        onPrimaryColor: blend(
          palette.onPrimaryColor ?? Colors.white,
          other.palette.onPrimaryColor ?? Colors.white,
        ),
        headerTitleColor: blend(
          palette.headerTitleColor ?? palette.textPrimary,
          other.palette.headerTitleColor ?? other.palette.textPrimary,
        ),
        headerHerColor: blend(
          palette.headerHerColor ?? const Color(0xFFFF5C91),
          other.palette.headerHerColor ?? const Color(0xFFFF5C91),
        ),
        headerSubtitleColor: blend(
          palette.headerSubtitleColor ?? palette.textSecondary,
          other.palette.headerSubtitleColor ?? other.palette.textSecondary,
        ),
        pinkSection: blend(palette.pinkSection, other.palette.pinkSection),
        greenSection: blend(palette.greenSection, other.palette.greenSection),
        purpleSection: blend(
          palette.purpleSection,
          other.palette.purpleSection,
        ),
        blueSection: blend(palette.blueSection, other.palette.blueSection),
        peachSection: blend(palette.peachSection, other.palette.peachSection),
        accent: blend(
          palette.accent ?? palette.primary,
          other.palette.accent ?? other.palette.primary,
        ),
        primaryButtonColor: Color.lerp(
          palette.primaryButtonColor ?? palette.primary,
          other.palette.primaryButtonColor ?? other.palette.primary,
          t,
        ),
        primaryButtonGradientStartColor: blend(
          palette.primaryButtonGradientStartColor ?? palette.primaryDark,
          other.palette.primaryButtonGradientStartColor ??
              other.palette.primaryDark,
        ),
        primaryButtonTextColor: blend(
          palette.primaryButtonTextColor ?? Colors.white,
          other.palette.primaryButtonTextColor ?? Colors.white,
        ),
        primaryButtonIconColor: blend(
          palette.primaryButtonIconColor ?? palette.primaryDark,
          other.palette.primaryButtonIconColor ?? other.palette.primaryDark,
        ),
        primaryButtonIconBackgroundColor: blend(
          palette.primaryButtonIconBackgroundColor ?? Colors.white,
          other.palette.primaryButtonIconBackgroundColor ?? Colors.white,
        ),
        primaryButtonBorderColor: blend(
          palette.primaryButtonBorderColor ?? Colors.white,
          other.palette.primaryButtonBorderColor ?? Colors.white,
        ),
        secondaryButtonIconColor: blend(
          palette.secondaryButtonIconColor ?? palette.primary,
          other.palette.secondaryButtonIconColor ?? other.palette.primary,
        ),
        secondaryButtonBorderColor: blend(
          palette.secondaryButtonBorderColor ?? palette.border,
          other.palette.secondaryButtonBorderColor ?? other.palette.border,
        ),
        videoActionColor: blend(
          palette.videoActionColor,
          other.palette.videoActionColor,
        ),
        videoActionTextColor: blend(
          palette.videoActionTextColor,
          other.palette.videoActionTextColor,
        ),
        videoActionBorderColor: blend(
          palette.videoActionBorderColor,
          other.palette.videoActionBorderColor,
        ),
        profileCardColor: blend(
          palette.profileCardColor,
          other.palette.profileCardColor,
        ),
        profileHeroStartColor: blend(
          palette.profileHeroStartColor,
          other.palette.profileHeroStartColor,
        ),
        profileHeroEndColor: blend(
          palette.profileHeroEndColor,
          other.palette.profileHeroEndColor,
        ),
        profileActionColor: blend(
          palette.profileActionColor,
          other.palette.profileActionColor,
        ),
        profileActionTextColor: blend(
          palette.profileActionTextColor,
          other.palette.profileActionTextColor,
        ),
        profileStatSurfaceColor: blend(
          palette.profileStatSurfaceColor,
          other.palette.profileStatSurfaceColor,
        ),
        profileStatTextColor: blend(
          palette.profileStatTextColor,
          other.palette.profileStatTextColor,
        ),
        iconColor: blend(palette.iconColor, other.palette.iconColor),
        iconBackgroundColor: blend(
          palette.iconBackgroundColor,
          other.palette.iconBackgroundColor,
        ),
        iconPinkBackgroundColor: blend(
          palette.iconPinkBackgroundColor,
          other.palette.iconPinkBackgroundColor,
        ),
        iconCreamBackgroundColor: blend(
          palette.iconCreamBackgroundColor,
          other.palette.iconCreamBackgroundColor,
        ),
        iconCreamGlyphColor: blend(
          palette.iconCreamGlyphColor,
          other.palette.iconCreamGlyphColor,
        ),
        iconOpacity: lerpDouble(
          palette.iconOpacity,
          other.palette.iconOpacity,
          t,
        )!,
        iconBackgroundOpacity: lerpDouble(
          palette.iconBackgroundOpacity,
          other.palette.iconBackgroundOpacity,
          t,
        )!,
        iconCircleSize: lerpDouble(
          palette.iconCircleSize,
          other.palette.iconCircleSize,
          t,
        )!,
        iconGlyphSize: lerpDouble(
          palette.iconGlyphSize,
          other.palette.iconGlyphSize,
          t,
        )!,
        backgroundOverlayOpacity: lerpDouble(
          palette.backgroundOverlayOpacity,
          other.palette.backgroundOverlayOpacity,
          t,
        )!,
        cardOpacity: lerpDouble(
          palette.cardOpacity,
          other.palette.cardOpacity,
          t,
        )!,
        secondaryCardOpacity: lerpDouble(
          palette.secondaryCardOpacity,
          other.palette.secondaryCardOpacity,
          t,
        )!,
        headerOpacity: lerpDouble(
          palette.headerOpacity,
          other.palette.headerOpacity,
          t,
        )!,
        sectionOpacity: lerpDouble(
          palette.sectionOpacity,
          other.palette.sectionOpacity,
          t,
        )!,
        navigationOpacity: lerpDouble(
          palette.navigationOpacity,
          other.palette.navigationOpacity,
          t,
        )!,
        navigationColor: blend(
          palette.navigationColor,
          other.palette.navigationColor,
        ),
        navigationGradientStartColor: blend(
          palette.navigationGradientStartColor ?? palette.navigationColor,
          other.palette.navigationGradientStartColor ??
              other.palette.navigationColor,
        ),
        navigationGradientEndColor: blend(
          palette.navigationGradientEndColor ?? palette.navigationColor,
          other.palette.navigationGradientEndColor ??
              other.palette.navigationColor,
        ),
        navigationBorderColor: blend(
          palette.navigationBorderColor ??
              palette.navigationActiveColor ??
              palette.navigationTextColor,
          other.palette.navigationBorderColor ??
              other.palette.navigationActiveColor ??
              other.palette.navigationTextColor,
        ),
        navigationBorderOpacity: lerpDouble(
          palette.navigationBorderOpacity,
          other.palette.navigationBorderOpacity,
          t,
        )!,
        navigationTextColor: blend(
          palette.navigationTextColor,
          other.palette.navigationTextColor,
        ),
        navigationActiveColor: blend(
          palette.navigationActiveColor ?? palette.navigationTextColor,
          other.palette.navigationActiveColor ??
              other.palette.navigationTextColor,
        ),
        navigationInactiveColor: blend(
          palette.navigationInactiveColor ??
              palette.navigationTextColor.withValues(alpha: .62),
          other.palette.navigationInactiveColor ??
              other.palette.navigationTextColor.withValues(alpha: .62),
        ),
        appGradientStart: blend(
          palette.appGradientStart ?? palette.background,
          other.palette.appGradientStart ?? other.palette.background,
        ),
        appGradientEnd: blend(
          palette.appGradientEnd ?? palette.background,
          other.palette.appGradientEnd ?? other.palette.background,
        ),
        cardGradientStart: blend(
          palette.cardGradientStart ?? palette.blueSection,
          other.palette.cardGradientStart ?? other.palette.blueSection,
        ),
        cardGradientEnd: blend(
          palette.cardGradientEnd ?? palette.blueSection,
          other.palette.cardGradientEnd ?? other.palette.blueSection,
        ),
        backgroundImageUrl: t < .5
            ? palette.backgroundImageUrl
            : other.palette.backgroundImageUrl,
        headerImageUrl: t < .5
            ? palette.headerImageUrl
            : other.palette.headerImageUrl,
        pageHeaderImages: t < .5
            ? palette.pageHeaderImages
            : other.palette.pageHeaderImages,
        pageHeroImages: t < .5
            ? palette.pageHeroImages
            : other.palette.pageHeroImages,
        pageHeroCopy: t < .5
            ? palette.pageHeroCopy
            : other.palette.pageHeroCopy,
        pageHeaderCopy: t < .5
            ? palette.pageHeaderCopy
            : other.palette.pageHeaderCopy,
        pageHeaderStyles: t < .5
            ? palette.pageHeaderStyles
            : other.palette.pageHeaderStyles,
        welcomeBackgroundImageUrl: t < .5
            ? palette.welcomeBackgroundImageUrl
            : other.palette.welcomeBackgroundImageUrl,
        welcomeGradientStart: blend(
          palette.welcomeGradientStart,
          other.palette.welcomeGradientStart,
        ),
        welcomeGradientEnd: blend(
          palette.welcomeGradientEnd,
          other.palette.welcomeGradientEnd,
        ),
        welcomeLogoImageUrl: t < .5
            ? palette.welcomeLogoImageUrl
            : other.palette.welcomeLogoImageUrl,
        welcomeLogoScale: lerpDouble(
          palette.welcomeLogoScale,
          other.palette.welcomeLogoScale,
          t,
        )!,
        welcomeTitleColor: blend(
          palette.welcomeTitleColor,
          other.palette.welcomeTitleColor,
        ),
        welcomeSubtitleColor: blend(
          palette.welcomeSubtitleColor,
          other.palette.welcomeSubtitleColor,
        ),
        welcomeFooterColor: blend(
          palette.welcomeFooterColor,
          other.palette.welcomeFooterColor,
        ),
        welcomeGoogleButtonColor: blend(
          palette.welcomeGoogleButtonColor,
          other.palette.welcomeGoogleButtonColor,
        ),
        welcomeGoogleButtonTextColor: blend(
          palette.welcomeGoogleButtonTextColor,
          other.palette.welcomeGoogleButtonTextColor,
        ),
        welcomeGuestButtonColor: blend(
          palette.welcomeGuestButtonColor,
          other.palette.welcomeGuestButtonColor,
        ),
        welcomeGuestButtonTextColor: blend(
          palette.welcomeGuestButtonTextColor,
          other.palette.welcomeGuestButtonTextColor,
        ),
        welcomeGuestButtonBorderColor: blend(
          palette.welcomeGuestButtonBorderColor,
          other.palette.welcomeGuestButtonBorderColor,
        ),
        homeHeaderLogoImageUrl: t < .5
            ? palette.homeHeaderLogoImageUrl
            : other.palette.homeHeaderLogoImageUrl,
        headerLogoMessage: t < .5
            ? palette.headerLogoMessage
            : other.palette.headerLogoMessage,
        headerLogoMoodTitles: t < .5
            ? palette.headerLogoMoodTitles
            : other.palette.headerLogoMoodTitles,
        headerLogoMoodMessages: t < .5
            ? palette.headerLogoMoodMessages
            : other.palette.headerLogoMoodMessages,
        seasonalLogoTitle: t < .5
            ? palette.seasonalLogoTitle
            : other.palette.seasonalLogoTitle,
        seasonalLogoMessage: t < .5
            ? palette.seasonalLogoMessage
            : other.palette.seasonalLogoMessage,
        seasonalLogoImageUrl: t < .5
            ? palette.seasonalLogoImageUrl
            : other.palette.seasonalLogoImageUrl,
        seasonalLogoSoundUrl: t < .5
            ? palette.seasonalLogoSoundUrl
            : other.palette.seasonalLogoSoundUrl,
        seasonalLogoSoundVolume: lerpDouble(
          palette.seasonalLogoSoundVolume,
          other.palette.seasonalLogoSoundVolume,
          t,
        )!,
        seasonalLogoCardColor: Color.lerp(
          palette.seasonalLogoCardColor,
          other.palette.seasonalLogoCardColor,
          t,
        ),
        seasonalLogoCardOpacity: lerpDouble(
          palette.seasonalLogoCardOpacity,
          other.palette.seasonalLogoCardOpacity,
          t,
        )!,
        seasonalLogoTitleColor: Color.lerp(
          palette.seasonalLogoTitleColor,
          other.palette.seasonalLogoTitleColor,
          t,
        ),
        seasonalLogoMessageColor: Color.lerp(
          palette.seasonalLogoMessageColor,
          other.palette.seasonalLogoMessageColor,
          t,
        ),
        homeMoodMessages: t < .5
            ? palette.homeMoodMessages
            : other.palette.homeMoodMessages,
        homeHeroImageUrl: t < .5
            ? palette.homeHeroImageUrl
            : other.palette.homeHeroImageUrl,
        scheduleEnabled: t < .5
            ? palette.scheduleEnabled
            : other.palette.scheduleEnabled,
        scheduleStart: t < .5
            ? palette.scheduleStart
            : other.palette.scheduleStart,
        scheduleEnd: t < .5 ? palette.scheduleEnd : other.palette.scheduleEnd,
        schedulePriority: t < .5
            ? palette.schedulePriority
            : other.palette.schedulePriority,
      ),
    );
  }
}

extension HerThemeContext on BuildContext {
  ThemePalette get herPalette =>
      Theme.of(this).extension<HerThemeTokens>()?.palette ??
      ThemePalette.darkDefault;
}
