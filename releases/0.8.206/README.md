# Morph TV 0.8.206

Public release authorized by the owner on 2026-10-29. Includes the previously isolated modern IPTV, Local Network/DLNA and dock folder work without replacing business logic.

## Changes
- Arabic and English font presets plus independent 80–130% sliders, persisted and shared with launcher, IPTV, radio and native player settings. Small / Current / Large reset custom percentage.
- Android/Google TV/Fire TV and phone: SAF local M3U file import; encrypted private copy, streaming parser, bounded size/time, previous account preserved on failure. No Samsung/LG file picker claim.
- Android Media3: current decoded height and Auto / Data saver / available variant selector. Data saver chooses an actual low variant; it cannot transcode or reduce bitrate for a single-quality source. System player offers an explicit switch to Media3. Physical adaptive-stream behavior is unverified.
- Add-account labels: Xtream details, M3U and Stalker; internal account identifiers retained for migration compatibility.
- Experimental separate Lite 2 WGT targeting Tizen 2.3/2.4 WebKit, static artwork, ES5 and compatibility fallbacks. Not hardware verified, not support for Orsay/Tizen 2.0.

## Verification
Android TV and phone APK builds and signatures verified; LG IPK built. Launcher regression covers dock folders, silent double Back, source dispatch; browser tests cover font percentages/no compounding/presets/persistence/D-pad, file picker cancellation, DLNA protocol/focus/offline behavior and Samsung adapter mocks. Java streaming parser test covers >12 MiB, >25k entries, deadline/failed import and local-file resources. Lite 2 ES5/static and Arabic/English browser compatibility simulation passed.

No physical new TV, encrypted SAF storage round trip, adaptive bitrate stream playback or legacy WebKit verification is claimed. DLNA network/receiver capability limits remain documented in LOCAL_NETWORK_RECEIVERS_IMPLEMENTATION.md. No credential-bearing subscriber URLs are used for release tests.
