import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app/app.dart';
import 'services/app_state.dart';
import 'worship/faith_app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    final host = await const MethodChannel(
      'morph_tv/host',
    ).invokeMapMethod<String, dynamic>('settings');
    if (host?['section'] == 'worship') {
      runApp(
        MorphFaithApp(
          dark: true,
          destination: host?['destination'] as String?,
          navEnglish: host?['locale'] == 'en',
        ),
      );
      return;
    }
  } on MissingPluginException {}
  final state = AppState();
  await state.init();
  var embedded = false;
  try {
    final host = await const MethodChannel(
      'morph_tv/host',
    ).invokeMapMethod<String, dynamic>('settings');
    if (host != null) {
      embedded = true;
      state.themeMode = 'dark';
      state.localeCode = host['locale'] == 'ar' ? 'ar' : 'en';
    }
  } on MissingPluginException {
    /* Standalone tests and previews. */
  }
  runApp(MorphApp(state: state, initialRoute: embedded ? '/remote' : '/'));
  if (embedded && state.lastTv != null)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      state.autoReconnect();
    });
}
