/* Approved Studio presentation. Move existing controls, preserving their native handlers. */
(function (w, d) {
 'use strict';
 var $ = function (id) { return d.getElementById(id); };
 function init() {
  if (!w.Morph30 || d.querySelector('.studio-reconnect')) return;
  d.body.setAttribute('data-studio-shell', '');
  var studio = $('page-studio'), heading = $('m30-design-heading');
  var actions = d.querySelector('header .m30-head-actions');
  var chip = $('device-chip'), prefs = $('m30-sheet-body');
  if (chip && prefs) { var device = d.createElement('div'); device.className = 'studio-device-setting'; device.appendChild(chip); prefs.insertBefore(device, prefs.firstChild); chip.addEventListener('click', function () { $('m30-settings-close').click(); }); }
  var reconnect = $('reconnect-action');
  reconnect.className = 'studio-reconnect'; reconnect.type = 'button'; reconnect.setAttribute('data-no-translate', '');
  reconnect.textContent = 'Reconnect';
  reconnect.addEventListener('click', function () { Morph30.show('devices'); if (w.MorphConnectFlow) MorphConnectFlow.showManual(); });
  actions.insertBefore(reconnect, actions.firstChild);
  var logo = d.querySelector('header .brand');
  logo.innerHTML = '<img class="studio-official-wordmark" src="morph-wordmark.webp" alt="Morph TV">';
  logo.setAttribute('aria-label', 'Morph TV');
  var kicker = d.createElement('span'); kicker.className = 'studio-kicker'; kicker.dir = 'ltr'; kicker.setAttribute('data-no-translate', ''); kicker.textContent = 'YOUR TV. YOUR WAY.';
  heading.insertBefore(kicker, heading.firstChild);
  var previewHeading = studio.querySelector('.preview-heading'); previewHeading.setAttribute('data-no-translate', '');
  var line = d.createElement('div'); line.className = 'studio-theme-line'; line.setAttribute('data-no-translate', '');
  line.innerHTML = '<span class="studio-theme-name"></span><button type="button"><span></span><span aria-hidden="true">‹</span></button>';
  $('preview').after(line);
  var library = $('theme-library'); library.open = false;
  line.querySelector('button').onclick = function () { if(w.MorphStudio){MorphStudio.open('library');return;}library.open = true; library.scrollIntoView({block:'start', behavior:'smooth'}); library.querySelector('summary').focus(); };
  var shortcuts = studio.querySelector('.studio-shortcuts'); shortcuts.replaceChildren(); shortcuts.className = 'studio-quick-actions'; shortcuts.setAttribute('data-no-translate', '');
  [['control','control'],['apps','apps'],['cast','cast']].forEach(function (entry) {
   var b = d.createElement('button'); b.type = 'button'; b.dataset.studioDestination = entry[0]; b.innerHTML = Morph30.svg(entry[1], 24) + '<span></span>'; b.onclick = function () { Morph30.show(entry[0]); }; shortcuts.appendChild(b);
  });
  line.after(shortcuts);
  var group = d.createElement('div'); group.className = 'studio-personal-group';
  var groupTitle = d.createElement('h2'); groupTitle.id = 'studio-personal-title'; groupTitle.setAttribute('data-no-translate', ''); shortcuts.after(groupTitle); groupTitle.after(group);
  group.appendChild(library);
  var personal = $('personal-touch'); personal.open = false; group.appendChild(personal);
  var image = $('free-theme-image');
  if (image) { image.open = false; group.appendChild(image); }
  var apply = $('apply'); apply.setAttribute('data-no-translate', '');
  var notice = $('reconnect-notice');
  var nav = d.querySelector('.bottom-nav');
  function fitApplyBar() { d.body.style.setProperty('--studio-nav-height', nav.getBoundingClientRect().height + 'px'); }
  if (w.ResizeObserver) new ResizeObserver(fitApplyBar).observe(nav);
  w.addEventListener('resize', fitApplyBar); fitApplyBar();
  // Error details remain in the connection guide; only one compact action occupies the header.
  if (notice) notice.setAttribute('aria-hidden', 'true');
  function labels() {
   var language = w.MorphLocale ? MorphLocale.get() : 'ar', ar = language === 'ar';
   var copy = {
    ar:['شاشتك، على ذوقك.','كل تفاصيل تلفزيونك، في إيدك.','تصميم شاشتك','معاينة التصميم','تغيير الثيم','لمستك الخاصة','الريموت','التطبيقات','Cast Screen','تطبيق الثيم على التلفزيون','إعادة الاتصال بالتلفزيون'],
    en:['Your TV. Your way.','Every detail of your TV, in your hands.','Your screen design','Design preview','Change theme','Make it yours','Remote','Apps','Cast Screen','Apply theme to TV','Reconnect to TV'],
    fr:['Votre TV, à votre image.','Tous les détails de votre TV, à portée de main.','Votre écran','Aperçu du design','Changer de thème','Votre touche personnelle','Télécommande','Applis','Diffuser','Appliquer à la TV','Reconnecter la TV'],
    zh:['你的电视，你的风格。','电视的每个细节，尽在掌握。','屏幕设计','设计预览','更换主题','个性化','遥控','应用','投屏','应用到电视','重新连接电视'],
    ja:['テレビを、あなたらしく。','テレビのすべてを、その手に。','画面のデザイン','デザインプレビュー','テーマを変更','自分らしく','リモコン','アプリ','画面共有','テレビに適用','テレビに再接続']
   }[language] || null;
   if (!copy) copy = ['Your TV. Your way.','Every detail of your TV, in your hands.','Your screen design','Design preview','Change theme','Make it yours','Remote','Apps','Cast Screen','Apply theme to TV','Reconnect to TV'];
   previewHeading.querySelector('h2').textContent = copy[2]; previewHeading.querySelector('span').textContent = copy[3];
   line.querySelector('button>span').textContent = copy[4]; groupTitle.textContent = copy[5];
   shortcuts.querySelectorAll('button>span:not(.approved-quick-copy)').forEach(function (el, i) { el.textContent = copy[6+i]; });
   apply.textContent = copy[9]; reconnect.setAttribute('aria-label', copy[10]);
   var ps = personal.querySelector('summary'); ps.setAttribute('data-no-translate', '');
   ps.querySelector('strong').textContent = (ar ? 'الخلفية والألوان' : language === 'fr' ? 'Fond et couleurs' : language === 'zh' ? '背景与颜色' : language === 'ja' ? '背景とカラー' : 'Background & colors');
   var hint = ps.querySelector('span:not(.approved-photo-art)'); if (hint) hint.textContent = ar ? 'صورتك، ألوانك، وتفاصيلك' : language === 'fr' ? 'Vos images et vos couleurs' : language === 'zh' ? '你的照片与颜色' : language === 'ja' ? '写真やカラーをカスタマイズ' : 'Your images, colors and details';
   syncTheme();
  }
  function syncTheme() {
   line.querySelector('.studio-theme-name').textContent = $('selected-theme').textContent;
   var preview = $('preview'), reference = d.createElement('div');
   var colors = {night:['#0c1120','#292e46'],blue:['#142236','#82c1c9']}[preview.dataset.theme];
   if (colors) reference.style.background = 'linear-gradient(125deg,' + colors.join(',') + ')';
   preview.toggleAttribute('data-studio-default-preview', !!colors && preview.style.background === reference.style.background);
  }
  new MutationObserver(syncTheme).observe($('selected-theme'), {childList:true,characterData:true,subtree:true});
  new MutationObserver(syncTheme).observe($('preview'), {attributes:true,attributeFilter:['style','data-theme']});
  function syncConnection() { var saved=$('tv-ip')&&$('tv-ip').value.trim(),ar=w.MorphLocale&&MorphLocale.get()==='ar',label=saved?(ar?'إعادة الاتصال':'Reconnect'):(ar?'ربط التلفزيون':'Connect TV');reconnect.setAttribute('aria-label',label);reconnect.title=label;reconnect.classList.toggle('needs-connection', !notice.hidden);if(reconnect.textContent!==label)reconnect.textContent=label; }
  new MutationObserver(syncConnection).observe(notice, {attributes:true,attributeFilter:['hidden']}); syncConnection();
  new MutationObserver(syncConnection).observe(reconnect, {childList:true});
  w.addEventListener('morphLanguage', function(){labels();syncConnection();}); w.addEventListener('morphPlus', labels); w.addEventListener('morphPacks', labels);
  if (w.MorphPlus && MorphPlus.ready) MorphPlus.ready.then(labels);
  labels();
 }
 if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})(window, document);
