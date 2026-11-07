import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/core/network/ssdp_discovery.dart';
import 'package:morph_remote/core/network/wol.dart';
import 'package:morph_remote/providers/androidtv/android_tv_provider.dart';
import 'package:morph_remote/providers/androidtv/android_tv_protocol.dart';
import 'package:morph_remote/providers/lg/lg_provider.dart';
import 'package:morph_remote/providers/samsung/samsung_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';

void main() {
  group('SSDP parsing', () {
    test('parses headers case-insensitively', () {
      const raw =
          'HTTP/1.1 200 OK\r\nLOCATION: http://192.168.1.20:8008/ssdp/device.xml\r\nSERVER: Samsung/UPnP\r\nST: upnp:rootdevice\r\n\r\n';
      final h = SsdpDiscovery.parseHeaders(raw);
      expect(h['location'], contains('192.168.1.20'));
      expect(h['server'], contains('Samsung'));
    });

    test('identifies Samsung / LG / Android from headers', () {
      expect(
        SsdpDiscovery.identifyBrand({'server': 'Samsung SmartTV'}),
        TvBrand.samsung,
      );
      expect(
        SsdpDiscovery.identifyBrand({'server': 'LG WebOS TV'}),
        TvBrand.lg,
      );
      expect(
        SsdpDiscovery.identifyBrand({'usn': 'googlecast device'}),
        TvBrand.androidTv,
      );
      expect(
        SsdpDiscovery.identifyBrand({'server': 'Unknown Box'}),
        TvBrand.unknown,
      );
    });

    test('parses device XML without fabricating', () {
      const xml =
          '<root><device><manufacturer>Samsung Electronics</manufacturer>'
          '<modelName>UE55AU7100</modelName><friendlyName>[TV] Living Room</friendlyName></device></root>';
      final info = SsdpDiscovery.parseDeviceXml(xml);
      expect(info['manufacturer'], 'Samsung Electronics');
      expect(info['model'], 'UE55AU7100');
      expect(info['name'], '[TV] Living Room');
    });

    test('empty xml yields nulls, not fabricated strings', () {
      final info = SsdpDiscovery.parseDeviceXml('<root/>');
      expect(info['model'], isNull);
      expect(info['name'], isNull);
    });
  });

  group('Provider selection & capabilities', () {
    test('capabilities map per protocol', () {
      expect(
        TvCapabilities.forProtocol(TvProtocol.samsungTizenWs).numericKeys,
        isTrue,
      );
      expect(
        TvCapabilities.forProtocol(TvProtocol.androidTvRemote).numericKeys,
        isTrue,
      );
      expect(TvCapabilities.forProtocol(TvProtocol.lgWebOs).appLaunch, isTrue);
    });

    test('device JSON round-trip (saved devices)', () {
      const d = TvDevice(
        id: 'x',
        name: 'LG OLED',
        brand: TvBrand.lg,
        protocol: TvProtocol.lgWebOs,
        ip: '192.168.1.20',
        port: 3000,
      );
      final back = TvDevice.fromJson(d.toJson());
      expect(back, d);
      expect(back.ip, '192.168.1.20');
    });
  });

  group('Command serialization', () {
    test('Samsung key envelope shape', () {
      final s = SamsungProvider.encodeKeyCommand('KEY_HOME');
      expect(s, contains('ms.remote.control'));
      expect(s, contains('KEY_HOME'));
    });

    test('Samsung key map covers D-pad + volume + channels', () {
      for (final k in [
        TvKey.up,
        TvKey.down,
        TvKey.left,
        TvKey.right,
        TvKey.ok,
        TvKey.volumeUp,
        TvKey.volumeDown,
        TvKey.channelUp,
        TvKey.channelDown,
      ]) {
        expect(SamsungProvider.keyCodeFor(k), isNotNull, reason: '$k');
      }
    });

    test('LG register payload carries pairing type + manifest', () {
      final p = LgProvider.registerPayload();
      expect(p, contains('PROMPT'));
      expect(p, contains('com.morphremote.app'));
    });

    test('LG button encoding targets networkinput', () {
      expect(LgProvider.encodeButton('HOME'), contains('sendSpecialKey'));
    });

    test(
      'Android TV key uses protobuf varint length and RemoteMessage field 10',
      () {
        final f = AndroidTvProtocol.key(23);
        final remain = f.toList();
        final frames = AndroidTvProtocol.takeFrames(remain);
        expect(remain, isEmpty);
        expect(AndroidTvProtocol.bytesFields(frames.single, 10), hasLength(1));
        final key = AndroidTvProtocol.bytesFields(frames.single, 10).single;
        expect(AndroidTvProtocol.varintFields(key, 1), [23]);
        expect(AndroidTvProtocol.varintFields(key, 2), [3]);
      },
    );

    test('Android TV pairing envelope uses protocol v2 and service name', () {
      final payload = AndroidTvProtocol.pairingRequest('Morph Remote');
      expect(AndroidTvProtocol.varintFields(payload, 1), [2]);
      expect(AndroidTvProtocol.varintFields(payload, 2), [200]);
      final request = AndroidTvProtocol.bytesFields(payload, 10).single;
      expect(
        AndroidTvProtocol.bytesFields(request, 1).single,
        utf8.encode('atvremote'),
      );
      expect(
        AndroidTvProtocol.bytesFields(request, 2).single,
        utf8.encode('Morph Remote'),
      );
    });

    test('Android TV frame parser supports partial frames', () {
      final frame = AndroidTvProtocol.key(23);
      final partial = frame.sublist(0, frame.length - 1).toList();
      expect(AndroidTvProtocol.takeFrames(partial), isEmpty);
      partial.add(frame.last);
      expect(AndroidTvProtocol.takeFrames(partial), hasLength(1));
      expect(partial, isEmpty);
    });

    test('Android TV keycodes cover required set', () {
      for (final k in [
        TvKey.up,
        TvKey.ok,
        TvKey.back,
        TvKey.home,
        TvKey.volumeUp,
        TvKey.playPause,
      ]) {
        expect(AndroidTvProvider.keyCodeFor(k), isNotNull, reason: '$k');
      }
    });
  });

  group('Wake-on-LAN', () {
    test('magic packet is 102 bytes starting with 6xFF', () {
      final p = WakeOnLan.buildMagicPacket('AA:BB:CC:DD:EE:FF');
      expect(p.length, 102);
      expect(p.take(6), everyElement(0xFF));
    });
    test('invalid MAC throws', () {
      expect(() => WakeOnLan.buildMagicPacket('bad'), throwsFormatException);
    });
  });
}
