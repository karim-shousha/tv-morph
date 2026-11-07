import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import '../theme/her_typography.dart';
export '../theme/her_typography.dart';
import 'theme_backdrop.dart';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_decorations.dart';
import '../theme/her_modern_accents.dart';
import 'her_icon_identity.dart';
import '../theme/her_theme_data.dart';
import '../theme/theme_palette.dart';

/// Icon purposes shared across pages. Authored modern families own their
/// symbol/surface pairs; publications without them retain the legacy recipe.
enum HerIconKind {
  rose,
  emotional,
  wellness,
  warm,
  knowledge,
  neutral,
  olive,
  burgundy,
}

/// HER Modern UI 2.0: central semantic accent mapping for icon kinds.
///
/// Every functional badge resolves ONE of the six theme-owned accent
/// families (all Studio-editable via `modernAccents`, all fallback-safe on
/// legacy themes). `neutral` intentionally maps to null: quiet/subtle icons
/// keep the legacy calm treatment instead of a saturated circle.
///
/// Meaning: rose/burgundy → Rose · emotional/warm → Coral ·
/// wellness → Mint · knowledge → Soft Blue · olive → Sage.
HerModernAccentId? herModernAccentOfKind(HerIconKind kind) => switch (kind) {
  HerIconKind.rose || HerIconKind.burgundy => HerModernAccentId.rose,
  HerIconKind.emotional || HerIconKind.warm => HerModernAccentId.coral,
  HerIconKind.wellness => HerModernAccentId.mint,
  HerIconKind.knowledge => HerModernAccentId.softBlue,
  HerIconKind.olive => HerModernAccentId.sage,
  HerIconKind.neutral => null,
};

/// Layout is semantic in the HER design system: a large action, a compact
/// metric and a horizontal banner are distinct visual components, not three
/// ad-hoc colour decisions made by each screen.
enum HerCardStyle { standard, feature, metric, banner }

/// Phase 0: explicit semantic tone family.
///
/// Replaces `tone == AppColors.*` / `color == AppColors.*` equality branches:
/// meaning travels as this enum (chosen by the feature), never inferred from
/// a rendered [Color]. Central mapping lives in [herToneFamilyOfKind] and
/// [herKindOfToneFamily]; feature call sites adopt them during migration
/// (backlog in the foundation report — no caller is rewritten in Phase 0).
enum HerToneFamily { rose, peach, mauve, sage, sky, blush }

/// Maps the layout meaning of a card to one of the published Theme Studio
/// layers.  This mapping is intentionally independent of feature/icon colour:
/// every screen uses the same material system, while features only choose the
/// layout they need.
///
/// Phase 1: DEPRECATED for new code — assign [HERCardRole] explicitly instead.
/// Kept (working) for unmigrated callers; deleted in Phase 3.
@Deprecated(
  'Assign HERCardRole explicitly via HERCard(role:); '
  'width-based mapping is removed in Phase 3.',
)
String herCardThemeRole(
  HerCardStyle style, {
  double? availableWidth,
  String? explicitRole,
}) {
  if (explicitRole != null) return explicitRole;
  // Small adjacent tiles use `surface`; full-width rows use
  // `secondaryCard`; banners and large sections use `section`.
  final isWide = (availableWidth ?? 0) >= 280;
  return switch (style) {
    HerCardStyle.metric => 'surface',
    HerCardStyle.banner => 'section',
    HerCardStyle.feature => isWide ? 'section' : 'surface',
    HerCardStyle.standard => isWide ? 'secondaryCard' : 'surface',
  };
}

/// A page-level semantic policy for icon families.  Feature code chooses the
/// meaning of an icon; this scope decides which approved families that page is
/// allowed to render.  It prevents a stray `warm` icon from reintroducing
/// olive into Fitness, or a default `rose` icon from reintroducing pink into
/// Faith.
enum HerIconPalettePolicy { standard, fitness, faith, cycle, support }

/// DEPRECATED (Phase 0): no renderer reads `isActive` — wrapping a page
/// changes nothing. The explicit recipe
/// (`color: herJourneyCardColorOf(theme, kind)` + `HERCard(role: journey)`)
/// is the supported path (worship/library/nudges grids). Providers stay
/// harmless until removed: learning (x3), prayer_dashboard, tasbih_challenge,
/// period_tracker.
@Deprecated(
  'HerJourneyCardScope.isActive is never read. Use the explicit journey '
  'recipe instead; removal in Phase 3.',
)
class HerJourneyCardScope extends InheritedWidget {
  const HerJourneyCardScope({super.key, required super.child});

  static bool isActive(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<HerJourneyCardScope>() != null;

  @override
  bool updateShouldNotify(HerJourneyCardScope oldWidget) => false;
}

/// Fitness owns a small, reusable surface system rather than page-by-page
/// colours. Its three activity families stay independently configurable in
/// Theme Studio: movement is lavender, calories are pink, and calm/training
/// activity is cyan by default.
class HerFitnessCardScope extends InheritedWidget {
  const HerFitnessCardScope({super.key, required super.child});

  static bool isActive(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<HerFitnessCardScope>() != null;

  @override
  bool updateShouldNotify(HerFitnessCardScope oldWidget) => false;
}

/// Applies the lively, multi-colour icon treatment used in Fitness to one
/// named feature only.  It is intentionally opt-in so the rest of HER keeps
/// its calm pink icon language.
class HerAccentIconScope extends InheritedWidget {
  const HerAccentIconScope({super.key, required super.child});

  static bool isActive(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<HerAccentIconScope>() != null;

  @override
  bool updateShouldNotify(HerAccentIconScope oldWidget) => false;
}

/// Accent assigned to each Fitness content family. These values are direct
/// Theme Studio controls, not the global pink card layer.
/// Olive is the dedicated Nutrition identity (no caller used it before, so
/// rerouting it changes nothing outside Nutrition).
Color herFitnessAccentOf(HerThemeData theme, HerIconKind kind) {
  if (theme.palette.modernAccents.isNotEmpty) {
    return switch (kind) {
      HerIconKind.knowledge ||
      HerIconKind.neutral => theme.modernAccents.lavender.accentColor,
      HerIconKind.olive => theme.modernAccents.sage.accentColor,
      HerIconKind.wellness => theme.modernAccents.mint.accentColor,
      _ => theme.modernAccents.coral.accentColor,
    };
  }
  final palette = theme.palette;
  return switch (kind) {
    HerIconKind.knowledge ||
    HerIconKind.neutral => palette.fitnessStepsCircleColor ?? palette.primary,
    HerIconKind.olive => palette.fitnessNutritionCircleColor ?? palette.primary,
    HerIconKind.wellness =>
      palette.fitnessWorkoutCircleColor ?? palette.primaryDark,
    _ => palette.fitnessCaloriesCircleColor ?? palette.primary,
  };
}

/// The Theme Studio exposes the circular surface and the glyph separately.
/// Keep that distinction here rather than falling back to a single accent:
/// light themes frequently need a darker glyph over a soft, pale circle.
Color herFitnessGlyphOf(
  HerThemeData theme,
  HerIconKind kind, {
  required Color background,
}) {
  if (theme.palette.modernAccents.isNotEmpty) {
    return herFitnessAccentOf(theme, kind);
  }
  final palette = theme.palette;
  final (candidate, configuredOpacity) = switch (kind) {
    HerIconKind.knowledge || HerIconKind.neutral => (
      palette.fitnessStepsIconColor ??
          palette.fitnessStepsCircleColor ??
          palette.primary,
      palette.fitnessStepsIconOpacity,
    ),
    HerIconKind.olive => (
      palette.fitnessNutritionIconColor ??
          palette.fitnessNutritionCircleColor ??
          palette.primary,
      palette.fitnessNutritionIconOpacity,
    ),
    HerIconKind.wellness => (
      palette.fitnessWorkoutIconColor ??
          palette.fitnessWorkoutCircleColor ??
          palette.primaryDark,
      palette.fitnessWorkoutIconOpacity,
    ),
    _ => (
      palette.fitnessCaloriesIconColor ??
          palette.fitnessCaloriesCircleColor ??
          palette.primary,
      palette.fitnessCaloriesIconOpacity,
    ),
  };
  return candidate.withValues(alpha: configuredOpacity);
}

double herFitnessCircleOpacityOf(HerThemeData theme, HerIconKind kind) {
  final palette = theme.palette;
  return switch (kind) {
    HerIconKind.knowledge ||
    HerIconKind.neutral => palette.fitnessStepsCircleOpacity,
    HerIconKind.olive => palette.fitnessNutritionCircleOpacity,
    HerIconKind.wellness => palette.fitnessWorkoutCircleOpacity,
    _ => palette.fitnessCaloriesCircleOpacity,
  };
}

/// Soft, colourful Fitness-card recipe. Unlike the app-wide structural layers,
/// this intentionally carries the semantic accent selected in Theme Studio.
/// It keeps the reference's lively ring-card feeling without overpowering text.
LinearGradient herCardGradientOf(
  HerThemeData theme,
  HerIconKind kind,
  HerCardStyle style,
) {
  if (theme.palette.modernAccents.isNotEmpty) {
    return LinearGradient(
      colors: [theme.surfaces.surface, theme.surfaces.surface],
    );
  }
  final accent = herFitnessAccentOf(theme, kind);
  final strength = switch (style) {
    HerCardStyle.feature => .26,
    HerCardStyle.banner => .21,
    HerCardStyle.metric => .17,
    HerCardStyle.standard => .15,
  };
  final surface = theme.surfaces.surface;
  final colors = [
    Color.alphaBlend(accent.withValues(alpha: strength), surface),
    Color.alphaBlend(accent.withValues(alpha: strength * .28), surface),
  ];
  return LinearGradient(
    begin: style == HerCardStyle.banner
        ? Alignment.centerRight
        : Alignment.topCenter,
    end: style == HerCardStyle.banner
        ? Alignment.centerLeft
        : Alignment.bottomCenter,
    colors: colors,
  );
}

/// Visible Fitness-card frame, matched to the same independently controlled
/// accent as its fill.
Color herFitnessCardBorderOf(HerThemeData theme, HerIconKind kind) =>
    herFitnessAccentOf(theme, kind).withValues(alpha: .48);

/// Phase 1: semantic accent selector returning the TOKEN (not a raw color).
/// Same kind routing as [herFitnessAccentOf]: knowledge/neutral → steps,
/// olive → nutrition (dedicated; never shared), wellness → workout,
/// everything else → calories.
HerAccent herFitnessAccentRef(HerThemeData theme, HerIconKind kind) {
  final a = theme.semanticAccents.fitness;
  return switch (kind) {
    HerIconKind.knowledge || HerIconKind.neutral => a.steps,
    HerIconKind.olive => a.nutrition,
    HerIconKind.wellness => a.workout,
    _ => a.calories,
  };
}

/// Phase 1: builds an explicit-role card decoration.
///
/// - STRUCTURE (gradient layers, border, shadow, radius) always comes from
///   [HerCardRoles].
/// - [accent] tints the role gradient with the accent wash (fitness recipe:
///   stop 1 at [HerAccent.washOpacity], stop 2 at ×0.28; frame at .48).
/// - Explicit [color]/[gradient] are honored VERBATIM for the background only
///   (Phase-1 transitional for tinted callers; border/shadow/radius stay role).
///   Tint ownership moves into accents in Phase 2.
///
/// Pixel-parity note: tinted/accent cards keep the legacy tinted-card shadow
/// recipe (effective border @ .14, blur 18, offset (0,7)) so migrated screens
/// render exactly as before. Unifying it into the style is Phase-2 work.
/// The widget counterpart of a role decoration: filters require a widget,
/// so decoration-only callers opt in here without changing legacy geometry.
Widget herRoleBackdrop(
  HerThemeData theme,
  HERCardRole role, {
  required Widget child,
  double radius = 22,
}) => ThemeBackdrop(
  blur: theme.cardRoles[role].backdropBlur ?? 0,
  radius: radius,
  child: child,
);

BoxDecoration herRoleCardDecoration(
  HerThemeData theme,
  HERCardRole role, {
  HerAccent? accent,
  double? accentStrength,
  bool elevated = true,
  Color? color,
  Gradient? gradient,
  Color? borderColor,
  double radius = 22,
}) {
  if (theme.palette.name.startsWith('Morph'))
    return PhoneDesignTokens.palette(
      theme.palette.background.computeLuminance() < .4,
    ).cardDecoration(elevated: elevated);

  final style = theme.cardRoles[role];
  final lighterStart =
      style.gradientStart.computeLuminance() >=
      style.gradientEnd.computeLuminance();
  final gradientBegin = role == HERCardRole.hero
      ? (lighterStart ? Alignment.centerLeft : Alignment.centerRight)
      : Alignment.topCenter;
  final gradientEnd = role == HERCardRole.hero
      ? (lighterStart ? Alignment.centerRight : Alignment.centerLeft)
      : Alignment.bottomCenter;
  final roleBorder =
      borderColor ?? style.borderColor.withValues(alpha: style.borderOpacity);
  BoxShadow tintedShadow(Color frame) => BoxShadow(
    color: frame.withValues(alpha: .14),
    blurRadius: 18,
    offset: const Offset(0, 7),
  );
  final base = BoxDecoration(
    gradient: role == HERCardRole.hero
        ? theme.heroCardGradient
        : LinearGradient(
            begin: themeGradientBegin(style.gradientDirection, gradientBegin),
            end: themeGradientEnd(style.gradientDirection, gradientEnd),
            colors: [
              style.gradientStart.withValues(alpha: style.gradientStartOpacity),
              style.gradientEnd.withValues(alpha: style.gradientEndOpacity),
            ],
          ),
    borderRadius: BorderRadius.circular(radius),
    border: style.borderWidth <= 0
        ? null
        : Border.all(color: roleBorder, width: style.borderWidth),
    boxShadow: !elevated || style.shadowOpacity <= 0
        ? null
        : [
            BoxShadow(
              color: style.shadowColor.withValues(alpha: style.shadowOpacity),
              blurRadius: style.shadowBlur,
              offset: style.shadowOffset,
            ),
          ],
  );
  if (accent != null && theme.palette.modernAccents.isEmpty) {
    // Rule 1 (Phase 2 prep): the accent supplies COLORS — the tint mix still
    // uses transitional `washOpacity`, but the FAMILY `surfaceOpacity` stays
    // authoritative for the final composite alpha.accents never own card
    // transparency; Phase 3 removes the mix factor entirely.
    final w = accentStrength ?? accent.washOpacity;
    final o = style.surfaceOpacity;
    final start = Color.alphaBlend(
      accent.color.withValues(alpha: w),
      style.gradientStart,
    ).withValues(alpha: o);
    final end = Color.alphaBlend(
      accent.color.withValues(alpha: w * .28),
      style.gradientEnd,
    ).withValues(alpha: o);
    final frame = accent.color.withValues(alpha: .48);
    // NOTE: explicit construction (not copyWith) so elevated:false truly
    // clears shadows — copyWith(boxShadow: null) would keep the old ones.
    return BoxDecoration(
      gradient: LinearGradient(
        begin: role == HERCardRole.hero
            ? gradientBegin
            : themeGradientBegin(style.gradientDirection, gradientBegin),
        end: role == HERCardRole.hero
            ? gradientEnd
            : themeGradientEnd(style.gradientDirection, gradientEnd),
        colors: [start, end],
      ),
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: frame),
      boxShadow: !elevated ? null : [tintedShadow(frame)],
    );
  }
  if (gradient != null) {
    return BoxDecoration(
      // Fully-opaque roles keep the caller's gradient instance untouched:
      // withOpacity(1.0) would allocate an identical copy every build.
      gradient: style.surfaceOpacity >= 1
          ? gradient
          : gradient.withOpacity(style.surfaceOpacity),
      borderRadius: BorderRadius.circular(radius),
      border: base.border,
      boxShadow: !elevated ? null : [tintedShadow(roleBorder)],
    );
  }
  if (color != null) {
    // ROOT RULE (opacity normalization): the FAMILY owns the final surface
    // alpha. Incoming tints carry hue only — any local/pre-blended alpha is
    // replaced by the role surfaceOpacity exactly once, so two cards with
    // the same role can never render different transparencies (no
    // double-alpha from coloredCard/sectionOpacity + family opacity).
    return BoxDecoration(
      color: color.withValues(alpha: style.surfaceOpacity),
      borderRadius: BorderRadius.circular(radius),
      border: base.border,
      boxShadow: !elevated ? null : [tintedShadow(roleBorder)],
    );
  }
  return base;
}

/// Phase 2 prep: slide/carousel surface reader. Slides are paged content —
/// never Wide cards, never heroes. Per-slide color personality comes from
/// semantic accent colors in Phase 2; structure/opacity stay family-owned.
BoxDecoration herSlideDecoration(
  HerThemeData theme, {
  double radius = 24,
  bool elevated = true,
}) => theme.slides.decoration(radius: radius, elevated: elevated);

class HerIconPaletteScope extends InheritedWidget {
  const HerIconPaletteScope({
    super.key,
    required this.policy,
    required super.child,
  });

  final HerIconPalettePolicy policy;

  static HerIconKind resolve(BuildContext context, HerIconKind kind) {
    final policy = context
        .dependOnInheritedWidgetOfExactType<HerIconPaletteScope>()
        ?.policy;
    return switch (policy) {
      _ => kind,
    };
  }

  @override
  bool updateShouldNotify(HerIconPaletteScope oldWidget) =>
      policy != oldWidget.policy;
}

/// Shared glyph colour for ordinary icons.
///
/// Semantic icon colours are shared by every page: rose for emotional,
/// sage for wellbeing, amber for energy and violet for learning. Their source
/// colours are the central theme accent families, never page-local hexes.
Color herIconGlyphOf(HerThemeData theme, HerIconKind kind) {
  // Authored family colours win for functional symbols. The global Studio
  // icon colour remains the legacy/utility fallback, not a universal override.
  final id = herModernAccentOfKind(kind);
  final Color base = theme.palette.modernAccents.isNotEmpty && id != null
      ? theme.modernAccents[id].accentColor
      : theme.iconStyle.glyphColor;
  return base.withValues(alpha: theme.iconStyle.glyphOpacity);
}

/// Background for every icon circle.
///
/// This reads [HerIconStyle], rather than the legacy `iconCard` compatibility
/// control. Some older screens use this helper directly (for example profile
/// stats and progress indicators), so it must exactly match [HERIconContainer].
Color herIconWashOf(HerThemeData theme, HerIconKind kind) {
  final style = theme.iconStyle;
  final id = herModernAccentOfKind(kind);
  final surface = theme.palette.modernAccents.isNotEmpty && id != null
      ? theme.modernAccents[id].subtleBackground
      : style.containerColor;
  return surface.withValues(alpha: style.containerOpacity);
}

/// Soft semantic tint for a [HerIconKind]. Used by tinted HER cards so the
/// whole family shares one mapping: rose→emotional wash, wellness→wellness
/// wash, warm→energy wash, knowledge→learning wash, neutral→card surface.
///
/// Rose is never routed through the cool neutral slot: people-facing and
/// beauty selections must retain the warm blush family in the base theme.
Color herKindTint(HerIconKind kind) =>
    herKindTintOf(HerThemeEngine.current, kind);

Color herKindTintOf(HerThemeData theme, HerIconKind kind) => switch (kind) {
  HerIconKind.rose => theme.washes.emotional,
  HerIconKind.emotional => theme.washes.emotional,
  HerIconKind.wellness => theme.washes.wellness,
  HerIconKind.warm => theme.washes.energy,
  HerIconKind.olive => theme.palette.iconCreamBackgroundColor,
  HerIconKind.knowledge => theme.washes.learning,
  HerIconKind.neutral => theme.cards.surface,
  HerIconKind.burgundy => theme.washes.neutral,
};

/// Exact opaque tile-family mapping used by «رحلتك اليوم». Home and feature
/// grids paint these Modern UI 2.0 semantic accent surfaces directly
/// (Style A: softly colored cards); the journey role owns the final opacity.
Color herJourneyTileColorOf(HerThemeData theme, HerIconKind kind) {
  // Card surfaces belong to the card recipe; semantic families color symbols.
  if (theme.palette.modernAccents.isNotEmpty) {
    return theme.cardRoles[HERCardRole.journey].gradientStart;
  }
  final accents = theme.modernAccents;
  return switch (kind) {
    HerIconKind.rose || HerIconKind.burgundy => accents.rose.subtleBackground,
    HerIconKind.emotional || HerIconKind.warm => accents.coral.subtleBackground,
    HerIconKind.wellness => accents.mint.subtleBackground,
    HerIconKind.knowledge ||
    HerIconKind.neutral => accents.softBlue.subtleBackground,
    HerIconKind.olive => accents.sage.subtleBackground,
  };
}

/// The same family under the current CMS-controlled card opacity. Profile and
/// long-form content use this calmer variation; grids use [herJourneyTileColorOf].
Color herJourneyCardColorOf(HerThemeData theme, HerIconKind kind) =>
    theme.palette.coloredCard(herJourneyTileColorOf(theme, kind));

/// Navigation symbols have their own editable recipe, separate from labels.
Color herNavigationGlyphOf(HerThemeData theme, {required bool selected}) =>
    theme.palette.componentStyles['floatingBar']?.glyphColor ??
    (selected ? theme.navigation.active : theme.navigation.inactive);

class HERNavigationIcon extends StatelessWidget {
  const HERNavigationIcon(
    this.icon, {
    super.key,
    required this.selected,
    this.locked = false,
  });
  final IconData icon;
  final bool selected;
  final bool locked;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    final style = theme.palette.componentStyles['floatingBar'];
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: selected
            ? style?.glyphColor != null
                  ? style!.gradientStart
                  : theme.navigation.active.withValues(alpha: .18)
            : Colors.transparent,
      ),
      child: Icon(
        icon,
        size: selected ? 25 : 23,
        color: herNavigationGlyphOf(
          theme,
          selected: selected,
        ).withValues(alpha: locked ? .55 : 1),
      ),
    );
  }
}

/// Phase 0: canonical kind ↔ tone-family mapping.
///
/// `HerIconKind` is icon semantics; [HerToneFamily] is surface semantics.
/// Features must choose one side explicitly and convert here — never by
/// comparing rendered colors (`tone == AppColors.*`). Migration backlog
/// (untouched Phase-0 callers): learning `_sectionTitle`, journey_dashboard
/// tone branches, scenarios `_blockTitle`/`_categoryTint`, dhikr/dua badges,
/// cycle reminder/period-tracker/specialist/chat branches, todo/expense.
HerToneFamily herToneFamilyOfKind(HerIconKind kind) => switch (kind) {
  HerIconKind.rose ||
  HerIconKind.emotional ||
  HerIconKind.burgundy => HerToneFamily.rose,
  HerIconKind.warm => HerToneFamily.peach,
  HerIconKind.wellness || HerIconKind.olive => HerToneFamily.mauve,
  HerIconKind.knowledge => HerToneFamily.sky,
  HerIconKind.neutral => HerToneFamily.blush,
};

/// Reverse mapping for families that own exactly one kind. Rose/peach/mauve
/// have several kinds by design — those must be chosen explicitly, never
/// guessed from a color. Sage owns no single kind and resolves to null.
HerIconKind? herKindOfToneFamily(HerToneFamily family) => switch (family) {
  HerToneFamily.sky => HerIconKind.knowledge,
  HerToneFamily.blush => HerIconKind.neutral,
  HerToneFamily.rose ||
  HerToneFamily.peach ||
  HerToneFamily.mauve ||
  HerToneFamily.sage => null,
};

/// Default HER card — THE neutral card language (رد هير recipe).
///
/// No explicit [color] → the shared translucent glass material used by the
/// Games grid: the page artwork/wash participates behind a soft blurred
/// surface, white frame, and soft shadow. Its gradient, border, opacity, and
/// shadow continue to come from the Theme Studio's `surface` /
/// `secondaryCard` controls; this is intentionally not a profile-only look.
/// Resolve text against every visible gradient stop, including surface alpha.
/// Nested badges/panels must resolve against their own decoration instead.
Color herForegroundOnDecoration(
  HerThemeData theme,
  BoxDecoration decoration, {
  Color? configured,
}) {
  final surfaces =
      (decoration.gradient?.colors ??
              [decoration.color ?? theme.surfaces.surface])
          .map((color) => Color.alphaBlend(color, theme.surfaces.background));
  final candidates = [
    ?configured,
    theme.bodyPrimary,
    theme.heroTitle,
    theme.buttonStyles.primary.foreground,
    theme.text.secondary,
  ];
  Color best = candidates.first;
  double bestRatio = 0;
  for (final candidate in candidates) {
    final minimum = surfaces
        .map((surface) => herContrastRatio(candidate, surface))
        .reduce((a, b) => a < b ? a : b);
    if (minimum >= 4.5) return candidate;
    if (minimum > bestRatio) {
      best = candidate;
      bestRatio = minimum;
    }
  }
  return best;
}

Color herHeroForeground(HerThemeData theme, {bool subtitle = false}) =>
    subtitle ? theme.heroSubtitle : theme.heroTitle;

/// Only the home daily actions and Faith shortcuts opt into this treatment.
/// Has its own editable recipe; navigation and other cards remain independent.
LinearGradient herShortcutGradient(HerThemeData theme) =>
    AppDecorations.componentCardFor(theme, 'cardShortcut').gradient!
        as LinearGradient;

Color herShortcutForeground(HerThemeData theme, {bool subtitle = false}) {
  if (!theme.palette.componentStyles.containsKey('cardShortcut')) {
    return subtitle ? theme.cardSubtitle : theme.cardTitle;
  }
  return herForegroundOnDecoration(
    theme,
    AppDecorations.componentCardFor(theme, 'cardShortcut'),
    configured: subtitle
        ? theme.cardSubtitle
        : theme.palette.componentStyle('cardShortcut').glyphColor,
  );
}

class HERShortcutCard extends StatelessWidget {
  const HERShortcutCard({
    super.key,
    required this.child,
    required this.padding,
    this.radius = 22,
    this.onTap,
  });
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    if (!theme.palette.componentStyles.containsKey('cardShortcut')) {
      return HERCard(
        role: HERCardRole.wide,
        radius: radius,
        padding: padding,
        onTap: onTap,
        child: child,
      );
    }
    final decoration = AppDecorations.componentCardFor(
      theme,
      'cardShortcut',
      radius: radius,
    );
    final card = Container(
      decoration: decoration,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(radius),
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
    return onTap == null ? card : _HERCardPressFeedback(child: card);
  }
}

/// Immediate tactile feedback without changing tap or scroll recognition.
class _HERCardPressFeedback extends StatefulWidget {
  const _HERCardPressFeedback({required this.child});
  final Widget child;

  @override
  State<_HERCardPressFeedback> createState() => _HERCardPressFeedbackState();
}

class _HERCardPressFeedbackState extends State<_HERCardPressFeedback> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (_pressed != value) setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final reducedMotion = MediaQuery.disableAnimationsOf(context);
    return Listener(
      onPointerDown: (_) => _setPressed(true),
      onPointerUp: (_) => _setPressed(false),
      onPointerCancel: (_) => _setPressed(false),
      onPointerMove: (_) => _setPressed(false),
      child: AnimatedScale(
        scale: _pressed && !reducedMotion ? .96 : 1,
        duration: reducedMotion
            ? Duration.zero
            : Duration(milliseconds: _pressed ? 110 : 180),
        curve: Curves.easeOutCubic,
        child: widget.child,
      ),
    );
  }
}

class HERCard extends StatelessWidget {
  const HERCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(14),
    this.radius = 22,
    this.color,
    this.gradient,
    this.borderColor,
    this.themeRole,
    this.journeyKind,
    this.style = HerCardStyle.standard,
    this.role,
    this.accent,
    this.accentStrength,
    this.elevated = true,
    this.clipBehavior = Clip.none,
    this.onTap,
    this.animationDuration,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final Color? color;
  final Gradient? gradient;
  final Color? borderColor;

  /// Exact Theme Studio card layer for an exceptional layout. Normal cards
  /// are classified automatically from [style] and rendered width.
  final String? themeRole;

  /// DEPRECATED (Phase 0): this prop is accepted but never read by
  /// [HERCard.build] — decoration uses only role/accent/color/gradient.
  /// Passing it changes nothing (8 legacy call sites render the neutral
  /// fallback today). Use the explicit journey recipe instead:
  /// `HERCard(role: HERCardRole.journey, color: herJourneyCardColorOf(theme,
  /// kind))`. Scheduled for removal once the sites below migrate:
  /// cycle_advice_card, cycle_reminder_card (x2), quick_checkin,
  /// prayer_dashboard (x2), learning _trackCard, period_tracker,
  /// HERStatCard.
  @Deprecated(
    'journeyKind is never read by HERCard.build. Pass an explicit '
    'HERCard(role: journey, color:) instead; removal in Phase 3.',
  )
  final HerIconKind? journeyKind;
  final HerCardStyle style;

  /// Phase 1: explicit canonical role. When set, bg/border/shadow/radius come
  /// from `herTheme.cardRoles[role]`; [accent] tints via the accent token.
  /// When null, the legacy width-based mapping applies (unchanged).
  final HERCardRole? role;

  /// Phase 1: semantic accent tint (structure still comes from [role]).
  final HerAccent? accent;

  /// Phase 2 (B0): legacy recipe tint-mix strength for accent cards migrated
  /// from `herCardGradientOf` (feature .26 / banner .21 / metric .17 /
  /// standard .15). Defaults to the accent's own wash opacity. TRANSITIONAL:
  /// Phase 3 accents carry full gradient pairs and this goes away. Family
  /// surfaceOpacity always governs the final transparency (Rule 1).
  final double? accentStrength;

  /// Phase 2 (B0): shadow suppression for shadowless legacy surfaces.
  /// Default true preserves every existing caller.
  final bool elevated;

  /// Phase 1: clipping for art-backed cards (heroes). Default none preserves
  /// all existing callers.
  final Clip clipBehavior;
  final VoidCallback? onTap;

  /// Opt-in transition for theme-driven surfaces. Kept null by default so
  /// ordinary card interactions do not introduce unnecessary motion.
  final Duration? animationDuration;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final theme = context.herTheme;
        final usesFitnessAccent =
            HerFitnessCardScope.isActive(context) &&
            (gradient != null || color != null || borderColor != null);
        final componentRole =
            // ignore: deprecated_member_use
            herCardThemeRole(
              style,
              availableWidth: constraints.maxWidth,
              explicitRole: themeRole,
            );
        final usesSharedGlass =
            role == null &&
            !usesFitnessAccent &&
            (componentRole == 'surface' || componentRole == 'secondaryCard');
        // Explicit blur belongs to the same semantic role as the decoration.
        // Missing tokens retain the old neutral-card glass behavior exactly.
        final configuredBlur = role != null
            ? theme.cardRoles[role!].backdropBlur
            : theme.palette.componentStyle(componentRole).backdropBlur;
        final backdropBlur = configuredBlur ?? (usesSharedGlass ? 14.0 : 0.0);
        final decoration = role != null
            ? herRoleCardDecoration(
                theme,
                role!,
                accent: accent,
                accentStrength: accentStrength,
                elevated: elevated,
                color: color,
                gradient: gradient,
                borderColor: borderColor,
                radius: radius,
              )
            : usesFitnessAccent
            ? BoxDecoration(
                color: gradient == null
                    ? color?.withValues(
                        alpha: theme.palette
                            .componentStyle(componentRole)
                            .opacity,
                      )
                    : null,
                gradient: gradient?.withOpacity(
                  theme.palette.componentStyle(componentRole).opacity,
                ),
                borderRadius: BorderRadius.circular(radius),
                border: Border.all(color: borderColor ?? theme.cards.border),
                boxShadow: [
                  BoxShadow(
                    color: (borderColor ?? theme.cards.border).withValues(
                      alpha: .14,
                    ),
                    blurRadius: 18,
                    offset: const Offset(0, 7),
                  ),
                ],
              )
            : AppDecorations.componentCardFor(
                theme,
                componentRole,
                radius: radius,
              );
        Widget scopedChild = child;
        if (role == HERCardRole.hero) {
          final heroButton = theme.heroButtonStyle;
          final background = heroButton.flatBackground;
          final foreground = heroButton.foreground;
          final scopedTheme = theme.copyWith(
            buttonStyles: HerButtonStyles(
              primary: heroButton,
              secondary: heroButton,
              danger: theme.buttonStyles.danger,
            ),
          );
          final material = Theme.of(context);
          final materialButton = ElevatedButton.styleFrom(
            backgroundColor: background,
            foregroundColor: foreground,
            disabledBackgroundColor: background,
            disabledForegroundColor: foreground.withValues(alpha: .6),
            textStyle: GoogleFonts.cairo(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: foreground,
            ),
          );
          scopedChild = Theme(
            data: material.copyWith(
              extensions: [
                ...material.extensions.values.where(
                  (value) => value is! HerThemeData,
                ),
                scopedTheme,
              ],
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: materialButton,
              ),
              filledButtonTheme: FilledButtonThemeData(style: materialButton),
              outlinedButtonTheme: OutlinedButtonThemeData(
                style: materialButton,
              ),
              textButtonTheme: TextButtonThemeData(style: materialButton),
            ),
            child: child,
          );
        }
        final readableChild = DefaultTextStyle.merge(
          style: role == HERCardRole.hero
              ? TextStyle(color: theme.heroTitle)
              : herSectionSubtitleStyle(theme),
          child: scopedChild,
        );
        final card = animationDuration == null
            ? Container(
                padding: padding,
                decoration: decoration,
                child: Material(
                  type: MaterialType.transparency,
                  child: readableChild,
                ),
              )
            : AnimatedContainer(
                duration: animationDuration!,
                curve: Curves.easeOutCubic,
                padding: padding,
                decoration: decoration,
                child: Material(
                  type: MaterialType.transparency,
                  child: readableChild,
                ),
              );
        final renderedCard = backdropBlur > 0
            ? _glass(card, backdropBlur)
            : _clipped(card);
        if (onTap == null) return renderedCard;
        return _HERCardPressFeedback(
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(radius),
            child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(radius),
              child: renderedCard,
            ),
          ),
        );
      },
    );
  }

  /// Shared neutral cards deliberately use the exact glass behavior of the
  /// Games cards. The decoration itself still owns every visual token, so a
  /// Theme Studio adjustment updates this entire class of cards at once.
  Widget _glass(Widget child, double blur) => ClipRRect(
    borderRadius: BorderRadius.circular(radius),
    child: BackdropFilter(
      filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
      child: child,
    ),
  );

  Widget _clipped(Widget child) => clipBehavior == Clip.none
      ? child
      : ClipRRect(
          borderRadius: BorderRadius.circular(radius),
          clipBehavior: clipBehavior,
          child: child,
        );
}

/// Soft tinted HER card for featured content (rose/sage/peach/mauve).
class HERTintedCard extends StatelessWidget {
  const HERTintedCard({
    super.key,
    required this.child,
    this.tint,
    this.padding = const EdgeInsets.all(14),
    this.radius = 22,
    this.onTap,
  });

  final Widget child;
  final Color? tint;
  final EdgeInsetsGeometry padding;
  final double radius;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    // Phase 0: `tint` is honored for real — journey family owns
    // border/shadow/radius/opacity, the tint carries hue only (root rule).
    return HERCard(
      role: HERCardRole.journey,
      color: tint,
      padding: padding,
      radius: radius,
      onTap: onTap,
      child: child,
    );
  }
}

/// Phase 1: structural dense row. Reads `herTheme.structure.listRow` — NEVER
/// a card role. A Cards>Wide change must not move list rows. Tint is honored
/// verbatim in Phase 1 (transitional); border/shadow/radius come from the row
/// style.
class HERListRow extends StatelessWidget {
  const HERListRow({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(14),
    this.radius = 18,
    this.tint,
    this.borderColor,
    this.elevated = true,
    this.onTap,
    this.animationDuration,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final Color? tint;
  final Color? borderColor;

  /// Phase 2: shadow suppression for shadowless legacy rows (default true
  /// preserves existing callers).
  final bool elevated;
  final VoidCallback? onTap;
  final Duration? animationDuration;

  @override
  Widget build(BuildContext context) {
    final style = context.herTheme.structure.listRow;
    final base = context.herTheme.palette.name.startsWith('Morph')
        ? PhoneDesignTokens.palette(
            context.herTheme.palette.background.computeLuminance() < .4,
          ).cardDecoration(elevated: elevated)
        : style.decoration(radius: radius);
    final BoxDecoration decoration;
    if (tint == null && borderColor == null) {
      // NOTE: explicit construction (not copyWith) so elevated:false truly
      // clears shadows — copyWith(boxShadow: null) would keep them.
      decoration = !elevated
          ? BoxDecoration(
              gradient: base.gradient,
              borderRadius: BorderRadius.circular(radius),
              border: base.border,
            )
          : base;
    } else if (tint == null) {
      decoration = base.copyWith(border: Border.all(color: borderColor!));
    } else {
      // Tinted rows keep the legacy tinted shadow recipe (effective border
      // @ .14) so migrated rows render exactly as before (Phase 2 unifies).
      final frame = borderColor ?? style.borderColor;
      decoration = BoxDecoration(
        color: tint!.withValues(alpha: style.surfaceOpacity),
        borderRadius: BorderRadius.circular(radius),
        border: borderColor == null
            ? base.border
            : Border.all(color: borderColor!),
        boxShadow: !elevated
            ? null
            : [
                BoxShadow(
                  color: frame.withValues(alpha: .14),
                  blurRadius: 18,
                  offset: const Offset(0, 7),
                ),
              ],
      );
    }
    final row = animationDuration == null
        ? Container(padding: padding, decoration: decoration, child: child)
        : AnimatedContainer(
            duration: animationDuration!,
            curve: Curves.easeOutCubic,
            padding: padding,
            decoration: decoration,
            child: child,
          );
    final renderedRow = ThemeRoleBackdrop(
      role: 'listRow',
      radius: radius,
      child: row,
    );
    if (onTap == null) return renderedRow;
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(radius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: renderedRow,
      ),
    );
  }
}

/// HER icon in a soft wash container. Never burgundy-by-default:
/// general actions use rose, health uses sage, energy uses warm,
/// learning uses muted mauve, utility uses neutral.
class HERIconContainer extends StatelessWidget {
  const HERIconContainer(
    this.icon, {
    super.key,
    this.kind = HerIconKind.rose,
    this.role = 'iconCard',
    this.size = 44,
    this.iconSize = 22,
    this.rounded = false,
    this.background,
    this.glyphColor,
    this.clampSize = true,
  });

  final IconData icon;
  final HerIconKind kind;

  /// Named icon-surface role for page-specific icon groups.
  final String role;
  final double size;
  final double iconSize;
  final bool rounded;

  /// Phase 1.5 transitional explicit overrides (verbatim washes, owned via
  /// theme tokens at the call site — same pattern as HERCard tint).
  /// [background] replaces the styled container fill (no border, like the
  /// legacy tinted circles); [glyphColor] replaces the kind-mapped glyph.
  /// [clampSize] false respects the passed size exactly (default true keeps
  /// the global icon rhythm). Ownership moves into icon variants in Phase 2.
  final Color? background;
  final Color? glyphColor;
  final bool clampSize;

  /// Global icon rhythm: ordinary repeated UI icons must never overpower the
  /// content. Screens may request a smaller size, while prominent headers
  /// still get a clear (but capped) 44px circle.

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    final resolvedKind = HerIconPaletteScope.resolve(context, kind);
    final circleCap = theme.palette.iconCircleSize;
    final namedStyle =
        role != 'iconCard' && theme.palette.modernAccents.isNotEmpty
        ? theme.palette.componentStyles[role]
        : null;
    final glyphCap = theme.palette.iconGlyphSize;
    final resolvedSize = clampSize ? size.clamp(0, circleCap).toDouble() : size;
    final resolvedIconSize = clampSize
        ? iconSize.clamp(0, glyphCap).toDouble()
        : iconSize;
    final isFitnessIcon =
        HerFitnessCardScope.isActive(context) && role == 'iconCard';
    final isAccentIcon = HerAccentIconScope.isActive(context);
    final fitnessAccent = herFitnessAccentOf(theme, resolvedKind);
    final fitnessCircleOpacity = herFitnessCircleOpacityOf(theme, resolvedKind);
    final fitnessSurface = Color.alphaBlend(
      fitnessAccent.withValues(alpha: .18 * fitnessCircleOpacity),
      theme.surfaces.surface,
    );
    final fitnessGlyph = herFitnessGlyphOf(
      theme,
      resolvedKind,
      background: fitnessSurface,
    );
    // Apply the public glyph opacity once.
    final styledGlyph = glyphColor == null
        ? (namedStyle?.glyphColor?.withValues(
                alpha: theme.iconStyle.glyphOpacity,
              ) ??
              herIconGlyphOf(theme, resolvedKind))
        : glyphColor!.withValues(alpha: theme.iconStyle.glyphOpacity);
    final styledContainer = background == null
        ? namedStyle != null
              ? BoxDecoration(
                  color: namedStyle.gradientStart.withValues(
                    alpha: namedStyle.opacity,
                  ),
                  borderRadius: BorderRadius.circular(
                    rounded ? 14 : resolvedSize / 2,
                  ),
                  border: Border.all(
                    color: namedStyle.border.withValues(
                      alpha: namedStyle.borderOpacity,
                    ),
                    width: namedStyle.borderWidth,
                  ),
                )
              : herNormalIconDecoration(
                  theme,
                  kind: resolvedKind,
                  rounded: rounded,
                  size: resolvedSize,
                )
        : BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(resolvedSize / 2),
          );
    // Modern badges and Fitness consume the same authored family pairs.
    // Explicit backgrounds/foregrounds and named roles remain authoritative.
    final modernId = resolvedKind == HerIconKind.rose
        ? herIconAccentIdentity(icon) ?? herModernAccentOfKind(resolvedKind)
        : isFitnessIcon
        ? switch (resolvedKind) {
            HerIconKind.knowledge ||
            HerIconKind.neutral => HerModernAccentId.lavender,
            HerIconKind.olive => HerModernAccentId.sage,
            HerIconKind.wellness => HerModernAccentId.mint,
            _ => HerModernAccentId.coral,
          }
        : herModernAccentOfKind(resolvedKind);
    final useModernBadge =
        background == null &&
        glyphColor == null &&
        role == 'iconCard' &&
        theme.palette.modernAccents.isNotEmpty &&
        modernId != null;
    final modernFamily = useModernBadge ? theme.modernAccents[modernId] : null;
    return Container(
      width: resolvedSize,
      height: resolvedSize,
      decoration: useModernBadge
          ? BoxDecoration(
              color: modernFamily!.iconBackground.withValues(
                alpha: theme.opacity.iconBackground,
              ),
              borderRadius: BorderRadius.circular(
                rounded ? 14 : resolvedSize / 2,
              ),
            )
          : (isFitnessIcon || isAccentIcon) && background == null
          ? BoxDecoration(
              // Fitness symbols must visibly keep their own family colour.
              // Its circle and glyph are separately editable in Theme Studio.
              color: fitnessSurface,
              borderRadius: BorderRadius.circular(
                rounded ? 14 : resolvedSize / 2,
              ),
              border: Border.all(
                color: fitnessAccent.withValues(
                  alpha: .62 * fitnessCircleOpacity,
                ),
                width: 1.4,
              ),
              boxShadow: [
                BoxShadow(
                  color: fitnessAccent.withValues(
                    alpha: .14 * fitnessCircleOpacity,
                  ),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            )
          : styledContainer,
      child: Icon(
        icon,
        // Modern semantic glyph wins on modern badges; explicit [glyphColor]
        // wins (transitional); fitness recipe untouched.
        color: useModernBadge
            ? modernFamily!.iconForeground.withValues(alpha: theme.opacity.icon)
            : (isFitnessIcon || isAccentIcon) && glyphColor == null
            ? fitnessGlyph
            : styledGlyph,
        size: resolvedIconSize,
      ),
    );
  }
}

/// Phase 1: normal icon container built ONLY from [HerIconStyle].
/// Pixel-identical to the previous `iconCard`-layer rendering.
BoxDecoration herNormalIconDecoration(
  HerThemeData theme, {
  required HerIconKind kind,
  required bool rounded,
  required double size,
}) {
  final s = theme.iconStyle;
  // A muted semantic halo works over dark cards while preserving one stable
  // recipe for every icon family.  The opacity/size controls remain global.
  final bg = herIconWashOf(theme, kind);
  return BoxDecoration(
    gradient: LinearGradient(colors: [bg, bg]),
    border: s.containerBorderWidth <= 0
        ? null
        : Border.all(
            color: s.containerBorderColor.withValues(
              alpha: s.containerBorderOpacity,
            ),
            width: s.containerBorderWidth,
          ),
    borderRadius: BorderRadius.circular(rounded ? 14 : size / 2),
  );
}

/// Phase 1.5: presentation variants INSIDE one button system.
///
/// `standard` is the brand-gradient CTA. `flat` is the solid variant kept for
/// genuinely existing flat CTAs (same role tokens — flatBackground —
/// never a feature theme). Do not add variants without a shipped precedent.
enum HERButtonPresentation { standard, flat }

/// HER primary CTA: semantic primary-action gradient, on-accent text.
class HERPrimaryButton extends StatelessWidget {
  const HERPrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.expanded = false,
    this.height = 48,
    this.radius,
    this.fontSize = 16,
    this.fontWeight = FontWeight.w800,
    this.iconSize = 20,
    this.presentation = HERButtonPresentation.standard,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool expanded;
  final double height;

  /// Phase 1: optional radius override (defaults to the button style).
  /// Lets a migrated caller preserve its exact former radius.
  final double? radius;

  /// Phase 1.5: label/icon metrics owned centrally as parameters (defaults
  /// preserve the global button spec). Lets a migrated caller preserve its
  /// exact former metrics without local text ownership.
  final double fontSize;
  final FontWeight fontWeight;
  final double iconSize;

  /// Phase 1.5: presentation variant INSIDE one button system (`standard` =
  /// brand gradient CTA; `flat` = solid variant for genuinely existing flat
  /// CTAs — same role tokens, never a feature theme).
  final HERButtonPresentation presentation;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    // Phase 1: appearance owned by `buttonStyles.primary` (same pixels as the
    // previous inline recipe: CTA gradient, r24, hero shadow, on-accent text).
    final s = theme.buttonStyles.primary;
    final r = radius ?? s.radius;
    final flat = presentation == HERButtonPresentation.flat;
    // A compact in-card button must never be dominated by a large empty icon
    // disc.  Size the disc from the button height and guarantee a readable
    // glyph even if a dashboard editor accidentally sets the icon and its
    // surface to nearly the same colour.
    final iconDiscSize = (height - 10).clamp(20.0, 26.0);
    final iconInk =
        (s.iconColor.computeLuminance() - s.iconBackground.computeLuminance())
                .abs() <
            .20
        ? s.gradientStart
        : s.iconColor;
    final button = Opacity(
      opacity: onPressed == null ? theme.opacity.disabled : 1,
      child: Container(
        height: height,
        padding: EdgeInsets.symmetric(horizontal: icon == null ? 14 : 12),
        decoration: BoxDecoration(
          // سيستم واحد: كل الـ CTA من نفس جراديانت الثيم النشط (زهري مشرق = روز).
          color: flat
              ? s.flatBackground.withValues(alpha: s.backgroundOpacity)
              : null,
          gradient: flat ? null : s.gradient(),
          borderRadius: BorderRadius.circular(r),
          border: flat
              ? null
              : Border.all(
                  color: s.borderColor.withValues(alpha: .48),
                  width: 1.4,
                ),
          boxShadow: onPressed == null || flat
              ? null
              : [
                  BoxShadow(
                    color: s.shadowColor.withValues(alpha: s.shadowOpacity),
                    blurRadius: s.shadowBlur,
                    offset: s.shadowOffset,
                  ),
                ],
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // `case final` also matches null in Dart, which was creating an
            // empty white icon disc on every CTA without an icon.
            if (icon != null) ...[
              Container(
                width: iconDiscSize,
                height: iconDiscSize,
                decoration: BoxDecoration(
                  color: s.iconBackground.withValues(alpha: .92),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon!,
                  color: iconInk,
                  size: iconSize.clamp(14.0, iconDiscSize - 6),
                ),
              ),
              const SizedBox(width: 7),
            ],
            Flexible(
              child: Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.cairo(
                  fontSize: fontSize,
                  fontWeight: fontWeight,
                  color: s.foreground,
                ),
              ),
            ),
          ],
        ),
      ),
    );
    final action = Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(r),
      child: InkWell(
        onTap: onPressed,
        highlightColor: s.foreground.withValues(
          alpha: theme.states.pressedOverlayOpacity,
        ),
        splashColor: s.foreground.withValues(
          alpha: theme.states.pressedOverlayOpacity,
        ),
        borderRadius: BorderRadius.circular(r),
        child: button,
      ),
    );
    // Keep this intrinsic-safe: AlertDialog measures its actions before
    // laying them out, whereas LayoutBuilder cannot answer that query.
    return expanded
        ? SizedBox(width: double.infinity, child: action)
        : IntrinsicWidth(child: action);
  }
}

/// HER secondary button: card surface, secondary text, HER border.
class HERSecondaryButton extends StatelessWidget {
  const HERSecondaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.expanded = false,
    this.height = 48,
    this.radius,
    this.fontSize = 15,
    this.fontWeight = FontWeight.w800,
    this.iconSize = 20,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool expanded;
  final double height;

  /// Phase 1: optional radius override (defaults to the button style).
  final double? radius;

  /// Phase 2: label/icon metrics (defaults preserve the secondary spec).
  final double fontSize;
  final FontWeight fontWeight;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    // Phase 1: appearance owned by `buttonStyles.secondary` (same pixels:
    // surface bg, secondary fg, HER border, r24).
    final s = theme.buttonStyles.secondary;
    final r = radius ?? s.radius;
    final iconInk = s.iconColor;
    final button = Opacity(
      opacity: onPressed == null ? theme.opacity.disabled : 1,
      child: Container(
        height: height,
        padding: EdgeInsets.symmetric(horizontal: icon == null ? 14 : 12),
        decoration: BoxDecoration(
          gradient: s.gradient(),
          borderRadius: BorderRadius.circular(r),
          border: Border.all(
            color: s.borderColor.withValues(alpha: s.borderOpacity),
            width: s.borderWidth,
          ),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon!, size: iconSize.clamp(14.0, 22.0), color: iconInk),
              const SizedBox(width: 7),
            ],
            Flexible(
              child: Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.cairo(
                  fontSize: fontSize,
                  fontWeight: fontWeight,
                  color: s.foreground,
                ),
              ),
            ),
          ],
        ),
      ),
    );
    final action = Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(r),
      child: InkWell(
        onTap: onPressed,
        highlightColor: s.foreground.withValues(
          alpha: theme.states.pressedOverlayOpacity,
        ),
        splashColor: s.foreground.withValues(
          alpha: theme.states.pressedOverlayOpacity,
        ),
        borderRadius: BorderRadius.circular(r),
        child: button,
      ),
    );
    return expanded
        ? SizedBox(width: double.infinity, child: action)
        : IntrinsicWidth(child: action);
  }
}

/// HER selectable chip: selected wash, unselected card surface.
///
/// Set [dense] for tight rows (counters, pills inside cards) where the
/// regular 13px label would overflow narrow Arabic widths.
class HERChip extends StatelessWidget {
  const HERChip({
    super.key,
    required this.label,
    this.selected = false,
    this.onTap,
    this.icon,
    this.dense = false,
    this.enabled = true,
  });

  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final IconData? icon;
  final bool dense;

  /// Disabled chips render at the theme's disabled opacity so they stay
  /// visually distinct from both selected and unselected states. Defaults to
  /// true so every existing call site is unchanged.
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    final interactive = enabled && onTap != null;
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: interactive ? onTap : null,
        borderRadius: BorderRadius.circular(16),
        child: Opacity(
          opacity: enabled ? 1 : theme.states.disabledOpacity,
          child: Container(
            padding: EdgeInsets.symmetric(
              horizontal: dense ? 10 : 14,
              vertical: dense ? 6 : 9,
            ),
            decoration: BoxDecoration(
              color: selected
                  ? theme.states.selectedSurface
                  : theme.states.unselectedSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: selected
                    ? theme.states.selectedBorder
                    : theme.states.unselectedBorder,
              ),
            ),
            // Unlike LayoutBuilder, FittedBox supports AlertDialog's intrinsic
            // sizing pass.  It also scales the complete chip down safely in a
            // narrow fixed-width card, so no icon or label can overflow.
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: AlignmentDirectional.centerStart,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon case final iconData) ...[
                    Icon(
                      iconData,
                      size: dense ? 14 : 16,
                      color: selected
                          ? theme.states.selectedForeground
                          : theme.states.unselectedForeground,
                    ),
                    const SizedBox(width: 6),
                  ],
                  Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.cairo(
                      fontSize: dense ? 11 : 13,
                      fontWeight: FontWeight.w700,
                      color: selected
                          ? theme.states.selectedForeground
                          : theme.states.unselectedForeground,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// HER section header: icon container + primary title + secondary subtitle.
class HERSectionHeader extends StatelessWidget {
  const HERSectionHeader(
    this.title,
    this.subtitle,
    this.icon, {
    super.key,
    this.kind = HerIconKind.rose,
    this.iconRole = 'iconCard',
    this.action,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final HerIconKind kind;
  final String iconRole;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    return Padding(
      padding: const EdgeInsets.only(right: 2, bottom: 2),
      child: Row(
        children: [
          HERIconContainer(
            icon,
            kind: kind,
            role: iconRole,
            size: 40,
            iconSize: 21,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: herSectionTitleStyle(theme)),
                Text(subtitle, style: herSectionSubtitleStyle(theme)),
              ],
            ),
          ),
          ...[?action],
        ],
      ),
    );
  }
}

/// HER dialog shell: card surface, HER border, semantic icon, primary title.
class HERDialog extends StatelessWidget {
  const HERDialog({
    super.key,
    required this.title,
    required this.child,
    this.icon,
    this.iconKind = HerIconKind.rose,
    this.header,
    this.actions = const [],
  });

  final String title;
  final Widget child;
  final IconData? icon;
  final HerIconKind iconKind;

  /// Replaces the standard icon-and-title row for the rare dialogs that need
  /// a branded header. Normal dialogs continue to use the semantic icon API.
  final Widget? header;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 22),
      child: ThemeRoleBackdrop(
        role: 'popup',
        radius: 28,
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
          decoration: AppDecorations.popupFor(theme),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              header ??
                  Row(
                    children: [
                      if (icon != null)
                        HERIconContainer(icon!, kind: iconKind, size: 46),
                      if (icon != null) const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          title,
                          style: GoogleFonts.cairo(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: theme.text.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
              const SizedBox(height: 14),
              child,
              if (actions.isNotEmpty) ...[
                const SizedBox(height: 16),
                ...actions,
              ],
            ],
          ),
        ),
      ),
    );
  }
}

Future<T?> showHerDialog<T>(
  BuildContext context, {
  required String title,
  required Widget child,
  IconData? icon,
  HerIconKind iconKind = HerIconKind.rose,
  Widget? header,
  List<Widget> actions = const [],
}) {
  final fitness = HerFitnessCardScope.isActive(context);
  return showDialog<T>(
    context: context,
    barrierColor: context.herTheme.palette
        .componentStyle('popup')
        .shadowColor
        .withValues(alpha: context.herTheme.opacity.scrim),
    builder: (_) => fitness
        ? HerFitnessCardScope(
            child: HERDialog(
              title: title,
              icon: icon,
              iconKind: iconKind,
              header: header,
              actions: actions,
              child: child,
            ),
          )
        : HERDialog(
            title: title,
            icon: icon,
            iconKind: iconKind,
            header: header,
            actions: actions,
            child: child,
          ),
  );
}

/// HER bottom sheet shell: card surface, top radius, drag handle.
class HERBottomSheet extends StatelessWidget {
  const HERBottomSheet({super.key, required this.child, this.title});

  final Widget child;
  final String? title;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    return ThemeRoleBackdrop(
      role: 'bottomSheet',
      radius: 30,
      child: Container(
        padding: EdgeInsets.only(
          left: 18,
          right: 18,
          top: 10,
          bottom: MediaQuery.of(context).padding.bottom + 18,
        ),
        decoration: AppDecorations.bottomSheetFor(theme, radius: 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: theme.cards.border,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            ),
            if (title != null) ...[
              const SizedBox(height: 12),
              Text(
                title!,
                textAlign: TextAlign.center,
                style: GoogleFonts.cairo(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: theme.text.primary,
                ),
              ),
            ],
            const SizedBox(height: 12),
            Flexible(child: child),
          ],
        ),
      ),
    );
  }
}

Future<T?> showHerSheet<T>(
  BuildContext context, {
  required Widget child,
  String? title,
}) => showModalBottomSheet<T>(
  context: context,
  backgroundColor: Colors.transparent,
  isScrollControlled: true,
  // Sheets with long forms must stay between the status/navigation bars.
  // Without this a scrollable child can be visually hidden behind Android's
  // system navigation area on smaller devices.
  useSafeArea: true,
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
  ),
  builder: (_) => HERBottomSheet(title: title, child: child),
);

/// HER input decoration: card surface, HER border, primary focus.
/// Legacy signature resolves through the active theme; prefer
/// [herInputDecorationFor] with an explicit theme.
InputDecoration herInputDecoration(String hint, {IconData? icon}) =>
    herInputDecorationFor(HerThemeEngine.current, hint, icon: icon);

InputDecoration herInputDecorationFor(
  HerThemeData theme,
  String hint, {
  IconData? icon,
}) => InputDecoration(
  hintText: hint,
  filled: true,
  fillColor: theme.palette.name.startsWith('Morph')
      ? PhoneDesignTokens.palette(
          theme.palette.background.computeLuminance() < .4,
        ).glassBottom
      : theme.palette
            .componentStyle('surface')
            .gradientStart
            .withValues(alpha: theme.palette.componentStyle('surface').opacity),
  hintStyle: GoogleFonts.cairo(fontSize: 14, color: theme.text.muted),
  prefixIcon: icon == null
      ? null
      : Icon(
          icon,
          color: theme.palette.name.startsWith('Morph')
              ? PhoneDesignTokens.palette(
                  theme.palette.background.computeLuminance() < .4,
                ).link
              : theme.actions.primary,
          size: 20,
        ),
  enabledBorder: OutlineInputBorder(
    borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
    borderSide: BorderSide(color: theme.cards.border),
  ),
  border: OutlineInputBorder(
    borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
    borderSide: BorderSide(color: theme.cards.border),
  ),
  focusedBorder: OutlineInputBorder(
    borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
    borderSide: BorderSide(color: theme.actions.primary, width: 1.5),
  ),
);

/// Search has a separate published layer. It intentionally does not borrow a
/// card's opacity, which used to make search bars look washed out whenever a
/// surrounding card layer was adjusted in Theme Studio.
InputDecoration herSearchInputDecorationFor(
  HerThemeData theme,
  String hint, {
  IconData? icon,
}) {
  final style = theme.palette.componentStyle('searchField');
  return InputDecoration(
    hintText: hint,
    filled: true,
    fillColor: theme.palette.name.startsWith('Morph') ? PhoneDesignTokens.palette(theme.palette.background.computeLuminance()<.4).glassBottom : style.gradientStart.withValues(alpha: style.opacity),
    hintStyle: GoogleFonts.cairo(fontSize: 14, color: theme.text.muted),
    prefixIcon: icon == null
        ? null
        : Icon(
            icon,
            color: theme.palette.name.startsWith('Morph')
                ? PhoneDesignTokens.palette(
                    theme.palette.background.computeLuminance() < .4,
                  ).link
                : theme.actions.primary,
            size: 20,
          ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
      borderSide: BorderSide(color: style.border),
    ),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
      borderSide: BorderSide(color: style.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
      borderSide: BorderSide(color: theme.actions.primary, width: 1.5),
    ),
  );
}

/// HER list tile: icon container + title/subtitle + trailing.
class HERListTile extends StatelessWidget {
  const HERListTile({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    this.iconKind = HerIconKind.rose,
    this.iconBackground,
    this.iconGlyphColor,
    this.trailing,
    this.onTap,
  });

  final String title;
  final String? subtitle;
  final IconData? icon;
  final HerIconKind iconKind;
  final Color? iconBackground;
  final Color? iconGlyphColor;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
          child: Row(
            children: [
              if (icon != null)
                HERIconContainer(
                  icon!,
                  kind: iconKind,
                  size: 42,
                  background: iconBackground,
                  glyphColor: iconGlyphColor,
                ),
              if (icon != null) const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: herSectionTitleStyle(theme)),
                    if (subtitle != null)
                      Text(subtitle!, style: herSectionSubtitleStyle(theme)),
                  ],
                ),
              ),
              ...[?trailing],
            ],
          ),
        ),
      ),
    );
  }
}

/// HER stat card: warm-white surface, semantic icon, dark HER value.
///
/// Tasbih recipe — the hue lives in the icon container, never in the tile
/// background, so stat rows keep contrast on any page background. Used for
/// Fitness/Profile/Cycle metrics so unrelated screens share one language.
class HERStatCard extends StatelessWidget {
  const HERStatCard({
    super.key,
    required this.icon,
    required this.value,
    required this.title,
    this.caption,
    this.kind = HerIconKind.rose,
    this.iconRole = 'iconCard',
    this.valueColor,
    this.onTap,
  });

  final IconData icon;
  final String value;
  final String title;
  final String? caption;
  final HerIconKind kind;

  /// Optional semantic theme role for this tile's icon circle.
  ///
  /// A page can opt into a specific role without changing every metric card.
  final String iconRole;
  final Color? valueColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    return Expanded(
      // Phase 1: SMALL role owns the tile structure (same surface recipe).
      child: HERCard(
        role: HERCardRole.small,
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
        radius: 20,
        journeyKind: kind,
        style: HerCardStyle.metric,
        onTap: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            HERIconContainer(
              icon,
              kind: kind,
              role: iconRole,
              size: 38,
              iconSize: 20,
            ),
            const SizedBox(height: 6),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                color: valueColor ?? theme.cardTitle,
              ),
            ),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: GoogleFonts.cairo(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                color: theme.cardTitle,
              ),
            ),
            if (caption != null)
              Text(
                caption!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: GoogleFonts.cairo(
                  fontSize: 9,
                  color: theme.cardSubtitle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// HER feature card: stronger semantic tint + icon + heading + optional CTA.
///
/// For important actions/features. Clearly stronger than a default card but
/// still HER — never a saturated solid surface.
class HERFeatureCard extends StatelessWidget {
  const HERFeatureCard({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.kind = HerIconKind.rose,
    this.trailing,
    this.bottom,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final HerIconKind kind;
  final Widget? trailing;
  final Widget? bottom;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    return HERTintedCard(
      tint: herKindTintOf(theme, kind),
      radius: 22,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              HERIconContainer(icon, kind: kind, size: 46, iconSize: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.cairo(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: theme.cardTitle,
                      ),
                    ),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: GoogleFonts.cairo(
                          fontSize: 11.5,
                          height: 1.5,
                          color: theme.cardSubtitle,
                        ),
                      ),
                  ],
                ),
              ),
              ...[?trailing],
            ],
          ),
          if (bottom != null) ...[const SizedBox(height: 10), bottom!],
        ],
      ),
    );
  }
}

/// HER hero card: reserved for truly important content. May use an approved
/// HER gradient with a matching high-contrast foreground.
///
/// [light] heroes use a soft wash + primary text; strong gradient heroes
/// use on-accent text. Never use hero gradients for ordinary cards.
class HERHeroCard extends StatelessWidget {
  const HERHeroCard({
    super.key,
    required this.child,
    this.gradient,
    this.light = false,
    this.radius = 24,
    this.onTap,
  });

  final Widget child;
  final Gradient? gradient;
  final bool light;
  final double radius;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    final effective = AppDecorations.componentCardFor(
      theme,
      'section',
      radius: radius,
    );
    // A caller may deliberately request a high-contrast action hero (for
    // example the faith-circle challenge). Previously this parameter was
    // ignored, leaving white hero text over the translucent section surface.
    final decoration = gradient == null
        ? effective
        : effective.copyWith(gradient: gradient, color: null);
    final fg = herForegroundOnDecoration(
      theme,
      decoration,
      configured: light ? theme.text.primary : theme.actions.primaryForeground,
    );
    final card = Container(
      padding: const EdgeInsets.all(14),
      decoration: decoration,
      child: DefaultTextStyle.merge(
        style: GoogleFonts.cairo(color: fg),
        child: IconTheme.merge(
          data: IconThemeData(color: fg),
          child: child,
        ),
      ),
    );
    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(radius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: card,
      ),
    );
  }
}

/// HER list card: full-width row card (icon + title/subtitle + trailing).
/// Canonical wrapper so list rows share card borders/shadows/padding.
class HERListCard extends StatelessWidget {
  const HERListCard({
    super.key,
    required this.title,
    this.subtitle,
    this.icon,
    this.iconKind = HerIconKind.rose,
    this.trailing,
    this.onTap,
    this.color,
  });

  final String title;
  final String? subtitle;
  final IconData? icon;
  final HerIconKind iconKind;
  final Widget? trailing;
  final VoidCallback? onTap;

  /// Overrides the card surface. Defaults to the canonical surface.
  final Color? color;

  @override
  Widget build(BuildContext context) => HERCard(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    radius: 20,
    color: color,
    onTap: onTap,
    child: HERListTile(
      title: title,
      subtitle: subtitle,
      icon: icon,
      iconKind: iconKind,
      trailing: trailing,
    ),
  );
}

/// HER badge: tiny semantic pill (count, status, tag). Tinted wash +
/// semantic text — never solid saturated + white text.
class HERBadge extends StatelessWidget {
  const HERBadge(
    this.label, {
    super.key,
    this.kind = HerIconKind.rose,
    this.foregroundColor,
    this.backgroundColor,
  });

  final String label;
  final HerIconKind kind;
  final Color? foregroundColor;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    final resolvedKind = HerIconPaletteScope.resolve(context, kind);
    final isFitness = HerFitnessCardScope.isActive(context);
    final fitnessAccent = herFitnessAccentOf(theme, resolvedKind);
    final fitnessOpacity = herFitnessCircleOpacityOf(
      theme,
      resolvedKind,
    ).clamp(.55, 1).toDouble();
    final tint = isFitness
        ? Color.alphaBlend(
            fitnessAccent.withValues(alpha: .16 * fitnessOpacity),
            theme.surfaces.surface,
          )
        : herKindTintOf(theme, resolvedKind);
    final glyph = isFitness
        ? herFitnessGlyphOf(theme, resolvedKind, background: tint)
        : herIconGlyphOf(theme, resolvedKind);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: backgroundColor ?? tint,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: backgroundColor != null
              ? backgroundColor!.withValues(alpha: .9)
              : glyph.withValues(alpha: .4),
        ),
      ),
      child: Text(
        label,
        style: GoogleFonts.cairo(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: foregroundColor ?? glyph.withValues(alpha: .95),
        ),
      ),
    );
  }
}

/// HER soft button: tonal pill action (tint bg + semantic text).
/// For secondary in-card actions where a full CTA would be too heavy.
class HERSoftButton extends StatelessWidget {
  const HERSoftButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.kind = HerIconKind.rose,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final HerIconKind kind;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    final resolvedKind = HerIconPaletteScope.resolve(context, kind);
    final modern = theme.palette.modernAccents.isNotEmpty;
    final glyph = modern
        ? theme.buttonStyles.secondary.foreground
        : herIconGlyphOf(theme, resolvedKind);
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: modern
                ? theme.buttonStyles.secondary.flatBackground
                : herKindTintOf(theme, resolvedKind),
            borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
            border: Border.all(
              color: modern
                  ? theme.buttonStyles.secondary.borderColor
                  : glyph.withValues(alpha: .45),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon case final iconData) ...[
                Icon(iconData, size: 16, color: glyph),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: GoogleFonts.cairo(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                  color: glyph,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// HER pill button: the hero-CTA language (rose gradient + white text) in
/// a compact pill for in-card actions. This is the single approved button
/// for card actions across the app — same gradient as the page-hero CTA,
/// derived from the active theme, so one palette change retunes every pill.
class HERPillButton extends StatelessWidget {
  const HERPillButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.gradientStart,
    this.gradientEnd,
    this.foreground,
    this.borderColor,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final Color? gradientStart;
  final Color? gradientEnd;
  final Color? foreground;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    final style = theme.buttonStyles.primary;
    final actionForeground = foreground ?? style.foreground;
    final actionIconColor = actionForeground;
    return LayoutBuilder(
      builder: (context, outerConstraints) {
        final maxWidth = outerConstraints.hasBoundedWidth
            ? outerConstraints.maxWidth
            : MediaQuery.sizeOf(context).width;
        return Align(
          alignment: Alignment.center,
          widthFactor: 1,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(
                PhoneDesignTokens.inputRadius,
              ),
              child: InkWell(
                onTap: onPressed,
                borderRadius: BorderRadius.circular(
                  PhoneDesignTokens.inputRadius,
                ),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    // Card actions can be as narrow as 98px on compact phones. Keep
                    // the label usable there instead of overflowing its padded pill.
                    final compact = constraints.maxWidth < 120;
                    return Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: compact ? 8 : 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topRight,
                          end: Alignment.bottomLeft,
                          colors: [
                            gradientStart ?? style.gradientStart,
                            gradientEnd ?? style.gradientEnd,
                          ],
                        ),
                        borderRadius: BorderRadius.circular(
                          PhoneDesignTokens.inputRadius,
                        ),
                        border: Border.all(
                          color: (borderColor ?? style.borderColor).withValues(
                            alpha: .45,
                          ),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: style.shadowColor.withValues(
                              alpha: style.shadowOpacity,
                            ),
                            blurRadius: style.shadowBlur,
                            offset: style.shadowOffset,
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (icon case final iconData) ...[
                            Icon(iconData, size: 15, color: actionIconColor),
                            SizedBox(width: compact ? 4 : 6),
                          ],
                          Flexible(
                            child: Text(
                              label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.cairo(
                                fontSize: compact ? 11 : 12.5,
                                fontWeight: FontWeight.w800,
                                color: actionForeground,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// HER progress: semantic accent fill on its matching track.
///
/// The fill/track come from the kind's Modern UI 2.0 accent family (all
/// theme-owned, all Studio-editable), so steps, learning, faith completion
/// and planner progress read as their own color. Kinds without a semantic
/// mapping (`neutral`) keep the legacy primary-gradient fill.
class HERProgress extends StatelessWidget {
  const HERProgress(this.value, {super.key, this.kind = HerIconKind.rose});

  final double value;
  final HerIconKind kind;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    final resolvedKind = HerIconPaletteScope.resolve(context, kind);
    final progress = value.clamp(0.0, 1.0);
    final radius = BorderRadius.circular(8);
    final modernId = herModernAccentOfKind(resolvedKind);
    final modernFamily = modernId == null
        ? null
        : theme.modernAccents[modernId];
    return Semantics(
      value: '${(progress * 100).round()}%',
      child: SizedBox(
        height: 8,
        child: Container(
          decoration: BoxDecoration(
            color:
                modernFamily?.progressTrack ??
                herIconWashOf(theme, resolvedKind),
            borderRadius: radius,
          ),
          child: ClipRRect(
            borderRadius: radius,
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              child: FractionallySizedBox(
                widthFactor: progress,
                child: Container(
                  decoration: BoxDecoration(
                    color: modernFamily?.progressFill,
                    gradient: modernFamily == null
                        ? theme.buttonStyles.primary.gradient()
                        : null,
                    borderRadius: radius,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
