# TV Morph â€” Android preview

Android companion for the TV Morph Samsung Tizen widget. The phone discovers Samsung TVs on its local /24 subnet, provides nine theme presets and customization, and contains a local widget signer and SDB installer. Installed apps can be read and selected as favorites; opening an app sends a launch request.

## First installation

1. Connect phone and supported TV to the same Wi-Fi network.
2. On the TV, enable Developer Mode from Apps (12345), set Host PC IP to the phone IP displayed by Studio, and restart the TV.
3. Select the TV in Studio, customize the design, and choose installation.
4. Complete Samsung account authentication in the external browser when requested. Keep the app available during installation.

This is developer installation, not a firmware replacement or a universal store installation mechanism. YouTube and IPTV applications remain separate installed applications. HDMI and protected Samsung system settings depend on the TV's available APIs.

## Verification and current limits

- APK builds and its Android signature verifies.
- Standalone Java widget signatures and every referenced file were validated independently with JDK XML DSig.
- A separately signed test widget was transferred, installed and launched on a Samsung UN55RU7100FXZC running Tizen 5.0 using this Java SDB client from the computer.
- The Android app runs on the test S25 Ultra and identifies the TV over its local HTTP endpoint.
- Full phone-side Samsung authentication, signing, installation and subsequent customization are still awaiting end-to-end verification. The TV currently rejects the phone's SDB connection until its Developer Mode host IP is updated.
- Newer secure SDB authentication is not implemented. No claim of compatibility with all Samsung models or other TV brands.
- Weather/clock in the phone's design preview are sample values; live data is handled by the TV widget.
- Android min SDK 26, target SDK 30. This preview is not prepared for current Play Store publication. WebView debugging is enabled for development and must be disabled before a production release.

## Privacy and signing

Permissions are Internet and network state. Samsung login is external; Studio never requests the password through its UI. Keys and cached tokens are encrypted in app-private storage using Android Keystore. Public CA certificates and unsigned widget assets are bundled; personal TV certificates and private keys are not bundled. SDB and TV HTTP operate on the local network without transport encryption. Use a trusted LAN.

The phone-managed TV app uses package `ClearMob01`, separate from the original `ClearTV001`. Do not delete app data or signing credentials if future updates must retain the same author identity.

## Build and checks

Run `python mobile-app/build.py` from the workspace root. The script uses the workspace's Android and Java toolchains and keeps the APK signing key under `.tools/tizen/private`, outside packaged assets. Run `node mobile-app/tests/ui-check.cjs` for the isolated UI bridge check.

The football images are user-supplied project assets. Public distribution requires appropriate rights to any club logos, photographs, and other third-party assets.

## LG discovery preview (0.1.1)

SSDP discovery and private-IP identification of LG TV MediaRenderer descriptors are included. UI shows separate webOS preparation instructions and disables Samsung installation/customization actions when LG is selected. Native code also rejects routing an LG selection to SDB. This is discovery-only support: webOS packaging, SSH key pairing, installation, app enumeration and customization transport are not implemented yet. A real LG TV/model is needed for integration testing. Legacy NetCast is not advertised as compatible.

LG descriptor parsing, manufacturer/type filtering and DTD rejection were tested on the Android phone with a separate instrumentation APK. Discovery packets and TV responses still require a physical LG test. UI tests cover LG/Samsung switching and disabled controls.

Official setup reference: https://webostv.developer.lge.com/develop/getting-started/developer-mode-app

The attached original JPEG is used unchanged as the Android launcher icon and in-app brand image. Android package and signing identity are retained so installing the rebrand updates the existing app and preserves its data. Build output is `TV-Morph-Preview.apk`.

## Android / Google TV and guided setup (0.2.0)

The Television tab now has explicit system selection, a step-by-step guide for Samsung Tizen, LG webOS, Android/Google TV and unsupported systems, persistent visible connection state, manual-IP troubleshooting and connection gating. Merely completing guide steps does not mark a TV connected. Changing system or IP invalidates the UI connection. LG remains discovery-only.

Android / Google TV uses the separate `android-tv/TV-Morph-Android-TV-Preview.apk` bundled in the phone app. Initial APK installation is manual on TV, followed by one-use code pairing. Developer Mode / ADB is not required for this path. Once verified, the phone can apply themes, read TV apps, select favorites and send app launch requests to the companion. Full native integration is pending a physical Hisense test. See `android-tv/README.md` for implementation, trusted-LAN limitations and setup.

The native LAN API and Android TV adapter have independent automated checks. The phone UI check covers all guide types, connection gating, APK link display and pairing. Native services are mocked in UI tests; no physical TV installation is inferred from those tests.

## Automatic discovery and remote (0.3.0)

Opening the Television tab starts local discovery. Samsung's device endpoint, UPnP descriptors and Android TV Remote v2 mDNS announcements identify devices and choose the guide automatically. Manufacturer alone is not treated as proof of Android: ambiguous Hisense/Sony/TCL descriptors keep the OS unconfirmed. Manual type selection is now an optional collapsed fallback. Devices that do not advertise supported services cannot be identified reliably before setup. mDNS requires the phone and TV to share a reachable local network.

The Remote tab includes D-pad, OK, Back, Home, capability-gated volume/media/channel buttons, and an Arabic/English text field. Android companion remote navigation and keyboard operate inside TV Morph; volume uses Android's audio API. This does not inject keys or text into other Android applications. Focus an editable TV Morph field before sending text. Text replaces that field, and password fields are excluded.

Samsung offers an experimental native LAN WebSocket remote mode on port 8001 after TV approval. Tokens stay encrypted on the phone. The endpoint may control the active TV application, but text acceptance and Arabic support depend on that app/model. TLS-only port 8002 is not implemented and no TLS verification bypass is added. Internal TV Morph remote mode is also available through the authorized developer inspector after updating the TV widget. LG remote is not implemented. Switching device or IP invalidates the UI remote session.

Primary protocol implementation reference (independent Java implementation, no library bundled): https://github.com/xchwarze/samsung-tv-ws-api/blob/master/samsungtvws/remote.py

Checks cover auto-discovered TV selection without manual system choice, capabilities, remote command payloads, Arabic text preservation, focused-field input and rejection of unsupported internal keys. Native services are mocked in browser tests. A separate Android instrumentation run passed on the phone using a local simulated Samsung WebSocket server: query preservation, handshake, masking, key payload and Arabic UTF-8/base64 were verified. This does not verify a real Samsung TV endpoint. Physical TV remote tests are still required.

## Download reliability fix (0.3.1)

The public TV APK share button now starts a foreground Android service with a visible notification and stop action for a ten-minute session. It survives the phone Activity going to the background; the share action checks a local HEAD response before reporting the link ready. APK downloads now support HEAD, Content-Disposition and byte-range resume. The service exposes only the public packaged APK. The Activity uses singleTask to avoid duplicate share-server owners. Full APK hash, HEAD/body semantics, range responses and existing HTTP auth/origin checks passed local tests. Physical TV browser download verification remains required.

## Touch remote, personal artwork, reordered cards and Play (0.4.0)

The touchpad maps swipes to directional navigation and taps to OK. It is a navigation touchpad, not a system-wide mouse. Its scope follows the existing remote mode. The phone image picker uses Android's document picker and needs no broad storage permission. It resizes/re-encodes selected PNG/JPEG assets, preserves PNG alpha, bounds encoded size, and stores only the selected processed image. Logo/artwork are for the TV interface; they do not dynamically replace the APK launcher icon. Favorites have explicit up/down controls and save in the selected order.

TV Morph Play currently targets the Android TV companion. It accepts the user's Xtream server, username, password, library name, stream format and live/VOD/series toggles. Provider requests and stream URLs stay in native code. Credentials are encrypted at rest with Android Keystore on each device. LAN API transport is HTTP on a trusted home network; provider transport follows the supplied HTTP/HTTPS server URL. Secrets are not in the public APK, UI localStorage, logs or library responses. Users enter credentials in the app, not chat.

The TV library includes categories, title search, paged lists, per-profile favorites, movies, series/episodes and a native VideoView/MediaPlayer player. Supported codecs and HLS/TS playback depend on device/provider; no DRM bypass or channel subscription is supplied. Phone browsing sends a play request to the TV. Playback, pause and seek can use the remote while the internal player is active. Samsung/LG Play is not implemented.

Tests: native Android instrumentation passed image alpha/size processing, simulated remote UTF-8, fixture Xtream authentication/categories/live/VOD/episodes, URL escaping, encrypted account storage and removal. Browser checks cover image selection payload, reordered favorite IDs, touchpad direction, private password-field clearing and IPTV play requests. TV library browser checks cover categories, favorites, episode selection and Arabic remote search. Fixtures use no real provider credentials. Actual subscription playback remains unverified until credentials are entered by the user. Update the TV APK as well as the phone APK.

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

## Connection UX correction (0.7.1)

Discovery and device results now precede setup instructions. Manual system selection is an explicit visible button with aria-expanded state; its picker opens without relying on a collapsed details summary. There is one visible installation action whose label/capability follows Android/Samsung/LG selection. The old Samsung-specific duplicate button is hidden and only retained as the internal handler for the Samsung developer path. LG/unknown install actions are disabled; selecting a system never grants connection or installation authorization. Existing Android receiver updates use the 0.7 authenticated request path; first installation onto an unprepared TV is still not automatic and requires screen setup. Tests cover initial action order, manual picker, platform labels/gating, hidden duplicate and update request.

## Daylight UI and theme library (0.8.0 preview)

Phone UI now uses a warm light background, purple/mint/peach actions, a TV illustration built in CSS, a bright touch remote and a categorized theme library. Arabic/English and all connection/remote/IPTV actions are retained. Categories filter actual previews; hockey/basketball/American football collections explicitly say coming soon. Barcelona, Real Madrid and Egypt have bundled crest images, distinct television palettes, watermark/hero identity and club metadata. User-selected title, subtitle and color edits remain available.

The user deferred commerce until Google Play publication. All previews remain usable; no purchase flow or three-day lock is activated. The final business direction is USD 1 per theme, one-time Google Play purchases, no subscriptions and no Stripe. Bundle prices are unspecified. Product preparation is under ../monetization; it is not a billing implementation. Club asset commercial rights are not established.

Validation: 360/412 pixel layouts without page overflow, light background, collection filtering, crest loading, English/Arabic navigation, existing phone flows, TV native adapter/club screenshots, and existing IPTV/radio checks. Native services are mocked in browser checks. Public preview remains Android-focused, not universally installable on all TVs. Local download links use each phone's own network address and carry the bundled APK; no user's home IP is required for other users.

### VIDAA discovery correction

VIDAA is an explicit discovery-only system, never treated as Android. SSDP now queries MediaRenderer, ssdp:all and DIAL, preserves multiple validated descriptor URLs per IP, bounds descriptor work, and holds a Wi-Fi multicast lock while scanning. Known VIDAA/Basic TV descriptors are recognized; Hisense without OS evidence stays unconfirmed. Android mDNS collection no longer depends on SSDP completion. Browser/native tests cover VIDAA parsing, no fabricated readiness, visible manual selection, disabled unsupported installation and hidden Android pairing UI. Real VIDAA discovery still depends on the TV advertising a service and local network reachability.

Official troubleshooting: https://www.vidaa.com/customer_support/what-should-i-do-if-the-vidaa-app-media-function-isnt-working/ (Content Sharing), https://www.vidaa.com/customer_support/how-can-i-connect-the-vidaa-app-to-my-tv/ (same network).
