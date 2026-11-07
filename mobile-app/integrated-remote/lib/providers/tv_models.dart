/// Core TV models. Pure Dart, fully unit-testable.

enum TvBrand {
  samsung,
  lg,
  androidTv,
  roku,
  sony,
  vidaa,
  fireTv,
  companion,
  unknown,
}

enum TvProtocol {
  samsungTizenWs,
  samsungLegacy,
  lgWebOs,
  androidTvRemote,
  rokuEcp,
  sonyIrcc,
  fireTvAdb,
  dlnaRenderer,
  unknown,
}

enum ConnectionStatus {
  disconnected,
  discovering,
  connecting,
  pairing,
  connected,
  error,
}

String brandLabel(TvBrand b) => switch (b) {
  TvBrand.samsung => 'Samsung',
  TvBrand.lg => 'LG',
  TvBrand.androidTv => 'Android TV',
  TvBrand.roku => 'Roku',
  TvBrand.sony => 'Sony',
  TvBrand.vidaa => 'VIDAA',
  TvBrand.fireTv => 'Fire TV',
  TvBrand.companion => 'Morph TV',
  TvBrand.unknown => 'TV',
};

class TvDevice {
  final String id;
  final String name;
  final TvBrand brand;
  final TvProtocol protocol;
  final String ip;
  final int port;
  final String? model;
  final String? mac;
  final String? nickname;
  final DateTime? lastConnected;
  final Map<String, String> extras;

  const TvDevice({
    required this.id,
    required this.name,
    required this.brand,
    required this.protocol,
    required this.ip,
    required this.port,
    this.model,
    this.mac,
    this.nickname,
    this.lastConnected,
    this.extras = const {},
  });

  String get displayName =>
      (nickname != null && nickname!.isNotEmpty) ? nickname! : name;

  TvDevice copyWith({
    String? name,
    String? nickname,
    DateTime? lastConnected,
    String? ip,
    int? port,
    Map<String, String>? extras,
  }) {
    return TvDevice(
      id: id,
      name: name ?? this.name,
      brand: brand,
      protocol: protocol,
      ip: ip ?? this.ip,
      port: port ?? this.port,
      model: model,
      mac: mac,
      nickname: nickname ?? this.nickname,
      lastConnected: lastConnected ?? this.lastConnected,
      extras: extras ?? this.extras,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'brand': brand.name,
    'protocol': protocol.name,
    'ip': ip,
    'port': port,
    'model': model,
    'mac': mac,
    'nickname': nickname,
    'lastConnected': lastConnected?.toIso8601String(),
    'extras': extras,
  };

  factory TvDevice.fromJson(Map<String, dynamic> j) => TvDevice(
    id: j['id'] as String,
    name: j['name'] as String,
    brand: TvBrand.values.firstWhere(
      (e) => e.name == j['brand'],
      orElse: () => TvBrand.unknown,
    ),
    protocol: TvProtocol.values.firstWhere(
      (e) => e.name == j['protocol'],
      orElse: () => TvProtocol.unknown,
    ),
    ip: j['ip'] as String,
    port: (j['port'] as num?)?.toInt() ?? 0,
    model: j['model'] as String?,
    mac: j['mac'] as String?,
    nickname: j['nickname'] as String?,
    lastConnected: j['lastConnected'] != null
        ? DateTime.tryParse(j['lastConnected'] as String)
        : null,
    extras: Map<String, String>.from(j['extras'] as Map? ?? {}),
  );

  @override
  bool operator ==(Object other) => other is TvDevice && other.id == id;

  @override
  int get hashCode => id.hashCode;
}

class TvCapabilities {
  final bool dpad;
  final bool volume;
  final bool mute;
  final bool channels;
  final bool home;
  final bool back;
  final bool menu;
  final bool guide;
  final bool inputSelect;
  final bool powerOff;
  final bool powerOn;
  final bool wakeOnLan;
  final bool mediaPlayback;
  final bool numericKeys;
  final bool keyboard;
  final bool appLaunch;
  final bool voice;
  final bool search;

  const TvCapabilities({
    this.dpad = true,
    this.volume = true,
    this.mute = true,
    this.channels = true,
    this.home = true,
    this.back = true,
    this.menu = true,
    this.guide = false,
    this.inputSelect = false,
    this.powerOff = true,
    this.powerOn = false,
    this.wakeOnLan = false,
    this.mediaPlayback = true,
    this.numericKeys = false,
    this.keyboard = false,
    this.appLaunch = false,
    this.voice = false,
    this.search = false,
  });

  static TvCapabilities forProtocol(TvProtocol p) => switch (p) {
    TvProtocol.samsungTizenWs => const TvCapabilities(
      guide: true,
      inputSelect: true,
      numericKeys: true,
      keyboard: true,
      appLaunch: true,
      wakeOnLan: true,
      search: true, // KEY_SEARCH
    ),
    TvProtocol.lgWebOs => const TvCapabilities(
      guide: true,
      inputSelect: true,
      numericKeys: true,
      keyboard: true,
      appLaunch: true,
      wakeOnLan: true,
    ),
    TvProtocol.androidTvRemote => const TvCapabilities(
      inputSelect: true,
      numericKeys: true,
      keyboard: true,
      appLaunch: true,
      search: true, // KEYCODE_SEARCH
    ),
    TvProtocol.rokuEcp => const TvCapabilities(
      menu: false, // no Menu key on Roku remotes
      guide: false, // no direct EPG key
      inputSelect: false, // inputs need a picker UI (not shipped)
      numericKeys: false, // no digit keys on Roku remotes
      keyboard: true, // Lit_ entry on keyboard screens
      appLaunch: true, // /launch/<id> with runtime IDs
      search: true, // Search keypress (docs-verified list)
    ),
    TvProtocol.sonyIrcc => const TvCapabilities(
      guide: false, // EPG varies by model — not assumed
      inputSelect: false, // Input key opens menu; no direct switch
      numericKeys: true, // Num0-9
      keyboard: false, // no text API via IRCC
      appLaunch: false, // per-model codes only (runtime map)
      search: false, // no Search code in the standard table
    ),
    TvProtocol.fireTvAdb => const TvCapabilities(
      guide: true,
      inputSelect: true,
      numericKeys: true,
      keyboard: true,
      appLaunch: true,
      search: true,
      powerOn: false,
    ),
    TvProtocol.dlnaRenderer => const TvCapabilities(
      // Baseline UPnP control only: volume + playback. Everything
      // else is explicitly off — the UI gates on these flags.
      dpad: false,
      volume: true,
      mute: true,
      channels: false,
      home: false,
      back: false,
      menu: false,
      guide: false,
      inputSelect: false,
      powerOff: false,
      powerOn: false,
      wakeOnLan: false,
      mediaPlayback: true,
      numericKeys: false,
      keyboard: false,
      appLaunch: false,
      voice: false,
      search: false,
    ),
    _ => const TvCapabilities(),
  };

  TvCapabilities copyWith({
    bool? dpad,
    bool? volume,
    bool? mute,
    bool? channels,
    bool? home,
    bool? back,
    bool? menu,
    bool? guide,
    bool? inputSelect,
    bool? powerOff,
    bool? powerOn,
    bool? wakeOnLan,
    bool? mediaPlayback,
    bool? numericKeys,
    bool? keyboard,
    bool? appLaunch,
    bool? voice,
    bool? search,
  }) {
    return TvCapabilities(
      dpad: dpad ?? this.dpad,
      volume: volume ?? this.volume,
      mute: mute ?? this.mute,
      channels: channels ?? this.channels,
      home: home ?? this.home,
      back: back ?? this.back,
      menu: menu ?? this.menu,
      guide: guide ?? this.guide,
      inputSelect: inputSelect ?? this.inputSelect,
      powerOff: powerOff ?? this.powerOff,
      powerOn: powerOn ?? this.powerOn,
      wakeOnLan: wakeOnLan ?? this.wakeOnLan,
      mediaPlayback: mediaPlayback ?? this.mediaPlayback,
      numericKeys: numericKeys ?? this.numericKeys,
      keyboard: keyboard ?? this.keyboard,
      appLaunch: appLaunch ?? this.appLaunch,
      voice: voice ?? this.voice,
      search: search ?? this.search,
    );
  }
}

enum TvKey {
  up,
  down,
  left,
  right,
  ok,
  back,
  home,
  menu,
  guide,
  info,
  exit,
  volumeUp,
  volumeDown,
  mute,
  channelUp,
  channelDown,
  play,
  pause,
  playPause,
  stop,
  rewind,
  fastForward,
  power,
  source,
  settings,
  search,
  digit0,
  digit1,
  digit2,
  digit3,
  digit4,
  digit5,
  digit6,
  digit7,
  digit8,
  digit9,
}

enum PairingState {
  idle,
  waitingTvApproval,
  enteringPin,
  pairing,
  paired,
  failed,
  timeout,
  denied,
}

class PairingResult {
  final bool success;
  final PairingState state;
  final String? message;
  final String? clientKey;
  const PairingResult(this.success, this.state, {this.message, this.clientKey});
}
