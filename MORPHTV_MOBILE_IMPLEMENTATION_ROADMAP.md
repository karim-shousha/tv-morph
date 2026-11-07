# MORPH TV MOBILE — IMPLEMENTATION ROADMAP

**Rule:** do not start until audit approval. P0→P3 sequential; each phase gates the next. No TV-app, contract, or data-model changes in any phase.

Conventions: **Complexity** S (<1d) · M (1–3d) · L (4–7d, one dev). **Regression risk** 🟢 low · 🟡 medium · 🔴 high.

---

## P0 — CRITICAL UX FIXES (ship first; no visual redesign)

Goal: stop users failing setup / getting lost. All changes are HTML/JS-reorder + copy, zero native changes.

| ID | Work | Files | Complexity / Risk | Acceptance |
|---|---|---|---|---|
| P0-1 | **Back-stack fix.** Implement tab history in `app.js` (`push/show/back`), keep `handleBack` bridge; Home (not Studio) as fallback; operation/sheet close first. | `assets/ui/app.js`, `assets/ui/index.html` (aliases) | M · 🟡 (touches global nav) | Back from any tab returns to prior tab; existing `ui-check.cjs` back assertions updated + pass |
| P0-2 | **IP disambiguation.** Split phone-IP vs TV-IP into two icon-tinted cards with copy buttons + "where to type" lines; collapse reversal warning to expandable. No logic change. | `index.html`, `guide.js`, `style.css` | S · 🟢 | Hallway test: 5/5 users type each IP in the right place |
| P0-3 | **Kill auto-jump.** Remove `MutationObserver` forced `open()` in `connect-flow.js`; guide advances only on user Next/device-select; discovery shows non-modal badge. | `connect-flow.js` | S · 🟡 (behavior change, easily reverted) | Reading step 1 uninterrupted while scan completes |
| P0-4 | **Single install action.** Hide legacy `#install` from a11y tree already hidden visually — remove node, keep handler; `#smart-install` disabled states carry inline reason per system (LG/VIDAA/other). | `index.html`, `app.js`, `compatibility.js` | S · 🟢 | No dead DOM; screen-reader finds exactly one install action |
| P0-5 | **Cast discoverability hotfix.** Add bottom-nav overflow OR Control-entry link: duplicate `data-page=cast` entry labeled Share inside Remote page header (no new page yet). | `index.html` | S · 🟢 | Cast reachable from Remote in 1 tap (interim until P1 merge) |
| P0-6 | **Reconnect + status parity.** `device-chip` shows dot + short name; `#reconnect-notice` CTA deep-scrolls to Status card. | `index.html`, `app.js`, `remote-visual.css` | S · 🟢 | Status visible without scrolling on every tab header |
| P0-7 | **P0 regression net.** Extend `tests/ui-check.cjs`: back-stack, single-install-action, IP-card copy, no-auto-jump, cast-from-remote. 360/412px overflow asserts kept. | `tests/ui-check.cjs` | M · 🟢 | `node tests/ui-check.cjs` green; screenshots `connect-first`, `remote` refreshed |

**P0 exit gate:** physical Samsung + Android pairing walkthrough (real TVs) confirms IP fix + back-stack; no new strings untranslated in `ar/en`.

---

## P1 — STRUCTURAL REDESIGN (IA + shared components)

Goal: 4 tabs + gear, ghost page eliminated, settings grouped. Largest diff, still web-only.

| ID | Work | Files | Complexity / Risk | Acceptance |
|---|---|---|---|---|
| P1-1 | **Tab restructure.** `studio→Design`, `connect→Home`, merge `apps+remote+cast→Control` (segmented Remote\|Apps\|Share), `iptv→Play`; keep `data-page` aliases 1 release; `show()` per-tab scroll memory. | `index.html`, `app.js`, all `*-phone.js`, `remote-visual.js` | L · 🔴 (touches every page + tests) | Every current `data-page` still resolves; new tabs ≤2 taps to any feature |
| P1-2 | **Static Home order.** Rewrite `connect-flow.js` as stepper over `guide.js` data; delete reparenting; DOM = visual = SR order; Advanced `<details>` for manual/troubleshoot/compat. | `connect-flow.js`, `guide.js`, `index.html`, `connect-flow.css` | M · 🟡 | axe/DOM-order check; no `MutationObserver` moves |
| P1-3 | **Design grouping.** Sticky preview + 6 accordions + unified Library (themes+packs); move Parental→Control, font-size/support→gear; sticky Apply with inline reason. | `index.html`, `customization-sections.js/css`, `packs-phone.js`, `parental.js`, `support.js` | L · 🟡 (JS injections moved) | Apply reachable without losing preview scroll; Plus locks badged |
| P1-4 | **Play staging.** Destination segmented control; public/personal radio-cards + ACTIVE badge; staged form; TV-library conditional render. Contracts (`iptvConnect/list/play/clear`, Vault) untouched. | `index.html`, `iptv.js`, `iptv-phone.js`, `iptv-source-form.js`, `library.css` | M · 🟡 | Password never in draft (existing test kept); destination switch preserves form |
| P1-5 | **Gear sheet.** Consolidate language/appearance/font-size/about/support/version; focus trap + restore; same prefs writes. | `index.html`, `welcome-support.js/css`, `support.js`, `appearance.js` | M · 🟢 | All prefs readable by screen reader; same `localStorage`/native writes |
| P1-6 | **Locale unification.** Route all copy through `MorphLocale`; merge per-file `words` tables; fill `zh/ja` Cast/DLNA; audit `data-no-translate`; remove `de/es`-only branch. | `locale.js`, `locale-data.json`, `cast-screen.js`, `dlna-cast.js`, `phone-iptv.js` | M · 🟡 (translation volume) | `locales-check.cjs` + manual `zh/ja` pass; no mixed-language screens |
| P1-7 | **P1 test sweep.** Update `ui-check.cjs`, `connect-flow`, `reconnect`, `reorder`, `appearance`, `languages` checks to new IA; keep native mocks. | `tests/*.cjs` | M · 🟢 | Full `tests/` green on mocked bridges |

**Dependencies:** P0-1 (nav) before P1-1. **Risks:** P1-1 breaks deep `querySelector` assumptions in injected modules (`parental`, `packs`, `support` query Studio selectors) — mitigate with alias IDs + grep for `#page-studio` / `.studio-shortcuts` before merge. **Rollback:** keep `data-page` aliases + old section IDs hidden for one build.

---

## P2 — VISUAL MODERNIZATION (premium, minimal, cinematic)

Goal: one icon/type/card/motion language. Pure CSS/SVG + `remote-visual.js` registry; no flow changes.

| ID | Work | Files | Complexity / Risk | Acceptance |
|---|---|---|---|---|
| P2-1 | **Icon system.** 24px/2px SVG set; extend `remote-visual.js#svg()`; replace ASCII in nav/shortcuts/D-pad + `:before` glyphs. | `remote-visual.js`, `index.html`, `remote.css`, `remote-visual.css` | M · 🟢 | Zero emoji/ASCII icons in UI; 200% zoom stays crisp |
| P2-2 | **Type + spacing tokens.** Scale 12/14/17/22/28/34; Arabic 1.7; 8pt grid; `tokens.css`; collapse 12 stylesheets' duplicates; remove `!important` chains (keep overrides as fallback 1 release). | `style.css`, `appearance.css`, `bright.css`, + per-page CSS | M · 🟡 (visual churn) | Screenshot diff vs P1: layout identical, type/spacing unified |
| P2-3 | **Two-tier cards + sticky headers.** `card`/`hero` classes; sticky tab header with status dot; theme grid 44px targets; segmented controls. | `index.html`, `style.css`, `library.css`, `iptv-sources.css` | M · 🟢 | 360/412/600px no overflow; sticky header persists title |
| P2-4 | **Button/state language.** `loading`/`disabled[data-reason]`/`destructive` variants; `connection-state` tokens → global status-card; skeletons for themes/apps/items. | `progress.css/js`, `style.css`, `app.js` (operation/toast) | S–M · 🟢 | Every async action shows inline state; no bare toast-only errors |
| P2-5 | **Light/dark cleanup.** Tokenize `--paper/ink/muted/accent`; twilight-blue becomes `data-app-appearance=twilight` option (not override cascade); honor `prefers-color-scheme` default. | `appearance.css`, `appearance.js`, `bright.css` | M · 🟡 | 3 appearances selectable; no hardcoded hex outside tokens |

**Dependencies:** P1 structure frozen first (else restyle twice). **Risk:** CSS cascade regressions on Samsung Chrome56-era WebView — mitigate: keep selectors flat, avoid `:has()`, test in `build/assets` (transpiled) context.

---

## P3 — POLISH & VALIDATION

| ID | Work | Files | Complexity / Risk | Acceptance |
|---|---|---|---|---|
| P3-1 | **Motion pass.** 160ms tab fade/rise; stepper progress; preview cross-fade; haptic on OK/Apply; full `prefers-reduced-motion` support (not blanket-off). | CSS + `app.js`, `remote-visual.js` | S · 🟢 | Motion feels instant; reduced-motion verified |
| P3-2 | **A11y audit.** `role=dialog` + traps, `aria-disabled` reasons, `aria-current` segments, 44px targets, focus-visible rings, RTL/LTR bidi check (IP/URLs `dir=ltr`). | All UI files | M · 🟢 | Playwright + manual TalkBack pass; SR order = visual |
| P3-3 | **Onboarding + empty states.** 3-slide first-run + coachmarks + checklist empty states (Apps/Themes/IPTV/DLNA). `tvmorph.onboarded` flag. | `welcome-support.js`, `index.html` | M · 🟢 | First-run shown once; skippable; never blocks pairing |
| P3-4 | **Device matrix.** 360/412/600px · Android 8–15 · Arabic/English + `zh/ja/fr` spot-check · D-pad-only + touch-only · real Samsung Tizen + Android TV pairing E2E. | `tests/*`, physical devices | M · 🔴 (hardware-dependent) | Matrix sheet signed; P0 assumptions (C1/C2) confirmed or revised |
| P3-5 | **Docs + version hygiene.** Sync footer version with manifest; remove 5 dead script refs (or vendor them); update `README.md` IA diagram; changelog. | `index.html`, `README.md`, footer | S · 🟢 | No dead refs; version single-sourced |

---

## Cross-phase guardrails

- **Never:** delete features · edit TV code · change `ClearNative`/LAN/Inspector contracts · add commerce/cloud/new platforms · fork `locale.js` or library UI.
- **Always:** `node tests/ui-check.cjs` + affected `tests/*.cjs` before each merge; screenshot 360/412px; Arabic-first review (default `lang=ar dir=rtl`).
- ** debt to retire:** `connect-flow.js` MutationObserver reparenting · dead `.theme-pricing` + legacy `#install` nodes · 5 missing script refs · `de/es`-only locale branch.
- **Estimates:** P0 ~1wk · P1 ~2–3wk · P2 ~2wk · P3 ~1wk (single dev, serial; parallelize P2 tokens with P1-6 locale after P1-1 lands).
