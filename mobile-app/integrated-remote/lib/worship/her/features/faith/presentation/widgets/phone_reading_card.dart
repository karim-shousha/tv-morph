import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import '../../../../core/theme/her_theme_data.dart';

/// The same editorial card in every devotional library: title, readable text,
/// a quiet action row, and disclosure of the complete source on demand.
class PhoneReadingCard extends StatefulWidget {
  const PhoneReadingCard({
    super.key,
    required this.title,
    required this.body,
    required this.reference,
    this.kind,
    this.favorite,
    this.onFavorite,
    this.onShare,
    this.onCopy,
    this.progress,
    this.onRepeat,
  });
  final String title, body, reference;
  final String? kind, progress;
  final bool? favorite;
  final VoidCallback? onFavorite, onShare, onCopy, onRepeat;
  @override
  State<PhoneReadingCard> createState() => _PhoneReadingCardState();
}

class _PhoneReadingCardState extends State<PhoneReadingCard> {
  bool sourceOpen = false, expanded = false;
  @override
  Widget build(BuildContext context) {
    final p = PhoneDesignTokens.palette(
      context.herTheme.palette.background.computeLuminance() < .4,
    );
    final textStyle = GoogleFonts.amiri(
      fontSize: PhoneDesignTokens.readingSize,
      height: 1.85,
      fontWeight: FontWeight.w400,
      color: p.text,
    );
    return Container(
      margin: const EdgeInsets.only(bottom: PhoneDesignTokens.gap),
      padding: const EdgeInsets.all(PhoneDesignTokens.cardPadding),
      decoration: p.cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  widget.title,
                  style: PhoneDesignTokens.uiText(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: p.text,
                  ),
                ),
              ),
              if (widget.onFavorite != null)
                IconButton(
                  tooltip: widget.favorite == true
                      ? 'إزالة من المفضلة'
                      : 'حفظ في المفضلة',
                  onPressed: widget.onFavorite,
                  icon: Icon(
                    widget.favorite == true
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    size: 20,
                    color: p.link,
                  ),
                ),
            ],
          ),
          if (widget.kind != null)
            Padding(
              padding: const EdgeInsets.only(top: 3),
              child: Text(
                widget.kind!,
                style: PhoneDesignTokens.uiText(fontSize: 12, color: p.muted),
              ),
            ),
          const SizedBox(height: 14),
          LayoutBuilder(
            builder: (context, constraints) {
              final measure = TextPainter(
                text: TextSpan(text: widget.body, style: textStyle),
                textDirection: TextDirection.rtl,
                maxLines: 6,
              )..layout(maxWidth: constraints.maxWidth);
              final long = measure.didExceedMaxLines;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    widget.body,
                    textDirection: TextDirection.rtl,
                    style: textStyle,
                    maxLines: expanded ? null : 6,
                    overflow: expanded
                        ? TextOverflow.visible
                        : TextOverflow.ellipsis,
                  ),
                  if (long || expanded)
                    Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: TextButton(
                        onPressed: () => setState(() => expanded = !expanded),
                        child: Text(
                          expanded ? 'عرض مختصر' : 'قراءة النص كاملًا',
                          style: PhoneDesignTokens.uiText(
                            fontSize: 12,
                            color: p.link,
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          const SizedBox(height: 12),
          Divider(height: 1, color: p.border),
          const SizedBox(height: 4),
          Row(
            children: [
              TextButton.icon(
                onPressed: () => setState(() => sourceOpen = !sourceOpen),
                icon: Icon(Icons.info_outline_rounded, size: 16, color: p.link),
                label: Text(
                  'المصدر',
                  style: PhoneDesignTokens.uiText(fontSize: 12, color: p.link),
                ),
              ),
              const Spacer(),
              if (widget.onRepeat != null)
                TextButton(
                  onPressed: widget.onRepeat,
                  child: Text(
                    widget.progress ?? 'تم الذكر',
                    style: PhoneDesignTokens.uiText(
                      fontSize: 12,
                      color: p.link,
                    ),
                  ),
                ),
              if (widget.onCopy != null)
                IconButton(
                  tooltip: 'نسخ النص',
                  onPressed: widget.onCopy,
                  icon: Icon(Icons.copy_rounded, size: 18, color: p.link),
                ),
              if (widget.onShare != null)
                IconButton(
                  tooltip: 'مشاركة',
                  onPressed: widget.onShare,
                  icon: Icon(Icons.share_outlined, size: 18, color: p.link),
                ),
            ],
          ),
          if (sourceOpen)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                widget.reference,
                style: PhoneDesignTokens.uiText(
                  fontSize: 12,
                  height: 1.7,
                  color: p.muted,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class PhonePageIntro extends StatelessWidget {
  const PhonePageIntro({
    super.key,
    required this.title,
    required this.subtitle,
  });
  final String title, subtitle;
  @override
  Widget build(BuildContext context) {
    final p = PhoneDesignTokens.palette(
      context.herTheme.palette.background.computeLuminance() < .4,
    );
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 4, 0, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: PhoneDesignTokens.uiText(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: p.text,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: PhoneDesignTokens.uiText(fontSize: 14, color: p.muted),
          ),
        ],
      ),
    );
  }
}
