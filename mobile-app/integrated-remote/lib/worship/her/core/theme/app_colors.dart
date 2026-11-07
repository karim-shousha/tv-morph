import 'package:flutter/material.dart';

import 'her_theme_data.dart';
import 'her_modern_accents.dart';
import 'theme_palette.dart';

/// HER | روشة — brand constants + deprecated runtime compat adapter.
///
/// SINGLE SOURCE OF TRUTH: [HerThemeData] (via [HerThemeEngine]).
///
/// - Raw brand hues / fallback constants below remain as static consts.
/// - Every RUNTIME semantic color resolves through the active [HerThemeData].
/// - [apply] is deprecated: it only forwards the palette into the single
///   pipeline (`HerThemeEngine.update`). No widget may depend on its
///   timing/order; widgets must read `context.herTheme`.
class AppColors {
  AppColors._();

  // ============================================================
  // Raw HER brand hues (fallback constants, do NOT use directly
  // in feature screens — use context.herTheme instead).
  // ============================================================

  /// Legacy heading/text alias.  It must follow the published readable text
  /// role, not the secondary action colour: older game screens used this on
  /// dark cards and were consequently rendering near-black copy.
  static Color get burgundy => _theme.text.primary;

  /// Primary rose — main actions, important icons.
  static Color get rosePrimary => _theme.actions.primary;

  /// Emotional rose — relationships, highlights, secondary actions.
  static Color get rose => _theme.accents.emotional;

  /// Soft rose — washes, light selections.
  static Color get softRose => _theme.palette.primaryLight;

  /// Blush — soft cards, icon backgrounds.
  static Color get blush => _theme.washes.emotional;

  /// Very light blush — softest tinted surfaces.
  static Color get blushLight => _theme.washes.neutral;

  /// App background.
  static Color get cream => _theme.surfaces.background;

  /// Cards, dialogs, sheets, forms.
  static Color get warmWhite => _theme.surfaces.surface;

  /// Rosewood — health / wellness / calm (global token, rose family).
  static Color get sage => _theme.accents.wellness;

  /// Soft rose wash (former sage slot — rose family, no green).
  static Color get softSage => _theme.washes.wellness;

  /// Peach — energy / activity warmth.
  static Color get peach => _theme.accents.energy;

  /// Soft peach wash.
  static Color get softPeach => _theme.washes.energy;

  /// Warm glyph for energy icons (peach wash is too light for glyphs).
  // Cream/gold accent for knowledge and warmth; the former olive slot is
  // intentionally retired from the app palette.
  static Color get terracotta => _theme.palette.iconCreamGlyphColor;

  /// Muted dusty mauve — learning / knowledge (never bright purple).
  static Color get mauve => _theme.accents.learning;

  /// Soft mauve wash.
  static Color get softMauve => _theme.washes.learning;

  /// Secondary text — dusty raspberry, never gray (logo has no gray).
  static Color get warmGrey => _theme.text.secondary;

  /// Muted text — soft rose, never gray.
  static Color get muted => _theme.text.muted;

  /// HER border.
  static Color get borderHer => _theme.cards.border;

  /// Dividers (a breath deeper than borders).
  static Color get dividerHer => _theme.cards.border;

  /// Primary-button gradient start.
  static Color get buttonGradientStart =>
      _theme.buttonStyles.primary.gradientStart;

  // ============================================================
  // Approved HER gradients — fallback constants. Runtime code should
  // prefer context.herTheme.primaryActionGradient etc.
  // ============================================================

  /// Primary CTA: #B85F7B → #D9829A.
  static LinearGradient get primaryButtonGradient =>
      _theme.primaryActionGradient;

  /// Legacy feature gradients now resolve to the published wide-card layer.
  /// Keeping five independent gradients here was the source of the orange,
  /// mauve and faded cards that could not be edited in Theme Studio.
  static LinearGradient get roseGradient => _componentGradient('secondaryCard');
  static LinearGradient get blushGradient =>
      _componentGradient('secondaryCard');
  static LinearGradient get sageGradient => _componentGradient('secondaryCard');
  static LinearGradient get peachGradient =>
      _componentGradient('secondaryCard');
  static LinearGradient get mauveGradient =>
      _componentGradient('secondaryCard');

  // ============================================================
  // HER shadows — soft, warm, subtle.
  // ============================================================

  /// Shadows are part of the active visual identity too.  The old fixed
  /// burgundy tint made cards retain an obsolete hue after changing the
  /// primary colour in the dashboard.
  static List<BoxShadow> get softShadow => [
    BoxShadow(
      color: _theme.actions.primary.withValues(alpha: .08),
      blurRadius: 18,
      offset: const Offset(0, 7),
    ),
  ];

  static List<BoxShadow> get heroShadow => [
    BoxShadow(
      color: _theme.actions.primary.withValues(alpha: .15),
      blurRadius: 24,
      offset: const Offset(0, 10),
    ),
  ];

  static List<BoxShadow> tintedShadow(Color tone, [double opacity = .22]) => [
    BoxShadow(
      color: tone.withValues(alpha: opacity),
      blurRadius: 22,
      offset: const Offset(0, 10),
    ),
  ];

  // ============================================================
  // SEMANTIC TOKENS — deprecated compat adapter over HerThemeData.
  //
  // Do NOT store independent mutable state here. Every getter below
  // resolves through HerThemeEngine.current (the single runtime theme).
  // New code must use context.herTheme instead.
  // ============================================================

  static HerThemeData get _theme => HerThemeEngine.current;

  /// Deprecated single-pipeline forwarder. Prefer letting
  /// `RemoteThemeController -> ThemePalette -> HerThemeData` rebuild the
  /// MaterialApp. Kept only so legacy call sites/tests keep compiling.
  @Deprecated(
    'Use RemoteThemeController -> ThemePalette -> HerThemeData; '
    'widgets must read context.herTheme.',
  )
  static void apply(ThemePalette palette) {
    HerThemeEngine.update(palette);
  }

  // Surfaces.
  static Color get background => _theme.surfaces.background;
  static Color get surface =>
      _theme.surfaces.surface.withValues(alpha: _theme.opacity.surface);

  /// Dialogs and modal sheets are content layers, not decorative cards.
  /// They must remain readable even when the dashboard deliberately lowers
  /// the opacity of ordinary cards.  Keep this tied to the published popup
  /// role rather than falling back to the legacy translucent surface.
  static Color get popupSurface =>
      _theme.palette.componentStyle('popup').gradientStart;
  static Color get surfaceSoft => _theme.washes.neutral;
  // Opaque card background for dialogs, buttons and structural surfaces.
  // Background CARDS on tinted pages use [cardWhite] instead (tasbih
  // recipe, single global knob [cardWhiteOpacity]).
  static Color get cardBackground => cardWhite;
  // These historical names intentionally resolve to the single `section`
  // card role. They are kept as aliases only so an old feature cannot bring
  // back a green, orange or purple card outside Theme Studio.
  static Color get cardSoftRose => _sectionCardSurface;
  static Color get cardSoftSage => _sectionCardSurface;
  static Color get cardSoftPeach => _sectionCardSurface;
  static Color get cardSoftMauve => _sectionCardSurface;

  // Text.
  static Color get textPrimary => _theme.text.primary;
  static Color get textSecondary => _theme.text.secondary;
  static Color get textMuted => _theme.text.muted;

  // Actions.
  static Color get actionPrimary => _theme.actions.primary;
  static Color get actionSecondary => _theme.actions.secondary;

  // Legacy names resolve through the same authored accent families as widgets.
  static Color _icon(HerModernAccentId id) =>
      (_theme.palette.modernAccents.isEmpty
              ? _theme.palette.iconColor
              : _theme.modernAccents[id].accentColor)
          .withValues(alpha: _theme.opacity.icon);
  static Color _iconWash(HerModernAccentId id) =>
      (_theme.palette.modernAccents.isEmpty
              ? _theme.palette.iconBackgroundColor
              : _theme.modernAccents[id].subtleBackground)
          .withValues(alpha: _theme.opacity.iconBackground);
  static Color get iconPrimary => _icon(HerModernAccentId.rose);
  static Color get iconEmotional => _icon(HerModernAccentId.rose);
  static Color get iconWellness => _icon(HerModernAccentId.mint);
  static Color get iconWarm => _icon(HerModernAccentId.coral);
  static Color get iconKnowledge => _icon(HerModernAccentId.lavender);
  static Color get iconNeutral => _theme.palette.modernAccents.isEmpty
      ? iconPrimary
      : _theme.text.secondary;
  static Color get iconBackgroundRose => _iconWash(HerModernAccentId.rose);
  static Color get iconBackgroundSage => _iconWash(HerModernAccentId.sage);
  static Color get iconBackgroundPeach => _iconWash(HerModernAccentId.coral);
  static Color get iconBackgroundMauve => _iconWash(HerModernAccentId.lavender);
  static Color get iconBackgroundNeutral => _theme.palette.modernAccents.isEmpty
      ? iconBackground
      : _theme.surfaces.surface;

  // Borders.
  static Color get border => _theme.cards.border;
  static Color get divider => _theme.cards.border;

  // Header / hero foregrounds.
  static Color get headerBackground => _theme.surfaces.header;
  static Color get headerForeground => _theme.surfaces.headerForeground;
  static Color get headerForegroundMuted =>
      _theme.surfaces.headerForegroundMuted;

  static Color get heroBackground => _theme.actions.primary;
  static Color get heroForeground => _theme.actions.primaryForeground;
  static Color get onAccentForeground => _theme.text.onAccent;

  /// Picks a readable foreground for an arbitrary [background].
  static Color contrastForeground(Color background) =>
      _theme.contrastForeground(background);

  static Color contrastMuted(Color background) =>
      _theme.contrastMuted(background);

  // Selection.
  static Color get selectedBackground => _theme.actions.selected;
  static Color get selectedForeground => _theme.actions.selectedForeground;
  static Color get unselectedBackground => _theme.cards.surface;
  static Color get unselectedForeground => _theme.text.secondary;

  // Legacy primary family (compat, bound to HER semantics).
  static Color get primary => _theme.actions.primary;
  static Color get primaryDark => _theme.actions.secondary;
  static Color get primaryLight => _theme.palette.primaryLight;
  static Color get accent => _theme.palette.accent ?? _theme.actions.primary;
  static Color get icon => iconPrimary;
  static Color get iconBackground => _theme.palette.iconBackgroundColor
      .withValues(alpha: _theme.opacity.iconBackground);

  // Status — harmonized with HER, fixed so CMS themes never shift meaning.
  static Color get danger => _theme.status.error;
  static Color get dangerDark => _theme.status.errorDark;
  static Color get dangerSurface => _theme.status.errorWash;
  static Color get warning => _theme.status.warning;
  static Color get warningSurface => _theme.status.warningWash;
  static Color get success => _theme.status.success;
  static Color get successSurface => _theme.status.successWash;
  static Color get info => _theme.status.info;
  static Color get infoSurface => _theme.status.infoWash;
  static Color get gold => _theme.status.gold;
  static Color get goldLight => _theme.status.goldWash;

  static Color get white => Colors.white;

  // ============================================================
  // Global background-card white (tasbih recipe) — SINGLE KNOB.
  //
  // Background cards are NOT opaque white: they are white at
  // [cardWhiteOpacity] over the warm page background, so the page
  // tint breathes through like tasbih. Text/icons/dialogs keep
  // using [white]; only card surfaces use [cardWhite].
  // ============================================================

  /// Background-card opacity. Edit this one value to retune every
  /// background card in the app at once.
  static double get cardWhiteOpacity => _theme.opacity.surface;

  /// Global background-card surface — the رد هير recipe: neutral pink wash
  /// at [cardWhiteOpacity], never opaque white. Every HERCard default and
  /// every direct cardWhite usage follows the active theme, so one palette
  /// change retunes all cards together.
  static Color get cardWhite {
    final style = _theme.palette.componentStyle('surface');
    return style.gradientStart.withValues(alpha: style.opacity);
  }

  static Color get _sectionCardSurface {
    final style = _theme.palette.componentStyle('section');
    return style.gradientStart.withValues(alpha: style.opacity);
  }

  static LinearGradient _componentGradient(String role) {
    final style = _theme.palette.componentStyle(role);
    return LinearGradient(
      colors: [
        style.gradientStart.withValues(alpha: style.opacity),
        style.gradientEnd.withValues(alpha: style.opacity),
      ],
      begin: Alignment.topRight,
      end: Alignment.bottomLeft,
    );
  }

  // Convenience aliases used across the app.
  static Color get ink => textPrimary;
  static Color get subtle => textSecondary;
  static Color get accentStrong => primaryDark;
  static Color get softBorder => border;
  static Color get softSurface => surface;
  static Color get canvas => background;

  /// HER button styles.
  static const double buttonRadius = 24;

  static ButtonStyle get secondaryButtonStyle => FilledButton.styleFrom(
    backgroundColor: _theme.buttonStyles.secondary.flatBackground,
    foregroundColor: _theme.buttonStyles.secondary.foreground,
    side: BorderSide(color: _theme.buttonStyles.secondary.borderColor),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(buttonRadius),
    ),
  );

  static Color get softButtonBackground => blush;
}
