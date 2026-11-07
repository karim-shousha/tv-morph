# IPTV performance recovery changes

Local candidate: 0.8.227. Production remains 0.8.226. Initial diagnosis was recorded before product changes; see `IPTV_PERFORMANCE_ROOT_CAUSE_REPORT.md`. This is a targeted data/lifecycle recovery, not a replacement of the redesigned UI. Physical-TV acceptance is not asserted.

## Exact changes and why

1. **`mobile-app/samsung-media.js`, catalogue transformation and artwork normalization.** Capture the request's provider base once; stop reading/parsing the saved account for each artwork URL. Transform provider rows in finite cooperative batches, checking the source epoch. Existing artwork validation, relative URL resolution, metadata fields and invalid-ID filtering remain. Transformation work is serialized to avoid simultaneous unbounded jobs.
2. **Same file, global sorting.** Keep global alphabetical/date sorting and stable provider-index tie breaks. Move large collation into one short-lived classic Worker when supported; pass only names/dates and return index arrays. Terminate/revoke resources on success, error, timeout, refresh and close. Use bounded cooperative merge/native-run sorting when workers are absent/blocked. This replaces the previous synchronous full-array sort on the UI thread.
3. **Same file, existing sorted cache.** Replace its one-array identity lifetime with source-revision/query keys and bounded index arrays: at most eight entries and 200,000 index slots. Entries do not retain the complete provider row objects. Duplicate in-flight sorts share a job. Refresh/source changes invalidate work. Version timestamps are bounded to twenty-four entries independently of raw-array eviction.
4. **Same file, existing IndexedDB cache representation.** Retain the existing database/store, but store 500-row chunks and a small commit manifest instead of cloning a whole large catalogue as one value. Serialize writes; commit the manifest after all chunks. Interrupted/missing chunks are cache misses. Key-only cleanup retains at most twelve committed catalogues and removes obsolete/orphan chunks. The new schema prefix prevents accidental interpretation of old whole-array records. Preserve the exact catalogue timestamp across disk/memory so sorting and revalidation do not become stale or needlessly invalidate. Keep the in-flight catalogue result available until its cache write completes to avoid duplicate provider requests while data is being persisted.
5. **`android-tv/iptv/app.js` and the same Samsung/webOS backend, page revalidation.** Reuse the existing twelve-page UI cache. Store/pass a catalogue-version token covering source epoch, account, viewer, content kind, category, search, sort, page and catalogue time. An exact fresh match returns a small unchanged response instead of deserializing the full catalogue again. Refresh playback progress independently. This uses the backend's existing six-hour freshness policy, not an additional arbitrary UI delay. Older native bridges that do not return tokens keep their original list behaviour. A preliminary 30-second shortcut was removed before final verification.
6. **IPTV `media-theme.js`, `media-performance.js`, `cinematic-theme.js`, `text-size.js`.** Remove their eight parent-window subscriptions on pagehide/unload. Disconnect the text observer during teardown. These were measured retaining detached iframe realms after each close. Theme, font and performance behaviour while the page is open is unchanged.
7. **IPTV `stream-ui.js`.** Replace its hero-details `finally` cleanup with an equivalent cleanup after the existing swallowed-error chain, avoiding the missing Promise API on older Chromium. No remote-input debounce is added.
8. **`android-tv/build.py`, IPTV assets only.** Transform native IPTV scripts for Chrome 56 syntax and load the existing compatibility helpers before locale/UI. The previous native package contained untransformed optional chaining in two scripts. Samsung already uses the Chrome 56 target and LG remains on its declared Chrome 68/webOS 5+ target. No broad launcher/radio rewrite is included.

## Measured before/after, matched desktop fixture

These are 1920x1080 desktop Chromium results with 4x main-thread CPU throttling, 71,000 movies / 8,300 series / 11,400 channels / 1,200 categories and delayed synthetic SVG artwork. They are not target-TV measurements. Samples are small for section switches; read raw JSON rather than extrapolating a hardware guarantee.

| Measurement | 0.8.226 baseline | Recovery source candidate |
|---|---:|---:|
| Startup longest observed task | 1,873 ms | 187 ms |
| Warm section-to-second-RAF mean / median | 568.7 / 850.5 ms | 143.0 / 146.8 ms |
| Warm section-to-second-RAF P95 / worst, n=10 | 1,002 / 1,002 ms | 171 / 171 ms |
| Cold section-to-second-RAF worst, n=2 | 929.5 ms | 678.1 ms |
| Warm longest observed task | 615 ms | 162 ms |
| 100 alternating navigation inputs P95 | 32.9 ms | 36.9 ms |

Section work improved in this fixture. **No D-pad latency improvement is claimed from the last row**; navigation was already comparatively responsive after earlier fixes. Second RAF approximates a presentation opportunity, not actual pixels on a TV. Worker threads are not necessarily throttled identically to the renderer main thread by desktop DevTools.

The packaged candidate was additionally exercised with JPEG 500x750 fixtures: warm section P95 167.7 ms; 100-input navigation P95 32.9 ms. A serpentine D-pad test visited 100 distinct cards across two pages, not merely alternating between two cards; its 98 directional moves had P95 27.3 ms. JPEG and SVG runs are reported separately.

## Memory teardown verification

Six close/reopen cycles with forced GC after closure:

| Counter | Baseline first -> last | Recovery first -> last |
|---|---:|---:|
| Documents | 17 -> 47 | 8 -> 8 |
| DOM nodes | 2,194 -> 7,499 | 1,103 -> 1,103 |
| Event listeners | 349 -> 389 | 341 -> 341 |
| JS heap | 7.82 -> 14.57 MB | 6.51 -> 6.60 MB |

The remaining small heap difference is not a claim of zero allocation. Active-session memory/image/native-compositor retention is a separate test and must not be inferred from a closed-frame test.

## Correctness and rejected approaches

Twenty-four tests passed for worker/fallback global ordering, duplicate-name stability, missing dates, provider order, job coalescing/cancellation, captured provider artwork base, invalid IDs, 500-row persistence, stable timestamps, missing/interrupted chunks, bounded retention, exact page revalidation, page-token isolation, fresh progress, refresh invalidation and metadata bounds. All twenty workers created by that test were terminated.

An initial entirely cooperative sorter made cold completion 4,861 ms despite reducing main-thread blocking. It was rejected. Evidence remains in `cooperative-trial-cpu4.json`; it is not described as a successful optimization.

## Visuals and adaptive performance

Isolated desktop quality/blur-off/glow-off/motion-off traces used JPEG artwork and eighty inputs per case. Paint CPU totals were about 273.7 / 276.0 / 302.9 / 98.3 ms respectively; input-to-second-RAF P95 was 29.5 / 29.9 / 30.0 / 32.5 ms. Disabling blur/glow did not improve that measured workload; removing motion reduced paint activity but did not improve P95. These are not real TV GPU measurements. No visual effect or existing user preset was automatically disabled as a purported fix.

Existing quality/balanced/performance modes and user effect overrides remain. Capability detection chooses worker/fallback processing without creating competing brand/resolution-based profiles. Existing conservative low-capability rendering rules are audited, not expanded.

## Remaining risks / acceptance limits

- Physical Tizen 4/5, LG and low-power Android hardware were unavailable; no universal freeze/crash resolution is claimed.
- 1,200-category layout still produces observable 100â€“200+ ms tasks in desktop stress scenarios. Active result DOM is sixty tiles; category virtualization was not introduced without a separately verified focus/scroll design.
- Full provider JSON parsing, network/decoder cost and total large-catalogue memory still exist. Chunking controls individual persistence transactions; it does not make the entire source payload smaller.
- Worker/CSP absence uses the tested cooperative fallback and can make cold sorting take longer. Actual legacy-engine timing remains pending.
- LG webOS 4.x is outside the existing webOS 5+ package target. Changing a syntax target alone would not certify its layout, runtime or native playback.
- Native AVPlay/codec playback was simulated only for UI lifecycle; actual video, seeking, audio/subtitles and provider behaviour require hardware tests.
- The final Promise/native-packaging compatibility corrections have separate API-absence/syntax checks; long-session performance provenance must distinguish those from the earlier performance-core bundle.

Long-session final results and final package validation are recorded in the device test matrix. Temporary instrumentation stays in `.tools/iptv-investigation/`; it is not shipped.


## Completed continuous run (2026-10-30)

The packaged performance core completed 901,560 ms (15 minutes), with 12,646 directional inputs, 63 mocked AVPlay playback enter/leave cycles, three iframe reopens, repeated settings, and Movie/Series/Live/Home switches. There were zero JavaScript errors and zero sampled off-screen focus errors. Per-minute input-to-second-RAF P95 ranged from 29.5 to 30.6 ms. Large-category section tasks still reached 441 ms; this does not establish a zero-freeze guarantee.

Memory acceptance is INCONCLUSIVE for this continuous run: Playwright waitForSelector returned undisposed ElementHandles for playback overlays and Home cards, retaining detached documents. Global document counts increased even though active-frame nodes remained bounded at 2,047 in catalogue mode. The harness was corrected after this run. The isolated six-cycle close/reopen test with disposed handles remains the valid evidence for the parent-listener fix; continuous-session memory stability is not claimed.

The final package differs from the long-run package only in iptv/stream-ui.js: Promise.finally was replaced with an equivalent then after catch for older engines. Native Android IPTV assets were also transpiled to the declared older target and load the existing compatibility shim. All 37 JavaScript files across final Samsung and native Android IPTV payloads passed ES2017 parsing. Final missing-API simulation removes Worker, PerformanceObserver, IntersectionObserver and Promise.finally; its results are recorded separately. No physical television, decoder or GPU-memory certification is implied.

Evidence: `.tools/iptv-investigation/packaged227-soak15m-cpu4.json`.

Final missing-API simulation completed with zero JavaScript errors, twelve section switches, 100 distinct cards and five settings cycles. Worker/PerformanceObserver/IntersectionObserver/Promise.finally were absent. This validates compatibility paths, not physical device speed.
