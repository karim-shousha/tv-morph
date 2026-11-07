# MORPH TV — TV Performance Test Plan

> Reproducible, non-destructive, no device-state changes beyond normal use.
> "Measured" = run the method on-device. Static-analysis expectations from the audit are marked **[expected]**.
> Tooling: TV remote + stopwatch fallback; preferred: `performance.now()` instrumentation snippet injected at
> runtime (console only, no file change), Tizen Web Inspector / Chromium `chrome://inspect`,
> `about:memory`/DevTools Memory + Performance panels where the platform exposes them.

## Global instrumentation snippet (paste in inspector console, no file change)

```js
// Input-to-paint: wrap once per session
const C = window.ClearTV, t0 = { v: 0 };
const _move = null; // locate via getEventListeners(document).keydown in Chromium shells
// Generic: mark keydown → next rAF paint
document.addEventListener('keydown', () => { t0.v = performance.now();
  requestAnimationFrame(() => requestAnimationFrame(() =>
    console.log('[morph] key-to-paint ms:', performance.now() - t0.v)); }, true);
// Timers/observers/DOM census
console.log('[morph] timers: check Sources > Event Listener Breakpoints > Timer; observers: '
  + 'query via DevTools Memory > detached nodes; DOM nodes:', document.querySelectorAll('*').length);
```

Targets are budgets, not claims: input-to-paint p95 ≤100 ms (stretch ≤50 ms for R1);
long-task >50 ms count = 0 during pure D-pad nav; DOM nodes stable ±5% across soak.

## Scenarios

### T1 Cold launch
Method: force-stop app → launch → time to first focusable Home control (`#favourites .favourite`
focused) + `DOMContentLoaded`. Metrics: ms to cover-dismiss (`theme-starting` removed, `boot-theme.js:15`),
script parse (61 blocking). Healthy: cover <3 s on modern TV **[expected improvement after P1-5]**.
Fail: cover hits 7 s fallback (`boot-theme.js:15`).

### T2 Home first render
Method: record first paint of hero + dock icons; count eager image requests (hero/team art).
Metrics: image bytes before first focus, icon decode duplication (`catalog.js:21` reflection).
Fail: >4 MB images before interaction; duplicate icon fetches.

### T3 Home idle 5 min
Method: stay on Home, no input; sample JS wakeups (radio 1 s `radio-background.js:11`, prayer 1 s
`prayer.js:67`, clock 60 s `app.js:65`) + any XHR. Healthy **[expected after P0-2]**: no per-second work
while radio/prayer-hidden. Fail: sustained 1 s wakeups (current behavior — verified statically).

### T4 Rapid D-pad navigation
Method: scripted 50-press runs (←→↑↓ across dock + rails + header) with key-to-paint log above.
Metrics: p50/p95 input-to-paint; long-tasks during run. This is the R1 acceptance test.

### T5 Section switching (Home↔Apps↔Inputs↔Settings↔Fitness)
Method: 5 round trips; log `showView` (`app.js:77`) focus target + leftover timers (programme 60 s,
slideshow, radio). Fail: timers/observers added per visit without release.

### T6 Hero slideshow transitions
Method: enable slideshow (2+ images), observe 3 cycles in full vs light.
Metrics: dropped frames during 250 ms crossfade (`app.js:9`, `motion.css:2`); dual-layer memory.
Fail: visible hitch on Tizen ≤6 in full mode.

### T7 Theme change
Method: switch blue→barcelona→ahly; time `applyRemoteConfig` + `applyCustomisation` (`app.js:28-53`)
+ `ui-mode sync`. Fail: >500 ms freeze or repeated full-grid re-renders.

### T8 Open IPTV (shell handoff)
Method: press Open IPTV; confirm shell only launches external app (`app.js:198`) with no in-shell parse.
Metric: return-to-Home time. Fail: any in-shell playlist work on this path.

### T9 Large playlist load (parser bounds)
Method: load a large M3U via `M3uSource.load` in console with a fixture URL.
Metrics: abort >12 MB (`m3u-source.js:8`), 20 k-row cap, dedupe jobs. Healthy: bounded by design.

### T10 Channel switch / player teardown (native)
Method: Kids stream open → pause/resume/fullscreen/back (`kids.js`); record `stopEngine` paths.
Fail: `frameWatch`/`timeout` surviving close; audio element surviving hidden.

### T11 Return IPTV/Home → Home
Method: back from Inputs-watch (`inputs.js:24` stop) and from Kids; verify `watching` cleared,
`tvwindow.hide`, focus restored (`app.js:69,192-193`). Fail: programme timer still firing (R2).

### T12 Enter/leave Fitness
Method: open Fitness → start workout → Back/Home; verify engine abort/pause (`fitness-ui.js:454,493-494`)
and audio stop. Fail: 100 ms engine tick persisting on Home (`fitness-engine.js:37`).

### T13 Open & navigate Settings
Method: walk all 9 categories; ↑/↓ latency per panel (`settings-nav.js:12`); toggle each option;
reload → persistence round-trip (incl. `performanceMode` outside `C.settings` — known gap).
Fail: dead rows (update-alerts), empty Launcher/IPTV panels, inverted motion label.

### T14 Continuous run 30–60 min
Method: mixed script (idle 10 min → nav 10 min → slideshow 10 min → Inputs/Fitness excursions → idle).
Metrics sampled every 10 min: DOM count, listener count, detached nodes, image memory, timer list,
input-to-paint re-check. Fail: monotonic growth or T4 regression >20%.

## Measurement vs hypothesis ledger

- Measured on-device: fill in T1–T14 tables per TV model (Tizen 5.0 / current Tizen / webOS / Android TV).
- Static-analysis findings (this audit): R1–R10 root causes with file:line — confirmed structurally,
  quantified only after T-runs.
- Hardware-dependent unknowns: absolute ms for blur/gradient/shadow compositing, webp decode at 1.5 MB,
  XHR throughput — never extrapolate across SoCs.
