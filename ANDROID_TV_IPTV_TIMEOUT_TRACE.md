# Android TV IPTV — timeout trace

All entries CONFIRMED by code inspection. No value was changed in this investigation.

## 1. Timeout inventory

| # | Source | File / function | Value | Trigger | Role in reported failure |
|---|---|---|---|---|---|
| T1 | Provider global deadline | `android-tv/src/local/tvmorph/tv/ProviderHttp.java:7` `json()` | 25 s from call start | Any provider HTTP fetch (auth, list, categories, EPG, details) | PRIMARY network bound: slow/large responses abort here with `IOException("IPTV provider request timed out.")` |
| T2 | Connect slice | `ProviderHttp.java:11` | min(8 s, remaining) | TCP+TLS setup per hop | Sub-budget of T1 |
| T3 | Read slice | `ProviderHttp.java:11,14` | min(12 s, remaining), refreshed per loop | Stalled body mid-download | Sub-budget of T1 |
| T4 | JS bridge watchdog | `android-tv/iptv/app.js:72` `call()` | 45 s (list/categories/refresh), 105 s (connect) | Any `IptvNative.request` without `iptvResult` | **This is the user-visible "Request timed out. Please retry."** SECONDARY: fires because T1-scale work + single-file catalog queue + parse/sort exceed 45 s |
| T5 | Remote latch | `android-tv/src/local/tvmorph/tv/IptvActivity.java:12` `remote()` | 5 s `CountDownLatch.await` | Phone-remote key/text while IPTV active | Unrelated to Movies/Series loading; ANR risk only if invoked on UI thread |
| T6 | Metadata memo | `Xtream.java:12-14` | 300 s reuse window, ≤1 MiB entries, ≤4 entries | `get_series_info` / `get_vod_info` only | Not on the Movies/Series list path |
| T7 | Stale-refresh gate | `IptvStore.java:65` `updateLater` | Refresh only if catalog older than `FRESH` (6 h) and last retry ≥60 s | Background refresh after serve | Not a user timeout; bounds network storms |
| T8 | Cache TTL | `CatalogDisk.java:6` | 7 d file TTL; `FRESH` 6 h | Disk read / background update | Stale data bound, not a timeout |
| T9 | Response size cap | `ProviderHttp.java:5,14` `LIMIT` 24 MiB | Throws `Provider response too large` | Huge catalogs | Fails fast, surfaces as error (not hang) |
| T10 | Disk caps | `CatalogDisk.java:12` 8 MiB file / 24 MiB gunzip | Returns null + deletes file | Large catalogs | Silent cache disable → repeat T1 work (amplifier, not timer) |

Samsung-only timers (for contrast, NOT on Android TV path): `samsung-media.js` XHR 12 s,
IndexedDB open 1.2 s, sort-worker 20 s. Absence of a worker/cancellation path on
`IptvActivity`'s single catalog thread means a stuck T1 fetch blocks all queued lists until T4 fires.

## 2. The reported "timeout error," end to end

1. User opens Movies → `list(vod)` misses memory cache.
2. `CatalogDisk.read` misses (large catalog exceeds caps → file deleted if present) — cost paid, nothing gained.
3. `Xtream.list()` → `ProviderHttp.json` downloads + parses tens of MB on a TV SoC (T1 budget), then
   full transform + `ordered()` global sort on the same single catalog thread.
4. If Series/categories were also requested (startup prefetch, `unifiedSearch` 3-way fan-out), they
   queue behind step 3.
5. 45 s elapse → `app.js:72` timer rejects → UI shows "Request timed out. Please retry." The native
   job keeps running to completion and populates caches — so a *retry* may then hit memory cache and
   succeed, which misleadingly suggests flakiness rather than systematic overload.
6. If step 3 instead exhausts heap / triggers LMK, the process dies (restart symptom) and, because
   nothing was ever cached to disk (caps), the next launch repeats from zero — matching "restarts,
   then timeout."

## 3. Verdict

- The originating user-visible timeout is **T4** (`app.js:72`, 45 s), file + line recorded above.
- It is a **secondary symptom** of R1/R2 (full refetch + full sort, no revalidation). Raising T4 (or
  T1) would lengthen the spinner, increase peak-memory exposure, and hide the blockage — prohibited
  by the mission. The fix is to remove the work (revalidation short-circuit, cacheable catalog
  representation, bounded sort), not to extend the wait.
- No timeout constant in any file was modified during this investigation.
