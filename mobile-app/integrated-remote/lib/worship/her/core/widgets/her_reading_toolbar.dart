import 'package:flutter/material.dart';
import '../theme/her_theme_data.dart';
import 'her_components.dart';

/// Shared dock for distraction-free Quran and support reading.
class HerReadingToolbar extends StatelessWidget {
  const HerReadingToolbar({super.key, required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => SafeArea(
    top: false,
    minimum: const EdgeInsets.fromLTRB(12, 4, 12, 10),
    child: HERCard(
      role: HERCardRole.wide,
      radius: 16,
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 4),
      child: Row(children: children),
    ),
  );
}

class HerReadingToolbarAction extends StatelessWidget {
  const HerReadingToolbarAction({
    super.key,
    required this.tooltip,
    required this.icon,
    required this.onPressed,
    this.color,
  });
  final String tooltip;
  final IconData icon;
  final VoidCallback onPressed;
  final Color? color;
  @override
  Widget build(BuildContext context) => SizedBox(
    width: MediaQuery.sizeOf(context).width < 360 ? 26 : 32,
    height: 36,
    child: IconButton(
      tooltip: tooltip,
      visualDensity: VisualDensity.compact,
      constraints: const BoxConstraints.tightFor(width: 26, height: 36),
      padding: EdgeInsets.zero,
      onPressed: onPressed,
      icon: Icon(
        icon,
        size: 19,
        color: color ?? context.herTheme.actions.primary,
      ),
    ),
  );
}
