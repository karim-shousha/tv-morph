# MORPH TV MOBILE — FULL UX/UI AUDIT

**Date:** 28 Oct 2026 · **Scope:** `mobile-app/` only · **Method:** source-code audit (no app code modified) · **Baseline:** `AndroidManifest.xml` v0.8.170-preview, `index.html` Preview 0.8.68
**Relationship to prior work:** `MORPHTV_UI_2.0_AUDIT_AND_PLAN.md` (27 Oct 2026) covers the TV shell/Home/IPTV/Radio/Fitness. This report covers **only the Android phone companion**. No findings here change TV contracts.

---

## 1. What the mobile app actually is (verified)

- **Host:** single-Activity portrait WebView app. `MainActivity.java:17-22` — `MainActivity` (package `local.cleartv.mobile`, `singleTask`, `portrait`, `supportsRtl=true`), loads `file:///android_asset/ui/index.html`, bridges via `ClearNative.request(id,action,payload)` → `window.nativeResult` / `window.nativeProgress`.
- **Web layer:** ~40 JS + 12 CSS files concatenated via `<script>`/`<link>` in `assets/ui/index.html:2,48`. No framework, no router, no bundler at runtime. Build-time only: `mobile-app/build.py` copies `locale.js`, `tvmorph.webp`, TV library (`android-tv/iptv`, `radio`), Samsung `tv-app.zip`, `android-tv.apk` + `lg-preview.ipk` into `assets/`.
- **Native responsibilities (`MainActivity.java:run()`):** discovery (`scan`, `connect`, `compatibility`), Samsung SDB/Inspector install + `apply`, Android-TV pairing/token/config (`pairAndroid`, `apply`, `pins`, `open`, `updateAndroid`, `shareAndroid`), LG discovery-only, DLNA, `remoteKey`/`remoteText`, `iptv*` proxy, `parental*`, `familyProfiles`, `phoneIptv*`, `installThemePack`, image picker, support/download-center intents.
- **TV relationship:** phone is **Studio + Installer + Remote + Broker**. It never renders TV directly; it validates a draft (`config()`) and pushes via Inspector (`Samsung`) or `/config` (`AndroidTV`). Stream URLs and credentials stay in native/Vault, never in `localStorage` (verified in `ui-check.cjs` assertions). Shared with TV: `locale.js` (+ `MorphLocale`), branding `tvmorph.webp`, IPTV/radio library UI, `home-shelves.css`, `tv-compat.js`, `LanHttp.java` framing.

> Assumption flagged as verified: every screen below was read in `index.html`, not inferred from filenames.

---

## 2. Complete screen inventory (6 pages, 1 global chrome)

Navigation primitive is `show(name)` in `app.js:13-15` — toggles `hidden` on `.page` sections + `.bottom-nav .active`. No deep links, no per-screen URLs, no scroll restoration (`history.scrollRestoration='manual'`).

| # | Page (`id`) | Bottom-nav? | Default? | Contents (element IDs) |
|---|---|---|---|---|
| G | Global chrome | — | always | `header .brand + #device-chip[data-page=connect]`, `.language-row #app-language #app-appearance`, `#reconnect-notice`, `footer` credits + version, overlays `#operation`, `#toast`, JS language dialog `#language-dialog` |
| S1 | `page-studio` | ✅ `studio` (active at boot) | YES | `.studio-banner + .banner-action[data-page=connect]`, `.studio-shortcuts` 4× `[data-page=cast/connect/apps/remote]` (+JS-injected `#studio-parental`, Plus upsell), `details#family-panel`, `#preview` + `#club-details`, `details#theme-library` (`#theme-search`, 12× `#theme-collections button`, `#themes`, `#collection-empty`, `.theme-pricing`), `section.font-size-panel`, `details#personal-touch` (custom title/subtitle, 6 offset sliders, 2 tint colors, glass, logo/art pickers, 4 hero sizes, 4 theme colors, card width, 3 visibility toggles, slideshow), `details.panel.about-us`, `#apply`, first-time CTA `[data-page=connect]`. JS injections: `parental.js #phone-parental`, `packs-phone.js #phone-theme-packs`, `support.js .morph-support`, `plus-phone.js` upsell, `customization-sections.js #free-theme-image` |
| S2 | `page-connect` | ✅ `connect` | — | `.connection-card #scan + #devices`, `#manual-type-toggle + #manual-system-panel #device-type #type-description`, `#connection-state`, `#install-card` (`#download-center`, `#platform-package`, `#public-tv-url`, `#smart-install`), `#android-pair` (`#pair-code`, `#pair-android`, `#share-android`, `#download-box #download-url`), `.panel.manual` (`#tv-ip`, `#connect`, `#connected-device`), guide (`#guide-count/dots/kicker/title/text/phone-card/prev/next/check`), `details.troubleshoot`, `details.compatibility`, `.phone-ip #phone-ip`, hidden legacy `#install` |
| S3 | `page-apps` | ✅ `apps` | — | `#refresh-apps`, `#apps-empty`, `#app-list`, `#save-pins` |
| S4 | `page-remote` | ✅ `remote` | — | `#remote-device`, `#remote-mode`, `#remote-connect`, `#remote-status`, `#remote-pad-mode / #remote-touch-mode`, `#touchpad`, `.remote-pad` 5 keys, 4× `.remote-row` (SETTINGS / RETURN+HOME+SOURCE / VOL×3 / PLAY+PAUSE+CH×2), `#remote-text`, `#remote-send` |
| S5 | `page-iptv` | ✅ `iptv` | — | `#iptv-destination-intro`, `#iptv-account-state`, `#iptv-phone-open`, `#iptv-tv-show`, `#iptv-source-current`, `#iptv-public-card` (phone/tv), `#iptv-personal-card + #iptv-form-details` (type/server/user/password/name/format/live/vod/series/save/connect), `details#iptv-tv-controls` (open/refresh/tabs/category/search/list/pager/clear/note) |
| S6 | `page-cast` | ❌ hidden (only via `data-page=cast` shortcuts) | — | `#cast-title/intro/open/steps/stop/status`, `#cast-difference`, `#dlna-panel` (scan/devices/url/kind/send/play/pause/stop/status), `#cast-back[data-page=studio]` |

**Route table:** `data-page` values = `studio, connect, apps, remote, iptv, cast`. `connect-flow.js` additionally reparents Connect DOM into 4 pseudo-steps (Find → Choose → Prepare → Install) via `<details>` accordion + `MutationObserver`. `handleBack` (`app.js:16` + `MainActivity.java:onBackPressed`) only closes `#operation` or returns to `studio`; it does **not** walk page history.

---

## 3. UX audit — findings by severity

### CRITICAL (blocks first-time success)

| ID | Problem | Evidence | Impact |
|---|---|---|---|
| C1 | **Two IPs, one screen, opposite meanings.** Phone IP (enter into TV as Host PC IP) and TV IP (enter into phone) appear on the same page with similar styling. | `index.html:19,24` + `connect-flow.js` adds `setup-tv-help/setup-phone-help` as a patch. Bilingual IP-reversal warning block is long and easy to skip. | Samsung setup fails; #1 support risk. |
| C2 | **Connection ≠ setup completion, but UI implies progress.** Guide steps advance locally; `connection-state` only confirms after explicit check. Auto-jump (`open(2)` on discovery, `open(3)` on `detected/connected`) yanks users mid-read. | `connect-flow.js:render()`, `guide.js`, `ui-check.cjs` asserts `guide-check` only on last step and `connection-state !== connected` after guide. | False confidence → "installed but not connected". |
| C3 | **Hidden 6th page (Cast/DLNA).** No bottom-nav entry; reachable only via Studio shortcut. Contains two unrelated systems (Miracast mirroring + DLNA URL push) that both compete with `smart-install`. | `index.html:34,47`, `cast-screen.js:14-15` explicitly lists non-features users must read to disambiguate. | Undiscoverable; confused with install. |
| C4 | **Back button never goes back.** Hardware back always lands on Studio (or exits), never to previous tab. No breadcrumb, no per-page title persistence. | `app.js:16`, `MainActivity.java:onBackPressed`. | Users get lost; violates Android expectations. |
| C5 | **Three "look" systems with no map.** App appearance (chrome) vs TV theme colors vs downloadable theme packs live in different sections with overlapping vocabulary. | `appearance.js` vs `customization-sections .custom-colors` vs `packs-phone.js`; `packs-phone` hides `.theme-pricing` instead of removing it. | Users theme the wrong surface. |

### HIGH (major confusion / extra steps)

| ID | Problem |
|---|---|
| H1 | **Studio is overloaded:** banner + 4 shortcuts + family profiles + live preview + 12-collection library + font-size + 30-control Personal Touch + packs + parental + support + about + apply + first-time CTA on one scroll. At 412px this is ~10+ viewport heights. |
| H2 | **Personal Touch mixes free + Plus-locked + TV-only controls** with no gating explanation. Layout offsets (±25%), hero sizes (70–125%), glass opacity, slideshow, color pickers all flat-listed. `customization-sections.js` moves DOM at runtime, breaking mental model + CSS assumptions. |
| H3 | **Remote gating is invisible until tap.** `data-native-only / data-volume / data-library-only / data-playback` disable keys per platform (`app.js:58`), but disabled reasons live in a single `fine` paragraph (`index.html:31`). Touchpad vs D-pad is a tab with no capability hint. |
| H4 | **IPTV dual-destination model unexplained.** Phone playback vs TV controls, public vs personal sources, `Vault` vs TV store — copy stresses differences (`iptv-phone.js`) but page presents all cards + open form + collapsed TV controls simultaneously. Password field correctly `type=password` and excluded from `saved` draft, but distinction is textual only. |
| H5 | **Terminology drift (5 locale systems in conflict).** `Morph TV` / `TV MORPH` / `TVM-IPTV` / `Morph IPTV` / `ClearTV`; `TV address` vs `Phone address` vs `Host PC IP`; `Install and pair` vs `Smart install` vs `Cast Screen` vs `DLNA Send`; `FREE / Included / Downloaded / PLUS`. `locale.js` auto-translate + per-file `words{ar/en/fr/zh/ja}` + `lang`-attribute checks fight each other; `de/es` only in `phone-iptv.js`, `zh/ja` missing in cast/DLNA. |
| H6 | **Icon language is ASCII/emoji, not icons.** `◐ ▣ ▦ ⌘ ▶ ▲ ◀ ▶ ▼ ⌖ ⚙ ↩ ⌂` in bottom-nav, shortcuts, D-pad. `remote-visual.js` injects inline SVG for only 16 keys + bottom-nav; no shared icon contract. |
| H7 | **Connect page order fights itself.** Scan → devices → manual toggle → connection-state → install-card → android-pair → manual IP → guide → troubleshoot → compatibility → phone-IP. `connect-flow.js` re-sorts into steps at runtime, so DOM order ≠ visual order ≠ screen-reader order. |

### MEDIUM (polish / consistency / a11y)

| ID | Problem |
|---|---|
| M1 | Typography: single stack `Tahoma, Arial` everywhere; `h1` 34–42px with 1.5 line-height crowds Arabic; no type scale. `fontSizeAr/En` only affects preview, not app chrome. |
| M2 | Touch targets: bottom-nav buttons `min-width:48–85px` with 10px labels (small for Arabic); theme grid cards dense; `.text-button` links ~11px; color inputs 30px; range sliders full-width but no numeric stepper for precision. |
| M3 | Light/dark/twilight = 3 overlapping systems. `style.css` + `appearance.css` + `bright.css` + `remote.css` + `remote-visual.css` + `connect-flow.css` + per-page CSS = 12 stylesheets with `!important` overrides and duplicated dark/light blocks. |
| M4 | Empty/loading/error states inconsistent: `#apps-empty` + `#collection-empty` + `#art-preview[hidden]` + `#reconnect-notice` + `#operation` modal + `#toast` + `role=status` fragments each styled differently; `dlna-status`/`remote-status`/`family-status`/`phone-update-status` don't share a pattern. |
| M5 | Support/donation entry points duplicated: `.morph-support` (Studio, Arabic-only, hardcoded Stripe/PayPal) vs `welcome-support.*` vs footer credits vs `contact.js` (missing on disk but referenced). Privacy note duplicated in `customization-sections.js` + store copy. |
| M6 | Settings scattered: language+appearance in header row; font-size in Studio; device-type + TV-IP + pair-code in Connect; remote-mode + pad/touch in Remote; IPTV type/format/toggles in Play. No single "Settings" home. |
| M7 | `device-chip` (header) duplicates bottom-nav Connect; Studio has 2 extra `data-page=connect` CTAs + 4 shortcuts that duplicate bottom-nav. 8 ways to leave Studio. |
| M8 | Accessibility: dialogs are `<details>`/`<div>`, not `role=dialog`; focus trap only in `phone-iptv.js` drawer; `aria-expanded` only on manual toggle; disabled buttons use `opacity` without `aria-disabled` explanation; `dir=auto` mixed with fixed `dir=ltr/rtl`. |

### LOW (minor)

L1 Footer version (`Preview 0.8.68`) drifts from manifest (`0.8.170-preview`). L2 5 scripts referenced in `index.html:48` missing on disk (`theme-packs-manifest.js`, `theme-packs.js`, `theme-preview.js`, `theme-preview.css`, `contact.js`) — dead references. L3 `guide-count` uses `١ / ٣` vs `1 / 3` inconsistently. L4 `header` fixed `direction:ltr` with Arabic labels causes chip truncation at 320–360px.

---

## 4. Visual design system audit

| Area | Current state | Verdict |
|---|---|---|
| Icons | ASCII glyphs + 16 inline SVGs (`remote-visual.js`) + CSS `:before` pseudo-icons (`remote.css`). No size/stroke grid; tone system (`cyan/orange/violet…`) lives in one file. | ❌ Replace with single SVG set |
| Typography | `Tahoma/Arial 10–42px`, no scale, no CJK tuning (`zh/ja` fall back to system). Arabic 1.9 line-height everywhere reduces scannability. | ❌ Define scale + Noto/Naskh pairing |
| Cards | 5+ card styles: `.panel`, `.connection-card`, `.install-card`, `.theme`, `.app-row`, `.iptv-item`, `.guide-phone-card`. Radius 10–24px, borders `ffffff12–25`, gradients per theme. | ❌ Unify to 2 card tiers |
| Buttons | `.primary` (filled) / `.secondary` (outline) / `.text-button` + inline overrides per page. `min-height 44–66px` good; disabled = `opacity .4` with no reason tooltip. | ⚠️ Keep pattern, fix states |
| Bottom nav | Fixed, 5 items, `11px/10px` labels, active = color only (light: bg pill; dark: bg pill; twilight: bg pill — 3 variants). No badges, no haptic, no long-press. | ⚠️ Keep position, enlarge + badge connection status |
| Headers | `.brand` + `.device-chip` + `.language-row` stacked; no sticky section headers; `h1` per page but no persistent title on scroll. | ❌ Add sticky contextual header |
| Spacing | `main` max-width 620/666px, `14–23px` padding, `112px` bottom clearance for nav. Section gaps `15–27px` inconsistent; Studio sections vary 20–25px. | ⚠️ Adopt 8pt grid |
| Color/theme | Warm light default + dark + twilight-blue overrides; `--paper/--ink/--muted` tokens exist but bypassed by hardcoded hex. Accent `#c9aff0/#6735bd/#c1dcff` per mode. | ⚠️ Tokenize, remove `!important` chains |
| Motion | `button:active scale(.985)`, spinner `spin .9s`, no page transitions, no skeleton shimmer, `prefers-reduced-motion` blanket-disables all. | ❌ Add purposeful micro-motion |
| States | Operation modal blocks all; toast bottom; `connection-state[data-status]` color-coded (idle/checking/connected/error/unsupported) — best pattern in app, should be reused. | ⚠️ Promote this pattern |
| Responsiveness | Tested 360/412px (`ui-check.cjs` asserts no overflow); `@media(min-width:650px)` centers; `@media(max-width:380px)` shrinks header. No tablet/landscape treatment (portrait-locked manifest). | ✅ Adequate for scope |

**Direction fit:** current skin is competent "dark dev-tool + daylight patch". Distance to *premium, futuristic, minimal, cinematic* = icon system + type scale + 2-tier cards + sticky header + status-driven color + restrained gradients (keep brand purple/mint/peach, drop per-card rainbow gradients).

---

## 5. What must NOT change (constraints)

- All features preserved; no deletions to "simplify".
- No TV-app changes; no backend/native contract changes (`ClearNative` actions, `/status /config /pins /open /iptv/* /remote/* /parental/* /profiles /theme-packs /update`, Inspector `applyRemoteConfig`, `ThemePacks.command`).
- No invented features (no checkout, no cloud sync, no new TV platforms).
- Brand (`Morph TV`, `tvmorph.webp`, purple/mint/peach) + `MorphLocale` 5-language system preserved.

---

## 6. Audit confidence

- **Verified from source:** all pages/IDs/routes/gating/bridge actions above (cited `file:line`).
- **Assumption (needs device test):** severity of IP confusion and guide auto-jump is inferred from code + copy; confirm with 5-user hallway test + Samsung/Android physical pairing before P0 sign-off.
- **Out of scope verified:** TV Home/IPTV-player/radio/fitness visuals are owned by `MORPHTV_UI_2.0_AUDIT_AND_PLAN.md`; phone changes must not fork `locale.js` or library UI.
