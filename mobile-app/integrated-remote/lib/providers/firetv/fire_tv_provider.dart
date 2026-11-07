import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_adb/flutter_adb.dart';

import '../tv_models.dart';
import '../../core/storage/saved_devices_repo.dart';
import '../tv_provider.dart';

/// Fire TV exposes no consumer remote socket. When the owner enables ADB
/// Debugging and approves this app's host key on the TV, ADB shell key events
/// provide system-level remote control.
class FireTvProvider implements TvProvider {
  @override
  final TvDevice device;

  final String? _savedKey;
  final AdbConnection Function(String, int, AdbCrypto)? connectionFactory;
  final _statusController = StreamController<ConnectionStatus>.broadcast();
  ConnectionStatus _status = ConnectionStatus.disconnected;
  AdbCrypto? _crypto;
  AdbConnection? _connection;
  AdbStream? _shell;
  StreamSubscription<Uint8List>? _shellSubscription;
  Completer<bool>? _inputProbe;
  String _probeOutput = '';
  bool _fastInput = false, _draining = false;
  Timer? _keyFlush;
  final List<(int, Completer<bool>)> _keyQueue = [];
  void _payload(Uint8List bytes) {
    final probe = _inputProbe;
    if (probe == null || probe.isCompleted) return;
    _probeOutput += utf8.decode(bytes, allowMalformed: true);
    if (_probeOutput.contains('__MORPH_INPUT:0__'))
      probe.complete(true);
    else if (RegExp(r'__MORPH_INPUT:[1-9][0-9]*__').hasMatch(_probeOutput))
      probe.complete(false);
    if (_probeOutput.length > 2048)
      _probeOutput = _probeOutput.substring(_probeOutput.length - 1024);
  }

  FireTvProvider(this.device, {String? savedKey, this.connectionFactory})
    : _savedKey = savedKey;

  static const keyCodeMap = <TvKey, int>{
    TvKey.up: 19,
    TvKey.down: 20,
    TvKey.left: 21,
    TvKey.right: 22,
    TvKey.ok: 23,
    TvKey.back: 4,
    TvKey.home: 3,
    TvKey.menu: 82,
    TvKey.guide: 172,
    TvKey.volumeUp: 24,
    TvKey.volumeDown: 25,
    TvKey.mute: 164,
    TvKey.channelUp: 166,
    TvKey.channelDown: 167,
    TvKey.play: 126,
    TvKey.pause: 127,
    TvKey.playPause: 85,
    TvKey.stop: 86,
    TvKey.rewind: 89,
    TvKey.fastForward: 90,
    TvKey.power: 26,
    TvKey.source: 178,
    TvKey.search: 84,
    TvKey.settings: 176,
    TvKey.digit0: 7,
    TvKey.digit1: 8,
    TvKey.digit2: 9,
    TvKey.digit3: 10,
    TvKey.digit4: 11,
    TvKey.digit5: 12,
    TvKey.digit6: 13,
    TvKey.digit7: 14,
    TvKey.digit8: 15,
    TvKey.digit9: 16,
  };

  static const _apps = <String, String>{
    'netflix': 'com.netflix.ninja',
    'youtube': 'com.amazon.firetv.youtube',
    'disney': 'com.disney.disneyplus',
    'prime': 'com.amazon.avod.thirdpartyclient',
  };

  int get _port => device.port == 0 ? 5555 : device.port;

  AdbCrypto _loadCrypto() {
    if (_crypto != null) return _crypto!;
    if (_savedKey != null) {
      try {
        final map = jsonDecode(_savedKey!) as Map<String, dynamic>;
        _crypto = AdbCrypto(
          keyPair: AdbCrypto.keyPairFromStorageMap(map),
          adbKeyName: 'Morph Remote',
        );
        return _crypto!;
      } catch (_) {
        // A corrupt stored key can be replaced by a fresh key and re-approved.
      }
    }
    _crypto = AdbCrypto(adbKeyName: 'Morph Remote');
    return _crypto!;
  }

  String _exportCrypto() => jsonEncode(_loadCrypto().exportKeyPairForStorage());

  @override
  ConnectionStatus get status => _status;

  @override
  Stream<ConnectionStatus> get statusStream => _statusController.stream;

  @override
  TvCapabilities get capabilities =>
      TvCapabilities.forProtocol(TvProtocol.fireTvAdb);

  void _set(ConnectionStatus value) {
    _status = value;
    if (!_statusController.isClosed) _statusController.add(value);
  }

  @override
  Future<PairingResult> pair({String? pin}) async {
    _set(ConnectionStatus.pairing);
    try {
      await connect();
      return PairingResult(
        true,
        PairingState.paired,
        clientKey: _exportCrypto(),
      );
    } catch (error) {
      _set(ConnectionStatus.error);
      return PairingResult(false, PairingState.failed, message: '$error');
    }
  }

  @override
  Future<void> connect() async {
    if (_status == ConnectionStatus.connected && _shell != null) return;
    _set(ConnectionStatus.connecting);
    await SecureStore().saveSecret(device.id, _exportCrypto());
    final connection =
        (connectionFactory ??
        ((ip, port, crypto) =>
            AdbConnection(ip, port, crypto)))(device.ip, _port, _loadCrypto());
    _connection = connection;
    try {
      final connected = await connection.connect().timeout(
        const Duration(seconds: 65),
      );
      if (!connected) {
        throw StateError(
          'Could not reach Fire TV ADB on port $_port. Turn on ADB Debugging in Developer Options and retry.',
        );
      }
      final shell = await connection.openShell().timeout(
        const Duration(seconds: 12),
      );
      _shell = shell;
      _inputProbe = Completer<bool>();
      _probeOutput = "";
      _shellSubscription = shell.onPayload.listen(_payload);
      await shell
          .writeString(
            'cmd input help 2>&1 | grep -q keyevent; echo __MORPH_INPUT:\$?__\n',
          )
          .timeout(const Duration(seconds: 4));
      _fastInput = await _inputProbe!.future.timeout(
        const Duration(milliseconds: 1200),
        onTimeout: () => false,
      );
      _set(ConnectionStatus.connected);
    } on TimeoutException {
      await _closeTransport();
      _set(ConnectionStatus.error);
      throw StateError(
        'Fire TV did not authorize the connection. Enable ADB Debugging and accept the “Allow USB debugging?” prompt on the TV.',
      );
    } catch (error) {
      await _closeTransport();
      _set(ConnectionStatus.error);
      rethrow;
    }
  }

  Future<void> _closeTransport() async {
    _keyFlush?.cancel();
    _keyFlush = null;
    for (final item in _keyQueue) {
      if (!item.$2.isCompleted) item.$2.complete(false);
    }
    _keyQueue.clear();
    if (_inputProbe != null && !_inputProbe!.isCompleted)
      _inputProbe!.complete(false);
    _inputProbe = null;
    await _shellSubscription?.cancel();
    _shellSubscription = null;
    _shell = null;
    final connection = _connection;
    _connection = null;
    if (connection != null) await connection.disconnect();
  }

  Future<bool> _run(String command) async {
    final shell = _shell;
    if (shell == null || _status != ConnectionStatus.connected) return false;
    try {
      return await shell
          .writeString('$command\n')
          .timeout(const Duration(seconds: 3));
    } catch (_) {
      _set(ConnectionStatus.error);
      return false;
    }
  }

  @override
  Future<bool> sendKey(TvKey key) async {
    final code = keyCodeMap[key];
    if (code == null ||
        _shell == null ||
        _status != ConnectionStatus.connected ||
        _keyQueue.length >= 64)
      return false;
    final done = Completer<bool>();
    _keyQueue.add((code, done));
    _keyFlush ??= Timer(const Duration(milliseconds: 8), () {
      _keyFlush = null;
      _flushKeys();
    });
    return done.future;
  }

  Future<void> _flushKeys() async {
    if (_draining) return;
    _draining = true;
    try {
      while (_keyQueue.isNotEmpty) {
        final batch = _keyQueue.take(24).toList();
        _keyQueue.removeRange(0, batch.length);
        final ok = await _run(
          '${_fastInput ? 'cmd input' : 'input'} keyevent ${batch.map((e) => e.$1).join(' ')}',
        );
        for (final item in batch) {
          if (!item.$2.isCompleted) item.$2.complete(ok);
        }
        if (!ok) {
          for (final item in _keyQueue) {
            if (!item.$2.isCompleted) item.$2.complete(false);
          }
          _keyQueue.clear();
          break;
        }
      }
    } finally {
      _draining = false;
    }
  }

  @override
  Future<bool> setVolume(int delta) =>
      sendKey(delta >= 0 ? TvKey.volumeUp : TvKey.volumeDown);

  @override
  Future<bool> launchApp(String appId) {
    final packageName = _apps[appId.toLowerCase()];
    if (packageName == null) return Future.value(false);
    return _run('monkey -p $packageName 1');
  }

  @override
  Future<bool> switchInput(String inputId) => sendKey(TvKey.source);

  @override
  Future<bool> sendText(String text) {
    // `input text` uses %s to represent spaces. Keep the command constrained
    // to printable ASCII so shell metacharacters and unsupported Unicode
    // cannot be interpreted as shell commands.
    if (!RegExp(r"^[A-Za-z0-9 .,!?@_\-']+$").hasMatch(text)) {
      return Future.value(false);
    }
    final encoded = text.replaceAll(' ', '%s').replaceAll("'", r"'\''");
    return _run("input text '$encoded'");
  }

  @override
  Future<bool> powerOff() => sendKey(TvKey.power);

  @override
  Future<bool> powerOn() async => false;

  @override
  Future<void> disconnect() async {
    await _closeTransport();
    _set(ConnectionStatus.disconnected);
  }
}
