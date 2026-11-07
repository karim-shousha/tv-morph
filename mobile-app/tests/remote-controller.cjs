const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function review(platform) {
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {
      value: '', textContent: '', disabled: false, hidden: false,
      querySelector: child => element(selector + ' ' + child)
    });
    return elements.get(selector);
  };
  const key = (name, flags = []) => ({
    dataset: {remoteKey: name}, hasAttribute: name => flags.includes(name)
  });
  const keys = [key('ENTER'), key('UP'), key('VOLUP', ['data-volume']),
    key('PLAY', ['data-playback']), key('HOME', ['data-native-only'])];
  const calls = [];
  let rejectNext = false;
  let timer;
  const window = {};
  const sandbox = {
    window, document: {
      querySelector: selector => selector === '[data-remote-key=ENTER]' ? keys[0] : element(selector),
      querySelectorAll: () => keys
    },
    setTimeout: callback => (timer = callback, 1),
    clearTimeout: () => {timer = null;}
  };
  vm.runInNewContext(fs.readFileSync('mobile-app/assets/ui/remote-controller.js', 'utf8'), sandbox);
  let reconnects = 0;
  const controller = window.MorphRemoteController.create({
    platform: () => platform,
    operation: (_, run) => run(),
    needsReconnect: () => {reconnects++; controller.disconnect();},
    call: async (action, payload) => {
      calls.push({action, payload});
      if (rejectNext) {rejectNext = false; throw new Error('Connection lost');}
      return {ready: true, native: platform === 'samsung', scope: 'fixture'};
    }
  });
  assert(keys.every(key => key.disabled), 'Disconnected keys must be disabled');
  assert(await window.connectMorphKeyboard());
  assert.equal(keys[1].disabled, false);
  assert.equal(keys[2].disabled, platform === 'lg');
  assert.equal(keys[4].disabled, platform !== 'samsung');
  await keys[1].onclick();
  assert.equal(calls.at(-1).payload.key, 'UP');
  element('#remote-text').value = 'Search text';
  await element('#remote-send').onclick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.at(-1).action, 'remoteText');
  keys[0].onpointerdown();
  if (platform === 'android') {
    assert(timer, 'Android long press must be available');
    timer();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls.at(-1).payload.key, 'FAVORITE');
    const count = calls.length;
    await keys[0].onclick();
    assert.equal(calls.length, count, 'Long press must not send an extra ENTER');
  }
  rejectNext = true;
  await keys[1].onclick();
  assert.equal(reconnects, 1);
  assert(keys.every(key => key.disabled), 'Failed command must disable disconnected keys');
  assert(await window.connectMorphKeyboard(), 'Reconnection must remain possible');
  window.resetMorphRemote();
  assert(keys.every(key => key.disabled));
  console.log('PASS remote controller', platform);
}
(async () => {
  for (const platform of ['android', 'samsung', 'lg']) await review(platform);
})().catch(error => {console.error(error); process.exitCode = 1;});
