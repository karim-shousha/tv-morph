# MORPH TV — TV Settings Restructure Proposal

> Design-only proposal. No code changed. Every existing option has exactly one destination.
> Nothing deleted, no contracts changed — only placement, labels, and grouping.
> IDs in brackets are the current runtime IDs; proposed labels are EN (AR/FR/ZH/JA mirrors in `settings-nav.js:4` style).

## Proposed top-level structure (7 categories)

1. **Appearance** — look, theme, text, artwork.
2. **Performance** — motion + performance tiers (unified, honest labels).
3. **Home & Apps** — what appears on Home and how apps are managed.
4. **Live TV & Inputs** — HDMI / Live TV surfaces (new home for the HDMI trio).
5. **Prayer** — unchanged scope, clarified subgroups (already the best-organized panel).
6. **Time & Weather** — clock + weather, split into two subgroups.
7. **System** — device, network-adjacent actions, storage, updates, about, support.
8. *(Platform-reserved, not user-created)* — Launcher/startup + IPTV account + Parental controls slots stay
   defined but **hidden until a provider registers them** (fixes ghost categories).

Rationale: 7 visible categories max; each maps to one user goal; platform orphans no longer render empty
panels; HDMI leaves "apps"; Plus/support leave "appearance".

## Complete current → proposed mapping (every option)

| # | Current ID | Current category | Proposed category / subgroup | Proposed label | Notes |
|---|---|---|---|---|---|
| 1 | `setting-clock` | time | **Time & Weather › Time** | Clock format · 12/24 hour | Unchanged semantics |
| 2 | `setting-units` | time | **Time & Weather › Weather › Units** | Temperature unit · °C/°F | Group with weather, not clock |
| 3 | `setting-location` | time | **Time & Weather › Weather › Location** | Weather location · Auto/Manual/Off | Same modal |
| 4 | `setting-refresh` | time | **Time & Weather › Weather › Location** (secondary action) | Refresh weather now | Demote to action row under location |
| 5 | `setting-theme` | appearance | **Appearance › Theme** | Theme | Same grouped modal |
| 6 | `settings-theme-packs` | appearance | **Appearance › Theme › Manage packs** | Theme packs · download & storage | Show storage meter inline |
| 7 | `.morph-plus-setting` | appearance | **System › About › Morph TV Plus** | Morph TV Plus | Move upsell out of appearance; keeps gate logic |
| 8 | `setting-text-size-ar` | appearance | **Appearance › Text size** | Arabic text size | Pair with EN; add preview line |
| 9 | `setting-text-size-en` | appearance | **Appearance › Text size** | English text size | Same |
| 10 | custom title/art/offsets (in Appearance modal only) | (modal, no setting ID) | **Appearance › Home artwork** | Home title, artwork & layout | Surface existing `applyRemoteConfig` keys as one subgroup instead of hidden modal-only |
| 11 | `setting-performance` | performance | **Performance › Mode** | Performance mode · Auto/Balanced/Full* | Persist into `C.settings` (contract fix); *names pending arch decision — see Perf audit §9 |
| 12 | `setting-motion` | performance | **Performance › Motion** (fold into Mode) | Reduce motion on/off | Fix inverted label; ideally becomes a per-tier override, not a peer toggle |
| 13 | `setting-recent-apps` | apps | **Home & Apps › Home rows** | Recently used apps row | Unchanged toggle |
| 14 | `setting-home-hdmi` | apps | **Live TV & Inputs › Home shortcuts** | HDMI shortcuts on Home | Moved to inputs domain |
| 15 | `setting-last-hdmi` | apps | **Live TV & Inputs › Home shortcuts** | Last HDMI card on Home | Moved |
| 16 | `setting-favourites` | apps | **Home & Apps › Pinned apps** | Manage pinned apps | Unchanged action |
| 17 | `setting-kids-home` | apps | **Home & Apps › Pinned apps** (or Family subgroup) | Kids World on Home | Fix flip-flop label → static "Show Kids World on Home · On/Off" |
| 18 | `setting-parental-controls` (orphan) | apps | **Home & Apps › Family** (hidden until provider) | Parental controls | Keep slot; render only if module registers |
| 19 | `setting-iptv-account` (orphan) | iptv | **Live TV & Inputs › IPTV account** (hidden until provider) | IPTV account / playlist | Keep slot; hidden until IPTV module registers it |
| 20 | `setting-prayer-visibility` | prayer | **Prayer › Visibility** | Show prayer times | Unchanged |
| 21 | prayer sub-options | prayer | **Prayer › Location & calculation / Adhan & audio / Visibility & break** (existing `unusedSettingsGroups`, `prayer.js:59` — promote to visible headers) | (unchanged labels) | Only change: render the three group headers that already exist in code |
| 22 | `setting-device-settings` | general | **System › Device** | Open device settings | Add "(TV system)" suffix; keep guide fallback |
| 23 | `nav-wifi` | header | **System › Device** (duplicate entry linking same action) | Wi-Fi settings | Keep header shortcut; add Settings row for discoverability |
| 24 | `setting-app-update` | general | **System › Updates** | Check for app update | Render only when `TVNative.checkAppUpdate` exists (already); label "(on this device)" |
| 25 | `setting-update-alerts` | general | **REMOVE from TV build / keep phone-only** | — | Dead on TV (`update-alert.js:3`); do not show a no-op toggle. Phone app keeps it |
| 26 | `setting-maintenance` | general | **System › Storage** | Apps & storage (device) | Render only when bridge exists (already) |
| 27 | `setting-support` | about | **System › About › Support** | Support Morph TV | Keep QR modal; add amount disclosure line |
| 28 | `setting-about` | about | **System › About › About Morph TV** | About Morph TV | Keep modal |
| 29 | `setting-boot/quick-return/startup` (orphans) | launcher | **(reserved) Startup** — hidden until native provider registers | (provider-defined) | Launcher category hidden while empty; hint note kept for diagnostics |
| 30 | viewer profiles (`viewer-button`) | header | **Home & Apps › Profiles** (link) + keep header shortcut | Who is watching? | Profiles are per-viewer settings scope — surface the link where pins live |

Result: no empty Launcher/IPTV panels in this build; no dead update toggle; Plus/support grouped with
About; HDMI grouped with Inputs; clock separated from weather.

## Interaction design (premium, remote-first, consistent with Modern Home)

- **Two-level drill-in (keep):** category menu → panel (`settings-nav.js:10-12` `open/home/back`).
  Keep Back-to-categories, keep `C.SettingsNav.arrow` up/down trapping, but replace its per-press
  `offsetWidth` scan (`settings-nav.js:12`) with the same cached-geometry fix as global focus (Perf R1).
- **Selected state:** every row shows current value (`strong` pattern already used: clock/units/theme —
  extend to ALL rows: performance mode, text sizes, HDMI trio, Kids, prayer visibility). No row without a value.
- **Toggles:** instant-apply + toast stays (current behavior); add `aria-pressed` everywhere
  (already on Kids/prayer-break, missing on HDMI trio — `home-refinements.js:15` has it, keep).
- **Destructive:** pack delete gets a confirm step (currently immediate, `packs-tv.js` remove).
  No other destructive actions exist.
- **Help:** one-line consequence caption under each row (reuse existing `settings-performance-note` /
  `settings-launcher-note` pattern, `settings-nav.js:14`): e.g. Performance explains "affects effects only,
  not timers — for now" (honest until arch lands); Device settings explains system handoff.
- **Platform availability:** rows that need a bridge show a "(device)" badge and degrade to the existing
  guide modals; never render dead rows (update-alerts rule).
- **Focus visibility:** keep 3 px outline + glow in full mode; in light mode keep outline, drop glow
  (already the pattern). Ensure `Back` from any panel lands on its category entry (`back()` already does).
- **Motion/lang/viewer changes** re-render labels in place (`morphLanguage`/`morphViewer` handlers exist);
  keep, add `morphPerformance` label refresh for the unified Mode row.
