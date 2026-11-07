import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/app/app.dart';
import 'package:morph_remote/features/discovery/discovery_screen.dart';
import 'package:morph_remote/services/app_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'test_helpers.dart';

void main() {
  testWidgets('Welcome shows headline + Find My TV', (t) async {
    mockConnectivity();
    SharedPreferences.setMockInitialValues({});
    final state = AppState();
    await state.init();
    await t.pumpWidget(MorphApp(state: state));
    await t.pump();
    expect(find.text('Your TV. One Remote.'), findsOneWidget);
    expect(find.text('Find My TV'), findsOneWidget);
    expect(find.text('Samsung  •  LG  •  Android TV'), findsOneWidget);
  });

  testWidgets('Navigates to discovery', (t) async {
    mockConnectivity();
    DiscoveryScreen.disableAutoScan = true;
    SharedPreferences.setMockInitialValues({});
    final state = AppState();
    await state.init();
    await t.pumpWidget(MorphApp(state: state));
    await t.pump();
    await t.tap(find.text('Find My TV'));
    await t.pump(); // push route
    await t.pump(const Duration(milliseconds: 500));
    expect(find.byType(DiscoveryScreen), findsOneWidget);
    expect(find.text('Find Your TV'), findsOneWidget);
    expect(t.takeException(), isNull);
  });
}
