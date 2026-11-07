const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const shared = fs.readFileSync(path.join(root, 'mobile-app/samsung-media.js'), 'utf8');
const listener = shared.split('\n').find(line => line.includes("document.addEventListener('visibilitychange'"));
const lg = fs.readFileSync(path.join(root, 'webos-app/player.js'), 'utf8');
const lifecycle = lg.slice(0, lg.indexOf('/* ===== MORPH PLAYER'));

function fixture(platform = 'lg', paused = false, legacy = false) {
  const events = {}, calls = {pause: 0, play: 0, save: 0, exit: 0, home: 0, seek: 0};
  const overlay = {_pauseSeek() { calls.seek++; }};
  const document = {getElementById() { return overlay; }, addEventListener(type, fn) { events[type] = fn; }};
  document[legacy ? 'webkitHidden' : 'hidden'] = false;
  const player = {getState() { return paused ? 'PAUSED' : 'PLAYING'; }, pause() { calls.pause++; paused = true; }, play() { calls.play++; paused = false; return Promise.resolve(); }};
  const frame = {id: 'same-library-frame'};
  const context = vm.createContext({document, player, frame, frameKind: 'iptv',
    C: {showView() { calls.home++; }}, savePosition() { calls.save++; },
    exit() { calls.exit++; context.player = null; context.frame = null; }});
  vm.runInContext((platform === 'lg' ? lifecycle : '') + '\n' + listener, context);
  return {context, calls, player, frame, emit(type) { events[type](); },
    hidden(value) { document[legacy ? 'webkitHidden' : 'hidden'] = value; events[legacy ? 'webkitvisibilitychange' : 'visibilitychange'](); }};
}

const active = fixture();
active.hidden(true);
assert.equal(active.context.frame, active.frame, 'HDMI retains the IPTV screen');
assert.equal(active.context.player, active.player, 'HDMI retains the playback session');
assert.equal(active.calls.pause, 1);
assert.equal(active.calls.save, 1);
active.hidden(true);
assert.equal(active.calls.pause, 1, 'duplicate hide must preserve the original playing state');
active.emit('webOSRelaunch');
assert.equal(active.calls.play, 0, 'relaunch before foreground must not start background sound');
active.hidden(false);
active.emit('webOSRelaunch');
assert.equal(active.calls.play, 1, 'visible/relaunch events must resume once');
assert.equal(active.calls.exit, 0);
assert.equal(active.calls.home, 0);

const paused = fixture('lg', true);
paused.hidden(true); paused.hidden(false);
assert.equal(paused.calls.play, 0, 'user-paused media stays paused');
const stopped = fixture();
stopped.hidden(true); stopped.context.player = null; stopped.context.frame = null; stopped.hidden(false);
assert.equal(stopped.calls.play, 0, 'explicit exit must not resurrect playback');
const replaced = fixture();
replaced.hidden(true); replaced.context.player = {}; replaced.hidden(false);
assert.equal(replaced.calls.play, 0, 'old session must not resume over new content');
const library = fixture();
library.context.player = null; library.hidden(true); library.hidden(false);
assert.equal(library.context.frame, library.frame, 'browsing IPTV also survives HDMI');
const prayer = fixture();
prayer.context.C.Prayer = {allowLaunch() { return false; }};
prayer.hidden(true); prayer.hidden(false);
assert.equal(prayer.calls.play, 0, 'prayer restrictions still apply on return');
const legacy = fixture('lg', false, true);
legacy.hidden(true); legacy.hidden(false);
assert.equal(legacy.calls.play, 1, 'older webKit visibility events are supported');
const radio = fixture();
radio.context.frameKind = 'radio'; radio.hidden(true);
assert.equal(radio.calls.exit, 1, 'radio retains its background-stop behavior');
const samsung = fixture('samsung');
samsung.hidden(true);
assert.equal(samsung.calls.exit, 1, 'Samsung retains its existing native-player lifecycle');
assert.equal(samsung.calls.home, 1);
console.log('PASS LG HDMI suspension, exact-session resume, paused/closed/replaced sessions, library, prayer, legacy visibility, radio and Samsung behavior');
