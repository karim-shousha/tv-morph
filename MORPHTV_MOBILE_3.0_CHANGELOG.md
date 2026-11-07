# MORPH TV MOBILE 3.0 — CHANGELOG

All changes are under `mobile-app/`. No TV code, native code, contracts, or user data handling changed (except where explicitly noted as test-only).

## New files
- `assets/ui/morph30.css` — 3.0 design system (TV-Modern tokens, 4-tab chrome, status hero, IP cards, stepper, segments, sheets, onboarding, motion, responsive 320–600px, reduced-motion, RTL).
- `assets/ui/morph30.js` — 3.0 controller (aliases + history + scroll memory + back-stack, status sync, segments, gear sheet with focus trap + Escape, IP copy, onboarding, 5-locale chrome strings).
- `tests/morph30-check.cjs` — 3.0 regression suite (nav/aliases/back/segments/gear/status/IP/no-jump/onboarding/appearances/widths).
- Screenshots `morph30-*.png` + refreshed legacy previews.

## Changed (product)
- `assets/ui/index.html` — 4-tab bottom nav (SVG placeholders), header `.m30-head-actions` + gear hook, VIDAA manual option, i18n IDs (`compat-lg`, `remote-android-note`, `iptv-type-label`, corrected IPTV label copy), `morph30.css/js` includes.
- `assets/ui/connect-flow.js` — removed forced auto-jump (observers render-only); explicit user actions still step. (P0-3)
- `assets/ui/remote-visual.js` — icon map extended for `home/design/control/play`.
- `assets/ui/support.js` — 5-locale words table + repaint (was Arabic-only); moved into gear sheet via controller.
- `assets/ui/app.js` — VIDAA manual selection restores its dedicated install label/package/disclaimer via `pickedBrand` (branches existed but were dead after brand mapping). No gating/logic changes otherwise.

## Changed (tests only)
- `tests/ui-check.cjs` — new nav/segments/step navigation, settled-theme waits, Plus-entitled fixture, card-library flows, LG-install enabled, VIDAA coverage, toast-safe touchpad scroll.
- `tests/locales-check.cjs` — new nav + sub-pages, Plus fixture, per-language error injection (was self-flagging).
- `tests/connect-flow.cjs` — new nav + explicit step navigation (post auto-jump removal).
- `tests/appearance-check.cjs` — new nav + sub-pages, Plus fixture.
- `tests/bright-check.cjs` — light token, library open, downloader stub, ar default, hockey/search states, webp crest, Indic digits, new nav.
- `tests/editor-directions-check.cjs` — Plus fixture + open-all-details.
- `tests/family-phone-check.cjs`, `tests/library-polish.cjs`, `tests/reconnect-check.cjs` — new nav/segments/step navigation.
- `tests/header-check.cjs` — token-owned surface assertion.
- `tests/samsung-ui-check.cjs` — title only (`Morph TV`).

## Verification
- 13/13 phone suites pass; `build.py` APK verified (23,624,638 bytes).
- TV-side `reorder-check` / `samsung-media-check` / `samsung-ui-check` failures are pre-existing (proven on pristine HEAD where applicable) and untouched by this change.
