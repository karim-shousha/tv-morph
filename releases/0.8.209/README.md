# Morph TV 0.8.209

- Global search paints each completed section independently, reuses cached searches and bounds requests to 12 seconds. Back invalidates pending results and returns Home.
- Search has a dedicated header slot. Section-only search is visible again. Android IME Search/Go/Done submits the focused search field.
- Bounded initial loading screen with Retry/Open library after a slow-provider deadline.
- Home order: provider Trending, provider Most Popular, Movies, Series, Continue Watching, Live Sports. When provider categories are absent, honest Library Picks/Top Rated labels are used.
- Two complete shelves fit beneath the fixed hero on TV sizes. Sports shares poster-card dimensions with centered uncropped logos. Hero slideshow pauses on focused cards.
- Compact season tabs; season/episode metadata beside episode names and resume cards.
- Arrange categories using Up/Down to select, Left/Right to move, then Save; separate storage for each source and section.
- Android player: smaller controls, episode/library action first at left, narrow side browser. HDMI focus removes duplicate inner decoration.

Validation: automated phone/TV Arabic/English navigation and rendering tests, search Back, settings, category reorder, refresh deadlines and scoped favorites; signed Android builds and LG package validation.

Limits: Native IME and side player UI need physical TV validation. Provider metadata/artwork and stream access vary. No VLC engine has been added. HLS/MPEG-TS selection already exists in Xtream account configuration. Tizen 2 remains separate experimental 0.8.206.
