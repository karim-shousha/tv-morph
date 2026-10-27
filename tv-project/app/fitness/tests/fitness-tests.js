/* MorphTV Fitness tests — run: node tv-project/app/fitness/tests/fitness-tests.js */
(function () {
'use strict';
var path = 'C:/Users/Admin/Documents/Codex/2026-10-22/ui-ux/tv-project/app/fitness/';
global.window = {};
global.document = { hidden: false, documentElement: { lang: 'en' } };
global.performance = global.performance || { now: function () { return Date.now(); } };
var store = {};
global.localStorage = { getItem: function (k) { return k in store ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };
window.localStorage = global.localStorage;
window.ClearTV = {
  read: function (k, f) { try { var v = localStorage.getItem('cleartv.' + k); return v === null ? f : JSON.parse(v); } catch (e) { return f; } },
  write: function (k, v) { try { localStorage.setItem('cleartv.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};
window.MorphLocale = { get: function () { return 'en'; } };
function req(f) { require(path + f); }
req('fitness-data.js'); req('fitness-i18n.js'); req('fitness-store.js'); req('fitness-audio.js'); req('fitness-engine.js');
var C = window.ClearTV, D = C.FitnessData;
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  ok - ' + name); } else { fail++; console.log('  FAIL - ' + name); } }

/* 1-5: library */
ok(D.EXERCISES.length >= 60, 'exercise count >= 60 (' + D.EXERCISES.length + ')');
ok(D.PROGRAMS.length >= 15, 'program count >= 15 (' + D.PROGRAMS.length + ')');
var ids = {}, dup = false; D.EXERCISES.forEach(function (e) { if (ids[e.id]) dup = true; ids[e.id] = 1; });
ok(!dup, 'exercise ids unique');
var needCats = ['full_body', 'upper_body', 'lower_body', 'core', 'cardio', 'hiit', 'strength', 'stretching', 'mobility', 'low_impact', 'warmup', 'recovery'];
ok(needCats.every(function (c) { return D.EXERCISES.some(function (e) { return e.cat === c; }); }), 'all 12 categories covered');
ok(D.EXERCISES.every(function (e) { return e.name && e.name.en && e.id && e.image === 'fitness/exercises/' + e.id; }), 'exercise asset ids stable');
/* programs meaningful */
ok(D.PROGRAMS.every(function (p) { return p.exercises.length >= 5 && p.rounds >= 1 && p.targetMins >= 5; }), 'programs have real sequences');
var fb = D.programById('full_body_starter');
var estMin = D.estimateSecs(fb) / 60;
ok(Math.abs(estMin - fb.targetMins) <= 6, 'program duration estimate sane (~' + estMin.toFixed(1) + ' vs ' + fb.targetMins + ')');
/* i18n: 5 locales chrome */
['en', 'ar', 'fr', 'zh', 'ja'].forEach(function (l) { ok(!!(C.FitnessI18n.all[l] && C.FitnessI18n.all[l].fitness), 'locale ' + l + ' has chrome strings'); });
ok(C.FitnessAudio.PACKS.length === 4, 'music packs listed');
ok(C.FitnessAudio.PACKS.filter(function (p) { return p.status === 'streaming' && /^https:\/\/morphtv.herroshetta.com\/fitness-music\/v1\/Sport[123]\.mp3$/.test(p.url); }).length === 3, 'three original HER sports tracks have real streaming URLs');
/* store */
var s0 = C.FitnessStore.settings(); s0.weightKg = 80; C.FitnessStore.saveSettings(s0);
ok(C.FitnessStore.settings().weightKg === 80, 'settings persist');
C.FitnessStore.saveCustom([{ id: 'c1', name: 'My Mix', exercises: ['bodyweight_squat', 'push_up'], rounds: 2, rest: 20 }]);
ok(C.FitnessStore.custom().length === 1 && C.FitnessStore.custom()[0].exercises.length === 2, 'custom workout persists');
/* calories */
var cal = C.FitnessCalories(8, 600, 80); ok(cal.kcal > 100 && cal.kcal < 120 && !cal.assumed, 'calorie math sane (' + cal.kcal.toFixed(1) + ')');
var cal2 = C.FitnessCalories(8, 600, 0); ok(cal2.assumed && cal2.assumedKg === 70, 'missing weight honest default');
/* manifest */
var man = require(path + 'fitness_assets_manifest.json');
ok(man.total >= 150 && man.assets.length === man.total, 'manifest complete (' + man.total + ')');
ok(man.assets.every(function (a) { return a.id && a.path && a.aspect && a.resolution; }), 'manifest entries have spec');

/* engine: async state machine */
function engineTest(done) {
  var E = new C.FitnessEngine();
  var seen = [];
  E.on('prepare', function () { seen.push('prepare'); });
  E.on('go', function () { seen.push('go'); });
  E.on('exercise', function (d) { seen.push('ex' + d.index); });
  E.on('rest', function () { seen.push('rest'); });
  E.on('tickLow', function () { seen.push('low'); });
  E.on('pause', function () { seen.push('pause'); });
  E.on('resume', function () { seen.push('resume'); });
  E.on('complete', function (d) {
    seen.push('complete');
    ok(seen[0] === 'prepare' && seen.indexOf('go') > 0, 'prepare -> countdown -> GO order');
    ok(d.stats.completedCount === 2, 'completed count correct (' + d.stats.completedCount + ')');
    ok(d.activeSecs >= 0, 'session stats real');
    /* history round-trip */
    C.FitnessStore.addSession({ id: 't1', programId: 'x', programName: 'X', completedAt: Date.now(), activeSecs: 120, exercisesDone: 2, exercisesTotal: 2, rounds: 1, kcal: 20 });
    var st = C.FitnessStore.stats(null);
    ok(st.workouts >= 1 && st.minutes >= 2, 'progress uses real saved data');
    C.FitnessStore.clearHistory();
    ok(C.FitnessStore.history().length === 0, 'clear history works');
    ok(C.FitnessStore.stats(null).workouts === 0, 'empty state honest (no fake history)');
    done();
  });
  var prog = { id: 't', level: 1, targetMins: 1, cat: 'cardio', rounds: 1, exercises: ['march_place', 'step_jack'], rest: 1, name: { en: 'T' }, secs: 1 };
  E.configure({ prepMs: 300 }).start(prog, {});
  setTimeout(function () { E.pause(); ok(E.paused && E.state === 'PAUSED', 'pause freezes state'); }, 500);
  setTimeout(function () { E.resume(); ok(!E.paused, 'resume works'); }, 900);
}
var to = setTimeout(function () { console.log('  FAIL - engine timeout'); fail++; fin(); }, 15000);
engineTest(function () { clearTimeout(to); fin(); });
function fin() {
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}
})();
