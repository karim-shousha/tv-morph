import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter/services.dart';
import '../core/network/discovery_stats.dart';
import '../core/network/mdns_discovery.dart';
import '../core/network/multicast_lock.dart';
import '../core/network/network_status.dart';
import '../core/network/ssdp_discovery.dart';
import '../core/network/sweep_discovery.dart';
import '../core/storage/saved_devices_repo.dart';
import '../providers/androidtv/android_tv_provider.dart';
import '../providers/lg/lg_provider.dart';
import '../providers/mock_provider.dart';
import '../providers/dlna/dlna_provider.dart';
import '../providers/firetv/fire_tv_provider.dart';
import '../providers/registry.dart';
import '../providers/roku/roku_provider.dart';
import '../providers/samsung/samsung_provider.dart';
import '../providers/sony/sony_provider.dart';
import '../providers/tv_models.dart';
import '../providers/tv_provider.dart';

/// Global app state: discovery, saved devices, active connection.
class AppState extends ChangeNotifier {
  final navigatorKey = GlobalKey<NavigatorState>();
  String visibleRoute = '/';
  bool _disposed = false;
  void showRoute(String name) {
    if (_disposed || visibleRoute == name) return;
    visibleRoute = name;
    notifyListeners();
  }

  final SavedDevicesRepo repo = SavedDevicesRepo();

  List<TvDevice> discovered = [];
  List<TvDevice> saved = [];
  TvDevice? selected;
  TvProvider? provider;
  bool scanning = false;
  bool useMock = false;

  /// Last discovery diagnostics (never contains secrets).
  DiscoveryStats lastStats = DiscoveryStats();
  NetworkStatus net = const NetworkStatus(wifi: false);
  DiscoveryCancel? _cancel;

  /// Last saved TV, for one-tap reconnect on the welcome screen.
  TvDevice? get lastTv {
    if (saved.isEmpty) return null;
    final sorted = List<TvDevice>.from(saved)
      ..sort((a, b) {
        final la = a.lastConnected;
        final lb = b.lastConnected;
        if (la == null && lb == null) return 0;
        if (la == null) return 1;
        if (lb == null) return -1;
        return lb.compareTo(la);
      });
    return sorted.first;
  }

  String themeMode = 'dark'; // dark | light
  String localeCode = 'en'; // en | ar
  bool haptics = true;
  ConnectionStatus connStatus = ConnectionStatus.disconnected;
  StreamSubscription? _provSub;
  StreamSubscription? _connSub;

  Future<void> init() async {
    saved = await repo.load();
    themeMode = 'dark';
    await repo.setTheme('dark');
    localeCode = await repo.locale();
    haptics = await repo.haptics();
    net = await NetworkStatus.current();
    final last = await repo.lastId();
    if (last != null) {
      try {
        selected = saved.firstWhere((d) => d.id == last);
      } catch (_) {}
    }
    _connSub = _listenConnectivity();
    notifyListeners();
  }

  /// Wi-Fi change listener. Never throws (unit-test safe).
  StreamSubscription? _listenConnectivity() {
    try {
      return Connectivity().onConnectivityChanged.listen((_) async {
        net = await NetworkStatus.current();
        notifyListeners();
        // Re-validate on Wi-Fi change.
        if (selected != null && connStatus == ConnectionStatus.connected) {
          reconnect();
        }
      });
    } catch (_) {
      return null;
    }
  }

  Future<void> refreshNetwork() async {
    net = await NetworkStatus.current();
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    themeMode = 'dark';
    await repo.setTheme(themeMode);
    notifyListeners();
  }

  Future<void> setLocale(String code) async {
    localeCode = code;
    await repo.setLocale(code);
    notifyListeners();
  }

  Future<void> setHaptics(bool v) async {
    haptics = v;
    await repo.setHaptics(v);
    notifyListeners();
  }

  void _addProgressive(TvDevice d) {
    // Unified merge via the registry: one card per physical TV.
    final before = discovered.length;
    discovered = mergeDevice(discovered, d);
    if (discovered.length != before || discovered.any((e) => e.id == d.id)) {
      lastStats.publishedToUi = discovered.length;
      notifyListeners();
    }
    // IP-change healing: same saved TV (brand + name) on a new IP.
    _healIp(d);
  }

  Future<void> _healIp(TvDevice seen) async {
    final idx = saved.indexWhere(
      (s) => s.brand == seen.brand && s.name == seen.name && s.ip != seen.ip,
    );
    if (idx >= 0) {
      final updated = saved[idx].copyWith(ip: seen.ip);
      saved[idx] = updated;
      await repo.upsert(updated);
      if (selected?.id == updated.id) selected = updated;
      notifyListeners();
    }
  }

  /// Default discovery: SSDP + mDNS only (bounded, multicast-based).
  /// The full-subnet sweep is intentionally NOT part of the default pass
  /// (no aggressive probing) — see [deepScan], offered opt-in from
  /// Troubleshooting when nothing is found.
  Future<void> scan() async {
    if (scanning) return;
    scanning = true;
    _cancel = DiscoveryCancel();
    discovered = [];
    lastStats = DiscoveryStats();
    lastStats.stage('scan started (default: SSDP+mDNS)');
    lastStats.stage(
      'network wifi=${net.wifi} ip=${net.localIp} iface=${net.interfaceName}',
    );
    notifyListeners();
    final lockHeld = await MulticastLock.acquire();
    lastStats.multicastLockHeld = lockHeld;
    lastStats.stage(
      'multicast lock ${lockHeld ? 'HELD' : 'NOT HELD — multicast RX likely blocked'}',
    );
    if (!lockHeld) {
      lastStats.note =
          'Multicast lock NOT held — Android may block multicast; results may be empty.';
    }
    try {
      // Hold multicast receive permission before opening either scan socket.
      // Some Android devices drop the first queries if acquisition races them.
      final localIp = net.localIp;
      final prefix = _subnetPrefix(localIp);
      final discoveryTasks = <Future<Object?>>[
        SsdpDiscovery.scan(
          timeout: const Duration(seconds: 5),
          stats: lastStats,
          cancel: _cancel,
          onFound: _addProgressive,
          localIp: localIp,
        ),
        MdnsDiscovery.scan(
          timeout: const Duration(seconds: 5),
          stats: lastStats,
          cancel: _cancel,
          onFound: _addProgressive,
        ),
      ];
      // Morph TV discovers over its own LAN service rather than multicast.
      // Run the direct protocol probes alongside SSDP/mDNS so a slow or
      // blocked multicast path cannot postpone devices from being published.
      if (prefix != null) {
        discoveryTasks.add(
          SweepDiscovery.scan(
            timeout: const Duration(seconds: 12),
            stats: lastStats,
            cancel: _cancel,
            localIp: localIp,
            prefixLength: 24,
            onFound: _addProgressive,
          ),
        );
      }
      await Future.wait(discoveryTasks);
      // Multicast advertisements are frequently blocked by router settings.
      // Fallback ladder, each step bounded and logged:
      //   1. unicast M-SEARCH burst (one small packet per host, no
      //      multicast needed) — finds every SSDP responder incl. DMR.
      //   2. direct TCP sweep (Samsung /api/v2/, Sony, Android TV 6466,
      //      companion) — no open port is treated as proof; providers
      //      verify before any command or pairing.
      if (discovered.isEmpty && _cancel?.isCancelled != true) {
        final prefix = _subnetPrefix(net.localIp);
        if (prefix != null) {
          lastStats.stage('multicast found no TVs; unicast burst at $prefix*');
          await SsdpDiscovery.scanUnicastSubnet(
            prefix: prefix,
            ownIp: net.localIp,
            stats: lastStats,
            cancel: _cancel,
            onFound: _addProgressive,
          );
        }
      }
    } finally {
      await MulticastLock.release();
      lastStats.stage(
        'scan finished: ${discovered.length} device(s) published to UI',
      );
      scanning = false;
      _cancel = null;
      notifyListeners();
    }
  }

  /// /24 prefix (e.g. '10.0.0.') from a local IPv4, or null.
  static String? _subnetPrefix(String? ip) {
    if (ip == null) return null;
    final parts = ip.split('.');
    if (parts.length != 4) return null;
    return '${parts[0]}.${parts[1]}.${parts[2]}.';
  }

  /// Opt-in deep scan: direct per-address verification (Samsung /api/v2/,
  /// Sony /sony/system, Morph companion /info) across the local /24.
  /// Slower and chatty by design — only runs when the user asks for it.
  /// Multicast lock still held (SSDP re-runs inside the sweep path? no —
  /// sweep is pure unicast; lock not required but harmless).
  Future<void> deepScan() async {
    if (scanning) return;
    scanning = true;
    _cancel = DiscoveryCancel();
    lastStats.sweepScanned = 0;
    lastStats.stage('deep scan started (unicast burst + direct /24 probe)');
    notifyListeners();
    try {
      final prefix = _subnetPrefix(net.localIp);
      if (prefix != null && _cancel?.isCancelled != true) {
        await SsdpDiscovery.scanUnicastSubnet(
          prefix: prefix,
          ownIp: net.localIp,
          stats: lastStats,
          cancel: _cancel,
          onFound: _addProgressive,
        );
      }
      await SweepDiscovery.scan(
        stats: lastStats,
        cancel: _cancel,
        localIp: net.localIp,
        prefixLength: 24,
        onFound: _addProgressive,
      );
    } finally {
      lastStats.stage(
        'deep scan finished: ${discovered.length} device(s) published to UI',
      );
      scanning = false;
      _cancel = null;
      notifyListeners();
    }
  }

  void stopScan() {
    _cancel?.cancel();
    scanning = false;
    notifyListeners();
  }

  TvProvider buildProvider(TvDevice d, {String? secret}) {
    if (useMock) return MockTvProvider(d);
    return switch (d.protocol) {
      TvProtocol.samsungTizenWs ||
      TvProtocol.samsungLegacy => SamsungProvider(d, savedToken: secret),
      TvProtocol.lgWebOs => LgProvider(d, clientKey: secret),
      TvProtocol.androidTvRemote => AndroidTvProvider(d, savedToken: secret),
      TvProtocol.rokuEcp => RokuProvider(d),
      TvProtocol.sonyIrcc => SonyProvider(d, savedPsk: secret),
      TvProtocol.fireTvAdb => FireTvProvider(d, savedKey: secret),
      TvProtocol.dlnaRenderer => DlnaProvider(d),
      TvProtocol.unknown => MockTvProvider(d),
    };
  }

  /// Last connection attempt log (sanitized, no secrets) for diagnostics.
  String lastConnectionLog = 'none yet';
  int _connectionEpoch = 0;
  Future<bool>? _autoReconnectPending;

  Future<void> selectAndConnect(TvDevice d) async {
    final epoch = ++_connectionEpoch;
    await provider?.disconnect();
    if (epoch != _connectionEpoch) return;
    await _provSub?.cancel();
    selected = d;
    final secret = await SecureStore().readSecret(d.id);
    if (epoch != _connectionEpoch) return;
    final connectingProvider = buildProvider(d, secret: secret);
    provider = connectingProvider;
    _provSub = connectingProvider.statusStream.listen((s) {
      if (epoch != _connectionEpoch) return;
      connStatus = s;
      notifyListeners();
    });
    connStatus = ConnectionStatus.connecting;
    notifyListeners();
    try {
      await connectingProvider.connect().timeout(const Duration(seconds: 60));
      if (epoch != _connectionEpoch) return;
      if (connectingProvider.status != ConnectionStatus.connected) {
        throw StateError('TV provider did not reach connected state');
      }
      connStatus = ConnectionStatus.connected;
      final updated = d.copyWith(lastConnected: DateTime.now());
      await repo.upsert(updated);
      if (epoch != _connectionEpoch) return;
      await repo.setLastId(d.id);
      saved = await repo.load();
      if (epoch != _connectionEpoch) return;
      selected = updated;
      lastConnectionLog = _describeAttempts();
    } catch (e) {
      if (epoch != _connectionEpoch) return;
      connStatus = ConnectionStatus.error;
      lastConnectionLog = _describeAttempts(extra: '$e');
    }
    notifyListeners();
  }

  /// Takes ownership of a provider that has already completed pairing. Fire
  /// TV's ADB approval creates a trusted, live transport; keeping that
  /// transport avoids a redundant second connect immediately after approval.
  Future<void> adoptConnectedProvider(TvDevice d, TvProvider connected) async {
    ++_connectionEpoch;
    await provider?.disconnect();
    await _provSub?.cancel();
    selected = d;
    provider = connected;
    _provSub = connected.statusStream.listen((s) {
      connStatus = s;
      notifyListeners();
    });
    connStatus = connected.status;
    notifyListeners();
    if (connStatus != ConnectionStatus.connected) {
      throw StateError('The paired TV connection is no longer active');
    }
    final updated = d.copyWith(lastConnected: DateTime.now());
    await repo.upsert(updated);
    await repo.setLastId(d.id);
    saved = await repo.load();
    selected = updated;
    lastConnectionLog = _describeAttempts();
    notifyListeners();
  }

  /// Silent reconnect using stored credentials (no pairing prompt when the
  /// TV still trusts us). Returns true when connected.
  Future<bool> autoReconnect() {
    final target = selected ?? lastTv;
    if (target == null) return Future.value(false);
    if (connStatus == ConnectionStatus.connected &&
        provider?.device.id == target.id)
      return Future.value(true);
    if (_autoReconnectPending != null) return _autoReconnectPending!;
    final attempt = () async {
      try {
        await selectAndConnect(target);
        return connStatus == ConnectionStatus.connected;
      } catch (_) {
        return false;
      }
    }();
    _autoReconnectPending = attempt;
    attempt.whenComplete(() => _autoReconnectPending = null);
    return attempt;
  }

  String _describeAttempts({String? extra}) {
    final p = provider;
    if (p is SamsungProvider) {
      final lines = p.attempts.map((a) => '  $a').join('\n');
      final tail = extra == null ? '' : '\n  error: $extra';
      return 'Samsung ${p.device.ip} '
          '(stored port ${p.device.port}, failure: ${p.lastFailure}):\n'
          '$lines$tail';
    }
    final tail = extra == null ? '' : ' error: $extra';
    return '${selected?.brand.name} ${selected?.ip}$tail';
  }

  Future<void> reconnect() async {
    final d = selected;
    if (d == null) return;
    await selectAndConnect(d);
  }

  Future<void> disconnect() async {
    await provider?.disconnect();
    connStatus = ConnectionStatus.disconnected;
    notifyListeners();
  }

  Future<void> forget(String id) async {
    if (selected?.id == id) {
      await disconnect();
      selected = null;
      provider = null;
    }
    await repo.remove(id);
    saved = await repo.load();
    notifyListeners();
  }

  Future<bool> sendKey(TvKey k) async {
    final p = provider;
    if (p == null || connStatus != ConnectionStatus.connected) return false;
    return p.sendKey(k);
  }

  // Android/Fire TV typing uses the original authenticated Morph TV receiver.
  // It deliberately does not promise to type into third-party applications.
  Future<bool> sendText(String text) async {
    final tv = selected;
    if (tv == null || text.isEmpty || text.length > 500) return false;
    if (tv.protocol == TvProtocol.androidTvRemote || tv.protocol == TvProtocol.fireTvAdb) {
      try {
        return await const MethodChannel('morph_tv/host').invokeMethod<bool>(
          'morphText', {'ip': tv.ip, 'text': text},
        ) ?? false;
      } on PlatformException { return false; }
        on MissingPluginException { return false; }
    }
    return provider?.sendText(text) ?? false;
  }

  Future<bool> sendRemoteAction(
    Future<bool> Function(TvProvider provider) action,
  ) async {
    final p = provider;
    if (p == null || connStatus != ConnectionStatus.connected) return false;
    try {
      return await action(p);
    } catch (_) {
      return false;
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _provSub?.cancel();
    _connSub?.cancel();
    super.dispose();
  }
}
