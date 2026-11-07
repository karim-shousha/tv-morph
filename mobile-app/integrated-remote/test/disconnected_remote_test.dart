import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/app/app.dart';
import 'package:morph_remote/services/app_state.dart';
import 'package:morph_remote/features/discovery/discovery_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'test_helpers.dart';
void main(){
 for(final mode in ['light','dark'])for(final language in ['en','ar']){
  testWidgets('Disconnected remote opens without a discovered TV: $mode $language',(t)async{
   mockConnectivity();SharedPreferences.setMockInitialValues({});DiscoveryScreen.disableAutoScan=true;
   final state=AppState();await state.init();state.themeMode=mode;state.localeCode=language;
   addTearDown((){state.dispose();DiscoveryScreen.disableAutoScan=false;t.view.resetPhysicalSize();t.view.resetDevicePixelRatio();});
   t.view.devicePixelRatio=1;t.view.physicalSize=const Size(390,844);
   await t.pumpWidget(MorphApp(state:state,initialRoute:'/remote'));await t.pump(const Duration(milliseconds:500));
   for(final width in [320.0,390.0,600.0]){t.view.physicalSize=Size(width,844);await t.pump(const Duration(milliseconds:200));expect(t.takeException(),isNull);expect(find.text(language=='ar'?'اختار تلفزيونك':'Choose your TV'),findsOneWidget);}
   expect(state.selected,isNull);expect(state.provider,isNull);expect(state.discovered,isEmpty);
   final play=t.widget<IconButton>(find.byKey(const ValueKey('playback-toggle')));expect(play.onPressed,isNull);
   await t.tap(find.byKey(const ValueKey('remote-connected-card')));await t.pump(const Duration(milliseconds:500));expect(state.visibleRoute,'/devices');
   await t.pumpWidget(const SizedBox());
  });
 }
}
