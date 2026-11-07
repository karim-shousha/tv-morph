import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/storage/saved_devices_repo.dart';
import '../../core/theme/morph_colors.dart';
import '../../core/widgets/morph_widgets.dart';
import '../../providers/tv_models.dart';
import '../../providers/samsung/samsung_endpoint.dart';
import '../../providers/samsung/samsung_provider.dart';
import '../../providers/tv_provider.dart';
import '../../services/app_state.dart';

/// One-tap pairing: starts automatically, shows only the single step the
/// user must do (allow on TV / enter PIN), then opens the remote.
/// No protocol pickers, no IP addresses, no technical jargon.
class PairingScreen extends StatefulWidget {
  const PairingScreen({super.key});
  @override
  State<PairingScreen> createState() => _PairingScreenState();
}

class _PairingScreenState extends State<PairingScreen> {
  PairingState _state = PairingState.idle;
  String? _error;
  final _pin = TextEditingController();
  TvProvider? _provider;
  bool _started = false;
  bool _androidPairingStarted = false;
  bool _providerTransferred = false;

  TvDevice get device => ModalRoute.of(context)!.settings.arguments as TvDevice;

  bool get needsPin => device.brand == TvBrand.androidTv;
  bool get needsPsk => device.brand == TvBrand.sony;
  bool get needsCode => needsPin || needsPsk;

  /// Expected code shape per brand (null = free text).
  int? get codeLength => needsPin ? 6 : null;

  String codeHint(MorphStrings t) => needsPsk
      ? (t.isArabic
            ? 'مفتاح الاتصال من إعدادات شبكة التلفزيون'
            : 'Pre-Shared Key from TV network settings')
      : t.get('pinHint');

  String codeInstruction() => needsPsk
      ? (MorphLocalizations.of(context).isArabic
            ? 'اكتب مفتاح الاتصال الموجود في إعدادات التلفزيون.'
            : 'Enter the Pre-Shared Key shown in your TV settings.')
      : (MorphLocalizations.of(context).isArabic
            ? 'اكتب الكود الظاهر على التلفزيون.'
            : 'Enter the code shown on your TV.');

  /// Plain-language instruction per brand.
  String instruction(MorphStrings t) {
    // UPnP baseline needs no approval and no code — verification only.
    if (device.protocol == TvProtocol.dlnaRenderer) {
      return 'Basic control — volume and playback. No pairing needed.';
    }
    return switch (device.brand) {
      TvBrand.samsung => 'Please select Allow on your TV.',
      TvBrand.lg => 'Please accept the connection request on your TV.',
      TvBrand.androidTv => 'Enter the code shown on your TV.',
      TvBrand.roku =>
        'No approval needed — just make sure “Control by mobile apps” is enabled on the TV (Settings → System → Advanced system settings).',
      TvBrand.sony =>
        'Enter the Pre-Shared Key from your TV (Settings → Network → IP control).',
      // Companion-only / unsupported TVs never reach pairing (handled in
      // discovery), but the switch must stay exhaustive.
      TvBrand.vidaa => 'VIDAA TVs expose no open remote API.',
      TvBrand.fireTv =>
        'On Fire TV, turn on Settings → My Fire TV → Developer Options → ADB Debugging.',
      TvBrand.companion => 'Open Morph TV on your TV to continue.',
      TvBrand.unknown => t.get('pairingSamsungBody'),
    };
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_started) {
      _started = true;
      if (device.brand == TvBrand.fireTv) {
        // Fire OS shows its one-time ADB trust dialog on the TV. Give the
        // user time to bring the TV home screen to the foreground first;
        // fullscreen launcher apps can obscure that system dialog.
        _state = PairingState.idle;
      } else if (needsCode) {
        // Android TV displays its code only after the app opens the pairing
        // channel, so begin the handshake before showing the code field.
        setState(() => _state = PairingState.enteringPin);
        if (needsPin) {
          WidgetsBinding.instance.addPostFrameCallback((_) => _start());
        }
      } else {
        WidgetsBinding.instance.addPostFrameCallback((_) => _start());
      }
    }
  }

  void _onStage() {
    if (mounted) setState(() {});
  }

  bool get _samsungAwaitingApproval =>
      _provider is SamsungProvider &&
      (_provider as SamsungProvider).stage == SamsungStage.awaitingApproval;

  bool get _samsungPreApproval =>
      device.brand == TvBrand.samsung &&
      _state == PairingState.pairing &&
      !_samsungAwaitingApproval;

  /// Headline: the approval prompt appears ONLY at the authorization
  /// stage. Before that (resolving/connecting) we show a connecting
  /// message — never "Allow on TV" on a refused socket.
  String _headline(MorphStrings t) {
    if (_state == PairingState.paired) return t.get('connected');
    if (device.brand == TvBrand.fireTv && _state == PairingState.idle) {
      return t.get('fireTvReady');
    }
    if (needsCode && _state == PairingState.enteringPin && _error == null) {
      return codeInstruction();
    }
    if (_samsungPreApproval) return 'Connecting to your TV…';
    return instruction(t);
  }

  String _subline(MorphStrings t) {
    if (_state == PairingState.paired) return 'Opening your remote…';
    if (device.brand == TvBrand.fireTv && _state == PairingState.idle) {
      return t.get('fireTvSetup');
    }
    if (needsPin && _state == PairingState.enteringPin) {
      return 'The pairing code should now be visible on your TV.';
    }
    if (_samsungPreApproval) return 'Finding the remote service…';
    if (_samsungAwaitingApproval) {
      return 'Waiting for TV approval — check your TV screen.';
    }
    if (device.brand == TvBrand.fireTv && _state == PairingState.pairing) {
      return t.get('fireTvWait');
    }
    if (_state == PairingState.pairing) return 'Waiting for your TV…';
    return 'Keep this screen open.';
  }

  Future<void> _start({String? pin}) async {
    final t = MorphLocalizations.of(context);
    final app = context.read<AppState>();
    final startingAndroidHandshake =
        needsPin && pin == null && !_androidPairingStarted;
    if (needsCode && !startingAndroidHandshake) {
      final code = (pin ?? '').trim();
      final ok = needsPin
          ? RegExp(r'^[0-9A-Fa-f]{6}$').hasMatch(code)
          : code.isNotEmpty;
      if (!ok) {
        setState(() {
          _state = PairingState.enteringPin;
          _error = pin == null ? null : t.get('wrongPin');
        });
        return;
      }
    }
    setState(() {
      _state = PairingState.pairing;
      _error = null;
    });
    try {
      final secret = await SecureStore().readSecret(device.id);
      // Dispose any previous stage listener before replacing the provider.
      if (_provider is SamsungProvider) {
        (_provider as SamsungProvider).stageListenable.removeListener(_onStage);
      }
      if (!needsPin || _provider == null) {
        _provider = app.buildProvider(device, secret: secret);
        if (_provider is SamsungProvider) {
          (_provider as SamsungProvider).stageListenable.addListener(_onStage);
        }
      }
      final res = await _provider!
          .pair(pin: pin)
          .timeout(
            Duration(
              seconds:
                  device.brand == TvBrand.samsung ||
                      device.brand == TvBrand.fireTv
                  ? 75
                  : 40,
            ),
          );
      if (!mounted) return;
      if (needsPin && !res.success && res.state == PairingState.enteringPin) {
        _androidPairingStarted = true;
        setState(() {
          _state = PairingState.enteringPin;
          _error = null;
        });
        return;
      }
      if (res.success) {
        if (res.clientKey != null) {
          await SecureStore().saveSecret(device.id, res.clientKey!);
        }
        setState(() => _state = PairingState.paired);
        await app.repo.upsert(device);
        if (device.brand == TvBrand.fireTv) {
          // ADB pairing already leaves an authenticated connection open.
          // Reuse it so Fire TV doesn't show a second connect/approval cycle.
          await app.adoptConnectedProvider(device, _provider!);
          _providerTransferred = true;
        } else {
          await app.selectAndConnect(device);
        }
        if (!mounted) return;
        if (app.connStatus != ConnectionStatus.connected) {
          setState(() {
            _state = PairingState.failed;
            _error =
                'Pairing succeeded, but the remote connection failed. Check the TV is still on and retry.';
          });
          return;
        }
        Navigator.of(context).pushNamedAndRemoveUntil('/remote', (_) => false);
      } else {
        if (needsPin) {
          _androidPairingStarted = false;
          _pin.clear();
        }
        setState(() {
          _state = res.state;
          _error = res.state == PairingState.timeout
              ? t.get('timeout')
              : res.state == PairingState.denied
              ? t.get('permissionDenied')
              : (res.message ?? t.get('wrongPin'));
        });
      }
    } catch (e) {
      if (!mounted) return;
      if (needsPin) {
        _androidPairingStarted = false;
        _pin.clear();
      }
      setState(() {
        _state = PairingState.failed;
        _error = t.get('timeout');
      });
    }
  }

  @override
  void dispose() {
    if (_provider is SamsungProvider) {
      (_provider as SamsungProvider).stageListenable.removeListener(_onStage);
    }
    if (!_providerTransferred) _provider?.disconnect();
    _pin.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = MorphLocalizations.of(context);
    final d = device;
    final waiting = _state == PairingState.pairing;
    return Scaffold(
      appBar: AppBar(automaticallyImplyLeading: false, title: Text(d.name)),
      body: LayoutBuilder(
        builder: (context, viewport) => SingleChildScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: EdgeInsets.all(18),
          child: ConstrainedBox(
            key: const ValueKey("pairing-glass-card"),
            constraints: BoxConstraints(
              minHeight: (MediaQuery.sizeOf(context).height - 170).clamp(
                420.0,
                560.0,
              ),
              maxWidth: 520,
            ),
            child: Container(
              padding: EdgeInsets.all(22),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: MorphColors.light
                      ? const [Colors.white, Colors.white]
                      : const [Color(0x30D2E4FF), Color(0x5013233D)],
                ),
                border: Border.all(color: MorphColors.surfaceLight),
              ),
              child: IntrinsicHeight(
                child: Column(
                  children: [
                    SizedBox(height: 8),
                    SizedBox(
                      height: 64,
                      child: Center(
                        child: waiting
                            ? const CircularProgressIndicator()
                            : _state == PairingState.paired
                            ? Icon(
                                Icons.check_circle,
                                color: MorphColors.success,
                                size: 54,
                              )
                            : const MorphLogo(size: 64),
                      ),
                    ),
                    SizedBox(height: 20),
                    Text(
                      _headline(t),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      _subline(t),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: MorphColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    if (needsCode && _state != PairingState.paired) ...[
                      SizedBox(height: 22),
                      TextField(
                        controller: _pin,
                        enabled: !waiting,
                        key: const ValueKey("pairing-code-input"),
                        keyboardType: TextInputType.visiblePassword,
                        textCapitalization: TextCapitalization.characters,
                        autocorrect: false,
                        enableSuggestions: false,
                        maxLength: codeLength,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 10,
                        ),
                        decoration: InputDecoration(hintText: codeHint(t)),
                        onSubmitted: (v) => _start(pin: v.trim()),
                      ),
                    ],
                    if (_error != null) ...[
                      SizedBox(height: 14),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: MorphColors.danger),
                      ),
                      TextButton(
                        onPressed: () =>
                            Navigator.of(context).pushNamed('/troubleshooting'),
                        child: Text(
                          'Having trouble? Open diagnostics',
                          style: TextStyle(color: MorphColors.cyan),
                        ),
                      ),
                    ],
                    Spacer(),
                    if (waiting)
                      const SizedBox(height: 52)
                    else if (_state == PairingState.failed ||
                        _state == PairingState.timeout ||
                        _state == PairingState.denied)
                      MorphPrimaryButton(
                        label: t.get('retry'),
                        icon: Icons.refresh,
                        onPressed: () => needsCode
                            ? _start(
                                pin: _pin.text.trim().isEmpty
                                    ? null
                                    : _pin.text.trim(),
                              )
                            : _start(),
                      )
                    else if (device.brand == TvBrand.fireTv &&
                        _state == PairingState.idle)
                      MorphPrimaryButton(
                        label: t.get('fireTvConnect'),
                        icon: Icons.link,
                        onPressed: _start,
                      )
                    else if (needsCode &&
                        !waiting &&
                        _state != PairingState.paired)
                      MorphPrimaryButton(
                        label: t.get('connect'),
                        icon: Icons.link,
                        onPressed: () => _start(pin: _pin.text.trim()),
                      )
                    else if (!waiting && _state != PairingState.paired)
                      SizedBox.shrink(),
                    if (_error != null || needsCode) ...[
                      SizedBox(height: 10),
                      TextButton(
                        onPressed: () {
                          _provider?.disconnect();
                          Navigator.pop(context);
                        },
                        child: Text(t.get('cancel')),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
