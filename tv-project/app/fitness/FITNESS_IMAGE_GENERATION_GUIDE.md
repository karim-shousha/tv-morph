# MorphTV Fitness — Image Generation Guide (for Codex)

All final workout photography will be integrated by Codex in a later stage.
This guide guarantees zero layout/engine changes when swapping placeholders for finals.

## Manifest

- Source of truth: `tv-project/app/fitness/fitness_assets_manifest.json`
- Total slots: **154** (12 categories + 15 programs + 1 hero + 63 exercises + 63 motion demos)
- Asset IDs are stable, e.g. `fitness/exercises/push_up`, `fitness/programs/full_body_starter`.

## How placeholders resolve today

- `fitness-ui.js` renders a theme-aware gradient + emoji silhouette + asset-ID caption in every image slot.
- No `<img>` points at a missing file: nothing 404s, nothing breaks layout.
- To ship a final image, save the file at the manifest `path` (e.g. `app/assets/fitness/exercises/push_up.webp`).
  Optionally extend `fitness-ui.js` `thumb()` to prefer `<img src="assets/…">` with `onerror` fallback to the gradient. Layout and engine stay untouched.

## Art direction (approved cinematic style)

- Realistic fitness photography, diverse adult athletes, modest athletic wear.
- Premium dark studio: deep navy/teal background, subtle purple + electric-blue rim light, warm orange kicker.
- Full body visible for exercise images; correct form; joints never cropped at awkward angles.
- No text, logos, watermarks, or TV chrome baked into images.
- Consistent color grade across the whole set; soft vignette; export **WebP**, sRGB.

## Resolutions (TV-first, 1920×1080 primary)

| type | aspect | resolution |
|---|---|---|
| hero | 21:9 | 1680×720 |
| category / program | 16:10 | 960×600 |
| exercise / demo | 4:3 | 800×600 |

## Per-asset spec

Every manifest entry carries: `id, type, ref, en, pose, composition, aspect, resolution, path, usedIn, motion`.
Render the `pose` literally (e.g. "Feet shoulder-width. Chest up, knees track over toes." for `bodyweight_squat`).
`motion:true` entries are optional 3-second loopable demos; a static frame from the same shoot is acceptable.

## Integration checklist for Codex

1. Generate images per manifest `pose` + `composition`.
2. Save to manifest `path` under `tv-project/app/assets/…`.
3. Keep filenames/IDs byte-identical to the manifest.
4. Verify every screen (home / programs / builder / active / complete) with finals in place.
5. Update manifest only if an asset is intentionally dropped (never rename IDs in UI code).
6. Re-run `node tv-project/app/fitness/tests/fitness-tests.js` — must stay green.

## Contact / licensing

- Support: **support@herroshetta.com**
- Use only properly licensed music/artwork. If a music pack has no licensed audio, keep its honest `unavailable` status in `fitness-audio.js`.
