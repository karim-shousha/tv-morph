# MorphTV Fitness — Technical Implementation Plan (record)

## Baseline (inspected, not assumed)
- Vanilla JS + CSS, no bundler. Load order in `tv-project/app/index.html`; modules share `window.ClearTV`.
- Top nav (`home/apps/inputs/settings`), no sidebar. Views toggled by `C.showView` in `app.js`.
- Themes: `body[data-theme]` + tokens `--cinema-glass/--cinema-border/--cinema-glow` derived in `app.js syncBarTheme`. 27 themes.
- i18n: optional global `MorphLocale` (en/ar/fr/zh/ja) + `morphLanguage` event; per-module `words` dicts; `mobile-app/assets/ui/locale-data.json` (884 keys, same 5 locales).
- Remote: arrows 37–40, OK 13, Back 27/10009 in `focus.js`; geometric nearest-focus nav; modal scope via `C.Focus.setScope`.
- Audio: only adhan MP3 + native radio bridge. No WebAudio use yet.
- Storage: `C.read/C.write` → `localStorage cleartv.*` (+ IndexedDB for theme packs).
- Tests/build: no npm suite in tv-project; `tools/build.py` packages `ClearTV.wgt`; checks in `tools/check-*.cjs`.

## Approach (no app rewrite)
- New self-contained module `tv-project/app/fitness/`: `fitness-data.js` (32 ex / 15 prog / 12 cat),
  `fitness-i18n.js` (5-locale chrome), `fitness-store.js` (settings/custom/history/stats + MET calories),
  `fitness-audio.js` (WebAudio beeps, speechSynthesis voice, honest pack metadata),
  `fitness-engine.js` (monotonic state machine, pause-safe), `fitness-ui.js` (8 screens),
  `fitness.css` (theme tokens, no hardcoded palette), manifest + guide + tests.
- Integration without touching `app.js`: `fitness-ui.mount()` injects `#view-fitness` + `#nav-fitness`,
  wraps `C.showView`/`C.back` (guarded, idempotent) so existing views keep working.
- Only `index.html` change: append fitness `<link>`/`<script>` tags. No Home redesign, no locale/theme system fork.
- Placeholders are CSS gradients (no missing-file 404s); finals drop into manifest paths with no code change.
- Verification: `node fitness/tests/fitness-tests.js` → 28/28 green; `node --check` on all new files.
