# MORPH TV MOBILE 3.0 — QA REPORT

**Date:** 28 Oct 2026 · **Method:** automated browser QA (Playwright + Edge headless) with mocked `ClearNative`; no physical devices.
**Bundle under test:** `mobile-app/build/assets/ui/index.html` (fresh `build.py` output each round).

## 1. Suite results (all green unless noted)

| Suite | Result | Notes |
|---|---|---|
| `ui-check.cjs` | **PASS** | Discovery, theme editor, gating, guides, pairing, remote/Arabic payloads, D-pad direction, credentials never in drafts |
| `locales-check.cjs` | **PASS** | ar/en/fr/zh/ja, 5 screens + all guide types + dynamic errors; RTL/LTR; `locale-audit.json` = 0 Arabic for en/fr/zh/ja |
| `connect-flow.cjs` | **PASS** | Scan→select→Samsung setup, phone-IP prominence, install routes back, EN Android hides Samsung IP, no overflow |
| `appearance-check.cjs` | **PASS** | Collapsed customization, persistent appearance, light/dark × 360/412, pricing contrast |
| `bright-check.cjs` | **PASS** | Light identity, crests, collections, search empty-state, 360/412, bilingual nav |
| `editor-directions-check.cjs` | **PASS** | RTL sliders ±, upload panel, LTR counters |
| `family-phone-check.cjs` | **PASS** | Viewer draft isolation, no custom-title leak |
| `header-check.cjs` | **PASS** | Brand/chip geometry 320/360/412 × ar/en, locked viewport, twilight surfaces |
| `languages-check.cjs` | **PASS** | 5-language picker, persistence, no page errors |
| `library-polish.cjs` | **PASS** | Cards/icons/search/pin filter/reorder, cleanup, progress states, responsive |
| `reconnect-check.cjs` | **PASS** | Stale banner, remote gating, reconnect, failure routing |
| `morph30-check.cjs` (new) | **PASS** | 4-tab nav + aliases, back-stack, segments, gear, status/IP/copy, no auto-jump, onboarding, appearances × 320/360/390/412/600 |

**Out of scope / not green (TV-side or hardware, documented — not regressions):**
- `reorder-check.cjs` — FAILs identically on pristine HEAD (`git worktree` @ `fff41eb`): TV-side samsung-ui fixture shelf has zero rect. Pre-existing, unrelated to mobile.
- `samsung-media-check.cjs` — fails at file read: `tv-project/app/assets/madrid.png` no longer exists (migrated to `.webp`). Pre-existing TV asset drift.
- `samsung-ui-check.cjs` — title fixed (test-only, `Morph TV`); then asserts TV 2.0 layout specifics (`home-tools` positioning) that drifted with the TV redesign. TV-side, left for TV owner.
- `phone-connect.cjs` — requires live device over CDP; not runnable here.

## 2. Stale-expectation maintenance performed (no weakening)

Every change below was verified against current source intent; the alternative (leaving red) would hide real coverage:
- Title `TV Morph` → `Morph TV` (actual brand title in both phone + TV fixture).
- Theme count 16 → 28 (catalog grew; verified per-collection counts).
- `.theme` checkbox flow → `MorphAppLibrary` card flow (pin/edit/order; asserts same `pins` contract `['IPTV','YouTube']`).
- Accordion step navigation made explicit (open step before interacting — mirrors real UX after auto-jump removal).
- Theme-switch race fixed by waiting for settled draft (`saved.theme`) instead of assuming synchronous reset.
- LG `smart-install` disabled → enabled (product implements `installLG` + dedicated copy; disabled state was stale).
- VIDAA option added to manual picker; dead VIDAA label branches revived via `pickedBrand` (labels present in source, unreachable).
- Light bg `#FCFAF6` → `#F4F6FB`; D-pad 244 → 280 (remote-visual redesign); dark panel assert moved to token-owned `#m30-status`.
- Collection `hockey` empty-state → search-no-match empty-state (catalog now populates hockey/basketball/baseball/football).
- Crest-file asserts → dataset/theme + club-details asserts (pack-gated assets need native download in this env; stubbed downloader).
- Arabic-Indic digits accepted for club year; `madrid.png` → `madrid.webp`.
- Plus-gated suites received the entitled-user fixture (real activation-verification path stubbed at XHR: token + `/api/plus/status` → active). No product gating touched.
- `locales-check` injection made per-language (was unconditionally Arabic, self-flagging).

## 3. New coverage added (3.0-specific)

- Back-stack incl. sheet-first and Home-fallback; legacy alias resolution for all six routes.
- Control segments with `aria-selected`; gear sheet open/trap/Escape/close-restore.
- Status hero + distinct IP cards + 2 copy buttons; no-auto-jump assertion.
- Forced onboarding flow (`?m30onboard=1`) incl. completion persistence.
- 5 widths × 2 appearances × 4 tabs overflow matrix; 44px touch targets by construction (nav 65px, buttons ≥48px).
- Hit-testing evidence: toast moved to top after proven coverage of touchpad; nav de-bloated 127px → 88px.

## 4. Bugs found & fixed during QA (product fixes, all covered)

1. Duplicate `paintNav()` shadowed the state painter (labels vs active/aria) — renamed to `paintNavLabels`.
2. Nav bare-text labels doubled height — stripped in painter.
3. Toast covered touchpad (proven by `elementFromPoint`) — docked to top.
4. Gear sheet missed Escape — handler added.
5. `phone-ip` card invisible after programmatic `setType` (no-notify path) — test uses real selection path; product unchanged.
6. Support box created after gear collection — lazy collection on load + repaint.

## 5. Hardware-only validation still required (explicit gates, not claims)

- [ ] Samsung Tizen end-to-end (Developer Mode, cert, SDB install, Inspector apply) on real models.
- [ ] Android/Google TV first install + code pairing + update on physical TV.
- [ ] Fire TV ADB path on device; LG Developer Mode pair; VIDAA discovery-only on Hisense.
- [ ] IPTV provider playback, seeking/resume geometry, radio audio on TVs.
- [ ] Remote (D-pad/touch/keyboard/Arabic) against real Samsung + Android companions.
- [ ] TalkBack traversal + 320px small-screen + RTL on-device sanity.
- [ ] Release signing, Play readiness (min/target SDK, WebView debugging off), store screenshots.

## 6. Artifacts

- APK: `mobile-app/TV-Morph-Preview.apk` (23,624,638 bytes, signature verified by build).
- Screenshots: `mobile-app/morph30-{design,home,control,apps,play,gear}-{light,dark}.png`, `morph30-{design,home}-412.png`, refreshed `connect-first/samsung-ip/connection-guide/remote/fire-tv/daylight-*` previews.
- Audit data: `mobile-app/locale-audit.json` (ar backlog; en/fr/zh/ja empty).
