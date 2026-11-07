(function (w) {
'use strict';
var C = w.ClearTV = w.ClearTV || {};
/* Fitness UI: 8 screens inside #view-fitness. Remote-first: everything is a <button>. */
var S = null, UI = { screen: 'home', params: {}, returnFocus: null, engine: null, activeProg: null, builderSel: [], builderFilter: { cat: 'all', lvl: 'all' }, progressRange: 'week', lastSession: null };
function t(k) { return C.FitnessI18n.t(k); }
function L(o) { return C.FitnessI18n.lname(o); }
function el(tag, cls, txt) { return C.el(tag, cls, txt); }
function btn(txt, cls, fn, label) { var b = el('button', cls, txt); b.onclick = function () { try { C.FitnessAudio.beep.click(); } catch (e) {} fn(); }; if (label) b.setAttribute('aria-label', label); return b; }
function root() { return document.getElementById('view-fitness'); }
function setS(v) { S = v; }
function fmt(s) { s = Math.max(0, Math.round(s)); var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }
function exIcon(e) { var m = { cardio: '❤️', hiit: '🔥', core: '🧱', upper_body: '💪', lower_body: '🦵', strength: '🏋️', stretching: '🧘', mobility: '🌊', low_impact: '🪶', warmup: '☀️', recovery: '🌙', full_body: '⚡' }; return m[e.cat] || '🏃'; }
function thumb(e) { var d = el('div', 'fit-thumb'); d.textContent = exIcon(e);  d.setAttribute('aria-hidden', 'true'); return d; }
function cover(node,cat){var known=['full_body','lower_body','upper_body','stretching','cardio','core'];var alias={strength:'upper_body',hiit:'cardio',mobility:'stretching',low_impact:'full_body',warmup:'stretching',recovery:'stretching'};cat=alias[cat]||cat;if(known.indexOf(cat)<0)return;node.textContent='';var img=el('img','fit-cover');img.src='assets/fitness/categories/'+cat+'.webp';img.alt='';img.loading='lazy';img.decoding='async';node.appendChild(img);}
function lvlName(n) { return C.FitnessI18n.lvl(n); }

function show(screen, params) {
  if(!w.MorphPlus||!w.MorphPlus.isActive()){if(w.MorphPlus)w.MorphPlus.open();return;}
  if(UI.screen==='music'&&screen!=='music')C.FitnessAudio.music.stopPreview();
  if(UI.screen==='active'&&screen==='music')UI.activeWrap=root().firstChild;
  if(screen==='active'&&UI.activeWrap){root().textContent='';root().appendChild(UI.activeWrap);UI.activeWrap=null;UI.screen='active';UI.params=params||{};var pause=root().querySelector('[data-pause]');if(pause)C.Focus.focus(pause);return;}
  UI.screen = screen; UI.params = params || {};
  var r = root(); r.textContent = '';
  var wrap = el('div', 'fit-wrap fit-screen-' + screen); r.appendChild(wrap);
  ({ home: renderHome, programs: renderPrograms, builder: renderBuilder, active: renderActive, music: renderMusic, complete: renderComplete, progress: renderProgress, settings: renderSettings })[screen](wrap, UI.params);
  var f = wrap.querySelector('[data-autofocus]') || wrap.querySelector('button');
  if (f) C.Focus.focus(f);
  try { var v = document.getElementById('view-fitness'); if (v) v.scrollTop = 0; } catch (e) {}
}
UI.show = show;

function crumb(wrap, title, sub) {
  var row = el('div', 'fit-chiprow');
  var items = [['home', t('sportsHome')], ['programs', t('programs')], ['builder', t('custom')], ['progress', t('progress')], ['settings', t('settings')]];
  items.forEach(function (it) {
    var b = btn(it[1], 'fit-chip' + (UI.screen === it[0] ? ' on' : ''), function () { if(running()){askExit(function(){UI.activeWrap=null;show(it[0]);});return;}show(it[0]); });
    row.appendChild(b);
  });
  wrap.appendChild(row);
  if (title) { var h = el('h1', '', ''); h.textContent = title; h.style.cssText = 'font-size:40px;margin:6px 0 2px'; wrap.appendChild(h); }
  if (sub) { var p = el('p', '', sub); p.style.cssText = 'font-size:19px;opacity:.75;margin:0 0 14px'; wrap.appendChild(p); }
}

/* ---------- SCREEN 1: HOME ---------- */
function renderHome(wrap) {
  crumb(wrap);
  var hero = el('div', 'fit-hero');var art=el('img','fit-hero-art');art.src='assets/fitness/hero/home.webp';art.alt='';art.decoding='async';hero.appendChild(art);
  var main = el('div', 'fit-hero-main');
  main.appendChild(el('div', 'fit-eyebrow', t('sportsHome')));
  var h = el('h1', ''); h.innerHTML = ''; h.appendChild(document.createTextNode(t('workOut') + ' '));
  var g = el('span', 'grad', t('atHome')); h.appendChild(g); main.appendChild(h);
  main.appendChild(el('p', '', t('tagline')));
  var cta = el('div', 'fit-hero-cta');
  cta.appendChild(btn('▶ ' + t('startTraining'), 'fit-btn-primary', function () { quickStart(); }, t('startTraining')));
  var b = btn(t('browse'), 'fit-ctl', function () { show('programs'); }); b.setAttribute('data-autofocus', '1'); main.appendChild(cta); cta.appendChild(b);
  hero.appendChild(main);
  var side = el('div', 'fit-hero-side');
  var q = btn('', 'fit-side-card', function () { quickStart(); });
  q.appendChild(el('span', 'ico', '⚡')); var qd = el('div', ''); qd.appendChild(el('strong', '', t('quick'))); qd.appendChild(el('small', '', '5–15 min')); q.appendChild(qd);
  var gd = btn('', 'fit-side-card', function () { show('programs'); });
  gd.appendChild(el('span', 'ico', '🎯')); var g2 = el('div', ''); g2.appendChild(el('strong', '', t('guided'))); g2.appendChild(el('small', '', t('programs'))); gd.appendChild(g2);
  var cu = btn('', 'fit-side-card', function () { show('builder'); });
  cu.appendChild(el('span', 'ico', '🛠️')); var c3 = el('div', ''); c3.appendChild(el('strong', '', t('custom'))); c3.appendChild(el('small', '', t('selectAll'))); cu.appendChild(c3);
  side.appendChild(q); side.appendChild(gd); side.appendChild(cu); hero.appendChild(side); wrap.appendChild(hero);

  wrap.appendChild(el('h2', 'fit-row-title', t('categories')));
  var rail = el('div', 'fit-rail fit-category-rail'); rail.setAttribute('data-scroll', 'horizontal');
  C.FitnessData.CATEGORIES.filter(function(c){return ['full_body','lower_body','upper_body','stretching','cardio','core'].indexOf(c.id)>=0;}).forEach(function (c) {
    var card = btn('', 'fit-card', function () { show('programs', { cat: c.id }); }, L(c.name));
    var th = el('div', 'fit-thumb', c.icon === 'bolt' ? '⚡' : c.icon === 'heart' ? '❤️' : c.icon === 'flame' ? '🔥' : c.icon === 'leaf' ? '🧘' : c.icon === 'moon' ? '🌙' : c.icon === 'sun' ? '☀️' : '🏃');
    cover(th,c.id); card.appendChild(th);
    card.appendChild(el('h3', '', L(c.name)));
    var n = C.FitnessData.PROGRAMS.filter(function (p) { return p.cat === c.id || (c.id==='stretching'&&['mobility','recovery','warmup'].indexOf(p.cat)>=0); }).length;
    card.appendChild(el('p', '', n ? n + ' ' + t('programs') : t('all')));
    rail.appendChild(card);
  });
  wrap.appendChild(rail);

  wrap.appendChild(el('h2', 'fit-row-title', t('guided')));
  var rail2 = el('div', 'fit-rail'); rail2.setAttribute('data-scroll', 'horizontal');
  featured().forEach(function (p) { rail2.appendChild(progCard(p)); });
  wrap.appendChild(rail2);
}
function featured() {
  var ids = ['full_body_starter', 'quick_energy', 'fat_burn', 'deep_stretch'];
  return ids.map(function (id) { return C.FitnessData.programById(id); }).filter(Boolean);
}
function progCard(p) {
  var card = btn('', 'fit-card', function () { show('programs', { cat: p.cat, sel: p.id }); }, L(p.name));
  var th = el('div', 'fit-thumb', '🏋️'); cover(th,p.cat); card.appendChild(th);
  card.appendChild(el('h3', '', L(p.name)));
  card.appendChild(el('p', '', '~' + p.targetMins + ' min · ' + lvlName(p.level)));
  return card;
}
function quickStart() {
  var p = C.FitnessData.programById('quick_energy');
  startProgram(p);
}

/* ---------- SCREEN 2: PROGRAMS / DETAIL ---------- */
function renderPrograms(wrap, params) {
  crumb(wrap, t('programs'));
  var cats = [{ id: 'all', name: { en: 'All', ar: 'الكل', fr: 'Tout', zh: '全部', ja: '全部' } }].concat(C.FitnessData.CATEGORIES);
  var row = el('div', 'fit-chiprow');
  var cur = params.cat || 'all';
  cats.forEach(function (c) {
    row.appendChild(btn(L(c.name), 'fit-chip' + (cur === c.id ? ' on' : ''), function () { show('programs', { cat: c.id }); }));
  });
  wrap.appendChild(row);
  var list = C.FitnessData.PROGRAMS.filter(function (p) {
    if (cur !== 'all' && p.cat !== cur && !(cur==='stretching'&&['mobility','recovery','warmup'].indexOf(p.cat)>=0)) return false;
    if (S.difficulty !== 'all') { var want = S.difficulty === 'beginner' ? 1 : S.difficulty === 'intermediate' ? 2 : 3; if (p.level !== want) return false; }
    return true;
  });
  var cols = el('div', 'fit-grid'); cols.setAttribute('data-scroll', 'vertical');
  list.forEach(function (p) {
    cols.appendChild(progCard(p));
  });
  wrap.appendChild(cols);
  var sel = params.sel ? C.FitnessData.programById(params.sel) : list[0];
  if (sel) detailPanel(wrap, sel);
}
function detailPanel(wrap, p) {
  var ex = p.exercises.map(function (id) { return C.FitnessData.byId(id); }).filter(Boolean);
  var panel = el('div', 'fit-panel');
  panel.appendChild(el('h2', '', L(p.name)));
  var sub = el('p', '', (C.FitnessData.desc ? '' : '') + L(p.desc) + ' · ~' + p.targetMins + ' min · ' + ex.length + ' ' + t('exercises') + ' · ' + p.rounds + ' ' + t('rounds') + ' · ' + lvlName(p.level));
  sub.style.opacity = '.8'; panel.appendChild(sub);
  var seq = el('p', 'fit-toast-note', ex.map(function (e) { return L(e.name); }).join('  →  ')); panel.appendChild(seq);
  var row = el('div', 'fit-ctls'); row.style.justifyContent = 'flex-start';
  var st = btn('▶ ' + t('start'), 'fit-ctl main', function () { startProgram(p); }); st.setAttribute('data-autofocus', '1');
  row.appendChild(st);
  row.appendChild(btn(t('music'), 'fit-ctl', function () { UI.returnTo = { s: 'programs', p: { cat: p.cat, sel: p.id } }; show('music'); }));
  panel.appendChild(row); wrap.appendChild(panel);
}

/* ---------- SCREEN 3: BUILDER ---------- */
function renderBuilder(wrap) {
  crumb(wrap, t('create'), t('selectAll'));
  var s = C.FitnessStore;
  var customs = s.custom();
  if (customs.length) {
    var r = el('div', 'fit-chiprow');
    customs.forEach(function (c4) {
      var bb = btn('📁 ' + c4.name, 'fit-chip', function () { startCustom(c4); });
      r.appendChild(bb);
      var del = btn('✕', 'fit-chip', function () {
        if (!confirm(t('confirmClear') + ' (' + c4.name + ')')) return;
        s.saveCustom(s.custom().filter(function (x) { return x.id !== c4.id; })); show('builder');
      }, t('deleteIt'));
      r.appendChild(del);
    });
    wrap.appendChild(r);
  }
  var cats = [{ id: 'all', name: { en: 'All', ar: 'الكل', fr: 'Tout', zh: '全部', ja: '全部' } }].concat(C.FitnessData.CATEGORIES);
  var row = el('div', 'fit-chiprow');
  cats.forEach(function (c) { row.appendChild(btn(L(c.name), 'fit-chip' + (UI.builderFilter.cat === c.id ? ' on' : ''), function () { UI.builderFilter.cat = c.id; show('builder'); })); });
  wrap.appendChild(row);
  var grid = el('div', 'fit-grid'); grid.setAttribute('data-scroll', 'vertical');
  C.FitnessData.EXERCISES.filter(function (e) {
    if (UI.builderFilter.cat !== 'all' && e.cat !== UI.builderFilter.cat) return false;
    if (UI.builderFilter.lvl !== 'all' && String(e.level) !== String(UI.builderFilter.lvl)) return false;
    return true;
  }).forEach(function (e) {
    var on = UI.builderSel.indexOf(e.id) >= 0;
    var card = btn('', 'fit-ex' + (on ? ' sel' : ''), function () {
      var i = UI.builderSel.indexOf(e.id);
      if (i >= 0) UI.builderSel.splice(i, 1); else UI.builderSel.push(e.id);
      var scroll=root().scrollTop;show('builder');var target=root().querySelector('[data-exercise-id="'+e.id+'"]');root().scrollTop=scroll;if(target)C.Focus.focus(target);
    }, L(e.name));
    card.setAttribute('data-exercise-id',e.id);card.setAttribute('aria-pressed',String(on));
    if (on) { var ck = el('span', 'fit-check', '✓'); card.appendChild(ck); }
    card.appendChild(thumb(e));
    card.appendChild(el('h3', '', L(e.name)));
    card.appendChild(el('p', '', e.secs + 's · ' + lvlName(e.level)));
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  var secs = UI.builderSel.reduce(function (a, id) { var e = C.FitnessData.byId(id); return a + (e ? e.secs + e.rest : 0); }, 0);
  var bar = el('div', 'fit-panel fit-builder-summary');
  bar.appendChild(el('strong', '', UI.builderSel.length + ' ' + t('exercises') + ' · ~' + Math.round(secs / 60) + ' min'));
  var ctl = el('div', 'fit-ctls'); ctl.style.justifyContent = 'flex-start';
  ctl.appendChild(btn('▶ ' + t('start'), 'fit-ctl main', function () {
    if (!UI.builderSel.length) { C.toast(t('empty')); return; }
    startCustom({ id: 'tmp', name: t('custom'), exercises: UI.builderSel.slice(), rounds: 1, rest: S.restSecs });
  }));
  ctl.appendChild(btn('💾 ' + t('saveWorkout'), 'fit-ctl', function () {
    if (!UI.builderSel.length) return;
    var name = prompt(t('workoutName'), t('custom') + ' ' + (s.custom().length + 1));if(name===null)return;if(!name.trim())name=t('custom')+' '+(s.custom().length+1);
    var list = s.custom(); list.push({ id: 'c' + Date.now(), name: String(name).slice(0, 40), exercises: UI.builderSel.slice(), rounds: 1, rest: S.restSecs });
    s.saveCustom(list); C.toast(t('saved'));
  }));
  bar.appendChild(ctl); wrap.insertBefore(bar,grid);
}
function startCustom(c4) {
  startProgram({ id: c4.id || 'custom', level: 2, targetMins: Math.round(c4.exercises.length * 1), cat: 'full_body', rounds: c4.rounds || 1, exercises: c4.exercises, rest: c4.rest || S.restSecs, name: { en: c4.name, ar: c4.name, fr: c4.name, zh: c4.name, ja: c4.name }, desc: { en: '', ar: '', fr: '', zh: '', ja: '' }, image: 'fitness/programs/custom', custom: true });
}

/* ---------- start engine ---------- */
function startProgram(p) {
  if(running()){askExit(function(){UI.activeWrap=null;startProgram(p);});return;}
  UI.activeProg = p;
  var prep = S.countdown === false ? 0 : 5000;
  show('active', {});
  bootActive(p, prep);
  C.FitnessAudio.music.start('workout');
}

/* ---------- SCREEN 4: ACTIVE ---------- */
function bootActive(p, prepMs) {
  var wrap = root().querySelector('.fit-wrap'); if (!wrap) return;
  var eng = new C.FitnessEngine();
  eng.configure({ prepMs: prepMs, restMs: (p.rest || S.restSecs) * 1000 });
  UI.engine = eng;
  var phaseEl = wrap.querySelector('[data-phase]'), numEl = wrap.querySelector('[data-num]'),
      subEl = wrap.querySelector('[data-sub]'), ring = wrap.querySelector('[data-ring]'),
      exEl = wrap.querySelector('[data-ex]'), nextEl = wrap.querySelector('[data-next]'),
      progEl = wrap.querySelector('[data-prog]'), roundEl = wrap.querySelector('[data-round]'),
      pauseB = wrap.querySelector('[data-pause]');
  function lang2() { var l = C.FitnessI18n.lang(); return l === 'ar' ? 'ar-EG' : l === 'fr' ? 'fr-FR' : l === 'zh' ? 'zh-CN' : l === 'ja' ? 'ja-JP' : 'en-US'; }
  function say(msg) { C.FitnessAudio.speak(msg, lang2()); }
  function draw(rem, tot) {
    var f = tot > 0 ? Math.max(0, rem / tot) : 0;
    if (ring) ring.style.strokeDashoffset = String(628 * (1 - f));
    if (numEl) numEl.textContent = fmt(Math.ceil(rem / 1000));
  }
  eng.on('prepare', function () { if (phaseEl) phaseEl.textContent = t('getReady'); say(t('getReady')); });
  eng.on('prepareTick', function (d) {
    var s = Math.ceil(d.remainingMs / 1000);
    if (exEl) exEl.innerHTML = '<div class="fit-count">' + (s > 0 ? s : t('go')) + '</div>';
    draw(d.remainingMs, eng.totalMs);
    var last = eng._lastCount || 99;
    if (s !== last && s <= 5 && s > 0) { eng._lastCount = s; C.FitnessAudio.beep.count(s); say(String(s)); }
  });
  eng.on('go', function () { C.FitnessAudio.beep.go(); say(t('go')); });
  eng.on('exercise', function (d) {
    if (phaseEl) phaseEl.textContent = L(d.ex.name);
    if (subEl) subEl.textContent = d.ex.cueEn ? (C.FitnessI18n.lang() === 'ar' ? d.ex.cueAr : d.ex.cueEn) : '';
    if (exEl) { exEl.textContent = ''; exEl.appendChild(thumb(d.ex)); var h = el('h2', '', L(d.ex.name)); exEl.appendChild(h); exEl.appendChild(el('p', '', (d.ex.muscles || []).join(' · '))); }
    if (nextEl) { var nx = eng.queue[d.index + 1]; nextEl.textContent = t('nextUp') + ': ' + (nx ? L(nx.ex.name) : '—'); }
    if (progEl) progEl.textContent = (d.index + 1) + '/' + d.total;
    if (roundEl) roundEl.textContent = t('round') + ' ' + d.round + ' ' + t('of') + ' ' + d.rounds;
    say(L(d.ex.name));
    if (pauseB) pauseB.textContent = '⏸ ' + t('pause');
    draw(d.secs * 1000, d.secs * 1000);
  });
  eng.on('tick', function (d) { draw(d.remainingMs, eng.totalMs); if (subEl && progEl) { var done = eng.queue.slice(0, d.index).length; progEl.textContent = (d.index + 1) + '/' + eng.queue.length; } });
  eng.on('tickLow', function (d) { C.FitnessAudio.beep.count(d.s); });
  eng.on('rest', function (d) {
    if (phaseEl) phaseEl.textContent = '☕ ' + t('rest');
    C.FitnessAudio.beep.rest(); say(t('rest'));
    if (exEl) exEl.innerHTML = '<div class="fit-count">☕</div>';
    if (nextEl && d.next) nextEl.textContent = t('nextUp') + ': ' + L(d.next.name);
  });
  eng.on('restTick', function (d) { draw(d.remainingMs, eng.totalMs); });
  eng.on('pause', function () { C.FitnessAudio.music.pause(); if (pauseB) pauseB.textContent = '▶ ' + t('resume'); });
  eng.on('resume', function () { C.FitnessAudio.music.start('workout'); if (pauseB) pauseB.textContent = '⏸ ' + t('pause'); });
  eng.on('complete', function (d) { finishSession(p, eng, d); });
  eng.on('abort',function(){C.FitnessAudio.music.stop();});
  eng.start(p, { countdown: S.countdown !== false });
  /* wire buttons */
  wrap.querySelectorAll('[data-act]').forEach(function (b) {
    b.onclick = function () {
      var a = b.getAttribute('data-act');
      if (a === 'pause') eng.toggle();
      if (a === 'next') eng.next();
      if (a === 'prev') eng.prev();
      if (a === 'music') { UI.returnTo = { s: 'active' }; pauseKeep(eng); show('music'); }
      if (a === 'mute') { var st = C.FitnessStore.settings(); st.musicEnabled = !st.musicEnabled; C.FitnessStore.saveSettings(st); C.FitnessAudio.music.sync(!eng.paused); b.textContent = st.musicEnabled ? '🔊' : '🔇'; C.toast(st.musicEnabled ? t('unmuted') : t('muted')); }
      if (a === 'exit') askExit(function(){show('home');});
    };
  });
}
function pauseKeep(eng) { try { if (eng && !eng.paused && eng.phase !== 'done') eng.pause(); } catch (e) {} }
function renderActive(wrap) {
  var p = UI.activeProg;
  wrap.appendChild(el('h1', '', L(p.name) + '  ·  ' + t('sportsHome')));
  var cols = el('div', 'fit-cols');
  var left = el('div', 'fit-panel'); left.appendChild(el('div', '', '')); left.firstChild.setAttribute('data-phase', '1'); left.firstChild.style.cssText = 'font-size:22px;color:var(--cinema-glow)';
  var exd = el('div', ''); exd.setAttribute('data-ex', '1'); left.appendChild(exd);
  left.appendChild(el('p', '', '')); left.lastChild.setAttribute('data-sub', '1'); left.lastChild.style.opacity = '.8';
  var nx = el('p', 'fit-toast-note', ''); nx.setAttribute('data-next', '1'); left.appendChild(nx);
  var right = el('div', 'fit-panel');
  var ringW = el('div', 'fit-timer-ring');
  ringW.innerHTML = '<svg viewBox="0 0 220 220"><defs><linearGradient id="fit-ring-gradient"><stop stop-color="#27caff"/><stop offset="1" stop-color="#944dff"/></linearGradient></defs><circle cx="110" cy="110" r="100" fill="none" stroke="#ffffff22" stroke-width="12"/><circle data-ring="1" cx="110" cy="110" r="100" fill="none" stroke="url(#fit-ring-gradient)" stroke-width="12" stroke-linecap="round" stroke-dasharray="628" stroke-dashoffset="0"/></svg>';
  var num = el('div', 'fit-timer-num'); num.innerHTML = '<strong data-num="1">00:00</strong><span data-prog="1"></span><span data-round="1"></span>';
  ringW.appendChild(num); right.appendChild(ringW);
  var ctl = el('div', 'fit-ctls');
  [['prev', '⏮ ' + t('prev')], ['pause', '⏸ ' + t('pause')], ['next', t('next') + ' ⏭'], ['music', '🎵'], ['mute', '🔊'], ['exit', '✕ ' + t('exit')]].forEach(function (x, i) {
    var b = el('button', 'fit-ctl' + (i === 1 ? ' main' : ''), x[1]); b.setAttribute('data-act', x[0]);
    if (i === 1) {b.setAttribute('data-pause', '1');b.setAttribute('data-autofocus','1');}
    ctl.appendChild(b);
  });
  right.appendChild(ctl); cols.appendChild(left); cols.appendChild(right); wrap.appendChild(cols);
}

/* ---------- finish + SCREEN 6 ---------- */
function finishSession(p, eng, d) {
  C.FitnessAudio.music.stop();
  C.FitnessAudio.beep.done();
  var activeSecs = Math.round(eng.stats.activeMs / 1000);
  var wgt = 0; try { wgt = Number(C.FitnessStore.settings().weightKg) || 0; } catch (e) {}
  var cal = C.FitnessCalories(d.avgMet || 6, activeSecs, wgt);
  var sess = { id: 's' + Date.now(), programId: p.id, programName: L(p.name), completedAt: Date.now(),
    activeSecs: activeSecs, exercisesDone: eng.stats.completedCount, exercisesTotal: eng.queue.length,
    rounds: eng.rounds || p.rounds || 1, kcal: Math.round(cal.kcal), assumedKg: cal.assumed ? 70 : 0, skipped: eng.stats.skipped || 0 };
  C.FitnessStore.addSession(sess);
  try { C.FitnessAudio.speak(t('greatJob'), C.FitnessI18n.lang()); } catch (e) {}
  UI.lastSession = sess; show('complete', {});
}
function saveIncomplete(p, eng) {
  try {
    C.FitnessStore.addSession({ id: 's' + Date.now(), programId: p.id, programName: L(p.name), completedAt: Date.now(), activeSecs: Math.round(eng.stats.activeMs / 1000), exercisesDone: eng.stats.completedCount, exercisesTotal: eng.queue.length, rounds: eng.round || 1, kcal: 0, incomplete: true, skipped: eng.stats.skipped || 0 });
  } catch (e) {}
}
function renderComplete(wrap) {
  var s = UI.lastSession || { programName: '', activeSecs: 0, exercisesDone: 0, exercisesTotal: 0, rounds: 1, kcal: 0 };
  wrap.appendChild(el('div', 'fit-count', '🏆'));
  var h = el('h1', '', t('greatJob')); h.style.textAlign = 'center'; wrap.appendChild(h);
  var p = el('p', '', t('completedMsg') + ': ' + (s.programName || '')); p.style.textAlign = 'center'; wrap.appendChild(p);
  var k = el('div', 'fit-kpi');
  [[fmt(s.activeSecs), t('totalTime')], [(s.exercisesDone + '/' + s.exercisesTotal), t('exercises')], [(s.kcal + ''), t('calories') + ' ' + t('est')], [(s.rounds + ''), t('rounds')]].forEach(function (x) {
    var d = el('div', ''); d.appendChild(el('strong', '', String(x[0]))); d.appendChild(el('span', '', x[1])); k.appendChild(d);
  });
  wrap.appendChild(k);
  if (s.assumedKg) { var n = el('p', 'fit-toast-note', '⚠️ ' + t('assumed')); n.style.textAlign = 'center'; wrap.appendChild(n); }
  var ctl = el('div', 'fit-ctls');
  ctl.appendChild(btn(t('playAgain'), 'fit-ctl main', function () { if (UI.activeProg) startProgram(UI.activeProg); else show('home'); }));
  ctl.appendChild(btn(t('chooseAnother'), 'fit-ctl', function () { show('programs'); }));
  ctl.appendChild(btn(t('viewProgress'), 'fit-ctl', function () { show('progress'); }));
  ctl.appendChild(btn(t('home'), 'fit-ctl', function () { C.showView('home'); }));
  wrap.appendChild(ctl);
}

/* ---------- SCREEN 5: MUSIC ---------- */
function renderMusic(wrap) {
  crumb(wrap, t('music'));
  var st = C.FitnessStore.settings();
  var panel = el('div', 'fit-panel');
  C.FitnessAudio.PACKS.forEach(function (pk) {
    var row = el('div', 'fit-setrow');
    var nm = C.FitnessAudio.packTitle(pk.id, C.FitnessI18n.lang()) + (pk.status === 'unavailable' ? ' · ⚠️' : pk.status === 'built-in' ? ' · ✓' : '');
    var b = btn((st.musicPack === pk.id ? '◉ ' : '○ ') + nm, 'fit-ctl', function () {
      if (pk.status === 'unavailable') { C.toast(t('unavailable')); return; }
      C.FitnessAudio.music.select(pk.id); show('music');var selected=root().querySelector('[data-music-pack="'+pk.id+'"]');if(selected)C.Focus.focus(selected);
    });
    b.setAttribute('data-music-pack',pk.id);b.style.minWidth = '320px'; b.style.textAlign = 'start'; row.appendChild(b);if(pk.status!=='off'){var listen=btn(t('listen'),'fit-ctl',function(){C.FitnessAudio.music.preview(pk.id);});listen.setAttribute('data-music-preview',pk.id);row.appendChild(listen);}panel.appendChild(row);
  });
  panel.appendChild(el('p','fit-toast-note',t('musicOnline')));var status=el('p','fit-toast-note',C.FitnessAudio.music.statusText());status.setAttribute('data-fit-music-status','');status.setAttribute('role','status');panel.appendChild(status);
  var ctl = el('div', 'fit-ctls'); ctl.style.justifyContent = 'flex-start';
  ctl.appendChild(btn(t('back'), 'fit-ctl main', function () {
    if (UI.returnTo && UI.returnTo.s === 'active' && UI.engine && UI.activeProg) { show('active', {}); bootActiveResume(); }
    else if (UI.returnTo && UI.returnTo.s) show(UI.returnTo.s, UI.returnTo.p || {});
    else show('home');
  }));
  panel.appendChild(ctl); wrap.appendChild(panel);
}
function bootActiveResume(){var b=root().querySelector('[data-pause]');if(b)C.Focus.focus(b);}

/* ---------- SCREEN 7: PROGRESS ---------- */
function renderProgress(wrap) {
  crumb(wrap, t('myProgress'), t('progressSub'));
  var row = el('div', 'fit-chiprow');
  [['week', t('thisWeek')], ['month', t('thisMonth')], ['all', t('allTime')]].forEach(function (x) {
    row.appendChild(btn(x[1], 'fit-chip' + (UI.progressRange === x[0] ? ' on' : ''), function () { UI.progressRange = x[0]; show('progress'); }));
  });
  wrap.appendChild(row);
  var st = C.FitnessStore.stats(UI.progressRange === 'all' ? null : UI.progressRange);
  var k = el('div', 'fit-kpi');
  [[st.workouts, t('workouts')], [st.minutes, t('minutes')], [st.kcal, t('calories')], [C.FitnessStore.streak(), t('streak')]].forEach(function (x) {
    var d = el('div', ''); d.appendChild(el('strong', '', String(x[0]))); d.appendChild(el('span', '', x[1])); k.appendChild(d);
  });
  wrap.appendChild(k);
  var panel = el('div', 'fit-panel');
  panel.appendChild(el('h2', '', t('weekly')));
  var bars = el('div', 'fit-bars');
  var names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var max = 1; for (var i = 0; i < 7; i++) max = Math.max(max, (st.days[(i + 1) % 7] || 0));
  for (var j = 0; j < 7; j++) {
    var v = st.days[(j + 1) % 7] || 0;
    var bcol = el('div', ''); bcol.style.height = Math.round((v / max) * 130 + 8) + 'px'; bcol.title = names[j] + ': ' + v; bars.appendChild(bcol);
  }
  panel.appendChild(bars); wrap.appendChild(panel);
  var hist = C.FitnessStore.history().slice(0, 8);
  if (!hist.length) {
    var emp = el('div', 'fit-panel'); emp.appendChild(el('p', '', t('empty')));
    emp.appendChild(btn(t('startFirst'), 'fit-ctl main', function () { quickStart(); }));
    wrap.appendChild(emp);
  } else {
    wrap.appendChild(el('h2', 'fit-row-title', t('recent')));
    hist.forEach(function (h) {
      var r2 = el('div', 'fit-setrow');
      r2.appendChild(el('span', '', (h.incomplete ? '○ ' : '✓ ') + (h.programName || '') + ' · ' + fmt(h.activeSecs || 0) + ' · ' + new Date(h.completedAt).toLocaleDateString()));
      wrap.appendChild(r2);
    });
    wrap.appendChild(btn(t('clearHistory'), 'fit-ctl', function () {
      if (!confirm(t('confirmClear'))) return;
      C.FitnessStore.clearHistory(); show('progress');
    }));
  }
}

/* ---------- SCREEN 8: SETTINGS ---------- */
function renderSettings(wrap) {
  crumb(wrap, t('settings'));
  setS(C.FitnessStore.settings());
  var panel = el('div', 'fit-panel');
  function togRow(label, key) {
    var r = el('div', 'fit-setrow');
    r.appendChild(el('span', 'lab', label));
    var b = btn(S[key] ? '● '+t('on') : '○ '+t('off'), 'fit-ctl', function () { S[key] = !S[key]; C.FitnessStore.saveSettings(S); C.FitnessAudio.music.sync(false); show('settings'); });
    r.appendChild(b); panel.appendChild(r);
  }
  togRow(t('musicEnabled'), 'musicEnabled'); togRow(t('voice'), 'voice'); togRow(t('beeps'), 'beeps');
  togRow(t('starting'), 'countdown'); togRow(t('autoNext'), 'autoNext');
  /* rest */
  var rr = el('div', 'fit-setrow'); rr.appendChild(el('span', 'lab', t('restSecs') + ': ' + S.restSecs + 's'));
  [[-5, '−5'], [5, '+5']].forEach(function (x) {
    rr.appendChild(btn(x[1], 'fit-ctl', function () { S.restSecs = Math.max(5, Math.min(120, S.restSecs + x[0])); C.FitnessStore.saveSettings(S); C.FitnessAudio.music.sync(false); show('settings'); }));
  });
  panel.appendChild(rr);
  /* volume */
  var vr = el('div', 'fit-setrow'); vr.appendChild(el('span', 'lab', t('musicVolume') + ': ' + S.musicVolume));
  [[-10, '−'], [10, '+']].forEach(function (x) {
    vr.appendChild(btn(x[1], 'fit-ctl', function () { S.musicVolume = Math.max(0, Math.min(100, S.musicVolume + x[0])); C.FitnessStore.saveSettings(S); C.FitnessAudio.music.sync(false); show('settings'); }));
  });
  panel.appendChild(vr);
  /* difficulty */
  var dr = el('div', 'fit-setrow'); dr.appendChild(el('span', 'lab', t('difficulty')));
  [['all', t('all')], ['beginner', t('beginner')], ['intermediate', t('intermediate')], ['advanced', t('advanced')]].forEach(function (x) {
    dr.appendChild(btn(x[1], 'fit-chip' + (S.difficulty === x[0] ? ' on' : ''), function () { S.difficulty = x[0]; C.FitnessStore.saveSettings(S); C.FitnessAudio.music.sync(false); show('settings'); }));
  });
  panel.appendChild(dr);
  /* weight */
  var wr = el('div', 'fit-setrow'); wr.appendChild(el('span', 'lab', t('weight') + ': ' + (S.weightKg || '—')));
  [[-5, '−5'], [5, '+5']].forEach(function (x) {
    wr.appendChild(btn(x[1], 'fit-ctl', function () { S.weightKg = Math.max(0, Math.min(250, (Number(S.weightKg) || 0) + x[0])); C.FitnessStore.saveSettings(S); C.FitnessAudio.music.sync(false); show('settings'); }));
  });
  panel.appendChild(wr);
  panel.appendChild(el('p', 'fit-toast-note', t('safety')));
  /* contact */
  var cp = el('div', 'fit-setrow');
  var mail = el('a', '', 'support@morph-tv.com'); mail.href = 'mailto:support@morph-tv.com'; mail.dir = 'ltr';
  mail.style.cssText = 'font-size:20px;font-weight:bold';
  cp.appendChild(el('span', 'lab', t('contactUs') + ': ')); cp.appendChild(mail); panel.appendChild(cp);
  panel.appendChild(el('p', 'fit-toast-note', t('contactMsg')));
  wrap.appendChild(panel);
}

/* ---------- MorphTV view and sidebar integration ---------- */
function askExit(done){if(document.getElementById('fit-exit-dialog'))return;var wasPaused=UI.engine&&UI.engine.paused;pauseKeep(UI.engine);var layer=el('div','fit-dialog');layer.id='fit-exit-dialog';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');var panel=el('div','fit-panel');panel.appendChild(el('h2','',t('confirmExit')));var cancel=btn(t('resume'),'fit-ctl main',function(){layer.parentNode.removeChild(layer);C.Focus.setScope(null);if(UI.engine&&!wasPaused)UI.engine.resume();var target=root().querySelector('[data-pause]');if(target)C.Focus.focus(target);});var exit=btn(t('exit'),'fit-ctl',function(){layer.parentNode.removeChild(layer);C.Focus.setScope(null);if(running()){UI.engine.abort();saveIncomplete(UI.activeProg,UI.engine);}done();});panel.appendChild(cancel);panel.appendChild(exit);layer.appendChild(panel);root().appendChild(layer);C.Focus.setScope(layer);C.Focus.focus(cancel);UI.dismissExit=function(){cancel.click();};}
function running(){return UI.engine&&UI.engine.phase!=='done'&&UI.engine.state!=='IDLE';}
UI.leave=function(){
  if(running()){
    askExit(function(){C.showView('home');});return false;
  }
  C.FitnessAudio.music.stop();UI.engine=null;UI.activeWrap=null;
  try{if(w.speechSynthesis)w.speechSynthesis.cancel();}catch(e){}
  return true;
};
UI.open=function(source){
  if(!w.MorphPlus||!w.MorphPlus.isActive()){if(w.MorphPlus)w.MorphPlus.open();return;}
  UI.returnFocus=source&&source.id==='home-fitness'?source:document.getElementById('home-fitness');
  root().style.height=Math.max(300,Math.min(850,document.querySelector('main').clientHeight-root().offsetTop-60))+'px';
  show('home');
};
UI.back=function(){
  if(document.getElementById('fit-exit-dialog')){UI.dismissExit();return;}
  if(UI.screen==='music'&&UI.activeWrap){show('active');bootActiveResume();return;}
  if(running()){
    var target=UI.returnFocus;C.showView('home');if(root().hidden&&target)C.Focus.focus(target);return;
  }
  if(UI.screen!=='home'){show('home');return;}
  var target=UI.returnFocus;C.showView('home');if(target)C.Focus.focus(target);
};
function placeFitnessSidebar(){var sidebar=document.getElementById('home-fitness'),tools=document.querySelector('#view-home .home-tools');if(!sidebar||!tools)return;var old=document.getElementById('nav-fitness');if(old)old.remove();if(C.settings.fitnessSidebarOnly!==true){C.settings.fitnessSidebarOnly=true;C.settings.showFitnessApp=true;C.saveSettings();}sidebar.hidden=C.settings.showFitnessApp!==true;var prayer=document.getElementById('open-prayer'),before=prayer&&prayer.parentNode===tools?prayer:tools.firstChild;if(before!==sidebar&&sidebar.nextElementSibling!==before)tools.insertBefore(sidebar,before);if(C.Focus&&C.Focus.invalidate)C.Focus.invalidate();if(C.refreshRecentSection)C.refreshRecentSection();}
function mount(){
  setS(C.FitnessStore.settings());
  if(!root()){
    var sec=document.createElement('section');sec.className='view';sec.id='view-fitness';sec.hidden=true;
    sec.setAttribute('data-scroll','vertical');sec.setAttribute('data-no-translate','');
    var main=document.querySelector('main'),footer=main.querySelector('footer');
    main.insertBefore(sec,footer&&footer.parentNode===main?footer:null);
  }
  var nav=document.getElementById('nav-fitness');if(nav)nav.remove();
  var sidebar=document.getElementById('home-fitness');
  if(!sidebar){sidebar=C.el('button','tool');sidebar.id='home-fitness';sidebar.setAttribute('data-no-translate','');var tools=document.querySelector('#view-home .home-tools');tools.insertBefore(sidebar,tools.firstChild);}
  sidebar.hidden=C.settings.showFitnessApp!==true;sidebar.onclick=function(){C.showView('fitness',sidebar);};
  w.addEventListener('morphPlus',labels);function labels(){sidebar.textContent=t('fitness');var suffix=w.MorphPlus&&w.MorphPlus.isActive()?'':' · Plus';sidebar.setAttribute('aria-label',t('fitness')+suffix);sidebar.title=t('fitness')+suffix;root().setAttribute('aria-label',t('sportsHome'));}
  placeFitnessSidebar();setTimeout(placeFitnessSidebar,0);labels();w.addEventListener('morphLanguage',function(){labels();if(!root().hidden&&UI.screen!=='active')show(UI.screen,UI.params);});
  w.addEventListener('morphAudioExclusive',function(){if(running())pauseKeep(UI.engine);});
  document.addEventListener('visibilitychange',function(){if(document.hidden){C.FitnessAudio.music.pause();if(running())pauseKeep(UI.engine);}});
}
w.addEventListener('morphFitnessMusic',function(){var label=document.querySelector('[data-fit-music-status]');if(label)label.textContent=C.FitnessAudio.music.statusText();var snap=C.FitnessAudio.music.snapshot();document.querySelectorAll('[data-music-preview]').forEach(function(b){var playing=snap.mode==='preview'&&snap.track===b.getAttribute('data-music-preview')&&!snap.paused;b.textContent=t(playing?'stopPreview':'listen');b.setAttribute('aria-pressed',String(playing));});});
C.FitnessUI = UI;
w.addEventListener('load', mount);
w.addEventListener('morphViewer', function () { setS(C.FitnessStore.settings());placeFitnessSidebar(); });
})(window);
