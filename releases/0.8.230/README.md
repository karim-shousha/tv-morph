# Morph TV 0.8.230

- Android IPTV player: Up explicitly reveals controls and focuses the video timeline; Down returns to playback buttons. Live-channel Up/Down behavior stays unchanged. Samsung player reveals a hidden control bar before attempting to focus its timeline.
- Restore 3x playback speed alongside all existing rates. Existing pitch/audio-failure and paused-state guards remain unchanged; native Samsung AVPlay restrictions remain unchanged.
- IPTV accounts: Sources remote OK activates the focused choice explicitly; saved-account selection sends the selected ID directly. After connecting, the UI checks the native summary confirms that exact account before reloading or claiming success. Failures show a visible error.
- Settings display a prominent green Active badge using provider subscription status, with distinct expired/inactive/unknown states and a current-account label. Expired dates are not shown as Active.
- Product changes are limited to PlayerActivity.java, the player focus statement in samsung-media.js, shared account UI in app.js, Sources OK handling in stream-ui.js the account badge CSS, and adding 3x to the two existing playback-rate lists. Existing catalogue backend, category-first loading, Home data logic, layout/style files and LG player.js were preserved.
- Focus-dispatch checks and Samsung seek tests passed. Shared UI tests covered remote A-to-B selection, settings B-to-A selection, rejected activation and expired status. Final packaging/signature checks passed. Native services/video playback were mocked in automation; physical-device verification remains pending.
- Phone bundles the exact Android TV 0.8.230 APK and LG 0.8.230 IPK, and displays TV version 230. Legacy Tizen 2/3 packages remain separate and unchanged.
