# Morph TV 0.8.224

- Constrained TV artwork loads only near the viewport, at most two requests concurrently; hidden catalog artwork is released.
- Phone IPTV uses a compact header with tools inside it, independently scrolling content, accessible search and category drawer.
- Watched progress uses a turquoise line. Back hides visible player controls before leaving playback; revealing controls with OK does not activate a hidden button.
- Android launcher resume renders behind its startup cover with bounded frame callbacks, avoiding an invisible WebView frame wait after HDMI.

Validation: Android and phone signed builds, webOS packaging, automated viewport/focus checks and constrained Samsung-browser artwork checks. No physical Samsung/LG/Fresh validation in this release. Stalker support on Samsung/LG is not added by this release.
