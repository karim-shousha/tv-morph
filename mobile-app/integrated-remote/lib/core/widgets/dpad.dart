import '../theme/morph_colors.dart';
import '../localization/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/tv_models.dart';
import '../../services/app_state.dart';

/// Circular four-way navigation pad with a tactile center select button.
class DPad extends StatelessWidget {
  final Future<bool> Function(TvKey) onKey;
  final TvCapabilities caps;
  final double diameter;
  final TvKey? activeKey;

  const DPad({
    super.key,
    required this.onKey,
    required this.caps,
    this.diameter = 210,
    this.activeKey,
  });

  Future<void> _tap(BuildContext context, TvKey key) async {
    if (context.read<AppState>().haptics) HapticFeedback.lightImpact();
    final sent = await onKey(key);
    if (!sent && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            MorphLocalizations.of(context).isArabic
                ? 'التلفزيون لم يؤكد الأمر. راجع الاتصال.'
                : 'Command not acknowledged by TV',
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = diameter;
    return Container(
      width: d,
      height: d,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        boxShadow: [BoxShadow(color:MorphColors.palette.shadow,blurRadius:22,offset:const Offset(0,8))],
        gradient: MorphColors.palette.glass,
        border: Border.all(color:MorphColors.palette.border,width:1),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          _direction(
            context,
            Icons.keyboard_arrow_up_rounded,
            Alignment.topCenter,
            TvKey.up,
            d,
            EdgeInsets.only(top: 10),
            selected: activeKey == TvKey.up,
          ),
          _direction(
            context,
            Icons.keyboard_arrow_down_rounded,
            Alignment.bottomCenter,
            TvKey.down,
            d,
            EdgeInsets.only(bottom: 10),
            selected: activeKey == TvKey.down,
          ),
          _direction(
            context,
            Icons.keyboard_arrow_left_rounded,
            Alignment.centerLeft,
            TvKey.left,
            d,
            EdgeInsets.only(left: 7),
            selected: activeKey == TvKey.left,
          ),
          _direction(
            context,
            Icons.keyboard_arrow_right_rounded,
            Alignment.centerRight,
            TvKey.right,
            d,
            EdgeInsets.only(right: 7),
            selected: activeKey == TvKey.right,
          ),
          GestureDetector(
            onTap: caps.dpad ? () => _tap(context, TvKey.ok) : null,
            child: Container(
              width: (d * .36).clamp(56.0, 72.0).toDouble(),
              height: (d * .36).clamp(56.0, 72.0).toDouble(),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    caps.dpad
                        ? MorphColors.palette.surface
                        : MorphColors.surfaceLight,
                    caps.dpad
                        ? MorphColors.palette.surface
                        : MorphColors.surfaceLight,
                  ],
                ),
                border: Border.all(
                  color: caps.dpad
                      ? MorphColors.palette.surface
                      : MorphColors.surfaceLight,
                  width: 1,
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                'OK',
                style: TextStyle(
                  color: caps.dpad ? MorphColors.textPrimary : MorphColors.textMuted,
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _direction(
    BuildContext context,
    IconData icon,
    Alignment alignment,
    TvKey key,
    double size,
    EdgeInsets padding, {
    required bool selected,
  }) {
    return Align(
      alignment: alignment,
      child: Padding(
        padding: padding,
        child: IconButton(
          onPressed: caps.dpad ? () => _tap(context, key) : null,
          icon: Icon(
            icon,
            color: selected
                ? MorphColors.tone(0xFF81C6E4, 0xFF617286)
                : MorphColors.textPrimary,
            size: size * .15,
          ),
          style: IconButton.styleFrom(
            backgroundColor: selected
                ? MorphColors.tone(0x554D83A0, 0x1C344D64)
                : Colors.transparent,
            shape: CircleBorder(),
          ),
          padding: EdgeInsets.zero,
          constraints: BoxConstraints.tightFor(
            width: (size * .26).clamp(48.0, 64.0).toDouble(),
            height: (size * .26).clamp(48.0, 64.0).toDouble(),
          ),
          splashRadius: size * .18,
        ),
      ),
    );
  }
}

/// Optional swipe-to-navigate mode that replaces the four directional keys.
class TouchPad extends StatefulWidget {
  final Future<bool> Function(TvKey) onKey;
  final bool enabled;
  final double diameter;

  const TouchPad({
    super.key,
    required this.onKey,
    required this.enabled,
    required this.diameter,
  });

  @override
  State<TouchPad> createState() => _TouchPadState();
}

class _TouchPadState extends State<TouchPad> {
  double _dx = 0;
  double _dy = 0;
  static final _step = 34.0;

  void _move(DragUpdateDetails details) {
    _dx += details.delta.dx;
    _dy += details.delta.dy;
    while (_dx.abs() >= _step || _dy.abs() >= _step) {
      if (_dx.abs() >= _dy.abs() && _dx.abs() >= _step) {
        final right = _dx > 0;
        _dx += right ? -_step : _step;
        widget.onKey(right ? TvKey.right : TvKey.left);
      } else {
        final down = _dy > 0;
        _dy += down ? -_step : _step;
        widget.onKey(down ? TvKey.down : TvKey.up);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.diameter;
    return Opacity(
      opacity: widget.enabled ? 1 : .45,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onPanStart: (_) {
          _dx = 0;
          _dy = 0;
        },
        onPanUpdate: widget.enabled ? _move : null,
        onPanEnd: (_) {
          _dx = 0;
          _dy = 0;
        },
        onTap: widget.enabled ? () => widget.onKey(TvKey.ok) : null,
        child: Container(
          width: d,
          height: d,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                MorphColors.tone(0xFF1B2D43, 0xFFFEFDFB),
                MorphColors.tone(0xFF0D192B, 0xFFF7F4EF),
                MorphColors.tone(0xFF08111F, 0xFFF7F4EF),
              ],
              stops: [0, .64, 1],
            ),
            border: Border.all(
              color: MorphColors.tone(0xFF2A405E, 0xFFFEFDFB),
              width: 1.5,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.touch_app_rounded,
                size: d * .18,
                color: MorphColors.tone(0xFF75AFC8, 0xFF688297),
              ),
              SizedBox(height: 4),
              Text(
                'SWIPE',
                style: TextStyle(
                  color: MorphColors.textPrimary,
                  fontSize: 11,
                  letterSpacing: 1.6,
                  fontWeight: FontWeight.w700,
                ),
              ),
              SizedBox(height: 3),
              Text(
                'TAP TO SELECT',
                style: TextStyle(
                  color: MorphColors.tone(0xFFAAC5E4, 0xFF617286),
                  fontSize: 8,
                  letterSpacing: .7,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
