import '../core/widgets/phone_navigation.dart';
import '../core/theme/phone_system_bars.dart';
import '../core/theme/phone_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/localization/app_localizations.dart';
import '../core/theme/morph_theme.dart';
import '../core/theme/morph_colors.dart';
import '../core/widgets/morph_widgets.dart';
import '../features/devices/devices_screen.dart';
import '../features/discovery/discovery_screen.dart';
import '../features/onboarding/welcome_screen.dart';
import '../features/pairing/pairing_screen.dart';
import '../features/remote/remote_screen.dart';
import '../features/settings/settings_screen.dart';
import '../services/app_state.dart';
import '../providers/tv_models.dart';

class MorphApp extends StatelessWidget {
  final AppState state;
  final String initialRoute;
  const MorphApp({super.key, required this.state, this.initialRoute = '/'});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: state,
      child: Consumer<AppState>(
        builder: (_, app, __) => MorphLocalizations(
          strings: MorphStrings(Locale(app.localeCode)),
          child: Builder(
            builder: (ctx) {
              final strings = MorphLocalizations.of(ctx);
              return MaterialApp(
                title: 'Morph Remote',
                navigatorKey: app.navigatorKey,
                navigatorObservers: [_HostRouteObserver(app)],
                debugShowCheckedModeBanner: false,
                theme: buildMorphTheme(light: app.themeMode != 'dark'),
                themeMode: app.themeMode == 'dark'
                    ? ThemeMode.dark
                    : ThemeMode.light,
                locale: Locale(app.localeCode),
                supportedLocales: const [Locale('en'), Locale('ar')],
                localizationsDelegates: const [
                  GlobalMaterialLocalizations.delegate,
                  GlobalWidgetsLocalizations.delegate,
                  GlobalCupertinoLocalizations.delegate,
                ],
                initialRoute: initialRoute,
                onGenerateInitialRoutes: initialRoute == '/remote'
                    ? (_) => [
                        MaterialPageRoute<void>(
                          settings: const RouteSettings(name: '/remote'),
                          builder: (_) => const RemoteScreen(),
                        ),
                      ]
                    : null,
                routes: {
                  '/': (_) => const WelcomeScreen(),
                  '/discovery': (_) => const DiscoveryScreen(),
                  '/pairing': (_) => const PairingScreen(),
                  '/remote': (_) => const RemoteScreen(),
                  '/devices': (_) => const DevicesScreen(),
                  '/settings': (_) => const SettingsScreen(),
                  '/troubleshooting': (_) => const TroubleshootingScreen(),
                },
                builder: (context, child) => phoneSystemBars(
                  app.themeMode == 'dark',
                  Directionality(
                    textDirection: TextDirection.ltr,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: PhoneDesignTokens.palette(
                          app.themeMode == 'dark',
                        ).background,
                      ),
                      child: Stack(
                        children: [
                          Padding(
                            padding: EdgeInsets.only(
                              top:
                                  MediaQuery.paddingOf(context).top +
                                  PhoneDesignTokens.headerHeight,
                              bottom: 82 + MediaQuery.paddingOf(context).bottom,
                            ),
                            child: MediaQuery.removePadding(
                              context: context,
                              removeTop: true,
                              child: child!,
                            ),
                          ),
                          Positioned(
                            top: 0,
                            left: 0,
                            right: 0,
                            child: Material(
                              color: Colors.transparent,
                              child: SafeArea(
                                bottom: false,
                                child: SizedBox(
                                  height: PhoneDesignTokens.headerHeight,
                                  child: Row(
                                    textDirection: TextDirection.ltr,
                                    children: [
                                      Expanded(
                                        child: Align(
                                          alignment: Alignment.centerLeft,
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 16,
                                              vertical: 3,
                                            ),
                                            child: IconButton(
                                              key: const ValueKey(
                                                'host-back-button',
                                              ),
                                              onPressed: () {
                                                final navigator = app
                                                    .navigatorKey
                                                    .currentState;
                                                if (navigator != null &&
                                                    navigator.canPop()) {
                                                  navigator.pop();
                                                  return;
                                                }
                                                const MethodChannel(
                                                  'morph_tv/host',
                                                ).invokeMethod('close');
                                              },

                                              style: IconButton.styleFrom(
                                                foregroundColor:
                                                    MorphColors.textPrimary,
                                                minimumSize: const Size(44, 48),
                                                maximumSize: const Size(44, 48),
                                                padding: EdgeInsets.zero,
                                                backgroundColor:
                                                    Colors.transparent,
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(12),
                                                ),
                                              ),
                                              icon: Icon(
                                                Icons.chevron_left_rounded,
                                                semanticLabel: strings.isArabic
                                                    ? 'رجوع'
                                                    : 'Back',
                                                size: 18,
                                                textDirection:
                                                    TextDirection.ltr,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                      if (app.visibleRoute == '/remote') ...[
                                        IconButton(
                                          style: IconButton.styleFrom(
                                            backgroundColor: Colors.transparent,
                                          ),
                                          key: const ValueKey(
                                            'host-remote-power',
                                          ),
                                          onPressed:
                                              app.connStatus ==
                                                  ConnectionStatus.connected
                                              ? () => app.sendRemoteAction(
                                                  (provider) => provider
                                                      .sendKey(TvKey.power),
                                                )
                                              : null,
                                          icon: Icon(
                                            Icons.power_settings_new_rounded,
                                            semanticLabel: strings.isArabic
                                                ? 'الطاقة'
                                                : 'Power',
                                            color: const Color(0xFFFF5555),
                                            size: 22,
                                          ),
                                        ),
                                        IconButton(
                                          style: IconButton.styleFrom(
                                            backgroundColor: Colors.transparent,
                                          ),
                                          key: const ValueKey(
                                            'host-remote-settings',
                                          ),
                                          onPressed: () => app
                                              .navigatorKey
                                              .currentState
                                              ?.pushNamed('/settings'),
                                          icon: Icon(
                                            Icons.settings_rounded,
                                            semanticLabel: strings.isArabic
                                                ? 'الإعدادات'
                                                : 'Settings',
                                            color: MorphColors.textPrimary,
                                            size: 19,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Positioned(
                            top: MediaQuery.paddingOf(context).top,
                            left: 60,
                            width: PhoneDesignTokens.logoWidth,
                            child: const IgnorePointer(
                              child: SizedBox(
                                height: PhoneDesignTokens.headerHeight,
                                child: Center(
                                  child: SizedBox(
                                    width: PhoneDesignTokens.logoWidth,
                                    height: PhoneDesignTokens.logoHeight,
                                    child: FittedBox(
                                      fit: BoxFit.contain,
                                      child: MorphLogo(size: 44),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            left: 0,
                            right: 0,
                            child: PhoneNavigation(
                              dark: app.themeMode == 'dark',
                              arabic: strings.isArabic,
                              active: 'control',
                              onSelect: (page) async {
                                if (page == 'control') return;
                                try {
                                  await const MethodChannel(
                                    'morph_tv/host',
                                  ).invokeMethod('navigate', {'page': page});
                                } on MissingPluginException {
                                  /* Browser/widget preview. */
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _HostRouteObserver extends NavigatorObserver {
  final AppState app;
  _HostRouteObserver(this.app);
  void update(Route<dynamic>? route) {
    final name = route?.settings.name ?? '/';
    WidgetsBinding.instance.addPostFrameCallback((_) {
      app.showRoute(name);
    });
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      update(route);
  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      update(previousRoute);
  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) =>
      update(newRoute);
}
