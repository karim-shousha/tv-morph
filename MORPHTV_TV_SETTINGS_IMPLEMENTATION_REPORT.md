# MORPH TV — Settings Implementation Report (P2)

Seven visible categories: Appearance, Performance, Home & apps, Live TV & inputs, Prayer & Adhan,
Time & weather, System. Launcher and IPTV slots are reserved and render only when a provider registers
an option (both currently empty → entries hidden). Styling and interaction language unchanged
(drill-in, Back-to-categories, remote arrows); one additive `.settings-subhead` divider style.

## Current → proposed mapping (final state)

| Old location | Option | New location | Change |
|---|---|---|---|
| Time panel | Clock format | Time & weather › Clock divider | unchanged semantics |
| Time panel | Temperature, location, refresh | Time & weather › Weather divider | grouped under Weather subhead (new) |
| Look & feel | Colour palette, theme packs, text sizes | Appearance | unchanged grouping, minus Plus |
| Look & feel | Morph TV Plus | System › About area | moved out of appearance |
| Look & feel | Reduce motion (inverted "Off") | Performance › Motion effects · On/Off | label fixed (`index.html`, `app.js:renderSettings`) |
| — | Performance mode Light/Full | Performance › Quality/Balanced/Performance | P3 tiers, persists to `cleartv.performanceMode` |
| Apps panel | Recent/HDMI/last-HDMI trio | HDMI pair → Live TV & inputs; recent → Home & apps | HDMI leaves apps domain |
| Apps panel | Manage favourites, Kids World | Home & apps | Kids label fixed to "Kids World on Home · Shown/Hidden" (`kids.js`) |
| Device & tools | Device settings, app update, maintenance | System › Device/Updates/Storage | selectors updated to `#settings-category-system` |
| Header only | Wi-Fi | System › Wi-Fi settings (mirror row; header shortcut kept) | new `setting-wifi` row (`wifi.js`), relocated by organiser |
| About & support | About, Support | System › About | moved |
| Theme packs dialog | Delete pack (immediate) | Two-step confirm ("Confirm delete?", 4s revert) | `packs-tv.js` |
| TV build | Update alerts toggle | Not rendered on TV (already inert via early return; phone unaffected) | no change needed |
| Reserved | boot/quick-return/startup, parental-controls, iptv-account | Hidden Launcher/IPTV slots, no dead rows | entries hidden while empty |

## Verification

`check-perf-regression.cjs` P2 block (7/7): 7 visible + 2 hidden entries, HDMI/system/home/performance
placement, Clock/Weather subhead, motion "On", kids "Shown". `check-settings-nav.cjs` (4/4): spatial
reach, drill-in, in-panel arrows, Back-to-entry. Persistence round-trip passes for clock; tier value
persists per P3 tests. Viewer scoping untouched (`pins`/`C.settings` contracts unchanged).
