# Morph Phone design library

`design-system.json` is the source for the dark appearance. Light mode is removed; saved light preferences migrate to dark. Change its colors or
metric roles, then run `python mobile-app/build.py --test-channel` from the
repository root. The build regenerates WebView, Android and Flutter tokens.

The shared components are:

- `assets/ui/phone-system.css` and `phone-system.js`: page chrome, cards,
  headings, tabs, controls, navigation and dynamically inserted content.
- `bridge-native/.../ui/MorphHostShell.kt`: Android chrome and materials.
- `integrated-remote/lib/core/theme/`: the remote's semantic adapter.
- `integrated-remote/lib/worship/faith_app.dart`: the worship adapter.
- `phone_reading_card.dart`: the common devotional reading card, with a
  separate source disclosure, reading expansion and action row.

New web surfaces use `phone-card`, `phone-hero`, `phone-row`, `phone-title`,
`phone-section-title`, `phone-body`, `phone-caption` and `phone-tabs` rather
than introducing page-specific colors or decoration recipes.

The phone frontend is rebuilt from `phone-layout-source.css`, `phone-system.css`
and `phone-rebuild.js`. `phone_layout.py` copies the authored layout; it no longer
extracts or combines legacy styles. The new shell owns Home, navigation and
Studio entry; existing controllers retain their data, transport and Apply handlers.
TV theme-preview artwork remains content of the editor.
Do not edit generated token files or staged build assets.

Validation records live in `output/phone-system-tests.log`,
`output/phone-system-web-audit.json` and
`output/phone-design-system-validation.json`.

The compact `PhoneNavigation` Flutter widget and `MorphHostShell.navigation()`
keep native sections connected to the same five phone destinations. Native routes
return a validated phone page through the host; no playback or provider data is
created by the visual layer. The Home hero uses `rebuild-connect-hero.png`; it is
a decorative asset only, with localized text and controls rendered separately.

Reference rebuild validation: `output/reference-rebuild/` (Flutter, WebView,
phone IPTV touch navigation, signed local build, and emulator captures).
