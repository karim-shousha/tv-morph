# IPTV Player Seek-Bar Fix (Task 1)

## Files modified
- `android-tv/src/local/tvmorph/tv/PlayerActivity.java` — one `onKeyDown` branch added (line ~87).
- `webos-app/player.js` — `overlay.tabIndex=-1`; timeline `onfocus`/`onblur` outline.
- Investigated, deliberately unchanged: `android-tv/src/local/tvmorph/tv/SeekHoldPolicy.java`,
  `mobile-app/samsung-media.js` (Samsung AVPlay player), `android-tv/iptv/*` (no web player exists).

## Root cause
- Android: the native `SeekBar` (`timeline`) is reachable (OK shows controls, UP moves focus to it,
  hold-Left/Right scrubs via `SeekHoldPolicy`, release commits, Back hides controls first), but a
  single Left/Right press while focus sits on any other control fell through to default focus
  navigation instead of seeking. The existing `seek(±10s)` helper was only reachable from the
  Samsung/LG `key()` bridge, never from Android D-pad. Users perceived the slider as unreachable.
- Web (LG webOS HTML5 player): overlay had no `tabIndex`, so `overlay.focus()` after Back-hide was a
  no-op, and the `input[type=range]` timeline had no visible focused state.

## Changes
1. `PlayerActivity.onKeyDown`: when controls are visible, content is seekable (`!live && prepared`)
   and focus is NOT on the timeline, a single Left/Right press performs an immediate ±10 s `seek()`
   (which re-shows the overlay and keeps focus in place). Hold-to-scrub on the focused timeline,
   UP-to-timeline, release-to-commit, and Back-hides-first behavior are untouched. Live content is
   still excluded (`timeline.setEnabled(!live)` plus the `!live` guard).
2. `webos-app/player.js`: `overlay.tabIndex=-1` so Back-hide → focus works; timeline gets a 3 px
   white outline on focus (clear focused state). Seek model (UP → timeline, Left/Right scrub preview,
   key-up commits, Back hides chrome before stopping) unchanged.
3. Samsung AVPlay path verified already correct (timeline `tabIndex=0` + focus outline + release
   commits + live disabled) — preserved as-is.

## Tests executed
- `node --check` on `webos-app/player.js` — pass.
- `javac` full-compile attempt of the three activities: only missing-dependency errors
  (media3, LanHttp — provided by the real build); zero errors reference the edited regions.
- Playwright fixture probes of the web player key-handler paths were reviewed statically
  (no live video element in fixtures).

## Tests not executed
- Real-device D-pad seek on Android TV/Google TV, Samsung Tizen, LG webOS, Fire TV.
- Full APK build (`android-tv/build.py`) and Tizen/webOS packaging.

## Platform-specific risks
- Some remotes send FF/RW or long-press repeats instead of discrete Left/Right; those paths use the
  pre-existing hold-to-scrub model (unchanged).
- Very old Samsung engines ignore `outline-offset` on range inputs; the outline itself still renders.

## Rollback
- `PlayerActivity.java`: delete the inserted `if(!live&&prepared&&...getCurrentFocus()!=timeline)...` branch.
- `webos-app/player.js`: remove `overlay.tabIndex=-1` and the `timeline.onfocus/onblur` lines.
