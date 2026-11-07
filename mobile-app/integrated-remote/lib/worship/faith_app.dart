import '../core/widgets/phone_navigation.dart';
import '../core/theme/phone_system_bars.dart';
import '../core/theme/phone_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:timezone/data/latest.dart' as zones;
import 'her/core/theme/theme_palette.dart';
import 'her/core/theme/her_theme_data.dart';
import 'her/features/faith/presentation/prayer_dashboard_screen.dart';
import 'native_bridge.dart';
import 'her/core/theme/her_material_theme.dart';

/// The original HER widget tree, with Morph's palette and local-only adapters.
class MorphFaithApp extends StatefulWidget {
  const MorphFaithApp({
    super.key,
    required this.dark,
    this.destination,
    this.navEnglish = false,
  });
  final bool dark;
  final bool navEnglish;
  final String? destination;
  @override
  State<MorphFaithApp> createState() => _MorphFaithAppState();
}

class _MorphFaithAppState extends State<MorphFaithApp> {
  late final ValueNotifier<String?> request = ValueNotifier(widget.destination);
  @override
  void initState() {
    super.initState();
    zones.initializeTimeZones();
    GoogleFonts.config.allowRuntimeFetching = false;
    HerThemeEngine.update(morphFaithPalette(widget.dark));
  }

  @override
  void dispose() {
    request.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = HerThemeEngine.current;
    return MaterialApp(
      title: 'عباداتي · Morph TV',
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: buildHerMaterialTheme(theme),
      builder: (context, child) => phoneSystemBars(
        widget.dark,
        HerRouteSurface(
          child: Stack(
            children: [
              Padding(
                padding: EdgeInsets.only(
                  bottom: 82 + MediaQuery.paddingOf(context).bottom,
                ),
                child: child!,
              ),
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: PhoneNavigation(
                  dark: widget.dark,
                  arabic: true,
                  active: 'more',
                  onSelect: (page) => MorphFaithNative.close(page),
                ),
              ),
            ],
          ),
        ),
      ),
      home: Builder(
        builder: (context) => Scaffold(
          backgroundColor: Colors.transparent,
          body: SafeArea(
            bottom: true,
            child: PrayerDashboardScreen(
              onBack: () => MorphFaithNative.close('home'),
              onAchievement: (_) async {},
              openRequest: request,
            ),
          ),
        ),
      ),
    );
  }
}

/// The inherited widgets consume the phone library through this schema adapter.
/// No inherited color, font, artwork or component skin survives into the payload.
ThemePalette morphFaithPalette(bool dark) {
  final p = PhoneDesignTokens.palette(dark);
  String hex(Color c) =>
      '#${c.toARGB32().toRadixString(16).padLeft(8, '0').substring(c.a < 1 ? 0 : 2)}';
  String role(String path) {
    final k = path.toLowerCase();
    if (k.contains('onprimary') ||
        k.contains('buttontext') ||
        k.contains('buttonicon'))
      return hex(p.onAccent);
    if (k.contains('danger') || k.contains('error')) return hex(p.danger);
    if (k.contains('success')) return hex(p.success);
    if (k.contains('shadow')) return hex(p.shadow);
    if (k.contains('border') || k.contains('divider')) return hex(p.border);
    if (k.contains('secondary') ||
        k.contains('subtitle') ||
        k.contains('caption') ||
        k.contains('muted'))
      return hex(p.muted);
    if (k.contains('text') ||
        k.contains('title') ||
        k.contains('foreground') ||
        k.contains('glyph') ||
        k.contains('body') ||
        k.contains('heading') ||
        k.contains('devotional'))
      return hex(p.text);
    if (k.contains('background')) return hex(p.backgroundBase);
    if (k.contains('primary') ||
        k.contains('accent') ||
        k.contains('selected') ||
        k.contains('progressfill'))
      return hex(p.accent);
    return hex(p.surface);
  }

  dynamic reset(dynamic value, String path) {
    if (value is Map)
      return value.map((k, v) => MapEntry(k, reset(v, '$path.$k')));
    if (value is List) return value.map((v) => reset(v, path)).toList();
    if (value is String && RegExp(r'^#[0-9a-fA-F]{6,8}$').hasMatch(value))
      return role(path);
    if (value is String &&
        (path.toLowerCase().contains('imageurl') ||
            path.toLowerCase().contains('imageasset')))
      return '';
    return value;
  }

  final json = Map<String, dynamic>.from(
    reset(ThemePalette.fromJson(ThemePalette.fallback.toJson()).toJson(), '')
        as Map,
  );
  json.addAll({
    'name': dark ? 'Morph Dark' : 'Morph Light',
    'primary': hex(p.accent),
    'primaryDark': hex(p.accentEnd),
    'primaryLight': hex(p.soft),
    'background': hex(p.backgroundBase),
    'surface': hex(p.surface),
    'border': hex(p.border),
    'textPrimary': hex(p.text),
    'textSecondary': hex(p.muted),
    'buttonTextColor': hex(p.onAccent),
    'onPrimaryColor': hex(p.onAccent),
    'primaryButtonTextColor': hex(p.onAccent),
    'primaryButtonIconColor': hex(p.onAccent),
    'primaryButtonColor': hex(p.accent),
    'primaryButtonGradientStartColor': hex(p.accent),
    'primaryButtonGradientEndColor': hex(p.accentEnd),
    'selectedSurfaceColor': hex(p.soft),
    'selectedForegroundColor': hex(p.text),
    'selectedBorderColor': hex(p.link),
    'unselectedSurfaceColor': hex(p.surface),
    'unselectedForegroundColor': hex(p.muted),
    'unselectedBorderColor': hex(p.border),
    'headerColor': '#00000000',
    'headerTitleColor': hex(p.text),
    'headerHerColor': hex(p.text),
    'headerSubtitleColor': hex(p.muted),
    'sideIconColor': hex(p.text),
    'sideIconBackgroundColor': '#00000000',
    'iconColor': hex(p.link),
    'iconBackgroundColor': hex(p.soft),
    'homeHeaderLogoImageUrl': 'assets/images/morph-header.webp',
    'welcomeLogoImageUrl': 'assets/images/morph-header.webp',
    'backgroundImageUrl': '',
    'headerImageUrl': '',
    'appGradientStart': hex(p.backgroundTop),
    'appGradientEnd': hex(p.backgroundBottom),
    'switchTrackSelectedColor': hex(p.accent),
    'switchThumbSelectedColor': hex(p.onAccent),
    'switchTrackUnselectedColor': hex(p.soft),
    'switchThumbUnselectedColor': hex(p.muted),
    'tabSelectedForegroundColor': hex(p.text),
    'tabUnselectedForegroundColor': hex(p.muted),
    'tabIndicatorColor': hex(p.link),
  });
  final roles = Map<String, dynamic>.from(json['componentStyles'] as Map);
  for (final key in {
    ...roles.keys,
    'surface',
    'header',
    'popup',
    'bottomSheet',
    'searchField',
    'cardHero',
    'secondaryCard',
    'listRow',
    'cardShortcut',
    'cardContent',
    'section',
  })
    roles[key] = {
      'gradientStart': hex(p.glassTop),
      'gradientEnd': hex(p.glassBottom),
      'border': hex(p.border),
      'glyphColor': hex(p.link),
      'opacity': 1.0,
      'borderOpacity': 1.0,
      'borderWidth': 1.0,
      'radius': PhoneDesignTokens.cardRadius,
      'shadowColor': hex(p.shadow),
      'shadowOpacity': dark ? .18 : .06,
      'shadowBlur': 16.0,
      'shadowOffsetY': 6.0,
    };
  roles['header'] = {
    ...roles['header'] as Map,
    'gradientStart': '#00000000',
    'gradientEnd': '#00000000',
    'borderWidth': 0.0,
    'shadowOpacity': 0.0,
  };
  for (final mode in [false, true]) {
    final reader = PhoneDesignTokens.palette(mode);
    roles[mode ? 'readerDark' : 'readerLight'] = {
      ...roles['surface'] as Map,
      'gradientStart': hex(reader.surface),
      'gradientEnd': hex(reader.surface),
      'border': hex(reader.border),
      'glyphColor': hex(reader.text),
    };
  }
  roles['popup'] = {
    ...roles['surface'] as Map,
    'gradientStart': hex(p.surface),
    'gradientEnd': hex(p.surface),
  };
  json['componentStyles'] = roles;
  json['modernAccents'] = {
    for (final key in ['rose', 'lavender', 'mint', 'softBlue', 'coral', 'sage'])
      key: {
        'accentColor': hex(p.accent),
        'subtleBackground': hex(p.soft),
        'foreground': hex(p.text),
        'iconBackground': hex(p.soft),
        'iconForeground': hex(p.link),
        'progressTrack': hex(p.soft),
        'progressFill': hex(p.accent),
      },
  };
  return ThemePalette.fromJson(json);
}
