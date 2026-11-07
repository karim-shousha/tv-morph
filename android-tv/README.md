# TV Morph Android TV preview

Separate Android TV APK for Android / Google TV (API 26+), including the user's Hisense Android 12 test target. It does not target Hisense VIDAA, Roku, LG webOS, or Samsung Tizen. It opens as a TV app and does not change the default Home launcher.

## User setup

The phone app's Television tab contains the complete system-specific guide. Select Android / Google TV. Generate the APK download link on the phone, download it on the TV (or transfer the APK by USB), permit installation for that browser/file manager when Android requests it, install, and open TV Morph from Apps. A native dialog shows the TV's local IP and a one-use six-digit pairing code valid for five minutes. Enter these in the phone app. A new code and revocation are available through Connect phone on TV.

No ADB or Developer Mode is required for this Android companion installation path. Installation still needs user interaction on the TV. Some TV browsers cannot download APKs; the guide includes file-transfer fallback. Actual menu paths and APK installation availability depend on the TV model and policy.

## Implementation

Assets reuse the existing TV UI with a platform adapter. Apps come from actual Android Leanback launcher activities; demo Samsung apps are bypassed. HDMI passthrough inputs come from TvInputManager and open through TvContract. Apps and HDMI launch requests are subject to device capabilities and Android permissions/policies. The phone reads apps and changes themes/favorites over a token-authenticated LAN HTTP API on port 8787. Keep the TV app open during customization; Android may stop its process in the background.

Pairing is rate limited to six attempts per minute, one use, and five minutes. Tokens are random 256-bit values and can be revoked on TV. The phone encrypts its token in Android Keystore-backed storage. The LAN HTTP connection is plaintext: this preview is for a trusted home network. No arbitrary shell commands or arbitrary JavaScript evaluation endpoint is exposed. The TV app only loads packaged HTML; SSL errors on external requests are rejected.

The phone's APK share server serves only the public TV APK on port 8788 for ten minutes after the user presses the download button. It stops when the phone Activity is destroyed. It does not serve credentials or arbitrary files.

## Build / verification

`python android-tv/build.py` builds and verifies the APK using the workspace toolchains. `python mobile-app/build.py` also builds and bundles it in the phone APK. `node android-tv/ui-check.cjs` tests the platform adapter, real-ID handling, config/favorites, HDMI callbacks and pairing UI with mocked Android APIs. `LanHttpCheck` tests actual local HTTP framing, body limits, browser-origin rejection and auth routing. These checks do not substitute for a physical Android TV test; the Hisense installation/pairing/HDMI integration has not been tested yet.

Public distribution still requires release hardening, current target-SDK/store compliance, device testing, and rights for any club imagery. This is a development preview.

## Remote update

The companion now exposes authenticated `/remote/key` and `/remote/text` endpoints. Keys and Arabic/English text operate only on the packaged TV Morph UI; text requires a focused editable non-password field. Music-stream volume/mute uses the normal Android audio API and depends on the device/audio routing. Other apps cannot be controlled by this companion route. The updated TV APK is required for these endpoints.

## TV Morph Play (0.4.0)

The built-in library is a private Activity, reachable from the new TV Morph Play navigation item or the virtual IPTV favorite. Xtream credentials are configured on the paired phone, validated by the TV, then encrypted with AES-GCM and Android Keystore. Stream URLs are built natively from validated numeric item IDs; credentials and stream URLs are not returned to HTML. Library lists are paginated and cached with bounded category count. Profile-specific favorites live in the private UI storage. Clearing the account removes its encrypted file and native session. The player is a non-exported native Activity using Android VideoView/MediaPlayer. Physical provider playback and codecs remain device tests; fixture API and UI tests do not establish stream compatibility.

## Play and language update (0.5.0)

TV Morph Play is automatically added once to the TV Morph home favorites and has its own Android TV launcher entry. Existing favorite order is preserved. Arabic/English can be selected on the phone and in Play settings; provider titles and categories retain their original names.

Movies and episodes save progress every five seconds and on pause, separately per profile and item. Live channels do not resume; completed or nearly finished videos clear their bookmark. Long-press OK or a tile for 650 ms to toggle favorites without playing. Settings include resume enable/disable, clear history, Fit (original proportions), Fill (crop edges), and Stretch. Refresh channels clears the native catalog cache and reloads the current library.

Validation: APK signatures, phone/home/library browser checks, native fixture account/cache tests, Android preference isolation, and video sizing math. The user confirmed existing playback on Hisense. The new cold launcher path, actual stream seeking/resume and video geometry still require physical TV verification. Update both APKs without uninstalling to preserve private account data and favorites. Samsung/LG Play support is unchanged and is not implemented.

## Radio and home shelves (0.6.0)

Android TV home now has scrollable TV app and radio shelves, preserving theme artwork and favorites. The installed-app shelf uses actual discovered launch IDs, not sample programs from other services. The radio card opens a separate native player with Quran/FM/favorites filters, long-press favorites, play/pause and remote navigation. Leaving the player releases audio; audio focus and a 20-second preparation timeout are handled. No background radio service is advertised.

The Quran/FM catalog was reviewed read-only from HER radio_repository.dart. Eight direct audio endpoints passed bounded HTTP checks and Android MediaPlayer preparation on 2026-10-22: Cairo Quran, Mishary Alafasy, Quran Tafsir, Nagham, Nogoum, 9090, SomaFM Groove Salad and Secret Agent. The old Indie Pop endpoint failed and is excluded. See radio-verification.json for endpoint results. Preparation verifies decoder/network acceptance, not listening on every TV; physical TV sound and remote long-press remain device checks. These stations require Internet and can change availability.

Home shelf tests cover actual app IDs, radio launch IDs, bilingual labels and vertical focus scrolling. Existing phone/IPTV checks also pass. This update targets Android TV; Samsung/LG radio integration is not implemented. HER source and production configuration were not modified.

## Home, radio and guided updates (0.7.0)

The Android home keeps its layout direction fixed while translating text, preventing the full Arabic mirror seen on the physical TV. Its source/help/browser toolbar is outside the scroll feed and stays at the bottom. Hold OK on a home favorite for 650 ms, use left/right to reorder, then OK or Back to finish. Short OK still launches; moving saves private favorite order. The phone offers validated background gradient, card and text colors, in addition to accent/artwork. About us credits Karim Aboushousha and Hassan Shehata on phone/TV.

Radio is now a packaged WebView design with an explicit now-playing area, filters and long-press favorites. Native MediaPlayer has an eight-second preparation limit, identifies failures, and falls back to a packaged HTML audio player using the fixed station URL. Certificate validation stays enabled. Leaving stops playback. Native tests prepared and started all eight radio streams muted on the Android phone; browser tests cover favorites/no accidental playback, state and fallback/failure feedback. The prior TV screenshot exposed a physical device failure: the revised player still needs confirmation on that Hisense, and phone tests are not a substitute for TV audio verification.

Play has a new cinema-style library skin, larger poster area, clearer category sidebar, mint focus and restrained gradients. Resume/favorites/settings behavior remains unchanged. Browser screenshots use fixture content.

The phone's Install/update on TV button branches on the detected system. A paired Android TV with selfUpdate capability receives the public bundled APK from the phone foreground download service. TV-side update staging only accepts a private IPv4 host on HTTP port 8788 at /tv-morph.apk, refuses redirects, bounds downloads to 32 MiB, checks package identity/version/signature against the installed app, and serves one verified file read-only through a non-exported URI provider. The normal Android allow-install-source screen and package installer confirmation are required; the phone reports queued, never installed. Tests cover valid/invalid source routes, own signed archive acceptance, malformed archive rejection, and read-only exact-file provider behavior. Actual TV installer interaction remains a physical check. Existing 0.6 and earlier TV installs require one manual upgrade before they expose this API.

First Android installation is guided/manual until a receiver exists. Samsung routes to the existing experimental developer install flow, requiring Developer Mode and the user's device certificate; APK is not a Tizen package. LG remains discovery-only. No universal silent installer is claimed. GitHub upload was cancelled at the user's request.

## Daylight UI and theme library (0.8.0 preview)

Phone UI now uses a warm light background, purple/mint/peach actions, a TV illustration built in CSS, a bright touch remote and a categorized theme library. Arabic/English and all connection/remote/IPTV actions are retained. Categories filter actual previews; hockey/basketball/American football collections explicitly say coming soon. Barcelona, Real Madrid and Egypt have bundled crest images, distinct television palettes, watermark/hero identity and club metadata. User-selected title, subtitle and color edits remain available.

The user deferred commerce until Google Play publication. All previews remain usable; no purchase flow or three-day lock is activated. The final business direction is USD 1 per theme, one-time Google Play purchases, no subscriptions and no Stripe. Bundle prices are unspecified. Product preparation is under ../monetization; it is not a billing implementation. Club asset commercial rights are not established.

Validation: 360/412 pixel layouts without page overflow, light background, collection filtering, crest loading, English/Arabic navigation, existing phone flows, TV native adapter/club screenshots, and existing IPTV/radio checks. Native services are mocked in browser checks. Public preview remains Android-focused, not universally installable on all TVs. Local download links use each phone's own network address and carry the bundled APK; no user's home IP is required for other users.
