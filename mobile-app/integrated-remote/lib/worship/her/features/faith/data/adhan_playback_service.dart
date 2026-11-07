import 'dart:async';
import '../../../../native_bridge.dart';
import '../../../core/services/her_audio_service.dart' show AdhanStartReport;

class AdhanPlaybackService {
  static final instance = AdhanPlaybackService();
  bool _playing = false, userStopped = false;
  Future<void> Function()? onFinished;
  final _changes = StreamController<bool>.broadcast();
  Timer? _timer;
  Stream<bool> get playingStream => _changes.stream;
  bool get isPlaying => _playing;
  AdhanStartReport? handlerReportForTest() => null;
  Future<bool> playFullAdhan({String voiceId = 'beautiful-cc0'}) async {
    try {
      userStopped = false;
      await MorphFaithNative.call('preview', {
        'voice': MorphFaithNative.voice(voiceId),
      });
      _playing = false;
      for (var attempt = 0; attempt < 20 && !_playing; attempt++) {
        await Future<void>.delayed(const Duration(milliseconds: 100));
        _playing = (await MorphFaithNative.call('info'))['playing'] == true;
      }
      _changes.add(_playing);
      _timer?.cancel();
      if (_playing)
        _timer = Timer.periodic(const Duration(seconds: 1), (_) async {
          final active =
              (await MorphFaithNative.call('info'))['playing'] == true;
          if (!active) {
            _timer?.cancel();
            _playing = false;
            _changes.add(false);
            await onFinished?.call();
          }
        });
      return _playing;
    } catch (_) {
      return false;
    }
  }

  Future<void> stop() async {
    userStopped = true;
    _timer?.cancel();
    await MorphFaithNative.call('stop');
    _playing = false;
    _changes.add(false);
  }
}
