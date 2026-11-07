# IPTV Account Settings Redesign (Task 2)

## Files modified
- `android-tv/iptv/settings-pages.js` — appended presentation-only IIFE (Active hero + saved rows,
  switch wiring, boot-restore). Existing tab/page/shell code untouched.
- `android-tv/iptv/settings-pages.css` — appended hero/badge/row styles (theme vars + fallbacks).
- Reused, unchanged: `IptvTvBridge.switchSavedSource`/`settingsState`, `switchSource` (connect →
  summary-confirm → reload), `IptvAccountText.describe`, add/edit form, free-channels controls,
  `removePlaylistFile` delete-file flow, credential storage.

## Original issue
Accounts page showed a raw `<select>` dropdown plus scattered status labels; the active account was
not prominent and switching was confusing.

## Changes
- **Active Account hero** (`#iptv-active-account`) at top of the Accounts page: display name,
  provider type (Xtream/M3U/Stalker, or Free channels), prominent ACTIVE badge (selection only —
  styled separately from validity), validity pill rendered only when the provider verified a status
  (Valid/Expired/Inactive), expiry date when available, existing subscription description, Manage
  (opens the existing add/edit form) and Refresh-details actions.
- **Saved Accounts list** (`#iptv-saved-list`): one focusable row per saved account with name,
  provider type, and ACTIVE/Switch state; the active row is visually distinct (`aria-current`).
  Row click switches via the existing `switchSavedSource` (existence check, persist, activation
  confirm, reload of the correct account's content). Failure keeps the previous account, shows the
  existing error notice, and refocuses the row. After a successful switch (reload), settings
  reopens on Accounts with focus restored to the selected row (one-shot session flag).
- Legacy dropdown/label/restore buttons are hidden but kept live in the DOM so existing paint,
  refresh, and playlist-file observers keep working. No passwords, tokens, or URLs are rendered.
- Account removal: the native store only supports deleting imported local playlist files
  (`removePlaylistFile`); that existing flow is preserved. No new removal API was invented.
- TV-friendly: large type, theme-token colors, strong focus rings, no blur/animation, EN/AR labels,
  RTL-safe (flex + logical alignment), Back behavior unchanged (nested pages → Accounts).

## Tests executed
- Playwright fixture (2 saved accounts): hero name/badge/provider/validity/expiry render; 2 rows
  with active state; legacy select hidden; row click issues `connect {accountId:'a2'}`; boot flag
  consumed; zero page errors. `node --check settings-pages.js` — pass. CSS braces balanced.

## Tests not executed
- Real-device D-pad walkthrough, Arabic RTL visual check on hardware, Tizen/webOS Samsung-bridge
  parity run, multi-viewer/profile combinations.

## Platform-specific risks
- Samsung/LG bridges return the same `settingsState` shape via the shared `app.js`; if a provider
  omits `subscription`, validity/expiry lines hide by design (no unverified data shown).
- Very long account names wrap (`overflow-wrap:anywhere`); 720p uses the small-screen rules.

## Rollback
- Delete the appended Task-2 IIFE in `settings-pages.js` and the appended Task-2 CSS block in
  `settings-pages.css`. Unhide via removing the three `hidden=true` lines is unnecessary — deleting
  the IIFE restores the legacy dropdown UI exactly.
