import 'dart:async';
import 'package:flutter/foundation.dart';
import 'tv_models.dart';
import 'tv_provider.dart';

/// A controllable fake provider for UI tests and preview mode.
class MockTvProvider extends ChangeNotifier implements TvProvider {
  @override
  TvDevice device;
  final _status = StreamController<ConnectionStatus>.broadcast();
  ConnectionStatus _s = ConnectionStatus.connected;
  final List<TvKey> sentKeys = [];

  MockTvProvider(this.device);

  @override
  ConnectionStatus get status => _s;
  @override
  Stream<ConnectionStatus> get statusStream => _status.stream;
  @override
  TvCapabilities get capabilities =>
      TvCapabilities.forProtocol(device.protocol);

  void _set(ConnectionStatus s) {
    _s = s;
    _status.add(s);
    notifyListeners();
  }

  @override
  Future<void> connect() async {
    _set(ConnectionStatus.connected);
  }

  @override
  Future<void> disconnect() async {
    _set(ConnectionStatus.disconnected);
  }

  @override
  Future<PairingResult> pair({String? pin}) async =>
      const PairingResult(true, PairingState.paired);

  @override
  Future<bool> sendKey(TvKey key) async {
    sentKeys.add(key);
    return true;
  }

  @override
  Future<bool> setVolume(int delta) async => true;
  @override
  Future<bool> launchApp(String appId) async => true;
  @override
  Future<bool> switchInput(String inputId) async => true;
  @override
  Future<bool> sendText(String text) async => true;
  @override
  Future<bool> powerOff() async => true;
  @override
  Future<bool> powerOn() async => false;
}
