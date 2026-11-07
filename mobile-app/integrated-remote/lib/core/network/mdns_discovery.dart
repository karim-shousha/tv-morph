import 'package:multicast_dns/multicast_dns.dart';
import '../../providers/tv_models.dart';
import 'discovery_stats.dart';
import 'ssdp_discovery.dart';

/// mDNS / DNS-SD discovery with stats, cancellation and progressive results.
///
/// Service types probed:
///  - Samsung: `_samsungtv._tcp`, `_samsung-remote._tcp`, `_samsung._tcp`
///  - LG webOS: `_webos._tcp`, `_lg-smart-tv._tcp`, `_lge._tcp`
///  - Android/Google TV: `_androidtvremote2._tcp`, `_googletv._tcp`,
///    `_googlecast._tcp`
class MdnsDiscovery {
  static const _services = <String, TvBrand>{
    '_samsungtv._tcp': TvBrand.samsung,
    '_samsung-remote._tcp': TvBrand.samsung,
    '_samsung._tcp': TvBrand.samsung,
    '_webos._tcp': TvBrand.lg,
    '_lg-smart-tv._tcp': TvBrand.lg,
    '_lge._tcp': TvBrand.lg,
    '_androidtvremote2._tcp': TvBrand.androidTv,
    '_googletv._tcp': TvBrand.androidTv,
    '_googlecast._tcp': TvBrand.androidTv,
  };

  static Future<List<TvDevice>> scan({
    Duration timeout = const Duration(seconds: 8),
    DiscoveryStats? stats,
    DiscoveryCancel? cancel,
    void Function(TvDevice device)? onFound,
  }) async {
    final found = <String, TvDevice>{};
    MDnsClient? client;
    try {
      stats?.stage('mdns: starting client');
      client = MDnsClient();
      await client.start().timeout(const Duration(seconds: 4));
      stats?.stage(
        'mdns: client started, querying ${_services.length} service types',
      );
      await Future.wait(
        _services.entries.map((entry) async {
          if (cancel?.isCancelled == true) return;
          try {
            await for (final ptr
                in client!
                    .lookup<PtrResourceRecord>(
                      ResourceRecordQuery.serverPointer(entry.key),
                    )
                    .timeout(timeout, onTimeout: (sink) => sink.close())) {
              if (cancel?.isCancelled == true) break;
              try {
                String? ip;
                await for (final a
                    in client
                        .lookup<IPAddressResourceRecord>(
                          ResourceRecordQuery.addressIPv4(ptr.domainName),
                        )
                        .timeout(
                          const Duration(seconds: 2),
                          onTimeout: (sink) => sink.close(),
                        )) {
                  ip = a.address.address;
                  break;
                }
                if (ip == null) continue;
                if (stats != null) stats.mdnsServicesResolved++;
                final id = 'mdns-$ip-${entry.value.name}';
                if (found.containsKey(id)) continue;
                final dev = TvDevice(
                  id: id,
                  name: ptr.domainName.split('.').first.replaceAll('-', ' '),
                  brand: entry.value,
                  protocol: SsdpDiscovery.protocolFor(entry.value),
                  ip: ip,
                  port: SsdpDiscovery.defaultPortFor(entry.value),
                );
                found[id] = dev;
                if (stats != null) stats.candidatesAccepted++;
                onFound?.call(dev);
              } catch (_) {}
            }
          } catch (_) {}
        }),
      ).timeout(timeout + const Duration(seconds: 2));
    } catch (e) {
      if (stats != null && stats.note.isEmpty) {
        stats.note = 'mDNS unavailable: $e (multicast blocked?)';
        stats.stage('mdns: FAILED ($e)');
      }
    } finally {
      client?.stop();
      if (cancel?.isCancelled == true) {
        stats?.stage('mdns: cancelled by user');
      } else {
        stats?.stage('mdns: done (${found.length} accepted)');
      }
    }
    return found.values.toList();
  }
}
