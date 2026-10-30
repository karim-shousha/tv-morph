# Morph TV 0.8.222

- Keep the focused IPTV category visible while scrolling; show a menu scrollbar.
- Restore channel names beside compact logos in Live TV list mode.
- Keep full-screen channel changes inside the originating Favorites list.
- Automatically request the next episode on Android and the Samsung web player; finish cleanly when no next episode exists.
- Restore touch scrolling on the phone IPTV Home in landscape and portrait.
- Offer 1.25x and 1.5x with pitch preservation on Android/HTML video. Reject unsupported audio-speed combinations rather than silently muting. Samsung AVPlay retains 1x because its integer-speed API cannot provide these fractional rates.
- Add an Apps2Samsung Android installation guide, linked from Samsung downloads and installation help.

Validation: APK builds and signing checks; automated touch scrolling at 844x390 and 390x844; category focus visibility and live-list layout; favorite channel sequence; episode ordering across seasons and end-of-series; playback-rate rollback and pitch flags. Tests use fixtures, not real provider/device verification. Samsung, LG and physical TV playback still require device testing. Tizen 2/3 experimental packages are unchanged.
