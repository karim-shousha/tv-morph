# IPTV large-library architecture review (read-only investigation, no code modified)

## Comparison boundary
The same device + subscription works in XCIPTV and fails in Morph TV. No claim is made about
XCIPTV internals (unknown). The observable difference is architectural: XCIPTV-style players
present categories first and load scoped pages; Morph TV's default views demand the entire
library (fetch → parse → transform → global sort) before first paint. The question below is
answered from Morph TV source evidence only.

## 1. Provider API capabilities (CONFIRMED from call sites, not provider docs)
| Source | Scoped / paged retrieval | Morph TV usage |
|---|---|---|
| Xtream (`Xtream.java:27`, `samsung-media.js` `catalog()`) | `category_id` filter on `get_live_streams` / `get_vod_streams` / `get_series` (panel-dependent; classic panels ignore it for series). **No offset/limit parameters exist** in this API family | Passed only when a category is active; default views request the whole kind |
| Portal/MAG (`PortalSource.java:28`) | **True pagination**: `get_ordered_list` with genre/category + `p` page + `total_items` | Drained fully (up to 1000 pages) into one `JSONArray`, then globally sorted — pagination benefit discarded |
| M3U (`M3uPlaylist.java:18-19`) | Whole file by nature; streaming line parse with 96 MB / 100k-row / 64 kB-line caps | Full file → full `JSONArray`; category filter applied locally afterwards |

Conclusion: the provider side *does* support scoped retrieval (category filter; Portal pages).
Morph TV collapses every path to a full in-memory catalog.

## 2. First-load pipeline (cold Movies entry, `change('vod')` → `category=''` → `load()`)
### Android TV native — `app.js:112,106` → `IptvActivity.java:26` → `IptvStore.list()` → `Xtream.list()` / `CatalogDisk`
1. `call('list',{kind:'vod',category:'',…})`, 45 s watchdog starts.
2. Single catalog thread: memory miss → `CatalogDisk.read` (decrypt+gunzip+`new JSONArray`, caps
   8 MB file / 24 MBEE decompressed; miss deletes file) → else HTTPS fetch (`ProviderHttp`, 25 s
   deadline, 24 MB cap) → full text → full raw `JSONArray` → full transformed `JSONArray` (raw still
   referenced) → `disk.save` (async, retains rows) → `CatalogOrder` full sort (names[]+dates[]+
   boxed Integer[]+new result array) → page 60 → `decorate` copies.
3. `categories()` fires a second full-category fetch in parallel (queued on the same thread).
4. First paint only after all of the above. ESTIMATE for 50k movies (~20–40 MB JSON): transient
   peak 4–8× payload bytes in Java heap (bytes + UTF-16 String + raw objects + transformed objects
   + sort auxiliaries) plus the WebView renderer process — consistent with freeze/LMK on 1 GB TV
   hardware (model, not measurement; no device attached).
### Samsung Tizen — same UI flow → `samsung-media.js` `list()` → `catalog()` → XHR + chunked IndexedDB
Same full-kind requirement, mitigated (0.8.227): cooperative mapping, worker sort, 500-row IDB
chunks, bounded order cache, `catalogVersion` short-circuit. Remaining full-kind costs: whole XHR
text + whole `JSON.parse` + whole mapped array + worker payload copy; plus Home's eager 3-kind
prefetch for 24 cards (`review193/stream-ui.js:24`, still present in spirit).
### LG webOS — identical to Samsung by build construction (`webos-app/build.py:38-44` splice,
re-verified this task), HTML5 playback instead of AVPlay. Same full-kind requirement, same
mitigations, same residual costs.

## 3. The ten questions (answers)
1. Category/pagination/incremental support? Xtream: category filter yes, pagination no. Portal:
   pagination yes (drained, not used incrementally). M3U: no.
2. Unnecessary full fetch? Yes for default "all categories" views and Home prefetch; category views
   already scope via `category_id` (when the panel honors it) and now reuse the retained full-kind
   array in memory (native fix, prior task).
3. Multiple large copies? Yes — §2 step 2 inventory (CONFIRMED code path; sizes ESTIMATE).
4. Full sort before first render? Yes on every sorted list call (default sort `az`), both backends.
5. Indexed records vs blobs? Today: blobs (whole-value IDB on Samsung legacy path; chunked 500-row
   values in 0.8.227; whole-file AES-gzip on native). No per-row index exists on any path, though
   IndexedDB natively supports object stores + `createIndex` on all target engines (M56/53+).
6. First-screen-before-full-processing? No: page slice is taken after fetch+parse+transform+sort.
   The 60-row page and cached-page fast path are the only head starts.
7. Incremental bounded-memory processing? Not today: batching an already-parsed array
   (cooperative `catalogJob`) bounds *time slices*, not *memory* — explicitly not true ingestion.
8. Visible-only artwork? Mostly yes: 60 rows/page, `IntersectionObserver` + 160 px margin,
   `revealLibraryArt` viewport gating, 2048/512 artwork-memory caps, TMDB downscaling in
   constrained mode. Not the crash driver.
9. Category nav independent of full processing? Partially: scoped `category_id` fetch exists, but
   the default landing is the unscoped view, and search scans the whole retained array per keystroke
   (`IptvStore.list` search loop; Samsung `list()` scan).
10. Shared contract, platform implementations? Yes, feasible: contract = scoped fetch → indexed
    cache → token revalidation → 60-row pages → progress decoration. Native = SQLite/file index;
    Samsung/LG = IndexedDB rows + indexes. No new universal runtime needed.

## 4. Confirmed bottlenecks (code, not assumption)
- B1: default views require the full kind (fetch+parse+transform+sort) before first paint.
- B2: Xtream has no pagination; Portal pagination is drained, never consumed incrementally.
- B3: transient duplicate materialization (raw + transformed + sort auxiliaries + disk buffers).
- B4: single-threaded catalog pipelines (native single executor; Samsung main-thread JSON.parse).
- B5: cache caps that disable caching exactly for large libraries (native 8/24 MB; IDB whole-value
  path), causing repeat full work on every entry (warm-switch cost now removed by tokens; cold cost
  remains).

## 5. Option A — Minimal recovery (preserve architecture; no approval needed beyond normal review)
1. Category-first default: land Movies/Series on the category rail with the first category
   preselected, so the first fetch carries `category_id` (small N) instead of the whole kind.
   (UX-visible but behavior-preserving; all views remain reachable.)
2. Make Home/shelf prefetch lazy and cancellable (no 3-kind eager fetch; fetch on scroll-in).
3. Consume Portal pagination incrementally (render page 1 as pages arrive; cap background drain).
4. Keep tokens/single-flight/caps; add per-kind in-flight dedup logging to prove no double fetch.
- Complexity low; compatibility: no new APIs (category_id already sent; IDB/SQLite untouched);
  memory win proportional to largest-category / whole-kind ratio; risk: category_id ignored by some
  panels for series → fallback path must detect `total` mismatch and degrade to full fetch with a
  clear message, never an infinite loop.

## 6. Option B — Scalable catalog architecture (requires approval; phased)
1. Indexed storage: native SQLite (platform `SQLiteOpenHelper`, no new dependency) with
   `(kind, category, name)` indexes; Samsung/LG IndexedDB one-record-per-row stores + `createIndex`
   (supported M56/53+), replacing blob values. Bounded queries return 60-row pages + totals via
   index counts; search becomes an index range scan.
2. Bounded ingest: native hand-rolled top-level-array streaming parser over the response bytes
   (Xtream rows are flat; ~100 lines, no dependency) writing rows straight to SQLite in
   transactions — one bytes-buffer + batched inserts, never a full `JSONArray`. JS side: keep
   `JSON.parse` but scope to category payloads (Option A makes them small); full-kind parse only as
   explicit fallback.
3. Progressive rendering: paint page 1 from first committed batch; continue ingest on the worker/
   background thread with generation-cancellation; D-pad stays live (already the pattern in `load()`
   with `generation` guards).
4. Shared contract tests: same fixture asserts identical pages/totals/sort across the three
   backends (JVM unit test for native with a fake `Context`-free parser module; existing
   `correctness.cjs` extended for JS).
- Complexity medium-high; memory: O(page + batch) instead of O(catalog); risk: new storage schema
  needs migration + corruption recovery (delete-and-refetch per kind, never global wipe).

## 7. Recommendation and phases
Evidence says the failure is B1+B3+B4, not library size per se — a scoped-first pipeline handles
the same subscription. Recommend **A now** (unblocks the failing device class with small,
reviewable diffs), then **B phased**: B1 storage + contract tests → B2 streaming ingest (native
first, where the crash bites) → B3 progressive render → parity fixtures. No SQLite-or-nothing
ultimatum: SQLite only where native (Android), IndexedDB rows where web (Tizen/LG), same contract.

## 8. Validation on the same large subscription (real hardware required)
- Fixture: sanitized copy of the failing subscription (same counts/categories/sizes; no credentials).
- Gates per phase: time-to-first-card, time-to-interactive, peak RSS (`dumpsys meminfo` /
  IDB size), warm-switch latency P95, 30-min soak, network-cut + corrupt-cache recovery, low-memory
  (`oom` adjacency) run. Distinguish device vs simulation in every table; never mark untested
  hardware passed. Desktop fixtures (71k/8.3k/11.4k) remain the regression proxy only.
