import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

/// Mocks connectivity_plus in widget tests.
///
/// An unmocked `checkConnectivity()` never resolves under fake_async.
/// Returns wifi so screens render their online state.
void mockConnectivity({String result = 'wifi'}) {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
    const MethodChannel('dev.fluttercommunity.plus/connectivity'),
    (call) async {
      if (call.method == 'check') return <String>[result];
      return null;
    },
  );
}
