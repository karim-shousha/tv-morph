# Universal IPTV performance results

## Automated verification executed in this task (all on desktop, none on TV hardware)
| Check | Result |
|---|---|
| `javac` (Android Studio JBR, android-34) full closure: `IptvStore` + 14 deps incl. new token/category code | **0 errors** (only pre-existing deprecation notes) |
| esbuild `--target=chrome56` on worktree `mobile-app/samsung-media.js` (Tizen 4/5, Android WebView) | PASS |
| esbuild `--target=chrome68` on worktree `samsung-media.js` (LG webOS 5+) | PASS |
| esbuild `--target=chrome56` on `android-tv/iptv/app.js` | PASS |
| esbuild `--target=chrome68` on LG-spliced media (splice re-run on current worktree) | PASS |
| `node .tools/iptv-investigation/correctness.cjs` (worker/fallback ordering, caches, persistence) | **24/24 PASS**, 20/20 workers terminated |
| LG splice anchors (`' function play('`, `' function action('`, radio-span) | present in worktree |

## Inherited desktop fixture results (simulation, 71k/8.3k/11.4k rows, 4× throttle — not TV proof)
- Startup worst longtask 1,873 → ~200 ms; warm `ui.load.total` P95 ~990 → ~60 ms; warm longtask
  worst 615 → ~162 ms; 100-input nav P95 32.9 → 36.9 ms (no nav claim); 6-cycle reopen leak fixed
  (docs 17→47 eliminated, 8→8). Raw JSON retained under `.tools/iptv-investigation/`.
- Native U1/U2 have **no desktop-executable harness** (require Android `Context`); correctness rests
  on the clean `javac` type-check plus protocol review against `app.js:103,106`. A JVM-robolectric
  style test and on-device timing remain open work — recorded as NOT TESTED, not implied.

## Per-platform result status
- Samsung: simulation-improved, compatibility transforms verified; hardware timing NOT TESTED.
- LG: inherits Samsung by build construction (splice+transform re-verified); playback path
  (`player.js` HTML5) untouched; hardware NOT TESTED.
- Android TV/Fire TV: repeat-work elimination implemented + type-checked; memory/time improvement
  projected from removed work (full fetch+parse+sort skipped on token hit), NOT measured on device.
- Tizen 3 lite / VIDAA / android-legacy: no IPTV change; no claim.
