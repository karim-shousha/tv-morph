# Universal IPTV root causes (evidence-graded)

Prior reports (`IPTV_PERFORMANCE_ROOT_CAUSE_REPORT.md`, `ANDROID_TV_IPTV_*`) hold the desktop and
crash detail; this file states the per-platform causes and what changed in this task.

## Android TV native (CONFIRMED by code, fixed in this task)
- **U1. Revalidation gap (fixed):** frontend sent `catalogVersion` and handled `unchanged`
  (`app.js:106`), but `IptvStore.list()` never read it and never returned it. Every section switch
  re-ran disk-decrypt → full parse (or full HTTPS fetch) → full transform → full `CatalogOrder`
  sort, serialized on one thread behind the 45 s JS watchdog. Fix: `pageVersion()` token
  (`IptvStore.java:48-54`), early `{"unchanged":true}` return (line 62-64), token emission on every
  list response (line 72). Token covers revision/profile/viewer/kind/category/search/order/page/
  catalog-time; eviction, refresh, account change, and background-update (`updateLater`) all rotate
  it, so staleness is impossible by construction.
- **U2. Category refetch (fixed):** native had no equivalent of Samsung's full-kind memory reuse;
  each category view refetched. Fix: derive category views from retained `cache[kind+":"]`
  (IptvStore.java:65), recording only the timestamp (no subset duplication).
- **U3. Structural (accepted, documented):** 8 MB/24 MB disk caps permanently uncache large
  catalogs; org.json full-array parse + transformed-copy duplication; single-identity `ordered()`
  re-sorts on kind switch; single catalog thread. Unchanged by this task beyond U1/U2 (which remove
  the *repeat* cost — the reported regression). Cold first-load of 50k+ rows on 1 GB hardware
  remains heavy; follow-ups in `ANDROID_TV_IPTV_RECOVERY_VALIDATION.md` §3.

## Samsung Tizen (CONFIRMED earlier, verified — not re-modified — in this task)
- Inherited per-row `profile()` reads amplified by 3-kind Home prefetch; single-identity full
  sort; whole-value IndexedDB clone. Pre-existing 0.8.227 candidate addresses these (cooperative
  mapping, worker sort + fallback, 500-row chunked IDB, bounded order cache, `catalogVersion`).
- Verification in this task: `correctness.cjs` 24/24 PASS; esbuild `--target=chrome56` and
  `--target=chrome68` succeed on worktree `samsung-media.js`; `tv-compat.js` covers `padStart`,
  `includes`, `Object.entries/values`, DOM helpers for M56-class engines. Desktop fixture numbers
  (startup worst 1873→~200 ms, warm `ui.load.total` P95 ~990→~60 ms) are simulation only.

## LG webOS (dedicated audit, this task)
- Execution path is build-derived from Samsung's (splice verified working on current worktree;
  chrome68 transform of spliced output passes). Therefore U-Samsung causes/fixes apply 1:1 to the
  catalog path. LG-specific deltas: HTML5 `<video>` playback (`player.js`) instead of AVPlay;
  `srcdoc`+`<base>` media framing; no `Worker` concern beyond the shared fallback (Blob-URL worker
  with cooperative fallback — safe on Chromium 53/68). IndexedDB semantics shared with Samsung.
  No LG-only catalog bug found; no LG-only change made. webOS 4.x outside declared target.

## Fire TV / Google TV
- No code divergence: same APK/pipeline as Android TV; U1/U2 apply. No separate validation exists.

## Ruled out / deferred with reason
- Raising any timeout (T1 25 s, T4 45 s): prohibited — secondary symptoms (`ANDROID_TV_IPTV_TIMEOUT_TRACE.md`).
- D-pad `move()` per-key `getBoundingClientRect` sweeps: measured P95 ~33 ms desktop; caching rects
  risks correctness — left unmodified per "never sacrifice correctness for speed."
- Visual-effect stripping: desktop A/B showed no nav gain from disabling blur/glow; design preserved.
- New universal abstraction layer: rejected — would add overhead and diverge tested paths.
