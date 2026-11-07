import 'dart:async';
import 'dart:convert';
import 'dart:io';
import '../tv_models.dart';
import '../tv_provider.dart';
import 'sony_ircc.dart';

/// Sony Bravia IP control (docs-verified transport):
///  - POST http://TV:80/sony/system JSON-RPC (getSystemInformation,
///    getRemoteControllerInfo) with `X-Auth-PSK` header.
///  - POST http://TV:80/sony/IRCC SOAP `X_SendIRCC` with the IRCC code.
///
/// A 401/403 from /sony/system PROVES the API is present (endpoint
/// verified, PSK required). Connection refused/timeout = absent.
/// The PSK is set by the user on the TV (Network → IP control); the app
/// never bypasses it. IRCC codes come from runtime
/// getRemoteControllerInfo first, official-table fallback second.
class SonyProvider implements TvProvider {
  @override
  final TvDevice device;
  String? _psk;
  Map<String, String> _runtimeCodes = {};
  final _statusCtrl = StreamController<ConnectionStatus>.broadcast();
  ConnectionStatus _status = ConnectionStatus.disconnected;

  final List<int>? testPorts;
  SonyProvider(this.device, {String? savedPsk, this.testPorts})
      : _psk = savedPsk;

  static const keyNames = <TvKey, String>{
    TvKey.up: 'Up',
    TvKey.down: 'Down',
    TvKey.left: 'Left',
    TvKey.right: 'Right',
    TvKey.ok: 'Confirm',
    TvKey.back: 'Back',
    TvKey.home: 'Home',
    TvKey.menu: 'Options',
    TvKey.volumeUp: 'VolumeUp',
    TvKey.volumeDown: 'VolumeDown',
    TvKey.mute: 'Mute',
    TvKey.channelUp: 'ChannelUp',
    TvKey.channelDown: 'ChannelDown',
    TvKey.play: 'Play',
    TvKey.pause: 'Pause',
    TvKey.playPause: 'Play',
    TvKey.stop: 'Stop',
    TvKey.rewind: 'Rewind',
    TvKey.fastForward: 'Forward',
    TvKey.power: 'Power',
    TvKey.source: 'Input',
    TvKey.digit0: 'Num0',
    TvKey.digit1: 'Num1',
    TvKey.digit2: 'Num2',
    TvKey.digit3: 'Num3',
    TvKey.digit4: 'Num4',
    TvKey.digit5: 'Num5',
    TvKey.digit6: 'Num6',
    TvKey.digit7: 'Num7',
    TvKey.digit8: 'Num8',
    TvKey.digit9: 'Num9',
  };

  String _base() =>
      'http://${device.ip}:${testPorts != null && testPorts!.isNotEmpty ? testPorts!.first : (device.port == 0 ? 80 : device.port)}';

  static Map<String, dynamic> _rpc(String method) => {
        'method': method,
        'version': '1.0',
        'params': [],
        'id': 1,
      };

  static String irccEnvelope(String code) =>
      '<?xml version="1.0" encoding="utf-8"?>'
      '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" '
      's:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">'
      '<s:Body>'
      '<u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">'
      '<IRCCCode>$code</IRCCCode>'
      '</u:X_SendIRCC>'
      '</s:Body>'
      '</s:Envelope>';

  /// Runtime code map from a getRemoteControllerInfo response.
  /// Pure — tested with a sanitized capture.
  static Map<String, String> parseRemoteControllerInfo(String body) {
    final out = <String, String>{};
    try {
      final root = jsonDecode(body) as Map<String, dynamic>;
      final result = root['result'];
      final list = result is List && result.isNotEmpty ? result[1] : result;
      if (list is List) {
        for (final e in list) {
          if (e is Map) {
            final name = e['name']?.toString() ?? '';
            final value = e['value']?.toString() ?? '';
            if (name.isNotEmpty && value.isNotEmpty) out[name] = value;
          }
        }
      } else if (result is Map) {
        // Some firmwares nest differently; accept {"remote":[...]} too.
        final alt = result['remote'];
        if (alt is List) {
          for (final e in alt) {
            if (e is Map) {
              final name = e['name']?.toString() ?? '';
              final value = e['value']?.toString() ?? '';
              if (name.isNotEmpty && value.isNotEmpty) out[name] = value;
            }
          }
        }
      }
    } catch (_) {}
    return out;
  }

  @override
  ConnectionStatus get status => _status;
  @override
  Stream<ConnectionStatus> get statusStream => _statusCtrl.stream;

  /// App shortcuts only when the runtime map exposes per-model codes.
  @override
  TvCapabilities get capabilities =>
      TvCapabilities.forProtocol(TvProtocol.sonyIrcc).copyWith(
        appLaunch: _runtimeCodes.containsKey('Netflix') ||
            _runtimeCodes.containsKey('YouTube'),
      );

  void _set(ConnectionStatus s) {
    _status = s;
    if (!_statusCtrl.isClosed) _statusCtrl.add(s);
  }

  Future<({int code, String body})> _postSystem(
      Map<String, dynamic> rpc, String? psk) async {
    HttpClient? c;
    try {
      c = HttpClient()..connectionTimeout = const Duration(seconds: 4);
      final req = await c.postUrl(Uri.parse('${_base()}/sony/system'));
      req.headers.contentType = ContentType.json;
      if (psk != null && psk.isNotEmpty) {
        req.headers.set('X-Auth-PSK', psk);
      }
      req.write(jsonEncode(rpc));
      final resp = await req.close().timeout(const Duration(seconds: 5));
      final body =
          await resp.transform(utf8.decoder).join().timeout(const Duration(seconds: 5));
      return (code: resp.statusCode, body: body);
    } catch (_) {
      return (code: -1, body: '');
    } finally {
      try {
        c?.close(force: true);
      } catch (_) {}
    }
  }

  Future<bool> _sendIrcc(String code) async {
    final psk = _psk;
    if (psk == null || psk.isEmpty) return false;
    HttpClient? c;
    try {
      c = HttpClient()..connectionTimeout = const Duration(seconds: 4);
      final req = await c.postUrl(Uri.parse('${_base()}/sony/IRCC'));
      req.headers.contentType =
          ContentType('text', 'xml', charset: 'utf-8');
      req.headers.set('SOAPACTION',
          '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"');
      req.headers.set('X-Auth-PSK', psk);
      req.write(irccEnvelope(code));
      final resp = await req.close().timeout(const Duration(seconds: 5));
      await resp.drain().timeout(const Duration(seconds: 2));
      return resp.statusCode >= 200 && resp.statusCode < 300;
    } catch (_) {
      return false;
    } finally {
      try {
        c?.close(force: true);
      } catch (_) {}
    }
  }

  String? _codeFor(TvKey key) {
    final name = keyNames[key];
    if (name == null) return null;
    return _runtimeCodes[name] ?? sonyIrccFallback[name];
  }

  @override
  Future<PairingResult> pair({String? pin}) async {
    final psk = (pin ?? '').trim();
    if (psk.isEmpty) {
      return const PairingResult(false, PairingState.enteringPin,
          message: 'Enter the Pre-Shared Key from your TV');
    }
    _set(ConnectionStatus.pairing);
    try {
      final r = await _postSystem(_rpc('getRemoteControllerInfo'), psk);
      if (r.code == 401 || r.code == 403) {
        _set(ConnectionStatus.error);
        return const PairingResult(false, PairingState.denied,
            message: 'Wrong key — check the Pre-Shared Key on your TV');
      }
      if (r.code != 200) {
        _set(ConnectionStatus.error);
        return PairingResult(false, PairingState.failed,
            message: 'TV answered with HTTP ${r.code}');
      }
      final map = parseRemoteControllerInfo(r.body);
      if (map.isEmpty) {
        _set(ConnectionStatus.error);
        return const PairingResult(false, PairingState.failed,
            message: 'TV gave no remote codes (model not supported)');
      }
      _psk = psk;
      _runtimeCodes = map;
      _set(ConnectionStatus.connected);
      return PairingResult(true, PairingState.paired, clientKey: psk);
    } catch (e) {
      _set(ConnectionStatus.error);
      return PairingResult(false, PairingState.failed, message: '$e');
    }
  }

  @override
  Future<void> connect() async {
    if (_status == ConnectionStatus.connected) return;
    final psk = _psk;
    if (psk == null || psk.isEmpty) {
      _set(ConnectionStatus.error);
      throw StateError('Sony PSK required — pair first');
    }
    _set(ConnectionStatus.connecting);
    final r = await _postSystem(_rpc('getRemoteControllerInfo'), psk);
    if (r.code == 401 || r.code == 403) {
      _set(ConnectionStatus.error);
      throw StateError('Sony PSK rejected by the TV');
    }
    if (r.code != 200) {
      _set(ConnectionStatus.error);
      throw StateError('Sony TV answered with HTTP ${r.code}');
    }
    final map = parseRemoteControllerInfo(r.body);
    if (map.isEmpty) {
      _set(ConnectionStatus.error);
      throw StateError('Sony TV gave no remote codes');
    }
    _runtimeCodes = map;
    _set(ConnectionStatus.connected);
  }

  @override
  Future<bool> sendKey(TvKey key) async {
    if (_status != ConnectionStatus.connected) return false;
    final code = _codeFor(key);
    if (code == null) return false;
    return _sendIrcc(code);
  }

  @override
  Future<bool> setVolume(int delta) =>
      sendKey(delta >= 0 ? TvKey.volumeUp : TvKey.volumeDown);

  @override
  Future<bool> launchApp(String appId) async {
    // Only per-model runtime codes — never assumed.
    final want = appId.toLowerCase();
    String? code;
    if (want == 'netflix') {
      code = _runtimeCodes['Netflix'];
    } else if (want == 'youtube') {
      code = _runtimeCodes['YouTube'];
    }
    if (code == null) return false;
    return _sendIrcc(code);
  }

  @override
  Future<bool> switchInput(String inputId) async => false;

  @override
  Future<bool> sendText(String text) async => false;

  @override
  Future<bool> powerOff() => sendKey(TvKey.power);

  @override
  Future<bool> powerOn() async => false;

  @override
  Future<void> disconnect() async {
    _set(ConnectionStatus.disconnected);
  }
}
