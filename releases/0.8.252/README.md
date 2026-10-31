# Morph TV 0.8.252

- Centered fixed-size dock; both side panels align with its bottom. Full-width content card with real metadata.
- Theme-derived dark player surfaces and accents; expandable settings; Back closes side panels, then hides the dock.
- Removed misleading TV minimization shortcut. PiP remains phone-only where the OS supports it.
- Android VOD URL construction no longer waits for optional provider details. Metadata recovery remains available after a source failure.
- Controlled Android readiness benchmark: 251 median 2605 ms, 252 median 1132 ms (3 runs, same local source/rate). These are test results, not guaranteed provider-network times.
- Samsung VOD buffer gate lowered from 5 seconds to 1. LG uses its native HTML media pipeline without extra metadata probes.
- Added the missing trailer bridge for Samsung and LG and retained provider YouTube IDs. Launch uses official platform external-browser APIs.
- Independent Xtream, M3U URL, Stalker, and Android file-import forms reuse existing validation and connection handlers. Provider features remain subject to each platform's existing support.
- Android 4.4 native subset updated separately as Legacy 0.1.3, keeping its API-19 constraints. It does not gain Xtream/EPG/VOD metadata/PiP or newer Android playback features.
- Tizen 2/3/4 packages rebuilt through their own compatibility transforms and gates. No VIDAA files/builds were updated.

Verification: native Android runtime geometry, theme, accordion, speed, tracks and Back tests; Samsung/LG real player sources tested with native transports mocked; actual shared UI trailer/form tests on Android, Samsung and LG bundles. Native codecs, YouTube browser availability, DLNA and real provider playback still require physical hardware checks.

API references: https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references/application-api.html ; https://webostv.developer.lge.com/develop/references/webostvjs-webosdev
