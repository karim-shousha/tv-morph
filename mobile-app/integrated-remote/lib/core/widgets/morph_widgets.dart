import 'package:flutter/material.dart';
import '../theme/morph_colors.dart';
import '../theme/phone_design_tokens.dart';

class MorphLogo extends StatelessWidget {
  final double size;
  const MorphLogo({super.key, this.size = 44});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: size,
      child: Row(mainAxisSize: MainAxisSize.min, textDirection: TextDirection.ltr, children: [
        Image.asset('assets/morph-header-symbol.webp', width: size, height: size, fit: BoxFit.contain),
        Text('orph TV', style: TextStyle(color: MorphColors.textPrimary, fontSize: size * .53, fontWeight: FontWeight.w600, letterSpacing: -.7, fontFamily: 'MorphSans', decoration: TextDecoration.none, height: 1.1)),
      ]),
    );
  }
}

class _PlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = MorphColors.textPrimary
      ..style = PaintingStyle.fill;
    final w = size.width, h = size.height;
    final path = Path()
      ..moveTo(w * 0.38, h * 0.28)
      ..lineTo(w * 0.68, h * 0.5)
      ..lineTo(w * 0.38, h * 0.72)
      ..close();
    // triangular play with cutout feel
    canvas.drawPath(path, paint);
    final ring = Paint()
      ..color = MorphColors.textPrimary.withValues(alpha: 0.85)
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.07;
    canvas.drawPath(
      Path()
        ..moveTo(w * 0.30, h * 0.20)
        ..lineTo(w * 0.62, h * 0.20)
        ..lineTo(w * 0.78, h * 0.5)
        ..lineTo(w * 0.62, h * 0.80)
        ..lineTo(w * 0.30, h * 0.80),
      ring,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final bool glow;
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(PhoneDesignTokens.cardPadding),
    this.onTap,
    this.glow = false,
  });
  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: padding,
      decoration: MorphColors.palette.cardDecoration().copyWith(border:Border.all(color:glow?MorphColors.palette.link:MorphColors.palette.border)),
      child: child,
    );
    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(PhoneDesignTokens.cardRadius),
        onTap: onTap,
        child: card,
      ),
    );
  }
}

class MorphPrimaryButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final bool loading;
  const MorphPrimaryButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.loading = false,
  });
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: MorphColors.brandGradient,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: MorphColors.electricBlue.withValues(alpha: 0.0),
            blurRadius: 18,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          foregroundColor: MorphColors.palette.onAccent,
          minimumSize: Size(double.infinity, 48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        onPressed: loading ? null : onPressed,
        child: loading
            ? SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: MorphColors.textPrimary,
                ),
              )
            : Row(
                textDirection: TextDirection.ltr,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 20),
                    SizedBox(width: 10),
                  ],
                  Flexible(child: Text(label, textAlign: TextAlign.center)),
                ],
              ),
      ),
    );
  }
}

class RemoteButton extends StatefulWidget {
  final Widget child;
  final Future<bool> Function() onTap;
  final bool enabled;
  final double? width;
  final double? height;
  final Color? accent;
  const RemoteButton({
    super.key,
    required this.child,
    required this.onTap,
    this.enabled = true,
    this.width,
    this.height = 48,
    this.accent,
  });
  @override
  State<RemoteButton> createState() => _RemoteButtonState();
}

class _RemoteButtonState extends State<RemoteButton> {
  double _scale = 1.0;
  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: _scale,
      duration: Duration(milliseconds: 90),
      child: Opacity(
        opacity: widget.enabled ? 1.0 : 0.55,
        child: Material(
          color: widget.accent ?? MorphColors.surface,
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: widget.enabled
                ? () async {
                    setState(() => _scale = 0.98);
                    await Future<void>.delayed(Duration(milliseconds: 70));
                    if (mounted) setState(() => _scale = 1.0);
                    await widget.onTap();
                  }
                : null,
            child: Container(
              width: widget.width,
              height: widget.height,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: MorphColors.textPrimary.withValues(alpha: 0.08),
                ),
              ),
              child: widget.child,
            ),
          ),
        ),
      ),
    );
  }
}
