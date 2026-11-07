# LEGACY BUILD COMPATIBILITY MATRIX

`legacy-build/matrix.json` is authoritative at build time (guard version `1.0.0-legacy-recovery`).
Source of all Samsung builds: `mobile-app/build/assets/tv-app.zip` 0.8.243 (`ClearMob01.Home`, req 5.0).
Any other source is rejected by the build.

| Platform | OS / engine | Package (this phase) | JS/CSS gate | Installs alongside main app | Status |
|---|---|---|---|---|---|
| Samsung Tizen 2.3/2.4 (2015–16) | old WebKit / safari7 | `samsung-legacy2/Morph-TV-Tizen2-Lite-0.8.216-candidate.wgt` (MorphT2001.Home, req 2.3) | full ES5 incl. polyfill; MO poll fallback; flex hard-fallbacks | Yes (separate identity) | Experimental — needs TV test |
| Samsung Tizen 3.0 (2017 MU) | Chromium 47 / chrome47 | `samsung-legacy/Morph-TV-Tizen3-Lite-0.8.187-candidate.zip` → WGT at install (MorphT3001.Home, req 3.0) | full ES5 incl. polyfill; flex hard-fallbacks | Yes | Experimental — needs TV test |
| Samsung Tizen 4.0 (2018 NU) | Chromium ~56 / chrome56 | `samsung-tizen4/Morph-TV-Samsung-Tizen4-0.8.243.wgt` (ClearMob01.Home, req 4.0) | AST-verified zero `?.`/`??`; caps injected | Replaces-updates same identity | Experimental — needs TV test |
| Samsung Tizen 5.0+ | Chromium 69+ | current modern path (NOT this phase; stale root 0.8.170 WGTs preserved) | — | — | Unchanged |
| Android 4.4 (API 19) | native, no WebView | `android-legacy/Morph-TV-Legacy-0.1.2.apk` (local.morphtv.legacy, vCode 3) | Java 7, API-19 bootclasspath, `--min-api 19`, v1 signing | Yes | Experimental subset — needs device test |
| Android 4.0–4.3 (API 14–18) | — | NO BUILD | `evaluateJavascript` (19+), Leanback (21+), Media3/Material (21+/26+) absent | — | UNSUPPORTED by design |
| Android 5.0+ / Android TV | — | current full app (API 26+, NOT this phase) | — | — | Unchanged |

## Feature / limitation snapshot (this phase)

| Capability | Lite 2 | Lite 3 | Tizen4 0.8.243 | Legacy APK 0.1.2 |
|---|---|---|---|---|
| Shared Home/library/accounts/themes | yes | yes | yes (current) | launcher subset only |
| Xtream / Portal | lib yes / no Portal | lib yes / no Portal | as modern | M3U only / no |
| M3U limits | via shared lib | via shared lib | via shared lib | 2 MB, 5,000 items, ≤3 redirects |
| Catalog mitigations | worker sort + IDB chunks (inherited) | same | same (current) | n/a (flat list + ListView) |
| Player | single AVPlay; codec/TLS per-model | single AVPlay | as modern | VideoView stagefright; H.264/AAC baseline |
| Effects | fixed wallpaper, no blur/glow/motion | fixed wallpaper, no effects, motion on | as modern + input caps | n/a (native) |
| Retries / cert bypass | none / none | none / none | none / none | none / none (TLS failures labeled `[TLS]`) |

Known remaining gaps (all need hardware logs): per-model codec/TLS allowlists, 512 MB soak behavior,
episode-list paging beyond native 60/page, RTL/overscan rendering on real panels.
