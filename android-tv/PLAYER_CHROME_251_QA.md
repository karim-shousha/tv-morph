# Native player chrome test build 0.8.251

The APK contains the native controls, rather than the old HTML-only preview.

Changes:
- Canvas vector transport controls, including a blue ring/glow on Play/Pause and outlined circular buttons.
- Compact dock with a blue timeline and a separate current-content card.
- Embedded channel/category browser instead of a modal channel dialog.
- Expandable quality/audio/subtitle/aspect/speed selections in the right panel, with blue checked circles.
- Quality and track choices come from the actual playback engine; unavailable variants are not invented.
- Settings and channel panels consume Back before the player exits. Phone system navigation is hidden during playback.

Validation on the Android emulator at 1920×1080:
- Signed APK built and installed successfully.
- Instrumentation launched the real PlayerActivity without changing its exported permission.
- Generated H.264/AAC test video prepared and played.
- Vector button class and inline quality menu present.
- Quality selection, aspect selection, audio and subtitle choices exercised.
- Playback engine accepted 1.5× speed.
- Back returned to settings and then closed the panel.
- Actual runtime screenshot: player-actual-251.png (test pattern video).

Limits: this test uses one video resolution and one audio track. Multi-variant live provider streams, real channel artwork/catalog browsing, favourites through the library, DLNA casting and phone PiP were not verified by this emulator test. This is a local test APK, with no deployment or publishing.
