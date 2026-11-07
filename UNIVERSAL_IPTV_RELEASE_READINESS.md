# Universal IPTV release readiness — verdict: NOT READY

## Gate status
- [x] Cross-platform pipelines audited (Android native, Samsung, LG, Fire TV-shared, legacy/out-of-scope).
- [x] Root causes per platform documented with evidence grades.
- [x] Smallest effective fixes implemented (native U1/U2) + type-checked; shared paths re-verified.
- [x] Automated checks runnable on desktop executed and passing (table in PERFORMANCE_RESULTS).
- [ ] Full packaging per target (needs signing keys/Tizen/LG toolchains; deliberately not run to
  avoid mutating the preserved worktree beyond the fix).
- [ ] **Hardware validation on every supported target — none performed. This alone blocks release.**
- [ ] 30-minute stability + repeated entry/exit + low-memory + network-cut runs — not performed.
- [ ] No deployment to physical devices (per rule 7 — approval required).

## Why not ready
1. All latency/memory figures are desktop simulation or static proof; real-device behavior
   (heat-throttled SoC, 1 GB RAM, old WebView GC, AVPlay/ExoPlayer quirks) is unmeasured.
2. Native U1/U2 correctness argument is type-check + protocol review, not an executed backend test.
3. Cold first-load of 50k+ catalogs on low-RAM hardware remains structurally heavy
   (full-array org.json parse); U1/U2 remove the repeat cost, not the first cost.
4. webOS 4.x and Tizen 3 remain uncertified/legacy; LG 5+ needs at least one TV pass.

## Release conditions (in order)
1. Run `.tools/android-tv-crash/capture-android-tv-logs.cmd` on the failing Android TV class;
   confirm failure class and re-measure with U1/U2 installed.
2. Execute the §2 scenario matrix on Samsung Tizen 4 + 5, LG webOS 5+, Android TV, Fire TV stick.
3. Record P50/P95/worst per platform; all P0 gates (no ANR/crash, no infinite load, no timeout on
   warm switch, stable 30-min mem) must pass on hardware.
4. Only then package/sign via the existing `build.py` pipelines and update `validation.json`
   artifacts (`physicalTVVerified` must be set from real runs, never assumed).

No production-readiness claim is made. The worktree contains exactly one product-code change set
(`IptvStore.java` U1/U2); everything else in this task is audit, verification, and documentation.
