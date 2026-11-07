# MORPH TV — Performance Implementation Report (P0/P1/P3)

Branch: `codex/perf-recovery-impl` (checkpoint from `codex/usb-media-repair`; all pre-existing
uncommitted changes preserved and untouched). Visual-preservation override honored: **zero changes to
layout, colors, gradients, glow, themes, artwork, transitions, or default visual mood.** No CSS paint
rule was altered except one additive divider style and one selector extension for the renamed System panel.

## R1–R10 disposition

| ID | Status | Change |
|---|---|---|
| R1 focus layout per keypress | **Fixed (JS)** | `focus.js`: versioned spatial cache (one `getBoundingClientRect` drift probe per press instead of O(N)); state-only candidate pass (no `offsetWidth` pre-filter); body observer narrowed to `childList + hidden/disabled/tabindex` (class/style churn from focus rings no longer invalidates); explicit invalidation on `morphTheme/morphUIMode/morphTextSize/morphViewer/morphLanguage/morphAppOrder/morphPlus/morphPacks`. `dock.js`: `dockLayout()` signature cache (`count|hidden|clientWidth`), forced recompute only on morph events/resize. `rails.js`: `--fit-card` stride cached in `dataset`, no per-focus `getComputedStyle`. `settings-nav.js`: per-panel entry cache with organise-sequence invalidation (no `offsetWidth` filter). Navigation algorithm and outcomes unchanged. |
| R2 always-on timers | **Fixed (lifecycle)** | `radio-background.js`: 1s `setInterval` → adaptive timeout chain (1s active / tier idle 5–10s / paused while hidden). `app.js`: programme 60s poll now starts only in Inputs/watching (`programmeKick()` on showView/watch start/stop/visibility). Slideshow interval cleared off-Home and on hidden, re-armed on return (`C.refreshSlides`). `prayer.js` tick: hidden path does native-sync + date-rollover only; Home-hidden skips home-widget DOM writes; adhan timing logic untouched. `app-actions.js` 400ms paint skips while hidden. Fitness engine unchanged (already pauses on hidden via `fitness-ui.js:494`). |
| R3 Performance Mode is paint-only | **Fixed (P3)** | `performance.js`: Quality/Balanced/Performance tiers. Balanced = full visuals + governed background; Performance = established `light-mode` CSS + 10s radio idle; Quality = full visuals + 1s radio. Migration: light→performance, full→quality, auto→device-based; fresh installs keep previous effective default (performance). Native bridge contract preserved (`full`/`light` outbound). |
| R4 focus-ring paint | **Not implemented — documented as optional proposal** | Visual lock prohibits flattening. Filed in Before/After doc. |
| R5 cold start (61 blocking JS) | **Partially fixed (safe subset)** | All 59 body scripts now `defer` (execution order preserved exactly; head `boot-theme.js`/`plus.js` stay sync). Stylesheets NOT reordered (would change cascade). `moment*` kept (prayer dependency). Measured desktop boot unchanged (2689→2676ms, file://, within noise) — gain is parse-parallelism on constrained TV CPUs, needs on-TV measurement. |
| R6 hero/image decode | **Partially fixed (code only)** | Reflection clone skipped in light mode (`catalog.js`), where CSS already hides `.dock-reflection`; `home-reference.js` exposes `refreshDockReflections()` re-run on tier change (cloneNode reuses decoded bitmap, no re-decode). No asset deleted, no visual change. Recompression/variants filed as optional proposal (no tooling in env). |
| R7 catalog search diff storms | **Mitigated** | Observer narrowing (R1) removes the fan-out: search re-renders no longer invalidate focus geometry via class churn; `ui-mode`/`rails` observers are target-scoped. Diff algorithm itself unchanged (correctness first). |
| R8 weather→prayer cascade | **No change needed** | `prayer.load()` already early-outs on signature; verified bounded. |
| R9 settings arrow layout | **Fixed** | Entry cache (see R1). |
| R10 text-size full-DOM restyle | **No change** | Only active when non-default size selected; existing guards kept. Filed as future work. |

## Files modified (tv-project/app)

`focus.js` (rewrite, behavior-preserving), `dock.js`, `rails.js`, `settings-nav.js` (P0 cache + P2),
`app.js` (slideshow/programme lifecycle), `radio-background.js`, `prayer.js` (tick gating only),
`app-actions.js` (hidden guard), `catalog.js` (reflection gate), `home-reference.js` (refresh API),
`performance.js` (tiers), `index.html` (defer only), `ui/ui-mode.js` (canonical tier names),
`wifi.js` / `device-settings.js` / `app-update.js` / `app-polish.js` / `packs-tv.js` / `kids.js` (P2),
`settings-nav.css` (additive subhead style). Pre-existing working-tree edits elsewhere untouched.

## Tests (all on desktop Chrome + file://, labelled non-TV)

- `tools/check-perf-regression.cjs`: 18/18 PASS (nav, settings, persistence, theme, showView, DOM census 678 nodes).
- `tools/check-lifecycle.cjs`: 6/6 (radio idle, slideshow clear/re-arm, programme kick, prayer API).
- `tools/check-settings-nav.cjs`: 4/4 (category reach, drill-in, arrows, back).
- `tools/check-tiers.cjs`: 5/5 (migrations full→quality, light→performance; cycle; cadence 1s/5s/10s; legacy alias).
- Rect-call probe: steady-state horizontal 0–3 calls/press; vertical after scroll correctly rebuilds (HEAD reused stale boxes — fixed as side effect).
- Page errors: zero on boot and all flows (with `MorphLocale` native-stubbed as on TV).
