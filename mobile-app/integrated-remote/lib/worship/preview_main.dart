import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'faith_app.dart';
import 'native_bridge.dart';
import 'her/features/faith/data/faith_repository.dart';

SemanticsHandle? previewSemantics;

Future<void> main() async {
 WidgetsFlutterBinding.ensureInitialized();previewSemantics=SemanticsBinding.instance.ensureSemantics();MorphFaithNative.previewMode=true;
 final repository=FaithRepository.instance;
 final prefs=await SharedPreferences.getInstance();
 if(!prefs.containsKey('morph_faith_preview_v1')){
  await repository.saveSettings(FaithSettings.defaults().copyWith(automaticLocation:false,locationConfigured:true,latitude:45.5019,longitude:-73.5674,city:'مونتريال',timezone:'America/Toronto',calculationMethod:'moonsighting',prayerNotifications:false));
  await repository.saveFaithAccessChoice(true);await repository.markPrayerNotificationPromptAnswered();await prefs.setBool('morph_faith_preview_v1',true);
 }
 runApp(MorphFaithApp(dark:Uri.base.queryParameters['theme']=='dark',navEnglish:Uri.base.queryParameters['lang']=='en'));
}
