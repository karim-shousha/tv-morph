/* Offline worship adapted from HER's bundled Quran and curated faith content.
 * No account, network request, group, challenge or online audio. Adhan uses local OS alarms. */
(function boot(w, d) {
  'use strict';
  if(d.readyState==='loading'){d.addEventListener('DOMContentLoaded',function(){boot(w,d)},{once:true});return;}
  var root = d.getElementById('page-worship'), content = w.MorphFaithContent;
  if (!root || !content) return;
  var KEY = 'morph.faith.local.v1', ENABLED = 'morph.faith.enabled.v1';
  function read(key, fallback) { try { var v = JSON.parse(localStorage.getItem(key)); return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback; } catch (e) { return fallback; } }
  var saved = read(KEY, {}), view = 'home', surah = 1, category = '', query = '', preset = 'أستغفر الله', loadToken = 0;
  if (!saved.counts || typeof saved.counts !== 'object') saved.counts = {};
  if (!saved.tasbih || typeof saved.tasbih !== 'object') saved.tasbih = {};
  if (!Array.isArray(saved.bookmarks)) saved.bookmarks = [];
  var enabled = false; try { enabled = localStorage.getItem(ENABLED) === '1'; } catch (ignore) {}
  var error = '';
  var prayerState = null, prayerDraft = null, prayerMessage = '', prayerBusy = false, prayerTimer=null, prayerSettingsOpen=null,voiceDownloading=false;
  function isArabic() { return w.MorphLocale && MorphLocale.get() === 'ar'; }
  function t(ar, en) { return isArabic() ? ar : en; }
  function el(tag, cls, text) { var node = d.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; }
  function icon(name) { var s = el('span', 'wf-icon'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = Morph30.svg(name, 24); return s; }
  function button(label, action, cls) { var b = el('button', cls || '', label); b.type = 'button'; b.onclick = action; return b; }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); error = ''; return true; } catch (e) { error = t('تعذّر حفظ التقدّم على الجهاز. تأكد من وجود مساحة متاحة.', 'Could not save your progress. Check available device storage.'); return false; } }
  function today() { var date = new Date(); return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(); }
  function compact(value) { return String(value).normalize('NFKD').replace(/[\u064b-\u065f\u0670\u0640]/g, '').toLowerCase(); }
  function go(next) { view = next; query = ''; category = ''; render(); try { w.scrollTo(0, 0); } catch (ignore) {} }
  function counter(key) { var n = Number(saved.tasbih[key]); return Number.isSafeInteger(n) && n >= 0 && n <= 1000000000 ? n : 0; }
  function setNav() {
    d.body.dataset.worshipEnabled = String(enabled);
    var nav = d.querySelector('.bottom-nav'); if (!nav) return;
    var faith = nav.querySelector('[data-page=worship]');
    if (!faith) { faith = button('', function () { Morph30.show('worship'); }); faith.dataset.page = 'worship'; nav.appendChild(faith); }
    faith.hidden=false;faith.setAttribute('aria-hidden','false');if(enabled)faith.removeAttribute('aria-haspopup');else faith.setAttribute('aria-haspopup','dialog');
    ['play', 'control', 'home', 'design', 'worship'].forEach(function (id) { var b = nav.querySelector('[data-page=' + id + ']'); if (b) nav.appendChild(b); });
    if (!enabled && !root.hidden) Morph30.show('home', { replace: true });
    if (w.Morph30) Morph30.repaint();
  }
  var settings = el('section', 'wf-setting'); settings.id = 'worship-setting'; settings.setAttribute('data-no-translate', '');
  var switchLabel = el('label', 'wf-setting-label'), copy = el('span'), settingTitle = el('strong'), settingDescription = el('small'), toggle = el('input'); toggle.type = 'checkbox'; toggle.id = 'worship-enable'; toggle.checked = enabled;
  copy.appendChild(settingTitle); copy.appendChild(settingDescription); switchLabel.appendChild(icon('worship')); switchLabel.appendChild(copy); switchLabel.appendChild(toggle); settings.appendChild(switchLabel);
  var body = d.getElementById('m30-sheet-body'); if (body) body.insertBefore(settings, body.children[1] || null);
  var prayerSettingsEntry=button('',function(){var close=d.getElementById('m30-settings-close');if(close)close.click();prayerSettingsOpen=true;Morph30.show('worship',{destination:'prayer_settings'});go('prayer')},'wf-settings-prayer');prayerSettingsEntry.id='worship-prayer-settings';prayerSettingsEntry.setAttribute('data-no-translate','');prayerSettingsEntry.appendChild(icon('moon'));var prayerSettingsWords=el('span');prayerSettingsWords.appendChild(el('strong'));prayerSettingsWords.appendChild(el('small'));prayerSettingsEntry.appendChild(prayerSettingsWords);prayerSettingsEntry.appendChild(el('span','','›'));settings.after(prayerSettingsEntry);
  toggle.onchange = function () { try { localStorage.setItem(ENABLED, this.checked ? '1' : '0'); enabled = this.checked; error = ''; } catch (e) { this.checked = enabled; error = t('تعذّر حفظ الاختيار على الجهاز.', 'Could not save your choice.'); } setNav(); render(); syncPrayerHost();try{if(w.ClearNative&&ClearNative.consumeWorshipOpen&&ClearNative.consumeWorshipOpen())MorphWorship.openPrayer()}catch(ignore){} };
  var enablePrompt=null,promptFocus=null;
  function closeEnablePrompt(){if(!enablePrompt)return false;enablePrompt.remove();enablePrompt=null;if(promptFocus&&promptFocus.isConnected)promptFocus.focus({preventScroll:true});return true;}
  function requestEnable(opts){
    if(enabled)return Morph30.show('worship',opts);
    if(enablePrompt)return false;
    promptFocus=d.activeElement;var overlay=el('div');overlay.id='worship-enable-prompt';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','worship-enable-title');overlay.dir=isArabic()?'rtl':'ltr';
    var card=el('section'),title=el('h2','',t('تفعيل ركن العبادات؟','Enable Prayer?')),words=el('p','',t('القرآن والأذكار والسبحة ومواقيت الصلاة، في مكان واحد. تقدر توقفه لاحقًا من الإعدادات.','Qur’an, adhkar, tasbih and prayer times in one place. You can turn it off later in Settings.')),status=el('p'),actions=el('div');title.id='worship-enable-title';status.setAttribute('role','alert');actions.className='wf-enable-actions';
    var confirm=button(t('تفعيل','Enable'),function(){
      try{localStorage.setItem(ENABLED,'1');}catch(e){status.textContent=t('تعذّر حفظ الاختيار. جرّب مرة تانية.','Could not save your choice. Please try again.');return;}
      enabled=true;toggle.checked=true;setNav();render();confirm.disabled=cancel.disabled=true;
      syncPrayerHost().then(function(){if(enablePrompt!==overlay)return;closeEnablePrompt();Morph30.show('worship',opts);});
    }),cancel=button(t('ليس الآن','Not now'),closeEnablePrompt);confirm.dataset.enablePrayer='';cancel.dataset.cancelPrayer='';actions.append(confirm,cancel);card.append(title,words,status,actions);overlay.appendChild(card);d.body.appendChild(overlay);enablePrompt=overlay;cancel.focus();
    overlay.onclick=function(e){if(e.target===overlay&&!confirm.disabled)closeEnablePrompt();};overlay.addEventListener('keydown',function(e){if(e.key==='Escape'&&!confirm.disabled){e.preventDefault();e.stopPropagation();closeEnablePrompt();}if(e.key==='Tab'){e.preventDefault();(d.activeElement===cancel?confirm:cancel).focus();}});return false;
  }
  var resetTarget = null;
  function pageHeading(title, subtitle) {
    var heading = el('div', 'wf-inner-heading');
    var back = button('', function () { backView(); }, 'wf-back'); back.appendChild(el('span', '', '←')); back.appendChild(el('span', '', t('رجوع', 'Back'))); heading.appendChild(back);
    var copy = el('div'); copy.appendChild(el('h1', '', title)); if (subtitle) copy.appendChild(el('p', '', subtitle)); heading.appendChild(copy); root.appendChild(heading);
  }
  function localNote() { var note = el('p', 'wf-local-note', t('محفوظ على موبايلك فقط · يعمل بدون إنترنت', 'Saved only on your phone · Works offline')); root.appendChild(note); }
  function home() {
    var hero = el('div', 'wf-hero'); hero.appendChild(icon('worship')); hero.appendChild(el('span', 'wf-eyebrow', t('وقت لروحك', 'YOUR QUIET MOMENT'))); hero.appendChild(el('h1', '', t('عباداتي', 'My Worship'))); hero.appendChild(el('p', '', t('اقرأ وردك، واذكر ربك، وخد لحظة هدوء.', 'Read, remember, and take a moment of calm.'))); root.appendChild(hero);
    var prayerCard = button('', function () { go('prayer'); }, 'wf-resume wf-prayer-entry'); prayerCard.appendChild(icon('moon')); var prayerCopy = el('span'); prayerCopy.appendChild(el('strong', '', t('الصلاة والأذان', 'Prayer times & Adhan'))); prayerCopy.appendChild(el('small', '', prayerState && prayerState.settings.configured ? prayerState.settings.city || t('مواقيتك المحلية', 'Your local prayer times') : t('اختار مدينتك وصوت المؤذن', 'Choose your city and muezzin'))); prayerCard.appendChild(prayerCopy); prayerCard.appendChild(el('span', '', '›')); root.appendChild(prayerCard);
    if (saved.position && Number.isInteger(saved.position.surah) && content.surahs[saved.position.surah - 1]) {
      var position = saved.position, info = content.surahs[position.surah - 1], resume = button('', function () { openSurah(position.surah, position.ayah); }, 'wf-resume');
      resume.appendChild(icon('worship')); var rcopy = el('span'); rcopy.appendChild(el('strong', '', t('كمّل قراءتك', 'Continue reading'))); rcopy.appendChild(el('small', '', info.name + ' · ' + t('آية ', 'Ayah ') + position.ayah)); resume.appendChild(rcopy); resume.appendChild(el('span', '', '›')); root.appendChild(resume);
    }
    var grid = el('div', 'wf-home-grid');
    [['quran', 'worship', t('القرآن الكريم', 'The Qur’an'), t('المصحف كاملًا · ١١٤ سورة', 'The complete Qur’an · 114 surahs')], ['tasbih', 'beads', t('التسبيح', 'Tasbih'), t('سبّح واحفظ عدّادك', 'A counter that keeps your place')], ['dhikr', 'moon', t('الأذكار', 'Adhkar'), t('الصباح والمساء وأذكار يومك', 'Morning, evening and daily remembrance')], ['dua', 'heart', t('الأدعية', 'Duas'), t('أدعية مع مصادرها', 'Supplications with their references')]].forEach(function (item) {
      var tile = button('', function () { go(item[0]); }, 'wf-tile wf-' + item[0]); tile.appendChild(icon(item[1])); tile.appendChild(el('strong', '', item[2])); tile.appendChild(el('small', '', item[3])); grid.appendChild(tile);
    }); root.appendChild(grid); localNote();
  }
  function search(label, action) { var wrap = el('label', 'wf-search'), input = el('input'); wrap.appendChild(icon('globe')); input.type = 'search'; input.setAttribute('aria-label', label); input.placeholder = label; input.value = query; wrap.appendChild(input); root.appendChild(wrap); input.oninput = function () { query = this.value; action(); }; }
  function quran() {
    pageHeading(t('القرآن الكريم', 'The Qur’an'), t('اختار سورة وابدأ القراءة.', 'Choose a surah to start reading.'));
    var bookmarksButton=button(t('العلامات المحفوظة','Saved bookmarks')+' · '+saved.bookmarks.length,function(){go('bookmarks')},'wf-bookmarks-open');root.appendChild(bookmarksButton);
    var list; search(t('ابحث عن سورة أو رقمها', 'Find a surah by name or number'), draw);
    list = el('div', 'wf-surahs'); root.appendChild(list);
    function draw() { if (!list) return; list.textContent = ''; content.surahs.filter(function (s) { return !query || compact(s.name + ' ' + s.id).indexOf(compact(query)) >= 0; }).forEach(function (s) {
      var row = button('', function () { openSurah(s.id,saved.position&&saved.position.surah===s.id?saved.position.ayah:1); }, 'wf-surah'); row.appendChild(el('span', 'wf-surah-number', String(s.id)));
      var names = el('span'); names.appendChild(el('strong', '', s.name)); names.appendChild(el('small', '', isArabic() ? s.count + ' آية' : 'Surah ' + s.id + ' · ' + s.count + ' ayahs')); row.appendChild(names); row.appendChild(el('span', 'wf-open-arrow', '›')); list.appendChild(row);
    }); if (!list.children.length) list.appendChild(el('p', 'wf-empty', t('مفيش سورة مطابقة للبحث.', 'No surah matches your search.'))); }
    draw(); localNote();
  }
  function openSurah(id, ayah) {
    if (!Number.isInteger(id) || id < 1 || id > 114) return;
    saved.position={surah:id,ayah:Math.max(1,Math.min(content.surahs[id-1].count,Number(ayah)||1))};persist();
    surah = id; view = 'reader'; var token = ++loadToken; renderReader(ayah, false);
    if (w.MorphQuran && MorphQuran[id]) { renderReader(ayah, true); return; }
    var script = el('script'); script.src = 'faith/quran/' + id + '.js';
    script.onload = function () { script.remove(); if (view === 'reader' && surah === id && token === loadToken) renderReader(ayah, true); };
    script.onerror = function () { script.remove(); if (token === loadToken) { var n = root.querySelector('.wf-reader-state'); if (n) n.textContent = t('تعذّر فتح السورة. ارجع وافتحها مرة تانية.', 'Could not open this surah. Go back and try again.'); } };
    d.head.appendChild(script);
  }
  function renderReader(ayah, loaded) {
    root.textContent = ''; var info = content.surahs[surah - 1]; pageHeading(info.name, t('القرآن الكريم · قراءة بدون إنترنت', 'The Qur’an · Offline reading'));
    var verses = w.MorphQuran && MorphQuran[surah];
    var appearance = el('label', 'wf-reading-appearance'), appearanceLabel = el('span', '', t('مظهر القراءة', 'Reading appearance')), choice = el('select'); choice.setAttribute('aria-label', appearanceLabel.textContent); [['system', t('نفس التطبيق', 'Match app')], ['day', t('نهاري', 'Day')], ['night', t('ليلي', 'Night')]].forEach(function (item) { var option = el('option', '', item[1]); option.value = item[0]; choice.appendChild(option); }); choice.value = ['day','night'].indexOf(saved.readingAppearance) >= 0 ? saved.readingAppearance : 'system'; root.dataset.readerAppearance = choice.value; choice.onchange = function () { saved.readingAppearance = choice.value; root.dataset.readerAppearance = choice.value; persist(); }; appearance.appendChild(appearanceLabel); appearance.appendChild(choice); root.appendChild(appearance);
    var sizing=el('div','wf-reader-sizing');sizing.appendChild(el('span','',t('خط القراءة','Reading text')));function sizeChange(step){saved.readerSize=Math.max(20,Math.min(36,(Number(saved.readerSize)||26)+step));root.style.setProperty('--wf-quran-size',saved.readerSize+'px');persist()}var smaller=button('أ−',function(){sizeChange(-2)}),larger=button('أ+',function(){sizeChange(2)});smaller.setAttribute('aria-label',t('تصغير خط القرآن','Smaller Quran text'));larger.setAttribute('aria-label',t('تكبير خط القرآن','Larger Quran text'));sizing.appendChild(smaller);sizing.appendChild(larger);root.appendChild(sizing);root.style.setProperty('--wf-quran-size',Math.max(20,Math.min(36,Number(saved.readerSize)||26))+'px');
    if (!loaded || !Array.isArray(verses) || verses.length !== info.count) { root.appendChild(el('p', 'wf-reader-state', t('فتح السورة…', 'Opening surah…'))); return; }
    var page = el('div', 'wf-mushaf'); page.dir = 'rtl'; page.lang = 'ar';
    verses.forEach(function (text, index) {
      var verse = index + 1, key = surah + ':' + verse, article = el('article', 'wf-ayah'); article.dataset.ayah = String(verse);
      article.appendChild(el('p', '', text)); var tools = el('div', 'wf-ayah-tools'), number = el('span', '', String(verse)); number.setAttribute('aria-label', t('آية ', 'Ayah ') + verse); tools.appendChild(number);
      var bookmark = button('', function () { var at = saved.bookmarks.indexOf(key); at < 0 ? saved.bookmarks.push(key) : saved.bookmarks.splice(at, 1); persist(); paintBookmark(); }, 'wf-bookmark'); bookmark.appendChild(icon('heart'));
      function paintBookmark() { bookmark.setAttribute('aria-pressed', String(saved.bookmarks.indexOf(key) >= 0)); bookmark.setAttribute('aria-label', t('علامة للآية ', 'Bookmark ayah ') + verse); }
      paintBookmark(); tools.appendChild(bookmark);
      var mark = button(t('وصلت هنا', 'Read to here'), function () { saved.position = { surah: surah, ayah: verse }; persist(); root.querySelectorAll('.wf-ayah[data-current]').forEach(function (n) { n.removeAttribute('data-current'); }); article.dataset.current = 'true'; mark.textContent = t('تم حفظ موضعك', 'Position saved'); }, 'wf-mark-position'); tools.appendChild(mark); article.appendChild(tools);
      if (saved.position && saved.position.surah === surah && saved.position.ayah === verse) article.dataset.current = 'true'; page.appendChild(article);
    }); root.appendChild(page);
    var nav = el('div', 'wf-reader-nav'), previous = button(t('السورة السابقة', 'Previous surah'), function () { openSurah(surah - 1, 1); }), next = button(t('السورة التالية', 'Next surah'), function () { openSurah(surah + 1, 1); }); previous.disabled = surah === 1; next.disabled = surah === 114; nav.appendChild(previous); nav.appendChild(next); root.appendChild(nav);
    root.appendChild(el('p', 'wf-attribution', content.attribution));
    if (ayah > 1) { var target = page.querySelector('[data-ayah="' + Math.min(info.count, ayah) + '"]'); if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); }, 0); }
    else w.scrollTo(0, 0);
  }
  var categories = { 'أذكار الصباح': 'Morning adhkar', 'أذكار المساء': 'Evening adhkar', 'أذكار النوم': 'Before sleep', 'أذكار الاستيقاظ': 'On waking', 'أذكار الخروج': 'Going out', 'أذكار السفر': 'Travel', 'أذكار المنزل': 'At home', 'أذكار بعد الصلاة': 'After prayer', 'أذكار متنوعة': 'Daily adhkar', 'أدعية عامة صحيحة': 'General supplications', 'أدعية من السنة': 'From the Sunnah', 'أدعية من القرآن': 'From the Qur’an', 'دعاء الاستغفار والتوبة': 'Forgiveness', 'دعاء الاستيقاظ': 'On waking', 'دعاء الخوف': 'When afraid', 'دعاء الرزق': 'Provision', 'دعاء المرض': 'Illness', 'دعاء النوم': 'Before sleep', 'دعاء الهم والحزن': 'Worry and sadness', 'دعاء طلب الهداية': 'Guidance', 'دعاء للأبناء': 'For children' };
  function bookmarks(){pageHeading(t('علامات القراءة','Reading bookmarks'),t('ارجع للآيات اللي حفظتها.','Return to the ayahs you saved.'));var list=el('div','wf-surahs');saved.bookmarks.forEach(function(key){var pieces=String(key).split(':'),s=Number(pieces[0]),a=Number(pieces[1]),info=content.surahs[s-1];if(!info||!Number.isInteger(a)||a<1||a>info.count)return;var row=el('div','wf-bookmark-row'),open=button(info.name+' · '+t('آية ','Ayah ')+a,function(){openSurah(s,a)},'wf-surah'),remove=button('×',function(){saved.bookmarks=saved.bookmarks.filter(function(x){return x!==key});persist();render()},'wf-bookmark-remove');remove.setAttribute('aria-label',t('حذف العلامة: ','Remove bookmark: ')+info.name+' '+a);row.appendChild(open);row.appendChild(remove);list.appendChild(row)});if(!list.children.length)list.appendChild(el('p','wf-local-note',t('اضغط علامة القلب بجوار الآية لحفظها هنا.','Tap the heart beside an ayah to save it here.')));root.appendChild(list)}
  function library() {
    var isDhikr = view === 'dhikr', source = isDhikr ? content.adhkar : content.duas;
    pageHeading(isDhikr ? t('الأذكار', 'Adhkar') : t('الأدعية', 'Duas'), t('النصوص والمصادر محفوظة داخل التطبيق.', 'Texts and references are included offline.'));
    var picker = el('label', 'wf-category-label'), caption = el('span', '', t('التصنيف', 'Category')), select = el('select'), all = el('option', '', t('الكل', 'All')); all.value = ''; select.appendChild(all);
    source.map(function (item) { return item.category; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).forEach(function (c) { var option = el('option', '', isArabic() ? c : categories[c] || c); option.value = c; select.appendChild(option); });
    select.value = category; select.setAttribute('aria-label', caption.textContent); picker.appendChild(caption); picker.appendChild(select); root.appendChild(picker);
    var list = el('div', 'wf-texts'); root.appendChild(list); select.onchange = function () { category = select.value; draw(); };
    function draw() { list.textContent = ''; source.forEach(function (item, index) { if (category && item.category !== category) return;
      var card = el('article', 'wf-text-card'); card.appendChild(el('h2', '', item.title)); var text = el('p', 'wf-sacred-text', item.text); text.lang = 'ar'; text.dir = 'rtl'; card.appendChild(text);
      var details = el('details', 'wf-reference'); details.appendChild(el('summary', '', t('المصدر', 'Reference'))); details.appendChild(el('p', '', item.reference)); card.appendChild(details);
      if (isDhikr) { var key = today() + ':' + item.category + ':' + item.title, required = Math.max(1, Number(item.count) || 1), count = Math.min(required, Math.max(0, Number(saved.counts[key]) || 0)), countButton = button('', function () { if (count >= required) return; count++; saved.counts[key] = count; persist(); paintCount(); }, 'wf-repeat'); countButton.dataset.counter = String(index);
        function paintCount() { countButton.textContent = count >= required ? t('اكتمل الذكر', 'Completed') + ' ✓' : t('اضغط للتكرار', 'Tap to count') + ' · ' + count + ' / ' + required; countButton.disabled = count >= required; countButton.setAttribute('aria-label', item.title + ' · ' + count + ' / ' + required); }
        paintCount(); card.appendChild(countButton);
      } list.appendChild(card);
    }); }
    draw(); localNote();
  }
  function tasbih() {
    pageHeading(t('التسبيح', 'Tasbih'), t('كل تسبيحة محفوظة على جهازك.', 'Every count stays on your device.'));
    var presets = ['أستغفر الله', 'سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'الصلاة على النبي ﷺ'];
    var label = el('label', 'wf-category-label'), caption = el('span', '', t('الذكر', 'Dhikr')), select = el('select'); select.setAttribute('aria-label', caption.textContent); presets.forEach(function (p) { var option = el('option', '', p); option.value = p; select.appendChild(option); }); select.value = preset; select.onchange = function () { preset = select.value; render(); }; label.appendChild(caption); label.appendChild(select); root.appendChild(label);
    var card = el('div', 'wf-tasbih-panel'); card.appendChild(el('p', 'wf-tasbih-phrase', preset)); var counterButton = button('', function () { saved.tasbih[preset] = counter(preset) + 1; persist(); value.textContent = String(counter(preset)); if (navigator.vibrate) navigator.vibrate(8); }, 'wf-tasbih-button'); counterButton.id = 'worship-tasbih-counter';
    var value = el('strong', '', String(counter(preset))); value.setAttribute('aria-live', 'polite'); var instruction = el('span', '', t('اضغط للتسبيح', 'Tap to count')); counterButton.appendChild(value); counterButton.appendChild(instruction); card.appendChild(counterButton);
    card.appendChild(button(t('تصفير هذا العدّاد', 'Reset this counter'), function () { resetTarget = preset; render(); }, 'wf-counter-reset')); root.appendChild(card);
    if (resetTarget) { var confirm = el('div', 'wf-reset-confirm'); confirm.setAttribute('role', 'group'); confirm.appendChild(el('p', '', t('تصفير عدّاد هذا الذكر فقط؟', 'Reset only this dhikr counter?'))); confirm.appendChild(button(t('تصفير', 'Reset'), function () { saved.tasbih[resetTarget] = 0; resetTarget = null; persist(); render(); })); confirm.appendChild(button(t('إلغاء', 'Cancel'), function () { resetTarget = null; render(); })); root.appendChild(confirm); }
    localNote();
  }
  function render() {
    settingTitle.textContent = t('ركن العبادات', 'Prayer'); settingDescription.textContent = t('القرآن والأذكار والتسبيح · اختياري وبدون إنترنت', 'Qur’an, adhkar and tasbih · Optional and offline');
    prayerSettingsEntry.hidden=!enabled;prayerSettingsEntry.querySelector('strong').textContent=t('مواقيت الصلاة','Prayer times');prayerSettingsEntry.querySelector('small').textContent=t('الموقع، تنبيهات الصلاة، والأذان وصوت المؤذن','Location, prayer reminders, Adhan and muezzin voice');
    root.dir = isArabic() ? 'rtl' : 'ltr'; root.textContent = ''; if (!enabled) return;
    if (view === 'reader') { renderReader(saved.position && saved.position.surah === surah ? saved.position.ayah : 1, !!(w.MorphQuran && MorphQuran[surah])); return; }
    if (view === 'quran') quran(); else if(view==='bookmarks')bookmarks();else if (view === 'dhikr' || view === 'dua') library(); else if (view === 'tasbih') tasbih(); else if(view==='prayer') prayer(); else home();
    if (error) { var message = el('p', 'wf-save-error', error); message.setAttribute('role', 'alert'); root.appendChild(message); }
  }
  function backView() { if (view === 'home') return false; loadToken++; resetTarget = null; go(view === 'reader'||view==='bookmarks' ? 'quran' : 'home'); return true; }
  w.MorphWorship = { requestEnable:requestEnable,closePrompt:closeEnablePrompt, enabled: function () { return enabled; }, back: function () { return !root.hidden && backView(); }, prayerRefresh: refreshPrayer,openPrayer:function(){if(enabled){Morph30.show('worship',{destination:'prayer_times'});go('prayer')}},voicePackResult:function(ok,cancelled){prayerMessage=cancelled?'':ok?t('تمت إضافة حزمة المؤذنين. الأصوات جاهزة بدون إنترنت.','Muezzin pack added. The voices are ready offline.'):t('الحزمة غير صالحة. اختار حزمة أصوات Morph TV الكاملة.','Invalid pack. Choose the complete Morph TV voice pack.');prayerDraft=null;refreshPrayer()} };
  w.addEventListener('morphLanguage', function () { render(); });
  function nativePrayer(operation, fields) { if (!w.ClearNative || !w.MorphNative) return Promise.reject(new Error('native_required')); return MorphNative.call('faithPrayer', Object.assign({ operation: operation }, fields || {})); }
  function receivePrayer(value) { prayerState = value; if (!prayerDraft) { prayerDraft = Object.assign({ method:'egyptian',voice:'egypt',timezone:value.deviceTimezone,adjustments:{} }, value.settings); var city=(value.cities||[]).filter(function(c){return c.latitude===prayerDraft.latitude&&c.longitude===prayerDraft.longitude})[0];if(city)prayerDraft.cityChoice=city.id; } }
  function syncPrayerHost() { return nativePrayer('host',{enabled:enabled}).then(function(value){if(!enabled)prayerDraft=null;receivePrayer(value);if(!root.hidden&&(view==='prayer'||view==='home'))render()}).catch(function(){ }); }
  function queuePrayer(){clearTimeout(prayerTimer);prayerTimer=null;if(enabled&&!root.hidden&&!d.hidden)prayerTimer=setTimeout(refreshPrayer,60000);}
  function refreshPrayer(force) { if (!enabled) return; nativePrayer('info').then(function(value){receivePrayer(value);if(!root.hidden&&(view==='prayer'||view==='home')&&(force||!d.activeElement.closest('.wf-prayer-form')))render();queuePrayer()}).catch(function(){ }); }
  new MutationObserver(function(){if(!root.hidden&&enabled)refreshPrayer();else{clearTimeout(prayerTimer);prayerTimer=null;}}).observe(root,{attributes:true,attributeFilter:['hidden']});
  d.addEventListener('visibilitychange',function(){if(!d.hidden&&!root.hidden)refreshPrayer();else{clearTimeout(prayerTimer);prayerTimer=null;}});
  function prayer() {
    pageHeading(t('الصلاة والأذان', 'Prayer times & Adhan'), t('مواقيت محسوبة على جهازك، بدون إنترنت.', 'Calculated on your device, without internet.'));
    if (!prayerState) { root.appendChild(el('p','wf-local-note',t('فتح إعدادات الصلاة…','Opening prayer settings…')));refreshPrayer();return; }
    var state = prayerState, config = prayerDraft || {}, rows = state.today || [];
    if(rows.length){var times=el('div','wf-prayer-times');rows.forEach(function(item){var line=el('label','wf-prayer-row'),key=(state.date||today())+':'+item.key;line.appendChild(el('strong','',isArabic()?item.ar:item.en));line.appendChild(el('time','',item.time));if(item.key!=='sunrise'){var done=el('input');done.type='checkbox';done.checked=!!(saved.prayers&&saved.prayers[key]);done.setAttribute('aria-label',t('صلّيت ','Mark prayer completed: ')+(isArabic()?item.ar:item.en));done.onchange=function(){saved.prayers=saved.prayers||{};saved.prayers[key]=done.checked;persist()};line.appendChild(done)}else line.appendChild(el('span','wf-prayer-no-check','—'));times.appendChild(line)});root.appendChild(times);root.appendChild(el('p','wf-local-note',(config.city||'')+' · '+config.timezone));}
    var status=el('p','wf-prayer-status',state.scheduled?(state.settings.enabled?t('الأذان مفعّل، وتمت جدولة الموعد القادم.','Adhan is enabled. The next prayer alarm is scheduled.'):t('تنبيهات الصلاة مفعّلة، وتمت جدولة الموعد القادم.','Prayer reminders are enabled. The next prayer alarm is scheduled.')):t('اختار موقعك وفعّل تنبيه الصلاة أو الأذان من الإعدادات.','Choose your location and enable prayer reminders or Adhan.'));status.setAttribute('role','status');root.appendChild(status);
    var stopAudio=button(t('إيقاف صوت الأذان','Stop Adhan audio'),function(){nativePrayer('stop').then(function(value){receivePrayer(value);prayerMessage=t('تم إيقاف الصوت.','Audio stopped.');render()}).catch(function(){prayerMessage=t('تعذّر إيقاف الصوت. جرّب مرة تانية.','Could not stop audio. Please try again.');render()})},'wf-prayer-stop');root.appendChild(stopAudio);
    if(prayerMessage)root.appendChild(el('p','wf-prayer-message',prayerMessage));
    var panel=el('details','wf-prayer-settings');panel.open=prayerSettingsOpen===null?!state.settings.configured:prayerSettingsOpen;panel.ontoggle=function(){prayerSettingsOpen=panel.open};panel.appendChild(el('summary','',t('إعداد الموقع والأذان','Location & Adhan settings')));var form=el('div','wf-prayer-form');panel.appendChild(form);root.appendChild(panel);
    function field(label,node){var wrap=el('label','wf-prayer-field');wrap.appendChild(el('span','',label));wrap.appendChild(node);form.appendChild(wrap);return node;}
    function selectField(key,label,options){var select=el('select');options.forEach(function(item){var option=el('option','',item[1]);option.value=item[0];select.appendChild(option)});select.value=config[key]===undefined?options[0][0]:String(config[key]);select.onchange=function(){config[key]=select.value};return field(label,select);}
    var matchedCity=(state.cities||[]).filter(function(c){return c.latitude===config.latitude&&c.longitude===config.longitude})[0];config.cityChoice=matchedCity?matchedCity.id:'';var city=selectField('cityChoice',t('المدينة','City'),[['',t('اختار مدينتك','Choose your city')]].concat((state.cities||[]).map(function(c){return[c.id,isArabic()?c.name:c.nameEn]})));
    city.onchange=function(){var found=state.cities.filter(function(c){return c.id===city.value})[0];if(!found)return;config.cityChoice=city.value;config.city=isArabic()?found.name:found.nameEn;config.latitude=found.latitude;config.longitude=found.longitude;config.timezone=found.timezone;config.method=found.timezone==='Africa/Cairo'?'egyptian':found.timezone==='Asia/Riyadh'?'umm_al_qura':found.timezone.indexOf('America/')===0?'isna':'mwl';render()};
    var manual=el('details','wf-manual-location');manual.appendChild(el('summary','',t('موقع يدوي أو مدينة أخرى','Custom coordinates or another city')));var manualBody=el('div','wf-manual-fields');manual.appendChild(manualBody);form.appendChild(manual);
    [['city',t('اسم المدينة','City name'),'text'],['latitude',t('خط العرض','Latitude'),'number'],['longitude',t('خط الطول','Longitude'),'number'],['timezone',t('المنطقة الزمنية، مثل Africa/Cairo','Timezone, e.g. Africa/Cairo'),'text']].forEach(function(item){var label=el('label','wf-prayer-field');label.appendChild(el('span','',item[1]));var input=el('input');input.type=item[2];input.value=config[item[0]]===undefined?'':config[item[0]];if(item[2]==='number')input.step='0.0001';input.oninput=function(){config[item[0]]=item[2]==='number'?Number(input.value):input.value};label.appendChild(input);manualBody.appendChild(label)});
    selectField('method',t('طريقة الحساب','Calculation method'),[['egyptian',t('الهيئة المصرية للمساحة','Egyptian Survey Authority')],['umm_al_qura',t('أم القرى','Umm al-Qura')],['mwl',t('رابطة العالم الإسلامي','Muslim World League')],['isna','ISNA'],['karachi',t('كراتشي','Karachi')],['dubai',t('دبي','Dubai')],['kuwait',t('الكويت','Kuwait')],['qatar',t('قطر','Qatar')],['singapore',t('سنغافورة','Singapore')],['moonsighting',t('لجنة رؤية الهلال','Moonsighting Committee')]]);
    var hanafi=el('input');hanafi.type='checkbox';hanafi.checked=!!config.hanafi;hanafi.onchange=function(){config.hanafi=hanafi.checked};field(t('العصر حسب المذهب الحنفي','Hanafi Asr calculation'),hanafi);
    var adjust=el('details','wf-prayer-adjust');adjust.appendChild(el('summary','',t('تعديل الدقائق حسب مسجدك','Adjust minutes for your local mosque')));config.adjustments=config.adjustments||{};
    [['fajr','الفجر','Fajr'],['dhuhr','الظهر','Dhuhr'],['asr','العصر','Asr'],['maghrib','المغرب','Maghrib'],['isha','العشاء','Isha']].forEach(function(item){var label=el('label','wf-prayer-field');label.appendChild(el('span','',t(item[1],item[2])));var input=el('input');input.type='number';input.min='-30';input.max='30';input.step='1';input.value=config.adjustments[item[0]]||0;input.oninput=function(){config.adjustments[item[0]]=Number(input.value)};label.appendChild(input);adjust.appendChild(label)});adjust.appendChild(el('p','wf-local-note',t('لأم القرى، أضف ٣٠ دقيقة للعشاء في رمضان إذا كان ده المعتمد عندك.','For Umm al-Qura, add 30 minutes to Isha during Ramadan if used locally.')));form.appendChild(adjust);
    var voice=selectField('voice',t('صوت المؤذن','Muezzin voice'),(state.voices||[]).map(function(v){return[v.id,(isArabic()?v.ar:v.en)+(v.available===false?t(' · أضف الحزمة',' · Add voice pack'):'')]}));Array.prototype.forEach.call(voice.options,function(option){var info=state.voices.filter(function(v){return v.id===option.value})[0];option.disabled=info&&info.available===false});
    var pack=el('div','wf-audio-pack');pack.appendChild(el('strong','',t('حزمة المؤذنين','Muezzin voice pack')));pack.appendChild(el('p','',t('صوت مصر موجود في التطبيق. أضف الحزمة الاختيارية لباقي الأصوات. التحميل اختياري لمرة واحدة، وبعده تشتغل أوفلاين.','Egypt is included. Add the optional pack for more voices. Download once if you want; then use them offline.')));var download=button(voiceDownloading?t('جارٍ تحميل الحزمة…','Downloading pack…'):state.voicePackInstalled?t('إعادة تحميل الحزمة','Download pack again'):t('تحميل حزمة المؤذنين','Download voice pack'),function(){if(voiceDownloading)return;voiceDownloading=true;prayerMessage='';render();MorphNative.call('faithVoicesDownload').then(function(value){prayerDraft=null;receivePrayer(value);prayerMessage=t('الحزمة جاهزة. اختار صوت المؤذن.','Voice pack is ready. Choose your muezzin.')}).catch(function(){prayerMessage=t('تعذّر تحميل الحزمة. راجع الإنترنت أو استورد الملف من موبايلك.','Could not download the pack. Check your connection or import it from your phone.')}).then(function(){voiceDownloading=false;if(view==='prayer')render()})});download.disabled=voiceDownloading;pack.appendChild(download);pack.appendChild(button(state.voicePackInstalled?t('تحديث حزمة الأصوات','Update voice pack'):t('إضافة حزمة من الموبايل','Import pack from your phone'),function(){nativePrayer('importVoices').catch(function(){prayerMessage=t('تعذّر فتح اختيار الملفات.','Could not open the file picker.');render()})}));if(state.voicePackInstalled)pack.appendChild(button(t('حذف الحزمة الإضافية','Remove optional pack'),function(){nativePrayer('removeVoices').then(function(value){prayerDraft=null;receivePrayer(value);prayerMessage=t('اتشالت الحزمة. صوت مصر متاح.','Pack removed. Egypt remains available.');render()})}));form.appendChild(pack);
    var actions=el('div','wf-voice-actions');actions.appendChild(button(t('تجربة الصوت','Preview voice'),function(){nativePrayer('preview',{voice:voice.value}).then(function(){prayerMessage=t('جارٍ تشغيل الصوت…','Starting voice…');render();setTimeout(function(){nativePrayer('info').then(function(value){receivePrayer(value);prayerMessage=value.playing?t('الصوت شغّال. اضغط إيقاف لإنهاء التجربة.','Voice is playing. Press Stop to finish.'):t('تعذّر تشغيل الصوت. راجع صوت المنبه وجرّب تاني.','Could not play the voice. Check alarm volume and try again.');if(view==='prayer')render()})},700)}).catch(function(){prayerMessage=t('تعذّر تشغيل الصوت. جرّب مرة تانية.','Could not play the voice. Please try again.');render()})}));actions.appendChild(button(t('إيقاف الصوت','Stop audio'),function(){nativePrayer('stop').then(function(){prayerMessage='';setTimeout(refreshPrayer,250)})}));form.appendChild(actions);
    var active=el('input');active.type='checkbox';active.checked=!!config.enabled;active.id='worship-adhan-enabled';active.onchange=function(){config.enabled=active.checked;if(!active.checked){nativePrayer('disable').then(function(value){receivePrayer(value);prayerMessage=t('تم إيقاف الأذان وإلغاء تشغيله التلقائي.','Adhan stopped and automatic audio disabled.');if(view==='prayer')render()}).catch(function(){prayerMessage=t('تعذّر حفظ إيقاف الأذان. جرّب مرة تانية.','Could not disable Adhan. Please try again.');if(view==='prayer')render()})}};field(t('تشغيل الأذان في مواعيد الصلاة','Play Adhan at prayer times'),active);
    var reminders=el('input');reminders.type='checkbox';reminders.checked=!!config.reminders;reminders.id='worship-prayer-reminders';reminders.onchange=function(){config.reminders=reminders.checked};field(t('تنبيه الصلاة بدون الأذان الكامل','Prayer notification without the full Adhan'),reminders);
    if(!state.notifications)form.appendChild(button(t('السماح بإشعارات الأذان','Allow Adhan notifications'),function(){nativePrayer('notifications').then(refreshPrayer)}));
    if(!state.exactAlarms)form.appendChild(button(t('السماح بالمنبهات الدقيقة','Allow exact alarms'),function(){nativePrayer('alarmAccess').then(refreshPrayer)}));
    form.appendChild(el('p','wf-local-note',t('راجع مستوى صوت المنبه في موبايلك. الأذان محتاج السماح بالإشعارات والمنبهات الدقيقة.','Check your phone alarm volume. Adhan needs notification and exact-alarm permission.')));
    var save=button(prayerBusy?t('جارٍ الحفظ…','Saving…'):t('حفظ إعدادات الصلاة','Save prayer settings'),function(){if(prayerBusy)return;prayerBusy=true;prayerMessage='';render();nativePrayer('save',{settings:config}).then(function(value){receivePrayer(value);prayerDraft=Object.assign({},value.settings);prayerMessage=value.permissionNeeded?t('الموقع محفوظ. اسمح بالإشعارات والمنبهات الدقيقة، ثم فعّل الأذان واحفظ تاني.','Location saved. Allow notifications and exact alarms, then enable Adhan and save again.'):t('تم حفظ إعداداتك.','Your settings are saved.')}).catch(function(){prayerMessage=t('راجع المدينة والإحداثيات والمنطقة الزمنية، وجرّب تاني.','Check the city, coordinates and timezone, then try again.')}).then(function(){prayerBusy=false;if(view==='prayer')render()})},'wf-prayer-save');save.disabled=prayerBusy;form.appendChild(save);localNote();
  }
  setNav(); render(); syncPrayerHost();
})(window, document);
