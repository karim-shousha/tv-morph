# Morph TV Legacy 0.1.2 — experimental public beta

Separate package: `local.morphtv.legacy`. Minimum Android **4.4 / API 19**. Android 4.0–4.3 are **not supported** (no build targets API 14–18; the full Morph TV app requires API 26+). This is a lightweight edition, not feature parity with the current Morph TV release.

## Included

- Native landscape Home using the current WebP background and Morph mark. No dependency on old WebView JavaScript/CSS support.
- D-pad and touch navigation, visible focus, installed application launcher.
- Separate Arabic/English and blue/violet/teal preferences.
- User-entered HTTP/HTTPS M3U playlist (2 MB / 5,000 item bounds, Java 7, no WebView). Up to 3 redirects are followed automatically; HTTPS-to-HTTP downgrades are refused. Failures report a category (DNS / timeout / TLS / HTTP code / redirect / size / format). Provider credentials/URL are not persisted or printed.
- Optional normal Android Home selection through the system. No boot receiver, accessibility override or background launching.

## Not included in this first candidate

Current cinematic dock/reflections, complete theme packs, phone pairing/remote, Xtream account management, EPG, series metadata, prayer/adhan, parental controls, casting, automatic updates and automatic startup. Android 4.0–4.3 full UI is unsupported by design (see `docs/audits/MORPH_TV_LEGACY_COMPATIBILITY/05_ANDROID_4_COMPATIBILITY.md`). Current production source, packages and settings remain unchanged. The current full-feature edition remains the recommended version for supported devices.

Android 4.4 firmware TLS, DRM and codecs can prevent playback. No certificate validation is disabled: a TLS-incompatible provider fails with a `[TLS]` message instead of bypassing checks. Streams that need more than 3 redirects still require the final direct URL. No stream or network operation is retried automatically. HTTPS is recommended; HTTP is unencrypted.

## Local verification

`python android-legacy/build.py` compiles Java 7 source directly against Google's API 19 `android.jar`, dexes with minimum API 19 and verifies v1 APK signing. Local test key is isolated under `.private/legacy-signing`; never publish it.

No physical Android 4.4 device or emulator run has been completed. A successful build does not establish firmware or video compatibility. Published as an experimental public download at https://morphtv.herroshetta.com/download/legacy on 2026-10-25 at the owner's request.

## Install and acceptance check

1. Keep the current Morph TV installed. Install `Morph-TV-Legacy-0.1.2.apk` separately; it must appear as **Morph TV Legacy**.
2. Open Legacy from Apps first; do not select it as default Home until navigation is checked.
3. Check all Home buttons with Up/Down/OK, switch language and color, reopen and verify preferences persist.
4. Open an installed app and return. Load a small authorized direct M3U playlist. Check selection, audio/video, controls and Back.
5. Test unavailable network, invalid URL and unsupported video. An error must not trigger repeated playback attempts.
6. Verify original Morph TV still opens with its original appearance and preferences.

## Rollback

If selected as Home, choose the original Home in device Settings → Home (or Apps → Morph TV Legacy → Clear defaults). Uninstall **Morph TV Legacy** only from device Settings → Apps. This removes only Legacy preferences and does not remove the current Morph TV application.

Frozen pre-work source and SHA-256 manifest: `.private/legacy-baseline-0.8.80/`. Original successful Samsung diagnostics remain untouched.
