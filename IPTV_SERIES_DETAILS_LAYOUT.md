# IPTV Series Details Layout (Task 4)

## Files modified
- `android-tv/iptv/tv-library.css` — series header row 44%→34% (38% ≤1400 px), poster column
  270 px→200 px (150 px ≤1400 px), tighter copy/actions, episode rows slimmed (thumb 210×118→
  190×104, 140 px wide ≤1400 px).
- `android-tv/iptv/details-tv.css` — series header rows 57%/45%→34%, copy tightened
  (title 42→34 px, plot ≤10 vh), actions raised (margin 12→8 px, buttons 64→56 px),
  legacy-layout fallback 57%/43%→34%/66%.

## Original issue
Oversized poster + tall info section squeezed the episode list to the bottom of the dialog.

## Changes
Compact horizontal header (small poster with `object-fit:contain`, no distortion; title, rating,
year, description, metadata, actions incl. View Episodes moved up by reduced plot/actions spacing)
plus an episode section that takes roughly two-thirds of the dialog: independently scrolling
`#tv-episode-list`, season tabs/toolbar/status compressed, more rows visible at once. Episode
retrieval, pagination, season dialog, focus movement (`TvIptvLayout.move`), and playback are
untouched. RTL/Arabic direction rules, long-title wrapping, and 720p/1080p media queries preserved.

## Tests executed
- Playwright fixture (series + 8 episodes): `tv-series-detail` applied; header row ≈303/948 px
  (≈32%); episode list 302 px tall; ArrowDown moves focus into `.tv-episode` rows; zero page
  errors. CSS braces balanced.

## Tests not executed
- 720p/1080p hardware visual check, very long titles/plots, 100+ episode seasons, RTL hardware.

## Platform-specific risks
- Fixed 34%/38% header fractions assume landscape dialogs; portrait/phone viewports use the
  separate `data-phone-episodes` path (untouched).
- Providers without posters add `poster-missing` class (existing) — layout holds via 1fr column.

## Rollback
- `tv-library.css`: restore `minmax(300px,44%)`, `270px` columns, and episode-thumb sizes.
- `details-tv.css`: restore `minmax(0,57%)`/`minmax(0,45%)`, copy sizes, and legacy 57%/43% splits.
