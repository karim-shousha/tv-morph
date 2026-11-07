import 'phone_system_bars.dart';
import 'package:flutter/material.dart';
import 'morph_colors.dart';
import 'phone_design_tokens.dart';

ThemeData buildMorphTheme({bool light = false}) {
  light = false;
  MorphColors.light = false;
  final scheme = ColorScheme.fromSeed(
    seedColor: MorphColors.electricBlue,
    brightness: light ? Brightness.light : Brightness.dark,
    surface: MorphColors.bgCard,
    onSurface: MorphColors.textPrimary,
    primary: MorphColors.electricBlue,
    onPrimary: MorphColors.palette.onAccent,
    error: MorphColors.danger,
  );
  return ThemeData(
    fontFamily: "MorphSans",
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: Colors.transparent,
    appBarTheme: AppBarTheme(
      systemOverlayStyle: phoneSystemBarStyle(!light),
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.transparent,
      scrolledUnderElevation: 0,
      toolbarHeight: 48,
      foregroundColor: MorphColors.textPrimary,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontSize: PhoneDesignTokens.titleSize,
        fontWeight: FontWeight.w700,
        color: MorphColors.textPrimary,
      ),
    ),
    textTheme: TextTheme(
      headlineSmall: TextStyle(
        fontSize: PhoneDesignTokens.titleSize,
        height: 1.25,
        fontWeight: FontWeight.w700,
        color: MorphColors.textPrimary,
      ),
      titleLarge: TextStyle(
        fontSize: PhoneDesignTokens.sectionSize,
        height: 1.3,
        fontWeight: FontWeight.w600,
        color: MorphColors.textPrimary,
      ),
      titleMedium: TextStyle(
        fontSize: PhoneDesignTokens.bodySize,
        height: 1.4,
        fontWeight: FontWeight.w600,
        color: MorphColors.textPrimary,
      ),
      bodyLarge: TextStyle(
        fontSize: PhoneDesignTokens.bodySize,
        height: 1.5,
        color: MorphColors.textPrimary,
      ),
      bodyMedium: TextStyle(
        fontSize: PhoneDesignTokens.bodySize,
        height: 1.5,
        color: MorphColors.textSecondary,
      ),
      labelLarge: const TextStyle(
        fontSize: PhoneDesignTokens.labelSize,
        height: 1.3,
        fontWeight: FontWeight.w600,
      ),
    ),
    iconTheme: IconThemeData(size: 22, color: MorphColors.textPrimary),
    focusColor: MorphColors.electricBlue.withValues(alpha: .14),
    cardTheme: CardThemeData(
      color: MorphColors.bgCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: MorphColors.surfaceLight),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: MorphColors.electricBlue,
        foregroundColor: scheme.onPrimary,
        minimumSize: const Size(double.infinity, 48),
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontSize: PhoneDesignTokens.labelSize, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(44, 48),
        foregroundColor: MorphColors.textPrimary,
        side: BorderSide(color: MorphColors.surfaceLight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        minimumSize: const Size(44, 44),
        foregroundColor: MorphColors.electricBlue,
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(
        minimumSize: const Size(48, 48),
        iconSize: 22,
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: MorphColors.surface,
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: MorphColors.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: MorphColors.surfaceLight),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: MorphColors.surfaceLight),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: MorphColors.electricBlue, width: 2),
      ),
      hintStyle: TextStyle(color: MorphColors.textMuted),
    ),
    dividerColor: MorphColors.surfaceLight,
  );
}
