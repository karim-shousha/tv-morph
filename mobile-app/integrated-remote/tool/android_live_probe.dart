import 'dart:io';
import 'dart:convert';
import 'package:morph_remote/providers/androidtv/android_tv_provider.dart';
import 'package:morph_remote/providers/tv_models.dart';
Future<void> main() async {
 const device=TvDevice(id:'physical-qa',name:'Hisense TV',brand:TvBrand.androidTv,protocol:TvProtocol.androidTvRemote,ip:'10.0.0.137',port:6466);
 final file=File('../../.tools/tizen/private/android-live-probe.json');
 final provider=AndroidTvProvider(device,savedToken:await file.exists()?await file.readAsString():null);
 final lines=stdin.transform(utf8.decoder).transform(const LineSplitter()).asBroadcastStream();
 if(!await file.exists() || Platform.environment['MORPH_PAIR_FORCE']=='1'){
  final start=await provider.pair();print('PAIRING: '+start.state.name);
  final code=await lines.first;
  final result=await provider.pair(pin:code.trim());
  if(!result.success){print('PAIR_FAILED '+result.state.name);await provider.disconnect();exitCode=1;return;}
  await file.writeAsString(result.clientKey!);
 }
 await provider.connect();await Future<void>.delayed(const Duration(seconds:2));print(jsonEncode(provider.diagnostics));
 print('READY: enter input/menu/youtube/text/exit');
 await for(final command in lines){
  if(command=='exit')break;
  if(command=='input')await provider.sendKey(TvKey.source);
  if(command=='input-press')await provider.sendKeyStroke(TvKey.source);
  if(command=='menu-press')await provider.sendKeyStroke(TvKey.menu);
  if(command=='menu')await provider.sendKey(TvKey.menu);
  if(command=='youtube')await provider.launchApp('youtube');
  if(command.startsWith('app:'))await provider.launchApp(command.substring(4));
  if(command=='text')await provider.sendText('Morph test');
  await Future<void>.delayed(const Duration(milliseconds:700));print(jsonEncode(provider.diagnostics));
 }
 await provider.disconnect();
}
