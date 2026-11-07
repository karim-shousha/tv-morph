import 'package:flutter/services.dart';
import 'her/features/faith/data/faith_repository.dart';
class MorphFaithNative {
 static const channel=MethodChannel('morph_tv/faith');
 static bool previewMode=false;
 static Map<String,dynamic> last={};
 static String voice(String id)=>id=='beautiful-cc0'?'egypt':id=='qatar'?'Qatar':id;
 static Future<Map<String,dynamic>> call(String operation,[Map<String,dynamic> payload=const{}])async{if(previewMode)return {'notifications':false,'exactAlarms':false,'voicePackInstalled':false,'playing':false};final value=await channel.invokeMapMethod<String,dynamic>('prayer',{'operation':operation,...payload});last=value??{};return last;}
 static Future<void> sync(FaithSettings s)async{
  if(!s.locationConfigured)return;
  await call('save',{'settings':{'latitude':s.latitude,'longitude':s.longitude,'timezone':s.timezone,'city':s.city,'method':s.calculationMethod,'hanafi':s.hanafi,'voice':voice(s.adhanVoice),'adjustments':s.adjustments,'enabled':s.prayerNotifications&&!s.notificationOnly,'reminders':s.prayerNotifications,'enabledPrayers':s.enabledPrayers,'adhanPrayers':s.adhanPrayers,'notificationOffset':s.notificationOffset}});
 }
 static Future<void> close([String? page])async{if(previewMode)return;await channel.invokeMethod('close',{'page':page});}
}
