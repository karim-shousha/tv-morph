/* Bridge follows its launcher; it has no separate language preference. */
(function (w) {
  'use strict';
  var host = null, lang = 'en', records = new WeakMap();
  try { if (w.parent !== w) host = w.parent; } catch (ignore) {}
  var pairs = [
    ['قطع الاتصال','Disconnect'],
    ['تم الاتصال ✓ اختار تطبيقًا من القائمة، أو ضيف تطبيقات من الموبايل.','Connected ✓ Choose an app, or add apps from your phone.'],
    ['الاتصال بالموبايل انقطع. افتح Bridge على الموبايل واربط التلفزيون مرة أخرى.','Phone connection lost. Open Bridge on your phone and reconnect your TV.'],
    ['لم يصل تأكيد من الموبايل. ارجع لـBridge وتحقق من الاتصال ثم افتح كودًا جديدًا.','No confirmation arrived from your phone. Return to Bridge, check the connection and open a fresh code.'],
    ["الكود اتقبل، لكن الاتصال لم يكتمل. ارجع لـBridge على الموبايل وافتح التصحيح اللاسلكي.","The code was accepted, but connection did not finish. Return to Bridge on your phone and open Wireless debugging."],
    ["اضغط اتصال من الموبايل. مش محتاج تكتب حاجة هنا أثناء الربط.", "Tap Connect on your phone. No TV input is needed for connection."],
    ["الاتصال من الموبايل", "Connect from your phone"],
    ["افتح Bridge على الموبايل واختار هذا التلفزيون. بيانات الاتصال بتوصل تلقائيًا.", "Open Bridge on your phone and select this TV. Connection details arrive automatically."],
    ["عنوان IP التلفزيون", "TV IP address"],
    ["لا تكتب كود أندرويد هنا. خانة تجهيز الموبايل بتظهر بعد الربط، لما تبدأ التجهيز من الموبايل.", "Do not enter an Android code here. Phone setup appears after connection when you start it on your phone."],
    ["تجهيز الموبايل من التلفزيون", "Set up your phone from the TV"],
    ["على الموبايل: افتح التصحيح اللاسلكي ← إقران الجهاز باستخدام رمز، وسيب نافذة الكود مفتوحة.", "On your phone: Wireless debugging → Pair device with pairing code. Keep the dialog open."],
    ["عنوان IP الموبايل · متصل تلقائيًا", "Phone IP address · connected automatically"],
    ["كود أندرويد الظاهر على الموبايل · 6 أرقام", "Android code shown on your phone · 6 digits"],
    ["اتصال", "Connect"],
    ["إلغاء والرجوع للتطبيقات", "Cancel and return to apps"],
    ["الرجوع للتطبيقات", "Return to apps"],
    ["اكتب كود أندرويد الظاهر على الموبايل، ثم اضغط اتصال.", "Enter the Android code shown on your phone, then choose Connect."],
    ["افتح نافذة كود أندرويد على الموبايل وانتظر لحظة، ثم اضغط اتصال مرة أخرى.", "Open the Android code dialog on your phone, wait a moment, then choose Connect again."],
    ["جاري الاقتران وتشغيل المساعد… سيب نافذة الكود مفتوحة.", "Pairing and starting the helper… Keep the code dialog open."],
    ["الاقتران لم يكتمل. افتح كود جديد على الموبايل واكتبه هنا.", "Pairing did not finish. Open a fresh code on your phone and enter it here."],
    ["الاقتران نجح ✓ ارجع لـBridge على الموبايل لإكمال تشغيل المساعد.", "Pairing succeeded ✓ Return to Bridge on your phone to finish starting the helper."],
    ["الاتصال نجح ✓ ارجع لـBridge على الموبايل واختار تطبيقاتك.", "Connected ✓ Return to Bridge on your phone to choose your apps."],
    ["انتهى وقت المحاولة. ارجع لخطوة التجهيز على الموبايل وابدأ مرة أخرى.", "This attempt expired. Return to phone setup and start again."],
    ["اكتب نفس الستة أرقام الظاهرة في إعدادات أندرويد.", "Enter the same six digits shown in Android settings."],
    ["غير متاح · اتصل بشبكة Wi-Fi", "Unavailable · connect to Wi-Fi"],
    ['الاتصال','Connection'],['عنوان الموبايل','Phone address'],['تشغيل التطبيقات','App playback'],['بيانات تقنية','Technical details'],['لم يبدأ','Not started'],['جاهز','Ready'],
    ['الاتصال جاهز. افتح تطبيقًا من قائمة التطبيقات.','Connected. Choose an app from your app library.'],
    ['افتح Bridge على الموبايل، وابحث عن هذا التلفزيون واضغط عليه للاتصال.','Open Bridge on your phone, find this TV and select it to connect.'],
    ['جاري فتح التطبيق على التلفزيون…','Opening the app on your TV…'],
    ['لم يكتمل تشغيل التطبيق. راجع رسالة Bridge على الموبايل ثم حاول مرة أخرى.','The app did not start. Check Bridge on your phone, then try again.'],

    ['تطبيقات موبايلك، على الشاشة الكبيرة.','Your phone apps. On the big screen.'],
    ['نفس شبكة Wi-Fi على الجهازين.','Connect both devices to the same Wi-Fi.'],
    ['اختار تطبيقاتك والتلفزيون من Bridge على الموبايل.','Choose your apps and TV in Bridge on your phone.'],
    ['اضغط اتصال، أو اكتب بيانات الموبايل هنا.','Tap Connect, or enter your phone details here.'],
    ['غير متصل','Not connected'], ['متصل بالموبايل','Connected to phone'], ['جاري إعادة الاتصال','Reconnecting'],
    ['من موبايلك للشاشة الكبيرة','From your phone to the big screen'],
    ['خلّينا نوصل موبايلك.','Let’s connect your phone.'],
    ['تطبيقات موبايلك على التلفزيون، والتحكّم بالريموت.','Your phone apps on TV, controlled with your remote.'],
    ['خلّي الموبايل والتلفزيون على نفس شبكة Wi-Fi.','Connect your phone and TV to the same Wi-Fi network.'],
    ['افتح Bridge في تطبيق Morph TV على الموبايل، واختار تطبيقاتك ثم التلفزيون.','Open Bridge in Morph TV on your phone, choose your apps, then choose your TV.'],
    ['اضغط اتصال من الموبايل. لو الربط التلقائي ما اشتغلش، اكتب بياناته هنا.','Tap Connect on your phone. If automatic connection fails, enter its details here.'],
    ['الاتصال بالموبايل','Connect to your phone'],
    ['استخدم عنوان الموبايل وكود Bridge الظاهرين في التطبيق، مش كود اقتران أندرويد.','Use the phone address and Bridge code shown in the app, rather than the Android pairing code.'],
    ['عنوان IP الموبايل','Phone IP address'], ['كود Bridge من الموبايل','Bridge code from your phone'],
    ['اتصال بالموبايل','Connect to phone'], ['تفاصيل الاتصال','Connection details'],
    ['شاشتك. تطبيقاتك. براحتك.','Your screen. Your apps. Your way.'],
    ['كل تطبيقاتك، في مكان واحد.','All your apps in one place.'], ['بحث','Search'], ['ابحث عن تطبيق','Search for an app'],
    ['اختار تطبيق بالريموت','Choose an app with your remote'], ['تطبيقاتك من الموبايل','Your phone apps'],
    ['تنقّل بالأسهم','Navigate with arrows'], ['افتح التطبيق','Open app'], ['رجوع','Back'],
    ['موبايلك متاح لاستخدامك عادي','Keep using your phone as usual'],
    ['ضغطة سهم: حركة دقيقة • ضغط مستمر: حركة سلسة • OK: ضغط • Back: رجوع • Back مرتين: اللانشر','Arrow: precise movement • Hold: smooth movement • OK: click • Back: go back • Back twice: launcher'],
    ['اختبار الصورة والصوت','Test video and audio'], ['ضيف اللي تحبّه.','Add the apps you love.'],
    ['١. افتح Morph Bridge على الموبايل.','1. Open Morph Bridge on your phone.'],
    ['٢. علّم على التطبيقات اللي عايزها.','2. Select the apps you want.'],
    ['٣. هتظهر هنا تلقائيًا، وافتحها بريموت التلفزيون.','3. They appear here automatically. Open them with your TV remote.'],
    ['رجوع للتطبيقات','Back to apps'], ['ضيف تطبيقات من موبايلك','Add apps from your phone'],
    ['ابحث أو اختار تطبيق بالريموت','Search or choose an app with your remote'],
    ['اكتب عنوان IP الموبايل الصحيح وكود الربط المكوّن من 6 أرقام.','Enter a valid phone IP address and a 6-digit Bridge code.'],
    ['إضافة تطبيق','Add app'], ['نتائج البحث','Search results'],
    ['في انتظار الموبايل… اختار التلفزيون واضغط اتصال في Morph Bridge.','Waiting for your phone… Choose this TV and tap Connect in Morph Bridge.'],
    ['انقطع الاتصال.','Connection lost.'],
    ['فشل الاتصال. راجع عنوان IP وشبكة Wi-Fi وتطبيق الموبايل.','Connection failed. Check IP, Wi-Fi, and the phone app.'],
    ['جاري إعادة الاتصال بالموبايل…','Reconnecting to your phone…'],
    ['أعد الاتصال بالموبايل قبل فتح تطبيق.','Reconnect your phone before opening an app.'],
    ['جاري الاتصال…','connecting…'], ['جاري الفتح…','starting…'], ['قيد التشغيل','playing'], ['جاري الاستقبال…','receiving…']
  ];
  function translate(text) {
    var result = text, trimmed = text.trim();
    pairs.some(function (pair) {
      if (trimmed !== pair[0] && trimmed !== pair[1]) return false;
      result = text.replace(trimmed, lang === 'ar' ? pair[0] : pair[1]); return true;
    });
    if (lang !== 'ar') {
      result = result.replace(/^(\d+) تطبيقات من موبايلك$/, '$1 apps from your phone').replace(/^فتح /, 'Open ');
      try { if (host && host.MorphLocale && lang !== 'en') result = host.MorphLocale.text(result); } catch (ignore) {}
    } else result = result.replace(/^(\d+) apps from your phone$/, '$1 تطبيقات من موبايلك').replace(/^Open /, 'فتح ');
    return result;
  }
  function render(root) {
    if (root.nodeType === 3) {
      if (!root.parentNode || root.parentNode.nodeType!==1 || root.parentNode.closest('.morph-plus-overlay'))return;
      if (/^(SCRIPT|STYLE|PRE)$/.test(root.parentNode.tagName) || root.parentNode.className === 'app-label') return;
      var saved = records.get(root), source = saved && saved.output === root.nodeValue ? saved.source : root.nodeValue;
      var output = translate(source); records.set(root, {source:source, output:output});
      if (root.nodeValue !== output) root.nodeValue = output;
    } else if (root.nodeType === 1) {
      if(root.closest('.morph-plus-overlay'))return;
      ['placeholder','aria-label'].forEach(function (name) {
        if (root.hasAttribute(name)) root.setAttribute(name, translate(root.getAttribute(name)));
      });
      Array.prototype.forEach.call(root.childNodes, render);
    }
  }
  function sync() {
    try {
      if (host && host.MorphLocale) lang = host.MorphLocale.get();
      else if (w.MorphDevice && w.MorphDevice.launcherSettings) lang = JSON.parse(w.MorphDevice.launcherSettings()).language || 'en';
      else lang = localStorage.getItem('tvmorph.language') || 'en';
    } catch (ignore) { lang = 'en'; }
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    render(document.body);
  }
  var observer = new MutationObserver(function (changes) {
    changes.forEach(function (change) {
      if (change.type === 'characterData') render(change.target);
      else Array.prototype.forEach.call(change.addedNodes, render);
    });
  });
  sync(); observer.observe(document.body, {childList:true,subtree:true,characterData:true});
  if (host) host.addEventListener('morphLanguage', sync);
  w.addEventListener('storage', function (event) { if (event.key === 'tvmorph.language') sync(); });
  w.addEventListener('pagehide', function () { observer.disconnect(); if (host) host.removeEventListener('morphLanguage', sync); });
})(window);
