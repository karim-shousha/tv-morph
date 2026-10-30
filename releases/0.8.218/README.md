# Morph TV 0.8.218

- Compact IPTV navigation: left-aligned tabs with bounded gaps instead of space-evenly distribution.
- Colored section icons for Live, Movies, Series and Favorites.
- One header geometry and focus treatment across launcher Home, Apps, Settings and IPTV, including the full header surface and wordmark.
- Sources, Update and Multi-view join the top bar when measured space allows; keep the secondary row on smaller screens.
- Automated layout/theme checks cover all 32 theme identities and Home/Apps/Settings, Arabic/English IPTV, 720p/1080p, focus navigation, slideshow and downloaded packs.
- Theme artwork, saved selections and licensing behavior unchanged. Automated rendering tests are not physical TV verification. LG HDMI audio remains unverified; Tizen 2 stays experimental Lite 0.8.215.

## Home cold-start and artwork corrections
- Load primary library lists before optional category enrichment; allow a bounded 45-second list deadline for cold provider catalogs rather than 12 seconds including queue wait.
- Never mark an empty Home snapshot as fresh. Retry an empty first load once automatically while Home remains visible, without requiring playback or re-entry.
- Cards keep edge-to-edge artwork at the existing size with no letterbox or downscaling. Portrait artwork is aligned to the top to retain heads; provider landscape backdrops are preferred when supplied. Aspect-ratio differences can still require cropping. Titles are larger with Arabic above English when both are supplied.
- Home rating badges use five partially filled stars proportional to the actual 0–10 provider score, retaining the numeric rating.
- Hero synopsis clamps at complete lines with ellipsis instead of cropping the lower line. Full synopsis remains in More Info.
- Mocked cold-start recovery regression passed; physical Fire TV verification still requires the reported device.

- Native Android TV cold start now displays a gradient loading cover until the first themed Home frame is ready. Shared TV/webOS/Samsung and phone startup palettes match IPTV; no artificial loading delay.

## Low-memory IPTV path
- Reuses unchanged Home DOM instead of rebuilding every card after an unchanged history refresh.
- Decodes artwork only as cards enter the visible rows (removed the extra 240px preload margin).
- Uses TMDB w500 assets for card-size images when a supplied URL already targets TMDB; display dimensions stay unchanged and no third-party proxy is introduced.
- Performance/Light on detected low-memory devices keeps a static cinematic backdrop; Full effects retains the slideshow. JS row scrolling now honors disabled motion and weak-device capabilities.
- These are automated-tested mitigations, not a device-tested projector performance claim.
