# Morph Sports — QA report

2026-10-28. Tests ran locally, with synthetic records confined to test files/temporary databases. Production Sports has no sample-score fallback.

## Passing verification

| Check | Result |
| --- | --- |
| `node tv-project/tools/check-sports.cjs` | Pass: Sports action, remote OK/arrows, Back/focus restoration, local dates/calendar, halftime score/detail fields, favourite teams, team selection and supported standings, five languages/RTL, failure/cache, 429, offline, three performance modes, persistence after reload, stopped operations on exit; no page errors |
| `python tv-project/tools/test_sports_api.py` | 6 passing cases: discovery-derived IDs, explicit competition-logo approval, teams/logo gate, unsupported IDs, 16 concurrent cache requests collapsed to one upstream call, restart persistence, stale outage/429 cooldown, shared request budget, date validation and missing-configuration state |
| `python tv-project/tools/test_admin_api.py` | Pass against real isolated backend: authentication, live/expired/revoked/test totals, complimentary grant inclusion, shared login/tabs, grant save, safe text rendering, reviews, Sports configuration, logout/private-data clearing |
| `python tv-project/tools/check_admin_nginx.py` | Pass using actual Nginx: unified route/assets, old route redirects, no-store/CSP, protected overview API, Sports CORS/configuration response |
| `node tv-project/tools/check-sports-packages.cjs` | Pass for generated Samsung/Android/webOS applications using actual MorphLocale in all five languages; Android native bridge is stubbed for this browser test |
| `python .tools/community-api-check.py` | Existing suite passes: reviews/moderation, auth/logout/CSRF, body/origin checks, download counting and persistence |
| `node tv-project/tools/check-settings-nav.cjs` | Existing suite passes |
| `node tv-project/tools/check-lifecycle.cjs` | Existing suite passes: idle radio, Home slideshow off/on lifecycle, programme/prayer hooks |
| `node tv-project/tools/check-tiers.cjs` | Existing suite passes: quality/balanced/performance, migration and persistence |
| Syntax/build | JS syntax and Python compilation pass; three TV package builds complete |

## Existing regression failures, retained without weakening tests

The old broad UI/performance/input/slideshow suites were executed and did not all pass:

- `check-ui.cjs`: waits for an older weather-temperature fixture that no longer reaches its expected value.
- `check-inputs.cjs`: old fixture does not dismiss the existing welcome/support overlay, which intercepts clicks.
- `check-slides.cjs`: expects a foreground club logo bounding box; current Home can hide that artwork, yielding null.
- `check-perf-regression.cjs`: boot, D-pad, frame timing and basic settings checks pass; older Settings placement/count expectations fail, followed by access to a removed setting.
- `.tools/community-nginx-check.py`: hardcodes a `Phone-0.8.86.apk` filename while current catalog artifacts use a newer version.

For the four TV suites, an isolated copy of the current application with Sports view/script/integration removed reproduced the same failures. Evidence: `output/sports-pre-feature-baseline/results.json` and per-suite logs. The original suites were not modified to pass. The newer focused Settings/lifecycle/tier tests and new Sports tests pass. This is not a claim that the full historical regression suite is green.

## Builds

- `python android-tv/build.py`: APK generated and signature verified.
- `python webos-app/build.py`: IPK generated; pipeline reports source files unchanged during build.
- `python tv-project/tools/build.py`: signed WGT generated, signature/content assertions pass after correcting the pipeline's stale package filename and missing shared directories/locale.
- Package copies/hashes: `output/morph-sports-packages/manifest.json`.
- APK archive contains current Sports source exactly. WGT contains Sports, locale, UI and fitness resources and signatures, with no Python/test/credential files.

## Visual QA

Inspected 1920×1080 Sports and Home screenshots and 1440px unified admin screenshot. Home Sports action appears to the left of HDMI without shrinking the dock icons. Sports cards and tables use theme variables and focus outlines. Full screen root is registered with existing focus scrolling; card/competition/date controls remain remote-operable. Physical-offset/flex fallbacks avoid dependence on newer `inset`/grid support in experimental older engines. No blur/animation is required; reduced-effects mode disables transitions/shadows.

- `output/sports-home.png`: real UI with test app catalog, Sports dock focus.
- `output/sports-configuration-ar.png`: Arabic configuration-required state, no scores.
- `output/sports-test-data-en.png`: clearly named TEST fixtures; synthetic test evidence only.
- `output/admin-overview-test-data.png`: isolated synthetic license totals; not production customer statistics.

## Remaining limits

No valid credentialed provider session was used: no actual competition IDs, live score freshness or licensed-logo access has been verified. Backend configuration and a suitable provider plan are activation requirements. API-Football live status timing and competition coverage are not guaranteed by these local tests.

No physical Tizen, webOS, Android TV, Google TV, Fire TV or VIDAA device was installed/tested. Current Tizen package targets 5.0+; Tizen 4 remains experimental/unverified. VIDAA remains the existing archived distribution (HTTP 410), with no Sports compatibility claim. Packaging/browser checks do not establish firmware compatibility.

No production deployment, publication, payment action or customer-data mutation was performed.

## Reference-driven visual update

`check-sports-dashboard.cjs` passes: three match panels and three lower panels, five sidebar SVGs, competition emblems, visible permitted response-logo rendering, horizontal league scrolling with the existing Focus Engine, View all and Back/Home focus restoration. `output/sports-reference-dashboard-ar.png` is the actual application rendered with explicitly labelled synthetic test records, not a static mockup or live result claim. The original local image-generation attempt failed; a new original fictional-athlete banner was generated with the built-in image tool and saved as WebP. Asset size is about 200 KiB. See `MORPHTV_SPORTS_VISUAL_UPDATE.md` for the exact final prompt and paths.
