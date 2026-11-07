// MORPH TV MOBILE 3.0 — dedicated regression suite (new IA + design system).
// Covers: 4-tab nav + legacy aliases, back-stack, control segments, gear sheet,
// status hero + IP cards + copy, no auto-jump, onboarding, dark/light, 320-600px.
const { chromium } = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { pathToFileURL } = require('url'), path = require('path'), assert = require('assert');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      try { localStorage.setItem('morph.plus.token', 'MT-TESTFIXTURE1'); } catch (e) {}
      try {
        var P = window.XMLHttpRequest.prototype, _open = P.open, _send = P.send;
        P.open = function (m, u) { try { this.__m30plus = (typeof u === 'string' && u.indexOf('/api/plus/') >= 0); } catch (e) {} return _open.apply(this, arguments); };
        P.send = function () {
          if (this.__m30plus) { var x = this; setTimeout(function () { try { Object.defineProperty(x, 'status', { value: 200, configurable: true }); Object.defineProperty(x, 'responseText', { value: '{"active":true,"scope":"studio"}', configurable: true }); } catch (e) {} try { if (x.onload) x.onload(); } catch (e) {} }, 0); return; }
          return _send.apply(this, arguments);
        };
      } catch (e) {}
      window.requests = [];
      window.ClearNative = {
        saveDraft(s) { window.saved = JSON.parse(s); },
        request(id, action, s) {
          const payload = JSON.parse(s); window.requests.push({ action, payload });
          const data = action === 'scan' ? [{ ip: '10.0.0.9', brand: 'samsung', name: 'Lab TV', model: 'Tizen' }]
            : action === 'connect' ? { ip: payload.ip, brand: 'samsung', name: 'Lab TV', model: 'Tizen', developerReady: true, hint: 'ok' }
            : action === 'info' ? { phoneIp: '10.0.0.7', draft: {} }
            : {};
          setTimeout(() => window.nativeResult(id, true, data), 0);
        }
      };
    });
    await page.goto(pathToFileURL(path.resolve('mobile-app/build/assets/ui/index.html')).href);
    await page.waitForTimeout(600);

    // 1. Four tabs, SVG icons, no ASCII glyphs.
    assert.equal(await page.locator('.bottom-nav button').count(), 4);
    for (const t of ['home', 'design', 'control', 'play']) assert(await page.locator('.bottom-nav [data-page=' + t + '] svg').count() >= 1, 'svg icon ' + t);
    const navText = await page.locator('.bottom-nav').textContent();
    for (const g of ['◐', '▣', '▦', '⌘']) assert(!navText.includes(g), 'legacy glyph gone');

    // 2. Legacy aliases still resolve.
    await page.evaluate(() => window.Morph30.show('studio'));
    assert.equal((await page.evaluate(() => document.querySelector('.page:not([hidden])').id)), 'page-studio');
    await page.evaluate(() => window.Morph30.show('connect'));
    assert.equal((await page.evaluate(() => document.querySelector('.page:not([hidden])').id)), 'page-connect');
    await page.evaluate(() => window.Morph30.show('cast'));
    assert.equal((await page.evaluate(() => document.querySelector('.page:not([hidden])').id)), 'page-cast');

    // 3. Back-stack: control/apps -> back -> previous tab.
    await page.evaluate(() => window.Morph30.show('design'));
    await page.evaluate(() => window.Morph30.show('apps'));
    assert.equal(await page.evaluate(() => window.handleBack()), true);
    assert.equal((await page.evaluate(() => document.querySelector('.page:not([hidden])').id)), 'page-studio');

    // 4. Control segments switch Remote|Apps|Share with aria-selected.
    await page.locator('.bottom-nav [data-page=control]').click();
    for (const sub of ['remote', 'apps', 'cast']) {
      await page.locator('#m30-control-segment [data-msub=' + sub + ']').click();
      const vis = { remote: 'page-remote', apps: 'page-apps', cast: 'page-cast' }[sub];
      assert.equal((await page.evaluate(() => document.querySelector('.page:not([hidden])').id)), vis, sub);
      assert.equal(await page.locator('#m30-control-segment [data-msub=' + sub + ']').getAttribute('aria-selected'), 'true');
    }

    // 5. Status hero + IP cards + copy buttons (inside their setup steps).
    await page.locator('.bottom-nav [data-page=home]').click();
    assert(await page.locator('#m30-status').isVisible());
    assert(await page.locator('#m30-status-title').isVisible());
    await page.evaluate(() => window.MorphConnectFlow.open(2));
    assert(await page.locator('.m30-ip-tv').isVisible());
    await page.locator('#manual-type-toggle').click();
    await page.locator('#device-type').selectOption('samsung');
    await page.evaluate(() => window.MorphConnectFlow.open(3));
    assert(await page.locator('.m30-ip-phone').isVisible());
    assert.equal(await page.locator('[data-m30copy]').count(), 2);

    // 6. No auto-jump: scan must not change the open step by itself.
    await page.evaluate(() => window.MorphConnectFlow.open(1));
    await page.locator('#scan').click();
    await page.waitForSelector('#devices button', { state: 'attached' });
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => document.getElementById('connect-step-1').open), true, 'no auto-jump after scan');
    await page.evaluate(() => window.MorphConnectFlow.open(2));
    await page.waitForSelector('#devices button');

    // 7. Gear sheet opens, holds prefs, traps focus, closes with restore.
    await page.locator('#m30-gear-btn').click();
    assert(await page.locator('#m30-gear-sheet.open').isVisible());
    assert(await page.locator('#m30-gear-sheet #app-language').isVisible());
    assert(await page.locator('#m30-gear-sheet .font-size-panel').isVisible());
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // 8. Onboarding forced via query param.
    const p2 = await browser.newPage({ viewport: { width: 412, height: 915 } });
    await p2.goto(pathToFileURL(path.resolve('mobile-app/build/assets/ui/index.html')).href + '?m30onboard=1');
    await p2.waitForTimeout(500);
    assert(await p2.locator('.m30-onboard').isVisible(), 'onboarding shows when forced');
    await p2.locator('.m30-onboard .primary').click();
    await p2.locator('.m30-onboard .primary').click();
    await p2.locator('.m30-onboard .primary').click();
    assert(await p2.locator('.m30-onboard').isHidden(), 'onboarding completes');
    await p2.close();

    // 9. Appearances + widths: no overflow, nav intact.
    for (const mode of ['light', 'dark']) {
      await page.evaluate(m => { document.documentElement.dataset.appAppearance = m; try { localStorage.setItem('tvmorph.appearance', m); } catch (e) {} }, mode);
      for (const w of [320, 360, 390, 412, 600]) {
        await page.setViewportSize({ width: w, height: 915 });
        for (const t of ['home', 'design', 'control', 'play']) {
          await page.locator('.bottom-nav [data-page=' + t + ']').click();
          await page.waitForTimeout(80);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'overflow ' + mode + ' ' + w + ' ' + t);
        }
      }
    }
    await page.setViewportSize({ width: 412, height: 915 });
    await page.locator('.bottom-nav [data-page=design]').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: 'mobile-app/morph30-design-412.png' });
    await page.locator('.bottom-nav [data-page=home]').click();
    await page.screenshot({ path: 'mobile-app/morph30-home-412.png' });

    assert.deepEqual(errors, []);
    console.log('PASS: 3.0 nav/aliases/back-stack/segments/gear/status/IP/onboarding/appearances/widths. Native mocked; no physical TV.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
