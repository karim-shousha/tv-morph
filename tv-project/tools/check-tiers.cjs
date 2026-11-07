const { chromium } = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const fails = [];
  function check(name, ok, extra) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' | ' + extra : '')); if (!ok) fails.push(name); }
  async function pageWith(storage) {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    await p.addInitScript((s) => {
      window.MorphLocale = { get: () => 'en', t: (a, e) => e };
      try { localStorage.setItem('morph.welcome-support.v1', '1'); if (s) { localStorage.setItem('cleartv.performanceMode', s); localStorage.removeItem('performanceDefault140'); localStorage.removeItem('cleartv.performanceDefault140'); } } catch (e) {}
    }, storage);
    const root = 'C:\\Users\\Admin\\Documents\\Codex\\2026-10-22\\ui-ux\\tv-project';
    await p.route('https://api.ipapi.is/**', r => r.fulfill({ json: { city: 'X', country_name: 'Y', latitude: 45, longitude: -73, timezone: 'America/Toronto' } }));
    await p.route('https://ipwho.is/**', r => r.fulfill({ json: {} }));
    await p.route('https://api.open-meteo.com/**', r => r.fulfill({ json: { current: { temperature_2m: 8, weather_code: 2, is_day: 1 }, daily: { time: ['2026-10-22'], weather_code: [2], temperature_2m_max: [11], temperature_2m_min: [5] } } }));
    await p.route('https://geocoding-api.open-meteo.com/**', r => r.fulfill({ json: { results: [] } }));
    await p.route('https://api.aladhan.com/**', r => r.fulfill({ json: { code: 200, data: null } }));
    await p.goto('file:///' + root.replace(/\\/g, '/') + '/app/index.html');
    await p.waitForTimeout(2200);
    return p;
  }
  // migration: legacy 'full' -> quality (full visuals)
  let p = await pageWith('"full"');
  let r = await p.evaluate(() => ({ tier: ClearTV.Performance.tier(), light: document.body.classList.contains('light-mode'), stored: localStorage.getItem('cleartv.performanceMode') }));
  check('migrate-full-quality', r.tier === 'quality' && r.light === false && r.stored === '"quality"', JSON.stringify(r));
  await p.close();
  // migration: legacy 'light' -> performance
  p = await pageWith('"light"');
  r = await p.evaluate(() => ({ tier: ClearTV.Performance.tier(), light: document.body.classList.contains('light-mode'), stored: localStorage.getItem('cleartv.performanceMode') }));
  check('migrate-light-performance', r.tier === 'performance' && r.light === true && r.stored === '"performance"', JSON.stringify(r));
  // cycle: performance -> balanced -> quality
  r = await p.evaluate(() => {
    const C = window.ClearTV, out = [];
    ['balanced', 'quality', 'performance'].forEach(t => { C.Performance.set(t); out.push({ t, tier: C.Performance.tier(), light: document.body.classList.contains('light-mode'), idle: C.Performance.radioIdleMs(), stored: localStorage.getItem('cleartv.performanceMode') }); });
    return out;
  });
  check('tier-cycle', r[0].tier === 'balanced' && r[0].light === false && r[0].idle === 5000 && r[1].tier === 'quality' && r[1].idle === 1000 && r[2].tier === 'performance' && r[2].light === true && r[2].idle === 10000, JSON.stringify(r));
  // legacy alias accepted
  r = await p.evaluate(() => { ClearTV.Performance.set('full'); return ClearTV.Performance.tier(); });
  check('legacy-alias', r === 'quality', r);
  await p.close();
  console.log(fails.length ? 'FAILURES: ' + fails.join(', ') : 'ALL TIER CHECKS PASSED');
  await b.close();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.log('ERR', e.message); process.exit(2); });
