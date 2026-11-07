# Morph Launcher desktop

One Morph Launcher application with the existing IPTV interface embedded inside it. The desktop package stages `tv-project/app/` and the canonical `android-tv/iptv/`; it does not package the separate Morph IPTV product. Desktop code supplies operating-system integration, provider transport, HTML5 playback, physical keyboard input and mouse presentation.

## Windows

Install Node.js, Python with Pillow, then run `npm ci` and `npm run dist` from this directory. The NSIS installer is generated in `dist/`. `npm start` opens the development application after `npm run stage`.

## macOS

`npm run dist:mac` builds a universal DMG and ZIP on macOS, supporting Intel and Apple Silicon. `prepare-mac-ci.py` creates a restricted runtime snapshot for the isolated `codex/desktop-macos` build branch; `macos-build.yml` builds on a real Apple Silicon runner and runs the packaged application regression again on an Intel runner. The snapshot excludes user profiles, account data, credentials and test output.

Current preview builds have no commercial Windows signing certificate or Apple Developer ID/notarization. macOS CI uses an ad hoc signature. Do not describe them as signed/notarized production releases.

## Verification

`node tests/matches.cjs` verifies the match-feed fallback, null scores and persistent cache. With FFmpeg available, `node tests/desktop.cjs` opens actual Electron windows and verifies mouse scrolling, the shared matches page, embedded IPTV, typed accounts, account persistence, MP4/HLS decoding, seeking, volume, local video, navigation and fullscreen. Set `MORPH_PC_TEST_EXECUTABLE` to the packaged executable to test the distributed application. Test profiles are isolated from the user's application profile.

`node tests/landing.cjs` checks the top download buttons on phone and desktop layouts against a local server on port 8798. Download responses in this layout test are fixtures; verify the real published assets separately.

LAN discovery depends on the local network and device capabilities; it has not been verified with physical DLNA/OpenWebif devices. Browser decoding depends on codec support. Android-specific native services are not automatically available on desktop.

`stage-landing.py` changes only desktop button assets and two exact download routes in the isolated existing-site checkout. It preserves the current phone/TV/IPTV download artifacts and deployment setup.
