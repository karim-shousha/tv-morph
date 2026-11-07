import 'package:flutter/material.dart';
import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'her_theme_data.dart';
TextStyle herSectionTitleStyle(HerThemeData t)=>PhoneDesignTokens.uiText(fontSize:PhoneDesignTokens.sectionSize,fontWeight:FontWeight.w600,color:t.sectionTitle);
TextStyle herSectionSubtitleStyle(HerThemeData t)=>PhoneDesignTokens.uiText(fontSize:PhoneDesignTokens.captionSize,color:t.sectionSubtitle);
