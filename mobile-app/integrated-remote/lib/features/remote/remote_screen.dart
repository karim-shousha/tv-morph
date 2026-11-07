import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/morph_colors.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/widgets/dpad.dart';
import '../../providers/tv_models.dart';
import '../../services/app_state.dart';

String _label(BuildContext context, String en, String ar) =>
    MorphLocalizations.of(context).isArabic ? ar : en;

Color _symbolColor(IconData icon) => icon==Icons.power_settings_new_rounded ? MorphColors.danger : MorphColors.palette.link;

class RemoteScreen extends StatefulWidget {
  const RemoteScreen({super.key});

  @override
  State<RemoteScreen> createState() => _RemoteScreenState();
}

class _RemoteScreenState extends State<RemoteScreen> {
  TvKey? _activeKey = TvKey.home;
  bool _touchpadMode = false;
  bool _mediaPlaying = false;
  bool _mediaPending = false;
  final _playbackRevision = ValueNotifier<int>(0);
  @override
  void dispose() {
    _playbackRevision.dispose();
    super.dispose();
  }

  Future<void> _showKeyboard(BuildContext context, AppState app) async {
    try {
      await const MethodChannel(
        'morph_tv/host',
      ).invokeMethod<bool>('classicKeyboard', {'ip': app.selected?.ip});
    } on PlatformException {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _label(
                context,
                'Link this TV using its Morph code from Devices first.',
                'اربط نفس التلفزيون بكود Morph من صفحة الأجهزة أولًا.',
              ),
            ),
          ),
        );
      }
    } on MissingPluginException {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _label(
                context,
                'Open the original keyboard from the Morph TV remote page.',
                'افتح الكيبورد الأصلية من صفحة ريموت Morph TV.',
              ),
            ),
          ),
        );
      }
    }
  }

  Future<bool> _key(BuildContext context, TvKey key) async {
    setState(() => _activeKey = key);
    final app = context.read<AppState>();
    if (app.haptics) HapticFeedback.selectionClick();
    return _run(
      context,
      () => app.sendRemoteAction((provider) => provider.sendKey(key)),
    );
  }

  Future<bool> _action(BuildContext context, Future<bool> Function() action) =>
      _run(
        context,
        () => context.read<AppState>().sendRemoteAction((_) => action()),
      );

  Future<bool> _dpadKey(BuildContext context, AppState app, TvKey key) {
    setState(() => _activeKey = key);
    return _action(context, () => app.sendKey(key));
  }

  Widget _modeToggle() => Tooltip(
    message: _touchpadMode
        ? _label(context, 'Use directional buttons', 'أزرار الاتجاهات')
        : _label(context, 'Switch to touchpad', 'التاتش باد'),
    child: Material(
      color: MorphColors.tone(0xFF173959, 0xFFFEFDFB),
      shape: CircleBorder(
        side: BorderSide(
          color: MorphColors.tone(0xFF2D78B6, 0xFFD7D2C9).withValues(alpha: .9),
        ),
      ),
      child: InkWell(
        customBorder: CircleBorder(),
        onTap: () => setState(() => _touchpadMode = !_touchpadMode),
        child: SizedBox(
          width: 44,
          height: 44,
          child: Icon(
            _touchpadMode ? Icons.gamepad_rounded : Icons.touch_app_rounded,
            color: MorphColors.tone(0xFF54B9FF, 0xFF617286),
            size: 20,
          ),
        ),
      ),
    ),
  );

  Future<bool> _run(
    BuildContext context,
    Future<bool> Function() action,
  ) async {
    final sent = await action();
    if (!sent && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _label(
              context,
              'TV did not acknowledge — check connection',
              'التلفزيون لم يستجب. راجع الاتصال وحاول تاني.',
            ),
          ),
        ),
      );
    }
    return sent;
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final device = app.selected;
    final caps = app.provider?.capabilities ?? TvCapabilities();
    final connected =
        device != null && app.connStatus == ConnectionStatus.connected;
    final compact = MediaQuery.sizeOf(context).height < 900;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          Positioned.fill(child: SizedBox.shrink()),
          LayoutBuilder(
            builder: (context, viewport) {
              final screenSize = MediaQuery.sizeOf(context);
              final width =
                  (viewport.maxWidth > 0
                      ? viewport.maxWidth
                      : screenSize.width) -
                  32;
              final height = viewport.maxHeight > 0
                  ? viewport.maxHeight
                  : screenSize.height * .84;
              // Scale against the actual safe viewport. The former .88 floor
              // could force the bottom app tiles off short phone screens.
              final scale = ((height - 24) / 740).clamp(.82, 1.04).toDouble();
              final contentWidth = width.clamp(120.0, 900.0).toDouble();
              final padSize =
                  ((contentWidth * .51)
                              .clamp(174.0, compact ? 194.0 : 210.0)
                              .toDouble() *
                          scale)
                      .clamp(120.0, contentWidth - 126.0)
                      .toDouble();
              final sideWidth = ((contentWidth - padSize - 18) / 2)
                  .clamp(54.0, 70.0)
                  .toDouble();
              const topHeight = 98.0;
              final navSize = (compact ? 66.0 : 72.0) * scale;
              final playbackHeight = 78 * scale;
              final appTileHeight = 76 * scale;
              final sectionGap =
                  ((height -
                              ((compact ? 116.0 : 128.0) * scale +
                                  topHeight +
                                  padSize * 1.04 +
                                  navSize +
                                  playbackHeight +
                                  appTileHeight +
                                  92 * scale)) /
                          5)
                      .clamp(12.0, 24.0)
                      .toDouble();
              return SizedBox.expand(child: FittedBox(fit: BoxFit.contain, alignment: Alignment.topCenter, child: SizedBox(width: contentWidth + 32, child: Padding(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    _deviceCard(
                      device?.displayName ??
                          _label(context, 'Choose your TV', 'اختار تلفزيونك'),
                      device == null
                          ? _label(
                              context,
                              'Tap to find or add a TV',
                              'اضغط للبحث أو إضافة تلفزيون',
                            )
                          : brandLabel(device.brand),
                      connected,
                      device == null || connected ? null : app.reconnect,
                      compact,
                      scale,
                      () => Navigator.of(context).pushNamed('/devices'),
                    ),
                    SizedBox(height: sectionGap),
                    Row(
                      textDirection: TextDirection.ltr,
                      children: [
                        _wideControl(
                          context,
                          Icons.input_rounded,
                          _label(context, 'INPUT', 'المداخل'),
                          caps.inputSelect && connected,
                          () => _key(context, TvKey.source),
                          44,
                          selected: _activeKey == TvKey.source,
                        ),
                        const SizedBox(width: 10),
                        _wideControl(
                          context,
                          Icons.more_horiz_rounded,
                          _label(context, 'MENU', 'القائمة'),
                          caps.menu && connected,
                          () => _key(context, TvKey.menu),
                          44,
                          selected: _activeKey == TvKey.menu,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      textDirection: TextDirection.ltr,
                      children: [
                        _wideControl(
                          context,
                          Icons.keyboard_outlined,
                          _label(context, 'KEYBOARD', 'الكيبورد'),
                          caps.keyboard && connected,
                          () async {
                            await _showKeyboard(context, app);
                            return true;
                          },
                          44,
                        ),
                        const SizedBox(width: 10),
                        _wideControl(
                          context,
                          Icons.dialpad_rounded,
                          _label(context, 'NUMBER PAD', 'الأرقام'),
                          caps.numericKeys && connected,
                          () async {
                            _showNumberPadSheet(context, app, scale);
                            return true;
                          },
                          44,
                        ),
                      ],
                    ),
                    SizedBox(height: sectionGap),
                    SizedBox(
                      height: (padSize * 1.04).clamp(190.0, 280.0).toDouble(),
                      child: Row(
                        textDirection: TextDirection.ltr,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          _sideControls(
                            width: sideWidth,
                            height: (padSize * .94).clamp(190.0, 260.0).toDouble(),
                            label: _label(context, 'VOL', 'الصوت'),
                            enabled: caps.volume && connected,
                            plusKey: TvKey.volumeUp,
                            minusKey: TvKey.volumeDown,
                            middleKey: TvKey.mute,
                            activeKey: _activeKey,
                            plus: () => _key(context, TvKey.volumeUp),
                            minus: () => _key(context, TvKey.volumeDown),
                            middle: _circleControl(
                              Icons.volume_off_rounded,
                              34 * scale,
                              caps.mute && connected
                                  ? () => _key(context, TvKey.mute)
                                  : null,
                            ),
                          ),
                          SizedBox(
                            width: padSize,
                            height: padSize,
                            child: Stack(
                              children: [
                                Positioned.fill(
                                  child: _touchpadMode
                                      ? TouchPad(
                                          diameter: padSize,
                                          enabled: caps.dpad && connected,
                                          onKey: (key) =>
                                              _dpadKey(context, app, key),
                                        )
                                      : DPad(
                                          diameter: padSize,
                                          caps: caps.copyWith(
                                            dpad: caps.dpad && connected,
                                          ),
                                          activeKey: _activeKey,
                                          onKey: (key) =>
                                              _dpadKey(context, app, key),
                                        ),
                                ),
                                Positioned(
                                  top: 0,
                                  right: 0,
                                  child: _modeToggle(),
                                ),
                              ],
                            ),
                          ),
                          _sideControls(
                            width: sideWidth,
                            height: (padSize * .94).clamp(190.0, 260.0).toDouble(),
                            label: _label(context, 'CH', 'القنوات'),
                            enabled: caps.channels && connected,
                            plusKey: TvKey.channelUp,
                            minusKey: TvKey.channelDown,
                            middleKey: TvKey.guide,
                            activeKey: _activeKey,
                            plus: () => _key(context, TvKey.channelUp),
                            minus: () => _key(context, TvKey.channelDown),
                            middle: _circleControl(
                              Icons.live_tv_rounded,
                              34 * scale,
                              caps.guide && connected
                                  ? () => _key(context, TvKey.guide)
                                  : null,
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: sectionGap),
                    Row(
                      textDirection: TextDirection.ltr,
                      children: [
                        _navCircleControl(
                          context,
                          Icons.undo_rounded,
                          _label(context, 'BACK', 'رجوع'),
                          caps.back && connected,
                          () => _key(context, TvKey.back),
                          navSize,
                        ),
                        _navCircleControl(
                          context,
                          Icons.home_rounded,
                          _label(context, 'HOME', 'الرئيسية'),
                          caps.home && connected,
                          () => _key(context, TvKey.home),
                          navSize,
                          selected: _activeKey == TvKey.home,
                        ),
                        _navCircleControl(
                          context,
                          Icons.search_rounded,
                          _label(context, 'SEARCH', 'بحث'),
                          caps.search && connected,
                          () => _key(context, TvKey.search),
                          navSize,
                        ),
                        _navCircleControl(
                          context,
                          Icons.live_tv_rounded,
                          _label(context, 'GUIDE', 'القنوات'),
                          caps.guide && connected,
                          () => _key(context, TvKey.guide),
                          navSize,
                        ),
                      ],
                    ),
                    SizedBox(height: sectionGap),
                    SizedBox(
                      height: playbackHeight,
                      child: _playbackBar(context, caps, connected, scale),
                    ),
                    SizedBox(height: 8 * scale),
                    Padding(
                      padding: EdgeInsets.only(bottom: 5 * scale),
                      child: Row(
                        textDirection: TextDirection.ltr,
                        children: [
                          Expanded(
                            child: Text(
                              _label(
                                context,
                                'Streaming Apps',
                                'تطبيقات المشاهدة',
                              ),
                              style: TextStyle(
                                color: MorphColors.tone(0xFF9AB5D4, 0xFF617286),
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    _streamingApps(
                      context,
                      app,
                      scale,
                      connected && caps.appLaunch,
                    ),
                  ],
                ),
              ))));
            },
          ),
        ],
      ),
    );
  }

  Widget _frosted(Widget child) => ClipRRect(borderRadius:BorderRadius.circular(16),child:child);

  Widget _deviceCard(
    String name,
    String type,
    bool connected,
    Future<void> Function()? reconnect,
    bool compact,
    double verticalScale,
    VoidCallback onTap,
  ) {
    return _frosted(
      InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          key: const ValueKey('remote-connected-card'),
          height:
              ((compact ? 80 : 88) * verticalScale)
                  .clamp(80.0, 96.0)
                  .toDouble() *
              (MediaQuery.textScalerOf(context).scale(14) / 14).clamp(1.0, 2.0),
          padding: EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: MorphColors.light ? Colors.white : const Color(0x16D4E5FF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: MorphColors.surfaceLight, width: 1),
          ),
          child: Row(
            textDirection: TextDirection.ltr,
            children: [
              Image.asset(
                'assets/connect-tv-premium.png',
                width: 56 * verticalScale,
                height: 48 * verticalScale,
                fit: BoxFit.contain,
                cacheWidth: 280,
              ),
              SizedBox(width: 10 * verticalScale),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 2),
                    if (name.toLowerCase() != type.toLowerCase())
                      Text(
                        type,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          color: connected
                              ? MorphColors.tone(0xFF9AA6C8, 0xFF617286)
                              : MorphColors.danger,
                        ),
                      ),
                    SizedBox(height: 4),
                    Row(
                      textDirection: TextDirection.ltr,
                      children: [
                        _statusDot(connected, size: 8),
                        SizedBox(width: 7),
                        Flexible(
                          child: Text(
                            connected
                                ? _label(
                                    context,
                                    'Connected',
                                    'متصل بالتلفزيون',
                                  )
                                : _label(
                                    context,
                                    'TAP TO RECONNECT',
                                    'اضغط لإعادة الاتصال',
                                  ),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              shadows: connected
                                  ? [
                                      const Shadow(
                                        color: Color(0x807CD6FF),
                                        blurRadius: 8,
                                      ),
                                    ]
                                  : null,
                              color: connected
                                  ? MorphColors.cyan
                                  : MorphColors.danger,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(
                constraints: const BoxConstraints(minWidth: 32, minHeight: 44),
                padding: EdgeInsets.zero,
                onPressed: onTap,
                icon: Icon(
                  Icons.chevron_right_rounded,
                  color: MorphColors.tone(0xFF9AA6C8, 0xFF617286),
                  size: 28,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _wideControl(
    BuildContext context,
    IconData icon,
    String label,
    bool enabled,
    Future<bool> Function() action,
    double height, {
    bool selected = false,
  }) {
    return Expanded(
      child: Container(
        height: height,
        decoration: _panel(radius: 25, selected: selected),
        child: InkWell(
          onTap: enabled ? action : null,
          borderRadius: BorderRadius.circular(17),
          child: Row(
            textDirection: TextDirection.ltr,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: enabled ? _symbolColor(icon) : MorphColors.textMuted,
                size: 19,
              ),
              SizedBox(width: 7),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: MorphColors.textPrimary,
                    fontSize: 12,
                    letterSpacing: .2,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sideControls({
    required double width,
    required double height,
    required String label,
    required bool enabled,
    required TvKey plusKey,
    required TvKey minusKey,
    required TvKey middleKey,
    required TvKey? activeKey,
    required Future<bool> Function() plus,
    required Future<bool> Function() minus,
    required Widget middle,
  }) {
    final keyHeight = (height * .18).clamp(44.0, 48.0).toDouble();
    final keyWidth = (width * .92).clamp(44.0, 48.0).toDouble();
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(width / 2),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            MorphColors.tone(0xFF1A3554, 0xFFFEFDFB),
            MorphColors.tone(0xFF10243B, 0xFFF7F4EF),
          ],
        ),
        border: Border.all(
          color:
              activeKey == plusKey ||
                  activeKey == minusKey ||
                  activeKey == middleKey
              ? MorphColors.tone(0xFF8492AD, 0xFF688297)
              : MorphColors.tone(0xFF24466C, 0xFFFEFDFB),
          width:
              activeKey == plusKey ||
                  activeKey == minusKey ||
                  activeKey == middleKey
              ? 2
              : 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color:
                activeKey == plusKey ||
                    activeKey == minusKey ||
                    activeKey == middleKey
                ? MorphColors.tone(0x55349CE5, 0x1C344D64)
                : MorphColors.tone(0x332D5D91, 0x1C344D64),
            blurRadius: 12,
            spreadRadius: -6,
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _capsuleButton(
            Icons.add_rounded,
            keyWidth,
            keyHeight,
            enabled ? plus : null,
          ),
          Text(
            label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: MorphColors.tone(0xFFB8CDE8, 0xFF617286),
              fontSize: 12,
              letterSpacing: .8,
            ),
          ),
          middle,
          _capsuleButton(
            Icons.remove_rounded,
            keyWidth,
            keyHeight,
            enabled ? minus : null,
          ),
        ],
      ),
    );
  }

  Widget _capsuleButton(
    IconData icon,
    double width,
    double height,
    Future<bool> Function()? onTap,
  ) => Opacity(
    opacity: onTap == null ? .45 : 1,
    child: Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: SizedBox(
          width: width,
          height: height,
          child: Icon(icon, color: MorphColors.textPrimary, size: height * .68),
        ),
      ),
    ),
  );

  Widget _circleControl(
    IconData icon,
    double size,
    Future<bool> Function()? action,
  ) => SizedBox(
    width: size.clamp(44.0, double.infinity),
    height: size.clamp(44.0, double.infinity),
    child: Material(
      color: MorphColors.tone(0xFF152B45, 0xFFFEFDFB),
      shape: CircleBorder(),
      child: InkWell(
        customBorder: CircleBorder(),
        onTap: action,
        child: Icon(
          icon,
          color: action == null ? MorphColors.textMuted : _symbolColor(icon),
          size: size * .52,
        ),
      ),
    ),
  );

  Widget _navCircleControl(
    BuildContext context,
    IconData icon,
    String label,
    bool enabled,
    Future<bool> Function() action,
    double size, {
    bool selected = false,
  }) => Expanded(
    child: Opacity(
      opacity: enabled ? 1 : .48,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: size * .76,
            height: size * .76,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: selected
                    ? [
                        MorphColors.tone(0xFF1B5C91, 0xFFD7D2C9),
                        MorphColors.tone(0xFF12385E, 0xFFFEFDFB),
                      ]
                    : [
                        MorphColors.tone(0xFF1A304B, 0xFFFEFDFB),
                        MorphColors.tone(0xFF10233A, 0xFFF7F4EF),
                      ],
              ),
              border: Border.all(
                color: selected
                    ? MorphColors.tone(0xFF318BD0, 0xFF688297)
                    : MorphColors.tone(0xFF203E61, 0xFFFEFDFB),
                width: selected ? 1.4 : 1,
              ),
              boxShadow: selected
                  ? [
                      BoxShadow(
                        color: MorphColors.tone(0x44309DEB, 0x1C344D64),
                        blurRadius: 12,
                      ),
                    ]
                  : null,
            ),
            child: Material(
              color: Colors.transparent,
              shape: CircleBorder(),
              child: InkWell(
                customBorder: CircleBorder(),
                onTap: enabled ? action : null,
                child: Icon(icon, color: _symbolColor(icon), size: size * .31),
              ),
            ),
          ),
          SizedBox(height: size * .05),
          Text(
            label,
            style: TextStyle(
              color: selected
                  ? MorphColors.tone(0xFF36AEFF, 0xFF688297)
                  : MorphColors.tone(0xFF9AB5D4, 0xFF617286),
              fontSize: 12,
              letterSpacing: .25,
            ),
          ),
        ],
      ),
    ),
  );

  void _showNumberPadSheet(BuildContext context, AppState app, double scale) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetContext) => SafeArea(
        child: Container(
          padding: EdgeInsets.fromLTRB(18, 16, 18, 12 * scale),
          decoration: BoxDecoration(
            color: MorphColors.tone(0xFF10233A, 0xFFF7F4EF),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.fromBorderSide(
              BorderSide(color: MorphColors.tone(0xFF284A72, 0xFFD7D2C9)),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                textDirection: TextDirection.ltr,
                children: [
                  Expanded(
                    child: Text(
                      _label(context, 'Number pad', 'أرقام'),
                      style: TextStyle(
                        color: MorphColors.tone(0xFFE4EFFC, 0xFF344D64),
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(sheetContext),
                    icon: Icon(Icons.close_rounded),
                  ),
                ],
              ),
              _numberPad(context, app, scale),
            ],
          ),
        ),
      ),
    );
  }

  Widget _playbackBar(
    BuildContext context,
    TvCapabilities caps,
    bool connected,
    double scale,
  ) {
    final enabled = connected && caps.mediaPlayback;
    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.center,
      children: [
        Container(
          height: 60 * scale,
          decoration: _panel(radius: 28),
          child: Row(
            textDirection: TextDirection.ltr,
            children: [
              Expanded(
                child: IconButton(
                  onPressed: enabled ? () => _key(context, TvKey.rewind) : null,
                  icon: Icon(
                    Icons.skip_previous_rounded,
                    size: 29,
                    color: MorphColors.tone(0xFFE0ECFA, 0xFF344D64),
                  ),
                ),
              ),
              Expanded(child: SizedBox()),
              Expanded(
                child: IconButton(
                  onPressed: enabled
                      ? () => _key(context, TvKey.fastForward)
                      : null,
                  icon: Icon(
                    Icons.skip_next_rounded,
                    size: 29,
                    color: MorphColors.tone(0xFFE0ECFA, 0xFF344D64),
                  ),
                ),
              ),
            ],
          ),
        ),
        Container(
          width: 72 * scale,
          height: 72 * scale,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                MorphColors.palette.accent,
                MorphColors.palette.accentEnd,
              ],
            ),
            border: Border.all(
              color: MorphColors.tone(0xFF2A5786, 0xFFD7D2C9),
              width: 1.3,
            ),
            boxShadow: [
              BoxShadow(
                color: MorphColors.tone(0x44000000, 0x1C344D64),
                blurRadius: 10,
              ),
            ],
          ),
          child: IconButton(
            key: const ValueKey('playback-toggle'),
            tooltip: _mediaPlaying
                ? _label(context, 'Pause', 'إيقاف مؤقت')
                : _label(context, 'Play', 'تشغيل'),
            onPressed: enabled && !_mediaPending
                ? () async {
                    setState(() => _mediaPending = true);
                    final sent = await _key(context, TvKey.playPause);
                    if (mounted)
                      setState(() {
                        if (sent) _mediaPlaying = !_mediaPlaying;
                        _mediaPending = false;
                        _playbackRevision.value++;
                      });
                  }
                : null,
            icon: Icon(
              _mediaPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
              color: MorphColors.palette.onAccent,
              size: 36,
            ),
          ),
        ),
      ],
    );
  }

  Widget _numberPad(BuildContext context, AppState app, double scale) {
    final keys = <(String, TvKey)>[
      ('1', TvKey.digit1),
      ('2', TvKey.digit2),
      ('3', TvKey.digit3),
      ('4', TvKey.digit4),
      ('5', TvKey.digit5),
      ('6', TvKey.digit6),
      ('7', TvKey.digit7),
      ('8', TvKey.digit8),
      ('9', TvKey.digit9),
      ('⌫', TvKey.back),
      ('0', TvKey.digit0),
      ('OK', TvKey.ok),
    ];
    return Container(
      padding: EdgeInsets.all(8 * scale),
      decoration: _panel(radius: 22),
      child: GridView.builder(
        shrinkWrap: true,
        physics: NeverScrollableScrollPhysics(),
        itemCount: keys.length,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisExtent: (44 * scale).clamp(44.0, 60.0),
          mainAxisSpacing: 5 * scale,
          crossAxisSpacing: 7 * scale,
        ),
        itemBuilder: (context, index) {
          final (label, key) = keys[index];
          return Material(
            color: MorphColors.tone(0xFF29364F, 0xFFFEFDFB),
            borderRadius: BorderRadius.circular(14),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () => _key(context, key),
              child: Center(
                child: Text(
                  label,
                  style: TextStyle(
                    color: label == 'OK'
                        ? MorphColors.tone(0xFF36AEFF, 0xFF688297)
                        : MorphColors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 16 * scale,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _streamingApps(
    BuildContext context,
    AppState app,
    double scale,
    bool enabled,
  ) {
    final apps = <(String, String, Color)>[
      ('Netflix', 'netflix', MorphColors.bgCard),
      ('YouTube', 'youtube', MorphColors.bgCard),
      ('Disney+', 'disney', MorphColors.bgCard),
      ('Prime Video', 'prime', MorphColors.bgCard),
    ];
    final textScale = (MediaQuery.textScalerOf(context).scale(14) / 14).clamp(
      1.0,
      2.0,
    );
    final tiles = <Widget>[
      for (final item in apps)
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 4),
          child: Material(
            color: item.$3,
            borderRadius: BorderRadius.circular(18 * scale),
            child: InkWell(
              borderRadius: BorderRadius.circular(18 * scale),
              onTap: enabled
                  ? () =>
                        _action(context, () => app.provider!.launchApp(item.$2))
                  : null,
              child: SizedBox(
                height: textScale > 1.3 ? 160 : 76 * scale,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (item.$1 == 'Netflix')
                      Text(
                        'N',
                        style: TextStyle(
                          color: Color(0xFFB20710),
                          fontSize: 31 * scale,
                          fontWeight: FontWeight.w900,
                        ),
                      )
                    else if (item.$1 == 'YouTube')
                      Container(
                        width: 38 * scale,
                        height: 25 * scale,
                        decoration: BoxDecoration(
                          color: MorphColors.tone(0xFFE62117, 0xFFE62117),
                          borderRadius: BorderRadius.circular(7 * scale),
                        ),
                        child: Icon(
                          Icons.play_arrow_rounded,
                          color: Colors.white,
                          size: 21 * scale,
                        ),
                      )
                    else if (item.$1 == 'Disney+')
                      Text(
                        'Disney+',
                        style: TextStyle(
                          color: MorphColors.textPrimary,
                          fontSize: 15 * scale,
                          fontWeight: FontWeight.w700,
                        ),
                      )
                    else
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'prime\nvideo',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: MorphColors.textPrimary,
                              fontSize: 12 * scale,
                              height: .78,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          SizedBox(height: 1 * scale),
                          Container(
                            width: 34 * scale,
                            height: 2 * scale,
                            decoration: BoxDecoration(
                              color: MorphColors.tone(0xFF54C7FF, 0xFF617286),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ],
                      ),
                    if (item.$1 == 'Netflix' || item.$1 == 'YouTube') ...[
                      SizedBox(height: 3 * scale),
                      Text(
                        item.$1,
                        maxLines: 1,
                        style: TextStyle(
                          color: MorphColors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
    ];
    if (textScale > 1.3) {
      return GridView.count(
        crossAxisCount: 2,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        childAspectRatio: 1,
        children: tiles,
      );
    }
    return Row(
      textDirection: TextDirection.ltr,
      children: [for (final tile in tiles) Expanded(child: tile)],
    );
  }

  Widget _statusDot(bool connected, {required double size}) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: connected ? MorphColors.cyan : MorphColors.danger,
      boxShadow: [
        BoxShadow(
          color: (connected ? MorphColors.cyan : MorphColors.danger).withValues(
            alpha: .55,
          ),
          blurRadius: 8,
        ),
      ],
    ),
  );

  BoxDecoration _panel({double radius=20,bool selected=false}) => BoxDecoration(
    borderRadius:BorderRadius.circular(radius),gradient:MorphColors.palette.glass,
    border:Border.all(color:selected?MorphColors.palette.link:MorphColors.palette.border,width:selected?1.5:1));

}

class _TvDisplayIllustration extends StatelessWidget {
  final bool compact;
  final double scale;

  const _TvDisplayIllustration({required this.compact, required this.scale});

  @override
  Widget build(BuildContext context) {
    final width = (compact ? 88.0 : 98.0) * scale;
    final height = (compact ? 66.0 : 72.0) * scale;
    return SizedBox(
      width: width,
      height: height,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            left: 0,
            right: 0,
            top: 0,
            bottom: 11,
            child: Container(
              padding: EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: MorphColors.tone(0xFF07101A, 0xFFF7F4EF),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: MorphColors.tone(0xFF273C55, 0xFFFEFDFB),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: MorphColors.tone(0x7728AFFF, 0x1C344D64),
                    blurRadius: 13,
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(5),
                child: CustomPaint(
                  painter: _BlueScreenPainter(),
                  child: SizedBox.expand(),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 5,
            child: Container(
              width: 3,
              height: 9,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    MorphColors.tone(0xFF637E9B, 0xFF688297),
                    MorphColors.tone(0xFF182A40, 0xFFFEFDFB),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 2,
            child: Container(
              width: width * .32,
              height: 3,
              decoration: BoxDecoration(
                color: MorphColors.tone(0xFF8295A9, 0xFF688297),
                borderRadius: BorderRadius.circular(4),
                boxShadow: [
                  BoxShadow(
                    color: MorphColors.tone(0x6637BFFF, 0x1C344D64),
                    blurRadius: 5,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BlueScreenPainter extends CustomPainter {
  const _BlueScreenPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final bounds = Offset.zero & size;
    canvas.drawRect(
      bounds,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFF81CFFF),
            const Color(0xFF2463EB),
            const Color(0xFF122D60),
          ],
        ).createShader(bounds),
    );
    final farWave = Path()
      ..moveTo(0, size.height * .24)
      ..cubicTo(
        size.width * .23,
        size.height * .04,
        size.width * .42,
        size.height * .48,
        size.width * .68,
        size.height * .34,
      )
      ..cubicTo(
        size.width * .84,
        size.height * .25,
        size.width * .9,
        size.height * .43,
        size.width,
        size.height * .3,
      )
      ..lineTo(size.width, size.height * .66)
      ..cubicTo(
        size.width * .73,
        size.height * .59,
        size.width * .5,
        size.height * .94,
        size.width * .28,
        size.height * .68,
      )
      ..cubicTo(
        size.width * .14,
        size.height * .52,
        size.width * .08,
        size.height * .75,
        0,
        size.height * .67,
      )
      ..close();
    canvas.drawPath(farWave, Paint()..color = const Color(0x5067BFFF));
    final nearWave = Path()
      ..moveTo(0, size.height * .57)
      ..cubicTo(
        size.width * .24,
        size.height * .35,
        size.width * .38,
        size.height * .9,
        size.width * .65,
        size.height * .69,
      )
      ..cubicTo(
        size.width * .82,
        size.height * .56,
        size.width * .9,
        size.height * .8,
        size.width,
        size.height * .55,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(nearWave, Paint()..color = const Color(0x90244591));
    final highlight = Path()
      ..moveTo(0, size.height * .38)
      ..cubicTo(
        size.width * .23,
        size.height * .22,
        size.width * .41,
        size.height * .69,
        size.width * .71,
        size.height * .48,
      )
      ..cubicTo(
        size.width * .83,
        size.height * .41,
        size.width * .94,
        size.height * .57,
        size.width,
        size.height * .43,
      );
    canvas.drawPath(
      highlight,
      Paint()
        ..color = const Color(0x70DBEEFF)
        ..style = PaintingStyle.stroke
        ..strokeWidth = size.height * .045
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
