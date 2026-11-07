# IPTV Home Scrolling Implementation (Task 5)

## Files modified
- `android-tv/iptv/stream-ui.js` — `placeHero()` (hero lives inside `#stream-rows`), render
  re-placement after wipes, offset-based two-row destinations in `move()`.
- `android-tv/iptv/stream-ui.css` — hero-in-rows margin rule + comment update.

## Original behavior
Fixed 270 px hero + index-arithmetic scrolling (`targetIndex*step`) that assumed shelves start at
scroll offset 0; ~1.5 rows visible at 1080p and the hero never scrolled away.

## Changes
- `#stream-hero` is now the first child of the `#stream-rows` scroller, so it scrolls away
  naturally; ~2 shelves fit the viewport at 1080p. A `placeHero()` helper re-inserts the same hero
  node after every `render()` wipe (listeners/focus preserved — the node is moved, never rebuilt).
- Vertical destinations are measured, not indexed: moving Down scrolls so the previous + target
  shelves show (A+B → B+C); moving Up shows target + next; an already-visible target causes no
  scroll (no snapping). Horizontal card position per row, `slideRows` 190 ms easing, and the
  reduced-motion / `media-effect-motion-off` / `media-low` instant path are unchanged.
- Catalog loading, caching, prefetch, `homeRows` cache, and artwork observers untouched
  (2–3 layout reads per vertical press, same as before).

## Tests executed
- Playwright fixture (6 shelves): hero first child of rows; Down from hero lands on first card
  with no scroll (already visible); 4 further Downs walk shelves with scrollTop 0→330→819→
  1308→1797, focused card always in view, hero scrolled away; 2 shelves in viewport at 1080p;
  reduced-motion run clean; zero page errors. `node --check stream-ui.js` — pass.

## Tests not executed
- Older Samsung/Tizen jank profiling, 720p (≈1.5 rows — accepted where viewport height forbids
  two), gamepad-style key repeat, RTL scroll verification on hardware.

## Platform-specific risks
- `IptvHomeOrder.apply()` reorders shelves after render; destinations are measured live, so custom
  orders work without changes.
- If a future shelf has wildly uneven heights, the previous+target framing still holds (uses the
  actual previous shelf height).

## Rollback
- `stream-ui.js`: remove `placeHero` (3 call sites) and restore the index-based
  `viewportIndex/targetIndex` block in `move()`.
- `stream-ui.css`: remove the `#stream-rows>#stream-hero` rule.
