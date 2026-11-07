import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:basic_utils/basic_utils.dart';
import 'package:pointycastle/asn1.dart';
import 'android_tv_identity.dart';
import 'android_tv_protocol.dart';
import '../tv_models.dart';
import '../tv_provider.dart';

/// Android TV / Google TV Remote v2 provider (mutual TLS + protobuf).
/// It controls the TV system only when the native Android TV Remote Service
/// is available; Morph TV companion endpoints are deliberately not used.
class AndroidTvProvider implements TvProvider {
  @override
  final TvDevice device;
  final _statusCtrl = StreamController<ConnectionStatus>.broadcast();
  ConnectionStatus _status = ConnectionStatus.disconnected;
  SecureSocket? _socket;
  StreamSubscription<List<int>>? _subscription;
  Timer? _reconnect;
  int _retries = 0;
  AndroidTvIdentity? _identity;
  final List<int> _buffer = [];
  final Map<int, Completer<void>> _pairWaiters = {};
  Completer<void>? _remoteReady;
  Completer<void>? _pairingReady;
  bool _isPairing = false;
  int _activeFeatures = _features;
  String? _lastRemoteError;
  Map<String,Object?> get diagnostics => {'activeFeatures':_activeFeatures,'remoteIme':false,'remoteError':_lastRemoteError,'connected':_status==ConnectionStatus.connected};

  AndroidTvProvider(this.device, {String? savedToken})
    : _identity = AndroidTvIdentity.tryParse(savedToken);

  static const _features = AndroidTvProtocol.defaultFeatures;
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
    TvKey.search: 84,
    TvKey.settings: 176,
    TvKey.source: 178,
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

  static int? keyCodeFor(TvKey key) => keyCodeMap[key];

  @override
  ConnectionStatus get status => _status;
  @override
  Stream<ConnectionStatus> get statusStream => _statusCtrl.stream;
  @override
  TvCapabilities get capabilities =>
      TvCapabilities.forProtocol(TvProtocol.androidTvRemote);

  void _set(ConnectionStatus status) {
    _status = status;
    if (!_statusCtrl.isClosed) _statusCtrl.add(status);
  }

  Future<SecureSocket> _openTls(int port) async {
    _identity ??= await AndroidTvIdentity.generate();
    final context = SecurityContext(withTrustedRoots: false)
      ..useCertificateChainBytes(utf8.encode(_identity!.certificatePem))
      ..usePrivateKeyBytes(utf8.encode(_identity!.privateKeyPem));
    return SecureSocket.connect(
      device.ip,
      port,
      context: context,
      timeout: const Duration(seconds: 10),
      onBadCertificate: (_) => true,
    );
  }

  Future<void> _openAndListen(int port) async {
    await _subscription?.cancel();
    _buffer.clear();
    final socket = await _openTls(port);
    _socket = socket;
    _subscription = socket.listen(
      _onData,
      onError: (Object error, StackTrace stack) => _onLost(error),
      onDone: () => _onLost(StateError('TV closed the remote connection')),
      cancelOnError: true,
    );
  }

  void _onLost(Object error) {
    for (final waiter in _pairWaiters.values) {
      if (!waiter.isCompleted) waiter.completeError(error);
    }
    _pairWaiters.clear();
    final ready = _remoteReady;
    if (ready != null && !ready.isCompleted) ready.completeError(error);
    _remoteReady = null;
    final pairingReady = _pairingReady;
    if (pairingReady != null && !pairingReady.isCompleted) {
      pairingReady.completeError(error);
    }
    if (_status == ConnectionStatus.connected && !_isPairing) {
      _set(ConnectionStatus.error);
      _scheduleReconnect();
    }
  }

  void _onData(List<int> data) {
    _buffer.addAll(data);
    for (final message in AndroidTvProtocol.takeFrames(_buffer)) {
      try {
        _handleMessage(message);
      } catch (_) {
        // Ignore malformed or newer optional messages while keeping the
        // actual control channel alive.
      }
    }
  }

  void _handleMessage(List<int> message) {
    if (_isPairing) {
      final status = AndroidTvProtocol.varintFields(message, 2).firstOrNull;
      if (status != null && status != 200) {
        final waiter = status == 402 ? _pairWaiters[41] : _pairingReady;
        if (waiter != null && !waiter.isCompleted) {
          waiter.completeError(
            StateError('TV rejected pairing (status $status)'),
          );
        }
        return;
      }
      if (AndroidTvProtocol.bytesFields(message, 11).isNotEmpty) {
        final encoding = AndroidTvProtocol.join([
          AndroidTvProtocol.fieldVarint(1, 3),
          AndroidTvProtocol.fieldVarint(2, 6),
        ]);
        final options = AndroidTvProtocol.join([
          AndroidTvProtocol.fieldBytes(1, encoding),
          AndroidTvProtocol.fieldVarint(3, 1),
        ]);
        _socket?.add(
          AndroidTvProtocol.framePairing(
            AndroidTvProtocol.pairingAck(20, options),
          ),
        );
      }
      if (AndroidTvProtocol.bytesFields(message, 20).isNotEmpty) {
        final encoding = AndroidTvProtocol.join([
          AndroidTvProtocol.fieldVarint(1, 3),
          AndroidTvProtocol.fieldVarint(2, 6),
        ]);
        final configuration = AndroidTvProtocol.join([
          AndroidTvProtocol.fieldBytes(1, encoding),
          AndroidTvProtocol.fieldVarint(2, 1),
        ]);
        _socket?.add(
          AndroidTvProtocol.framePairing(
            AndroidTvProtocol.pairingAck(30, configuration),
          ),
        );
      }
      if (AndroidTvProtocol.bytesFields(message, 31).isNotEmpty) {
        final ready = _pairingReady;
        if (ready != null && !ready.isCompleted) ready.complete();
      }
      if (AndroidTvProtocol.bytesFields(message, 41).isNotEmpty) {
        final waiter = _pairWaiters.remove(41);
        if (waiter != null && !waiter.isCompleted) waiter.complete();
      }
      return;
    }

    for(final configuration in AndroidTvProtocol.bytesFields(message,1)) {
      final supported=AndroidTvProtocol.varintFields(configuration,1).firstOrNull ?? 0;
      _activeFeatures=_features & supported;
      _socket?.add(AndroidTvProtocol.remoteConfigureReply(_activeFeatures));
    }
    if (AndroidTvProtocol.bytesFields(message, 2).isNotEmpty) {
      _socket?.add(AndroidTvProtocol.remoteSetActive(_activeFeatures));
    }
    // Do not register, mirror or acknowledge remote IME sessions.
    if(AndroidTvProtocol.bytesFields(message,3).isNotEmpty)_lastRemoteError='The TV rejected a remote command';
    final pings = AndroidTvProtocol.bytesFields(message, 8);
    for (final ping in pings) {
      final id = AndroidTvProtocol.varintFields(ping, 1).firstOrNull ?? 0;
      _socket?.add(AndroidTvProtocol.pingResponse(id));
    }
    if (AndroidTvProtocol.bytesFields(message, 40).isNotEmpty) {
      final ready = _remoteReady;
      if (ready != null && !ready.isCompleted) ready.complete();
    }
  }

  Future<void> _beginPairing() async {
    if (_pairingReady?.isCompleted == true && _socket != null) return;
    _set(ConnectionStatus.pairing);
    _isPairing = true;
    _identity ??= await AndroidTvIdentity.generate();
    await _openAndListen(6467);
    _pairingReady = Completer<void>();
    _socket!.add(
      AndroidTvProtocol.framePairing(
        AndroidTvProtocol.pairingRequest('Morph Remote'),
      ),
    );
    await _pairingReady!.future.timeout(const Duration(seconds: 20));
  }

  @override
  Future<PairingResult> pair({String? pin}) async {
    final code = (pin ?? '').trim().toUpperCase();
    // Android TV shows its pairing code only after the client has opened the
    // native pairing channel and completed the options/configuration exchange.
    // Start that exchange before asking the user to type the code.
    if (pin == null || pin.trim().isEmpty) {
      try {
        await _beginPairing();
        return const PairingResult(false, PairingState.enteringPin);
      } on TimeoutException {
        await disconnect();
        _set(ConnectionStatus.error);
        return const PairingResult(
          false,
          PairingState.timeout,
          message:
              'The TV did not open its pairing prompt. Make sure the native Android TV remote service is enabled.',
        );
      } catch (error) {
        await disconnect();
        _set(ConnectionStatus.error);
        return PairingResult(false, PairingState.failed, message: '$error');
      }
    }
    if (!RegExp(r'^[0-9A-F]{6}$').hasMatch(code)) {
      return const PairingResult(
        false,
        PairingState.enteringPin,
        message: 'Enter the 6-character hexadecimal code shown on the TV',
      );
    }
    try {
      if (_socket == null || _pairingReady?.isCompleted != true) {
        await _beginPairing();
      }

      final serverCert = _socket?.peerCertificate;
      if (serverCert == null) {
        throw StateError('TV did not provide a TLS certificate');
      }
      final serverPem = _derCertificateToPem(serverCert.der);
      final secret = _identity!.pairingSecret(code, serverPem);
      if (secret.first != int.parse(code.substring(0, 2), radix: 16)) {
        throw const FormatException('Wrong pairing code');
      }
      final secretAck = Completer<void>();
      _pairWaiters[41] = secretAck;
      _socket!.add(
        AndroidTvProtocol.framePairing(AndroidTvProtocol.secret(secret)),
      );
      await secretAck.future.timeout(const Duration(seconds: 10));

      _isPairing = false;
      await disconnect();
      _set(ConnectionStatus.connected); // Short UI transition before connect().
      return PairingResult(
        true,
        PairingState.paired,
        clientKey: _identity!.serialize(),
      );
    } on TimeoutException {
      await disconnect();
      _set(ConnectionStatus.error);
      return const PairingResult(
        false,
        PairingState.timeout,
        message:
            'The TV did not finish pairing. Check the code and approval prompt.',
      );
    } catch (error) {
      await disconnect();
      _set(ConnectionStatus.error);
      final message = '$error';
      return PairingResult(
        false,
        message.contains('402') || message.toLowerCase().contains('secret')
            ? PairingState.denied
            : PairingState.failed,
        message: message,
      );
    } finally {
      _isPairing = false;
    }
  }

  String _derCertificateToPem(List<int> der) {
    final bytes = Uint8List.fromList(der);
    return X509Utils.encodeASN1ObjectToPem(
      ASN1Parser(bytes).nextObject() as ASN1Sequence,
      X509Utils.BEGIN_CERT,
      X509Utils.END_CERT,
    );
  }

  @override
  Future<void> connect() async {
    if (_status == ConnectionStatus.connected && _socket != null) return;
    if (_identity == null) {
      throw StateError('Pair this Android TV first');
    }
    _set(ConnectionStatus.connecting);
    try {
      _remoteReady = Completer<void>();
      _activeFeatures=_features;_lastRemoteError=null;
      await _openAndListen(device.port == 0 ? 6466 : device.port);
      await _remoteReady!.future.timeout(const Duration(seconds: 12));
      _retries = 0;
      _set(ConnectionStatus.connected);
    } catch (_) {
      await disconnect();
      _set(ConnectionStatus.error);
      rethrow;
    }
  }

  void _scheduleReconnect() {
    _reconnect?.cancel();
    if (_retries >= 5 || _identity == null) return;
    _retries++;
    _reconnect = Timer(Duration(seconds: 2 << (_retries - 1)), () {
      if (_status == ConnectionStatus.error) connect().catchError((_) {});
    });
  }

  Future<bool> _send(List<int> frame) async {
    final socket = _socket;
    if (socket == null || _status != ConnectionStatus.connected) return false;
    try {
      socket.add(frame);
      await socket.flush();
      return true;
    } catch (_) {
      _set(ConnectionStatus.error);
      _scheduleReconnect();
      return false;
    }
  }

  @override
  Future<bool> sendKey(TvKey key) async {
    final code = keyCodeMap[key];
    if (code == null) return false;
    return _send(AndroidTvProtocol.key(code));
  }

  /// Explicit down/up for compatibility diagnostics; ordinary keys remain short presses.
  Future<bool> sendKeyStroke(TvKey key) async {
    final code=keyCodeMap[key];if(code==null)return false;
    if(!await _send(AndroidTvProtocol.key(code,direction:1)))return false;
    await Future<void>.delayed(const Duration(milliseconds:90));
    return _send(AndroidTvProtocol.key(code,direction:2));
  }

  @override
  Future<bool> setVolume(int delta) =>
      sendKey(delta >= 0 ? TvKey.volumeUp : TvKey.volumeDown);

  @override
  Future<bool> launchApp(String appId) {
    final appLink = switch (appId.toLowerCase().replaceAll(' ', '')) {
      'youtube' => 'market://launch?id=com.google.android.youtube.tv',
      'netflix' => 'netflix://',
      'disney' || 'disney+' => 'market://launch?id=com.disney.disneyplus',
      'prime' ||
      'primevideo' => 'market://launch?id=com.amazon.amazonvideo.livingroom',
      _ => appId.contains('://') ? appId : 'market://launch?id=$appId',
    };
    return _send(AndroidTvProtocol.launchApp(appLink));
  }

  @override
  Future<bool> switchInput(String inputId) => sendKey(TvKey.source);
  @override
  Future<bool> sendText(String text) async => false; // Text uses the original Morph host channel.

  @override
  Future<bool> powerOff() => sendKey(TvKey.power);
  @override
  Future<bool> powerOn() async => false;

  @override
  Future<void> disconnect() async {
    _reconnect?.cancel();
    _remoteReady = null;
    _pairingReady = null;
    _isPairing = false;
    await _subscription?.cancel();
    _subscription = null;
    try {
      await _socket?.close();
    } catch (_) {}
    _socket = null;
    if (!_statusCtrl.isClosed && _status != ConnectionStatus.error) {
      _set(ConnectionStatus.disconnected);
    }
  }
}
