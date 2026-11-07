import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/app/app.dart';
import 'package:morph_remote/core/theme/morph_colors.dart';
import 'package:morph_remote/core/network/network_status.dart';
import 'package:morph_remote/features/discovery/discovery_screen.dart';
import 'package:morph_remote/providers/mock_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';
import 'package:morph_remote/services/app_state.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(() async {
    // Real glyphs make these actual Flutter views useful as visual previews.
    for (final entry in {
      'Roboto': 'C:/Windows/Fonts/segoeui.ttf',
      'MorphSans': 'assets/fonts/morph-sans-400.ttf',
      'MaterialIcons':
          'C:/flutter/src/Flutter/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf',
    }.entries) {
      final loader = FontLoader(entry.key);
      loader.addFont(
        Future.value(
          ByteData.sublistView(await File(entry.value).readAsBytes()),
        ),
      );
      await loader.load();
    }
  });
  for (final language in ['en', 'ar']) {
    testWidgets(
      'Discovery $language: localized progress, icon direction and scan stop',
      (tester) async {
        final previousShadows = debugDisableShadows;
        debugDisableShadows = false;
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = const Size(390, 844);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        DiscoveryScreen.disableAutoScan = true;
        const tv = TvDevice(
          id: 'discovery-fixture',
          name: 'Living room TV',
          brand: TvBrand.androidTv,
          protocol: TvProtocol.androidTvRemote,
          ip: '192.0.2.10',
          port: 6466,
          model: '50A6QU',
        );
        final state = AppState()
          ..localeCode = language
          ..themeMode = 'dark'
          ..net = const NetworkStatus(wifi: true)
          ..discovered = [tv]
          ..scanning = true;
        final boundary = GlobalKey();
        await tester.pumpWidget(
          RepaintBoundary(
            key: boundary,
            child: MorphApp(state: state),
          ),
        );
        await tester.pump(const Duration(milliseconds: 300));
        tester
            .state<NavigatorState>(find.byType(Navigator).first)
            .pushNamed('/discovery');
        await tester.pump(const Duration(milliseconds: 400));
        await tester.runAsync(
          () => precacheImage(
            const AssetImage('assets/morph-wordmark-hq.webp'),
            tester.element(find.byType(Navigator).first),
          ),
        );
        await tester.pump();
        expect(
          find.textContaining(
            language == 'ar' ? 'البحث مستمر' : 'still searching',
          ),
          findsOneWidget,
        );
        expect(find.textContaining('TLS'), findsNothing);
        await tester.tap(find.text(language == 'ar' ? 'إيقاف' : 'Stop'));
        await tester.pumpAndSettle();
        expect(state.scanning, isFalse);
        expect(
          find.text(language == 'ar' ? 'إعادة الفحص' : 'Scan Again'),
          findsOneWidget,
        );
        final button = tester.getRect(
          find.text(language == 'ar' ? 'إعادة الفحص' : 'Scan Again'),
        );
        expect(button.bottom, lessThan(844 - 28));
        await expectLater(
          find.byKey(boundary),
          matchesGoldenFile(
            File(
              '${Directory.current.parent.parent.path}/output/ui-redesign/remote-discovery-dark-$language.png',
            ).uri,
          ),
        );
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox());
        state.dispose();
        DiscoveryScreen.disableAutoScan = false;
        debugDisableShadows = previousShadows;
      },
    );
    testWidgets(
      'Pearl remote $language: layout, navigation commands, disabled state',
      (tester) async {
        bool hostClosed = false;
        tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
          const MethodChannel('morph_tv/host'),
          (call) async {
            if (call.method == 'close') hostClosed = true;
            return null;
          },
        );
        addTearDown(
          () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
            const MethodChannel('morph_tv/host'),
            null,
          ),
        );
        final previousShadows = debugDisableShadows;
        debugDisableShadows = false;
        addTearDown(() => debugDisableShadows = previousShadows);
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = const Size(390, 844);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        const tv = TvDevice(
          id: 'ui-fixture',
          name: 'Living room TV',
          brand: TvBrand.samsung,
          protocol: TvProtocol.samsungTizenWs,
          ip: '192.0.2.10',
          port: 8002,
        );
        final provider = MockTvProvider(tv);
        final state = AppState()
          ..selected = tv
          ..provider = provider
          ..connStatus = ConnectionStatus.connected
          ..localeCode = language
          ..themeMode = 'dark'
          ..haptics = false;
        final boundary = GlobalKey();
        await tester.pumpWidget(
          RepaintBoundary(
            key: boundary,
            child: MorphApp(state: state),
          ),
        );
        await tester.pump(const Duration(milliseconds: 300));
        tester
            .state<NavigatorState>(find.byType(Navigator).first)
            .pushNamed('/remote');
        await tester.pumpAndSettle();
        await tester.runAsync(
          () => precacheImage(
            const AssetImage('assets/morph-wordmark-hq.webp'),
            tester.element(find.byType(Navigator).first),
          ),
        );
        await tester.pump();
        expect(tester.takeException(), isNull);
        expect(MorphColors.light, isFalse);
        expect(find.text('OK'), findsOneWidget);
        final hostBack = find.byKey(const ValueKey('host-back-button'));
        expect(tester.getRect(hostBack).height, inInclusiveRange(44, 48));
        final output = File(
          '${Directory.current.parent.parent.path}/output/ui-redesign/remote-navy-$language.png',
        );
        await expectLater(find.byKey(boundary), matchesGoldenFile(output.uri));
        await tester.tap(find.text('OK'));
        await tester.pumpAndSettle();
        expect(provider.sentKeys.last, TvKey.ok);
        await tester.tap(find.byIcon(Icons.keyboard_arrow_left_rounded));
        await tester.pumpAndSettle();
        expect(provider.sentKeys.last, TvKey.left);
        await tester.tap(find.byIcon(Icons.volume_off_rounded));
        await tester.pumpAndSettle();
        expect(provider.sentKeys.last, TvKey.mute);
        for (final width in [320.0, 390.0, 600.0]) {
          tester.view.physicalSize = Size(width, 844);
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
        }
        state.connStatus = ConnectionStatus.disconnected;
        state.notifyListeners();
        await tester.pumpAndSettle();
        final before = provider.sentKeys.length;
        await tester.tap(find.text('OK'));
        await tester.pumpAndSettle();
        expect(provider.sentKeys.length, before);
        expect(tester.takeException(), isNull);
        await tester.tap(hostBack);
        await tester.pumpAndSettle();
        expect(hostClosed, isTrue);
        await tester.pumpWidget(const SizedBox());
        state.dispose();
        provider.dispose();
        debugDisableShadows = previousShadows;
      },
    );
  }
}
