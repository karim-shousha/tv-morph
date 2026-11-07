import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/services/app_state.dart';
import 'package:morph_remote/providers/tv_models.dart';
import 'package:morph_remote/providers/androidtv/android_tv_protocol.dart';
void main(){
 TestWidgetsFlutterBinding.ensureInitialized();
 test('remote pairing leaves the television system keyboard available', () {
  final features=AndroidTvProtocol.defaultFeatures;
  expect(features & 4,0);
  expect(features & 2,2);
  final frame=AndroidTvProtocol.remoteConfigureReply(features);
  final messages=AndroidTvProtocol.takeFrames(frame.toList());
  final configure=AndroidTvProtocol.bytesFields(messages.single,1).single;
  expect(AndroidTvProtocol.varintFields(configure,1).single & 4,0);
 });
 test('configure and active replies strip remote IME even from legacy feature masks', () {
  for(final frame in [AndroidTvProtocol.remoteConfigureReply(0xFFFF),AndroidTvProtocol.remoteSetActive(0xFFFF)]) {
   final message=AndroidTvProtocol.takeFrames(frame.toList()).single;
   final field=AndroidTvProtocol.bytesFields(message,1).firstOrNull ?? AndroidTvProtocol.bytesFields(message,2).single;
   final features=AndroidTvProtocol.varintFields(field,1).single;
   expect(features & 4,0);expect(features & 2,2);
  }
 });
 const channel=MethodChannel('morph_tv/host');
 test('Android keyboard uses the saved Morph receiver link and preserves Arabic',() async {
  final app=AppState();app.selected=const TvDevice(id:'qa',name:'TV',brand:TvBrand.androidTv,protocol:TvProtocol.androidTvRemote,ip:'192.0.2.5',port:6466);
  MethodCall? received;
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel,(call)async{received=call;return true;});
  expect(await app.sendText('بحث Morph'),isTrue);expect(received!.method,'morphText');expect(received!.arguments,{'ip':'192.0.2.5','text':'بحث Morph'});
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel,(call)async=>false);
  expect(await app.sendText('test'),isFalse);expect(await app.sendText(''),isFalse);expect(await app.sendText('x'*501),isFalse);
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(channel,null);
  expect(await app.sendText('test'),isFalse);
 });
}
