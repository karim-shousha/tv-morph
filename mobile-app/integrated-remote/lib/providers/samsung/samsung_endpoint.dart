import 'dart:async';
import 'dart:convert';
import 'dart:io';

/// Samsung Tizen endpoint verification.
///
/// ROOT-CAUSE CONTEXT: a Samsung pairing once attempted `10.0.0.137:33528` —
/// an ephemeral/discovery-service port that can never serve the remote
/// API — and failed with `Connection refused` while the UI already asked
/// the user to "Allow" on the TV. Two rules fix this by construction:
///
///  1. Only ports 8001 (ws, proven by the reference app) and 8002 (wss,
///     newer Tizen) are ever dialed. Any other stored/discovered port is
///     discarded, never probed, never connected.
///  2. No pairing is attempted until an endpoint is VERIFIED: TCP connect
///     plus the Tizen info marker (HTTP /api/v2/ device object on 8001;
///     TLS handshake on 8002).
///
/// No secrets are logged here — only host, port, transport and outcome.
enum SamsungFailure {
  none,
  refused, // TCP RST — nothing listening (the 33528 symptom class)
  timeout, // host silent / wrong subnet / TV asleep
  tls, // TLS handshake failed on the secure endpoint
  noDevice, // port open but no Tizen device object (wrong generation/service)
  http, // unexpected HTTP status
}

class SamsungEndpoint {
  final String ip;
  final int port;
  final bool secure;
  const SamsungEndpoint(
      {required this.ip, required this.port, required this.secure});

  @override
  String toString() => '${secure ? "wss" : "ws"}://$ip:$port';
}

class SamsungResolution {
  final SamsungEndpoint? endpoint;
  final SamsungFailure failure;
  final String detail;
  const SamsungResolution(
      {required this.endpoint, required this.failure, required this.detail});
}

/// Thrown when no verified endpoint exists. The UI maps [failure] to a
/// connection error — never to an approval prompt.
class SamsungConnectException implements Exception {
  final SamsungFailure failure;
  final String message;
  const SamsungConnectException(this.failure, this.message);
  @override
  String toString() => 'SamsungConnectException($failure): $message';
}

/// Connection stages, so the UI can show "Waiting for TV approval" ONLY
/// after the transport reached the authorization stage — never on a TCP
/// refusal.
enum SamsungStage {
  idle,
  resolving,
  connecting,
  awaitingApproval,
  paired,
  failed,
}

/// One sanitized connection attempt for diagnostics (no tokens).
class SamsungAttempt {
  final DateTime at;
  final String target;
  final String outcome;
  const SamsungAttempt(this.at, this.target, this.outcome);
  @override
  String toString() => '${at.toIso8601String()} $target -> $outcome';
}

class SamsungEndpointResolver {
  static const verifiedPorts = [8001, 8002];

  /// Order candidate ports: explicitly probed/whitelisted port first,
  /// otherwise 8001 (reference-proven) then 8002.
  static List<int> orderedPorts(int storedPort, {List<int>? override}) {
    if (override != null) return List<int>.from(override);
    if (storedPort == 8001) return [8001, 8002];
    if (storedPort == 8002) return [8002, 8001];
    // Any other stored value (0, 33528, LOCATION ports, …) is discarded.
    return [8001, 8002];
  }

  static Future<String?> _getInfo(String ip, int port,
      {Duration timeout = const Duration(milliseconds: 1500)}) async {
    HttpClient? client;
    try {
      client = HttpClient()..connectionTimeout = timeout;
      final req = await client.getUrl(Uri.parse('http://$ip:$port/api/v2/'));
      final resp = await req.close().timeout(timeout);
      if (resp.statusCode != 200) return null;
      return await resp.transform(utf8.decoder).join().timeout(timeout);
    } catch (_) {
      return null;
    } finally {
      try {
        client?.close(force: true);
      } catch (_) {}
    }
  }

  static bool hasTizenDevice(String body) {
    try {
      final root = jsonDecode(body) as Map<String, dynamic>;
      final d = root['device'] as Map<String, dynamic>?;
      final model = (d?['modelName'] as Object?)?.toString() ?? '';
      return model.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  static Future<SamsungResolution> resolve(
    String ip, {
    List<int>? probePorts,
    Duration tcpTimeout = const Duration(milliseconds: 1500),
  }) async {
    final ports = probePorts ?? verifiedPorts;
    SamsungFailure lastFailure = SamsungFailure.refused;
    String lastDetail = 'no candidate answered';
    for (final port in ports) {
      // Plain (ws-style) candidates: TCP + HTTP /api/v2/ device check.
      if (port != 8002) {
        try {
          final sock = await Socket.connect(ip, port, timeout: tcpTimeout);
          try {
            sock.destroy();
          } catch (_) {}
        } on SocketException catch (e) {
          lastFailure = SamsungFailure.refused;
          lastDetail = 'TCP $ip:$port refused (${e.osError?.errorCode})';
          continue;
        } on TimeoutException {
          lastFailure = SamsungFailure.timeout;
          lastDetail = 'TCP $ip:$port timed out';
          continue;
        } catch (e) {
          lastFailure = SamsungFailure.timeout;
          lastDetail = 'TCP $ip:$port failed ($e)';
          continue;
        }
        final body = await _getInfo(ip, port);
        if (body != null && hasTizenDevice(body)) {
          return SamsungResolution(
            endpoint: SamsungEndpoint(ip: ip, port: port, secure: false),
            failure: SamsungFailure.none,
            detail: 'verified Tizen device object on $ip:$port',
          );
        }
        lastFailure = SamsungFailure.noDevice;
        lastDetail = '$ip:$port open but no Tizen device object';
        continue;
      }
      // Secure candidate (8002): TCP + TLS handshake verification.
      try {
        final sock = await SecureSocket.connect(
          ip,
          port,
          timeout: tcpTimeout,
          onBadCertificate: (_) => true,
        );
        try {
          await sock.close();
        } catch (_) {}
        return SamsungResolution(
          endpoint: SamsungEndpoint(ip: ip, port: port, secure: true),
          failure: SamsungFailure.none,
          detail: 'TLS handshake ok on $ip:$port',
        );
      } on SocketException catch (e) {
        lastFailure = SamsungFailure.refused;
        lastDetail = 'TCP $ip:$port refused (${e.osError?.errorCode})';
      } on TimeoutException {
        lastFailure = SamsungFailure.timeout;
        lastDetail = 'TLS $ip:$port timed out';
      } catch (_) {
        // SecureSocket throws HandshakeException (a TLS failure, distinct
        // from TCP refusal) when the peer is not a TLS server.
        lastFailure = SamsungFailure.tls;
        lastDetail = 'TLS handshake failed on $ip:$port';
      }
    }
    // Legacy hint: pre-2014 Samsung sets listen on 55000 with a different
    // protocol we do not implement. Report it instead of a bare refusal.
    if (await _tcpPortOpen(ip, 55000)) {
      return SamsungResolution(
        endpoint: null,
        failure: SamsungFailure.noDevice,
        detail:
            'no Tizen endpoint on 8001/8002, but port 55000 is open — this looks like a legacy pre-2014 Samsung set, which is not supported',
      );
    }
    return SamsungResolution(
        endpoint: null, failure: lastFailure, detail: lastDetail);
  }

  static Future<bool> _tcpPortOpen(String ip, int port) async {
    try {
      final s = await Socket.connect(ip, port,
          timeout: const Duration(milliseconds: 800));
      try {
        s.destroy();
      } catch (_) {}
      return true;
    } catch (_) {
      return false;
    }
  }
}
