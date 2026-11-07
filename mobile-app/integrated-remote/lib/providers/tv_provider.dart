import 'tv_models.dart';

/// Common provider interface. Each brand implements only what its
/// documented LAN protocol supports.
abstract class TvProvider {
  TvDevice get device;
  ConnectionStatus get status;
  TvCapabilities get capabilities;
  Stream<ConnectionStatus> get statusStream;

  Future<void> connect();
  Future<void> disconnect();
  Future<PairingResult> pair({String? pin});
  Future<bool> sendKey(TvKey key);
  Future<bool> setVolume(int delta);
  Future<bool> launchApp(String appId);
  Future<bool> switchInput(String inputId);
  Future<bool> sendText(String text);
  Future<bool> powerOff();
  Future<bool> powerOn();
}

/// Selects the right provider implementation for a discovered device.
TvProtocol protocolForBrand(TvBrand brand) => switch (brand) {
  TvBrand.samsung => TvProtocol.samsungTizenWs,
  TvBrand.lg => TvProtocol.lgWebOs,
  TvBrand.androidTv => TvProtocol.androidTvRemote,
  TvBrand.roku => TvProtocol.rokuEcp,
  TvBrand.sony => TvProtocol.sonyIrcc,
  // VIDAA exposes no open LAN remote API. Fire TV uses ADB Debugging.
  TvBrand.vidaa => TvProtocol.unknown,
  TvBrand.fireTv => TvProtocol.fireTvAdb,
  // Companion installations are driven by the Morph TV app itself,
  // never by a native remote protocol.
  TvBrand.companion => TvProtocol.unknown,
  TvBrand.unknown => TvProtocol.unknown,
};
