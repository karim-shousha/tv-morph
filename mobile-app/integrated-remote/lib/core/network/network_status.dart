import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';

/// Local network snapshot for diagnostics + interface selection.
/// Pure dart:io — no location permission required.
class NetworkStatus {
  final bool wifi;
  final String? localIp;
  final String? interfaceName;
  final bool vpnLikely;

  const NetworkStatus({
    required this.wifi,
    this.localIp,
    this.interfaceName,
    this.vpnLikely = false,
  });

  String get subnet {
    final ip = localIp;
    if (ip == null) return 'unknown';
    final parts = ip.split('.');
    if (parts.length == 4) return '${parts[0]}.${parts[1]}.${parts[2]}.0/24';
    return 'non-IPv4';
  }

  static Future<NetworkStatus> current() async {
    // flutter_test runs in a fake-async zone where dart:io interface
    // enumeration never resolves. Short-circuit for tests only;
    // widget tests mock the connectivity channel separately.
    if (Platform.environment['FLUTTER_TEST'] == 'true') {
      return const NetworkStatus(
          wifi: true, localIp: '192.168.1.50', interfaceName: 'wlan0-test');
    }
    bool wifi = false;
    try {
      final con = await Connectivity()
          .checkConnectivity()
          .timeout(const Duration(seconds: 3),
              onTimeout: () => [ConnectivityResult.none]);
      wifi = con.contains(ConnectivityResult.wifi);
    } catch (_) {}
    String? ip;
    String? ifName;
    bool vpn = false;
    try {
      final ifs = await NetworkInterface.list(
        includeLoopback: false,
        type: InternetAddressType.IPv4,
      );
      // Prefer wlan* (Android Wi-Fi); deprioritize tun/ppp/rmnet (VPN/mobile).
      NetworkInterface? pick;
      for (final i in ifs) {
        final n = i.name.toLowerCase();
        if (n.contains('tun') || n.contains('ppp')) vpn = true;
      }
      for (final i in ifs) {
        if (i.name.toLowerCase().startsWith('wlan')) {
          pick = i;
          break;
        }
      }
      pick ??= ifs.isNotEmpty ? ifs.first : null;
      if (pick != null && pick.addresses.isNotEmpty) {
        ip = pick.addresses.first.address;
        ifName = pick.name;
      }
    } catch (_) {}
    return NetworkStatus(
        wifi: wifi, localIp: ip, interfaceName: ifName, vpnLikely: vpn);
  }

  /// Best interface for SSDP multicast transmission.
  /// Prefers the NIC that actually owns [localIp] (the Wi-Fi address);
  /// sending multicast out a mobile-data/VPN interface is the classic
  /// "probes sent, zero responses" failure. Pure selection in [pickName]
  /// so it is unit-testable.
  static Future<NetworkInterface?> wifiInterface({String? localIp}) async {
    try {
      final ifs = await NetworkInterface.list(
        includeLoopback: false,
        type: InternetAddressType.IPv4,
      );
      final table = <(String, List<String>)>[
        for (final i in ifs)
          (i.name, [for (final a in i.addresses) a.address]),
      ];
      final want = pickName(table, localIp: localIp);
      if (want == null) return null;
      for (final i in ifs) {
        if (i.name == want) return i;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Pure interface ranking. Returns the chosen interface name, or null.
  /// Visible for testing.
  static String? pickName(List<(String, List<String>)> ifs,
      {String? localIp}) {
    if (ifs.isEmpty) return null;
    bool bad(String n) {
      n = n.toLowerCase();
      return n.contains('tun') || n.contains('ppp') || n.contains('rmnet');
    }

    if (localIp != null && localIp.isNotEmpty) {
      for (final e in ifs) {
        if (!bad(e.$1) && e.$2.contains(localIp)) return e.$1;
      }
    }
    for (final e in ifs) {
      if (!bad(e.$1) && e.$1.toLowerCase().startsWith('wlan')) return e.$1;
    }
    for (final e in ifs) {
      if (!bad(e.$1)) return e.$1;
    }
    return null;
  }

  /// One-line inventory for diagnostics ("eth0[…], wlan0[…]").
  static String inventory(List<(String, List<String>)> ifs) =>
      ifs.map((e) => '${e.$1}[${e.$2.join(',')}]').join(' ');
}
