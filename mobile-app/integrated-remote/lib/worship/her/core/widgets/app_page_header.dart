import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/her_theme_data.dart';
import '../theme/theme_palette.dart';
import 'theme_backdrop.dart';

/// Shared recipe for the dashboard and all inner-page headers.
BoxDecoration herHeaderDecoration(
  ThemePalette palette, {
  ImageProvider? image,
  double imageOpacity = .14,
}) {
  final style = palette.componentStyle('header');
  return BoxDecoration(
    gradient: LinearGradient(
      begin: themeGradientBegin(style.gradientDirection, Alignment.topCenter),
      end: themeGradientEnd(style.gradientDirection, Alignment.bottomCenter),
      colors: [
        style.gradientStart.withValues(alpha: style.opacity),
        style.gradientEnd.withValues(alpha: style.opacity),
      ],
    ),
    image: image == null
        ? null
        : DecorationImage(
            image: image,
            fit: BoxFit.cover,
            opacity: imageOpacity,
          ),
    border: Border(
      bottom: BorderSide(
        color: style.border.withValues(alpha: style.borderOpacity),
        width: style.borderWidth,
      ),
    ),
    boxShadow: style.shadowOpacity <= 0
        ? null
        : [
            BoxShadow(
              color: style.shadowColor.withValues(alpha: style.shadowOpacity),
              blurRadius: style.shadowBlur,
              offset: Offset(style.shadowOffsetX, style.shadowOffsetY),
            ),
          ],
  );
}

// Global header: single unified spec, frozen from "مكتبة HER" reference.
// Layout (RTL): back button on the left (شمال), title+subtitle centered,
// HER logo on the right (يمين). Every page — internal or external — uses
// this widget with its own title/subtitle (slogan preserved).
//
// Frozen measurements:
// - header height: 86
// - back button: 36x36 circle, icon 18
// - title: 15 / w800, single line, centered
// - subtitle: 10.5 / w600, max 2 lines, centered
// - logo: 76x46 top-right, opacity .82
// - horizontal padding: 20, top padding: 9

/// The single circular back affordance used by every page header.
class HerBackButton extends StatelessWidget {
  const HerBackButton({
    super.key,
    required this.onPressed,
    @Deprecated('Unified header: size is fixed 36/18, flag is ignored.')
    this.compact = true,
  });

  final VoidCallback onPressed;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    // Every theme uses the same dedicated Studio back-button controls.
    final sideColor = theme.palette.sideIconColor ?? theme.text.primary;
    final configuredBackground =
        theme.palette.sideIconBackgroundColor ?? Colors.transparent;
    final background = configuredBackground.a == 0
        ? sideColor.withValues(alpha: .12)
        : configuredBackground.withValues(alpha: .18);
    return Semantics(
      label: 'رجوع',
      button: true,
      child: Material(
        // The header back affordance has its own Control Center roles.  It is
        // deliberately separate from card-icon circles so changing a card icon
        // cannot recolour every page header.
        color: theme.palette.name.startsWith('Morph')
            ? Colors.transparent
            : background,
        shape: const CircleBorder(),
        child: InkWell(
          onTap: onPressed,
          customBorder: const CircleBorder(),
          child: SizedBox(
            width: PhoneDesignTokens.touchTarget,
            height: PhoneDesignTokens.touchTarget,
            child: Icon(
              Icons.arrow_back_ios_new_rounded,
              textDirection: TextDirection.ltr,
              size: 18,
              color: sideColor,
            ),
          ),
        ),
      ),
    );
  }
}

/// Renders compound page names such as `تجربتي | HER` consistently.
/// In RTL, the Arabic name remains on the right and the HER mark on the left.
class HerBrandedTitle extends StatelessWidget {
  const HerBrandedTitle({
    super.key,
    required this.title,
    required this.foreground,
    this.herForeground,
    this.herBackground,
    this.fontSize = 15,
    this.fontWeight = FontWeight.w800,
  });

  final String title;
  final Color foreground;
  final Color? herForeground;
  final Color? herBackground;
  final double fontSize;
  final FontWeight fontWeight;

  @override
  Widget build(BuildContext context) {
    // HER follows the lighter logo rose, deliberately independent from the
    // dark روشتة CTA gradient. Header title/subtitle each have their own
    // Theme Studio controls and never borrow page-card text colours.
    final herPink = herForeground ?? context.herTheme.palette.primary;
    final parts = title.split('|');
    if (parts.length != 2) {
      return Text(
        title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        textAlign: TextAlign.center,
        style: GoogleFonts.cairo(
          fontSize: fontSize,
          fontWeight: fontWeight,
          color: foreground,
        ),
      );
    }
    final arabic = parts.first.trim();
    final english = parts.last.trim();
    return FittedBox(
      fit: BoxFit.scaleDown,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        textDirection: TextDirection.rtl,
        children: [
          Text(
            arabic,
            style: GoogleFonts.cairo(
              fontSize: fontSize,
              fontWeight: fontWeight,
              color: foreground,
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Text(
              '|',
              style: TextStyle(
                fontSize: fontSize + 1,
                fontWeight: FontWeight.w800,
                color: foreground.withValues(alpha: .58),
              ),
            ),
          ),
          Container(
            padding: herBackground == null
                ? EdgeInsets.zero
                : const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
            decoration: herBackground == null
                ? null
                : BoxDecoration(
                    color: herBackground,
                    borderRadius: BorderRadius.circular(5),
                  ),
            child: Text(
              english,
              textDirection: TextDirection.ltr,
              style: GoogleFonts.cairo(
                fontSize: fontSize,
                fontWeight: FontWeight.w900,
                color: herPink,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// The logo source is owned by the Control Center. When a logo URL is set
/// there, every page header uses it; otherwise the bundled Roshetta mark is
/// used as a reliable offline fallback.
class HerHeaderLogo extends StatelessWidget {
  const HerHeaderLogo({
    super.key,
    this.width = 76,
    this.height = 46,
    this.opacity = .82,
    this.alignment = Alignment.centerRight,
  });

  final double width;
  final double height;
  final double opacity;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    final palette = context.herTheme.palette;
    final configuredLogo = palette.homeHeaderLogoImageUrl;
    final Widget image = palette.name.startsWith('Morph')
        ? FittedBox(
            fit: BoxFit.contain,
            child: SizedBox(
              width: 1993,
              height: 789,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.asset(
                    'assets/images/morph-header.webp',
                    fit: BoxFit.contain,
                  ),
                  if (palette.background.computeLuminance() > .4)
                    ShaderMask(
                      blendMode: BlendMode.srcIn,
                      shaderCallback: (bounds) => LinearGradient(
                        colors: [
                          Colors.transparent,
                          Colors.transparent,
                          context.herTheme.bodyPrimary,
                          context.herTheme.bodyPrimary,
                          Colors.transparent,
                          Colors.transparent,
                        ],
                        stops: const [0, .345, .345, .75, .75, 1],
                      ).createShader(bounds),
                      child: Image.asset(
                        'assets/images/morph-header.webp',
                        fit: BoxFit.contain,
                      ),
                    ),
                ],
              ),
            ),
          )
        : configuredLogo.isEmpty
        ? Image.asset(
            'assets/morph-wordmark-hq.webp',
            fit: BoxFit.contain,
            alignment: alignment,
          )
        : Image(
            image: palette.themeImageProvider(configuredLogo),
            fit: BoxFit.contain,
            alignment: alignment,
          );
    // Pure brand element: the old seasonal tap celebration was removed
    // from the release (it could throw on device). No gesture here.
    return SizedBox(
      width: palette.name.startsWith('Morph')
          ? PhoneDesignTokens.logoWidth
          : width,
      height: palette.name.startsWith('Morph')
          ? PhoneDesignTokens.logoHeight
          : height,
      child: Opacity(
        opacity: palette.name.startsWith('Morph') ? 1 : opacity,
        child: image,
      ),
    );
  }
}

/// The fixed, shared header used across ALL app pages.
///
/// Mirrors the مكتبة HER reference exactly. [title] is the page name,
/// [subtitle] is the page slogan (kept per-page). [compact] is kept only
/// for backward compatibility and is ignored — the size is always unified.
class AppPageHeader extends StatelessWidget {
  const AppPageHeader({
    super.key,
    required this.title,
    required this.subtitle,
    required this.onBack,
    this.headerImageKey,
    this.headerImageAsset,
    this.headerImageOpacity = .14,
    this.showBackgroundImage = true,
    this.showBackButton = true,
    this.logoOnly = false,
    @Deprecated('Unified header: size is fixed, flag is ignored.')
    this.compact = true,
    this.titleFontSize = 15,
    this.leadingAction,
    this.trailingAction,
  });

  /// Unified header height (matches مكتبة HER reference).
  static const double height = 86;

  /// The HER word keeps one vivid, recognisable brand pink on dark headers.
  /// It is deliberately independent from a seasonal palette's muted primary
  /// so bilingual page names never collapse to one white line of text.
  static const Color darkHeaderHerPink = Color(0xFFFF5C91);

  final String title;
  final double titleFontSize;
  final String subtitle;
  final VoidCallback onBack;
  final String? headerImageKey;

  /// Optional bundled artwork for a page-specific header.
  /// It takes precedence over the theme image while keeping the same subtle
  /// overlay treatment as other headers.
  final String? headerImageAsset;
  final double headerImageOpacity;

  /// Lets focused utility screens keep a calm, plain header even when the
  /// active theme supplies page artwork.
  final bool showBackgroundImage;
  final bool showBackButton;
  final bool logoOnly;
  final bool compact;
  final Widget? leadingAction;

  /// Optional fixed action below the right-hand HER logo. This keeps a
  /// page-level action visible without competing with the back button.
  final Widget? trailingAction;

  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    if (logoOnly) {
      return Container(
        height: PhoneDesignTokens.headerHeight,
        decoration: theme.palette.name.startsWith('Morph')
            ? const BoxDecoration()
            : herHeaderDecoration(theme.palette),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Directionality(
          textDirection: TextDirection.ltr,
          child: Row(
            children: [
              if (showBackButton)
                HerBackButton(onPressed: onBack)
              else
                const SizedBox(width: PhoneDesignTokens.touchTarget),
              const SizedBox(width:8),
              const HerHeaderLogo(width:PhoneDesignTokens.logoWidth,height:PhoneDesignTokens.logoHeight,opacity:1),
              const Spacer(),
              trailingAction ??
                  const SizedBox(width: PhoneDesignTokens.touchTarget),
            ],
          ),
        ),
      );
    }
    // A fixed 86px header clips the centred title/subtitle at larger
    // accessibility text sizes. Preserve the compact baseline, then add a
    // small measured allowance only when the user enlarges text.
    final textScale = MediaQuery.textScalerOf(context).scale(1);
    final effectiveHeight = height + ((textScale - 1).clamp(0.0, 1.0) * 16);
    final palette = theme.palette;
    final headerStyle = palette.componentStyle('header');
    final headerImage = headerImageKey == null
        ? palette.headerImageUrl
        : palette.pageHeaderImage(headerImageKey!);
    final ImageProvider? backgroundImage = !showBackgroundImage
        ? null
        : headerImageAsset != null
        ? AssetImage(headerImageAsset!)
        : headerImage.isEmpty
        ? null
        : palette.themeImageProvider(headerImage);
    final displayTitle = headerImageKey == null
        ? title
        : palette.pageHeaderTitle(headerImageKey!, title);
    final displaySubtitle = headerImageKey == null
        ? subtitle
        : palette.pageHeaderSubtitle(headerImageKey!, subtitle);
    final configuredTitleColor =
        palette.headerTitleColor ?? theme.surfaces.headerForeground;
    final configuredSubtitleColor =
        palette.headerSubtitleColor ?? theme.surfaces.headerForegroundMuted;
    // The Control Center owns one shared set of header colors for every page.
    // The dark defaults remain white/pink/light-tint, but editors can override
    // those three colors once without configuring individual pages.
    final titleColor = palette.modernAccents.isNotEmpty
        ? theme.sectionTitle
        : configuredTitleColor;
    final subtitleColor = configuredSubtitleColor;
    // All pages read the same three global header colour controls. Legacy
    // per-page styles may remain in old payloads, but are intentionally not
    // consulted here: the header is one shared component, not a page skin.
    final herColor = palette.headerHerColor ?? palette.primary;
    // Colour/opacity belong to the header recipe; blur only controls filtering.
    final header = Container(
      decoration: herHeaderDecoration(
        palette,
        image: backgroundImage,
        imageOpacity: headerImageOpacity,
      ),
      child: GestureDetector(
        excludeFromSemantics: true,
        onHorizontalDragEnd: (details) {
          if ((details.primaryVelocity ?? 0) > 250) onBack();
        },
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              height: palette.name.startsWith('Morph')
                  ? effectiveHeight + 48
                  : effectiveHeight,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 9, 20, 0),
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 62),
                        child: Align(
                          alignment: Alignment.topCenter,
                          child: Padding(
                            // يترك مسافة تنفّس أعلى الاسم، ويحرك العنوان
                            // والـ slogan معًا للأسفل في جميع الهيدرز.
                            padding: EdgeInsets.only(
                              top: palette.name.startsWith('Morph') ? 64 : 5,
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                HerBrandedTitle(
                                  title: displayTitle,
                                  fontSize: titleFontSize,
                                  foreground: titleColor,
                                  herForeground: herColor,
                                ),
                                const SizedBox(height: 1),
                                Text(
                                  displaySubtitle,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.cairo(
                                    fontSize: 10.5,
                                    height: 1.28,
                                    fontWeight: FontWeight.w600,
                                    color: subtitleColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    if (palette.name.startsWith('Morph'))
                      const Positioned(
                        left: 0,
                        right: 0,
                        top: 9,
                        child: Center(
                          child: HerHeaderLogo(
                            width: 128,
                            height: 44,
                            opacity: 1,
                          ),
                        ),
                      )
                    else
                      Positioned(
                        right: 5,
                        top: 4,
                        child: const HerHeaderLogo(),
                      ),
                    if (showBackButton)
                      Positioned(
                        left: 0,
                        // Align the circular control with the title block,
                        // not the header's upper edge.
                        top: 8,
                        child: HerBackButton(onPressed: onBack),
                      ),
                    if (leadingAction != null)
                      Positioned(left: 43, top: 1, child: leadingAction!),
                    if (trailingAction != null)
                      // The optional third action belongs directly under the
                      // HER mark at the physical right of the header.
                      Positioned(right: 26, top: 50, child: trailingAction!),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
    return ThemeBackdrop(blur: headerStyle.backdropBlur ?? 0, child: header);
  }
}
