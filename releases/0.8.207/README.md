# Morph TV 0.8.207

- Progressive IPTV Home: cached metadata first, independent catalogue loading, bounded requests and partial-failure feedback.
- Larger TV categories and channel labels; compact sports cards with contained logos and unclipped captions.
- Continue Watching shows the latest live channel, movie and episode independently.
- Fixed Home hero with independently scrolling shelves; focus restoration after asynchronous updates; D-pad text-size slider.
- Local M3U imports can be deleted from saved accounts with confirmation; original device file and other accounts are retained.
- Android live player includes an in-player category/channel browser reusing the existing account catalogue and playback resolver. This new native overlay is build-verified, not physically device-tested.
- Phone opens the complete DLNA browser independently of TV pairing. SSDP searches MediaServer v1/v2 and root devices; manual input accepts a host without an explicit scheme and does not require a port.
- Phone/IPTV styles load before first paint. Home no longer contains Al Ahly fallback text, warm starts use the theme-ready gate, and Android resume waits for WebView visual-state completion rather than reapplying the whole theme.

## Validation and limits
Browser tests cover Arabic/English TV layouts, progressive loading, cached startup, bounded failure, latest-three history, focus restoration, fixed hero/shelf scroll, settings, poster geometry, scoped favorites, M3U confirmation and first visible mobile frame. Native loopback tests cover HTTP gzip, redirects/errors/timeouts and local-network policy/SSDP response parsing. APK builds and signatures are verified.
No physical DLNA/receiver device was available. Playback of subscriber streams and the new native channel browser require real-device verification. Samsung computer WGT files need signing with the user's DUID; Tizen 4 remains experimental. Older Lite packages remain separately labelled at their previous version.

## Playback investigation
The supplied file named uptodown-com.nathnetwork.xciptv.apk identifies as com.uptodown 7.42 (versionCode 742), not XCIPTV. It cannot establish XCIPTV player settings. No third-party proprietary code was copied. The requested Hisense TV was not connected in ADB at inspection time.
Existing Morph playback uses Media3 for VOD, decoder fallback, bounded buffering, a system-engine alternative, track/subtitle controls, format/source recovery and diagnostics. This release improves catalogue transport/concurrency; it does not claim universal codec or provider compatibility. Provider HTTP 401/403, expired links, connection limits and unavailable streams cannot be resolved by increasing buffer alone.
