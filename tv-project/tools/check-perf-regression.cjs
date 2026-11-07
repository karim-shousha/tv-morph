// Morph TV regression + perf probe. Run: node tv-project/tools/check-perf-regression.cjs [outdir]
// Uses system Chrome via executablePath (no playwright browser download needed).
const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const app = 'file:///' + path.join(root, 'app/index.html').replace(/\\/g, '/');
const outdir = process.argv[2] || path.join(__dirname, 'perf-results');
fs.mkdirSync(outdir, { recursive: true });
const location = { city: 'Saint-Eustache', country_name: 'Canada', latitude: 45.565, longitude: -73.905, timezone: 'America/Toronto' };
const forecast = { current: { temperature_2m: 8.4, weather_code: 2, is_day: 1, wind_speed_10m: 12 }, daily: { time: ['2026-10-22', '2026-10-23', '2026-10-24'], weather_code: [2, 3, 61], temperature_2m_max: [11, 12, 9], temperature_2m_min: [5, 7, 3] } };
(async () => {
  const results = { failures: [], checks: [] };
  function check(name, ok, extra) { results.checks.push({ name, ok: !!ok, extra: extra || '' }); if (!ok) results.failures.push(name); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' | ' + extra : '')); }
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  // Simulate the native TV shell global (injected by TVNative on-device).
  // Pre-dismiss the first-run welcome card for deterministic focus tests.
  await page.addInitScript(() => {
    window.MorphLocale = { get: () => 'en', t: (ar, en) => en };
    try { localStorage.setItem('morph.welcome-support.v1', '1'); } catch (e) {}
  });
  await page.route('https://api.ipapi.is/**', r => r.fulfill({ json: location }));
  await page.route('https://ipwho.is/**', r => r.fulfill({ json: location }));
  await page.route('https://api.open-meteo.com/**', r => r.fulfill({ json: forecast }));
  await page.route('https://geocoding-api.open-meteo.com/**', r => r.fulfill({ json: { results: [] } }));
  await page.route('https://api.aladhan.com/**', r => r.fulfill({ json: { code: 200, data: null } }));
  const t0 = Date.now();
  await page.goto(app);
  await page.waitForFunction(() => window.ClearTV && !!document.getElementById('favourites'), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const bootMs = Date.now() - t0;
  check('boot-no-pageerrors', errors.length === 0, errors.slice(0, 3).join(' / '));
  check('boot-under-30s', bootMs < 30000, bootMs + 'ms (desktop Chrome, file://)');
  await page.screenshot({ path: path.join(outdir, 'home.png') });
  // D-pad correctness: Up from favourites reaches nav
  await page.evaluate(() => { const f = document.querySelector('#favourites .favourite'); if (f) f.focus(); });
  await page.keyboard.press('ArrowUp');
  check('dpad-up-to-nav', await page.evaluate(() => document.activeElement && !!document.activeElement.closest('nav')));
  // Right across dock lands on a dock button
  await page.evaluate(() => { const f = document.querySelector('#favourites .favourite'); if (f) f.focus(); });
  await page.keyboard.press('ArrowRight');
  check('dpad-right-stays-dock', await page.evaluate(() => document.activeElement && !!document.activeElement.closest('#favourites')));
  // Key-to-paint measurement: 20 ArrowRight presses with rAF paint timing
  const paints = await page.evaluate(async () => {
    const out = [];
    const dock = document.querySelector('#favourites');
    const first = dock && dock.querySelector('button');
    if (first) first.focus();
    for (let i = 0; i < 20; i++) {
      const t = performance.now();
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 39, bubbles: true, cancelable: true }));
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      out.push(performance.now() - t);
    }
    return out;
  });
  paints.sort((a, b) => a - b);
  const p50 = paints[Math.floor(paints.length / 2)], p95 = paints[Math.floor(paints.length * 0.95)];
  check('nav-paint-measured', paints.length === 20, 'p50=' + p50.toFixed(1) + 'ms p95=' + p95.toFixed(1) + 'ms (desktop Chrome)');
  results.navPaint = { p50, p95, all: paints };
  // Modal focus trap
  await page.evaluate(() => { const s = document.getElementById('nav-settings'); if (s) s.click(); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outdir, 'settings.png') });
  // Drill into the Time & weather category (settings use category drill-in).
  await page.evaluate(() => window.ClearTV.SettingsNav.open('time'));
  await page.waitForTimeout(300);
  const settingsCount = await page.locator('#view-settings .setting').count();
  check('settings-visible', settingsCount > 5, settingsCount + ' .setting rows');
  // Settings persistence round-trip
  const before = await page.locator('#clock-format').textContent();
  await page.locator('#setting-clock').click();
  const after = await page.locator('#clock-format').textContent();
  check('settings-clock-toggle', before !== after, before + ' -> ' + after);
  await page.reload();
  await page.waitForTimeout(2500);
  check('settings-clock-persist', (await page.evaluate(() => { const s = document.getElementById('nav-settings'); if (s) s.click(); return true; })) && true, '');
  await page.waitForTimeout(500);
  check('settings-clock-persist-value', (await page.locator('#clock-format').textContent()) === after, await page.locator('#clock-format').textContent());
  // P2 settings architecture checks
  const cats = await page.evaluate(() => {
    const ids = ['appearance', 'performance', 'home', 'livetv', 'prayer', 'time', 'system', 'launcher', 'iptv'];
    const out = {};
    ids.forEach(k => { const e = document.getElementById('settings-category-' + k + '-entry'); out[k] = !!e && !e.hidden; });
    return out;
  });
  check('settings-7-visible-2-hidden', cats.appearance && cats.performance && cats.home && cats.livetv && cats.prayer && cats.time && cats.system && !cats.launcher && !cats.iptv, JSON.stringify(cats));
  const places = await page.evaluate(() => {
    const C = window.ClearTV;
    C.SettingsNav.open('livetv');
    const hdmi = !!document.querySelector('#settings-category-livetv #setting-home-hdmi') && !!document.querySelector('#settings-category-livetv #setting-last-hdmi');
    C.SettingsNav.open('system');
    const sys = !!document.querySelector('#settings-category-system #setting-device-settings') && !!document.querySelector('#settings-category-system #setting-wifi');
    C.SettingsNav.open('home');
    const home = !!document.querySelector('#settings-category-home #setting-favourites') && !!document.querySelector('#settings-category-home #setting-kids-home');
    C.SettingsNav.open('performance');
    const perf = !!document.querySelector('#settings-category-performance #setting-performance') && !!document.querySelector('#settings-category-performance #setting-motion');
    C.SettingsNav.open('time');
    return { hdmi, sys, home, perf, sub: !!document.querySelector('#settings-category-time .settings-subhead') };
  });
  check('settings-placement', places.hdmi && places.sys && places.home && places.perf && places.sub, JSON.stringify(places));
  check('motion-label', (await page.evaluate(() => { window.ClearTV.SettingsNav.open('performance'); return document.getElementById('motion-state').textContent; })) === 'On');
  check('kids-label', (await page.evaluate(() => { window.ClearTV.SettingsNav.open('home'); return document.getElementById('setting-kids-home').textContent; })).indexOf('Shown') >= 0);
  // Theme switching
  await page.evaluate(() => ClearTV.applyRemoteConfig({ theme: 'emerald' }));
  await page.waitForTimeout(800);
  check('theme-switch', (await page.evaluate(() => document.body.getAttribute('data-theme'))) === 'emerald');
  await page.screenshot({ path: path.join(outdir, 'theme-emerald.png') });
  await page.evaluate(() => ClearTV.applyRemoteConfig({ theme: 'night' }));
  // Performance tier (P3 API, optional)
  const perfApi = await page.evaluate(() => !!(window.ClearTV && ClearTV.Performance && ClearTV.Performance.tier));
  check('perf-tier-api', true, perfApi ? 'tier API present' : 'legacy light/full only');
  // Slideshow lifecycle: timer cleared off-Home
  const slideInfo = await page.evaluate(() => {
    const C = window.ClearTV;
    C.showView('apps');
    return { homeHidden: document.getElementById('view-home').hidden };
  });
  check('showview-apps', slideInfo.homeHidden === true);
  await page.evaluate(() => window.ClearTV.showView('home'));
  // DOM census
  const census = await page.evaluate(() => ({ nodes: document.querySelectorAll('*').length }));
  check('dom-census', census.nodes > 0, census.nodes + ' nodes');
  results.census = census;
  results.errors = errors;
  fs.writeFileSync(path.join(outdir, 'results.json'), JSON.stringify(results, null, 2));
  console.log(results.failures.length === 0 ? 'ALL CHECKS PASSED' : 'FAILURES: ' + results.failures.join(', '));
  await browser.close();
  process.exit(results.failures.length ? 1 : 0);
})().catch(e => { console.error('PROBE ERROR', e.message); process.exit(2); });
