import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:provider/provider.dart';
import '../../core/build_info.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/ssdp_discovery.dart';
import '../../core/network/target_probe.dart';
import '../../core/theme/morph_colors.dart';
import '../../core/widgets/morph_widgets.dart';
import '../../providers/tv_models.dart';
import '../../providers/tv_provider.dart';
import '../../services/app_state.dart';

Future<void> _openSupportLink(BuildContext context, Uri uri) async {
  final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!opened && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(MorphLocalizations.of(context).get('linkOpenFailed')),
      ),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final t = MorphLocalizations.of(context);
    final app = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(automaticallyImplyLeading: false, title: Text(t.get('settingsTitle'))),
      body: ListView(
        padding: EdgeInsets.all(18),
        children: [
          GlassCard(
            child: SwitchListTile(
              title: Text(t.get('haptics')),
              value: app.haptics,
              activeColor: MorphColors.cyan,
              onChanged: (v) => app.setHaptics(v),
            ),
          ),
          SizedBox(height: 10),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t.get('language'),
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                SizedBox(height: 8),
                SegmentedButton<String>(
                  segments: [
                    ButtonSegment(value: 'en', label: Text('English')),
                    ButtonSegment(value: 'ar', label: Text('العربية')),
                  ],
                  selected: {app.localeCode},
                  onSelectionChanged: (s) => app.setLocale(s.first),
                ),
              ],
            ),
          ),
          SizedBox(height: 10),
          GlassCard(
            onTap: () => Navigator.of(context).pushNamed('/troubleshooting'),
            child: Row(
              textDirection: TextDirection.ltr,
              children: [
                Icon(Icons.help_outline, color: MorphColors.cyan),
                SizedBox(width: 12),
                Expanded(child: Text(t.get('troubleTitle'))),
                Icon(Icons.chevron_right, color: MorphColors.textMuted),
              ],
            ),
          ),
          SizedBox(height: 10),
          GlassCard(
            onTap: () => Navigator.of(context).pushNamed('/devices'),
            child: Row(
              textDirection: TextDirection.ltr,
              children: [
                Icon(Icons.tv, color: MorphColors.cyan),
                SizedBox(width: 12),
                Expanded(child: Text(t.get('devicesTitle'))),
                Icon(Icons.chevron_right, color: MorphColors.textMuted),
              ],
            ),
          ),
          SizedBox(height: 10),
          GlassCard(
            glow: true,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  textDirection: TextDirection.ltr,
                  children: [
                    Icon(Icons.favorite_outline, color: MorphColors.cyan),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        t.get('contactSupport'),
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 10),
                Text(
                  t.get('supportPrompt'),
                  style: TextStyle(
                    color: MorphColors.textSecondary,
                    height: 1.4,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  t.get('supportOptional'),
                  style: TextStyle(fontSize: 12, color: MorphColors.textMuted),
                ),
                SizedBox(height: 14),
                Material(
                  color: MorphColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () => _openSupportLink(
                      context,
                      Uri(
                        scheme: 'mailto',
                        path: 'support@morph-tv.com',
                        queryParameters: {'subject': 'Morph Remote support'},
                      ),
                    ),
                    child: Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 11,
                      ),
                      child: Row(
                        textDirection: TextDirection.ltr,
                        children: [
                          Icon(Icons.mail_outline, color: MorphColors.cyan),
                          SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  t.get('contactUs'),
                                  style: TextStyle(fontSize: 12),
                                ),
                                SizedBox(height: 2),
                                Directionality(
                                  textDirection: TextDirection.ltr,
                                  child: Text(
                                    'support@morph-tv.com',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: MorphColors.textPrimary,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            Icons.open_in_new,
                            size: 18,
                            color: MorphColors.textMuted,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                SizedBox(height: 14),
                Text(
                  t.get('supportWith'),
                  style: TextStyle(
                    fontSize: 12,
                    color: MorphColors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 8),
                Row(
                  textDirection: TextDirection.ltr,
                  children: [
                    Expanded(
                      child: _SupportButton(
                        icon: Icons.account_balance_wallet_outlined,
                        label: t.get('supportInstaPay'),
                        onPressed: () => _openSupportLink(
                          context,
                          Uri.parse(
                            'https://ipn.eg/S/hsn.shehata/instapay/5hnldB',
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 7),
                    Expanded(
                      child: _SupportButton(
                        icon: Icons.credit_card_outlined,
                        label: t.get('supportStripe'),
                        onPressed: () => _openSupportLink(
                          context,
                          Uri.parse(
                            'https://donate.stripe.com/9B66oI2xb4yCdar0VB6EU03',
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 7),
                    Expanded(
                      child: _SupportButton(
                        icon: Icons.payments_outlined,
                        label: t.get('supportPayPal'),
                        onPressed: () => _openSupportLink(
                          context,
                          Uri.parse(
                            'https://www.paypal.com/donate/?business=lynkomentor%40gmail.com&currency_code=CAD',
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 14),
                Center(
                  child: Text(
                    t.get('developedBy'),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      color: MorphColors.textMuted,
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 16),
          Text(
            'Morph Remote ${BuildInfo.short} • No account • LAN only • Secrets in Keychain/Keystore',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, color: MorphColors.textMuted),
          ),
        ],
      ),
    );
  }
}

class _SupportButton extends StatelessWidget {
  const _SupportButton({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => OutlinedButton.icon(
    onPressed: onPressed,
    icon: Icon(icon, size: 16),
    label: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
    style: OutlinedButton.styleFrom(
      foregroundColor: MorphColors.textPrimary,
      side: BorderSide(color: MorphColors.surfaceLight),
      padding: EdgeInsets.symmetric(horizontal: 5, vertical: 10),
      textStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
      visualDensity: VisualDensity.compact,
    ),
  );
}

class TroubleshootingScreen extends StatefulWidget {
  const TroubleshootingScreen({super.key});
  @override
  State<TroubleshootingScreen> createState() => _TroubleshootingScreenState();
}

class _TroubleshootingScreenState extends State<TroubleshootingScreen> {
  final _ip = TextEditingController();
  TvBrand _brand = TvBrand.samsung;

  static final _steps = [
    '1. Phone and TV must be on the SAME Wi-Fi network (not guest / not mobile data).',
    '2. Turn the TV ON with its physical remote first — many TVs disable network services in standby.',
    '3. Samsung: allow the “New device wants to connect” popup. Enable Settings → General → External Device Manager → Device Connection Manager → Access Notification → First Time Only.',
    '4. LG webOS: accept the pairing prompt on the TV. If declined, open the TV’s Mobile Connection settings and remove old entries, then retry.',
    '5. Android/Google TV: open Settings → Network → Remote / Chromecast built-in must be ON. Read the 6-digit PIN from the TV screen.',
    '6. Restart the TV (full power cycle) and the phone’s Wi-Fi if the TV does not appear.',
    '7. Mesh routers: ensure AP isolation / client isolation is OFF.',
    '8. VPN on the phone blocks discovery — turn it off while scanning.',
    '9. Power-ON over Wi-Fi only works when the TV supports Wake-on-LAN and wired LAN + “Mobile TV On” is enabled — otherwise use the physical remote to power on.',
  ];

  @override
  void dispose() {
    _ip.dispose();
    super.dispose();
  }

  List<TargetCheck>? _probe;
  bool _probing = false;

  Future<void> _runProbe() async {
    final ip = _ip.text.trim();
    if (ip.isEmpty) return;
    setState(() {
      _probing = true;
      _probe = null;
    });
    try {
      final res = await TargetProbe.probeHost(ip);
      if (mounted) {
        setState(() {
          _probe = res;
          _probing = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _probing = false;
          _probe = [TargetCheck('probe', false, 'probe crashed')];
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = MorphLocalizations.of(context);
    final app = context.watch<AppState>();
    final s = app.lastStats;
    final diag = StringBuffer()
      ..writeln(
        'Morph Remote diagnostics ${BuildInfo.short} '
        '(${BuildInfo.discoveryImpl})',
      )
      ..writeln('Wi-Fi: ${app.net.wifi ? "yes" : "NO"}')
      ..writeln(
        'Local IP: ${app.net.localIp ?? "unknown"} '
        '(${app.net.interfaceName ?? "no iface"})',
      )
      ..writeln('Subnet: ${app.net.subnet}')
      ..writeln('VPN likely: ${app.net.vpnLikely ? "YES (turn off)" : "no"}')
      ..writeln(s.summary())
      ..writeln('Last connection attempt:')
      ..writeln(app.lastConnectionLog);
    return Scaffold(
      appBar: AppBar(automaticallyImplyLeading: false, title: Text(t.get('troubleTitle'))),
      body: ListView(
        padding: EdgeInsets.all(18),
        children: [
          GlassCard(
            glow: true,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  textDirection: TextDirection.ltr,
                  children: [
                    Icon(Icons.network_check, color: MorphColors.cyan),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        t.isArabic ? 'نتيجة آخر بحث' : 'Last scan report',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Copy report',
                      icon: Icon(Icons.copy, size: 18),
                      onPressed: () async {
                        await Clipboard.setData(
                          ClipboardData(text: diag.toString()),
                        );
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Report copied')),
                          );
                        }
                      },
                    ),
                  ],
                ),
                SizedBox(height: 8),
                SelectableText(
                  diag.toString(),
                  style: TextStyle(
                    fontSize: 12,
                    fontFamily: 'monospace',
                    height: 1.5,
                  ),
                ),
                SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    icon: Icon(Icons.refresh, size: 18),
                    label: Text(app.scanning ? 'Scanning…' : 'Run scan again'),
                    onPressed: app.scanning ? null : () => app.scan(),
                  ),
                ),
                SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    icon: Icon(Icons.radar, size: 18),
                    label: Text(
                      app.scanning
                          ? 'Scanning…'
                          : 'Deep network scan (checks every address)',
                    ),
                    onPressed: app.scanning ? null : () => app.deepScan(),
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Deep scan probes each address directly — slower and chatty. Use it only when the normal scan finds nothing.',
                  style: TextStyle(fontSize: 11, color: MorphColors.textMuted),
                ),
              ],
            ),
          ),
          SizedBox(height: 10),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t.get('manualTitle'),
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
                SizedBox(height: 4),
                Text(
                  'Only needed when auto-discovery cannot see your TV.',
                  style: TextStyle(
                    fontSize: 12,
                    color: MorphColors.textSecondary,
                  ),
                ),
                SizedBox(height: 10),
                TextField(
                  controller: _ip,
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(hintText: t.get('ipHint')),
                ),
                SizedBox(height: 10),
                DropdownButtonFormField<TvBrand>(
                  initialValue: _brand,
                  items: TvBrand.values
                      .where(
                        (b) =>
                            b == TvBrand.samsung ||
                            b == TvBrand.lg ||
                            b == TvBrand.androidTv ||
                            b == TvBrand.roku ||
                            b == TvBrand.sony,
                      )
                      .map(
                        (b) => DropdownMenuItem(
                          value: b,
                          child: Text(brandLabel(b)),
                        ),
                      )
                      .toList(),
                  onChanged: (v) =>
                      setState(() => _brand = v ?? TvBrand.samsung),
                ),
                SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      final ip = _ip.text.trim();
                      if (ip.isEmpty) return;
                      Navigator.of(context).pushNamed(
                        '/pairing',
                        arguments: TvDevice(
                          id: 'manual-$ip-${_brand.name}',
                          name: '${brandLabel(_brand)} TV',
                          brand: _brand,
                          protocol: protocolForBrand(_brand),
                          ip: ip,
                          port: SsdpDiscovery.defaultPortFor(_brand),
                        ),
                      );
                    },
                    child: Text(t.get('connect')),
                  ),
                ),
                SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    icon: _probing
                        ? SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Icon(Icons.radar, size: 18),
                    label: Text(
                      _probing
                          ? 'Probing…'
                          : 'Probe this IP (safe single-TV test)',
                    ),
                    onPressed: (_probing || _ip.text.trim().isEmpty)
                        ? null
                        : _runProbe,
                  ),
                ),
                if (_probe != null) ...[
                  SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: SelectableText(
                      _probe!.join('\n'),
                      style: TextStyle(
                        fontSize: 11,
                        fontFamily: 'monospace',
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          SizedBox(height: 10),
          ..._steps.map(
            (s) => Padding(
              padding: EdgeInsets.only(bottom: 10),
              child: GlassCard(child: Text(s, style: TextStyle(height: 1.5))),
            ),
          ),
        ],
      ),
    );
  }
}
