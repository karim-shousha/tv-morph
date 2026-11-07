import 'dart:async';
import 'dart:convert';
import 'dart:io';
import '../tv_models.dart';
import '../tv_provider.dart';

/// Universal UPnP-DMR baseline control (no auth exists in UPnP LAN
/// control by design — same mechanism the big "universal remote" apps
/// use for volume/playback on TVs without a vendor remote API).
///
/// Verified pattern: SOAP POST to the RenderingControl / AVTransport
/// control URLs taken from the device description (never guessed).
/// Volume/mute via RenderingControl; play/pause/stop/next/prev via
/// AVTransport. No D-pad, home, digits, apps, search or power — those
/// stay disabled in the UI via capabilities.
class DlnaProvider implements TvProvider {
  @override
  final TvDevice device;
  final _statusCtrl = StreamController<ConnectionStatus>.broadcast();
  ConnectionStatus _status = ConnectionStatus.disconnected;

  String? _rcUrl;
  String? _avtUrl;

  DlnaProvider(this.device) {
    _rcUrl = device.extras['rcUrl'];
    _avtUrl = device.extras['avtUrl'];
  }

  static String _rcEnvelope(String action, String inner) =>
      '<?xml version="1.0" encoding="utf-8"?>'
      '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" '
      's:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">'
      '<s:Body>'
      '<u:$action xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">'
      '<InstanceID>0</InstanceID>'
      '<Channel>Master</Channel>'
      '$inner'
      '</u:$action>'
      '</s:Body>'
      '</s:Envelope>';

  static String _avtEnvelope(String action, [String extra = '']) =>
      '<?xml version="1.0" encoding="utf-8"?>'
      '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" '
      's:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">'
      '<s:Body>'
      '<u:$action xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">'
      '<InstanceID>0</InstanceID>'
      '$extra'
      '</u:$action>'
      '</s:Body>'
      '</s:Envelope>';

  /// Parse <CurrentVolume>/<CurrentMute> from a SOAP response. Pure.
  static int? parseVolume(String body) {
    final m = RegExp(r'<CurrentVolume>(\d+)</CurrentVolume>').firstMatch(body);
    return m == null ? null : int.tryParse(m.group(1)!);
  }

  static bool? parseMute(String body) {
    final m = RegExp(r'<CurrentMute>([01])</CurrentMute>').firstMatch(body);
    if (m == null) return null;
    return m.group(1) == '1';
  }

  static bool isSoapOk(int code, String body) =>
      code >= 200 && code < 300 && !body.contains('<s:Fault>');

  @override
  ConnectionStatus get status => _status;
  @override
  Stream<ConnectionStatus> get statusStream => _statusCtrl.stream;
  @override
  TvCapabilities get capabilities =>
      TvCapabilities.forProtocol(TvProtocol.dlnaRenderer);

  void _set(ConnectionStatus s) {
    _status = s;
    if (!_statusCtrl.isClosed) _statusCtrl.add(s);
  }

  Future<({int code, String body})> _soap(
      String url, String service, String action, String envelope) async {
    HttpClient? c;
    try {
      c = HttpClient()..connectionTimeout = const Duration(seconds: 4);
      final req = await c.postUrl(Uri.parse(url));
      req.headers.contentType = ContentType('text', 'xml', charset: 'utf-8');
      req.headers.set('SOAPACTION', '"$service#$action"');
      req.write(envelope);
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

  Future<bool> _rc(String action, String inner) async {
    final url = _rcUrl;
    if (url == null || url.isEmpty) return false;
    final r = await _soap(url,
        'urn:schemas-upnp-org:service:RenderingControl:1', action,
        _rcEnvelope(action, inner));
    return isSoapOk(r.code, r.body);
  }

  Future<bool> _avt(String action, [String extra = '']) async {
    final url = _avtUrl;
    if (url == null || url.isEmpty) {
      // AVTransport URL optional: try RenderingControl host with a
      // conventional path? No — never guess URLs. Fail honestly.
      return false;
    }
    final r = await _soap(url,
        'urn:schemas-upnp-org:service:AVTransport:1', action,
        _avtEnvelope(action, extra));
    return isSoapOk(r.code, r.body);
  }

  /// Endpoint verification: a real GetVolume round-trip. No 200 + volume
  /// value = no usable renderer (wrong URL, auth wall, or offline).
  Future<bool> verify() async {
    final url = _rcUrl;
    if (url == null || url.isEmpty) return false;
    final r = await _soap(
        url,
        'urn:schemas-upnp-org:service:RenderingControl:1',
        'GetVolume',
        _rcEnvelope('GetVolume', ''));
    return isSoapOk(r.code, r.body) && parseVolume(r.body) != null;
  }

  @override
  Future<PairingResult> pair({String? pin}) async {
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
    final ok = await verify();
    if (!ok) {
      _set(ConnectionStatus.error);
      throw const SocketException(
          'No UPnP renderer control on this address');
    }
    _set(ConnectionStatus.connected);
  }

  @override
  Future<bool> sendKey(TvKey key) async {
    if (_status != ConnectionStatus.connected) return false;
    switch (key) {
      case TvKey.volumeUp:
        return _nudgeVolume(3);
      case TvKey.volumeDown:
        return _nudgeVolume(-3);
      case TvKey.mute:
        return _toggleMute();
      case TvKey.play:
        return _avt('Play', '<Speed>1</Speed>');
      case TvKey.pause:
        return _avt('Pause');
      case TvKey.playPause:
        return _togglePlay();
      case TvKey.stop:
        return _avt('Stop');
      default:
        return false; // no D-pad/home/digits/apps/search/power over UPnP
    }
  }

  Future<bool> _nudgeVolume(int delta) async {
    final url = _rcUrl;
    if (url == null || url.isEmpty) return false;
    final r = await _soap(
        url,
        'urn:schemas-upnp-org:service:RenderingControl:1',
        'GetVolume',
        _rcEnvelope('GetVolume', ''));
    if (!isSoapOk(r.code, r.body)) return false;
    final cur = parseVolume(r.body);
    if (cur == null) return false;
    final next = (cur + delta).clamp(0, 100);
    return _rc('SetVolume', '<DesiredVolume>$next</DesiredVolume>');
  }

  Future<bool> _toggleMute() async {
    final url = _rcUrl;
    if (url == null || url.isEmpty) return false;
    final r = await _soap(
        url,
        'urn:schemas-upnp-org:service:RenderingControl:1',
        'GetMute',
        _rcEnvelope('GetMute', ''));
    if (!isSoapOk(r.code, r.body)) return false;
    final muted = parseMute(r.body);
    if (muted == null) return false;
    return _rc('SetMute', '<DesiredMute>${muted ? 0 : 1}</DesiredMute>');
  }

  Future<bool> _togglePlay() async {
    final url = _avtUrl;
    if (url == null || url.isEmpty) return _avt('Play', '<Speed>1</Speed>');
    HttpClient? c;
    try {
      c = HttpClient()..connectionTimeout = const Duration(seconds: 4);
      final req = await c.postUrl(Uri.parse(url));
      req.headers.contentType = ContentType('text', 'xml', charset: 'utf-8');
      req.headers.set('SOAPACTION',
          '"urn:schemas-upnp-org:service:AVTransport:1#GetTransportInfo"');
      req.write(_avtEnvelope('GetTransportInfo'));
      final resp = await req.close().timeout(const Duration(seconds: 5));
      final body =
          await resp.transform(utf8.decoder).join().timeout(const Duration(seconds: 5));
      final playing = body.contains('>PLAYING<');
      if (playing) return _avt('Pause');
      return _avt('Play', '<Speed>1</Speed>');
    } catch (_) {
      return false;
    } finally {
      try {
        c?.close(force: true);
      } catch (_) {}
    }
  }

  @override
  Future<bool> setVolume(int delta) =>
      sendKey(delta >= 0 ? TvKey.volumeUp : TvKey.volumeDown);

  @override
  Future<bool> launchApp(String appId) async => false;

  @override
  Future<bool> switchInput(String inputId) async => false;

  @override
  Future<bool> sendText(String text) async => false;

  @override
  Future<bool> powerOff() async => false;

  @override
  Future<bool> powerOn() async => false;

  @override
  Future<void> disconnect() async {
    _set(ConnectionStatus.disconnected);
  }
}
