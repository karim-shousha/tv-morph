import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/widgets/her_components.dart';
import '../widgets/faith_shared.dart';

class DashboardVerse {
  const DashboardVerse(this.surah, this.ayah, this.text);
  final String surah, text;
  final int ayah;
}

/// Live HH:MM:SS countdown with its own 1s ticker, so the dashboard page is
/// not rebuilt every second.
class CountdownText extends StatefulWidget {
  const CountdownText({super.key, required this.target, required this.style});
  final DateTime target;
  final TextStyle style;

  @override
  State<CountdownText> createState() => CountdownTextState();
}

class CountdownTextState extends State<CountdownText> {
  Timer? _timer;
  late DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void didUpdateWidget(covariant CountdownText oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.target != widget.target) _now = DateTime.now();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final remaining = widget.target.difference(_now);
    return Text(
      faithDuration(remaining),
      textDirection: TextDirection.ltr,
      style: widget.style,
    );
  }
}

class QuickAction {
  const QuickAction(this.label, this.icon, this.onTap, this.kind);
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  /// صريح لكل وجهة من الثيم الجديد — بدون تخمين من درجة اللون.
  final HerIconKind kind;
}

class SquareQuickTile extends StatefulWidget {
  const SquareQuickTile({super.key, required this.action});
  final QuickAction action;
  @override
  State<SquareQuickTile> createState() => SquareQuickTileState();
}

class SquareQuickTileState extends State<SquareQuickTile> {
  bool down = false;
  @override
  Widget build(BuildContext context) {
    final theme = context.herTheme;
    return Semantics(
      button: true,
      label: widget.action.label,
      child: GestureDetector(
        onTapDown: (_) => setState(() => down = true),
        onTapCancel: () => setState(() => down = false),
        onTapUp: (_) {
          setState(() => down = false);
          widget.action.onTap();
        },
        child: AnimatedScale(
          scale: down ? .93 : 1,
          duration: const Duration(milliseconds: 130),
          child: HERShortcutCard(
            radius: 22,
            padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 4),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // The old artwork sheet carried its own baked-in, low-light
                // colours. This must be a real semantic icon so Theme Studio
                // controls its glyph and wash for every published theme.
                HERIconContainer(
                  widget.action.icon,
                  kind: widget.action.kind,
                  size: 52,
                  iconSize: 25,
                ),
                const SizedBox(height: 7),
                Text(
                  widget.action.label,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: faithText(
                    context,
                    10.5,
                    FontWeight.w900,
                    herShortcutForeground(theme),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
