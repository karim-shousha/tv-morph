const { chromium } = require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const fails = [];
  function check(name, ok, extra) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' | ' + extra : '')); if (!ok) fails.push(name); }
  await p.addInitScript(() => { window.MorphLocale = { get: () => 'en', t: (a, e) => e }; try { localStorage.setItem('morph.welcome-support.v1', '1'); } catch (e) {} });
  const root = 'C:\\Users\\Admin\\Documents\\Codex\\2026-10-22\\ui-ux\\tv-project';
  await p.route('https://api.ipapi.is/**', r => r.fulfill({ json: { city: 'X', country_name: 'Y', latitude: 45, longitude: -73, timezone: 'America/Toronto' } }));
  await p.route('https://ipwho.is/**', r => r.fulfill({ json: {} }));
  await p.route('https://api.open-meteo.com/**', r => r.fulfill({ json: { current: { temperature_2m: 8, weather_code: 2, is_day: 1 }, daily: { time: ['2026-10-22'], weather_code: [2], temperature_2m_max: [11], temperature_2m_min: [5] } } }));
  await p.route('https://geocoding-api.open-meteo.com/**', r => r.fulfill({ json: { results: [] } }));
  await p.route('https://api.aladhan.com/**', r => r.fulfill({ json: { code: 200, data: null } }));
  await p.goto('file:///' + root.replace(/\\/g, '/') + '/app/index.html');
  await p.waitForTimeout(2500);
  await p.evaluate(() => { document.getElementById('nav-settings').click(); });
  await p.waitForTimeout(300);
  // focus System entry via keyboard from first category: Right,Right then Down,Down (3-col grid)
  await p.evaluate(() => { document.getElementById('settings-category-appearance-entry').focus(); });
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
  const entry = await p.evaluate(() => document.activeElement.id);
  check('category-row-reachable', entry === 'settings-category-home-entry', entry);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(300);
  const inPanel = await p.evaluate(() => { const a = document.activeElement; return a && !!a.closest('#settings-category-home'); });
  check('category-drillin', inPanel === true);
  // walk down 4 rows inside system panel
  const ids = [];
  for (let i = 0; i < 4; i++) { await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80); ids.push(await p.evaluate(() => document.activeElement.id || document.activeElement.className)); }
  check('panel-arrow-down', ids.every(x => x && x !== 'settings-category-system-entry'), JSON.stringify(ids));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  // Escape is browser-back 27 -> C.back -> SettingsNav.back -> focus category entry
  const backTo = await p.evaluate(() => document.activeElement.id);
  check('settings-back', backTo === 'settings-category-home-entry', backTo);
  console.log(fails.length ? 'FAILURES: ' + fails.join(', ') : 'ALL SETTINGS-NAV CHECKS PASSED');
  await b.close();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.log('ERR', e.message); process.exit(2); });
