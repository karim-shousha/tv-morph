import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/core/localization/app_localizations.dart';
import 'package:morph_remote/features/remote/remote_screen.dart';
import 'package:morph_remote/providers/mock_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';
import 'package:morph_remote/services/app_state.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'test_helpers.dart';

void main() {
  group('Remote layout: search visible, no overflow on small phones', () {
    testWidgets('360x640 remote shows SEARCH in frame', (t) async {
      mockConnectivity();
      SharedPreferences.setMockInitialValues({});
      testerView(t, const Size(360, 640));
      final state = AppState();
      await state.init();
      final d = TvDevice(
        id: 't',
        name: 'Samsung TV',
        brand: TvBrand.samsung,
        protocol: TvProtocol.samsungTizenWs,
        ip: '10.0.0.5',
        port: 8001,
      );
      state.selected = d;
      state.provider = MockTvProvider(d);
      state.connStatus = ConnectionStatus.connected;
      addTearDown(() {
        state.dispose();
        resetTesterView(t);
      });
      await t.pumpWidget(
        ChangeNotifierProvider<AppState>.value(
          value: state,
          child: MorphLocalizations(
            strings: const MorphStrings(Locale('en')),
            child: const Directionality(
              textDirection: TextDirection.ltr,
              child: MaterialApp(home: RemoteScreen()),
            ),
          ),
        ),
      );
      await t.pump();
      expect(find.text('SEARCH'), findsOneWidget);
      expect(find.byIcon(Icons.search_rounded), findsOneWidget);
      expect(t.takeException(), isNull);
      await t.ensureVisible(find.text('Netflix'));
      await t.pumpAndSettle();
      expect(find.text('Netflix').hitTestable(), findsOneWidget);
      await t.ensureVisible(find.text('SEARCH'));
      await t.pumpAndSettle();
      final searchRect = t.getRect(find.text('SEARCH'));
      expect(searchRect.bottom, lessThanOrEqualTo(640));
      await t.pump();
      expect(t.takeException(), isNull);
    });
  });
}

void testerView(WidgetTester t, Size logical) {
  t.view.physicalSize = Size(logical.width * 3, logical.height * 3);
  t.view.devicePixelRatio = 3.0;
}

void resetTesterView(WidgetTester t) {
  t.view.resetPhysicalSize();
  t.view.resetDevicePixelRatio();
}
