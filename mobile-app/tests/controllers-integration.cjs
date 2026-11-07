const {chromium} = require('../../pc-app/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

(async () => {
  const root = path.resolve('mobile-app/assets/ui');
  const server = http.createServer((req, res) => {
    const target = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!target.startsWith(root + path.sep)) {res.writeHead(403).end(); return;}
    try {
      res.setHeader('Content-Type', ({'.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css'})[path.extname(target)] || 'application/octet-stream');
      const staged = path.resolve('mobile-app/build/assets/ui', path.relative(root, target));
      res.end(fs.readFileSync(fs.existsSync(target) ? target : staged));
    } catch {res.writeHead(404).end();}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  try {
    for (const platform of ['android', 'samsung', 'lg']) {
      const page = await browser.newPage({viewport: {width: 390, height: 844}});
      const errors = [];
      page.on('pageerror', error => errors.push(error.stack));
      await page.route(/^https?:/, route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort());
      await page.addInitScript(platform => {
        localStorage.setItem('tvmorph.onboarded30', '1');
        localStorage.setItem('morph.first-run.pearl.v1', '1');
        localStorage.setItem('morph.welcome-support.v1', '1');
        window.requests = [];
        window.ClearNative = {
          request(id, action, data) {
            requests.push({action, payload: JSON.parse(data)});
            const result = action === 'info' ? {brand: platform, tvIp: '192.0.2.1', phoneIp: '192.0.2.2', draft: {}}
              : action === 'connectionStatus' ? {ready: true, selected: true}
              : action === 'remoteConnect' ? {ready: true, native: platform === 'samsung', scope: platform}
              : {};
            setTimeout(() => nativeResult(id, true, result), 0);
          }
        };
      }, platform);
      await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
      await page.waitForFunction(platform => window.MorphNative?.platform() === platform, platform);
      for (const width of [320, 390, 600]) for (const language of ['ar', 'en', 'fr']) {
        await page.setViewportSize({width, height: 900});
        await page.evaluate(language => {MorphLocale.set(language);Morph30.show('home');}, language);
        assert(await page.locator('#phone-home-shortcuts').isVisible());
        assert.equal(await page.locator('.bottom-nav [data-page=design]').count(), 0);
        assert.deepEqual(await page.locator('.bottom-nav button').evaluateAll(nodes => nodes.filter(n=>!n.hidden).map(n=>n.id==='phone-bridge-open'?'bridge':n.dataset.page)), ['play','control','home','bridge','worship']);
        assert(await page.locator('#phone-home-shortcuts').evaluate(node => {const r=node.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height>=44;}));
        assert(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth+1));
      }
      await page.locator('#phone-home-themes').click();
      assert(await page.locator('#page-studio').isVisible());
      await page.evaluate(() => Morph30.show('home'));
      await page.locator('#phone-home-matches').click();
      await page.waitForFunction(() => requests.some(r => r.action === 'matchesOpen'));
      await page.locator('#phone-bridge-open').click();
      await page.waitForFunction(() => requests.some(r => r.action === 'bridgeOpen'));
      assert.equal(await page.locator('#phone-bridge-open svg').count(), 1);
      assert.equal(await page.locator('#phone-bridge-open img').count(), 0);
      assert.deepEqual(await page.locator('#phone-bridge-open svg').evaluate(node=>[getComputedStyle(node).width,getComputedStyle(node).height]),await page.locator('.bottom-nav [data-page=control] svg').evaluate(node=>[getComputedStyle(node).width,getComputedStyle(node).height]));
      assert.equal(await page.evaluate(() => window.connectMorphKeyboard()), true);
      assert.equal(await page.locator('#remote-mode [value=native]').isDisabled(), platform !== 'samsung');
      await page.evaluate(() => {
        document.querySelector('#remote-text').value = 'Search';
        document.querySelector('#remote-send').click();
      });
      await page.waitForFunction(() => requests.some(r => r.action === 'remoteText' && r.payload.text === 'Search'));
      await page.evaluate(() => resetMorphRemote());
      assert(await page.locator('#remote-send').isDisabled());
      await page.evaluate(() => document.querySelector('#integrated-remote-open').click());
      await page.waitForFunction(() => requests.some(r => r.action === 'remoteOpen'));
      assert.deepEqual(errors, []);
      console.log('PASS source phone controller integration', platform);
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
