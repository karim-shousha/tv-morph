# IPTV legacy-device test matrix

Status: investigation and local recovery candidate; no physical-TV certification. Updated 2026-10-30.

## Available environments

`adb devices -l` and `sdb devices` returned no connected devices. webOS CLI lists only its default localhost emulator entry; no actual LG TV is registered. Desktop user-agent selection is not an emulator of the TV's engine/GPU/RAM.

| Platform / device | Engine / OS | Available memory information | Navigation latency | Section latency | Long session | Actual vs simulation | Result |
|---|---|---|---|---|---|---|---|
| Samsung Tizen 4.x target | Chromium M56 per Samsung | TV RAM/heap unknown | Not measured on TV | Not measured on TV | Not run on TV | Actual device unavailable | NOT TESTED |
| Samsung Tizen 5.x target | Chromium M63 per Samsung | TV RAM/heap unknown | Not measured on TV | Not measured on TV | Not run on TV | Actual device unavailable | NOT TESTED |
| LG webOS 5+ package target | Chromium 68 for webOS 5.x | TV RAM/heap unknown | Not measured on TV | Not measured on TV | Not run on TV | Actual device unavailable | NOT TESTED |
| LG webOS 4.x | Chromium 53 | Unknown | Unknown | Unknown | Not run | Outside current webOS 5+ declared package target | NOT CERTIFIED |
| Lower-powered Android TV | Android 8+; WebView version varies | Device RAM/ART/WebView heap unknown | Not measured on device | Not measured on device | Not run on device | Actual device unavailable | NOT TESTED |
| Desktop current baseline 0.8.226, 1920x1080 | Installed Edge/Chromium, main thread throttled 4x | Ryzen 9 7950X3D; host RAM about 127.2 GiB | P95 32.9 ms, worst 40.3 ms (100 alternating inputs) | Warm P95 1,002 ms, n=10 | Short baseline only | Simulation; SVG fixture | REPRODUCED section blocking |
| Desktop reconstructed 0.8.147 source | Same desktop shell/adapter; archived UI/data code | Same host; not original TV allocation | P95 32.2 ms | Warm P95 2,184 ms | Short historical comparison | Simulation, not an original signed TV installation | Large fixture also exposes old defects |
| Desktop recovery source, 1920x1080 | Same main-thread throttle; feature-detected worker | Same host; worker timing is not a TV model | P95 36.9 ms, worst 45.6 ms | Warm P95 171 ms; cold worst 678.1 ms (n=2) | See packaged run below | Simulation; SVG fixture | MEASURED section improvement; residual tasks remain |
| Packaged 0.8.227 performance core | Same desktop, actual packaged scripts | JS heap measured separately from GPU/native allocations | P95 32.9 ms; distinct-card sequence P95 27.3 ms | Warm P95 167.7 ms | 20-second smoke passed; 15-minute run completed; see completed-run limits | Simulation; JPEG 500x750; AVPlay lifecycle mocked | FUNCTIONAL desktop run PASS; memory inconclusive |
| Worker unavailable / blocked | Cooperative fallback | Bounded 8 order entries / 200,000 index slots | Legacy-device timing unknown | Timing not a TV measurement | Sort/cancellation tests only | API-path simulation | Correctness PASS; hardware performance NOT TESTED |

Engine sources: [Samsung](https://developer.samsung.com/smarttv/develop/specifications/web-engine-specifications.html), [LG](https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine). Numerical timings elsewhere in this matrix come from local saved test JSON, not those specifications.

## Required scenario coverage

| Scenario | Local evidence | Status / limit |
|---|---|---|
| Rapid directional input | 100 alternating inputs; separate serpentine visit to 100 distinct cards over two pages | PASS in desktop fixture; not a TV pass |
| Movie / Series switches | Twelve switches, cold first two separated from ten warm switches | PASS functional; residual large-category tasks reported |
| Live / Home switches | Continuous-run scenario rotates four sections | Completed; see completed-run limits |
| Repeated settings | Five independent open/close cycles plus continuous-run cycles | Functional PASS in desktop continuous run |
| Large playlists | 71,000 movie / 8,300 series / 11,400 channel fixture | PASS tested scale; not a million-title guarantee |
| Playback enter/leave | Explicit mocked AVPlay open, Back hides controls, Back exits | UI lifecycle PASS; real codec/audio/video NOT TESTED |
| Restore earlier section / page | Stable global sort/page tests and repeated section returns | PASS tested cases; exhaustive focus restoration not claimed |
| Continuous navigation 15â€“30 minutes | 900-second packaged performance-core run, one-minute windows and periodic GC samples | Completed 901,560 ms; memory acceptance inconclusive |
| Navigate during artwork loading | Delayed synthetic image responses; JPEG run | PASS fixture; real remote artwork/decoder NOT TESTED |
| Restart/reopen | Six close/reopen/GC cycles; long run reopens every five minutes | Parent-subscription retention fixed in isolated test; continuous-run memory inconclusive |
| Older JS syntax and missing APIs | Native payload ES2017 parser found two original failures; final target transform/API-absence check follows | Final validation pending |

## Interpretation and acceptance

Input-to-second-RAF is an opportunity-to-present proxy. It does not establish actual display latency or dropped frames on a television. PerformanceObserver data is used only where available; delayed input frames provide a weaker fallback when that API is absent. Missing observer entries must never be reported as proof that no long task occurred.

Desktop D-pad P95 is below the preferred 100 ms target. Section layout still exceeds 100 ms in stress cases. Physical hardware, native decoder/compositor memory, and universal no-freeze/no-crash acceptance remain unverified. The visual design and existing user performance controls were preserved.

Raw evidence: `.tools/iptv-investigation/current226-cpu4.json`, `full147-cpu4.json`, `recovery227-cpu4.json`, `cooperative-trial-cpu4.json`, `recovery227-visual-cpu4.json`, `current226-reopen.json`, `recovery227-reopen.json`, `correctness.json`; long-session/compatibility records are appended when complete.


## Completed continuous run (2026-10-30)

The packaged performance core completed 901,560 ms (15 minutes), with 12,646 directional inputs, 63 mocked AVPlay playback enter/leave cycles, three iframe reopens, repeated settings, and Movie/Series/Live/Home switches. There were zero JavaScript errors and zero sampled off-screen focus errors. Per-minute input-to-second-RAF P95 ranged from 29.5 to 30.6 ms. Large-category section tasks still reached 441 ms; this does not establish a zero-freeze guarantee.

Memory acceptance is INCONCLUSIVE for this continuous run: Playwright waitForSelector returned undisposed ElementHandles for playback overlays and Home cards, retaining detached documents. Global document counts increased even though active-frame nodes remained bounded at 2,047 in catalogue mode. The harness was corrected after this run. The isolated six-cycle close/reopen test with disposed handles remains the valid evidence for the parent-listener fix; continuous-session memory stability is not claimed.

The final package differs from the long-run package only in iptv/stream-ui.js: Promise.finally was replaced with an equivalent then after catch for older engines. Native Android IPTV assets were also transpiled to the declared older target and load the existing compatibility shim. All 37 JavaScript files across final Samsung and native Android IPTV payloads passed ES2017 parsing. Final missing-API simulation removes Worker, PerformanceObserver, IntersectionObserver and Promise.finally; its results are recorded separately. No physical television, decoder or GPU-memory certification is implied.

Evidence: `.tools/iptv-investigation/packaged227-soak15m-cpu4.json`.

Final missing-API simulation completed with zero JavaScript errors, twelve section switches, 100 distinct cards and five settings cycles. Worker/PerformanceObserver/IntersectionObserver/Promise.finally were absent. This validates compatibility paths, not physical device speed.
