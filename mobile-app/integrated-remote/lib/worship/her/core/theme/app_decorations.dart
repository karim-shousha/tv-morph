import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'package:flutter/material.dart';

import 'her_theme_data.dart';
import 'theme_palette.dart';

/// Shared card language: calm warm-white surfaces with purposeful colour.
/// Unified rhythm — 24 for cards/heroes/sections, 16 for small tiles,
/// 999 for pills only — with two standard shadows so the whole app feels
/// like one calm feminine identity.
///
/// RUNTIME SOURCE OF TRUTH: [HerThemeData].
/// Static helpers below resolve through the active semantic theme
/// ([HerThemeEngine.current] via [AppColors]); new code should prefer the
/// `context.herDecor` extension or the `*For(theme)` variants so the theme
/// dependency is explicit.
class AppDecorations {
  const AppDecorations._();

  /// Shared standard-card recipe. Legacy callers automatically receive the
  /// same translucent vertical surface as new HER cards instead of an opaque
  /// white rectangle.
  static BoxDecoration roseCard({
    double radius = 24,
    bool elevated = true,
    // DEPRECATED (Phase 0): accepted but never read — the secondaryCard
    // family owns the surface. Zero callers pass it; removal in Phase 3.
    @Deprecated('roseCard ignores tint; the secondaryCard family owns it.')
    Color? tint,
  }) {
    final t = HerThemeEngine.current;
    // ignore: deprecated_member_use
    return roseCardFor(t, radius: radius, elevated: elevated, tint: tint);
  }

  static BoxDecoration roseCardFor(
    HerThemeData t, {
    double radius = 24,
    bool elevated = true,
    // DEPRECATED (Phase 0): accepted but never read. Zero callers pass it.
    @Deprecated('roseCardFor ignores tint; the secondaryCard family owns it.')
    Color? tint,
  }) {
    return componentCardFor(
      t,
      'secondaryCard',
      radius: radius,
      elevated: elevated,
    );
  }

  /// Global hero (same as عباداتي _myDayHeader + profile identity).
  static BoxDecoration heroCard({double radius = 24}) {
    final t = HerThemeEngine.current;
    return heroCardFor(t, radius: radius);
  }

  static BoxDecoration heroCardFor(HerThemeData t, {double radius = 24}) =>
      componentCardFor(t, 'cardHero', radius: radius, elevated: true);

  /// One implementation for every published card role. Pages never invent a
  /// fill/border recipe; they only choose the semantic layer they need.
  static BoxDecoration componentCardFor(
    HerThemeData t,
    String role, {
    double radius = 22,
    bool elevated = true,
    AlignmentGeometry begin = Alignment.topCenter,
    AlignmentGeometry end = Alignment.bottomCenter,
  }) {
    if (t.palette.name.startsWith('Morph')) {
      return PhoneDesignTokens.palette(t.palette.background.computeLuminance()<.4).cardDecoration(elevated:elevated);
    }
    final style = t.palette.componentStyle(role);
    final configuredShadow = style.shadowOpacity > 0
        ? [
            BoxShadow(
              color: style.shadowColor.withValues(alpha: style.shadowOpacity),
              blurRadius: style.shadowBlur,
              offset: Offset(style.shadowOffsetX, style.shadowOffsetY),
            ),
          ]
        : null;
    return BoxDecoration(
      gradient: role == 'cardHero'
          ? t.heroCardGradient
          : LinearGradient(
              begin: themeGradientBegin(style.gradientDirection, begin),
              end: themeGradientEnd(style.gradientDirection, end),
              colors: [
                style.gradientStart.withValues(alpha: style.opacity),
                style.gradientEnd.withValues(alpha: style.opacity),
              ],
            ),
      borderRadius: BorderRadius.circular(radius),
      border: style.borderWidth <= 0
          ? null
          : Border.all(
              color: style.border.withValues(alpha: style.borderOpacity),
              width: style.borderWidth,
            ),
      boxShadow: elevated
          ? (configuredShadow ??
                (role == 'section' || role == 'slide'
                    ? [
                        BoxShadow(
                          color: t.actions.primary.withValues(alpha: .15),
                          blurRadius: 22,
                          offset: const Offset(0, 10),
                        ),
                      ]
                    : [
                        BoxShadow(
                          color: t.actions.primary.withValues(alpha: .08),
                          blurRadius: 18,
                          offset: const Offset(0, 7),
                        ),
                      ]))
          : null,
    );
  }

  static BoxDecoration titleCardFor(HerThemeData t, {double radius = 22}) =>
      componentCardFor(t, 'titleCard', radius: radius);

  static BoxDecoration slideCardFor(HerThemeData t, {double radius = 24}) =>
      // Phase 2 prep: slide surfaces read the dedicated slide family
      // (identical values to the previous inline recipe).
      t.slides.decoration(radius: radius);

  static BoxDecoration popupFor(HerThemeData t, {double radius = 28}) =>
      componentCardFor(t, 'popup', radius: radius, elevated: true);

  /// Dedicated bottom-sheet surface. Sheets must not inherit popup/dialog
  /// opacity: Theme Studio owns this structural layer independently.
  static BoxDecoration bottomSheetFor(HerThemeData t, {double radius = 30}) =>
      componentCardFor(t, 'bottomSheet', radius: radius, elevated: true);

  /// Global icon tint: circle with tone at 13% (عباداتي mini-card style).
  static BoxDecoration iconTint(Color tone) =>
      BoxDecoration(shape: BoxShape.circle, color: tone.withValues(alpha: .13));

  /// Global chip tint for badges/counts.
  static Color chipTint(Color tone) => tone.withValues(alpha: .13);

  /// Kept for old callers. Their former per-feature [tone] is deliberately
  /// ignored so summary and section cards follow the `section` controls.
  /// INTENTIONAL (not a fake API): unification by contract, documented here.
  static BoxDecoration summaryCard(Color tone) => heroCard();

  /// Same contract as [summaryCard]: the arg is intentionally unread.
  static BoxDecoration sectionCard(Color tone) => heroCard();

  static BoxDecoration streakCard() {
    final t = HerThemeEngine.current;
    return streakCardFor(t);
  }

  static BoxDecoration streakCardFor(HerThemeData t) => BoxDecoration(
    gradient: LinearGradient(
      colors: [
        t.palette.primaryLight.withValues(alpha: .65),
        t.washes.emotional.withValues(alpha: .5),
      ],
      begin: Alignment.topRight,
      end: Alignment.bottomLeft,
    ),
    borderRadius: BorderRadius.circular(24),
    border: Border.all(color: t.actions.secondary.withValues(alpha: .3)),
    boxShadow: [
      BoxShadow(
        color: t.actions.secondary.withValues(alpha: .22),
        blurRadius: 22,
        offset: const Offset(0, 10),
      ),
    ],
  );

  static BoxDecoration chip(Color tone) => BoxDecoration(
    color: tone.withValues(alpha: .22),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: tone.withValues(alpha: .5)),
    boxShadow: [
      BoxShadow(
        color: tone.withValues(alpha: .15),
        blurRadius: 18,
        offset: const Offset(0, 7),
      ),
    ],
  );

  static BoxDecoration macroTile(Color tone) => BoxDecoration(
    gradient: LinearGradient(
      colors: [tone.withValues(alpha: .3), tone.withValues(alpha: .15)],
      begin: Alignment.topRight,
      end: Alignment.bottomLeft,
    ),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: tone.withValues(alpha: .45)),
    boxShadow: [
      BoxShadow(
        color: tone.withValues(alpha: .15),
        blurRadius: 18,
        offset: const Offset(0, 7),
      ),
    ],
  );

  // ============================================================
  // HER | روشة identity decorations (semantic tokens).
  // ============================================================

  /// Default HER card: warm white, HER border, 20–24 radius, soft shadow.
  ///
  /// The surface alpha is deliberately controlled by Theme Studio. This
  /// lets the page background participate in the design and keeps a seasonal
  /// theme soft instead of turning the app into a stack of opaque rectangles.
  static BoxDecoration herCard({double radius = 22, bool elevated = true}) =>
      herCardFor(HerThemeEngine.current, radius: radius, elevated: elevated);

  static BoxDecoration herCardFor(
    HerThemeData t, {
    double radius = 22,
    bool elevated = true,
  }) => componentCardFor(t, 'surface', radius: radius, elevated: elevated);

  /// HER primary gradient (CTA start → emotional) for strong CTAs / heroes.
  /// Baseline reproduces #B85F7B → #D9829A.
  static BoxDecoration herPrimaryGradient({double radius = 24}) =>
      herPrimaryGradientFor(HerThemeEngine.current, radius: radius);

  static BoxDecoration herPrimaryGradientFor(
    HerThemeData t, {
    double radius = 24,
  }) {
    final style = t.buttonStyles.primary;
    return BoxDecoration(
      gradient: style.gradient(),
      borderRadius: BorderRadius.circular(radius),
      boxShadow: [
        BoxShadow(
          color: style.shadowColor.withValues(alpha: style.shadowOpacity),
          blurRadius: style.shadowBlur,
          offset: style.shadowOffset,
        ),
      ],
    );
  }

  /// HER icon containers — circular (or 12–16 rounded) with HER pairing.
  /// [kind]: 'primary' | 'rose' | 'wellness' | 'warm' | 'inactive'.
  /// DEPRECATED (Phase 0): [kind] is accepted but never read — every kind
  /// renders the same `iconCard` layer. Zero callers outside this file.
  /// Use `HERIconContainer(kind:)` for kind-aware icons.
  static BoxDecoration herIcon(
    // DEPRECATED (Phase 0): unread. Zero external callers.
    @Deprecated('herIcon ignores kind; use HERIconContainer(kind:) instead.')
    String kind, {
    double radius = 999,
  }) =>
      // ignore: deprecated_member_use
      herIconFor(HerThemeEngine.current, kind, radius: radius);

  static BoxDecoration herIconFor(
    HerThemeData t,
    // DEPRECATED (Phase 0): unread. Zero external callers.
    @Deprecated('herIconFor ignores kind; use HERIconContainer(kind:) instead.')
    String kind, {
    double radius = 999,
  }) {
    final style = t.palette.componentStyle('iconCard');
    return BoxDecoration(
      gradient: LinearGradient(
        colors: [
          style.gradientStart.withValues(alpha: style.opacity),
          style.gradientEnd.withValues(alpha: style.opacity),
        ],
      ),
      border: Border.all(color: style.border),
      borderRadius: BorderRadius.circular(radius),
    );
  }

  /// Glyph colour matching [herIcon] kinds.
  /// DEPRECATED (Phase 0): [kind] is accepted but never read. Zero callers
  /// outside this file. Use `herIconGlyphOf(theme, kind)` instead.
  static Color herIconColor(
    // DEPRECATED (Phase 0): unread. Zero external callers.
    @Deprecated('herIconColor ignores kind; use herIconGlyphOf instead.')
    String kind,
  ) =>
      // ignore: deprecated_member_use
      herIconColorFor(HerThemeEngine.current, kind);

  static Color herIconColorFor(
    HerThemeData t,
    // DEPRECATED (Phase 0): unread. Zero external callers.
    @Deprecated('herIconColorFor ignores kind; use herIconGlyphOf instead.')
    String kind,
  ) {
    return t.palette.iconColor.withValues(alpha: t.opacity.icon);
  }

  /// HER selected chip (rose/blush) vs unselected (warm white).
  static BoxDecoration herChip({bool selected = false, double radius = 16}) =>
      herChipFor(HerThemeEngine.current, selected: selected, radius: radius);

  static BoxDecoration herChipFor(
    HerThemeData t, {
    bool selected = false,
    double radius = 16,
  }) => BoxDecoration(
    color: selected
        ? t.washes.emotional.withValues(alpha: .7)
        : t.cards.surface,
    borderRadius: BorderRadius.circular(radius),
    border: Border.all(
      color: selected
          ? t.accents.emotional.withValues(alpha: .65)
          : t.cards.border,
    ),
  );

  /// HER dialog / bottom-sheet surface: warm white, large radius.
  static BoxDecoration herDialog({double radius = 28}) =>
      herDialogFor(HerThemeEngine.current, radius: radius);

  static BoxDecoration herDialogFor(HerThemeData t, {double radius = 28}) =>
      popupFor(t, radius: radius);
}

/// Explicit-theme decoration access: `context.herDecor.herCard()`.
extension HerDecorationsContext on BuildContext {
  HerDecorations get herDecor => HerDecorations(herTheme);
}

class HerDecorations {
  HerDecorations(this.theme);
  final HerThemeData theme;

  BoxDecoration herCard({double radius = 22, bool elevated = true}) =>
      AppDecorations.herCardFor(theme, radius: radius, elevated: elevated);
  BoxDecoration roseCard({double radius = 24, bool elevated = true}) =>
      AppDecorations.roseCardFor(theme, radius: radius, elevated: elevated);
  BoxDecoration heroCard({double radius = 24}) =>
      AppDecorations.heroCardFor(theme, radius: radius);
  BoxDecoration titleCard({double radius = 22}) =>
      AppDecorations.titleCardFor(theme, radius: radius);
  BoxDecoration slideCard({double radius = 24}) =>
      AppDecorations.slideCardFor(theme, radius: radius);
  BoxDecoration herPrimaryGradient({double radius = 24}) =>
      AppDecorations.herPrimaryGradientFor(theme, radius: radius);
  // DEPRECATED (Phase 0): forwards to deprecated kind-ignoring helpers.
  @Deprecated('Use HERIconContainer(kind:) instead.')
  BoxDecoration herIcon(String kind, {double radius = 999}) =>
      // ignore: deprecated_member_use
      AppDecorations.herIconFor(theme, kind, radius: radius);
  // DEPRECATED (Phase 0): forwards to a deprecated kind-ignoring helper.
  @Deprecated('Use herIconGlyphOf(theme, kind) instead.')
  Color herIconColor(String kind) =>
      // ignore: deprecated_member_use
      AppDecorations.herIconColorFor(theme, kind);
  BoxDecoration herChip({bool selected = false, double radius = 16}) =>
      AppDecorations.herChipFor(theme, selected: selected, radius: radius);
  BoxDecoration herDialog({double radius = 28}) =>
      AppDecorations.herDialogFor(theme, radius: radius);
  BoxDecoration bottomSheet({double radius = 30}) =>
      AppDecorations.bottomSheetFor(theme, radius: radius);
  BoxDecoration streakCard() => AppDecorations.streakCardFor(theme);
}
