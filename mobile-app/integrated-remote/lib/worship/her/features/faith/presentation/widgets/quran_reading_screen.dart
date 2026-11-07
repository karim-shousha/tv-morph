import 'package:morph_remote/core/theme/phone_design_tokens.dart';
import 'package:morph_remote/worship/her/core/widgets/her_reading_toolbar.dart';
import '../../../../core/theme/her_reading_colors.dart';
import 'dart:async';
import 'dart:math' as math;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../library/presentation/library_pagination.dart';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/theme/theme_palette.dart';
import '../../../../core/widgets/app_page_header.dart';
import '../../../../core/widgets/her_components.dart';
import '../../../../core/services/her_audio_service.dart';
import '../../data/quran_audio_repository.dart';
import '../../data/quran_repository.dart';
import '../../data/faith_repository.dart';
import '../tafsir_reader_screen.dart';
import 'quran_theme.dart';

class QuranReadingScreen extends StatefulWidget {
  const QuranReadingScreen({super.key, required this.surah, this.initialAyah});
  final int surah;
  final int? initialAyah;

  @override
  State<QuranReadingScreen> createState() => _QuranReadingScreenState();
}

class _QuranReadingScreenState extends State<QuranReadingScreen> {
  final _scroll = ScrollController();
  bool _pageMode = true;
  bool _darkReading =
      HerThemeEngine.current.surfaces.background.computeLuminance() < .42;
  static const _appearanceKey = 'her.quran.reader.appearance.v1';
  HerReadingColors get _readingColors =>
      HerReadingColors(context.herTheme, dark: _darkReading);

  Future<void> _restoreAppearance() async {
    final raw = (await SharedPreferences.getInstance()).getString(
      _appearanceKey,
    );
    if (mounted && raw != null) setState(() => _darkReading = raw == 'night');
  }

  Future<void> _showAppearancePicker() => showHerSheet<void>(
    context,
    title: 'مظهر القراءة',
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final dark in [false, true])
          ListTile(
            title: Text(dark ? 'داكن' : 'فاتح'),
            subtitle: Text(
              dark
                  ? 'خلفية داكنة ونص فاتح لقراءة مريحة'
                  : 'خلفية فاتحة هادئة ونص واضح',
            ),
            leading: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: HerReadingColors(context.herTheme, dark: dark).background,
                border: Border.all(color: context.herTheme.text.secondary, width: 1.5),
              ),
            ),
            trailing: _darkReading == dark
                ? Icon(
                    Icons.check_circle_rounded,
                    color: context.herTheme.actions.primary,
                  )
                : null,
            onTap: () async {
              setState(() => _darkReading = dark);
              Navigator.pop(context);
              await (await SharedPreferences.getInstance()).setString(
                _appearanceKey,
                dark ? 'night' : 'white',
              );
            },
          ),
      ],
    ),
  );
  PageController _pagesController = PageController();
  List<LibraryTextPage> _pages = [];
  final Map<int, int> _ayahOffsets = {};
  String _pageSignature = '';
  int _pageNumber = 0;
  static const _modeKey = 'her.quran.reader.page-mode.v1';
  List<QuranAyah> _ayat = const [];
  double _fontSize = 25;
  String? _loadError;
  int? _savedAyah;
  int? _selectedAyah;

  // On-demand surah audio: streams by default, downloads only on request.
  String _reciter = quranReciters.first.id;
  bool _downloaded = false;
  double? _downloadProgress;
  bool _playing = false;
  bool _audioBusy = false;
  StreamSubscription? _playerStateSub;
  StreamSubscription? _mediaItemSub;

  bool get _showsOpeningBasmala => widget.surah != 1 && widget.surah != 9;
  String get _audioId => 'quran_${widget.surah}_$_reciter';

  @override
  void initState() {
    super.initState();
    _load();
    _restoreAppearance();
    _initAudio();
  }

  Future<void> _initAudio() async {
    final reciter = await QuranAudioRepository.instance.loadReciter();
    if (!mounted) return;
    setState(() => _reciter = reciter);
    await _refreshDownloadState();
    final handler = HerAudioService.handler;
    _playerStateSub = handler.player.onPlayerStateChanged.listen(_syncAudio);
    _mediaItemSub = handler.mediaItem.listen((_) => _syncAudio());
    _syncAudio();
  }

  void _syncAudio([dynamic _]) {
    if (!mounted) return;
    final handler = HerAudioService.handler;
    final mine =
        handler.collection == 'quran' &&
        handler.mediaItem.valueOrNull?.id == _audioId;
    final playing = mine && handler.player.state == PlayerState.playing;
    if (playing != _playing) setState(() => _playing = playing);
  }

  Future<void> _refreshDownloadState() async {
    final repo = QuranAudioRepository.instance;
    final downloaded = await repo.isDownloaded(widget.surah, _reciter);
    if (!mounted) return;
    setState(() => _downloaded = downloaded);
  }

  Future<void> _toggleAudio() async {
    if (_audioBusy) return;
    final handler = HerAudioService.handler;
    if (_playing) {
      await handler.pause();
      return;
    }
    final repo = QuranAudioRepository.instance;
    final local = await repo.localFile(widget.surah, _reciter);
    if (!await local.exists()) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('حمّل السورة أولًا، وبعدها هتشتغل بدون إنترنت 🤍'),
          ),
        );
      }
      return;
    }
    setState(() => _audioBusy = true);
    try {
      await HerAudioService.initialize();
      // Stop radio/music before recitation starts; they stop us in return.
      await HerAudioService.handler.stopForCollectionChange('quran');
      await handler.playEntries(
        [
          HerAudioEntry(
            id: _audioId,
            title: 'سورة ${QuranRepository.surahNames[widget.surah - 1]}',
            subtitle: quranReciterName(_reciter),
            source: local.path,
            isFile: true,
          ),
        ],
        0,
        collection: 'quran',
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تعذر تشغيل الملف المحمّل. حمّل السورة مرة أخرى.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _audioBusy = false);
    }
  }

  Future<void> _downloadAudio() async {
    if (_downloadProgress != null) return;
    setState(() => _downloadProgress = 0);
    try {
      await for (final progress in QuranAudioRepository.instance.download(
        widget.surah,
        _reciter,
      )) {
        if (mounted) setState(() => _downloadProgress = progress);
      }
      await _refreshDownloadState();
      if (mounted) {
        setState(() => _downloadProgress = null);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم تحميل السورة — هتشتغل بدون إنترنت 🤍'),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        setState(() => _downloadProgress = null);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تعذر التحميل. تحقّق من الإنترنت وحاول مجددًا.'),
          ),
        );
      }
    }
  }

  Future<void> _deleteAudio() async {
    await QuranAudioRepository.instance.delete(widget.surah, _reciter);
    await _refreshDownloadState();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('حذفنا الملف الصوتي ووفّرنا المساحة.')),
      );
    }
  }

  Future<void> _changeReciter(String id) async {
    if (id == _reciter) return;
    final handler = HerAudioService.handler;
    if (handler.collection == 'quran') await handler.stop();
    await QuranAudioRepository.instance.saveReciter(id);
    if (!mounted) return;
    setState(() {
      _reciter = id;
      _playing = false;
      _downloaded = false;
    });
    await _refreshDownloadState();
  }

  Future<void> _load() async {
    setState(() => _loadError = null);
    try {
      final prefs = await SharedPreferences.getInstance();
      final all = await QuranRepository.instance.load();
      final fontSize = await QuranRepository.instance.loadFontSize();
      final savedPosition = await QuranRepository.instance.loadLastPosition();
      if (!mounted) return;
      setState(() {
        final offset = QuranRepository.instance.offsetForSurah(widget.surah);
        _ayat = all.sublist(
          offset,
          offset + QuranRepository.ayahCounts[widget.surah - 1],
        );
        _fontSize = fontSize;
        _pageMode = prefs.getBool(_modeKey) ?? true;
        _savedAyah = savedPosition?.surah == widget.surah
            ? savedPosition?.ayah
            : null;
        _selectedAyah = widget.initialAyah ?? _savedAyah ?? 1;
      });
      if (widget.initialAyah != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scroll.hasClients) {
            final target =
                (((widget.initialAyah! - 1) * 105.0) +
                        (_showsOpeningBasmala ? 82.0 : 0.0))
                    .clamp(0.0, _scroll.position.maxScrollExtent);
            _scroll.jumpTo(target);
          }
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loadError = 'تعذر فتح السورة. حاول مجددًا 🤍');
      }
    }
  }

  Future<void> _changeFont(double delta) async {
    final value = (_fontSize + delta).clamp(19.0, 36.0);
    setState(() => _fontSize = value);
    await QuranRepository.instance.saveFontSize(value);
  }

  /// The Qur'an is read as one continuous, Uthmani surface — never as a feed
  /// of detached cards or a white parchment floating over the app theme.
  Widget _mushafPage(BuildContext context, ThemePalette palette) {
    // The reader is part of the app canvas.  Using the canvas gradient here
    // means a Theme Studio colour change flows through the entire screen,
    // including the space after a short surah such as Al-Fatihah.
    final pageStart = _readingColors.background;
    final pageEnd = _readingColors.background;
    final pageInk = _readingColors.ink;
    final spans = <InlineSpan>[];
    if (_showsOpeningBasmala) {
      spans.add(
        TextSpan(
          text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\n\n',
          style: GoogleFonts.amiri(
            fontSize: _fontSize + 2,
            height: 1.7,
            fontWeight: FontWeight.w700,
            color: pageInk,
          ),
        ),
      );
    }
    for (var index = 0; index < _ayat.length; index++) {
      final ayah = _ayat[index];
      final text = index == 0 && _showsOpeningBasmala
          ? QuranRepository.withoutOpeningBasmala(ayah.text)
          : ayah.text;
      spans.add(TextSpan(text: '$text '));
      spans.add(
        WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: GestureDetector(
            onTap: () => setState(() => _selectedAyah = ayah.ayah),
            child: Container(
              margin: const EdgeInsetsDirectional.only(start: 2, end: 2),
              padding: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                color: _selectedAyah == ayah.ayah
                    ? quranDeepRose.withValues(alpha: .14)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '۝${ayah.ayah}',
                style: GoogleFonts.amiri(
                  fontSize: _fontSize - 2,
                  fontWeight: FontWeight.w700,
                  color: pageInk,
                ),
              ),
            ),
          ),
        ),
      );
      if (ayah.ayah == _savedAyah) {
        spans.add(
          WidgetSpan(
            alignment: PlaceholderAlignment.middle,
            child: Padding(
              padding: const EdgeInsetsDirectional.only(start: 3, end: 5),
              child: Tooltip(
                message: 'آخر موضع للقراءة',
                child: Icon(
                  Icons.bookmark_rounded,
                  size: (_fontSize - 3).clamp(18.0, 28.0).toDouble(),
                  color: quranDeepRose,
                  semanticLabel: 'علامة آخر موضع للقراءة',
                ),
              ),
            ),
          ),
        );
      }
    }
    return LayoutBuilder(
      builder: (context, constraints) => DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [pageStart, pageEnd],
          ),
        ),
        child: ListView(
          controller: _scroll,
          padding: const EdgeInsets.fromLTRB(18, 10, 18, 10),
          children: [
            ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: (constraints.maxHeight - 20).clamp(
                  0,
                  double.infinity,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Divider(color: pageInk.withValues(alpha: .55)),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          'سورة ${QuranRepository.surahNames[widget.surah - 1]}',
                          style: GoogleFonts.amiri(
                            fontSize: 19,
                            fontWeight: FontWeight.w700,
                            color: pageInk,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Divider(color: pageInk.withValues(alpha: .55)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SelectableText.rich(
                    TextSpan(
                      children: spans,
                      style: GoogleFonts.amiri(
                        fontSize: _fontSize,
                        height: 2.02,
                        fontWeight: FontWeight.w600,
                        color: pageInk,
                      ),
                    ),
                    style:
                        GoogleFonts.amiri(
                          fontSize: _fontSize,
                          height: 2.02,
                          fontWeight: FontWeight.w600,
                          color: pageInk,
                        ).copyWith(
                          inherit: false,
                          textBaseline: TextBaseline.alphabetic,
                        ),
                    textAlign: TextAlign.justify,
                    textDirection: TextDirection.rtl,
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Text(
                        'الجزء',
                        style: PhoneDesignTokens.uiText(
                          fontSize: 10,
                          color: pageInk.withValues(alpha: .8),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${widget.surah}',
                        style: GoogleFonts.amiri(
                          fontSize: 17,
                          color: pageInk.withValues(alpha: .8),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        'سورة',
                        style: PhoneDesignTokens.uiText(
                          fontSize: 10,
                          color: pageInk.withValues(alpha: .8),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _playerStateSub?.cancel();
    _mediaItemSub?.cancel();
    _scroll.dispose();
    _pagesController.dispose();
    super.dispose();
  }

  Future<void> _saveSelectedPosition() async {
    final selected = _selectedAyah;
    if (!mounted || selected == null) return;
    final changed = _savedAyah != selected;
    setState(() => _savedAyah = selected);
    await QuranRepository.instance.saveLastPosition(
      QuranPosition(widget.surah, selected),
    );
    if (changed) {
      unawaited(FaithRepository.instance.recordCircleWard(CircleWard.quran));
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('حُفظ موضعك عند الآية $selected 🤍')),
      );
    }
  }

  Widget _pagedMushaf(BuildContext context, ThemePalette palette) {
    final ink = _readingColors.ink;
    final style = GoogleFonts.amiri(
      fontSize: _fontSize,
      height: 2.02,
      fontWeight: FontWeight.w600,
      color: ink,
    );
    return LayoutBuilder(
      builder: (context, constraints) {
        final scaler = MediaQuery.textScalerOf(context);
        final signature =
            '${constraints.maxWidth}:${constraints.maxHeight}:$_fontSize:${scaler.scale(1)}:$ink';
        if (signature != _pageSignature) {
          final buffer = StringBuffer();
          _ayahOffsets.clear();
          if (_showsOpeningBasmala) {
            buffer.write('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\n\n');
          }
          for (final ayah in _ayat) {
            _ayahOffsets[ayah.ayah] = buffer.length;
            final text = ayah.ayah == 1 && _showsOpeningBasmala
                ? QuranRepository.withoutOpeningBasmala(ayah.text)
                : ayah.text;
            buffer.write('$text ۝${ayah.ayah} ');
          }
          _pages = paginateLibraryText(
            TextSpan(text: buffer.toString(), style: style),
            width: math.max(1, constraints.maxWidth - 36),
            height: math.max(1, constraints.maxHeight - 72),
            textScaler: scaler,
          );
          final offset = _ayahOffsets[_selectedAyah ?? 1] ?? 0;
          _pageNumber = math.max(
            0,
            _pages.indexWhere((page) => page.end > offset),
          );
          final old = _pagesController;
          _pagesController = PageController(initialPage: _pageNumber);
          WidgetsBinding.instance.addPostFrameCallback((_) => old.dispose());
          _pageSignature = signature;
        }
        int ayahAt(int offset) {
          var ayah = 1;
          for (final entry in _ayahOffsets.entries) {
            if (entry.value > offset) break;
            ayah = entry.key;
          }
          return ayah;
        }

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(
                'سورة ${QuranRepository.surahNames[widget.surah - 1]}',
                style: GoogleFonts.amiri(fontSize: 19, color: ink),
              ),
            ),
            Expanded(
              child: PageView.builder(
                key: ValueKey(signature),
                controller: _pagesController,
                itemCount: _pages.length,
                onPageChanged: (index) => setState(() {
                  _pageNumber = index;
                  _selectedAyah = ayahAt(_pages[index].start);
                }),
                itemBuilder: (context, index) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: Align(
                    alignment: Alignment.topRight,
                    child: SelectableText.rich(
                      _pages[index].span,
                      style: style.copyWith(
                        inherit: false,
                        textBaseline: TextBaseline.alphabetic,
                      ),
                      textDirection: TextDirection.rtl,
                      textAlign: TextAlign.right,
                      onSelectionChanged: (selection, cause) {
                        if (selection.isValid) {
                          _selectedAyah = ayahAt(
                            _pages[index].start + selection.start,
                          );
                        }
                      },
                    ),
                  ),
                ),
              ),
            ),
            Text(
              '${_pageNumber + 1} / ${_pages.length}',
              style: PhoneDesignTokens.uiText(fontSize: 11, color: ink),
            ),
            const SizedBox(height: 8),
          ],
        );
      },
    );
  }

  Widget _readerToolbar(BuildContext context) {
    final theme = context.herTheme;
    final hasNext = widget.surah < QuranRepository.surahNames.length;
    Widget divider() =>
        Container(width: 1, height: 24, color: theme.cards.border);
    Widget action({
      required String tooltip,
      required IconData icon,
      required VoidCallback onPressed,
      Color? color,
    }) => HerReadingToolbarAction(
      tooltip: tooltip,
      icon: icon,
      onPressed: onPressed,
      color: color ?? quranRoseIcon,
    );
    return HerReadingToolbar(
      children: [
        Expanded(
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: _toggleAudio,
            child: Padding(
              padding: const EdgeInsetsDirectional.only(start: 6, end: 8),
              child: Row(
                children: [
                  Icon(
                    _playing ? Icons.pause_rounded : Icons.play_arrow_rounded,
                    size: 21,
                    color: quranRoseIcon,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      _playing
                          ? 'إيقاف التلاوة'
                          : 'استمع: ${QuranRepository.surahNames[widget.surah - 1]}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: PhoneDesignTokens.uiText(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: theme.sectionTitle,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (_downloadProgress != null)
          SizedBox(
            width: 30,
            height: 30,
            child: CircularProgressIndicator(
              value: _downloadProgress == 0 ? null : _downloadProgress,
              strokeWidth: 2,
              color: quranRoseIcon,
            ),
          )
        else
          action(
            tooltip: _downloaded
                ? 'حذف تحميل السورة'
                : 'تحميل السورة للاستماع بدون إنترنت',
            icon: _downloaded
                ? Icons.download_done_rounded
                : Icons.download_rounded,
            onPressed: _downloaded ? _deleteAudio : _downloadAudio,
          ),
        SizedBox(
          width: 26,
          height: 36,
          child: PopupMenuButton<String>(
            tooltip: 'اختار القارئ',
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints.tightFor(width: 26, height: 36),
            initialValue: _reciter,
            icon: Icon(
              Icons.record_voice_over_rounded,
              size: 19,
              color: quranRoseIcon,
            ),
            onSelected: _downloadProgress == null ? _changeReciter : null,
            enabled: _downloadProgress == null,
            itemBuilder: (_) => [
              for (final reciter in quranReciters)
                PopupMenuItem(value: reciter.id, child: Text(reciter.name)),
            ],
          ),
        ),
        action(
          tooltip: _pageMode ? 'التبديل للتمرير' : 'التبديل للتقليب',
          icon: _pageMode ? Icons.swipe_rounded : Icons.menu_book_rounded,
          onPressed: () async {
            setState(() => _pageMode = !_pageMode);
            await (await SharedPreferences.getInstance()).setBool(
              _modeKey,
              _pageMode,
            );
          },
        ),
        divider(),
        action(
          tooltip: 'حفظ الآية المختارة',
          icon: Icons.bookmark_add_rounded,
          onPressed: _saveSelectedPosition,
        ),
        action(
          tooltip: 'تفسير الآية المختارة',
          icon: Icons.auto_stories_rounded,
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => TafsirReaderScreen(
                book: const TafsirBook(
                  id: 2012,
                  title: 'التفسير الميسّر',
                  source: 'مجمع الملك فهد لطباعة المصحف الشريف',
                  kind: HerIconKind.knowledge,
                ),
                initialSurah: widget.surah,
                initialAyah: _selectedAyah,
              ),
            ),
          ),
        ),
        action(
          tooltip: 'مظهر القراءة',
          icon: Icons.brightness_6_rounded,
          onPressed: _showAppearancePicker,
        ),
        action(
          tooltip: 'تكبير الخط',
          icon: Icons.zoom_in_rounded,
          onPressed: () => _changeFont(2),
        ),
        action(
          tooltip: 'تصغير الخط',
          icon: Icons.zoom_out_rounded,
          onPressed: () => _changeFont(-2),
        ),
        if (hasNext) ...[
          divider(),
          action(
            tooltip: 'السورة التالية',
            icon: Icons.arrow_back_rounded,
            onPressed: () => Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => QuranReadingScreen(surah: widget.surah + 1),
              ),
            ),
          ),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.herPalette;
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        // Let the root canvas gradient/artwork show through. The reader used
        // to paint an opaque black surface over it on every page.
        backgroundColor: _readingColors.background,
        body: SafeArea(
          child: Column(
            children: [
              AppPageHeader(
                  logoOnly: true,
                title: QuranRepository.surahNames[widget.surah - 1],
                subtitle: '${QuranRepository.ayahCounts[widget.surah - 1]} آية',
                onBack: () => Navigator.maybePop(context),
              ),
              Expanded(
                child: _loadError != null && _ayat.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(28),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.menu_book_rounded,
                                size: 44,
                                color: quranDeepRose,
                              ),
                              const SizedBox(height: 10),
                              Text(
                                _loadError!,
                                textAlign: TextAlign.center,
                                style: PhoneDesignTokens.uiText(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: context.herTheme.bodySecondary,
                                ),
                              ),
                              const SizedBox(height: 12),
                              HERSoftButton(
                                label: 'إعادة المحاولة',
                                kind: HerIconKind.rose,
                                onPressed: _load,
                              ),
                            ],
                          ),
                        ),
                      )
                    : _ayat.isEmpty
                    ? Center(
                        child: CircularProgressIndicator(color: quranDeepRose),
                      )
                    : Column(
                        children: [
                          Expanded(
                            child: _pageMode
                                ? _pagedMushaf(context, palette)
                                : _mushafPage(context, palette),
                          ),
                          _readerToolbar(context),
                        ],
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
