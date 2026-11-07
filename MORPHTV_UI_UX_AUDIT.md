# MorphTV — Full UI/UX Design Audit

**Audit date:** 2 November 2026  
**Scope:** Current working-tree implementation of Morph TV, Morph Launcher, shared Morph IPTV, radio, desktop wrappers, and relevant native Android presentation.  
**Status:** Audit and recommendations only. No application code, configuration, functionality, builds, or deployed pages were changed for this audit.

**Concurrent-work note:** During final review, another chat announced and added a desktop-only fullscreen-player fix in `pc-app/desktop.css`, `media-engine.js`, `main.cjs` and its regression test. This audit did not make those changes. The report was reconciled against the new source: active playback now has a viewport override and an in-player Back/fullscreen path. That change was not rebuilt or device-tested by this audit. Findings about the ordinary desktop launcher/settings canvas remain applicable; earlier scaled-player sizing is not presented as a confirmed defect in the new player path.

## 1. Executive summary

MorphTV has considerable functional breadth, but its visual architecture does not yet support a consistently refined commercial experience. The principal problem is not that every button or heading is too large. It is that several generations of presentation rules, navigation controllers, theme systems, and platform adaptations compete to define the same interface.

The phone host is already light by default and contains some appropriately sized controls. However, large promotional introductions, repeated instructions, inconsistent cards, and deep action placement make everyday tasks feel slower and less direct than they should. The TV launcher has a recognizable composition, but oversized informational areas, separate navigation systems, inconsistent panel geometry, and background-dependent readability weaken hierarchy. Desktop inherits TV composition through global scaling, then adds another independent navigation and sizing layer. This produces inconsistent effective control sizes instead of a true desktop density model.

**Overall assessment:** Functionally ambitious; visually fragmented; substantial design-system and interaction-architecture debt. The current implementation should not be considered a unified premium design system. This is a professional heuristic assessment, not a usability-study score, store-certification result, or measured accessibility conformance rating.

### Most important findings

| ID | Finding | Evidence status | Priority |
|---|---|---|---|
| A01 | Presentation ownership is fragmented across many stylesheets and additive controllers. | Source verified | High — foundational |
| A02 | Phone landing screens prioritize introductions and decorative images over the action users came to perform. | Rendered and source verified | High |
| A03 | Desktop scales a 1920×1080 TV canvas instead of maintaining independent desktop control dimensions. | Source and deterministic geometry verified; native minimum-window rendering not tested in this audit | High |
| A04 | Phone bottom navigation is edge-attached rather than floating; measured children extend below its container. | Rendered and source verified | High |
| A05 | Text enlargement is constrained by viewport settings and native zoom configuration. Accessible enlargement remains unproven. | Source verified; assistive/device behavior unverified | High; accessibility release gate |
| A06 | Phone Devices repeats the discovery CTA; IPTV repeats destination instructions. | Rendered verified | High |
| A07 | English launcher hero text retains RTL direction. | Rendered and source verified | High |
| A08 | Settings gives a large introductory Plus panel priority over frequently used categories. | Rendered and source verified | High |
| A09 | Empty IPTV history occupies approximately 227 px of a 1080 px screen in the populated fixture. | Rendered verified | High |
| A10 | Border radii, focus decoration, icon treatment, gradients, and component heights lack consistent semantic roles. | Source and rendered verified | High |
| A11 | Several controls are smaller than a comfortable phone hit-area target, while neighboring cards consume excessive space. | Some rendered examples verified; automatic small-target candidates require individual review | High |
| A12 | Modal, sheet, Back, and focus ownership is distributed across multiple systems. | Source verified; exhaustive interaction behavior unverified | High |
| A13 | Radio uses a disproportionately large idle player and a misleading empty-state message outside Favorites. | Layout rendered; empty-copy branch source verified | Medium–High |
| A14 | Runtime performance mitigations exist, but source complexity and repeated style ownership create maintenance and rendering risks. | Source verified; no new performance trace | Medium–High |

The recommended response is a controlled consolidation of design rules and primary flows. Another global “premium” CSS file would increase the underlying problem.

## 2. Scope, evidence, and limitations

### 2.1 Evidence labels

- **[S] Source verified:** A rule, implementation pattern, dimension, or behavior is present in the inspected source. A declaration alone does not prove that it wins the cascade in every state.
- **[V] Render verified:** Observed in a fresh headless Microsoft Edge rendering of current source under the conditions below.
- **[R] Recommendation:** Proposed future design or architecture. It has not been implemented or user-tested.
- **[U] Unverified:** Requires a device, real data, platform integration, accessibility tooling, or further interaction testing.

A recommendation is not presented as an existing bug. An accessibility risk is not automatically a confirmed WCAG failure. A source declaration that is overridden is not treated as the active component size.

### 2.2 Project structure and ownership

| Area | Primary implementation | Audit treatment |
|---|---|---|
| Morph TV phone host | `mobile-app/assets/ui/` | Entry document, active style/script stack, routing/controllers, connection, design, remote, IPTV entry, casting, settings, matches, worship and supporting UI |
| Phone IPTV presentation | `mobile-app/phone-iptv.css`, `mobile-app/phone-iptv.js` | Adaptation of shared IPTV; not a separate catalog implementation |
| Shared IPTV | `android-tv/iptv/` | Canonical source for embedded and standalone products |
| Morph Launcher | `tv-project/app/` | Home, apps, inputs, settings, family, prayer, fitness, children, USB, network, themes, overlays, player chrome |
| Shared radio | `android-tv/radio/` | Catalog, player, search, categories, favorites, sleep and screen-off controls |
| Native Android UI | `android-tv/src/local/tvmorph/tv/`, `mobile-app/src/local/cleartv/mobile/` | Native player geometry, WebView configuration and platform handoff; static review |
| Legacy Android | `android-legacy/src/` | Reduced native UI; do not assume modern feature parity |
| Desktop | `pc-app/` | Presentation overrides, toolbar, file browser, staging and window sizing |
| LG and Samsung | `webos-app/player.js`, `mobile-app/samsung-media.js`, compatibility/build adapters | Shared catalog and platform-specific player integration; static review |
| Standalone packaging | `standalone-iptv/`, `iptv_shared.py` | Startup, branding, standalone-only features and shared-source boundaries |
| Archived/adjacent work | Existing previews, old redesign reports, generated builds, `sports.js/css`, excluded VIDAA directory | Not assumed to be current active UI. No proposal to add VIDAA support. |

The public landing page is a separate marketing surface. It is not used as evidence that the application itself has a coherent design system. Previous audit documents are historical context, not proof that current source has been verified.

### 2.3 Source census and active entry points

The static census excludes generated builds, dependencies, vendor libraries, tests, image assets and Quran content data. It is an inventory, not a claim of manual line-by-line review of every Java class.

| Source area | HTML | CSS | JS | Java |
|---|---:|---:|---:|---:|
| Phone host `mobile-app/assets/ui` | 2 | 30 | 42 | — |
| Launcher `tv-project/app` | 3 | 40 | 74 | — |
| Shared IPTV | 2 | 19 | 29 | — |
| Radio | 1 | 5 | 8 | — |
| Native TV implementation | — | — | — | 97 |
| Native phone implementation | — | — | — | 43 |
| Legacy Android | — | — | — | 4 |

Desktop `.cjs` modules and Python staging files were inspected separately from this extension-based table.

Active entry documents contain:

| Entry point | Stylesheet references | External script references | Locally resolved linked CSS bytes* |
|---|---:|---:|---:|
| `mobile-app/assets/ui/index.html` | 30 | 47 | 1,435,610 across 29 local files |
| `tv-project/app/index.html` | 37 | 68 | 319,711 across 37 files |
| `android-tv/iptv/index.html` | 19 | 31 | 343,666 across 18 local files |
| `android-tv/radio/index.html` | 5 | 11 | Not used as a budget claim |

*Raw source bytes, not compressed network transfer, CPU time, or shipped APK size. Some references are staged from shared locations. Large embedded resources contribute materially to these totals.

### 2.4 Rendered coverage

Fresh browser inspections were performed without connecting to real user accounts or devices:

1. **Phone host:** 40 states: Devices, Design, IPTV entry, Remote, and Cast; English and Arabic; 320×740, 390×844, 844×390, and 768×1024 CSS-pixel viewports.
2. **Launcher:** Home, Apps, Settings and Inputs at 1920×1080 and 1280×720: eight states. The locale script and fixed-canvas flag normally supplied by packaging were supplied by the audit harness.
3. **Shared surfaces:** IPTV Home with synthetic provider data at 1920×1080 and 1280×720; phone IPTV at 390×844 and 844×390; radio at 1920×1080 and 1280×720.
4. **First run:** Separately observed the genuine initial language-choice overlay before dismissing/suppressing it in isolated browser storage for main-screen inspection.

There were no page JavaScript errors in the corrected phone-host and launcher matrices. No document-level horizontal overflow was detected in the 40 phone-host states. Neither result proves complete responsive or interaction correctness: content may still be obscured, clipped, below the fold, or difficult to operate.

The first phone pass was covered by onboarding, and the first raw launcher pass lacked packaging-supplied locale setup. Those passes are not counted as successful main-screen verification. Corrected evidence is explicitly named `*-confirmed.json`.

### 2.5 What was not verified

- Fresh physical Android, Android TV, Samsung Tizen, LG webOS, Windows or macOS device execution during this audit.
- TalkBack, screen readers, switch control, OS font enlargement, magnification, real virtual keyboards, notches, gesture insets, TV overscan, or real remote hardware.
- Native video decoding, protected content, provider failure recovery, subtitles, native PiP, multiview, DLNA/OpenWebif, casting, TV pairing or purchases.
- All populated/loading/error/empty combinations of every screen, every theme, long account/provider names, or all supported languages.
- Real-device frame timing, memory, GPU cost, startup latency or sustained scrolling performance.
- Exact contrast for every element over user artwork or gradients.
- Phone IPTV illustration rendering in the simple source harness: three `../ui/iptv-home-*.png` mappings were absent. Those missing harness assets are **not** reported as product asset defects.
- Radio native station injection was not present; its rendered zero-station state is a fixture limitation, not evidence that production catalogs are empty.

No current application build was generated. Existing release binaries and previous screenshots were not substituted for current-source verification.

## 3. Overall design-system assessment

### 3.1 A01 — Too many competing presentation authorities [S]

The phone loads base, bright, appearance, Morph 3.0, cinematic, studio, premium, approved, navy, glass, daylight, editor and landing layers in sequence. The launcher similarly layers base, polish, home reference, modern shell, navigation, premium theme and shared-header rules. IPTV has base, TV library, readable, cinematic, stream, navigation, theme contract and premium/cinema variants.

This makes a component's appearance dependent on selector specificity, body attributes, script timing and load order. A name such as “premium” does not identify an authoritative owner.

Evidence: `mobile-app/assets/ui/index.html:2`; `tv-project/app/index.html:36`; `android-tv/iptv/index.html:1`; `mobile-app/assets/ui/daylight-mobile.css:921–924`; `tv-project/app/ui/nav-system.css:1`; `tv-project/app/ui/header-shared.css:1`.

**[R]** Declare one owner for foundations, one for reusable components, and one per platform layout. Migrate existing behavior into those owners incrementally. Remove obsolete layers only after visual and interaction coverage proves that they are redundant.

### 3.2 A02 — Oversizing is concentrated in composition and task placement [S, V]

The phone headings measured around 25–29 px, which is not inherently excessive. The stronger problem is the combined height of introduction copy, illustration, duplicate helper cards, destination cards, explanatory paragraphs and secondary sections before a useful action.

The Remote landing shows a large illustrative remote card while operational controls are further down. The phone IPTV entry dedicates the first view to description and destination selection. Devices repeats discovery in a large hero and another panel. TV settings promotes Plus before the category menu. These patterns make the interface feel inflated even where individual text sizes are reasonable.

Evidence: `premium-landings.css:17,48`; `navy-mobile.js:3`; `morph30.js:94`; rendered phone screenshots linked below; launcher settings screenshot.

**[R]** Budget the first viewport around the primary task. Keep introduction copy to one or two lines after first use; make decoration subordinate; show the primary action before educational content.

### 3.3 A03 — Desktop lacks an independent responsive density model [S]

`screen-fit.js:12–15` scales the entire 1920×1080 body. `pc-app/stage.py` additionally reserves 64 px for the desktop toolbar. `pc-app/desktop.css:26–48` then patches fixed settings heights and player control sizes. `pc-app/main.cjs:59` permits a 960×600 minimum window.

A 46-design-pixel control **left inside that scaled canvas** would become approximately `46 × min(960/1920, 536/1080) = 22.8 CSS px` in a hypothetical 960×600 content viewport with a 64 px toolbar. Actual usable client area can be smaller than the outer native window. This is a deterministic sizing risk, not a newly measured native-window failure or automatic WCAG finding. The concurrent fix adds `html.morph-playing` viewport overrides for playback, so this example must not be used to claim that the updated active player still has a 22.8 px target.

The unscaled 40 px toolbar and scaled in-app controls also create two density systems in the same window.

**[R]** Use actual desktop CSS-pixel dimensions for controls and forms. Allow the content grid to reflow. Reserve TV-canvas scaling for the TV presentation mode, where normalized screen geometry serves a different viewing-distance requirement.

### 3.4 A04 — Bottom navigation is not geometrically contained [S, V]

At 390×844, the phone bar measured `x=0, y=776, width=390, height=68`. Its navigation buttons measured about `91×64` at `y=784`, ending at `848`: 4 px below the viewport. The bar is full-width and attached to the viewport edge, rather than floating.

Evidence: `premium-landings.css:103–105`; `studio-shell.css:68–70`; `approved-mobile.css:71`; `output/ui-ux-audit/phone-runtime-confirmed.json`.

**[R]** If adopting the requested floating direction, use 12–16 px side insets, a contained 64 px content height, 48 px item hit areas and 8 px vertical padding. Add the real platform bottom inset separately. Test both four-item navigation and the optional Worship destination before finalizing geometry.

### 3.5 A05 — Text enlargement and readability are not sufficiently protected [S, U]

The phone entry viewport sets `maximum-scale=1,user-scalable=no`. Native phone `MainActivity.java:20` disables support/built-in zoom and sets text zoom to 100. The customization UI in `app.js` exposes an 80–130% range for its text-scale sliders. This does not establish support for 200% readable text throughout application chrome.

Some controls use small secondary labels; icon-only actions can be visually understated while large decorative cards dominate. This combination is inefficient for users who need stronger readability.

**[R]** Treat 200% text enlargement and reflow of ordinary forms as a release gate. Verify real OS behavior before declaring a conformance failure or success. Do not solve oversized cards by reducing body copy below an accessible reading size.

### 3.6 A06 — Duplicate actions and instructions dilute hierarchy [V]

Devices displays “Find your TV” in the blue hero and “Find my TV” in the next expanded step. IPTV entry repeats “Choose IPTV on your phone or on your TV” in two adjacent helper regions before destination cards.

Evidence: `navy-mobile.js:3`, `morph30.js`, `premium-landings.js`, `iptv-phone.js`, current phone Home/IPTV screenshots.

**[R]** One primary action per immediate task region; secondary repeat actions only where distance or workflow makes them useful. Keep the meaningful phone/TV subscription-boundary explanation, but consolidate its placement and wording.

### 3.7 A07 — Directionality is applied to content rather than language [S, V]

The English launcher hero still has `dir="rtl"`, confirmed at both inspected TV sizes. Punctuation appears at the wrong visual end in the rendered English headline and supporting copy.

Evidence: `tv-project/app/index.html:9`; `theme-locale.js`; `output/ui-ux-audit/tv-runtime-confirmed.json`.

**[R]** Set direction from the active language or individual content using appropriate `dir`/bidi isolation. Keep numbers, URLs, time codes and provider identifiers independently LTR where necessary. Do not use RTL as a general alignment mechanism.

### 3.8 A08 — Settings prioritization and density are inconsistent [S, V]

The TV Settings first view is dominated by the Plus information card. At 1280×720, only part of the category grid fits in the first viewport. `settings-nav.css:2` declares an earlier 240 px category tile, but later rules at `:9–13` replace it with a 140 px row-like tile. Desktop applies another 112 px override. The original 240 px value must not be mistaken for the final current size.

**[R]** Put frequent settings first. Reduce the promotion to an inline banner or separate section. Standardize category entries as compact rows or a restrained grid, then give individual settings pages a clear, consistent content width and scroll owner.

### 3.9 A09 — Empty content retains populated-content dimensions [S, V]

The shared IPTV fixture shows an empty Continue Watching panel about 227 px tall at 1920×1080. It takes roughly one fifth of the screen height before subsequent content. `stream-ui.js:62` renders the empty state as a button that opens a library.

**[R]** Use a small empty-state row with an explicit browse action, or omit the empty shelf while preserving a path to history. Do not make the entire large blank container look like populated content.

### 3.10 A10 — Shape and elevation have no stable component meaning [S, V]

Existing token radii include 14/22/34 px (`ui/tokens.css`), while component styles use 19, 24, 25, 28, 40 and 42 px. Examples include the family overlay's 42 px card radius, 40 px navigation shells, 25 px phone heroes, and 19 px phone settings cards. Multiple inset/glow/shadow definitions coexist with performance rules that disable many of them.

**[R]** Use a small semantic radius set and restrained elevation. Reserve full pills for chips and segmented selection, not every large panel. Evaluate the active rendered effect rather than assuming every declared shadow is present.

### 3.11 A11 — Small hit areas coexist with oversized decoration [S, V]

The phone Settings header action measured 35×40 px. Visible Design color swatches measured 32×32 px. These are below the proposed comfortable 44–48 px touch-area standard, although 32 px swatches are not automatically failures of WCAG's 24 px minimum criterion.

The automatic scan also found native checkboxes, sliders and elements inside collapsed content. Those require label/ancestor hit-area and visibility inspection before classification. A 17 px checkbox glyph can be acceptable when its associated label provides a sufficiently large target.

**[R]** Keep small visual glyphs inside larger interactive areas. Audit actual hit rectangles, spacing and label activation rather than inflating every visible icon.

### 3.12 A12 — Modal and navigation ownership is distributed [S, U]

Phone `app.js`, `morph30.js`, first-run, source setup and IPTV each own aspects of navigation or Back handling. `morph30.js:94` aliases Apps to Remote; its page map at `:61–67` treats Cast as a Control sub-route. Launcher and IPTV maintain additional custom focus scopes and overlays. Some modules replace or wrap shared methods.

There are good existing provisions: first-run marks background content inert, the phone settings sheet has a Tab trap, and TV focus scopes are explicit. Their existence should be preserved. It does not prove that every nesting combination restores focus and scroll correctly.

**[R]** Establish an overlay stack and a route contract with an owner, opener, initial focus, close action, return focus and scroll restoration. Preserve platform-specific Back expectations.

### 3.13 A13 — Radio uses too much idle-player space [S, V]

At 1920×1080, the idle radio panel occupies a large left column with artwork, decorative waveform, title, transport and volume before a station is selected. The 92×92 primary play control is declared in `premium-radio.css:53`. That size is not inherently wrong for a TV primary control, but the overall idle composition is disproportionate to its information content.

`radio/app.js:5` uses the “No favorites yet. Hold OK…” empty copy whenever there is no search query, even outside the Favorites category. That branch can misdescribe an empty catalog or category.

**[R]** Compact the idle player, prioritize station browsing, expand now-playing information when useful, and distinguish empty category, empty favorites, loading and unavailable catalog states.

### 3.14 A14 — Performance concerns require evidence, not assumptions [S, U]

`mobile-app/phone-iptv.css` contains approximately 1.04 MB of UTF-8 source, including roughly 770,630 characters of embedded data payloads. It also contains 3,134 `!important` declarations. `daylight-mobile.css` contains 1,705 such declarations and repeated exact selectors. Counts are lexical diagnostics, not a CSS AST complexity score or a runtime benchmark.

The code already mitigates performance: `performance.js` starts with optional effects reduced; `media-performance.js` disables expensive blur; media code includes incremental catalogs and constrained artwork work. Do not remove those protections or claim that blur is always active.

**[R]** Consolidate duplicate rules, keep an offline-capable font policy, inspect generated CSS provenance, and measure style recalculation, layout, painting, memory and scrolling on target devices before making performance claims.

## 4. Screen-by-screen audit

The following tables deliberately include source-only surfaces. **[S/U]** means the implementation was inspected but the full interaction or device state was not rendered during this audit. All dimensions below are **proposals [R]**, unless the cell explicitly says “current.” TV measurements are 1920×1080 design units, phone/desktop measurements are CSS px, and native Android interaction measurements should be implemented in appropriate dp/sp units.

### 4.1 Morph TV phone host

| Screen/component and source | Current problems and why the design is weak | Oversizing/proportion | Layout/spacing | Recommended improvement | Suggested dimensions | Priority |
|---|---|---|---|---|---|---|
| **P01 First run / language** — `first-run.js:3–19`, `first-run.css`, `daylight-mobile.css:772` [S,V] | A mandatory language choice precedes entry, but disabled Get Started resembles understated text. First-run copy is initially English while offering Arabic; initial focus should not suggest an already selected choice. | Large cumulative stack: logo, heading, two language cards and three service cards. | Landscape exposes only part of the stack at once. Scroll and focus must keep the eventual CTA reachable. | Make required selection and disabled state explicit; simplify service explanation; retain inert background behavior. | Logo 112–136 wide; title 24–28; language targets ≥48 high; service rows 56–64; gap 16; CTA 48. | High |
| **P02 Devices / connection home** — `index.html`, `navy-mobile.js:3`, `connect-flow.js/css`, `premium-landings.css:17` [S,V] | Discovery appears twice with near-identical labels. Reconnect chrome competes with initial pairing. The screen reads like onboarding after the user has already entered. | The blue illustrated intro consumes most of the useful upper area. | Hero, eyebrow and expanded step card delay scan results. | One connection status summary and discovery CTA; move setup education into expandable help; state-dependent reconnect. | Header 56–64; summary 80–112; CTA 48; page gutter 16–20; section gap 24. | High |
| **P03 Discovery results / saved devices** — `connect-flow.js`, `app.js`, `setup-options.js` [S/U] | Discovery, pairing, platform and installation capabilities are spread across multiple panels. Unavailable and disconnected actions need clearer distinction. | Repeated device cards/CTAs risk inflated lists; final populated dimensions unverified. | Results, progress and manual entry need a single scan region. | Stable compact device rows; clear searching/empty/error/paired states; one primary action per row. | Device row 64–80; icon 24–32; 12–16 padding; 48 action hit area. | High |
| **P04 Manual IP / Samsung / LG pairing** — `setup-options.js/css`, `lg-connect.js`, `connect-flow.js` [S/U] | Protocol-specific instructions mix with everyday connection work. Long technical copy increases cognitive load. | Full-width controls repeat at multiple workflow levels. | Input, validation and next action should be adjacent rather than separated by guide blocks. | A short sequential form with platform-specific help revealed when needed; retain complete pairing functionality. | Field 48–52; label 13–14; helper 13; form gap 16; action gap 12. | High |
| **P05 Installation / updates / progress** — `app.js` `operation()`, `update-alert.js`, `guide.js`, `compatibility.js` [S/U] | The operation overlay hides Close during work. Timeouts can be very long, so state and recovery copy are crucial. Cancellation support varies by platform. | Large generic overlays can overwhelm a bounded task. | Progress, current step, elapsed/retry state and recoverability need clearer grouping. | Distinguish cancelable work from work that must finish; show meaningful status without inventing progress percentages. | Dialog 320–480 max width; padding 20–24; action 48; progress text 14–16. | High |
| **P06 Design landing** — `morph30.js`, `approved-mobile.js`, `studio-editor.js`, `premium-landings.css` [S,V] | Attractive but layered: introduction, preset thumbnails, swatches, category accordions and Apply compete. A disconnect between preview, configuration and action is possible. | Title is currently 27 px; not itself excessive. Large surrounding whitespace and hero art matter more. | Advanced controls and old detail structures remain beneath the compact landing. | One preview, preset strip, concise editing entry and stable Apply action; advanced options remain progressive disclosure. | Preview 16:9; preset thumbnails 96–120 wide; summary cards 56–72 high; Apply 48. | High |
| **P07 Theme library / theme preview** — `clubs.js`, `packs-phone.js`, `theme-preview` staging, `app.js` [S/U] | Packs, club identity, premium state, preview and application are separate concerns but share card decorations. Status can dominate artwork. | Inconsistent poster, illustration and theme-thumbnail proportions. | Selection, download state and Apply need stable slots. | Standard theme-card anatomy with explicit selected/downloaded/locked states and a preview-before-apply workflow. | 2-column small-phone grid when readable; gap 12; caption 13–14; radius 12–16. | Medium–High |
| **P08 Personal touch / layout / text / colors** — `studio-editor.js`, `customization-sections.js/css`, `app.js` [S,V] | Many low-level controls expose implementation detail and create long forms. Small swatches sit beside oversized section summaries. | Current visible swatches 32×32; some summary cards have 76 px minimum height. | Repeated sliders and color inputs require semantic grouping and explicit reset scope. | Group Background, Typography and Cards; progressive advanced controls; descriptive defaults and undo/reset boundaries. | Swatch glyph 24–28 inside ≥44 target; field 48; slider interaction lane 44; group gap 24. | High |
| **P09 Family profiles in Design** — `index.html#family-panel`, `app.js`, `customization-sections.js` [S/U] | Editing a TV profile is a different task from choosing a local theme. Device/profile context can be lost in the design flow. | Full-width Load/Switch/Create controls make a secondary task tall. | Current device and selected profile should remain visible while editing. | A compact context selector with a dedicated profile-management screen/sheet. | Profile row 56–64; avatar 32–40; 16 padding; management actions 44–48. | Medium–High |
| **P10 Remote landing** — `remote-visual.js/css`, `premium-landings.css:48` [S,V] | An illustrative remote and capability cards precede working controls. The illustration demonstrates the product rather than helping perform a command. | The large artwork card is disproportionate for returning users. | At 844×390, the fixed bottom bar leaves very little vertical space for the current intro and segments. | Put the operational remote first after pairing; use a compact device/status line; move capability education to help. | Intro 48–72; segment 40–44; visible primary control region within first 520–600 px on portrait phone. | High |
| **P11 Remote D-pad / volume / keyboard / touchpad** — `remote.css`, `remote-visual.js/css`, `app.js` [S/U] | Multiple visual remote styles and capability rules coexist. Stronger primary controls can be appropriate; indiscriminate shrinking would harm operation. | Large D-pad is justifiable; auxiliary actions need a more restrained scale. | Group navigation, playback and system controls; avoid a wall of equally prominent keys. | One coherent remote component family with clear device capability/connection state; retain all supported key behavior. | D-pad 200–240 diameter; primary zones ≥48; OK 64–72; auxiliary controls 44–48; gaps 8–12. | High |
| **P12 Apps / app library** — `app-library.js`, `library.css`, `morph30.js:94` [S/U] | Apps navigation aliases to Remote, while app-library source and Control sub-route concepts remain. The information architecture is difficult to infer. | App-icon/card dimensions are not governed by a shared inventory component. | Search, installed state, TV destination and unavailable state need consistent ordering. | Clarify the route and destination; standardized app cells with explicit unavailable status. | Icon 40–48; cell ≥72 high; grid gap 12; search 48. | High |
| **P13 Cast / mirroring / DLNA** — `cast-screen.js`, `dlna-cast.js`, `phone-network.css`, `index.html#page-cast` [S,V/U] | Mirroring, sending a file, local-server browsing and installation explanations occupy one long surface. These are different tasks. | Instructional panels are larger than the task selector; compact DLNA controls coexist with large primary buttons. | Main actions and platform limitations are separated by substantial content. | Choose a task first; present one focused flow, with capabilities and connection requirements beside that task. | Task rows 64–80; transport 44–48; input 48; help body 14–16. | High |
| **P14 IPTV entry / phone vs TV** — `iptv-phone.js`, `iptv.js`, `premium-landings.js/css`, `matches-entry.js` [S,V] | Repeated destination explanation and multiple introduction regions make starting playback feel indirect. | Current destination cards are large relative to their two choices. | Public/personal-source actions begin lower than the primary intro and explanatory stack. | One compact destination switch, current-source summary and immediate Watch/Add source action; preserve independent phone/TV account contexts. | Destination segment 44–48; source summary 64–80; primary action 48; one helper paragraph. | High |
| **P15 Phone account manager / removal** — `iptv-source-form.js`, `iptv-account-manager.js:5`, `iptv-sources.css` [S/U] | Device selection, account selection, activation and removal require strong destructive-action distinction. Inline confirmation declares `alertdialog` with `aria-modal=false`; test that behavior instead of assuming a full modal. | Multiple full-width actions can crowd a form. | Destructive operations must remain tied to the selected account and destination. | Shared account-row and confirmation patterns; explicit account name and device in removal copy. | Row 64–80; fields 48; destructive confirmation 320–480 wide; action targets ≥44. | High |
| **P16 Matches entry / native-hosted match page** — `matches-entry.js`, `matches-screen.html`, `matches-phone.js/css` [S/U] | A separate hosted document introduces another header, typography and routing boundary. Day filters, favorites and limited coverage need a consistent hierarchy. | `matches-phone.css` includes a 220 px minimum hero and 29 px title; the hero can be excessive for a frequently checked schedule. | Filters should not push actual fixtures out of the first view. | Compact date/filter header, readable fixture rows, local-time indication, explicit empty/limited coverage states. | Header 56–64; filters 40–44; fixture row 72–88; badges 28–32; score 18–20. | High |
| **P17 Worship opt-in / home / prayer settings** — `worship-phone.js/css` [S/U] | A new `--wf-*` design namespace duplicates application-level surfaces and shapes. Optional navigation changes the bottom-bar item count. | Hero uses 25 px radius and substantial padding; explanatory cards can repeat. | Opt-in, feature home and prayer settings need clear boundaries. | Preserve explicit opt-in and offline behavior; map feature tokens to shared semantics; test five-item nav geometry. | Settings row 56–72; icon 24; home cards 88–112; spacing 16/24; touch target 48. | Medium–High |
| **P18 Quran / reader / adhkar / tasbih** — `worship-phone.js`, `worship-phone.css`, `faith/faith-content.js` [S/U] | Reader accessibility and religious text legibility should not inherit promotional UI density. Search, bookmarks, font size and progress need quiet controls. | Reader text must be intentionally larger than general UI; a large counter can be useful, unlike a large decorative hero. | Keep reader width, line height and persistent controls stable through enlargement. | A dedicated reading mode with adjustable typography and restrained controls; preserve local content and privacy. | Reader 20–24 initial, Arabic Quran 24–30 subject to testing; line height 1.7–2; max text measure 60–70 characters where applicable; counter target ≥72. | High accessibility; Medium visual |
| **P19 Settings / language / appearance / help / Plus sheets** — `morph30.js:303,451`, `appearance.js/css`, `support.js`, `plus-phone.js` [S/U] | Preferences are moved between legacy DOM structures and a gear sheet. This obscures section ownership and makes consistency fragile. | Header Settings action currently 35×40; sheet rows and promotions use different scales. | Separate product support and paid-feature explanation from core preferences. | One settings hierarchy, consistent sheet header/close/footer, explicit light/dark selection, persistent focus restoration. | Header action ≥44 square; rows 48–56; sheet max width 560 on tablet; content padding 20–24. | High |

### 4.2 Morph Launcher / television

| Screen/component and source | Current problems and why the design is weak | Oversizing/proportion | Layout/spacing | Recommended improvement | Suggested dimensions | Priority |
|---|---|---|---|---|---|---|
| **T01 Home / hero** — `index.html:9`, `home-reference.*`, `home-refinements.*`, `ui/premium-theme.css` [S,V] | English content remains RTL; generic brand copy occupies prime space regardless of context. Several strong anchors compete: left tool rail, top navigation, right summaries and lower dock. | Current hero title 64 design px; legitimate TV scale, but composition gives it more authority than useful content. | Large middle-to-bottom open region while the dock sits near the lower edge. | Correct bidi, reduce repetitive brand messaging after first use, and prioritize actionable content while preserving user-selected artwork. | Hero title 48–64; body 22–26; side safe area 64–80; content/dock separation 24–32. | High |
| **T02 Header / weather / clock** — `ui/header-shared.css:1–20`, `weather.js` [S,V] | Navigation size is controlled by several header files. Status information uses different sizing and emphasis from primary navigation. | Current top navigation approximately 54 high with 26 px labels. This is not automatically oversized for TV. | Brand reservation and status widths reduce room for long translated labels. | One responsive shared header contract; explicit compact status mode and controlled overflow. | Header 72–80; nav 48–56; label 22–26; gap 8–12; status text 18–22. | High |
| **T03 App dock / folders / add app** — `dock.js/css`, `dock-folders.js/css`, `rails.js` [S,V/U] | Decorative icon containers, label truncation and special Add/New Folder states compete with ordinary apps. Folder management adds modal state. | Large icon surfaces can be justified for remote selection; do not reproduce the same proportions on desktop/phone. | Keep labels and icon baselines stable; leave focus-ring clearance near edges. | One app-cell anatomy, one folder representation, and explicit reorder/manage mode. | Icon container 88–104; glyph/art 40–56; label 20–22; gap 20–24. | Medium–High |
| **T04 Installed apps / search** — `index.html#view-apps`, `app-catalog.js`, `app-actions.js`, `app-polish.*` [S,V/U] | Search, Refresh, Store and pinning compete in the page header. Tile and status styling differ from Home. | Current page title 48 design px; app cells need a distinct dense inventory variant. | Align search and filtering in a single toolbar; consistent result count and empty state. | Shared app-cell variants with restrained secondary actions and a predictable result grid. | Search 52–56; row toolbar gap 12–16; tile radius 12–16; heading 40–48. | High |
| **T05 Inputs / current programme** — `inputs.js`, `input-names.js`, `index.html#view-inputs` [S,V/U] | Hardware source selection and IPTV are adjacent but conceptually different. Generic programme panels need clear unavailable states. | Large two-column composition is wasteful when no native inputs exist. | The selected source, available action and programme details should form one coherent group. | Adaptive empty and unavailable layouts; keep hardware and IPTV identity explicit. | Source row 72–88; details column 32–40% maximum; gap 24–32; actions 52–56. | Medium–High |
| **T06 Settings overview** — `settings-nav.js/css:9–13`, `plus-tv.js` [S,V] | Large Plus promotion precedes everyday settings; categories extend beyond the first fold at 720p. | Later category rule is 140 high, not the obsolete 240 declaration. | The promotional panel and category grid consume most of the view. | Compact promotion and task-oriented category rows, with one scroll owner and stable Back return. | Category 88–112 high; icon 32–40; 16–24 padding; heading 40–44. | High |
| **T07 Appearance / theme studio / packs** — `theme-studio.js/css`, `theme-packs.js`, `packs-tv.js`, `theme-preview.*` [S/U] | A complex editor and theme selection coexist with low-level preference controls. Preview, Apply, premium access and download status need clearer roles. | Full-screen editor and large previews are appropriate only when they support editing. | Separate selection from adjustment; preserve a clear exit and pending-change state. | Reusable inspector groups and a stable preview/action layout; no silent destructive reset. | Inspector width 360–440; row 56–64; group gap 24; controls 48–56. | High |
| **T08 Performance / Home / Time / System / Launcher / IPTV categories** — `settings-nav.js`, `device-settings.js`, `performance.js`, `text-size.js` [S/U] | Category labels and feature flags are scattered across modules. “Light” performance and light appearance can be confused; “Quality” can imply video quality. | Some settings remain large button-panels rather than compact labeled rows. | Hints, values and actions need consistent columns and grouping. | One schema-driven settings structure; clarify that interface effects do not change stream quality. | Row 56–64; label 22–24; helper 18–20; group padding 20–24. | High |
| **T09 Weather / location / Wi-Fi** — `weather.js`, `wifi.js/css`, `clock-adjust.js` [S/U] | Approximate location, manual location and OS-managed network behavior require precise expectations. Generic large modals can obscure context. | `wifi.css` declares a 1000 px panel and 27 px text. Appropriate bounds depend on platform and content. | Keep input errors adjacent and network operations distinguishable from app settings. | Shared location/search modal and capability-aware network handoff. | Dialog 720–880; input 56; body 22; error/helper 18–20; padding 24–32. | Medium–High |
| **T10 Family / profile / PIN / app restrictions** — `family-ui.*`, `app-actions.*`, `parental-pause.html` [S/U] | Child-facing decoration is a different visual language from the main application. Parent controls and interruption messaging need differentiated seriousness. | Family overlay declares 170 px planet art, 56 px heading and 42 px card radius before smaller-height rules. | Decorative mass can overwhelm the reason for interruption and safe next action. | Keep approachable child copy while reducing decoration and making parent approval or Home actions explicit. | Dialog 800–1000; title 36–44; illustration 80–112; actions ≥56; radius 16–20. | High |
| **T11 Prayer overview / city / schedule / duas / Adhan overlay** — `prayer.js/css`, `prayer-premium.css`, `prayer-duas.js` [S/U] | Large clocks, weather, six prayer cards and countdown compete. Settings and worship content should not look like generic promotional panels. | Earlier source includes very large clock and temperature typography. Active sizing varies by later rules. | Preserve reading hierarchy: next prayer, time, location, schedule, optional detail. | Shared quiet data cards, deliberate Arabic typography and a bounded settings drawer. Preserve Adhan timing/audio and interruption behavior. | Next time 48–64; schedule 28–36; body 22–24; gap 20–24; overlay close target ≥56. | Medium–High |
| **T12 Matches / day filters / favorites** — `matches.js/css`, canonical `matches-shared.js/css` [S/U] | Filter, team and favorite controls form multiple horizontal navigation bands. Limited coverage and local time need visible, concise treatment. | Badges, scores and titles must be balanced instead of giving every filter equal visual weight. | Avoid very wide filter bands and empty-history panels. | Shared match-row anatomy; distinct selected filter vs focused control; keep local date boundaries and favorites intact. | Row 96–112; badges 40–48; score 28–32; filter targets 48–56; gap 12–16. | High |
| **T13 Fitness home / programs / program detail** — `fitness/fitness-ui.js`, `fitness.css:6–12` [S/U] | Featured workout marketing, program metadata and actual Start/Continue need stronger hierarchy. | Source hero declares 300 px minimum height, 48×52 padding and 62 px title. | Avoid repeating a large hero on every program level. | Compact returning-user dashboard; reusable program cards; show duration, difficulty and continuation before decoration. | Program card 240–300 wide; hero 220–280 when needed; title 40–48; body 22–24. | Medium–High |
| **T14 Workout session / rest / pause / exit / summary** — `fitness-ui.js`, `fitness-engine.js`, `fitness-store.js`, `fitness-audio.js` [S/U] | Active-session controls need a separate ergonomic hierarchy, not generic app cards. Exit confirmation and pause state must remain unmistakable. | Large timer is functional and should not be shrunk merely to match settings. | Keep timer, exercise, next step and pause/exit in stable zones. | A session-specific component variant with restrained chrome; retain audio, timing and saved progress. | Timer 64–88; exercise title 32–40; primary action 56–64; secondary 48–56. | High task safety |
| **T15 Kids library / playback / parental exit** — `kids.js/css`, `family-ui.*` [S/U] | Larger targets may be appropriate for children, but 90 px icons and 100 px actions should be intentional rather than inherited. | Distinct child-friendly scale must not leak into adult settings or desktop. | Group content browsing and parent-only controls; avoid accidental exits. | Separate Kids component variant, consistent parent gate, explicit safe return. | Child target 64–80; tile art proportional to content; parent dialog title 32–40. | Medium–High |
| **T16 USB / files / local player** — `usb.js/css`, `usb-media.js` [S/U] | File/folder, media format and player contexts have a utilitarian visual language unlike other surfaces. | Source modal uses 85vw/85vh; row dimensions vary between wrappers. | Long file paths, parent-folder action and unsupported formats need stable handling. | Shared file-row component, breadcrumbs, meaningful empty/error states and independent player controls. | Row 56–64; icon 24–32; content 960–1200 maximum; gap 12–16. | Medium–High |
| **T17 LAN / DLNA / OpenWebif / device detail** — `network/index.html`, `ui.js`, `premium-network.css` [S/U] | Discovery, manual connection, remembered devices, library browse and connection tests use another self-contained presentation stack. | Network shell explicitly declares 1920×1080; broad dialogs may be oversized for short tasks. | Keep scan state separate from saved-device management; show contextual retry. | Reuse shell, header, device rows and dialog tokens; retain protocol-specific behavior and credentials scope. | Device row 72–88; card gap 16–24; dialog 720–880; status 20–22. | High consistency |
| **T18 Help / About / support / contact / update alerts** — `about.js`, `support.*`, `contact.js`, `welcome-support.*`, `update-alert.js` [S/U] | Different helper surfaces can become a stack of branded promotional dialogs. Update, support and purchase are different priorities. | Large headings and full-width actions can make incidental information feel urgent. | Use one modal anatomy and separate mandatory recovery from optional support. | Quiet information dialogs; explicit update version/source; optional support stays dismissible. | Dialog 640–800; title 30–36; body 20–22; padding 24–32; action 52. | Medium |

### 4.3 Shared IPTV and embedded/standalone variants

| Screen/component and source | Current problems and why the design is weak | Oversizing/proportion | Layout/spacing | Recommended improvement | Suggested dimensions | Priority |
|---|---|---|---|---|---|---|
| **I01 First-source choice** — `first-source.js`, `source-form.css`, `index.html` [S/U] | Personal source, free channels and remembered choice require a simple, trustworthy first decision. Back currently chooses free through the source-choice handler; verify that expectation by product. | Large branded dialogs can overcomplicate a two-option decision. | Primary choice and free fallback should not look like equal setup workflows when one is secondary. | Short explanation and two clear options; preserve source/provider capabilities and explicit product startup behavior. | Phone dialog 320–480; TV 720–880; targets 48 phone / 56 TV; padding 20/32. | High |
| **I02 IPTV Home / hero / shelves** — `stream-ui.js:62–69`, `cinema-shell.css:20`, `premium-library.css` [S,V] | A 34vh hero and large empty history shelf reduce browse density. Repeated shelves lack strong information priority. | Current fixture hero title ~56 px; empty history ~227 px tall. | Hero, row headers and cards consume screen height quickly. | Keep hero conditional and bounded; compact empty shelves; show useful media rows earlier without losing focus navigation. | TV hero 260–340; shelf heading 24–28; row gap 24–32; empty state 64–88. | High |
| **I03 Live channels / categories / preview / EPG** — `tv-library.js`, `library-layout.css`, `tv-readable.css`, `app.js` [S/U] | Dense channel lists, preview, categories and guide require a stronger master/detail relationship. Focus, selected channel and playing channel must be distinct. | Readable TV controls are justified; fixed column reservations need review on narrow/phone contexts. | Avoid repeating toolbar actions in rail, header and list. | A consistent live-view layout with stateful selection and concise unavailable-guide states. | TV channel row 56–64; logo 32–40; preview 16:9; category column 220–280 maximum. | High |
| **I04 Movies / series library / search / sorting** — `app.js`, `tv-library.js`, `latest-library.js`, `premium-library.css` [S/U] | Sorting, category management, pagination, search and filters have accumulated separate UI treatments. | Poster and landscape-card rules should not share dimensions blindly. | Keep search/filter/sort in one toolbar; consistent card gutters and title baselines. | Explicit poster, landscape and channel card variants; keyboard/remote-visible filter state; preserve incremental catalogs. | Poster 2:3, landscape 16:9; TV poster width 180–220; phone two-column grid where readable; gaps 12 phone / 20–24 TV. | High |
| **I05 Movie details / trailer / favorites** — `details-tv.css`, `tv-library.js`, `stream-ui.js` [S/U] | Backdrop, poster, metadata, description and several actions can compete. Text on artwork needs bounded readability. | Large art is useful, but action controls should remain secondary to title/content. | Avoid oversized description panes and drifting action alignment. | One information column and one artwork region, stable action row, expandable long synopsis. | TV title 40–48; body 22–24; action 52–56; text measure 50–65 characters. | High |
| **I06 Series seasons / episodes** — `tv-library.js`, `details-tv.css`, `tv-library.css` [S/U] | Season chips, episode cards, favorite and resume state need consistent hierarchy. Special phone overrides are extensive. | Episode cards should not inherit hero dimensions. | Maintain selected season, scroll position and return focus without expanding several panels simultaneously. | One season selector and reusable episode row/card; controlled long titles. | Episode row 80–104 TV / 72–88 phone; thumbnail 16:9; gap 12–16; title 16 phone / 24 TV. | High |
| **I07 Recent / favorites / history / latest / removed items** — `app.js`, `latest-library.js`, `stream-ui.js` [S/U] | Several collections share actions but not a uniform empty/loaded/selection pattern. Long-press discovery is weak for mouse/touch users. | Empty collections must not reserve full populated rows. | Keep sort/filter and collection status visible near content. | Shared collection shell and explicit overflow action alongside existing long press. Preserve history and favorite semantics. | Empty state ≤88 TV / 72 phone; action target 44–48 phone / 52 TV. | High |
| **I08 Accounts / source switch / add source / QR / subscription info** — `settings-pages.js:6–20`, `source-form.js/css`, `subscription-qr.js`, `account-details.js` [S/U] | Source switching, credentials, subscription state and device linking are mixed across dialogs and pages. | Settings shell declares 1500 px width, 92vh and a 260 px nav rail; nav controls 70 px minimum before phone overrides. | The form's main task can become a small sub-region of a very large shell. | One account management pattern, explicit source-method step, bounded credentials form and contextual QR linking. | Phone field 48–52; TV field 56–64; form max width 560 phone/tablet / 800 TV; nav row 52–56 TV. | High |
| **I09 Playback / library settings / custom selection** — `settings-pages.js/css:1–3`, `app.js` [S/U] | Custom selection overlays add another focus/scroll surface. Global Save is not equally relevant to every page. | Large selection dialogs and settings cards can inflate simple choices. | Align label, current value and action; do not scatter Save/Close controls. | Shared settings-row pattern, consistent commit behavior and independent scroll region. | Phone row 48–56; TV row 56–64; select dialog 320–480 phone / 560–720 TV. | High |
| **I10 Account keyboard / validation / deletion / error dialogs** — `account-keyboard.js/css`, `app.js` account-delete handlers, `source-form.css` [S/U] | Remote keyboard, physical keyboard and native phone keyboard have different needs. Error text should not become another full-screen workflow. | TV keyboard targets need size; the same geometry is inappropriate on phone/desktop. | Focus trap, credentials visibility and validation must remain predictable through nested states. | One platform-aware input contract; inline validation; named-account confirmation; preserve per-account deletion. | Phone/desktop native input 48/40–44; TV key targets 48–56; error text 13–14 phone / 20–22 TV. | High |
| **I11 Phone IPTV Home / library / drawer / account screens** — `phone-iptv.js`, `phone-iptv.css` [S,V/U] | Shared TV structures and phone adaptation produce multiple navigation regions. In the fixture the 62 px side region and top content controls reduce usable width. Missing illustration mappings were a harness limitation. | Current Live tile ~268×241 and Movies/Series ~128×253 at 390 px; narrow tiles are unusually tall. Back target measured 38×38. | The source header, introduction, source summary and large tiles stack before lower content. | One touch-first navigation model with responsive content cards; reduce introductory height and enlarge hit areas without increasing glyph size. | Back target 44–48; intro 56–80; source row 64–72; tiles 128–168 high with explicit aspect variants; gutter 16. | High |
| **I12 Standalone prayer / matches / source return / exit** — `prayer-entry.js/css`, `matches-iptv.js/css`, `standalone-iptv/shell.js` [S/U] | Standalone adds a combined decorative prayer/match panel and its own Back/exit behavior. Embedded IPTV must not duplicate launcher summaries. | Fixed panel declarations include 620×220 at larger layouts. | Hiding either feature, long localized labels and focus restoration affect panel composition. | Keep each half independently operable; map styling to common summary components; independently test standalone startup and Back. | Two compact summaries with 16–24 padding, 1 px divider, flexible width; phone stack rather than fixed desktop geometry. | High |

### 4.4 Radio, native players, and desktop

| Screen/component and source | Current problems and why the design is weak | Oversizing/proportion | Layout/spacing | Recommended improvement | Suggested dimensions | Priority |
|---|---|---|---|---|---|---|
| **R01 Radio browse / categories / search** — `radio/app.js:5`, `premium-radio.css`, `radio-layout.css` [S,V/U] | Another header, category system and typography style. Zero catalog in fixture limits populated-list assessment. | Large headings and player reservation reduce room for actual stations. | Search and categories need one consistent toolbar and predictable empty results. | Shared shell and category chips; compact station rows with name, category and favorite state. | TV row 80–96; art 48–56; title 22–24; search 52–56; gaps 16–20. | Medium–High |
| **R02 Now playing / idle / favorites** — `premium-radio.css:52–77`, `premium-radio.js` [S,V] | Idle panel has too much decorative mass. Waveform decoration can suggest playback before meaningful activity. | Current primary play button 92×92; player column much larger than its idle information needs. | Volume and sleep controls are far from browse actions. | Compact idle state and a deliberate expanded now-playing state. Keep touch/remote targets comfortably large. | TV play 64–80; art 96–144; compact player 280–360 high; title 28–32. | Medium–High |
| **R03 Sleep / screen-off / radio tools** — `screen-off.js/css`, `premium-radio.js/css:81` [S/U] | Floating tool panel differs from other settings drawers. Screen-off needs unmistakable return behavior without a visually loud persistent control. | Tool buttons use separate 23 px font/padding rules. | Anchor tools consistently and return focus to the originating control. | Shared popover/dialog anatomy; explicit timer state and cancellation; preserve platform audio behavior. | TV tool row 52–56; popover width 320–440; padding 20–24. | Medium |
| **R04 Radio empty / unavailable / playback failure** — `radio/app.js:5` [S,V/U] | Non-search empty copy says Favorites are empty even in other categories. Network/catalog failure and user selection should not be conflated. | Large blank list region has little useful guidance. | Keep recovery action beside a precise explanation. | Distinct no-favorites, no-category-results, loading, offline and playback error states. | Empty panel 96–144 TV; message 22–24; retry 52–56. | High copy/UX |
| **N01 Shared HTML5/AVPlay video player** — `player-chrome.js/css`, `samsung-media.js`, `webos-app/player.js` [S/U] | UI is composed across engine adapters and a later chrome decorator. Different tool groups and title/menu overrides increase drift risk. Video aspect bars must not be confused with control-background defects. | Current shared top tool declaration 62×62; desktop later uses 46. Several older panel sizes remain in the CSS. | Keep title/tools, timeline, transport and settings aligned to one safe-area grid. | Shared player anatomy/tokens; platform engines retain transport responsibility; preserve seek focus, tracks, subtitles and aspect behavior. | TV controls 56–64; phone hit area 48; desktop 40–44 actual CSS px; icon 20–24 phone/desktop and 28–32 TV. | High |
| **N02 Android native player / audio / captions / settings** — `PlayerActivity.java:33–43`, `PlayerCinemaChrome.java:20–31`, `PlayerPalette.java` [S/U] | Native sizing combines a 1920×1080 scale, px titles and density-aware phone minimums. JS and native menus require a deliberate equivalent contract rather than independent visual evolution. | Title uses px with font-scale multiplication; header has explicit phone-density protection. Do not claim the native player simply shrinks all targets. | Test safe areas, multiline labels, caption overlap and settings content separately on phone/TV. | Translate semantic dimensions into dp/sp or the established TV design-unit system; expose matching state and accessibility labels. | Native phone target ≥48 dp; title ~18–20 sp; TV 28–34 design-unit title; bounded menus with scrolling. | High |
| **N03 Multiview / PiP / external player handoff** — `multiview.js`, native activity/provider classes, `playback-rate.js` [S/U] | Platform capabilities vary; unavailable actions need clear presentation. A generic premium control should not imply unsupported behavior. | Multiple streams and tool overlays can create excessive chrome. | Focus ownership and exit/return must be explicit for every capability. | A capability-driven control contract, sparse per-view tools and predictable return. Preserve functionality and engine limitations. | Per-view tools 44–48 phone / 52–56 TV; status text 14/20; one visible primary exit. | High |
| **N04 Android 4.4 legacy home / source / player** — `android-legacy/src/.../HomeActivity.java`, `PlayerActivity.java` [S/U] | Deliberately reduced native M3U experience; another typography and panel system. It cannot be audited as the modern Xtream UI. | Legacy player uses dp-based 42-high transport rows and 12-sized note text. | Side settings occupy a proportional screen region and may need scroll testing on small displays. | Apply a compatible subset of shared tokens; keep readable labels and clear limitation copy; no modern-engine redesign assumptions. | Native action target aim 48 dp; body 14–16 sp phone or device-appropriate TV scale; simple flat surfaces. | Medium–High |
| **D01 Windows/macOS top toolbar and main shell** — `pc-app/desktop.css:6–15`, `desktop.js`, `stage.py`, `main.cjs:59` [S/U] | Native top toolbar sits above the already navigated TV shell. It remains dark regardless of the requested primary light direction. | 64 px toolbar and 40 px buttons are sensible desktop dimensions; scaled content below is inconsistent with them. | Multiple Home/Back destinations need clear behavior and hierarchy. | Preserve current navigation functionality; make host chrome appearance-aware and consolidate route affordances after testing. | Toolbar 56–64; buttons 36–40 mouse / ≥44 touch; 16–20 horizontal padding. | High |
| **D02 Desktop settings / modals / files** — `desktop.css:20–40`, `desktop.js`, `desktop-input.js` [S/U] | Fixed 900/880 logical-pixel maxima and 1300-wide file modal are local patches over TV layout. | Compact declarations still scale with the TV canvas. | Real window-height constraints, nested scrolling and file breadcrumbs need independent desktop layout. | Responsive form/dialog widths, one scroll owner, desktop-density file rows and native editable fields. | Settings max width 960–1120; dialog 480–720; row 40–48; viewport padding 24; fit available height. | High |
| **D03 Desktop player** — `desktop.css:41+` and new `html.morph-playing` rules, `media-engine.js`, `desktop-media` staging [S/U] | The concurrent fix moves active playback to the viewport, hides the desktop toolbar, and adds player Back/fullscreen controls. This addresses the earlier scaling concern in source; runtime correctness remains unverified here. Track selects and volume still use another font/spacing scale. | Updated 46 px controls should be assessed on the unscaled player path, not multiplied by launcher scale. | Percentage padding can still crowd transport controls; resize, captions, cleanup and exit restoration need testing. | Preserve the viewport fix; validate class cleanup and Escape/F11 behavior before further visual work. Standardize actual-pixel controls and overflow. | Controls 40–44 mouse / ≥44 touch; icons 20–24; transport gap 8–12; timeline hit region ≥32 mouse / 44 touch. | High validation; Medium remaining visual |
| **D04 Desktop Home summaries / app inventory / startup** — `desktop.js` summary setup, `desktop.css` final summary rules, `desktop-catalog.js` [S/U] | Fixed right/top offsets and widths create another composition authority. OS app inventory and file integration need clear desktop language. | Summary panel 652×220 design units; individual halves sized by additional rules. | Summary placement must survive long labels, hidden features and smaller windows. | Responsive summary component sharing semantics with TV, but using desktop geometry; stable focus return to each half. | Summary width 240–320 per cell; height content-driven; 16 padding; 1 px divider; 24 gap to main content. | High |

## 5. Component-level consistency findings

### 5.1 Typography

**[S,V]** The phone uses several independent typography layers and small labels; the TV and desktop use different combinations of Arial/Tahoma and scaled design dimensions. Native player titles explicitly use px while other native text uses Android text sizing. Repeated hero headings, eyebrow labels and prominent status copy compete rather than forming one clear hierarchy.

**[R]** Standardize semantic styles: display, page title, section title, body, secondary and caption. Select an Arabic/Latin pairing with compatible optical size and reliable offline glyph coverage. Make large reader text a feature-specific exception, not a general heading scale. Avoid changing font weights or color independently in every appearance sheet.

### 5.2 Buttons and inputs

**[S,V]** `.primary`, `.secondary`, `.tool`, `.setting`, source-method buttons, navigation pills, custom player buttons and native controls have independent geometry. Broad `button` rules in theme contracts can override component-specific intentions. Some controls are full-width without being the primary task.

**[R]** Define primary, secondary, tertiary, destructive, icon and toggle variants. Separate visual glyph size from hit area. Inputs need consistent label, value, helper, validation, disabled, loading and focus states. Do not use placeholder text as the only label.

### 5.3 Cards and information density

**[S,V]** Cards currently represent media, settings categories, connection tasks, explanations, source identity, app icons and promotional material with similar round-cornered emphasis. The result is a stack of containers rather than a hierarchy of tasks.

**[R]** Define app, media, data-summary, settings-row and promotional variants. Only interactive cards should use interactive affordances. A quiet help paragraph does not need a full elevated card. Dense inventories should favor separators and alignment over separate large surfaces.

### 5.4 Radius and elevation

**[S]** Current values exceed a coherent small semantic set. Source contains heavy inset and glow styles, while performance presets suppress many effects.

**[R]** Use 8/12/16/20 px semantic radii; pills only for genuine chips/segments. Default cards use a 1 px border or very subtle shadow. Reserve elevation for overlapping menus, dialogs and navigation. Avoid nested shadows in nested cards.

### 5.5 Iconography

**[S,V]** The phone already has a useful SVG family in `morph30.js:16–46` with 24-unit view boxes and 1.8 strokes. Elsewhere SVG line icons, colored pictograms, emoji/glyphs, app artwork and decorative rendered icons coexist.

**[R]** Preserve approved brand wordmarks and installed-app icons as distinct assets. Standardize interface icons on one stroke/corner system; reserve full-color artwork for content/app identity. Use semantic icon labels and explicit selected/focused states. Do not treat every logo as an ordinary monochrome UI icon.

### 5.6 Color, gradients and brand identity

**[S]** Existing namespaces include `--m-*`, `--ui-*`, `--media-*`, `--iptv-*`, `--cinema-*` and `--wf-*`, plus hardcoded per-feature values. Tokens exist; the problem is incomplete coverage and authority, not a total absence of tokens.

**[R]** Keep blue as the primary action identity and purple as a controlled secondary accent. Use light neutral surfaces as the main phone/desktop application direction. Preserve darker video-control scrims and deliberate TV artwork contrast. Content themes should not arbitrarily recolor destructive actions, accessibility focus or account validation.

### 5.7 Navigation and selection

**[S,V]** Phone bottom navigation, header actions, in-page segments, TV top navigation, side rails, app dock, desktop toolbar and player drawers each define their own active/focus treatment. Multiple colored icon backgrounds can suggest selection even when only one route has `aria-current`.

**[R]** Define a consistent distinction between current destination, keyboard/remote focus, selected item and pressed/toggled control. Keep a single primary navigation system per product context; preserve useful secondary navigation without repeating the same destinations in three places.

### 5.8 Dialogs, sheets, popovers and confirmations

**[S]** There are several dialog systems, including the launcher modal, phone gear sheet, first run, IPTV settings, custom select, account deletion, family interruption, player drawers, radio tools and browser/native dialogs.

**[R]** Share an anatomy contract: labeled title, optional concise description, content scroll owner, clear dismiss action, defined primary/secondary/destructive ordering, focus trap where modal, and return focus. A nonmodal inline confirmation should not be styled or announced as a modal without matching interaction behavior.

### 5.9 Loading, error, empty, offline and disabled states

**[S,V]** Large empty media rows, generic radio empty copy, very long operation timeouts and varied status/toast patterns make state handling inconsistent. Some disabled styles intentionally remove opacity differences; that can preserve contrast but weakens recognizability if no other treatment changes.

**[R]** Define state copy and presentation per component. Do not substitute an empty state for a failed request. Keep stale cache visibly distinguishable from live data. Make disabled state recognizable using text/shape/state, not only low contrast. Use skeletons only when they match actual content geometry and do not imply fabricated progress.

## 6. Proposed design system — measurements for future implementation

These are starting specifications, not a completed redesign. Validate them with realistic content and accessibility tests before implementation approval.

### 6.1 Typography scale

| Role | Phone CSS px | Desktop CSS px | TV design units at 1920×1080 | Weight / line height |
|---|---:|---:|---:|---|
| Display / primary hero | 28–32, used sparingly | 32–40 | 48–64 | 600–700 / 1.15–1.25 |
| Page title | 24–28 | 24–28 | 40–48 | 600–700 / 1.2–1.3 |
| Section title | 18–20 | 18–20 | 26–32 | 600 / 1.3–1.4 |
| Body | 15–16 Latin; 16–18 Arabic where needed | 14–16 | 22–28 | 400 / 1.5–1.7 |
| Secondary/helper | 13–14 | 13–14 | 18–22 | 400 / 1.45–1.6 |
| Navigation | 12–13 label plus icon | 14–16 | 22–26 | 500–600 / readable fixed baseline |
| Reading content | 20–24 initial; Quran 24–30 subject to testing | 18–22 initial | Device/viewing-distance specific | Adjustable; Arabic reader 1.7–2 line height |

Support at least 200% text enlargement for ordinary UI without losing essential content or actions. Do not impose the same font size on Arabic and Latin merely to produce identical numbers; compare optical size and clipping.

### 6.2 Spacing and grid

- **Primitive spacing:** 4, 8, 12, 16, 20, 24, 32, 40, 48. Introduce exceptions only with a documented semantic reason.
- **Phone:** 16 px outer gutter at small widths, 20 at typical widths, 12 px grid gap, 16 px card padding, 24 px section separation.
- **Tablet:** 24–32 px gutters; bounded content width; use columns to reduce vertical repetition rather than enlarging phone cards.
- **Desktop:** 24–32 px content gutters, 16–24 px grid gaps, form width 560–720, general content width approximately 1120–1280 where appropriate.
- **TV:** 64–80 design-unit safe gutters, 20–24 card gaps, 24–32 section separation; verify actual overscan and viewing distance. Do not reinterpret these as phone CSS pixels.
- **Alignment:** Use shared title/content/action baselines. Align values and trailing actions in settings lists. Prefer logical inline/block properties for bilingual layout.

### 6.3 Component dimensions

| Component | Phone | Desktop | TV |
|---|---|---|---|
| Primary action | 48–52 high | 40–44 actual CSS px | 52–64 design units |
| Secondary action | 44–48 high | 36–40 mouse; ≥44 touch | 48–56 |
| Icon control | 20–24 glyph inside 44–48 target | 18–22 glyph inside 36–44 target | 28–32 glyph inside 52–64 target |
| Input | 48–52 high | 40–44 | 56–64 |
| Settings row | 48–64 depending on helper copy | 40–56 | 56–72 |
| Phone floating nav | 64 content height, 48 item target, real safe-area offset | Not a mandatory desktop pattern | Do not import phone nav into TV |
| Compact app/device row | 64–80 | 48–64 | 72–96 |
| Dialog padding | 20–24 | 24 | 24–32 |
| Standard dialog width | min(viewport−32, 480) | 480–720 | 720–960 design units |
| Hero on returning-user utility pages | Prefer 56–112, or omit | 96–160 if needed | 220–340 only where useful |

A visible icon or checkbox can be smaller than its effective hit area. Conversely, a large parent card does not automatically make an unrelated tiny child control easy to activate.

### 6.4 Color tokens

| Semantic token | Proposed light value | Role |
|---|---|---|
| `color.canvas` | `#F6F8FC` | Application background |
| `color.surface` | `#FFFFFF` | Primary panels |
| `color.surface.subtle` | `#EEF3FB` | Secondary grouping |
| `color.text.primary` | `#17253D` | Main text |
| `color.text.secondary` | `#52627A` | Supporting copy; verify pair contrast |
| `color.border` | `#D9E2F0` | Non-dominant separators |
| `color.action.primary` | `#2563EB` | Main action |
| `color.brand.secondary` | `#7C3AED` | Controlled purple accent |
| `color.success` | `#16734A` | Success state, with text/icon |
| `color.danger` | `#B42318` | Destructive/error state, with text/icon |
| `color.focus` | `#1D4ED8` on light; test dark equivalent | Visible keyboard/remote focus |

These values are candidates. Verify text, icon, border and interaction contrast on their actual adjacent surfaces, including gradients and artwork. Separate application chrome tokens from user-selected TV/background theme tokens. Define dark-mode mappings explicitly rather than generating hundreds of broad color overrides.

### 6.5 Radius, shadow and motion

- Radius: 8 px compact controls; 12 px default controls/cards; 16 px major cards/dialogs; 20 px floating navigation or large sheets; full radius only for chips, avatars and circular controls.
- Default surface: 1 px border; optional subtle `0 2px 8px rgba(23,37,61,.06)` shadow.
- Overlay elevation: restrained `0 12px 32px rgba(23,37,61,.14)` where needed; no stacked inner/outer glow decoration.
- Focus: 2–3 px visible ring plus adequate clearance. Do not use glow as the only cue.
- Motion: approximately 120–180 ms for local state changes, 180–220 ms for sheets; avoid layout-affecting animation and persistent ambient motion on utility screens.
- Preserve reduced-motion and low-performance behavior. Do not re-enable backdrop sampling merely to achieve a “premium” appearance.

## 7. Accessibility and responsive assessment

### 7.1 Verified concerns

1. **Zoom restriction in source [S]:** Phone viewport and native configuration restrict enlargement mechanisms. Device-level effect remains to be tested.
2. **Directionality [V]:** English launcher hero keeps RTL direction.
3. **Small phone header action [V]:** Settings hit rectangle measured 35×40.
4. **Phone nav containment [V]:** Button bottoms extend beyond the 68 px bar/container in the inspected phone state.
5. **Landscape task density [V]:** At 844×390, large introductions and persistent navigation leave little useful first-view space.
6. **Artwork-dependent contrast [S,V]:** Many surfaces are transparent over variable backgrounds. No complete contrast certification was performed.

### 7.2 Required validation before accessibility claims

- Text at 200%; reflow at 320 CSS px for ordinary UI; no hidden Save/Back/confirm actions.
- Real Android keyboard open/closed, landscape, gesture navigation, three-button navigation and cutout insets.
- TalkBack names, roles, announcements and traversal on phone; native accessibility names on custom-drawn player controls.
- Keyboard-only desktop operation, visible focus, logical tab order, popup closing, and focus return.
- TV D-pad traversal, focus-ring clipping, scroll-to-focused-item and distinct selected/playing/focused states.
- Modal stacking, inert background behavior, contextual Back and cancellation.
- Non-color cues for selected tabs, validation, offline state and destructive actions.
- Real hit area and neighboring-target spacing for swatches, chips, checkboxes, range controls and inline links.

The audit's 44–48 px phone target recommendation is a comfort-oriented product standard. It is **not** the same as WCAG 2.2 AA's 24×24 CSS-pixel minimum criterion, which also has spacing and other exceptions. Standard text contrast targets are 4.5:1 for normal text and 3:1 for large text, subject to the criterion's definitions/exceptions. These standards must be assessed against actual rendered states, not isolated color literals.

Primary references: [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [W3C reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [W3C resize-text guidance](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).

## 8. Technical UI architecture and refactoring recommendations

### 8.1 CSS architecture

**Verified:** Large stacks, repeated selectors, broad global button rules, `!important` escalation, artificial specificity such as repeated root IDs, fixed dimensions and multiple theme namespaces.

**Recommended ownership:**

1. Foundations: semantic color, spacing, typography, radius, elevation, motion and z-index tokens.
2. Components: button, icon button, field, settings row, tabs, media card, app/device row, sheet, dialog, toast, loading/empty/error state.
3. Product layouts: phone host, TV launcher, shared IPTV, radio and desktop shell.
4. Platform adaptations: phone touch, TV remote, desktop mouse/keyboard, native Android presentation and older TV compatibility.
5. User content themes: narrowly scoped artwork/accent customization that cannot redefine all application controls.

Do not introduce unsupported CSS architecture features into legacy Tizen/LG builds without checking compatibility transformations. `mobile-app/samsung_compat.py`, platform build scripts and legacy test matrices are part of the implementation contract. Modern syntax in canonical source is a compatibility review requirement, not by itself proof of a shipped legacy failure.

### 8.2 Navigation and state

Create a documented route map and transition contract. Retire ambiguous aliases gradually; preserve compatibility adapters while updating callers. Each screen should declare its primary navigation parent, Back behavior, initial focus, scroll restoration and exit behavior.

A single overlay manager should own stacking and focus policy for each product host. Shared IPTV can expose an explicit interface to its host instead of multiple loosely coordinated method wrappers. Avoid removing functional native bridges or rewriting provider logic as part of visual cleanup.

### 8.3 Component reuse

Share visual contracts and semantic state across platforms, not necessarily one DOM node implementation for every native engine. Android native, Samsung AVPlay and LG/desktop HTML5 players have different runtime requirements. Preserve a shared player anatomy while allowing native dp/sp sizing and engine-specific playback capabilities.

Use reusable screen schemas for settings categories and rows. Centralize field labels, helper placement, validation, confirmation and loading conventions. Keep per-account deletion distinct from clear-all operations.

### 8.4 Responsive layout

Replace desktop-wide transform scaling with responsive layout containers when approved. For phone, explicitly test portrait and short-height landscape; use content-driven heights and bounded max widths. TV can retain a logical design canvas, provided readability and focus are verified on real displays.

Use one vertical scroll owner per primary pane. Document necessary exceptions such as horizontal media shelves and independent settings drawers. Avoid arbitrary fixed heights that work only at a single screenshot size.

### 8.5 DOM composition and nesting

Controllers such as `approved-mobile.js`, `studio-editor.js`, `morph30.js`, `settings-pages.js` and `cinema-shell.js` move, wrap or repurpose existing elements. This preserves functionality during migrations, but makes ownership and initial DOM structure hard to understand.

Prefer explicit component mounting points and documented lifecycle hooks. Do not remove wrappers merely because they look redundant; first trace accessibility semantics, focus scopes, layout containing blocks and event delegation.

### 8.6 Performance-related UI risks

- Large source stylesheets and duplicated selector ownership can increase parse/maintenance cost; measure actual runtime cost before claiming a performance regression.
- Embedded fonts are significant in phone IPTV CSS. Consider a shared cacheable/staged local font resource while retaining offline availability and Arabic coverage.
- DOM decoration, translation, resizing, mutation observers and focus geometry can interact. Existing focus caching and deferred/incremental media loading should be preserved.
- Media card counts and artwork are more important to low-memory TV performance than cosmetic CSS counts alone. Retain virtualization/windowing, lazy artwork and cancellation guarantees.
- Avoid broad subtree observation where a component-specific event or attribute contract is sufficient.
- Prefer transform/opacity for necessary animation, but avoid unnecessary compositing layers and large translucent repaint regions.

### 8.7 Source-of-truth boundaries

Keep shared IPTV in `android-tv/iptv/`, phone adaptations in `mobile-app/phone-iptv.*`, shared web provider/player integration in the existing Samsung/LG files, and native Android playback in its shared source. Use `iptv_shared.py` for staging. Never “fix” generated build copies to obtain a better screenshot.

Keep Morph TV, Morph Launcher and Morph IPTV identities distinct. Do not conflate installed icons, header wordmarks and loading artwork. Maintain legacy Android package identities, limitations and separate release routes. No VIDAA expansion is included in this audit.

## 9. Prioritized improvement backlog

Priority reflects task impact, breadth and confidence. **Critical** is reserved for a demonstrated inability to complete a core task or an access barrier across essential workflows. This audit did not verify a new native core-task blocker strongly enough to assign that severity as a confirmed defect. Several High findings are release gates for a premium redesign and can become Critical if the required device checks fail.

| Order | Work item | Priority | Why first | Acceptance evidence |
|---|---|---|---|---|
| 1 | Establish canonical component/style ownership and freeze new override layers | High / foundational | Every later visual change depends on predictable rules | Documented ownership; baseline snapshots; no unexplained competing selector owners |
| 2 | Correct English/Arabic directionality and protect text enlargement | High / accessibility gate | Broad readability impact | English/Arabic punctuation and URLs correct; 200% text/device tests passed |
| 3 | Fix phone bottom-bar containment and validate safe areas | High | Persistent across primary routes | All item rectangles contained; four/five-item states; landscape and real-device insets verified |
| 4 | Reorder Devices, Remote and IPTV entry around immediate actions | High | Most visible daily task friction | Primary action above fold at 320/390; duplicate prompts removed without losing essential explanation |
| 5 | Give desktop an independent size/reflow contract | High | Scaling defeats compact-control intent | Actual target sizes remain usable from minimum to maximized window; keyboard and wheel behavior retained |
| 6 | Standardize settings, forms, confirmation and modal anatomy | High | High cross-screen inconsistency and focus complexity | Consistent rows/labels/errors; modal/Back/focus matrix passed |
| 7 | Compact empty states and settings promotions | High | Large visual cost for little information | Useful content and settings appear earlier; empty states carry correct recovery action |
| 8 | Consolidate player chrome across web/native contracts | High | Playback is a central product experience | Equivalent hierarchy, captions/tracks/seek/focus preserved on each engine |
| 9 | Normalize cards, icons, radius, spacing and elevation | High visual | Produces product-wide coherence | Component-state catalog with agreed measurements and visual regression coverage |
| 10 | Refine matches, worship, radio, fitness, Kids and network surfaces | Medium–High | Secondary surfaces currently look like separate products | Shared shell/component language; feature-specific ergonomic exceptions documented |
| 11 | Remove proven-dead styles/controllers and optimize fonts/assets | Medium | Reduces recurrence and maintenance cost | Dependency/cascade trace and compatibility checks; no functional regressions |
| 12 | Establish continuous visual/accessibility/device regression checks | High process | Prevents another accumulation of patch layers | Required checks run for changes to shared UI and platform wrappers |

## 10. Proposed redesign strategy

### 10.1 Visual direction

Use a calm light canvas, dark blue text, a clear blue primary action and restrained purple accents. Prefer alignment, whitespace rhythm, readable copy and well-defined states over decorative effects. Utility pages should feel compact and capable. Reading and media playback may deliberately use different surface/typography variants where the task requires them.

The objective is a consistent language across products, not an identical layout across phone, TV and desktop. Large TV remote targets and large Quran text are legitimate. A tall promotional panel on a utility screen, a 38 px touch Back action, and a desktop control shrunk by global scaling are different problems and need different responses.

### 10.2 What should be standardized

- Typography roles and Arabic/Latin sizing behavior.
- Semantic color and state tokens.
- Spacing increments, page gutters and content widths.
- Button/input/settings-row dimensions by input modality.
- Card anatomy and media aspect ratios.
- Focus, selected, active, disabled, loading and error states.
- Dialog/sheet anatomy and return-focus behavior.
- Navigation hierarchy and page-header patterns.

### 10.3 What should be simplified or redesigned

- Phone Devices, Remote and IPTV landing composition.
- Edge-attached phone bottom bar if adopting the requested floating direction.
- Desktop body scaling and fixed logical-pixel modal geometry.
- Settings overview and source/account workflows.
- IPTV empty shelves and radio idle-player composition.
- Cross-product player settings/chrome consistency.
- Feature-specific mini design systems that duplicate basic surface and control rules.

### 10.4 What should be removed only after verification

- Duplicate calls to action and repeated instructional copy that serve no separate workflow purpose.
- Obsolete overrides with no live consumers.
- Purely decorative nested borders, glows and shadows that add visual noise.
- Redundant navigation affordances after all destination/Back contracts are mapped.
- Repeated informational cards that can become a concise paragraph or inline status.

Do not remove onboarding requirements, provider capabilities, subscription context, favorite/history behavior, accessibility support, account confirmations, parental controls, offline worship content or platform-specific functionality under the label of “minimalism.”

## 11. Step-by-step implementation roadmap

### Phase 0 — Baseline and acceptance contract

1. Record the exact source/build versions, working-tree state and active stylesheet load order.
2. Build a route/state inventory with real populated, empty, loading, offline and failure fixtures.
3. Capture approved visual baselines in Arabic and English across the target device matrix.
4. Define task success, focus return, scroll ownership, hit-area and readable-density acceptance criteria.

**Exit gate:** Team agreement on current evidence, product boundaries and proposed component owners. No visual refactor starts by appending another override file.

### Phase 1 — Design tokens and component contracts

1. Establish semantic token names and phone/desktop/TV/native density mappings.
2. Map existing namespaces to those roles through temporary compatibility aliases.
3. Specify buttons, icon buttons, fields, rows, cards, tabs, dialogs and state messages.
4. Define Arabic text, long strings, focus, selection, reduced-motion and contrast rules.

**Exit gate:** A documented component/state catalog and validated sample measurements; no application-wide visual rewrite yet.

### Phase 2 — Navigation and responsive foundations

1. Resolve phone bar geometry and safe-area handling.
2. Consolidate route aliases and modal/Back ownership without breaking existing callers.
3. Introduce responsive desktop layout and actual-pixel control sizing.
4. Validate TV focus visibility and ordinary settings/form scrolling at 720p and 1080p.

**Exit gate:** Every primary route and overlay can be entered, operated and exited with the intended input method.

### Phase 3 — Primary task screens

1. Refine Devices to one primary discovery/connection action.
2. Put the operational Remote ahead of promotional artwork.
3. Simplify phone IPTV destination/source entry.
4. Refine launcher Home hierarchy and prioritize useful settings categories.
5. Compact empty IPTV history and align media rows/cards.

**Exit gate:** Essential actions are visible early, repeated explanation is reduced, and content density is consistent without reducing reading size or effective hit areas.

### Phase 4 — Forms, settings and playback

1. Standardize account setup, source switching, validation and named-account deletion.
2. Migrate settings rows, custom selectors and dialog/sheet anatomy.
3. Align shared web and native player visual contracts.
4. Verify timeline, ±10 seeking, subtitles, audio tracks, aspect modes, volume, fullscreen and platform-specific handoffs.

**Exit gate:** Existing playback/account functionality is retained; all engine-specific checks pass independently.

### Phase 5 — Secondary features and localization

1. Refine matches filters/fixtures, radio, worship/reader, fitness and Kids using the same foundations.
2. Standardize LAN/USB/device browser surfaces and recovery states.
3. Verify long translated text, Arabic reading order, mixed-script metadata and local date/time display.
4. Verify standalone-only summaries and embedded-product exclusions independently.

**Exit gate:** Secondary features no longer feel like unrelated applications, while their specialized ergonomics remain intact.

### Phase 6 — Consolidation, device validation and release review

1. Remove superseded CSS/controllers only after tracing active consumers.
2. Profile representative low-memory devices; preserve existing media performance safeguards.
3. Validate target platform builds, compatibility transforms and product-specific startup/Back behavior.
4. Run visual, accessibility, navigation, account persistence and playback regressions.
5. Obtain approval for the concrete redesign before any publication. This audit grants no implementation or publication approval.

## 12. Required validation matrix for future work

| Area | Minimum scenarios |
|---|---|
| Phone layout | 320, 360, 390/412 CSS widths; portrait; short landscape; tablet; 200% text |
| Phone OS behavior | Actual keyboard, gesture/three-button navigation, insets, font settings, TalkBack |
| Desktop | Minimum supported client area, 1280×720, 1440×900, maximized; Windows and macOS; mouse/wheel/keyboard; display scaling |
| TV | 720p/1080p/4K output and viewing distance; real D-pad; overscan/focus clearance; relevant Samsung/LG/Android variants |
| Media | Empty/small/large catalogs; missing/slow artwork; long names; live/VOD/series; history and favorites |
| Dialogs | Nested source/settings/player overlays; Escape/Back; Tab/D-pad; initial and return focus |
| Themes | Primary light, dark, bright and busy custom artwork; contrast and disabled/focus/selection states |
| Product boundary | Morph TV phone, embedded launcher IPTV, standalone IPTV, desktop launcher, legacy native M3U |
| Performance | Cold/warm start, scrolling, artwork changes, text resize, player transitions, low-memory recovery |

## 13. Audit artifacts and source-reference index

### Fresh rendered evidence

- [Confirmed phone geometry — 40 states](output/ui-ux-audit/phone-runtime-confirmed.json)
- [Confirmed launcher geometry — eight states](output/ui-ux-audit/tv-runtime-confirmed.json)
- [Shared IPTV/radio fixture evidence and limitations](output/ui-ux-audit/shared-runtime.json)
- [Phone Devices, English, 390 px](output/ui-ux-audit/actual-phone-en-home-390.png)
- [Phone Design, English, 390 px](output/ui-ux-audit/actual-phone-en-design-390.png)
- [Phone IPTV entry, English, 390 px](output/ui-ux-audit/actual-phone-en-play-390.png)
- [Phone Remote, English, 390 px](output/ui-ux-audit/actual-phone-en-control-390.png)
- [Phone Remote, English, landscape](output/ui-ux-audit/actual-phone-en-control-844.png)
- [Launcher Home, 1920 px](output/ui-ux-audit/actual-tv-home-1920.png)
- [Launcher Settings, 1280 px](output/ui-ux-audit/actual-tv-settings-1280.png)
- [Shared IPTV Home with fixture content](output/ui-ux-audit/iptv-1920.png)
- [Radio without native station injection](output/ui-ux-audit/radio-1920.png)

The earlier `phone-runtime.json` and unprefixed `phone-*.png` reflect the initial onboarding-covered pass. They must not be used as proof of main-screen rendering. Raw launcher entries in `shared-runtime.json` were superseded by `tv-runtime-confirmed.json` after supplying packaging locale setup.

### Main implementation references

| Concern | Source |
|---|---|
| Phone entry and load order | `mobile-app/assets/ui/index.html:2` |
| Phone route map and aliases | `mobile-app/assets/ui/morph30.js:61–67,94` |
| Phone settings focus trap | `mobile-app/assets/ui/morph30.js:451` |
| Phone first-run semantics | `mobile-app/assets/ui/first-run.js:3–19` |
| Phone nav final edge-attached overrides | `mobile-app/assets/ui/premium-landings.css:103–105` |
| Phone nav earlier density rules | `mobile-app/assets/ui/studio-shell.css:68–70` |
| Generated daylight appearance overrides | `mobile-app/assets/ui/daylight-mobile.css:898,921–924` |
| Native phone zoom configuration | `mobile-app/src/local/cleartv/mobile/MainActivity.java:20` |
| Launcher entry, bidi and stylesheet stack | `tv-project/app/index.html:2,9,36` |
| TV canvas scaling | `tv-project/app/screen-fit.js:6–15` |
| Existing TV tokens | `tv-project/app/ui/tokens.css` |
| Final shared header sizing | `tv-project/app/ui/header-shared.css:3,13–20` |
| Settings category overrides | `tv-project/app/settings-nav.css:1–14` |
| Custom remote focus system | `tv-project/app/focus.js:21,124–125` |
| Shared IPTV header/canvas | `android-tv/iptv/cinema-shell.css:9–22` |
| Empty shelf rendering | `android-tv/iptv/stream-ui.js:62–69` |
| IPTV settings shell and custom selection | `android-tv/iptv/settings-pages.css:1–3` |
| IPTV theme state rules | `android-tv/iptv/theme-contract.css` |
| Shared player tools and fade | `tv-project/app/player-chrome.css:82–104` |
| Native player scaling/minimums | `android-tv/src/local/tvmorph/tv/PlayerCinemaChrome.java:20–31` |
| Native timeline accessibility | `android-tv/src/local/tvmorph/tv/PlayerActivity.java:43` |
| Radio empty-state copy | `android-tv/radio/app.js:5` |
| Radio player and tool dimensions | `android-tv/radio/premium-radio.css:52–82` |
| Desktop window constraints | `pc-app/main.cjs:59` |
| Desktop presentation patches | `pc-app/desktop.css:6–48` and final summary rules |
| Shared staging and phone document adaptation | `iptv_shared.py:114–143` |

Source line numbers describe the inspected working tree and can move as other work continues. The file/selector/function references remain the primary anchors.

## 14. Final assessment

MorphTV does not need indiscriminate shrinking. It needs a controlled hierarchy: smaller utility compositions, comfortable interaction areas, consistent component geometry, fewer competing presentation owners, clearer navigation and rigorously separated phone, desktop and TV density rules.

The most important verified problems are task displacement by large introductions, duplicated calls to action, the phone navigation containment mismatch, English RTL hero content, oversized empty IPTV history, and inconsistent settings composition. The most important architectural risks are CSS specificity escalation, platform-wide transform scaling on desktop, and fragmented modal/state ownership.

The recommended light blue/purple direction is achievable through consolidation and measured component contracts. It should be implemented only after this audit is reviewed, with the shared source, existing functionality, platform differences and verification limits preserved.
