# IPTV variants

For any IPTV change, keep one implementation shared by the phone player, IPTV inside Morph TV, and the standalone Morph IPTV product.

- The canonical frontend is `android-tv/iptv/`. Never edit generated copies in build folders.
- Shared Android providers and playback live in `android-tv/src/local/tvmorph/tv/`.
- Samsung transport/playback is shared through `mobile-app/samsung-media.js`; LG uses the same catalog adapter with `webos-app/player.js`. Check equivalent behavior across these engines for platform-specific playback changes.
- Phone presentation and touch navigation live in `mobile-app/phone-iptv.css` and `mobile-app/phone-iptv.js`; preserve TV remote navigation when changing them.
- `iptv_shared.py` stages this frontend for the embedded and standalone builds. Keep platform wrappers limited to transport, product identity, startup and presentation.
- The standalone build command is `python standalone-iptv/build.py`; its product identities and platform targets are in `standalone-iptv/product.json`.
- Validate shared UI changes on phone touch layouts and TV remote layouts. Validate product-specific startup and Back behavior independently.
- VIDAA is excluded by the user. Do not add it to the standalone build matrix.
- Publication is on hold. Check `output/release-hold.json` and the latest user instruction before uploading builds or changing the landing page.

The workspace contains other chats' staged and unstaged changes. Preserve them; do not reset, clean, or stage unrelated files.

## Installed product names

Latest header direction (2026-11-04): use the supplied transparent M symbol in `tv-project/app/assets/morph-header-symbol.webp` followed by live text `orph Launcher`, `orph IPTV`, or `orph Bridge` at the upper left of the corresponding surface. The M symbol supplies the first letter. This supersedes header wordmark artwork below; loading artwork and installed application identities remain separate.

Use **Morph TV** for the phone app, **Morph Launcher** for the full TV launcher (including legacy builds), and **Morph IPTV** for standalone TV IPTV. Keep existing package IDs and signing identities when changing display names. Header/loading artwork is separate from the installed application label.

Wordmarks: use `tv-project/app/assets/morph-launcher-wordmark.webp` for TV launcher headers and the original PNG for loading, `tv-project/app/assets/morph-iptv-wordmark.webp` (staged into `android-tv/iptv/`) for every IPTV header and its original PNG for loading, and preserve `morph-wordmark.webp` for the Morph TV phone host. Keep these distinct from square installed-app icons.

Installed icons: use the restored classic blue M on a dark navy background in `morph-launcher-icon.png` for all full TV launcher builds (latest user instruction, 2026-11-04), and the approved white `morph-iptv-icon.png` for standalone IPTV. Preserve `logo.webp` for the phone app. Source masters live under `tv-project/app/assets/`; package standard size icons rather than unused master copies in web bundles. Transparent header wordmarks are separate assets.

Runtime wordmarks use `morph-launcher-wordmark.webp` and `morph-iptv-wordmark.webp`. Their same-name PNG files in `tv-project/app/assets/` remain editable source masters. `iptv_shared.sync_webp_artwork()` synchronizes lossless WebP sized for headers while preserving transparency; full-resolution PNG remains authoritative for loading. Keep raw branding masters out of UI bundles except full-resolution original PNG wordmarks used only by loading screens, explicitly requested by the user. Platform installation icons retain each platform required format.

## Android 4.4 compatibility editions

The reduced native M3U engine in `android-legacy/src/` is shared by the Legacy Launcher and standalone Legacy IPTV APKs. Build with `python android-legacy/build.py` or `python android-legacy/build.py --product iptv`. Keep API 19 compilation, distinct package IDs, existing signing identity, and no HOME intent in standalone IPTV. These editions provide M3U/native playback, not the modern Xtream/EPG/UI feature set. Keep `/download/legacy` and `/download/iptv/legacy` separate and clearly labelled Android 4.4+ on the landing page; never point either at the API 26 APK.
