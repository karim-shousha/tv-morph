/* ============================================================
   MORPH TV MOBILE 3.0 — controller
   Additive layer: no edits to app.js logic required.
   - nav aliases + history + scroll memory (P0-1)
   - status hero + IP cards + copy (P0-2/P0-6, C1)
   - control segments, play destination, gear sheet (P1)
   - onboarding, capability hints, focus trap (P3)
   Contracts untouched: all ClearNative actions pass through.
   ============================================================ */
(function (w) {
'use strict';
var d = document;
var $ = function (id) { return d.getElementById(id); };

/* ---------- 1. Icons: TV family (24 / 1.8 / round) + mobile additions ---------- */
var P = {
  home: '<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
  design: '<path d="m4 16 12-12 4 4L8 20H4z"/><path d="M13 7l4 4M4 20h16"/>',
  control: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="12" r="1.2"/><circle cx="18.5" cy="14.5" r="1.2"/>',
  play: '<path d="m8 4 12 8-12 8z"/>',
  worship: '<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-3-1-6-2-10 1zM12 5v15"/>',
  matches: '<path d="M8 3h8v5a4 4 0 0 1-8 0zM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 12v5m-4 4h8m-7-4h6v4H9z"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 3M5 15a8 8 0 0 0 13 3"/>',
  beads: '<circle cx="12" cy="5" r="2"/><circle cx="6" cy="7" r="2"/><circle cx="4" cy="13" r="2"/><circle cx="8" cy="18" r="2"/><circle cx="15" cy="18" r="2"/><circle cx="19" cy="13" r="2"/><circle cx="18" cy="7" r="2"/><path d="M12 20v3"/>',
  moon: '<path d="M20 14A9 9 0 0 1 10 3a9 9 0 1 0 10 11z"/>',
  heart: '<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-4 4 1 9 8 15 7-6 12-11 8-15z"/>',
  tv: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="3"/><path d="M11 18h2"/>',
  cast: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4m-5-11h10m-3-3 3 3-3 3"/>',
  mirror: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="m12 8 3 3-3 3M4 20h16"/>',
  send: '<path d="m4 12 16-7-7 16-2-7z"/><path d="M11 13l5-5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  lock: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  apps: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  remote: '<rect x="6" y="2" width="12" height="20" rx="4"/><circle cx="12" cy="6" r="1"/><circle cx="12" cy="13" r="4"/><path d="M10 19h4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18z"/>',
  chev: '<path d="m6 9 6 6 6-6"/>'
};
function svg(name, size) {
  return '<svg viewBox="0 0 24 24" width="' + (size || 24) + '" height="' + (size || 24) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (P[name] || P.globe) + '</svg>';
}

/* ---------- 2. Strings for NEW chrome only (existing copy via MorphLocale) ---------- */
var STR = {
  ar: { home: 'الرئيسية', design: 'الاستوديو', control: 'الريموت', play: 'القنوات', settings: 'الإعدادات', remote: 'ريموت', apps: 'التطبيقات', share: 'مشاركة', statusIdle: 'لم يتم الاتصال بعد', statusDetected: 'الشاشة موجودة · محتاجة ربط', statusConnected: 'متصل', statusChecking: 'جارٍ الفحص…', statusError: 'تعذّر الاتصال', changeTv: 'تغيير التلفزيون', copy: 'نسخ', copied: 'تم النسخ', tvCard: 'عنوان التلفزيون — اكتبه هنا في الموبايل', phoneCard: 'عنوان الموبايل — اكتبه على التلفزيون', capRemote: 'داخل Morph TV: الاتجاهات والكيبورد. الصوت حسب دعم الجهاز. التحكم في تطبيقات أخرى غير متاح من هنا.', onboard1t: 'أهلاً بك في Morph TV', onboard1p: 'ريموت كنترول، IPTV على الموبايل، وربط وتحديث Morph TV على التلفزيون — في تطبيق واحد.', onboard2t: 'نفس شبكة Wi-Fi', onboard2p: 'وصّل الموبايل والتلفزيون بنفس الشبكة، ثم ابحث عن تلفزيونك من الرئيسية.', onboard3t: 'تصميمك بأمان', onboard3p: 'بيانات الاشتراك محفوظة ومشفّرة على جهازك. لن نطلب كلمة سرك أبداً خارج التطبيق.', next: 'التالي', start: 'ابدأ', skip: 'تخطي', shareMirror: 'عرض الشاشة (نظام الهاتف)', shareDlna: 'إرسال رابط مباشر (DLNA)', prefs: 'التفضيلات', support: 'الدعم', about: 'عن التطبيق', compatLG: 'تثبيت وربط بوضع Developer Mode وKey Server؛ الثيمات والريموت وIPTV داخل Morph TV أثناء فتحه. لا يستبدل Home. VIDAA وRoku والأنظمة الأخرى غير مدعومة للتثبيت.', remoteNote: 'الاتجاهات والكيبورد داخل Morph TV، والصوت حسب دعم الجهاز. التحكم في تطبيقات Android الأخرى مش متاح من المسار ده. LG يدعم الريموت داخل Morph TV عبر Developer Mode بعد ربط المفتاح، وليس تحكمًا عامًا في الشاشة.', srcType: 'نوع المصدر', collNational: 'المنتخبات', collSaudi: 'السعودية', collPatriotic: 'ثيمات وطنية مجانية', collBaseball: 'البيسبول' },
  en: { home: 'Home', design: 'Studio', control: 'Remote', play: 'IPTV', settings: 'Settings', remote: 'Remote', apps: 'Apps', share: 'Share', statusIdle: 'Not connected yet', statusDetected: 'TV found · pairing needed', statusConnected: 'Connected', statusChecking: 'Checking…', statusError: 'Connection failed', changeTv: 'Change TV', copy: 'Copy', copied: 'Copied', tvCard: 'TV address — type it here on the phone', phoneCard: 'Phone address — type it on the TV', capRemote: 'Inside Morph TV: D-pad and keyboard. Volume depends on device support. Other apps cannot be controlled from here.', onboard1t: 'Welcome to Morph TV', onboard1p: 'TV remote, IPTV on your phone, and Morph TV device setup and updates — in one app.', onboard2t: 'Same Wi-Fi network', onboard2p: 'Put your phone and TV on the same network, then scan for your TV from Home.', onboard3t: 'Your data stays safe', onboard3p: 'Subscriptions are stored encrypted on your device. We never ask for passwords outside the app.', next: 'Next', start: 'Start', skip: 'Skip', shareMirror: 'Mirror screen (system)', shareDlna: 'Send direct URL (DLNA)', prefs: 'Preferences', support: 'Support', about: 'About', compatLG: 'Install and pair via Developer Mode and Key Server; themes, remote and IPTV work inside Morph TV while it is open. Does not replace Home. VIDAA, Roku and other systems are not supported for installation.', remoteNote: 'D-pad and keyboard work inside Morph TV; volume depends on device support. Other Android apps cannot be controlled from here. LG remote works inside Morph TV via Developer Mode after key pairing — not full TV control.', srcType: 'Source type', collNational: 'National teams', collSaudi: 'Saudi Arabia', collPatriotic: 'Free patriotic themes', collBaseball: 'Baseball' },
  fr: { home: 'Appareils', design: 'Themes', control: 'Télécommande', play: 'IPTV', settings: 'Réglages', remote: 'Télécommande', apps: 'Applis', share: 'Partage', statusIdle: 'Non connecté', statusDetected: 'TV trouvée · association requise', statusConnected: 'Connecté', statusChecking: 'Vérification…', statusError: 'Échec de connexion', changeTv: 'Changer de TV', copy: 'Copier', copied: 'Copié', tvCard: 'Adresse du téléviseur — saisissez-la ici', phoneCard: 'Adresse du téléphone — saisissez-la sur le téléviseur', capRemote: 'Dans Morph TV : pavé directionnel et clavier. Volume selon l’appareil.', onboard1t: 'Bienvenue sur Morph TV', onboard1p: 'Concevez, installez et contrôlez l’interface de votre TV depuis votre téléphone.', onboard2t: 'Même réseau Wi-Fi', onboard2p: 'Connectez le téléphone et le téléviseur au même réseau, puis recherchez-le depuis l’Accueil.', onboard3t: 'Vos données protégées', onboard3p: 'Abonnements chiffrés sur votre appareil. Aucun mot de passe demandé hors de l’appli.', next: 'Suivant', start: 'Commencer', skip: 'Ignorer', shareMirror: 'Dupliquer l’écran (système)', shareDlna: 'Envoyer une URL (DLNA)', prefs: 'Préférences', support: 'Assistance', about: 'À propos', compatLG: 'Installation et association via Developer Mode et Key Server ; thèmes, télécommande et IPTV dans Morph TV pendant son ouverture. Ne remplace pas Home. VIDAA, Roku et autres systèmes non pris en charge.', remoteNote: 'Pavé directionnel et clavier dans Morph TV ; volume selon l’appareil. Les autres applications Android ne sont pas pilotables ici. Télécommande LG dans Morph TV via Developer Mode après association — pas un contrôle total du téléviseur.', srcType: 'Type de source', collNational: 'Équipes nationales', collSaudi: 'Arabie saoudite', collPatriotic: 'Thèmes nationaux gratuits', collBaseball: 'Base-ball' },
  zh: { home: '设备', design: '设计', control: '遥控', play: 'IPTV', settings: '设置', remote: '遥控', apps: '应用', share: '共享', statusIdle: '尚未连接', statusDetected: '已找到电视 · 需要配对', statusConnected: '已连接', statusChecking: '正在检查…', statusError: '连接失败', changeTv: '更换电视', copy: '复制', copied: '已复制', tvCard: '电视地址 — 在手机上输入', phoneCard: '手机地址 — 在电视上输入', capRemote: '在 Morph TV 内：方向键与键盘。音量取决于设备支持。', onboard1t: '欢迎使用 Morph TV', onboard1p: '在手机上设计、安装并控制您的电视界面。', onboard2t: '同一 Wi-Fi 网络', onboard2p: '将手机和电视连接到同一网络，然后从首页搜索电视。', onboard3t: '数据安全无忧', onboard3p: '订阅信息加密保存在您的设备上。', next: '下一步', start: '开始', skip: '跳过', shareMirror: '镜像屏幕（系统）', shareDlna: '发送直链（DLNA）', prefs: '偏好设置', support: '支持', about: '关于', compatLG: 'LG：通过 Developer Mode 和 Key Server 安装并配对；主题、遥控和 IPTV 仅在 Morph TV 打开时可用。不替代 Home。VIDAA、Roku 及其他系统不支持安装。', remoteNote: 'Android：方向键与键盘在 Morph TV 内使用，音量取决于设备支持。不支持从此处控制其他 Android 应用。LG 需经 Developer Mode 配对密钥后在 Morph TV 内遥控，并非整机控制。', srcType: '源类型', collNational: '国家队', collSaudi: '沙特', collPatriotic: '免费国家主题', collBaseball: '棒球' },
  ja: { home: 'デバイス', design: 'デザイン', control: 'リモコン', play: 'IPTV', settings: '設定', remote: 'リモコン', apps: 'アプリ', share: '共有', statusIdle: '未接続', statusDetected: 'テレビ検出 · ペアリングが必要', statusConnected: '接続中', statusChecking: '確認中…', statusError: '接続失敗', changeTv: 'テレビを変更', copy: 'コピー', copied: 'コピー済み', tvCard: 'テレビのアドレス — スマホに入力', phoneCard: 'スマホのアドレス — テレビに入力', capRemote: 'Morph TV内：方向キーとキーボード。音量は機器対応次第。', onboard1t: 'Morph TVへようこそ', onboard1p: 'スマホからテレビ画面をデザイン・導入・操作。', onboard2t: '同じWi-Fi', onboard2p: 'スマホとテレビを同じネットワークに接続し、ホームから検索。', onboard3t: 'データは安全に', onboard3p: '契約情報は端末内で暗号化保存されます。', next: '次へ', start: '開始', skip: 'スキップ', shareMirror: '画面ミラーリング（システム）', shareDlna: 'URL送信（DLNA）', prefs: '設定', support: 'サポート', about: 'このアプリについて', compatLG: 'LG：Developer Mode と Key Server でインストール・ペアリング。テーマ・リモコン・IPTV は Morph TV 起動中のみ利用可。Home の置き換えではありません。VIDAA・Roku 等は非対応。', remoteNote: 'Android：方向キーとキーボードは Morph TV 内で使用。音量は機器対応次第。ここから他の Android アプリは操作できません。LG は Developer Mode でのキー連携後に Morph TV 内で操作可（ TV 全体制御ではありません）。', srcType: 'ソース種別', collNational: '各国代表', collSaudi: 'サウジアラビア', collPatriotic: '無料のナショナルテーマ', collBaseball: '野球' }
};
function lang() {
  try { if (w.MorphLocale && MorphLocale.get) { var l = MorphLocale.get(); if (STR[l]) return l; } } catch (e) {}
  var h = (d.documentElement.lang || 'ar').slice(0, 2);
  return STR[h] ? h : 'ar';
}
function t(k) { var l = lang(); if(k==='worship')return ({ar:'عباداتي',en:'Prayer',fr:'Spiritualité',zh:'功修',ja:'礼拝'})[l]||'Prayer'; return (STR[l] && STR[l][k]) || STR.ar[k] || k; }

/* ---------- 3. Navigation: aliases + history + scroll memory ---------- */
var PAGE_OF = {
  home: 'page-start', devices:'page-connect', more:'page-more', design: 'page-studio', control: 'page-remote', play: 'page-iptv',
  studio: 'page-studio', connect: 'page-connect', apps: 'page-apps',
  remote: 'page-remote', iptv: 'page-iptv', cast: 'page-cast', worship: 'page-worship'
};
var NAV_OF = { 'page-start':'home', 'page-more':'more', 'page-connect': 'home', 'page-studio': 'design', 'page-remote': 'control', 'page-apps': 'control', 'page-cast': 'control', 'page-iptv': 'play', 'page-worship': 'worship' };
var CONTROL_SUB = { 'page-remote': 'remote', 'page-apps': 'apps', 'page-cast': 'cast' };
var historyStack = [];
var current = null;
var scrollMem = {};
var NAV_NAMES = ['home', 'design', 'control', 'play'];

function pages() { return d.querySelectorAll('.page'); }
function navButtons() { return d.querySelectorAll('.bottom-nav button[data-page]'); }

function paintNav(activePage) {
  d.body.setAttribute('data-mobile-page',activePage);var applyBar=$('m30-applybar');if(applyBar)applyBar.hidden=activePage!=='page-studio';
  var navigation=d.querySelector('.bottom-nav'),headerBack=$('m30-page-back');
  if(navigation)navigation.hidden=false;
  if(headerBack)headerBack.hidden=activePage==='page-start';
  try{if(w.ClearNative&&ClearNative.navigationPage)ClearNative.navigationPage(activePage);}catch(ignore){}
  var nav = NAV_OF[activePage] || 'design';
  navButtons().forEach(function (b) {
    var on = b.dataset.page === nav || PAGE_OF[b.dataset.page] === activePage;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  // control segment sync
  var sub = CONTROL_SUB[activePage];
  d.querySelectorAll('.m30-segment [data-msub]').forEach(function (b) {
    var on = b.dataset.msub === sub;
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  // play destination segmented sync (visual only)
  syncPlaySegment();
}

function show(name, opts) {
  if(name==='apps'||name==='page-apps')name='remote';
  opts = opts || {};
  if(name==='worship'&&(!w.MorphWorship||!w.MorphWorship.enabled())){if(w.MorphWorship&&MorphWorship.requestEnable)MorphWorship.requestEnable(opts);return false;}
  // Integrated Android hosts use the original HER faith widget tree. Browser
  // previews and the web-only host retain the existing web fallback.
  if(name==='worship'&&w.ClearNative&&ClearNative.openFaith){
    try { if(ClearNative.openFaith(opts.destination||'home'))return true; } catch(ignore) {}
  }
  var target = PAGE_OF[name];if(!target)return false;
  var el = $(target);
  if (!el) return false;
  if (current && current !== target && !opts.replace) {
    try { scrollMem[current] = w.scrollY || d.documentElement.scrollTop || 0; } catch (e) {}
    historyStack.push(current);
    if (historyStack.length > 24) historyStack.shift();
  }
  try { if (current) scrollMem[current] = w.scrollY || 0; } catch (e) {}
  pages().forEach(function (p) { p.hidden = p.id !== target; });
  current = target;
  paintNav(target);
  // remote entry hook (parity with legacy show())
  try { if (target === 'page-remote' && w.checkMorphConnection) w.checkMorphConnection(); } catch (e) {}
  // move shared control segment into visible control page
  if (CONTROL_SUB[target]) mountSegment(target);
  var y = (!opts.keepScroll && scrollMem[target]) ? scrollMem[target] : 0;
  try { w.scrollTo(0, y); if (d.documentElement) d.documentElement.scrollTop = y; if (d.body) d.body.scrollTop = y; } catch (e) {}
  try { w.dispatchEvent(new CustomEvent('morph30page', { detail: name })); } catch (e) {}
  return true;
}

function back() {
  if(w.MorphHomeMenu&&MorphHomeMenu.back())return true;
  if(w.MorphWorship&&MorphWorship.closePrompt&&MorphWorship.closePrompt())return true;
  if(w.MorphFirstRun&&MorphFirstRun.isOpen())return true;
  if(w.MorphUpdates&&MorphUpdates.close&&MorphUpdates.close())return true;
  // 1. operation modal
  var op = $('operation');
  if (op && !op.hidden) { var c = $('operation-close');if(c&&!c.hidden)c.click();return true; }
  var plus=d.querySelector('.morph-plus-overlay .plus-close');if(plus){plus.click();return true;}
  var welcome=d.querySelector('#morph-welcome-support [data-start]');if(welcome){welcome.click();return true;}
  // 2. gear sheet / onboarding
  if (d.querySelector('.m30-sheet.open') || d.querySelector('.m30-onboard')) { closeSheets(); return true; }
  if(w.MorphConnectFlow&&MorphConnectFlow.back())return true;
  // 3. history
  if(w.MorphWorship&&w.MorphWorship.back())return true;
  if(current==='page-studio'&&w.MorphStudio&&MorphStudio.back&&MorphStudio.back())return true;
  var prev = historyStack.pop();
  while(prev==='page-worship'&&(!w.MorphWorship||!w.MorphWorship.enabled()))prev=historyStack.pop();
  if (prev && $(prev)) {
    pages().forEach(function (p) { p.hidden = p.id !== prev; });
    current = prev; paintNav(prev);
    if (CONTROL_SUB[prev]) mountSegment(prev);
    var y = scrollMem[prev] || 0;
    try { w.scrollTo(0, y);w.dispatchEvent(new CustomEvent('morph30page',{detail:Object.keys(PAGE_OF).filter(function(key){return PAGE_OF[key]===prev;})[0]})); } catch (e) {}
    return true;
  }
  // 4. fallback: Home (never jumps to Design unprompted)
  if (current !== 'page-start') { show('home',{replace:true}); return true; }
  return false;
}

/* ---------- 4. Status hero + pill ---------- */
function statusInfo() {
  var st = $('connection-state');
  var status = st ? st.dataset.status : 'idle';
  var title = $('connection-title');
  var dev = $('connected-device');
  return { status: status, title: title ? title.textContent : '', dev: dev && !dev.hidden ? dev.textContent : '' };
}
var STATUS_TXT = { idle: 'statusIdle', detected: 'statusDetected', checking: 'statusChecking', connected: 'statusConnected', error: 'statusError', unsupported: 'statusError' };
function renderStatus() {
  var info = statusInfo();
  var key = STATUS_TXT[info.status] || 'statusIdle';
  var hero = $('m30-status-title'), sub = $('m30-status-sub'), wrap = $('m30-status');
  var tvName = '';
  try {
    var chip = d.querySelector('#device-chip span');
    if (chip && chip.textContent && chip.textContent.trim() && !/اختار|Choose|选择|選択/.test(chip.textContent)) tvName = chip.textContent.trim();
  } catch (e) {}
  if (hero) hero.innerHTML = '<span class="m30-connection-label">'+esc(t(key))+'</span>' + (tvName ? '<span class="m30-sys-badge">' + esc(tvName) + '</span>' : '');
  if (sub) sub.textContent = info.status==='connected'?(lang()==='ar'?'جاهز للتحكم':'Ready to control'):info.title && info.status !== 'idle' ? info.title : '';
  if (wrap) wrap.dataset.mstatus = info.status === 'connected' ? 'connected' : info.status === 'checking' ? 'checking' : info.status === 'detected' ? 'detected' : (info.status === 'error' || info.status === 'unsupported') ? 'error' : 'idle';
  var chipBtn = $('device-chip');
  if (chipBtn) chipBtn.dataset.mstatus = wrap ? wrap.dataset.mstatus : 'idle';
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* ---------- 5. Control segments ---------- */
function ensureSegment() {
  var bar = $('m30-control-segment');
  if (bar) return bar;
  bar = d.createElement('div');
  bar.id = 'm30-control-segment';
  bar.className = 'm30-segment';
  bar.setAttribute('role', 'tablist');
  bar.innerHTML =
    '<button data-msub="remote" role="tab">' + svg('remote', 19) + '<span></span></button>' +
    '<button data-msub="cast" role="tab">' + svg('cast', 19) + '<span></span></button>';
  bar.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-msub]') : null;
    if (!b) return;
    show(b.dataset.msub === 'apps' ? 'apps' : b.dataset.msub === 'cast' ? 'cast' : 'remote');
  });
  return bar;
}
function paintSegmentLabels() {
  var bar = $('m30-control-segment');
  if (!bar) return;
  var map = { remote: t('remote'), apps: t('apps'), cast: t('share') };
  bar.querySelectorAll('[data-msub]').forEach(function (b) { var s = b.querySelector('span'); if (s) s.textContent = map[b.dataset.msub]; });
}
function mountSegment(pageId) {
  var bar = ensureSegment();
  var host = $(pageId);
  if (!host) return;
  var anchor = host.querySelector('.eyebrow, h1');
  if (anchor && anchor.parentElement === host) anchor = host.firstElementChild;
  host.insertBefore(bar, host.children[1] || null);
  paintSegmentLabels();
  bar.querySelectorAll('[data-msub]').forEach(function(b){b.setAttribute('aria-selected',b.dataset.msub===CONTROL_SUB[pageId]?'true':'false');});
}

/* ---------- 6. Play destination ---------- */
function syncPlaySegment() {
  var box = d.querySelector('.iptv-destinations');
  if (!box) return;
  box.classList.add('m30-segment');
  var phone = $('iptv-phone-open'), tvb = $('iptv-tv-show');
  if (!phone || !tvb) return;
  var tvOpen = false;
  try {
    var det = $('iptv-tv-controls');
    tvOpen = !!(det && det.open);
  } catch (e) {}
  phone.classList.toggle('m30-active', !tvOpen);
  tvb.classList.toggle('m30-active', tvOpen);
}

/* ---------- 7. IP cards + copy ---------- */
function enhanceIPs() {
  var manual = d.querySelector('#page-connect .manual, #page-home .manual');
  if (manual && !manual.classList.contains('m30-ip-tv')) {
    manual.classList.add('m30-ip-card', 'm30-ip-tv');
    var ic = d.createElement('span');
    ic.className = 'm30-ip-icon'; ic.innerHTML = svg('tv', 24);
    manual.insertBefore(ic, manual.firstChild);
    var note = d.createElement('small');
    note.setAttribute('data-m30', 'tvCard');
    var lab = manual.querySelector('label');
    if (lab) lab.appendChild(note);
  }
  var cards = [$('guide-phone-card'), d.querySelector('.phone-ip')];
  cards.forEach(function (card) {
    if (!card || card.querySelector('[data-m30copy]')) return;
    var btn = d.createElement('button');
    btn.type = 'button'; btn.className = 'm30-copy'; btn.setAttribute('data-m30copy', '1');
    btn.innerHTML = svg('copy', 16) + '<span>' + esc(t('copy')) + '</span>';
    btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-top:10px;';
    btn.addEventListener('click', function () {
      var src = card.querySelector('#guide-phone-ip, #phone-ip, strong');
      var val = src ? src.textContent.trim() : '';
      if (!val || val === '—') return;
      copyText(val, btn);
    });
    card.appendChild(btn);
  });
  var phone = d.querySelector('.phone-ip');
  if (phone && !phone.classList.contains('m30-ip-phone')) {
    phone.classList.add('m30-ip-card', 'm30-ip-phone');
    var ic2 = d.createElement('span');
    ic2.className = 'm30-ip-icon'; ic2.innerHTML = svg('phone', 24);
    phone.insertBefore(ic2, phone.firstChild);
  }
  paintIPLabels();
}
function paintIPLabels() {
  d.querySelectorAll('[data-m30="tvCard"]').forEach(function (n) { n.textContent = ' · ' + t('tvCard'); });
}
function copyText(val, btn) {
  function done() {
    var s = btn ? btn.querySelector('span') : null;
    if (s) { s.textContent = t('copied'); setTimeout(function () { s.textContent = t('copy'); }, 1600); }
    try { if (w.MorphNativeToast) return; } catch (e) {}
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(val).then(done, done); return; }
  } catch (e) {}
  try {
    var ta = d.createElement('textarea');
    ta.value = val; ta.style.position = 'fixed'; ta.style.opacity = '0';
    d.body.appendChild(ta); ta.select();
    try { d.execCommand('copy'); } catch (e2) {}
    d.body.removeChild(ta); done();
  } catch (e) { done(); }
}

/* ---------- 8. Gear sheet (relocated prefs, same nodes/contracts) ---------- */
function buildGear() {
  if ($('m30-gear-sheet')) return;
  var header = d.querySelector('header .m30-head-actions');
  if (header && !$('m30-gear-btn')) {
    var g = d.createElement('button');
    g.id = 'm30-gear-btn'; g.className = 'm30-gear';
    g.setAttribute('aria-label', t('settings'));
    g.innerHTML = svg('gear', 22);
    g.addEventListener('click', openSheet);
    header.appendChild(g);
  }
  var scrim = d.createElement('div');
  scrim.className = 'm30-scrim'; scrim.id = 'm30-scrim';
  scrim.addEventListener('click', closeSheets);
  var sheet = d.createElement('div');
  sheet.className = 'm30-sheet'; sheet.id = 'm30-gear-sheet';
  sheet.hidden=true;sheet.setAttribute('aria-hidden','true');sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', t('settings'));
  sheet.innerHTML = '<div class="m30-grab"></div><div class="m30-sheet-heading"><h2>' + esc(t('settings')) + '</h2><button id="m30-settings-close" type="button" aria-label="Close">×</button></div><div id="m30-sheet-body"></div>';sheet.querySelector('#m30-settings-close').textContent='←';sheet.querySelector('#m30-settings-close').setAttribute('aria-label',t('back'));sheet.querySelector('#m30-settings-close').onclick=closeSheets;
  d.body.appendChild(scrim); d.body.appendChild(sheet);
  var body = sheet.querySelector('#m30-sheet-body');
  w.Morph30CollectPrefs = function () {
    function move(sel) { var n = d.querySelector(sel); if (n && body && n.parentElement !== body) body.appendChild(n); return n; }
    move('.language-row');
    var fs = d.querySelector('.font-size-panel');
    if (fs) { fs.hidden = true;fs.inert = true;fs.setAttribute('aria-hidden','true'); }
    move('.morph-support:not(.home-support)');
    move('details.panel.about-us');
  };
  w.Morph30CollectPrefs();
  var ver = d.createElement('p');
  ver.className = 'fine'; ver.style.textAlign = 'center';
  try {
    var f = d.querySelector('footer span');
    if (f) ver.textContent = f.textContent;
  } catch (e) {}
  body.appendChild(ver);
  paintGearLabels();
}
function paintGearLabels() {
  var g = $('m30-gear-btn'); if (g) g.setAttribute('aria-label', t('settings'));
  var h = d.querySelector('#m30-gear-sheet h2'); if (h) h.textContent = t('settings');var close=$('m30-settings-close');if(close)close.setAttribute('aria-label',({ar:'إغلاق الإعدادات',en:'Close settings',fr:'Fermer les réglages',zh:'关闭设置',ja:'設定を閉じる'})[lang()]||'Close settings');
}
var lastFocus = null;
function openSheet() {
  lastFocus = d.activeElement;
  if(w.Morph30CollectPrefs)w.Morph30CollectPrefs();$('m30-gear-sheet').hidden=false;$('m30-gear-sheet').setAttribute('aria-hidden','false');d.body.classList.add('m30-modal-open');$('m30-scrim').classList.add('open');
  $('m30-gear-sheet').classList.add('open');
  var f = $('m30-gear-sheet').querySelector('select, button');
  if (f) try { f.focus({ preventScroll: true }); } catch (e) {}
}
function closeSheets() {
  var s = $('m30-scrim'), sh = $('m30-gear-sheet'), ob = d.querySelector('.m30-onboard');
  if (s) s.classList.remove('open');
  if (sh){sh.classList.remove('open');sh.hidden=true;sh.setAttribute('aria-hidden','true');}d.body.classList.remove('m30-modal-open');
  if (ob){if(w.Morph30DismissOnboard)w.Morph30DismissOnboard();else ob.remove();}
  if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
}

/* ---------- 9. Remote capability hint ---------- */
function ensureCapHint() {
  if ($('m30-cap-remote')) return;
  var anchor = $('remote-connect') || $('remote-status');
  if (!anchor || !anchor.parentElement) return;
  var p = d.createElement('p');
  p.className = 'm30-cap'; p.id = 'm30-cap-remote';
  anchor.parentElement.insertBefore(p, anchor.nextSibling);
  paintCapHint();
}
function paintCapHint() { var p = $('m30-cap-remote'); if (p) p.textContent = t('capRemote'); }

/* ---------- 9b. Localized static copy (phone-only; locale.js has no entries) ---------- */
function paintStaticCopy() {
  var m = { 'compat-lg': t('compatLG'), 'remote-android-note': t('remoteNote'), 'iptv-type-label': t('srcType') };
  Object.keys(m).forEach(function (id) { var n = $(id); if (n) n.textContent = m[id]; });
  var coll = { national: t('collNational'), saudi: t('collSaudi'), patriotic: t('collPatriotic'), baseball: t('collBaseball') };
  Object.keys(coll).forEach(function (key) {
    var b = d.querySelector('#theme-collections button[data-collection="' + key + '"]');
    if (b) { b.setAttribute('data-no-translate', ''); b.textContent = coll[key]; }
  });
}

/* ---------- 10. Onboarding ---------- */
function maybeOnboard() {
  try {
    if (localStorage.getItem('tvmorph.onboarded30') === '1') return;
    // Automation gate: webdriver harnesses get a deterministic first run
    // unless forced via ?m30onboard=1 (covered by tests/morph30-check.cjs).
    var force = /[?&]m30onboard=1/.test(location.search || '');
    if (!force && navigator.webdriver) return;
  } catch (e) { return; }
  var slides = [
    { icon: 'play', title: 'onboard1t', body: 'onboard1p' },
    { icon: 'globe', title: 'onboard2t', body: 'onboard2p' },
    { icon: 'lock', title: 'onboard3t', body: 'onboard3p' }
  ];
  var i = 0;
  var ov = d.createElement('div');
  ov.className = 'm30-onboard';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',t('onboard1t')); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = '<div class="m30-onboard-card"><div class="m30-ob-icon"></div><h2></h2><p></p><div class="m30-ob-dots"><i></i><i></i><i></i></div><button class="primary full"></button><button class="text-button full" style="margin-top:6px"></button></div>';
  d.body.appendChild(ov);
  var icon = ov.querySelector('.m30-ob-icon'), h = ov.querySelector('h2'), p = ov.querySelector('p'),
      next = ov.querySelector('.primary'), skip = ov.querySelector('.text-button'),
      dots = ov.querySelectorAll('.m30-ob-dots i');
  function paint() {
    icon.innerHTML = svg(slides[i].icon, 38);
    h.textContent = t(slides[i].title); p.textContent = t(slides[i].body);
    next.textContent = i < 2 ? t('next') : t('start');
    skip.textContent = t('skip');
    dots.forEach(function (x, k) { x.className = k <= i ? 'done' : ''; });
  }
  function finish() { try { localStorage.setItem('tvmorph.onboarded30', '1');localStorage.setItem('morph.welcome-support.v1','1'); } catch (e) {} ov.remove(); }w.Morph30DismissOnboard=finish;
  next.addEventListener('click', function () { if (i < 2) { i++; paint(); } else finish(); });
  skip.addEventListener('click', finish);
  w.Morph30RepaintOnboard = paint;
  paint();
}

/* ---------- 11. Nav labels + icons ---------- */
function paintNavLabels() {
  var map = { home: ['home', t('home')], design: ['design', t('design')], control: ['remote', t('control')], play: ['play', t('play')], worship: ['worship',t('worship')] };
  navButtons().forEach(function (b) {
    var m = map[b.dataset.page];
    if (!m) return;
    b.setAttribute('data-no-translate', '');
    // drop legacy ASCII glyph spans AND bare text labels (keep a single icon+label pair)
    Array.prototype.slice.call(b.childNodes).forEach(function (n) {
      if (n.nodeType === 3) n.remove();
      else if (n.tagName === 'SPAN' && !n.classList.contains('m30-nav-ic') && !n.classList.contains('m30-nav-lb')) n.remove();
    });
    var ic = b.querySelector('.m30-nav-ic');
    if (!ic) {
      ic = d.createElement('span');
      ic.className = 'm30-nav-ic';
      ic.setAttribute('aria-hidden', 'true');
      b.insertBefore(ic, b.firstChild);
    }
    ic.innerHTML = svg(m[0], 24);
    var lb = b.querySelector('.m30-nav-lb');
    if (!lb) { lb = d.createElement('span'); lb.className = 'm30-nav-lb'; b.appendChild(lb); }
    lb.textContent = m[1];
  });
}

/* ---------- 12. Boot ---------- */
function rebindNav() {
  navButtons().forEach(function (b) {
    b.onclick = function (ev) {
      if (ev && ev.preventDefault) ev.preventDefault();
      show(b.dataset.page);
    };
  });
  // in-page shortcuts / CTAs / cast-back keep working through aliases
  d.querySelectorAll('[data-page]').forEach(function (b) {
    if (b.closest && b.closest('.bottom-nav')) return;
    b.onclick = function (ev) {
      if (ev && ev.preventDefault) ev.preventDefault();
      show(b.dataset.page);
    };
  });
}
function watchStatus() {
  var st = $('connection-state');
  if (!st) return;
  try {
    new MutationObserver(function () { renderStatus(); }).observe(st, { attributes: true, attributeFilter: ['data-status'] });
  } catch (e) {}
  renderStatus();
}
function watchEscape() {
  d.addEventListener('keydown', function (e) {
    var sheet=$('m30-gear-sheet');if(e.key==='Tab'&&sheet&&!sheet.hidden){var items=Array.prototype.filter.call(sheet.querySelectorAll('button,input,select,textarea,a[href],summary'),function(n){var closed=n.closest('details:not([open])'),summary=closed&&closed.querySelector('summary');return !n.disabled&&n.getClientRects().length&&!n.closest('[hidden]')&&(!closed||summary===n||summary&&summary.contains(n));});var first=items[0],last=items[items.length-1];if(items.length&&((e.shiftKey&&d.activeElement===first)||(!e.shiftKey&&d.activeElement===last))){e.preventDefault();(e.shiftKey?last:first).focus();}return;}
    if (e.key !== 'Escape' && e.keyCode !== 27) return;
    var sh = $('m30-gear-sheet');
    if (sh && sh.classList.contains('open')) { e.preventDefault(); closeSheets(); return; }
    if (!e.defaultPrevented && back()) e.preventDefault();
  });
}
function repaintAll() {
  try { if (w.Morph30CollectPrefs) w.Morph30CollectPrefs(); } catch (e) {}
  paintNavLabels(); paintSegmentLabels(); paintGearLabels(); paintCapHint(); paintIPLabels(); paintStaticCopy();
  renderStatus();
  try { if (w.Morph30RepaintOnboard) w.Morph30RepaintOnboard(); } catch (e) {}
}

function organiseDesign(){
 var studio=$('page-studio');if(!studio)return;
 var banner=studio.querySelector('.studio-banner');if(banner)banner.hidden=true;
 var heading=d.createElement('div');heading.className='m30-page-heading';heading.id='m30-design-heading';heading.setAttribute('data-no-translate','');heading.innerHTML='<h1></h1><p></p>';studio.insertBefore(heading,studio.firstChild);
 function label(){var names={ar:['ثيمات تلفزيونك','اختار الثيم وشوف المعاينة، ثم طبّقه على التلفزيون.'],en:['Themes for your TV','Choose a theme, preview it, then apply it to your TV.'],fr:['Personnalisez votre TV','Choisissez un thème, puis appliquez-le au téléviseur.'],zh:['设计电视界面','选择主题、预览，然后应用到电视。'],ja:['テレビをデザイン','テーマを選び、確認してテレビに適用。']},row=names[lang()]||names.en;heading.querySelector('h1').textContent=row[0];heading.querySelector('p').textContent=row[1];}label();w.addEventListener('morphLanguage',label);
 var preview=$('preview'),previewHeading=studio.querySelector('.preview-heading'),library=$('theme-library');if(previewHeading)heading.after(previewHeading);if(preview)previewHeading?previewHeading.after(preview):heading.after(preview);if(library&&preview){preview.after(library);library.open=true;}
 var apply=$('apply');if(apply){var bar=d.createElement('div');bar.id='m30-applybar';bar.className='m30-applybar';bar.hidden=true;bar.appendChild(apply);studio.appendChild(bar);}
 ['phone-parental','family-panel'].forEach(function(id){var panel=$(id);if(panel){panel.open=false;studio.appendChild(panel);}});
}

function init() {
  var appHeader=d.querySelector('body>header');
  if(appHeader&&!$('m30-page-back')){
    var headerBack=d.createElement('button');headerBack.id='m30-page-back';headerBack.type='button';
    headerBack.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>';
    headerBack.setAttribute('aria-label',lang()==='ar'?'رجوع للصفحة السابقة':'Back to the previous page');
    headerBack.onclick=back;
    appHeader.prepend(headerBack);
    w.addEventListener('morphLanguage',function(){headerBack.setAttribute('aria-label',lang()==='ar'?'رجوع للصفحة السابقة':'Back to the previous page');});
  }
  // hero on Home page
  var home = $('page-connect');
  if (home && !$('m30-status')) {
    var hero = d.createElement('div');
    hero.className = 'm30-status'; hero.id = 'm30-status';
    hero.setAttribute('role', 'status');
    hero.innerHTML = '<div class="m30-status-row"><span class="m30-dot"></span><div><h2 id="m30-status-title"></h2><p id="m30-status-sub"></p></div></div>';
    home.insertBefore(hero, home.firstChild);
  }
  organiseDesign();
  buildGear();
  ensureSegment();
  ensureCapHint();
  enhanceIPs();
  rebindNav();
  watchEscape();
  // discover current visible page (legacy default: studio)
  var vis = null;
  pages().forEach(function (p) { if (!p.hidden) vis = p.id; });
  current = vis || 'page-studio';
  paintNav(current);
  watchStatus();
  repaintAll();
  try { show('home', { replace: true }); } catch (e) {}
  maybeOnboard();
  w.addEventListener('morphLanguage', repaintAll);
  try { w.addEventListener('load', function () { try { if (w.Morph30CollectPrefs) w.Morph30CollectPrefs(); } catch (e) {} repaintAll(); }); } catch (e) {}
  try { w.addEventListener('morphDiscovery', function () { renderStatus(); }); } catch (e) {}
  w.Morph30 = { show: show, back: back, svg: svg, t: t, repaint: repaintAll };
  // Back-compat: legacy callers expect window.handleBack
  w.handleBack = back;
}
if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
else init();
})(window);
