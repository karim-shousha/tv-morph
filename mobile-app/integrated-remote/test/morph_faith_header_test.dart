import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/worship/faith_app.dart';
import 'package:morph_remote/worship/her/core/theme/her_theme_data.dart';
import 'package:morph_remote/worship/her/core/widgets/app_page_header.dart';

void main() {
  for (final dark in [true]) {
    testWidgets('Prayer logo-only header in RTL, dark=$dark', (tester) async {
      var backed = false;
      await tester.pumpWidget(MaterialApp(
        theme: ThemeData(extensions: [HerThemeData.fromPalette(morphFaithPalette(dark))]),
        home: Directionality(textDirection: TextDirection.rtl, child: Scaffold(
          body: AppPageHeader(title: 'عباداتي', subtitle: 'ركنك الهادئ', logoOnly: true, onBack: () { backed = true; }),
        )),
      ));
      await tester.pumpAndSettle();
      expect(find.text('عباداتي'), findsNothing);
      expect(find.text('ركنك الهادئ'), findsNothing);
      expect(find.byType(HerHeaderLogo), findsOneWidget);
      expect(tester.getSize(find.byType(HerHeaderLogo)), const Size(PhoneDesignTokens.logoWidth,PhoneDesignTokens.logoHeight));
      expect(tester.getSize(find.byType(AppPageHeader)).height, PhoneDesignTokens.headerHeight);
      expect(tester.getCenter(find.byType(HerBackButton)).dx, lessThan(tester.getCenter(find.byType(HerHeaderLogo)).dx));
      await tester.tap(find.byType(HerBackButton));
      expect(backed, true);
      expect(tester.takeException(), isNull);
    });
  }
}
