import 'package:flutter/material.dart';

import 'her_theme_data.dart';
import 'theme_palette.dart';

/// Modern UI 2.0 — Step 2: semantic accent foundation (additive only).
///
/// Six modern accent families share ONE model. Each family resolves its own
/// background/foreground pairs; there is intentionally no universal
/// foreground. Authored CMS values always win; absent values fall back to
/// deterministic same-palette derivations. Text readability reuses the
/// existing [herReadableForeground] guard; icon glyphs reuse the same
/// [herContrastRatio] primitive with the WCAG non-text threshold, preferring
/// white on deep-enough saturated circles — no second contrast system is
/// introduced here.
///
/// The authored payload lives in [ThemePalette.modernAccents] as raw hex and
/// is absent (`{}`) for every legacy published theme, which then renders via
/// the fallbacks below exactly as before.
enum HerModernAccentId {
  rose('rose'),
  lavender('lavender'),
  mint('mint'),
  softBlue('softBlue'),
  coral('coral'),
  sage('sage');

  const HerModernAccentId(this.key);

  final String key;

  static HerModernAccentId? fromKey(String key) {
    for (final id in HerModernAccentId.values) {
      if (id.key == key) return id;
    }
    return null;
  }
}

/// Field keys of one accent family. Shared with Theme Studio + server schema.
class HerModernAccentFields {
  static const accentColor = 'accentColor';
  static const subtleBackground = 'subtleBackground';
  static const foreground = 'foreground';
  static const iconBackground = 'iconBackground';
  static const iconForeground = 'iconForeground';
  static const progressTrack = 'progressTrack';
  static const progressFill = 'progressFill';

  static const all = <String>[
    accentColor,
    subtleBackground,
    foreground,
    iconBackground,
    iconForeground,
    progressTrack,
    progressFill,
  ];
}

/// One resolved accent family: every surface it paints owns its foreground.
class HerModernAccent {
  const HerModernAccent({
    required this.accentColor,
    required this.subtleBackground,
    required this.foreground,
    required this.iconBackground,
    required this.iconForeground,
    required this.progressTrack,
    required this.progressFill,
  });

  final Color accentColor;
  final Color subtleBackground;
  final Color foreground;
  final Color iconBackground;
  final Color iconForeground;
  final Color progressTrack;
  final Color progressFill;

  static HerModernAccent lerp(HerModernAccent a, HerModernAccent b, double t) {
    Color blend(Color x, Color y) => Color.lerp(x, y, t)!;
    return HerModernAccent(
      accentColor: blend(a.accentColor, b.accentColor),
      subtleBackground: blend(a.subtleBackground, b.subtleBackground),
      foreground: blend(a.foreground, b.foreground),
      iconBackground: blend(a.iconBackground, b.iconBackground),
      iconForeground: blend(a.iconForeground, b.iconForeground),
      progressTrack: blend(a.progressTrack, b.progressTrack),
      progressFill: blend(a.progressFill, b.progressFill),
    );
  }
}

/// The six resolved families. Obtained via `context.herTheme.modernAccents`.
class HerModernAccents {
  const HerModernAccents({
    required this.rose,
    required this.lavender,
    required this.mint,
    required this.softBlue,
    required this.coral,
    required this.sage,
  });

  final HerModernAccent rose;
  final HerModernAccent lavender;
  final HerModernAccent mint;
  final HerModernAccent softBlue;
  final HerModernAccent coral;
  final HerModernAccent sage;

  HerModernAccent operator [](HerModernAccentId id) => switch (id) {
    HerModernAccentId.rose => rose,
    HerModernAccentId.lavender => lavender,
    HerModernAccentId.mint => mint,
    HerModernAccentId.softBlue => softBlue,
    HerModernAccentId.coral => coral,
    HerModernAccentId.sage => sage,
  };

  /// Deterministic legacy-compatible resolution.
  ///
  /// [authored] is the raw `modernAccents` map from the remote payload
  /// (empty for every theme published before Step 2). Each absent field
  /// derives from the same palette's existing semantic tokens:
  /// rose→accent/primary, lavender→steps icon/circle, mint→workout
  /// icon/circle, softBlue→water-fill, coral→calories icon/circle, sage→
  /// nutrition icon/circle. Text foregrounds resolve through the existing
  /// [herReadableForeground] guard; icon glyphs reuse the same
  /// [herContrastRatio] primitive with the WCAG non-text 3:1 threshold.
  ///
  /// No theme names are read here: the same derivation serves every current
  /// and future HER theme, light or dark.
  factory HerModernAccents.fromPalette(ThemePalette palette) {
    Map<String, String> authored(String key) {
      final raw = palette.modernAccents[key];
      if (raw == null) return const {};
      return raw;
    }

    Color? hex(Map<String, String> map, String field) {
      final value = map[field];
      if (value == null) return null;
      final text = value.trim().replaceFirst('#', '');
      if (!RegExp(r'^[0-9a-fA-F]{6}$').hasMatch(text)) return null;
      return Color(int.parse('FF$text', radix: 16));
    }

    // A fallback accent must read as a color identity on the app surface.
    // Some palettes store pale washes in their circle slots, so a
    // near-surface candidate is deepened toward the palette ink until it
    // reaches a minimum separation. Authored values stay verbatim.
    Color ensureAccentSeparation(Color accent) {
      var current = accent;
      for (var i = 0; i < 6; i++) {
        if (herContrastRatio(current, palette.surface) >= 1.7) break;
        current =
            Color.lerp(current, palette.textPrimary, .30) ?? current;
      }
      return current;
    }

    // Approved badge recipe: a STRONG saturated semantic circle with a WHITE
    // icon. A fallback circle that is too light is darkened within its own
    // color family (lightness steps, hue preserved) until white reaches 3:1.
    // Glyphs never silently collapse to burgundy; authored circles and glyphs
    // stay verbatim (theme-configurable per requirement).
    Color ensureWhiteReadableCircle(Color seed) {
      const white = Color(0xFFFFFFFF);
      var circle = seed;
      for (var i = 0; i < 12; i++) {
        if (herContrastRatio(white, circle) >= 3.0) break;
        final hsl = HSLColor.fromColor(circle);
        circle = hsl
            .withLightness((hsl.lightness - .08).clamp(0.0, 1.0))
            .toColor();
      }
      return circle;
    }

    // Glyph for an icon circle: authored wins when it already reaches
    // non-text contrast, otherwise white (fallback circles are pre-darkened
    // so white reads), otherwise the best available as a last resort.
    Color bestGlyph(Color circle, Color? authored) {
      if (authored != null && herContrastRatio(authored, circle) >= 3.0) {
        return authored;
      }
      const white = Color(0xFFFFFFFF);
      if (herContrastRatio(white, circle) >= 3.0) return white;
      final ink = palette.textPrimary;
      return herContrastRatio(ink, circle) >=
              herContrastRatio(white, circle)
          ? ink
          : white;
    }

    HerModernAccent resolve({
      required String key,
      Color? saturatedGlyph,
      Color? washCircle,
      required Color fallbackAccent,
    }) {
      final own = authored(key);
      final rawAccent =
          hex(own, HerModernAccentFields.accentColor) ??
          saturatedGlyph ??
          washCircle ??
          fallbackAccent;
      // Prefer the saturated micro-accent (icon glyph color) over the pale
      // circle wash: several palettes store near-white washes in the circle
      // slots, which must never become the family identity.
      final accent = hex(own, HerModernAccentFields.accentColor) != null
          ? rawAccent
          : ensureAccentSeparation(rawAccent);
      // The tinted card surface always carries the family hue: a surface mix
      // of the resolved accent. This keeps rose/lavender/mint/blue/coral/
      // sage distinguishable even on palettes whose section washes are all
      // near-identical pinks. Dark palettes yield dark tints (never light).
      final subtle =
          hex(own, HerModernAccentFields.subtleBackground) ??
          (Color.lerp(palette.surface, accent, .14) ?? palette.surface);
      // Each family owns its foreground: authored wins when readable,
      // otherwise the palette's own ink is resolved — never white/black.
      final foreground = herReadableForeground(
        surface: subtle,
        configured: hex(own, HerModernAccentFields.foreground),
        fallback: palette.textPrimary,
      );
      // Saturated circle so badges read as the family color (Style A + B).
      // Authored circles stay verbatim; fallback seeds are darkened within
      // their own family until the white glyph reads.
      final authoredBg = hex(own, HerModernAccentFields.iconBackground);
      final iconBg = authoredBg ?? ensureWhiteReadableCircle(accent);
      final iconFg = bestGlyph(
        iconBg,
        hex(own, HerModernAccentFields.iconForeground),
      );
      return HerModernAccent(
        accentColor: accent,
        subtleBackground: subtle,
        foreground: foreground,
        iconBackground: iconBg,
        iconForeground: iconFg,
        progressTrack:
            hex(own, HerModernAccentFields.progressTrack) ??
            (Color.lerp(subtle, accent, .38) ?? subtle),
        progressFill:
            hex(own, HerModernAccentFields.progressFill) ?? accent,
      );
    }

    return HerModernAccents(
      rose: resolve(
        key: HerModernAccentId.rose.key,
        saturatedGlyph: null,
        washCircle: null,
        fallbackAccent: palette.accent ?? palette.primary,
      ),
      lavender: resolve(
        key: HerModernAccentId.lavender.key,
        saturatedGlyph: palette.fitnessStepsIconColor,
        washCircle: palette.fitnessStepsCircleColor,
        fallbackAccent: palette.primary,
      ),
      mint: resolve(
        key: HerModernAccentId.mint.key,
        saturatedGlyph: palette.fitnessWorkoutIconColor,
        washCircle: palette.fitnessWorkoutCircleColor,
        fallbackAccent: palette.primaryDark,
      ),
      softBlue: resolve(
        key: HerModernAccentId.softBlue.key,
        saturatedGlyph: null,
        washCircle: null,
        fallbackAccent: palette.journeyWaterFillColor,
      ),
      coral: resolve(
        key: HerModernAccentId.coral.key,
        saturatedGlyph: palette.fitnessCaloriesIconColor,
        washCircle: palette.fitnessCaloriesCircleColor,
        fallbackAccent: palette.primary,
      ),
      sage: resolve(
        key: HerModernAccentId.sage.key,
        saturatedGlyph: palette.fitnessNutritionIconColor,
        washCircle: palette.fitnessNutritionCircleColor,
        fallbackAccent: palette.primary,
      ),
    );
  }

  static HerModernAccents lerp(HerModernAccents a, HerModernAccents b, double t) =>
      HerModernAccents(
        rose: HerModernAccent.lerp(a.rose, b.rose, t),
        lavender: HerModernAccent.lerp(a.lavender, b.lavender, t),
        mint: HerModernAccent.lerp(a.mint, b.mint, t),
        softBlue: HerModernAccent.lerp(a.softBlue, b.softBlue, t),
        coral: HerModernAccent.lerp(a.coral, b.coral, t),
        sage: HerModernAccent.lerp(a.sage, b.sage, t),
      );
}

/// One coherent accessor for shared HER components. Feature screens read
/// accents from here — never from hardcoded colors.
extension HerModernAccentsOnTheme on HerThemeData {
  HerModernAccents get modernAccents => HerModernAccents.fromPalette(palette);
}
