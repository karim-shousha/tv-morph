(function (w) {
'use strict';
var C = w.ClearTV = w.ClearTV || {};
/* Persistent fitness storage on top of ClearTV.read/write (localStorage). Versioned + migration-safe. */
var SKEY = 'fitness.settings.v1', CKEY = 'fitness.custom.v1', HKEY = 'fitness.history.v1';
function defSettings() {
  return { musicPack: 'motivation', musicEnabled: true, musicVolume: 80,
    voice: true, beeps: true, countdown: true, autoNext: true,
    restSecs: 20, difficulty: 'all', weightKg: 0, showCalories: true };
}
function load(key, fb) { try { var v = C.read ? C.read(key, null) : null; if (v === null || v === undefined) return fb; return v; } catch (e) { return fb; } }
function save(key, v) { try { if (C.write) C.write(key, v); else localStorage.setItem('cleartv.' + key, JSON.stringify(v)); } catch (e) {} }
var Store = {
  settings: function () { var s = load(SKEY, null); if (!s || typeof s !== 'object') s = defSettings(); Object.keys(defSettings()).forEach(function (k) { if (typeof s[k] === 'undefined') s[k] = defSettings()[k]; }); return s; },
  saveSettings: function (s) { save(SKEY, s); },
  custom: function () { var c = load(CKEY, []); return Array.isArray(c) ? c : []; },
  saveCustom: function (list) { save(CKEY, list); },
  history: function () { var h = load(HKEY, []); return Array.isArray(h) ? h : []; },
  addSession: function (s) { var h = Store.history(); h.unshift(s); h = h.slice(0, 200); save(HKEY, h); return h; },
  clearHistory: function () { save(HKEY, []); },
  stats: function (range) {
    var h = Store.history(), now = Date.now(), out = { workouts: 0, minutes: 0, kcal: 0, days: {}, sessions: [] };
    h.forEach(function (s) {
      if (!s || !s.completedAt) return;
      if (range === 'week' && now - s.completedAt > 7 * 864e5) return;
      if (range === 'month' && now - s.completedAt > 30 * 864e5) return;
      out.workouts++; out.minutes += Math.round((s.activeSecs || 0) / 60); out.kcal += Math.round(s.kcal || 0);
      var d = new Date(s.completedAt); out.days[d.getDay()] = (out.days[d.getDay()] || 0) + 1; out.sessions.push(s);
    });
    out.activeDays = Object.keys(out.days).length; out.streak = Store.streak(h); return out;
  },
  streak: function (h) {
    h = h || Store.history(); if (!h.length) return 0;
    var days = {}; h.forEach(function (s) { if (s.completedAt) days[new Date(s.completedAt).toDateString()] = 1; });
    var n = 0, d = new Date(); if (!days[d.toDateString()]) d = new Date(Date.now() - 864e5);
    while (days[d.toDateString()]) { n++; d = new Date(d.getTime() - 864e5); } return n;
  }
};
C.FitnessStore = Store;
/* MET-based calorie estimate: kcal = MET * weightKg * hours. Falls back honestly when weight unknown. */
C.FitnessCalories = function (avgMet, activeSecs, weightKg) {
  if (!activeSecs || activeSecs <= 0) return { kcal: 0, assumed: false };
  if (weightKg && weightKg > 0) return { kcal: avgMet * weightKg * (activeSecs / 3600), assumed: false };
  return { kcal: avgMet * 70 * (activeSecs / 3600), assumed: true, assumedKg: 70 };
};
})(window);
