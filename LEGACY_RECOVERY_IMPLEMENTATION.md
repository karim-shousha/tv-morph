# LEGACY RECOVERY IMPLEMENTATION

Date: 2026-10-31. Implements `docs/audits/MORPH_TV_LEGACY_COMPATIBILITY/` (13 reports).
Branch pointer: `codex/legacy-recovery-0.8.216` (HEAD `fff41ebc`, stayed on `codex/perf-recovery-impl`).
No tracked file was modified: all work is in untracked legacy paths (repo `.gitignore` is `*`).
Stable artifacts preserved (hash-verified): root Tizen4/5 0.8.170 WGTs, `tv-app.zip` 0.8.243 (read-only source),
Legacy APKs 0.1.0/0.1.1, Lite 0.8.206/0.8.215 WGTs, Tizen3 0.8.185/0.8.186 ZIPs.

## What was built (new test packages, old ones untouched)

| Target | Package | Size | SHA-256 (prefix) | Identity |
|---|---|---|---|---|
| Tizen 2.3/2.4 | `samsung-legacy2/Morph-TV-Tizen2-Lite-0.8.216-candidate.wgt` | 8,226,680 | `91bc34e3…` | MorphT2001.Home, req 2.3 |
| Tizen 3.0 | `samsung-legacy/Morph-TV-Tizen3-Lite-0.8.187-candidate.zip` | 8,225,705 | `99785d99…` | MorphT3001.Home, req 3.0 |
| Tizen 4.0 | `samsung-tizen4/Morph-TV-Samsung-Tizen4-0.8.243.wgt` | 8,125,460 | `eb31c99e…` | ClearMob01.Home, req 4.0 |
| Android 4.4 | `android-legacy/Morph-TV-Legacy-0.1.2.apk` | 139,823 | `b0f0db90…` | local.morphtv.legacy, vCode 3, SDK 19/19 |

## Changes by area (root causes in parentheses)

**Build selection (RC-01, RC-10).** New `legacy-build/` shared infra: `matrix.json` (exactly one
package per platform; Tizen 5 bundles can no longer route to 2/3/4), `guard.py`
(source-zip identity assert, ES5 gate, legacy-first HTML order assert, AST forbidden-syntax
scan, 8-digit-hex→rgba CSS normalization, stale-version recording), `build_polyfills.py`
(regenerates the polyfill from pinned `core-js 3.39.0 / whatwg-fetch 3.6.20 / css-vars-ponyfill 2.4.9`
through esbuild+babel `ie:11` + acorn ES5 gate), shared `polyfills-entry.js`. All three Samsung
builds call the guard; mismatched sources or forbidden syntax fail the build instead of the TV.

**Tizen 2 Lite (RC-02, RC-03, RC-04, RC-05, RC-11).**
- Polyfill was PROVEN non-ES5 (`{Map,set…}` shorthand at byte 80,931) — it would have killed every
  2.3 launch. Replaced with regenerated ES5 bundle (591,332 B, gate PASS).
- New `legacy-es5-header.js` (loads first): `Object.assign` shim, storage probe + memory-backed
  stub when native storage throws (never deletes user data), early error capture, capability flags.
- `legacy-runtime.js`: fixed wrong "Tizen 3" header, null-safe assign, `legacy-no-cssvars` fallback
  class when the ponyfill is absent, **polling fallback when `MutationObserver` is missing** (oldest 2.3).
- New `legacy-caps.js` (Lite-only, zero modern overhead): D-pad repeat coalescing (same arrow <70 ms),
  storage-quota taxonomy without eviction.
- `legacy-light.css`: hard Grid→flex fallbacks, dialog fit (`96vw/92vh`), `-webkit-box` nav rows,
  no-ponyfill static colors, `img{height:auto}`.
- Build now also covers headless fragment pages (`inject_compat`: `subscription-setup.html` previously
  shipped with ZERO compat scripts).

**Tizen 3 Lite.** Same header/caps/polyfill/header-order/CSS treatment (Chromium-47 `chrome47` target,
`motion:true` seed behavior preserved — simulation asserts it). Script order verified legacy-first.

**Tizen 4 (RC-01, RC-10).** New `samsung-tizen4/build.py` repackages current `tv-app.zip` 0.8.243 with
`required_version="4.0"` (fixes stale 0.8.170 roots, which are preserved untouched). AST scan PROVES
shipped JS contains zero `?.`/`??` (a naive text scan false-alarmed on a regex inside
`vendor/moment.min.js` — cleared by AST). Tizen4-only `tizen4-caps.js` injected legacy-style (first
script, 6 HTML files); modern source files unmodified.

**Android 4.4 (RC-13).** `Playlist.java`: up to 3 redirects followed (HTTPS→HTTP downgrade refused,
chain reported), error taxonomy `[DNS]/[TIMEOUT]/[TLS]/[HTTP nnn]/[REDIRECT n]/[SIZE]/[FORMAT]`
— still no cert bypass, no retry storms; item bound 3,000→5,000 (2 MB heap cap kept). `HomeActivity`
shows the failure category (Arabic/English, no secrets). `PlayerActivity`: completion finishes,
error dialog carries `what/extra`, keep-screen-on flag cleared on destroy. Version 0.1.2 (vCode 3);
Java 7, Holo, single INTERNET permission, no WebView/Leanback/Media3 — unchanged architecture.

## Explicitly NOT done (per Final Rules)
No modern IPTV catalog changes. No Home UI changes. No universal compat layer (all caps are
per-package files the modern build never loads). No user-data deletion. No TLS weakening.
No Android 4.0–4.3 support (declared unsupported with evidence). No physical-device claims.
