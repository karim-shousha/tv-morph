# Android TV IPTV — recovery validation plan

Status: **NOT TESTED on hardware**. No ADB device was available; no fix was applied (per mission:
diagnose before changing). This file defines the exact bar the recovery must clear and the minimal
verified-fix set. Nothing below is claimed as done.

## 1. Reproduction prerequisites (controlled, no real credentials in logs)

- Use a sanitized fixture matching the real catalog's shape: same item counts, category counts,
  ~500 B/row metadata, same response structure — never a tiny playlist. Never paste real
  `player_api.php?username=…&password=…` URLs into logs or fixtures.
- Fix the device + build first: record `dumpsys package local.tvmorph.tv` (`versionCode`,
  `lastUpdateTime`), and confirm the installed APK matches worktree 0.8.227-preview assets.
- Isolate one variable at a time (diagnostic only, revert after): artwork off, sort bypassed
  (`order=provider`/recent), disk-read bypass, disk-write bypass, single kind only, capped row
  count. The experiment that eliminates the freeze identifies the stage — it is not the fix.

## 2. Pass criteria on the actual Android TV (all required)

1. Movies loads: first 60 cards visible, no freeze >1 s, no process death.
2. Series loads: same bar, immediately after Movies (warm switch, not cold start).
3. No `AndroidRuntime` fatal, no `OutOfMemoryError`, no `onRenderProcessGone`, no ANR
   (`Input dispatching timed out`), no unexpected process restart (`exit-info` clean).
4. No "Request timed out" on warm entry/switch with the real catalog.
5. `dumpsys meminfo` stable: Java heap returns near baseline after kind switches (no retained
   full catalogs per switch); no `lowmemorykiller` lines for the package during the run.
6. D-pad navigation across 100 cards stays responsive; focus correct (never sacrifice correctness).
7. Playback from Movies and Series works; saved accounts/subscriptions intact after all runs.
8. 5× IPTV open/exit cycles + 30-minute mixed navigation stability run, same bar throughout.

## 3. Minimal fix candidates (proposed, NOT applied — apply only after R1–R3 confirmed on device)

1. **Honor `catalogVersion` in `IptvStore.list()`**: exact-match on
   (profile, kind, category, search, order, page, catalog-time) → `{unchanged:true}` without
   disk/network/parse/sort. Mirrors the proven Samsung contract already in `app.js:106`.
2. **Make large catalogs cacheable**: chunked/larger-bounded disk representation (current 8 MiB /
   24 MiB caps silently disable caching for exactly the failing catalogs). Preserve TTL/FRESH
   semantics and interrupted-write safety.
3. **Bound the sort**: one index array per (catalog-time, mode) with entry/slot caps instead of a
   full `JSONArray` copy per mode; keep global ordering semantics and stable tie-breaks.
4. **Single-pass transform**: parse provider JSON straight into the transformed array; do not retain
   the raw provider `JSONArray` alongside it.
- Explicitly out of scope: raising T1/T4 timeouts, debouncing input, stripping animations,
  speculative worker rewrites, touching accounts/playback.

## 4. Regression guardrails for any fix

- Loading failures terminate cleanly: meaningful error, no infinite spinner, no silent empty catalog,
  no uncontrolled retry storms (existing 60 s retry gate + single-flight per key must hold).
- Cancellation and `revision` invalidation (`check(c,version)`) preserved on account switch/refresh.
- Existing features intact: Live TV, Movies, Series, search, favorites, history, categories, sort
  modes, settings, remote control, playback, platform compatibility.
- Re-run desktop fixture (71k/8.3k/11.4k) for before/after parity, then the full §2 hardware matrix.
  Desktop numbers alone never constitute a pass.

## 5. Current verdict

Root-cause audit complete; hardware verification pending. The recovery candidate is **not declared
stable**: failure class (app death vs renderer kill vs LMK vs OS reboot) is unconfirmed, memory
peaks are modeled not measured, and no fix has been implemented or retested. Next action requires
the physical TV: capture logcat + `exit-info` + `meminfo` using
`.tools/android-tv-crash/capture-android-tv-logs.cmd`, then apply the smallest fix from §3 and
repeat §2 in full.
