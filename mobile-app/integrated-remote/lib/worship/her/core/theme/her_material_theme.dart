import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'her_typography.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'her_theme_data.dart';
import 'theme_palette.dart';

/// Single deterministic builder: HerThemeData -> Material ThemeData.
///
/// All runtime identity colors come from [theme]. No fixed rose values for
/// runtime identity remain here.
ThemeData buildHerMaterialTheme(HerThemeData theme) {
  final palette = theme.palette;
  final isDarkCanvas = theme.surfaces.background.computeLuminance() < 0.38;
  final outlineColor = theme.cards.border.withValues(
    alpha: isDarkCanvas ? 0.88 : 0.78,
  );
  final searchStyle = palette.componentStyle('searchField');
  final inputSurface = searchStyle.gradientStart.withValues(
    alpha: searchStyle.gradientStart.a * searchStyle.opacity,
  );
  final inputInk = theme.text.primary;
  final inputHint = theme.text.secondary;
  final primary = theme.actions.primary;
  // A modal is an accessibility surface.  It intentionally ignores card and
  // secondary-card opacity: lowering those controls must never make dialog
  // text blend into the page behind it.
  final popupSurface = theme.palette.componentStyle('popup').gradientStart;
  final popupInk = theme.text.primary;
  final popupMuted = theme.text.secondary;
  final primaryInk = theme.buttonStyles.primary.foreground;
  final secondaryInk = theme.buttonStyles.secondary.foreground;
  final actionInk = theme.text.primary;
  Widget primaryButtonBackground(
    BuildContext context,
    Set<WidgetState> states,
    Widget? child,
  ) => DecoratedBox(
    decoration: BoxDecoration(
      gradient: states.contains(WidgetState.disabled)
          ? null
          : theme.primaryActionGradient,
      color: states.contains(WidgetState.disabled)
          ? theme.actions.disabled
          : null,
      borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
    ),
    child: child,
  );

  final materialTheme = ThemeData(
    useMaterial3: true,
    extensions: [HerThemeTokens(palette), theme],
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary,
      brightness: isDarkCanvas ? Brightness.dark : Brightness.light,
      primary: primary,
      secondary: theme.accents.emotional,
      // Pin every auto-generated slot to HER logo hues so Material never
      // synthesizes a cyan/blue tertiary or container behind our back.
      tertiary: theme.accents.learning,
      primaryContainer: theme.washes.emotional,
      secondaryContainer: theme.washes.wellness,
      tertiaryContainer: theme.washes.learning,
      error: theme.status.error,
      surface: theme.surfaces.surface,
      onSurface: theme.text.primary,
      onSurfaceVariant: theme.text.secondary,
      onPrimary: primaryInk,
      onSecondary: secondaryInk,
    ),
    textSelectionTheme: TextSelectionThemeData(
      cursorColor: primary,
      selectionColor: theme.washes.emotional,
      selectionHandleColor: primary,
    ),
    scaffoldBackgroundColor: Colors.transparent,
    dividerColor: theme.cards.border,
    iconTheme: IconThemeData(
      color: palette.iconColor.withValues(alpha: theme.opacity.icon),
      // This is the app-wide fallback for every Material Icon that does not
      // request a special contextual size. Shared containers apply the same
      // cap, so the dashboard controls one visual rhythm everywhere.
      size: palette.iconGlyphSize,
    ),
    primaryIconTheme: IconThemeData(
      color: palette.iconColor.withValues(alpha: theme.opacity.icon),
      size: palette.iconGlyphSize,
    ),
    cardTheme: CardThemeData(
      color: theme.surfaces.surface.withValues(alpha: theme.opacity.surface),
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(color: outlineColor),
      ),
    ),
    dialogTheme: DialogThemeData(
      barrierColor: theme.palette
          .componentStyle('popup')
          .shadowColor
          .withValues(alpha: theme.opacity.scrim),
      backgroundColor: popupSurface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      titleTextStyle: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: 19,
        fontWeight: FontWeight.w800,
        color: popupInk,
      ),
      contentTextStyle: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.bodySize,
        color: popupMuted,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(28),
        side: BorderSide(color: outlineColor),
      ),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: popupSurface,
      modalBackgroundColor: popupSurface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      modalElevation: 0,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
    ),
    fontFamily: 'MorphSans',
    textTheme: TextTheme(
      displayLarge: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.titleSize,
        fontWeight: FontWeight.w700,
        color: theme.sectionTitle,
      ),
      displayMedium: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: theme.sectionTitle,
      ),
      displaySmall: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.sectionSize,
        fontWeight: FontWeight.w700,
        color: theme.sectionTitle,
      ),
      headlineLarge: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: theme.sectionTitle,
      ),
      headlineMedium: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.sectionSize,
        fontWeight: FontWeight.w700,
        color: theme.sectionTitle,
      ),
      headlineSmall: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: theme.sectionTitle,
      ),
      titleLarge: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.sectionSize,
        fontWeight: FontWeight.w700,
        color: theme.sectionTitle,
      ),
      titleMedium: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.sectionSize,
        fontWeight: FontWeight.w600,
        color: theme.sectionTitle,
      ),
      titleSmall: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.labelSize,
        fontWeight: FontWeight.w600,
        color: theme.sectionTitle,
      ),
      bodyLarge: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: 17,
        fontWeight: FontWeight.w500,
        color: theme.text.primary,
      ),
      bodyMedium: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.bodySize,
        fontWeight: FontWeight.w500,
        color: theme.text.secondary,
      ),
      bodySmall: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.captionSize,
        fontWeight: FontWeight.w500,
        color: theme.text.secondary,
      ),
      labelLarge: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.labelSize,
        fontWeight: FontWeight.w700,
        color: theme.actions.primaryForeground,
      ),
      labelMedium: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.bodySize,
        fontWeight: FontWeight.w600,
        color: theme.text.primary,
      ),
      labelSmall: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.captionSize,
        fontWeight: FontWeight.w500,
        color: theme.text.secondary,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: theme.surfaces.header.withValues(
        alpha: theme.opacity.header,
      ),
      foregroundColor: theme.surfaces.headerForeground,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.bodySize,
        fontWeight: FontWeight.w700,
        color: theme.sectionTitle,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: primaryInk,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
        ),
        textStyle: TextStyle(
          fontFamily: 'MorphSans',
          fontSize: PhoneDesignTokens.labelSize,
          fontWeight: FontWeight.w700,
        ),
        backgroundBuilder: primaryButtonBackground,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: primaryInk,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
        ),
        textStyle: TextStyle(
          fontFamily: 'MorphSans',
          fontSize: PhoneDesignTokens.labelSize,
          fontWeight: FontWeight.w700,
        ),
        backgroundBuilder: primaryButtonBackground,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: actionInk),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        // An outlined action must stay readable when a screen only customises
        // its foreground. Filling it with the primary colour made labels such
        // as «نسخ» disappear into the button.
        backgroundColor: theme.buttonStyles.secondary.flatBackground,
        foregroundColor: secondaryInk,
        side: BorderSide(color: theme.buttonStyles.secondary.borderColor),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(PhoneDesignTokens.inputRadius),
        ),
        textStyle: TextStyle(
          fontFamily: 'MorphSans',
          fontSize: PhoneDesignTokens.labelSize,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
    canvasColor: popupSurface,
    dropdownMenuTheme: DropdownMenuThemeData(
      textStyle: TextStyle(fontFamily: 'MorphSans', color: inputInk),
      menuStyle: MenuStyle(
        backgroundColor: WidgetStatePropertyAll(popupSurface),
      ),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: ButtonStyle(
        backgroundColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? theme.states.selectedSurface
              : theme.states.unselectedSurface,
        ),
        foregroundColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? theme.states.selectedForeground
              : theme.states.unselectedForeground,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: inputSurface,
      hintStyle: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.bodySize,
        color: inputHint,
      ),
      labelStyle: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.bodySize,
        color: inputHint,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(searchStyle.radius),
        borderSide: BorderSide(
          color: searchStyle.border.withValues(
            alpha: searchStyle.borderOpacity,
          ),
          width: searchStyle.borderWidth,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(searchStyle.radius),
        borderSide: BorderSide(
          color: searchStyle.border.withValues(
            alpha: searchStyle.borderOpacity,
          ),
          width: searchStyle.borderWidth,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(searchStyle.radius),
        borderSide: BorderSide(color: primary, width: 1.5),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      // Snackbars are transient system feedback.  Blend them over the page
      // canvas instead of inheriting a possibly pale card surface from a
      // remote palette; this guarantees dark-mode feedback never flashes
      // white behind a single emoji or short message.
      backgroundColor: isDarkCanvas
          ? Color.alphaBlend(
              primary.withValues(alpha: .22),
              theme.surfaces.background,
            )
          : primary,
      contentTextStyle: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.captionSize,
        color: isDarkCanvas
            ? theme.text.primary
            : theme.actions.primaryForeground,
      ),
      actionTextColor: isDarkCanvas ? primary : theme.washes.emotional,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    checkboxTheme: CheckboxThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      side: BorderSide(color: theme.cards.border, width: 1.5),
      fillColor: WidgetStateProperty.resolveWith<Color?>((states) {
        if (states.contains(WidgetState.selected)) {
          return theme.states.selectedSurface;
        }
        return Colors.transparent;
      }),
      checkColor: WidgetStateProperty.all(theme.states.selectedForeground),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: theme.states.unselectedSurface,
      selectedColor: theme.states.selectedSurface,
      disabledColor: theme.surfaces.surface,
      secondarySelectedColor: theme.states.selectedSurface,
      checkmarkColor: theme.states.selectedForeground,
      labelStyle: WidgetStateTextStyle.resolveWith(
        (states) => TextStyle(
          fontFamily: 'MorphSans',
          fontSize: PhoneDesignTokens.captionSize,
          fontWeight: FontWeight.w700,
          color: states.contains(WidgetState.selected)
              ? theme.states.selectedForeground
              : theme.states.unselectedForeground,
        ),
      ),
      secondaryLabelStyle: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.captionSize,
        fontWeight: FontWeight.w700,
        color: theme.states.selectedForeground,
      ),
      side: BorderSide(color: outlineColor),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    ),
    tabBarTheme: TabBarThemeData(
      // These are dedicated public controls.  Do not silently derive them
      // from primary/border after the Studio has published explicit values.
      labelColor: theme.tabStyle.selectedForeground,
      unselectedLabelColor: theme.tabStyle.unselectedForeground,
      indicatorColor: theme.tabStyle.indicator,
      labelStyle: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.bodySize,
        fontWeight: FontWeight.w800,
      ),
      unselectedLabelStyle: TextStyle(
        fontFamily: 'MorphSans',
        fontSize: PhoneDesignTokens.bodySize,
        fontWeight: FontWeight.w600,
      ),
    ),
    listTileTheme: ListTileThemeData(
      dense: true,
      titleTextStyle: herSectionTitleStyle(theme),
      subtitleTextStyle: herSectionSubtitleStyle(theme),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return theme.switchStyle.thumbSelected;
        }
        return theme.switchStyle.thumbUnselected;
      }),
      trackColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return theme.switchStyle.trackSelected;
        }
        return theme.switchStyle.trackUnselected;
      }),
      trackOutlineColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return theme.switchStyle.trackSelected;
        }
        return theme.switchStyle.border;
      }),
    ),
    radioTheme: RadioThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) return primary;
        return theme.text.secondary;
      }),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(
      color: primary,
      linearTrackColor: theme.washes.emotional,
      circularTrackColor: theme.washes.emotional,
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: primary,
      foregroundColor: primaryInk,
      shape: const StadiumBorder(),
    ),
    popupMenuTheme: PopupMenuThemeData(
      color: theme.surfaces.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: theme.cards.border),
      ),
    ),
    datePickerTheme: DatePickerThemeData(
      backgroundColor: theme.surfaces.surface,
      headerBackgroundColor: primary,
      headerForegroundColor: theme.actions.primaryForeground,
      dayForegroundColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return theme.actions.primaryForeground;
        }
        return theme.text.primary;
      }),
    ),
    timePickerTheme: TimePickerThemeData(
      backgroundColor: theme.surfaces.surface,
      dialBackgroundColor: theme.washes.emotional,
      hourMinuteColor: theme.washes.emotional,
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: HerSoftPageTransitionsBuilder(),
        TargetPlatform.iOS: HerSoftPageTransitionsBuilder(),
      },
    ),
  );
  // Yellow-line root fix (global, text-safe): Flutter's Material Typography
  // bakes a `decorationColor` (≈ the default text color — a warm white on
  // HER's dark seasonal palettes) into every default text style, and it
  // survives TextTheme merges. On its own it paints nothing (decoration is
  // none), but when an Android accessibility/theme overlay injects an
  // underline into descendant Texts (the phenomenon already guarded in the
  // diary reading surface), every line paints in that baked warm-white —
  // the "thin yellow lines" seen physically in Reflection and Jokes.
  // Stripping it restores standard Material behavior (underlines fall back
  // to the text color). Glyphs, codepoints, layout and Quran rendering are
  // untouched: only the underline paint color is removed.
  return materialTheme.copyWith(
    textTheme: _stripBakedDecorationColor(materialTheme.textTheme),
  );
}

/// Rebuilds [theme] field-for-field with `decorationColor` cleared.
///
/// `copyWith(decorationColor: null)` cannot clear it (null means "keep"),
/// so every slot is reconstructed explicitly. Intentional underlines elsewhere
/// (auth links, library `<u>` markup) keep working — they fall back to the
/// text color, exactly like stock Material.
TextTheme _stripBakedDecorationColor(TextTheme theme) {
  TextStyle? clean(TextStyle? style) {
    if (style == null) return null;
    return TextStyle(
      inherit: style.inherit,
      color: style.color,
      backgroundColor: style.backgroundColor,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      letterSpacing: style.letterSpacing,
      wordSpacing: style.wordSpacing,
      textBaseline: style.textBaseline,
      height: style.height,
      leadingDistribution: style.leadingDistribution,
      locale: style.locale,
      foreground: style.foreground,
      background: style.background,
      shadows: style.shadows,
      fontFeatures: style.fontFeatures,
      fontVariations: style.fontVariations,
      decoration: style.decoration,
      decorationColor: null,
      decorationStyle: style.decorationStyle,
      decorationThickness: style.decorationThickness,
      debugLabel: style.debugLabel,
      fontFamily: style.fontFamily,
      fontFamilyFallback: style.fontFamilyFallback,
      overflow: style.overflow,
    );
  }

  return TextTheme(
    displayLarge: clean(theme.displayLarge),
    displayMedium: clean(theme.displayMedium),
    displaySmall: clean(theme.displaySmall),
    headlineLarge: clean(theme.headlineLarge),
    headlineMedium: clean(theme.headlineMedium),
    headlineSmall: clean(theme.headlineSmall),
    titleLarge: clean(theme.titleLarge),
    titleMedium: clean(theme.titleMedium),
    titleSmall: clean(theme.titleSmall),
    bodyLarge: clean(theme.bodyLarge),
    bodyMedium: clean(theme.bodyMedium),
    bodySmall: clean(theme.bodySmall),
    labelLarge: clean(theme.labelLarge),
    labelMedium: clean(theme.labelMedium),
    labelSmall: clean(theme.labelSmall),
  );
}

class HerSoftPageTransitionsBuilder extends PageTransitionsBuilder {
  const HerSoftPageTransitionsBuilder();
  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    // Pushed pages intentionally cut in immediately, just like MainShell's
    // IndexedStack destinations. The opaque themed canvas still prevents a
    // transparent page from exposing the outgoing route for a frame.
    return HerRouteSurface(child: child);
  }
}

/// The solid visual base for every pushed HER route.
///
/// Pages may remain transparent to share HER's seasonal artwork, while this
/// surface guarantees that a transition never reveals the previous route.
class HerRouteSurface extends StatelessWidget {
  const HerRouteSurface({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final palette = context.herTheme.palette;
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: palette.name.startsWith('Morph')
            ? PhoneDesignTokens.palette(
                palette.background.computeLuminance() < .4,
              ).background
            : LinearGradient(
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
                colors: [
                  palette.appGradientStart ?? palette.background,
                  palette.appGradientEnd ?? palette.background,
                ],
              ),
        image: palette.backgroundImageUrl.isEmpty
            ? null
            : DecorationImage(
                image: palette.themeImageProvider(palette.backgroundImageUrl),
                fit: BoxFit.cover,
                opacity: (1 - palette.backgroundOverlayOpacity).clamp(0.0, 1.0),
              ),
      ),
      child: child,
    );
  }
}
