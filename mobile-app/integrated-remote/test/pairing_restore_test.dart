import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:morph_remote/core/localization/app_localizations.dart';
import 'package:morph_remote/features/pairing/pairing_screen.dart';
import 'package:morph_remote/providers/mock_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';
import 'package:morph_remote/providers/tv_provider.dart';
import 'package:morph_remote/services/app_state.dart';
import 'test_helpers.dart';
const tv=TvDevice(id:'saved-tv',name:'Test Android TV',brand:TvBrand.androidTv,protocol:TvProtocol.androidTvRemote,ip:'192.0.2.1',port:6466);
class HeldProvider extends MockTvProvider {
 HeldProvider():super(tv);
 Completer<void>? connecting;
 final pinSubmission=Completer<PairingResult>();
 int connects=0,pairs=0;
 @override Future<void> connect()async{connects++;if(connecting!=null)await connecting!.future;await super.connect();}
 @override Future<PairingResult> pair({String? pin}){pairs++;return pin==null?Future.value(const PairingResult(false,PairingState.enteringPin)):pinSubmission.future;}
}
class StateFixture extends AppState {
 final fake=HeldProvider();
 @override TvProvider buildProvider(TvDevice d,{String? secret})=>fake;
}
void main(){
 testWidgets('PIN glass card retains its size during keyboard and handshake changes',(t)async{
  mockConnectivity();SharedPreferences.setMockInitialValues({});
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(const MethodChannel("plugins.it_nomads.com/flutter_secure_storage"),(call)async=>null);
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(const MethodChannel("dev.fluttercommunity.plus/connectivity_status"),(call)async=>null);
  t.view.physicalSize=const Size(390,844);t.view.devicePixelRatio=1;
  final state=StateFixture();await state.init();
  addTearDown((){state.dispose();t.view.resetPhysicalSize();t.view.resetDevicePixelRatio();t.view.resetViewInsets();});
  await t.pumpWidget(ChangeNotifierProvider<AppState>.value(value:state,child:MorphLocalizations(strings:const MorphStrings(Locale('en')),child:MaterialApp(home:Builder(builder:(context)=>TextButton(onPressed:()=>Navigator.of(context).push(MaterialPageRoute(settings:const RouteSettings(arguments:tv),builder:(_)=>const PairingScreen())),child:const Text('Pair fixture')))))));
  await t.tap(find.text('Pair fixture'));await t.pump();await t.runAsync(()=>Future<void>.delayed(const Duration(milliseconds:50)));await t.pumpAndSettle();
  expect(find.byType(PairingScreen),findsOneWidget);
  final card=find.byKey(const ValueKey('pairing-glass-card'));
  expect(card,findsOneWidget);
  final original=t.getSize(card);
  await t.enterText(find.byKey(const ValueKey('pairing-code-input')),'ABC123');
  t.view.viewInsets=const FakeViewPadding(bottom:280);await t.pumpAndSettle();
  expect(t.getSize(card),original);expect(t.takeException(),isNull);
  await t.testTextInput.receiveAction(TextInputAction.done);await t.pump();
  expect(find.byKey(const ValueKey('pairing-code-input')),findsOneWidget);
  expect(t.getSize(card),original);
  state.fake.pinSubmission.complete(const PairingResult(false,PairingState.enteringPin));await t.pumpAndSettle();
  expect(t.getSize(card),original);expect(t.takeException(),isNull);
  await t.pumpWidget(const SizedBox());
 });
 test('Saved TV reconnect is deduplicated, persisted and never pairs again',()async{
  mockConnectivity();SharedPreferences.setMockInitialValues({});
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(const MethodChannel("plugins.it_nomads.com/flutter_secure_storage"),(call)async=>null);
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(const MethodChannel("dev.fluttercommunity.plus/connectivity_status"),(call)async=>null);
  final state=StateFixture();await state.init();state.selected=tv;state.saved=[tv];state.fake.connecting=Completer<void>();
  final a=state.autoReconnect(),b=state.autoReconnect();expect(identical(a,b),isTrue);
  state.fake.connecting!.complete();await a;
  expect(await a,isTrue);expect(state.fake.connects,1);expect(state.fake.pairs,0);
  final restored=StateFixture();await restored.init();expect(restored.lastTv?.id,tv.id);expect(restored.selected?.id,tv.id);
  state.dispose();restored.dispose();
 });
}
