import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/widgets/her_components.dart';
import '../../data/faith_repository.dart';
import '../../data/prayer_calculation_service.dart';
import '../widgets/faith_shared.dart';
import '../location/manual_location_sheet.dart';
import '../../../../core/widgets/app_page_header.dart';

class PrayerSettingsScreen extends StatefulWidget {
  const PrayerSettingsScreen({
    super.key,
    required this.settings,
    required this.onSaved,
    required this.onUseLocation,
  });
  final FaithSettings settings;
  final Future<void> Function(FaithSettings) onSaved;
  final Future<void> Function() onUseLocation;
  @override
  State<PrayerSettingsScreen> createState() => _PrayerSettingsScreenState();
}

class _PrayerSettingsScreenState extends State<PrayerSettingsScreen> {
  late FaithSettings s;
  @override
  void initState() {
    super.initState();
    s = widget.settings;
  }

  Future<void> save(FaithSettings next) async {
    setState(() => s = next);
    await widget.onSaved(next);
  }

  Widget _herSwitch({
    required Widget title,
    Widget? subtitle,
    required bool value,
    required ValueChanged<bool>? onChanged,
  }) {
    final switchStyle = faithPrayerSwitchStyle(context);
    return SwitchListTile(
      title: title,
      subtitle: subtitle,
      value: value,
      onChanged: onChanged,
      activeTrackColor: switchStyle.trackSelected,
      activeThumbColor: switchStyle.thumbSelected,
      inactiveTrackColor: switchStyle.trackUnselected,
      inactiveThumbColor: switchStyle.thumbUnselected,
      trackOutlineColor: WidgetStatePropertyAll(switchStyle.border),
    );
  }

  @override
  Widget build(BuildContext context) => Directionality(
    textDirection: TextDirection.rtl,
    child: Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            AppPageHeader(
                  logoOnly: true,
              title: 'إعدادات الصلاة',
              subtitle: 'مواقيتك مضبوطة على مدينتك',
              onBack: () => Navigator.maybePop(context),
            ),
            Expanded(
              child: ListView(
                // Keep the final Hijri control clear of gesture bars and small screens.
                padding: EdgeInsets.fromLTRB(
                  16,
                  16,
                  16,
                  36 + MediaQuery.viewPaddingOf(context).bottom,
                ),
                children: [
                  _tile(
                    'الموقع',
                    s.automaticLocation
                        ? 'تلقائي حسب موقعي — ${s.city}'
                        : 'اختيار مدينة يدويًا — ${s.city}',
                    Icons.location_on_outlined,
                    onTap: _locationSheet,
                  ),
                  _herSwitch(
                    title: Text(
                      'تحديد المواقيت تلقائيًا حسب موقعي',
                      style: faithText(context, 13, FontWeight.w800),
                    ),
                    subtitle: Text(
                      'يُستخدم فقط عند فتح هذه الميزة.',
                      style: faithText(
                        context,
                        10,
                        FontWeight.w500,
                        context.herTheme.bodySecondary,
                      ),
                    ),
                    value: s.automaticLocation,
                    onChanged: (v) async {
                      await save(s.copyWith(automaticLocation: v));
                      if (v) await widget.onUseLocation();
                    },
                  ),
                  _group('الحساب'),
                  _selectionCard<String>(
                    label: 'طريقة حساب مواقيت الصلاة',
                    value: s.calculationMethod,
                    items: calculationMethods.entries
                        .map(
                          (e) => DropdownMenuItem(
                            value: e.key,
                            child: Text(
                              e.value,
                              style: PhoneDesignTokens.uiText(fontSize: 12),
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (v) {
                      if (v != null) save(s.copyWith(calculationMethod: v));
                    },
                  ),
                  _herSwitch(
                    title: Text(
                      'المذهب لحساب العصر: حنفي',
                      style: faithText(context, 13, FontWeight.w800),
                    ),
                    subtitle: Text(
                      s.hanafi
                          ? 'ظلّان — وقت العصر متأخر عن المواقيت المصرية المعتادة'
                          : 'ظل واحد — المستخدم في مواقيت الهيئة المصرية للمساحة',
                      style: faithText(
                        context,
                        10,
                        FontWeight.w500,
                        context.herTheme.bodySecondary,
                      ),
                    ),
                    value: s.hanafi,
                    onChanged: (v) => save(s.copyWith(hanafi: v)),
                  ),
                  _group('التاريخ الهجري'),
                  _selectionCard<int>(
                    label: 'تعديل التاريخ الهجري',
                    value: s.hijriAdjustment,
                    items: const [-2, -1, 0, 1, 2]
                        .map(
                          (v) => DropdownMenuItem(
                            value: v,
                            child: Text(
                              v == 0
                                  ? 'بدون تعديل'
                                  : (v > 0 ? '+$v يوم' : '$v يوم'),
                              style: PhoneDesignTokens.uiText(fontSize: 12),
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (v) {
                      if (v != null) save(s.copyWith(hijriAdjustment: v));
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
  Widget _group(String title) => Padding(
    padding: const EdgeInsets.only(top: 18, bottom: 7),
    child: Text(
      title,
      style: faithText(
        context,
        15,
        FontWeight.w900,
        context.herTheme.bodyPrimary,
      ),
    ),
  );
  Widget _selectionCard<T>({
    required String label,
    required T value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
  }) => HERCard(
    role: HERCardRole.wide,
    radius: 18,
    elevated: false,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: faithText(
            context,
            10.5,
            FontWeight.w600,
            context.herTheme.bodySecondary,
          ),
        ),
        const SizedBox(height: 3),
        DropdownButtonHideUnderline(
          child: DropdownButton<T>(
            value: value,
            isExpanded: true,
            items: items,
            onChanged: onChanged,
          ),
        ),
      ],
    ),
  );
  Widget _tile(
    String title,
    String subtitle,
    IconData icon, {
    VoidCallback? onTap,
  }) => HERListRow(
    radius: 18,
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
    onTap: onTap,
    child: HERListTile(
      title: title,
      subtitle: subtitle,
      icon: icon,
      iconKind: HerIconKind.knowledge,
      trailing: const Icon(Icons.arrow_back_ios_new_rounded, size: 16),
      onTap: onTap,
    ),
  );
  Future<void> _locationSheet() async {
    final selected = await showHerSheet<ManualCity>(
      context,
      title: 'اختيار المدينة',
      child: ManualLocationSheet(initialTimezone: s.timezone),
    );
    if (selected != null) {
      await save(
        s.copyWith(
          automaticLocation: false,
          locationConfigured: true,
          city: selected.label,
          latitude: selected.latitude,
          longitude: selected.longitude,
          timezone: selected.timezone,
        ),
      );
    }
  }
}
