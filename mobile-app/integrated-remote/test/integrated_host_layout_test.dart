import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/app/app.dart';
import 'package:morph_remote/features/onboarding/welcome_screen.dart';
import 'package:morph_remote/providers/mock_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';
import 'package:morph_remote/services/app_state.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'test_helpers.dart';

void main() {
  for (final size in [const Size(320, 640), const Size(390, 844)]) {
    for (final language in ['en', 'ar']) {
      testWidgets('Embedded remote with host header fits $size $language', (
        t,
      ) async {
        mockConnectivity();
        SharedPreferences.setMockInitialValues({});
        t.view.physicalSize = size;
        t.view.devicePixelRatio = 1;
        final state = AppState();
        await state.init();
        final device = TvDevice(
          id: 'test',
          name: 'Test TV',
          brand: TvBrand.samsung,
          protocol: TvProtocol.samsungTizenWs,
          ip: '10.0.0.5',
          port: 8001,
        );
        state.selected = device;
        state.provider = MockTvProvider(device);
        state.connStatus = ConnectionStatus.connected;
        state.localeCode = language;
        state.themeMode = 'dark';
        addTearDown(() {
          state.dispose();
          t.view.resetPhysicalSize();
          t.view.resetDevicePixelRatio();
        });
        await t.pumpWidget(MorphApp(state: state));
        await t.pump(const Duration(milliseconds: 200));
        Navigator.of(
          t.element(find.byType(WelcomeScreen)),
        ).pushReplacementNamed('/remote');
        await t.pump();
        await t.pump(const Duration(seconds: 1));
        expect(t.takeException(), isNull);
        expect(find.byKey(const ValueKey('host-back-button')), findsOneWidget);
          expect(find.byIcon(Icons.mic_none_rounded),findsNothing);expect(find.byIcon(Icons.tune_rounded),findsNothing);
        expect(
          t.getSize(find.byKey(const ValueKey('remote-connected-card'))).height,
          lessThan(110),
        );
        expect(
          find.text(language == 'ar' ? 'متصل بالتلفزيون' : 'Connected'),
          findsOneWidget,
        );
        final input = find.text(language == 'ar' ? 'المداخل' : 'INPUT'),
            menu = find.text(language == 'ar' ? 'القائمة' : 'MENU');
        final keyboard = find.text(language == 'ar' ? 'الكيبورد' : 'KEYBOARD'),
            numbers = find.text(language == 'ar' ? 'الأرقام' : 'NUMBER PAD');
        expect(t.getCenter(input).dy, closeTo(t.getCenter(menu).dy, 1));
        expect(t.getCenter(keyboard).dy, closeTo(t.getCenter(numbers).dy, 1));
        expect(t.getRect(keyboard).top, greaterThan(t.getRect(input).bottom));
        expect(
          t.getCenter(find.byKey(const ValueKey('host-remote-power'))).dy,
          closeTo(
            t.getCenter(find.byKey(const ValueKey('host-back-button'))).dy,
            3,
          ),
        );
        expect(
          t.getCenter(find.byKey(const ValueKey('host-remote-settings'))).dy,
          closeTo(
            t.getCenter(find.byKey(const ValueKey('host-back-button'))).dy,
            3,
          ),
        );

        final anchor = find.byKey(const ValueKey('remote-connected-card'));
        final beforeDrag = t.getTopLeft(anchor);
        await t.drag(find.text(language == 'ar' ? 'بحث' : 'SEARCH'), const Offset(0, -180));
        await t.pumpAndSettle();
        expect(t.getTopLeft(anchor), beforeDrag, reason: 'Remote controls must remain fixed when dragging');
        final powerIcon = t.widget<Icon>(find.descendant(of: find.byKey(const ValueKey('host-remote-power')), matching: find.byIcon(Icons.power_settings_new_rounded)));
        expect(powerIcon.color, const Color(0xFFFF5555));
        final search = find.text(language == 'ar' ? 'بحث' : 'SEARCH');
        expect(search, findsOneWidget);
        expect(t.getRect(search).bottom, lessThan(size.height));
        await t.ensureVisible(find.text('Netflix'));
        await t.pumpAndSettle();
        expect(find.text('Netflix').hitTestable(), findsOneWidget);
      });
    }
  }
}
