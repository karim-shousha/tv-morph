# Android TV IPTV crash — root-cause investigation

Status: code-evidence audit only. No Android TV device was connected (`adb devices` empty via
`C:\Users\Admin\AppData\Local\Android\Sdk\platform-tools\adb.exe`), so no logcat was captured and
no failure class is log-confirmed. No code was changed in this investigation; the 0.8.227 recovery
candidate worktree was preserved as found.

## 1. Preserved evidence

- HEAD: `fff41ebc52025826c894dc6de84ea8b867a9ab46`, branch `codex/perf-recovery-impl`.
- Full worktree file list snapshot: `.tools/android-tv-crash/worktree-status.txt` (uncommitted
  recovery modifications present, not reset).
- Worktree build identity: `android-tv/AndroidManifest.xml:1`
  `package="local.tvmorph.tv" android:versionCode="227" android:versionName="0.8.227-preview"`.
- Whether the *installed* TV build contains the recovery changes is **NOT VERIFIED**. The worktree
  is 0.8.227-preview, but install provenance must be checked on the device (see §6 commands:
  `dumpsys package local.tvmorph.tv`, compare `versionCode`, and confirm asset dates after install).

## 2. Pipeline trace: Movies/Series entry (Android TV native path)

Android TV does **not** use `mobile-app/samsung-media.js`. Its pipeline is:

1. Frontend `android-tv/iptv/app.js:106` `load()` → builds `listQuery`, renders cached page if present,
   then `call('list', …, [catalogVersion])` (`app.js:72`, 45 s default / 105 s connect).
2. Bridge `IptvActivity.java:26` `Bridge.request()` dispatches `list`/`categories` onto a **single**
   `catalog` executor thread; everything else onto a 2-thread worker pool.
3. `IptvStore.java:48-60` `list()`:
   - memory cache → `CatalogDisk.read` → network `Xtream.list()` / `episodes()` → `disk.save`.
   - **ignores `payload.optString("catalogVersion")` entirely** — no `unchanged` short-circuit exists
     natively. The Samsung `unchanged` optimization was never ported. CONFIRMED by inspection.
   - line 55: `all = ordered(all, …)` — full global sort on **every** call for az/za/oldest/newest.
   - lines 57–59: page slice of 60, `decorate()` per returned item only.
4. `Xtream.java:27` `list()`: full provider-array walk → per-row `new JSONObject` subset +
   `rememberImage`, while the raw provider `JSONArray` is still referenced (two full arrays alive).
5. `CatalogDisk.java:12-13`: read caps — file >8 MiB, decompressed >24 MiB, or older than 7 d →
   returns null **and deletes the file**; save is async on a writer thread holding the `rows` ref.

## 3. Ranked causes (evidence-graded)

### R1 — CONFIRMED (code): large catalogs can never be cached → full refetch/parse/sort on every entry
`CatalogDisk.read` caps (8 MiB compressed / 24 MiB decompressed) mean a real Movies/Series catalog
(tens of thousands of rows) permanently misses disk cache: each entry does full HTTPS fetch
(`ProviderHttp`, 25 s deadline) + full JSON parse + full transform + full global sort, serialized
behind one catalog thread. On a slow TV CPU this is the prolonged-loading + freeze mechanism.
`rememberCatalog` (24 MiB estimate, ≤6 entries) and the single-identity `ordered()` cache
(`IptvStore.java:4-5`, cleared on any source change) additionally force re-sort on kind switches.

### R2 — CONFIRMED (code): native ignores the frontend revalidation token
`app.js:106` sends `catalogVersion` and handles `result.unchanged`, but `IptvStore.list()` never
reads it and never returns `unchanged`. Every section switch re-deserializes the full catalog even
seconds after the previous load. This is the Android-TV counterpart of the Samsung bug fixed in the
desktop investigation — except here it was never fixed.

### R3 — CONFIRMED (code): global sorting is a redesign-era addition on native
Master `d63f6bb` `IptvStore.list()` sorted only when `order==recent` (page-local path otherwise).
The worktree adds `ordered()` + `CatalogOrder.indices` (names[] + dates[] + boxed `Integer[]` +
`Collator` full sort) on every sorted list call. Correctness is fine; cost on 50k+ rows on a TV
SoC is not.

### R4 — HYPOTHETICAL (needs device logs): LMK kill / renderer crash
Heap-duplication chain (raw response + parsed raw array + transformed array + sort auxiliaries +
disk buffers + retained caches) plausibly peaks at 2–4× catalog size in transient Java heap on top
of the WebView renderer process. Whether the observed restart is (A) app-process death, (B) renderer
kill, (C) LMK, or (D) full OS reboot **cannot be determined without logcat**. See §5 signatures.

### Ruled out as primary
- The 45 s JS timeout (`app.js:72`) and the 25 s provider deadline (`ProviderHttp.java:7`) are
  **secondary**: they are the messenger, not the blockage. Do not raise them as a fix.
- `IptvActivity.java:12` `remote()` 5 s latch is unrelated to list loading (ANR risk only if ever
  called on the UI thread; it is currently reached from binder/HTTP threads).

## 4. Legacy vs new (Android TV native, same-file diff `master..worktree`)

- Unchanged architecture: full-array fetch → transform → page slice; same 24 MiB/8 MiB caps.
- Added (heavier): global `ordered()` sorting for all date/name modes; multi-account handling;
  playlist import; portal support; per-kind catalog locks (the locks only serialize same-key
  double-fetch — good — they do not reduce per-entry work).
- Added (lighter): frontend `catalogVersion` plumbing with **no native counterpart** (dead path).
- Net: per-entry work on large catalogs is strictly greater than 0.8.147, with no new cache win.
  No claim is made about which historical install was fast on the user's hardware.

## 5. Failure-class signatures (for when the TV is available)

- A (app restart only): `ActivityManager: Process local.tvmorph.tv (pid …) has died` + `am_proc_died`,
  no `lowmemorykiller`, no `chromium` renderer kill, `ApplicationExitInfo reason 6/9`.
- B (renderer crash): `chromium: [ERROR:…] Render process … gone`, `WebView/WV` `onRenderProcessGone`,
  app process survives.
- C (LMK): `lowmemorykiller: Kill 'local.tvmorph.tv' …`, `ActivityManager: Killing … (adj …)`,
  `dumpsys activity oom` pressure, `meminfo` spike before death.
- D (OS reboot): `boot_progress_*` sequence, `last_kmsg`/`kernel` reset reason, all processes die.
- Record `ApplicationExitInfo` (`dumpsys activity exit-info local.tvmorph.tv`) — it distinguishes
  A/B/C directly.

## 6. Verdict

The exact on-device trigger (kill vs crash vs reboot) is **UNCONFIRMED** — no logs exist. What is
confirmed from code is a deterministic performance trap that fully explains prolonged loading,
freezing, and the follow-up timeout on large real-world catalogs: **uncacheable full-catalog
reload + full global re-sort on every Movies/Series entry, serialized on one thread, with no
revalidation short-circuit on the native path**. The user-visible timeout is a secondary symptom.
Fixes must target R1–R3 (see `ANDROID_TV_IPTV_RECOVERY_VALIDATION.md`); timeouts must not be raised.
