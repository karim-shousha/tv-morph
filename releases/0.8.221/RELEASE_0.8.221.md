# Morph TV 0.8.221

- Shared navigation styling for Home, Settings and IPTV, preserving section labels, theme artwork and per-theme focus accent.
- Centered loading text in the native TV cover and fixed-size fullscreen IPTV loading overlay.
- Local media controls use a translucent compact surface with the timeline above the actions.
- Category ordering: Back from a category moves focus to Save; arrow navigation reaches Cancel. Only Save persists changes.
- Large native IPTV catalog tasks are serialized separately from metadata, settings and playback to reduce concurrent JSON allocations.
- Includes 0.8.220 bounded cache writes, disposed-page guards, failed inspector socket cleanup, corrected LG connection status, and removal of automatic support/content-update startup notices.

- Sources dropdown closes on Back and restores focus. Episode favorites retain the exact episode identity and parent-series poster.
- IPTV settings retain their four sections with a cinematic header and clearer account/free-source panels. Home shelf order can be changed and saved per source.
- First-episode Up reaches season selection; long metadata scrolls separately from visible action buttons; poster framing avoids extra borders.
- Native player controls are centered, the episode browser uses an accessible icon, quality joins the controls, and the redundant onscreen Back is removed.
- Dock icons retain size; horizontal scrolling occurs only at the visible edge. Focus clears the nested dark icon surface.
- IPTV cinematic wallpaper changes every 20 seconds, including performance mode; it pauses when Home is hidden or the document is backgrounded. No poster enlargement is used for the wallpaper.
- Plus packaged-webOS origins can manage authenticated device slots; code entry tolerates copied Unicode dashes and invisible directional characters.

## Validation
Android TV and phone APK builds/signatures; webOS package build; real DOM regression fixtures for category Save/Cancel and focus interception, shared header geometry across themes, loading layout under oversized inherited fonts, media overlay and cleanup. IPTV startup matrix (stalled series, live-only, request failures, persisted restart) and LG status matrix passed. Protocol mocks do not constitute real TV verification.

## Limits
No physical TV/projector crash reproduction or heap trace was available. Serial catalog loading and bounded writes reduce known allocation pressure but do not prove every process closure fixed. Samsung in-place update error 116 has not been physically reproduced/resolved. Stalker is still not implemented in the Samsung/webOS adapter. Experimental Tizen 2/3 package versions are unchanged.
