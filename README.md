# TV Morph · Public Preview 0.8.19

**Developed by Karim Aboushousha & Hassan Shehata**

واجهة تلفزيون قابلة للتخصيص من موبايل Android: ثيمات، صور، مفضلة، ريموت داخلي، وراديو وIPTV لنسخة Android TV.

## Download / التحميل

[TV Morph download center · مركز تنزيل الإصدارات](https://tvmorph.zainbot.com/)

The downloads are hosted on our Coolify server. This repository supplies the deployment build context.

- [Android phone app · تطبيق الموبايل](https://tvmorph.zainbot.com/download/phone)
- [Android / Google TV receiver · نسخة شاشة Android فقط](https://tvmorph.zainbot.com/download/android)
- [SHA-256 checksums](SHA256SUMS.txt)

Install updates over the existing application; do not uninstall if you want to retain pairing, account and favorites. The shared phone APK has WebView debugging disabled.

## Compatibility / التوافق

| System | Current preview support |
| --- | --- |
| Android phone 8+ | Theme editing, discovery, guided connection and remote UI |
| Android / Google TV 8+ | Separate APK, pairing, themes, app favorites, internal remote, radio and experimental user-supplied IPTV |
| Samsung Tizen | Discovery and experimental remote/developer installation path; requires Developer Mode and a certificate for the user's TV. **The Android TV APK does not install on Samsung.** No Samsung IPTV/radio receiver is included. |
| LG webOS | Discovery only; TV installation and remote not implemented |
| Hisense VIDAA | VIDAA 0.1 hosted development web build with themes and direct media. Developer-page installation depends on firmware and remains unverified on a physical TV. Phone pairing is not implemented. **VIDAA is not Android.** |
| Roku / other systems | Installation unsupported |

Physical installation and playback were reported working on one Hisense Android 12 device. This does not establish compatibility with every model. Updated radio audio, the TV installer confirmation and other TV systems still need physical testing. Browser/native fixture checks are not universal device certification.

## First setup / أول تشغيل

1. Install the phone APK on Android and open TV Morph.
2. Connect phone and TV to the same trusted Wi-Fi. Use Television → Search. A visible manual-system button is available when discovery is inconclusive.
3. On Android TV, first install the separate receiver APK, approve installation for the browser/file manager if requested, and open TV Morph. Enter its six-digit pairing code in the phone app.
4. Apply a theme or open Remote. Android remote/text controls operate within TV Morph; they are not a universal controller for other apps.
5. For receiver 0.7+, the phone can send later signed updates to the paired TV; normal TV-side installer permission and confirmation remain required.

Each phone bundles the TV APK and can start a ten-minute local download session. Its link uses **that phone's own IP**, not the developer's home network. That link is not a public Internet address. The GitHub links above are public downloads.

VIDAA troubleshooting: keep devices on the same network and enable Content Sharing when available. See [official VIDAA guidance](https://www.vidaa.com/customer_support/what-should-i-do-if-the-vidaa-app-media-function-isnt-working/). Some devices do not advertise a service that this preview can detect.

## What changed in 0.8.2

Complete poster artwork, a pre-play detail page with resume/restart, a picture-size control accessible with Up/Menu during playback, blue first-run theme with bilingual TV Morph copy, Zamalek crest and club text, stronger daylight contrast, explicit network OS/firmware discovery, and hosted version downloads. Billing remains disabled.

## Preview status

The app includes a light/dark Arabic/English UI and theme library previews. Barcelona, Real Madrid and Egypt have crest/palette/detail previews. Future sport collections are marked coming soon. **Payments, paid activation and three-day trial expiry are disabled.** The intended future model is one-time theme purchases through Google Play, not subscriptions. This APK is not yet a Google Play production submission.

Credentials are not bundled. Users supply their own IPTV account in the app; no subscription or channel access is provided. Pairing uses an authenticated local HTTP API, intended for a trusted LAN. Never enter account passwords in chat.

Club names, crests and user-supplied photographs remain the property of their respective owners. No affiliation or commercial logo license is claimed. Review rights before commercial theme distribution.

## Browser theme preview

https://tvmorph.zainbot.com/web-tv.html is a browser-only theme preview, with no installed-app enumeration, native TV controls, IPTV or receiver pairing. It passed desktop browser checks but still needs physical VIDAA/LG/Samsung browser tests. It is not an installed app or a verified universal compatibility path.

## Phone update 0.8.3

Locks pinch/double-tap zoom in the Android WebView, keeps the logo/name on the physical left and TV IP on the right in both languages, and gives dark appearance a high-contrast twilight-blue palette. Android TV receiver remains 0.8.2.


## VIDAA development build 0.1.0

[Application](https://tvmorph.zainbot.com/vidaa.html) · [step-by-step install guide](https://tvmorph.zainbot.com/vidaa-install.html). A hosted web app, not an APK. Includes themes, Arabic/English, remote navigation, direct HTTPS video/audio library, favorites, playback resume and picture size. Browser checks passed using generated local media; no physical VIDAA certification yet. Developer-page installation requires firmware support. No phone pairing, native app launch, HDMI or Xtream imports. The ZIP is a deployment archive, not a USB installer.


## Hero layout update 0.8.4

Phone and Android TV builds are now 0.8.4. The shared theme UI uses separate crest, text and artwork columns, fixed physically left-to-right in Arabic and English. Removes the duplicate custom artwork overlay. Tested all ten palettes in both languages. Samsung developer-install bundles include the same shared correction; physical Samsung installation is not certified across all models.


## Samsung phone hotfix 0.8.5

Fixes the certificate sign-in redirect by using the reference loopback callback http://localhost:4794/signin/callback, instead of an ephemeral port and random callback path that Samsung rejected. Port conflicts now fail clearly instead of falling back to an unregistered URL. Android TV receiver remains 0.8.4. Local callback checks pass; user sign-in, certificate issuance and TV installation still require end-to-end verification.


## Samsung update 0.8.6

Modern TV Morph branding/icon, persistent Arabic/English switch, scrollable app shelves and fixed home tools in the Samsung developer package. Reuses a verified inspector endpoint instead of restarting a debug session for every theme change. Debug launch detects the returned port without waiting for shell EOF; a stale endpoint gives bounded recovery instructions. Tested on the connected Samsung: install/launch, 14 installed-app cards and five sequential phone-to-TV theme changes (77–355 ms each). Android TV receiver stays 0.8.4. Samsung IPTV/radio playback is not included.

## Preview 0.8.7

Samsung now packages the same IPTV library, details screen and radio UI used on Android TV, with Samsung AVPlay for playback. IPTV and Radio are pinned as default Home apps once; they can subsequently be rearranged or removed. The hero uses separate crest, centered text and artwork columns in Arabic and English. Returning focus to the header restores the full hero.

Fixes include explicit fullscreen bounds for older Tizen engines, player cleanup, and restoration of IPTV form details from the phone encrypted vault. A locally generated video reached AVPlay PLAYING with advancing time on a physical Tizen 5 TV. Subscription-provider playback, audible radio output and the final fullscreen regression still need user confirmation; not certified across all TV models. LG and VIDAA distribution limitations remain unchanged.

## Preview 0.8.8

New television installations default to English; saved user language choices are retained. Selecting a different theme clears the previous theme custom text, logo, artwork and color overrides. Restore defaults now sends explicit empty image fields so old TV artwork is removed. Samsung setup displays the live phone IP beside Apps → 12345 → Developer Mode ON → Host PC IP.

## Preview 0.8.12 · Fire TV

The phone adds an experimental Fire OS installation path: enable ADB debugging, enter the TV IP, approve the device prompt, then send the bundled signed Android TV 0.8.8 APK. It checks the Android SDK before installation, confirms Package Manager Success, and opens TV Morph for code pairing. The RSA identity is stored in the encrypted phone vault. Vega OS is excluded. After code pairing, existing phone theme, remote and update features are reused.

The same ADB transport installed and launched the receiver on a physical Hisense 43A4NF running Fire OS 8.1.8.0 (Android SDK 30, reported build model AFTHU71990), using the PC test harness. The phone installer integration still needs a physical phone test. Amazon setup guide: https://developer.amazon.com/docs/fire-tv/connecting-adb-to-device.html

## 0.8.10 · Persistent Move mode

Hold OK until Move appears, then release OK and use Left/Right. A new OK press saves; Back exits Move. Held-key repeats and the release click do not close Move. Shared by the Android/Fire TV and Samsung bundles.

The core interface offers Arabic, English, French, Simplified Chinese and Japanese. Pairing dialogs support all five. Additional languages are an initial translation preview: untranslated technical instructions use English.

## 0.8.11 · TV home spacing

Use explicit 22px app shelf margins for Tizen engines without flex gap. Move Help tools to the bottom with credits and focus hint inside the bar; increase the home feed viewport. Shared Android/Fire and Samsung builds. Home/startup settings use the system Home picker where exposed; Samsung uses the firmware Autorun Last App setting. No universal launcher replacement is claimed.

## 0.8.12 · Hero sizing and compact theme dock

Phone Personal touch controls independently adjust hero title/subtitle (70–120%), artwork/logo (70–125%). Values are validated by both the phone native config and shared TV receiver, saved, and reset to 100% on a new theme. Artwork stays clipped inside its own column. The bottom dock matches the current app-card glass background, border and corner shape; focus hint, controls and developer credit share one centerline in an 84px bar.

## 0.8.13 · Android/Fire TV Home navigation and app PIN

Android/Fire TV Settings → TV home & startup offers the OS Home picker plus an optional accessibility Home override. The service is disabled until the user enables it in system Accessibility settings after the in-app explanation. It receives window-state changes filtered to the resolved Home package and matches the exact Home activity, leaving settings screens in the same package alone. It cannot retrieve window content and requests no key filtering or gesture capability. Competing rapid launcher returns pause the override. Turn off Projectivy’s own Override current launcher before testing TV Morph. Boot fallback must also be enabled for the service-connect startup attempt. No actual wake/boot verification on a physical TV has been completed for this version.

Android/Fire TV Settings → App locks · PIN sets a 4–8 digit PIN and selects apps locked when launched through TV Morph, including its IPTV/radio buttons and paired-phone open/play requests. Changing/removing the PIN requires verification. A random-salt PBKDF2-HMAC-SHA256 verifier is stored privately on the TV, with a 30-second wait after five wrong PIN attempts. No PIN is sent to the phone. This does not lock apps opened from another launcher or system shortcuts; it is not an operating-system app lock. These native features are not implemented on Samsung Tizen or VIDAA.


## 0.8.14 · Cinematic home and IPTV settings

Full-screen fading background, up to five custom slideshow images, theme glass colors, reflection and opacity controls, independent artwork/text/logo positioning, header weather and sidebar navigation. TVM-IPTV and TVM-RADIO are default apps. IPTV adds a section dashboard, library preferences and Xtream account entry directly on TV.

Browser fixture checks cover Android/Fire and Samsung bundles; native playback, performance and provider connectivity still require testing on the physical TV.


## 0.8.15 · Media theme and connection recovery

IPTV and radio inherit the selected TV palette. Home app rails calculate whole-card widths. Read-only phone requests retry a failed connection once with a longer connection deadline; mutating actions are not replayed. TV retries starting its LAN listener on resume after an initial bind failure. A reachability check found the reported TV responding on the original address; the earlier interruption cause remains unconfirmed.


## 0.8.16 · Artwork controls across themes

Both crossfade layers update their scale when artwork controls change. Applying layout updates no longer resets a running slideshow image. The phone preview shows the first selected slideshow image on every palette. Tests cover single image and slideshow X/Y movement and size on all ten themes in Android and Samsung bundles. Physical TV verification remains pending.


## 0.8.17 · Reconnect guidance and phone controls

Phone checks saved TV connectivity at startup, foreground resume and remote entry. Failed remote sends disable controls and show a reconnect action. The five-minute pairing-code lifetime is distinct from the persistent paired token. Remote buttons/touchpad have separate modes and a compact visual layout. Background upload UI adds clear image collection controls and language-aware labels. Position sliders explicitly use LTR controls so right increases X even in Arabic. Android Internet action resolves a browser intent and reports missing browser; Samsung resolves a browser app or reports absence. Physical browser launch and reconnect behavior require device verification.


## 0.8.18 · Gentle app focus motion

Focused app cards lift slightly and scale 4.5%, with a 9% icon zoom and theme glow. Rails reserve vertical room for focus outlines. Reduce Motion and system reduced-motion preferences suppress transforms. New/reset glass opacity defaults to 18%; existing chosen opacity remains saved. Both TV bundles passed geometry, motion and app-reorder fixtures. Physical TV performance remains to be verified.


## 0.8.19 · Family profiles, unified IPTV search and channel EPG

Up to six local family profiles share the provider account but isolate home theme, pinned apps, IPTV/radio favorites and playback progress. The default profile retains existing data. Select profiles from the TV header or the phone family panel while the TV is on Home. Profiles are local to each TV, with no cloud sync or child-lock promise.

Search all live channels, movies and series by title inside TVM-IPTV. The first 20 matches from each enabled section are shown; choose a section for the full paginated results. Failed sections are identified while other results remain available. The first search may need to fetch provider catalogs.

EPG uses the provider's get_short_epg endpoint for a selected live channel, showing current/upcoming listings in TV local time. Missing or failed data is reported; no synthetic schedules, recording or catch-up functionality are implied.

Native Java tests cover progress isolation/clear and actual EPG HTTP parsing against a local fixture provider. Browser tests cover both TV bundles, phone profile selection, search, EPG and regressions. Samsung AVPlay/provider transport is mocked; physical playback and live provider data still require user testing. Also improves Fire TV identification from advertised device metadata.

## 0.8.20
Seven ready sports themes: Real Madrid, FC Barcelona, Zamalek, Basketball, Baseball, Montreal Canadiens and Toronto Maple Leafs. Generated fan artwork (not official roster photos), alpha PNG assets are bundled offline. Theme colors carry into IPTV/radio. Size and movement controls remain available. Android/Samsung shared UI, phone preview, family profiles and layout tests passed; not yet physically tested.
Signed APKs include the complete offline artwork library. The phone package contains the matching TV APK and Samsung bundle. SHA256SUMS verifies each complete package.

Includes a new generated Al Ahly team cutout. Mobile interface translations now include 857 bundled entries in Arabic, English, French, Simplified Chinese and Japanese; install guides, dynamic native error fragments, placeholders and download notifications are included. UI language/RTL tests passed on all five languages. Translations do not require a network service at runtime.

## 0.8.23
Prayer times: themed TV dashboard, current/upcoming prayer and countdown, Gregorian/Hijri dates, manual city selection, Egyptian/Umm Al-Qura/ISNA/MWL methods and standard/Hanafi Asr. Today/tomorrow AlAdhan schedules are cached by exact date, coordinates, timezone and method; no invented offline times. Egyptian and Makkah recordings copied byte-for-byte from the user-authorized HER assets (egypt.mp3 and makka.mp3). Audio is opt-in and foreground-only; not during other apps or standby. DST and duplicate/missed-trigger guards have fixture coverage. No physical sound test has been performed.
Al Ahly artwork reverted to the original al-ahly-duel.png at user request; the generated alternative is excluded from bundles. Other ready sports themes and complete mobile UI language coverage remain.

Prayer time responses now request ISO timestamps with provider UTC offsets. The clock/date use bundled Moment 2.31.0 and Moment Timezone 0.6.5 (MIT, IANA data) so old TV timezone databases cannot omit Egypt DST.
Deployment keeps only the two current APKs in the Git tree and Docker context. Older binaries remain in immutable Git snapshots; exact nginx archive routes preserve their original public URLs and checksums. Local distribution archives are retained. prepare.py records archive sources before each release.

## Startup option 0.8.23
Android/Fire OS TV Settings → Launch when TV starts. Opt-in full boot launch, separate from Home/launcher selection. Some firmware needs manually granted Display over other apps permission; unsupported firmware may block startup. Standby wake is not a full boot.

0.8.23 fixes phone-to-TV update delivery for receiver APKs larger than 16 MiB. Update the phone companion first.

## 0.8.24 compatibility and performance
Read-only capability checks distinguish receiver discovery, code pairing, self-update and reachable network ADB. Reachability is not authorization. Guided Android/Fire OS installation supports classic ADB port 5555 and validates Android 8+ before sending the bundled signed receiver; pairing-code wireless ADB is not implemented. TV Settings adds Automatic / Light / Full performance modes. Automatic uses Android low-RAM/total-memory signals when available; Light disables blur, animations and background slideshow while retaining theme colors and focus visibility. Physical device coverage remains limited.

## 0.8.25 player, layout and prayer update
New native Android/Fire OS player controls with poster/title, timeline, transport, sizing and device-supported track selection. Samsung AVPlay controls gain poster/timing/theme styling. Shared home rails use whole-card stops; prayer volume navigation no longer traps Up/Down; Home displays the next prayer and countdown. Appearance focuses the active theme. Argentina/Portugal themes included. Portugal is generated fan artwork. Argentina uses a modest-resolution licensed celebration photograph (Sebas, CC BY 3.0), not the requested generated Messi cutout; credits are in About. Native playback still needs physical device testing.


## 0.8.40

Four-step phone setup, an app icon library with search and favourite ordering, real download rings, and Android/Fire TV app and storage management. App removal uses the system confirmation; system apps have no uninstall action in TV Morph. Native storage screens need physical device testing. Stable package IDs, signing keys and preference keys remain compatible with existing installations.


## 0.8.41

Four-step connection setup with the phone IP inside Samsung preparation. App icon library with search, favourites and ordering; real download progress rings. Android/Fire TV app and storage management opens system app details or a user-confirmed uninstall request; no automatic system-app removal. Visible legacy branding cleaned. Update phone and TV. Storage management needs physical testing on your device. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.42

IPTV sidebar with continue watching, favourites and recently added; full posters and a viewport-safe library. Section search spans all categories, with a prominent unified search for channels, movies and series. The first dock app is focused and centered at startup. Update phone and TV. Provider metadata and physical playback depend on your device and subscription. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.43

Floating dock icons, larger text-only next prayer aligned closer to the right, and fitted TV canvas with bounded settings and input layouts. Optional startup update alerts on phone and TV; install this version first to receive future alerts. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.44

Android TV external apps, Live TV and HDMI now launch without flags that force a separate or reset task, preserving the caller return path. Build and launch-policy tests pass; Netflix and OEM TV Back behavior still require physical-device verification. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.45

Stable home dock: focus magnifies icons without recentering the whole rail on every move. Overflow scrolls only to reveal an offscreen icon. Optional Double Back return from external Android TV apps; enable navigation accessibility manually. Update phone and TV. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.46

Fix TV remote navigation in General and Weather & time settings: Up/Down follow option order, with Apps & storage inside the settings list instead of skipping directly to it. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.47

Redesigned radio library with sidebar categories, station search, larger colourful icons, and a dedicated player row that never overlays the catalog. Quran, FM and favourites retain long-press OK support. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.48

Faster home icon animation and direct ordered dock navigation, without moving the rail. Quran stations share the first row, with FM stations grouped below. Download center now clearly states Android 8.0 minimum. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.49

Back closes the open settings dialog first, preserving the page behind it. Includes faster dock navigation, Quran grouped above FM, and prominent Android 8.0 minimum requirements on the website. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.50

Navigation performance: translate changed subtrees instead of rescanning the document for every text update, scope focus discovery to the visible page, batch rail sizing, and remove expensive sidebar blur while keeping theme colours. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.51

Devotional prayer backdrop and full-screen prayer pause with countdown. Long-press parental controls: individual app PINs and persistent parent-granted time allowances without daily resets. External Android app timers require the optional navigation service; Samsung timers cover built-in IPTV and radio only. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.52

Persistent long-press app menu with lock state and remaining allowance; held OK no longer activates a menu action, and Android PIN keyboard Done submits correctly. IPTV home features the last-watched movie or episode, resume details and a cinematic empty-history backdrop. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.53

Persistent long-press app menu with lock state and remaining allowance; held OK no longer activates a menu action, and Android PIN keyboard Done submits correctly. IPTV home features the last-watched movie or episode and resume details, with browsing controls anchored at the bottom and hero artwork filling the available upper space, plus compact colourful floating section icons instead of wide cards. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.54

Refined IPTV home: a compact last-watched card, larger section icons, persistent top-right search and no duplicate header sections. Explicit remote navigation connects every section to Continue watching and back to the same section. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.55

Saved library pages appear immediately and refresh in the background, scoped by account and viewer. Fixed 10-second seeking without repeat acceleration. IPTV home has a compact card, larger icons and top-right search without duplicate sections. Back restores the selected launcher/IPTV icon, and vertical navigation from recent apps stays in the content instead of jumping to the sidebar. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.56

Player seeking distinguishes taps and holds: one tap moves 10 seconds; holding on the timeline repeats and gradually accelerates to 20- and 30-second steps. Releasing the key or leaving the player stops repetition, and every new press starts at 10 seconds. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.57

Colourful Wi-Fi shortcut beside Settings in the top navigation. Android opens Wi-Fi with network/system settings fallbacks. Samsung attempts the Tizen Wi-Fi operation and available Settings app, with a manual guide when direct opening is unsupported. Available in all five languages. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.58

Transparent Argentina WebP artwork and refreshed national-team pack without resetting the selected theme. Android timer fixes and phone remote requests to stop the current app or set its allowance, approved with the parent PIN on TV. External apps require the opt-in TV Morph Accessibility service. Physical Hisense enforcement remains unverified. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.59

Parental controls shortcut on the Design page. Stop now immediately requests the time-up screen on the paired Android TV; granting a new allowance still requires parent PIN approval on TV. The Play tab is now labelled IPTV in all five languages. Update both devices and enable the TV Morph Accessibility service for external apps. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.60

Standalone phone IPTV playback with the complete player, live/movie/series library and local viewing progress. TV controls collapse beside the Watch on phone button. Smooth IPTV scrubbing on Android and Samsung: a single tap moves ten seconds, while holding an arrow continuously previews the timeline with gradual acceleration. Playback seeks once on release, reducing repeated buffering. Previous playing/paused state and video boundaries are preserved. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.62

Phone IPTV categories now open in a large searchable drawer with full names and full-height scrolling. Selecting a category closes the drawer and displays its name above the content; Back closes the drawer first. The library uses the full page width. Available in all five languages. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.63

More room in phone IPTV: removed last-watch cards, duplicate search and the pagination bar. One global search and scrolling to load the remaining titles while preserving your position. TV keeps its existing cards and pagination. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.64

One global IPTV search on TV and phone. Android TV remote OK opens native text entry; Samsung input OK preserves the native IME action instead of submitting an empty search. Search covers live channels, movies and series. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.65

New supplied TVMorph logo on phone and TV, using WebP icons and a TV banner. Existing package IDs, signing and settings are preserved. Optional Home navigation was verified returning from YouTube on Fire OS 8.1.8.0; each device requires its own service setup. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.66

Five-language Home/startup guide on the phone TV page and website, with separate Fire TV, Android TV and Samsung instructions. Prepare or disable TVMorph Home Accessibility through authorized phone ADB, then finish setup and test on the TV. New WebP logo included. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.66

Five-language Home/startup guide on the phone TV page and website, with separate Fire TV, Android TV and Samsung instructions. Prepare or disable TVMorph Home Accessibility through authorized phone ADB, then finish setup and test on the TV. New WebP logo included. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.67

Restore religious artwork in Prayer times and Prayer pause. The image is now bundled as essential UI in Android/Fire TV, Samsung payload and phone packages, rather than excluded as an optional theme asset. No online image download is needed. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.67

Restore religious artwork in Prayer times and Prayer pause. The image is now bundled as essential UI in Android/Fire TV, Samsung payload and phone packages, rather than excluded as an optional theme asset. No online image download is needed. Lighter shading and more transparent cards reveal the background. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.68

Time-aware duas in Prayer times: morning, evening, after scheduled prayer time, between prayers and throughout the day. Eleven sourced Arabic texts with meanings in five languages, stored offline. Controls for disabling, 30/60/120-second rotation and the after-prayer reminder delay. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.


## 0.8.69

Fix Android TV HDMI numbering using physical input labels instead of system enumeration order, including remembered inputs. Improve high-quality personal WebP artwork support. No private artwork is bundled. Stable Android/Samsung package IDs, signing keys and existing storage keys are retained for update compatibility.
