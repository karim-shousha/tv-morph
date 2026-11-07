# Morph Launcher — LAB LIGHT (نسخة تجارب معزولة)

هذه النسخة للتجربة فقط. الأصلي (`pc-app/build/ui` + `pc-app/main.cjs`) لم يُمس.

## التشغيل

من فولدر `pc-app`:

الأصلي:
```
node node_modules\electron\cli.js .
```

المعمل (ببروفايل منفصل حتى لا يمس حسابك):
```
$env:MORPH_PC_TEST_DATA="$env:TEMP\morph-lab-profile"
node node_modules\electron\cli.js main-lab-light.cjs
```

## ما تغيّر في المعمل فقط (`build/ui-lab-light/iptv/`)

1. `index.html`: 11 سكربت غير حرجة أصبحت `defer` (parental, prayer, matches, subscription-qr, qrcode, nacl, connection-help, protocol-help, clock-adjust, card-alignment). نفس الملفات، تتحمل بعد رسم الصفحة.
2. `brand-loader.js`: شبكة أمان 10 ثواني لإخفاء شاشة اللودنج لو الـ boot علّق (الأصلي بلا مهلة).
3. `stream-ui.js`: أقسام trending/popular/sports الإضافية (`providerShelves`) تُطلب بعد 1.8 ثانية من استقرار الـ Home بدل فوري، وتُلغى لو تنقلت لقسم آخر. تفاصيل الـ hero بعد 1.5 ثانية بدل 0.65 ولا تعمل والصفحة مخفية.
4. `app.js`: طلب `history` مشترك واحد صالح 5 ثواني بدل طلبين متوازيين، وذاكرة صفحات الأقسام 6 بدل 3 (رجوع أسرع).
5. `ui/modern-shell.css` (إصلاح عرض خاص بالمعمل فقط): السايدبار كان طالع فوق اللوجو والدوك كان مقصوص بسبب قاعدة TV جديدة غير ملتزمةة (`top:50% + translateY(-50%)` تتعارض مع `top:168px` على الديسكتوب + `overflow-y:hidden` يقص اللابل). الإصلاح الكانوني مكانه `tv-project/app/ui/modern-shell.css` (شغل شات تاني، متلمسش).

العرض والشكل والقوائم كما هي — فقط توقيت الطلبات تغيّر.

## الرجوع

احذف `build/ui-lab-light/` و `main-lab-light.cjs` ومتغير `MORPH_PC_TEST_DATA`. لا شيء آخر تأثر.
