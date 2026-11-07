# Morph TV LG Preview 0.1.0

An isolated webOS test package, `com.zainbot.morphtv.preview`, initially targeting webOS 5.0+ (Chromium 68). Older webOS and NetCast are not supported by this candidate. This is not a published LG Store app and does not replace Home.

Build: `python webos-app/build.py` (requires the locally installed official `@webos-tools/cli`, LG webOSTV.js 1.2.13 and the existing esbuild executable). Production Android/Samsung source and signing identities are never modified. App metadata declares no additional Luna ACG permissions. There is no boot service, auto-launch, app enumeration, external app launching or system settings modification.

The build copies the current TV Home, assets and media screens into its own directory. A generated media backend reuses the subscription/catalog logic and replaces Samsung AVPlay with HTML5 video/audio. Local iframe documents inherit the app origin through `srcdoc` with explicit local asset bases; no web security setting is disabled. Shared source files remain unchanged. Theme packs are downloaded on demand using the existing integrity checks.

Implemented for trial: Home appearance/themes, built-in IPTV/radio/prayer, language and D-pad navigation. Phone pairing, external apps, HDMI control, Home replacement, auto startup and full Android parental-system integration are absent. Media formats, TLS, provider CORS, device memory and actual installation still require a physical TV test. IPTV credentials are stored in app-local storage, not OS-key-store-encrypted; the account Clear action removes them. No real account or device credentials are bundled.

Local verification:

- Official CLI package generation and `ares-package --info`: PASS.
- `ui-check.cjs`: PASS on local packaged-file UI at 1080p/720p, AR/EN, focus, media entry/exit, mock-provider account connection, assets, radio and prayer.
- Production source hashes before/after build: unchanged.
- Physical installation, LG-specific Back/keyboard behavior and actual audio/video: NOT TESTED.

See `distribution/lg-install.html` for the user-facing installation, testing and rollback guide. A Developer Mode session is temporary and must be maintained as documented by LG. Do not claim universal LG compatibility from a local browser test.

Official references:

- https://webostv.developer.lge.com/develop/getting-started/developer-mode-app
- https://webostv.developer.lge.com/develop/tools/cli-installation
- https://webostv.developer.lge.com/develop/references/appinfo-json
- https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine
- https://webostv.developer.lge.com/develop/references/webostvjs-introduction
- https://webostv.developer.lge.com/develop/references/webostvjs-webos
