# Phase A implementation (category-first, bounded preview)

All changes are additive, behind existing contracts. No timeout raised, no input debounced,
no animations stripped, no new cache layer, no UI redesign, playback and user data untouched.

## 1. Shared UI — `android-tv/iptv/app.js` (ships on Android TV, Samsung, LG)
- **Category-first entry.** `change()` no longer requests `category=''` on first visit: it restores
  the per-profile remembered category (`tvmorph.iptv.catchoice.<profile>`) or, when nothing was
  ever chosen, waits for the category list and auto-selects the first category with a visible rail
  highlight. The explicit **All categories** rail button (pre-existing) remains the only full-library
  path and records an explicit choice (never silently substituted). Search, favorites, continue,
  recent, and episode flows are untouched and still bypass auto-select.
- **Robustness.** If the category list fails → one full-load fallback with the provider error shown
  (no infinite spinner). If the auto-picked category comes back empty → one retry as All, then the
  result stands. One retry max, both paths. Rail buttons carry `aria-current` + `active` marking.
- **Why safe:** every auto-load passes through the same `generation`/`categoryGeneration` guards,
  `catalogVersion` revalidation, and error surfacing as manual loads; `markActiveCategory` is
  DOM-local; storage keys are per-profile and additive.

## 2. Home prefetch — `android-tv/iptv/stream-ui.js` (shared Home on all platforms)
- The three Home kind-tasks now request `{order:'provider', limit:24}` instead of full sorted
  catalogs; provider-shelf fan-out is skipped while `document.hidden`. Epoch/generation guards and
  the 22 s boot fallback are unchanged. Fallback shelves keep client-side ordering (spotlight
  re-sorts by `added`, most-popular by rating); the "Recent Movies" fallback shelf now shows
  provider order instead of a globally newest-sorted 24 — documented trade, provider order is
  insertion-ordered on typical panels.

## 3. Android native — `IptvStore.java`, `Xtream.java`, `PortalSource.java`
- **Preview fetch** (`?limit`, capped 200, provider-order, no search, non-episode): full provider
  response is still downloaded/parsed (Xtream has no pagination — stated limitation), but only the
  first N rows are transformed; no disk read/write, no `ordered()` sort, no `updateLater` storm,
  `catalogVersion:""` so previews never poison the page cache or the revalidation token.
- **Portal bounded page**: new `PortalSource.listPage(kind, category, 1)` (single
  `get_ordered_list` request, `total_items` honored); `Xtream.preview` routes Portal/M3U/Xtream
  sources accordingly (M3U slices its memoized parse; Xtream transforms first N valid rows and
  reports the true total). The full drain loop for sorted/search Portal views is unchanged.
- **Prior-task synergy:** category views reuse the retained full-kind array (no second fetch);
  token revalidation short-circuits warm switches. Phase A removes the *first-load* full work that
  those did not cover.

## 4. Samsung Tizen — `mobile-app/samsung-media.js`
- `list()` preview branch mirroring native semantics: scoped-or-full `request()`, transform only
  the first N via existing cooperative `mapProviderRows`, true total from the raw array, no
  `rememberCatalog`/`diskCatalog` writes, no `orderRows` (provider order returns null immediately),
  `catalogVersion:''`. m3u falls through to the normal cached path. Metadata/account/cancellation
  semantics identical (`previewEpoch` guard).

## 5. LG webOS — derived, verified
- No LG-specific edit needed: `webos-app/build.py` splices current `samsung-media.js` (splice
  re-run against the modified file: success, preview code present) and the shared UI files at
  package time, then esbuild `--target=chrome68` (re-verified clean). LG therefore ships §1, §2,
  §4 automatically. LG playback (`player.js` HTML5) untouched.

## 6. Explicitly not done (with reason)
- Portal sorted/search still fully drains (global `az` sort needs full data for correctness;
  progressive refinement is Phase B). Home preview still downloads+parses full Xtream text
  (no-pagination API limit; streaming ingest is Phase B). Timeouts unchanged everywhere.
