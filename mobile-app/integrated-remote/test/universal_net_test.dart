import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/core/network/ssdp_discovery.dart';
import 'package:morph_remote/core/network/sweep_discovery.dart';
import 'package:morph_remote/core/network/target_probe.dart';
import 'package:morph_remote/providers/dlna/dlna_provider.dart';
import 'package:morph_remote/providers/registry.dart';
import 'package:morph_remote/providers/roku/roku_provider.dart';
import 'package:morph_remote/providers/sony/sony_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';

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
          req.response.write(deviceInfo.replaceAll(
              '@IS_TV@', isTv ? 'true' : 'false'));
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
            req.response.write(jsonEncode({
              'result': [
                {},
                [
                  {'name': 'Up', 'value': 'RUNTIME-UP-CODE'},
                  {'name': 'Confirm', 'value': 'RUNTIME-OK-CODE'},
                  {'name': 'Netflix', 'value': 'RUNTIME-NETFLIX-CODE'},
                  {'name': 'Power', 'value': 'RUNTIME-POWER-CODE'},
                ]
              ],
              'id': 1
            }));
          } else {
            req.response.write(jsonEncode({
              'result': [
                {'model': 'BRAVIA-Test', 'name': 'Sony TV'}
              ],
              'id': 1
            }));
          }
          await req.response.close();
        } else if (req.method == 'POST' && req.uri.path == '/sony/IRCC') {
          if (psk != goodPsk) {
            req.response.statusCode = 401;
            await req.response.close();
            return;
          }
          final body = await utf8.decoder.bind(req).join();
          final m = RegExp(r'<IRCCCode>(.*?)</IRCCCode>', dotAll: true)
              .firstMatch(body);
          fake.irccCodes.add(m?.group(1) ?? '');
          req.response.headers.contentType =
              ContentType('text', 'xml', charset: 'utf-8');
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

/// Fake UPnP renderer (loopback): RenderingControl + AVTransport SOAP.
class FakeRenderer {
  final HttpServer server;
  int volume = 20;
  bool muted = false;
  String lastAvt = '';
  FakeRenderer(this.server);
  int get port => server.port;
  String get rcUrl => 'http://127.0.0.1:$port/rc';
  String get avtUrl => 'http://127.0.0.1:$port/avt';

  static String _tag(String body, String tag) =>
      RegExp('<$tag>(.*?)</$tag>', dotAll: true)
          .firstMatch(body)
          ?.group(1) ??
      '';

  static Future<FakeRenderer> start() async {
    final server = await HttpServer.bind('127.0.0.1', 0);
    final fake = FakeRenderer(server);
    server.listen((req) async {
      try {
        final body = await utf8.decoder.bind(req).join();
        final action = (req.headers.value('soapaction') ?? '')
            .split('#')
            .last
            .replaceAll('"', '');
        String reply = '';
        var code = 200;
        if (req.uri.path == '/rc') {
          if (action == 'GetVolume') {
            reply =
                '<s:Envelope><s:Body><u:GetVolumeResponse xmlns:u="x"><CurrentVolume>${fake.volume}</CurrentVolume></u:GetVolumeResponse></s:Body></s:Envelope>';
          } else if (action == 'SetVolume') {
            fake.volume = int.parse(_tag(body, 'DesiredVolume'));
            reply = '<s:Envelope><s:Body><u:SetVolumeResponse xmlns:u="x"/></s:Body></s:Envelope>';
          } else if (action == 'GetMute') {
            reply =
                '<s:Envelope><s:Body><u:GetMuteResponse xmlns:u="x"><CurrentMute>${fake.muted ? 1 : 0}</CurrentMute></u:GetMuteResponse></s:Body></s:Envelope>';
          } else if (action == 'SetMute') {
            fake.muted = _tag(body, 'DesiredMute') == '1';
            reply = '<s:Envelope><s:Body><u:SetMuteResponse xmlns:u="x"/></s:Body></s:Envelope>';
          } else {
            code = 500;
          }
        } else if (req.uri.path == '/avt') {
          if (['Play', 'Pause', 'Stop'].contains(action)) {
            fake.lastAvt = action;
            reply = '<s:Envelope><s:Body><u:${action}Response xmlns:u="x"/></s:Body></s:Envelope>';
          } else if (action == 'GetTransportInfo') {
            reply =
                '<s:Envelope><s:Body><u:GetTransportInfoResponse xmlns:u="x"><CurrentTransportState>STOPPED</CurrentTransportState></u:GetTransportInfoResponse></s:Body></s:Envelope>';
          } else {
            code = 500;
          }
        } else {
          code = 404;
        }
        req.response.statusCode = code;
        req.response.headers.contentType =
            ContentType('text', 'xml', charset: 'utf-8');
        req.response.write(reply);
        await req.response.close();
      } catch (_) {}
    });
    return fake;
  }

  Future<void> stop() => server.close(force: true);
}

void main() {
  group('Roku ECP provider (fake device)', () {
    test('connect verifies device-info; no pairing needed', () async {
      final tv = await FakeRoku.start();
      final p = RokuProvider(
          dev('127.0.0.1', TvBrand.roku, TvProtocol.rokuEcp, port: tv.port));
      try {
        await p.connect();
        expect(p.status, ConnectionStatus.connected);
        final r = await p.pair();
        expect(r.success, isTrue);
      } finally {
        await p.disconnect();
        await tv.stop();
      }
    });

    test('keys + apps + input over ECP', () async {
      final tv = await FakeRoku.start();
      final p = RokuProvider(
          dev('127.0.0.1', TvBrand.roku, TvProtocol.rokuEcp, port: tv.port));
      try {
        await p.connect();
        expect(await p.sendKey(TvKey.home), isTrue);
        expect(await p.sendKey(TvKey.up), isTrue);
        expect(await p.sendKey(TvKey.playPause), isTrue);
        expect(await p.sendKey(TvKey.search), isTrue);
        expect(tv.keypresses,
            containsAll(['Home', 'Up', 'Play', 'Search']));
        // Runtime app IDs, never hardcoded: Netflix -> 12.
        expect(await p.launchApp('netflix'), isTrue);
        expect(tv.launches, contains('12'));
        expect(await p.switchInput('hdmi1'), isTrue);
        expect(tv.keypresses, contains('InputHDMI1'));
        expect(await p.sendText('hi'), isTrue);
        expect(tv.keypresses.any((k) => k.startsWith('Lit_')), isTrue);
        expect(await p.powerOff(), isTrue);
        expect(await p.powerOn(), isFalse);
      } finally {
        await p.disconnect();
        await tv.stop();
      }
    });

    test('stick-class device (is-tv false) gates volume/power', () async {
      final tv = await FakeRoku.start(isTv: false);
      final p = RokuProvider(
          dev('127.0.0.1', TvBrand.roku, TvProtocol.rokuEcp, port: tv.port));
      try {
        await p.connect();
        expect(p.capabilities.volume, isFalse);
        expect(p.capabilities.powerOff, isFalse);
        expect(await p.sendKey(TvKey.volumeUp), isFalse);
        // D-pad still works on sticks.
        expect(await p.sendKey(TvKey.home), isTrue);
      } finally {
        await p.disconnect();
        await tv.stop();
      }
    });

    test('forbidden keypress surfaces failure, not fake success', () async {
      final tv = await FakeRoku.start();
      tv.forbidKeys = true;
      final p = RokuProvider(
          dev('127.0.0.1', TvBrand.roku, TvProtocol.rokuEcp, port: tv.port));
      try {
        await p.connect();
        expect(await p.sendKey(TvKey.home), isFalse);
      } finally {
        await p.disconnect();
        await tv.stop();
      }
    });
  });

  group('Sony IRCC provider (fake device)', () {
    test('401 without PSK proves endpoint; pair needs key', () async {
      final tv = await FakeSony.start();
      final p = SonyProvider(
          dev('127.0.0.1', TvBrand.sony, TvProtocol.sonyIrcc),
          testPorts: [tv.port]);
      try {
        final r = await p.pair();
        expect(r.success, isFalse);
        expect(r.state, PairingState.enteringPin);
      } finally {
        await p.disconnect();
        await tv.stop();
      }
    });

    test('wrong PSK denied; correct PSK pairs + runtime codes', () async {
      final tv = await FakeSony.start();
      final p = SonyProvider(
          dev('127.0.0.1', TvBrand.sony, TvProtocol.sonyIrcc),
          testPorts: [tv.port]);
      try {
        final bad = await p.pair(pin: 'nope');
        expect(bad.success, isFalse);
        expect(bad.state, PairingState.denied);
        final ok = await p.pair(pin: '1234');
        expect(ok.success, isTrue);
        expect(ok.clientKey, '1234');
        // Runtime map wins over the fallback table.
        expect(await p.sendKey(TvKey.up), isTrue);
        expect(tv.irccCodes.last, 'RUNTIME-UP-CODE');
        expect(await p.sendKey(TvKey.ok), isTrue);
        expect(tv.irccCodes.last, 'RUNTIME-OK-CODE');
        // Fallback table covers keys absent from the runtime map.
        expect(await p.sendKey(TvKey.volumeUp), isTrue);
        expect(tv.irccCodes.last, isNotEmpty);
        // Unsupported: no Search code anywhere.
        expect(await p.sendKey(TvKey.search), isFalse);
        // Per-model app codes only.
        expect(await p.launchApp('netflix'), isTrue);
        expect(tv.irccCodes.last, 'RUNTIME-NETFLIX-CODE');
        expect(await p.launchApp('prime'), isFalse);
        expect(await p.powerOff(), isTrue);
        expect(await p.powerOn(), isFalse);
      } finally {
        await p.disconnect();
        await tv.stop();
      }
    });

    test('reconnect replays stored PSK', () async {
      final tv = await FakeSony.start();
      SonyProvider? first;
      SonyProvider? second;
      try {
        first = SonyProvider(
            dev('127.0.0.1', TvBrand.sony, TvProtocol.sonyIrcc),
            testPorts: [tv.port]);
        expect((await first.pair(pin: '1234')).success, isTrue);
        await first.disconnect();
        first = null;
        second = SonyProvider(
            dev('127.0.0.1', TvBrand.sony, TvProtocol.sonyIrcc,
                port: tv.port),
            savedPsk: '1234',
            testPorts: [tv.port]);
        await second.connect();
        expect(second.status, ConnectionStatus.connected);
      } finally {
        await first?.disconnect();
        await second?.disconnect();
        await tv.stop();
      }
    });
  });

  group('Sweep Sony + parseSonyCandidate', () {
    test('only a Sony JSON-RPC identity creates a candidate', () {
      expect(SweepDiscovery.parseSonyCandidate(401, '', '10.0.0.9'), isNull);
      expect(SweepDiscovery.parseSonyCandidate(403, '', '10.0.0.9'), isNull);
      final d = SweepDiscovery.parseSonyCandidate(
          200, '{"result":[{"name":"Sony BRAVIA X90L"}]}', '10.0.0.9')!;
      expect(d.model, 'Sony BRAVIA X90L');
      expect(SweepDiscovery.parseSonyCandidate(
          200, '{"message":"generic web server"}', '10.0.0.9'), isNull);
      expect(SweepDiscovery.parseSonyCandidate(
          200, '{"result":[{"name":"Local service"}]}', '10.0.0.9'), isNull);
      expect(SweepDiscovery.parseSonyCandidate(404, '', '10.0.0.9'), isNull);
      expect(SweepDiscovery.parseSonyCandidate(-1, '', '10.0.0.9'), isNull);
    });
  });

  group('TargetProbe single-host', () {
    test('Roku fake is identified end to end', () async {
      final tv = await FakeRoku.start();
      try {
        final res = await TargetProbe.probeHost('127.0.0.1',
            rokuPort: tv.port, samsungPort: 1, sonyPort: 1);
        final roku = res.firstWhere((c) => c.label.startsWith('Roku'));
        expect(roku.ok, isTrue);
        expect(roku.detail, contains('Roku'));
        // Closed ports report closed, never crash.
        final lg = res.firstWhere((c) => c.label.startsWith('TCP 3000'));
        expect(lg.ok, isFalse);
      } finally {
        await tv.stop();
      }
    });

    test('Sony fake API presence is detected (401 counts)', () async {
      final tv = await FakeSony.start();
      try {
        final res = await TargetProbe.probeHost('127.0.0.1',
            sonyPort: tv.port, samsungPort: 1, rokuPort: 1);
        final sony = res.firstWhere((c) => c.label.startsWith('Sony'));
        expect(sony.ok, isTrue);
        expect(sony.detail, contains('401'));
      } finally {
        await tv.stop();
      }
    });

    test('unicast SSDP to a silent host returns empty, no crash', () async {
      final replies = await TargetProbe.unicastSsdp('127.0.0.1',
          window: const Duration(milliseconds: 300));
      expect(replies, isEmpty);
    });

    test('unicast SSDP parses a real reply', () async {
      // NOTE: port 19001, not 1900 — Windows owns 1900 system-wide.
      RawDatagramSocket? sock;
      try {
        sock = await RawDatagramSocket.bind(InternetAddress.loopbackIPv4, 19001);
      } catch (_) {
        return; // port busy in this environment — skip
      }
      try {
        sock.listen((_) {
          // Drain on ANY event: the datagram may already be pending when
          // the socket first signals writability.
          Datagram? d;
          do {
            d = sock!.receive();
            if (d == null) return;
            const reply = 'HTTP/1.1 200 OK\r\n'
                'ST: roku:ecp\r\n'
                'LOCATION: http://127.0.0.1:8060/\r\n'
                'SERVER: Roku UPnP/1.0\r\n\r\n';
            sock!.send(utf8.encode(reply), d.address, d.port);
          } while (d != null);
        });
        final replies =
            await TargetProbe.unicastSsdp('127.0.0.1', port: 19001);
        expect(replies, isNotEmpty);
        expect(replies.first['st'], 'roku:ecp');
      } finally {
        sock.close();
      }
    });
  });

  group('UPnP service URLs + DMR baseline', () {
    test('parseUpnpServices resolves relative control URLs', () {
      const xml = '<root><device>'
          '<service><serviceType>urn:schemas-upnp-org:service:RenderingControl:1</serviceType>'
          '<controlURL>/ctl/RC</controlURL></service>'
          '<service><serviceType>urn:schemas-upnp-org:service:AVTransport:1</serviceType>'
          '<controlURL>http://10.0.0.9:9999/avt</controlURL></service>'
          '</device></root>';
      final s = SsdpDiscovery.parseUpnpServices(
          xml, 'http://10.0.0.9:52323/dmr.xml');
      expect(s['renderingControl'], 'http://10.0.0.9:52323/ctl/RC');
      expect(s['avTransport'], 'http://10.0.0.9:9999/avt');
      expect(SsdpDiscovery.parseUpnpServices('<root/>', 'http://x/'), isEmpty);
    });

    test('handleReply creates a DMR baseline device for unknown brands',
        () async {
      final http = await HttpServer.bind('127.0.0.1', 0);
      const desc = '<root><device>'
          '<manufacturer>Acme</manufacturer>'
          '<modelName>SmartBox</modelName>'
          '<friendlyName>Living Box</friendlyName>'
          '<service><serviceType>urn:schemas-upnp-org:service:RenderingControl:1</serviceType>'
          '<controlURL>/rc</controlURL></service>'
          '</device></root>';
      http.listen((req) async {
        req.response.headers.contentType = ContentType.html;
        req.response.write(desc);
        await req.response.close();
      });
      try {
        final found = <String, TvDevice>{};
        await SsdpDiscovery.handleReply(
          headers: {
            'location': 'http://127.0.0.1:${http.port}/desc.xml',
            'server': 'Acme/UPnP',
            'st': 'urn:schemas-upnp-org:device:MediaRenderer:1',
          },
          ip: '127.0.0.1',
          found: found,
          seenLocations: <String>{},
        );
        expect(found.length, 1);
        final d = found.values.first;
        expect(d.protocol, TvProtocol.dlnaRenderer);
        expect(d.extras['rcUrl'], 'http://127.0.0.1:${http.port}/rc');
        expect(classifyDevice(d), DeviceClass.partialNative);
        expect(describeDevice(d), contains('basic control'));
      } finally {
        await http.close(force: true);
      }
    });

    test('handleReply prefers native over DMR on the same TV', () async {
      final http = await HttpServer.bind('127.0.0.1', 0);
      const desc = '<root><device>'
          '<manufacturer>Samsung Electronics</manufacturer>'
          '<modelName>UE55</modelName>'
          '<service><serviceType>urn:schemas-upnp-org:service:RenderingControl:1</serviceType>'
          '<controlURL>/rc</controlURL></service>'
          '</device></root>';
      http.listen((req) async {
        req.response.headers.contentType = ContentType.html;
        req.response.write(desc);
        await req.response.close();
      });
      try {
        final found = <String, TvDevice>{};
        await SsdpDiscovery.handleReply(
          headers: {
            'location': 'http://127.0.0.1:${http.port}/dmr.xml',
            'server': 'Samsung UPnP',
          },
          ip: '127.0.0.1',
          found: found,
          seenLocations: <String>{},
        );
        expect(found.length, 1);
        expect(found.values.first.protocol, TvProtocol.samsungTizenWs);
      } finally {
        await http.close(force: true);
      }
    });

    test('mergeDevice: native supersedes DMR on the same IP', () {
      final dlna = TvDevice(
          id: 'x', name: 'TV', brand: TvBrand.vidaa,
          protocol: TvProtocol.dlnaRenderer, ip: '10.0.0.9', port: 0,
          extras: const {'rcUrl': 'http://10.0.0.9/rc'});
      var list = mergeDevice([], dlna);
      expect(list.length, 1);
      final native = dev('10.0.0.9', TvBrand.samsung,
          TvProtocol.samsungTizenWs);
      list = mergeDevice(list, native);
      expect(list.length, 1);
      expect(list.first.protocol, TvProtocol.samsungTizenWs);
      // And a DMR arriving after native is dropped.
      list = mergeDevice(list, dlna);
      expect(list.length, 1);
      expect(list.first.protocol, TvProtocol.samsungTizenWs);
    });
  });

  group('DlnaProvider against a fake renderer (loopback)', () {
    test('verify + volume + mute + transport', () async {
      final tv = await FakeRenderer.start();
      final d = TvDevice(
        id: 't', name: 'TV', brand: TvBrand.unknown,
        protocol: TvProtocol.dlnaRenderer, ip: '127.0.0.1', port: 0,
        extras: {'rcUrl': tv.rcUrl, 'avtUrl': tv.avtUrl},
      );
      final p = DlnaProvider(d);
      try {
        await p.connect();
        expect(p.status, ConnectionStatus.connected);
        final r = await p.pair();
        expect(r.success, isTrue);
        tv.volume = 20;
        expect(await p.sendKey(TvKey.volumeUp), isTrue);
        expect(tv.volume, 23);
        expect(await p.sendKey(TvKey.volumeDown), isTrue);
        expect(tv.volume, 20);
        expect(await p.sendKey(TvKey.mute), isTrue);
        expect(tv.muted, isTrue);
        expect(await p.sendKey(TvKey.mute), isTrue);
        expect(tv.muted, isFalse);
        expect(await p.sendKey(TvKey.play), isTrue);
        expect(tv.lastAvt, 'Play');
        expect(await p.sendKey(TvKey.pause), isTrue);
        expect(await p.sendKey(TvKey.stop), isTrue);
        // No D-pad/home/digits/search/power over UPnP.
        expect(await p.sendKey(TvKey.up), isFalse);
        expect(await p.sendKey(TvKey.home), isFalse);
        expect(await p.sendKey(TvKey.digit1), isFalse);
        expect(await p.sendKey(TvKey.search), isFalse);
        expect(await p.powerOff(), isFalse);
        expect(await p.powerOn(), isFalse);
        final caps = p.capabilities;
        expect(caps.volume && caps.mute && caps.mediaPlayback, isTrue);
        expect(caps.dpad || caps.home || caps.search || caps.powerOff,
            isFalse);
      } finally {
        await p.disconnect();
        await tv.stop();
      }
    });

    test('verify fails honestly on a dead renderer URL', () async {
      final d = TvDevice(
        id: 't', name: 'TV', brand: TvBrand.unknown,
        protocol: TvProtocol.dlnaRenderer, ip: '127.0.0.1', port: 0,
        extras: const {'rcUrl': 'http://127.0.0.1:9/rc'},
      );
      final p = DlnaProvider(d);
      final r = await p.pair();
      expect(r.success, isFalse);
    });
  });
}
