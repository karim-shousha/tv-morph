# Android TV IPTV — memory analysis

Method: static code audit + arithmetic capacity model. **No on-device measurement was possible**
(no ADB device). Figures below are labeled ESTIMATE (capacity math) vs CONFIRMED (code fact).
Do not cite estimates as measurements.

## 1. Copies of the catalog alive during one Movies/Series load (CONFIRMED code path)

`IptvStore.list()` (`android-tv/src/local/tvmorph/tv/IptvStore.java:48-60`) via
`Xtream.list()` (`Xtream.java:27`) and `CatalogDisk` (`CatalogDisk.java:12-13`):

| # | Copy | Where | Notes |
|---|---|---|---|
| 1 | Raw response bytes | `ProviderHttp.java:14` `ByteArrayOutputStream`, cap 24 MiB (`LIMIT`) | + `out.toString("UTF-8")` String (~2 bytes/char in JVM) |
| 2 | Parsed raw array | `new JSONTokener(…).nextValue()` → full provider `JSONArray` | org.json objects carry HashMap overhead per row |
| 3 | Transformed array | `Xtream.list()` builds second full `out JSONArray` of new `JSONObject`s while `source` still referenced | Both alive until return |
| 4 | Sort auxiliaries | `ordered()` (`IptvStore.java:5`): `String[] names` + `long[] dates` + boxed `Integer[]` + `CatalogOrder.indices` sort + new result `JSONArray` | Result holds same refs, auxiliaries are transient but large |
| 5 | Disk buffers | `CatalogDisk.read`: ≤8 MiB file → ≤24 MiB `ByteArrayOutputStream` → String → `new JSONArray`; `save` re-serializes row-by-row on writer thread holding `rows` | Read deletes file on cap breach |
| 6 | Retained caches | `cache` (≤6 entries, ~24 MiB estimate), `orderedRows` per-mode full arrays, `categoryCache`, `detailCache` (30), artwork `artworkMemory` (2048) + `rememberCatalog` eviction by `length*1024` estimate | Stale kinds evicted, then rebuilt |
| 7 | UI page | `decorate()` copies only the 60 returned items (`new JSONObject(source.toString())`) — small | Plus WebView DOM/artwork in renderer process (separate) |

## 2. Capacity model (ESTIMATE, 71,000-row Movies example)

- Provider raw JSON ≈ 350–600 B/row → ≈ 25–43 MB raw bytes. Exceeds the 24 MiB `ProviderHttp.LIMIT`
  and/or the 24 MiB gunzip cap for large providers → chronic cache miss / fetch failure.
- JVM transient peak ≈ raw bytes (1×) + String chars (~2×) + parsed raw objects (~2–4× raw in
  org.json overhead) + transformed array (~1–2×) + sort auxiliaries → plausibly **4–8× raw bytes**
  transiently, i.e. hundreds of MB for a 71k catalog, plus baseline app + WebView renderer.
- On a 1 GB-class TV (typical Android TV low RAM, per-process heap often 128–256 MB), this predicts
  GC thrash (freeze), `OutOfMemoryError`, or LMK kill — consistent with reported symptoms, but
  **unconfirmed without `dumpsys meminfo` / logcat**.

## 3. Structural defects (CONFIRMED)

1. **Caps guarantee repeated work for large catalogs**: `read` returns null and *deletes* the file
   when limits are exceeded (`CatalogDisk.java:12`), so big catalogs refetch over the network on
   *every* entry — memory and time cost paid repeatedly, never amortized.
2. **No pagination at the source**: provider returns the whole `get_vod_streams` / `get_series` array;
   paging (60/page) happens after full parse/transform/sort. Steady-state UI is 60 rows; transient
   cost is the entire catalog.
3. **Single catalog executor** (`IptvActivity.java:10`): Movies + Series + categories serialize.
   `unifiedSearch` (`app.js:59`) fires 3 parallel `list` calls that queue behind it.
4. **Sort cache is single-identity** (`orderSource`): switching kinds clears all modes → resort.
5. **Frontend/backend contract gap**: `catalogVersion`/`unchanged` is frontend-only; native always
   rebuilds (see root-cause R2).

## 4. What to measure on device (not done)

- `dumpsys meminfo local.tvmorph.tv` at: startup, IPTV open, Movies loaded, Series loaded,
  5× kind switches. Record Java heap, native heap, and `WebView` renderer (`-- ZZ` lines + `dumpsys
  meminfo` per-process for the sandbox process).
- `dumpsys activity exit-info local.tvmorph.tv` after a crash (reason + RSS at death).
- `/proc/meminfo` + `dumpsys activity oom` for system pressure; logcat `lowmemorykiller` lines.
- Redact `player_api.php?username=…&password=…` from any shared log.

## 5. Bounded-memory direction (proposal, NOT implemented)

- Honor `catalogVersion` natively: exact (profile, kind, category, search, order, page, catalog-time)
  match → return `{unchanged:true}` without touching disk/network. Smallest change, kills repeat cost.
- Stream-parse provider JSON into the transformed array directly (single pass, no raw `JSONArray`
  retained); or request per-category pages if the provider supports it.
- Sort once per (catalog-time, mode) with bounded index arrays (cf. Samsung worker approach), not a
  full `JSONArray` copy per mode; cap retained order entries.
- Chunk or compress disk cache so large catalogs are cacheable at all (current caps make caching a
  no-op for exactly the catalogs that need it).
- Serialize writes off the read path (already async) and drop the `rows` reference after commit.
