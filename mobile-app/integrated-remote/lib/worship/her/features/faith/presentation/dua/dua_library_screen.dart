import '../widgets/phone_reading_card.dart';
import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/her_banner_ad.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/widgets/her_components.dart';
import '../../../../core/data/remote_content_repository.dart';
import '../../data/faith_content.dart';
import '../../data/faith_repository.dart';
import '../../../../core/widgets/app_page_header.dart';
import '../widgets/faith_shared.dart';
import '../widgets/faith_share_card.dart';

class DuaLibraryScreen extends StatefulWidget {
  const DuaLibraryScreen({super.key});
  @override
  State<DuaLibraryScreen> createState() => _DuaLibraryScreenState();
}

class _DuaLibraryScreenState extends State<DuaLibraryScreen> {
  static const _allCategory = 'الكل';
  List<FaithText> allItems = verifiedDuas;
  List<String> categories = [];
  late String selected;
  final _search = TextEditingController();
  String _query = '';
  Set<String> _favorites = {};
  List<(String, String)> _customDuas = const [];
  bool _showFavoritesOnly = false;
  @override
  void initState() {
    super.initState();
    categories = allItems.map((item) => item.category).toSet().toList();
    selected = _allCategory;
    _search.addListener(() {
      if (mounted) setState(() => _query = _search.text.trim());
    });
    _loadLocal();
    _loadPublishedDuas();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _loadLocal() async {
    final results = await Future.wait([
      FaithRepository.instance.loadDuaFavorites(),
      FaithRepository.instance.loadCustomDuas(),
    ]);
    if (!mounted) return;
    setState(() {
      _favorites = results[0] as Set<String>;
      _customDuas = results[1] as List<(String, String)>;
    });
  }

  Future<void> _toggleFavorite(String title) async {
    final nowFav = await FaithRepository.instance.toggleDuaFavorite(title);
    if (!mounted) return;
    setState(() {
      if (nowFav) {
        _favorites.add(title);
      } else {
        _favorites.remove(title);
      }
    });
  }

  Future<void> _addCustomDua() async {
    final title = TextEditingController();
    final body = TextEditingController();
    final saved = await showHerSheet<bool>(
      context,
      title: 'دعاء من قلبك',
      // Keyboard-safe route (scroll-controlled sheet) + internal scroll:
      // fields and actions stay reachable with the keyboard open.
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * 0.85,
        ),
        child: SingleChildScrollView(
          padding: EdgeInsets.only(
            bottom: MediaQuery.viewInsetsOf(context).bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: title,
                maxLength: 40,
                decoration: herInputDecoration('مثال: دعاء الامتحان'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: body,
                maxLines: 3,
                maxLength: 500,
                decoration: herInputDecoration('اكتب دعاءك بكلماتك…'),
              ),
              const SizedBox(height: 14),
              HERPrimaryButton(
                label: 'حفظ الدعاء',
                onPressed: () => Navigator.pop(context, true),
              ),
              const SizedBox(height: 4),
              HERSecondaryButton(
                label: 'إلغاء',
                onPressed: () => Navigator.pop(context, false),
              ),
            ],
          ),
        ),
      ),
    );
    final t = title.text.trim();
    final b = body.text.trim();
    title.dispose();
    body.dispose();
    if (saved != true || t.isEmpty || b.isEmpty || !mounted) return;
    await FaithRepository.instance.addCustomDua(t, b);
    await _loadLocal();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('حفظنا دعاءك في مكتبتك الخاصة 🤍')),
      );
    }
  }

  Future<void> _loadPublishedDuas() async {
    final remote = await RemoteContentRepository.instance.loadItems(
      'faith_dua',
    );
    if (!mounted || remote == null || remote.isEmpty) return;
    final additions = remote
        .map(
          (item) => FaithText(
            category: (item['categoryId'] as String?)?.trim().isNotEmpty == true
                ? item['categoryId'] as String
                : 'إضافات الإدارة',
            title: (item['titleAr'] as String? ?? '').trim(),
            text: (item['bodyAr'] as String? ?? '').trim(),
            reference:
                (item['subtitleAr'] as String? ?? 'مرجع يُراجع من الإدارة')
                    .trim(),
            kind: 'دعاء من الإدارة',
          ),
        )
        .where((item) => item.title.isNotEmpty && item.text.isNotEmpty)
        .toList();
    if (additions.isEmpty) return;
    setState(() {
      allItems = additions;
      categories = allItems.map((item) => item.category).toSet().toList();
      // "All" remains valid when CMS categories replace the offline fallback.
      if (selected != _allCategory && !categories.contains(selected)) {
        selected = _allCategory;
      }
    });
  }

  List<FaithText> get _visibleItems {
    final normalized = _query.trim();
    var list = allItems
        .where((item) => selected == _allCategory || item.category == selected)
        .toList();
    if (_showFavoritesOnly) {
      list = list.where((item) => _favorites.contains(item.title)).toList();
    }
    if (normalized.isNotEmpty) {
      list = list
          .where(
            (item) =>
                item.title.contains(normalized) ||
                item.text.contains(normalized),
          )
          .toList();
    }
    return list;
  }

  Widget _customDuaCard(BuildContext context, int index) {
    final dua = _customDuas[index];
    final theme = context.herTheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: HERCard(
        role: HERCardRole.content,
        radius: 18,
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    dua.$1,
                    style: faithText(context, 13, FontWeight.w900),
                  ),
                ),
                IconButton(
                  tooltip: 'مشاركة',
                  onPressed: () => shareFaithCard(
                    context: context,
                    title: dua.$1,
                    body: dua.$2,
                    reference: 'من دعائي في Morph 🤍',
                  ),
                  icon: Icon(
                    Icons.share_rounded,
                    size: 18,
                    color: theme.headingPrimary,
                  ),
                ),
                IconButton(
                  tooltip: 'حذف',
                  onPressed: () async {
                    await FaithRepository.instance.removeCustomDuaAt(index);
                    await _loadLocal();
                  },
                  icon: Icon(
                    Icons.delete_outline_rounded,
                    size: 18,
                    color: theme.bodySecondary,
                  ),
                ),
              ],
            ),
            Text(dua.$2, style: faithText(context, 13.5, FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _duaCard(BuildContext context, FaithText item) => PhoneReadingCard(
    key: ValueKey(item.title),
    title: item.title,
    body: item.text,
    reference: item.reference,
    kind: item.kind,
    favorite: _favorites.contains(item.title),
    onFavorite: () => _toggleFavorite(item.title),
    onCopy: () async {
      await Clipboard.setData(
        ClipboardData(text: '${item.title}\n${item.text}'),
      );
      if (context.mounted)
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('تم نسخ الدعاء')));
    },
    onShare: () => shareFaithCard(
      context: context,
      title: item.title,
      body: item.text,
      reference: item.reference,
    ),
  );

  @override
  Widget build(BuildContext context) {
    final items = _visibleItems;
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              AppPageHeader(
                logoOnly: true,
                title: 'مكتبة الأدعية',
                subtitle: 'ادعُ بما شئت من خير',
                onBack: () => Navigator.maybePop(context),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                  children: [
                    // Intro banner — content family (long-form readable
                    // surface owned centrally).
                    const PhonePageIntro(
                      title: 'الأدعية',
                      subtitle: 'ابحث عن دعاء، أو اختر من المكتبة الموثّقة.',
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _search,
                      textDirection: TextDirection.rtl,
                      decoration: herInputDecoration(
                        'ابحث في الأدعية…',
                        icon: Icons.search_rounded,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'اختار باب الدعاء',
                            style: faithText(context, 12, FontWeight.w900),
                          ),
                        ),
                        // Central selectable-control family (no local
                        // FilterChip recipe).
                        HERChip(
                          label: 'المفضلة (${_favorites.length})',
                          icon: _showFavoritesOnly
                              ? Icons.favorite_rounded
                              : Icons.favorite_border_rounded,
                          selected: _showFavoritesOnly,
                          dense: true,
                          onTap: () => setState(
                            () => _showFavoritesOnly = !_showFavoritesOnly,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      width: double.infinity,
                      // Cleanup: central Primary (pinned pink + white).
                      child: HERPrimaryButton(
                        label: 'اكتب دعاءك الخاص',
                        icon: Icons.edit_rounded,
                        onPressed: _addCustomDua,
                        height: 42,
                        radius: 20,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        iconSize: 16,
                        presentation: HERButtonPresentation.flat,
                        expanded: false,
                      ),
                    ),
                    if (_customDuas.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(
                        'أدعيتك الخاصة (${_customDuas.length})',
                        style: faithText(
                          context,
                          11.5,
                          FontWeight.w900,
                          context.herTheme.headingPrimary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      for (var i = 0; i < _customDuas.length; i++)
                        _customDuaCard(context, i),
                    ],
                    const SizedBox(height: 7),
                    InputDecorator(
                      decoration:
                          herInputDecoration(
                            'اختار باب الدعاء',
                            icon: Icons.menu_book_rounded,
                          ).copyWith(
                            labelText: 'باب الدعاء',
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 4,
                            ),
                          ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: selected,
                          isExpanded: true,
                          items: [
                            const DropdownMenuItem(
                              value: _allCategory,
                              child: Text('الكل'),
                            ),
                            ...categories.map(
                              (category) => DropdownMenuItem(
                                value: category,
                                child: Text(
                                  category,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          ],
                          onChanged: (value) {
                            if (value != null) {
                              setState(() => selected = value);
                            }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 13),
                    Text(
                      _query.isNotEmpty
                          ? '${items.length} نتيجة عن "$_query"'
                          : _showFavoritesOnly
                          ? '${items.length} في المفضلة 🤍'
                          : selected == _allCategory
                          ? '${items.length} أدعية موثقة'
                          : '${items.length} أدعية موثقة في $selected',
                      style: faithText(
                        context,
                        11,
                        FontWeight.w700,
                        context.herTheme.bodySecondary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    if (items.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 22),
                        child: Text(
                          _showFavoritesOnly
                              ? 'مفضّلتك فارغة — اضغط القلب على أي دعاء لحفظه هنا 🤍'
                              : 'لم نجد دعاء مطابقًا. جرّبي كلمة أخرى.',
                          textAlign: TextAlign.center,
                          style: faithText(
                            context,
                            11.5,
                            FontWeight.w700,
                            context.herTheme.bodySecondary,
                          ),
                        ),
                      )
                    else
                      ...items
                          .map((item) => _duaCard(context, item))
                          .indexed
                          .expand(
                            (entry) => <Widget>[
                              if (entry.$1 == (items.length > 2 ? 2 : 0))
                                const HerBannerAd(
                                  inline: true,
                                  placement: 'dua',
                                ),
                              entry.$2,
                            ],
                          ),
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
