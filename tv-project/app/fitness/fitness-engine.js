(function (w) {
'use strict';
var C = w.ClearTV = w.ClearTV || {};
/* Real workout engine: monotonic clock, explicit state machine, pause-safe, no double events. */
function Engine() {
  this.state = 'IDLE'; this.program = null; this.queue = []; this.index = 0;
  this.phase = 'idle'; this.remainingMs = 0; this.totalMs = 0; this.paused = false;
  this._timer = null; this._lastTick = 0; this._events = {};
  this.stats = { startedAt: 0, activeMs: 0, skipped: 0, completedCount: 0, roundsDone: 0 };
  this.prepMs = 5000; this.restMs = 20000; this.exSecs = 0;
}
Engine.prototype.on = function (ev, fn) { (this._events[ev] = this._events[ev] || []).push(fn); return this; };
Engine.prototype.emit = function (ev, data) { var l = this._events[ev] || []; for (var i = 0; i < l.length; i++) { try { l[i](data); } catch (e) {} } };
Engine.prototype._clear = function () { if (this._timer) { clearInterval(this._timer); this._timer = null; } };
Engine.prototype.configure = function (opts) {
  opts = opts || {};
  if (typeof opts.prepMs === 'number') this.prepMs = opts.prepMs;
  if (typeof opts.restMs === 'number') this.restMs = opts.restMs;
  return this;
};
Engine.prototype.start = function (program, opts) {
  opts = opts || {}; this._clear();
  this.program = program; this.rounds = Math.max(1, program.rounds || 1); this.round = 1;
  this.exSecsDefault = opts.secs || program.secs || 0;
  this.queue = program.exercises.map(function (id) {
    var e = C.FitnessData.byId(id); return e ? { ex: e, secs: opts.secs || program.secs || e.secs } : null;
  }).filter(Boolean);
  if (!this.queue.length) { this.emit('error', { msg: 'empty' }); return this; }
  this.index = 0; this.stats = { startedAt: Date.now(), activeMs: 0, skipped: 0, completedCount: 0, roundsDone: 1 };
  this.state = 'PREPARING'; this.paused = false;
  if (opts.countdown === false || this.prepMs <= 0) { this._beginExercise(); }
  else { this.phase = 'prepare'; this.remainingMs = this.prepMs; this.totalMs = this.prepMs; this.emit('prepare', { remaining: 5 }); this._loop(); }
  return this;
};
Engine.prototype._loop = function () {
  var self = this; self._clear(); self._lastTick = performance.now();
  self._timer = setInterval(function () {
    if (self.paused || document.hidden && false) { self._lastTick = performance.now(); return; }
    var now = performance.now(), dt = now - self._lastTick; self._lastTick = now;
    if (self.phase === 'exercise' && !self.paused) self.stats.activeMs += Math.min(dt,Math.max(0,self.remainingMs));
    self.remainingMs -= dt;
    if (self.remainingMs <= 1000 && self.remainingMs + dt > 1000 && (self.phase === 'prepare' || self.phase === 'rest' || self.phase === 'exercise')) {
      var s = Math.ceil(self.remainingMs / 1000); if (s <= 3 && s > 0) self.emit('tickLow', { s: s, phase: self.phase });
    }
    if (self.phase === 'prepare') self.emit('prepareTick', { remainingMs: Math.max(0, self.remainingMs) });
    if (self.phase === 'exercise') self.emit('tick', { remainingMs: Math.max(0, self.remainingMs), index: self.index });
    if (self.phase === 'rest') self.emit('restTick', { remainingMs: Math.max(0, self.remainingMs) });
    if (self.remainingMs <= 0) self._advance();
  }, 100);
};
Engine.prototype._beginExercise = function () {
  var cur = this.queue[this.index]; if (!cur) { this._finish(); return; }
  this.state = 'ACTIVE_EXERCISE'; this.phase = 'exercise';
  this.remainingMs = cur.secs * 1000; this.totalMs = this.remainingMs;
  this.emit('exercise', { index: this.index, total: this.queue.length, ex: cur.ex, secs: cur.secs, round: this.round, rounds: this.rounds });
  this._loop();
};
Engine.prototype._advance = function () {
  if (this.phase === 'prepare') { this.emit('go', {}); this._beginExercise(); return; }
  if (this.phase === 'exercise') {
    if(!this._skipping)this.stats.completedCount++;this._skipping=false;
    var autoNext = true; try { autoNext = C.FitnessStore.settings().autoNext !== false; } catch (e) {}
    var lastInRound = this.index >= this.queue.length - 1;
    if (lastInRound && this.round < this.rounds) { this._startRest(true); return; }
    if (lastInRound && this.round >= this.rounds) { this._finish(); return; }
    this._startRest(false); return;
  }
  if (this.phase === 'rest') {
    if (this._restWasRound) { this.round++; this.stats.roundsDone = this.round; this.index = 0; }
    else { this.index++; }
    this._beginExercise(); return;
  }
};
Engine.prototype._startRest = function (isRound) {
  var s = null; try { s = C.FitnessStore.settings(); } catch (e) {}
  if (s && s.autoNext === false && !isRound) { /* still use short rest but skippable */ }
  this.state = 'REST'; this.phase = 'rest'; this._restWasRound = !!isRound;
  var base = this.program && this.program.rest; this.remainingMs = ((base || (s && s.restSecs) || 20)) * 1000;
  this.totalMs = this.remainingMs;
  this.emit('rest', { next: this._restWasRound ? this.queue[0].ex : (this.queue[this.index + 1] || {}).ex, roundBreak: !!isRound });
  this._loop();
};
Engine.prototype.pause = function () { if (this.phase === 'done'||this.phase==='idle'||this.paused) return; this.paused = true; this.state = 'PAUSED'; this.emit('pause', {}); };
Engine.prototype.resume = function () { if (this.phase === 'done') return; this.paused = false; this.state = this.phase === 'rest' ? 'REST' : 'ACTIVE_EXERCISE'; this._lastTick = performance.now(); this.emit('resume', {}); };
Engine.prototype.toggle = function () { if (this.paused) this.resume(); else this.pause(); };
Engine.prototype.next = function () {
  if (this.phase === 'prepare') { this._beginExercise(); return; }
  if (this.phase === 'exercise') { this.stats.skipped++; this._skipping=true; this.emit('skip', { index: this.index }); this._advance.call(this, true) || null; }
  else if (this.phase === 'rest') { if (this._restWasRound) { this.round++; this.stats.roundsDone = this.round; this.index = 0; } else this.index++; this._beginExercise(); }
};
Engine.prototype.prev = function () {
  if (this.index > 0) { this.index--; this._beginExercise(); }
  else if (this.phase === 'rest') { this._beginExercise(); }
};
Engine.prototype.skipRest = function () { if (this.phase === 'rest') { if (this._restWasRound) { this.round++; this.stats.roundsDone = this.round; this.index = 0; } else this.index++; this._beginExercise(); } };
Engine.prototype._finish = function () {
  if(this.phase==='done')return;this._clear(); this.phase = 'done'; this.state = 'COMPLETED';
  var avg = 0; this.queue.forEach(function (q) { avg += q.ex.met || 5; }); avg = this.queue.length ? avg / this.queue.length : 5;
  this.emit('complete', { stats: this.stats, avgMet: avg, activeSecs: Math.round(this.stats.activeMs / 1000) });
};
Engine.prototype.abort = function () { this._clear(); this.phase = 'done'; this.state = 'INTERRUPTED'; this.emit('abort', { stats: this.stats }); };
Engine.prototype.snapshot = function () { return { state: this.state, phase: this.phase, paused: this.paused, index: this.index, total: this.queue.length, remainingMs: Math.max(0, Math.round(this.remainingMs)), totalMs: this.totalMs, round: this.round, rounds: this.rounds }; };
C.FitnessEngine = Engine;
})(window);
