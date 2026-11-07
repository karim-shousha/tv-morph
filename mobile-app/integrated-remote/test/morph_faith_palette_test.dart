import 'package:morph_remote/worship/her/core/theme/her_modern_accents.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:morph_remote/worship/faith_app.dart';
import 'package:morph_remote/worship/her/core/theme/her_theme_data.dart';

void main() {
  for (final dark in [true]) {
    test('Morph ${dark?'dark':'light'} removes inherited pink and keeps contrast', () {
      final palette=morphFaithPalette(dark);
      void audit(dynamic node,String path) {
        if(node is Map) {node.forEach((k,v)=>audit(v,'$path.$k'));return;}
        if(node is List) {for(var i=0;i<node.length;i++){audit(node[i],'$path.$i');}return;}
        if(node is! String||!RegExp(r'^#[0-9a-fA-F]{6,8}$').hasMatch(node))return;
        final hex=node.substring(1);
        final color=Color(int.parse(hex.length==6?'ff$hex':hex,radix:16));
        final hsv=HSVColor.fromColor(color);
        if(!RegExp('danger|error|negative',caseSensitive:false).hasMatch(path))expect(hsv.saturation>.015&&hsv.hue>=285, false,reason:'Inherited pink at $path: $node');
      }
      audit(palette.toJson(),'palette');
      final theme=HerThemeData.fromPalette(palette);
      expect(herContrastRatio(theme.text.primary,theme.surfaces.background),greaterThanOrEqualTo(4.5));
      expect(herContrastRatio(theme.text.secondary,theme.surfaces.surface),greaterThanOrEqualTo(4.5));
      expect(herContrastRatio(theme.buttonStyles.primary.foreground,theme.actions.primary),greaterThanOrEqualTo(4.5));
      expect(theme.switchStyle.trackSelected,palette.primary);
      expect(theme.modernAccents.lavender.accentColor,palette.primary);
      expect(theme.modernAccents.mint.accentColor,palette.primary);
      if(dark)expect(palette.componentStyle('secondaryCard').gradientStart.a,lessThan(1));
    });
  }
}
