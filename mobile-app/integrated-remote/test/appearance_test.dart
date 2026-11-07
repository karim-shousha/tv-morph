import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/app/app.dart';
import 'package:morph_remote/core/theme/morph_colors.dart';
import 'package:morph_remote/features/discovery/discovery_screen.dart';
import 'package:morph_remote/providers/mock_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';
import 'package:morph_remote/services/app_state.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'test_helpers.dart';

void main() {
  for (final mode in ['dark']) {
    for (final language in ['ar', 'en']) {
      testWidgets(
        'All remote pages: $mode / $language / compact and regular phones',
        (t) async {
          mockConnectivity();
          SharedPreferences.setMockInitialValues({});
          DiscoveryScreen.disableAutoScan = true;
          final state = AppState();
          await state.init();
          state.themeMode = mode;
          state.localeCode = language;
          const tv = TvDevice(
            id: 'theme-fixture',
            name: 'Living room TV',
            brand: TvBrand.samsung,
            protocol: TvProtocol.samsungTizenWs,
            ip: '192.0.2.10',
            port: 8002,
          );
          state.selected = tv;
          state.provider = MockTvProvider(tv);
          state.connStatus = ConnectionStatus.connected;
          state.discovered = [tv];
          state.scanning = false;
          addTearDown(() {
            t.view.resetPhysicalSize();
            t.view.resetDevicePixelRatio();
            state.dispose();
            DiscoveryScreen.disableAutoScan = false;
          });
          t.view.devicePixelRatio = 1;
          t.view.physicalSize = const Size(390, 844);
          await t.pumpWidget(MorphApp(state: state));
          await t.pump(const Duration(milliseconds: 500));
          expect(MorphColors.light, mode == 'light');
          expect(
            t.getRect(find.byKey(const ValueKey('host-back-button'))).left,
            lessThan(40),
            reason: 'Back remains in its English position in both locales',
          );
          double contrast(Color a, Color b) {
            final x = a.computeLuminance(), y = b.computeLuminance();
            return ((x > y ? x : y) + .05) / ((x < y ? x : y) + .05);
          }

          final surface = mode == 'light'
              ? Colors.white
              : const Color(0xFF3A4A68);
          expect(contrast(MorphColors.textPrimary, surface), greaterThan(7));
          expect(
            contrast(MorphColors.textSecondary, surface),
            greaterThanOrEqualTo(4.5),
          );
          expect(contrast(MorphColors.cyan, surface), greaterThanOrEqualTo(3));
          for (final route in [
            '/',
            '/discovery',
            '/devices',
            '/settings',
            '/troubleshooting',
            '/remote',
            '/pairing',
          ]) {
            final nav = state.navigatorKey.currentState!;
            nav.pushNamed(
              route,
              arguments: route == '/pairing'
                  ? const TvDevice(
                      id: 'code-fixture',
                      name: 'Bedroom TV',
                      brand: TvBrand.sony,
                      protocol: TvProtocol.sonyIrcc,
                      ip: '192.0.2.11',
                      port: 80,
                    )
                  : null,
            );
            await t.pump(const Duration(milliseconds: 500));
            for (final width in [320.0, 390.0, 600.0]) {
              t.view.physicalSize = Size(width, 844);
              await t.pump(const Duration(milliseconds: 500));
              expect(t.takeException(), isNull, reason: '$route $width');
              t.platformDispatcher.textScaleFactorTestValue = 2;
              await t.pump(const Duration(milliseconds: 500));
              expect(
                t.takeException(),
                isNull,
                reason: '200% text $route $width',
              );
              t.platformDispatcher.clearTextScaleFactorTestValue();
              await t.pump(const Duration(milliseconds: 500));
            }
            if (route == '/remote') {
              t.view.physicalSize = const Size(390, 844);
              await t.pump(const Duration(milliseconds: 500));
              await t.tap(find.byTooltip(language == 'ar' ? 'أدوات التحكم' : 'More controls'));
              await t.pumpAndSettle();
              final toggle = find.byKey(const ValueKey('playback-toggle'));
              await t.ensureVisible(toggle);
              await t.tap(toggle);
              await t.pump(const Duration(milliseconds: 200));
              expect(
                find.descendant(
                  of: toggle,
                  matching: find.byIcon(Icons.pause_rounded),
                ),
                findsOneWidget,
              );
              await t.tap(toggle);
              await t.pump(const Duration(milliseconds: 200));
              expect(
                find.descendant(
                  of: toggle,
                  matching: find.byIcon(Icons.play_arrow_rounded),
                ),
                findsOneWidget,
              );
              expect(
                (state.provider as MockTvProvider).sentKeys
                    .where((k) => k == TvKey.playPause)
                    .length,
                2,
              );
              await t.tap(find.byIcon(Icons.keyboard_outlined));
              await t.pump(const Duration(milliseconds: 500));
              expect(find.byType(AlertDialog), findsNothing);
              expect(t.takeException(), isNull);
              nav.pop(); await t.pumpAndSettle();
              await t.tap(find.byIcon(Icons.dialpad_rounded));
              await t.pump(const Duration(milliseconds: 500));
              expect(find.text('1'), findsOneWidget);
              expect(t.takeException(), isNull);
              nav.pop();
              await t.pump(const Duration(milliseconds: 500));
            }
            nav.pop();
            await t.pump(const Duration(milliseconds: 500));
          }
          await t.pumpWidget(const SizedBox());
        },
      );
    }
  }
}
