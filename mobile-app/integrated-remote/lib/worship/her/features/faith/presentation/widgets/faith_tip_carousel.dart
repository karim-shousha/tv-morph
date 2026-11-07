import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/theme/her_theme_data.dart';
import '../../../../core/data/remote_content_repository.dart';
import '../../../../core/widgets/her_components.dart';
import 'faith_shared.dart';

class FaithTipCarousel extends StatefulWidget {
  const FaithTipCarousel({super.key, required this.category});
  final String category;

  @override
  State<FaithTipCarousel> createState() => _FaithTipCarouselState();
}

class _FaithTipCarouselState extends State<FaithTipCarousel> {
  final PageController _controller = PageController();
  Timer? _timer;
  var _index = 0;
  List<_FaithTip> _tips = const [];

  @override
  void initState() {
    super.initState();
    _tips = _fallback(widget.category);
    _loadPublishedTips();
    _timer = Timer.periodic(const Duration(seconds: 6), (_) {
      if (!mounted || _tips.length < 2) return;
      _index = (_index + 1) % _tips.length;
      _controller.animateToPage(
        _index,
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeOutCubic,
      );
      setState(() {});
    });
  }

  Future<void> _loadPublishedTips() async {
    final remote = await RemoteContentRepository.instance.loadItems(
      'faith_daily_card',
    );
    if (!mounted || remote == null) return;
    final published = remote
        .where((item) => item['categoryId'] == widget.category)
        .map(
          (item) => _FaithTip(
            (item['titleAr'] as String? ?? '').trim(),
            (item['bodyAr'] as String? ?? '').trim(),
            (item['subtitleAr'] as String? ?? '').trim(),
          ),
        )
        .where((tip) => tip.title.isNotEmpty && tip.body.isNotEmpty)
        .toList();
    if (published.isNotEmpty) {
      setState(() {
        _tips = published;
        _index = 0;
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tips = _tips;
    if (tips.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 110,
      child: HERCard(
        role: HERCardRole.wide,
        padding: EdgeInsets.zero,
        radius: 22,
        child: Stack(
          children: [
            PageView.builder(
              controller: _controller,
              itemCount: tips.length,
              onPageChanged: (value) => setState(() => _index = value),
              itemBuilder: (context, index) {
                final tip = tips[index];
                return Padding(
                  padding: const EdgeInsets.fromLTRB(17, 14, 17, 23),
                  child: Row(
                    children: [
                      // Central icon family per carousel meaning (prayer/tasbih
                      // devotion → rose, Friday learning → knowledge).
                      HERIconContainer(
                        widget.category == 'tasbih'
                            ? Icons.auto_awesome_rounded
                            : widget.category == 'friday'
                            ? Icons.wb_sunny_rounded
                            : Icons.lightbulb_outline_rounded,
                        kind: widget.category == 'friday'
                            ? HerIconKind.knowledge
                            : HerIconKind.rose,
                        size: 45,
                        iconSize: 22,
                        clampSize: false,
                      ),
                      const SizedBox(width: 11),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              tip.title,
                              style: faithText(context, 13, FontWeight.w900),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              tip.body,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: faithText(
                                context,
                                10.3,
                                FontWeight.w600,
                                context.herTheme.bodySecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            Positioned(
              bottom: 9,
              right: 0,
              left: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  tips.length,
                  (value) => AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: value == _index ? 15 : 5,
                    height: 5,
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                      color: value == _index
                          ? context.herTheme.slides.indicatorActive
                          : context.herTheme.slides.indicatorInactive,
                      borderRadius: BorderRadius.circular(9),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<_FaithTip> _fallback(String category) => category == 'tasbih'
      ? const [
          _FaithTip(
            'ورد صغير مستمر',
            'ابدأ بثلاث وثلاثين تسبيحة واختار هدفًا يناسب طاقتك اليوم.',
            'معلومة عن التسبيح',
          ),
          _FaithTip(
            'لحظة هدوء',
            'ركزي مع الذكر نفسه بدل السرعة؛ الهدوء هو الهدف وليس إنهاء الرقم فقط.',
            'معلومة عن التسبيح',
          ),
        ]
      : category == 'friday'
      ? const [
          _FaithTip(
            'يوم الجمعة المبارك',
            'اجعل لقراءة سورة الكهف مساحة هادئة في يومك ولو على مراحل.',
            'سورة الكهف',
          ),
          _FaithTip(
            'أكثري من الصلاة على النبي ﷺ',
            'ورد قصير ومتكرر يملأ اليوم بركة وطمأنينة.',
            'ورد الجمعة',
          ),
        ]
      : const [
          _FaithTip(
            'خطوة للصلاة',
            'جهّز سجادتك أو منبهك قبل دخول الوقت بدقائق؛ الاستعداد الهادئ يجعل البداية أسهل.',
            'نصيحة يومية',
          ),
          _FaithTip(
            'بعد الصلاة',
            'اختار ذكرًا قصيرًا بعد كل صلاة؛ الاستمرار القليل ألطف من هدف كبير ينقطع.',
            'نصيحة يومية',
          ),
        ];
}

class _FaithTip {
  const _FaithTip(this.title, this.body, this.subtitle);
  final String title, body, subtitle;
}
