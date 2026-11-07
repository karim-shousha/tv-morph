/* ES5 pointer physics: 3 source pixels per tap; time-based motion on hold. */
(function (root, factory) {
  var Motion = factory();
  if (typeof module === 'object' && module.exports) module.exports = Motion;
  else root.AppBridgePointerMotion = Motion;
}(this, function () {
  'use strict';
  function distance(ageMs) {
    var t = Math.max(0, (ageMs - 120) / 1000), ramp = 0.9;
    if (t <= ramp) return 100 * t + 700 * t * t * t / (3 * ramp * ramp);
    return 100 * ramp + 700 * ramp / 3 + 800 * (t - ramp);
  }
  function Motion(x, y) { this.x = x; this.y = y; this.keys = {}; this.lastTick = 0; }
  Motion.prototype.setPosition = function (x, y) { this.x = x; this.y = y; this.stop(); };
  Motion.prototype.stop = function () { this.keys = {}; this.lastTick = 0; };
  Motion.prototype.active = function () { for (var key in this.keys) return true; return false; };
  Motion.prototype.advance = function (now, width, height) {
    var dx = 0, dy = 0;
    for (var key in this.keys) {
      var held = this.keys[key], end = Math.min(now, held.seen + 1200);
      var start = Math.max(this.lastTick, held.start);
      var delta = Math.max(0, distance(end - held.start) - distance(start - held.start));
      if (key === '37') dx -= delta;
      if (key === '39') dx += delta;
      if (key === '38') dy -= delta;
      if (key === '40') dy += delta;
      if (now > held.seen + 1200) delete this.keys[key];
    }
    if (dx && dy) { dx /= Math.sqrt(2); dy /= Math.sqrt(2); }
    this.x = Math.max(0, Math.min(1, this.x + dx / width));
    this.y = Math.max(0, Math.min(1, this.y + dy / height));
    this.lastTick = now;
  };
  Motion.prototype.press = function (key, now, width, height) {
    this.advance(now, width, height);
    if (this.keys[key]) { this.keys[key].seen = now; return; }
    this.keys[key] = { start: now, seen: now };
    if (key === 37) this.x -= 3 / width;
    if (key === 39) this.x += 3 / width;
    if (key === 38) this.y -= 3 / height;
    if (key === 40) this.y += 3 / height;
    this.x = Math.max(0, Math.min(1, this.x));
    this.y = Math.max(0, Math.min(1, this.y));
  };
  Motion.prototype.release = function (key, now, width, height) {
    this.advance(now, width, height); delete this.keys[key];
  };
  return Motion;
}));
