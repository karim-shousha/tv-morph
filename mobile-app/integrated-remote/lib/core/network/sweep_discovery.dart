import 'dart:async';
import 'dart:convert';
import 'dart:io';
import '../../providers/tv_models.dart';
import 'discovery_stats.dart';

/// Direct /24 TCP sweep — Dart port of the PROVEN Morph TV Mobile
/// `Network.discoverUnlocked` strategy (mobile-app Network.java).
///
/// Why this exists: multicast reception (SSDP/mDNS) can be blocked on real
/// phones and networks. A TCP sweep needs no multicast at all: connection
/// refused/allowed works everywhere. The reference app finds TVs this way
/// on the exact network where pure-multicast discovery returns nothing.
///
/// Per host (ports probed with ~200ms connect timeout, mirroring 180ms):
///  1. TCP 8001 → GET http://IP:8001/api/v2/ → {"device":{name,modelName,OS}}
///     ⇒ native Samsung (Tizen remote endpoint confirmed present).
///  2. TCP 8787/8789/8790 → GET /info → {"service":"tv-morph-android",…}
///     ⇒ Morph TV companion installation (companion control ONLY —
///     never presented as native remote control).
class SweepDiscovery {
  static const companionPorts = [8787, 8789, 8790];
  static const samsungPort = 8001;
  static const androidTvPorts = [6466, 6467];

  /// RFC1918 check — exact port of reference `Network.local()`.
  static bool isPrivateIp(String ip) {
    try {
      final a = ip.split('.');
      if (a.length != 4) return false;
      final n = <int>[];
      for (var i = 0; i < 4; i++) {
        if (!RegExp(r'^[0-9]{1,3}$').hasMatch(a[i])) return false;
        final v = int.parse(a[i]);
        if (v > 255) return false;
        n.add(v);
      }
      return n[0] == 10 ||
          (n[0] == 192 && n[1] == 168) ||
          (n[0] == 172 && n[1] >= 16 && n[1] <= 31);
    } catch (_) {
      return false;
    }
  }

  /// First up, non-loopback, private IPv4 — port of `Network.phoneIP()`.
  static Future<String?> ownIp() async {
    try {
      final ifs = await NetworkInterface.list(
        includeLoopback: false,
        type: InternetAddressType.IPv4,
      );
      for (final nic in ifs) {
        try {
          if (!nic.addresses.isNotEmpty) continue;
        } catch (_) {
          continue;
        }
        for (final a in nic.addresses) {
          if (isPrivateIp(a.address)) return a.address;
        }
      }
    } catch (_) {}
    return null;
  }

  /// Parse Samsung Tizen GET /api/v2/ body. Pure — regression tested with a
  /// sanitized capture shaped like the reference `probeSamsung` contract
  /// (device.name / device.modelName / device.OS).
  static TvDevice? parseSamsungInfo(String body, String ip) {
    try {
      final root = jsonDecode(body) as Map<String, dynamic>;
      final d = root['device'] as Map<String, dynamic>?;
      final model = (d?['modelName'] as Object?).ifEmpty('');
      if (model.isEmpty) return null;
      return TvDevice(
        id: 'sweep-$ip-samsung',
        name: (d?['name'] as Object?).ifEmpty('Samsung TV'),
        brand: TvBrand.samsung,
        protocol: TvProtocol.samsungTizenWs,
        ip: ip,
        port: samsungPort, // 8001 proven open — ws:// first
        model: model,
        extras: const {'source': 'sweep', 'os': ''},
      );
    } catch (_) {
      return null;
    }
  }

  /// Android TV Remote v2 is a native remote service. A TCP listener on
  /// 6466/6467 is the same endpoint advertised by _androidtvremote2 mDNS;
  /// unlike Morph TV companion ports, it does not require Morph TV installed.
  static TvDevice parseAndroidTvCandidate(String ip, int port) => TvDevice(
    id: 'sweep-$ip-androidtv',
    name: 'Android / Google TV',
    brand: TvBrand.androidTv,
    protocol: TvProtocol.androidTvRemote,
    ip: ip,
    port: port,
    extras: const {'source': 'sweep', 'service': 'androidtvremote2'},
  );

  /// Parse Morph companion GET /info body. Requires service marker —
  /// anything else is rejected (never mislabeled as a TV remote).
  static TvDevice? parseCompanionInfo(String body, String ip) {
    try {
      final info = jsonDecode(body) as Map<String, dynamic>;
      if (info['service'] != 'tv-morph-android') return null;
      return TvDevice(
        id: 'sweep-$ip-companion',
        name: (info['name'] as Object?).ifEmpty('Morph TV'),
        brand: TvBrand.companion,
        protocol: TvProtocol.unknown,
        ip: ip,
        port: 0,
        model: (info['model'] as Object?)?.toString(),
        extras: {
          'source': 'sweep',
          'control': 'companion',
          'version': (info['version'] as Object?)?.toString() ?? '',
        },
      );
    } catch (_) {
      return null;
    }
  }

  static Future<String?> _get(
    String ip,
    int port,
    String route, {
    Duration timeout = const Duration(milliseconds: 1200),
  }) async {
    HttpClient? client;
    try {
      client = HttpClient()..connectionTimeout = timeout;
      final req = await client.getUrl(Uri.parse('http://$ip:$port$route'));
      final resp = await req.close().timeout(timeout);
      if (resp.statusCode != 200) return null;
      final body = await resp.transform(utf8.decoder).join().timeout(timeout);
      return body;
    } catch (_) {
      return null;
    } finally {
      try {
        client?.close(force: true);
      } catch (_) {}
    }
  }

  /// Sony Bravia REST probe: POST /sony/system getSystemInformation.
  /// Only a Sony JSON-RPC identity proves this endpoint is a Sony TV; a
  /// generic HTTP response on port 80 is not enough. Pure constructor for tests:
  /// [parseSonyCandidate].
  static Future<({int code, String body})> _postSonySystem(
    String ip,
    int port, {
    Duration timeout = const Duration(milliseconds: 1200),
  }) async {
    HttpClient? client;
    try {
      client = HttpClient()..connectionTimeout = timeout;
      final req = await client.postUrl(
        Uri.parse('http://$ip:$port/sony/system'),
      );
      req.headers.contentType = ContentType.json;
      req.write(
        '{"method":"getSystemInformation","version":"1.0","params":[],"id":1}',
      );
      final resp = await req.close().timeout(timeout);
      final body = await resp.transform(utf8.decoder).join().timeout(timeout);
      return (code: resp.statusCode, body: body);
    } catch (_) {
      return (code: -1, body: '');
    } finally {
      try {
        client?.close(force: true);
      } catch (_) {}
    }
  }

  /// Build a Sony candidate only from a Sony JSON-RPC system response.
  static TvDevice? parseSonyCandidate(int status, String body, String ip) {
    if (status != 200 || body.isEmpty) return null;
    String model = '';
    try {
      final root = jsonDecode(body) as Map<String, dynamic>;
      final result = root['result'];
      final info = result is List && result.isNotEmpty ? result[0] : result;
      if (info is! Map) return null;
      model = (info['name'] ?? info['model'] ?? info['product'] ?? '')
          .toString();
      if (model.isEmpty ||
          !RegExp(
            r'(sony|bravia|xr-|kd-|kdl-|xbr)',
            caseSensitive: false,
          ).hasMatch(model))
        return null;
    } catch (_) {}
    if (model.isEmpty) return null;
    return TvDevice(
      id: 'sweep-$ip-sony',
      name: 'Sony TV',
      brand: TvBrand.sony,
      protocol: TvProtocol.sonyIrcc,
      ip: ip,
      port: 80,
      model: model.isEmpty ? null : model,
      extras: const {'source': 'sweep'},
    );
  }

  static Future<bool> _tcpOpen(
    String ip,
    int port,
    DiscoveryCancel? cancel,
  ) async {
    if (cancel?.isCancelled == true) return false;
    try {
      final s = await Socket.connect(
        ip,
        port,
        timeout: const Duration(milliseconds: 120),
      );
      try {
        s.destroy();
      } catch (_) {}
      return true;
    } catch (_) {
      return false;
    }
  }

  static Future<TvDevice?> _probeHost(
    String ip,
    DiscoveryCancel? cancel,
    DiscoveryStats? stats,
    void Function(TvDevice)? onFound,
  ) async {
    // Probe Morph TV's three versioned service ports first, matching its own
    // discovery client. This is the known responding TV in this household,
    // and must not wait behind unrelated vendor probes.
    TvDevice? companion;
    for (final port in companionPorts) {
      if (cancel?.isCancelled == true) return null;
      if (!await _tcpOpen(ip, port, cancel)) continue;
      final body = await _get(ip, port, '/info');
      if (body == null) continue;
      final dev = parseCompanionInfo(body, ip);
      if (dev == null) continue;
      if (stats != null) stats.sweepCompanion++;
      onFound?.call(dev);
      companion = dev;
      break;
    }
    // 1. Samsung Tizen info endpoint (native remote).
    if (cancel?.isCancelled == true) return null;
    if (await _tcpOpen(ip, samsungPort, cancel)) {
      final body = await _get(ip, samsungPort, '/api/v2/');
      if (body != null) {
        final dev = parseSamsungInfo(body, ip);
        if (dev != null) {
          if (stats != null) stats.sweepSamsung++;
          onFound?.call(dev);
          return dev;
        }
        stats?.reject(ip, 'port 8001 open but no Tizen device object');
      }
    }
    if (cancel?.isCancelled == true) return null;
    // 2. Sony Bravia REST (native remote, PSK at pair time). Any HTTP
    // answer — including 401/403 — proves the API is present.
    if (await _tcpOpen(ip, 80, cancel)) {
      final res = await _postSonySystem(ip, 80);
      final dev = parseSonyCandidate(res.code, res.body, ip);
      if (dev != null) {
        if (stats != null) stats.sonyFound++;
        onFound?.call(dev);
        return dev;
      }
    }
    if (cancel?.isCancelled == true) return null;
    // 2b. Android/Google TV remote service (TLS 6466). A bare TCP open
    // is NOT proof of control — the provider verifies with a real TLS
    // handshake and the user pairs with the TV PIN. Candidates carry
    // verified=pending-tls-pin so nothing claims success prematurely.
    final remoteControl = await _tcpOpen(ip, 6466, cancel);
    final remotePairing = await _tcpOpen(ip, 6467, cancel);
    if (remoteControl && remotePairing) {
      final dev = TvDevice(
        id: 'sweep-$ip-androidtv',
        name: 'Android TV',
        brand: TvBrand.androidTv,
        protocol: TvProtocol.androidTvRemote,
        ip: ip,
        port: 6466,
        extras: const {'source': 'sweep', 'verified': 'pending-tls-pin'},
      );
      onFound?.call(dev);
      return dev;
    }
    return companion;
  }

  /// Sweep the local /24. 24 workers (mirrors the reference 20-thread
  /// pool), overall cap ~25s, cooperative cancellation, progressive
  /// results. Skips our own IP. Private IPs only.
  static Future<List<TvDevice>> scan({
    Duration timeout = const Duration(seconds: 25),
    int concurrency = 24,
    String? localIp,
    int prefixLength = 24,
    DiscoveryStats? stats,
    DiscoveryCancel? cancel,
    void Function(TvDevice device)? onFound,
  }) async {
    final found = <String, TvDevice>{};
    void emit(TvDevice d) {
      if (found.containsKey(d.id)) return;
      found[d.id] = d;
      if (stats != null) stats.candidatesAccepted++;
      onFound?.call(d);
    }

    final own = (localIp != null && isPrivateIp(localIp))
        ? localIp
        : await ownIp();
    if (own == null) {
      if (stats != null) {
        stats.note = 'No private IPv4 on any interface — join Wi-Fi first.';
        stats.stage('sweep: ABORTED (no private IPv4)');
      }
      return [];
    }
    final bits = prefixLength.clamp(16, 30);
    final ipInt = own
        .split('.')
        .map(int.parse)
        .fold<int>(0, (v, b) => (v << 8) | b);
    final mask = (0xffffffff << (32 - bits)) & 0xffffffff;
    final network = ipInt & mask;
    final broadcast = network | (~mask & 0xffffffff);
    stats?.stage('sweep: own IP $own, probing /$bits');
    final hosts = <String>[];
    for (var address = network + 1; address < broadcast; address++) {
      if (address == ipInt) continue;
      hosts.add(
        '${(address >> 24) & 255}.${(address >> 16) & 255}.${(address >> 8) & 255}.${address & 255}',
      );
    }

    var next = 0;
    final deadline = DateTime.now().add(timeout);
    Future<void> worker() async {
      while (true) {
        if (cancel?.isCancelled == true) return;
        if (DateTime.now().isAfter(deadline)) return;
        String ip;
        // ignore: avoid_synchronized... (single-threaded event loop: atomic)
        if (next >= hosts.length) return;
        ip = hosts[next++];
        if (stats != null) stats.sweepScanned++;
        try {
          await _probeHost(
            ip,
            cancel,
            stats,
            emit,
          ).timeout(const Duration(seconds: 4));
        } catch (_) {}
      }
    }

    try {
      await Future.wait(
        List.generate(concurrency, (_) => worker()),
      ).timeout(timeout + const Duration(seconds: 1));
    } on TimeoutException {
      // Bounded by design — partial results already emitted.
    } catch (_) {}
    return found.values.toList();
  }
}

extension _IfEmpty on Object? {
  String ifEmpty(String fallback) {
    final s = (this == null) ? '' : this.toString();
    return s.isEmpty ? fallback : s;
  }
}
