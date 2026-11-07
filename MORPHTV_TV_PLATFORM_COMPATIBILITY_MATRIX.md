# MORPH TV — Platform Compatibility Matrix

Evidence-graded. "Requires on-device validation" wherever the repo shows only fixtures/mocks.
Brand alone never identifies the OS — verify per-unit SSDP `operatingSystem/osName + osVersion/firmware`.

## Matrix

| Platform | Builds | Installs | Launches | Core functions | Status |
|---|---|---|---|---|---|
| Samsung Tizen 5.0+ (tested firmware T-MSLAKUC-1500.5) | YES (WGT, `tv-project/app/config.xml:3` required_version 5.0) | YES (per-device Developer-Mode signed WGT) | YES (HDMI/back/liveTV per `verification-v3.json`) | PARTIAL (apps/HDMI/weather/prayer/theme on that unit) | Verified (single-model); fleet = Experimental |
| Samsung Tizen 4.0 | NO (no 4.0 target/WGT) | NO | NO | NO | Experimental/Unsupported — separate build + physical test required |
| Android TV 8.0+ (minSdk 26, `android-tv/AndroidManifest.xml:2`) | YES (preview APK) | Requires validation | Requires validation | Requires validation | Builds verified; rest unproven |
| Google TV | same APK | Requires validation | Requires validation | Requires validation | Variant, no separate proof |
| Amazon Fire OS (AFT branch `TvActivity.java:20`) | YES (same APK) | Requires Fire firmware test | Requires test | Requires test | Experimental |
| LG webOS 5.0+ (`webos-app/appinfo.json`, chrome68 `build.py:59`) | YES (IPK `physicalTVVerified false`) | NO (Developer session needed, untested) | NO | NO | Experimental preview |
| LG webOS <5 / NetCast | NO | NO | NO | NO | Unsupported by this candidate |
| Hisense VIDAA (hosted `vidaa.html`, `physicalDeviceVerified false`) | YES (dev build) | NO (`hisense://debug` firmware-dependent) | NO | Browser checks only | Experimental dev build |
| Android 4.4 Legacy native (`android-legacy/`, minSdk 19) | YES (lightweight subset, no theme/fitness/parity) | Requires device run | Requires device run | Subset only | Experimental beta |
| Android 4.0–4.3 full UI | NO | NO | NO | NO | Unsupported |
| Roku / Panasonic / Titan OS / Saphi / Sharp-Linux / Coolita / Orsay / other Linux | NO (no adapter/package) | NO | NO | NO | Unsupported — no code until funded device + store path |

## Tier defaults by capability (post-P3)

- Detection: `tv-compat.js` legacyLayout (no grid), `performance.js` lowMemory (legacy OR Tizen ≤6 OR RAM ≤2GB OR cores ≤2), `ui-mode.js` weak (legacy OR Tizen 1–6). Weak forces light effects unless user explicitly picks Quality; explicit choices never auto-downgraded.
- Tizen 5–6 / low-memory / 720p: fresh/migrated-auto → Performance (light CSS, 10s radio idle).
- Modern Tizen / Android TV / Google TV / Fire / webOS 5+: fresh → Performance (previous effective default); migrated-auto → Balanced (full visuals + 5s cadence); Quality available (full + 1s).
- Native bridge: outbound `TVNative.setPerformanceMode` stays legacy (`full`/`light`) — contract unchanged; inbound native values canonicalized; stored value migrated one-way with `performanceDefault140` flag.
- VIDAA/low-memory: Performance default; Balanced keeps full visuals but governed; Quality may jank — needs device test.

## Legacy blockers (full shared UI vs old engines)

`tv-compat.js` polyfills syntax/DOM only — NOT `WeakMap` (`focus.js`, `text-size.js`), `Promise`
(`boot-theme.js`, `theme-packs.js`, `m3u-source.js`, `kids.js`), `MutationObserver` (8 files),
`crypto.subtle`/`indexedDB`/typed arrays/Blob URLs (`theme-packs.js`), XHR2/CORS. Transpiling
(`--target=chrome68`) fixes syntax, not runtime APIs or grid/custom-properties CSS. Tizen 4 = Chromium
M56, Tizen 5 = M63, webOS 4 = M53, webOS 5 = M68 (engines per audit refs). Android 4.4 frozen WebView
is why the Legacy app avoids the JS UI entirely; API 19 TLS/DRM/codecs are firmware-dependent
(`TvActivity` cancels on SSL error; no bypass). Full APK cannot drop to minSdk 19 (Java 8, D8 min-api 26,
WebView + pairing stack).

## Recommended next steps (ordered)

1. Freeze the labels above; promote nothing without a device row.
2. Tizen 5.0+ fleet: per-model install/launch/HDMI/AVPlay/codec tests; record model/firmware/Tizen version.
3. Android TV 8+ field validation (Hisense Android 12, Google TV, Fire TV): install, leanback/HOME behavior, WebView, codecs, pairing, self-update.
4. LG webOS 5+ physical test (Dev Mode install, Luna APIs, Back 461, HTML5 media, TLS/CORS, 1–2GB memory).
5. VIDAA firmware test where `hisense://debug` exists; no store-release claims.
6. Tizen 4.0: keep experimental OR spin the separate 4.0 build with API fallbacks + real-unit test.
7. Android 4.x: full UI stays minSdk 26; Legacy 4.4 only after a real device/emulator run; 4.0–4.3 unsupported.
8. Log tier + capability signals per device during 2–5; tune thresholds with data only.
9. Align `DEVICE-COMPATIBILITY.md`/JSON/README docs with actual scripts (explicit vs speculative brand-OS table).
10. No Roku/Panasonic/Titan/Saphi/other-Linux code without funded device + adapter + store path.
