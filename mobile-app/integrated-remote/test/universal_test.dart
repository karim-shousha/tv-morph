import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/core/build_info.dart';
import 'package:morph_remote/core/localization/app_localizations.dart';
import 'package:morph_remote/core/network/discovery_stats.dart';
import 'package:morph_remote/core/network/network_status.dart';
import 'package:morph_remote/core/network/ssdp_discovery.dart';
import 'package:morph_remote/core/network/sweep_discovery.dart';
import 'package:morph_remote/features/remote/remote_screen.dart';
import 'package:morph_remote/providers/mock_provider.dart';
import 'package:morph_remote/providers/registry.dart';
import 'package:morph_remote/providers/roku/roku_provider.dart';
import 'package:morph_remote/providers/sony/sony_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';
import 'package:morph_remote/services/app_state.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'test_helpers.dart';

/// Fake Roku ECP endpoint (loopback). Sanitized contract from the
/// developer.roku.com ECP reference.
class FakeRoku {
  final HttpServer server;
  final List<String> keypresses = [];
  final List<String> launches = [];
  final bool isTv;
  bool forbidKeys = false;
  FakeRoku(this.server, {this.isTv = true});
  int get port => server.port;

  static const deviceInfo = '''
<device-info>
  <udn>015e5108-9000-1046-8035-b0a737964fb</udn>
  <serial-number>1GU48T017973</serial-number>
  <vendor-name>Roku</vendor-name>
  <model-number>4800X</model-number>
  <model-name>Roku Ultra</model-name>
  <wifi-mac>b0:a7:37:96:4d:fb</wifi-mac>
  <network-type>wifi</network-type>
  <user-device-name>Living Room Roku</user-device-name>
  <software-version>14.1</software-version>
  <is-tv>@IS_TV@</is-tv>
</device-info>''';

  static const apps = '''
<apps>
  <app id="12" version="5.0">Netflix</app>
  <app id="837" version="3.1">YouTube</app>
</apps>''';

  static Future<FakeRoku> start({bool isTv = true}) async {
    final server = await HttpServer.bind('127.0.0.1', 0);
    final fake = FakeRoku(server, isTv: isTv);
    server.listen((req) async {
      try {
        final p = req.uri.path;
        if (req.method == 'GET' && p == '/query/device-info') {
          req.response.headers.contentType = ContentType.html;
          req.response.write(
            deviceInfo.replaceAll('@IS_TV@', isTv ? 'true' : 'false'),
          );
          await req.response.close();
        } else if (req.method == 'GET' && p == '/query/apps') {
          req.response.headers.contentType = ContentType.html;
          req.response.write(apps);
          await req.response.close();
        } else if (req.method == 'POST' && p.startsWith('/keypress/')) {
          if (fake.forbidKeys) {
            req.response.statusCode = 403;
            await req.response.close();
            return;
          }
          fake.keypresses.add(p.substring('/keypress/'.length));
          req.response.statusCode = 200;
          await req.response.close();
        } else if (req.method == 'POST' && p.startsWith('/launch/')) {
          fake.launches.add(p.substring('/launch/'.length));
          req.response.statusCode = 200;
          await req.response.close();
        } else {
          req.response.statusCode = 404;
          await req.response.close();
        }
      } catch (_) {}
    });
    return fake;
  }

  Future<void> stop() => server.close(force: true);
}

/// Fake Sony Bravia REST+IRCC endpoint. PSK '1234' accepted.
class FakeSony {
  final HttpServer server;
  final List<String> irccCodes = [];
  static const goodPsk = '1234';
  FakeSony(this.server);
  int get port => server.port;

  static Future<FakeSony> start() async {
    final server = await HttpServer.bind('127.0.0.1', 0);
    final fake = FakeSony(server);
    server.listen((req) async {
      try {
        final psk = req.headers.value('X-Auth-PSK');
        if (req.method == 'POST' && req.uri.path == '/sony/system') {
          final body = await utf8.decoder.bind(req).join();
          if (psk != goodPsk) {
            req.response.statusCode = 401;
            await req.response.close();
            return;
          }
          req.response.headers.contentType = ContentType.json;
          if (body.contains('getRemoteControllerInfo')) {
            req.response.write(
              jsonEncode({
                'result': [
                  {},
                  [
                    {'name': 'Up', 'value': 'RUNTIME-UP-CODE'},
                    {'name': 'Confirm', 'value': 'RUNTIME-OK-CODE'},
                    {'name': 'Netflix', 'value': 'RUNTIME-NETFLIX-CODE'},
                    {'name': 'Power', 'value': 'RUNTIME-POWER-CODE'},
                  ],
                ],
                'id': 1,
              }),
            );
          } else {
            req.response.write(
              jsonEncode({
                'result': [
                  {'model': 'BRAVIA-Test', 'name': 'Sony TV'},
                ],
                'id': 1,
              }),
            );
          }
          await req.response.close();
        } else if (req.method == 'POST' && req.uri.path == '/sony/IRCC') {
          if (psk != goodPsk) {
            req.response.statusCode = 401;
            await req.response.close();
            return;
          }
          final body = await utf8.decoder.bind(req).join();
          final m = RegExp(
            r'<IRCCCode>(.*?)</IRCCCode>',
            dotAll: true,
          ).firstMatch(body);
          fake.irccCodes.add(m?.group(1) ?? '');
          req.response.headers.contentType = ContentType(
            'text',
            'xml',
            charset: 'utf-8',
          );
          req.response.write('<s:Envelope/>');
          await req.response.close();
        } else {
          req.response.statusCode = 404;
          await req.response.close();
        }
      } catch (_) {}
    });
    return fake;
  }

  Future<void> stop() => server.close(force: true);
}

TvDevice dev(String ip, TvBrand b, TvProtocol p, {int port = 0}) => TvDevice(
  id: 't-$ip-${b.name}',
  name: '${brandLabel(b)} TV',
  brand: b,
  protocol: p,
  ip: ip,
  port: port,
);

void main() {
  group('Discovery signatures (platform, not branding)', () {
    test('Android TV sweep candidate uses native remote service port', () {
      final tv = SweepDiscovery.parseAndroidTvCandidate('192.168.1.50', 6467);
      expect(tv.brand, TvBrand.androidTv);
      expect(tv.protocol, TvProtocol.androidTvRemote);
      expect(tv.port, 6467);
      expect(tv.extras['service'], 'androidtvremote2');
    });

    test('roku:ecp ST + Location identify Roku', () {
      expect(
        SsdpDiscovery.identifyBrand({
          'st': 'roku:ecp',
          'usn': 'uuid:roku:ecp:P0A070000007',
          'location': 'http://192.168.1.50:8060/',
          'server': 'Roku UPnP/1.0',
        }),
        TvBrand.roku,
      );
      expect(SsdpDiscovery.searchTargets, contains('roku:ecp'));
    });

    test('Sony BRAVIA identifies as Sony', () {
      expect(
        SsdpDiscovery.identifyBrand(
          {'server': 'Sony/UPnP'},
          '<device><manufacturer>Sony Corporation</manufacturer>'
          '<modelName>BRAVIA VH2</modelName></device>',
        ),
        TvBrand.sony,
      );
    });

    test('Hisense VIDAA vs Hisense Android split by platform', () {
      expect(
        SsdpDiscovery.identifyBrand(
          {'server': 'Linux/UPnP'},
          '<device><manufacturer>Hisense</manufacturer>'
          '<modelName>VIDAA Smart TV</modelName></device>',
        ),
        TvBrand.vidaa,
      );
      // Bare Android UPnP markers (e.g. a phone DLNA server) are NOT
      // claimed as a TV: Hisense Android/Google TV sets are discovered
      // through the Android TV remote service (mDNS), not SSDP guessing.
      expect(
        SsdpDiscovery.identifyBrand(
          {'server': 'Android/UPnP'},
          '<device><manufacturer>Hisense</manufacturer><modelName>A6H</modelName>',
        ),
        TvBrand.unknown,
      );
    });

    test('Fire TV hardware is not claimed as generic Android', () {
      expect(
        SsdpDiscovery.identifyBrand(
          {'server': 'Amazon/FireOS'},
          '<device><manufacturer>Amazon</manufacturer>'
          '<modelName>AFTKA Fire TV Stick</modelName></device>',
        ),
        TvBrand.fireTv,
      );
    });

    test('Roku TV by TCL is Roku (platform wins)', () {
      final b = SsdpDiscovery.identifyBrand(
        {'st': 'roku:ecp', 'location': 'http://192.168.1.51:8060/'},
        '<device><manufacturer>TCL</manufacturer><modelName>55S455</modelName></device>',
      );
      expect(b, TvBrand.roku);
      expect(identifyPlatform({}, null).os, isNotEmpty);
    });

    test('rejectionReason filters non-TV, keeps known TVs', () {
      // Router.
      expect(
        SsdpDiscovery.rejectionReason(
          {'st': 'urn:schemas-upnp-org:device:InternetGatewayDevice:1'},
          null,
          TvBrand.unknown,
          'Router',
        ),
        isNotNull,
      );
      // Printer.
      expect(
        SsdpDiscovery.rejectionReason(
          {'st': 'urn:schemas-upnp-org:device:Printer:1'},
          null,
          TvBrand.unknown,
          'HP Printer',
        ),
        isNotNull,
      );
      // Bare media server with no TV identity.
      expect(
        SsdpDiscovery.rejectionReason(
          {'st': 'urn:schemas-upnp-org:device:MediaServer:1'},
          '<device><manufacturer>Acme</manufacturer></device>',
          TvBrand.unknown,
          'NAS',
        ),
        isNotNull,
      );
      // Known brands pass (even unsupported ones — shown honestly).
      expect(
        SsdpDiscovery.rejectionReason(
          {'st': 'roku:ecp'},
          null,
          TvBrand.roku,
          'Roku',
        ),
        isNull,
      );
      expect(
        SsdpDiscovery.rejectionReason(
          {'server': 'x'},
          null,
          TvBrand.vidaa,
          'VIDAA',
        ),
        isNull,
      );
      expect(
        SsdpDiscovery.rejectionReason(
          {'server': 'x'},
          null,
          TvBrand.sony,
          'Sony',
        ),
        isNull,
      );
    });
  });

  group('Stage instrumentation + build identity', () {
    test('stages are timestamped in order', () {
      final s = DiscoveryStats();
      s.stage('scan started');
      s.stage('ssdp: done');
      expect(s.stages.length, 2);
      expect(s.stages.first, startsWith('t+0ms'));
      expect(s.stages[1], startsWith('t+'));
      expect(s.summary(), contains('Stages:'));
    });

    test('build identity is displayable', () {
      expect(BuildInfo.short, contains('v0.8.273'));
      expect(BuildInfo.discoveryImpl, isNotEmpty);
      expect(BuildInfo.buildId, isNotEmpty);
    });

    test('interface pick prefers the NIC owning the Wi-Fi IP', () {
      final ifs = [
        ('rmnet0', ['10.20.0.5']),
        ('wlan0', ['10.0.0.64']),
        ('tun0', ['10.8.0.2']),
      ];
      expect(NetworkStatus.pickName(ifs, localIp: '10.0.0.64'), 'wlan0');
      // Unknown IP: falls back to wlan*, never VPN/mobile.
      expect(NetworkStatus.pickName(ifs, localIp: '192.168.9.9'), 'wlan0');
      expect(NetworkStatus.pickName(ifs), 'wlan0');
      // No wlan: first non-tunnel interface.
      expect(
        NetworkStatus.pickName([
          ('rmnet0', ['10.20.0.5']),
          ('eth0', ['10.0.0.9']),
        ]),
        'eth0',
      );
      // Nothing usable: null (caller logs none-found explicitly).
      expect(NetworkStatus.pickName([]), isNull);
      expect(
        NetworkStatus.pickName([
          ('tun0', ['10.8.0.2']),
        ]),
        isNull,
      );
      // Inventory is a single line for the report.
      expect(NetworkStatus.inventory(ifs), contains('wlan0[10.0.0.64]'));
    });
  });

  group('Registry: classification + selection', () {
    test('classifyDevice covers all six states', () {
      expect(
        classifyDevice(
          dev('1.1.1.1', TvBrand.samsung, TvProtocol.samsungTizenWs),
        ),
        DeviceClass.fullNative,
      );
      expect(
        classifyDevice(
          dev('1.1.1.2', TvBrand.samsung, TvProtocol.samsungLegacy),
        ),
        DeviceClass.partialNative,
      );
      expect(
        classifyDevice(dev('1.1.1.3', TvBrand.vidaa, TvProtocol.unknown)),
        DeviceClass.unsupported,
      );
      expect(
        classifyDevice(dev('1.1.1.4', TvBrand.fireTv, TvProtocol.unknown)),
        DeviceClass.unsupported,
      );
      expect(
        classifyDevice(dev('1.1.1.5', TvBrand.unknown, TvProtocol.unknown)),
        DeviceClass.nonTv,
      );
      expect(
        classifyDevice(dev('1.1.1.6', TvBrand.companion, TvProtocol.unknown)),
        DeviceClass.companionOnly,
      );
      expect(
        classifyDevice(dev('1.1.1.7', TvBrand.roku, TvProtocol.rokuEcp)),
        DeviceClass.fullNative,
      );
      expect(
        classifyDevice(dev('1.1.1.8', TvBrand.sony, TvProtocol.sonyIrcc)),
        DeviceClass.fullNative,
      );
    });

    test('describeDevice never claims control for unsupported', () {
      final v = describeDevice(
        dev('1.1.1.3', TvBrand.vidaa, TvProtocol.unknown),
      );
      expect(v, contains('VIDAA'));
      expect(v, isNot(contains('native remote')));
      final r = describeDevice(
        dev('1.1.1.7', TvBrand.roku, TvProtocol.rokuEcp),
      );
      expect(r, contains('Roku'));
    });

    test('provider registry documents pairing + commands honestly', () {
      expect(providerRegistry[TvProtocol.rokuEcp]!.pairing, PairingKind.none);
      expect(providerRegistry[TvProtocol.sonyIrcc]!.pairing, PairingKind.psk);
      expect(
        providerRegistry[TvProtocol.rokuEcp]!.commands,
        contains(TvKey.home),
      );
      expect(
        providerRegistry[TvProtocol.rokuEcp]!.commands,
        isNot(contains(TvKey.menu)),
      );
      expect(
        providerRegistry[TvProtocol.sonyIrcc]!.commands,
        contains(TvKey.power),
      );
    });

    test('mergeDevice: one card per TV, companion folds in', () {
      final a = dev('10.0.0.5', TvBrand.roku, TvProtocol.rokuEcp);
      final c = TvDevice(
        id: 'x',
        name: 'Morph',
        brand: TvBrand.companion,
        protocol: TvProtocol.unknown,
        ip: '10.0.0.5',
        port: 0,
      );
      var list = mergeDevice([], c);
      expect(list.length, 1);
      list = mergeDevice(list, a);
      expect(list.length, 1);
      expect(list.first.brand, TvBrand.roku);
      expect(list.first.extras['companion'], 'true');
      // Duplicate native collapsed.
      list = mergeDevice(list, a);
      expect(list.length, 1);
    });

    test(
      'Android TV remote card inherits the real Hisense name from Morph TV',
      () {
        final companion = TvDevice(
          id: 'hisense-companion',
          name: 'Hisense TV',
          brand: TvBrand.companion,
          protocol: TvProtocol.unknown,
          ip: '10.0.0.5',
          port: 8787,
        );
        final native = TvDevice(
          id: 'hisense-android',
          name: 'Android TV',
          brand: TvBrand.androidTv,
          protocol: TvProtocol.androidTvRemote,
          ip: '10.0.0.5',
          port: 6466,
        );
        final merged = mergeDevice([companion], native);
        expect(merged, hasLength(1));
        expect(merged.single.name, 'Hisense TV');
        expect(merged.single.brand, TvBrand.androidTv);
      },
    );
  });
}
