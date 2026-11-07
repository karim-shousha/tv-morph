# MORPH TV — Performance Before / After

Environment for all numbers: desktop Chrome (headless, file://, 1920×1080, native TV globals stubbed).
**Not TV hardware.** TV gains are expected to be larger (layout-bound WebKit) but must be measured on-device (T1–T14).

## Measured (same probe, before → after)

| Metric | Before | After | Note |
|---|---|---|---|
| Boot to interactive | 2666–2689ms | 2676–2685ms | identical within noise (desktop not parse-bound) |
| Key-to-paint p50/p95 (20 synthetic presses) | 33.3/33.4ms | 33.3–33.5ms | rAF-quantized floor on desktop |
| `getBoundingClientRect` calls / 10 mixed presses | 46 (HEAD, incl. stale-cache reuse) | 69 total; steady-state 0–3/press | After = 1 drift probe + correctness rebuilds; HEAD skipped invalidation AND reused pre-scroll boxes (stale for one press) |
| DOM nodes | 674 | 678 (+wifi row, +2 subheads, +menu delta) | no detached growth |
| Page errors (all flows) | 3 without stub → 0 with stub | 0 | stub = TV native `MorphLocale`, unchanged app behavior |
| Slideshow timer off-Home | ran (skipped work) | cleared; re-armed on return | verified via interval tracking |
| Radio cadence idle | 1s forever | tier idle (5s/10s), paused hidden | verified hidden-idle |
| Regression suites | 13/13 | 18+6+4+5 checks green | new suites added, none removed |

## Screenshots

`tv-project/tools/perf-results-before/` vs `perf-results-p3/`: `home.png` (≈990KB both, clock-digit delta only),
`theme-emerald.png`, `settings.png` (intended: new category labels + dividers). No CSS paint rule changed,
so rendering is identical by construction outside the intended Settings relabeling.

## Unmeasured expected benefits (clearly labelled, need T1–T14 on TV)

- D-pad p95 on Tizen 5/6 SoCs: fewer layout passes per press (R1) — expect the largest win where `offsetWidth/getComputedStyle` per button dominated.
- Idle CPU/wakeups: radio/prayer/programme/slideshow governance (R2) — expect soak-test improvement.
- Cold start on low-end CPUs: deferred scripts parse in parallel — desktop shows no delta; TV WebKit may.

## Optional proposals requiring approval (NOT implemented — visual lock)

1. Flatten dock focus-ring gradients/pattern (R4) — needs design sign-off with A/B screenshots.
2. Theme-art ingest caps/downscales + single-resolution packs (R6) — needs asset pipeline + quality sign-off.
3. Text-size engine scoping (R10).
