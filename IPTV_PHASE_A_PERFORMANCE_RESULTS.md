# Phase A performance results (desktop fixture, simulation — not TV proof)

Fixture: 71,000 movies / 8,300 series / 11,400 live / 1,200 categories, synthetic SVG artwork,
headless Edge, 4× main-thread throttle. `.tools/iptv-investigation/profile.cjs` extended
(test-only) so the mock provider honors `category_id` like a real panel; nothing else changed.
BEFORE = archived 0.8.226 UI+backend (always-full entry). AFTER = worktree with Phase A
(category-first entry, preview Home, token revalidation). Raw JSON retained next to prior runs.

| Measure | BEFORE | AFTER |
|---|---|---|
| Movies/Series cold entry (`sectionsCold` `ui.load.total` P95) | 797 ms | **212 ms** (categories + scoped ~60-row load) |
| Warm kind switch (`sectionsWarm` `ui.load.total` P95) | 852 ms | **77 ms** |
| Warm backend sort (`backend.order.sync` P95) | 482 ms | **0.2 ms** (scoped transform, no global sort) |
| Warm backend list (`backend.list.vod.total` P95) | 833 ms | **0.4 ms** (token/`unchanged` short-circuit) |
| Warm longest task (worst) | 546 ms | **136 ms** |
| Startup longest task (worst) | 1,859 ms | **197 ms** (no 3× full transform/sort on Home) |
| 100-input D-pad P95 | 30.7 ms | 32.3 ms (no change, as designed) |
| Page errors | none | none |

What the numbers prove and what they do not:
- Category-first entry eliminates the 71k-row transform + global sort from first paint; warm
  switches skip all backend work via the token. D-pad responsiveness is preserved.
- Residual, honestly reported: Home first paint still waits on full Xtream download + `JSON.parse`
  (AFTER startup `backend.list.vod.total` ≈ 3.2 s in-fixture, parse-bound at 4× throttle), only
  without the blocking transform/sort. True time-to-content independence needs Phase B streaming
  ingest. Native Java has no desktop harness — its paths are `javac`-clean (15-file closure,
  0 errors) and protocol-reviewed, NOT measured; device timing is pending.
- Checks run: `correctness.cjs` 24/24; esbuild chrome56 (app.js, stream-ui.js, samsung-media.js)
  and chrome68 (samsung-media.js, LG-spliced output) all clean; LG splice re-verified.

Pending hardware (unchanged requirement): same-large-subscription runs on Android TV, Tizen 4/5,
LG webOS 5+, Fire TV — cold/warm entry, category switch, search, playback, 30-min soak, low-memory.
No production-readiness claim is made.
