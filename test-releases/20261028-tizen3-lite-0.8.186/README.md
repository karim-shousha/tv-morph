# Morph TV Lite 3 — experimental candidate

Targets Samsung Tizen 3.0 (2017 MU models, including UA50MU7000). This is a compatibility candidate, not a confirmed supported release. It has a separate identity `MorphT3001.Home` and the name **Morph TV Lite 3**, so it does not replace the main app or delete its data.

The same Home, installed-app catalog, remote focus, IPTV library, accounts, themes, radio, prayer, HDMI and playback handlers are reused. JavaScript is transformed and parsed as ES5. Missing standard APIs have local polyfills. CSS variables are resolved on theme changes, with flex layouts for engines without Grid. Fixed artwork is the default; blur, shadows and continuous animations are removed. IPTV uses one Samsung AVPlay instance. Four-screen playback and Portal/MAC remain unsupported on Samsung, as in the main build. A provider codec or old TLS implementation may still prevent individual streams or online services from working.

## Install from a computer

1. Install Tizen Studio, TV Extension and Samsung Certificate Extension.
2. On the TV, open Apps and enter `12345`. Turn Developer Mode on and set **Host PC IP** to the computer's LAN address. Restart the TV.
3. Connect the TV in Device Manager on port `26101`. Obtain its DUID.
4. In Certificate Manager use your Samsung author certificate and a distributor certificate containing that TV's DUID. In Device Manager choose **Permit to install applications** when available.
5. Keep `Install-Tizen3.ps1` and `Morph-TV-Tizen3-Lite-0.8.186-candidate.zip` together. Run in PowerShell:

   `./Install-Tizen3.ps1 -TVIP 192.168.1.2 -CertificateProfile MySamsungProfile`

   If Studio is installed elsewhere, pass `-TizenStudio "D:\tizen-studio"`.

Alternatively extract the ZIP, package/sign its contents with Tizen Studio and install the resulting WGT. A signed sample WGT is supplied, but it will not install on TVs absent from its distributor certificate. Use your own matching certificate; no private keys are included. This is not an APK, USB installer, or automatic mobile update. The current mobile installer still embeds the regular Samsung build.

## Verify on the television

- App installs and opens without a blank screen; Home and artwork fit the screen.
- Up/Down/Left/Right/OK/Back reach dock, installed apps, Settings and close dialogs.
- Open an installed app, then return to Morph TV Lite 3.
- Add a test M3U or Xtream account; load Live TV; try H.264/AAC and HLS channels.
- Open a movie or series, seek, and return to the correct library view.
- Try Kidsy: picture and sound, not audio alone. Confirm fullscreen, Back and retry.
- Select a free theme, restart, and check that it remains selected.
- Test HDMI with a real connected source; test radio and prayer controls.

Please report the exact installation/playback message and TV firmware if a step fails. No physical Tizen 3 television has been verified yet.

## Validation limits

All generated scripts pass an ES5 parser. Browser tests simulate missing APIs and no Grid, verify CSS-variable output, navigation, themes and player cleanup. A real Kidsy stream was decoded in a desktop browser, including video frames. Local execution of an archived Chromium 47 binary was rejected by automatic approval review, so this is not evidence of execution on Chromium 47 or the Samsung hardware.

The main release remains separate and unchanged by this build script. Dependencies are pinned in `.tools/tizen3-build/package-lock.json`; runtime license notices are included in the candidate.
