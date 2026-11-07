import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_adb/flutter_adb.dart';
import 'package:morph_remote/providers/firetv/fire_tv_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';
import 'package:morph_remote/core/storage/saved_devices_repo.dart';

class WireConnection implements AdbConnection {
  final writes = <String>[];
  @override
  Future<void> sendMessage(Uint8List data, {bool flush = false}) async {
    writes.add(utf8.decode(data.sublist(24)));
  }

  @override
  dynamic noSuchMethod(Invocation i) => super.noSuchMethod(i);
}

class FireShell implements AdbStream {
  final controller = StreamController<Uint8List>.broadcast();
  final writes = <String>[];
  final bool fast;
  FireShell(this.fast);
  @override
  Stream<Uint8List> get onPayload => controller.stream;
  @override
  Future<bool> writeString(String value) async {
    writes.add(value);
    if (value.contains('cmd input help'))
      controller.add(
        Uint8List.fromList(utf8.encode('__MORPH_INPUT:${fast ? 0 : 1}__')),
      );
    return true;
  }

  @override
  dynamic noSuchMethod(Invocation i) => super.noSuchMethod(i);
}

class FireConnection implements AdbConnection {
  final FireShell shell;
  final bool accepts;
  int connects = 0, opens = 0;
  FireConnection(this.shell, {this.accepts = true});
  @override
  Future<bool> connect() async {
    connects++;
    return accepts;
  }

  @override
  Future<AdbStream> openShell() async {
    opens++;
    return shell;
  }

  @override
  Future<bool> disconnect() async => true;
  @override
  dynamic noSuchMethod(Invocation i) => super.noSuchMethod(i);
}

const fire = TvDevice(
  id: 'fire-fixture',
  name: 'Fire TV',
  brand: TvBrand.fireTv,
  protocol: TvProtocol.fireTvAdb,
  ip: '192.0.2.8',
  port: 5555,
);
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final secrets = <String, String>{};
  setUp(() {
    secrets.clear();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('plugins.it_nomads.com/flutter_secure_storage'),
          (call) async {
            final args = Map<String, dynamic>.from(call.arguments);
            if (call.method == 'write') {
              secrets[args['key']] = args['value'];
              return null;
            }
            if (call.method == 'read') return secrets[args['key']];
            return null;
          },
        );
  });
  testWidgets(
    'ADB wakes immediately on OKAY and serializes concurrent writers',
    (t) async {
      final wire = WireConnection();
      final stream = AdbStream(1, wire)..remoteId = 9;
      final pending = [
        stream.writeString('first'),
        stream.writeString('second'),
        stream.writeString('third'),
      ];
      await t.pump();
      expect(wire.writes, isEmpty);
      stream.readyForWrite();
      await t.pump(const Duration(milliseconds: 1));
      expect(wire.writes, ['first']);
      stream.readyForWrite();
      await t.pump(const Duration(milliseconds: 1));
      expect(wire.writes, ['first', 'second']);
      stream.readyForWrite();
      await t.pump(const Duration(milliseconds: 1));
      expect(wire.writes, ['first', 'second', 'third']);
      expect(await Future.wait(pending), everyElement(true));
      final blocked = stream.writeString('never');
      await t.pump();
      stream.close();
      await t.pump();
      expect(await blocked, false);
    },
  );
  test(
    'Fire identity is persisted before authorization and retained on retry',
    () async {
      final failed = FireConnection(FireShell(false), accepts: false);
      final first = FireTvProvider(
        fire,
        connectionFactory: (ip, port, crypto) {
          expect(secrets, isNotEmpty);
          return failed;
        },
      );
      await expectLater(first.connect(), throwsStateError);
      final key = await SecureStore().readSecret(fire.id);
      expect(key, isNotNull);
      final connection = FireConnection(FireShell(true));
      final retry = FireTvProvider(
        fire,
        savedKey: key,
        connectionFactory: (ip, port, crypto) => connection,
      );
      await retry.connect();
      expect(await SecureStore().readSecret(fire.id), key);
      await retry.connect();
      expect(connection.connects, 1);
      expect(connection.opens, 1);
      expect(
        await Future.wait([
          retry.sendKey(TvKey.up),
          retry.sendKey(TvKey.right),
          retry.sendKey(TvKey.ok),
          retry.sendKey(TvKey.down),
        ]),
        everyElement(true),
      );
      expect(connection.shell.writes.last, 'cmd input keyevent 19 22 23 20\n');
      await retry.disconnect();
      await connection.shell.controller.close();
      await failed.shell.controller.close();
    },
  );
  test('Older Fire OS uses the legacy input path', () async {
    final connection = FireConnection(FireShell(false));
    final remote = FireTvProvider(
      fire,
      connectionFactory: (ip, port, crypto) => connection,
    );
    await remote.connect();
    expect(await remote.sendKey(TvKey.menu), true);
    expect(connection.shell.writes.last, 'input keyevent 82\n');
    await remote.disconnect();
    await connection.shell.controller.close();
  });
}
