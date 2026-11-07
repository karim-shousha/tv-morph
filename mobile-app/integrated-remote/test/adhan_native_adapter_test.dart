import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/worship/native_bridge.dart';
import 'package:morph_remote/worship/her/features/faith/data/adhan_playback_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const channel = MethodChannel('morph_tv/faith');
  final messenger = TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;

  tearDown(() async {
    await AdhanPlaybackService.instance.stop();
    messenger.setMockMethodCallHandler(channel, null);
  });

  test('Adhan waits for actual native playback and maps the bundled voice', () async {
    var polls = 0;
    String? voice;
    messenger.setMockMethodCallHandler(channel, (call) async {
      final args = Map<String, dynamic>.from(call.arguments as Map);
      if (args['operation'] == 'preview') voice = args['voice'] as String?;
      if (args['operation'] == 'info') return {'playing': ++polls >= 3};
      return <String, dynamic>{};
    });
    expect(await AdhanPlaybackService.instance.playFullAdhan(), isTrue);
    expect(voice, MorphFaithNative.voice('beautiful-cc0'));
    expect(voice, 'egypt');
    expect(polls, 3);
  });

  test('A successful command without audio is not reported as playback', () async {
    messenger.setMockMethodCallHandler(channel, (_) async => {'playing': false});
    expect(await AdhanPlaybackService.instance.playFullAdhan(), isFalse);
    expect(AdhanPlaybackService.instance.isPlaying, isFalse);
  });
}
