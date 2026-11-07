import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:morph_remote/core/localization/app_localizations.dart';
import 'package:morph_remote/core/network/discovery_stats.dart';
import 'package:morph_remote/core/network/ssdp_discovery.dart';
import 'package:morph_remote/features/settings/settings_screen.dart';
import 'package:morph_remote/providers/androidtv/android_tv_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';
import 'package:morph_remote/services/app_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'test_helpers.dart';

TvDevice dev(String ip, TvBrand b, String name) => TvDevice(
  id: 't-$ip',
  name: name,
  brand: b,
  protocol: TvProtocol.unknown,
  ip: ip,
  port: 0,
);

void main() {
  group('SSDP search targets', () {
    test('covers vendor-specific STs, not only upnp:rootdevice', () {
      expect(SsdpDiscovery.searchTargets, contains('ssdp:all'));
      expect(
        SsdpDiscovery.searchTargets,
        contains('urn:samsung.com:device:RemoteControlReceiver:1'),
      );
      expect(
        SsdpDiscovery.searchTargets,
        contains('urn:lge.com:service:webos-second-screen:1'),
      );
      expect(SsdpDiscovery.searchTargets.length, greaterThan(2));
    });

    test('M-SEARCH format has HOST/MAN/MX/ST', () {
      final m = SsdpDiscovery.buildMSearch('ssdp:all');
      expect(m, startsWith('M-SEARCH * HTTP/1.1'));
      expect(m, contains('HOST: 239.255.255.250:1900'));
      expect(m, contains('ST: ssdp:all'));
      expect(m, contains('MX:'));
    });
  });

  group('Device classification', () {
    test('LG SmartShare / NetCast keywords', () {
      expect(SsdpDiscovery.identifyBrand({'server': 'SmartShare'}), TvBrand.lg);
      expect(
        SsdpDiscovery.identifyBrand({'server': 'LG Smart TV'}),
        TvBrand.lg,
      );
    });

    test('DIAL / Cast sticks map to Android TV', () {
      expect(
        SsdpDiscovery.identifyBrand({
          'st': 'urn:dial-multiscreen-org:service:dial:1',
        }),
        TvBrand.androidTv,
      );
      expect(
        SsdpDiscovery.identifyBrand({'server': 'Chromecast'}),
        TvBrand.androidTv,
      );
    });

    test('printers / gateways stay unknown', () {
      expect(
        SsdpDiscovery.identifyBrand({
          'server': 'HP Printer',
          'st': 'urn:schemas-upnp-org:device:Printer:1',
        }),
        TvBrand.unknown,
      );
    });

    test('Samsung via USN even with generic server', () {
      expect(
        SsdpDiscovery.identifyBrand({
          'server': 'SHP, UPnP/1.0',
          'usn': 'uuid:...::urn:samsung.com:device:RemoteControlReceiver:1',
        }),
        TvBrand.samsung,
      );
    });
  });

  group('Discovery stats + cancel', () {
    test('rejections logged with reasons, summary has no secrets', () {
      final s = DiscoveryStats()
        ..ssdpProbesSent = 6
        ..ssdpResponses = 3
        ..reject('192.168.1.5', 'brand not recognized');
      final out = s.summary();
      expect(out, contains('SSDP probes sent: 6'));
      expect(out, contains('192.168.1.5'));
      expect(out, isNot(contains('client-key')));
      expect(out, isNot(contains('token')));
    });

    test('cancel flag flips', () {
      final c = DiscoveryCancel();
      expect(c.isCancelled, isFalse);
      c.cancel();
      expect(c.isCancelled, isTrue);
    });
  });

  group('Pairing validation (no network)', () {
    test('Android TV rejects a short PIN before any socket', () async {
      final p = AndroidTvProvider(dev('192.168.1.9', TvBrand.androidTv, 'ATV'));
      final r = await p.pair(pin: '123');
      expect(r.success, isFalse);
      expect(r.state, PairingState.enteringPin);
    });
  });

  group('Saved-device persistence', () {
    test('upsert/load/remove round-trip', () async {
      mockConnectivity();
      SharedPreferences.setMockInitialValues({});
      final state = AppState();
      await state.init();
      final d = dev('192.168.1.20', TvBrand.lg, 'LG OLED');
      await state.repo.upsert(d);
      var all = await state.repo.load();
      expect(all.any((e) => e.ip == '192.168.1.20'), isTrue);
      await state.forget(d.id);
      all = await state.repo.load();
      expect(all.any((e) => e.ip == '192.168.1.20'), isFalse);
    });
  });

  group('Diagnostics screen', () {
    testWidgets('renders report + manual IP + steps', (t) async {
      mockConnectivity();
      SharedPreferences.setMockInitialValues({});
      final state = AppState();
      await state.init();
      await t.pumpWidget(
        ChangeNotifierProvider<AppState>.value(
          value: state,
          child: const _LocalizedTroubleshoot(),
        ),
      );
      await t.pump();
      expect(find.text('Last scan report'), findsOneWidget);
      expect(find.text('Run scan again'), findsOneWidget);
      // Manual IP card builds lazily — scroll to it first.
      await t.scrollUntilVisible(
        find.text('Connect Manually'),
        300,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.byType(TextField), findsOneWidget); // manual IP field
      expect(find.textContaining('Probe this IP'), findsOneWidget);
      // Scroll to the troubleshooting steps (ListView builds lazily).
      await t.scrollUntilVisible(
        find.textContaining('SAME Wi-Fi'),
        300,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.textContaining('SAME Wi-Fi'), findsOneWidget);
    });
  });
}

/// Wraps TroubleshootingScreen with the app's localization ancestor.
class _LocalizedTroubleshoot extends StatelessWidget {
  const _LocalizedTroubleshoot();
  @override
  Widget build(BuildContext context) {
    return MorphLocalizations(
      strings: const MorphStrings(Locale('en')),
      child: Builder(
        builder: (ctx) {
          final s = MorphLocalizations.of(ctx);
          return MaterialApp(
            home: Directionality(
              textDirection: s.textDirection,
              child: const TroubleshootingScreen(),
            ),
          );
        },
      ),
    );
  }
}
