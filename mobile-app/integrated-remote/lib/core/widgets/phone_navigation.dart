import 'package:flutter/material.dart';
import '../theme/phone_design_tokens.dart';

/// One navigation component for the embedded remote and faith surfaces.
class PhoneNavigation extends StatelessWidget {
  const PhoneNavigation({
    super.key,
    required this.dark,
    required this.arabic,
    required this.active,
    required this.onSelect,
  });
  final bool dark, arabic;
  final String active;
  final ValueChanged<String> onSelect;

  Widget _item(
    PhonePalette p,
    String route,
    IconData icon,
    String ar,
    String en,
  ) {
    final selected = active == route;
    final color = selected ? p.link : p.muted;
    return Expanded(
      child: Semantics(
        selected: selected,
        button: true,
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () => onSelect(route),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 32,
                  height: 27,
                  decoration: selected
                      ? BoxDecoration(
                          color: p.soft,
                          border: Border.all(color: p.borderWarm),
                          borderRadius: BorderRadius.circular(9),
                        )
                      : null,
                  child: Icon(icon, size: 19, color: color),
                ),
                const SizedBox(height: 3),
                SizedBox(
                  height: 16,
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      arabic ? ar : en,
                      style: TextStyle(
                        fontSize: 10,
                        fontFamily: 'MorphSans',
                        color: color,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = PhoneDesignTokens.palette(dark);
    return Material(type:MaterialType.transparency,child:SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(10, 0, 10, 7),
        child: Container(
          decoration: p.cardDecoration(),
          padding: const EdgeInsets.all(5),
          child: Directionality(
            textDirection: arabic ? TextDirection.rtl : TextDirection.ltr,
            child: Row(
              children: [
                _item(p, 'home', Icons.home_outlined, 'الرئيسية', 'Home'),
                _item(p, 'play', Icons.live_tv_outlined, 'القنوات', 'IPTV'),
                _item(
                  p,
                  'control',
                  Icons.settings_remote_outlined,
                  'الريموت',
                  'Remote',
                ),
                _item(
                  p,
                  'matches',
                  Icons.emoji_events_outlined,
                  'المباريات',
                  'Matches',
                ),
                _item(p, 'more', Icons.grid_view_outlined, 'المزيد', 'More'),
              ],
            ),
          ),
        ),
      ),
    ));
  }
}
