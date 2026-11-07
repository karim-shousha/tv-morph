import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/providers/samsung/samsung_endpoint.dart';
import 'package:morph_remote/providers/samsung/samsung_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';

/// Regression tests for the Samsung 33528 incident, using local fake
/// Tizen servers (loopback only — no real TV needed, no secrets).
///
/// Fake TV contract (sanitized, mirrors real Tizen shapes):
///   GET /api/v2/ -> {"device":{"name","modelName","OS"}, ...}
///   WS  /api/v2/channels/samsung.remote.control ->
///       {"event":"ms.channel.connect","data":{"token":"..."}}
///       or {"event":"ms.channel.unauthorized"}
class FakeTizen {
  final HttpServer server;
  int infoHits = 0;
  int wsUpgrades = 0;
  final List<String?> tokensSeen = [];
  final bool approve;
  final bool deny;
  final Duration approveDelay;
  final Map<String, dynamic>? infoBody;

  FakeTizen(this.server,
      {this.approve = true,
      this.deny = false,
      this.approveDelay = Duration.zero,
      this.infoBody});

  int get port => server.port;

  static Future<FakeTizen> start({
    bool approve = true,
    bool deny = false,
    Duration approveDelay = Duration.zero,
    Map<String, dynamic>? infoBody,
  }) async {
    final server = await HttpServer.bind('127.0.0.1', 0);
    final fake = FakeTizen(server,
        approve: approve,
        deny: deny,
        approveDelay: approveDelay,
        infoBody: infoBody);
    server.listen((req) async {
      try {
        if (req.uri.path == '/api/v2/' && req.method == 'GET') {
          fake.infoHits++;
          final body = fake.infoBody ??
              {
                'device': {
                  'name': '[TV] Fake Samsung',
                  'modelName': 'UE43AU7170',
                  'OS': 'Tizen',
                },
                'id': 'uuid:fake-test-id',
                'isSupport': {'remote': 'true'},
              };
          req.response.headers.contentType = ContentType.json;
          req.response.write(jsonEncode(body));
          await req.response.close();
        } else if (req.uri.path ==
            '/api/v2/channels/samsung.remote.control') {
          fake.wsUpgrades++;
          fake.tokensSeen.add(req.uri.queryParameters['token']);
          final ws = await WebSocketTransformer.upgrade(req);
          if (fake.deny) {
            ws.add(jsonEncode({'event': 'ms.channel.unauthorized'}));
            await ws.close();
            return;
          }
          if (fake.approveDelay > Duration.zero) {
            await Future<void>.delayed(fake.approveDelay);
          }
          if (fake.approve) {
            // Real Tizen emits ms.channel.connect spontaneously once the
            // user approves (or immediately for a trusted token) — the
            // client sends nothing first. Small delay keeps the
            // awaitingApproval stage observable in tests.
            await Future<void>.delayed(const Duration(milliseconds: 150));
            ws.add(jsonEncode({
              'event': 'ms.channel.connect',
              'data': {'token': 'test-token-abc123'}
            }));
          }
          // Keep the socket open for key commands; drain input.
          try {
            await ws.drain();
          } catch (_) {}
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

TvDevice samsungAt(String ip, int port) => TvDevice(
      id: 't-$ip-$port',
      name: 'Samsung TV',
      brand: TvBrand.samsung,
      protocol: TvProtocol.samsungTizenWs,
      ip: ip,
      port: port,
    );

/// Grab a port that is guaranteed closed afterwards.
Future<int> closedPort() async {
  final s = await ServerSocket.bind('127.0.0.1', 0);
  final p = s.port;
  await s.close();
  return p;
}

void main() {
  group('Endpoint whitelist (33528 class)', () {
    test('bogus stored ports are discarded, never probed first', () {
      expect(SamsungEndpointResolver.orderedPorts(33528), [8001, 8002]);
      expect(SamsungEndpointResolver.orderedPorts(0), [8001, 8002]);
      expect(SamsungEndpointResolver.orderedPorts(9197), [8001, 8002]);
      expect(SamsungEndpointResolver.orderedPorts(8001), [8001, 8002]);
      expect(SamsungEndpointResolver.orderedPorts(8002), [8002, 8001]);
    });

    test('manual Samsung IP resolves via verified endpoint', () async {
      final tv = await FakeTizen.start();
      try {
        final r = await SamsungEndpointResolver.resolve('127.0.0.1',
            probePorts: [tv.port]);
        expect(r.endpoint, isNotNull);
        expect(r.endpoint!.port, tv.port);
        expect(r.endpoint!.secure, isFalse);
        expect(r.failure, SamsungFailure.none);
      } finally {
        await tv.stop();
      }
    });

    test('device carrying port 33528 resolves to the REAL endpoint', () async {
      final tv = await FakeTizen.start();
      SamsungProvider? p;
      try {
        final dev = samsungAt('127.0.0.1', 33528);
        p = SamsungProvider(dev, testProbePorts: [tv.port]);
        final res = await p.pair();
        expect(res.success, isTrue);
        // The bogus port never became a dial target.
        final targets = p.attempts.map((a) => a.target).join('\n');
        expect(targets, isNot(contains('33528')));
        expect(tv.wsUpgrades, 1);
      } finally {
        await p?.disconnect();
        await tv.stop();
      }
    });
  });

  group('Transport failures (no approval prompt)', () {
    test('connection refused -> failed, never awaitingApproval', () async {
      final port = await closedPort();
      final p = SamsungProvider(samsungAt('127.0.0.1', port),
          testProbePorts: [port]);
      try {
        expect(p.stage, SamsungStage.idle);
        final res = await p.pair();
        expect(res.success, isFalse);
        expect(res.state, PairingState.failed); // NOT timeout prompt
        expect(p.stage, isNot(SamsungStage.awaitingApproval));
        expect(p.lastFailure, SamsungFailure.refused);
        expect(p.attempts, isNotEmpty);
      } finally {
        await p.disconnect();
      }
    });

    test('TLS handshake failure categorized distinctly', () async {
      // Plain-HTTP endpoint is not a TLS server: SecureSocket fails with
      // HandshakeException (not SocketException) — the resolver's `tls`
      // category trigger.
      final tv = await FakeTizen.start();
      try {
        Object? err;
        try {
          final s = await SecureSocket.connect('127.0.0.1', tv.port,
              timeout: const Duration(seconds: 5),
              onBadCertificate: (_) => true);
          await s.close();
        } catch (e) {
          err = e;
        }
        expect(err, isNotNull);
        expect(err, isNot(isA<SocketException>()));
      } finally {
        await tv.stop();
      }
    });

    test('port open but no Tizen device -> noDevice, no WS attempt',
        () async {
      final tv = await FakeTizen.start(infoBody: {'hello': 'not-a-tv'});
      try {
        final r = await SamsungEndpointResolver.resolve('127.0.0.1',
            probePorts: [tv.port]);
        expect(r.endpoint, isNull);
        expect(r.failure, SamsungFailure.noDevice);
        expect(tv.wsUpgrades, 0);
        final p =
            SamsungProvider(samsungAt('127.0.0.1', 0), testProbePorts: [
          tv.port
        ]);
        try {
          final res = await p.pair();
          expect(res.success, isFalse);
          expect(tv.wsUpgrades, 0); // pairing never attempted
        } finally {
          await p.disconnect();
        }
      } finally {
        await tv.stop();
      }
    });
  });

  group('Authorization + pairing lifecycle', () {
    test('approval only at auth stage; token returned for storage',
        () async {
      final tv = await FakeTizen.start(
          approveDelay: const Duration(milliseconds: 800));
      final p = SamsungProvider(samsungAt('127.0.0.1', 0),
          testProbePorts: [tv.port]);
      try {
        var sawResolving = false;
        var sawAwaiting = false;
        p.stageListenable.addListener(() {
          if (p.stage == SamsungStage.resolving) sawResolving = true;
          if (p.stage == SamsungStage.awaitingApproval) sawAwaiting = true;
        });
        final res = await p.pair();
        expect(res.success, isTrue);
        expect(res.clientKey, 'test-token-abc123');
        expect(sawResolving, isTrue);
        expect(sawAwaiting, isTrue); // prompt allowed only from here
        expect(p.stage, SamsungStage.paired);
      } finally {
        await p.disconnect();
        await tv.stop();
      }
    });

    test('denied by TV -> denied state', () async {
      final tv = await FakeTizen.start(approve: false, deny: true);
      final p = SamsungProvider(samsungAt('127.0.0.1', 0),
          testProbePorts: [tv.port]);
      try {
        final res = await p.pair();
        expect(res.success, isFalse);
        expect(res.state, PairingState.denied);
      } finally {
        await p.disconnect();
        await tv.stop();
      }
    });

    test('reconnect replays stored token, no new prompt', () async {
      final tv = await FakeTizen.start();
      SamsungProvider? first;
      SamsungProvider? second;
      try {
        first = SamsungProvider(samsungAt('127.0.0.1', 0),
            testProbePorts: [tv.port]);
        final r1 = await first.pair();
        expect(r1.success, isTrue);
        final token = r1.clientKey;
        expect(token, isNotNull);
        await first.disconnect();
        first = null;

        second = SamsungProvider(samsungAt('127.0.0.1', 0),
            savedToken: token, testProbePorts: [tv.port]);
        final r2 = await second.pair();
        expect(r2.success, isTrue);
        expect(tv.tokensSeen.last, token); // token replayed on the wire
        expect(tv.wsUpgrades, 2);
      } finally {
        await first?.disconnect();
        await second?.disconnect();
        await tv.stop();
      }
    });

    test('keys flow over the reused connection', () async {
      final tv = await FakeTizen.start();
      final p = SamsungProvider(samsungAt('127.0.0.1', 0),
          testProbePorts: [tv.port]);
      try {
        expect((await p.pair()).success, isTrue);
        expect(await p.sendKey(TvKey.home), isTrue);
        expect(await p.sendKey(TvKey.volumeUp), isTrue);
      } finally {
        await p.disconnect();
        await tv.stop();
      }
    });
  });
}
