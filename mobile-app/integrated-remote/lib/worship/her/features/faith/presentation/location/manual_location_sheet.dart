import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/widgets/her_components.dart';
import '../../data/prayer_calculation_service.dart';
import '../widgets/faith_shared.dart';

/// Global manual fallback: search for a governorate/city and country instead
/// of keeping an Egypt-only list. The platform geocoder accepts Arabic and
/// English names from anywhere in the world.
class ManualLocationSheet extends StatefulWidget {
  const ManualLocationSheet({super.key, required this.initialTimezone});
  final String initialTimezone;

  @override
  State<ManualLocationSheet> createState() => ManualLocationSheetState();
}

class ManualLocationSheetState extends State<ManualLocationSheet> {
  final _query = TextEditingController();
  bool _searching = false;
  String? _error;

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final query = _query.text.trim();
    if (query.length < 3) {
      setState(() => _error = 'اكتب المدينة والدولة، مثل: طنطا، مصر.');
      return;
    }
    setState(() {
      _searching = true;
      _error = null;
    });
    try {
      final locations = await locationFromAddress(
        query,
      ).timeout(const Duration(seconds: 12));
      if (locations.isEmpty) throw StateError('no-location');
      final location = locations.first;
      var label = query;
      String? countryCode;
      var timezone = widget.initialTimezone;
      try {
        timezone = (await FlutterTimezone.getLocalTimezone()).identifier;
      } catch (_) {}
      try {
        final marks = await placemarkFromCoordinates(
          location.latitude,
          location.longitude,
        );
        if (marks.isNotEmpty) {
          final mark = marks.first;
          countryCode = mark.isoCountryCode;
          final parts = [mark.locality, mark.administrativeArea, mark.country]
              .whereType<String>()
              .map((part) => part.trim())
              .where((part) => part.isNotEmpty)
              .toSet()
              .toList();
          if (parts.isNotEmpty) label = parts.join('، ');
        }
      } catch (_) {}
      if (!mounted) return;
      Navigator.pop(
        context,
        ManualCity.fromGeocoded(
          label: label,
          latitude: location.latitude,
          longitude: location.longitude,
          deviceTimezone: timezone,
          countryCode: countryCode,
        ),
      );
    } catch (_) {
      if (mounted) {
        setState(
          () =>
              _error = 'لم نعثر على المكان. جرّبي كتابة المدينة والدولة معًا.',
        );
      }
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  @override
  Widget build(BuildContext context) => Directionality(
    textDirection: TextDirection.rtl,
    child: SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          18,
          20,
          20 + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'اختيار مدينة من أي دولة',
              style: faithText(
                context,
                17,
                FontWeight.w900,
                context.herTheme.bodyPrimary,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              'اكتب المحافظة/المدينة ثم الدولة بالعربية أو الإنجليزية. المدن المصرية تستخدم توقيت القاهرة الصيفي والشتوي تلقائيًا.',
              style: faithText(
                context,
                10.5,
                FontWeight.w500,
                context.herTheme.bodySecondary,
              ),
            ),
            const SizedBox(height: 13),
            TextField(
              controller: _query,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _search(),
              decoration: herInputDecoration(
                'مثال: المنصورة، مصر أو Toronto, Canada',
                icon: Icons.travel_explore_rounded,
              ).copyWith(errorText: _error),
            ),
            const SizedBox(height: 10),
            HERPrimaryButton(
              label: _searching ? 'جارٍ البحث…' : 'استخدام هذا المكان',
              icon: Icons.search_rounded,
              onPressed: _searching ? null : _search,
            ),
            const SizedBox(height: 10),
            Text(
              'اختيارات سريعة',
              style: faithText(
                context,
                12,
                FontWeight.w800,
                context.herTheme.bodyPrimary,
              ),
            ),
            SizedBox(
              height: 150,
              child: ListView(
                children: manualCities
                    .map(
                      (city) => HERListTile(
                        title: city.label,
                        icon: Icons.location_on_outlined,
                        iconKind: HerIconKind.knowledge,
                        onTap: () => Navigator.pop(context, city),
                      ),
                    )
                    .toList(),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
