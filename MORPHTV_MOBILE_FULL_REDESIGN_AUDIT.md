# MORPHTV MOBILE — Full Redesign Audit

> **Scope:** Morph TV Mobile application only (phone app, `Morph TV` installed label).
> **Mode:** READ-ONLY audit. No code was modified, deleted, or refactored for this report.
> **Date:** 2026-11-05
> **Auditor:** Muse Spark (OpenCode agent)
> **Workspace root:** `C:\Users\Admin\Documents\Codex\2026-10-22\ui-ux\`

Conventions used in this report:

- **CONFIRMED** = verified by direct file read / directory listing in this workspace.
- **INFERRED** = highly likely from code structure but requires device/network test to fully verify.
- **RECOMMENDATION** = proposal for the future redesign, not a current fact.

Prior related docs (not re-audited in depth, referenced for continuity):

- `mobile-app/ARCHITECTURE.md`, `mobile-app/DESIGN_SYSTEM.md`, `mobile-app/README.md`
- `mobile-app/design-system.json`, `mobile-app/design-layout-sources.json`
- `MORPHTV_MOBILE_FULL_AUDIT.md`, `MORPHTV_MOBILE_UI_UX_AUDIT.md`, `MORPHTV_MOBILE_NAVIGATION_MAP.md`, `MORPHTV_MOBILE_REDESIGN_PROPOSAL.md`, `MORPHTV_MOBILE_IMPLEMENTATION_ROADMAP.md`
- `MORPHTV_MOBILE_3.0_*.md` (changelog / fix / implementation / QA)
- `IPTV_THEME_CONSISTENCY_AUDIT.md`, `UNIVERSAL_IPTV_*.md`

---

## 1. Complete App Structure — CONFIRMED

### 1.1 Host identity (native shell)

**File:** `mobile-app/AndroidManifest.xml:1-14` — CONFIRMED

- Package `local.cleartv.mobile`, `versionCode 322`, `versionName 1.1.317`.
- `minSdk 26`, `targetSdk 30`, `supportsRtl=true`, `usesCleartextTraffic=true`, `debuggable=true`.
- `MainActivity` (`singleTop`, `portrait`, `MAIN`/`LAUNCHER`) — the WebView host.
- `MatchesActivity` (`portrait`, non-exported) — separate WebView for sports/matches.
- Declared but implemented elsewhere (shared TV code per `AGENTS.md`):
  - `local.tvmorph.tv.PhoneIptvActivity` (`screenOrientation unspecified`)
  - `local.tvmorph.tv.PlayerActivity` (`landscape`, PiP)
  - `local.tvmorph.tv.MultiViewActivity` (`landscape`)
  - `local.tvmorph.tv.NetworkActivity`, `local.tvmorph.tv.NetworkPlayerActivity`
  - `local.tvmorph.tv.UpdateProvider`
- Services/receivers: `DownloadService` (`dataSync`), `FaithAdhanService` (`mediaPlayback`), `FaithAlarmReceiver` (`BOOT_COMPLETED` / `TIME_SET` / `TIMEZONE_CHANGED` / `MY_PACKAGE_REPLACED`).
- Permissions: `INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE`, `CHANGE_WIFI_MULTICAST_STATE`, `LOCATION x2`, `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `REQUEST_INSTALL_PACKAGES`.
- App label `Morph TV`, icon `@drawable/tvmorph`, theme `Theme.Material.NoActionBar`, `allowBackup=false`.

**Native Java sources — CONFIRMED via `mobile-app/src` listing:**

- `mobile-app/src/local/cleartv/mobile/MainActivity.java` (57,084 bytes) — WebView bootstrap, `ClearNative` bridge, `run(action,payload)` dispatcher, back-press handling, lifecycle.
- `mobile-app/src/local/cleartv/mobile/PhoneUiLaunch.java:11-32` — non-blocking local launches: `bridgeOpen` → `BridgeLaunch.open(host)`, `matchesOpen` → `MatchesActivity`, `remoteOpen` → integrated-remote `RemoteActivity` (gated by `resolveActivity`).
- `mobile-app/src/local/cleartv/mobile/PhoneDesignTokens.java:1-55` — generated ints from `design-system.json` (see §2).
- `mobile-app/src/local/cleartv/mobile/PhoneUpdates.java:6` — update host `https://morph-tv.com`, channel logic.
- `mobile-app/src/local/cleartv/mobile/MobileStrings.java:9` — `t(ctx,source)` from `assets/ui/locale-data.json`.
- Platform providers (must not break — see §5):
  - Samsung: `SamsungRemote.java`, `SamsungWidget.java`, `SamsungWgtInstaller.java`, `SamsungLogin.java`, `SdbClient.java`, `WidgetSigner.java`, `Certificates.java`, `AndroidDiscovery.java`
  - LG: `LgDiscovery.java`, `LgControl.java`, `LgActions.java`, `LgInstaller.java`, `LgInstallProtocol.java`, `LgSsh.java`, `LgInspectorTarget.java`
  - AndroidTV/FireTV: `AndroidTv.java`, `FireTvInstaller.java`, `Network.java`, `LanHttp.java`, `ApkDownload.java`, `DownloadService.java`, `InstallPackage.java`, `ReceiverApk.java`, `AdbIdentity.java`, `SdbClient.java`
  - DLNA/Cast: `DlnaCast.java` (17 KB), `DlnaMediaServer.java`, `DlnaLocalFile.java`, `CastSettings.java`
  - Faith/Prayer: `FaithPrayer.java` (12 KB), `FaithPrayerMath.java`, `FaithAdhanService.java`, `FaithAlarmReceiver.java`, `FaithVoicePacks.java`
  - Misc: `Vault.java` (Keystore), `ImageAsset.java`, `DeviceCompatibility.java`, `HomeServiceSettings.java`, `ThemePackIds.java`, `Inspector.java`, `BridgeLaunch.java`, `MatchSchedule.java`, `MatchesActivity.java` (3.4 KB)
- Third-party vendored: `mobile-app/src/com/batoulapps/adhan/` (adhan prayer calc, ~20 files) — CONFIRMED.
- Other native modules (directory listing CONFIRMED, not deep-audited):
  - `mobile-app/bridge-native/` — Bridge source snapshot (`upstream-source.json`), `MorphHostShell.kt`, `BridgeAppCatalog.kt`, `SessionManager`
  - `mobile-app/integrated-remote/` — Flutter remote (`lib/core/theme/phone_design_tokens.dart`, `lib/features/devices|discovery|pairing|remote|onboarding|settings`, providers, services)
  - `mobile-app/libs/`, `mobile-app/res/drawable-nodpi/tvmorph.webp` + `tvmorph_banner.webp`, `mobile-app/build/`, `mobile-app/test-classes/`, `mobile-app/tests/`

### 1.2 Web UI shell — single WebView + satellite activities

**Canonical shell:** `mobile-app/assets/ui/index.html` (38,026 bytes) — CONFIRMED

Loaded by `MainActivity.onCreate` as `file:///android_asset/ui/index.html` with `JavaScriptEnabled`, `DomStorageEnabled`, `AllowFileAccess=false`, `AllowContentAccess=false`, `AllowFileAccessFromFileURLs=false`, `AllowUniversalAccessFromFileURLs=false`, `MixedContent NEVER`, `shouldOverrideUrlLoading → true` (block), `onReceivedSslError → cancel`.

Head CSS order (CONFIRMED):

1. `phone-tokens.css` (generated, 164,913 bytes incl. base64 wordmark mask)
2. `phone-layout.css` (structural only, 189,549 bytes)
3. `phone-system.css` (chrome/cards/tabs/controls, 17,935 bytes)
4. Inline appearance bootstrap from `localStorage tvmorph.appearance-choice.v1`

Body JS order tail (CONFIRMED, ~60 scripts): `appearance.js`, `locale.js` (421 KB), `guide-en.js`, `guide.js`, `theme-packs-manifest.js`, `theme-packs.js`, `theme-preview.js`, `clubs.js`, `theme-locale.js`, `app-library.js`, `progress.js`, `device-controller.js`, `remote-controller.js`, `app.js`, `cast-screen.js`, `dlna-cast.js`, `parental.js`, `iptv-source-form.js`, `iptv.js`, `iptv-phone.js`, `compatibility.js`, `launcher-help.js`, `packs-phone.js`, `connect-flow.js`, `setup-options.js`, `lg-connect.js`, `update-alert.js`, `support.js`, `plus-phone.js`, `contact.js`, `remote-visual.js`, `welcome-support.js`, `customization-sections.js`, `morph30.js` (39,568 bytes, current navigation), `mobile-cinematic.js`, `studio-shell.js`, `premium-mobile.js`, `approved-mobile.js`, `text-size.js`, `first-run.js`, `navy-mobile.js`, `iptv-account-manager.js`, `studio-editor.js`, `premium-landings.js`, `faith/faith-content.js`, `worship-phone.js` (41,770 bytes), `matches-entry.js`, `readability-mobile.js`, `install-choice.js`, `settings-mobile.js`, `protocol-help.js`, `home-shortcuts.js`, `phone-system.js`.

`mobile-app/assets/ui/` total: **110 entries** — CONFIRMED. Notable large files:

| File | Size | Role |
|---|---|---|
| `locale.js` | 421 KB | translations runtime |
| `locale-data.json` | 399 KB | translation source |
| `approved-mobile.css` | 366,937 bytes | legacy/premium overlay skin |
| `phone-layout.css` | 189,549 bytes | structural layout |
| `phone-tokens.css` | 164,913 bytes | generated tokens + base64 mask |
| `morph-logo-hq.png` | 511 KB | excluded from phone bundle by `build.py` ignore |
| `iptv-home-*.png`, `phone-device-premium.png`, `remote-device-premium.png`, `connect-tv-premium.png` | 1.1–1.8 MB each | device/art imagery |
| `daylight-mobile.css` | 88 KB | generated daylight theme |
| `navy-mobile.css` | 68 KB | navy theme source |
| `readability-mobile.css` | 37 KB | readability overlay |
| `morph30.css` | 28 KB | current shell chrome |
| `premium-landings.css` | 26 KB | landing skins |
| `worship-phone.css` | 25 KB | prayer feature |

### 1.3 Screens / pages (`.page` sections in `index.html`)

| Page ID | Bottom-nav | Contents (CONFIRMED IDs) |
|---|---|---|
| `page-studio` (Design) | `data-page=design` | `.studio-banner .banner-action[data-page=connect]`, `.studio-shortcuts button[data-page=cast/connect/apps/remote]`, `details#family-panel (#family-load/select/switch/new/create/status/note)`, `#preview (#preview-clock/title/subtitle/club/art-frame/art-image/weather/slides)`, `#club-details`, `details#theme-library (#theme-search, #theme-collections` 12 filter buttons, `#themes`, `#collection-empty`, `.theme-pricing)`, `.font-size-panel (#fontSizeAr/En)`, `details#personal-touch (#custom-title/subtitle, #artOffsetX/Y + outputs, #reset-layout)`, `#art-preview #pick-art #clear-art`, `details.about-us`, `#apply`, CTA `[data-page=connect]` |
| `page-connect` (Home in 3.0) | `data-page=home` | `#scan`, `#devices`, `#manual-type-toggle #manual-system-panel #device-type #type-description`, `#connection-state (#connection-title/detail, data-status=idle/checking/connected/error/unsupported)`, `#install-card (#install-title, #smart-install-note, #download-center, #platform-package, #public-tv-url, #public-tv-download, #smart-install)`, `#android-pair (#pair-code #pair-android #share-android #download-box #download-url)`, `.panel.manual (#tv-ip #connect #connected-device)`, guide `#guide-count/dots/kicker/title/text/phone-card(#guide-phone-ip)/prev/next/check/note`, `details.troubleshoot`, `details.compatibility (#compat-lg)`, `.phone-ip #phone-ip`, hidden legacy `#install[hidden][disabled]` |
| `page-apps` | `control` segment `apps` (legacy `apps` redirects to `remote` in `morph30.js:99`) | `#refresh-apps`, `#apps-empty`, `#app-list` (rendered by `app-library.js MorphAppLibrary.render` with checkbox + up/down reorder), `#save-pins` |
| `page-remote` | `control` segment `remote` | `#remote-device`, `#remote-mode (internal/native)`, `#remote-connect`, `#remote-status`, tabs `#remote-pad-mode/#remote-touch-mode`, `#touchpad`, `.remote-pad` D-pad `data-remote-key=UP/LEFT/ENTER/RIGHT/DOWN`, `.remote-row` `SETTINGS/RETURN/HOME/SOURCE/VOL/VOL+/VOL-/PLAY/PAUSE/CH+/CH-` with `data-native-only/data-volume/data-library-only/data-playback` gating, `#remote-text #remote-send` |
| `page-iptv` (Play) | `data-page=play` | `#iptv-destination-intro`, `#iptv-account-state`, `.iptv-destinations #iptv-phone-open #iptv-tv-show`, `#iptv-source-current`, `#iptv-public-card (#iptv-public-phone/tv)`, `#iptv-personal-card (#iptv-personal-actions, details#iptv-form-details[open] #iptv-type/server/port/mac/user/password/name/format/live/vod/series #iptv-save-phone #iptv-connect)`, `details#iptv-tv-controls (#iptv-open/refresh, [data-iptv-kind] live/vod/series, #iptv-category/search/search-go/items/list-status/prev/next/clear)` |
| `page-cast` (ghost, no bottom-nav) | via `data-page=cast` shortcuts + `cast-back[data-page=studio]` | `#cast-title/intro/open/steps/stop/status`, `#cast-difference/receivers`, `#dlna-panel (#dlna-scan/devices/url/kind/send/send-file/file/file-name/play/pause/stop/back/fwd/voldn/volup/mute/caps/status)` |
| `page-worship` (`<section hidden data-no-translate>`) | `data-page=worship` injected nav | Rendered entirely by `worship-phone.js MorphWorship` (Quran/reader/bookmarks/prayer/adhan/voice packs). Gate: `MorphWorship.enabled()` + `localStorage morph.faith.enabled.v1`. Empty in `index.html`. |

Global chrome (all pages):

- `header .brand img.brand-wordmark (morph-wordmark.webp)` + `#device-chip[data-page=home]` + `#m30-gear-btn / #m30-page-back` (injected by `morph30.js`)
- `.language-row #app-language #app-appearance`
- `#reconnect-notice (#reconnect-title/message/action)`
- `footer (Developed by Karim Aboushousha & Hassan Shehata + Preview 0.8.68)`
- Overlays: `#operation (#spinner #operation-title/message/close)`, `#toast`, `#language-dialog`
- 3.0 additions: `#m30-status hero (#m30-status-title/sub)`, `#m30-control-segment [data-msub=remote/cast]`, `#m30-gear-sheet (#m30-sheet-body + #m30-scrim + .m30-onboard 3 slides)`

### 1.4 Satellite native activities (not `.page`)

- `MatchesActivity.java:15-38` — full phone page, loads `assets/ui/matches-screen.html` (2.4 KB) + `matches-screen.css` + `matches-phone.css/js` via `loadDataWithBaseURL(file:///android_asset/ui/)` with `{{LANG}}`/`{{APPEARANCE}}` substitution. Bridge `MatchesNative` with `back()` + `request(id,force)` → `window.matchResult(id,ok,value)` from `MatchSchedule.load()`. Back: `MorphMatches.back()` else `finish()`.
- `PhoneIptvActivity` (`local.tvmorph.tv.*`) — native phone player/library. Staged frontend canonical `android-tv/iptv/` + adapters `mobile-app/phone-iptv.js` (26,415 bytes) / `mobile-app/phone-iptv.css` (457,066 bytes). JS API: `paint()` home sections `data-phone-section=live/vod/series/multiview/favorites`, `decorateChoice()`, `PhoneIptvPersonalPending()`, `PhoneIptvNavigation.back=dismiss`, `#phone-host-back`, `#phone-source-back`, category drawer, settings tabs `iptv-settings-tab-accounts/add/playback/library`.
- `NetworkActivity` — shared local-network browser (build stages `tv-project/app/network/` + `mobile-app/phone-network.css` 16 KB + `mobile-app/phone-network.js` 373 bytes). `phone-network.js:2` only sets appearance + `data-phone-network` attr — CONFIRMED minimal.
- `PhoneUiLaunch` local launches: `bridgeOpen`, `matchesOpen`, `remoteOpen` (see §1.1).

### 1.5 Navigation system

- **Legacy primitive:** `assets/ui/app.js:26` — `querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>show(b.dataset.page))`, `show()` toggles `hidden` on `.page`, sets `.bottom-nav .active`. `window.handleBack` in `app.js:16`: if `#operation` visible close, else if `page!=='studio'` → `show('studio')`, else `false` (exit). No history.
- **Current (3.0):** `assets/ui/morph30.js:60-156` — `Morph30.show(name,opts)` + `Morph30.back()` + `window.handleBack=back`:
  - Aliases `PAGE_OF`: `home/connect→page-connect`, `design/studio→page-studio`, `control/remote→page-remote`, `apps→page-remote` (redirect line 99), `play/iptv→page-iptv`, `cast→page-cast`, `worship→page-worship`. `NAV_OF` reverse. `CONTROL_SUB` maps remote/apps/cast.
  - `historyStack` (cap 24) + `scrollMem` per page, `replace/keepScroll` opts, `morph30page` event.
  - `paintNav()`: `body[data-mobile-page]`, `#m30-applybar` only on `page-studio`, `.bottom-nav.hidden = activePage!=='page-connect'`, `#m30-page-back.hidden = activePage==='page-connect'`, calls `ClearNative.navigationPage(activePage)` → native `systemAppearance()` + nav-bar color.
  - `back()` order: `MorphHomeMenu.back()` → `MorphWorship.closePrompt()` → `MorphFirstRun.isOpen()` → `MorphUpdates.close()` → `#operation` → `.morph-plus-overlay .plus-close` → `#morph-welcome-support [data-start]` → `.m30-sheet.open/.m30-onboard` → `MorphWorship.back()` → `historyStack.pop()` → fallback `show('home')` (never jumps to Design unprompted).
  - Native `MainActivity.onBackPressed:259` dispatches synthetic `Escape keyCode 27` to `document`, calls `window.handleBack()`, else double-press within 2000 ms to exit (`exitBackAt`).
- **Bottom nav:** `nav.bottom-nav button[data-page=home/design/control/play]` with inline SVG icons via `Morph30.svg()` + labels via `STR[ar/en/fr/zh/ja]`, `aria-current`. `rebindNav()` + in-page `[data-page]` shortcuts. Control segment `m30-control-segment [data-msub]` mounted into visible control page. Play destination `.iptv-destinations` toggled via `#iptv-tv-controls[open]`.
- **Gear sheet:** `buildGear/openSheet/closeSheets` relocates `.language-row`, `.morph-support`, `details.about-us` into `#m30-gear-sheet` (same nodes/contracts). Onboarding `maybeOnboard()` 3 slides gated by `tvmorph.onboarded30` + `?m30onboard=1`.
- **Docs:** `MORPHTV_MOBILE_NAVIGATION_MAP.md:9-167` documents before (5 tabs + ghost, `show()` no history) vs after (4 tabs + gear, 2 levels max) + `morph://home|design|control|play` proposal (INFERRED future, not implemented).

### 1.6 Reusable components (CONFIRMED)

Per `DESIGN_SYSTEM.md:9-18` + `ARCHITECTURE.md:8-18`, intended shared components:

- `assets/ui/phone-system.css` + `phone-system.js`: page chrome, cards, headings, tabs, controls, navigation, dynamically inserted content.
- `assets/ui/device-controller.js:8` — `MorphDeviceController.select(brand,ready)` pure presentation.
- `assets/ui/remote-controller.js:8` — `MorphRemoteController.create({call,operation,platform,needsReconnect})`, owns `remoteReady/Native/Busy`, `connectRemote()`, `remoteSend()`, long-press OK 650 ms → `FAVORITE` on Android.
- `assets/ui/connect-flow.js`, `setup-options.js`, `lg-connect.js` — discovery/connection presentation (must use host/native discovery, no parallel scanner).
- `assets/ui/remote-visual.js` + `remote.css` + `remote-visual.css` — remote button artwork (presentation only).
- `assets/ui/app-library.js` — `MorphAppLibrary.render` (apps list + pins).
- `assets/ui/parental.js`, `compatibility.js`, `packs-phone.js`, `worship-phone.js`, `matches-phone.js` + `matches-entry.js`, `settings-mobile.js`, `appearance.js`, `plus.js` + `plus-phone.js`, `support.js`, `contact.js`, `update-alert.js` + `phone-updates.js`, `progress.js`, `guide.js` + `guide-en.js`, `clubs.js`, `theme-locale.js`, `launcher-help.js`, `customization-sections.js`, `studio-editor.js`, `studio-shell.js`, `mobile-cinematic.js`, `premium-mobile.js`, `approved-mobile.js`, `text-size.js`, `first-run.js`, `navy-mobile.js`, `install-choice.js`, `home-shortcuts.js`, `protocol-help.js`, `readability-mobile.js`.
- Bridge/integrated-remote: `bridge-native/.../ui/MorphHostShell.kt`, `integrated-remote/lib/core/theme/`, `integrated-remote/lib/features/*`, `home-shortcuts.css/js`.

---

## 2. Current Visual Design — CONFIRMED

### 2.1 Canonical tokens (source of truth)

**Source:** `mobile-app/design-system.json` → generated by `mobile-app/phone_design_system.py:sync()` into `mobile-app/assets/ui/phone-tokens.css`, `mobile-app/src/local/cleartv/mobile/PhoneDesignTokens.java`, `bridge-native/.../PhoneDesignTokens.kt`, `integrated-remote/lib/core/theme/phone_design_tokens.dart`. Daylight variant via `mobile-app/theme_daylight.py:build()` → `assets/ui/daylight-mobile.css` + `phone-iptv.css /* Daylight overlay */` + `phone-network.css`.

Dark `colors` (CONFIRMED from `design-system.json`):

```
backgroundTop #1C4B91, backgroundMiddle #0D294E, backgroundBottom #061A33, backgroundBase #071B36
glassTop #648BBD25, glassBottom #1C355C50, surface #173657, soft #24466A, border #BCD7FF2E
text #FFFFFF, muted #D1DEF0, accent #2F6DCA, accentEnd #2053A0, link #B7DAFF
shadow #000B202E, success #88D9BB, danger #FFB9B9
```

Light `lightColors`:

```
backgroundTop #E6EEFA, backgroundMiddle #F7F9FD, backgroundBottom #EEF3FA, backgroundBase #F3F6FB
glassTop #FFFFFFED, glassBottom #F7FAFFE6, surface #FFFFFF, soft #E8F0FB, border #C7D7EBB3
text #173353, muted #506781, accent #2F6DCA, accentEnd #2053A0, link #205AB0
shadow #23486D05, success #12724E, danger #B42336
decorativeArtwork false
```

CSS variables in `assets/ui/phone-tokens.css` — CONFIRMED:

```
--phone-background-top:#1C4B91 ... --phone-background-base:#071B36
--phone-glass-top:#648BBD25 ... --phone-surface:#173657
--phone-header-height:80px, --phone-logo-width:96px, --phone-logo-height:44px
--phone-back-icon:18px, --phone-touch-target:44px
--phone-screen-padding:16px, --phone-card-padding:16px, --phone-card-radius:18px
--phone-input-radius:12px, --phone-gap:12px
--phone-title-size:22px, --phone-section-size:18px, --phone-label-size:14px
--phone-body-size:14px, --phone-caption-size:12px, --phone-reading-size:24px
--phone-compact-tile-min-height:128px
:root[data-app-appearance=light]{ --phone-background-top:#E6EEFA ... }
:root{--phone-wordmark-mask:url("data:image/webp;base64,UklGRkDeAQBXRU...")} (122 KB wordmark inlined)
```

Derived alias layer in `assets/ui/phone-system.css:4,6-12` — CONFIRMED:

```
--morph-font:MorphSans,Arial,sans-serif; --m-touch:44px
--m-r-sm:12px; --m-r-md:18px; --m-r-lg:18px; --m-r-xl:18px
--phone-card-fill:linear-gradient(145deg,var(--phone-glass-top),var(--phone-glass-bottom))
--m-bg:var(--phone-background-base); --m-bg2:var(--phone-surface)
--m-text:var(--phone-text); --m-accent:var(--phone-link)
--m-grad:linear-gradient(135deg,var(--phone-accent),var(--phone-accent-end))
background:radial-gradient(ellipse 340px 300px at 100% 0,var(--phone-background-top),transparent 100%),linear-gradient(160deg,var(--phone-background-middle),var(--phone-background-bottom))
```

Typography canonical — CONFIRMED:

```
@font-face MorphSans 400 (morph-sans-400.ttf), 500-900 (morph-sans-600.ttf)
body { font:400 var(--phone-body-size)/1.6 var(--morph-font) }
h1 { font:600 var(--phone-title-size)/1.3 var(--morph-font) }
h2 { font:600 var(--phone-section-size)/1.4 var(--morph-font) }
.phone-title 22px/1.3/600, .phone-body 14px/1.65/400 muted, .phone-caption 12px/1.5, .phone-reading 24px/1.95
```

Spacing/shadow canonical — CONFIRMED:

```
--phone-screen-padding:16px; --phone-card-padding:16px; --phone-gap:12px; --phone-touch-target:44px; --phone-header-height:80px
.phone-card { border-radius:var(--phone-card-radius)!important; box-shadow:0 7px 20px var(--phone-shadow) }
.bottom-nav { border-radius:24px 24px 0 0!important; box-shadow:0 -4px 18px var(--phone-shadow); padding:7px 5px calc(7px + env(safe-area-inset-bottom,0px)) }
.spinner { width:32px; height:32px; border:3px solid var(--phone-border); border-top-color:var(--phone-link); border-radius:50% }
```

### 2.2 Parallel / override palettes (CONFIRMED — the core inconsistency)

`mobile-app/phone-iptv.js:24-27` injects runtime vars **not** from `design-system.json`:

```js
dark:  {bg:'#2c3b57',surface:'#293b56',text:'#f5f8ff',muted:'#b9cbe6',accent:'#2463eb',border:'#7890af',glow:'#7cd6ff',shadow:'#101b2e'}
light: {bg:'#f4f7fb',surface:'#ffffff',text:'#0b203d',muted:'#22334d',accent:'#174fc9',border:'#dce5f1',glow:'#2463eb',shadow:'#193352'}
'--media-bg':roles.bg,'--iptv-text':roles.text,'--iptv-accent':roles.accent,'--iptv-border':roles.border,'--iptv-input':'#ffffff','--iptv-overlay':'rgba(25,51,82,.52)'
```

`mobile-app/phone-network.css:3-4,99-104` defines competing `--ui-*` system:

```
--ui-bg:#2c3b57 --ui-text:#f5f8ff --ui-text-muted:#d9e6f8 --ui-card-bg:#293b56 --ui-card-border:#7287a566 --ui-accent:#7cd6ff --ui-button-gradient:#2463eb
[light] --ui-bg:#f4f7fb --ui-text:#193352 --ui-card-bg:#fff --ui-accent:#174fc9
```

`mobile-app/theme_daylight.py:19-44` auto-derivation + hardcoded fixups (`HOST_FIXES`, `PHONE_FIXES`, `PHONE_READABILITY_FIXES`, `PH_FOOTER_TOOLS_FIXES`):

```
text #ffffff / #174fc9 blue, #7040bd purple, #a3264b red, #08749a teal, #193352 / #4e6381
edge #2463eb / #dce5f1, shadow rgba(25,51,82,.07), surfaces #ffffff #edf3ff #f0eafa #fff0f3 #f4f7fb
--phone-subheading:#174fc2 light / #9bcaff dark; --phone-support:#4c6280/#c4d5ec
--phone-nav-bg:#ffffff/#172a43; --phone-row-bg:#edf3ff/#223955
--paper:#f4f7fb; --ink:#193352; --muted:#4e6381; --line:#dce5f1; --purple:#7040bd; --m-grad:#2463eb
```

### 2.3 Components — how styled, inconsistencies (CONFIRMED with quotes)

**Buttons:**

- Canonical `phone-system.css:17`: `min-height:var(--phone-touch-target);padding:10px 14px;border:1px solid var(--phone-border);border-radius:var(--phone-input-radius);background:var(--phone-card-fill)`
- Primary: `background:var(--m-grad)!important;color:#fff;border-color:var(--phone-accent)`
- IPTV overrides in `phone-iptv.css` (457 KB file): dozens of per-context sizes, e.g. `.ph-source button{min-height:44px;border-radius:12px;font:600 12px/1.6 Tahoma,Arial}`, `#settings-panel button{min-height:48px;border-radius:13px;font:700 14px/1.6 Tahoma,Arial}`, `.heading .search button{min-height:36px;border-radius:12px}`, `button:focus-visible{outline:2px solid #2463eb}`. Touch targets vary **30/32/34/36/38/40/44/46/48/52/54/60px** on the same surface.

**Cards:**

- Canonical: `.phone-card,.phone-hero` shared glass + `border-radius:18px;box-shadow:0 7px 20px`
- IPTV `phone-iptv.css:187,307,340`: `.ph-home-grid button{border-radius:20px}`, `.iptv-source-card{border-radius:19px}`, `.iptv-settings-nav{border-radius:18px;box-shadow:0 3px 12px #19335204}`, `#items .tile{border-radius:17px;box-shadow:0 4px 14px #19335205}`, `#iptv-first-source section{border-radius:26px;box-shadow:0 12px 40px #1933520c}`, `.tv-episode{border-radius:10px}`. Same hierarchy uses **10/11/12/13/14/17/18/19/20/26px**.

**Bottom nav / tabs:**

- Canonical `phone-system.css:53-57`: `position:fixed;inset:auto 0 0;background:var(--phone-card-fill);backdrop-filter:blur(24px);border-radius:24px 24px 0 0;.m30-nav-ic{border-radius:50%}`
- IPTV moves shared TV `nav` into `body` as `.phone-bottom-nav` via `phone-iptv.js:102` (`nav.classList.add('phone-bottom-nav');d.body.appendChild(nav)`) and restyles: `display:grid;grid-template-columns:repeat(5,minmax(0,1fr));button{min-height:40px;border-radius:12px}` + daylight variants `background:#e8efff;color:#174fc9`. Two nav models coexist.

**Headers:**

- Token `headerHeight:80` vs IPTV `phone-iptv.css:95-96,218`: `height:84px;min-height:84px;flex-basis:84px;border-radius:18px`, then `height:148px` (`:218`), `height:122px` mobile breakpoint, `height:198px` search-open, plus `theme_daylight.py:PH_FOOTER_TOOLS_FIXES` forces `60px/106px`. Brand sizes conflict: `130px/140px/120px/138px` widths, `36px/38px/42px/55px/76px` heights vs token `logoWidth:96 logoHeight:44`.
- `phone-iptv.css:6`: `#morph-header{background:transparent!important}` vs later `background:#273953a8` navy mood (`:447,482`).

**Modals/dialogs:**

- `#settings-panel{position:fixed;inset:0;z-index:22000}`, `.settings-dialog{max-height:100dvh;border-radius:0}` vs `.account-delete-dialog{background:#fff;border-radius:18px}` light fix + `box-shadow:none`.
- `phone-updates.js:10-12` inline: `box.style.cssText='...background:var(--ui-control-bg,var(--media-card,#070e1dc))...'` and `card.style.cssText='...border:1px solid #3fcfff;font:18px Arial...'` — Arial + cyan border not in tokens.

**Icons:**

- Inline SVG strings in `phone-iptv.js:17,60,70,77,92,104,125` (`stroke-width:1.8`, `1.7`, `2`, viewBox 24) + `phone-section-icon{width:46px;height:46px;border-radius:14px}` with `svg{width:25px;height:25px}` vs settings tabs `svg{width:21px;height:21px}` vs header `svg{width:16px/20px}`. No shared icon size token (`backIcon:18` unused for these).

### 2.4 Asset inventory — mobile-relevant (CONFIRMED)

Per `AGENTS.md` installed-product rules:

- `mobile-app/assets/ui/morph-wordmark.webp` (122,440 bytes) — used in `index.html: <img class="brand-wordmark" src="morph-wordmark.webp" alt="Morph TV">` and as `--phone-wordmark-mask` base64 in `phone-tokens.css:57`.
- `tv-project/app/assets/morph-wordmark.webp` — master (synced by `phone_design_system.py:19`).
- `tv-project/app/assets/morph-iptv-wordmark.webp` + `.png`, `morph-launcher-wordmark.webp` + `.png` — TV/standalone IPTV headers, **not** phone per `AGENTS.md`, but `phone-iptv.js:60,104` injects conflicting marks:
  - `:60` `brand.innerHTML='<span class="phone-logo-wrap"><img src="morph-iptv-wordmark.webp" alt="Morph IPTV">'` (explicit IPTV identity inside phone player)
  - `:104` `phoneLogo.src='../ui/morph-wordmark.webp'; phoneLogo.alt='Morph TV'` (overwrites to phone mark)
- `tv-project/app/assets/logo.webp` — phone installed icon master (preserve per `AGENTS.md`); `morph-logo-hq.png` (511 KB in `assets/ui/`) excluded from phone bundle by `build.py` ignore (`*.jpg,tvmorph.png,morph-logo-hq.png`).
- `mobile-app/assets/ui/tvmorph.webp` (88,912 bytes) + `tvmorph.png` (270 KB) — staged to APK but `tvmorph.png/morph-logo-hq.png` filtered; `tvmorph.webp` kept as fallback (`iptv_shared.tv_fallback_bytes`).
- `tv-project/app/assets/morph-header-symbol.webp`, `morph-tv-icon.webp/.png`, `morph-bridge-icon.webp/.png`, `morph-iptv-icon.webp/.png`, `morph-launcher-icon.webp/.png` — platform install icons, not in mobile WebView (verified absent from `index.html`/`phone-*.js`).
- `mobile-app/res/drawable-nodpi/tvmorph.webp` + `tvmorph_banner.webp` — Android launcher assets. `mobile-app/app-icon.png` — staged as `app-icon.png` in APK (`build.py`).
- `mobile-app/assets/ui/bridge-icon.webp`, `studio-app-icon.webp` — bridge/studio chrome, not phone-IPTV header.
- `mobile-app/assets/ui/iptv-home-tv.png`, `iptv-home-movies.png`, `iptv-home-series.png`, `iptv-home-multiview-v1.png` (1.1–1.7 MB each) — injected as `<img class="ph-section-art">` in `phone-iptv.js:14`; `phone-device-premium.png`, `remote-device-premium.png`, `iptv-device-phone.png`, `iptv-premium-devices.png`, `connect-tv-premium.png` — network/device art.

---

## 3. UI/UX Problems — CONFIRMED findings

> Each item below was verified by direct read. Fixes are RECOMMENDATIONS in §6–§7.

### P1. Three competing design-token systems (highest visual cost)

- Canonical `--phone-*` + `--m-*` (tokens + system) vs IPTV runtime `--media-*/--iptv-*` (`phone-iptv.js:24-27`) vs `--ui-*` (`phone-network.css:3-4`) vs inline `theme_daylight.py` fixups.
- Result: same "card", "accent", "background" renders in 3–4 different blues/navies depending on which screen injected it. Dark navy `#273953a8` / `#2c3b57` / `#202940` / `#071B36` all coexist as "background".
- Evidence: `phone-iptv.css:4` (`--media-bg:#202940;--iptv-text:#f7f9ff;--iptv-muted:#d3dbea;--iptv-input:#273149`), `phone-iptv.css:447-553` navy mood block (`background:#273953a8;color:#f5f8ff;border:#7287a566` repeated ~60×, plus `#19283f`, `#2463eb`, `#a9d9ff`, `#19335206/33/04`), `phone-updates.js:10-12` (`#070e1dc`, `#0b1c32`, `#3fcfff`), `phone-network.css:12-18` fallbacks (`var(--ui-text,#f7f9ff)`, `var(--ui-bg,#080e1d)`, `var(--card-border,#65809a)`, `#ffffff`, `#dce5f1`, `#193352`).

### P2. Typography fragmentation — Tahoma vs MorphSans vs Arial

- Canonical `MorphSans,Arial` (`phone-system.css:4`) but IPTV uses `Tahoma,Arial` everywhere: `font:700 26px/1.5 Tahoma,Arial`, `font:600 11px/1.6 Arial`, `font:14px/1.8 Tahoma,Arial`, `font:12px/1.8 Tahoma,Arial` (`phone-iptv.css:178-195,264-267,277-328`). `phone-updates.js:12`: `font:18px Arial`. IPTV never uses `var(--morph-font)`.
- Sizes: **11/12/13/14/15/16/17/18/20/21/22/23/24/25/26/27/28px** alongside token `22/18/14/14/12/24`. No type scale. Line-heights `1.3/1.4/1.5/1.6/1.8/1.95` mixed arbitrarily.
- User impact: TV-player screens feel like a different app (denser, Windows-era Tahoma) vs shell screens (MorphSans). RTL Arabic inherits the same fragmentation (no dedicated Arabic metrics).

### P3. Geometry chaos — radius, touch targets, header heights, z-index

- Three radius systems: token `12px` (`--phone-input-radius`) + alias `--m-r-sm:12px --m-r-md:18px` vs hardcoded **10/11/12/13/14/17/18/19/20/26px** on one hierarchy.
- Touch targets **30–60px** on same surface vs token `44px`. Some IPTV pager/search buttons `32–36px` fail comfortable thumb reach.
- Headers: token `80px` vs IPTV `84px` / `148px` / `122px` / `198px` + daylight forces `60px/106px`. Brand logo `96×44` token vs `130–140px` wide / `36–76px` tall hardcodes.
- `z-index:101,110,22000,2147483200,2000` — settings panel at `22000`, shade at `100/101`. Fragile stacking; future bottom-sheet/floating player will collide.
- Shadows: token `0 7px 20px var(--phone-shadow)` vs `0 3px 12px #19335204`, `0 4px 14px #19335205`, `0 12px 40px #1933520c`, `0 12px 48px #0009`.

### P4. CSS bloat and dead/duplicate skins

- `phone-iptv.css` **457,066 bytes** (~600+ rules, 500+ `!important`), `@import url("../ui/phone-tokens.css")` line 1 then overrides almost everything. `approved-mobile.css` **366,937 bytes**, `phone-layout.css` **189,549 bytes**, `phone-tokens.css` **164,913 bytes** (mostly base64 mask), `daylight-mobile.css` **88 KB**, `navy-mobile.css` **68 KB**.
- `DESIGN_SYSTEM.md:21-24` says "Legacy CSS is no longer loaded… appearance comes only from new library. Do not edit generated token files." Yet IPTV + network + daylight + readability + premium + approved skins all still ship. `theme_daylight.py:99-103` regenerates by string-splitting on `/* Daylight appearance overlay */` — brittle codegen, not hand-edit.
- `phone_layout.py:9-18` allowlist strips `color/font/border/radius/shadow` (structural-only intent) — but IPTV files reintroduce them. `DESIGN_SYSTEM` contract is violated by the two largest phone stylesheets.
- INFERRED dead refs (needs file-existence check in staged APK): `contact.js`, `theme-packs-manifest.js/theme-packs.js/theme-preview.js` noted as missing-on-disk in prior full audit; `index.html` still `<script>`s them.

### P5. Navigation and information-architecture issues

- Bottom nav visible **only** on `page-connect` (`morph30.js paintNav`: `navigation.hidden = activePage!=='page-connect'`). On Design/Control/Play the user loses primary wayfinding and must use header-back `#m30-page-back` or in-page `[data-page]` shortcuts. First-time users perceive 4 separate apps.
- Ghost `page-cast` has no tab; reachable only via Studio shortcuts + `cast-back[data-page=studio]`. DLNA panel (`#dlna-panel`) is long, bilingual `data-dlna-ar/en` inline, mixes Browse / Send file / Send URL / transport / volume in one scroll — no progressive disclosure.
- `page-apps` redirects to `page-remote` (`morph30.js:99` `if(name==='apps')name='remote'`) but `index.html` still contains full `page-apps` markup (`#refresh-apps`, `#app-list`, `#save-pins`). Dead-or-duplicate path confuses QA and deep-links.
- `page-studio` (Design) is the heaviest page: banner + shortcuts + family panel + live preview (`#preview-clock/title/subtitle/club/art-frame`) + club details + theme library (12 collection filters) + font-size + personal-touch offsets + art picker + about + `#apply` + connect CTA. No sections collapse by default except `<details>`; scroll depth is extreme on a 6" phone.
- `page-iptv` mixes three jobs: (a) open phone player, (b) personal source form (`#iptv-type/server/port/mac/user/password/name/format/live/vod/series`), (c) TV catalog browser (`#iptv-tv-controls` with tabs/category/search/pager). Form `details#iptv-form-details[open]` defaults open, pushing destinations below fold.
- Search/pager/category drawer: `main>aside` becomes fixed drawer `min(420px,82vw)` with `#phone-category-shade`, sticky filter `#phone-category-filter`, plus separate `#iptv-category` + `#iptv-search` + `#iptv-prev/next`. Two category systems (phone drawer + TV controls) overlap conceptually.

### P6. Hierarchy, spacing, wasted space

- `main{padding:8px 12px;grid-template-columns:165px minmax(0,1fr)}` then overridden to `minmax(0,1fr)` for phones — leftover 2-column TV grid leaks into phone CSS.
- Watch hero `#dashboard .watch-hero` has 5 competing size blocks (`height:145px`, `flex:1 1 140px`, `min-height:110px`, `max-height:43vh`, `padding:18px` vs `12px 18px`). Art `position` flips with `top:8px;bottom:8px;right:12px;height:calc(100% - 16px)` + RTL overrides — fragile on notch/dynamic island.
- `.portal-grid button{flex:0 1 23%;width:23%}` 4-across on 360px wide phone = ~80px targets with 15px labels — cramped; `.portal-tools button{height:32px;font-size:12px}` below thumb minimum.
- Empty states (`#apps-empty`, `#collection-empty`, `#devices:empty`) are plain text + emoji (`🛰️`); no illustration, no CTA. `#connection-state[data-status]` color coding exists but copy is verbose.
- Footer `Developed by Karim Aboushousha & Hassan Shehata + Preview 0.8.68` on every page consumes vertical space and looks like a debug build stamp, not a production credit.

### P7. Accessibility, RTL, i18n

- `supportsRtl=true` + `dir=auto` on inputs, but many hard `left:10px` / `right:12px` rules with manual `html[dir=rtl]` overrides — easy to miss new components.
- `locale.js` 421 KB + `locale-data.json` 399 KB; `STR[ar/en/fr/zh/ja]` in `morph30.js` duplicates part of it. Language switch `#app-language` relocated into gear sheet — discoverability low.
- Focus: only `button:focus-visible{outline:2px solid #2463eb}` in IPTV; shell has no visible focus ring spec. Contrast: `#B9CBE6` on `#293b56`, `#D1DEF0` on glass, `#9bcaff` subheading — INFERRED risk, needs WCAG check.
- `fontSizeAr/En` panels exist but no fluid `clamp()` scale; small Arabic diacritics at 11–12px Tahoma degrade legibility.

### P8. Brand and imagery inconsistency

- Two wordmarks fight at runtime: `morph-wordmark.webp` (Morph TV phone) vs `morph-iptv-wordmark.webp` (Morph IPTV) — `phone-iptv.js:60` injects IPTV mark, `:104` overwrites to phone mark. Header identity flickers by entry path.
- `AGENTS.md` (2026-11-04) mandates transparent `morph-header-symbol.webp` + live text `orph Launcher / orph IPTV / orph Bridge` at upper left — phone shell still uses image-only `brand-wordmark`, no live-text lockup.
- Imagery: 1–1.8 MB PNGs (`iptv-home-tv/movies/series/multiview`, `phone-device-premium`, `remote-device-premium`, `connect-tv-premium`) injected as `<img class="ph-section-art">` with no `srcset`/`sizes`/WebP. Slow first paint on mid-range phones; no skeleton shimmer spec.
- `tvmorph.webp` vs `tvmorph.png` vs `morph-logo-hq.png` vs `app-icon.png` vs `tvmorph_banner.webp` — 5 logo binaries; bundle filter excludes 2 but source tree retains all.

---

## 4. Technical Architecture — CONFIRMED

### 4.1 WebView + native bridge

- Single `WebView` in `MainActivity.onCreate:21` loads `file:///android_asset/ui/index.html`. Hardened flags (CONFIRMED): `AllowFileAccess=false`, `AllowContentAccess=false`, `AllowFileAccessFromFileURLs=false`, `AllowUniversalAccessFromFileURLs=false`, `MixedContent NEVER`, `shouldOverrideUrlLoading→true`, `onReceivedSslError→cancel`. `setWebContentsDebuggingEnabled` only if debuggable. `singleTask` + `isTaskRoot` guard. `onNewIntent openWorship` → `MorphWorship.openPrayer()`. Text zoom follows `fontScale`. `ForceDark OFF`, `AlgorithmicDarkening OFF` (API 29/33).
- **Bridge `ClearNative`** (`web.addJavascriptInterface(new Bridge(),"ClearNative")`) — CONFIRMED method list:
  - `navigationPage(page)`, `openFaith(dest)`, `consumeWorshipOpen()`, `openLocalNetwork()`, `textSettings(json)`, `openContact()`, `openDownloadCenter(system)`, `openSupport()`, `openPayPalSupport()`, `openInstaPaySupport()`, `openPhoneUpdate()`, `openTVDownload()`, `openIptvDownload()`, `setAppearance(mode)`, `settingsJson()`, `setLanguage(lang)`, `request(id,action,payload)`, `plusIdentityJson/savePlusIdentity/clearPlusIdentity`, `copySetupCode(code=="6443144")`, `saveDraft(json)`
  - `request()` tries `PhoneUiLaunch.dispatch` (bridge/remote/matches, never queues behind TV executor), then `samsungPickWgt/dlnaPickFile/openCastSettings/pickImage` on UI thread, else `worker/faithWorker` → `run(action,payload)` → `result(id,ok,data)` via `window.nativeResult`, `status(text)` via `window.nativeProgress`.
- **`run()` actions** (CONFIRMED `MainActivity.java:65-215` grep): `faithPrayer/faithVoicesDownload`, `phoneUpdateInfo`, `pairLG/forgetLG`, `LgActions.*`, `dlnaDiscover/Connect/SendFile/Send/Control/Caps/Position/Seek/Volume/Mute`, `installThemePack`, `compatibility`, `disableTVHome/prepareTVHome`, `installProduct(iptv)`, `installAndroidAdb`, `info`, `installLG/installFireTV`, `maintenance`, `scan`, `tvSettings`, `phoneIptvAccounts/RemoveAccount/AccountInfo/Summary/Connect/Open`, `iptvSavedProfile`, `iptv* (Connect/Accounts/AccountInfo/Refresh/Open/List/Categories/Play/Clear/Summary/RemoveAccount)` proxied to Samsung Inspector `ClearTV.*` vs AndroidTV `/iptv/*` with `AndroidTv.token()`, `parentalStatus/Action`, `familyProfiles(list/create/select)`, `connectionStatus`, `remoteConnect/Key/Text`, `updateAndroid/shareAndroid`, `connect`, `pairAndroid`, `apply/apps/pins/open/install` (Android vs Samsung branches), `samsungWgtInstall`.
- **JS side** `app.js:6-10`: `MorphNative.call(action,payload)` → `ClearNative.request` with timeouts (600 s install/download, 90 s apply, 25 s connectionStatus, 60 s default), `window.nativeResult/nativeProgress`, `MorphNative {call,operation,ready,platform}`.
- **`MatchesNative`** (MatchesActivity only): `back()`, `request(id,force)` → `window.matchResult`.
- **`IptvNative`/`NetworkNative`** in `phone-iptv.js`/`phone-network.js`: `settingsJson()`, `exit()`, `IptvTvBridge.homeData()`, `IptvUI.dismissTransient/phoneLoadMore/settings()`, `IptvSettingsPages.open()` — INFERRED shared `android-tv/iptv/` contract, CONFIRMED call sites.

### 4.2 CSS/JS loading and codegen pipeline

- CSS: tokens → layout (structural only) → system (chrome). JS: device + remote controllers **before** `app.js` (`ARCHITECTURE.md:20` mandate), then feature scripts, then `morph30.js` shell last-ish, then `phone-system.js`.
- Codegen (CONFIRMED):
  - `phone_design_system.py:sync()` reads `design-system.json` → writes `assets/ui/phone-tokens.css` + `PhoneDesignTokens.java` (+ Kotlin/Dart mirrors).
  - `phone_layout.py:compile_layout()` filters `design-layout-sources.json` (37 sources) to structural-only `phone-layout.css` (layout props allowlist, appearance stripped). `phone_layout.py:77 prune_legacy_css()` keeps only `phone-tokens/layout/system` in staged builds.
  - `theme_daylight.py:build()` derives `assets/ui/daylight-mobile.css` + `phone-iptv.css /* Daylight overlay */` + `phone-network.css` from `navy-mobile.css/glass-mobile.css` via `tinycss2` + string fixups. CONFIRMED generator, not hand-edit — editing outputs directly will be overwritten.
  - `build.py` stages `android-tv.apk` (receiver `local.tvmorph.tv`), `lg-preview.ipk` (hash-pinned via `webos-app/validation.json` → `LgInstallProtocol.java`), `jsch-0.26.jar`, `tv-project/app/network/` + `ui/tokens.css`, brand assets, `phone-update-channel.json`, asserts package identities.
  - `installer_payloads.py`, `samsung_compat.py`, `build_integrated.py` — payload/compat/build helpers (listed, not deep-audited).

### 4.3 Shared components vs page-specific forks

- Intended: `phone-card/hero/row/title/section-title/body/caption/tabs` (`DESIGN_SYSTEM.md:17-18`). Actual: IPTV + network + daylight + premium + approved + readability + cinematic + navy + glass skins redeclare them.
- IPTV canonical frontend is `android-tv/iptv/` (per `AGENTS.md` + `ARCHITECTURE.md:15`); `phone-iptv.js/css` are **adapters only** — "Stage the shared frontend; do not fork catalog or player behavior."
- Samsung transport/playback shared via `mobile-app/samsung-media.js`; LG uses same catalog adapter with `webos-app/player.js` (per `AGENTS.md`). Phone presentation/touch in `phone-iptv.css/js` must preserve TV remote navigation when changed.

---

## 5. Functional Dependencies — Must Remain Untouched

> Redesign may restyle DOM/CSS and reorganize presentation, but MUST NOT change these contracts without a migration plan + regression run.

### 5.1 IPTV / playback (highest risk)

- `phoneIptv*` (local Vault `iptv-profile` encrypted, `PhoneIptvActivity.accounts/summary/saveProfile/prepare/clearSaved`) + `iptv*` proxy (Samsung Inspector `ClearTV.Remote/applyRemoteConfig/Catalog` vs AndroidTV `/iptv/*` with `AndroidTv.token()`).
- `phone-iptv.js/css` are adapters — do not fork catalog/player (`ARCHITECTURE.md:15`). `samsung-media.js`: `profile/summary/connect/catalog/request/networkRequest/saveProfile/accounts/accountInfo/removeAccount`, history/resume, `M3uSource`, Plus `enforceAccountLimit()` (100-account cap, Plus gate for 3rd account).
- `samsung-media-bridge.js:9` `restorePlaybackFocus()` for `morph-player` + `prayer-adhan-overlay`.
- Secrets never in `localStorage`/logs (prior audit §1). Keep `Vault` + Keystore for credentials/tokens/salts.
- **Do not touch:** `android-tv/iptv/` catalog/player, `samsung-media.js` provider (`player_api.php`, M3U/Stalker), `PhoneIptvActivity`/`PlayerActivity`/`MultiViewActivity` intents, `IptvNative`/`IptvUI`/`IptvSettingsPages` method names.

### 5.2 Remote control

- `remoteConnect (internal/native)` → `SamsungRemote` (port 8001 WS) vs Inspector `ClearTV.Remote` vs AndroidTV `/remote/key|text` vs `LgControl`.
- `remoteKey/Text` with `data-remote-key`, capability gating `data-native-only/volume/library-only/playback`, Arabic UTF-8/base64, focused-field replace, no passwords, long-press 650 ms → `FAVORITE` on Android.
- `resetMorphRemote/disconnect` on device/IP switch.
- **Do not touch:** `remote-controller.js` command eligibility, `MainActivity remoteKey/Text` actions, `data-remote-key` values, long-press timing contract (covered by `mobile-app/tests/remote-controller.cjs` + `controllers-integration.cjs`).

### 5.3 TV connectivity

- Samsung: `Network.discover/probe`, `SdbClient`, `Inspector(inspectorAt/debugPort)`, `SamsungWidget/SamsungWgtInstaller/WidgetSigner/Certificates/SamsungLogin`, `config()` theme validation, `apply/apps/pins/open/install`.
- LG: discovery-only + `LgDiscovery/LgControl/LgInstaller/LgInstallProtocol/LgSsh/LgActions/LgInspectorTarget`, `pairLG/forgetLG`, Developer Mode + Key Server passphrase, no Home replace.
- AndroidTV/FireTV: `AndroidDiscovery/AndroidTv.probe/pair/request/token`, `/info/status/config/state/pins/update/theme-packs/maintenance/parental/profiles/settings`, `FireTvInstaller.probe/install/disableHome/prepareHome` (ADB), `shareAndroid` foreground `DownloadService` 10-min + HEAD/range, `ReceiverApk/InstallPackage`.
- DLNA: `DlnaCast.connect/send/control/caps/position/seek/volume/mute`, `DlnaLocalFile/DlnaMediaServer` (local HTTP, trusted LAN, Stop closes server), `dlna-cast.js` scan→connect→caps→send.
- VIDAA/Roku/other: explicit unsupported — `declaredSystem()` manual `vidaa`, `device-controller.js` disables `#smart-install`, `connectionStatus.unsupported`.
- **Do not touch:** discovery/scan/pair/install action names, `MainActivity.run()` cases, `LgInstallProtocol` hash pins, `UpdateProvider` authority.

### 5.4 Casting

- `CastSettings.open()` via `openCastSettings` (system mirroring guide in `cast-screen.js`, not in-app mirroring) + DLNA Send file/URL (video/audio/image via `ACTION_OPEN_DOCUMENT` 32/33). Keep `openLocalNetwork()` (`NetworkActivity`) distinct.
- **Do not touch:** `cast-screen.js` guide flow, `DlnaCast` control/caps contracts.

### 5.5 Backend / platform integrations

- `PhoneUpdates.info()` → `https://morph-tv.com/catalog.json` or `/test-releases/mobile-latest.json?t=` + `validDownload()` (https-only, morph-tv.com, `/download/phone` or `/test-releases/*.apk`, sha256+bytes checks) → `openPhoneUpdate()` external browser or `AppUpdates.check()`.
- `Network.get/phoneIP/local()`, `Vault` + Keystore, `ThemePackIds.require()` + `installThemePack` + `MorphPlus` gating (`plus.js/plus-phone.js`, `plusIdentityJson`), `FaithPrayer/FaithVoicePacks/FaithAdhanService` (`faithPrayer` actions, `openFaith/consumeWorshipOpen`), `MatchSchedule/MatchesActivity` (`MatchesNative`), support intents (`openSupport/openPayPalSupport/openInstaPaySupport/openContact/openDownloadCenter/openTVDownload/openIptvDownload` + `support.js/welcome-support.js/.morph-support`), `copySetupCode("6443144")`, `CastSettings`, `ImageAsset` picker (PNG alpha preserved), `DeviceCompatibility.inspect()`.
- Publication is on hold per `output/release-hold.json` + `AGENTS.md` — do not upload builds or change landing during redesign.

---

## 6. Redesign Opportunities — RECOMMENDATIONS

> Proposals only. No code changed. Each maps to a CONFIRMED problem in §3.

### O1. One token system, zero hardcodes (fixes P1–P3)

- Freeze `design-system.json` as the **only** source. Extend it (do not bypass it) with: `radiusSm/Md/Lg` (12/18/24), `touchMin` (44), `iconSm/Md/Lg` (16/20/24), `headerH` (64–72, down from 80), `shadowSm/Md/Lg`, `fontScale` + `arabicTracking`.
- Delete competing vars: map `#2463eb/#174fc9 → accent/accentEnd`, `#193352/#0b203d → light text`, `#f5f8ff/#f7f9ff → dark text`, `#273953a8/#293b56/#2c3b57 → surface`, `#7287a566/#7890af → border`, `#7cd6ff/#a9d9ff/#B7DAFF → link`, `#070e1dc/#080e1d → backgroundBase` into `--phone-*`/`--m-*`. Remove `--media-*`, `--iptv-*`, `--ui-*` after migration.
- Replace `Tahoma` with `var(--morph-font)` everywhere; adopt a 5-step scale (`13/14/16/20/24` + `12` caption only) with `clamp()` for hero; dedicated Arabic line-height +0.1.
- **Payoff:** single dark/light switch, no more "which blue is this screen", daylight codegen shrinks to variable swap.

### O2. Premium-minimal shell (fixes P5–P6)

- Persistent 4-tab bottom nav (Home / Design / Control / Play) with center-weighted touch targets (min 56px wide, 44px tall), active pill + `aria-current`, haptic-safe. Never hide nav except fullscreen player/dialog.
- Slim header (64px): leading back (when stack depth >0) + `morph-header-symbol` + live-text lockup (`Morph TV` host; `Morph IPTV` only inside `PhoneIptvActivity` — never both), trailing gear + connection dot. Remove debug footer stamp; move credits to Settings → About.
- Cards: one radius (18), one shadow scale, `16px` screen / `16px` card padding, `12px` gap. Hero sparingly (Home status + Design preview only). Skeleton shimmer for art; WebP + `srcset` for the 1–2 MB PNGs.
- Progressive disclosure: Studio theme library behind search + horizontal filter chips (not 12 stacked buttons); font-size/personal-touch/art-picker collapsed into "Advanced"; IPTV form collapsed by default with "Add source" CTA; DLNA steps as 3-step wizard (Find → Choose → Send) with transport collapsed until `caps.ok`.

### O3. Information-architecture reset (fixes P5)

- **Home (Connect):** status hero → Scan → devices → manual IP (collapsible) → install card → guide (3 dots max) → troubleshoot (collapsed). Remove `#install[hidden]` legacy node, remove `vidaa` dead copy or label clearly unsupported (already done in logic — reflect in UI).
- **Design (Studio):** preview → themes → customize (collapsed) → family (collapsed) → apply. Move shortcuts (Cast/Apps/Remote) to Control/Home; Design edits TV theme only.
- **Control:** segmented `Remote | Apps | Cast` with shared device header (`#remote-device` once). Merge `#page-apps` into segment panel; delete redirect hack after deep-link audit.
- **Play (IPTV):** destination cards (Phone / TV) → source cards → collapsible form → TV browser (tabs/search/pager) lazily mounted only when `#iptv-tv-controls[open]`. One category system: reuse phone drawer component, drop the second `#iptv-category` select or bind both to same store.
- **Worship/Matches/Network:** keep as separate feature modules with their own CSS scope; expose via gear overflow + deep link, not extra tabs.

### O4. Component library (fixes P2–P4, P7)

New `phone-system` v2 (presentation only, no bridge changes):

- `Btn/Primary|Secondary|Ghost|Danger` (44px min, 12px radius, one focus ring), `Card/Hero`, `Row/ListItem` (56px min), `Tabs/Segmented`, `Sheet/BottomSheet` (replaces `z-index:22000` hacks with token `zSheet/zToast/zNav`), `EmptyState` (illustration + title + CTA), `StatusPill` (`idle/checking/connected/error/unsupported`), `SearchField`, `Drawer` (category filter), `Toast/Operation` (queue, not overlap).
- Icon set: single 24px grid, 1.8px stroke, `16/20/24` sizes via token; replace per-file inline SVGs.
- A11y: `44px` minimum, visible focus, `aria-current/selected/expanded`, `role=status` preserved, contrast-checked muted (`#506781` on `#F3F6FB` ok; `#B9CBE6` on `#293b56` must darken), `env(safe-area-inset-*)` everywhere, `prefers-reduced-motion` disables shimmer/parallax.

### O5. Performance and bundle hygiene (fixes P4, O2 imagery)

- Budget: `index.html` + critical CSS < 120 KB, each feature JS lazy-loaded on first `Morph30.show()` (IPTV browser, DLNA, worship, matches). Defer `locale.js` chunks by language; drop duplicate `STR` tables.
- Images: convert hero/device PNGs to WebP, add `loading=lazy` + `decoding=async`, cap staged art < 300 KB each; remove `morph-logo-hq.png`/`tvmorph.png` from source if bundle filter is the only guard.
- CSS: delete `approved-mobile.css` / `premium-mobile.css` / `mobile-cinematic.css` / `readability-mobile.css` overrides after v2 mapping (or scope them to a `legacy` flag for rollback). Keep `theme_daylight.py` as the only generator; forbid hand-edits to outputs (enforce via `prune_legacy_css` + CI grep for `#2463eb|Tahoma|!important` density).

---

## 7. Reconstruction Strategy — RECOMMENDATIONS

### 7.1 What can be redesigned independently (low coupling)

| Surface | Why independent | Guardrail |
|---|---|---|
| Shell chrome (header, bottom nav, gear sheet, onboarding, toast/operation) | Pure presentation in `morph30.js` + `morph30.css` + `phone-system.css`; bridge entry `navigationPage()` unchanged | Keep `PAGE_OF/NAV_OF/historyStack/back()` semantics + `ClearNative.navigationPage` call; keep `morph30page` event |
| Home/Connect copy + layout | IDs (`#scan/#devices/#tv-ip/#connect/...`) are stable; logic in `connect-flow.js`/`setup-options.js`/`device-controller.js` | Do not rename IDs or `MorphDeviceController.select` return shape; do not add another scanner |
| Studio/Design presentation | Preview + theme grid are DOM/CSS; `config()` validation stays native | Keep `config()` payload + `apply/apps/pins/open/install` actions; keep theme-pack IDs |
| Empty states, illustrations, footer/about, language/appearance rows | No bridge dependency | Keep `setLanguage/setAppearance` + `localStorage` keys (`tvmorph.appearance-choice.v1`, `tvmorph.onboarded30`, `morph.faith.enabled.v1`) |
| Worship/Matches styling | Separate files (`worship-phone.*`, `matches-phone.*`) + separate activity for matches | Keep `MorphWorship.enabled/openPrayer/back/closePrompt`, `MatchesNative.request/back`, `window.matchResult` |

### 7.2 What must be rebuilt as a unit (shared component)

- **Design-token + CSS pipeline:** `design-system.json` → `phone-tokens.css` → `PhoneDesignTokens.java/Kt/Dart` → `phone-layout.css` → `phone-system.css` → daylight generator. Rebuild together; otherwise dark/light drift returns. Validate with `output/phone-system-tests.log`, `output/phone-system-web-audit.json`, `output/phone-design-system-validation.json` + `node mobile-app/tests/controllers-integration.cjs`.
- **Control cluster (Remote + Apps + Cast/DLNA):** shared `#remote-device`, `remoteReady/Native/Busy`, `resetMorphRemote`, `CONTROL_SUB` segment mount. Splitting remote vs DLNA state causes "connected but buttons dead" bugs. Test with `node mobile-app/tests/remote-controller.cjs`.
- **Play cluster (IPTV destinations + form + TV browser):** `phoneIptv*` vs `iptv*` branching (local Vault vs Samsung Inspector vs AndroidTV token) must stay in one state machine. Restyle freely, but keep `IptvNative/IptvUI/IptvSettingsPages/IptvTvBridge` names and `data-iptv-kind` values.

### 7.3 Technical risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Renaming an ID/action breaks `ClearNative.request` / `run()` | Dead Scan/Pair/Install/Remote/IPTV on device | Freeze contract list (§5); add `grep` CI for `getElementById` IDs vs `MainActivity.run` cases; run `controllers-integration.cjs` before each milestone |
| Editing generated CSS (`phone-tokens.css`, `daylight-mobile.css`, `phone-iptv.css` overlay) directly | Overwritten by `phone_design_system.py` / `theme_daylight.py` | Edit sources only (`design-system.json`, `navy-mobile.css`/`glass-mobile.css`); re-run `python mobile-app/build.py --test-channel`; commit generator + output together |
| Forking `android-tv/iptv/` catalog/player into phone files | Divergence, double bug-fix, TV remote nav regression | Adapters only (`phone-iptv.js/css`); any catalog/player fix goes to `android-tv/iptv/` + `samsung-media.js` / `webos-app/player.js` parity check per `AGENTS.md` |
| `MainActivity.java` (57 KB dispatcher) + `integrated-remote` + `bridge-native` entanglement | Startup block, binder leak, lost background callbacks | Follow `ARCHITECTURE.md:26,32`: extract by behavior with regression checks; `PhoneUiLaunch.dispatch` stays non-blocking; never `awaitBinder` in startup; test Bridge open/draw on rotation + background |
| Bundle/asset weight (421 KB locale, 1–2 MB PNGs, 457 KB IPTV CSS) | Slow WebView first paint, OOM on low-end, Play review friction | Lazy-load features, WebP + `srcset`, locale chunking, CSS purge; measure `file:///android_asset` cold start on API 26 + API 33 |
| RTL/i18n regression (ar default, en/fr/zh/ja) | Mirrored drawer, truncated German-like French, broken IP `bdi` | Keep `bdi dir=ltr` for IPs/URLs/MACs, `dir=auto` inputs, `html[dir=rtl]` drawer test; verify `locale-data.json` keys, not `STR` duplicates |
| Back-stack divergence (native `onBackPressed` vs `Morph30.back()` vs `PhoneIptvNavigation.back`) | Double-back exits app or traps user in sheet | Single `window.handleBack` chain (§1.5 order); test: sheet → dialog → drawer → tab → Home → exit-double-press on each page |
| Update/install trust (`validDownload`, sha256, installer intents) | Sideload hijack, failed TV install with no feedback | Keep https-only + host allowlist + hash checks; keep `#operation` progress + `#toast` error copy; never auto-download without user gesture |
| Faith/adhan background (`FaithAdhanService`, exact alarms, `SCHEDULE_EXACT_ALARM`) | Missed prayer, battery kill, Android 12+ alarm denial | No redesign of scheduling math (`FaithPrayer*`); style notifications only; test `BOOT_COMPLETED` + timezone change |
| Publication hold | Accidental store/landing push | Check `output/release-hold.json` + latest user instruction before any upload or landing edit (per `AGENTS.md`); keep redesign on preview channel (`?m30onboard=1`, `TV-Morph-Preview.apk`) |

### 7.4 Suggested milestone order (presentation-first, zero behavior change)

1. **M0 Freeze:** snapshot current APK + `catalog.json`; list frozen IDs/actions (this §5); add ID/action grep CI.
2. **M1 Tokens:** extend `design-system.json` (radius/touch/icon/shadow/Arabic), regenerate all mirrors, delete `--media/--iptv/--ui` vars (mechanical map, no layout change).
3. **M2 Shell:** new header/nav/gear/sheet/empty/status components on Home + Design only; hide-behind `?m30onboard=1` flag for A/B.
4. **M3 Control:** Remote/Apps/Cast reskin as one cluster; keep all `remoteConnect/Key/Text` + DLNA caps flows; run `remote-controller.cjs`.
5. **M4 Play:** IPTV destinations/form/browser reskin; keep `phoneIptv*/iptv*` branching; verify local Vault + Samsung + AndroidTV paths + `samsung-media.js` parity.
6. **M5 Polish:** WebP/`srcset`, lazy-load, locale chunk, CSS purge, a11y/RTL pass, footer/about cleanup, preview-channel QA on API 26/30/33 + Samsung Tizen + LG webOS + AndroidTV/FireTV.

---

## 8. Summary

### Current state (CONFIRMED)

Morph TV Mobile is a **WebView-hosted phone studio** (`MainActivity` → `file:///android_asset/ui/index.html`, 110 web assets) plus **satellite native players** (`PhoneIptvActivity`/`PlayerActivity`/`MultiViewActivity`, `NetworkActivity`, `MatchesActivity`). Navigation is a 4-tab shell (`morph30.js`: Home/Design/Control/Play + ghost Cast + gated Worship) with history-stack back handling bridged to native (`ClearNative.navigationPage`, `window.handleBack`). A canonical token pipeline exists (`design-system.json` → `phone-tokens.css` + `PhoneDesignTokens.java/Kt/Dart` + structural `phone-layout.css` + `phone-system.css`) and a documented controller split (`device-controller.js` + `remote-controller.js` before `app.js`, IPTV adapters only, no catalog fork).

### Biggest problems (CONFIRMED)

1. **Three token systems + 457 KB IPTV override** — canonical `--phone-*` vs `--iptv/--media-*` vs `--ui-*` vs daylight fixups; same screen renders 3–4 blues; Tahoma vs MorphSans; 10–26px radii, 30–60px targets, 80–198px headers, `z-index` up to 22000.
2. **CSS/JS bloat and duplicate skins** — `phone-iptv.css` 457 KB, `approved-mobile.css` 367 KB, `locale.js` 421 KB, 1–2 MB PNGs, ~60 blocking scripts; `DESIGN_SYSTEM` "no legacy skins" contract violated by the largest stylesheets.
3. **Fragmented wayfinding** — bottom nav only on Home; ghost Cast; `apps→remote` redirect with dead `page-apps` markup; Studio + IPTV + DLNA pages each do 3 jobs with extreme scroll.
4. **Brand flicker** — `morph-wordmark` vs `morph-iptv-wordmark` injected on different entry paths; no live-text header lockup; debug footer stamp on every page.
5. **High-risk coupling under the styling mess** — IPTV Vault/Inspector/AndroidTV branching, remote/DLNA state, discovery/pair/install actions, update hash checks, faith alarms, and the 57 KB `MainActivity` dispatcher all work today and must not be renamed or forked during a visual rebuild.

### Recommended direction (RECOMMENDATION)

Rebuild **presentation only**, inside the existing contracts:

- Unify on **one token system** (`design-system.json` extended, all hardcodes mapped, Tahoma removed, 12/18/24 radius + 44px touch + single icon grid).
- Ship a **premium-minimal system v2** (slim 64px header with live-text lockup, persistent 4-tab nav, one card/shadow scale, bottom-sheet/drawer/status/empty components, WebP + skeleton + lazy-load).
- Reset **information architecture** (Home connects, Design edits, Control segments Remote|Apps|Cast, Play separates Phone/TV destinations from collapsed form and lazily-mounted TV browser).
- Rebuild **shell → Control → Play** in that order, keeping every `ClearNative`/`MatchesNative`/`IptvNative` name, every `data-page`/`data-remote-key`/`data-iptv-kind` value, and the `android-tv/iptv/` + `samsung-media.js` shared-transport boundary intact; validate each milestone with `remote-controller.cjs` + `controllers-integration.cjs` + deviceMatrix (API 26/30/33, Tizen, webOS, AndroidTV/FireTV) on the preview channel only.

**Awaiting approval before making any changes — no code was modified for this audit.**
