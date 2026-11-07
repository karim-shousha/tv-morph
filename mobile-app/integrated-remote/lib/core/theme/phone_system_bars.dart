import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'phone_design_tokens.dart';

SystemUiOverlayStyle phoneSystemBarStyle(bool dark) {
  final palette = PhoneDesignTokens.palette(dark);
  return SystemUiOverlayStyle(
    statusBarColor: palette.backgroundBase,
    statusBarIconBrightness: dark ? Brightness.light : Brightness.dark,
    statusBarBrightness: dark ? Brightness.dark : Brightness.light,
    systemNavigationBarColor: palette.backgroundBase,
    systemNavigationBarDividerColor: palette.backgroundBase,
    systemNavigationBarIconBrightness: dark ? Brightness.light : Brightness.dark,
    systemStatusBarContrastEnforced: false,
    systemNavigationBarContrastEnforced: false,
  );
}

Widget phoneSystemBars(bool dark, Widget child) =>
    AnnotatedRegion<SystemUiOverlayStyle>(value: phoneSystemBarStyle(dark), child: child);
