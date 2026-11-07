# MORPH TV — TV Performance Optimization Roadmap

> Sequenced by dependency. No code changed in this investigation.
> IDs R1–R10 refer to `MORPHTV_TV_PERFORMANCE_DEEP_AUDIT.md §8`.

## P0 — Critical bottlenecks (fix blocking, leaks, focus latency, lifecycle)

| Order | Item | Depends on | Regression risk | Verify (from Test Plan) |
|---|---|---|---|---|
| P0-1 | R1: focus-path layout diet — viewport-cull + per-frame geometry cache; narrow `focus.js:23-24` observer filters; remove `offsetWidth` pre-filter | Test Plan T4 baseline first | Medium (focus misses if culling wrong — gate behind exact `hidden/disabled` checks) | T4 p95 <50 ms; T13 settings nav |
| P0-2 | R2a: govern timers — radio poll only when radio active + visible (`radio-background.js:11`); programme timer only while Inputs/watching (`app.js:199`); prayer tick throttle off-Home | P0-1 (so gains are separable) | Low-Medium (prayer timing must stay correct — keep 1 s only while Home/prayer visible) | T3 idle CPU/wakeups; T14 60-min soak |
| P0-3 | R2b: observer scoping — disconnect or narrow `subtree:true` observers; suspend during `renderCatalog` batch (`app.js:102-110`) | P0-1 | Medium (stale focus if invalidate skipped — keep explicit `Focus.invalidate()` calls) | T9 playlist-scale render; T4 |
| P0-4 | Lifecycle audit: confirm fitness engine abort on Home return (`fitness-ui.js:454`); confirm `app-actions` poll always closed | — | Low | T12 fitness enter/leave; T14 |

## P1 — Rendering & asset optimization

| Order | Item | Depends on | Regression risk | Verify |
|---|---|---|---|---|
| P1-1 | R4: flatten dock focus ring (1–2 layers, drop `repeating-radial-gradient`, single glow shadow) `modern-shell.css:54,104,117` | Visual sign-off (design frozen otherwise) | Medium (visual change — A/B screenshots) | T6 hero/focus; T7 theme change |
| P1-2 | R6a: theme-art ingest caps — max dimension + byte cap, single resolution per asset, drop duplicate `hq/v1/v2` twins | P0 (independent) | Low (quality sign-off per theme) | T6; T8 IPTV unaffected |
| P1-3 | R6b: slideshow single-layer crossfade; user-art downscale ≤1920 w (`artwork.js:2`, `app.js:11`) | P1-2 | Low | T6 |
| P1-4 | R6c: remove `.dock-reflection` icon clone (`catalog.js:21`) or reuse decoded bitmap | — | Low (visual: reflection disappears in full mode too) | T2 first render; T6 |
| P1-5 | R5: unblock cold start — head/preload CSS, `defer` non-critical JS, defer `moment-timezone`/`prayer` past first focus (`index.html:34`) | — | Medium (order dependencies — `boot-theme`/`core` stay sync) | T1 cold start; T2 |
| P1-6 | R7: catalog search debounce + churn-free diff | P0-3 | Low | T9; T13 |

## P2 — Settings restructuring (no contract changes)

| Order | Item | Depends on | Regression risk | Verify |
|---|---|---|---|---|
| P2-1 | Re-map panels per Restructure Proposal (placements only); hide empty Launcher/IPTV until providers register; remove TV-dead update toggle | — | Low (placement-only) | T13 full walk |
| P2-2 | Label fixes: motion invert (`app.js:131`), Kids flip-flop (`kids.js:24`), value shown on every row | P2-1 | Low | T13 |
| P2-3 | Persistence unification prep: route `performanceMode` through `C.settings` (contract change — flag-gated) | Perf arch decision | Medium (viewer scope, native bridge) | T13 persistence round-trip |

## P3 — Performance architecture (evidence-gated)

| Order | Item | Depends on | Regression risk | Verify |
|---|---|---|---|---|
| P3-1 | Unified controller: Quality/Balanced/Performance gating **work** (timers, observers, decode, focus tiers) + honest Auto (downgrade on measured `move()` p95) | P0 (must fix code first per strict principle) | Medium | T3/T4/T14 A/B per tier |
| P3-2 | Platform adaptation: Tizen ≤6 default Balanced-or-lower; webOS decode caps; Android bridge batching (`ui-mode.js:22` saveSettings) | P3-1 | Low | Per-platform T1/T4/T14 |

## P4 — Validation & polish

- Full Test Plan pass (T1–T14) on Samsung Tizen 5/6, current Tizen, webOS, Android TV.
- Visual A/B for P1-1/P1-4 (screenshots, no design drift beyond approved flattening).
- 60-min soak ×2 (Home idle + mixed nav) confirming no growth in timers/listeners/DOM nodes.
- Ship report: measured before/after for R1 (input-to-paint), T1 (cold start), T3 (idle), T6 (slideshow).

## Dependencies graph (summary)

`T4-baseline → P0-1 → P0-2/P0-3 → P1 → P3-1 → P4`. P2 is parallel-safe at any time.
P3 must not precede P0 (no masking inefficiency with quality cuts).
