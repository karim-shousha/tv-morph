/* Device selection presentation; discovery/install transports stay in native providers.
 * Returns selection state to the host instead of sharing mutable controller variables.
 */
(function (window) {
  'use strict';

  window.MorphDeviceController = {
    select: function (brand, ready = false) {
      const $ = selector => document.querySelector(selector);
      let fireTVMode = false,
        activePlatform = 'auto',
        connectionReady = ready;
      const pickedBrand = brand;
      if (brand === 'vidaa') brand = 'other';
      fireTVMode = brand === 'firetv';
      if (fireTVMode) brand = 'android';
      const names = {
        android: 'Android TV / Google TV',
        samsung: 'Samsung · Tizen',
        lg: 'LG · webOS',
        vidaa: 'Hisense · VIDAA',
        other: 'نظام غير مدعوم'
      };
      $('#install-title').textContent = names[pickedBrand] || 'اختار شاشتك علشان نجهّز التثبيت';
      $('#smart-install').disabled = !['android', 'samsung', 'lg'].includes(brand);
      $('#smart-install').textContent = brand === 'android' ? ready ? 'تثبيت / تحديث على Android TV' : 'تجهيز أول تثبيت على Android TV' : brand === 'samsung' ? ready ? 'تثبيت Morph TV على Samsung' : 'تجهيز تثبيت Samsung' : pickedBrand === 'vidaa' ? 'تثبيت VIDAA غير متاح حاليًا' : brand === 'lg' ? 'تثبيت / تحديث Morph TV على LG' : 'اختار تلفزيونك أولًا';
      $('#smart-install-note').textContent = brand === 'vidaa' ? 'VIDAA نظام مختلف عن Android. الاكتشاف ممكن، لكن تثبيت Morph TV والريموت عليه لسه غير متاحين.' : brand === 'android' ? ready ? 'التحديث يتبعت للشاشة المرتبطة. التثبيت يحتاج موافقتك على التلفزيون.' : 'أول تثبيت يحتاج تنزيل نسخة Android على الشاشة وفتحها للربط بالكود.' : brand === 'samsung' ? 'Samsung Tizen 4.0 فأحدث (موديلات 2018 فأحدث): فعّل Developer Mode. الحزمة تُوقّع لشاشتك؛ التوافق على الأجهزة القديمة تجريبي.' : brand === 'lg' ? 'LG webOS 5+: فعّل Developer Mode وKey Server. عند التثبيت أدخل Passphrase الظاهر على الشاشة؛ ليس كلمة مرور حساب LG.' : 'ابحث واختار تلفزيونك أولًا.';
      $('#public-tv-download').hidden = brand !== 'android';
      $('#public-tv-url').hidden = brand !== 'android';
      $('#platform-package').textContent = brand === 'android' ? 'ملف Android TV متاح للتنزيل العام. التحديث المباشر متاح للشاشة المرتبطة الداعمة له.' : brand === 'samsung' ? 'حزمة Tizen تُجهّز وتُوقّع لجهازك من زر التثبيت. لا تستخدم ملف Android APK.' : brand === 'lg' ? 'Morph TV LG: حزمة IPK مرفقة بالتحديث. التثبيت والربط عبر Developer Mode وKey Server؛ ملف IPK لا يُثبّت من متصفح التلفزيون.' : pickedBrand === 'vidaa' ? 'نسخة VIDAA غير متوفرة بعد؛ لا يوجد رابط تثبيت صالح حاليًا. ملف APK لن يعمل على هذه الشاشة.' : '';
      activePlatform = brand || 'auto';
      connectionReady = ready;
      MorphGuide.setType(fireTVMode ? 'firetv' : activePlatform);
      $('#android-pair').hidden = activePlatform !== 'android';
      ['apply', 'refresh-apps', 'save-pins'].forEach(id => $('#' + id).disabled = !ready || !['samsung', 'android', 'lg'].includes(activePlatform));
      $('#install').disabled = !ready || activePlatform !== 'samsung';
      $('#platform-disclaimer').textContent = activePlatform === 'samsung' ? 'حسابك وكلمة السر في صفحة Samsung الرسمية فقط. التثبيت كتطبيق مستقل.' : activePlatform === 'android' ? 'التثبيت الأول APK على التلفزيون، وبعده الربط بالكود والتخصيص من الموبايل. خلي التطبيق مفتوحًا على الشاشة.' : activePlatform === 'vidaa' ? 'VIDAA غير مدعوم للتثبيت والريموت حاليًا.' : activePlatform === 'lg' ? 'تثبيت LG بوضع المطور فقط. بعد التثبيت اضغط ربط LG بالمفتاح وافتح Morph TV على الشاشة، ثم افحص الاتصال. التحكم داخل Morph TV فقط ولا يستبدل Home.' : 'اختار النظام واتبع الدليل. ممكن تجهّز الثيمات قبل الاتصال.';
      $('#android-pair h2').textContent = fireTVMode ? 'ربط Fire TV' : 'ربط Android TV';
      if (fireTVMode) {
        $('#install-title').textContent = 'Amazon Fire TV · Fire OS';
        $('#smart-install').textContent = ready ? 'تحديث Fire TV من الموبايل' : 'تثبيت على Fire TV مباشرة · ADB';
        $('#smart-install-note').textContent = 'نفس شبكة Wi-Fi، فعّل ADB Debugging ثم وافق على السماح على شاشة Fire TV. الإرسال تجريبي؛ Downloader متاح كبديل لأول تثبيت.';
        $('#platform-package').textContent = 'هنرسل نفس APK الموقّع الخاص بالتلفزيون. إصدار Android 8 أو أحدث مطلوب؛ Vega OS لا يدعم الملف.';
      }
      return {
        platform: activePlatform,
        fireTV: fireTVMode,
        ready: connectionReady
      };
    }
  };
})(window);
