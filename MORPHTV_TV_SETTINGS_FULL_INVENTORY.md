# MORPH TV — TV Settings Full Inventory

> Source of truth: `tv-project/app/index.html:23-28`, `settings-nav.js:3-5`,
> `core.js:8`, and per-feature creator files. Every row traced to implementation, not label.
> "Category" = where `settings-nav.js:14` + `placements` actually put it at runtime.

## Category map (runtime, `settings-nav.js:3-5`)

`keys = [launcher, performance, appearance, apps, iptv, prayer, time, general, about]`.
`placements` verbatim:

```js
launcher:   ['#setting-boot', '#setting-quick-return', '#setting-startup']
performance: ['#setting-performance', '#setting-motion']
appearance:  ['#setting-text-size-ar', '#setting-text-size-en', '#setting-theme',
              '#settings-theme-packs', '.morph-plus-setting']
apps:        ['#setting-recent-apps', '#setting-home-hdmi', '#setting-last-hdmi',
              '#setting-kids-home', '#setting-favourites', '#setting-parental-controls']
iptv:        ['#setting-iptv-account']
general:     ['#setting-device-settings', '#setting-app-update']
about:       ['#setting-about', '#setting-support']
```

Special routing (`settings-nav.js:14`): `prayer-settings-section → panels.prayer`;
any panel containing `#setting-clock → panels.time`; all other leftover children → `general.hosts`.
`iptv` entry hidden when empty. Labels in 5 locales (`settings-nav.js:4`).

## Complete option inventory

| # | Setting ID | Label (EN) | Actual function | File:line (creator + handler) | Settings key / storage | Category (runtime) | Global vs feature | Area |
|---|---|---|---|---|---|---|---|---|
| 1 | `setting-clock` | Clock format | Toggles 12/24 h clock + greeting/date | `index.html:25` / `app.js:212` | `C.settings.clock24` (default `true`), `C.saveSettings()` localStorage | time | Global | Appearance/Time |
| 2 | `setting-units` | Temperature | °C/°F; clears weather data + reloads | `index.html:25` / `app.js:213` | `C.settings.units` (default `celsius`) | time | Global (weather) | Connectivity/Time |
| 3 | `setting-location` | Weather location | Opens location modal (auto/manual/off) | `index.html:25` / `app.js:214`, `weather.js:56` | `locationMode` (default `auto`), `manualLocation` | time | Global (weather) | Connectivity |
| 4 | `setting-refresh` | Refresh weather | Forces `C.Weather.load(true)` | `index.html:25` / `app.js:214` | Action only, none | time | Global | Connectivity |
| 5 | `setting-theme` | Colour palette | Opens 28-theme picker modal, grouped | `index.html:26` / `app.js:215,175` | `C.settings.theme` (default `night`) + `TVNative.saveSettings` mirror | appearance | Global | Appearance |
| 6 | `setting-motion` | Reduce motion | Toggles `C.settings.motion`; **label inverted** (`Off` when motion=true, `app.js:131`) | `index.html:26` / `app.js:215` | `C.settings.motion` (default `true`) | performance | Global | Performance/Appearance |
| 7 | `setting-favourites` | Manage favourite apps | Opens app picker (`picking=true`) | `index.html:26` / `app.js:215,101` | `pins` via `C.read/write('pins')` (not in `C.settings`) | apps | Feature (Home) | Apps & Home |
| 8 | `setting-about` | About us | Opens About modal (version, credits, weather/data notice) | `index.html:26` / `about.js:1`, `app.js:203` | None (static) | about | Global | About |
| 9 | `setting-performance` | Performance mode · Light/Full | Toggles `body.light-mode`; lazy-load hook (dead selector, see audit) | `performance.js:10` / `performance.js:8` | `cleartv.performanceMode` localStorage (outside `C.settings`!) + `TVNative.setPerformanceMode` | performance | Global | Performance |
| 10 | `setting-text-size-ar` | Arabic text size | Small/normal/large picker overlay | `text-size.js:32` | `C.settings.fontSizeAr` (default `normal`) + `TVNative.saveSettings` mirror | appearance | Global | Accessibility/Appearance |
| 11 | `setting-text-size-en` | English text size | Same for Latin | `text-size.js:32` | `C.settings.fontSizeEn` | appearance | Global | Accessibility/Appearance |
| 12 | `settings-theme-packs` | Manage theme packs · download & delete | Pack download/remove overlay, storage meter | `packs-tv.js:12` | Pack state in IndexedDB `tvmorph-theme-packs`; reads theme/art keys | appearance | Feature (themes) | Appearance/Storage |
| 13 | `.morph-plus-setting` | Morph TV Plus (buy/themes) | Plus upsell/gate; suspends advanced settings while inactive | `plus-tv.js:7` | `morph.plus.*` + `cleartv.plusSuspendedSettings` | appearance | Feature (Plus) | About/Playback |
| 14 | `setting-recent-apps` | Recently used apps on Home | Shows/hides recent rail | `home-refinements.js:23` | `C.settings.showRecentApps` (default `false`) | apps | Feature (Home) | Apps & Home |
| 15 | `setting-home-hdmi` | HDMI shortcuts on Home | Shows/hides HDMI shortcut row | `home-refinements.js:23` | `C.settings.showHomeHdmi` (default `false`) | apps | Feature (Home) | Apps & Home |
| 16 | `setting-last-hdmi` | Last HDMI input on Home | Shows/hides last-HDMI card | `home-refinements.js:23` | `C.settings.showLastHdmi` (default `false`) + `C.read('lastHdmi')` | apps | Feature (Home) | Apps & Home |
| 17 | `setting-kids-home` | Kids World on Home / hidden | Pins/unpins Kids entry | `kids.js:26` (`:24` label) | pins via `C.setRemotePins` + `kidsHomePinnedV1` | apps | Feature (Kids) | Family |
| 18 | `setting-support` | Support Morph TV | Donation QR modal (Stripe/PayPal, `support-stripe/paypal.webp`) | `support.js:4` (+`welcome-support.js:13` startup card) | None | about | Global | About & Support |
| 19 | `setting-device-settings` | Device settings | Opens native TV/projector settings or guide modal | `device-settings.js:5` | Action; `TVNative.deviceSettings()` else `tizen.application.launch(Settings)` | general | Platform-specific | Connectivity/Devices |
| 20 | `setting-app-update` | App update | Triggers `TVNative.checkAppUpdate(true)`; auto-check +15 s after load | `app-update.js:4` | None; no-op without `TVNative` | general | Platform (Android/proj. only) | System |
| 21 | `setting-maintenance` | Apps & storage | Calls `TVNative.maintenance()` | `app-polish.js:1` | None; created **only if** `TVNative.maintenance` exists | general | Platform | Storage |
| 22 | `setting-update-alerts` | Update alerts on/off | Toggles `tvmorph.updateAlerts`; **dead on TV** (`update-alert.js:3` early-return when `ClearTV` exists) | `update-alert.js:12` | Direct `localStorage` | general (TV) | Dead code on TV | System |
| 23 | `setting-prayer-visibility` | Show prayer times on/off | Hides all prayer surfaces (`body.hide-prayer`) | `prayer.js:62` | `C.settings.showPrayer` (default unset = visible) | prayer | Feature (Prayer) | Family/Religion |
| 24 | prayer sub-options | Calculation method / school / voice / preview / volume / auto-adhan / break toggle / screen preview / city search | Full prayer config inside `#prayer-settings` | `prayer.js:47,62`, `prayer-duas.js:9` | `C.settings.prayer.*` + `prayerCacheV1`, `adhanFiredV2`; `TVNative.prayerSchedule()` | prayer | Feature (Prayer) | Family/Religion |
| 25 | `setting-boot` | (expected launcher/startup) | **ORPHAN — no creator in repo**; slot reserved for native-shell injection | `settings-nav.js:5` only | Unknown | launcher | Platform/unknown | System |
| 26 | `setting-quick-return` | (expected quick-return) | **ORPHAN** — same | `settings-nav.js:5` only | Unknown | launcher | Platform/unknown | System |
| 27 | `setting-startup` | (expected startup view) | **ORPHAN** — same | `settings-nav.js:5` only | Unknown | launcher | Platform/unknown | System |
| 28 | `setting-parental-controls` | (expected parental gate) | **ORPHAN** — family-ui/parental-pause exist but create no such ID | `settings-nav.js:5` only | Unknown | apps | Unknown | Family |
| 29 | `setting-iptv-account` | (expected IPTV login/playlist) | **ORPHAN** — `m3u-source.js` is parser-only, creates no UI | `settings-nav.js:5` only | Unknown | iptv (hidden when empty) | Unknown | Playback |
| 30 | `nav-wifi` | Wi-Fi (header nav, not `setting-*`) | Opens native Wi-Fi settings or guide | `wifi.js:5` | Action; `TVNative.wifiSettings()` else Tizen AppControl | header (not Settings) | Platform | Connectivity |

Related but outside Settings: viewer profiles (`core.js:7`, header `viewer-button`, `app.js:172-173`);
`setting-ui-mode` retired (`ui-mode.js:36` removed); Dua toggles (`prayer-duas.js:9`) live inside prayer panel.

## Organizational problems (verified)

1. **Time & weather is a junk drawer.** Clock format + temperature + location + refresh share one panel
   only because they happened to be static in `index.html:25-26` (`settings-nav.js:14` routes by
   `#setting-clock` presence). Clock ≠ weather conceptually.
2. **Performance vs motion split.** `setting-performance` (real mode, but stored outside `C.settings`) and
   `setting-motion` (boolean, inverted label) sit in the same category yet control overlapping flags
   (`ui-mode.js:24` ORs them). Users cannot tell them apart.
3. **Appearance overload.** Theme picker + 2 text sizes + pack manager + Plus upsell + (via modal) custom
   title/art/offsets all funnel through `appearance`, while the actual customization surface is the Home
   Appearance modal (`app.js:175`), not Settings.
4. **Apps & family mixes three domains.** Home rails (recent/HDMI/last-HDMI), pin management, Kids pin,
   and a phantom parental-controls slot. HDMI options are Inputs features, not app features.
5. **General is a second junk drawer.** Device settings (platform action) + app update (Android-only) +
   maintenance (native-only) + dead update-alerts + all unplaced leftovers
   (`settings-nav.js:14` dumps unknown children into `general.hosts`).
6. **IPTV category is a ghost.** `iptv` panel exists with zero repo-backed options; entry hidden
   (`settings-nav.js:8`). Discoverability of the orphan `setting-iptv-account` contract is zero.
7. **Launcher category is empty in this build.** All three placement IDs are orphans; the category renders
   with only a hint note (`settings-nav.js:8`).
8. **About mixes identity, money, and system.** About modal + support donations + (platform) update actions.
9. **Inverted/confusing labels.** `setting-motion` shows "Off" when motion is enabled (`app.js:131`);
   `setting-kids-home` label flips between "On Home · Hide" and "Hidden · Show" (`kids.js:24`);
   `setting-performance` shows mode + "Light: same interface, fewer effects" only as tooltip.
10. **Persistence inconsistency.** `performanceMode` bypasses `C.settings`/`C.saveSettings()` and viewer
    scoping (`performance.js:3-5`); `pins` bypass `C.settings`; `updateAlerts` bypasses both;
    prayer caches use separate keys. Viewer-switch (`morphViewer`) resets some but not `performanceMode`.
11. **Dead / disconnected.** `setting-update-alerts` can never appear meaningfully on TV
    (`update-alert.js:3`); `setting-maintenance` only on native; Plus gate (`plus-tv.js`) silently
    downgrades theme to `blue` on load when locked (`fallback()`), which reads as "my theme disappeared".
12. **Platform-specific shown unconditionally (or missing).** `setting-app-update`/`setting-maintenance`
    render only when the bridge exists (good), but `setting-device-settings` always renders and degrades to
    a text guide — acceptable but undisclosed. Wi-Fi lives in header nav, not Settings, breaking
    "connectivity in one place" expectations.
13. **No destructive-action or save semantics issues found** — settings apply instantly (`C.saveSettings()`
    per toggle); there is no Save/Apply or reset; nothing destructive except pack delete (immediate, no
    confirm — minor UX gap, `packs-tv.js` remove path).
