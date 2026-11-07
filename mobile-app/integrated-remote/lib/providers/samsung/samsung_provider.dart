import 'dart:async';
import 'dart:convert';
import 'dart:io' show HttpClient, WebSocket;
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../tv_models.dart';
import '../tv_provider.dart';
import 'samsung_endpoint.dart';

/// Samsung Tizen WebSocket remote (ws(s)://TV:8001|8002/api/v2/channels/samsung.remote.control).
///
/// Flow: open WS with name query param -> TV shows Allow/Deny ->
/// first `ms.channel.connect` grants control. Newer firmwares return a
/// token (must be stored & replayed). Legacy (pre-2014, port 55000)
/// is detected but reported unsupported for control.
class SamsungProvider implements TvProvider {
  @override
  final TvDevice device;
  WebSocketChannel? _ch;
  String? _token;

  /// Test seam: fake-TV ports. Production always uses the 8001/8002
  /// whitelist via [SamsungEndpointResolver].
  final List<int>? testProbePorts;

  /// UI-gating stage: the approval prompt may show ONLY at
  /// [SamsungStage.awaitingApproval] — never on TCP refusal.
  final ValueNotifier<SamsungStage> stageListenable =
      ValueNotifier<SamsungStage>(SamsungStage.idle);
  SamsungStage get stage => stageListenable.value;

  /// Sanitized attempt log for diagnostics (host/port/outcome, no secrets).
  final List<SamsungAttempt> attempts = [];
  SamsungFailure? lastFailure;

  final _statusCtrl = StreamController<ConnectionStatus>.broadcast();
  ConnectionStatus _status = ConnectionStatus.disconnected;
  Timer? _reconnectTimer;
  int _retries = 0;

  SamsungProvider(this.device, {String? savedToken, this.testProbePorts})
      : _token = savedToken;

  void _setStage(SamsungStage s) => stageListenable.value = s;

  void _log(String target, String outcome) {
    attempts.add(SamsungAttempt(DateTime.now(), target, outcome));
    if (attempts.length > 10) attempts.removeAt(0);
  }

  static const keyMap = <TvKey, String>{
    TvKey.up: 'KEY_UP',
    TvKey.down: 'KEY_DOWN',
    TvKey.left: 'KEY_LEFT',
    TvKey.right: 'KEY_RIGHT',
    TvKey.ok: 'KEY_ENTER',
    TvKey.back: 'KEY_RETURN',
    TvKey.home: 'KEY_HOME',
    TvKey.menu: 'KEY_MENU',
    TvKey.guide: 'KEY_GUIDE',
    TvKey.info: 'KEY_INFO',
    TvKey.exit: 'KEY_EXIT',
    TvKey.volumeUp: 'KEY_VOLUP',
    TvKey.volumeDown: 'KEY_VOLDOWN',
    TvKey.mute: 'KEY_MUTE',
    TvKey.channelUp: 'KEY_CHUP',
    TvKey.channelDown: 'KEY_CHDOWN',
    TvKey.play: 'KEY_PLAY',
    TvKey.pause: 'KEY_PAUSE',
    TvKey.playPause: 'KEY_PLAY',
    TvKey.stop: 'KEY_STOP',
    TvKey.rewind: 'KEY_REWIND',
    TvKey.fastForward: 'KEY_FF',
    TvKey.power: 'KEY_POWER',
    TvKey.source: 'KEY_SOURCE',
    TvKey.search: 'KEY_SEARCH',
    TvKey.digit0: 'KEY_0',
    TvKey.digit1: 'KEY_1',
    TvKey.digit2: 'KEY_2',
    TvKey.digit3: 'KEY_3',
    TvKey.digit4: 'KEY_4',
    TvKey.digit5: 'KEY_5',
    TvKey.digit6: 'KEY_6',
    TvKey.digit7: 'KEY_7',
    TvKey.digit8: 'KEY_8',
    TvKey.digit9: 'KEY_9',
  };

  static String? keyCodeFor(TvKey k) => keyMap[k];

  @override
  ConnectionStatus get status => _status;
  @override
  Stream<ConnectionStatus> get statusStream => _statusCtrl.stream;
  @override
  TvCapabilities get capabilities =>
      TvCapabilities.forProtocol(TvProtocol.samsungTizenWs);

  void _set(ConnectionStatus s) {
    _status = s;
    if (!_statusCtrl.isClosed) _statusCtrl.add(s);
  }

  Uri _uri({required bool secure, required int port}) {
    final scheme = secure ? 'wss' : 'ws';
    final name = base64.encode(utf8.encode('TW9ycGhSZW1vdGU='));
    return Uri.parse(
      '$scheme://${device.ip}:$port/api/v2/channels/samsung.remote.control?name=$name${_token != null ? '&token=$_token' : ''}',
    );
  }

  /// Candidate WS endpoints. The verified endpoint goes first; only
  /// whitelisted ports (8001/8002) or explicit test ports are ever built —
  /// a stored bogus port (e.g. 33528) can never become a dial target.
  List<Uri> _candidates(SamsungEndpoint? resolved) {
    if (testProbePorts != null) {
      return testProbePorts!
          .map((p) => _uri(secure: false, port: p))
          .toList();
    }
    final ports = SamsungEndpointResolver.orderedPorts(device.port);
    final ordered = <int>[];
    if (resolved != null) ordered.add(resolved.port);
    for (final p in ports) {
      if (!ordered.contains(p)) ordered.add(p);
    }
    final out = <Uri>[];
    final resolvedSecure = resolved?.secure;
    for (final p in ordered) {
      if (p == 8001) {
        out.add(_uri(secure: false, port: p));
        out.add(_uri(secure: true, port: p));
      } else if (p == 8002) {
        out.add(_uri(secure: true, port: p));
        out.add(_uri(secure: false, port: p));
      }
    }
    // Resolved-secure endpoint first if it was the secure variant.
    if (resolved != null && resolvedSecure == true && out.length > 1) {
      final first =
          out.firstWhere((u) => u.scheme == 'wss' && u.port == resolved.port,
              orElse: () => out.first);
      out.remove(first);
      out.insert(0, first);
    }
    return out;
  }

  /// Serialize a key press envelope. Pure — unit tested.
  static String encodeKeyCommand(String key, {String cmd = 'Click'}) =>
      jsonEncode({
        'method': 'ms.remote.control',
        'params': {
          'Cmd': cmd,
          'DataOfCmd': key,
          'Option': 'false',
          'TypeOfRemote': 'SendRemoteKey',
        },
      });

  @override
  Future<PairingResult> pair({String? pin}) async {
    _set(ConnectionStatus.pairing);
    try {
      await connect().timeout(const Duration(seconds: 40));
      // Return the TV-issued token so the caller persists it — without
      // this the TV prompts for approval on EVERY launch.
      return PairingResult(true, PairingState.paired, clientKey: _token);
    } on TimeoutException {
      _set(ConnectionStatus.error);
      _setStage(SamsungStage.failed);
      return const PairingResult(false, PairingState.timeout,
          message: 'No approval from TV within the time limit');
    } on StateError catch (e) {
      _set(ConnectionStatus.error);
      _setStage(SamsungStage.failed);
      final denied = '$e'.toLowerCase().contains('denied');
      return PairingResult(false,
          denied ? PairingState.denied : PairingState.failed,
          message: denied ? 'Pairing was declined on the TV' : '$e');
    } on SamsungConnectException catch (e) {
      // Transport never established: connection problem, NOT an approval
      // problem. The UI must show a connection error, never "Allow on TV".
      _set(ConnectionStatus.error);
      _setStage(SamsungStage.failed);
      lastFailure = e.failure;
      return PairingResult(false, PairingState.failed,
          message: _userMessage(e.failure, e.message));
    } catch (e) {
      _set(ConnectionStatus.error);
      _setStage(SamsungStage.failed);
      return PairingResult(false, PairingState.failed, message: '$e');
    }
  }

  /// Maps transport failures to plain-language connection errors.
  static String _userMessage(SamsungFailure f, String detail) {
    switch (f) {
      case SamsungFailure.refused:
        return 'Could not reach the TV (connection refused). Make sure it is '
            'powered on and on the same Wi-Fi, then retry.';
      case SamsungFailure.timeout:
        return 'The TV did not answer. Make sure it is on and on the same '
            'Wi-Fi, then retry.';
      case SamsungFailure.tls:
        return 'Secure connection failed. Retry — the app will try the '
            'compatible endpoint automatically.';
      case SamsungFailure.noDevice:
        return 'This screen does not expose a supported Samsung remote '
            'service (model/generation not supported).';
      case SamsungFailure.http:
        return 'The TV answered unexpectedly. Retry once; if it persists, '
            'see diagnostics.';
      case SamsungFailure.none:
        return detail;
    }
  }

  @override
  Future<void> connect() async {
    if (_status == ConnectionStatus.connected) return;
    _set(ConnectionStatus.connecting);
    _setStage(SamsungStage.resolving);

    // 1. VERIFY FIRST: resolve the real remote endpoint. A stored bogus
    // port (e.g. 33528 from a LOCATION/service advertisement) is discarded
    // here and can never become a dial target.
    final ports = testProbePorts ??
        SamsungEndpointResolver.orderedPorts(device.port);
    final resolution = await SamsungEndpointResolver.resolve(
      device.ip,
      probePorts: ports,
    );
    lastFailure =
        resolution.failure == SamsungFailure.none ? null : resolution.failure;
    if (resolution.endpoint == null) {
      final msg = 'No Samsung remote endpoint on ${device.ip} '
          '(${resolution.detail})';
      _log('${device.ip}:8001/8002', 'unresolved - ${resolution.detail}');
      _set(ConnectionStatus.error);
      _setStage(SamsungStage.failed);
      _scheduleReconnect();
      throw SamsungConnectException(resolution.failure, msg);
    }
    _log(resolution.endpoint.toString(),
        'verified - ${resolution.detail}');

    // 2. Dial the verified endpoint first, whitelisted fallback second.
    Exception? last;
    for (final c in _candidates(resolution.endpoint)) {
      HttpClient? httpClient;
      try {
        _setStage(SamsungStage.connecting);
        // badCertificateCallback is scoped to THIS HttpClient for THIS
        // user-selected LAN TV only - never a global override.
        httpClient = HttpClient()
          ..badCertificateCallback = ((_, __, ___) => true)
          ..connectionTimeout = const Duration(seconds: 10);
        final raw = await WebSocket.connect(
          c.toString(),
          customClient: httpClient,
        ).timeout(const Duration(seconds: 12));
        final ch = IOWebSocketChannel(raw);
        _ch = ch;
        // Transport is up: from THIS point the TV may show Allow/Deny.
        _setStage(SamsungStage.awaitingApproval);
        _log(c.toString(), 'transport up - awaiting TV approval');
        final completer = Completer<void>();
        late StreamSubscription sub;
        sub = ch.stream.listen((raw) {
          try {
            final m = jsonDecode(raw as String) as Map<String, dynamic>;
            final event = (m['event'] as String?) ?? '';
            if (event == 'ms.channel.connect' ||
                event == 'ms.channel.ready') {
              if (!completer.isCompleted) completer.complete();
            } else if (event == 'ms.channel.unauthorized') {
              if (!completer.isCompleted) {
                completer.completeError(StateError('Denied by TV'));
              }
            }
            final token = m['data']?['token'];
            if (token is String && token.isNotEmpty) _token = token;
          } catch (_) {}
        }, onError: (e) {
          if (!completer.isCompleted) completer.completeError(e);
        }, onDone: () {
          if (!completer.isCompleted) {
            completer.completeError(StateError('TV closed connection'));
          }
        });
        await completer.future.timeout(const Duration(seconds: 25));
        await sub.cancel();
        _retries = 0;
        _setStage(SamsungStage.paired);
        _set(ConnectionStatus.connected);
        _log(c.toString(),
            'paired (token ${_token == null ? 'absent' : 'stored'})');
        try {
          httpClient.close();
        } catch (_) {}
        return;
      } catch (e) {
        if (e is StateError && '$e'.contains('Denied')) {
          try {
            await _ch?.sink.close();
          } catch (_) {}
          try {
            httpClient?.close();
          } catch (_) {}
          _ch = null;
          _log(c.toString(), 'denied by TV');
          rethrow; // pair() maps this to PairingState.denied
        }
        last = e is Exception ? Exception('$e') : Exception('$e');
        _log(c.toString(), 'failed ($e)');
        try {
          await _ch?.sink.close();
        } catch (_) {}
        try {
          httpClient?.close();
        } catch (_) {}
        _ch = null;
      }
    }
    _set(ConnectionStatus.error);
    _setStage(SamsungStage.failed);
    _scheduleReconnect();
    throw last ?? Exception('Samsung connect failed');
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    if (_retries >= 5) return;
    final delay = Duration(seconds: 2 << _retries);
    _retries++;
    _reconnectTimer = Timer(delay, () {
      if (_status == ConnectionStatus.error) {
        connect().catchError((_) {});
      }
    });
  }

  @override
  Future<bool> sendKey(TvKey key) async {
    final code = keyMap[key];
    if (code == null || _ch == null) return false;
    try {
      _ch!.sink.add(encodeKeyCommand(code));
      return true;
    } catch (_) {
      _set(ConnectionStatus.error);
      _scheduleReconnect();
      return false;
    }
  }

  @override
  Future<bool> setVolume(int delta) =>
      sendKey(delta >= 0 ? TvKey.volumeUp : TvKey.volumeDown);

  static const _apps = {
    'netflix': '11101200001',
    'youtube': '111299001912',
    'prime': '3201412000678',
    'disney': '3201901017648',
  };

  @override
  Future<bool> launchApp(String appId) async {
    final resolved = _apps[appId.toLowerCase()] ?? appId;
    if (_ch == null) return false;
    try {
      _ch!.sink.add(jsonEncode({
        'method': 'ms.channel.emit',
        'params': {'event': 'ed.apps.launch', 'to': 'host', 'data': {'appId': resolved}}
      }));
      return true;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<bool> switchInput(String inputId) async =>
      sendKey(TvKey.source);

  @override
  Future<bool> sendText(String text) async {
    if (_ch == null) return false;
    try {
      _ch!.sink.add(jsonEncode({
        'method': 'ms.remote.control',
        'params': {'Cmd': 'InsertText', 'DataOfCmd': text, 'TypeOfRemote': 'SendInputString'}
      }));
      return true;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<bool> powerOff() => sendKey(TvKey.power);

  @override
  Future<bool> powerOn() async => false; // WoL handled by caller when MAC known.

  @override
  Future<void> disconnect() async {
    _reconnectTimer?.cancel();
    try {
      await _ch?.sink.close();
    } catch (_) {}
    _ch = null;
    _set(ConnectionStatus.disconnected);
  }
}
