import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../tv_models.dart';
import '../tv_provider.dart';

/// LG webOS second-screen protocol (ws://TV:3000).
/// Register handshake:
///   {"type":"register","payload":{"manifest":{...},"client-key":saved?}}
/// TV prompts Allow -> returns {"client-key":"..."} which must be stored
/// and replayed for silent reconnects. Remote input via
/// `request` / `ssap://com.webos.service.networkinput/*` and
/// media controls via `ssap://media.controls/*`.
class LgProvider implements TvProvider {
  @override
  final TvDevice device;
  String? clientKey;
  WebSocketChannel? _ch;
  int _id = 1;
  final _pending = <String, Completer<Map<String, dynamic>>>{};
  final _statusCtrl = StreamController<ConnectionStatus>.broadcast();
  ConnectionStatus _status = ConnectionStatus.disconnected;
  Timer? _reconnect;
  int _retries = 0;

  LgProvider(this.device, {this.clientKey});

  static const keyButtonMap = <TvKey, String>{
    TvKey.up: 'UP',
    TvKey.down: 'DOWN',
    TvKey.left: 'LEFT',
    TvKey.right: 'RIGHT',
    TvKey.ok: 'ENTER',
    TvKey.back: 'BACK',
    TvKey.home: 'HOME',
    TvKey.menu: 'MENU',
    TvKey.exit: 'EXIT',
    TvKey.volumeUp: 'VOLUMEUP',
    TvKey.volumeDown: 'VOLUMEDOWN',
    TvKey.mute: 'MUTE',
    TvKey.channelUp: 'CHANNELUP',
    TvKey.channelDown: 'CHANNELDOWN',
    TvKey.play: 'PLAY',
    TvKey.pause: 'PAUSE',
    TvKey.playPause: 'PLAY',
    TvKey.stop: 'STOP',
    TvKey.rewind: 'REWIND',
    TvKey.fastForward: 'FASTFORWARD',
    TvKey.info: 'INFO',
    TvKey.guide: 'PROGRAM',
    TvKey.settings: 'MENU',
    TvKey.digit0: '0',
    TvKey.digit1: '1',
    TvKey.digit2: '2',
    TvKey.digit3: '3',
    TvKey.digit4: '4',
    TvKey.digit5: '5',
    TvKey.digit6: '6',
    TvKey.digit7: '7',
    TvKey.digit8: '8',
    TvKey.digit9: '9',
  };

  static String registerPayload({String? savedKey}) => jsonEncode({
    'type': 'register',
    'id': 'register_0',
    'payload': {
      'forcePairing': false,
      'pairingType': 'PROMPT',
      'client-key': savedKey,
      'manifest': {
        'manifestVersion': 1,
        'appVersion': '1.0.0',
        'signed': {
          'created': '20240101',
          'appId': 'com.morphremote.app',
          'vendorId': 'com.morphremote',
          'localizedAppNames': {'': 'Morph Remote'},
          'permissions': [
            'LAUNCH',
            'LAUNCH_WEBAPP',
            'CONTROL_AUDIO',
            'CONTROL_DISPLAY',
            'CONTROL_INPUT_MEDIA_PLAYBACK',
            'CONTROL_POWER',
          ],
        },
        'permissions': [
          'TEST_OPEN',
          'CONTROL_AUDIO',
          'CONTROL_DISPLAY',
          'CONTROL_INPUT_MEDIA_PLAYBACK',
        ],
        'signatures': [
          {'signatureVersion': 1, 'signature': 'morph-remote'},
        ],
      },
    },
  });

  static String encodeButton(String button) => jsonEncode({
    'type': 'request',
    'id': 'btn_${DateTime.now().microsecondsSinceEpoch}',
    'uri': 'ssap://com.webos.service.networkinput/sendSpecialKey',
    'payload': {'key': button},
  });

  @override
  ConnectionStatus get status => _status;
  @override
  Stream<ConnectionStatus> get statusStream => _statusCtrl.stream;
  @override
  TvCapabilities get capabilities =>
      TvCapabilities.forProtocol(TvProtocol.lgWebOs);

  void _set(ConnectionStatus s) {
    _status = s;
    if (!_statusCtrl.isClosed) _statusCtrl.add(s);
  }

  Uri _uri() =>
      Uri.parse('ws://${device.ip}:${device.port == 0 ? 3000 : device.port}');

  @override
  Future<PairingResult> pair({String? pin}) async {
    _set(ConnectionStatus.pairing);
    try {
      await _openAndRegister(timeout: const Duration(seconds: 30));
      return PairingResult(true, PairingState.paired, clientKey: clientKey);
    } on TimeoutException {
      _set(ConnectionStatus.error);
      return const PairingResult(false, PairingState.timeout);
    } on StateError catch (e) {
      _set(ConnectionStatus.error);
      final denied = '$e'.toLowerCase().contains('denied');
      return PairingResult(
        false,
        denied ? PairingState.denied : PairingState.failed,
        message: '$e',
      );
    } catch (e) {
      _set(ConnectionStatus.error);
      return PairingResult(false, PairingState.failed, message: '$e');
    }
  }

  Future<void> _openAndRegister({
    Duration timeout = const Duration(seconds: 20),
  }) async {
    final ch = WebSocketChannel.connect(_uri());
    _ch = ch;
    final regDone = Completer<void>();
    ch.stream.listen(
      (raw) {
        try {
          final m = jsonDecode(raw as String) as Map<String, dynamic>;
          if (m['type'] == 'registered') {
            final key = m['payload']?['client-key'] as String?;
            if (key != null && key.isNotEmpty) clientKey = key;
            if (!regDone.isCompleted) regDone.complete();
          } else if (m['type'] == 'response') {
            final id = m['id'] as String?;
            if (id != null && _pending.containsKey(id)) {
              _pending.remove(id)?.complete(m);
            }
          } else if (m['type'] == 'error') {
            final err = (m['error'] as String?) ?? '';
            if (err.contains('denied') && !regDone.isCompleted) {
              regDone.completeError(StateError('Pairing denied by TV'));
            }
          }
        } catch (_) {}
      },
      onDone: () {
        if (!regDone.isCompleted) {
          regDone.completeError(StateError('TV closed connection'));
        }
        if (_status == ConnectionStatus.connected) {
          _set(ConnectionStatus.error);
          _scheduleReconnect();
        }
      },
      onError: (e) {
        if (!regDone.isCompleted) regDone.completeError(e);
      },
    );
    ch.sink.add(registerPayload(savedKey: clientKey));
    await regDone.future.timeout(timeout);
    _retries = 0;
    _set(ConnectionStatus.connected);
  }

  void _scheduleReconnect() {
    _reconnect?.cancel();
    if (_retries >= 5) return;
    _retries++;
    _reconnect = Timer(Duration(seconds: 2 << (_retries - 1)), () {
      if (_status == ConnectionStatus.error) {
        connect().catchError((_) {});
      }
    });
  }

  @override
  Future<void> connect() async {
    if (_status == ConnectionStatus.connected) return;
    _set(ConnectionStatus.connecting);
    try {
      await _openAndRegister();
    } catch (_) {
      _set(ConnectionStatus.error);
      _scheduleReconnect();
      rethrow;
    }
  }

  Future<bool> _request(String uri, Map<String, dynamic> payload) async {
    if (_ch == null || _status != ConnectionStatus.connected) return false;
    final id = 'req_${_id++}';
    final c = Completer<Map<String, dynamic>>();
    _pending[id] = c;
    _ch!.sink.add(
      jsonEncode({'type': 'request', 'id': id, 'uri': uri, 'payload': payload}),
    );
    try {
      final res = await c.future.timeout(const Duration(seconds: 5));
      return res['type'] == 'response';
    } catch (_) {
      _pending.remove(id);
      return false;
    }
  }

  @override
  Future<bool> sendKey(TvKey key) async {
    switch (key) {
      case TvKey.power:
        return _request('ssap://system/turnOff', {});
      case TvKey.source:
        return _request('ssap://tv/openChannelList', {});
      case TvKey.playPause:
        return _request('ssap://media.controls/play', {});
      case TvKey.play:
        return _request('ssap://media.controls/play', {});
      case TvKey.pause:
        return _request('ssap://media.controls/pause', {});
      case TvKey.stop:
        return _request('ssap://media.controls/stop', {});
      case TvKey.rewind:
        return _request('ssap://media.controls/rewind', {});
      case TvKey.fastForward:
        return _request('ssap://media.controls/fastForward', {});
      default:
        final btn = keyButtonMap[key];
        if (btn == null || _ch == null) return false;
        try {
          _ch!.sink.add(
            jsonEncode({
              'type': 'request',
              'id': 'btn_${_id++}',
              'uri': 'ssap://com.webos.service.networkinput/sendSpecialKey',
              'payload': {'key': btn},
            }),
          );
          return true;
        } catch (_) {
          return false;
        }
    }
  }

  @override
  Future<bool> setVolume(int delta) async => delta >= 0
      ? _request('ssap://audio/volumeUp', {})
      : _request('ssap://audio/volumeDown', {});

  static const _apps = {
    'netflix': 'netflix',
    'youtube': 'youtube.leanback.v4',
    'prime': 'amazon',
    'disney': 'disney.plus',
  };

  @override
  Future<bool> launchApp(String appId) => _request(
    'ssap://system.launcher/launch',
    {'id': _apps[appId.toLowerCase()] ?? appId},
  );

  @override
  Future<bool> switchInput(String inputId) =>
      _request('ssap://tv/switchInput', {'inputId': inputId});

  @override
  Future<bool> sendText(String text) => _request(
    'ssap://com.webos.service.networkinput/insertText',
    {'text': text},
  );

  @override
  Future<bool> powerOff() => _request('ssap://system/turnOff', {});
  @override
  Future<bool> powerOn() async => false;

  @override
  Future<void> disconnect() async {
    _reconnect?.cancel();
    try {
      await _ch?.sink.close();
    } catch (_) {}
    _ch = null;
    _set(ConnectionStatus.disconnected);
  }
}
