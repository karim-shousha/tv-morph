# Morph Sports — implementation report

Implemented on 2026-10-28 in `C:/Users/Admin/Documents/Codex/2026-10-22/ui-ux`.

## Delivered

- Shared TV application: leftmost trophy action in the existing dock, using MorphIcons stroke geometry and current focus/overflow behavior. Existing dock items keep their size; Home hero, background, slideshow and theme styles were not redesigned.
- Native DOM Sports view with local-day fixtures, live/upcoming/results filters, yesterday/today/tomorrow, a remote-operable ±30-day calendar, favourites, discovered competitions, teams, match details and supported standings.
- Match score/status/minute, local kickoff, venue and halftime values; available events, lineups and statistics use expandable, bounded pages. Missing provider fields do not produce invented sections.
- Six-row standings pages, 18-card list pages, bounded detail rows and lazy optional logos. The existing Focus Engine owns D-pad/OK behavior and scrolling. Back from details returns to fixtures; Back from Sports restores the Sports dock action.
- Arabic RTL and English/French/Chinese/Japanese labels resolved through the current MorphLocale language. Names and technical event/stat labels retain the provider's language when no translation is supplied.
- Favourite teams/competitions use ClearTV.read/write and the existing active viewer namespace. No new account or Settings category.
- Existing Python/Nginx backend reused for API-Football. No new service, framework or TV-side provider credential.
- Configuration-required, unavailable, rate-limited, empty, offline and explicitly stale cached states. No production sample fixtures or scores.

## Files

New feature files:
- `tv-project/app/sports.js`, `sports.css`
- `distribution/community/sports.py`

Shared integration edits:
- `tv-project/app/index.html`: Sports view and scoped assets
- `tv-project/app/app.js`: Sports view/lifecycle integration
- `tv-project/app/dock.js`: use existing dock refresh to preserve the Sports action
- `tv-project/app/ui/icons.js`: matching trophy SVG
- `tv-project/app/core.js`: viewer-scoped favourites
- `tv-project/app/config.xml`: allow existing Morph backend origin
- `distribution/community/server.py`: Sports routes/CORS and authenticated admin aggregates
- `distribution/Dockerfile`, `.dockerignore`: include new backend/admin files
- `distribution/nginx.conf`: unified admin routes, existing API proxy retained
- `tv-project/tools/build.py`: correct actual `Morph TV.wgt` filename; include UI/fitness directories and the shared locale, compile with existing esbuild for Chrome 63

New verification files:
- `tv-project/tools/check-sports.cjs`
- `tv-project/tools/check-sports-packages.cjs`
- `tv-project/tools/test_sports_api.py`
- `tv-project/tools/check-admin.cjs`
- `tv-project/tools/test_admin_api.py`
- `tv-project/tools/check_admin_nginx.py`

The project already had extensive uncommitted changes. They were preserved. Its existing ignore-all Git policy also applies to newly created source/report files; they exist locally and were not committed or staged.

## Unified control panel (additional user request)

`distribution/admin.html`, `admin.js`, `admin.css` implement a single owner dashboard at `/admin` after deployment. Existing `/plus-admin` and `/community-admin` routes redirect to the matching tab. Existing Plus grant management and review moderation scripts were retained and coordinated through shared-session events.

Overview: active Plus licenses including complimentary grants, confirmed live purchases, grant emails, linked TVs with valid licenses, revoked/expired licenses, download counts by platform, rating counts/average, pending comments, plan counts and the latest 50 eligible licenses. Test payment orders are excluded from live totals and separately identified. Numbers come from full database aggregates, independent of the grant list's 1,000-row display cap. A license is not asserted to be a unique person; downloads are not asserted to be installs. Revenue was not inferred from current prices because historical payment amounts are not stored in these tables.

The Plus tab keeps grant creation/editing, code display, device management and revocation/restore. Reviews retain approval/hide/spam/restore and pagination. Sports shows configuration, logo approval, daily provider requests/budget and cache count. Existing password sessions, CSRF checks and same-origin mutation rules remain in force; no API key, license secret or payment proof is returned in overview responses.

## Builds and artifacts

Existing Android, webOS and Samsung pipelines completed. Copies and SHA-256 hashes are in `output/morph-sports-packages/manifest.json`:

- `MorphTV-Sports-Android-TV.apk`
- `MorphTV-Sports-webOS.ipk`
- `MorphTV-Sports-Samsung.wgt`

These are local candidates carrying the existing pipeline identifiers/versions, not a newly published release. Android signing verification passed. Samsung signed-package contents were verified. webOS packaging succeeded. Browser smoke tests loaded each generated application's assets with actual MorphLocale; the Android test provided a minimal native bridge stub. No physical installation is implied.

## Compatibility and outstanding gates

| Platform | Evidence / limit |
| --- | --- |
| Tizen 5.0+ | Chrome-63 compilation, signed WGT and generated-asset browser smoke passed; physical TV unverified |
| Tizen 4.0 | ES5 feature source and flex/physical-offset fallbacks supplied; experimental runtime/install unverified; default WGT still requires Tizen 5 |
| Android TV 8+, Google TV, Fire TV | Existing min-26 APK pipeline/signature passed; physical firmware/remote tests unverified |
| webOS | Existing 5.0+ candidate IPK pipeline and generated-asset smoke passed; physical TV unverified |
| VIDAA | Existing archived runtime uses a separately generated embedded application, and current Nginx explicitly returns 410 for VIDAA distribution. Not revived or claimed compatible by this change |

Live credentialed provider verification and actual competition discovery remain pending. Configure the existing backend and confirm the relevant plan/data rights before enabling it. Logo loading remains off until explicitly approved. No stream, broadcast scraper, IPTV subscription requirement or player change was introduced.

No deployment, publication, remote messaging or device installation was performed.

Screenshots: `output/sports-home.png`, `output/sports-configuration-ar.png`, `output/sports-test-data-en.png`, `output/admin-overview-test-data.png`. Screenshots containing TEST team names or isolated admin totals are test evidence, not live sports or customer data.
