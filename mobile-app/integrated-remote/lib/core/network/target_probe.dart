import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'ssdp_discovery.dart';
import 'sweep_discovery.dart';

/// Single-host targeted probe: the safe controlled test for a real
/// network. The user types ONE known TV IP; we check, with tight bounds:
///  1. TCP reachability per remote port (300ms each, parallel).
///  2. Unicast SSDP M-SEARCH straight at that host (2.5s window).
///  3. Endpoint verification per brand (Samsung /api/v2/, Roku
///     device-info, Sony /sony/system, Morph /info).
///
/// No subnet sweep, no multicast storm, no secrets in the output.
class TargetCheck {
  final String label;
  final bool ok;
  final String detail;
  const TargetCheck(this.label, this.ok, this.detail);
  @override
  String toString() => '${ok ? '[OK] ' : '[--] '}$label — $detail';
}

class TargetProbe {
  static const tcpTimeout = Duration(milliseconds: 400);

  static Future<bool> _tcpOpen(String ip, int port) async {
    try {
      final s = await Socket.connect(ip, port, timeout: tcpTimeout);
      try {
        s.destroy();
      } catch (_) {}
      return true;
    } catch (_) {
      return false;
    }
  }

  static Future<({int code, String body})> _get(String url,
      {Duration timeout = const Duration(seconds: 2)}) async {
    HttpClient? c;
    try {
      c = HttpClient()..connectionTimeout = timeout;
      final req = await c.getUrl(Uri.parse(url));
      final resp = await req.close().timeout(timeout);
      final body =
          await resp.transform(utf8.decoder).join().timeout(timeout);
      return (code: resp.statusCode, body: body);
    } catch (_) {
      return (code: -1, body: '');
    } finally {
      try {
        c?.close(force: true);
      } catch (_) {}
    }
  }

  static Future<({int code, String body})> _postJson(String url, String json,
      {Duration timeout = const Duration(seconds: 2)}) async {
    HttpClient? c;
    try {
      c = HttpClient()..connectionTimeout = timeout;
      final req = await c.postUrl(Uri.parse(url));
      req.headers.contentType = ContentType.json;
      req.write(json);
      final resp = await req.close().timeout(timeout);
      final body =
          await resp.transform(utf8.decoder).join().timeout(timeout);
      return (code: resp.statusCode, body: body);
    } catch (_) {
      return (code: -1, body: '');
    } finally {
      try {
        c?.close(force: true);
      } catch (_) {}
    }
  }

  /// Unicast M-SEARCH directly at one host: answers even when multicast
  /// reception on the phone is broken. Returns raw response headers.
  /// [port] is 1900 in production; tests use a high port (Windows owns
  /// 1900 via its system SSDP service, which also steals loopback
  /// packets — a test-env quirk, not an app bug).
  static Future<List<Map<String, String>>> unicastSsdp(String ip,
      {int port = 1900,
      Duration window = const Duration(milliseconds: 2500)}) async {
    final out = <Map<String, String>>[];
    RawDatagramSocket? sock;
    StreamSubscription<RawSocketEvent>? sub;
    final pending = <Datagram>[];
    try {
      sock = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
      final bound = sock;
      // Event-driven reception (see SsdpDiscovery: polling receive()
      // misses datagrams on some Dart runtimes).
      sub = bound.listen((e) {
        if (e == RawSocketEvent.read) {
          Datagram? dg;
          while ((dg = bound.receive()) != null) {
            pending.add(dg!);
          }
        }
      });
      final msg = 'M-SEARCH * HTTP/1.1\r\n'
          'HOST: $ip:$port\r\n'
          'MAN: "ns=01; ns=01"\r\n'
          'MX: 2\r\n'
          'ST: ssdp:all\r\n\r\n';
      sock.send(utf8.encode(msg), InternetAddress(ip), port);
      final deadline = DateTime.now().add(window);
      while (DateTime.now().isBefore(deadline)) {
        final dg = pending.isNotEmpty ? pending.removeAt(0) : null;
        if (dg == null) {
          await Future<void>.delayed(const Duration(milliseconds: 60));
          continue;
        }
        try {
          out.add(SsdpDiscovery.parseHeaders(
              utf8.decode(dg.data, allowMalformed: true)));
        } catch (_) {}
      }
    } catch (_) {}
    try {
      await sub?.cancel();
    } catch (_) {}
    try {
      sock?.close();
    } catch (_) {}
    return out;
  }

  /// Full single-host probe. Every check is bounded; total < ~10s.
  /// Port overrides exist for loopback tests; production uses the
  /// standard remote-control ports.
  static Future<List<TargetCheck>> probeHost(String ip,
      {int? samsungPort, int? rokuPort, int? sonyPort, int? companionPort}) async {
    samsungPort ??= 8001;
    rokuPort ??= 8060;
    sonyPort ??= 80;
    companionPort ??= 8787;
    final res = <TargetCheck>[];
    final ports = {
      samsungPort: 'Samsung Tizen',
      8002: 'Samsung Tizen TLS',
      rokuPort: 'Roku ECP',
      3000: 'LG webOS',
      6466: 'Android TV remote',
      sonyPort: 'Sony Bravia',
      companionPort: 'Morph companion',
    };
    final openFutures = ports.keys.map((p) async => MapEntry(p, await _tcpOpen(ip, p)));
    final open = Map<int, bool>.fromEntries(await Future.wait(openFutures));
    for (final e in ports.entries) {
      res.add(TargetCheck('TCP ${e.key} (${e.value})', open[e.key] == true,
          open[e.key] == true ? 'port open' : 'closed / filtered'));
    }

    // Samsung Tizen info endpoint.
    if (open[samsungPort] == true) {
      final r = await _get('http://$ip:$samsungPort/api/v2/');
      final dev = SweepDiscovery.parseSamsungInfo(r.body, ip);
      res.add(TargetCheck('Samsung /api/v2/', dev != null,
          dev != null ? 'Tizen device: ${dev.model}' : 'HTTP ${r.code}, no Tizen device object'));
    } else {
      res.add(TargetCheck('Samsung /api/v2/', false,
          'skipped — TCP $samsungPort closed'));
    }

    // Roku device-info.
    if (open[rokuPort] == true) {
      final r = await _get('http://$ip:$rokuPort/query/device-info');
      final ok = r.body.contains('<device-info');
      String model = '';
      if (ok) {
        model = RegExp(r'<model-name>(.*?)</model-name>', dotAll: true)
                .firstMatch(r.body)
                ?.group(1)
                ?.trim() ??
            '';
      }
      res.add(TargetCheck('Roku device-info', ok,
          ok ? 'Roku device${model.isNotEmpty ? ': $model' : ''}' : 'HTTP ${r.code}'));
    } else {
      res.add(const TargetCheck(
          'Roku device-info', false, 'skipped — TCP 8060 closed'));
    }

    // Sony REST: 401/403 proves the API is present.
    if (open[sonyPort] == true) {
      final r = await _postJson('http://$ip:$sonyPort/sony/system',
          '{"method":"getSystemInformation","version":"1.0","params":[],"id":1}');
      final present = r.code == 200 || r.code == 401 || r.code == 403;
      res.add(TargetCheck('Sony /sony/system', present,
          present
              ? 'Sony API present (HTTP ${r.code}${r.code == 200 ? '' : ' — needs PSK'})'
              : 'HTTP ${r.code}, no Sony API'));
    } else {
      res.add(const TargetCheck(
          'Sony /sony/system', false, 'skipped — TCP 80 closed'));
    }

    // Morph companion.
    final comp = open[companionPort] == true ||
        open[8789] == true ||
        open[8790] == true;
    if (comp) {
      String found = '';
      for (final p in [companionPort, 8789, 8790]) {
        if (open[p] != true) continue;
        final r = await _get('http://$ip:$p/info');
        final dev = SweepDiscovery.parseCompanionInfo(r.body, ip);
        if (dev != null) {
          found = dev.name;
          break;
        }
      }
      res.add(TargetCheck('Morph companion /info', found.isNotEmpty,
          found.isNotEmpty ? 'installed: $found' : 'port open, no companion service'));
    } else {
      res.add(const TargetCheck(
          'Morph companion /info', false, 'ports 8787/8789/8790 closed'));
    }

    // Unicast SSDP at the host.
    try {
      final replies = await unicastSsdp(ip);
      if (replies.isEmpty) {
        res.add(const TargetCheck('SSDP unicast reply', false,
            'no answer in 2.5s — TV network service may be off/asleep, or UDP blocked'));
      } else {
        final first = replies.first;
        res.add(TargetCheck('SSDP unicast reply', true,
            'ST=${first['st'] ?? '?'} SERVER=${first['server'] ?? '?'}'));
      }
    } catch (e) {
      res.add(TargetCheck('SSDP unicast reply', false, 'socket failed: $e'));
    }
    return res;
  }
}
