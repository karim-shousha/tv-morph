/* Mobile presentation of /api/matches. Scheduling, scores and coverage stay server-owned. */
(function (w, d) {
  'use strict';
  var root = d.getElementById('page-matches');
  if (!root) return;
  var feed = null, busy = false, error = false, tab = 'fixtures', day = 'all', team = '', lastAttempt = 0, timer = null, chosenDate = dateKey(new Date()), weekOffset=0, favorites = [];
  try { var stored=JSON.parse(localStorage.getItem('morph.matches.favorites.v1')||'[]'); if(Array.isArray(stored))favorites=stored.filter(function(x){return typeof x==='string'}).slice(0,32); }catch(ignore){}
  function ar() { return w.MorphLocale && MorphLocale.get() === 'ar'; }
  function t(a, b) { return ar() ? a : b; }
  function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function icon(name) { var span = el('span', 'mp-icon'); span.innerHTML = w.Morph30 ? Morph30.svg(name, 21) : ''; span.setAttribute('aria-hidden', 'true'); return span; }
  function button(text, action, cls) { var b = el('button', cls || '', text); b.type = 'button'; b.onclick = action; return b; }
  function dateKey(value) { var dt = value instanceof Date ? value : new Date(value); return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2); }
  function format(value, opts) { try { return new Date(value).toLocaleString(ar() ? 'ar-EG' : 'en-GB', opts); } catch (e) { return ''; } }
  function isVisible() { return !root.hidden && !d.hidden; }
  function badge(address) { return /^https:\/\/(?:r2\.thesportsdb\.com|www\.thesportsdb\.com)\/images\/media\/team\/badge\/[\w/.-]+$/.test(address || ''); }
  function teamName(value) { var found = (feed && feed.teams || []).filter(function (item) { return item.id === value.id; })[0]; return found ? (ar() ? found.ar || found.name : found.name) : value.name; }
  function rows() {
    var date = new Date(), today=dateKey(date), start=new Date(date.getFullYear(),date.getMonth(),date.getDate()+1+weekOffset*7), end=new Date(date.getFullYear(),date.getMonth(),date.getDate()+8+weekOffset*7); if (day === 'tomorrow') date.setDate(date.getDate() + 1);
    return (feed && feed.matches || []).filter(function (m) {
      return m && m.home && m.away && typeof m.home.name === 'string' && typeof m.away.name === 'string'
        && isFinite(Date.parse(m.kickoff)) && (day!=='all'||(tab === 'results' ? m.status === 'finished' : m.status !== 'finished'))
        && (!team || (team==='favorites'?favorites.indexOf(m.home.id)>=0||favorites.indexOf(m.away.id)>=0:m.home.id===team||m.away.id===team))
        && (day==='all'||(day==='previous'?dateKey(m.kickoff)<today:day==='week'?new Date(m.kickoff)>=start&&new Date(m.kickoff)<end:day==='custom'?dateKey(m.kickoff)===chosenDate:dateKey(m.kickoff)===dateKey(date)));
    }).sort(function (a, b) { return (day==='previous'||day==='all'&&tab==='results') ? Date.parse(b.kickoff) - Date.parse(a.kickoff) : Date.parse(a.kickoff) - Date.parse(b.kickoff); });
  }
  var hero = el('div', 'mp-hero'), words = el('div', 'mp-hero-copy'), eyebrow = el('span', 'mp-eyebrow'), headline = el('h1'), intro = el('p');
  words.appendChild(eyebrow); words.appendChild(headline); words.appendChild(intro); hero.appendChild(words);
  var art = el('img', 'mp-hero-art'); art.src = 'matches-hero.webp'; art.alt = ''; art.decoding = 'async'; art.setAttribute('aria-hidden', 'true'); hero.appendChild(art); root.appendChild(hero);
  var heading = el('div', 'mp-section-heading'), title = el('h2'), refresh = button('', function () { load(true); }, 'mp-refresh'); refresh.id = 'matches-refresh'; heading.appendChild(title); heading.appendChild(refresh); root.appendChild(heading);
  var tabs = el('div', 'mp-tabs'); tabs.setAttribute('aria-label', 'Matches'); root.appendChild(tabs);
  var filters = el('div', 'mp-filters'), days = el('div', 'mp-days'); filters.appendChild(days);
  var teamLabel = el('label', 'mp-team-picker'), teamCaption = el('span', 'mp-team-caption'), teams = el('select'); teams.id = 'matches-team'; teamLabel.appendChild(teamCaption); teamLabel.appendChild(teams); filters.appendChild(teamLabel); root.appendChild(filters);
  teams.onchange = function () { team = teams.value; paintList(); };
  var dateNavigation=el('div','mp-date-navigation'),dateRange=el('span'),previousDay=button('',function(){shiftDate(-1)}),nextDay=button('',function(){shiftDate(1)});previousDay.id='matches-previous-date';nextDay.id='matches-next-date';dateNavigation.appendChild(previousDay);dateNavigation.appendChild(dateRange);dateNavigation.appendChild(nextDay);filters.appendChild(dateNavigation);
  function shiftDate(delta){if(day==='week')weekOffset+=delta;else{var v=day==='custom'?chosenDate:dateKey(new Date());var parts=v.split('-').map(Number),cursor=new Date(parts[0],parts[1]-1,parts[2]+delta+(day==='tomorrow'?1:0));chosenDate=dateKey(cursor);day='custom';dateInput.value=chosenDate;}labels();}
  var dateField=el('label','mp-custom-date'), dateCaption=el('span'), dateInput=el('input');dateInput.type='date';dateInput.id='matches-date';dateInput.value=chosenDate;dateField.appendChild(dateCaption);dateField.appendChild(dateInput);filters.appendChild(dateField);dateInput.onchange=function(){if(!dateInput.value)return;chosenDate=dateInput.value;tab=chosenDate<dateKey(new Date())?'results':'fixtures';labels()};
  var favoritePanel=el('details','mp-favorite-picker'),favoriteHeading=el('summary'),favoriteList=el('div','mp-favorite-options');favoritePanel.appendChild(favoriteHeading);favoritePanel.appendChild(favoriteList);root.insertBefore(favoritePanel,filters.nextSibling);
  var state = el('div', 'mp-feed-state'); state.id = 'matches-feed-state'; state.setAttribute('role', 'status'); state.setAttribute('aria-live', 'polite'); root.appendChild(state);
  var list = el('div', 'mp-list'); list.id = 'matches-list'; root.appendChild(list);
  var footer = el('div', 'mp-footer'), updated = el('p', 'mp-updated'), note = el('p', 'mp-source'); footer.appendChild(updated); footer.appendChild(note); root.appendChild(footer);
  function side(value) {
    var part = el('div', 'mp-team'), mark = el('span', 'mp-team-mark', String(teamName(value) || '?').slice(0, 2)), name = el('span', 'mp-team-name', teamName(value));
    var art=value.badge;if(!badge(art)){var meta=(feed&&feed.teams||[]).filter(function(item){return item.id===value.id;})[0];art=meta&&meta.badge;}if (badge(art)) { var img = el('img'); img.alt = ''; img.loading = 'eager';img.decoding='async'; img.referrerPolicy = 'no-referrer'; img.onload = function () { mark.textContent = ''; mark.appendChild(img); }; img.onerror=function(){if(!img.dataset.retried){img.dataset.retried='1';setTimeout(function(){img.src=art;},1500);}};img.src = art; }
    part.appendChild(mark); part.appendChild(name); return part;
  }
  function paintList() {
    list.textContent = ''; var matches = rows(), previous = '';
    matches.forEach(function (m) {
      var key = dateKey(m.kickoff);
      if (key !== previous) { list.appendChild(el('h3', 'mp-day-title', format(m.kickoff, { weekday: 'long', day: 'numeric', month: 'long' }))); previous = key; }
      var card = el('article', 'mp-match'), competition = el('div', 'mp-competition', m.competition || t('كرة القدم', 'Football')), matchup = el('div', 'mp-matchup');
      card.appendChild(competition); matchup.appendChild(side(m.home));
      var middle = el('div', 'mp-kickoff'), score = m.score || {}, validScore = typeof score.home === 'number' && typeof score.away === 'number';
      var value = m.status === 'finished' ? (validScore ? score.home + ' – ' + score.away : '—') : (m.timeKnown ? format(m.kickoff, { hour: '2-digit', minute: '2-digit', hour12: false }) : t('لم يُحدد', 'TBC'));
      middle.appendChild(el('strong', '', value));
      middle.appendChild(el('small', '', m.status === 'postponed' ? t('مؤجلة', 'Postponed') : m.status === 'finished' ? t('انتهت', 'Full time') : t('الموعد المحلي', 'Local kick-off')));
      var matchDate=el('time','mp-match-date',format(m.kickoff,{day:'numeric',month:'short',year:'numeric'}));matchDate.dateTime=m.kickoff;middle.appendChild(matchDate);
      matchup.appendChild(middle); matchup.appendChild(side(m.away)); card.appendChild(matchup); list.appendChild(card);
    });
    if (!matches.length) { var empty = el('div', 'mp-empty'); empty.appendChild(icon('matches')); empty.appendChild(el('strong', '', busy || feed && feed.loading ? t('بنجهّز جدول المباريات', 'Updating the schedule') : error ? t('المواعيد غير متاحة حاليًا', 'Schedule unavailable right now') : t('مفيش مباريات متاحة للاختيار ده', 'No matches for this selection'))); empty.appendChild(el('p', '', error ? t('تأكد من الإنترنت وجرّب تحديث الجدول.', 'Check your connection and refresh the schedule.') : t('جرّب كل المواعيد أو اختار فريق تاني.', 'Try all dates or choose another team.'))); list.appendChild(empty); }
    var saved = feed && feed.updatedAt;
    updated.textContent = saved ? t('آخر تحديث: ', 'Updated: ') + format(saved * 1000, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    note.textContent = t('TheSportsDB · تغطية مجانية محدودة، والنتائج ممكن تتأخر. المواعيد بتوقيت جهازك.', 'TheSportsDB · Limited free coverage; results may be delayed. Times use your device timezone.');
    state.textContent = feed && feed.phoneOffline ? t('أنت بتشوف آخر جدول محفوظ. الاتصال بالخدمة غير متاح حاليًا.', 'Showing the saved schedule. The service is currently unavailable.') : feed && feed.stale && matches.length ? t('الجدول محتاج تحديث؛ المواعيد أو النتائج ممكن تكون اتغيّرت.', 'This schedule needs updating; fixtures or results may have changed.') : feed && feed.partial ? t('بعض بيانات الفرق غير متاحة حاليًا.', 'Some team schedules are temporarily unavailable.') : '';
    state.hidden = !state.textContent;
  }
  function labels() {
    root.dir = ar() ? 'rtl' : 'ltr'; root.setAttribute('data-no-translate', '');
    eyebrow.textContent = 'MORPH SPORTS'; headline.textContent = t('خليك في الماتش.', 'Your next kick-off.'); intro.textContent = t('مواعيد ونتائج فرقك، في مكان واحد.', 'Your teams. Their fixtures. All together.'); title.textContent = t('جدول المباريات', 'Match schedule');
    refresh.textContent = ''; refresh.appendChild(icon('refresh')); refresh.appendChild(el('span', '', busy ? t('جارٍ التحديث', 'Updating') : t('تحديث', 'Refresh'))); refresh.disabled = busy;
    tabs.textContent = ''; [['fixtures', t('المواعيد', 'Fixtures')], ['results', t('النتائج', 'Results')]].forEach(function (item) { var b = button(item[1], function () { tab = item[0]; day = 'all'; labels(); }); b.setAttribute('aria-pressed', String(tab === item[0])); tabs.appendChild(b); });
    tabs.setAttribute('aria-label', t('المواعيد والنتائج', 'Fixtures and results'));
    days.textContent = ''; [['all', t('الكل', 'All dates')], ['today', t('اليوم', 'Today')], ['tomorrow', t('غدًا', 'Tomorrow')],['previous',t('السابقة','Previous')],['week',t('الأيام السبعة القادمة','Next seven days')],['custom',t('يوم محدد','Choose a day')]].forEach(function (item) { var b = button(item[1], function () { day = item[0];if(day==='previous')tab='results';else if(day==='week'||day==='tomorrow')tab='fixtures';if(day==='week')weekOffset=0; labels(); }); b.setAttribute('aria-pressed', String(day === item[0])); days.appendChild(b); });
    dateNavigation.hidden=day==='all'||day==='previous';previousDay.textContent='← '+t('السابق','Previous');nextDay.textContent=t('التالي','Next')+' →';var cursor=new Date(),labelDate=day==='custom'?chosenDate:dateKey(new Date(cursor.getFullYear(),cursor.getMonth(),cursor.getDate()+(day==='tomorrow'?1:0)));if(day==='week'){var first=new Date(cursor.getFullYear(),cursor.getMonth(),cursor.getDate()+1+weekOffset*7),last=new Date(cursor.getFullYear(),cursor.getMonth(),cursor.getDate()+7+weekOffset*7);dateRange.textContent=format(first,{day:'numeric',month:'short'})+' – '+format(last,{day:'numeric',month:'short'});}else dateRange.textContent=format(labelDate+'T12:00:00',{day:'numeric',month:'short',year:'numeric'});
    dateField.hidden=day!=='custom';dateCaption.textContent=t('اختار اليوم','Choose date');favoriteHeading.textContent=t('فرقك المفضلة','Your favorite teams')+' · '+favorites.length;favoriteList.textContent='';(feed&&feed.teams||[]).forEach(function(item){var label=el('label'),check=el('input');check.type='checkbox';check.value=item.id;check.checked=favorites.indexOf(item.id)>=0;label.appendChild(check);if(badge(item.badge)){var emblem=el('img');emblem.src=item.badge;emblem.alt='';emblem.loading='lazy';emblem.referrerPolicy='no-referrer';label.appendChild(emblem)}label.appendChild(el('span','',ar()?item.ar||item.name:item.name));check.onchange=function(){if(check.checked&&favorites.indexOf(item.id)<0)favorites.push(item.id);else if(!check.checked)favorites=favorites.filter(function(id){return id!==item.id});try{localStorage.setItem('morph.matches.favorites.v1',JSON.stringify(favorites))}catch(ignore){}favoriteHeading.textContent=t('فرقك المفضلة','Your favorite teams')+' · '+favorites.length;paintList()};favoriteList.appendChild(label)});
    teamCaption.textContent = t('الفريق', 'Team'); teams.setAttribute('aria-label', teamCaption.textContent); teams.textContent = ''; teams.appendChild(el('option', '', t('كل الفرق', 'All teams'))); teams.firstChild.value = '';var favoriteOption=el('option','',t('الفرق المفضلة','Favorite teams'));favoriteOption.value='favorites';teams.appendChild(favoriteOption);
    (feed && feed.teams || []).forEach(function (item) { var option = el('option', '', ar() ? item.ar || item.name : item.name); option.value = item.id; teams.appendChild(option); });
    if (!Array.prototype.some.call(teams.options, function (item) { return item.value === team; })) team = '';
    teams.value = team; paintList();
  }
  function queue() { clearTimeout(timer); timer = null; if (isVisible()) timer = setTimeout(function () { load(false); }, feed && feed.loading ? 5000 : 3600000); }
  function load(force) {
    if (busy || !isVisible()) return;
    if (!force && Date.now() - lastAttempt < 10000) { queue(); return; }
    if (!w.MorphNative || !w.ClearNative) { error = true; labels(); return; }
    busy = true; error = false; lastAttempt = Date.now(); labels();
    MorphNative.call('matchesSchedule', { refresh: !!force }).then(function (value) {
      if (!value || !Array.isArray(value.matches) || value.matches.length > 32 || !Array.isArray(value.teams) || value.teams.length > 32 || value.source !== 'TheSportsDB') throw new Error('invalid_schedule');
      feed = value;
    }).catch(function () { error = true; if (feed) feed.phoneOffline = true; }).then(function () { busy = false; labels(); queue(); });
  }
  new MutationObserver(function () { if (isVisible()) load(false); else { clearTimeout(timer); timer = null; } }).observe(root, { attributes: true, attributeFilter: ['hidden'] });
  d.addEventListener('visibilitychange', function () { if (isVisible()) load(false); else { clearTimeout(timer); timer = null; } });
  w.addEventListener('morphLanguage', labels);
  w.MorphMatches = { back:function(){if(favoritePanel.open){favoritePanel.open=false;return true}return false}, refresh: function () { load(true); } };
  labels();
})(window, document);
