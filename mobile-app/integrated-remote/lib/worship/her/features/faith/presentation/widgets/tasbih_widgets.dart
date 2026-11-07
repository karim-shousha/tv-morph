import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/widgets/her_components.dart';

class TasbihGuideSlide extends StatelessWidget {
  const TasbihGuideSlide(
    this.icon,
    this.title,
    this.body, {
    super.key,
    this.kind = HerIconKind.rose,
  });
  final IconData icon;
  final String title, body;

  /// Central icon kind per slide (rose CTAs, knowledge dignity, …).
  /// Defaults rose. The icon family owns container + glyph centrally.
  final HerIconKind kind;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 12),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        HERIconContainer(
          icon,
          kind: kind,
          size: 86,
          iconSize: 44,
          clampSize: false,
        ),
        const SizedBox(height: 18),
        Text(
          title,
          textAlign: TextAlign.center,
          style: PhoneDesignTokens.uiText(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: context.herTheme.sectionTitle,
          ),
        ),
        const SizedBox(height: 9),
        Text(
          body,
          textAlign: TextAlign.center,
          style: PhoneDesignTokens.uiText(
            fontSize: 12,
            height: 1.8,
            fontWeight: FontWeight.w600,
            color: context.herTheme.bodySecondary,
          ),
        ),
      ],
    ),
  );
}
