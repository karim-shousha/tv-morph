# Navigation performance audit — 0.8.225

Scope: shared launcher focus engine, dock, rails, performance presets, and IPTV Home/catalogue navigation. This is source inspection and automated browser profiling, not physical Samsung verification.

Confirmed IPTV bottlenecks and changes:
- Category navigation measured all provider category widths/heights on every arrow; now only the next eligible candidate is measured and scrolled into view.
- Home horizontal navigation repeatedly sorted controls by live geometry; now positions are reused until the control list or viewport changes.
- Home focus groups are reused until focusability/structure changes, avoiding repeated visibility layout reads.
- Card focus immediately rewrote hero content and rescheduled enrichment. Updates now settle for 160 ms while highlight/navigation stay immediate.
- Hero account lookup copied history/favourites; a metadata-only accessor avoids these allocations.

Comparative automated fixture: 16,000 catalogue entries and 1,200 provider categories. Same machine/browser, baseline from published 0.8.224 WGT. Thirty category moves: 36,180 to 31 width reads. Twenty Home moves: 1,032 to 44 rectangle reads. Both kept the selected category visible. These are operation counts, not a guarantee of television frame rate.

Launcher audit: focus.js already caches spatial geometry with scoped invalidation. Focus class/style changes do not invalidate that cache. Dock scroll work is coalesced with requestAnimationFrame and only reveals an icon at the viewport edge. Rails reuse calculated strides. No unrelated launcher rewrite was warranted by the measurements.

Browser profile with mocked installed applications (not real installed-app verification): 80 apps and 30 dock movements caused no full-body text-tree walks. With 150 apps and 4x CPU slowdown, Light mode had no requestAnimationFrame callbacks or computed-style queries during the 4-second sampled idle interval. Fifteen navigation moves used 15 coalesced callbacks totaling about 2 ms in that sample; this excludes paint/GPU time. Dock/sidebar computed backdrop blur was none in the Light-mode check.

Regression checks: bounded artwork loading (maximum two concurrent catalogue requests), hidden Home artwork release, movie/series scrolling, SVG search, and phone layouts at 844x390, 390x844 and 915x412 passed. Signed phone/Android builds, webOS packaging and packaged Samsung script presence verified.

Remaining validation: repeat sustained D-pad movement on the affected physical Samsung, including long category lists, details return and theme changes. Browser profiling cannot reproduce that TV's GPU, firmware or memory pressure. No provider authentication/playback compatibility claims are added by this audit.
