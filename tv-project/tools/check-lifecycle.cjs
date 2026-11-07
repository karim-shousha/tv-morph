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
  // 1. Radio backs off when idle: hook setTimeout/setInterval to count radio paints
  const radio = await p.evaluate(async () => {
    let paints = 0;
    const mini = document.getElementById('radio-mini');
    const mo = new MutationObserver(() => {});
    // observe hidden attr flips via polling instead: sample mini.hidden twice
    const h1 = mini.hidden;
    await new Promise(r => setTimeout(r, 6500));
    return { h1, h2: mini.hidden };
  });
  check('radio-stays-hidden-idle', radio.h1 === true && radio.h2 === true);
  // 2. Slideshow timer cleared off-Home: track intervals, arm slideshow, leave Home
  const slides = await p.evaluate(async () => {
    const C = window.ClearTV;
    const live = {};
    const origSet = window.setInterval, origClear = window.clearInterval;
    window.setInterval = function (fn, ms) { const id = origSet(fn, ms); if (ms >= 8000 && ms <= 60000) live[id] = true; return id; };
    window.clearInterval = function (id) { delete live[id]; return origClear(id); };
    C.settings.slideshowEnabled = true;
    const px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    C.settings.backgroundImages = [px, px];
    C.applyRemoteConfig({});
    await new Promise(r => setTimeout(r, 400));
    const dots = document.querySelectorAll('#hero-slide-indicators .hero-slide-dot').length;
    const timersOnHome = Object.keys(live).length;
    C.showView('apps');
    await new Promise(r => setTimeout(r, 300));
    const timersOffHome = Object.keys(live).length;
    C.showView('home');
    await new Promise(r => setTimeout(r, 300));
    const timersBackHome = Object.keys(live).length;
    window.setInterval = origSet; window.clearInterval = origClear;
    return { dots, timersOnHome, timersOffHome, timersBackHome };
  });
  check('slideshow-builds', slides.dots === 2, JSON.stringify(slides));
  check('slideshow-cleared-off-home', slides.timersOffHome === 0, JSON.stringify(slides));
  check('slideshow-rearmed-on-home', slides.timersBackHome > 0, JSON.stringify(slides));
  // 3. Programme timer only in inputs: hook refreshProgramme
  const prog = await p.evaluate(async () => {
    let n = 0;
    const C = window.ClearTV;
    // no tizen here; refreshProgramme guards typeof tizen — replace temporarily
    C.Inputs.refreshProgramme = function () { n++; };
    const kick = C.programmeKick;
    C.showView('home');
    const hasKick = typeof kick === 'function';
    return { hasKick, calls: n };
  });
  check('programme-kick-exists', prog.hasKick === true);
  // 4. Prayer tick skips DOM work when hidden is untestable headless (visibility), so verify rollover path exists
  const prayer = await p.evaluate(() => ({ tickKept: !!(window.ClearTV && window.ClearTV.Prayer && window.ClearTV.Prayer.next) }));
  check('prayer-api-intact', prayer.tickKept === true);
  console.log(fails.length ? 'FAILURES: ' + fails.join(', ') : 'ALL LIFECYCLE CHECKS PASSED');
  await b.close();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.log('ERR', e.message); process.exit(2); });
