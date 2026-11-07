import 'package:flutter/material.dart';
import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'her_theme_data.dart';
/// Reading modes use the same two phone palettes, never an independent skin.
class HerReadingColors {
 HerReadingColors(HerThemeData theme,{required bool dark}){
  final p=PhoneDesignTokens.palette(dark);background=p.backgroundBase;ink=p.text;secondary=p.muted;border=p.border;
 }
 static Color inkFor(Color background)=>herContrastRatio(PhoneDesignTokens.lightText,background)>=4.5?PhoneDesignTokens.lightText:PhoneDesignTokens.text;
 late final Color background,ink,secondary,border;
}
