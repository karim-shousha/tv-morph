import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/theme/theme_palette.dart';

// Semantic adapter over the HER action/text roles. Quran keeps no independent
// palette of its own. Foreground UI (tabs, icons, progress) resolves from the
// semantic ACTION role — never from a background wash token — so a CMS theme
// publish retunes Quran together with every other feature.
Color get quranDeepRose => PhoneDesignTokens.palette(HerThemeEngine.current.palette.background.computeLuminance()<.4).link;

/// Rose wash for Quran tiles and docks (theme emotional wash — unified).
Color get quranDeepRoseWash => HerThemeEngine.current.washes.emotional;
Color get quranRoseInk => HerThemeEngine.current.bodyPrimary;
Color get quranRoseSub => HerThemeEngine.current.bodySecondary;
Color get quranRoseIcon => HerThemeEngine.current.actions.primary;
Color get quranRoseChip => HerThemeEngine.current.washes.emotional;
Color get quranRoseBorder => HerThemeEngine.current.actions.primary;

/// Ink that stays primary for headings but follows the theme on dark ones.
Color quranInk(ThemePalette palette) => HerThemeEngine.current.bodyPrimary;

/// Semantic adapters (prefer these):
Color quranReading(BuildContext context) =>
    context.herTheme.palette.iconCreamBackgroundColor;
Color quranReadingWash(BuildContext context) =>
    context.herTheme.palette.iconCreamBackgroundColor;
Color quranWellness(BuildContext context) =>
    context.herTheme.palette.iconBackgroundColor;
