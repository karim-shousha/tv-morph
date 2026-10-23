# TV Morph · Public Preview 0.8.10

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

## Preview 0.8.10 · Fire TV

The phone adds an experimental Fire OS installation path: enable ADB debugging, enter the TV IP, approve the device prompt, then send the bundled signed Android TV 0.8.8 APK. It checks the Android SDK before installation, confirms Package Manager Success, and opens TV Morph for code pairing. The RSA identity is stored in the encrypted phone vault. Vega OS is excluded. After code pairing, existing phone theme, remote and update features are reused.

The same ADB transport installed and launched the receiver on a physical Hisense 43A4NF running Fire OS 8.1.8.0 (Android SDK 30, reported build model AFTHU71990), using the PC test harness. The phone installer integration still needs a physical phone test. Amazon setup guide: https://developer.amazon.com/docs/fire-tv/connecting-adb-to-device.html

## 0.8.10 · Persistent Move mode

Hold OK until Move appears, then release OK and use Left/Right. A new OK press saves; Back exits Move. Held-key repeats and the release click do not close Move. Shared by the Android/Fire TV and Samsung bundles.
