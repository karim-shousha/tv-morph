# Gold reference visual preview

This is a separate review of the user's supplied visual reference. It does not replace the current launcher UI or its profile.

The upper row contains exactly five existing destinations: Morph IPTV, Media Player, Morph Bridge, Morph Radio and Themes. The four built-in app entries are removed from the visible quick dock, without changing saved pins. Themes reuses the existing appearance action. Other existing pinned apps, PC/USB media, Add app and folders remain in Quick Access. The sidebar reuses existing actions; no new games or third-party apps are added.

Build with `python pc-app/reference-preview/build.py`. Open with `python pc-app/reference-preview/open.py`. Close the preview and return using `python pc-app/reference-preview/open.py --current`.

The preserved current UI and checksums are under `output/launcher-before-gold-preview/`. The preview is under `output/gold-reference-preview/ui/`. Its separate cloned profile is under `.private/gold-reference-preview-profile/`; the original profile remains untouched.

Artwork was generated with the built-in `image_gen` tool. Source paths are recorded in `generated-assets.json`. Full-resolution masters are preserved under `output/gold-reference-assets/masters/`, with resized WebP runtime assets in `assets/`.

Generation specification: polished dark-navy cinematic 3D objects with luminous blue, gold, purple and cyan edges; a single centered object in the upper 70% of a landscape card, with a flowing light ribbon and a dark caption area beneath; no labels, logos, watermarks or outer UI frames. Subjects: a television for IPTV, a gold cinema clapperboard for Media Player, a phone linked to a television for Bridge, a glowing circular equalizer for Radio, and an aurora art panel with color swatches for Themes. The background follows the supplied reference's dark alpine lake, amber sunset, snowy mountain range and small golden mosque at the right shoreline, with all UI removed.

The reference-matched second artwork set is in `assets/*-v2.webp`. Full per-asset prompts, reference input, built-in generation source paths, runtime paths, and master paths are recorded in `exact-artwork-v2.json`. Original artwork remains preserved.

The approved navy/gold Midnight design is the primary visual reference. Other theme palettes preserve the same geometry, transparency, gradient rims and interaction style. Brand artwork and tint remain fixed. Theme-specific hero art stays in a contained area at the right; the baseline landscape slideshow remains full-frame. Inner pages hide the home header.
