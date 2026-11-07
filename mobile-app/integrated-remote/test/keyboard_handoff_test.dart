import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:morph_remote/core/localization/app_localizations.dart';
import 'package:morph_remote/features/remote/remote_screen.dart';
import 'package:morph_remote/providers/mock_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';
import 'package:morph_remote/providers/androidtv/android_tv_provider.dart';
import 'package:morph_remote/services/app_state.dart';
import 'test_helpers.dart';

void main() {
  const channel = MethodChannel('morph_tv/host');
  for (final protocol in [TvProtocol.androidTvRemote, TvProtocol.samsungTizenWs, TvProtocol.lgWebOs]) {
    testWidgets('$protocol opens the original host keyboard without a replacement text dialog', (tester) async {
      mockConnectivity(); SharedPreferences.setMockInitialValues({});
      final state = AppState(); await state.init();
      final device = TvDevice(id:'keyboard',name:'Test TV',brand:TvBrand.androidTv,protocol:protocol,ip:'192.0.2.5',port:6466);
      state.selected = device; state.provider = MockTvProvider(device); state.connStatus = ConnectionStatus.connected;
      MethodCall? request;
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel,(call) async {request=call;return true;});
      addTearDown(() {state.dispose();TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel,null);});
      await tester.pumpWidget(ChangeNotifierProvider<AppState>.value(value:state,child:MorphLocalizations(strings:const MorphStrings(Locale('en')),child:const MaterialApp(home:RemoteScreen()))));
      await tester.pumpAndSettle();
      if(find.byTooltip('More controls').evaluate().isNotEmpty){await tester.ensureVisible(find.byTooltip('More controls')); await tester.tap(find.byTooltip('More controls')); await tester.pumpAndSettle();}
      final keyboard = find.byIcon(Icons.keyboard_outlined);
      await tester.ensureVisible(keyboard); await tester.tap(keyboard); await tester.pumpAndSettle();
      expect(request?.method,'classicKeyboard'); expect(request?.arguments,{'ip':'192.0.2.5'});
      expect(find.byType(TextField),findsNothing); expect(tester.takeException(),isNull);
    });
  }
  test('Android remote provider never injects Remote IME text', () async {
    final provider=AndroidTvProvider(const TvDevice(id:'test',name:'TV',brand:TvBrand.androidTv,protocol:TvProtocol.androidTvRemote,ip:'192.0.2.5',port:6466));
    expect(await provider.sendText('Search'),false);await provider.disconnect();
  });
}
