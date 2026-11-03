Morph Launcher / Morph IPTV / Morph TV 1.1.305

- Fix Plus activation persistence: prefer verified current identity, isolate phone and TV scope, allow entering a new code when saved verification fails, and refresh paid features after returning to IPTV.
- Settings: physical Up/Down/Left/Right movement, prayer opens on focus, scroll the focused control into view, and size the sidebar to its actual categories.
- Plus dialog: bounded columns, visible activation form, used/remaining devices and explicit failures; restored activation unlocks category ordering.
- Restore the original phone companion keyboard and remote, and connect the internal receiver after successful code pairing.
- PIN and Plus input on Android TV uses a local remote-operated pad instead of invoking the system mobile-keyboard banner.
- Install standalone IPTV through the authenticated Morph receiver on linked Android TVs, with package/signature checks and TV installation consent; do not route ordinary Android TVs through Fire TV ADB.
- Phone IPTV: fourth Multi-view card with generated artwork; header wordmark matches the phone host in size and placement.
- Phone Settings: compact four-shortcut layout with parental controls near the top, preserving existing handlers.
- Matches: per-card dates, first-open artwork loading without Refresh, and a bounded scrollable team picker that retains focus at its last item.
- Android 4.4 editions retain their reduced native M3U feature set. Physical TV models and provider coverage remain device/source dependent.
- Samsung standalone installation follows the working package transfer/install commands without an unsupported POSIX mkdir shell command.
- Samsung full-screen inputs use the front native video plane after releasing the previous player, preventing an opaque web surface from covering source video.
- Shared search and account fields use the native editable field on Samsung, LG and Android; the previous full-screen replacement keyboard is not opened.
- TV header geometry is independent of saved content font scaling; 540p, 720p, 1080p and 4K normalized header metrics match across Android, Samsung and LG.
- Samsung player clears the loading state on preparation and hides controls automatically; TV local-media and IPTV controls use the current Android cinema canvas metrics, with direct audio/subtitle/settings access.
- Samsung Cast searches for MediaRenderer receivers using the platform socket API on supported models, then sends the stream only to the selected receiver. Android Cast is unchanged. Unsupported Samsung models report discovery unavailable.
- All 12 modern TV product/platform packages were audited for the current shared search, settings, header and player repairs. Android 4.4 remains the documented reduced native M3U edition.
- Physical Samsung/LG HDMI and casting compatibility must still be checked on the television; API/browser/emulator tests do not establish every model.
