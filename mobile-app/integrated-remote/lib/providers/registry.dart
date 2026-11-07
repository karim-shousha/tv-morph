import '../core/network/ssdp_discovery.dart';
import 'tv_models.dart';

/// What a discovered device offers. Pairing need is orthogonal and is
/// resolved at tap time (stored credential present or not).
enum DeviceClass {
  /// Verified native remote API (endpoint signature matched).
  fullNative,

  /// Native API present but limited (e.g. legacy Samsung pre-2014).
  partialNative,

  /// A TV we recognize but cannot control (VIDAA, legacy…).
  unsupported,

  /// Not a TV (router, printer, NAS, media server).
  nonTv,

  /// Morph TV companion only — never a native remote.
  companionOnly,
}

enum PairingKind {
  none, // e.g. Roku ECP — no auth by design
  tvApproval, // Samsung Tizen, LG webOS
  pin, // Android/Google TV 6-digit
  psk, // Sony Bravia pre-shared key
}

/// Static descriptor per provider: signatures, pairing, commands.
class ProviderDescriptor {
  final TvProtocol protocol;
  final String label;
  final PairingKind pairing;
  final List<String> ssdpTargets;
  final List<String> mdnsServices;
  final List<int> probePorts;
  final String verifyHint;
  final List<TvKey> commands;
  final String limitations;

  const ProviderDescriptor({
    required this.protocol,
    required this.label,
    required this.pairing,
    this.ssdpTargets = const [],
    this.mdnsServices = const [],
    this.probePorts = const [],
    this.verifyHint = '',
    this.commands = const [],
    this.limitations = '',
  });
}

const _dpad = [TvKey.up, TvKey.down, TvKey.left, TvKey.right, TvKey.ok];
const _vol = [TvKey.volumeUp, TvKey.volumeDown, TvKey.mute];
const _ch = [TvKey.channelUp, TvKey.channelDown];
const _media = [
  TvKey.play,
  TvKey.pause,
  TvKey.playPause,
  TvKey.stop,
  TvKey.rewind,
  TvKey.fastForward,
];
const _digits = [
  TvKey.digit0,
  TvKey.digit1,
  TvKey.digit2,
  TvKey.digit3,
  TvKey.digit4,
  TvKey.digit5,
  TvKey.digit6,
  TvKey.digit7,
  TvKey.digit8,
  TvKey.digit9,
];

/// The provider registry. No implementation is claimed here that does not
/// exist as a provider class + verification path.
const providerRegistry = <TvProtocol, ProviderDescriptor>{
  TvProtocol.samsungTizenWs: ProviderDescriptor(
    protocol: TvProtocol.samsungTizenWs,
    label: 'Samsung Tizen remote (WS 8001/8002)',
    pairing: PairingKind.tvApproval,
    ssdpTargets: ['urn:samsung.com:device:RemoteControlReceiver:1', 'ssdp:all'],
    probePorts: [8001, 8002],
    verifyHint: 'GET /api/v2/ device object (8001) or TLS handshake (8002)',
    commands: [
      ..._dpad,
      TvKey.back,
      TvKey.home,
      TvKey.menu,
      TvKey.guide,
      TvKey.source,
      ..._vol,
      ..._ch,
      ..._media,
      TvKey.power,
      TvKey.search,
      ..._digits,
    ],
    limitations: 'Power-on over Wi-Fi is best-effort (WoL only).',
  ),
  TvProtocol.lgWebOs: ProviderDescriptor(
    protocol: TvProtocol.lgWebOs,
    label: 'LG webOS second screen (WS 3000)',
    pairing: PairingKind.tvApproval,
    ssdpTargets: ['urn:lge.com:service:webos-second-screen:1', 'ssdp:all'],
    probePorts: [3000],
    verifyHint: 'register PROMPT handshake returns client-key',
    commands: [
      ..._dpad,
      TvKey.back,
      TvKey.home,
      TvKey.menu,
      TvKey.guide,
      TvKey.source,
      ..._vol,
      ..._ch,
      ..._media,
      TvKey.power,
      ..._digits,
    ],
    limitations:
        'Power-on over Wi-Fi is best-effort. Privileged Luna APIs unused.',
  ),
  TvProtocol.androidTvRemote: ProviderDescriptor(
    protocol: TvProtocol.androidTvRemote,
    label: 'Android/Google TV remote (TLS 6466/6467)',
    pairing: PairingKind.pin,
    mdnsServices: ['_androidtvremote2._tcp', '_googletv._tcp'],
    probePorts: [6466, 6467],
    verifyHint: 'TLS pairing handshake with TV PIN',
    commands: [
      ..._dpad,
      TvKey.back,
      TvKey.home,
      TvKey.menu,
      TvKey.guide,
      ..._vol,
      ..._ch,
      ..._media,
      TvKey.power,
      TvKey.search,
    ],
    limitations:
        'No guaranteed power-on. Protocol behavior pending hardware verification.',
  ),
  TvProtocol.rokuEcp: ProviderDescriptor(
    protocol: TvProtocol.rokuEcp,
    label: 'Roku External Control Protocol (HTTP 8060, no auth)',
    pairing: PairingKind.none,
    ssdpTargets: ['roku:ecp', 'ssdp:all'],
    probePorts: [8060],
    verifyHint: 'GET /query/device-info returns device-info XML',
    commands: [
      ..._dpad,
      TvKey.back,
      TvKey.home,
      ..._vol,
      ..._ch,
      TvKey.play,
      TvKey.playPause,
      TvKey.rewind,
      TvKey.fastForward,
      TvKey.power,
      TvKey.search,
    ],
    limitations:
        'TV must enable Settings > System > Advanced > Control by mobile apps. No power-on (PowerOff only, Roku TVs). No numeric keys.',
  ),
  TvProtocol.sonyIrcc: ProviderDescriptor(
    protocol: TvProtocol.sonyIrcc,
    label: 'Sony Bravia IRCC-IP + PSK (HTTP 80)',
    pairing: PairingKind.psk,
    probePorts: [80],
    verifyHint: 'POST /sony/system answers (401/403 proves API presence)',
    commands: [
      ..._dpad,
      TvKey.back,
      TvKey.home,
      TvKey.menu,
      ..._vol,
      ..._ch,
      TvKey.play,
      TvKey.pause,
      TvKey.playPause,
      TvKey.stop,
      TvKey.power,
      TvKey.source,
      ..._digits,
    ],
    limitations:
        'Requires PSK set on the TV (IP control). Codes fetched at runtime via getRemoteControllerInfo; standard-table fallback pending hardware confirmation.',
  ),
  TvProtocol.fireTvAdb: ProviderDescriptor(
    protocol: TvProtocol.fireTvAdb,
    label: 'Fire TV ADB remote (TCP 5555)',
    pairing: PairingKind.tvApproval,
    probePorts: [5555],
    verifyHint: 'ADB AUTH handshake and shell service',
    commands: [
      ..._dpad,
      TvKey.back,
      TvKey.home,
      TvKey.menu,
      TvKey.guide,
      TvKey.source,
      ..._vol,
      ..._ch,
      ..._media,
      TvKey.power,
      TvKey.search,
      ..._digits,
    ],
    limitations:
        'Requires ADB Debugging enabled on Fire TV and first-time approval on the TV. Power-on and voice are unavailable.',
  ),
  TvProtocol.dlnaRenderer: ProviderDescriptor(
    protocol: TvProtocol.dlnaRenderer,
    label: 'UPnP renderer baseline (volume + playback, no auth)',
    pairing: PairingKind.none,
    ssdpTargets: ['urn:schemas-upnp-org:device:MediaRenderer:1', 'ssdp:all'],
    verifyHint: 'SOAP GetVolume round-trip on RenderingControl URL',
    commands: [
      TvKey.volumeUp,
      TvKey.volumeDown,
      TvKey.mute,
      TvKey.play,
      TvKey.pause,
      TvKey.playPause,
      TvKey.stop,
    ],
    limitations:
        'Baseline only: no D-pad/home/digits/apps/search/power. '
        'Verified per device at pair time; silent devices are rejected.',
  ),
};

/// Platform identification from SSDP headers + device XML.
/// Manufacturer alone never decides: a Hisense Roku TV is Roku.
class PlatformId {
  final TvBrand brand;
  final String os;
  final bool tv;
  const PlatformId(this.brand, this.os, {this.tv = true});
}

PlatformId identifyPlatform(Map<String, String> headers, [String? xml]) {
  final brand = SsdpDiscovery.identifyBrand(headers, xml);
  final blob = (headers.values.join(' ') + ' ${xml ?? ''}').toLowerCase();
  String os = 'unknown';
  if (brand == TvBrand.samsung) {
    os = blob.contains('tizen') ? 'Tizen' : 'Samsung (generation TBD)';
  } else if (brand == TvBrand.lg) {
    os = blob.contains('webos')
        ? 'webOS'
        : (blob.contains('netcast')
              ? 'NetCast (legacy)'
              : 'LG (generation TBD)');
  } else if (brand == TvBrand.androidTv) {
    os = blob.contains('google tv')
        ? 'Google TV'
        : (blob.contains('fire') ? 'Fire OS (ADB remote)' : 'Android TV');
  } else if (brand == TvBrand.roku) {
    os = 'Roku OS';
  } else if (brand == TvBrand.sony) {
    os = 'Sony Bravia (Android/Google TV + IRCC-IP)';
  } else if (brand == TvBrand.vidaa) {
    os = 'VIDAA';
  } else if (brand == TvBrand.fireTv) {
    os = 'Fire OS';
  }
  return PlatformId(brand, os);
}

/// Classify a discovered device for display + flow routing.
DeviceClass classifyDevice(TvDevice d, {bool hasCredential = false}) {
  // UPnP-DMR baseline is partial by definition (volume + playback only),
  // regardless of the manufacturer label on the device.
  if (d.protocol == TvProtocol.dlnaRenderer) {
    return DeviceClass.partialNative;
  }
  switch (d.brand) {
    case TvBrand.samsung:
      if (d.protocol == TvProtocol.samsungLegacy) {
        return DeviceClass.partialNative;
      }
      return DeviceClass.fullNative;
    case TvBrand.lg:
    case TvBrand.androidTv:
    case TvBrand.roku:
    case TvBrand.sony:
      return d.protocol == TvProtocol.unknown
          ? DeviceClass.unsupported
          : DeviceClass.fullNative;
    case TvBrand.vidaa:
      return DeviceClass.unsupported;
    case TvBrand.fireTv:
      return d.protocol == TvProtocol.fireTvAdb
          ? DeviceClass.fullNative
          : DeviceClass.unsupported;
    case TvBrand.companion:
      return DeviceClass.companionOnly;
    case TvBrand.unknown:
      return DeviceClass.nonTv;
  }
}

/// Human-readable capability summary for device cards and dialogs.
String describeDevice(TvDevice d) {
  final cls = classifyDevice(d);
  final base =
      '${brandLabel(d.brand)}${d.model != null && d.model!.isNotEmpty ? ' • ${d.model}' : ''}';
  if (cls == DeviceClass.partialNative) {
    if (d.protocol == TvProtocol.dlnaRenderer) {
      return '$base • basic control: volume + playback (UPnP)';
    }
    return '$base • legacy set — limited support';
  }
  switch (cls) {
    case DeviceClass.fullNative:
      final desc = providerRegistry[d.protocol];
      return '$base • ${desc?.label ?? 'native remote'}';
    case DeviceClass.partialNative:
      return '$base • legacy set — limited support';
    case DeviceClass.unsupported:
      final reason = d.brand == TvBrand.vidaa
          ? 'VIDAA system — no open remote API'
          : d.brand == TvBrand.fireTv
          ? 'Fire TV remote (requires ADB Debugging)'
          : 'no supported remote service found';
      return '$base • $reason';
    case DeviceClass.nonTv:
      return '$base • not a TV';
    case DeviceClass.companionOnly:
      return '$base • Morph TV companion only';
  }
}

/// Native remote protocols — devices of these brands are driven by a
/// real provider, never by the companion fallback.
bool isNativeBrand(TvBrand b) =>
    b == TvBrand.samsung ||
    b == TvBrand.lg ||
    b == TvBrand.androidTv ||
    b == TvBrand.roku ||
    b == TvBrand.sony ||
    b == TvBrand.fireTv;

/// Merge rule: one card per physical TV. Native entries absorb companion
/// info as a badge and supersede UPnP-DMR baselines on the same IP;
/// duplicates collapse. Pure — unit tested.
List<TvDevice> mergeDevice(List<TvDevice> existing, TvDevice incoming) {
  final list = List<TvDevice>.from(existing);
  bool isNative(TvDevice d) => isNativeBrand(d.brand);
  bool isDlna(TvDevice d) => d.protocol == TvProtocol.dlnaRenderer;

  if (incoming.brand == TvBrand.companion) {
    final ni = list.indexWhere((e) => e.ip == incoming.ip && isNative(e));
    if (ni >= 0) {
      final cur = list[ni];
      if (cur.extras['companion'] != 'true') {
        list[ni] = cur.copyWith(
          extras: {
            ...cur.extras,
            'companion': 'true',
            'companionName': incoming.name,
          },
        );
      }
      return list;
    }
  } else if (isDlna(incoming)) {
    // A native entry for the same TV already covers everything DMR can
    // do (and much more) — keep a single card.
    if (list.any((e) => e.ip == incoming.ip && isNative(e))) {
      return list;
    }
  } else if (isNative(incoming)) {
    final ci = list.indexWhere(
      (e) => e.ip == incoming.ip && e.brand == TvBrand.companion,
    );
    if (ci >= 0) {
      final compName = list[ci].name;
      list.removeAt(ci);
      final genericAndroidName =
          incoming.brand == TvBrand.androidTv &&
          (incoming.name.toLowerCase() == 'android tv' ||
              incoming.name.toLowerCase() == 'android / google tv');
      incoming = incoming.copyWith(
        name: genericAndroidName ? compName : incoming.name,
        extras: {
          ...incoming.extras,
          'companion': 'true',
          'companionName': compName,
        },
      );
    }
    // Supersede any DMR baseline card for the same TV.
    list.removeWhere((e) => e.ip == incoming.ip && isDlna(e));
  }
  final key = '${incoming.ip}-${incoming.brand.name}';
  if (!list.any((e) => '${e.ip}-${e.brand.name}' == key)) {
    list.add(incoming);
    list.sort((a, b) => a.name.compareTo(b.name));
  }
  return list;
}
