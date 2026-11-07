# Morph TV Mobile App — UI/UX Audit

**Date:** 2026-11-02
**Scope:** Mobile app only (`mobile-app/` + phone-shared `android-tv/src/local/tvmorph/tv/PhoneIptvActivity.java`, `PlayerActivity.java`, `IptvActivity.java`). No desktop, web, TV launcher, Samsung/LG standalone changes.
**Method:** Source-code audit only. No code modified. No visual device testing performed.
**Baseline:** `mobile-app/AndroidManifest.xml` v0.8.299 (minSdk 26, target 30), `assets/ui/index.html` Preview 0.8.68, `phone-iptv.css` ~395 KB, `approved-mobile.css` ~366 KB.
**Brand identities (per AGENTS.md):** Morph TV = phone app (`logo.webp` / `morph-wordmark.webp`), Morph Launcher = TV launcher, Morph IPTV = standalone IPTV (`morph-iptv-wordmark.webp`, `morph-iptv-icon.png`).

> Verified = seen in source. Needs-device-testing = layout/render/touch judgment that requires on-phone screenshots, TalkBack, or gesture testing.

---

## 1. What the mobile app actually is (verified)

### 1.1 Native host

- `mobile-app/src/local/cleartv/mobile/MainActivity.java:17-23` — single portrait `Activity` (`singleTop`, `screenOrientation=portrait`, `supportsRtl=true`), full WebView host:
  - `WebView` loads `file:///android_asset/ui/index.html`.
  - Bridge: `ClearNative.request(id,action,payload)` → `window.nativeResult` / `window.nativeProgress`.
  - `setSupportZoom(true)`, `setBuiltInZoomControls(true)`, `setDisplayZoomControls(false)`, `setTextZoom(fontScale)`, `FORCE_DARK_OFF` + `setAlgorithmicDarkeningAllowed(false)` on API 29/33.
  - `onResume` re-checks `checkMorphConnection()`, `MorphUpdates.check()`, `MorphWorship.prayerRefresh()`.
- `mobile-app/AndroidManifest.xml:7-14`:
  - `MainActivity` portrait launcher, `MatchesActivity` portrait, `PhoneIptvActivity` unspecified orientation, `PlayerActivity` landscape + PiP, `NetworkActivity`, `NetworkPlayerActivity` landscape, `MultiViewActivity` landscape.
  - `android:debuggable="true"`, `usesCleartextTraffic="true"`.
- `mobile-app/src/local/cleartv/mobile/MatchesActivity.java` — separate portrait WebView for `matches-screen.html` + `matches-phone.css/js`, bridge `MatchesNative.request`. Back is delegated to `MorphMatches.back()` then `finish()`. IPTV/player stays underneath.
- `android-tv/src/local/tvmorph/tv/PhoneIptvActivity.java` — `extends IptvActivity`, `standalone()=true`, `phoneLayout()=true`, `returnToHost()=false`, `FLAG_FULLSCREEN`. Reuses **same encrypted catalog, library and native player as TV** (`IptvStore`, `PlaybackHistory`, `PlaybackMemory`). Phone presentation is `mobile-app/phone-iptv.css` + `mobile-app/phone-iptv.js` staged over shared `android-tv/iptv/` frontend via `iptv_shared.py`.
- `android-tv/src/local/tvmorph/tv/PlayerActivity.java` (~75 KB) — shared native player (`BufferedVideo`/`VideoView`, `PlayerCinemaChrome`, `PlayerChromeButton`, `PlayerSettingRow`, `PlayerDialog`, `LiveChannelBrowser`, right settings panel, channel browser). `phoneMode` flag changes key handling, PiP, orientation. This is the actual phone player UI, not an HTML video tag.

### 1.2 Web layer (phone companion)

Entry: `mobile-app/assets/ui/index.html:1-57`

- ~34 CSS `<link>` in fixed order: `../tv/ui/tokens.css` → `style.css` → `bright.css` → `appearance.css` → `remote.css` → `connect-flow.css` → `library.css` → `iptv-sources.css` → `progress.css` → `plus.css` → `plus-themes.css` → `remote-visual.css` → `support.css` → `welcome-support.css` → `customization-sections.css` → `morph30.css` → `mobile-polish.css` → `mobile-cinematic.css` → `studio-shell.css` → `premium-mobile.css` → `approved-mobile.css` → `setup-options.css` → `first-run.css` → inline `html{background}` → `navy-mobile.css` → `glass-mobile.css` → `daylight-mobile.css` → `studio-editor.css` → `premium-landings.css` → `matches-phone.css` → `worship-phone.css`.
- ~45 JS `<script>` in fixed order: `plus.js`, `account-details.js`, `appearance.js`, `locale.js` (421 KB), `guide.js`, `theme-packs-manifest.js`, `theme-packs.js`, `clubs.js`, `app.js` (47 KB core router/state), `cast-screen.js`, `dlna-cast.js`, `parental.js`, `iptv-source-form.js`, `iptv.js`, `iptv-phone.js`, `compatibility.js`, `packs-phone.js`, `connect-flow.js`, `setup-options.js`, `lg-connect.js`, `update-alert.js`, `support.js`, `plus-phone.js`, `remote-visual.js`, `welcome-support.js`, `customization-sections.js`, `morph30.js` (3.0 nav/chrome overlay), `mobile-cinematic.js`, `studio-shell.js`, `premium-mobile.css/js`, `approved-mobile.js`, `navy-mobile.js`, `iptv-account-manager.js`, `studio-editor.js`, `premium-landings.js`, `worship-phone.js`, plus `phone-network.css/js`, `phone-updates.js`.
- No framework, no bundler at runtime, no client router. Navigation primitive is `show(name)` in `assets/ui/app.js:15` + `morph30.js:show()` override — toggles `hidden` on `.page` sections.
- Build staging: `mobile-app/build.py` copies `assets/ui/*`, TV library (`android-tv/iptv`, `radio`), `tvmorph.webp`, `android-tv.apk`, `lg-preview.ipk`, `tv-app.zip` into `build/assets`. `phone-iptv.css/js` live at repo root (`mobile-app/phone-iptv.*`) and are staged for embedded/standalone builds. Do not edit generated copies in `build/`.

### 1.3 Screen inventory (verified in `index.html`)

| ID | Section | Bottom-nav | Entry |
|---|---|---|---|
| G | Global chrome — `header .brand (morph-wordmark.webp)` + `#device-chip[data-page=home]`, `.language-row (#app-language, #app-appearance)`, `#reconnect-notice`, `#operation` modal, `#toast`, `footer Preview 0.8.68` | always | always |
| S1 | `page-studio` (Themes / Studio) — `.studio-banner`, `.studio-shortcuts` (cast/connect/apps/remote), `details#family-panel`, `#preview` live theme preview, `details.theme-library (#theme-search, #theme-collections 12 filters, #themes, .theme-pricing)`, `details#personal-touch` (~30 controls: title/subtitle, 4 offset sliders, iconTint/highlight, glass, art/slideshow, hero sizes, 4 theme colors, card width, clock/weather/prayer/matches toggles), `details.panel.about-us`, `#apply.primary.full`, first-time CTA | `design` (default active) | boot default |
| S2 | `page-connect` (Home / Devices) — `.connection-card #scan + #devices`, `#manual-type-toggle + #manual-system-panel`, `#connection-state`, `#install-card (#smart-install, #download-center, #platform-package, #public-tv-url)`, `#android-pair (#pair-code, #pair-android, #share-android, #download-box)`, `.panel.manual (#tv-ip, #connect, #connected-device)`, guide (`#guide-dots/kicker/title/text/phone-card/prev/next/check`), `details.troubleshoot`, `details.compatibility`, `.phone-ip #phone-ip`, hidden legacy `#install` | `home` | `data-page=home/connect` |
| S3 | `page-apps` — `#refresh-apps`, `#apps-empty`, `#app-list (.app-row + reorder)`, `#save-pins`, `.fine` disclaimer | `control` sub (via `morph30.js` segment) | `data-page=apps` (remapped to remote in `morph30.js:show`) |
| S4 | `page-remote` — `#remote-mode`, `#remote-connect`, `#remote-status`, `#remote-pad-mode / #remote-touch-mode`, `#touchpad`, `.remote-pad` (UP/LEFT/OK/RIGHT/DOWN), 4× `.remote-row` (SETTINGS/RETURN/HOME/SOURCE/VOL/MUTE/PLAY/PAUSE/CH), `#remote-text` + `#remote-send`, capability `fine` notes | `control` | `data-page=remote/control` |
| S5 | `page-iptv` (Play) — `#iptv-destination-intro`, `#iptv-account-state`, `.iptv-destinations (#iptv-phone-open, #iptv-tv-show)`, `#iptv-public-card`, `#iptv-personal-card + #iptv-form-details (type/server/port/mac/user/password/name/format/live/vod/series)`, `details#iptv-tv-controls` (library browser), `settings-panel` (tabs: accounts/add/playback/library), category drawer, search | `play` | `data-page=play/iptv` |
| S6 | `page-cast` — `#cast-title/intro/open/steps/stop`, `#dlna-panel (scan/devices/url/kind/send/play/pause/stop/caps/status)`, `#cast-back` | hidden (no nav item) | shortcut `data-page=cast` only |
| S7 | `page-worship` (empty shell in `index.html:56`, populated by `worship-phone.js/css`) — hero, home grid, surah list, mushaf reader, tasbih/dhikr/dua, settings | `worship` (injected by `morph30.js`, 5th tab) | `ClearNative.openFaith` or `show('worship')` |
| S8 | Phone IPTV library — `PhoneIptvActivity` WebView (`android-tv/iptv/index.html`) + `phone-iptv.css/js`: `#morph-header.phone-header (brand morph-iptv-wordmark, nav kind-live/vod/series/favorites, search)`, `#phone-iptv-home (.ph-home-intro, .ph-source, .ph-home-grid 4 cards, .ph-manage-subscription)`, `#items` grid, `#phone-category-drawer + #phone-categories-open`, `#settings-panel`, `#account-panel`, `#phone-host-back` | native (not WebView bottom-nav) | `phoneIptvOpen` |
| S9 | Native player — `PlayerActivity` landscape: `BufferedVideo`, `timeline` seekbar, `pauseButton`, `actionRow` dock, `cinemaChrome.top`, `settingScroll/rightPanel` (Quality/Audio/Subtitles/Speed/Stream info/Files), `channelBrowser`, `contentMeta/contentPlot`, `loading`, `bufferingNotice`, error `PlayerDialog` | native | `IptvActivity.play()` |
| S10 | Matches — `MatchesActivity` + `matches-screen.html`: `.matches-screen-header (#matches-back)`, `#page-matches (.mp-hero, .mp-tabs, .mp-filters, .mp-days, .mp-match cards)` | native header back | `openMatches()` / schedule entry |
| S11 | Network/DLNA browser — `NetworkActivity` + `phone-network.css/js` over shared `tv-project/app/network/` | via Cast → `openLocalNetwork()` | `ClearNative.openLocalNetwork()` |

Search exists in three places (verified): `page-studio #theme-search` (theme filter, `app.js:filterThemes`), phone library `#search / #unified-query / #phone-category-filter` (`phone-iptv.js`), worship `.wf-search input` (`worship-phone.css`). No global search.

Settings exist in four layers: (1) `.language-row` app language/appearance, (2) IPTV `settings-panel` tabs, (3) player right-panel settings, (4) native `CastSettings` / TV settings proxy. No unified Settings screen.

---

## 2. Screen-by-screen UI/UX assessment

### 2.1 G — Global chrome (`index.html:3-4,56`, `style.css`, `morph30.css:42-62`)

- Header is 94 px (`style.css:header{height:94px;padding:26px 23px 17px}`) with left wordmark (`morph-wordmark.webp`) and right `#device-chip` pill (max 155 px, truncated). Verified: chip label defaults to Arabic "اختار تلفزيونك" and doubles as navigation (`data-page=home`). Problem: one control means two things (status + go-to-Connect). No connection color except 6 px dot.
- `.language-row` sits **below** header, above content — visually detached from Settings, easy to miss. Two 125 px selects. Verified.
- `#operation` full-screen modal + `#toast` bottom (later moved to top in `morph30.css:219`). Toast is single-line centered; long Arabic error strings wrap to 4-5 lines and cover content. Needs-device-testing: toast legibility over player/remote.
- `footer Preview 0.8.68` is static version text, not actionable.

### 2.2 S1 — Themes / Studio (`page-studio`)

The default screen and the most overloaded. Verified structure: banner → 4 shortcuts → family `details` → preview heading → `#preview` → `#club-details` → theme library `details` → font-size panel (hidden/inert) → personal-touch `details` (~30 inputs) → about → `#apply` → first-time CTA → fine print.

- **Banner:** `.studio-banner` with eyebrow + 34 px `h1` + paragraph + `.banner-action`. Decorative `.banner-art` CSS TV illustration (`.art-tv/.art-screen/.art-orbit`). Cute but competes with `#preview` 12 px below — two heroes stacked. Hierarchy: banner H1 and preview H2 fight for attention.
- **Shortcuts:** 4 emoji/bead buttons (`▣ ▣ ▦ ⌘` in `index.html:5`, later replaced by SVG in `morph30.js: P.*`). Small tap targets, no labels hierarchy, mixed Arabic/English ("Cast Screen" in English inside Arabic page).
- **Preview card:** `.preview{aspect-ratio:16/9;border-radius:18px}` with ridge overlay, 8 px top bar, 21 px title (30 px ≥650 px), weather block. Text is right-aligned while `direction:ltr` container — verified RTL/LTR mix. Title truncates with ellipsis; custom title/subtitle inputs live 3 viewports below the preview they affect (poor proximity).
- **Theme library:** 3-column grid (`.themes{grid-template-columns:repeat(3,1fr);gap:10px}`), 55 px swatch + label + price (`FREE / PLUS`). 12 collection filters wrap; empty state exists. Selected state is 1 px border + check circle — low contrast, needs-device-testing for color-blind visibility.
- **Personal Touch:** all controls flat-listed in one `details`. Sliders (`artOffsetX/Y`, `textOffsetX/Y` ±25%), color pickers, glass opacity, card width, hero sizes 70–125%, 3 toggles. No sections, no progressive disclosure (except runtime DOM moves by `customization-sections.js`). Cognitive overload; Plus-locked vs free vs TV-only not visually separated.
- Spacing: `main{padding:14px 23px 112px;max-width:620px}` + `section-title{margin:27px 0 13px}`. Long page (~10 viewports at 412 px). `#apply` is `position:fixed` apply-bar in later layers (`studio-editor.css:39`, `morph30.css:209`) — verified fixed bottom bar overlaps bottom-nav if both visible; `paintNav` hides apply-bar outside Studio to compensate.

### 2.3 S2 — Home / Connect (`page-connect`)

Most critical flow, most fragmented. Verified DOM order: connection-card → devices → manual-type → connection-state → install-card → android-pair → manual IP → guide → troubleshoot → compatibility → phone-IP → hidden install → disclaimer.

- **Two IPs, one page:** `#phone-ip` (phone address to type into TV) at bottom (`index.html:24`) vs `#tv-ip` (TV address to type into phone, `index.html:19`) mid-page. Similar `.phone-ip` / `.input-row` styling. Bilingual IP-reversal warning is a long paragraph users skip. This is the #1 setup-failure risk (verified; needs-device-testing to confirm comprehension).
- **Install CTA confusion:** `#smart-install` label/capability branches per platform in `app.js:platform()` (Android/Samsung/LG/VIDAA/other), plus hidden legacy `#install`, plus `#download-center`, `#public-tv-download`, `#share-android`, `#pair-android`. Up to 4 install-like buttons visible for Android. Disabled states are `opacity:.4` with no reason tooltip.
- **`#connection-state`** is the only truth source (`data-status=idle/detected/connected/checking/error`), but guide steps advance locally and `connect-flow.js` auto-jumps steps on discovery — verified false-progress risk.
- **Guide:** `#guide-dots` + kicker/title/text + phone-card + prev/next + check. Text is `white-space:pre-line`, 13 px/2.0 line-height — readable but dense. `guide-check` only on last step (verified in prior `ui-check.cjs`).
- `details.compatibility` and `details.troubleshoot` are long paragraphs, small 14 px muted text, below the fold where users never scroll after failing scan.

### 2.4 S3 — Apps (`page-apps`)

Simplest page: eyebrow + H1 + intro + `#refresh-apps` + `#apps-empty` + `#app-list` + `#save-pins` + fine print.

- Empty state is centered `▦` + one sentence — no illustration, no CTA to Connect. `app-row` is LTR (`direction:ltr` in `style.css`) inside RTL page — checkbox + label + up/down reorder buttons. Verified: reorder buttons are 30×35 px (below 44 px touch target). Pins save order but no drag; explicit up/down only.
- No search, no app icons (text rows only). Premium feel: low — list looks like settings, not a launcher.

### 2.5 S4 — Control / Remote (`page-remote`)

- Mode select (`internal` vs `native Samsung`) + `#remote-connect` + `#remote-status` + D-pad/touchpad tabs + `.remote-pad` (76×70 px grid, circular container `border-radius:50%`, 278 px diameter) + 4 `.remote-row` + keyboard textarea + send + fine notes.
- Verified gating in `app.js:remoteButtons()`: `data-native-only / data-volume / data-library-only / data-playback` disable keys per platform. Disabled reason lives in one `fine` paragraph — users tap dead buttons with no inline explanation.
- D-pad uses ASCII triangles (`▲ ◀ ▶ ▼`, `index.html:30`), not SVG (only later `remote-visual.js` injects SVG for 16 keys). Touchpad (`#touchpad 205 px`) has orbit glyph `⌖`, no haptic, no visible focus. Needs-device-testing: swipe threshold 38 px (`app.js:touchpad.onpointermove`), tap-vs-swipe disambiguation, landscape usability (page is portrait-only host).
- Keyboard: 3-row textarea, 500-char limit, replaces focused TV field; password exclusion noted in fine print only.

### 2.6 S5 — Play / IPTV entry (`page-iptv` in companion)

Dual-destination hub: `#iptv-phone-open` + `#iptv-tv-show` side-by-side (`grid 1fr 1fr`, min-height 66 px), public card + personal card + Xtream/M3U/Portal form + collapsed TV controls.

- Verified: `iptv-phone.js` copy stresses phone vs TV differences, but page shows **all** cards + full source form + TV browser simultaneously. New users cannot tell "Watch on phone" vs "Control TV library" apart.
- Source form (`iptv-source-form.js` + `iptv-sources.css` 1 KB only): type/server/port/mac/user/password/name/format/live/vod/series toggles. Labels are technical ("Server : Port", "MAC address" hidden unless portal). No input validation UI, no show/hide password toggle (verified; password is `type=password` but no reveal).
- `#iptv-tv-controls` is a collapsed `details` containing the entire TV library browser — heavy when opened on phone.
- Account state (`#iptv-account-state`) is a single `connection-state` div reused for errors; success vs error distinguished by text only.

### 2.7 S8 — Phone IPTV library (`PhoneIptvActivity` + `phone-iptv.css/js`)

The actual streaming product on phone. Verified: `phone-iptv.css` is 1,194+ rules with `html#iptv-theme-root[data-stream-ui][data-phone-episodes] body[data-phone-library]` 4–5-level selectors + `!important` on nearly every declaration; ~20 `@media` blocks (many empty: `@media (max-width:540px){}` ×3, `@media (min-width:650px){}`).

- **Header:** `#morph-header.phone-header` grid (brand + nav + settings + search, 96 px desktop / 142 px search-open). Brand is replaced at runtime with `morph-iptv-wordmark.webp` (`phone-iptv.js:brand`). Nav tabs (`home-open/kind-live/kind-vod/kind-series/favorites`) get runtime `.stream-nav-icon` SVG injection. Verified: tab labels are rewritten by `labels()` on every `morphLanguage`/mutation — fragile.
- **Home hub:** `#phone-iptv-home` injected into `#dashboard`: intro (`MORPH IPTV` + H1 "What will you watch?") + `.ph-source` card + `.ph-home-grid` 4 cards (Live/VOD/Series/Favorites) with `iptv-home-tv/movies/series.png` art + chevron `›`. Cards are large, legible — best-designed part of phone library. Personal-pending mode rewrites copy but keeps layout (good).
- **Grid:** `#items.items` 2-col mobile → 4-col ≥600 px; `.ph-home-grid` similar. Poster cards use shared TV artwork; focus ring is accent color. Category drawer (`#phone-category-drawer`) is `inert` + `aria-hidden` until opened via `#phone-categories-open`; focus trap on Tab/Escape implemented (`phone-iptv.js`). Good a11y bones, but drawer styling inherits TV theme tokens overridden by phone pearl palette — verified `!important` cascade.
- **Search:** `.heading .search` order changes at ≥600 px; `stream-search-open` expands header to 142 px. No persistent search bar on home — users must enter a section first. Needs-device-testing: thumb reach, keyboard covering results (`SOFT_INPUT_ADJUST_NOTHING` in `IptvActivity` + manual `imeState` handling).
- **Settings:** `#settings-panel` dialog with tabs (Accounts/Add/Playback/Library icons injected at runtime), `#account-panel` source form with per-mode explainer (`source-form-note`), `#iptv-active-badge CURRENT SOURCE`. Back is single `#phone-host-back` chevron + `#phone-source-back` transient back. Verified: `hideArrange` hides `#category-order-open` on phone — feature gap vs TV, unexplained in UI.

### 2.8 S9 — Player (`PlayerActivity.java` + `PlayerCinemaChrome`, `PlayerChromeButton`, `BufferedVideo`)

Native landscape player, shared phone/TV. Verified from source:

- Chrome: bottom dock (`actionRow`: play/pause, ±30 s, prev/next, gear, live EPG/guide, subs/audio/quality/speed shortcuts), top cinema chrome (back, title `channelTitle`, `contentMeta`, `contentPlot`, poster `channelPoster`), `timeline` seekbar, `loading` spinner, `bufferingNotice`, `error PlayerDialog` (Retry / Other player / Back + code `?what/extra` + `failureInformation`).
- Right panel (`settingScroll/rightPanel`, width 28%): sections Quality / Audio / Subtitles / Aspect / Speed / Stream info / Files, expandable `choices:` lists, `PlayerSettingRow` 32–46 px rows. `adjustDockForPanels()` lifts dock above panel.
- Gestures/keys: `dispatchKeyEvent` handles BACK (reveal-then-exit two-stage), DPAD up/down (timeline ↔ actions ↔ top chrome), FF/RW hold (`beginScrub`/`finishScrub`), NEXT/PREV (`adjacent`), CH UP/DOWN live zap (300 ms debounce), MEDIA_PLAY/PAUSE in `phoneMode`, GUIDE opens `channelBrowser`. No touch swipe (brightness/volume/seek) in code — verified absence; needs-device-testing to confirm whether `BufferedVideo` handles touch.
- Live vs VOD: live hides seek, shows EPG plot + channel browser; VOD/episode shows resume (`PlaybackMemory`), 5 s progress save, completed → `finishCompletedEpisode` + 60 s auto-finish. Errors distinguish 401/403/404/410/network/unsupported/malformed with localized text + external-player fallback (`Intent ACTION_VIEW video/*`).
- Visual audit limitation: all chrome is built programmatically (`ovalDraw`, `roundDock`, `dp()`), no XML preview. Colors come from `PlayerPalette`; sizes in `dp()`. Cannot judge spacing/contrast without screenshots — flagged as needs-device-testing. Code risks: 28%-width side panel cramped on phones, `contentPlot` GONE if empty (layout shift), `bufferingNotice` + `loading` can show simultaneously.

### 2.9 S7/S10/S11 — Worship, Matches, Network/Cast

- **Worship** (`worship-phone.css` 137 rules, 25 KB): best token discipline (`--wf-ink/sub/surface/soft/line/blue/reader` mapped from `--morph-*`, dark overrides). Hero (navy gradient, 30 px H1), 2-col tile grid (161 px min-height, pastel tiles with icon chips), resume card, surah rows (39 px number chip), mushaf reader (`Noto Naskh`, 26 px/2.5). Buttons forced `min-height:44px`, `box-shadow:none!important`, `-webkit-text-fill-color:currentColor!important` to defeat inherited TV styles — verified specificity battle. Tiles are soft/premium; typography scale is larger than rest of app (inconsistent with Studio 13–14 px body).
- **Matches** (`matches-phone.css` 81 rules): dark navy hero (`min-height:220px`, 29 px H1, art right `-15%`), tabs (2-col segmented, active `#2463eb`), day filters (3-col), match cards (`border-radius:20px`, competition strip, 3-col matchup, 23 px kickoff time `tabular-nums`). Clean sports-card language, but hero art positioning (`width:76%;right:-15%`) risks clipping on 360 px — needs-device-testing. Back is native header button, not in-page.
- **Cast/DLNA** (`page-cast`, `cast-screen.js`, `dlna-cast.js`, `phone-network.css/js`): two unrelated systems (system mirror vs DLNA URL push + local media server) on one hidden page. Buttons are `primary/secondary.full`; device list, URL/kind inputs, transport row (Play/Pause/Stop/−30 s/+30 s/Vol/Mute). Copy warns "Command acceptance does not guarantee visible playback" — honest but low-confidence UX. No bottom-nav entry; only Studio shortcut.

---

## 3. Major visual and usability problems

### 3.1 Visual hierarchy & consistency (verified)

1. **Two heroes stacked (Studio).** Marketing banner + live preview + theme library all compete. No single primary CTA above fold.
2. **Type scale chaos.** `style.css` body 15 px/1.9, H1 34 px/1.5 (−1.3 px tracking), section H2 17 px normal, preview title 21–30 px, fine print 14 px/1.9 muted, worship H1 30 px, matches H1 29 px, phone library H1 dynamic. No shared scale; Arabic 14 px/1.9 is airy but low-contrast (`#8f879e`, `#a9a0b7` on dark).
3. **Color: 6+ competing palettes.** Base dark `#0c1019` (`style.css`) vs light `#f4f7fb` inline vs navy `#2c3b57/233650` vs daylight/glass/premium/morph30 overlays. Accent drifts: `#e0cdfb` (primary btn) vs `#c9aff0` (links/sliders) vs `#174fc9/#2463eb` (phone IPTV) vs `#8dc5ff` (dark worship) vs club theme gradients. Disabled = `opacity:.4` only.
4. **Cards: 5 languages.** `.panel` (18 px radius, gradient border), `.preview` (18 px, image bg), `.theme` (14 px, swatch), `.iptv-item` (14 px, 2-col), `.app-row` (13 px LTR), `.mp-match` (20 px), `.wf-tile` (22 px pastel), `.ph-home-grid` cards. No shared card spec; shadows range from `0 18px 45px #0004` to `none!important`.
5. **Buttons: 4+ systems.** `.primary (#e0cdfb pill 12 px)` / `.secondary (outline)` / `.full` vs `.banner-action` vs `.m30-segment` vs `.mp-tabs/mp-refresh` vs `.ph-*` vs native `PlayerSettingRow`. Min-heights 44–58 px inconsistently; `button:active{transform:scale(.985)}` is the only press feedback.
6. **Icons: emoji → SVG migration half-done.** Bottom-nav/shortcuts/D-pad still ship `⌂ ✦ ☰ ▶ ▣ ⌘ ▲ ◀` in `index.html`; `morph30.js:P` + `remote-visual.js` inject SVG for only 16 keys + nav. No icon contract, no stroke/weight spec. Emoji render differently per OEM — verified risk, needs-device-testing for alignment.
7. **Wasted space.** `main{max-width:620px}` centered with 23 px gutters is fine, but Studio stacks 7+ sections; Connect repeats IP/help blocks; guide + troubleshoot + compatibility push install CTA out of view. At 360×640 (verified `@media(max-width:360px)` exists but only shrinks header/chip) content requires 6–10 scrolls to reach primary action.
8. **RTL/LTR seams.** `supportsRtl=true`, `dir=rtl` root, but `.preview`, `.remote-pad`, `.app-row`, `.ph-home-intro`, `.mp-hero-copy` force `direction:ltr` or mixed alignment. `dir=ltr` IP inputs are correct; decorative LTR inside RTL cards causes mirrored-cheap look (`›`/`↗` direction). Needs-device-testing with Arabic + English.

### 3.2 Navigation & information architecture (verified)

9. **Bottom-nav lies.** Static `index.html:56` has 4 items (home/design/control/play) with `design` active; `morph30.js:NAV_OF/PAGE_OF` remaps to 5 (home/design/control/play/worship) and reorders via CSS `grid-column` (play=1, control=2, home=3, design=4, worship=5). `apps` and `cast` are hidden subs of `control` with no segment persistence. Users cannot deep-link or return to Apps/Cast via nav.
10. **Back never goes back.** `app.js:handleBack` + `MainActivity.onBackPressed` (verified in prior audit): closes `#operation` or jumps to `studio`. `morph30.js` adds 24-entry `historyStack` + `scrollMem` but `show()` is still called directly by every `[data-page]` click without `replace` semantics, and native back does not consult it. Violates Android back expectations.
11. **Hidden Cast page.** No nav entry, no badge, reachable only via Studio shortcut. Mixes mirror + DLNA + local file server — three mental models, one page.
12. **Connect flow reparenting.** `connect-flow.js` re-sorts DOM into pseudo-steps at runtime → DOM order ≠ visual order ≠ screen-reader order (verified pattern; needs TalkBack test).

### 3.3 Player & fullscreen (verified code, needs-device visual)

13. **No touch-gesture contract.** Proven key handling for D-pad/media keys; no swipe brightness/volume/seek, no double-tap ±10 s, no pinch aspect in `PlayerActivity.java`. If `BufferedVideo` handles touch, it is not discoverable (no hints, no visible affordance).
14. **Seekbar discoverability.** `timeline` focus navigation (DOWN from timeline → actions, UP → top) is D-pad-first; touch users get no labels. `finishScrub(false,true)` vs `(true,true)` paths differ for cancel/commit — needs-device-testing for thumb precision on 360 px.
15. **Side panel on phone.** 28%-width `rightPanel` + `settingScroll` max-height math (`headerBottom + dock + 104 px`) is TV-derived; on 412 px wide phone in landscape (~800×360 effective) rows are 32 px — below touch target. Needs-device-testing.
16. **Fullscreen/orientation.** `PhoneIptvActivity` fullscreen flag + `PlayerActivity` landscape + PiP + `resizeableActivity`. Companion WebView is portrait-locked; library → player rotates. No orientation lock UI, no rotation hint. Needs-device-testing for foldables/tablets (`min-width:600/650px` breakpoints exist but phone-iptv has empty blocks).
17. **Errors are honest but cold.** `playbackError()` maps 401/403/404/network/unsupported/malformed to localized paragraphs + code `?what/extra` + `failureInformation`. Good diagnostics, but dialog is native `PlayerDialog` with different type/shadow than web sheets — visual break.

### 3.4 Forms, feedback, empty states

18. **Source form technical jargon.** "Server : Port", "MAC address", "Stream format", profile toggles — no inline validation, no `autocomplete`, no password reveal. `type=password` cleared after save (`iptv-phone.js`) is correct but invisible.
19. **Toast/operation overload.** Single `#toast` + blocking `#operation` modal used for scan/install/apply/remote/DLNA/IPTV. Long bilingual messages truncate meaning. Operation has no cancel (except close on error).
20. **Empty states vary.** Apps (`▦` + text), theme collection (`✦` + text), devices (buttons or toast "no TV"), DLNA caps/empty silent. No illustrations, no next-step buttons except Connect.

---

## 4. Existing design system analysis

### 4.1 Tokens

- `tv-project/app/ui/tokens.css` (3.3 KB) is loaded first but **overridden by 30+ later sheets**. Effective tokens come from per-file `--morph-*`, `--m-*`, `--wf-*`, `--mp-*`, `--media-*/--stream-*/--iptv-*` (phone pearl injector in `phone-iptv.js` sets ~20 vars with `!important` at `html#iptv-theme-root[data-phone-episodes]` specificity).
- `worship-phone.css:37` and `matches-phone.css:81` show the right pattern (semantic pairs, dark overrides). Rest of app does not follow it.
- No spacing scale, no radius scale, no shadow scale, no type scale file. Values are hardcoded: radius 7–26 px, padding 6–30 px, font 8–34 px.

### 4.2 Typography

- Stacks: `var(--morph-font)` (undefined in mobile alone — falls back to Arial/Tahoma/serif per component), `Tahoma`, `Arial`, `"Noto Naskh Arabic"` (worship reader only), `MaterialIcons-Regular.otf` bundled but not used in phone chrome (emoji used instead).
- `locale.js` 421 KB + per-file `words{ar/en/fr/zh/ja}` + `MorphLocale` + `MorphThemeLocale` + `data-no-translate` attributes fight. German/Spanish only in `phone-iptv.js`; Chinese/Japanese missing in Cast/DLNA. Font-size prefs (`fontSizeAr/En` + `fontScaleAr/En` 80–130%) exist but `font-size-panel` is `hidden inert` in Studio — dead UI.
- Line-height 1.5–2.5, generous for Arabic but body 13–14 px muted fails WCAG AA on light backgrounds (verified hexes; needs-device contrast measurement).

### 4.3 Components (verified inventory)

| Component | Files | Issue |
|---|---|---|
| Button | `style.css:.primary/.secondary/.full/.text-button`, `morph30.css:.m30-*`, `matches-phone.css:.mp-*`, `worship-phone.css:.wf-*`, `phone-iptv` pearl overrides | 4 heights, 3 radii, 2 accents; no primary/secondary/destructive/ghost spec |
| Card/Panel | `.panel`, `.connection-state`, `.compatibility`, `.install-card`, `.iptv-item`, `.theme`, `.app-row`, `.mp-match`, `.wf-tile`, `.ph-home-grid button` | No shared elevation/border/ink spec |
| Input/Select/Textarea | `style.css:input/select/textarea`, `#theme-search`, `#phone-category-filter`, `.wf-search` | Height 44–52 px, radius 10–16 px, focus `outline 2px` only in newer sheets |
| Nav | `.bottom-nav`, `.m30-segment`, `#morph-header nav`, `.mp-tabs`, `.iptv-tabs` | 5 tab styles; active = bold/color/fill inconsistently |
| Sheet/Dialog | `details.panel`, `.m30-sheet`, `#settings-panel.dialog`, `PlayerDialog`, `#operation-card` | Web sheets slide-up 26 px radius; native dialog Material-ish; operation centered 24 px radius — three idioms |
| Chip/Badge | `.device-chip`, `.badge`, `#guide-count`, `#iptv-active-badge`, `.price-mark` | Status dot 6 px too subtle; badges are text-only |
| Slider | `input[type=range]` (accent `#c9aff0`), `#glass-opacity`, hero sizes | No value bubbles except `output` % labels; thumb size OEM-dependent |
| Loader | `.spinner` (32 px border spin), `#loading`, `bufferingNotice`, `.mp-feed-state` | 3 spinners, no skeleton screens for library grids |
| Icon | emoji/ASCII + `morph30.js:P` SVG + `remote-visual.js` 16 keys + `.stream-nav-icon` clones | No 24/1.8/round contract outside `morph30.js` comment |

### 4.4 Responsive

- Base `max-width:620px` (companion) / `680px` (matches) / `640px` (sheets). Breakpoints: 359/360/370 px (small phones), 540 px (empty blocks in `phone-iptv.css:799-801`), 600/650 px (4-col grids). Verified: small-phone shrink exists for header/chip only; 600 px+ phone-library header/nav rules are dense but untested (no tablet screenshots in repo). `preview-preview/*.png` show 360/412 px only.
- Safe-area: `viewport-fit=cover` set; `env(safe-area-inset-*)` used in `morph30.css`, `mobile-polish.css`, `studio-shell.css`, `first-run.css` — but **not** in base `style.css` header/main/toast. Toast was later moved to top (`morph30.css:219`) to avoid covering D-pad — patch, not system.
- Touch targets: header chip 44 px+, primary buttons 47–58 px (good); `app-row` reorder 30×35 px, theme tiles ~90 px tall but price `11 px`, D-pad 70–76 px (good), player `PlayerSettingRow` 32 px (fails 44 px), category drawer close `44 px` (good). Needs-device tap testing.

---

## 5. Player UI deep dive (phone)

**Stack (verified):** `PhoneIptvActivity (phoneLayout, fullscreen)` → `IptvActivity.play()` → `PlayerActivity (phoneMode, landscape, PiP)` → `BufferedVideo` + `PlayerCinemaChrome` + `LiveChannelBrowser` + right settings + `PlayerDialog`.

**What works:** resume/bookmarks per profile, EPG plot injection for live, quality/audio/subs/speed/stream-info menus, alternate-engine + alternate-source + reconnect policies (`StreamRetryPolicy`), external-player fallback, 401/403 vs 404 vs network vs unsupported messaging, PiP, channel zap debounce, two-stage BACK (hide chrome → exit), D-pad timeline↔actions↔top navigation.

**Visual/UX gaps (verified code; visual severity needs screenshots):**

1. **Chrome is code-drawn, not theme-driven.** `ovalDraw`, `roundDock`, `dp()` sizes, `PlayerPalette` colors — no parity with web `--morph-*` tokens. Expect TV-dark chrome on phone light mode unless `PlayerPalette` branches (unverified — read `PlayerPalette.java` before redesign).
2. **Information density.** Top shows back + title + meta + plot + poster; bottom shows timeline + transport + gear; right shows settings. On 360 px-high landscape phone, top + bottom + side panel overlap content. `contentPlot GONE when empty` shifts layout mid-playback.
3. **Seek & scrub.** `beginScrub/finishScrub`, `seekHold`, `dragging`, `seekingResume` states exist but no visible chapter ticks, no preview thumbnails, no time-tooltip spec in code. Live has no seek (correct) but timeline visibility for live is code-dependent — verify on device.
4. **Overlays compete.** `loading` + `bufferingNotice` + `buffering spinner` + `toast` + `PlayerDialog` can stack. `scheduleHide (4000 ms)` + `rehide (2000 ms)` keeps chrome visible while panels open — good, but no auto-dim for OLED.
5. **Fullscreen/PiP affordance.** `supportsPictureInPicture=true`, `resizeableActivity=true`, but no in-chrome PiP button found in `PlayerActivity.java` key/controls audit. Users must know OS gesture. Needs-device-testing.
6. **Captions/tracks.** `tracks(TYPE_AUDIO/SUBTITLE)` menus exist; no caption preview style, no default-track memory UI. Needs-device-testing with multi-audio HLS.
7. **Kids/Quran paths.** `kids()` launches hardcoded Kidsy HLS; `prayerSchedule` returns early on `phoneLayout`. Player must not show TV-only prayer overlay on phone — verified guard exists, keep it.

---

## 6. Recommended premium direction (preserve brand)

**Brand to keep:** Morph TV wordmark (`morph-wordmark.webp` phone header, `tvmorph.webp` launcher icon), Morph IPTV wordmark for phone library (`morph-iptv-wordmark.webp`), blue primary (`#174FC9` light / `#2463EB` glow), light surface `#F4F7FB` + dark navy `#2C3B57`, Arabic-first with English parity. Keep package IDs, signing, `logo.webp` phone icon per AGENTS.md. Loading screens keep full-res PNG wordmarks; headers use WebP (via `iptv_shared.sync_webp_artwork()`).

**Direction: "Quiet premium companion + cinematic phone theater."**

1. **One token system.** Promote `tokens.css` to source of truth: `--morph-bg/surface/subtle/border/text/muted/primary/on-primary/focus/nav-*`, spacing `4/8/12/16/24/32`, radius `12/16/20/24`, shadow `sm/md/lg`, type scale `12/14/16/20/24/30` with Arabic line-heights 1.7–1.9. Delete per-file `--wf/mp/m` aliases or map them to tokens (worship/matches already close — keep their semantic names as aliases).
2. **Two surfaces, one accent.** Companion (Connect/Remote/Apps/Settings) = light-first clean (`#F4F7FB` bg, white cards, navy ink `#16304B`, blue `#174FC9`). Theater (phone library + player + matches + worship reader) = cinematic dark-first with pearl-light option (keep `phone-iptv.js` pearl injector, but drive from tokens). Never mix on one screen.
3. **Single hero per screen.** Studio: keep `#preview` as hero, demote marketing banner to compact welcome card. Connect: connection status card is hero. Remote: D-pad/touchpad is hero. Library: continue-watching rail is hero (new).
4. **Component kit (build once, reuse):** AppBar (wordmark + status chip + settings gear), Segmented control (replaces 5 tab styles), Card (media 16:9/2:3 + title + meta), ListRow (44 px+, icon + title + subtitle + chevron + reorder handle), Button (primary/secondary/ghost/destructive, 48 px, 14 px radius), Sheet (bottom, 24 px top radius, drag handle, focus trap — unify `m30-sheet` + `settings-panel` + `PlayerDialog` language), EmptyState (illustration + title + action), SearchField (persistent, clear button), Chip (status/filter), Loader (skeleton grids, not spinners).
5. **Icon system.** Adopt `morph30.js:P` 24/1.8/round stroke set as contract; replace all emoji/ASCII (`⌂ ✦ ☰ ▶ ▣ ⌘ ▲`) with SVG; add Live/Movies/Series/Favorites/Search/Settings/Back/PiP/Subtitles/Audio/Quality/Speed icons in same weight. No emoji in chrome.
6. **Typography.** Display 30/34 Arabic-bold for heroes only; Title 20/24; Body 14–15/1.8; Caption 12–13 muted with ≥4.5:1 contrast (darken `#8f879e` → `#5B6B82` light / `#B9CBE6` dark). Numerals `tabular-nums` for times/scores (matches already does).
7. **Motion.** 180 ms ease-out press (`scale .98` keep), 240 ms sheet/drawer, `prefers-reduced-motion` respected (already in `style.css`, extend to all sheets). Skeleton shimmer for `#items` grid (replace spinner-only).
8. **RTL excellence.** Mirror chevrons/back (`›`/`‹`), keep numerals/IP `ltr`, test Arabic + English + one RTL edge (Urdu) and one LTR (French) before ship.

---

## 7. Components that should be redesigned / refactored

**P0 — Redesign (visual + structure):**

- `assets/ui/index.html` header + `.language-row` + `.bottom-nav` → single `AppBar + BottomNav` kit (`MainActivity.java:22-28` status/nav colors must follow new tokens).
- `page-studio` — split into `StudioHome (banner + preview + library)` and `Customize (details#personal-touch + theme-packs + colors)`; fix `#apply` apply-bar vs bottom-nav overlap.
- `page-connect` — single `ConnectionWizard`: Scan → Select → Prepare (per-system guide) → Install → Verify. Merge `#phone-ip`/`#tv-ip` into labeled `TV card / Phone card` (`morph30.js STR` already names them — promote to UI). Remove hidden `#install` duplicate.
- `page-remote` — D-pad + touchpad + keyboard as one `ControlDeck` with capability chips (not fine print), 48 px rows, SVG keys.
- `page-iptv` entry — separate `Watch on phone` vs `Send to TV` destinations; collapse source form into `Add source` sheet; add password reveal + validation.
- `phone-iptv.css` header/nav/home-grid/items/drawer — rebuild from tokens, delete empty `@media` blocks, collapse 5-level selectors to 2-level BEM.
- `PlayerActivity.java` chrome — restyle `PlayerCinemaChrome` top + `actionRow` dock + `settingScroll` from tokens; enlarge `PlayerSettingRow` to 48 px; add PiP + aspect + subs entry points in chrome (keep `phoneMode` key map).

**P1 — Refactor (keep behavior, fix system):**

- `approved-mobile.css` (140 lines, 366 KB minified — unreadable) + `daylight/navy/glass/morph30/mobile-polish/mobile-cinematic/studio-shell/studio-editor/premium-*` → layered theme: `tokens → base → theater` + 2 appearance overrides (light/dark). Delete dead `#theme-search` duplicates, dead font-size panel or wire it.
- `app.js` + `morph30.js` + `connect-flow.js` + `customization-sections.js` runtime DOM moves → declarative sections; single `show()` with history + scroll restore + `ClearNative.navigationPage` sync.
- `locale.js` + per-file `words{}` + `MorphLocale/ThemeLocale` → one i18n with fallback + `data-no-translate` discipline; add Cast/DLNA zh/ja or hide those locales there.
- `phone-iptv.js` 10× IIFE label rewriters (`labels()`, `paint()`, `decorateChoice`) → render from `homeData()` once; keep focus-trap drawer (good).
- `worship-phone.css` / `matches-phone.css` `!important` + `-webkit-text-fill-color` resets → remove once base stops leaking TV styles; keep their token-alias pattern as reference.
- `MainActivity.java` `run()` 200-line action switch + `Bridge` — extract `ConnectActions/RemoteActions/IptvActions` (no UI change, enables testing).

**Keep as-is (good bones):**

- `PhoneIptvActivity.java` sharing (`standalone/phoneLayout/returnToHost`) — correct boundary per AGENTS.md; only presentation differs.
- `IptvStore/Vault/Keystore` credential handling, `type=password`, no secrets in `localStorage` — do not regress.
- Category drawer focus trap + `aria-expanded/controls`, `aria-current` on tabs, `role=status` live regions — extend, don't remove.
- `PlayerActivity` retry/alternate/reconnect policies + localized error codes — keep logic, reskin dialog.

---

## 8. Technical limitations & dependencies

- **Single portrait WebView + native islands.** Companion is portrait-only; player/network/multi-view are landscape. Any redesign must provide portrait companion specs + landscape player specs + rotation transition. `configChanges=keyboardHidden|orientation|screenSize` means WebView does not reload on rotate — layout must be CSS-responsive, not activity-recreated.
- **No router/deep-link.** `show()` toggles `hidden`; `history.scrollRestoration='manual'`; no URLs. Back, notifications (`openWorship`), QR relay cannot deep-link today. Redesign needs `historyStack` (exists in `morph30.js`, 24 entries) wired to native `onBackPressed` + `navigationPage`.
- **CSS weight crisis.** `phone-iptv.css` + `approved-mobile.css` ≈ 760 KB, `html#iptv-theme-root...!important` chains. Any new style without `!important` loses. Must de-escalate specificity before visual polish sticks. Build copies assets verbatim — dead code ships to APK (`TV-Morph-Preview.apk` 116 MB with `android-tv.apk` + `lg-preview.ipk` inside).
- **JS fragility.** ~45 synchronous scripts, `MutationObserver` label rewriters, `setTimeout` polling (`checkMorphConnection`, `downloadServer` HEAD loop). No tests for visual regressions; `tests/ui-check.cjs` asserts bridges, not pixels. Add screenshot checks (existing `*-preview.png` are manual).
- **Platform caps.** minSdk 26 / targetSdk 30 (behind Play requirements), `debuggable=true`, `usesCleartextTraffic=true` (LAN HTTP by design — document, do not silently disable), WebView `setSupportZoom(true)` risks pinch-zoom breaking fixed bottom-nav (needs-device test). `singleTask` + `singleTop` affect share-server ownership.
- **TV dependence.** Phone features (`apply/pins/open/remote/iptv`) require paired TV (`connectionReady`, `developerReady`, tokens). Offline phone library works (personal pending flow) but TV controls degrade. Redesign must show offline-capable vs TV-required states explicitly (today: disabled `opacity:.4` only).
- **VIDAA excluded.** Per AGENTS.md, do not add VIDAA to standalone matrix; Connect shows VIDAA discovery-only (correct — keep).
- **Publication hold.** `output/release-hold.json` + landing on hold — do not upload builds or change landing. Redesign only.
- **Assets.** Keep `morph-launcher-wordmark.webp` / `morph-iptv-wordmark.webp` / `morph-wordmark.webp` distinct; `logo.webp` phone icon; `tvmorph.webp` res drawable. `phone-iptv.css` references `iptv-home-tv/movies/series.png` staged art — verify licenses before new art.

---

## 9. Prioritized redesign recommendations

**P0 — Fix first-use & trust (before any visual polish):**

1. Rebuild Connect as 4-step wizard with one install CTA, TV/Phone cards, explicit Verify step. Files: `index.html:12-26`, `app.js:platform/connected/connect`, `connect-flow.js`, `guide.js`.
2. Fix Back + nav truth: wire `morph30.js:historyStack/scrollMem` to `MainActivity.onBackPressed`, add visible segments for Apps/Cast under Control, remove `apps→remote` remap hack.
3. Separate Play destinations: `Watch on phone` (primary) vs `TV controls` (secondary sheet). Files: `index.html:32`, `iptv-phone.js`, `phone-iptv` home.
4. Unify buttons/inputs to 48 px kit + visible disabled reasons. Files: `style.css:.primary/.secondary`, `morph30.css:.bottom-nav`, `settings-panel`, source form.
5. Replace emoji keys with SVG set (`morph30.js:P` + `remote-visual.js`), enlarge `app-row` reorder + player rows to 44–48 px.

**P1 — Premium look (one sprint):**

6. Tokenize: `tokens.css` source of truth, map `--wf/mp/m/media/stream/iptv` to it, delete 6 dead theme sheets or demote to appearance-only.
7. Studio split + single hero + sticky apply-bar that respects `safe-area` + bottom-nav (verified overlap today).
8. Phone library home: add Continue Watching + Search entry, skeleton loaders, empty states with actions. Files: `phone-iptv.js#phone-iptv-home`, `#items`, `#phone-category-drawer`.
9. Player reskin: token-driven top/bottom chrome, 48 px settings rows, PiP + aspect + captions entry, time-tooltip scrub, error dialog matching web sheets. Files: `PlayerActivity.java`, `PlayerCinemaChrome.java`, `PlayerChromeButton.java`, `PlayerSettingRow.java`, `PlayerDialog.java`.
10. Typography + contrast pass: darken muted inks, `tabular-nums` times, 12/14/16/20/24/30 scale, Naskh only for Quran reader.

**P2 — Delight & completeness:**

11. Apps screen with icons + search + drag reorder; Remote haptics + long-press OK favorite hint (`app.js:okButton 650 ms` exists — surface it); Cast page split (Mirror vs DLNA vs Files) + nav entry or removal.
12. Worship/Matches alignment to kit (keep pastel/sports character, adopt shared AppBar/Sheet/Button/Search).
13. Onboarding (`first-run.js` + `morph30.js:onboard`) + capability hints + offline states; wire dead font-size panel or remove.
14. RTL/LTR + TalkBack + 360/412/600 px + foldable pass; contrast measurement; 44 px audit.

**P3 — Tech health (enables future velocity):**

15. De-escalate `phone-iptv.css`/`approved-mobile.css` specificity, purge empty media queries, split theater vs companion bundles.
16. Consolidate i18n, remove `de/es`-only and `zh/ja`-missing gaps, add missing Cast/DLNA strings.
17. Extract `MainActivity.run()` actions, add screenshot regression (`morph30-*.png`, `daylight-*.png`, `twilight-*.png` pattern exists — automate).
18. Update `targetSdk`, disable WebView debugging for release, document cleartext-LAN rationale for Play review.

---

## Appendix A — File map (mobile UI/UX)

- Host: `mobile-app/src/local/cleartv/mobile/MainActivity.java`, `MatchesActivity.java`, `mobile-app/AndroidManifest.xml`, `mobile-app/build.py`, `mobile-app/assets/ui/index.html`
- Companion logic: `assets/ui/app.js`, `morph30.js`, `connect-flow.js`, `guide.js`, `guide-en.js`, `compatibility.js`, `launcher-help.js`, `setup-options.js`, `lg-connect.js`, `samsung-adapter.js`, `samsung-media.js`, `samsung-media-bridge.js`, `samsung-catalog.js`, `samsung-locks.js`
- Companion style: `assets/ui/style.css`, `morph30.css`, `approved-mobile.css`, `daylight-mobile.css`, `navy-mobile.css`, `glass-mobile.css`, `mobile-polish.css`, `mobile-cinematic.css`, `studio-shell.css`, `studio-editor.css`, `premium-mobile.css`, `premium-landings.css`, `appearance.css`, `bright.css`, `tv-base-mobile.css`, `remote.css`, `remote-visual.css`, `connect-flow.css`, `library.css`, `first-run.css`, `setup-options.css`, `customization-sections.css`, `support.css`, `welcome-support.css`, `progress.css`, `plus*.css`, `theme-preview.css`, `tv-project/app/ui/tokens.css`
- Phone theater: `mobile-app/phone-iptv.css`, `mobile-app/phone-iptv.js`, `android-tv/iptv/*` (shared), `android-tv/src/local/tvmorph/tv/PhoneIptvActivity.java`, `IptvActivity.java`, `PlayerActivity.java`, `PlayerCinemaChrome.java`, `PlayerChromeButton.java`, `PlayerSettingRow.java`, `PlayerDialog.java`, `BufferedVideo.java`
- Verticals: `assets/ui/matches-screen.html`, `matches-phone.css/js`, `worship-phone.css/js`, `assets/ui/cast-screen.js`, `dlna-cast.js`, `phone-network.css/js`, `phone-updates.js`
- Prior audits (reference, not scope): `MORPHTV_MOBILE_FULL_AUDIT.md`, `MORPHTV_MOBILE_NAVIGATION_MAP.md`, `MORPHTV_MOBILE_REDESIGN_PROPOSAL.md`, `MORPHTV_UI_UX_AUDIT.md` (TV-heavy), `IPTV_THEME_CONSISTENCY_AUDIT.md`

## Appendix B — Verified vs needs-device-testing

**Verified in source:** all inventories, CSS order/weights, `show()` router, back behavior, bridge actions, gating attributes, drawer focus trap, credential storage, player key map, retry policies, RTL attributes, breakpoints, safe-area gaps in base, icon emoji usage, form fields, empty-state copy.

**Needs on-phone validation:** contrast ratios, tap-target feel, toast/operation legibility, D-pad vs touchpad ergonomics, swipe threshold (38 px), drawer/sheet motion, 360 px clipping (matches hero, phone header), tablet/foldable 600 px+ layouts, keyboard covering search/results, TalkBack order (Connect reparenting), PiP entry, caption/track menus with real HLS, brightness/volume gesture expectations, OEM emoji vs SVG rendering, WebView pinch-zoom vs fixed nav, dark/light wallpaper legibility.

---

*End of audit — no code changed. Awaiting redesign direction before any implementation.*
