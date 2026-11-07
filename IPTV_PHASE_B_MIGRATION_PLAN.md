# Phase B migration plan (not implemented — design only)

Goal: first paint without any full-catalog processing; bounded peak memory; same UI contract.
Phase A is the migration on-ramp: `limit`-preview and category-scoped requests already express
"give me a bounded window"; Phase B moves the bound from the transfer into storage and parsing.
No Phase A construct blocks this — preview branches are deleted, not abstracted, when replaced.

## B1. Indexed storage (per platform, same contract)
- **Android native: SQLite** (`SQLiteOpenHelper`, no new dependency): table
  `items(kind, category, name, added, payload)` with indexes `(kind, category)`, `(kind, name)`,
  `(kind, added)`; `meta(kind, category, total, fetched_at, token)`. 60-row pages + totals via
  indexed queries; search becomes `LIKE`/range scans. Migration: versioned schema, corrupt DB →
  delete file and refetch one kind at a time (never global wipe); keep existing file-cache during
  transition, then remove it.
- **Samsung/LG: IndexedDB rows + indexes**: one object store per kind (or single store with
  `keyPath` + `createIndex` on kind/category/name/added — supported since M56/Chromium 53+), 500-row
  commit batches reusing the existing chunking discipline. Same page/total/search contract.
- **Contract tests first**: shared fixture asserts identical pages, totals, and order across the
  three backends before any UI cutover (extend `correctness.cjs` + a JVM test with an Android-free
  parser module).

## B2. Bounded ingest
- **Native:** hand-rolled top-level-array streaming parser over the response bytes producing compact
  rows straight into SQLite batches — O(page+batch) memory, no full `JSONArray`, no transformed
  copy. ~100 lines, no dependency; Xtream rows are flat.
- **Web:** keep `JSON.parse` but only over category-scoped payloads (Phase A makes these small);
  full-kind parse becomes an explicit, messaged fallback. Portal: consume `listPage` progressively
  (render page 1, continue in background with generation guards) instead of draining.
- **Progressive render:** paint page 1 from the first committed batch; continue ingest on worker/
  background thread; D-pad stays live via the existing `generation` guards. Search streams matches
  until 60 fill or source exhausts, with cancellation.

## B3. Sequencing and validation
1. Contract + fixtures (shared). 2. Native SQLite + streaming ingest (crash device first).
3. IDB row stores (Samsung, then LG by derivation). 4. Portal progressive + UI cutover. 5. Remove
   blob/file-cache paths after soak. Each step: same-large-subscription hardware gates from the
   architecture review (time-to-first-card/interactive, peak RSS, P95 switch, 30-min soak,
   network-cut, cache-corruption). Regression risks: schema migration on user devices (mitigate with
   versioned stores + per-kind rebuild), panel `category_id` gaps (keep the Phase A empty-category
   fallback), Portal `total_items` drift (clamp + re-query).
