import 'package:morph_remote/worship/her/features/faith/presentation/widgets/phone_reading_card.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/widgets/quran_reading_screen.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/ayah/ayah_screen.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/quran_companion_screen.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/prayer/prayer_history_screen.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/tafsir_reader_screen.dart';
import 'package:morph_remote/worship/her/core/widgets/her_components.dart';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest.dart' as zones;
import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'package:morph_remote/worship/faith_app.dart';
import 'package:morph_remote/worship/native_bridge.dart';
import 'package:morph_remote/worship/her/core/theme/her_material_theme.dart';
import 'package:morph_remote/worship/her/core/theme/her_theme_data.dart';
import 'package:morph_remote/worship/her/core/widgets/app_page_header.dart';
import 'package:morph_remote/worship/her/features/faith/data/faith_repository.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/prayer_dashboard_screen.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/quran_reader_screen.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/dhikr/dhikr_library_screen.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/dua/dua_library_screen.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/tasbih/tasbih_screen.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/qibla/qibla_screen.dart';
import 'package:morph_remote/worship/her/features/faith/presentation/settings/prayer_settings_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(() async {
    GoogleFonts.config.allowRuntimeFetching = false;
    MorphFaithNative.previewMode = true;
    zones.initializeTimeZones();
    final messenger =
        TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
    for (final name in [
      'xyz.luan/audioplayers.global',
      'xyz.luan/audioplayers.global/events',
      'hemanthraj/flutter_compass',
    ]) {
      messenger.setMockMethodCallHandler(
        MethodChannel(name),
        (_) async => null,
      );
    }
    messenger.setMockMethodCallHandler(
      const MethodChannel('xyz.luan/audioplayers'),
      (call) async {
        final args = call.arguments;
        if (call.method == 'create' && args is Map)
          messenger.setMockMethodCallHandler(
            MethodChannel('xyz.luan/audioplayers/events/${args['playerId']}'),
            (_) async => null,
          );
        return null;
      },
    );
    for (final entry in {
      'MorphSans': 'assets/fonts/morph-sans-400.ttf',
      'MaterialIcons':
          'C:/flutter/src/Flutter/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf',
    }.entries) {
      final font = FontLoader(entry.key);
      font.addFont(
        Future.value(
          ByteData.sublistView(await File(entry.value).readAsBytes()),
        ),
      );
      await font.load();
    }
  });
  final screens = <String, Widget Function()>{
    'reading':()=>const QuranReadingScreen(surah:1),
    'ayah':()=>const AyahScreen(),
    'quran-companion':()=>QuranCompanionScreen(onOpenQuran:(){},onAchievement:(_)async{}),
    'prayer-history':()=>const PrayerHistoryScreen(),
    'tafsir':()=>const TafsirReaderScreen(book:TafsirBook(id:1,title:'التفسير',source:'المصدر',kind:HerIconKind.knowledge)),

    'worship': () =>
        PrayerDashboardScreen(onBack: () {}, onAchievement: (_) async {}),
    'quran': () => const QuranReaderScreen(),
    'adhkar': () => DhikrLibraryScreen(onAchievement: (_) async {}),
    'duas': () => const DuaLibraryScreen(),
    'tasbih': () => TasbihScreen(onAchievement: (_) async {}),
    'qibla': () => QiblaScreen(settings: FaithSettings.defaults()),
    'prayer-settings': () => PrayerSettingsScreen(
      settings: FaithSettings.defaults(),
      onSaved: (_) async {},
      onUseLocation: () async {},
    ),
  };
  for (final dark in [true])
    for (final screen in screens.entries) {
      testWidgets(
        'Shared phone ${dark ? 'dark' : 'light'} surface: ${screen.key}',
        (tester) async {
          SharedPreferences.setMockInitialValues({});
          tester.view.devicePixelRatio = 1;
          tester.view.physicalSize = const Size(390, 844);
          addTearDown(tester.view.resetPhysicalSize);
          addTearDown(tester.view.resetDevicePixelRatio);
          HerThemeEngine.update(morphFaithPalette(dark));
          final theme = HerThemeEngine.current;
          final boundary = GlobalKey();
          await tester.pumpWidget(
            RepaintBoundary(
              key: boundary,
              child: MaterialApp(
                debugShowCheckedModeBanner: false,
                theme: buildHerMaterialTheme(theme),
                builder: (_, child) => HerRouteSurface(child: child!),
                home: Scaffold(
                  backgroundColor: Colors.transparent,
                  body: screen.value(),
                ),
              ),
            ),
          );
          for (var i = 0; i < 5; i++) {
            await tester.runAsync(
              () => Future<void>.delayed(const Duration(milliseconds: 100)),
            );
            await tester.pump(const Duration(milliseconds: 200));
          }
          await tester.runAsync(
            () => precacheImage(
              const AssetImage('assets/images/morph-header.webp'),
              tester.element(find.byType(AppPageHeader)),
            ),
          );
          await tester.pump();
          expect(tester.takeException(), isNull);
          expect(find.byType(AppPageHeader), findsOneWidget);
          expect(
            tester.getSize(find.byType(AppPageHeader)).height,
            PhoneDesignTokens.headerHeight,
          );
          expect(
            tester.getSize(find.byType(HerHeaderLogo)),
            const Size(
              PhoneDesignTokens.logoWidth,
              PhoneDesignTokens.logoHeight,
            ),
          );
          expect(
            tester.getCenter(find.byType(HerHeaderLogo)).dx,
            closeTo(68 + PhoneDesignTokens.logoWidth / 2, 4),
          );
          await tester.runAsync(() async {
            final node =
                boundary.currentContext!.findRenderObject()
                    as RenderRepaintBoundary;
            final image = await node.toImage(pixelRatio: 1);
            final bytes = await image.toByteData(
              format: ui.ImageByteFormat.png,
            );
            final file = File(
              '../../output/phone-system-${dark ? 'dark' : 'light'}-${screen.key}.png',
            );
            await file.writeAsBytes(bytes!.buffer.asUint8List());
          });
          if(screen.key=='duas'){
            final card=tester.widget<PhoneReadingCard>(find.byType(PhoneReadingCard).first);
            expect(find.text(card.reference),findsNothing);
            await tester.ensureVisible(find.text('المصدر').first);
            await tester.tap(find.text('المصدر').first);await tester.pump();
            expect(find.text(card.reference),findsOneWidget);
          }
          await tester.pumpWidget(const SizedBox());
          await tester.pump();
        },
      );
    }
}
