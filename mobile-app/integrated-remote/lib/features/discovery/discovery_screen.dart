import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/theme/morph_colors.dart';
import '../../core/widgets/morph_widgets.dart';
import '../../providers/registry.dart';
import '../../providers/tv_models.dart';
import '../../services/app_state.dart';

/// Simplified flow: auto-scan on entry, TVs appear progressively,
/// tap a TV → pairing → remote. No protocol pickers, no manual IP here
/// (manual entry lives under Troubleshooting).
class DiscoveryScreen extends StatefulWidget {
  /// Set to true in widget tests to avoid real network scans.
  static bool disableAutoScan = false;
  const DiscoveryScreen({super.key});
  @override
  State<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends State<DiscoveryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (DiscoveryScreen.disableAutoScan) return;
      context.read<AppState>().scan();
    });
  }

  IconData _brandIcon(TvBrand b) => switch (b) {
    TvBrand.samsung => Icons.tv,
    TvBrand.lg => Icons.smart_display,
    TvBrand.androidTv => Icons.android,
    TvBrand.roku => Icons.stream,
    TvBrand.sony => Icons.connected_tv,
    TvBrand.vidaa => Icons.tv_outlined,
    TvBrand.fireTv => Icons.tv_outlined,
    TvBrand.companion => Icons.play_circle_outline,
    TvBrand.unknown => Icons.tv_outlined,
  };

  /// Route a tap by device class: native → pairing; companion-only or
  /// unsupported → an honest explanation (never a dead end).
  void _onTapDevice(BuildContext context, TvDevice d) {
    final ar = MorphLocalizations.of(context).isArabic;
    final cls = classifyDevice(d);
    if (cls == DeviceClass.fullNative || cls == DeviceClass.partialNative) {
      Navigator.of(context).pushNamed('/pairing', arguments: d);
      return;
    }
    final title = cls == DeviceClass.companionOnly
        ? d.displayName
        : '${d.displayName} — ${ar ? 'غير مدعوم' : 'not supported'}';
    final englishBody = cls == DeviceClass.companionOnly
        ? 'Morph TV is installed on this screen, but no native TV remote '
              'service was found. Open Morph TV on the TV to use its own '
              'companion control, or pair a native remote if the TV '
              'supports Samsung / LG / Android TV / Roku / Sony control.'
        : describeDevice(d);
    final body = !ar
        ? englishBody
        : cls == DeviceClass.companionOnly
        ? 'تطبيق Morph TV موجود على الشاشة، لكن لم نعثر على خدمة ريموت مدعومة. افتح Morph TV على التلفزيون للتحكم من خلاله، أو راجع مساعدة الربط.'
        : 'التحكم في هذا الجهاز غير متاح من الريموت حاليًا. راجع مساعدة الربط لمعرفة الأجهزة المدعومة.';
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(ar ? 'تمام' : 'OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = MorphLocalizations.of(context);
    final app = context.watch<AppState>();
    final englishStatus = app.scanning
        ? (app.discovered.isEmpty
              ? 'Searching for TVs…'
              : 'Found ${app.discovered.length} — still searching…')
        : (app.discovered.isEmpty
              ? 'No TVs found'
              : '${app.discovered.length} TV${app.discovered.length == 1 ? '' : 's'} found');
    final count = app.discovered.length;
    final statusLine = !t.isArabic
        ? englishStatus
        : app.scanning
        ? (count == 0
              ? 'جارٍ البحث عن التلفزيونات…'
              : 'تم العثور على $count جهاز · البحث مستمر…')
        : (count == 0 ? 'لم نعثر على تلفزيون' : 'تم العثور على $count جهاز');
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(automaticallyImplyLeading: false, 
        title: Text(t.isArabic ? 'الأجهزة' : 'Devices'),
        actions: [
          IconButton(
            tooltip: t.isArabic ? 'مساعدة الربط' : 'Connection help',
            icon: Icon(Icons.help_outline_rounded, color: MorphColors.cyan),
            onPressed: () =>
                Navigator.of(context).pushNamed('/troubleshooting'),
          ),
          IconButton(
            tooltip: t.isArabic ? 'الإعدادات' : 'Settings',
            icon: Icon(Icons.settings_outlined, color: MorphColors.purple),
            onPressed: () => Navigator.of(context).pushNamed('/settings'),
          ),
        ],
      ),
      body: SafeArea(
        top: false,
        bottom: true,
        child: Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: Column(
            children: [
              Text(
                t.isArabic ? 'ابحث عن تلفزيونك' : t.get('discoveryTitle'),
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
              ),
              SizedBox(height: 6),
              Row(
                textDirection: TextDirection.ltr,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (app.scanning)
                    SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  if (app.scanning) SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      statusLine,
                      style: TextStyle(
                        color: MorphColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
              if (!app.net.wifi)
                Padding(
                  padding: EdgeInsets.only(top: 10),
                  child: GlassCard(
                    child: Row(
                      textDirection: TextDirection.ltr,
                      children: [
                        Icon(
                          Icons.warning_amber,
                          color: MorphColors.warning,
                          size: 20,
                        ),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            t.isArabic
                                ? 'وصّل الموبايل والتلفزيون بنفس شبكة Wi-Fi، ثم أعد الفحص.'
                                : 'Connect your phone and TV to the same Wi-Fi, then scan again.',
                            style: TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              SizedBox(height: 14),
              Expanded(
                child: app.discovered.isEmpty && !app.scanning
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              t.get('noDevices'),
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: MorphColors.textSecondary,
                              ),
                            ),
                            SizedBox(height: 10),
                            TextButton(
                              onPressed: () => Navigator.of(
                                context,
                              ).pushNamed('/troubleshooting'),
                              child: Text(
                                t.isArabic
                                    ? 'محتاج مساعدة في الربط؟'
                                    : 'Having trouble? Open connection help',
                                style: TextStyle(color: MorphColors.cyan),
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        itemCount: app.discovered.length,
                        separatorBuilder: (_, __) => SizedBox(height: 10),
                        itemBuilder: (_, i) {
                          final d = app.discovered[i];
                          final hasCompanion = d.extras['companion'] == 'true';
                          final cls = classifyDevice(d);
                          final tappable =
                              cls == DeviceClass.fullNative ||
                              cls == DeviceClass.partialNative;
                          return GlassCard(
                            onTap: () => _onTapDevice(context, d),
                            child: Row(
                              textDirection: TextDirection.ltr,
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: MorphColors.surfaceLight,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    _brandIcon(d.brand),
                                    color: tappable
                                        ? MorphColors.cyan
                                        : MorphColors.textMuted,
                                  ),
                                ),
                                SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        textDirection: TextDirection.ltr,
                                        children: [
                                          Flexible(
                                            child: Text(
                                              d.name,
                                              style: TextStyle(
                                                fontWeight: FontWeight.w700,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          if (hasCompanion) ...[
                                            SizedBox(width: 6),
                                            Container(
                                              padding: EdgeInsets.symmetric(
                                                horizontal: 7,
                                                vertical: 2,
                                              ),
                                              decoration: BoxDecoration(
                                                color: MorphColors.success
                                                    .withValues(alpha: 0.18),
                                                borderRadius:
                                                    BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                'Morph TV ✓',
                                                style: TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w700,
                                                  color: MorphColors.success,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                      Text(
                                        [
                                          brandLabel(d.brand),
                                          if (d.model?.isNotEmpty == true)
                                            d.model!,
                                        ].join(' · '),
                                        textDirection: TextDirection.ltr,
                                        textAlign: t.isArabic
                                            ? TextAlign.right
                                            : TextAlign.left,
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: MorphColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(
                                  tappable
                                      ? (t.isArabic
                                            ? Icons.chevron_left
                                            : Icons.chevron_right)
                                      : Icons.info_outline,
                                  color: MorphColors.textMuted,
                                  textDirection: TextDirection.ltr,
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
              SizedBox(height: 12),
              Padding(
                padding: EdgeInsets.only(bottom: 26),
                child: MorphPrimaryButton(
                  label: app.scanning ? t.get('stop') : t.get('scanAgain'),
                  icon: app.scanning
                      ? Icons.stop_circle_outlined
                      : Icons.refresh_rounded,
                  onPressed: () {
                    if (app.scanning) {
                      app.stopScan();
                    } else {
                      app.scan();
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
