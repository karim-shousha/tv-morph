# TV Morph · Public Preview 0.8.0

**Developed by Karim Aboushousha & Hassan Shehata**

واجهة تلفزيون قابلة للتخصيص من موبايل Android: ثيمات، صور، مفضلة، ريموت داخلي، وراديو وIPTV لنسخة Android TV.

## Download / التحميل

- [Android phone app · تطبيق الموبايل](https://github.com/karim-shousha/tv-morph/raw/refs/heads/main/TV-Morph-Phone-0.8.0.apk)
- [Android / Google TV receiver · نسخة شاشة Android فقط](https://github.com/karim-shousha/tv-morph/raw/refs/heads/main/TV-Morph-Android-TV-0.8.0.apk)
- [SHA-256 checksums](SHA256SUMS.txt)

Install updates over the existing application; do not uninstall if you want to retain pairing, account and favorites. The shared phone APK has WebView debugging disabled.

## Compatibility / التوافق

| System | Current preview support |
| --- | --- |
| Android phone 8+ | Theme editing, discovery, guided connection and remote UI |
| Android / Google TV 8+ | Separate APK, pairing, themes, app favorites, internal remote, radio and experimental user-supplied IPTV |
| Samsung Tizen | Discovery and experimental remote/developer installation path; requires Developer Mode and a certificate for the user's TV. **The Android TV APK does not install on Samsung.** No Samsung IPTV/radio receiver is included. |
| LG webOS | Discovery only; TV installation and remote not implemented |
| Hisense VIDAA | Discovery identification when network services are advertised; installation and remote not implemented. **VIDAA is not Android.** |
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

## Preview status

The app includes a light Arabic/English UI and theme library previews. Barcelona, Real Madrid and Egypt have crest/palette/detail previews. Future sport collections are marked coming soon. **Payments, paid activation and three-day trial expiry are disabled.** The intended future model is one-time theme purchases through Google Play, not subscriptions. This APK is not yet a Google Play production submission.

Credentials are not bundled. Users supply their own IPTV account in the app; no subscription or channel access is provided. Pairing uses an authenticated local HTTP API, intended for a trusted LAN. Never enter account passwords in chat.

Club names, crests and user-supplied photographs remain the property of their respective owners. No affiliation or commercial logo license is claimed. Review rights before commercial theme distribution.
