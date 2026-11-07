import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/theme/morph_colors.dart';
import '../../core/widgets/morph_widgets.dart';
import '../../providers/tv_models.dart';
import '../../services/app_state.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final t = MorphLocalizations.of(context);
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(color: Colors.transparent),
        child: SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(height: 12),
                  MorphLogo(size: 54),
                  SizedBox(height: 8),
                  Text(
                    t.isArabic ? 'ريموت التلفزيون' : 'TV remote',
                    style: TextStyle(
                      fontSize: 13,
                      color: MorphColors.textSecondary,
                    ),
                  ),
                  SizedBox(height: 28),
                  Text(
                    t.get('headline'),
                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 10),
                  Text(
                    t.get('welcomeBody'),
                    style: TextStyle(
                      fontSize: 14,
                      color: MorphColors.textSecondary,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 26),
                  MorphPrimaryButton(
                    label: t.get('findMyTv'),
                    icon: Icons.wifi_find,
                    onPressed: () =>
                        Navigator.of(context).pushNamed('/discovery'),
                  ),
                  SizedBox(height: 12),
                  const _ReconnectButton(),
                  SizedBox(height: 8),
                  Text(
                    'Samsung  •  LG  •  Android TV',
                    style: TextStyle(
                      fontSize: 12,
                      color: MorphColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ReconnectButton extends StatefulWidget {
  const _ReconnectButton();
  @override
  State<_ReconnectButton> createState() => _ReconnectButtonState();
}

class _ReconnectButtonState extends State<_ReconnectButton> {
  bool _busy = false;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      final app = context.read<AppState>();
      if (app.lastTv == null) return;
      setState(() => _busy = true);
      final connected = await app.autoReconnect();
      if (!mounted) return;
      setState(() => _busy = false);
      if (connected && (ModalRoute.of(context)?.isCurrent ?? false))
        Navigator.of(context).pushNamedAndRemoveUntil('/remote', (_) => false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final TvDevice? last = app.lastTv;
    if (last == null) return SizedBox.shrink();
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        icon: _busy
            ? SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Icon(Icons.history, size: 18),
        label: Text(
          _busy
              ? (MorphLocalizations.of(context).isArabic
                    ? 'جارٍ الاتصال…'
                    : 'Connecting…')
              : (MorphLocalizations.of(context).isArabic
                    ? 'متابعة مع ${last.displayName}'
                    : 'Continue with ${last.displayName}'),
        ),
        style: OutlinedButton.styleFrom(
          minimumSize: Size(double.infinity, 50),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        onPressed: _busy
            ? null
            : () async {
                setState(() => _busy = true);
                final ok = await app.autoReconnect();
                if (!mounted) return;
                setState(() => _busy = false);
                if (ok) {
                  Navigator.of(
                    context,
                  ).pushNamedAndRemoveUntil('/remote', (_) => false);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        'TV is offline or unreachable — tap Find My TV to search again.',
                      ),
                    ),
                  );
                }
              },
      ),
    );
  }
}
