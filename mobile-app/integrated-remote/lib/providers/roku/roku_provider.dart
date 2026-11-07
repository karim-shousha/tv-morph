import 'dart:async';
import 'dart:convert';
import 'dart:io';
import '../tv_models.dart';
import '../tv_provider.dart';

/// Roku External Control Protocol (docs-verified against
/// developer.roku.com ECP reference).
///
/// - Discovery: SSDP `ST: roku:ecp`, LOCATION http://IP:8060/,
///   verified by GET /query/device-info (no auth required).
/// - Control: POST /keypress/<KEY> (empty body). No pairing, no tokens —
///   the TV owner gates this with "Control by mobile apps" on the TV.
/// - Roku OS 14.1+: keypress requires that setting Enabled; a 403/4xx
///   surfaces as a clear message, never a fake success.
/// - Power: PowerOff key (Roku TVs only). No power-on exists.
/// - Apps: resolved at runtime from GET /query/apps — never hardcoded IDs.
class RokuProvider implements TvProvider {
  @override
  final TvDevice device;
  final _statusCtrl = StreamController<ConnectionStatus>.broadcast();
  ConnectionStatus _status = ConnectionStatus.disconnected;

  bool _isTv = true;
  String _modelName = '';
  final Map<String, String> _appIds = {}; // lowercase name -> id

  RokuProvider(this.device);

  static const keyMap = <TvKey, String>{
    TvKey.up: 'Up',
    TvKey.down: 'Down',
    TvKey.left: 'Left',
    TvKey.right: 'Right',
    TvKey.ok: 'Select',
    TvKey.back: 'Back',
    TvKey.home: 'Home',
    TvKey.volumeUp: 'VolumeUp',
    TvKey.volumeDown: 'VolumeDown',
    TvKey.mute: 'VolumeMute',
    TvKey.channelUp: 'ChannelUp',
    TvKey.channelDown: 'ChannelDown',
    TvKey.play: 'Play',
    TvKey.pause: 'Play',
    TvKey.playPause: 'Play',
    TvKey.rewind: 'Rev',
    TvKey.fastForward: 'Fwd',
    TvKey.power: 'PowerOff',
    TvKey.search: 'Search',
  };

  static const _inputKeys = <String, String>{
    'tuner': 'InputTuner',
    'hdmi1': 'InputHDMI1',
    'hdmi2': 'InputHDMI2',
    'hdmi3': 'InputHDMI3',
    'hdmi4': 'InputHDMI4',
    'av': 'InputAV1',
  };

  String _base() =>
      'http://${device.ip}:${device.port == 0 ? 8060 : device.port}';

  static String? _tag(String xml, String tag) {
    final m = RegExp('<$tag>(.*?)</$tag>', dotAll: true).firstMatch(xml);
    return m?.group(1)?.trim();
  }

  @override
  ConnectionStatus get status => _status;
  @override
  Stream<ConnectionStatus> get statusStream => _statusCtrl.stream;

  /// Volume/channel/input keys exist on Roku TVs; sticks lack them.
  @override
  TvCapabilities get capabilities =>
      TvCapabilities.forProtocol(TvProtocol.rokuEcp).copyWith(
        volume: _isTv,
        mute: _isTv,
        channels: _isTv,
        inputSelect: _isTv,
        powerOff: _isTv,
      );

  void _set(ConnectionStatus s) {
    _status = s;
    if (!_statusCtrl.isClosed) _statusCtrl.add(s);
  }

  Future<String?> _get(String path) async {
    HttpClient? c;
    try {
      c = HttpClient()..connectionTimeout = const Duration(seconds: 3);
      final req = await c.getUrl(Uri.parse('${_base()}$path'));
      final resp = await req.close().timeout(const Duration(seconds: 4));
      if (resp.statusCode != 200) return null;
      return await resp.transform(utf8.decoder).join().timeout(
            const Duration(seconds: 4),
          );
    } catch (_) {
      return null;
    } finally {
      try {
        c?.close(force: true);
      } catch (_) {}
    }
  }

  Future<int> _post(String path) async {
    HttpClient? c;
    try {
      c = HttpClient()..connectionTimeout = const Duration(seconds: 4);
      final req = await c.postUrl(Uri.parse('${_base()}$path'));
      req.contentLength = 0;
      final resp = await req.close().timeout(const Duration(seconds: 5));
      await resp.drain().timeout(const Duration(seconds: 2));
      return resp.statusCode;
    } catch (_) {
      return -1;
    } finally {
      try {
        c?.close(force: true);
      } catch (_) {}
    }
  }

  /// Verify the ECP endpoint and read device identity. Pure parsing is
  /// factored for tests ([parseDeviceInfo]).
  static ({String model, bool isTv}) parseDeviceInfo(String xml) {
    final model = _tag(xml, 'model-name') ?? _tag(xml, 'model-number') ?? '';
    final isTv = (_tag(xml, 'is-tv') ?? 'false').toLowerCase() == 'true';
    return (model: model, isTv: isTv);
  }

  static Map<String, String> parseApps(String xml) {
    final out = <String, String>{};
    for (final m
        in RegExp(r'<app[^>]*id="([^"]+)"[^>]*>(.*?)</app>', dotAll: true)
            .allMatches(xml)) {
      final name = m.group(2)?.trim() ?? '';
      final id = m.group(1)?.trim() ?? '';
      if (name.isNotEmpty && id.isNotEmpty) {
        out[name.toLowerCase()] = id;
      }
    }
    return out;
  }

  @override
  Future<PairingResult> pair({String? pin}) async {
    // No authentication exists in ECP by design.
    _set(ConnectionStatus.pairing);
    try {
      await connect().timeout(const Duration(seconds: 12));
      return const PairingResult(true, PairingState.paired);
    } catch (e) {
      _set(ConnectionStatus.error);
      return PairingResult(false, PairingState.failed, message: '$e');
    }
  }

  @override
  Future<void> connect() async {
    if (_status == ConnectionStatus.connected) return;
    _set(ConnectionStatus.connecting);
    final xml = await _get('/query/device-info');
    if (xml == null || !xml.contains('<device-info')) {
      _set(ConnectionStatus.error);
      throw const SocketException('No Roku ECP service on this address');
    }
    final info = parseDeviceInfo(xml);
    _modelName = info.model;
    _isTv = info.isTv;
    final appsXml = await _get('/query/apps');
    if (appsXml != null) {
      _appIds
        ..clear()
        ..addAll(parseApps(appsXml));
    }
    _set(ConnectionStatus.connected);
  }

  @override
  Future<bool> sendKey(TvKey key) async {
    final code = keyMap[key];
    if (code == null || _status != ConnectionStatus.connected) return false;
    if (!_isTv &&
        (code.startsWith('Volume') ||
            code.startsWith('Channel') ||
            code.startsWith('Input') ||
            code == 'PowerOff')) {
      return false; // stick-class device: keys do not exist
    }
    final rc = await _post('/keypress/$code');
    return rc >= 200 && rc < 300;
  }

  @override
  Future<bool> setVolume(int delta) =>
      sendKey(delta >= 0 ? TvKey.volumeUp : TvKey.volumeDown);

  static const _wellKnownApps = {
    'netflix': ['netflix'],
    'youtube': ['youtube'],
    'prime': ['prime video', 'amazon'],
    'disney': ['disney+'],
  };

  @override
  Future<bool> launchApp(String appId) async {
    if (_status != ConnectionStatus.connected) return false;
    final key = appId.toLowerCase();
    String? id;
    if (RegExp(r'^\d+$').hasMatch(key)) {
      id = key; // numeric Roku channel id passed directly
    } else {
      final aliases = _wellKnownApps[key] ?? [key];
      for (final a in aliases) {
        for (final entry in _appIds.entries) {
          if (entry.key.contains(a)) {
            id = entry.value;
            break;
          }
        }
        if (id != null) break;
      }
    }
    if (id == null) return false;
    final rc = await _post('/launch/$id');
    return rc >= 200 && rc < 300;
  }

  @override
  Future<bool> switchInput(String inputId) async {
    final k = _inputKeys[inputId.toLowerCase()];
    if (k == null || !_isTv || _status != ConnectionStatus.connected) {
      return false;
    }
    final rc = await _post('/keypress/$k');
    return rc >= 200 && rc < 300;
  }

  @override
  Future<bool> sendText(String text) async {
    if (_status != ConnectionStatus.connected) return false;
    for (final rune in text.runes.take(64)) {
      final ch = String.fromCharCode(rune);
      final key = ch == ' ' ? 'Lit_%20' : 'Lit_${Uri.encodeComponent(ch)}';
      final rc = await _post('/keypress/$key');
      if (rc < 200 || rc >= 300) return false;
    }
    return true;
  }

  @override
  Future<bool> powerOff() => sendKey(TvKey.power);

  @override
  Future<bool> powerOn() async => false; // no power-on in ECP

  @override
  Future<void> disconnect() async {
    _set(ConnectionStatus.disconnected);
  }
}
