# LEGACY TEST RESULTS

Date: 2026-10-31. No physical TV/device available — hardware rows remain NOT TESTED (honest, per audit report 13).

## PASS (desktop/toolchain)

| # | Check | Command / evidence | Result |
|---|---|---|---|
| 1 | ES5 gate, new/changed Lite JS (7 files) | acorn `ecmaVersion:5` on header/runtime/caps ×2 + `tizen4-caps.js` | 7/7 PASS |
| 2 | ES5 gate, regenerated polyfill | `build_polyfills.py` → acorn ES5 (was FAIL at byte 80,931 before fix) | PASS (591,332 B) |
| 3 | ES5 gate, all staged app JS | `transpile.cjs` inside both Lite builds | PASS (builds completed) |
| 4 | Source routing | `assert_source_zip` (must be 0.8.243/ClearMob01/5.0) ×3 builds | PASS |
| 5 | Script order | `assert_html_order` legacy-first, incl. headless fragment page | PASS |
| 6 | Tizen4 forbidden syntax | AST scan (`?.`/`??`) over all shipped JS | PASS (0 hits; naive-scan regex false positive cleared) |
| 7 | Package metadata | zip `config.xml` asserts | T2 req 2.3/MorphT2001/0.8.216, T3 req 3.0/MorphT3001/0.8.187, T4 req 4.0/ClearMob01/0.8.243 — PASS |
| 8 | Tizen3 browser simulation | `samsung-legacy/test.cjs` (Edge, missing-API + no-Grid stubs) vs new 0.8.187 build | en PASS + ar PASS (polyfills/launch/settingsBack/theme) |
| 9 | Tizen2 browser simulation | `samsung-legacy2/test.cjs` (WebKit-leaning stubs) vs new 0.8.216 build | en PASS + ar PASS |
| 10 | Playlist unit tests | `PlaylistCheck` (URL validation, UTF-8 titles, malformed, 5,000-item bound), Java 7 | PASS |
| 11 | APK metadata 0.1.2 | `aapt dump badging/permissions` | package/min/target/label OK; exactly one permission (INTERNET) — PASS |
| 12 | APK signatures | `apksigner verify --min-sdk-version 19` on 0.1.2 AND preserved 0.1.1 | both PASS (v1+v2+v3 true) |
| 13 | Stable artifacts untouched | SHA-256 vs pre-work baseline (root 0.8.170 WGTs, 0.8.185/0.8.186 ZIPs, 0.8.206/0.8.215 WGTs, APKs 0.1.0/0.1.1) | all MATCH |
| 14 | Tracked-repo boundary | `git ls-files` on all touched paths | 0 tracked files modified |

## FAIL / BLOCKED (pre-existing or environmental — not regressions)

| # | Check | Outcome | Cause |
|---|---|---|---|
| F1 | `.tools/verify-legacy.py` | FAIL at production-baseline assert | PRE-EXISTING: baseline frozen at 0.8.80 vs branch's dirty tracked tree (list contains only pre-existing `android-tv/…`, `mobile-app/…` paths; zero legacy paths). Unrelated to this work. |
| F2 | Physical-device install/launch/playback (all 4 targets) | NOT TESTED | No SDB/ADB access. Do not claim support until report-13 logs exist. |
| F3 | Chromium-47 binary execution | BLOCKED (as before) | Approval review rejected local archived binary; Edge simulation is not engine evidence. |

## Remaining hardware tests (per device, see `LEGACY_INSTALLATION_GUIDE.md`)
T1 install/launch, T2 Home render, T3 D-pad coverage + Back, T4 provider connect + H.264/AAC playback,
T5 movie/series seek + focus return, T6 Kidsy A/V, T7 theme persistence, T8 HDMI/radio/prayer smoke,
T9 offline/invalid/unsupported error paths, N3 small-vs-large list isolation, S2 same-account
modern-vs-legacy network comparison with SDB/ADB log capture.
