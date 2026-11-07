# MORPHTV UI 2.0 — Complete Project Audit & Redesign Plan

**Date:** 27 October 2026. **Status:** audit and proposal only; implementation has not started.

**Audited source:** `C:/Users/Admin/Documents/Codex/2026-10-22/ui-ux`. The current chat directory is a different directory, not the application source. This source directory is not itself a Git checkout. `.tools/release-push` is the distribution Git checkout; its release artifacts must not be mistaken for maintainable source.

**Baseline:** current local 0.8.147 source and generated packages. Release 0.8.147 was submitted for deployment before this audit request; it contains earlier requested fixes, not this redesign. No application source, theme, image, pairing flow, or business logic was changed during this audit. No new artwork was generated.

## 1. Decision summary and approved direction

Modernize the existing presentation layer rather than replace the application. Retain the current JavaScript modules, native/platform bridges, accounts, playback, caching, licensing, prayer calculations, fitness engine and stored data. Add a small shared design system and adapters for the different rendering contexts.

The approved reference is the composition target for the whole product: cinematic full-screen artwork, a compact rounded top navigation, search/Wi-Fi/weather/clock grouped toward the upper right, a slim left icon rail, readable content rails, and a floating bottom dock with recognizable app logos. Apply this language to internal pages, not just Home.

### Binding user clarifications

1. **Artwork:** use the whole screen as the artwork canvas; preserve the complete image and important subjects. The current Saudi-national and Long Live Egypt treatments demonstrate the desired no-crop behavior. Do not enlarge images automatically until faces or bodies disappear. Use proportional `contain` for the main artwork, with theme-colored edge fill where aspect ratios differ. A non-16:9 image cannot both cover every pixel and remain uncropped and undistorted; coordinated edge fill resolves that conflict. Do not stretch it.
2. **Composition:** follow the reference layout, including the upper-right weather, clock, search and network controls. This is more than changing button colors.
3. **Left rail:** keep every existing destination and its functionality accessible. Restyle icons and focus to match the reference; do not delete menus to make the mockup fit. Preserve platform-specific availability. Existing destinations need not be replaced by the exact labels in the sample image.
4. **Two performance experiences:** retain a **Light** and **Full** presentation in Settings. Light keeps Modern's composition and all functional features while reducing costly effects. Full adds the approved visual effects. These are modes of the same installed application, not separate APKs or separate data stores. Existing Automatic performance behavior can remain, resolving to Light or Full.
5. **Classic and Modern:** preserve Classic as the rollback interface during development, alongside opt-in Modern. UI mode and performance mode are separate settings, explained clearly below.
6. **Scope:** planning only. No UI implementation, image generation, theme replacement, new pairing steps, or redesign deployment is authorized by this report.

## 2. Architecture: what actually exists

### 2.1 Runtime structure

| Layer | Actual implementation | Redesign implication |
|---|---|---|
| Shared TV shell | `tv-project/app/index.html`, `core.js`, `app.js`; plain HTML/CSS/JavaScript, `window.ClearTV` namespace and IIFE modules | Reuse DOM/actions and introduce scoped presentation; no React/Vue/framework migration |
| Shell routes | `app.js` declares `home`, `apps`, `inputs`, `settings`, `fitness`; many other screens are overlays | Inventory must include dynamically injected views, not only HTML sections |
| Android/Google TV/Fire OS | `android-tv/android-adapter.js`, Java activities and JavaScript bridges in `android-tv/src/local/tvmorph/tv/` | Home, IPTV and radio are separate WebView contexts; native player/settings are additional surfaces |
| Samsung | Shared shell, `mobile-app/samsung-adapter.js`, `samsung-catalog.js`, `samsung-media.js`, `samsung-media-bridge.js`, `samsung-locks.js` | Tizen app/catalog/input APIs, iframe media library, AVPlay video; mode/tokens must cross into media documents |
| LG | `webos-app/platform.js`, `catalog.js`, `player.js`, `build.py`; webOSTV.js | Shared shell plus LG bridge, iframe/srcdoc media UI and HTML video; do not assume Android APIs or AVPlay |
| IPTV library | `android-tv/iptv/index.html`, `app.js`, `tv-library.js`, `cinematic.js`; copied into platform builds | Separate focus/navigation and CSS cascade; cannot be redesigned solely through Home CSS |
| Radio | `android-tv/radio/index.html`, `app.js`, CSS; native/platform playback adapters | Shared visual language, existing audio ownership/lifecycle preserved |
| Fitness | `tv-project/app/fitness/fitness-{data,i18n,store,audio,engine,ui}.js`, `fitness.css` | Eight rendered screens; business engine already separated from presentation |
| Android phone companion | `mobile-app/assets/ui/`; native bridge in `mobile-app/src/local/cleartv/mobile/` | Themes, pairing, remote, apps, IPTV and casting are separate phone surfaces; retain current simple connection flow |
| Theme delivery | `theme-packs/` metadata/build inputs, `distribution/theme-packs/` published WebP assets, TV/phone loaders | Preserve pack IDs, versions, integrity checks, entitlements and cached assets |
| Distribution | `distribution/`, `.tools/release-push`, Python build scripts, APK/IPK/project ZIP packages | Change canonical source; regenerate builds later; never edit generated copies as source |
| Legacy edition | `android-legacy/`: separate native Java Android 4.4/API 19 app | Not full-feature UI parity; keep outside the first Modern rollout |

### 2.2 Important existing contracts

- `ClearTV.read/write` use `cleartv.*` localStorage. The active family viewer scopes selected keys such as settings, pins and recents. `C.Profiles` supports up to six viewers. Do not rename keys or duplicate them for Modern.
- `C.applyRemoteConfig` validates setting values and applies Plus restrictions. Selecting a **different theme currently resets several customization fields**. Switching UI mode must not simulate theme selection or trigger those resets.
- Favorites are real catalog IDs, capped at 24 by `setRemotePins`; recents are launch IDs. Preserve installed-app identity, ordering and launch handlers.
- IPTV uses account/profile-specific favorites, history/progress, provider categories, paginated results, in-memory/native/disk or browser caches. Existing source selection distinguishes public channels and a saved personal subscription.
- Fitness persistence uses `fitness.settings.v1`, `fitness.custom.v1`, `fitness.history.v1` through `C.read/write`. These keys are **not in core's viewer-scoped key list**. Do not describe current fitness history as viewer-isolated or silently change its scope during a visual project.
- Presentation reacts to events including `morphLanguage`, `morphViewer`, `morphPacks`, `morphPlus`, `morphPerformance`, `morphTextSize`, `morphStorageChanged` and media/audio events. Preserve event ordering and avoid registering duplicate listeners on mode switches.

### 2.3 Platform coverage and its limits

| Platform | Evidence in current source | Boundary |
|---|---|---|
| Android/Google TV | Manifest minimum API 26, native WebView shell, internal IPTV/radio/player, inputs, USB, pairing | Actual firmware, WebView, codecs and Home permissions vary; API level alone is not certification |
| Fire TV/Fire OS | Android receiver plus Fire-specific installer/store/Home policies | Do not promise default-launcher replacement on every Fire firmware |
| Samsung Tizen 5+ | Standard project targets Tizen 5.0; phone build transpiles JavaScript to Chrome 56 | Certificate/developer installation and actual TV APIs remain platform-specific |
| Samsung Tizen 4 | Separate experimental computer project targeting 4.0; legacy CSS/polyfills exist | Must retain explicit experimental status and physical testing requirement |
| LG webOS 5+ | IPK `com.zainbot.morphtv.preview`, 1920×1080 app resolution, Chrome 68 transpilation target | Preview package; does not replace LG Home. Public app enumeration is limited; known apps are checked individually |
| Android Legacy | Separate API 19 native app, lightweight Home/apps/M3U player/settings | No full current theme/fitness/pairing feature parity |
| Browser preview | Demo catalog and simulated/native-mocked bridges | Visual aid, not proof that a real television can install, launch apps or decode a stream |
| Coolita, Samsung Orsay, LG NetCast, Roku | No current full MorphTV implementation established by inspected active build paths | Do not add support claims as part of a cosmetic upgrade |
| VIDAA | Historical source folder exists; current public distribution removes its platform/download routes | Dormant source is not supported product coverage |

**Documentation drift:** `DEVICE-COMPATIBILITY.md` and portions of Android/phone READMEs predate later LG, Samsung media, radio and Fire work. They contain statements such as LG receiver/media being absent and VIDAA being distributed. Treat actual build scripts, current source and current catalog as authoritative for this audit. Schedule a documentation correction with a future implementation, not a runtime rewrite.

## 3. Complete screen and state inventory

The inventory below covers distinct user-visible pages, nested views and dialogs found in active implementation. It does not count every channel, theme, workout or language as a separate screen. Loading, empty, error, offline/cached and disabled/locked states belong to each applicable screen.

**Path shorthand:** `TV/` = `tv-project/app/`; `IP/` = `android-tv/iptv/`; `RA/` = `android-tv/radio/`; `FIT/` = `tv-project/app/fitness/`; `JAVA/` = `android-tv/src/local/tvmorph/tv/`; `PHONE/` = `mobile-app/assets/ui/`. All filenames are relative to the audited root.

**Risk:** L = local presentation; M = layout/focus/state restoration; H = lifecycle, native bridge, media, timed enforcement or entitlement sensitivity. Visual observations are code/static-layout findings unless otherwise stated; this is not a physical-TV visual certification.

### 3.1 Shared shell, Home, apps and inputs

| ID / screen | Source and current structure/shared components | Visual issue → redesign opportunity | Functional dependencies and remote considerations | Risk |
|---|---|---|---|---|
| H01 Home hero/background | `TV/index.html`, `app.js`, `artwork.js`, `boot-theme.js`, `home-reference.*`, `plus-themes.css`; theme/title/art and gradients | Multiple theme-specific image sizes/masks; some themes cover/crop → full-screen image canvas, proportional complete artwork, readable localized scrims | ThemePacks, custom art/offset/scale, startup flash prevention; decorative art must never become a focus target | M |
| H02 Header/top navigation | `TV/index.html`, `app.js`, platform adapters, `wifi.js`, `locale.js`; native buttons plus injected Family/connection/language entries | Growing text nav and platform injections compete for space → compact rounded navigation and reference-aligned status cluster | Existing route IDs/capabilities; Up reaches header, Down restores content position; no duplicate focus targets | M |
| H03 Left tool rail | `TV/index.html`, `sidebar-icons.css`, `home-reference.css`, prayer/fitness modules and platform adapters | Mixed colored SVG tiles and CSS pseudo-icons → slim modern icon surfaces and a single focus vocabulary | Preserve Fitness, Prayer, store, Internet, Appearance, Help and any conditional existing input/tool destinations; no menu removal | M |
| H04 Floating favorites dock | `TV/app.js`, `dock.js/css`, `home-reference.js`, `catalog.js`, `reorder.js` | Existing lift/neighbors/reflections and clipping-sensitive overflow → reference floating capsule, contained logos, controlled enlargement | Pin order/24 cap, long OK, reorder, last focus and catalog refresh; do not rebuild dock on every key | H |
| H05 App picker/pinning | `TV/app.js` (`openAppPicker`, `renderCatalog`), shared modal and catalog | Generic picker/card treatment → reusable app cards with separate selected/pinned state | Plus/check marker is pin state, not subscription state; short OK behavior and return focus preserved | M |
| H06 Recently used / last HDMI | `TV/dock.js/css`, `app.js`, `rails.js` | Several card styles and fixed placement → compact consistent rail and honest source card | Real launch history, `lastHdmi`, delayed input loading; restore source by real native ID | M |
| H07 Installed Apps + search | `TV/index.html`, `app.js`, `catalog.js`, `app-polish.*`, platform catalogs | Catalog/search/pin styling differs from dock → branded logo cards, restrained action badges | Search actual installed apps; LG limited catalog must stay honest; keyboard opens on activation, not focus | M |
| H08 Inputs/source browser | `TV/index.html`, `inputs.js`, `app.js`, platform adapters; source grid plus on-now panel | Heavy panels and inconsistent connection labels → compact source cards/details | Native source identity, connected/unknown state, refresh, USB entries; no invented HDMI ports or cable state | H |
| H09 Watching source / alternate HDMI | `TV/app.js` watch-controls; `JAVA/InputActivity.java`, `InputLaunch.java`, `AndroidInputs.java`; Samsung/LG source APIs | Mixed web/native control appearance → shared visual specification within controllable UI | TvView/physical input switching and OS player remain intact; Back must stop/return correctly | H |
| H10 Input diagnostics | `android-tv/android-adapter.js`, `mobile-app/samsung-adapter.js`, native metadata | Raw diagnostic text can be dense → readable bounded diagnostics sheet, same information | LTR native IDs, scrollability, close restoration; do not alter diagnostic/launch logic | M |
| H11 USB shortcut/files | `TV/usb.js/css`, `JAVA/UsbStorage.java`, `UsbFilesActivity.java`; Samsung filesystem, LG media-player entry | Different platform surfaces → shared storage-card language and clear capability text | Hotplug/removal, Android document picker, Samsung read-only folders, LG unknown mount status; system pickers stay system UI | H |
| H12 Weather/forecast | `TV/weather.js`, `app.js`, header weather card and forecast modal | Large weather widget versus reference's compact status → compact city/temp/icon control opening existing forecast | Open-Meteo/cache/location services unchanged; activate to open, never fetch on every focus move | M |
| H13 Weather location search | `TV/app.js` (`openLocation`, `searchCity`) | Generic text-heavy dialog → location form/list template | Auto/manual/off state and privacy explanation retained; native keyboard, error/result focus | M |
| H14 Language picker | `PHONE/locale.js` copied into TV builds; language overlay | Separate chooser style → shared selection sheet | Five languages, native preference sync and return focus; retain no-translate boundaries | M |
| H15 Family/viewer picker/create | `TV/core.js`, `app.js` (`openProfiles`) | Plain name cards/form → profile chips and compact create form | Six-viewer limit, existing scoped settings/pins; cannot switch while embedded media disallows it | H |
| H16 App action/long-OK sheet | `TV/app-actions.js`, `reorder.js`; lock/unlock/time/move and Kids hide action | Long settings-style actions and emoji → compact labeled action sheet | Hold/release guard, parental status polling, no accidental launch, restore originating tile | H |
| H17 Phone connection information | `android-tv/android-adapter.js`, `JAVA/TvActivity.java`, `PhoneLinkServer.java`; platform connection guidance | Native/guide presentation differs → visual alignment around existing connection information | No new pairing step, token, prompt or permission flow; LG and Samsung must retain their actual supported path | H |
| H18 Welcome/update feedback | `TV/welcome-support.*`; phone `update-alert.js` and native update/install prompts | Separate overlay/loading styles → shared notice/progress/CTA treatment | Do not change update verification, signature checks or installer confirmations; TV `update-alert.js` file alone is not evidence of an active TV route | M |
| H19 Help/About/contact | `TV/app.js`, `about.js`, `contact.js` | Generic text modal, mixed font sizes and legacy text overridden later → readable help sections and consistent About sheet | Keep credits/licenses/version source; preserve links and platform-specific help accuracy | L |
| H20 Support/donation | `TV/support.js/css` | QR/payment blocks visually independent → consistent glass sheet and readable QR contrast | Existing support destinations unchanged; support is distinct from Plus activation | M |

### 3.2 Settings and Appearance

`TV/settings-nav.js` constructs nine categories and moves existing buttons into them using selectors/MutationObserver. This dynamic reparenting is a central migration risk: replacing the settings DOM wholesale could strand actions or break placement.

| ID / screen | Source/current UI and shared pieces | Visual issue → redesign opportunity | Dependencies / remote behavior | Risk |
|---|---|---|---|---|
| S01 Settings root | `TV/index.html`, `settings-nav.js/css`; nine category entries | Large category tiles and later CSS overrides → premium category rail with readable panel preview | Keep category IDs and all entries; stable selected vs focused states | M |
| S02 Launcher & startup | SettingsNav + platform adapter; `JAVA/StartupSettings.java`, `HomeOverride*`, `BackReturnPolicy.java` | Web entry opens several native choices → consistent explanatory rows | Home choice, boot, quick return/accessibility remain platform-dependent; preserve existing disclosures | H |
| S03 Performance | `TV/performance.js`; `IP/media-performance.js`, radio copy | Cycling control is less discoverable → explicit Light/Full choices plus retained Automatic | Existing light/full/auto persistence and native sync; UI mode must not reset this preference | M |
| S04 Appearance & Plus | SettingsNav placements, `app.js`, `packs-tv.js`, `plus-tv.js`, `text-size.js` | Mixed palette/pack/Plus controls → coherent appearance hub | Keep Plus badges/entitlements and free image/font access | M |
| S05 Arabic/English font picker | `TV/text-size.js`, `screen-fit.css`; three choices each | Independent overlay styling → semantic size chooser with current value | 90/100/110% presets, persistence, CSSOM scaler; no double-scaling in Modern | M |
| S06 Apps & family | SettingsNav, native `AppLocks.java`, `ParentalTimer.java`, `mobile-app/samsung-locks.js` | Controls split between sheets/native dialogs → consistent summaries/actions | Existing PIN enforcement/time allowances and Kids show/hide; no weaker locks | H |
| S07 IPTV settings entry | Android adapter, IPTV Activity/settings overlay | Separate visual system → transition to the existing IPTV settings with matching tokens | Account/playback/cache settings remain owned by IPTV | H |
| S08 Prayer & Adhan settings | `TV/prayer.js/css`, `prayer-duas.js` | Long nested settings and mixed grouping → clear location/calculation/audio/visibility groups | Preserve prayer method/school/voice/volume, refresh, enabled state, previews, prayer-break behavior | H |
| S09 Weather & time | `TV/index.html`, `app.js`, weather module | Plain rows → consistent SettingsRow/selectors | Clock format, units, weather city/refresh unchanged; enough space for translated values | M |
| S10 Device & tools / Wi-Fi | `TV/device-settings.js`, `wifi.js/css`; `JAVA/SystemSettingsTools.java`, `NetworkSettings.java` | Platform-specific dialogs/guides → uniform app-owned guide sheets | Opening OS settings is not an in-app Wi-Fi configuration implementation; retain fallback guidance | H |
| S11 Apps & storage maintenance | `TV/app-polish.js`, `JAVA/AppMaintenance.java` | Native lists/actions not theme-aligned → typography/spacing specification for app-owned native surfaces | App details, storage, request uninstall use existing system screens; no new destructive shortcut | H |
| S12 About & support category | SettingsNav; About/support modules | Mixed category/content styles → consistent info panels | Credits, privacy/licensing text and links retained | L |
| A01 Palette/theme selection | `TV/app.js` (`openAppearance`), `style.css`, `plus-themes.css`, `theme-locale.js` | Swatches/labels differ from actual preview → modern gallery with selected/download/Plus markers | All 28 theme IDs; select/apply behavior; reveal missing pack before apply | M |
| A02 Theme pack manager | `TV/packs-tv.js`, `theme-packs.js`, `progress.*` | Long rows of preview/download/remove controls → bounded pack cards and clear states | Download/hash/IndexedDB/blob lifecycle unchanged; removing selected pack currently falls back to blue | H |
| A03 Theme preview carousel | `TV/theme-preview.js/css` | Remote static preview images do not represent future Modern UI → label Classic previews until Modern previews exist | Previous/next/close, pack scope and focus stack; no image generation in audit | M |
| A04 Personal image/position/size | `TV/artwork.js`, `app.js`; `PHONE/customization-sections.*` | Phone free-image section and TV display use different layout rules → aligned image framing and honest full-image preview | Image replacement/position is free, local-only; existing native image handling remains; recommended 1920×1080 | M |
| A05 Advanced customization | `PHONE/index.html`, `app.js`, `plus-phone.js`, TV apply config | Many controls/long page → compact grouped editors, contextual preview | Preserve Plus gating of advanced title/logo/colors/slideshow; don't unlock all customization | H |
| A06 Plus purchase/activation/status | `TV/plus.js`, `plus-tv.js`, `plus.css`; phone counterparts | Independent activation/error/active states → shared entitlement sheet, readable status and active badge | Keep license/status API, device limits, short/old codes and purchase terms; no test redemption or payment changes | H |

### 3.3 IPTV — all active library views

Core dependencies: `IP/app.js` calls the existing bridge operations `summary`, `settings`, `saveSettings`, `categories`, `list`, `details`, `epg`, `history`, `progress`, `play`, `connect`, `refresh`, `clearProgress`. Native Android implementations include `IptvActivity`, `IptvStore`, `Xtream`, `M3uPlaylist`, `CatalogDisk`, `PlaybackMemory/History`; Samsung uses `samsung-media.js`; LG derives media integration with its own player. Keep the request/response contracts.

| ID / screen | Source / existing structure | Visual issue → redesign opportunity | Dependencies / remote behavior | Risk |
|---|---|---|---|---|
| I01 IPTV Home | `IP/index.html`, `app.js`, `cinematic.js/css`; hero, portal cards, history and tools | Many overlaid CSS layers → cinematic dashboard with consistent navigation/cards | Existing portals only; provider/account availability; restore last portal | M |
| I02 Live library/categories | `IP/app.js`, `tv-library.js/css`, `library-layout.css` | Category list/grid/detail dimensions compete → stable category rail, readable channel cards | Provider category names/IDs, 60-item pages and refresh behavior; D-pad can reach every page control | H |
| I03 Live selection preview/details | `IP/tv-library.js`, `details-tv.css`; selected channel pane | Preview/details styling differs → consistent side detail panel with honest art fallback | Selection is distinct from playback; do not start network playback merely on focus | H |
| I04 Movies catalog | Same library files, kind `vod` | Density/title clipping/focus treatment → portrait poster grid with controlled metadata | Provider sort/page/categories, compact/comfortable preference, favorites and progress | H |
| I05 Series catalog | Same library files, kind `series` | Similar styling obscures type → consistent series markers and episode-aware cards | Keep series IDs distinct from movie IDs | H |
| I06 Series episodes | `IP/app.js`, `tv-library.js` (`loadEpisodes`) | Episode pane/grid is a separate layout → clear season/episode hierarchy using available metadata | Back returns to series context; correct episode IDs and previous/next navigation | H |
| I07 Title details/resume | `IP/index.html` details panel, `app.js`, `details-tv.css` | Large poster plus text/action density → readable details sheet with priority actions | Existing plot/cast/director/rating when supplied, Resume/Start/Episodes; no invented metadata | H |
| I08 Section search | `IP/app.js`, header/section input | Crowded search and keyboard layout risk → dedicated search state within existing scope | System keyboard on OK; preserve current query/category/page semantics and Back | H |
| I09 Unified search | `IP/app.js` (`unifiedSearch`) | Results across kinds need clearer type grouping → scoped result groups and error/retry per group | Existing live/vod/series calls only; preserve partial failure behavior; no new search backend | H |
| I10 Favorites | `IP/app.js` favorite kinds and favorite-only mode | Generic selected style can look like focus → explicit saved marker and section tabs | Live/movie/series grouping and episode-to-series grouping retained; long OK must not play | H |
| I11 Continue watching / recently added / history | `IP/app.js` watch cards and special modes | Different history types can be visually ambiguous → labeled progress/type rows and consistent cards | Live last-channel, movies and episodes stay distinct; no fabricated Trending feed | H |
| I12 EPG | `IP/index.html` EPG overlay, `app.js` | Generic dialog/list → clear now/next/schedule hierarchy | Provider-supplied guide, no-data/error states, correct channel play/close | H |
| I13 IPTV settings | `IP/index.html`, `app.js`; playback/library groups | Long modal mixed forms → settings template with clear current values | Language, Fit/Fill/Stretch, resume, density, page-local sorting, reduced motion, refresh/clear progress unchanged | H |
| I14 Source/account entry | `IP/app.js`, `account-keyboard.*`; Xtream/M3U fields | Long credential form/source state → source summary and compact staged form | Saved personal account survives public switch; never put credentials in screenshots/report or change storage | H |
| I15 Public vs personal source state | `IP/app.js`, phone source modules and native/media stores | Source distinction must remain visible → separate public/personal cards and explicit active marker | Public feed is not a replacement subscription; preserve return to saved personal source | H |
| I16 Native/fallback keyboard | `IP/account-keyboard.js`, native `showKeyboard` and OS keyboard | Custom/system rendering differs → favor existing system input, style only app fallback | Existing Android activation hooks and Samsung/LG native Enter behavior; never open just from navigation focus | H |
| I17 Android video player | `JAVA/PlayerActivity.java`, `VideoSizing.java`, `PlaybackRate.java`, `SeekHoldPolicy.java` | Native controls differ from web library → matching spacing/icon/text specification for controls only | Keep MediaPlayer, sizing, seek/resume/rate/channel switching/retry state machine untouched | H |
| I18 Samsung/LG video player | `mobile-app/samsung-media.js`, `webos-app/player.js`; platform control DOM | Player surface has separate lifecycle and coordinates → tokenized control overlay | AVPlay display rectangle vs HTML video; native plane layering, Back/media keys and resume retained | H |
| I19 Player errors/retry/alternative player | Native player and platform media modules | Generic error dialogs → readable actionable error hierarchy | Keep original error code, bounded retry and alternate-source/player policy; visual upgrade cannot fix provider outages | H |

### 3.4 Fitness — eight actual screens plus exit dialog

| ID / screen | Source / current structure | Visual issue → redesign opportunity | Dependencies / remote behavior | Risk |
|---|---|---|---|---|
| F01 Sports Home | `FIT/fitness-ui.js` `renderHome`, `fitness.css`; hero/quick/guided/custom/categories | Blue/purple hardcoded accents mixed with theme tokens → shared cinematic hero and category cards | Existing Plus access and six featured category covers retained; complete subject framing | M |
| F02 Programs/category/detail | `renderPrograms`, `detailPanel`; category chips, programs and sequence summary | Generic grid/detail split → category page template with metadata hierarchy | Existing difficulty filtering, program exercises/rounds/duration; no new programs implied | M |
| F03 Workout builder/saved workouts | `renderBuilder`, store | Multi-select/save/delete actions need clearer states → selected/check treatment separate from focus | Preserve sequence, filters, saved custom data and deletion confirmation; remote multi-select remains predictable | H |
| F04 Active workout | `renderActive`, engine/audio; timer, exercise, progress, controls | Needs calm visual emphasis and legible timer → stable timer/action layout with themed ring | Do not re-create engine or timer on focus/mode changes; media/audio and pause/skip/round state preserved | H |
| F05 Music selection/preview | `renderMusic`, audio module | Separate music controls → shared music selector and status | Preview must stop on exit; workout return resumes correct state; existing voice/beep/music ownership | H |
| F06 Completion | `renderComplete` | Independent celebration style → restrained themed completion and KPI cards | Save session once; repeat/choose/home actions unchanged; reduced-motion has no particles | M |
| F07 Progress/history | `renderProgress`, store stats/streak | Basic charts/table → theme-aware KPI/chart/history hierarchy | Keep existing calculations and date ranges; do not change weekly calculation semantics as styling | M |
| F08 Fitness settings | `renderSettings` | Long rows/plus-minus controls → SettingsRow/selectors | Music, voice, beeps, countdown, auto-next, rest, difficulty, volume/weight-related options; no new engine behavior | M |
| F09 Exit confirmation | `askExit`, `UI.back`, `fit-exit-dialog` | Must match common dialog while staying unmissable → shared dialog contract | Preserve unfinished-session/engine cleanup and return-to-sidebar focus; highest-priority regression | H |

Seven supplied fitness WebP images exist: one hero and six category covers, about **279 KB total** in source. They do not constitute a complete exercise-specific image library. The user deferred exercise images until visual approval. No generated placeholders should be presented as completed exercise photography.

### 3.5 Other modules, enforcement and companion surfaces

| ID / screen | Source / existing structure | Visual issue → redesign opportunity | Dependencies / remote behavior | Risk |
|---|---|---|---|---|
| O01 Radio library/search/filter/favorites | `RA/index.html`, `app.js`, `radio-layout.css`, `cinematic-radio.css` | Theme mapping/card language differs → consistent category rail and station cards | Actual station catalog, long-OK favorites, search and native/HTML fallback remain | H |
| O02 Radio now-playing/error/retry | Same files, `JAVA/RadioActivity.java`, `RadioPlayback.java` | Separate bottom control bar → shared player-control language | Audio state/cleanup and retry unchanged; mute/stop must remain accessible | H |
| O03 Background radio mini-player | `TV/radio-background.js/css` | Floating control conflicts possible → tokenized mini-player in reserved overlay space | Background status polling, stop on exclusive audio, open/pause/stop; cannot cover dock focus | H |
| O04 Prayer dashboard | `TV/prayer.js/css`; weather/clock/Hijri/countdown/prayer cards | Independent large glass components → shared page/card typography with calm hierarchy | Timezone/date/calculation/API/native sync unchanged; dashboard/settings focus return | H |
| O05 Prayer settings/city/results | `TV/prayer.js`, settings section | Long controls need grouping → compact settings groups, bounded results | Method/school/location/audio toggles and preview retained | H |
| O06 Duas | `TV/prayer-duas.js`, `prayer-duas-data.js` | Long Arabic and translated text can overflow → dedicated legible content card | Category/source/Arabic/meaning/rotation controls; no alteration to religious text | M |
| O07 Adhan/prayer break overlays | `TV/prayer.js`, `JAVA/AdhanScreen.java`, `AdhanPlayback.java`, `AdhanWindow.java` | High-priority overlays visually separate → shared overlay tokens with sufficient contrast | Priority over media/focus, stop/resume rules and time enforcement preserved | H |
| O08 Family PIN/configuration | `JAVA/AppLocks.java`, `mobile-app/samsung-locks.js`, phone `parental.js` | Native/web dialogs diverge → visual specification for PIN/summaries, no flow rewrite | Parent approval/attempt limits/locks, chosen apps and time budget remain authoritative | H |
| O09 Time-up / parent request | `TV/family-ui.*`, `parental-pause.html`; `JAVA/TimeUpActivity.java`, `ParentRemoteActivity.java` | Separate child illustration/card → child-friendly shared surface with clear parent action | Cannot dismiss enforcement through a visual mode switch; native Back and PIN approval retained | H |
| O10 Kids World live player | `TV/kids.js/css`, `assets/tvm-kids.svg` | New independent surface → shared child-friendly player/control tokens | Existing in-app AVPlay/HTML/HLS, pause/mute/retry, hide/restore pin, parental/audio lifecycle unchanged | H |
| P01 Phone Connect/install/pair | `PHONE/index.html`, `app.js`, `connect-flow.*`, `guide*.js`, `lg-connect.js`, `compatibility.js`; native discovery/installers | Several platform guides → token alignment and readable step/result cards, not extra steps | Preserve current scan/manual/IP/pair/install/reconnect flow, encrypted saved keys and platform permissions | H |
| P02 Phone Design/theme gallery | `PHONE/app.js`, `clubs.*`, `packs-phone.js`, `theme-locale.js`, customization/appearance files | Long customization area → grouped editor and accurate Classic/Modern previews | Same TV settings and pack status; local artwork and Plus restrictions unchanged | H |
| P03 Phone Apps/library/actions | `PHONE/app-library.js`, `library.css`, `app.js` | Different app cards → shared logo/selection vocabulary at touch sizes | Actual IDs/order/pins/launch and parental actions retained | M |
| P04 Phone Remote/touchpad | `PHONE/remote-visual.*`, `remote.*`, native remotes | Separate button style → aligned icon/states, retain ergonomics | Remote command IDs and touchpad semantics unchanged; no new pairing/security prompts | H |
| P05 Phone IPTV/account/browse/watch | `PHONE/iptv*.js/css`, `mobile-app/phone-iptv.*`, native `PhoneIptvActivity.java` | Dense forms/library and source controls → consistent source cards and media UI | Public/personal preservation, phone-vs-TV target, provider credentials and playback unchanged | H |
| P06 Cast/mirroring/DLNA | `PHONE/cast-screen.js`, `dlna-cast.js`; native `DlnaCast.java`, `CastSettings.java` | Independent instructions/status → consistent utility template | Actual platform capabilities, media URI/network and OS screens retained; no invented universal casting support | H |
| P07 Phone Plus/support/update/operation | `PHONE/plus*`, `support.*`, `progress.*`, `welcome-support.*`, copied update script | Many modal/progress variants → shared semantic states | Purchase/activation/retry and native update checks untouched | H |
| X01 Legacy Home/apps/M3U/player/settings | `android-legacy/src/local/morphtv/legacy/{HomeActivity,PlayerActivity,Playlist}.java` | Separate native lightweight edition → document as separate scope | Preserve API 19 usability; do not inject full web UI into this app | H |
| X02 Website/installer/purchase pages | `distribution/index.html`, `landing.*`, `install*.html/js`, `plus.html`, `plus-purchase.js` | Ancillary visual alignment may follow later | Not part of TV shell routes; preserve videos/downloads/offers; no website redesign in this audit | M |

### 3.6 Features not established by the reference

The image is not evidence that MorphTV has a global Trending service, a game storefront, a separate sports-streaming product, downloadable GTA gameplay, or every depicted third-party app installed. Top Movies/Series/Live shortcuts can target **existing IPTV routes**, subject to account/source availability. Fitness remains the actual sports/workout module. Kids remains the actual live player. Do not manufacture sample content or fixed Netflix/Disney/Spotify shortcuts on devices where they are not confirmed available.

## 4. Reference analysis and layout specification

### 4.1 Defining visual language

The image uses a nearly invisible shell over cinematic artwork. Its hierarchy is: compact identity/navigation and status at the top; a thin left rail; left-aligned hero copy over a localized dark scrim; media rows below; a large but visually light floating dock. Selected controls use cyan-violet lighting, an outline and modest elevation. Ordinary controls are low-contrast surfaces with high-contrast labels. Third-party logos retain their branding.

Reproduce that composition rather than one uniformly blue panel or oversized square launch buttons. Brightness comes from selected accents and artwork, not a permanent glow around every component. Internal pages use the same radii, spacing, type, surfaces and focus states while allocating more space to their specific content.

### 4.2 Proposed dimensions — logical 1920×1080 canvas

These are implementation starting ranges, not measurements claimed to be exact mockup pixels. Validate against real TV screenshots and long Arabic/French labels.

| Element | Proposed range / behavior |
|---|---|
| Safe area | 40–56 logical px for essential content; artwork may extend to all screen edges |
| Left rail | 96–120 px; icons 36–44 px with legible labels; content starts around x=160–184 |
| Header | 64–80 px control height; brand left, compact nav center, status group upper right |
| Status cluster | Separate focusable Search/Wi-Fi/weather controls, noninteractive clock/date; weather reuses existing forecast/location actions |
| Hero | Approximately 380–440 px in the Home content composition; image itself remains viewport-wide behind the shell |
| Content row | Cards around 150–200 px high where landscape content is appropriate; visible labels and progress above dock |
| Dock | Approximately 144–176 px surface area including labels; logo surfaces around 88–112 px, 18–24 px gaps; scale must not clip |
| Corner radii | 12 px small controls, 18–24 px cards, 28–36 px floating dock/navigation; avoid one radius for every object |
| Spacing | 8 px base; 8/16/24/32/48/64 spacing roles |

The requested top Search must be functional. In IPTV it opens the existing library search. A Home-level Search should route to existing installed-app search or an explicitly chosen existing IPTV search scope. This is a presentation/routing proposal, not a new universal search backend. Do not imply that it searches unrelated external apps or paid catalogs.

### 4.3 Full-screen image policy

- A single full-screen artwork host sits behind shell content. Main image: proportional complete-image fit; default no zoom and no destructive crop. Theme-color/gradient fills uncovered edges.
- Avoid duplicating the hero image as multiple large blurred bitmap layers. Full mode may use a lightweight gradient halo; Light mode uses the same colors without blur.
- Place scrims only where text/controls require them, strongest near left rail, hero copy, header and dock. Do not hide most of the image under a solid dark rectangle.
- Keep existing artwork, titles, logos, user image position and local storage semantics. For older manually zoomed settings, Modern needs a non-destructive fit/position adapter; never overwrite the saved Classic values silently.
- The current final rules for `saudi-national` and `egypt-national` in `plus-themes.css` use a full 1920×1080 host, `object-fit:contain`, no transform and no image mask. Use this as the concrete baseline for complete-image framing. Current `gta6` and `blue-cinema` have `cover` rules; do not assume all themes already follow the desired policy.
- Reference artwork is a composition guide, not authorization to replace existing GTA or other theme assets. No images need to be generated for phase 1.

## 5. Theme-system audit and universal adapter

### 5.1 Existing theme inventory — preserve every ID

`TV/app.js` declares **28 selectable themes**. `club-themes.js` has 22 structured theme records; Ahly and the base palettes also depend on separate legacy CSS/logic. Do not derive the full theme list from ClubThemes alone.

| Group | Theme IDs | Identity to preserve |
|---|---|---|
| Base palettes | `blue`, `night`, `emerald`, `amber`, `violet` | Distinct daylight/blue, midnight, green, warm amber and violet backgrounds/accents |
| Egyptian clubs | `ahly`, `zamalek`, `ismaily` | Red/Ahly artwork, Zamalek identity, blue/yellow Ismaily identity and crests |
| European clubs | `barcelona`, `madrid` | Burgundy/blue versus cream/gold/purple, original team artwork |
| National teams | `egypt`, `argentina`, `portugal` | Original national-team imagery and red/light-blue/red-green palettes |
| Hockey | `montreal`, `toronto` | Red/navy versus blue/light-blue artwork/marks |
| Other sports | `basketball`, `baseball` | Orange/warm versus navy/sand identities |
| Saudi themes | `king-salman`, `crown-prince`, `nassr`, `hilal`, `ittihad`, `ahli-saudi` | Portrait/royal green-gold; yellow-blue Nassr; blue Hilal; yellow-black Ittihad; green Ahli |
| Inter Miami | `inter-miami` | Black/pink identity and supplied artwork |
| Patriotic | `saudi-national`, `egypt-national` | Full-image patriotic compositions, green and red/charcoal palettes |
| Cinema / gaming | `blue-cinema`, `gta6` | Supplied blue cinema artwork; pink/violet Vice Sunset artwork |

Current **11 packs**, with entitlement preserved: `egypt` v3 free; `europe` v2 free; `hockey` v3 Plus; `sports` v2 Plus; `national` v6 Plus; `egypt-extra` v4 free; `saudi` v2 Plus; `patriotic` v5 free; `inter-miami` v2 Plus; `cinema` v1 free; `gaming` v3 free. Plus rules also exist in `plus.js`; do not replace them with a design-only list.

### 5.2 How the current system works

1. `boot-theme.js` reads saved viewer/theme early to avoid a wrong-color startup flash.
2. `core.js` loads settings. `app.js` sets body `data-theme`, artwork, custom text/colors and sizes.
3. `club-themes.js` provides identity metadata such as primary/secondary colors, crest, artwork and localized title/motto; `theme-locale.js` resolves language.
4. `style.css`, `home-reference.css`, `plus-themes.css` and injected `remote-custom-style` contain theme/component exceptions. `C.syncBarTheme` derives `--cinema-glass`, `--cinema-border`, `--cinema-icon`, `--cinema-glow` from palette/custom settings.
5. `theme-packs-manifest.js` and `theme-packs.js` handle versioned download, byte/hash validation, IndexedDB and blob URLs. `ThemePacks.src` resolves installed art or a blank placeholder; paid art is entitlement-aware.
6. `packs-tv.js` and `theme-preview.js` manage download/delete/static preview. TV previews use remote WebP previews, with a separate GTA preview version.
7. IPTV/radio use `media-theme.js` and `cinematic-theme.js` with **separate shortened palette/art maps** and additional hardcoded CSS. Some themes fall back to blue or generic gradients instead of reproducing their full identity. Fitness partly uses cinema tokens but also fixed cyan/violet colors.

### 5.3 Problems established by source inspection

- Theme identity, geometry and component skin are mixed together. Later rules override earlier exceptions; a redesign appended at the end would accumulate more fragile specificity.
- Inspected CSS has substantial `!important` layering: `home-reference.css` 60 occurrences, `cinematic.css` 42, `dock.css` 37, `tv-library.css` 36. These are file-specific audit counts, not a diagnosis that every rule is wrong.
- Custom text/background colors are format-validated; the inspected apply path does not enforce a universal contrast floor for every module and custom image.
- Current media palette/art maps do not cover every theme. Cross-module identity must be tested explicitly, especially GTA, newer Saudi, cinema and patriotic themes.
- A static screenshot preview is not a live preview of the active mode. Modern preview metadata must be distinguished from existing Classic assets.
- Source assets are not the same as published packs: source has some images above 1 MB, but the active published catalog's largest listed pack file is about 394 KB. Forty-five excluded names are tracked by the pack/build exclusion list. Do not report all source assets as shipped in the APK.

### 5.4 Proposed Universal Theme-Aware Design System

Add one presentation-only theme adapter. Input: current theme ID, existing ClubThemes/base palette metadata, permitted user overrides, UI mode and performance mode. Output: a complete semantic token object. Preserve source artwork/entitlement resolution through ThemePacks; do not replace the loader.

| Token family | Proposed semantic tokens | Derivation / purpose |
|---|---|---|
| Canvas | `--ui-bg-base`, `--ui-bg-edge`, `--ui-art-scrim`, `--ui-art-position` | Theme's secondary/background identity; image fit/position separated from controls |
| Surfaces | `--ui-surface`, `--ui-surface-raised`, `--ui-surface-selected`, `--ui-card-bg` | Tinted theme surfaces, not identical blue everywhere |
| Glass | `--ui-glass-bg`, `--ui-glass-opacity`, `--ui-glass-blur` | Readability floor plus performance tier; opacity independent of theme hue |
| Text | `--ui-text-primary`, `--ui-text-secondary`, `--ui-text-muted`, `--ui-text-on-accent` | Contrast-tested roles; never assume white text works on gold/light accents |
| Accent | `--ui-accent`, `--ui-accent-secondary`, `--ui-button-gradient` | Existing primary/secondary/highlight overrides, bounded by contrast |
| Focus | `--ui-focus-ring`, `--ui-focus-halo`, `--ui-focus-width`, `--ui-focus-offset` | Clear ring independent of glow; alternate light/dark guard ring where needed |
| Borders/shadows | `--ui-border`, `--ui-divider`, `--ui-shadow-card`, `--ui-shadow-raised` | Consistent edge/elevation hierarchy |
| Navigation/dock | `--ui-nav-bg`, `--ui-nav-selected`, `--ui-dock-bg`, `--ui-dock-border`, `--ui-dock-shadow` | Same theme family across header/sidebar/dock; logo colors remain original |
| Overlays/status | `--ui-overlay-scrim`, `--ui-dialog-bg`, `--ui-success`, `--ui-warning`, `--ui-error` | Sufficient contrast regardless of art or selected theme |
| Geometry/type/motion | spacing, radius, typography and duration tokens | Shared between pages; applied in logical units once |

Explicitly map all 28 IDs. Unknown future IDs get a safe neutral derived fallback and an audit warning, not a forced rewrite of their stored theme. Examples: Saudi green remains green with green-tinted glass; Egypt red/charcoal retains warm red focus; Madrid uses gold with a dark on-accent label; Miami uses pink/charcoal; GTA retains pink/violet. Blue/cyan is not a universal replacement accent.

For overlays and small body text, target at least 4.5:1 contrast; large text at least 3:1, with a clearly distinguishable focus border. These are design acceptance targets based on [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), not a claim of current WCAG certification. Test composited surfaces against bright/dark art and custom images, not only flat palette values.

## 6. Icons, typography, focus and motion

### 6.1 Icon system

- Extend the existing local SVG approach (`C.icon` and `assets/tvm-*.svg`). Use a 24/28-unit normalized grid with optical alignment and approximately 1.8–2 px stroke. No new icon-font or runtime network dependency is necessary.
- Reference-inspired icons use clean outlines, proportionate internal space and optional subtle tinted surfaces. Replace visually inconsistent emoji for app-owned actions incrementally; retain text labels and ARIA labels.
- Third-party app logos come from the real platform catalog or existing recognized brand assets. Use `contain`, preserve logo proportions/colors, never recolor the Netflix/YouTube/etc. logo into a generic glyph. Missing logos get a neutral initial/app fallback, not an unrelated brand.
- Left rail icons retain every existing action. The dock uses rounded, lightweight logo surfaces rather than reverting to large square tiles. Do not make both a logo and its wrapper separate focus targets.

### 6.2 Typography

Current TV shell uses Arial/Tahoma fallbacks; no bundled `@font-face` appeared in the inspected shell CSS. A premium font choice is still an asset/licensing decision. Keep existing fonts initially; evaluate a locally bundled licensed Latin/Arabic pair later with Chinese/Japanese fallbacks. No network font fetch in the TV launch path.

Proposed logical sizes: hero 56–72 px; page title 40–48; section title 30–34; primary control/body 26–30; secondary metadata 22–24. Avoid critical labels below 22 px at the 1080p logical baseline. Verify at viewing distance on 720p output. Arabic needs appropriate line-height, not forced letter spacing; Chinese/Japanese need glyph and truncation checks.

Retain independent Arabic/English 90/100/110% presets. Current `text-size.js` rewrites CSSOM declarations and some inline styles with remembered base values. Modern must not multiply both token font sizes and the existing scaler. Choose one sizing boundary per rendering context; verify repeated applies do not compound. Keep provider titles, URLs and codes directionally isolated.

### 6.3 State definitions

**Focused** = current remote target; **selected** = active route/filter/theme; **pinned/saved** = persistent content state; **playing** = media state; **locked** = permission/entitlement state. These must not share one ambiguous glow. Focus always has a visible border, selected has a restrained fill/marker, and saved/locked have labeled badges.

### 6.4 Proposed motion specification

| Interaction | Full | Light / reduced motion |
|---|---|---|
| Focus ring/color | 100–140 ms, immediate target recognition | Immediate or ≤80 ms |
| Standard card focus | 140–180 ms; transform scale about 1.04 | Static ring; no scaling |
| Dock focus | 160–200 ms; scale 1.10–1.14, lift 8–12 logical px | Ring and selected surface only |
| Adjacent dock reaction | Optional ≤1.03 scale; never moves layout geometry | Off |
| Overlay appear | 160–200 ms opacity, at most 8 px translation | Instant/short opacity |
| Page transition | 160–220 ms opacity; no large horizontal fly-in | Instant/short opacity |
| Artwork change | 250–350 ms opacity, once loaded | Swap once loaded; no continuous crossfade |
| Celebration/reflection | Short, bounded; no permanent animated glow | Off |

Use `cubic-bezier(.2,.8,.2,1)` as a starting easing. Animate transform/opacity, not width, height, top/left, blur radius or scrolling layout per frame. Rate-limit repeated input without dropping OK/Back. Focus state must update before its decorative transition finishes. Honor existing Reduce motion independently of performance mode.

## 7. Floating dock and navigation architecture

Keep `#favourites`, existing pin IDs and catalog launch callbacks as the single data source. Modern changes its renderer/skin and focus presentation, not pin storage or business actions.

1. Render one button per actual shortcut plus existing utility entries. Preserve order, pin limits, app locks, time limits, Kids hide state and HDMI behavior.
2. Keep selected enlargement on an inner visual surface so measured button geometry stays stable. Reserve enough space for lift/glow; do not clip the ring with an overflow container.
3. Scroll only enough to reveal the focused button; preserve the last dock ID across modal/app return and profile changes. Do not center or rebuild all icons on every key repeat.
4. Retain long-OK AppActions and reorder release guards. Hide/move/pin remain discoverable; pointer hover must not steal remote focus.
5. Reflections, if enabled, are decorative clones without handlers/tab stops/labels. Full may show one low-opacity static reflection; Light disables it.
6. Keep physical left/right navigation consistent with visible order. The existing dock is deliberately LTR even when some surrounding Arabic text is RTL; do not blindly reverse it.
7. Header, left rail, content rows and dock are focus regions. Define deterministic links: Up from content to header, Left to rail where appropriate, Down to dock, Back closes top overlay before navigating/exit.

`TV/focus.js` is a spatial focus engine with scope, geometry, scroll reveal and specialized dock/settings/catalog hooks. IPTV/radio have their own move functions; Java players have native key dispatch. Share styling/contracts, not a replacement focus engine. Verify scale conversion wherever physical bounding boxes are applied to logical scroll offsets; Samsung adapter scrolling is a particular review point because it has its own reveal handler.

## 8. Internal-page redesign strategy

### IPTV

Use a common media page template: compact section navigation, readable category rail, stable content area, optional details pane and unobtrusive status. Movies/series use portrait cards; channels use logo/landscape cards. Keep current comfortable/compact density rather than one oversized grid. Details and unified search reuse existing data only. Continue-watching separates movies, episodes and live history explicitly. Search opens the device keyboard only on activation. Player controls gain shared spacing/icons without changing decoders, retries, cache or account behavior.

### Settings and Appearance

Use the reference's rounded navigation language on a quieter surface: category rail/list, title/description, then SettingsRows with value/toggle/selector. Each action remains one remote target. Long descriptions wrap in the panel without squeezing values. Preserve dynamic button IDs and SettingsNav registration. Theme gallery cards show real artwork, title, selected state and pack/Plus status separately. Existing Classic previews remain labeled Classic until Modern screenshots are approved. Phone image customization stays free and local-only, with complete-image preview and 1920×1080 guidance.

### Fitness

Apply shared hero/card/chip/dialog/KPI tokens. Keep `FitnessEngine`, Store and Audio untouched. Active workout prioritizes a stable timer and visible pause/exit, without background motion competing with the exercise image. Preserve the actual eight screens and exit dialog. Do not claim each program has only one workout or generate exercise artwork as part of this redesign.

### Radio, Prayer, Family and Kids

Radio adopts media cards/control strips. Prayer uses calmer theme-tinted cards, clear Arabic content and readable time/countdown values. Family PIN/time-up overlays remain high priority and must not become dismissible through UI switching. Kids uses friendly icon/color accents inside the same control system. Keep exclusive audio, Adhan/break overlay priority and media cleanup exactly as implemented.

### Phone connection and companion

Align tokens and state feedback at touch sizes without reorganizing the successful connection flow. Do not add account signup, extra approvals, new tokens or repeated pairing. Preserve LG developer-key and other platform paths as they currently function; a visual refresh does not remove genuine OS requirements. Native system keyboards, Wi-Fi settings and installers cannot be fully reskinned by web CSS.

## 9. Compatibility and performance plan

### 9.1 Verified engine facts

Samsung's official table maps Tizen 4.0 to Chromium M56 and Tizen 5.0 to M63. LG's official table maps webOS 5.x to Chromium 68 and webOS 4.x to Chromium 53. These justify conservative CSS/JavaScript baselines; transpilation does not polyfill browser APIs or modern CSS. Sources: [Samsung Web Engine Specifications](https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html), [LG Web API and Web Engine](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine).

The Samsung build intentionally transpiles to Chrome 56 and includes `tv-compat.js` plus legacy layout fallbacks. LG build targets Chrome 68. Android WebView version varies separately from Android API level. No physical platform is declared certified by this report.

### 9.2 Two visual performance levels

| Capability | Light Modern | Full Modern |
|---|---|---|
| Layout/art/fonts/features | Same approved composition, full image, readable fonts and all permitted app functions | Same |
| Glass | Opaque/tinted translucent gradients; no backdrop blur required | Optional capability-tested small-panel blur |
| Focus | Strong static border and selected fill | Border plus restrained scale/lift/halo |
| Dock | Floating surface, contained real logos, no reflections | Optional static reflection and gentle neighbor response |
| Background | Single complete image, static gradient scrim | Same complete image, optional brief transition |
| Effects | No particles/continuous equalizers/decorative animation | Bounded effects only while relevant |
| Media/timers | Identical existing engines and controls | Identical |

Keep existing `auto/light/full` values. Automatic chooses a visual tier from existing device/performance signals; it must not gate functional features. Performance settings are not a Plus license. Light and Full should be explicit choices rather than two separately installed applications.

### 9.3 Rendering constraints and budgets

- Baseline must work without `backdrop-filter`, CSS Grid where legacy fallback is active, flex gap, CSS `inset`, `:has`, `color-mix`, container queries or cascade layers. Use compatible declarations/fallbacks; do not assume latest desktop Chromium.
- Avoid a new SPA framework, animation library, carousel dependency or global icon font. Existing plain JS/SVG/CSS is sufficient.
- Reuse `MorphScreenFit`; apply scaling exactly once. Do not multiply by devicePixelRatio or stack CSS zoom and transforms. Test actual 1280×720, 1366×768, 1920×1080 and 3840×2160 viewports, including browser zoom/keyboard changes. IPTV/radio have their own viewport/layout path, so validate them separately.
- A decoded 1920×1080 RGBA image costs about 7.9 MiB; 4K about 31.6 MiB before additional browser/GPU overhead. Compressed WebP byte size alone does not bound runtime memory. Prefer 1080p artwork on the logical canvas unless an actual 4K quality tier is justified.
- Lazy-load offscreen logos/posters; keep only selected/nearby detail art prepared. Maintain existing paginated catalogs; do not render a complete provider library just to animate scrolling.
- No synchronous palette sampling/canvas analysis on each focus move. Compute theme roles on theme/config change, cache them, and update only affected styles.
- Proposed device acceptance targets: focus response p95 under 100 ms on target hardware, no repeated long main-thread stalls over 50 ms during ordinary focus movement, stable memory after repeated open/close, and no retained media/DOM/listener growth across 20 cycles. These are targets requiring measurement, not current benchmark claims.
- Full effects are capability/performance dependent. If unsupported, render the same visual identity using Light surfaces; never lose focus visibility or a menu.

## 10. Proposed implementation architecture and file impact

All filenames in this section are proposals, not files implemented by this audit.

### 10.1 Small reusable presentation layer

| Proposed addition | Responsibility |
|---|---|
| `TV/ui/ui-mode.js` | Validated Classic/Modern selection, default/rollback, mode-change event; does not own themes/accounts |
| `TV/ui/theme-adapter.js` | Map all theme identities/custom permitted overrides to complete semantic tokens |
| `TV/ui/tokens.css` | Compatible defaults, typography/spacing/radii/elevation roles |
| `TV/ui/modern-shell.css` | Scoped header/left rail/artwork/dock composition; no business handlers |
| `TV/ui/components.css` and small `components.js` | SettingsRow, buttons, chips, app/media cards, badges, dialogs, status/empty/error blocks |
| `TV/ui/motion.css` | Explicit Full/Light/reduced-motion effects and fixed timing tokens |
| `TV/ui/focus-skin.css` | Visible focus/selected/saved/locked presentation; existing focus algorithms remain |
| Media UI adapter loaded in IPTV/radio | Resolve same mode/theme/performance tokens through existing parent/native settings channels |
| Module-scoped Modern styles | IPTV, Fitness, Prayer, Radio, Kids and companion templates; avoid one global selector file |

Use a root attribute such as `data-ui-mode="classic|modern"`. Namespace every new Modern selector. Do not rely on `@layer` because baseline engines are old. Prefer a bounded Modern stylesheet branch plus explicit token imports over hundreds of new `!important` overrides.

### 10.2 File-level impact matrix

| Existing files | Expected later impact | Boundary |
|---|---|---|
| `TV/index.html` | Load shared presentation assets in stable order | Keep existing route/control IDs and script initialization order |
| `TV/app.js`, `core.js` | Add validated mode setting/default/read path and minimal presentation hooks | Do not rewrite profiles, pins, theme reset semantics or business handlers |
| `TV/dock.js/css`, `home-reference.*`, `sidebar-icons.css` | Scoped Modern dock/header/rail skin; limited renderer hooks if needed | Preserve reorder, real app IDs, hidden destinations and launch callbacks |
| `TV/settings-nav.js/css`, `text-size.js` | Register mode/performance controls, Modern settings layout and one text-scale boundary | Preserve all nine categories and selector-based action placement |
| `TV/style.css`, `plus-themes.css` | Document/extract visual responsibilities gradually; leave Classic branch stable | Do not delete theme exceptions until all matching Modern variants are verified |
| `TV/boot-theme.js` | Prevent startup flash for chosen mode/token background | Preserve early theme loading and fallback |
| `IP/*.css`, `tv-library.js`, `cinematic*.js`, `media-theme.js` | Scoped media templates/token adapter; only necessary DOM presentation hooks | Keep `app.js` provider/cache/history flow and bridge API stable |
| `RA/*.css`, theme adapter | Consistent cards/player/search skin | Keep station IDs/audio logic |
| `FIT/fitness-ui.js`, `fitness.css` | Presentation/markup/icon changes only | Keep engine/store/audio/data/i18n untouched unless a narrow display contract is required |
| `TV/prayer.css`, family/Kids/support/Plus styles | Scoped component adoption | Timed overlays, licensing and media ownership remain unchanged |
| Android Java UI classes | Optional later styling helpers for app-owned native dialogs/player controls | No decoder, retry, seek, credentials, network or parental enforcement rewrite |
| `android-tv/build.py`, `mobile-app/build.py`, `webos-app/build.py` | Copy shared assets into all contexts; keep platform transpilation/fallbacks | Generated build output is not the source of truth |
| `PHONE/` presentation files | Companion mode/performance controls and consistent preview/state tokens | Do not change pairing/remote/install protocols |
| Preview manifest/assets | Later label/supply approved Modern screenshots | Existing previews/art assets stay intact; no generation now |

### 10.3 Leave business logic untouched

No redesign-driven rewrites of `Xtream`, credentials/Vault, M3U parsing, `CatalogDisk`, `IptvStore`, playback history/memory, decoder/retry/sizing/seek policy, `PhoneLinkServer`, LAN authorization, Samsung remote/certificate/SDB flows, LG discovery/install/control/inspector protocols, updates/signatures, prayer calculations/timezone/native Adhan, `FitnessEngine`, `FitnessStore`, `FitnessAudio`, Plus APIs/payment terms, `AppLocks` or `ParentalTimer`. If a display-only native helper is necessary, isolate it from these state machines and review it separately.

## 11. Safe migration: Classic/Modern plus Light/Full

### 11.1 Settings model

| Setting | Choices | Meaning |
|---|---|---|
| Interface | Classic / Modern | Existing presentation versus reference-inspired presentation |
| Performance | Light / Full, existing Automatic retained | Effect cost, not feature availability |
| Reduce motion | Existing on/off behavior | Independent accessibility preference; overrides animation in either interface |

Recommend Classic as the initial default for existing installations and Modern as opt-in until acceptance. New-install default can be decided after hardware testing. No Plus requirement should be invented for UI mode; existing theme/Fitness licensing remains unchanged.

Store the validated mode alongside current viewer settings, default missing/invalid values to Classic, and expose it through existing configuration channels with capability/version checks. Older clients must safely ignore it. Keep performance's current persistence model. Switching modes does not select another theme, erase custom art, clear accounts/history/cache, duplicate pins or require re-pairing.

Switch at a safe Home/Settings boundary. During active player/workout/Adhan/parent enforcement, defer presentation replacement until the existing flow exits rather than rebuild live controls or reset the engine. A local fallback to Classic must remain available if Modern initialization fails. Do not bypass a lock or stop timed enforcement as part of fallback.

### 11.2 Six phases

| Phase | Work and expected files | Dependencies / risks | Acceptance gate |
|---|---|---|---|
| 1. Shared system/theme mapping | Proposed `ui/*`, mode setting, token adapters and build asset inclusion | Need 28-theme matrix, single font-scale boundary, Classic scoping; cross-document token propagation | Every theme retains identity/art/entitlement; Classic screenshots/data unchanged; both performance tiers render without unsupported CSS |
| 2. Modern Home/dock | Header/status cluster, full-screen art, left rail, dock, recents/source cards; shell/dock/reference files | Spatial focus, logo identity, clipping, scale and translated header width | Reference composition approved in Arabic/English; all existing left actions reachable; complete images visible; reorder/long OK/Back retained |
| 3. Settings/Appearance | SettingsRows/category layout, mode/performance controls, theme gallery/preview and Plus status | Dynamic SettingsNav placement, native dialogs, pack state/focus restoration | Every existing setting action retained; Light/Full explicit; all 28 themes accessible according to current license; active Plus clear |
| 4. IPTV | Tokenized Home/live/movie/series/detail/search/favorites/EPG/account/player presentation | Highest account/media/focus regression risk; separate platform players | Same provider requests, sources/accounts/cache/bookmarks/history; public/personal preserved; native keyboard activation correct; media/Back/error tests pass |
| 5. Fitness/remaining modules | Eight fitness screens; Radio, Prayer, Duas, Family, Kids, help/support and companion presentation | Timers/audio exclusivity/overlay priority; incomplete exercise art | Workout exit/back/history unchanged; Adhan and parent enforcement remain authoritative; Kids hide/restore/media cleanup; pairing flow unchanged |
| 6. Platform QA/refinement | Hardware screenshots/profiling, compatibility fallback validation, preview updates, rollback rehearsal | Real older Tizen/LG/Fire hardware required; emulation is insufficient | Acceptance checklist below passes; owner approves before redesign release |

Each phase should be separately reviewable. Do not deploy a partly styled global Modern interface merely because Home looks correct. Feature flags may keep unfinished module presentation in Classic temporarily, but label this honestly and do not declare cross-app completion until every inventoried surface is covered.

## 12. Risks, mitigations and evidence gaps

| Risk | Mitigation |
|---|---|
| Theme identity collapses to generic blue/dark | Explicit 28-theme mapping, per-module visual matrix, immutable original artwork/pack IDs |
| Left rail loses actions to match sample | Inventory-based destination checklist; route/ID preservation; reference controls are styling, not permission to remove functionality |
| Full-image request conflicts with arbitrary aspect ratios | Proportional complete-image fit and theme-colored edge fill; no silent crop or stretch |
| CSS specificity leaks into Classic | Mode-scoped styles, bounded imports, before/after snapshots and configuration/data checks |
| Two visual modes duplicate business logic | Same action handlers/stores/bridge API; presentation adapters only |
| Modern text gets scaled twice | One scale boundary per context; repeat-apply and language-switch checks |
| Blur/large bitmaps freeze older TVs | Light as first-class presentation, bounded image decode sizes, no mandatory blur/continuous effects |
| Focus follows transformed geometry unpredictably | Stable focus button bounds, inner visual scaling, explicit region links and scroll-scale review |
| Re-render resets playback/workout or timer | Never reconstruct live engines on focus/theme events; defer mode switch at unsafe lifecycle points |
| System UI cannot match web styling | Scope promises to app-owned UI; retain OS keyboard/settings/installer screens |
| Preview or READMEs misrepresent actual support | Separate generated preview from hardware proof; update stale docs in implementation phase |
| Asset/branding license or font gaps | Preserve existing credit metadata, obtain appropriate font/logo/art permissions before adding assets |

### Missing information/assets before implementation acceptance

- Owner approval of this plan and the first Modern Home/Settings examples; no additional explanation is needed to begin phase 1 once implementation is explicitly requested.
- Hardware access/model/OS/firmware details for at least an older Tizen 4 test unit, standard Tizen 5+ unit, LG webOS 5+ unit, low-memory Android TV and Fire TV. The earlier zoom-report model is unavailable.
- Approved premium font assets/licenses covering Arabic/Latin with CJK fallbacks, if typography beyond current system fonts is desired.
- Exercise-specific Fitness pictures remain pending. Use current category art honestly until supplied.
- A vector MorphTV brand mark is useful if the reference's stylized M should replace the current logo; do not invent or replace it without approval.
- Confirm new-install Classic/Modern default after testing. Existing-install Classic default and Light/Full preservation are the recommended safe starting point.
- Actual test provider streams/accounts must be entered privately on a test device; never include subscription secrets in this report or screenshots. No need to change production credentials for a visual audit.

## 13. Concrete acceptance checklist

### Scope and data

- [ ] Classic/Modern use the same accounts, themes, pins, recents, bookmarks, fitness records and pairing data.
- [ ] Changing UI/performance mode does not trigger theme reset, remove personal art or re-pair devices.
- [ ] All actual inventory entries are covered or explicitly marked pending; no invented sections/Trending data.
- [ ] Every existing left-side action remains reachable, with its platform capability handling intact.
- [ ] No changes to payment terms, licensing checks, parental enforcement or media state machines.

### Visual and theme coverage

- [ ] Home matches the approved composition: top navigation, right search/network/weather/clock, slim left rail, cinematic complete image, content row and floating dock.
- [ ] Background image is complete and undistorted; no cropped subjects; nonmatching ratios have coordinated edge fill.
- [ ] All 28 themes retain original art, branding and distinct color identity across Home, Settings, IPTV, Fitness and other modules.
- [ ] Third-party app logos retain proportions/colors and correspond to real available apps.
- [ ] Focus, selected, pinned, playing and locked states are visibly distinguishable.
- [ ] Arabic/English small/current/large sizes fit; French long labels and Chinese/Japanese glyphs render without clipped primary actions.
- [ ] Overlay/body text contrast is checked against bright/dark art and user images.
- [ ] Classic preview assets are not presented as completed Modern previews.

### Remote and lifecycle

- [ ] D-pad/OK/Back reach all header, sidebar, content, dock, dialog and pagination controls.
- [ ] Modal close restores the exact previous focus where possible; invalid targets fall back safely.
- [ ] System keyboard opens on activation, not simple focus; cancel/submit/return remain correct.
- [ ] Long OK/reorder/favorite actions never accidentally launch or play content.
- [ ] Workout pause/exit/back/completion/history and timer continuity pass.
- [ ] Live/movie/episode progress and history stay distinct; saved personal IPTV survives public selection.
- [ ] Android/Samsung/LG player controls, failure/retry and Back retain existing behavior.
- [ ] Adhan, prayer break, parent time-up and exclusive audio keep their priority.
- [ ] Kids pin hide/restore and playback teardown work; USB insert/remove does not leave stale focus/entries.

### Performance and release

- [ ] Light and Full have the same functional features and content; only visual effect cost differs.
- [ ] Automatic and Reduce motion preferences still work and persist.
- [ ] Older-engine fallback runs without mandatory blur/new CSS/browser APIs.
- [ ] 720p, 768p, 1080p, 4K, zoom and keyboard viewport states do not clip the interface.
- [ ] Hardware focus timing, scroll smoothness and repeated-open memory behavior meet the agreed budgets.
- [ ] Existing relevant browser/native fixture tests pass; physical testing is recorded separately from mocks.
- [ ] Phone packages embed matching TV builds; signing continuity and rollback installation are verified.
- [ ] Owner reviews screenshots/device output before any Modern redesign deployment.

## 14. Audit evidence and reproducibility

The audit read canonical shell, settings, focus, dock, theme definitions/loaders, IPTV/radio templates/controllers, fitness engine/store/UI/audio, prayer/family/Kids modules, native activities, phone presentation/bridges, platform adapters and build scripts. Generated copies were used only to understand delivered contexts, not as canonical editing targets. Existing tests and earlier release captures were inspected as supporting evidence; they do not constitute new physical-device certification.

Source fingerprint taken during the read-only audit: **267 source/config files**, excluding `build`, `tests` and `vendor` directories, across `tv-project/app`, `android-tv`, `mobile-app`, `webos-app`, `android-legacy`; SHA-256 aggregate **`d633912e667c092491c69175cdaadcef6297037fadc5ab332288920c3056b822`**. The aggregate includes each sorted relative path followed by file bytes for `.js/.css/.html/.java/.py/.xml/.json`. This report is outside that set.

Official compatibility/contrast sources consulted on the audit date are linked in sections 5 and 9. All proposed components, budgets, dimensions and phases are recommendations, not already implemented features. The next authorized deliverable would be phase 1 and reviewable Modern examples while retaining Classic; this audit itself changes no application UI.
