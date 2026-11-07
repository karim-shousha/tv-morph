# Universal IPTV fixes (exact changes, this task + inherited)

## A. New in this task — Android TV native (`android-tv/src/local/tvmorph/tv/IptvStore.java`)
1. `pageVersion()` (lines 48–54): opaque token
   `[revision, profileId, viewerId, kind, category, searchLower, order, page, catalogTime]`.
2. Revalidation short-circuit (lines 62–64): exact token match → `{"unchanged":true}` with no
   disk/network/parse/sort. Guards: kind-validity and account checks run first; empty tokens never
   match (`!known.isEmpty()`); revision/profile/viewer/epoch changes rotate the token.
3. Token emission (line 72): every `list` response carries `catalogVersion`; the existing frontend
   (`app.js:103,106`) already stores, echoes, and honors `unchanged` — **no frontend change needed**
   (round-trip verified by code-path inspection: send ⟺ cached page exists ⟺ `hadCachedPage`).
4. Category derivation (line 65): non-empty category views filter the retained full-kind array and
   record its timestamp only — mirrors Samsung `serve(cache[kind+':']).filter(...)`; no subset is
   cached, no duplicate memory.
- Why: eliminates all repeat full-catalog work on warm switches/returns/repeat searches — the
  reported freeze/timeout loop — with the smallest diff that preserves global sort semantics,
  account isolation, cancellation (`check(c,version)`), and refresh invalidation.
- Compatibility: pure additive JSON field + one new response shape the frontend already handles;
  older frontends ignore unknown `catalogVersion`. No syntax/API change; Java 8 source level kept.

## B. Inherited (pre-existing worktree, verified not broken by A)
- Samsung/LG backend recovery (`mobile-app/samsung-media.js`): cooperative mapping, worker sort +
  fallback, chunked IDB, bounded order cache, token revalidation — see
  `IPTV_PERFORMANCE_FIXES.md`. Flows to LG via `webos-app/build.py` splice (re-tested here).
- Frontend page cache + `unchanged` handling (`android-tv/iptv/app.js`), teardown cleanup
  (`media-theme.js`, `media-performance.js`, `cinematic-theme.js`, `text-size.js`), `tv-compat.js`
  polyfills, chrome56/68 esbuild targets.

## C. Deliberately not changed
- No timeout raised anywhere. No debounce added to remote input. No animations stripped. No new
  cache layer introduced (reused existing `cache`/`loadedAt`/page-cache lifetimes and bounds).
- No UI redesign; playback paths untouched on all platforms; user data (accounts, favorites,
  history, progress) untouched — `refresh()`/`clear()` semantics unchanged.
