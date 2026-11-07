import 'dart:io';

/// Wake-on-LAN magic packet sender (UDP port 9).
/// Only advertised as supported when the user provided a MAC address,
/// since most TVs need wired LAN + "Mobile TV On" enabled.
class WakeOnLan {
  static List<int> buildMagicPacket(String mac) {
    final clean = mac.replaceAll(RegExp(r'[^0-9a-fA-F]'), '');
    if (clean.length != 12) throw FormatException('Invalid MAC: $mac');
    final macBytes = List<int>.generate(
      6,
      (i) => int.parse(clean.substring(i * 2, i * 2 + 2), radix: 16),
    );
    return <int>[...List.filled(6, 0xFF), for (var i = 0; i < 16; i++) ...macBytes];
  }

  static Future<void> wake(String mac, {String broadcast = '255.255.255.255'}) async {
    final packet = buildMagicPacket(mac);
    final sock = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
    try {
      sock.broadcastEnabled = true;
      sock.send(packet, InternetAddress(broadcast), 9);
      await Future<void>.delayed(const Duration(milliseconds: 300));
    } finally {
      sock.close();
    }
  }
}
