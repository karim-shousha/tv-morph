# IPTV performance root-cause investigation

Investigation started 2026-10-30. Initial diagnosis recorded before any product-code modifications in this investigation. Current baseline is packaged release 0.8.226; source checkpoint `d63f6bb` contains the actual 0.8.147 IPTV implementation and Samsung data bridge. The source tree contains pre-existing, uncommitted work; it was not reset. Test-only extraction, instrumentation and fixtures are under `.tools/iptv-investigation/`.

## Confirmed primary causes

The measured remaining section-switch freeze is primarily synchronous catalogue preparation in the shared Samsung/webOS JavaScript backend, not the execution time of the current D-pad handler. The iframe and its parent share the renderer main thread. An asynchronous network response does not make its subsequent JSON transformation or sorting asynchronous.

1. **P0: main-thread catalogue transformation.** The new Home requests complete Movie, Series and Live catalogues to obtain their first 24 cards. `mobile-app/samsung-media.js:catalog()` maps every provider record synchronously. `providerImage()` reads and parses the saved account for every artwork URL and constructs a URL with its base for every record. This per-row pattern also exists in 0.8.147: it is an inherited bottleneck amplified by the new Home's eager three-kind loading, not a newly introduced function. Current-release startup with 71,000 movies produced an observed 1,873 ms long task in the throttled desktop fixture. V8 startup self-samples attributed approximately 829 ms to `providerImage`, 335 ms to the instrumented JSON parser, and 132 ms to garbage collection. These are sampled CPU attribution figures, not hardware GPU measurements or exact per-record costs. The instrumentation also contributes overhead (including approximately 143 ms of `performance.now` self-samples); final comparisons must use the same diagnostics and include a lower-overhead control.
2. **P0/P2: full-catalogue collation on repeated section switches.** `orderRows()` has one `orderedSource` identity and one `orderedRows` object. Switching to another catalogue invalidates the previous sorted result. Moreover `rememberCatalog()` estimates every row at 1,024 bytes and evicts other raw catalogues when its 24 MiB estimate is exceeded; returning to an evicted catalogue reconstructs its full array from IndexedDB. Ten alternating warm Movie/Series requests still performed ten sorts. Sort synchronous P95 was **538.4 ms**, worst **538.4 ms**; corresponding long tasks reached **615 ms**. This directly reproduces the reported section-switch pause. The UI creates only 60 result tiles; tile creation P95 was **13.5 ms**, so rendering tens of thousands of cards is not the explanation in this fixture.
3. **P2: category processing is broader than necessary, but not yet established as the dominant pause.** The fixture creates 1,201 category buttons and around 2,050 total iframe nodes. `category-order.js:apply()` repeatedly uses `indexOf` inside its sorting comparator; `tv-library.js:decorate()` revisits every category when either items or categories change. These are measurable candidates, not permission to refactor them without isolated tests.

## Existing focus recovery versus the remaining regression

The existing 0.8.225 focus fixes are already in 0.8.226: bounded Home row/position caches, candidate-only category measurements, and delayed *hero content* refresh. They do not delay the actual focus movement. In the current 100-input catalogue sequence at 4x desktop CPU throttling, input-to-second-RAF median was **24.6 ms**, P95 **32.9 ms**, worst **40.3 ms**. A second RAF is a presentation opportunity proxy; it is not a measurement of actual TV pixels becoming visible. Other focus paths, live preview, long lists, layout changes and settings still need correctness/latency checks.

## Old versus new architecture

| Area | Actual 0.8.147 checkpoint | Packaged 0.8.226 |
|---|---|---|
| Home | Portal buttons and watch-history cards; no `stream-ui.js` | Hero, multiple shelves and automatic full three-kind catalogue requests |
| Default catalogue work | Provider response transformed; UI sorts only its returned page | Backend globally sorts the full catalogue before returning a page |
| Sorting semantics | Page-local alphabetical order; recent may sort globally | Global alphabetical/date order; this functional improvement must be preserved |
| Catalogue retention | Same estimated raw-memory cap; older value-cursor disk cleanup also deleted a single catalogue above its estimate | 24 MiB estimated raw cache plus single-source sorted-result identity |
| UI modules | Nine script references and seven stylesheets | Additional Stream UI, settings pages, category manager and other feature layers; shared base modules remain loaded |
| Data/UI execution | Samsung JavaScript data bridge in parent; Android uses native workers | Same Samsung parent/iframe thread; webOS build reuses Samsung catalogue implementation; Android catalogue requests use a separate native executor |

The old executable baseline is reconstructed from archived source inside the current shell using the same transport adapter. It is not an old TV running an original signed installation. Cold and warm tests must be separated: the old Home did not prefetch the catalogues, so its first Movie entry does work that the new Home already performed. A simple first-entry comparison would be misleading.

## Caches already present

Before considering any caching change: raw catalogue memory (estimated 24 MiB, up to six entries); IndexedDB whole-catalogue records (up to twelve records); one-source sorted results; UI localStorage page cache (twelve pages of up to sixty records, approximately 1.5 MB); Home snapshots and up to three account entries; small metadata cache; artwork recovery cache. A fix must use or correct these existing lifetimes and bounds, not add an independent competing cache. Refresh/account changes and asynchronous stale results must remain safe.

## Instrumentation and reproducibility

`profile.cjs` injects `diagnostic.js` only into local fixture pages; shipping bundles have not been instrumented. It uses `performance.now`, bounded in-memory samples, geometry/storage counters, focus timing and capture-phase input timestamps followed by RAFs. PerformanceObserver long tasks are optional. No per-key console logging or production polling is added. Function wrappers separate synchronous entry work from promise completion. V8 CPU samples are recorded separately. Detailed JSON is retained for inspection rather than treating JS duration as frame latency.

Baseline environment: Windows desktop, AMD Ryzen 9 7950X3D, about 127.2 GiB host RAM, installed Microsoft Edge in headless Chromium mode, 1920x1080, CPU throttle 4. A Samsung user-agent string only exercises application compatibility branches; it does not emulate a Samsung engine, GPU, RAM limit, decoder or TV. Fixture: 71,000 movies, 8,300 series, 11,400 live channels, 1,200 categories; synthetic delayed SVG artwork. Real large JPEG decoding/network behaviour is not represented. `adb devices -l` found no connected device. No physical-device pass is claimed.

## Background, rendering and compatibility audit

- Shared launcher slideshow is guarded by Home visibility; IPTV hero timer checks dashboard/document visibility. Two clock systems remain mounted (cinematic and stream); both have minute cadence. Prayer tick remains intentionally active for alarms. Global background work needs timed observation, not blanket removal.
- Normal text scale already exits without walking all text nodes. Custom text scale can scan and restyle the full body; benchmark it separately before changing font behaviour.
- Home offscreen artwork is bounded by existing request concurrency and viewport loading. Hidden Home releases image sources; provider metadata still transforms all records. These are distinct workloads.
- Low-capability media mode already disables blur/glow. Large gradients, focus shadows, scaling and compositing remain suspects on actual GPUs; no GPU improvement is claimed from a CPU-only desktop test. Isolated visual-effect A/B traces and physical TV validation remain required.
- Existing Performance Mode has quality/balanced/performance tiers. The media adapter maps tiers to existing light/full behaviour, with conservative capability overrides. Do not introduce another auto-switching system or classify solely by brand/resolution.
- Official engine references: [Samsung web engine specifications](https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html) list Tizen 4 as Chromium M56 and Tizen 5 as M63. [LG web API/engine specifications](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine) list webOS 4.x as Chromium 53 and webOS 5.x as Chromium 68. Current desktop Chromium does not prove compatibility with these engines. The published LG package currently targets webOS 5+; older LG is not silently declared supported.

## Initial targeted recovery decision

Measurements justify first removing repeated saved-account reads from per-row artwork normalization, breaking catalogue preparation and full sorting into bounded cooperative jobs, and correcting the lifetime/bounds of the existing sorted-order cache. Global sorting semantics, source invalidation, stable tie-breaking, account isolation and cancellation must be tested. Category/visual/background changes are deferred unless subsequent isolated measurements establish material cost. No product change was made before this diagnosis was recorded.

Further measurements, fixes and acceptance status will be appended after implementation and verification. This initial report is not a declaration that all acceptance criteria have passed.


## Archived baseline and rejected first recovery trial

The reconstructed 0.8.147 baseline was actually run, not assumed fast. At this large fixture it was worse on repeated section loading: warm section completion-to-second-RAF P95 2,184 ms and warm long-task worst 1,449 ms; provider requests repeated six times per kind. Its value-reading IndexedDB cleanup estimates 71,000 rows above its 48 MiB budget and deletes that catalogue. Thus this available checkpoint does **not** reproduce the user's remembered fast version at this size. It is valid architectural evidence but cannot establish which exact historical installation was fast on the user's TV. No invented old-hardware comparison is made.

The first bounded cooperative sorting trial reduced warm sort entry P95 from 538.4 to 0.2 ms and startup long-task worst from 1,873 to 499 ms, but cold section completion increased to 4,861 ms. This trial fails the cold-switch acceptance goal and is not an acceptable final fix. Evidence is retained as `cooperative-trial-cpu4.json`. Next targeted experiment: use a small, single-concurrency Web Worker for full collation where supported (plain metadata only; terminate when finished), retaining cooperative fallback and bounded existing order-cache indices. This is justified by the measured synchronous collation, not a speculative general architecture replacement.


## Residual section cost isolated after moving collation

A section-only V8 profile of the worker candidate attributed approximately 1,490 ms across twelve switches to IndexedDB catalogue `get.onsuccess`, plus 133 ms to the native IDB result getter. Warm section-to-second-RAF P95 remained about 498 ms. The existing UI page cache already paints the same sixty records immediately but unconditionally requests the full backend list again. That rereads/deserializes an entire evicted catalogue despite a page being only seconds old. Targeted next correction: honor a short freshness window in this **existing** cache, update playback progress separately, and retain explicit refresh/account/sort invalidation. This does not introduce a second page cache. The backend already considers catalogues fresh for six hours, so a 30-second UI freshness window does not invent a longer provider refresh policy.


## Conditional revalidation and remaining cold task

The 30-second freshness trial was replaced before final verification. The frontend now passes the cached page's catalogue-version token. The backend checks that exact account/viewer/query/page/sort revision against existing bounded `catalogTimes` metadata, without deserializing the full catalogue; progress is fetched separately. Explicit refresh, source changes and actual catalogue updates invalidate it. Android bridges that do not return a token retain their original behaviour.

Cold startup still has 450â€“560 ms long tasks after cooperative metadata mapping, even with full collation moved to a worker. Existing `diskCatalog` stores and retrieves tens of thousands of records as one IndexedDB value. The synchronous structured-clone work at put/get boundaries remains a main-thread bottleneck. The targeted storage experiment keeps the existing DB/store/cache API but partitions values into 500-row chunks and a small commit manifest, processes chunks in separate transactions, serializes writes, and uses key-only cleanup. It must preserve bounded catalogue retention, refresh timestamps, interrupted-write safety and existing account cancellation. This storage representation change is justified by measured full-value deserialization and the failed smaller fixes; it is not a UI rewrite.


## Confirmed P3 retained-frame leak

A six-cycle close/reopen experiment with forced garbage collection **after closure**, not just a code suspicion, measured nodes 2,194 -> 7,499, documents 17 -> 47, listeners 349 -> 389 and JS heap 7,815,012 -> 14,567,256 bytes. The increment is exactly eight parent-window subscriptions per reopen: media-theme (2), media-performance (1), cinematic-theme (2), and text-size (3). These callbacks belong to the iframe realm and were never removed, retaining detached iframe documents. Parent subscriptions require pagehide/unload cleanup. Test ElementHandles were explicitly disposed to avoid attributing test-tool retention to the application. Fix and same-method after measurements follow separately.


## Historical redesign provenance

The actual isolated 0.8.193 review APK was recovered from release commit `07502af`; its 37,745,969 bytes matched published SHA-256 `af57f97ea263268f42339ed781799b3431f931c9cdc2f4140e15d927a7a43d35`. The extracted `review193/stream-ui.js:24` already introduces all-three-kind Home list requests to show twelve cards per kind. Lines 30â€“31 rebuild navigation groups on every key and sort them with repeated `getBoundingClientRect` calls. The APK's embedded Samsung bridge already has `orderRows` with the single-source identity and full-catalogue sorting. This identifies concrete redesign-era changes, rather than assuming every inherited cost was introduced by the redesign. It establishes that these changes were present in 0.8.193 review; it does not establish the first production release or which exact version the user remembers as fast.

## Compatibility findings before correction

Static ES2017 parsing of the native Android IPTV payload found unsupported newer syntax in `app.js` and `tv-library.js`; Android packaging copied them without the Chrome-target transform used by Samsung/LG. [Chrome's official release notes](https://developer.chrome.com/blog/new-in-chrome-80) identify optional chaining as a Chrome 80 addition. This is an actual older-WebView parse compatibility risk, not a measured Android-device slowdown. A scoped native-IPTV packaging transform is warranted.

`stream-ui.js` also uses `Promise.prototype.finally` to release the hero-details busy flag. [V8's feature documentation](https://v8.dev/features/promise-finally) places support at Chrome 63; Tizen 4's M56 needs an equivalent then/catch cleanup path. The final compatibility correction must be tested with that API absent. No new performance-profile system or brand-only device classification is introduced.


## Completed continuous run (2026-10-30)

The packaged performance core completed 901,560 ms (15 minutes), with 12,646 directional inputs, 63 mocked AVPlay playback enter/leave cycles, three iframe reopens, repeated settings, and Movie/Series/Live/Home switches. There were zero JavaScript errors and zero sampled off-screen focus errors. Per-minute input-to-second-RAF P95 ranged from 29.5 to 30.6 ms. Large-category section tasks still reached 441 ms; this does not establish a zero-freeze guarantee.

Memory acceptance is INCONCLUSIVE for this continuous run: Playwright waitForSelector returned undisposed ElementHandles for playback overlays and Home cards, retaining detached documents. Global document counts increased even though active-frame nodes remained bounded at 2,047 in catalogue mode. The harness was corrected after this run. The isolated six-cycle close/reopen test with disposed handles remains the valid evidence for the parent-listener fix; continuous-session memory stability is not claimed.

The final package differs from the long-run package only in iptv/stream-ui.js: Promise.finally was replaced with an equivalent then after catch for older engines. Native Android IPTV assets were also transpiled to the declared older target and load the existing compatibility shim. All 37 JavaScript files across final Samsung and native Android IPTV payloads passed ES2017 parsing. Final missing-API simulation removes Worker, PerformanceObserver, IntersectionObserver and Promise.finally; its results are recorded separately. No physical television, decoder or GPU-memory certification is implied.

Evidence: `.tools/iptv-investigation/packaged227-soak15m-cpu4.json`.

Final missing-API simulation completed with zero JavaScript errors, twelve section switches, 100 distinct cards and five settings cycles. Worker/PerformanceObserver/IntersectionObserver/Promise.finally were absent. This validates compatibility paths, not physical device speed.
