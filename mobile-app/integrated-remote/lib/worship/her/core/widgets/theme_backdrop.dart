import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/her_theme_data.dart';
import '../theme/app_decorations.dart';

/// Clips the filter to the existing surface without changing its layout.
/// Missing/zero blur preserves the original widget tree for legacy themes.
class ThemeBackdrop extends StatelessWidget {
  const ThemeBackdrop({
    super.key,
    required this.blur,
    required this.child,
    this.radius,
  });
  final double blur;
  final Widget child;
  final double? radius;

  @override
  Widget build(BuildContext context) => blur <= 0
      ? child
      : ClipRRect(
          borderRadius: BorderRadius.circular(radius ?? 0),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
            child: child,
          ),
        );
}

/// Adapts decoration-only surfaces to the shared optional glass recipe.
class ThemeRoleBackdrop extends StatelessWidget {
  const ThemeRoleBackdrop({
    super.key,
    required this.role,
    required this.child,
    this.radius = 22,
    this.useThemeDecoration = false,
  });
  final String role;
  final bool useThemeDecoration;
  final Widget child;
  final double radius;
  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    final blur = theme.palette.componentStyle(role).backdropBlur;
    Widget surface = child;
    // Explicit adaptation of legacy flat surfaces. Geometry, children and
    // hit targets remain untouched; missing tokens retain the original tree.
    if (useThemeDecoration && child is Container) {
      final original = child as Container;
      final oldDecoration = original.decoration;
      final recipe = AppDecorations.componentCardFor(
        theme,
        role,
        radius: radius,
      );
      final decoration = oldDecoration is BoxDecoration
          ? BoxDecoration(
              gradient: recipe.gradient,
              border: recipe.border,
              borderRadius: oldDecoration.borderRadius,
              shape: oldDecoration.shape,
              boxShadow: recipe.boxShadow,
              image: oldDecoration.image,
            )
          : recipe;
      surface = Container(
        alignment: original.alignment,
        padding: original.padding,
        decoration: decoration,
        foregroundDecoration: original.foregroundDecoration,
        constraints: original.constraints,
        margin: original.margin,
        transform: original.transform,
        transformAlignment: original.transformAlignment,
        clipBehavior: original.clipBehavior,
        child: original.child,
      );
    }
    return ThemeBackdrop(blur: blur ?? 0, radius: radius, child: surface);
  }
}
