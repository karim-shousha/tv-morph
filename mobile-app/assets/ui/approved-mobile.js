/* Approved daylight layout. Reuse live controls and native connection handlers. */
(function (w, d) {
 'use strict';
 var $ = function (id) { return d.getElementById(id); };
 function init() {
  if (!w.Morph30 || d.body.hasAttribute('data-approved-mobile')) return;
  d.body.setAttribute('data-approved-mobile', '');
  var studio = $('page-studio'), heading = $('m30-design-heading');
  var brand = d.querySelector('header .brand');
  brand.innerHTML = '<span class="approved-brand-logo"><img src="morph-wordmark.webp" alt="Morph TV"><span class="approved-logo-ink" aria-hidden="true"></span></span>';
  var previewCard = d.createElement('section'); previewCard.className = 'approved-preview-card';
  studio.querySelector('.preview-heading').before(previewCard);
  [studio.querySelector('.preview-heading'), $('preview'), studio.querySelector('.studio-theme-line')].forEach(function (el) { previewCard.appendChild(el); });
  var shortcuts = studio.querySelector('.studio-quick-actions');
  var apps = shortcuts.querySelector('[data-studio-destination=apps]'); if (apps) apps.remove();
  shortcuts.querySelectorAll('button').forEach(function (button) {
   var label = button.querySelector('span'), text = d.createElement('span'); text.className = 'approved-quick-copy';
   label.before(text); text.appendChild(label);
   var note = d.createElement('small'); text.appendChild(note);
  });
  var personal = $('personal-touch'), library = $('theme-library');
  var personalContent = personal.querySelector('.customization-content');
  var image = $('free-theme-image'); if (image && personalContent) personalContent.appendChild(image);
  [library, personal].forEach(function (detail, index) {
   var summary = detail.querySelector('summary');
   var art = d.createElement('span'); art.className = index ? 'approved-photo-art' : 'approved-swatch-art'; art.setAttribute('aria-hidden', 'true');
   art.innerHTML = index ? Morph30.svg('design', 24) : '<i></i><i></i><i></i>';
   summary.prepend(art);
   if (!index) {
    var note = d.createElement('small'); note.className = 'approved-library-note'; summary.appendChild(note);
   }
  });
  var titleIcon = d.createElement('span'); titleIcon.className = 'approved-personal-icon'; titleIcon.innerHTML = Morph30.svg('design', 21); $('studio-personal-title').appendChild(titleIcon);
  var applyBar = $('m30-applybar'); studio.appendChild(applyBar);
  // Secondary features remain available in Settings and the theme library.
  var packs = $('phone-theme-packs'); if (packs) library.appendChild(packs);
  var extras = d.createElement('div'); extras.className = 'approved-extra-settings';
  Array.prototype.slice.call(studio.children).forEach(function (el) {
   if (el === applyBar || el === heading || el === previewCard || el === shortcuts || el === $('studio-personal-title') || el.classList.contains('studio-personal-group') || el.classList.contains('studio-banner') || el.id === 'club-details') return;
   extras.appendChild(el);
  });
  $('m30-sheet-body').appendChild(extras);
  var gear = $('m30-gear-btn'); if (gear) gear.innerHTML = Morph30.svg('gear', 20);
  function labels() {
   var ar = w.MorphLocale && MorphLocale.get() === 'ar';
   // Existing locale handlers still own all other supported languages.
   if (!ar && w.MorphLocale && MorphLocale.get() !== 'en') return;
   [['iptv-phone-open','play',ar?'على الموبايل':'On phone',ar?'شاهد هنا مباشرة':'Watch on your phone'],['iptv-tv-show','remote',ar?'على التلفزيون':'On TV',ar?'شغّل على شاشتك':'Play on your TV']].forEach(function(row){var button=$(row[0]);button.innerHTML='<img class="iptv-destination-art" src="'+(row[0]==='iptv-phone-open'?'iptv-device-phone.png':'iptv-home-tv.png')+'" alt="" aria-hidden="true"><span><strong>'+row[2]+'</strong><small>'+row[3]+'</small></span>';});
   var kicker = heading.querySelector('.studio-kicker'); kicker.dir = ar ? 'rtl' : 'ltr'; kicker.textContent = ar ? 'مساحة تشبهك' : 'A SPACE THAT FEELS LIKE YOU';
   previewCard.querySelector('h2').textContent = ar ? 'شاشتك الجديدة' : 'Your new screen';
   previewCard.querySelector('.preview-heading>span').textContent = ar ? 'معاينة' : 'Preview';
   shortcuts.querySelectorAll('button').forEach(function (button) {
    var remote = button.dataset.studioDestination === 'control';
    button.querySelector('.approved-quick-copy>span').textContent = remote ? (ar ? 'الريموت' : 'Remote') : 'Cast Screen';
    button.querySelector('small').textContent = remote ? (ar ? 'كل التحكم في إيدك' : 'Control at your fingertips') : (ar ? 'شارك على الشاشة' : 'Share to your TV');
   });
   // Keep the title's icon when the older Studio label handler replaces its text.
   $('studio-personal-title').textContent = ar ? 'اعملها بطريقتك' : 'Make it yours'; $('studio-personal-title').appendChild(titleIcon);
   library.querySelector('summary h2').textContent = ar ? 'مكتبة الثيمات' : 'Theme library';
   library.querySelector('.approved-library-note').textContent = ar ? 'اختار الستايل اللي يشبهك' : 'Find a look that feels like you';
   personal.querySelector('summary strong').textContent = (ar ? 'الخلفية والألوان' : 'Background & colors');
   var personalHint=personal.querySelector('summary .studio-design-action-copy>span')||personal.querySelector('summary>span:not(.approved-photo-art)');if(personalHint)personalHint.textContent=ar?'ضيف صورتك ولمستك':'Add your own finishing touch';
   $('apply').innerHTML = Morph30.svg('check', 19) + '<span>' + (ar ? 'تطبيق الثيم على التلفزيون' : 'Apply theme to TV') + '</span>';
  }
  ['morphLanguage', 'morphPlus', 'morphPacks', 'load'].forEach(function (event) { w.addEventListener(event, labels); });
  if (w.MorphPlus && MorphPlus.ready) MorphPlus.ready.then(labels);
  labels();
 }
 if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})(window, document);
