import 'package:flutter/material.dart';

import '../theme/her_modern_accents.dart';
import '../theme/her_theme_data.dart';
import 'her_icon_identity.dart';

/// Purpose, rather than the page, selects an editable accent family.
/// Utility/action icons keep their explicit foreground. Legacy publications
/// without modernAccents keep the original colour and inherited IconTheme.
class HerSemanticIcon extends Icon {
  const HerSemanticIcon(
    super.icon, {
    super.key,
    super.size,
    super.fill,
    super.weight,
    super.grade,
    super.opticalSize,
    super.color,
    super.shadows,
    super.semanticLabel,
    super.textDirection,
    super.applyTextScaling,
    super.blendMode,
    super.fontWeight,
    this.accent,
  });

  final HerModernAccentId? accent;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    final family =
        accent ?? (icon == null ? null : herIconAccentIdentity(icon!));
    if (theme.palette.modernAccents.isEmpty || family == null) {
      return super.build(context);
    }
    return Icon(
      icon,
      size: size,
      fill: fill,
      weight: weight,
      grade: grade,
      opticalSize: opticalSize,
      color: theme.modernAccents[family].accentColor.withValues(
        alpha: theme.opacity.icon,
      ),
      shadows: shadows,
      semanticLabel: semanticLabel,
      textDirection: textDirection,
      applyTextScaling: applyTextScaling,
      blendMode: blendMode,
      fontWeight: fontWeight,
    );
  }
}
