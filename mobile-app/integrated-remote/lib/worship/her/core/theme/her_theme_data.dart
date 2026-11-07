import 'package:flutter/material.dart';
import 'theme_palette.dart';
import 'her_modern_accents.dart';

/// WCAG-style contrast ratio between two opaque colors.
double herContrastRatio(Color a, Color b) {
  final l1 = a.computeLuminance() + .05;
  final l2 = b.computeLuminance() + .05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

/// Guarantees a readable foreground on [surface] without changing any
/// published theme value: the configured color wins whenever it already
/// reaches AA contrast, otherwise the caller's palette fallback is resolved.
/// This repairs selectable chips (and any states-token consumer) for theme
/// records that never published an explicit selected foreground.
Color herReadableForeground({
  required Color surface,
  Color? configured,
  required Color fallback,
}) {
  final candidates = <Color>[
    if (configured case final Color value) value,
    fallback,
  ];
  var best = candidates.first;
  var bestRatio = 0.0;
  for (final candidate in candidates) {
    final ratio = herContrastRatio(candidate, surface);
    if (ratio >= 4.5) return candidate;
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
  }
  return best;
}

/// Centralized immutable runtime HER theme.
///
/// Pipeline: `RemoteThemeController -> ThemePalette -> HerThemeData ->
/// Material ThemeData / HER components -> UI`.
///
/// [ThemePalette] remains the remote/configuration DATA (CMS tokens).
/// [HerThemeData] is the single runtime semantic representation.
/// Material [ThemeData] is generated FROM [HerThemeData] via
/// [HerThemeData.toMaterialTheme].
///
/// The default [HerThemeData.fallback] reproduces the approved HER baseline:
/// canvas #FFF8F7, surface #FFFCFA, border #EED9DE, text #56313E/#8A5568,
/// action #C86F8A, emotional #D9829A, rosewood #B05D78, etc.
class HerThemeData extends ThemeExtension<HerThemeData> {
  const HerThemeData({
    required this.text,
    required this.surfaces,
    required this.actions,
    required this.accents,
    required this.washes,
    required this.cards,
    required this.cardRoles,
    required this.buttonStyles,
    required this.iconStyle,
    // Phase 0: canonical state/switch/tab ownership (models only; no
    // call-site migration yet).
    required this.states,
    required this.switchStyle,
    required this.tabStyle,
    required this.semanticAccents,
    required this.structure,
    required this.slides,
    required this.navigation,
    required this.status,
    required this.opacity,
    required this.palette,
  });

  final HerTextColors text;
  final HerSurfaces surfaces;
  final HerActions actions;
  final HerAccents accents;
  final HerWashes washes;
  final HerCards cards;

  /// Phase 1: explicit canonical card roles. Old width-based mapping stays
  /// for unmigrated callers; migrated widgets read ONLY these six styles.
  final HerCardRoles cardRoles;

  /// Phase 1: normal button appearances (danger = model only for now).
  final HerButtonStyles buttonStyles;

  /// Phase 1: normal icon container + glyph appearance.
  final HerIconStyle iconStyle;

  /// Phase 0: selected/unselected/disabled/pressed tokens.
  final HerStateTokens states;

  /// Phase 0: switch styling tokens.
  final HerSwitchStyle switchStyle;

  /// Phase 0: tab styling tokens.
  final HerTabStyle tabStyle;

  /// Phase 1: semantic accent structure (fitness + cycle live, rest shells later).
  final HerSemanticAccents semanticAccents;

  /// Phase 1: structural (non-card) tokens — list rows and page chrome.
  /// Deliberately OUTSIDE `cards.*` so Cards>Wide can never leak into rows.
  final HerStructureStyles structure;

  /// Phase 2 prep: dedicated slide/carousel surface family (see [HerSlideStyle]).
  final HerSlideStyle slides;
  final HerNavigation navigation;
  final HerStatus status;
  final HerOpacityPolicy opacity;

  /// The source remote palette (CMS data + images/copy/schedule).
  /// Kept for artwork/copy that is NOT a color token.
  final ThemePalette palette;

  /// Physical directions are shared across every theme, including RTL.
  /// The editor still owns both colours and opacity; stale direction metadata
  /// cannot reverse the lighter side of these two structural surfaces.
  LinearGradient get heroCardGradient {
    final style = cardRoles.hero;
    return _orderedGradient(
      style.gradientStart.withValues(alpha: style.gradientStartOpacity),
      style.gradientEnd.withValues(alpha: style.gradientEndOpacity),
      Alignment.centerLeft,
      Alignment.centerRight,
    );
  }

  LinearGradient get navigationGradient => _orderedGradient(
    navigation.gradientStart.withValues(alpha: opacity.navigation),
    navigation.gradientEnd.withValues(alpha: opacity.navigation),
    Alignment.topCenter,
    Alignment.bottomCenter,
  );

  LinearGradient _orderedGradient(
    Color a,
    Color b,
    Alignment begin,
    Alignment end,
  ) {
    final aLight =
        Color.alphaBlend(a, surfaces.background).computeLuminance() >=
        Color.alphaBlend(b, surfaces.background).computeLuminance();
    return LinearGradient(
      begin: begin,
      end: end,
      colors: aLight ? [a, b] : [b, a],
    );
  }

  // Offline fallback follows the same dark default as the remote controller.
  static HerThemeData fallback() =>
      HerThemeData.fromPalette(ThemePalette.darkDefault);

  /// Deterministic mapping: ThemePalette -> HerThemeData.
  ///
  /// One rule for every palette (including the bundled default): washes
  /// follow the five section slots and accents derive deterministically
  /// (see [_accentFromWash]). No palette gets hard-coded special cases, so
  /// the control centre retunes the whole app with a single publish.
  factory HerThemeData.fromPalette(ThemePalette palette) {
    final modern = palette.modernAccents.isEmpty
        ? null
        : HerModernAccents.fromPalette(palette);
    // --- Text ---
    final textPrimary = palette.textPrimary;
    final textSecondary = palette.textSecondary;
    final muted =
        Color.lerp(textSecondary, palette.background, 0.28) ?? textSecondary;
    final onAccent = palette.buttonTextColor ?? palette.onAccentForeground;

    // --- Surfaces ---
    final background = palette.background;
    final surface = palette.surface;
    final elevated = Color.alphaBlend(
      palette.primary.withValues(alpha: 0.04),
      palette.surface,
    );
    final header = palette.componentStyle('header').gradientStart;
    final headerFg = palette.headerForeground;
    final headerFgMuted = palette.headerForegroundMuted;

    // --- Actions ---
    final primary = palette.primary;
    final primaryFg = palette.onAccentForeground;
    final secondary = palette.primaryDark;
    final disabled = textSecondary.withValues(alpha: 0.45);
    final selected = palette.pinkSection;
    final selectedFg = palette.primaryDark;

    // --- Washes (five semantic slots) ---
    final emotionalWash = modern?.rose.subtleBackground ?? palette.pinkSection;
    final wellnessWash = modern?.mint.subtleBackground ?? palette.greenSection;
    final energyWash = modern?.coral.subtleBackground ?? palette.peachSection;
    final learningWash =
        modern?.lavender.subtleBackground ?? palette.purpleSection;
    final neutralWash =
        modern?.softBlue.subtleBackground ?? palette.blueSection;

    // --- Accents ---
    final emotional =
        modern?.rose.accentColor ?? palette.accent ?? palette.primary;
    final wellness =
        modern?.mint.accentColor ??
        _accentFromWash(wellnessWash, textPrimary, const Color(0xFFB05D78));
    // The former olive energy accent is retired globally. Warm/energy
    // elements are now the same cream-gold family used for knowledge.
    final energy =
        modern?.coral.accentColor ??
        _accentFromWash(energyWash, textPrimary, const Color(0xFFD2A13E));
    final learning =
        modern?.lavender.accentColor ??
        _accentFromWash(learningWash, textPrimary, const Color(0xFFAC8B9B));
    final neutral = textSecondary;

    // --- Cards ---
    final cardSurface = palette.surface;
    final cardBorder = palette.border;
    final elevatedSurface = Color.alphaBlend(
      palette.primary.withValues(alpha: 0.05),
      palette.surface,
    );

    // --- Phase 0 role styles: read through the additive componentStyles keys
    // (`cardLarge…cardContent`, `listRow`). Shadow, radius and border width
    // now also come from the style data (Pink Master values), so the control
    // centre can retune the full family recipe. Legacy layers are the initial
    // values, so nothing renders differently until the editor publishes
    // per-role values.
    HerCardRoleStyle roleCard(String key) {
      final s = palette.componentStyle(key);
      return HerCardRoleStyle(
        gradientStart: s.gradientStart,
        gradientStartOpacity: s.opacity,
        gradientEnd: s.gradientEnd,
        gradientEndOpacity: s.opacity,
        surfaceOpacity: s.opacity,
        borderColor: s.border,
        borderOpacity: s.borderOpacity,
        borderWidth: s.borderWidth,
        shadowColor: s.shadowColor,
        shadowOpacity: s.shadowOpacity,
        shadowBlur: s.shadowBlur,
        shadowOffset: Offset(s.shadowOffsetX, s.shadowOffsetY),
        radius: s.radius,
        backdropBlur: s.backdropBlur,
        gradientDirection: s.gradientDirection,
      );
    }

    final cardRoles = HerCardRoles(
      // Pink Master calibration lives in `componentStyle` data now. The
      // control centre may tune every role's complete semantic recipe.
      large: roleCard('cardLarge'),
      medium: roleCard('cardMedium'),
      small: roleCard('cardSmall'),
      wide: roleCard('cardWide'),
      journey: roleCard('cardJourney'),
      // Long-form readable cards (dhikr/dua text, articles). Calm surface
      // like Small, independent key by design. Not migrated anywhere yet —
      // Phase 0 creates and tests the role only.
      content: roleCard('cardContent'),
      hero: roleCard('cardHero'),
    );
    final listRowStyle = roleCard('listRow');

    // --- Phase 1 button styles: exact current recipes, owned centrally.
    // primary gradient == primaryActionGradient; secondary == card surface.
    // Pink Master pin: when the palette provides primaryButtonColor, the
    // normal Primary resolves to the approved game-card reference. On a
    // light canvas it keeps the soft [secondary → pin] transition. On a dark
    // canvas `primaryDark` is deliberately a light foreground colour, so it
    // must never be used as the gradient's first stop; keep the CTA richly
    // pink like the sports page instead of washing it out to near-white.
    // Primary action tokens also serve legacy controls. The palette's broad
    // identity accent must not leak into action fills when Studio publishes
    // a separate button colour. Text, cards and icon families keep their own
    // independent published tokens.
    final buttonPin = palette.primaryButtonColor ?? palette.primary;
    final isDarkCanvas = palette.background.computeLuminance() < .42;
    final configuredButtonStart =
        palette.primaryButtonGradientStartColor ??
        (isDarkCanvas ? primary : secondary);
    // A CTA configured with identical stops reads as a flat slab. Preserve a
    // deliberate dashboard gradient when supplied, but create a subtle rich
    // start when both values are effectively the same so every primary action
    // retains the promised depth.
    final buttonStart =
        palette.primaryButtonGradientStartColor == null &&
            (configuredButtonStart.computeLuminance() -
                        buttonPin.computeLuminance())
                    .abs() <
                .015
        ? Color.lerp(buttonPin, Colors.black, .18)!
        : configuredButtonStart;
    final buttonStyles = HerButtonStyles(
      primary: HerButtonStyle(
        gradientStart: buttonStart,
        gradientEnd: buttonPin,
        flatBackground: buttonPin,
        foreground: palette.primaryButtonTextColor ?? primaryFg,
        borderColor: palette.primaryButtonBorderColor ?? Colors.white,
        iconColor: palette.primaryButtonIconColor ?? palette.primaryDark,
        iconBackground:
            palette.primaryButtonIconBackgroundColor ?? Colors.white,
        shadowColor: buttonPin,
        shadowOpacity: .15,
        shadowBlur: 24,
        shadowOffset: const Offset(0, 10),
      ),
      secondary: HerButtonStyle(
        gradientStart: palette.secondaryButtonColor ?? surface,
        gradientEnd: palette.secondaryButtonColor ?? surface,
        flatBackground: palette.secondaryButtonColor ?? surface,
        foreground: palette.secondaryButtonTextColor ?? secondary,
        borderColor: palette.secondaryButtonBorderColor ?? cardBorder,
        iconColor: palette.secondaryButtonIconColor ?? primary,
      ),
      // Phase 0: danger reads CMS tokens when published; the model (solid
      // secondary + white) is unchanged until then. Still model-only: no
      // danger CTA widget exists yet.
      danger: HerButtonStyle(
        gradientStart: palette.dangerButtonColor ?? secondary,
        gradientEnd: palette.dangerButtonColor ?? secondary,
        flatBackground: palette.dangerButtonColor ?? secondary,
        foreground: palette.dangerButtonTextColor ?? const Color(0xFFFFFFFF),
        borderColor: const Color(0x00000000),
      ),
    );

    // One action owner for custom legacy controls, Material controls and HER
    // buttons. In Comfort Dark the identity accent is pale #E5A0B6 while the
    // action fill is #A85A74; resolving these separately created pink stickers.
    final actionsObj = HerActions(
      primary: buttonStyles.primary.flatBackground,
      primaryForeground: buttonStyles.primary.foreground,
      secondary: secondary,
      disabled: disabled,
      selected: selected,
      selectedForeground: selectedFg,
    );

    // --- Phase 0: centralized state tokens. Pink Master derivations apply
    // until the CMS publishes explicit values. No call-site migration yet:
    // this creates the canonical ownership model first.
    //
    // Published foregrounds remain authoritative. Only omitted values are
    // resolved from readable palette ink before a last-resort contrast fallback.
    final selectedSurface = palette.selectedSurfaceColor ?? emotionalWash;
    final selectedCandidates = [
      textPrimary,
      selectedFg,
      secondary,
      buttonStyles.primary.foreground,
    ];
    final selectedFallback = selectedCandidates.firstWhere(
      (color) => herContrastRatio(color, selectedSurface) >= 4.5,
      orElse: () =>
          ([...selectedCandidates, Colors.white, Colors.black]..sort(
                (a, b) => herContrastRatio(
                  b,
                  selectedSurface,
                ).compareTo(herContrastRatio(a, selectedSurface)),
              ))
              .first,
    );
    final states = HerStateTokens(
      selectedSurface: selectedSurface,
      selectedForeground: palette.selectedForegroundColor ?? selectedFallback,
      selectedBorder: palette.selectedBorderColor ?? secondary,
      unselectedSurface: palette.unselectedSurfaceColor ?? surface,
      unselectedForeground: palette.unselectedForegroundColor ?? textSecondary,
      unselectedBorder: palette.unselectedBorderColor ?? cardBorder,
      disabledOpacity: palette.disabledOpacity,
      pressedOverlayOpacity: palette.pressedOverlayOpacity,
    );

    // --- Phase 0: switch + tab styling (same nullable-override model). ---
    final switchStyle = HerSwitchStyle(
      trackSelected: palette.switchTrackSelectedColor ?? primary,
      thumbSelected:
          palette.switchThumbSelectedColor ?? const Color(0xFFFFFFFF),
      trackUnselected: palette.switchTrackUnselectedColor ?? cardBorder,
      thumbUnselected:
          palette.switchThumbUnselectedColor ?? const Color(0xFFFFFFFF),
      border: palette.switchBorderColor ?? cardBorder,
    );
    final tabStyle = HerTabStyle(
      selectedForeground: palette.tabSelectedForegroundColor ?? secondary,
      unselectedForeground:
          palette.tabUnselectedForegroundColor ?? textSecondary,
      indicator: palette.tabIndicatorColor ?? primary,
    );

    // --- Normal icons: one semantic, centrally owned container recipe.

    // --- Navigation ---
    // The Floating Bar is deliberately independent from the primary CTA.
    // Changing a button gradient must never recolour the app navigation.
    final navBackground = palette.navigationColor;
    final navActive =
        palette.navigationActiveColor ?? palette.navigationTextColor;
    final navInactive =
        palette.navigationInactiveColor ??
        palette.navigationTextColor.withValues(alpha: 0.62);
    final navGradientStart =
        palette.navigationGradientStartColor ?? palette.navigationColor;
    final navGradientEnd =
        palette.navigationGradientEndColor ??
        (Color.lerp(palette.navigationColor, Colors.black, .26) ??
            palette.navigationColor);
    final navBorder = palette.navigationBorderColor ?? navActive;

    // --- Status ---
    // Status surfaces are visible on many feature pages (for example the
    // YouTube pill in الرياضة). Keeping the old pink constants here meant
    // those elements ignored every seasonal palette. They now use the same
    // editor-controlled semantic slots as the rest of the application.
    final status = HerStatus(
      success: modern?.mint.accentColor ?? palette.accent ?? primary,
      successWash: wellnessWash,
      warning: energy,
      warningWash: energyWash,
      error: modern?.rose.accentColor ?? primary,
      errorWash: emotionalWash,
      errorDark: secondary,
      info: learning,
      infoWash: learningWash,
      gold: energy,
      goldWash: energyWash,
    );

    // --- Opacity policy (centralized normal-visual roles) ---
    final opacity = HerOpacityPolicy(
      // The admin's transparency controls have a true 0–100% range. Never
      // silently raise an editor's chosen alpha after it is published.
      surface: palette.cardOpacity.clamp(0.0, 1.0),
      secondarySurface: palette.secondaryCardOpacity.clamp(0.0, 1.0),
      softWash: palette.sectionOpacity.clamp(0.0, 1.0),
      header: palette.componentStyle('header').opacity.clamp(0.0, 1.0),
      overlay: palette.backgroundOverlayOpacity.clamp(0.0, 1.0),
      navigation: palette.navigationOpacity.clamp(0.0, 1.0),
      icon: palette.iconOpacity.clamp(0.0, 1.0),
      iconBackground: palette.iconBackgroundOpacity.clamp(0.0, 1.0),
      // This is the shared disabled-state owner used by HER buttons and
      // controls.  The persisted default remains .55, so existing themes are
      // pixel-stable while the Studio control is now truthful.
      disabled: palette.disabledOpacity.clamp(0.0, 1.0),
      scrim: 0.42,
    );

    // --- Phase 1 icon style / semantic accents / structure (see locals above
    // for iconCardStyle; status/opacity locals reused below) ---
    final iconLayer = palette.componentStyle('iconCard');
    final iconStyle = HerIconStyle(
      // The public icon controls own colour. `iconCard` remains responsible
      // only for shared structure (border/radius/shadow), so a stale recipe
      // can never override a newer dashboard colour.
      containerColor: palette.iconBackgroundColor,
      containerOpacity: opacity.iconBackground,
      containerBorderColor: iconLayer.border,
      containerBorderOpacity: iconLayer.borderOpacity,
      containerBorderWidth: iconLayer.borderWidth,
      // `iconColor` is the public Theme Studio control for ordinary symbols.
      // It used to be parsed and saved correctly but then discarded here in
      // favour of `primary`, which made the preview disagree with the app.
      glyphColor: palette.iconColor,
      glyphOpacity: opacity.icon,
    );
    final semanticAccents = HerSemanticAccents(
      // Mirrors `herFitnessAccentOf` routing exactly (incl. primary fallbacks).
      fitness: HerFitnessAccents(
        steps: HerAccent(
          color:
              modern?.lavender.accentColor ??
              palette.fitnessStepsCircleColor ??
              primary,
        ),
        calories: HerAccent(
          color:
              modern?.coral.accentColor ??
              palette.fitnessCaloriesCircleColor ??
              primary,
        ),
        workout: HerAccent(
          color:
              modern?.mint.accentColor ??
              palette.fitnessWorkoutCircleColor ??
              secondary,
        ),
        nutrition: HerAccent(
          color:
              modern?.sage.accentColor ??
              palette.fitnessNutritionCircleColor ??
              primary,
        ),
      ),
      // Mirrors `CycleTheme.getPhaseColor` without importing feature code.
      // Every calendar state has a separate semantic role.  Reuse the
      // centrally controlled accent families rather than letting the cycle
      // UI invent local hex colours: recorded bleeding stays HER rose,
      // predicted bleeding is lavender, fertile days are sage, and ovulation
      // is cyan.  This keeps the legend legible in every active theme.
      cycle: HerCycleAccents(
        period: HerAccent(color: status.error),
        predicted: HerAccent(
          color:
              modern?.lavender.accentColor ??
              palette.fitnessStepsCircleColor ??
              learning,
        ),
        fertile: HerAccent(
          color:
              modern?.sage.accentColor ??
              palette.fitnessNutritionCircleColor ??
              wellness,
        ),
        ovulation: HerAccent(
          color:
              modern?.mint.accentColor ??
              palette.fitnessWorkoutCircleColor ??
              learning,
        ),
        safe: HerAccent(color: modern?.softBlue.accentColor ?? primary),
      ),
    );
    final structure = HerStructureStyles(listRow: listRowStyle);

    // --- Slides: one centrally owned slide family. The studio can tune its
    // gradient, border and opacity once; individual slides never own colour.
    final slideLayer = palette.componentStyle('slide');
    final slides = HerSlideStyle(
      gradientStart: slideLayer.gradientStart,
      gradientStartOpacity: slideLayer.opacity,
      gradientEnd: slideLayer.gradientEnd,
      gradientEndOpacity: slideLayer.opacity,
      surfaceOpacity: slideLayer.opacity,
      borderColor: slideLayer.border,
      borderOpacity: slideLayer.borderOpacity,
      borderWidth: slideLayer.borderWidth,
      shadowColor: primary,
      shadowOpacity: .12,
      shadowBlur: 18,
      shadowOffset: const Offset(0, 6),
      radius: 24,
      indicatorActive: primary,
      indicatorInactive: primary.withValues(alpha: .18),
    );

    return HerThemeData(
      text: HerTextColors(
        primary: textPrimary,
        secondary: textSecondary,
        muted: muted,
        onAccent: onAccent,
      ),
      surfaces: HerSurfaces(
        background: background,
        surface: surface,
        elevated: elevated,
        header: header,
        headerForeground: headerFg,
        headerForegroundMuted: headerFgMuted,
      ),
      actions: actionsObj,
      accents: HerAccents(
        emotional: emotional,
        wellness: wellness,
        energy: energy,
        learning: learning,
        neutral: neutral,
      ),
      washes: HerWashes(
        emotional: emotionalWash,
        wellness: wellnessWash,
        energy: energyWash,
        learning: learningWash,
        neutral: neutralWash,
      ),
      cards: HerCards(
        surface: cardSurface,
        border: cardBorder,
        elevatedSurface: elevatedSurface,
      ),
      cardRoles: cardRoles,
      buttonStyles: buttonStyles,
      iconStyle: iconStyle,
      states: states,
      switchStyle: switchStyle,
      tabStyle: tabStyle,
      semanticAccents: semanticAccents,
      structure: structure,
      slides: slides,
      navigation: HerNavigation(
        background: navBackground,
        gradientStart: navGradientStart,
        gradientEnd: navGradientEnd,
        border: navBorder,
        borderOpacity: palette.navigationBorderOpacity,
        active: navActive,
        inactive: navInactive,
      ),
      status: status,
      opacity: opacity,
      palette: palette,
    );
  }

  /// Deterministic wash->accent derivation without unpredictable HSL shifts.
  ///
  /// If the wash is a known HER wash, returns the known HER accent (exact).
  /// Otherwise blends the wash toward ink by a fixed clamped factor so the
  /// result stays a readable HER-style tone (never neon, never blue-shifted).
  static Color _accentFromWash(Color wash, Color ink, Color knownAccent) {
    const known = {
      0xFFF8D9DF: 0xFFD9829A,
      0xFFE7E9E0: 0xFFB05D78,
      0xFFF4E3E9: 0xFFB05D78,
      0xFFFCE5DC: 0xFF613743,
      0xFFEBDDE5: 0xFFAC8B9B,
      0xFFFCECEF: 0xFF8A5568,
    };
    final key = wash.toARGB32() & 0xFFFFFF;
    for (final e in known.entries) {
      if ((e.key & 0xFFFFFF) == key) return Color(0xFF000000 | e.value);
    }
    // Generic: mix wash 45% toward ink, then clamp saturation/lightness
    // into HER-style ranges by re-mixing slightly toward a warm mid tone.
    final mixed = Color.lerp(wash, ink, 0.45) ?? ink;
    final hsl = HSLColor.fromColor(mixed);
    final clamped = hsl
        .withSaturation(hsl.saturation.clamp(0.12, 0.45))
        .withLightness(hsl.lightness.clamp(0.32, 0.62));
    return clamped.toColor();
  }

  /// Contrast-aware foreground for an arbitrary background.
  /// Light washes keep primary text; dark tones switch to white.
  Color contrastForeground(Color background) => herReadableForeground(
    surface: background,
    configured: text.primary,
    fallback: buttonStyles.primary.foreground,
  );

  Color contrastMuted(Color background) =>
      contrastForeground(background).withValues(alpha: .82);

  // ---------- Semantic text color roles (Pink Master calibration) ---------
  // Large important headings read HER pink; section/card titles read the dark
  // brand rose; body reads dark ink; supporting text reads muted rose.
  // Phase 0: each role prefers its CMS token when published, otherwise the
  // derivation below (unchanged rendering until then).
  Color get headingPrimary => palette.modernAccents.isNotEmpty
      ? sectionTitle
      : palette.headingPrimaryColor ?? actions.primary;
  Color get headingSecondary => palette.modernAccents.isNotEmpty
      ? sectionTitle
      : palette.headingSecondaryColor ?? actions.secondary;
  Color get heroTitle => palette.heroTitleColor ?? text.primary;
  Color get heroSubtitle => palette.heroSubtitleColor ?? text.secondary;
  Color get sectionTitle => palette.sectionTitleColor ?? text.primary;
  Color get sectionSubtitle => palette.sectionSubtitleColor ?? text.secondary;
  Color get cardTitle => palette.modernAccents.isNotEmpty
      ? sectionTitle
      : palette.cardTitleColor ?? actions.secondary;
  Color get cardSubtitle => palette.cardSubtitleColor ?? text.secondary;
  Color get bodyPrimary => palette.bodyPrimaryColor ?? text.primary;
  Color get bodySecondary => palette.bodySecondaryColor ?? text.secondary;
  Color get caption => palette.captionColor ?? text.secondary;
  Color get devotionalText =>
      palette.devotionalTextColor ??
      (surfaces.background.computeLuminance() < .18
          ? const Color(0xFFF1D8AD)
          : text.primary);
  Color get onPrimaryText => palette.onPrimaryColor ?? text.onAccent;

  // ---------- Semantic gradients (derived from active theme) ----------
  LinearGradient get primaryActionGradient => buttonStyles.primary.gradient();

  /// One editor-owned action style for every hero, independent of canvas.
  HerButtonStyle get heroButtonStyle {
    final recipe = palette.componentStyles['heroAction'];
    final background = recipe?.gradientStart ?? Colors.white;
    final foreground = recipe?.glyphColor ?? actions.primary;
    return HerButtonStyle(
      gradientStart: background,
      gradientEnd: recipe?.gradientEnd ?? background,
      flatBackground: background,
      foreground: foreground,
      borderColor: recipe?.border ?? background,
      iconColor: foreground,
      iconBackground: background,
    );
  }

  /// Calendar fills use the accent family's wash, not its vivid icon ink.
  Color cycleDaySurface(HerAccent phase) {
    final accents = modernAccents;
    if (palette.modernAccents.isNotEmpty) {
      for (final family in [
        accents.rose,
        accents.lavender,
        accents.sage,
        accents.mint,
        accents.softBlue,
      ]) {
        if (family.accentColor == phase.color) return family.subtleBackground;
      }
    }
    return phase.color;
  }

  LinearGradient get heroGradient => LinearGradient(
    colors: [accents.emotional, washes.emotional],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  LinearGradient get emotionalGradient => LinearGradient(
    colors: [accents.emotional, washes.emotional],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  LinearGradient get wellnessGradient => LinearGradient(
    colors: [washes.wellness, surfaces.surface],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  LinearGradient get energyGradient => LinearGradient(
    colors: [washes.energy, surfaces.surface],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  LinearGradient get learningGradient => LinearGradient(
    colors: [washes.learning, surfaces.surface],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  LinearGradient get blushGradient => LinearGradient(
    colors: [washes.emotional, surfaces.surface],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  @override
  HerThemeData copyWith({
    HerTextColors? text,
    HerSurfaces? surfaces,
    HerActions? actions,
    HerAccents? accents,
    HerWashes? washes,
    HerCards? cards,
    HerCardRoles? cardRoles,
    HerButtonStyles? buttonStyles,
    HerIconStyle? iconStyle,
    HerStateTokens? states,
    HerSwitchStyle? switchStyle,
    HerTabStyle? tabStyle,
    HerSemanticAccents? semanticAccents,
    HerStructureStyles? structure,
    HerSlideStyle? slides,
    HerNavigation? navigation,
    HerStatus? status,
    HerOpacityPolicy? opacity,
    ThemePalette? palette,
  }) => HerThemeData(
    text: text ?? this.text,
    surfaces: surfaces ?? this.surfaces,
    actions: actions ?? this.actions,
    accents: accents ?? this.accents,
    washes: washes ?? this.washes,
    cards: cards ?? this.cards,
    cardRoles: cardRoles ?? this.cardRoles,
    buttonStyles: buttonStyles ?? this.buttonStyles,
    iconStyle: iconStyle ?? this.iconStyle,
    states: states ?? this.states,
    switchStyle: switchStyle ?? this.switchStyle,
    tabStyle: tabStyle ?? this.tabStyle,
    semanticAccents: semanticAccents ?? this.semanticAccents,
    structure: structure ?? this.structure,
    slides: slides ?? this.slides,
    navigation: navigation ?? this.navigation,
    status: status ?? this.status,
    opacity: opacity ?? this.opacity,
    palette: palette ?? this.palette,
  );

  @override
  HerThemeData lerp(ThemeExtension<HerThemeData>? other, double t) {
    if (other is! HerThemeData) return this;
    Color blend(Color a, Color b) => Color.lerp(a, b, t)!;
    return HerThemeData(
      text: HerTextColors(
        primary: blend(text.primary, other.text.primary),
        secondary: blend(text.secondary, other.text.secondary),
        muted: blend(text.muted, other.text.muted),
        onAccent: blend(text.onAccent, other.text.onAccent),
      ),
      surfaces: HerSurfaces(
        background: blend(surfaces.background, other.surfaces.background),
        surface: blend(surfaces.surface, other.surfaces.surface),
        elevated: blend(surfaces.elevated, other.surfaces.elevated),
        header: blend(surfaces.header, other.surfaces.header),
        headerForeground: blend(
          surfaces.headerForeground,
          other.surfaces.headerForeground,
        ),
        headerForegroundMuted: blend(
          surfaces.headerForegroundMuted,
          other.surfaces.headerForegroundMuted,
        ),
      ),
      actions: HerActions(
        primary: blend(actions.primary, other.actions.primary),
        primaryForeground: blend(
          actions.primaryForeground,
          other.actions.primaryForeground,
        ),
        secondary: blend(actions.secondary, other.actions.secondary),
        disabled: blend(actions.disabled, other.actions.disabled),
        selected: blend(actions.selected, other.actions.selected),
        selectedForeground: blend(
          actions.selectedForeground,
          other.actions.selectedForeground,
        ),
      ),
      accents: HerAccents(
        emotional: blend(accents.emotional, other.accents.emotional),
        wellness: blend(accents.wellness, other.accents.wellness),
        energy: blend(accents.energy, other.accents.energy),
        learning: blend(accents.learning, other.accents.learning),
        neutral: blend(accents.neutral, other.accents.neutral),
      ),
      washes: HerWashes(
        emotional: blend(washes.emotional, other.washes.emotional),
        wellness: blend(washes.wellness, other.washes.wellness),
        energy: blend(washes.energy, other.washes.energy),
        learning: blend(washes.learning, other.washes.learning),
        neutral: blend(washes.neutral, other.washes.neutral),
      ),
      cards: HerCards(
        surface: blend(cards.surface, other.cards.surface),
        border: blend(cards.border, other.cards.border),
        elevatedSurface: blend(
          cards.elevatedSurface,
          other.cards.elevatedSurface,
        ),
      ),
      cardRoles: HerCardRoles.lerp(cardRoles, other.cardRoles, t),
      buttonStyles: HerButtonStyles.lerp(buttonStyles, other.buttonStyles, t),
      iconStyle: HerIconStyle.lerp(iconStyle, other.iconStyle, t),
      states: HerStateTokens.lerp(states, other.states, t),
      switchStyle: HerSwitchStyle.lerp(switchStyle, other.switchStyle, t),
      tabStyle: HerTabStyle.lerp(tabStyle, other.tabStyle, t),
      semanticAccents: HerSemanticAccents.lerp(
        semanticAccents,
        other.semanticAccents,
        t,
      ),
      structure: HerStructureStyles.lerp(structure, other.structure, t),
      slides: HerSlideStyle.lerp(slides, other.slides, t),
      navigation: HerNavigation(
        background: blend(navigation.background, other.navigation.background),
        gradientStart: blend(
          navigation.gradientStart,
          other.navigation.gradientStart,
        ),
        gradientEnd: blend(
          navigation.gradientEnd,
          other.navigation.gradientEnd,
        ),
        border: blend(navigation.border, other.navigation.border),
        borderOpacity:
            navigation.borderOpacity +
            (other.navigation.borderOpacity - navigation.borderOpacity) * t,
        active: blend(navigation.active, other.navigation.active),
        inactive: blend(navigation.inactive, other.navigation.inactive),
      ),
      status: t < 0.5 ? status : other.status,
      opacity: HerOpacityPolicy.lerp(opacity, other.opacity, t),
      palette: t < 0.5 ? palette : other.palette,
    );
  }
}

// ---------------- Semantic value objects (all immutable) ----------------

class HerTextColors {
  const HerTextColors({
    required this.primary,
    required this.secondary,
    required this.muted,
    required this.onAccent,
  });
  final Color primary;
  final Color secondary;
  final Color muted;
  final Color onAccent;
}

class HerSurfaces {
  const HerSurfaces({
    required this.background,
    required this.surface,
    required this.elevated,
    required this.header,
    required this.headerForeground,
    required this.headerForegroundMuted,
  });
  final Color background;
  final Color surface;
  final Color elevated;
  final Color header;
  final Color headerForeground;
  final Color headerForegroundMuted;
}

class HerActions {
  const HerActions({
    required this.primary,
    required this.primaryForeground,
    required this.secondary,
    required this.disabled,
    required this.selected,
    required this.selectedForeground,
  });
  final Color primary;
  final Color primaryForeground;
  final Color secondary;
  final Color disabled;
  final Color selected;
  final Color selectedForeground;

  /// Gradient start preserves the approved #B85F7B CTA start for the
  /// baseline; for remote themes it darkens the active primary safely.
  Color get primaryDark {
    if (primary.toARGB32() == 0xFFC86F8A) {
      return const Color(0xFFB85F7B);
    }
    final hsl = HSLColor.fromColor(primary);
    return hsl.withLightness((hsl.lightness - 0.07).clamp(0.0, 1.0)).toColor();
  }

  Color get emotionalForGradient {
    if (primary.toARGB32() == 0xFFC86F8A) {
      return const Color(0xFFD9829A);
    }
    return primary;
  }
}

class HerAccents {
  const HerAccents({
    required this.emotional,
    required this.wellness,
    required this.energy,
    required this.learning,
    required this.neutral,
  });
  final Color emotional;
  final Color wellness;
  final Color energy;
  final Color learning;
  final Color neutral;
}

class HerWashes {
  const HerWashes({
    required this.emotional,
    required this.wellness,
    required this.energy,
    required this.learning,
    required this.neutral,
  });
  final Color emotional;
  final Color wellness;
  final Color energy;
  final Color learning;
  final Color neutral;
}

class HerCards {
  const HerCards({
    required this.surface,
    required this.border,
    required this.elevatedSurface,
  });
  final Color surface;
  final Color border;
  final Color elevatedSurface;
}

/// Phase 1: explicit canonical card roles. Assigned by the developer —
/// never inferred from width. Seven roles; anything else needs justification.
/// `content` is the long-form readable card (dhikr/dua text, articles) —
/// calm like Small, independent key by design.
enum HERCardRole { large, medium, small, wide, journey, hero, content }

/// Phase 1: one card family's full visual recipe. Color AND opacity live here —
/// no `withValues(alpha:)` for these properties inside feature screens.
class HerCardRoleStyle {
  const HerCardRoleStyle({
    this.backdropBlur,
    this.gradientDirection,
    required this.gradientStart,
    this.gradientStartOpacity = 1,
    required this.gradientEnd,
    this.gradientEndOpacity = 1,
    this.surfaceOpacity = 1,
    required this.borderColor,
    this.borderOpacity = 1,
    this.borderWidth = 1,
    required this.shadowColor,
    this.shadowOpacity = .08,
    this.shadowBlur = 18,
    this.shadowOffset = const Offset(0, 7),
    this.radius = 22,
  });

  final Color gradientStart;
  final double gradientStartOpacity;
  final Color gradientEnd;
  final double gradientEndOpacity;
  final double surfaceOpacity;
  final double? backdropBlur;
  final String? gradientDirection;
  final Color borderColor;
  final double borderOpacity;
  final double borderWidth;
  final Color shadowColor;
  final double shadowOpacity;
  final double shadowBlur;
  final Offset shadowOffset;
  final double radius;

  /// Pink Master calibration: per-role refinement without touching the
  /// shared recipe (used for the richer hero: blush end + deeper shadow).
  HerCardRoleStyle copyWith({
    double? backdropBlur,
    String? gradientDirection,
    Color? gradientStart,
    double? gradientStartOpacity,
    Color? gradientEnd,
    double? gradientEndOpacity,
    double? surfaceOpacity,
    Color? borderColor,
    double? borderOpacity,
    double? borderWidth,
    Color? shadowColor,
    double? shadowOpacity,
    double? shadowBlur,
    Offset? shadowOffset,
    double? radius,
  }) => HerCardRoleStyle(
    backdropBlur: backdropBlur ?? this.backdropBlur,
    gradientDirection: gradientDirection ?? this.gradientDirection,
    gradientStart: gradientStart ?? this.gradientStart,
    gradientStartOpacity: gradientStartOpacity ?? this.gradientStartOpacity,
    gradientEnd: gradientEnd ?? this.gradientEnd,
    gradientEndOpacity: gradientEndOpacity ?? this.gradientEndOpacity,
    surfaceOpacity: surfaceOpacity ?? this.surfaceOpacity,
    borderColor: borderColor ?? this.borderColor,
    borderOpacity: borderOpacity ?? this.borderOpacity,
    borderWidth: borderWidth ?? this.borderWidth,
    shadowColor: shadowColor ?? this.shadowColor,
    shadowOpacity: shadowOpacity ?? this.shadowOpacity,
    shadowBlur: shadowBlur ?? this.shadowBlur,
    shadowOffset: shadowOffset ?? this.shadowOffset,
    radius: radius ?? this.radius,
  );

  /// Same geometry as `AppDecorations.componentCardFor` (topCenter→bottomCenter).
  BoxDecoration decoration({double? radius}) {
    final r = radius ?? this.radius;
    return BoxDecoration(
      gradient: LinearGradient(
        begin: themeGradientBegin(gradientDirection, Alignment.topCenter),
        end: themeGradientEnd(gradientDirection, Alignment.bottomCenter),
        colors: [
          gradientStart.withValues(alpha: gradientStartOpacity),
          gradientEnd.withValues(alpha: gradientEndOpacity),
        ],
      ),
      borderRadius: BorderRadius.circular(r),
      border: borderWidth <= 0
          ? null
          : Border.all(
              color: borderColor.withValues(alpha: borderOpacity),
              width: borderWidth,
            ),
      boxShadow: shadowOpacity <= 0
          ? null
          : [
              BoxShadow(
                color: shadowColor.withValues(alpha: shadowOpacity),
                blurRadius: shadowBlur,
                offset: shadowOffset,
              ),
            ],
    );
  }

  static HerCardRoleStyle lerp(
    HerCardRoleStyle a,
    HerCardRoleStyle b,
    double t,
  ) {
    Color blend(Color x, Color y) => Color.lerp(x, y, t)!;
    double l(double x, double y) => x + (y - x) * t;
    return HerCardRoleStyle(
      gradientDirection: t < .5 ? a.gradientDirection : b.gradientDirection,
      backdropBlur: a.backdropBlur == null && b.backdropBlur == null
          ? null
          : l(a.backdropBlur ?? 0, b.backdropBlur ?? 0),
      gradientStart: blend(a.gradientStart, b.gradientStart),
      gradientStartOpacity: l(a.gradientStartOpacity, b.gradientStartOpacity),
      gradientEnd: blend(a.gradientEnd, b.gradientEnd),
      gradientEndOpacity: l(a.gradientEndOpacity, b.gradientEndOpacity),
      surfaceOpacity: l(a.surfaceOpacity, b.surfaceOpacity),
      borderColor: blend(a.borderColor, b.borderColor),
      borderOpacity: l(a.borderOpacity, b.borderOpacity),
      borderWidth: l(a.borderWidth, b.borderWidth),
      shadowColor: blend(a.shadowColor, b.shadowColor),
      shadowOpacity: l(a.shadowOpacity, b.shadowOpacity),
      shadowBlur: l(a.shadowBlur, b.shadowBlur),
      shadowOffset: Offset.lerp(a.shadowOffset, b.shadowOffset, t)!,
      radius: l(a.radius, b.radius),
    );
  }
}

/// Phase 1: the seven canonical card styles, addressed by explicit role.
class HerCardRoles {
  const HerCardRoles({
    required this.large,
    required this.medium,
    required this.small,
    required this.wide,
    required this.journey,
    required this.hero,
    required this.content,
  });

  final HerCardRoleStyle large;
  final HerCardRoleStyle medium;
  final HerCardRoleStyle small;
  final HerCardRoleStyle wide;
  final HerCardRoleStyle journey;
  final HerCardRoleStyle hero;
  final HerCardRoleStyle content;

  HerCardRoleStyle operator [](HERCardRole role) => switch (role) {
    HERCardRole.large => large,
    HERCardRole.medium => medium,
    HERCardRole.small => small,
    HERCardRole.wide => wide,
    HERCardRole.journey => journey,
    HERCardRole.hero => hero,
    HERCardRole.content => content,
  };

  static HerCardRoles lerp(HerCardRoles a, HerCardRoles b, double t) =>
      HerCardRoles(
        large: HerCardRoleStyle.lerp(a.large, b.large, t),
        medium: HerCardRoleStyle.lerp(a.medium, b.medium, t),
        small: HerCardRoleStyle.lerp(a.small, b.small, t),
        wide: HerCardRoleStyle.lerp(a.wide, b.wide, t),
        journey: HerCardRoleStyle.lerp(a.journey, b.journey, t),
        hero: HerCardRoleStyle.lerp(a.hero, b.hero, t),
        content: HerCardRoleStyle.lerp(a.content, b.content, t),
      );
}

/// Phase 1: one normal button's full recipe (danger = model only for now).
///
/// `flatBackground` supports the `flat` presentation variant (solid fill) for
/// genuinely existing flat CTAs. It is ONE centrally owned color per role —
/// never a feature theme.
class HerButtonStyle {
  const HerButtonStyle({
    required this.gradientStart,
    required this.gradientEnd,
    this.backgroundOpacity = 1,
    required this.flatBackground,
    required this.foreground,
    required this.borderColor,
    this.iconColor = Colors.white,
    this.iconBackground = const Color(0xFFFFFFFF),
    this.borderOpacity = 1,
    this.borderWidth = 0,
    this.shadowColor = const Color(0x00000000),
    this.shadowOpacity = 0,
    this.shadowBlur = 24,
    this.shadowOffset = const Offset(0, 10),
    this.radius = 24,
    this.disabledOpacity = .55,
  });

  final Color gradientStart;
  final Color gradientEnd;
  final double backgroundOpacity;

  /// Solid fill for the `flat` presentation variant (same role, same system).
  final Color flatBackground;
  final Color foreground;
  final Color borderColor;
  final Color iconColor;
  final Color iconBackground;
  final double borderOpacity;
  final double borderWidth;
  final Color shadowColor;
  final double shadowOpacity;
  final double shadowBlur;
  final Offset shadowOffset;
  final double radius;
  final double disabledOpacity;

  LinearGradient gradient() => LinearGradient(
    colors: [
      gradientStart.withValues(alpha: backgroundOpacity),
      gradientEnd.withValues(alpha: backgroundOpacity),
    ],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  static HerButtonStyle lerp(HerButtonStyle a, HerButtonStyle b, double t) {
    Color blend(Color x, Color y) => Color.lerp(x, y, t)!;
    double l(double x, double y) => x + (y - x) * t;
    return HerButtonStyle(
      gradientStart: blend(a.gradientStart, b.gradientStart),
      gradientEnd: blend(a.gradientEnd, b.gradientEnd),
      backgroundOpacity: l(a.backgroundOpacity, b.backgroundOpacity),
      flatBackground: blend(a.flatBackground, b.flatBackground),
      foreground: blend(a.foreground, b.foreground),
      borderColor: blend(a.borderColor, b.borderColor),
      iconColor: blend(a.iconColor, b.iconColor),
      iconBackground: blend(a.iconBackground, b.iconBackground),
      borderOpacity: l(a.borderOpacity, b.borderOpacity),
      borderWidth: l(a.borderWidth, b.borderWidth),
      shadowColor: blend(a.shadowColor, b.shadowColor),
      shadowOpacity: l(a.shadowOpacity, b.shadowOpacity),
      shadowBlur: l(a.shadowBlur, b.shadowBlur),
      shadowOffset: Offset.lerp(a.shadowOffset, b.shadowOffset, t)!,
      radius: l(a.radius, b.radius),
      disabledOpacity: l(a.disabledOpacity, b.disabledOpacity),
    );
  }
}

/// Phase 1: the three normal button appearances.
class HerButtonStyles {
  const HerButtonStyles({
    required this.primary,
    required this.secondary,
    required this.danger,
  });

  final HerButtonStyle primary;
  final HerButtonStyle secondary;
  final HerButtonStyle danger;

  static HerButtonStyles lerp(HerButtonStyles a, HerButtonStyles b, double t) =>
      HerButtonStyles(
        primary: HerButtonStyle.lerp(a.primary, b.primary, t),
        secondary: HerButtonStyle.lerp(a.secondary, b.secondary, t),
        danger: HerButtonStyle.lerp(a.danger, b.danger, t),
      );
}

/// Phase 1: normal icon container + glyph appearance (color AND opacity).
class HerIconStyle {
  const HerIconStyle({
    required this.containerColor,
    this.containerOpacity = 1,
    required this.containerBorderColor,
    this.containerBorderOpacity = 1,
    this.containerBorderWidth = 1,
    required this.glyphColor,
    this.glyphOpacity = 1,
  });

  final Color containerColor;
  final double containerOpacity;
  final Color containerBorderColor;
  final double containerBorderOpacity;
  final double containerBorderWidth;
  final Color glyphColor;
  final double glyphOpacity;

  static HerIconStyle lerp(HerIconStyle a, HerIconStyle b, double t) {
    Color blend(Color x, Color y) => Color.lerp(x, y, t)!;
    double l(double x, double y) => x + (y - x) * t;
    return HerIconStyle(
      containerColor: blend(a.containerColor, b.containerColor),
      containerOpacity: l(a.containerOpacity, b.containerOpacity),
      containerBorderColor: blend(
        a.containerBorderColor,
        b.containerBorderColor,
      ),
      containerBorderOpacity: l(
        a.containerBorderOpacity,
        b.containerBorderOpacity,
      ),
      containerBorderWidth: l(a.containerBorderWidth, b.containerBorderWidth),
      glyphColor: blend(a.glyphColor, b.glyphColor),
      glyphOpacity: l(a.glyphOpacity, b.glyphOpacity),
    );
  }
}

/// Phase 0: canonical selected/unselected/disabled/pressed tokens.
///
/// Created before any call-site migration: screens keep their local states
/// until Phase 1+ adopts these owners one component at a time.
class HerStateTokens {
  const HerStateTokens({
    required this.selectedSurface,
    required this.selectedForeground,
    required this.selectedBorder,
    required this.unselectedSurface,
    required this.unselectedForeground,
    required this.unselectedBorder,
    this.disabledOpacity = .55,
    this.pressedOverlayOpacity = .12,
  });

  final Color selectedSurface;
  final Color selectedForeground;
  final Color selectedBorder;
  final Color unselectedSurface;
  final Color unselectedForeground;
  final Color unselectedBorder;
  final double disabledOpacity;
  final double pressedOverlayOpacity;

  static HerStateTokens lerp(HerStateTokens a, HerStateTokens b, double t) {
    Color blend(Color x, Color y) => Color.lerp(x, y, t)!;
    double l(double x, double y) => x + (y - x) * t;
    return HerStateTokens(
      selectedSurface: blend(a.selectedSurface, b.selectedSurface),
      selectedForeground: blend(a.selectedForeground, b.selectedForeground),
      selectedBorder: blend(a.selectedBorder, b.selectedBorder),
      unselectedSurface: blend(a.unselectedSurface, b.unselectedSurface),
      unselectedForeground: blend(
        a.unselectedForeground,
        b.unselectedForeground,
      ),
      unselectedBorder: blend(a.unselectedBorder, b.unselectedBorder),
      disabledOpacity: l(a.disabledOpacity, b.disabledOpacity),
      pressedOverlayOpacity: l(
        a.pressedOverlayOpacity,
        b.pressedOverlayOpacity,
      ),
    );
  }
}

/// Phase 0: canonical switch styling tokens (model only; no migration yet).
class HerSwitchStyle {
  const HerSwitchStyle({
    required this.trackSelected,
    required this.thumbSelected,
    required this.trackUnselected,
    required this.thumbUnselected,
    required this.border,
  });

  final Color trackSelected;
  final Color thumbSelected;
  final Color trackUnselected;
  final Color thumbUnselected;
  final Color border;

  static HerSwitchStyle lerp(HerSwitchStyle a, HerSwitchStyle b, double t) {
    Color blend(Color x, Color y) => Color.lerp(x, y, t)!;
    return HerSwitchStyle(
      trackSelected: blend(a.trackSelected, b.trackSelected),
      thumbSelected: blend(a.thumbSelected, b.thumbSelected),
      trackUnselected: blend(a.trackUnselected, b.trackUnselected),
      thumbUnselected: blend(a.thumbUnselected, b.thumbUnselected),
      border: blend(a.border, b.border),
    );
  }
}

/// Phase 0: canonical tab styling tokens (model only; no migration yet).
class HerTabStyle {
  const HerTabStyle({
    required this.selectedForeground,
    required this.unselectedForeground,
    required this.indicator,
  });

  final Color selectedForeground;
  final Color unselectedForeground;
  final Color indicator;

  static HerTabStyle lerp(HerTabStyle a, HerTabStyle b, double t) {
    Color blend(Color x, Color y) => Color.lerp(x, y, t)!;
    return HerTabStyle(
      selectedForeground: blend(a.selectedForeground, b.selectedForeground),
      unselectedForeground: blend(
        a.unselectedForeground,
        b.unselectedForeground,
      ),
      indicator: blend(a.indicator, b.indicator),
    );
  }
}

/// Phase 1: one semantic accent — meaningful COLOR identity.
///
/// Rule (Phase 2 prep): accents own color personality (gradient colors, border
/// tint, glyph selection) — NEVER normal component transparency. The card
/// family opacity stays authoritative; [washOpacity] survives only as the
/// TRANSITIONAL tint-mix factor for already-migrated accent cards and is
/// removed in Phase 3. Do not add new readers of it.
class HerAccent {
  const HerAccent({required this.color, this.washOpacity = .17});

  final Color color;
  final double washOpacity;

  static HerAccent lerp(HerAccent a, HerAccent b, double t) => HerAccent(
    color: Color.lerp(a.color, b.color, t)!,
    washOpacity: a.washOpacity + (b.washOpacity - a.washOpacity) * t,
  );
}

/// Phase 1: fitness semantic accents (independently controllable).
class HerFitnessAccents {
  const HerFitnessAccents({
    required this.steps,
    required this.calories,
    required this.workout,
    required this.nutrition,
  });

  final HerAccent steps;
  final HerAccent calories;
  final HerAccent workout;

  /// Nutrition olive/sage identity (dedicated accent; Steps/Calories/Workout
  /// mappings are never reused for it).
  final HerAccent nutrition;

  static HerFitnessAccents lerp(
    HerFitnessAccents a,
    HerFitnessAccents b,
    double t,
  ) => HerFitnessAccents(
    steps: HerAccent.lerp(a.steps, b.steps, t),
    calories: HerAccent.lerp(a.calories, b.calories, t),
    workout: HerAccent.lerp(a.workout, b.workout, t),
    nutrition: HerAccent.lerp(a.nutrition, b.nutrition, t),
  );
}

/// Phase 1: cycle semantic accents (structure only; screens adopt in Phase 2).
class HerCycleAccents {
  const HerCycleAccents({
    required this.period,
    required this.predicted,
    required this.fertile,
    required this.ovulation,
    required this.safe,
  });

  final HerAccent period;
  final HerAccent predicted;
  final HerAccent fertile;
  final HerAccent ovulation;
  final HerAccent safe;

  static HerCycleAccents lerp(HerCycleAccents a, HerCycleAccents b, double t) =>
      HerCycleAccents(
        period: HerAccent.lerp(a.period, b.period, t),
        predicted: HerAccent.lerp(a.predicted, b.predicted, t),
        fertile: HerAccent.lerp(a.fertile, b.fertile, t),
        ovulation: HerAccent.lerp(a.ovulation, b.ovulation, t),
        safe: HerAccent.lerp(a.safe, b.safe, t),
      );
}

/// Phase 1: semantic accent container (faith/radio/… shells arrive in Phase 2).
class HerSemanticAccents {
  const HerSemanticAccents({required this.fitness, required this.cycle});

  final HerFitnessAccents fitness;
  final HerCycleAccents cycle;

  static HerSemanticAccents lerp(
    HerSemanticAccents a,
    HerSemanticAccents b,
    double t,
  ) => HerSemanticAccents(
    fitness: HerFitnessAccents.lerp(a.fitness, b.fitness, t),
    cycle: HerCycleAccents.lerp(a.cycle, b.cycle, t),
  );
}

/// Phase 1: structural (non-card) styles. `listRow` reproduces today's dense-row
/// look; it is NOT a card family and never follows Cards>Wide.
class HerStructureStyles {
  const HerStructureStyles({required this.listRow});

  final HerCardRoleStyle listRow;

  static HerStructureStyles lerp(
    HerStructureStyles a,
    HerStructureStyles b,
    double t,
  ) => HerStructureStyles(
    listRow: HerCardRoleStyle.lerp(a.listRow, b.listRow, t),
  );
}

/// Phase 2 prep: the dedicated SLIDE / CAROUSEL surface family.
///
/// Slides are paged content (PageView/carousel tips, guides, dashboard
/// rotators) — never Wide cards, never heroes. One recipe for all slide
/// surfaces; per-slide color personality comes from semantic accent COLORS
/// while [surfaceOpacity]/border/shadow/radius stay family-owned.
/// Indicator colors are centrally owned; slides select no local dot colors.
class HerSlideStyle {
  const HerSlideStyle({
    required this.gradientStart,
    this.gradientStartOpacity = 1,
    required this.gradientEnd,
    this.gradientEndOpacity = 1,
    this.surfaceOpacity = 1,
    required this.borderColor,
    this.borderOpacity = 1,
    this.borderWidth = 1,
    required this.shadowColor,
    this.shadowOpacity = .15,
    this.shadowBlur = 22,
    this.shadowOffset = const Offset(0, 10),
    this.radius = 24,
    required this.indicatorActive,
    required this.indicatorInactive,
  });

  final Color gradientStart;
  final double gradientStartOpacity;
  final Color gradientEnd;
  final double gradientEndOpacity;
  final double surfaceOpacity;
  final Color borderColor;
  final double borderOpacity;
  final double borderWidth;
  final Color shadowColor;
  final double shadowOpacity;
  final double shadowBlur;
  final Offset shadowOffset;
  final double radius;
  final Color indicatorActive;
  final Color indicatorInactive;

  /// Same geometry as the previous `componentCardFor('slide')` recipe
  /// (topCenter→bottomCenter; elevated branch shadow).
  BoxDecoration decoration({double? radius, bool elevated = true}) {
    final r = radius ?? this.radius;
    return BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          gradientStart.withValues(alpha: gradientStartOpacity),
          gradientEnd.withValues(alpha: gradientEndOpacity),
        ],
      ),
      borderRadius: BorderRadius.circular(r),
      border: borderWidth <= 0
          ? null
          : Border.all(
              color: borderColor.withValues(alpha: borderOpacity),
              width: borderWidth,
            ),
      boxShadow: !elevated || shadowOpacity <= 0
          ? null
          : [
              BoxShadow(
                color: shadowColor.withValues(alpha: shadowOpacity),
                blurRadius: shadowBlur,
                offset: shadowOffset,
              ),
            ],
    );
  }

  static HerSlideStyle lerp(HerSlideStyle a, HerSlideStyle b, double t) {
    Color blend(Color x, Color y) => Color.lerp(x, y, t)!;
    double l(double x, double y) => x + (y - x) * t;
    return HerSlideStyle(
      gradientStart: blend(a.gradientStart, b.gradientStart),
      gradientStartOpacity: l(a.gradientStartOpacity, b.gradientStartOpacity),
      gradientEnd: blend(a.gradientEnd, b.gradientEnd),
      gradientEndOpacity: l(a.gradientEndOpacity, b.gradientEndOpacity),
      surfaceOpacity: l(a.surfaceOpacity, b.surfaceOpacity),
      borderColor: blend(a.borderColor, b.borderColor),
      borderOpacity: l(a.borderOpacity, b.borderOpacity),
      borderWidth: l(a.borderWidth, b.borderWidth),
      shadowColor: blend(a.shadowColor, b.shadowColor),
      shadowOpacity: l(a.shadowOpacity, b.shadowOpacity),
      shadowBlur: l(a.shadowBlur, b.shadowBlur),
      shadowOffset: Offset.lerp(a.shadowOffset, b.shadowOffset, t)!,
      radius: l(a.radius, b.radius),
      indicatorActive: blend(a.indicatorActive, b.indicatorActive),
      indicatorInactive: blend(a.indicatorInactive, b.indicatorInactive),
    );
  }
}

class HerNavigation {
  const HerNavigation({
    required this.background,
    required this.gradientStart,
    required this.gradientEnd,
    required this.border,
    required this.borderOpacity,
    required this.active,
    required this.inactive,
  });
  final Color background;
  final Color gradientStart;
  final Color gradientEnd;
  final Color border;
  final double borderOpacity;
  final Color active;
  final Color inactive;
}

class HerStatus {
  const HerStatus({
    required this.success,
    required this.successWash,
    required this.warning,
    required this.warningWash,
    required this.error,
    required this.errorWash,
    required this.errorDark,
    required this.info,
    required this.infoWash,
    required this.gold,
    required this.goldWash,
  });
  final Color success;
  final Color successWash;
  final Color warning;
  final Color warningWash;
  final Color error;
  final Color errorWash;
  final Color errorDark;
  final Color info;
  final Color infoWash;
  final Color gold;
  final Color goldWash;
}

/// Centralized normal-visual opacity policy.
///
/// A normal HER card must NOT decide its own arbitrary alpha; it uses
/// [surface]/[softWash]. Media/gameplay overlays keep their own values.
class HerOpacityPolicy {
  const HerOpacityPolicy({
    required this.surface,
    required this.secondarySurface,
    required this.softWash,
    required this.header,
    required this.overlay,
    required this.navigation,
    required this.icon,
    required this.iconBackground,
    required this.disabled,
    required this.scrim,
  });
  final double surface;
  final double secondarySurface;
  final double softWash;
  final double header;
  final double overlay;
  final double navigation;
  final double icon;
  final double iconBackground;
  final double disabled;
  final double scrim;

  static HerOpacityPolicy lerp(
    HerOpacityPolicy a,
    HerOpacityPolicy b,
    double t,
  ) => HerOpacityPolicy(
    surface: _l(a.surface, b.surface, t),
    secondarySurface: _l(a.secondarySurface, b.secondarySurface, t),
    softWash: _l(a.softWash, b.softWash, t),
    header: _l(a.header, b.header, t),
    overlay: _l(a.overlay, b.overlay, t),
    navigation: _l(a.navigation, b.navigation, t),
    icon: _l(a.icon, b.icon, t),
    iconBackground: _l(a.iconBackground, b.iconBackground, t),
    disabled: _l(a.disabled, b.disabled, t),
    scrim: _l(a.scrim, b.scrim, t),
  );

  static double _l(double a, double b, double t) => a + (b - a) * t;
}

/// Ergonomic semantic access. Prefer over physical color names:
///
/// ```dart
/// context.herTheme.text.primary
/// context.herTheme.surfaces.background
/// context.herTheme.actions.primary
/// context.herTheme.accents.wellness
/// ```
extension HerThemeContext on BuildContext {
  HerThemeData get herTheme =>
      Theme.of(this).extension<HerThemeData>() ?? HerThemeData.fallback();
}

/// Non-context access for compat adapters (GamesTheme, AppColors).
/// Updated by the single build pipeline in `main.dart`.
abstract final class HerThemeEngine {
  static HerThemeData _current = HerThemeData.fallback();
  static HerThemeData get current => _current;
  static void update(ThemePalette palette) {
    _current = HerThemeData.fromPalette(palette);
  }

  /// Test-only override for mutation tests.
  @visibleForTesting
  static void overrideForTest(HerThemeData theme) => _current = theme;
}
