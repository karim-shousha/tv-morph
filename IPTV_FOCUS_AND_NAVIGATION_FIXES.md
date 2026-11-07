# IPTV Focus & Navigation Fixes (Tasks 3 & 7)

## Files modified
- `android-tv/iptv/stream-ui.css` — appended scoped top-nav focus override (+ glow-off companion).
- `android-tv/iptv/app.js` — `exitToHome()` helper; settings top-level Back now closes settings AND
  exits to main Morph TV Home.

## Task 3 — duplicate rectangular focus: root cause
Two indicators were drawn: (1) the intended rounded pill (gradient + border + glow), (2) a 2 px
`outline` rectangle. Old TV engines draw `outline` rectangular even on `border-radius` buttons.
The outline came from `tv-project/app/ui/nav-system.css`
(`html body #morph-header nav button:focus { outline:2px solid ... }`), which outranks
`stream-ui.css` (`#morph-header nav button:focus`) on specificity and loads last. A first fix attempt
with equal specificity had no effect — verified via computed-style probe.

## Task 3 — fix
`html[data-stream-ui] body #morph-header nav button:focus(:-visible)` sets `outline:none` and keeps
a `box-shadow` ring + accent border (box-shadow follows border-radius → single rounded pill).
A stronger companion rule preserves the single pill with a flat ring when glow-off (performance)
mode disables blur. Scoped to `#morph-header nav` only; no global outline removal.

## Task 7 — settings Back navigation: root cause
`back()` at the settings top level called `closeSettings()` only, landing back in the IPTV library.

## Task 7 — fix
Top-level settings Back now runs `closeSettings()` then `exitToHome()` (`IptvNative.exit()` guarded):
Android finishes `IptvActivity` → `TvActivity` main home; Samsung/webOS bridge `exit()` returns to
the main view. Nested pages (Add/Playback/Library, account keyboard, home-order overlay) still go
Back → Accounts first; only the top level exits. Save/× paths unchanged.

## Tests executed
- Playwright: focused nav button computed `outline:none` + solid pill ring + 28 px radius; no
  rectangle. Nested Back keeps settings open on Accounts without exiting; top-level Back hides
  settings and calls exit. Zero page errors. `node --check app.js` — pass. CSS braces balanced.

## Tests not executed
- Hardware remote verification (Tizen/LG keycodes 10009/461), TvActivity focus position after exit,
  Fire TV.

## Platform-specific risks
- If `IptvNative.exit` is ever unavailable on a platform, Back falls back to closing settings only
  (previous behavior) — no dead end.
- Tizen `focus-visible` support varies; the plain `:focus` selector carries the fix.

## Rollback
- Task 3: delete the two appended rules at the end of `stream-ui.css`.
- Task 7: remove `exitToHome()` and restore `...back())closeSettings();}` in `back()`.
