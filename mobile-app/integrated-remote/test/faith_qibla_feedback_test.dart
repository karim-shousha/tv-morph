import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:morph_remote/worship/faith_app.dart';
import 'package:morph_remote/worship/her/core/theme/her_theme_data.dart';
import 'package:morph_remote/worship/her/core/services/device_feedback_service.dart';
import 'package:morph_remote/worship/her/features/faith/data/faith_repository.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/qibla/qibla_screen.dart';
import 'package:morph_remote/worship/her/core/widgets/app_page_header.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test('Feedback forwards one native request and preserves duration', () async {
    final calls = <MethodCall>[];
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('her/device_feedback'), (call) async { calls.add(call); return null; });
    await DeviceFeedbackService.instance.vibrate(durationMs: 82);
    await DeviceFeedbackService.instance.tapSound();
    expect(calls.map((c) => c.method), ['vibrate', 'tapSound']);
    expect(calls.first.arguments['durationMs'], 82);
  });
  for (final width in [320.0, 430.0]) {
    testWidgets('Qibla fits narrow screen and large Arabic text at $width', (tester) async {
      GoogleFonts.config.allowRuntimeFetching = false;
      tester.view.physicalSize = Size(width, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(MaterialApp(
        theme: ThemeData(extensions: [HerThemeData.fromPalette(morphFaithPalette(false))]),
        builder: (context, child) => MediaQuery(data: MediaQuery.of(context).copyWith(textScaler: const TextScaler.linear(1.3)), child: child!),
        home: QiblaScreen(settings: FaithSettings.defaults()),
      ));
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('وجّه وجهك شطر المسجد الحرام'), findsNothing);
      expect(tester.getCenter(find.byType(HerHeaderLogo)).dx, closeTo(68 + PhoneDesignTokens.logoWidth / 2, 4));
      final needle = tester.widget<Icon>(find.byIcon(Icons.navigation_rounded));
      expect(needle.color, morphFaithPalette(false).primary);
      final dial = find.byWidgetPredicate((w) => w is CustomPaint && w.painter.runtimeType.toString() == '_QiblaDialPainter');
      expect(tester.getSize(dial).width, greaterThan(200));
      for (final element in find.byType(Text).evaluate()) {
        final box = element.renderObject as RenderBox;
        final rect = box.localToGlobal(Offset.zero) & box.size;
        expect(rect.left, greaterThanOrEqualTo(0));
        expect(rect.right, lessThanOrEqualTo(width));
      }
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
    });
  }
}
