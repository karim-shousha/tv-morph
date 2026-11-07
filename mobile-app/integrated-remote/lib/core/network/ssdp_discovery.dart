import 'dart:async';
import 'dart:convert';
import 'dart:io';
import '../../providers/tv_models.dart';
import 'discovery_stats.dart';
import 'network_status.dart';

/// SSDP / UPnP discovery.
///
/// Fixes vs the naive implementation:
///  - sends MULTIPLE search targets (some Samsung/LG sets only answer
///    their own ST or ssdp:all, not upnp:rootdevice),
///  - repeats probes during the window (MX delays responses),
///  - pins multicast TX to the Wi-Fi interface,
///  - accepts both M-SEARCH responses and NOTIFY alives,
///  - reports per-candidate accept/reject reasons into [DiscoveryStats],
///  - supports cooperative cancellation.
class SsdpDiscovery {
  static const _multicast = '239.255.255.250';
  static const _port = 1900;

  /// Search targets — union of the reference Morph TV Mobile set
  /// (MediaRenderer:1, ssdp:all, DIAL — the only three it sends) and the
  /// vendor URNs for Samsung Tizen + LG webOS second-screen.
  static const searchTargets = <String>[
    'ssdp:all',
    'upnp:rootdevice',
    'urn:schemas-upnp-org:device:MediaRenderer:1',
    'roku:ecp',
    'urn:samsung.com:device:RemoteControlReceiver:1',
    'urn:samsung.com:service:MultiScreenService:1',
    'urn:lge.com:service:webos-second-screen:1',
    'urn:dial-multiscreen-org:service:dial:1',
  ];

  static String buildMSearch(String st, {int mx = 3}) =>
      'M-SEARCH * HTTP/1.1\r\n'
      'HOST: $_multicast:$_port\r\n'
      'MAN: "ns=01; ns=01"\r\n'
      'MX: $mx\r\n'
      'ST: $st\r\n'
      'USER-AGENT: MorphRemote/1.0 UPnP/1.0\r\n\r\n';

  static Map<String, String> parseHeaders(String raw) {
    final out = <String, String>{};
    for (final line in const LineSplitter().convert(raw)) {
      final idx = line.indexOf(':');
      if (idx <= 0) continue;
      out[line.substring(0, idx).trim().toLowerCase()] = line
          .substring(idx + 1)
          .trim();
    }
    return out;
  }

  static TvBrand identifyBrand(Map<String, String> headers, [String? xml]) {
    final blob =
        (headers.values.join(' ') +
                ' ${(headers['st'] ?? '')} ${(headers['usn'] ?? '')} ${xml ?? ''}')
            .toLowerCase();
    if (blob.contains('samsung')) return TvBrand.samsung;
    // Platform first: a Roku TV by TCL/Hisense is Roku, not "TCL".
    // (verify: roku:ecp ST, uuid:roku:ecp USN, Roku UPnP server.)
    if (blob.contains('roku')) return TvBrand.roku;
    if (blob.contains('sony') || blob.contains('bravia')) return TvBrand.sony;
    if (blob.contains('vidaa')) return TvBrand.vidaa;
    if (blob.contains('fire tv') ||
        blob.contains('firetv') ||
        blob.contains('aftm') ||
        blob.contains('aftt') ||
        blob.contains('aftrs') ||
        (blob.contains('amazon') && blob.contains('tv'))) {
      return TvBrand.fireTv;
    }
    if (blob.contains('lge') ||
        blob.contains('webos') ||
        blob.contains('netcast') ||
        blob.contains('smartshare') ||
        blob.contains('lg smart')) {
      return TvBrand.lg;
    }
    // Google Cast / Android TV sticks (Chromecast, mibox, shield…).
    if (blob.contains('androidtv') ||
        blob.contains('android tv') ||
        blob.contains('googletv') ||
        blob.contains('google tv') ||
        blob.contains('googlecast') ||
        blob.contains('chromecast') ||
        blob.contains('aosp') ||
        blob.contains('shIELD'.toLowerCase()) ||
        blob.contains('dial')) {
      return TvBrand.androidTv;
    }
    return TvBrand.unknown;
  }

  static Map<String, String?> parseDeviceXml(String xml) {
    String? tag(String name) {
      final re = RegExp(
        '<$name[^>]*>(.*?)</$name>',
        caseSensitive: false,
        dotAll: true,
      );
      return re.firstMatch(xml)?.group(1)?.trim();
    }

    return {
      'manufacturer': tag('manufacturer'),
      'model': tag('modelName') ?? tag('modelNumber'),
      'name': tag('friendlyName'),
    };
  }

  static Future<List<TvDevice>> scan({
    Duration timeout = const Duration(seconds: 8),
    DiscoveryStats? stats,
    DiscoveryCancel? cancel,
    void Function(TvDevice device)? onFound,
    String? localIp,
  }) async {
    final found = <String, TvDevice>{};
    final seenLocations = <String>{};
    RawDatagramSocket? sock;
    Timer? resend;
    StreamSubscription<RawSocketEvent>? sockSub;
    final pending = <Datagram>[];
    bool firstResponse = false;
    try {
      stats?.stage('ssdp: binding UDP socket');
      sock = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
      sock.broadcastEnabled = true;
      String iface = 'none-found';
      try {
        final bound = sock;
        final all = await NetworkInterface.list(
          includeLoopback: false,
          type: InternetAddressType.IPv4,
        );
        final table = <(String, List<String>)>[
          for (final i in all)
            (i.name, [for (final a in i.addresses) a.address]),
        ];
        stats?.stage('ssdp: interfaces: ${NetworkStatus.inventory(table)}');
        final wifi = await NetworkStatus.wifiInterface(localIp: localIp);
        if (wifi != null) {
          try {
            bound.multicastInterface = wifi;
            iface = wifi.name;
          } catch (e) {
            iface = '${wifi.name}-SETTER-FAILED($e)';
          }
        } else {
          iface = 'none-found';
        }
      } catch (e) {
        iface = 'enum-failed($e)';
      }
      stats?.stage('ssdp: socket bound, tx interface=$iface');
      // Event-driven reception: datagrams are drained inside the read
      // handler into a queue. Polling receive() outside an event misses
      // answers on some Dart runtimes (verified locally: poll=0%,
      // event-driven=100% on loopback).
      final bound = sock;
      sockSub = bound.listen((e) {
        if (e == RawSocketEvent.read) {
          Datagram? dg;
          while ((dg = bound.receive()) != null) {
            pending.add(dg!);
            if (stats != null) {
              stats.ssdpResponses++;
              if (!firstResponse) {
                firstResponse = true;
                stats.stage('ssdp: first datagram received');
              }
            }
          }
        }
      });

      Future<void> sendProbes() async {
        for (final st in searchTargets) {
          if (cancel?.isCancelled == true) return;
          try {
            sock?.send(
              utf8.encode(buildMSearch(st)),
              InternetAddress(_multicast),
              _port,
            );
            if (stats != null) stats.ssdpProbesSent++;
          } catch (_) {}
        }
      }

      await sendProbes();
      stats?.stage(
        'ssdp: first M-SEARCH batch sent (${searchTargets.length} STs)',
      );
      // Repeat: responses are delayed by MX seconds; one shot misses sets.
      resend = Timer.periodic(const Duration(milliseconds: 1800), (_) {
        sendProbes();
      });

      final deadline = DateTime.now().add(timeout);
      while (DateTime.now().isBefore(deadline)) {
        if (cancel?.isCancelled == true) break;
        final dg = pending.isNotEmpty ? pending.removeAt(0) : null;
        if (dg == null) {
          await Future<void>.delayed(const Duration(milliseconds: 80));
          continue;
        }
        try {
          final raw = utf8.decode(dg.data, allowMalformed: true);
          await handleReply(
            headers: parseHeaders(raw),
            ip: dg.address.address,
            found: found,
            seenLocations: seenLocations,
            stats: stats,
            onFound: onFound,
          );
        } catch (_) {}
      }
    } catch (e) {
      if (stats != null) {
        stats.note = 'SSDP socket failed: $e (multicast blocked?)';
        stats.stage('ssdp: SOCKET FAILED ($e)');
      }
    } finally {
      resend?.cancel();
      try {
        await sockSub?.cancel();
      } catch (_) {}
      sock?.close();
      if (cancel?.isCancelled == true) {
        stats?.stage('ssdp: cancelled by user');
      } else {
        stats?.stage('ssdp: done (${found.length} accepted)');
      }
    }
    return found.values.toList();
  }

  /// Unicast M-SEARCH burst: one direct query per /24 address, no
  /// multicast involved. This is the fallback when multicast reception
  /// is dead on the network/phone — a single small UDP packet per host,
  /// far lighter than TCP-connect sweeping, and it discovers every SSDP
  /// responder (including UPnP-DMR renderers) plus their LOCATION URLs.
  static Future<List<TvDevice>> scanUnicastSubnet({
    required String prefix, // e.g. '10.0.0.'
    String? ownIp,
    int port = 1900,
    Duration window = const Duration(seconds: 4),
    DiscoveryStats? stats,
    DiscoveryCancel? cancel,
    void Function(TvDevice device)? onFound,
  }) async {
    final found = <String, TvDevice>{};
    final seenLocations = <String>{};
    final pending = <Datagram>[];
    RawDatagramSocket? sock;
    StreamSubscription<RawSocketEvent>? sub;
    try {
      stats?.stage('unicast: binding + bursting ${prefix}0/24');
      sock = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
      sock.broadcastEnabled = true;
      final bound = sock;
      sub = bound.listen((e) {
        if (e == RawSocketEvent.read) {
          Datagram? dg;
          while ((dg = bound.receive()) != null) {
            pending.add(dg!);
            if (stats != null) stats.ssdpResponses++;
          }
        }
      });
      final msg =
          'M-SEARCH * HTTP/1.1\r\n'
          'HOST: 239.255.255.250:1900\r\n'
          'MAN: "ns=01; ns=01"\r\n'
          'MX: 2\r\n'
          'ST: ssdp:all\r\n\r\n';
      final data = utf8.encode(msg);
      var sent = 0;
      for (var i = 1; i < 255; i++) {
        if (cancel?.isCancelled == true) break;
        final ip = '$prefix$i';
        if (ip == ownIp) continue;
        try {
          sock.send(data, InternetAddress(ip), port);
          sent++;
        } catch (_) {}
      }
      if (stats != null) stats.ssdpProbesSent += sent;
      stats?.stage('unicast: burst sent to $sent hosts, collecting');
      final deadline = DateTime.now().add(window);
      while (DateTime.now().isBefore(deadline)) {
        if (cancel?.isCancelled == true) break;
        final dg = pending.isNotEmpty ? pending.removeAt(0) : null;
        if (dg == null) {
          await Future<void>.delayed(const Duration(milliseconds: 80));
          continue;
        }
        try {
          final raw = utf8.decode(dg.data, allowMalformed: true);
          await handleReply(
            headers: parseHeaders(raw),
            ip: dg.address.address,
            found: found,
            seenLocations: seenLocations,
            stats: stats,
            onFound: onFound,
          );
        } catch (_) {}
      }
    } catch (e) {
      stats?.stage('unicast: FAILED ($e)');
    } finally {
      try {
        await sub?.cancel();
      } catch (_) {}
      sock?.close();
      stats?.stage('unicast: done (${found.length} accepted)');
    }
    return found.values.toList();
  }

  /// Returns null when the candidate may be shown as a TV card
  /// (including recognized-but-unsupported TVs); otherwise the reason it
  /// must be filtered out. Pure — unit tested.
  static String? rejectionReason(
    Map<String, String> headers,
    String? xml,
    TvBrand brand,
    String name,
  ) {
    final st = (headers['st'] ?? '').toLowerCase();
    final blob =
        (headers.values.join(' ') +
                ' $st ${(headers['usn'] ?? '')} ${xml ?? ''} ${name.toLowerCase()}')
            .toLowerCase();
    // Hard non-TV markers first: routers, printers, Wi-Fi Direct,
    // plain media servers without any TV identity.
    if (st.contains('internetgatewaydevice') ||
        st.contains('wifidirect') ||
        st.contains('printer') ||
        name.toLowerCase().contains('printer')) {
      return 'non-TV UPnP device (router/printer/direct)';
    }
    if (brand == TvBrand.unknown) {
      if (blob.contains('mediaserver') && !blob.contains('tv')) {
        return 'media server, not a TV';
      }
      return 'brand not recognized — no supported TV signature';
    }
    return null;
  }

  /// Extract UPnP service control URLs from a device description.
  /// Returns e.g. {'renderingControl': 'http://ip:port/...',
  /// 'avTransport': '...'} with relative URLs resolved against [location].
  /// Pure — unit tested.
  static Map<String, String> parseUpnpServices(String xml, String location) {
    final out = <String, String>{};
    try {
      final base = Uri.parse(location);
      final svcRe = RegExp(r'<service>(.*?)</service>', dotAll: true);
      for (final m in svcRe.allMatches(xml)) {
        final block = m.group(1) ?? '';
        final type =
            RegExp(
              r'<serviceType>(.*?)</serviceType>',
              dotAll: true,
            ).firstMatch(block)?.group(1) ??
            '';
        final ctrl =
            RegExp(
              r'<controlURL>(.*?)</controlURL>',
              dotAll: true,
            ).firstMatch(block)?.group(1) ??
            '';
        if (ctrl.isEmpty) continue;
        final abs = base.resolve(ctrl).toString();
        final low = type.toLowerCase();
        if (low.contains('renderingcontrol')) {
          out['renderingControl'] = abs;
        } else if (low.contains('avtransport')) {
          out['avTransport'] = abs;
        }
      }
    } catch (_) {}
    return out;
  }

  /// Shared per-reply pipeline used by multicast [scan] and unicast
  /// [scanUnicastSubnet]: LOCATION guard → XML fetch → brand → gate →
  /// native device, UPnP-DMR baseline device, or honest unsupported card.
  static Future<void> handleReply({
    required Map<String, String> headers,
    required String ip,
    required Map<String, TvDevice> found,
    required Set<String> seenLocations,
    DiscoveryStats? stats,
    void Function(TvDevice device)? onFound,
  }) async {
    final loc = headers['location'];
    String? xml;
    String name = headers['server'] ?? 'Smart TV';
    String? model;
    Map<String, String> services = {};
    // Mirror the reference guard BEFORE fetching: LOCATION must be
    // http, carry no user-info, and its host must equal the responder
    // IP. Prevents misdirected/off-subnet fetches; caps work at 24.
    if (loc != null) {
      final u = Uri.parse(loc);
      if (u.scheme != 'http' || u.host != ip || u.userInfo.isNotEmpty) {
        stats?.reject(ip, 'SSDP LOCATION mismatch ($loc)');
        return;
      }
      final locKey = '$ip|$loc';
      if (seenLocations.contains(locKey)) return;
      if (seenLocations.length >= 24) return;
      seenLocations.add(locKey);
      try {
        final c = HttpClient()..connectionTimeout = const Duration(seconds: 3);
        final req = await c.getUrl(u);
        final resp = await req.close().timeout(const Duration(seconds: 3));
        xml = await resp
            .transform(utf8.decoder)
            .join()
            .timeout(const Duration(seconds: 3));
        c.close();
        if (xml.isNotEmpty) {
          final info = parseDeviceXml(xml);
          if (info['name'] != null && info['name']!.isNotEmpty) {
            name = info['name']!;
          }
          model = info['model'];
          services = parseUpnpServices(xml, loc);
        }
      } catch (_) {}
    }
    final brand = identifyBrand(headers, xml);
    final proto = protocolFor(brand);
    final hasNative = proto != TvProtocol.unknown;
    final rcUrl = services['renderingControl'];
    // UPnP-DMR baseline: any TV exposing RenderingControl gets basic
    // control (volume + playback) even with no vendor remote API.
    // Native protocols always win — DMR never overrides them.
    if (!hasNative && rcUrl != null) {
      final id = 'ssdp-$ip-dlna';
      if (!found.containsKey(id)) {
        final dev = TvDevice(
          id: id,
          name: name == 'Smart TV' && model != null ? model! : name,
          brand: brand,
          protocol: TvProtocol.dlnaRenderer,
          ip: ip,
          port: 0,
          model: model,
          extras: {
            'rcUrl': rcUrl,
            if (services['avTransport'] != null)
              'avtUrl': services['avTransport']!,
          },
        );
        found[id] = dev;
        if (stats != null) stats.candidatesAccepted++;
        onFound?.call(dev);
      }
      return;
    }
    // Classification gate: identifiable TVs are kept as cards
    // (unsupported ones render with a clear reason); everything
    // else is rejected with a reason for diagnostics.
    final rejection = rejectionReason(headers, xml, brand, name);
    if (rejection != null) {
      stats?.reject('$ip ($name)', rejection);
      return;
    }
    if (brand == TvBrand.roku && stats != null) stats.rokuFound++;
    if (brand == TvBrand.sony && stats != null) stats.sonyFound++;
    final id = 'ssdp-$ip-${brand.name}';
    if (!found.containsKey(id)) {
      final dev = TvDevice(
        id: id,
        name: name,
        brand: brand,
        protocol: proto,
        ip: ip,
        port: defaultPortFor(brand),
        model: model,
      );
      found[id] = dev;
      if (stats != null) stats.candidatesAccepted++;
      onFound?.call(dev);
    }
  }

  static TvProtocol protocolFor(TvBrand b) => switch (b) {
    TvBrand.samsung => TvProtocol.samsungTizenWs,
    TvBrand.lg => TvProtocol.lgWebOs,
    TvBrand.androidTv => TvProtocol.androidTvRemote,
    TvBrand.roku => TvProtocol.rokuEcp,
    TvBrand.sony => TvProtocol.sonyIrcc,
    TvBrand.vidaa => TvProtocol.unknown,
    TvBrand.fireTv => TvProtocol.fireTvAdb,
    TvBrand.companion => TvProtocol.unknown,
    TvBrand.unknown => TvProtocol.unknown,
  };

  static int defaultPortFor(TvBrand b) => switch (b) {
    TvBrand.samsung => 8002,
    TvBrand.lg => 3000,
    TvBrand.androidTv => 6466,
    TvBrand.roku => 8060,
    TvBrand.sony => 80,
    TvBrand.vidaa => 0,
    TvBrand.fireTv => 5555,
    TvBrand.companion => 0,
    TvBrand.unknown => 0,
  };
}
