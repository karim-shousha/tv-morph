import 'package:flutter/material.dart';
import 'phone_design_tokens.dart';

/// Compatibility aliases over the one phone component library.
abstract final class MorphColors {
  static bool light = false;
  static PhonePalette get palette => PhoneDesignTokens.palette(!light);
  static Color tone(int dark, int daylight) => switch (daylight) {
    0xFFF7F4EF || 0xFFFEFDFB => palette.glassTop,
    0xFFF1ECE5 || 0xFFF0EAE2 || 0xFFE9E2D8 => palette.soft,
    0xFFD7D2C9 => palette.border,
    0xFF617286 => palette.muted,
    0xFF688297 => palette.link,
    0xFF344D64 => palette.accent,
    0xFF34876F => palette.success,
    0x1C344D64 => palette.shadow,
    _ => Color(light ? daylight : dark),
  };
  static Color get bgDeep => palette.backgroundBase;
  static Color get bgNavy => palette.backgroundMiddle;
  static Color get bgCard => palette.surface;
  static Color get surface => palette.surface;
  static Color get surfaceLight => palette.border;
  static const electricBlue = PhoneDesignTokens.accent;
  static Color get cyan => palette.link;
  static Color get purple => palette.link;
  static Color get magenta => palette.link;
  static Color get textPrimary => palette.text;
  static Color get textSecondary => palette.muted;
  static Color get textMuted => palette.muted;
  static Color get success => palette.success;
  static Color get warning => palette.link;
  static Color get danger => palette.danger;
  static const samsungBlue = PhoneDesignTokens.accent;
  static const lgRed = Color(0xFFBF3554);
  static const androidGreen = PhoneDesignTokens.accent;
  static LinearGradient get brandGradient => palette.action;
  static LinearGradient get purpleGradient => palette.action;
  static LinearGradient get cardGradient => palette.glass;
}
