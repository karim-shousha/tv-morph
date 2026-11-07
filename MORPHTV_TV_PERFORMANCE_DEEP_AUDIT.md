# MORPH TV — TV Performance Deep Audit

> Scope: `tv-project/app/**` (Samsung Tizen shell — the canonical TV implementation).
> Companion shells (`android-tv/`, `webos-app/`, `vidaa-app/`) referenced only for platform contrast.
> Method: static code analysis only. No on-device profiling was available in this environment.
> Every claim below is labelled: **[Verified defect]** (code proves it), **[Suspected]** (likely but needs
> on-device measurement), **[Hardware-dependent]** (varies by SoC/WebView).
> No FPS/CPU/memory numbers are claimed — all "expected benefit" entries are qualitative pending measurement.

## Executive summary — the 5 most important findings

1. **D-pad latency is dominated by per-keypress layout work, not animations.**
   `focus.js:5,29-38` rebuilds the focusable list and calls `getBoundingClientRect()` on every candidate
   **on every arrow press**; `dock.js:3-4` runs `getComputedStyle()` per dock button on **every focusin**.
   Two body-level `MutationObserver`s (`focus.js:23-24`) invalidate the only cache (`homeGeometry`) on any
   DOM mutation, so the light-mode fast path rarely survives. **[Verified defect]**
2. **Performance Mode barely touches CPU.** `performance.js:7-15` only toggles `body.light-mode`
   (CSS kills `backdrop-filter`/`transition`/`animation`) and lazy-loads `.shelf-card/.app-card` images —
   classes that **do not exist in this shell** (real classes are `.favourite`/`.catalog-tile`/`.app-icon`),
   so the image path is dead code. No timer, observer, poll, decode, or focus-path change.
   **[Verified defect]**
3. **Always-on background work survives idle/hidden.**
   `radio-background.js:11` (1 s poll, no hidden guard), `prayer.js:67` (1 s tick forever),
   `app.js:199` (60 s programme refresh), `app.js:65` clock, `weather.js:24` 30-min re-poll,
   plus **14 never-disconnected `MutationObserver`s** across 8 files. Idle Home still pays for all of this.
   **[Verified defect]**
4. **The newest Home visual system is the heaviest paint in the repo.**
   `ui/modern-shell.css:54,104,117` — dock focus ring = 4 stacked gradients + `repeating-radial-gradient`
   pattern + 2–3 box-shadows + `skewX()` + `scale(1.14)/translateY(-11px)`; full-screen `#cinema-background`
   (1920×1080) + double-gradient scrim (`:46`); 28 stylesheets + 61 scripts, **all render-blocking, zero
   `defer`/`async`** (`index.html:2,34`). Recent git history (`892e775`, `c49ee88`, `f19f1fc`, `d7ef437`)
   confirms this dock/neon system is new. **[Verified defect — cost is structural; ms impact is hardware-dependent]**
5. **Hero/theme images are oversized for TV decode budgets.**
   Four team cutouts 1.2–1.6 MB each (`ittihad-stars-cutout-hq-v3.webp` 1591 KB,
   `ismaily-team-hq-v2.webp` 1562 KB, `argentina-champions-hq.webp` 1467 KB,
   `egypt-national-team-v1.webp` 1223 KB), no `srcset`/downscale, hero eager-loads, slideshow keeps
   **two simultaneous full-screen layers** (`app.js:11`), and `catalog.js:21` clones every loaded app icon
   into `.dock-reflection` (double decode). **[Verified defect — sizes measured; decode-ms is hardware-dependent]**

---

## 1. What the TV application actually is

- **Canonical shell:** `tv-project/app/index.html` + ~52 root JS files + `ui/*` (modern shell) + `fitness/*`.
  Fixed 1920×1080 canvas scaled by `screen-fit.js` (`MorphScreenFit.scale()`).
- **Boot chain:** `boot-theme.js` (startup cover, max 5–7 s) → `core.js` (`ClearTV` namespace, settings,
  `localStorage`) → `tv-compat.js` (legacy WebKit polyfills) → `focus.js` → `catalog.js`/`app-catalog.js` →
  `app.js` (views, hero, catalog) → `ui/ui-mode.js` + `ui/theme-adapter.js` (modern shell) →
  `dock.js`, `rails.js`, `home-refinements.js`, `home-reference.js` → feature modules
  (`prayer.js`, `weather.js`, `inputs.js`, `kids.js`, `packs-tv.js`, `plus*.js`, `text-size.js`, …).
- **Views:** `home`, `apps`, `inputs`, `settings`, `fitness` (`app.js:77-83` `showView`). Header nav is static.
- **Theme engine:** `C.settings.theme` (28 themes, `app.js:16`) → `C.applyRemoteConfig` (`app.js:53`) →
  `applyAppearance/applyCustomisation` (`app.js:27-52`) + `ui/theme-adapter.js` tokens +
  `club-themes.js` metadata + `theme-packs.js` (IndexedDB packs) + `theme-preview.js`.
- **Platform shims:** `tizen.*` (`tvwindow`, `tvchannel`, `systeminfo`, `application`), `webapis.avplay`,
  `TVNative.*` (Android/projector bridge), `webOS.service` (`usb.js:11`), `SamsungMedia/MorphMedia`.
  Tizen 5–6 path: `tv-compat.js` legacy-layout flag + `ui-mode.js:24` weak-device force-light.

## 2. JavaScript performance

### 2.1 Main-thread blocking / per-input layout (CRITICAL)

| Location | What happens | Why it matters |
|---|---|---|
| `focus.js:5` `list()` | `querySelectorAll('button,input,select')` + `offsetWidth/offsetHeight` filter per call | Runs **per arrow press** via `move()`; O(N) layout reads |
| `focus.js:29-38` `move()` | Builds `WeakMap` of `getBoundingClientRect()` for **all** choices (cached path) or per-candidate `rect()` (uncached) + `primary+perp*3` cost loop | Core D-pad cost. No spatial index, no viewport culling, hidden-element filter itself forces layout |
| `focus.js:12-19` `focus()` rAF | `getBoundingClientRect()` ×2 + `scrollLeft/Top` writes per focus event | Coalesced by `revealFrame` — OK, but fires on every focus change |
| `dock.js:3` `dockLayout()` | `getComputedStyle(dock)` + per-button `getComputedStyle` + `offsetWidth` loop | Called from `centerDock` on **every `focusin`** (`dock.js:12`), `resize`, `morphPerformance/TextSize/UIMode` |
| `dock.js:4` `centerDock()` | `offsetLeft/offsetWidth/clientWidth/scrollLeft` read + `scrollLeft` write in rAF | Per focusin on dock |
| `dock.js:7` `DockArrow()` | `offsetWidth` filter per ←/→ | Adds to `move()` cost on dock |
| `rails.js:2-3` `size()/reveal()` | `clientWidth` per rail; `getComputedStyle().--fit-card` + `scrollLeft` writes per `focusin` | Per-focus layout on non-dock rails |
| `app.js:112` `catalogArrow()` | `querySelectorAll('#catalog .launch-tile')` + `clientWidth/offsetWidth` per ←/→/↑/↓ in picking mode | Grid nav cost |
| `reorder.js:11`, `packs-tv.js:8` | `getBoundingClientRect()` per arrow press | Secondary nav paths |
| `text-size.js:8,18` | `while(scrollHeight>clientHeight) size-=2` + `getComputedStyle` per node | Only when `fontSize≠normal` or hero fit; bounded but synchronous |
| `home-reference.js:5` | Same shrink loop for Arabic title | Per language/theme change |

**[Verified defect]** The `light-mode` geometry cache (`focus.js:29` `homeGeometry`) is invalidated by
`focus.js:23-24` observers on **any** subtree add/remove or class/style/hidden change — i.e. exactly what
`renderCatalog/renderFavourites` and every theme/motion change do. Cache hit rate in practice ≈ only
between consecutive keypresses with zero DOM churn.

### 2.2 Event listeners — excessive / duplicate / global

- `document keydown capture:true`: `focus.js:43`, `inputs.js:26`, `kids.js:28`, `prayer.js:14`,
  `reorder.js:13-14`, `dock.js:11`, `plus.js:23`, `welcome-support.js:14`, `support.js:11`,
  `device-settings.js:4`, `wifi.js:4`, `about.js:1`, `packs-tv.js:9` (added/removed correctly).
  Every remote key traverses ~10 capture handlers before `move()`. **[Verified — count is exact; ms cost is hardware-dependent]**
- `document scroll capture:true` → `invalidate()` (`focus.js:22`); `document visibilitychange` ×7 files;
  `document click capture` ×3 (`prayer.js:15`, `plus-tv.js:9`, `reorder.js:17`).
- `focusin` handlers: `focus.js:53`, `dock.js:8,12,21`, `rails.js:4` — each does layout (see 2.1).
- No duplicate registration of the *same* handler found; the problem is *count × per-handler layout cost*,
  not double-binding. **[Verified]**

### 2.3 Timers — what survives navigation (CRITICAL)

| Timer | File:line | Stops on hide/nav? | Verdict |
|---|---|---|---|
| Radio mini poll 1 s | `radio-background.js:11` | **Never** (only `morphAudioExclusive`) | **[Verified defect]** — runs on every view, hidden tab included |
| Prayer tick 1 s + adhan watchdog | `prayer.js:67` (+`audioLimit` `prayer.js:35` 4.5 min) | `stop()` pauses audio on hidden, but **interval persists by design** | Justified for prayer timing, but `tick()` also does `breakState()` scan + `renderHome()` + `syncNative()` per second |
| Hero slideshow N s | `app.js:11` | Skips when hidden, but **timer persists** off-Home | Minor; cheap when skipped |
| Clock 60 s self-reschedule | `app.js:65` | Early-return when hidden leaves one pending timeout, re-armed on visible | OK |
| Programme refresh 60 s | `app.js:199` | Runs when `view==='inputs'` **or watching**; not cleared leaving Inputs | **[Verified defect]** — polls after leaving |
| Weather 30 min | `weather.js:24,65` | Cancelled on hidden, `load(false)` on visible | Correct pattern |
| Kids stall 2 s + connect 20 s | `kids.js:13-14` | Cleared in `stopEngine()`; `close()` on hidden/showView/viewer/lang | Correct |
| Fitness engine 100 ms | `fitness-engine.js:37` | `document.hidden && false` no-op guard — **keeps ticking hidden**; relies on `fitness-ui.js:493-494` pause | **[Suspected]** — verify `UI.leave()` aborts engine on Home return |
| `app-actions.js:14` 400 ms poll | parental overlay | Cleared in `close()` only | Leaks if navigation bypasses close |
| `welcome-support.js:14` 500 ms retry | startup dialog | Cleared on `unload` only | Startup-only; bounded |
| `theme-packs.js:11` hash chunking `setTimeout(chunk,0)` | pack verify | Bounded | OK |
| `controlsTimer` 7 s, `hideTimer` 4 s, toast 4.5 s | `inputs.js:4`, `usb-media.js:8`, `core.js:26` | Scoped + cleared | OK |

### 2.4 MutationObservers — 14 live, most `subtree:true`, none disconnected

`focus.js:23,24` (body, broadest) · `performance.js:15` (body) · `rails.js:4` (#view-home subtree) ·
`dock.js:14,21` · `home-reference.js:7` ×2 · `ui-mode.js:40-43` ×4 · `progress.js:6` ·
`settings-nav.js:14` · `text-size.js:34` (heaviest filter: `getClientRects()` + `textNode()` per mutation).
**[Verified defect]** `renderCatalog` (`app.js:102-110`, full grid diff + `replaceWith/insertBefore/remove`
per keystroke in search) fans out into `focus.js:23` + `performance.js:15` + `rails.js:4` + `ui-mode`
observers → `invalidate()` + `schedule()` storms during typing. No observer calls `disconnect()` except
indirectly via `text-size.js` factor-1 path.

### 2.5 Repeated DOM queries / initialization

- `renderCatalog` (`app.js:104-110`) re-queries `#catalog`, rebuilds key map, diffs children per keystroke.
  Kept-tile reuse exists (`data-catalog-key`), but focus restore + observer storm remain.
- `applyCustomisation` (`app.js:28-52`) rebuilds `#cinema-background` fallback, re-reads club art, rewrites
  `#remote-custom-style` `<style>` content, re-toggles ~6 header nodes — on **every** `applyRemoteConfig({})`,
  which `ui-mode.js:39`, `packs-tv.js` `changed()`, `text-size.js`, `home-refinements.js` all trigger.
  Remote-style rewrite forces full style recalc. **[Suspected — needs profiling]**
- `decorateSidebar` (`ui-mode.js:9-12`) + `fitHero` (`ui-mode.js:13-19`, includes shrink loop) run on every
  `sync()` (viewer/lang/performance/UIMode/textSize events).
- `C.read('recent'/'lastHdmi')` wrapped with `setTimeout(render,0)` monkey-patch (`home-refinements.js:24`)
  — every pin/recent write schedules a re-render.

### 2.6 Storage / network on hot paths

- All network via `C.request` XHR (`core.js:18-25`, 12 s timeout). No `fetch`. No polling XHR besides
  weather/prayer/AlAdhan/geocode. **[Verified]**
- `C.read/write` = sync `localStorage` + `JSON.parse/stringify` (`core.js:5-6`). Hot uses:
  `prayer.js:44` `tick()` → `loc()/cfg()` → `C.settings` object (in-memory — cheap) but `claimAdhan`
  (`prayer.js:37`) does `C.read('adhanFiredV2')` + `C.write(...slice(-48))` per adhan fire (rare — OK);
  `weatherChanged` chain `prayer.js:67` → `load(false)` → `render()` per weather event can cascade
  weather→prayer→weather. **[Suspected cascade — needs trace]**
- Large parses guarded: `m3u-source.js:8` 12 MB abort + 20 k-row cap; `theme-packs.js` chunked hash;
  `update-alert.js:11` 8 s timeout. Good. **[Verified]**

### 2.7 Errors / promises

- Unhandled-rejection risk: `P.ready.then(...)` chains in `packs-tv.js`, `plus-tv.js` have no `.catch`
  except download paths; `libraryReady()` (`kids.js:12`) rejects → `failure()` — handled.
  `current.play()` promises guarded with `.catch` (`kids.js`, `prayer.js:35`). No systemic
  unhandled-rejection storm found. **[Verified by inspection]**

### 2.8 Do inactive pages consume CPU? — Yes

Leaving Home/Inputs/Fitness/Radio does **not** stop: radio 1 s poll, prayer 1 s tick, programme 60 s
(when watching flag sticks), slideshow timer, all 14 observers, `visibilitychange` handlers re-arm
weather/clock. Only Kids, USB-media, and weather fully quiesce. **[Verified defect]**

## 3. Rendering and CSS

### 3.1 Expensive primitives (file:line)

- **Focus ring (worst single selector):** `ui/modern-shell.css:54` — one `:focus` rule stacks
  `radial-gradient + repeating-radial-gradient + linear-gradient + linear-gradient(border-box)` with
  `box-shadow: inset 0 1px 2px, 0 0 10px, 0 0 25px` and `transform: scale(1.035)`; `:104` adds a 140 px
  `:before` with **4 background layers** + `skewX(7deg)`; `:117` adds a `:after`
  `repeating-radial-gradient(ellipse … 13px/14px/16px)` at `opacity:.7`. Light mode (`:125-126`) flattens
  `:before` and hides `:after` — proof the full path is the expensive one.
- **Full-screen layers:** `#cinema-background` 1920×1080 (`modern-shell.css:44-46`) + `:after`
  double-background scrim (`--ui-art-scrim + linear-gradient(0deg,…57%)`); `.landscape` 2300×700 rotated
  ridges + 650 px radial sun (`style.css:1`); `club-hero` gradient + `:before` rotated stripe + drop-shadows
  (`style.css:11-12`); Barcelona stripe `repeating-linear-gradient(90deg,…135px/270px)` (`style.css:50`)
  repaints the whole hero per theme.
- **Blur:** `prayer.css` glass `backdrop-filter: blur(24px)` + `box-shadow: 0 15px 40px`;
  `#home-next-prayer` `blur(18px)` (`prayer.css:5`); `.favourite` `blur(8px)` behind `@supports`
  (`style.css:32`); `home-reference.css:39,112` `#home-next-prayer blur(8px)`.
  `body.light-mode *` (`style.css:81`) and `[data-ui-effects=light]` (`motion.css:3`,
  `modern-shell.css:91-93,108`) kill all three — the single most effective CSS switch in the app.
- **Shadows/text:** `0 0 18px/20px` focus glows (`modern-shell.css:10-11,64`), `0 20px 55px` hero
  (`style.css:11`), `0 18px 60px` club (`style.css:50`), `0 12px 40px` pack dialog
  (`plus-themes.css:29`); hero text-shadows `0 3px 18px/22px` (`modern-shell.css:37-38`, `style.css:11`).
- **Transforms on focus:** `translateY(-11px) scale(1.14)` dock (`modern-shell.css:73`),
  `scale(1.45)/translateY(-18px)` legacy (`home-reference.css:38,111`), `scale(1.28)` dock legacy
  (`dock.css:13`), reflection `scaleY(-.35)` (`modern-shell.css:124`).

### 3.2 What light mode actually changes (vs full)

`ui-mode.js:24` computes `light` from `Performance.isLight() || !motion || legacy-Tizen || prefers-reduced-motion`.
Light kills `transition/animation/backdrop-filter` globally (`motion.css:3`), flattens
`--ui-icon-shadow` triple→single (`tokens.css:16`), hides `.dock-reflection` and `:after` pattern,
neutralises `:focus` transforms/shadows (`modern-shell.css:91-93,108,125-126`, `style.css:81,91`).
**Full keeps everything** — the only difference in `modern-shell.css:90` is a dock `backdrop-filter:none`.
So: light ≈ paint fix; full ≈ showcase. Motion toggle (`C.settings.motion`) feeds the same flag.

### 3.3 Newest Home UI overhead

Git log confirms the modern dock/neon system landed in the last ~15 commits
(`892e775` opt-in Modern Home → `c49ee88`/`94a0557` floating icons/sidebar glow → `1b9a6d0`/`f19f1fc`
unify Light/Full + dock focus repair → `d7ef437` neon focus + hero slideshow nav).
Each focus change in full mode now composites: icon gradient + 4-layer ring + pattern overlay +
glow shadows + neighbour `dock-neighbor scale(1.04)` (`dock.css:16`) + `magnify()` class churn
(`dock.js:20`, mouseover/focusin/focusout). **[Verified structural cost; frame-ms needs TV measurement]**

### 3.4 Continuous effects / hero transitions

- Slideshow: `app.js:11` keeps **two** full-screen `<img>` layers crossfading `opacity 250 ms`
  (`motion.css:2` forces `!important` duration); `style.css:81` light-mode hides `.slide-layer` entirely.
- `boot-theme.js` startup gradient + `theme-starting` cover up to 7 s; `welcome-support.js` retry loop.
- No particle canvas, no CSS keyframe loops besides `morph-focus-gleam 180 ms` (`motion.css:6-7`).

### 3.5 Image scaling

`#cinema-background>img` uses `object-fit: var(--ui-art-fit)` at `width: var(--ui-art-width)` up to
1920 px (`modern-shell.css:45`); `applyCustomisation` (`app.js:30`) additionally writes
`transform: scale(0.7–1.25)` from `heroArtSize`. GPU scales a decoded 1920-wide bitmap every frame
while any ancestor transform animates. **[Suspected — needs layer-border profiling on TV]**

## 4. Images and media assets

Measured sizes (`tv-project/app/assets`, top of 76 files):

| Asset | Size | Role | Issue |
|---|---|---|---|
| `prayer-egypt.mp3` | 2020 KB | Adhan audio | Preloaded on `play()` only — OK |
| `ittihad-stars-cutout-hq-v3.webp` | 1591 KB | Theme cutout | **[Verified]** oversized; `hq-v2` twin (499 KB) also ships |
| `ismaily-team-hq-v2.webp` | 1562 KB | Theme cutout | **[Verified]** `v1` (397 KB) also ships — duplicate resolution |
| `argentina-champions-hq.webp` | 1467 KB | Theme | Oversized single-res |
| `egypt-national-team-v1.webp` | 1223 KB | Hero bg | Oversized single-res |
| `saudi/egypt-patriotic-world-v1.webp` | 616/573 KB | Patriotic bg | Large but single-use |
| `gta6-vice-sunset-v3.webp` | 313 KB | Gaming hero | `v1` (276 KB) + `v2` (201 KB) also ship — 3 variants |
| `fitness hero/home.webp` | 99 KB | Fitness hero | Reasonable |
| `prayer-pause-v1.webp` | 109 KB | Prayer cover | Reasonable |
| `blue-cinema-original-v1.webp` | 110 KB | Cinema | Reasonable |

- No `srcset`/`sizes`, no thumbnail variants; `artwork.js:2` accepts `data:` URIs up to ~1 MB
  (`<1000000` chars) and slideshow accepts ≤90 k chars (`app.js:5`) — user uploads can inject
  multi-MB base64 into `localStorage` and the hero layer. **[Verified defect — unbounded user-art decode]**
- `catalog.js:21` — every successfully loaded app icon is **cloned into `.dock-reflection`**
  (`node.cloneNode(true)`), doubling decode/memory for icon rows.
- `performance.js:14` lazy-loader watches `.shelf-card img,.app-card img` — **neither class exists**
  in this shell (verified by grep: only `.shelf-card` hits are in `plus-themes.css`/`style.css` for other
  themes). Home favourites (`.favourite`) and catalog tiles load **eagerly**. **[Verified dead code]**
- 28 CSS + 61 JS all render-blocking (`index.html:2,34`), incl. `moment.min.js` + `moment-timezone.min.js`
  before `prayer.js`. No `defer/async/preload`. Cold-start parse cost is structural. **[Verified]**

## 5. Memory management

- **Leaks / retention:** no `disconnect()` on any of 14 observers; `text-size.js` `WeakMap` grows per
  styled node when factor≠1 (WeakMap — GC-able, bounded risk); `plusSuspendedSettings`
  (`plus-tv.js:3`) duplicates full settings JSON per theme change (transient); `homeGeometry WeakMap`
  churns per keypress. No unbounded array found: `adhanFiredV2` capped 48, `recent` capped 5,
  prayer cache capped 8, m3u records capped 2, theme pack flow bounded. **[Verified by inspection]**
- **Detached nodes:** `renderCatalog` diff (`app.js:106-110`) `replaceWith/remove`s tiles — listeners are
  per-tile closures, GC-able after removal; modal `content.textContent=''` drops dialog listeners.
  No retained-detached-subtree pattern found. **[Verified by inspection]**
- **Player lifecycle:** Kids (`kids.js:11,27`) destroys hls/video/avplay on close/hidden/showView —
  correct. USB-media (`usb-media.js:19-21`) pauses + tears down on hidden — correct. Fitness relies on
  `pauseKeep` (`fitness-ui.js:493-494`) — engine object survives in `UI.engine` until abort/exit.
  **[Suspected]** long fitness-paused sessions retain engine + audio element.
- **Prolonged-use deterioration:** prayer `tick` + radio `paint` + observers accumulate **CPU**, not memory;
  memory itself looks capped. The "heavy after 30–60 min" symptom is more plausibly timer/observer load +
  XHR cache writes (`weatherCache`, `prayerCacheV1`, `geoBackoffUntil`) than a DOM leak. **[Suspected]**

## 6. Navigation and input latency

- **Pipeline per arrow press:** `keydown` capture (~10 handlers) → `focus.js:49` 90 ms key-repeat gate →
  `C.DockArrow` → `C.SettingsNav.arrow` → `catalogArrow` → `list()` (full query + layout filter) →
  `move()` (rect all + cost loop) → `focus()` → rAF scroll-into-view + `dockLayout/centerDock`
  + `rails.reveal` + `magnify` + `ui-mode sync` (possible). Estimated methodology: instrument
  `performance.now()` around `move()` + `focus()` rAF callback on-device (see Test Plan).
  No measured numbers claimed here.
- **Focus restoration:** `C.restoreHomeDock` (`dock.js:12`) via `lastDockKey`; `showView` refocuses
  `nav-*` (`app.js:82`); modal close restores `returnFocus` with `offsetWidth` check (`app.js:69`).
  Correct logic; cost is the layout reads inside it.
- **Key repeat:** `focus.js:49` drops repeats <90 ms; `reorder.js:13` long-press 650 ms; `inputs.js:26`
  swallows keys while waking controls. Repeat UX is deliberate; 90 ms gate caps nav rate at ~11 keys/s.
- **Unnecessary focus animation:** full-mode `:focus` transform+shadow transitions
  (`motion.css:1`, `var(--ui-focus-duration)`) run on **every** D-pad step — perceived latency even when
  layout is fast. Light mode removes them. **[Verified]**

## 7. IPTV and background services

- **TV shell has no IPTV engine.** `m3u-source.js` is a parser/loader only (20 k rows, 12 MB guard,
  30 s timeout, 2-entry cache — all correctly bounded). Real IPTV lives in `android-tv/iptv/*`
  (`IptvActivity`, `IptvStore`, `tv-library.js`, `cinematic.js`, `startup-refresh.js`) and native
  Tizen/webOS players. `open-iptv` (`app.js:198`) just launches the installed IPTV app.
  No playlist parsing, EPG processing, thumbnail loading, or IndexedDB cache init runs in this shell.
  **[Verified — do not chase IPTV perf in `tv-project/app`]**
- **Radio:** `radio-background.js` 1 s `TVNative.radioStatus()`/`media().radioStatus()` JSON parse per
  second + `text()` locale lookup + 3 button text writes per second — the cheapest per-tick but the most
  frequent unconditional timer. **[Verified defect]**
- **Fitness:** engine 100 ms tick + audio element; `UI.leave()` (`fitness-ui.js:454`) asks-exit then
  `C.showView('home')` and returns `false` — engine abort happens only via exit dialog confirm.
  Backing out via TV Back key routes through `C.FitnessUI.back()` (`app.js:76`) — verify abort path
  on-device. **[Suspected]**
- **Prayer:** 1 s tick + AlAdhan XHR per day + `weatherChanged` wrap (`prayer.js:67`) — the cascade
  `weather→prayer load→render→weatherChanged` can double-fetch after each weather update. **[Suspected]**

## 8. Root-cause list (prioritized)

| # | Sev | Symptom | Root cause (file:line) | Fix direction | Verify |
|---|---|---|---|---|---|
| R1 | Critical | D-pad steps feel laggy, esp. with many apps | `focus.js:5,29-38` O(N) `getBoundingClientRect` per press; cache killed by `focus.js:23-24` observers | Viewport-cull candidates; cache geometry per frame not per press; narrow observer filters; avoid `offsetWidth` filter (use `hidden`/`disabled` state) | On-TV `performance.now()` around `move()` before/after; target p95 <50 ms |
| R2 | Critical | Idle/battery-warm TV, sluggish after long sessions | `radio-background.js:11` 1 s forever + `prayer.js:67` 1 s + `app.js:199` 60 s + 14 live observers | Gate radio poll on `mini.visible`/radio-active + hidden; throttle prayer tick off-Home; clear programme timer off-Inputs; disconnect/scope observers | CPU wakeups/s + long-press nav latency after 60 min soak |
| R3 | High | Performance Mode changes almost nothing | `performance.js:7-15` class-toggle only; lazy selector matches nothing | Unified controller (see §9): tier-gated timers, observer scopes, decode caps, focus-cost tiers — fix code first, keep CSS kill-switch | A/B: same nav script in light vs full with timers instrumented |
| R4 | High | Home focus flash / jank in full mode | `modern-shell.css:54,104,117` multi-layer focus ring + pattern + skew + scale | Flatten `:before/:after` to 1–2 layers; drop `repeating-radial-gradient` on focus; keep glow via single shadow | Visual compare + frame-time on Tizen 5/6 |
| R5 | High | Slow cold start, white/cover screen | 61 blocking scripts + 28 blocking CSS, `moment*` ×2, no defer (`index.html:2,34`); `boot-theme.js` 5–7 s cover | Move body `<link>` to head/preload; `defer` non-critical; drop `moment-timezone` if unused zones; split prayer defer | `DOMContentLoaded` + first-focus ms on low-end TV |
| R6 | High | Hero images slow / memory-heavy | 1.2–1.6 MB webp ×4, no variants; dual-layer slideshow (`app.js:11`); icon clone (`catalog.js:21`); user-art ≤1 MB (`artwork.js:2`) | Cap/resize theme art at ingest; single-layer crossfade; remove reflection clone or reuse bitmap; downscale user art to ≤1920 w | Decode ms + peak image memory on TV |
| R7 | Medium | Search typing stutters in Your apps | `renderCatalog` full diff + 4 observer storms per keystroke (`app.js:102-110`) | Debounce input; diff by key without `replaceWith` churn; suspend observers during render | Keystroke-to-paint ms |
| R8 | Medium | Settings/weather/prayer cascade fetches | `weatherChanged` wrap (`prayer.js:67`) + `load(false)` on every visible/online event | Generation-guard already exists — add `loading` + signature early-out audit; debounce `online` | Network log: XHR count per weather refresh |
| R9 | Medium | Settings focus traps / slow lists | `settings-nav.js:12` `arrow()` re-queries + `offsetWidth` per ↑/↓; `organise()` moves nodes per mutation | Same viewport-cache fix as R1; organise on `load` + explicit refresh only | Settings nav latency |
| R10 | Low | Text-size large mode slows everything | `text-size.js` full-DOM `getComputedStyle` + inline `!important` per node; observer with `getClientRects()` | Limit to text-bearing subtree; skip icon/svg subtrees (already partly); cache factor | Toggle large ↔ normal frame cost |

## 9. Proposed performance architecture (not implementation)

- **Principle enforced:** tiers must gate *work* (timers, observers, decode, layout), not just *paint*.
  Current `light` = paint-only. Keep it as the CSS floor; add:
  - `Quality` (full effects + full background services),
  - `Balanced` (reduced focus-ring layers, slideshow single-layer, radio poll 5 s, prayer tick 5 s off-Home, observer scopes narrowed),
  - `Performance` (today's CSS kill-switch **plus**: radio poll only when active, prayer tick 30 s off-Home, programme timer off unless watching, no reflection clones, capped hero decode, focus geometry cache with rAF-coalesced invalidation).
- **Global vs platform:** focus-cache + timer-governor + ingest caps = global. Decode caps, blur bans,
  and `prefers-reduced-motion`/legacy-WebKit force-light (`ui-mode.js:24`, `tv-compat.js`) stay
  platform-specific (Tizen ≤6 always starts at Balanced or lower).
- Auto mode must be measurable: sample `move()` p95 over N presses and downgrade a tier when over budget —
  never silently.

## 10. Platform notes

- **Samsung Tizen (esp. 5.0):** old WebKit → `tv-compat.js` polyfills (`closest`, `prepend`, `padStart`,
  `CSS.supports('grid')` fallback). Avoid: `backdrop-filter` (unsupported/expensive — already gated),
  `repeating-radial-gradient` large areas, `mask-image` full-screen, `backdrop blur(24px)`,
  `WeakMap`-per-press allocation is fine but `getComputedStyle`-per-button is not. `webapis.avplay`
  lifecycle is correct in Kids; Inputs uses `tvwindow BEHIND` correctly.
- **LG webOS:** `catalog.js` notes `C.Catalog.limited` + `app.js:110` LG notice — app enumeration is
  bridge-restricted; `usb.js:11` probes `com.webos.app.mediaplayer` with 2.5 s timeouts (sequential —
  up to ~7.5 s worst case; make parallel). Memory pressure: same decode caps apply.
- **Android TV / projector (`TVNative`):** Chromium — cheapest of the three for CSS, but `TVNative.*`
  calls (`radioStatus` JSON/s, `saveSettings` per theme sync in `ui-mode.js:22`) cross the bridge per
  tick/change; batch them. `IptvActivity/PlayerActivity/RadioActivity` lifecycles live outside this audit.
- No hardware benchmarks are claimed; all platform guidance is code-derived.

## 11. What was NOT the problem

- IPTV playlist parsing in this shell (bounded + cached; engine lives natively).
- `fetch` storms (no `fetch` at all; XHR only).
- Unbounded collections (all major caches capped).
- Duplicate identical listeners (count is high, duplication is not).
- Image *quality* choices (assets are high-quality; the issue is *size variants*, not art direction).
