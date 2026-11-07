# MORPH TV — Final QA Report

## Scope

P0 (focus engine, timer lifecycle, observers), P1 (defer, reflection gate, asset verification),
P2 (7-category Settings + label/confirm fixes), P3 (Quality/Balanced/Performance + migration).
Branch `codex/perf-recovery-impl`; no app behavior or visual contract intentionally changed
except approved Settings relocations and tier additions.

## Test results (desktop Chrome, file:// — not a TV)

| Suite | Result |
|---|---|
| `tools/check-perf-regression.cjs` | 18/18 PASS |
| `tools/check-lifecycle.cjs` | 6/6 PASS |
| `tools/check-settings-nav.cjs` | 4/4 PASS |
| `tools/check-tiers.cjs` | 5/5 PASS |
| Syntax (`node --check`) on all edited JS | PASS |
| Asset/script/stylesheet reference check (43 refs, 61 scripts, 28 styles) | all resolve (theme art via packs/IndexedDB by design) |

Pre-existing observations (not regressions, not changed): `tvmorph.png` absent from `tv-project/app`
(graceful alt fallback); `MorphLocale` provided by native shell on TV (stubbed in tests);
`update-alerts` inert on TV by design.

## Regressions caught and fixed during implementation

1. P2 routing loop referenced removed `hosts.general` → load listener aborted, entries missing.
   Fixed (→ `hosts.system`); suites re-green.
2. Double `defer` insertion from a faulty idempotency check → normalized to single; head scripts kept sync.

## Blocked / outstanding (require TV hardware or missing toolchain)

- T1–T14 on-device runs: Tizen 5.0+ unit, low-end Tizen, webOS 5+, Android TV 8+ (timings, memory, 60-min soak).
- Package builds: Tizen WGT (no SDK in env — `build.py` fails at packaging), Android APK (no JDK), webOS IPK (no ares CLI). **No release package was rebuilt or overwritten.**
- On-TV screenshot A/B for tier visuals and Settings categories.
- Optional proposals (focus-ring flattening, asset recompression) pending approval — not implemented.

## Build status

Source tree is internally consistent (all checks green). No publish/install performed, per safety rules.
Final status: **safe to proceed to on-device validation; not cleared for release.**
