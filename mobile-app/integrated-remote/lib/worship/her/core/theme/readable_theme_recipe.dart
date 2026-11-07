import 'package:flutter/material.dart';

/// Authoring helper for bundled recipes. Never applied to editor publications.
/// All colours are derived from that recipe's own palette; fields remain CMS-editable.
Map<String, dynamic> readableThemeRecipe(Map<String, dynamic> source) {
  final result = Map<String, dynamic>.from(source);
  Color? color(Object? value) => value is String
      ? Color(int.tryParse(value.replaceFirst('#', 'FF'), radix: 16) ?? 0)
      : null;
  String hex(Color c) =>
      '#${(c.toARGB32() & 0xffffff).toRadixString(16).padLeft(6, '0').toUpperCase()}';
  final background = color(source['background']);
  final surface = color(source['surface']);
  final text = color(source['textPrimary']);
  final border = color(source['border']);
  if (background == null || surface == null || text == null) return result;
  final frame = Color.lerp(surface, text, .24)!;
  result['appGradientStart'] = hex(background);
  result['appGradientEnd'] = hex(background);
  result['backgroundOverlayOpacity'] = 1;
  result['border'] = hex(frame);
  result['surfaceBorder'] = hex(frame);
  result['secondaryCardBorder'] = hex(frame);
  result['sectionBorder'] = hex(frame);
  result['textSecondary'] = hex(Color.lerp(surface, text, .84)!);
  result['bodyPrimaryColor'] = hex(text);
  result['cardTitleColor'] = hex(text);
  for (final key in [
    'bodySecondaryColor',
    'cardSubtitleColor',
    'sectionSubtitleColor',
    'captionColor',
  ]) {
    result[key] = result['textSecondary'];
  }
  final styles = source['componentStyles'] is Map
      ? Map<String, dynamic>.from(source['componentStyles'] as Map)
      : <String, dynamic>{};
  final calmRoles = {
    'surface',
    'secondaryCard',
    'cardLarge',
    'cardMedium',
    'cardSmall',
    'cardWide',
    'cardJourney',
    'cardContent',
    'listRow',
    'section',
    'popup',
    'bottomSheet',
    'counter',
    'searchField',
    'cycleCalendarCard',
  };
  for (final role in calmRoles) {
    final style = styles[role] is Map
        ? Map<String, dynamic>.from(styles[role] as Map)
        : <String, dynamic>{};
    final start = color(style['gradientStart']) ?? surface;
    final end = color(style['gradientEnd']) ?? surface;
    style.addAll({
      'gradientStart': hex(start),
      'gradientEnd': hex(Color.lerp(start, end, .25)!),
      'border': hex(frame),
      'borderWidth': .8,
      'borderOpacity': .85,
      'opacity': .98,
      'shadowOpacity': .06,
      'shadowBlur': 12,
      'backdropBlur': 0,
    });
    styles[role] = style;
  }
  result['componentStyles'] = styles;
  // Keep the authored action, hero and icon families distinct from neutral cards.
  if (border == null) result['selectedBorderColor'] = hex(frame);
  return result;
}
