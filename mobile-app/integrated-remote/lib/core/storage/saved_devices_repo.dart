import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../providers/tv_models.dart';
import '../../providers/androidtv/android_tv_identity.dart';

/// Pairing secrets (LG client-key, Android-TV auth tokens, Samsung tokens)
/// live in platform secure storage (Keychain / Keystore).
/// Non-secret device metadata lives in SharedPreferences.
class SecureStore {
  static const _keyPrefix = 'morph_remote_secret_';
  final FlutterSecureStorage _sec = const FlutterSecureStorage();

  String _k(String deviceId) =>
      '$_keyPrefix${sha256.convert(utf8.encode(deviceId))}';

  /// Defensive: on platforms without the plugin (tests/desktop) these
  /// degrade gracefully instead of throwing.
  Future<void> saveSecret(String deviceId, String secret) async {
    try {
      // Secure-storage implementations can cap individual values. Keep the
      // certificate and private key in separate encrypted entries.
      final identity = AndroidTvIdentity.tryParse(secret);
      if (identity != null) {
        await _sec.write(
          key: '${_k(deviceId)}_cert',
          value: identity.certificatePem,
        );
        await _sec.write(
          key: '${_k(deviceId)}_key',
          value: identity.privateKeyPem,
        );
      } else {
        await _sec.write(key: _k(deviceId), value: secret);
      }
    } catch (_) {}
  }

  Future<String?> readSecret(String deviceId) async {
    try {
      final cert = await _sec.read(key: '${_k(deviceId)}_cert');
      final privateKey = await _sec.read(key: '${_k(deviceId)}_key');
      if (cert != null && privateKey != null) {
        return AndroidTvIdentity(cert, privateKey).serialize();
      }
      return await _sec.read(key: _k(deviceId));
    } catch (_) {
      return null;
    }
  }

  Future<void> deleteSecret(String deviceId) async {
    try {
      await _sec.delete(key: _k(deviceId));
      await _sec.delete(key: '${_k(deviceId)}_cert');
      await _sec.delete(key: '${_k(deviceId)}_key');
    } catch (_) {}
  }
}

class SavedDevicesRepo {
  static const _devicesKey = 'morph_remote_devices_v1';
  static const _lastKey = 'morph_remote_last_id';
  static const _hapticsKey = 'morph_remote_haptics';
  static const _themeKey = 'morph_remote_theme';
  static const _localeKey = 'morph_remote_locale';

  Future<List<TvDevice>> load() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getStringList(_devicesKey) ?? [];
    return raw.map((s) {
      var d = TvDevice.fromJson(
        Map<String, dynamic>.from(jsonDecode(s) as Map),
      );
      // Defense in depth (Samsung 33528 incident): a persisted Samsung
      // port outside {0,8001,8002} can never be a remote endpoint. Reset
      // to 0 so the endpoint resolver re-verifies instead of trusting it.
      if (d.brand == TvBrand.samsung &&
          d.port != 0 &&
          d.port != 8001 &&
          d.port != 8002) {
        d = d.copyWith(port: 0);
      }
      return d;
    }).toList();
  }

  Future<void> saveAll(List<TvDevice> devices) async {
    final p = await SharedPreferences.getInstance();
    await p.setStringList(
      _devicesKey,
      devices.map((d) => jsonEncode(d.toJson())).toList(),
    );
  }

  Future<void> upsert(TvDevice d) async {
    final list = await load();
    final i = list.indexWhere((e) => e.id == d.id);
    if (i >= 0) {
      list[i] = d;
    } else {
      list.add(d);
    }
    await saveAll(list);
  }

  Future<void> remove(String id) async {
    final list = await load();
    list.removeWhere((e) => e.id == id);
    await saveAll(list);
    await SecureStore().deleteSecret(id);
  }

  Future<String?> lastId() async =>
      (await SharedPreferences.getInstance()).getString(_lastKey);
  Future<void> setLastId(String id) async =>
      (await SharedPreferences.getInstance()).setString(_lastKey, id);

  Future<bool> haptics() async =>
      (await SharedPreferences.getInstance()).getBool(_hapticsKey) ?? true;
  Future<void> setHaptics(bool v) async =>
      (await SharedPreferences.getInstance()).setBool(_hapticsKey, v);

  Future<String> theme() async =>
      (await SharedPreferences.getInstance()).getString(_themeKey) ?? 'light';
  Future<void> setTheme(String v) async =>
      (await SharedPreferences.getInstance()).setString(_themeKey, v);

  Future<String> locale() async =>
      (await SharedPreferences.getInstance()).getString(_localeKey) ?? 'en';
  Future<void> setLocale(String v) async =>
      (await SharedPreferences.getInstance()).setString(_localeKey, v);
}
