# Universal IPTV architecture (as implemented)

## Pipeline map (verified from source, not assumed)

### 1. Android TV / Google TV / Fire TV — one APK, native Java backend
- Package `local.tvmorph.tv` (`android-tv/AndroidManifest.xml`, vCode 227). Leanback + Amazon
  queries present; **no separate Fire TV code exists** — Fire TV is served by this same APK.
- UI: `android-tv/iptv/app.js` (+ `tv-library.js`, settings pages) in a `WebView`
  (`IptvActivity.java:10`). JS↔native bridge: `IptvNative.request(id,action,json)` with 45 s
  watchdog (105 s connect) (`app.js:72`); results via `window.iptvResult`.
- Backend: `IptvActivity.Bridge` → `IptvStore` (memory cache ≤6 catalogs/~24 MB est, single-thread
  `catalog` executor; 2-thread pool for the rest) → `Xtream` (HTTPS via `ProviderHttp`, 25 s global
  deadline, 24 MB response cap) → `CatalogDisk` (AES-GCM + gzip files, 8 MB file / 24 MBEE
  decompressed caps, 7 d TTL, 6 h FRESH) → `CatalogOrder` (global Collator/index sort).
- Playback: platform player (`PlayerActivity`/ExoPlayer-media3); IPTV catalog path is independent.

### 2. Samsung Tizen — shared JS backend + AVPlay
- Backend: `mobile-app/samsung-media.js` (XHR + IndexedDB chunked 500-row cache + single-flight
  worker sort with cooperative fallback + `catalogVersion` revalidation). Packaged with
  `tv-compat.js` polyfills injected before locale (`mobile-app/build.py:97,104`) and esbuild
  `--target=chrome56`. Frontend: same `android-tv/iptv` UI tree packaged into the media roots.
- Playback: Samsung AVPlay (`play()` in `samsung-media.js`); radio via same bridge.

### 3. LG webOS 5+ — same backend, HTML5 playback (build-derived, verified by script inspection)
- `webos-app/build.py:38-44` splices `mobile-app/samsung-media.js`: replaces `play()` with
  `webos-app/player.js` (HTML5 `<video>`), drops AVPlay `radio()`, renames to `MorphMedia`,
  serves the shared `android-tv/iptv` + `radio` trees via `srcdoc` + `lg-bridge.js`. esbuild
  `--target=chrome68`; declared target webOS 5+ (`validation.json`). Catalog/transform/sort/IDB/
  token logic is **identical to Samsung by construction** — fixes there flow to LG automatically.
  webOS 4.x is outside the declared package target.

### 4. Out of IPTV scope (verified)
- `android-legacy` (v0.1.1, minSdk 19): local Home/Player/Playlist only; no Xtream/provider code.
- `vidaa-app`: hosted web theme/media shell (`runtime.js`); capabilities list has no IPTV catalog.
- `samsung-legacy` (Tizen 3 lite): reuses `samsung-media.js` backend (file present in
  `samsung-legacy/build/app`) with chrome47 CSS target; IPTV behavior inherits Samsung path,
  untested on Tizen 3 hardware.

## Shared vs platform-specific

| Layer | Shared | Platform-specific |
|---|---|---|
| Catalog UI, D-pad nav, search, settings | `android-tv/iptv/*` everywhere | LG `lg-bridge.js`, Samsung `samsung-media-bridge.js` adapters |
| Account/library/sort/cache semantics | contract below (code differs) | Samsung/LG: JS+IndexedDB; Android: Java+files |
| Playback | nothing | AVPlay (Tizen) / `<video>` (LG) / ExoPlayer (Android) |
| Syntax baseline | esbuild chrome56 (Tizen legacy, Android WebView) / chrome68 (LG) + `tv-compat.js` runtime polyfills | — |

## Cross-platform performance contract (engineering goals, not guarantees)
1. Open IPTV quickly; warm section switch must not refetch/reparse/resort an unchanged catalog
   (revalidation token honored on **every** backend — closed the native gap in this task).
2. First paint from cache when available; refresh in background (`FRESH`/6 h semantics).
3. Category views derive from the retained full-kind array (no second fetch) — now true on all paths.
4. No unbounded RAM: bounded order entries, bounded page cache (12/1.5 MB frontend), bounded
   artwork memory (2048 native / 512 frontend), 60-row pages.
5. Every async op has completion/cancellation/failure; no infinite spinners; timeouts are
   diagnostics, never the fix (no timeout value was raised in this task).
