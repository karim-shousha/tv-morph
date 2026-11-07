import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/app_page_header.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/widgets/her_components.dart';
import '../../data/faith_repository.dart';

/// Edits the existing date-keyed prayer ledger, without replacing today's state.
class PrayerHistoryScreen extends StatefulWidget {
  const PrayerHistoryScreen({super.key});

  @override
  State<PrayerHistoryScreen> createState() => _PrayerHistoryScreenState();
}

class _PrayerHistoryScreenState extends State<PrayerHistoryScreen> {
  static const _names = {
    'fajr': 'الفجر',
    'dhuhr': 'الظهر',
    'asr': 'العصر',
    'maghrib': 'المغرب',
    'isha': 'العشاء',
  };
  DateTime _day = DateUtils.dateOnly(DateTime.now());
  Map<String, int> _statuses = {};
  bool _resting = false, _loading = true, _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load(_day);
  }

  Future<void> _load(DateTime day) async {
    setState(() {
      _loading = true;
      _error = null;
      _day = day;
    });
    try {
      final statuses = await FaithRepository.instance.loadPrayerDay(day);
      final resting = await FaithRepository.instance.loadRestMode(day);
      if (!mounted) return;
      setState(() {
        _statuses = statuses;
        _resting = resting;
      });
    } catch (_) {
      if (mounted) setState(() => _error = 'تعذر تحميل اليوم. حاول تاني.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDay() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _day,
      firstDate: DateTime(2000),
      lastDate: DateUtils.dateOnly(DateTime.now()),
      helpText: 'اختار يوم تسجيل الصلاة',
      cancelText: 'إلغاء',
      confirmText: 'اختيار',
      builder: (context, child) =>
          Directionality(textDirection: TextDirection.rtl, child: child!),
    );
    if (picked != null && mounted) await _load(picked);
  }

  Future<void> _save(String key, int status) async {
    if (_saving || _resting) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final statuses = await FaithRepository.instance.savePrayerStatus(
        _day,
        key,
        status,
      );
      if (mounted) setState(() => _statuses = statuses);
    } catch (_) {
      if (mounted) setState(() => _error = 'تعذر حفظ الصلاة. حاول تاني.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final today = DateUtils.dateOnly(DateTime.now());
    final date = MaterialLocalizations.of(context).formatFullDate(_day);
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: PreferredSize(preferredSize: const Size.fromHeight(PhoneDesignTokens.headerHeight), child: SafeArea(child: AppPageHeader(logoOnly: true, title: '', subtitle: '', onBack: () => Navigator.maybePop(context)))),
        body: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'كل يوم له سجله',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: context.herTheme.bodyPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'اختار امبارح أو أي يوم فات، وسجّل الصلاة في يومها. تعديلاتك بتتحفظ تلقائيًا.',
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              key: const Key('prayer-history-calendar'),
              onPressed: _saving || _loading ? null : _pickDay,
              icon: const Icon(Icons.calendar_month_rounded),
              label: Padding(
                padding: const EdgeInsets.all(12),
                child: Text(date),
              ),
            ),
            Wrap(
              spacing: 10,
              children: [
                TextButton(
                  onPressed: _saving || _loading
                      ? null
                      : () => _load(
                          DateTime(today.year, today.month, today.day - 1),
                        ),
                  child: const Text('أمس'),
                ),
                TextButton(
                  onPressed: _saving || _loading ? null : () => _load(today),
                  child: const Text('اليوم'),
                ),
              ],
            ),
            if (_loading)
              const Center(child: CircularProgressIndicator())
            else ...[
              if (_resting)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Text('وضع الراحة مسجّل لليوم ده؛ تسجيل الصلاة متوقف.'),
                ),
              for (final prayer in _names.entries)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: HERCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          prayer.value,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            for (final choice in [
                              (0, 'لسه'),
                              (1, 'صليتها'),
                              (2, 'قضاء'),
                            ])
                              ChoiceChip(
                                key: Key('history-${prayer.key}-${choice.$1}'),
                                label: Text(choice.$2),
                                labelStyle: PhoneDesignTokens.uiText(
                                  fontSize: 13,
                                  color: context.herTheme.bodyPrimary,
                                  fontWeight: FontWeight.w700,
                                ),
                                backgroundColor: context.herTheme.cards.surface,
                                selectedColor: context.herTheme.actions.primary
                                    .withValues(alpha: .14),
                                checkmarkColor: context.herTheme.bodyPrimary,
                                selected:
                                    (_statuses[prayer.key] ?? 0) == choice.$1,
                                onSelected: _saving || _resting
                                    ? null
                                    : (_) => _save(prayer.key, choice.$1),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
            ],
            if (_error != null) Text(_error!),
          ],
        ),
      ),
    );
  }
}
