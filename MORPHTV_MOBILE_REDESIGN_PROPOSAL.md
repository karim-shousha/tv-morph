# MORPH TV MOBILE — REDESIGN PROPOSAL

**Constraint reminder:** no features removed · no TV-app changes · no contract changes · brand + theme system preserved. Each item = Problem → Proposal → Benefit + affected files.

---

## 1. Recommended app structure (4 tabs + gear)

Keep bottom-nav (users know it) but fix its jobs: **Home · Design · Control · Play** + header **gear sheet**. Reduces top-level destinations 6→4, eliminates ghost page, gives every feature a discoverable home. Bottom-nav labels become `الرئيسية · التصميم · التحكم · Play` with a single SVG icon set (replacing `◐▣▦⌘▶`).

## 2. New hierarchy (summary — full map in `NAVIGATION_MAP.md`)

- **Home** (today's Connect, reordered): Status → Find → Guide → Install/Update → Advanced(collapsed).
- **Design** (today's Studio, grouped): Sticky preview → Library (themes+packs unified) → Customize (6 accordions) → Family → sticky Apply.
- **Control** (Apps+Remote+Cast merged, segmented): Remote | Apps | Share.
- **Play** (today's IPTV, staged): Destination → Source → Form → TV library.
- **Gear sheet** (new, no new code paths): Language · Appearance · Text size · Support · About · Version.

## 3. Proposed Home organization

**Problem:** scan/devices/guide/install/pair/IP/help compete; phone-IP vs TV-IP confusion (C1); auto-jump steals scroll (C2).
**Proposal:**
1. Status card pinned top (reuses `connection-state[data-status]` tokens, adds TV name + system badge + `[Change TV]`).
2. Single primary flow per system: Samsung → 4-step stepper; Android → Scan → Pair-code → Install; LG/VIDAA → honest "discovery-only / unsupported" card (no disabled mystery button).
3. Phone-IP and TV-IP rendered as two visually distinct cards (TV icon vs phone icon, different tint), each with "where to type this" microcopy; keep the Arabic IP-reversal note but collapse to one line + expandable.
4. `connect-flow.js` reparenting replaced by static DOM order = visual order = screen-reader order; stepper state in one store, no `MutationObserver` yanks.
**Benefit:** first-time Samsung/Android pairing −3 taps, −1 context switch; support tickets for "wrong IP" drop.
**Files:** `index.html` (Connect section), `connect-flow.js` (rewrite as stepper), `guide.js/guide-en.js`, `compatibility.js`, `style.css/connect-flow.css`.

## 4. Screen-by-screen improvements

### 4.1 Design (Studio)
- **Problem:** 10-viewport scroll; 30 flat controls; free vs Plus vs TV-only mixed (H1/H2).
- **Proposal:** sticky mini-preview (`position:sticky`) + 6 accordions (Text & layout / Colors & style / Images / Sizes / Display / Slideshow); first accordion open, rest closed; Plus-locked rows show 🔒 badge + inline "included in Plus" (same `MorphPlus.packAllowed` check, surfaced earlier); Apply bar sticky with inline disabled reason ("Connect a TV first" vs "Select a theme").
- Merge `#phone-theme-packs` rows into `#themes` grid (one badge system: `FREE · INSTALLED · PLUS · 1$`); delete dead `.theme-pricing`.
- Move Family + Parental out of Design (Family stays? — decision: Family stays in Design since it scopes themes per viewer; Parental moves to Control/Apps where enforcement lives).
- **Benefit:** edit→preview loop without losing scroll; fewer mis-taps on locked controls.

### 4.2 Home (Connect)
Above + : `device-chip` becomes live status pill (dot + name, tap → Home); `#reconnect-notice` reuses same dot language; guide dots become numbered stepper with back/next; `#smart-install` label matrix kept (`Update Android TV` / `Install via Developer` / `VIDAA — not supported`) but each disabled state carries a one-line reason.

### 4.3 Control — Remote
- **Problem:** invisible gating (H3), pad/touch tabs unexplained, keyboard caveats buried.
- **Proposal:** capability line under mode picker ("Internal: D-pad + keyboard inside Morph TV · Volume uses Android audio"); disabled keys show `aria-disabled` + tooltip reason; keep all keys/positions (muscle memory); add haptic tick on OK (vibrate 10ms, guarded); touchpad gets visible bounds + "swipe · tap = OK" hint (already in copy, make persistent, not placeholder).
- **Benefit:** fewer "remote doesn't work" reports; same contract (`remoteConnect/Key/Text`).

### 4.4 Control — Apps
Unchanged logic (`apps/pins/open`), but: empty state becomes actionable checklist (1 Connect → 2 Install → 3 Refresh); reorder controls grow to 44px targets; `#save-pins` sticky; unchecking copy kept ("removes shortcut, not the app").

### 4.5 Control — Share (ex-Cast ghost)
Two explicit cards with the existing disambiguation header promoted to title: **Mirror screen (system)** vs **Send media URL (DLNA)**. Keep `openCastSettings` + `dlnaDiscover/Send/Control` flows byte-identical; add receiver picker persistence note ("last receiver remembered on this phone only").

### 4.6 Play (IPTV)
- **Problem:** phone vs TV, public vs personal conflated (H4).
- **Proposal:** top segmented `[Watch on phone | Watch on TV]` (default: phone if not connected, TV if connected — same `connectionStatus` already fetched on resume). Public vs Personal become two radio-cards with ACTIVE badge; form staged with progress (Type → Server → Account → Options) instead of one open `<details>`; password stays `type=password`, never in draft (already true — add visible "stored encrypted on this phone + TV" line from existing Vault behavior); TV library section only rendered when destination=TV + connected (currently always in DOM).
- **Benefit:** credential confusion eliminated without touching `iptvConnect/list/play/clear` contracts.

### 4.7 Gear sheet (new container, old settings)
Consolidates `.language-row`, `font-size-panel`, `about-us`, `.morph-support`, version footer. No new preferences; same `setLanguage/setAppearance/fontSizeAr/En` writes.

## 5. Relocate / merge table

| Move | From → To | Why |
|---|---|---|
| Parental (`parental.js`) | Studio → Control/Apps | Enforcement is on TV apps, not themes |
| Font-size panel | Studio → Gear | Affects chrome readability, not TV theme |
| Support/donate | Studio inject → Gear | Global, not design-scoped |
| Packs list | Pre-library inject → inside Library | One mental model for "get a look" |
| Free-image panel | Extracted panel → Customize/Images accordion | Same controls, grouped |
| Troubleshoot/compatibility/phone-IP | Connect main flow → Home/Advanced | Needed rarely, not every setup |
| Cast ghost | Studio shortcut → Control/Share | Discoverable, correctly scoped |
| `device-chip` | Connect shortcut → global status pill | Always-visible wayfinding |

## 6. Consistent component & icon system

- **Icons:** single 24px/2px-stroke SVG set (Home, Wand, Gamepad, Play, Gear, Search, TV, Phone, Cast, Lock, Check, Chevron). Replace all ASCII (`◐▣▦⌘▶▲`) and `:before` pseudo-glyphs. `remote-visual.js` becomes the single icon registry (extend its `svg()` map; delete per-file emoji).
- **Type:** scale `12 / 14 / 17 / 22 / 28 / 34` (body 14, card title 17, page `h1` 28–34 max, not 42); keep Tahoma for Arabic + system fallback for CJK; Arabic line-height 1.7 (not 1.9) for scanability.
- **Cards:** two tiers only — `card` (content) + `hero` (status/preview). Radius 18, one border token, one shadow token. Delete per-card gradients except preview + status.
- **Buttons:** keep `.primary/.secondary/.text-button` names (avoid JS churn) but add `loading` (spinner inline), `disabled[data-reason]` (inline hint), `destructive` (Stop/Clear) variants.
- **States:** promote `connection-state[data-status]` to global `<status-card>` pattern for account/DLNA/pairing/library; one toast + one modal style; skeletons for `#themes`, `#app-list`, `#iptv-items` (shimmer, honors `prefers-reduced-motion`).
- **Touch:** minimum 44×44 (bottom-nav, D-pad already compliant; fix `.text-button`, theme cells, reorder arrows).

## 7. Onboarding improvements (no new backend)

1. **First-run (3 slides, skippable, shown once):** ① What Morph does (Design → Install → Control) ② Same-Wi-Fi requirement ③ No account needed. Reuses `welcome-support.*` infra; store `tvmorph.onboarded`.
2. **Contextual coachmarks:** first visit to Home highlights Scan; first Design visit highlights Apply; first Remote visit explains mode picker. Dismiss persists in `localStorage` (same mechanism as `tvmorph.appearance`).
3. **Empty states as checklists** (Apps, Themes-search-no-result, IPTV-no-source, DLNA-no-receiver) each with one primary CTA.

## 8. Key journeys — before → after (interaction counts, taps)

| Journey | Before | After | Saving |
|---|---|---|---|
| Samsung first install | Studio→Connect→Scan→device→read guide (4 steps)→copy phone-IP→TV Developer→restart→TV-IP→Check→Smart-install→Inspector prompts ≈ **14 taps + 2 cross-device transcriptions** | Home→Scan→device→stepper auto-selects Samsung→phone-IP card (copy button)→TV-IP→Check→Install ≈ **11 taps**, IPs visually distinct + copyable | −3 taps, −2 confusions |
| Android pair + update | Connect→manual toggle→Android→Scan→TV-IP→pair-code→Pair→Share→browser→back→Smart-install ≈ **12 taps** | Home→Scan→device (auto-Android)→pair-code inline→Pair→Install ≈ **8 taps** (download-box only if `!selfUpdate`) | −4 taps |
| Apply theme | Studio scroll (find library)→search→select→scroll to Personal Touch→edit 6 sliders→scroll to Apply ≈ **9 taps + long scrolls** | Design→search→select→Customize accordion→sticky Apply ≈ **6 taps**, preview always visible | −3 taps + no lost scroll |
| Remote session | Connect→verify→Remote→mode→Connect→D-pad→keyboard ≈ **7 taps** | Control/Remote (status inherited, mode remembered) ≈ **4 taps** | −3 taps |
| IPTV personal setup | Play→read 3 cards→fill 7 fields→Save→Connect→open TV controls→browse ≈ **11 taps** | Play→destination=TV→source=Personal→staged form→Connect ≈ **8 taps** | −3 taps, staged validation |

Counts exclude TV-side steps (unchanged) and count only phone taps.

## 9. Micro-interactions & motion (restrained, premium)

- Tab switch: 160ms fade+rise (`opacity/translateY 8px`), respects `prefers-reduced-motion`.
- Stepper: progress line animates; success step shows check draw.
- Apply/pair/install: button → inline spinner → status-card flip (green) + haptic; never full-screen `#operation` for <2s tasks (reserve modal for installs/pushes).
- D-pad: `scale(.95)` press + 10ms haptic; touchpad: dot follows finger (already) + edge glow at swipe threshold.
- Theme select: card lifts + preview cross-fades (300ms); skeleton shimmer while packs load.

## 10. Technical changes required (no contract breaks)

1. **Static IA:** reorder `index.html` sections to match proposed tabs; rename `page-studio→page-design`, `page-connect→page-home` (keep `data-page` aliases for 1 release to avoid breaking `app.js` callers/tests); move Cast into Control; add gear sheet + sticky header. Update `show()` to push tab history + restore scroll per tab.
2. **Back stack:** implement `history[]` in `app.js` + `MainActivity.onBackPressed` already delegates — only JS changes.
3. **Stepper:** rewrite `connect-flow.js` as presentational stepper over existing `guide.js` data + `MorphGuide` state; remove `MutationObserver` reparenting.
4. **Unify locale:** single `MorphLocale.t()` path; per-file `words` tables become locale keys; `data-no-translate` audited; add missing `zh/ja` for Cast/DLNA (copy only, no logic).
5. **Icon registry:** extend `remote-visual.js` SVG map; replace ASCII in `index.html` + `remote.css:before`.
6. **Tokenize CSS:** collapse 12 stylesheets → `tokens.css` (colors/spacing/radius/shadow) + per-tab sheets; remove `!important` chains; keep `appearance.js` logic intact.
7. **A11y pass:** `role=dialog` + focus trap for gear/operation/language sheets; `aria-disabled` reasons; 44px targets; `aria-current` on segmented controls.
- **Explicitly out:** native Java changes (none needed except nothing); TV adapters; pairing/install protocols; credential storage; player.

---

## Appendix — Design QA checklist (acceptance for any implementation PR)

- [ ] All 6 current pages reachable in ≤2 taps from bottom-nav/gear; no ghost pages.
- [ ] Phone-IP vs TV-IP visually distinct; copy-to-clipboard works.
- [ ] Every disabled primary button shows inline reason.
- [ ] Back walks history; never jumps to Design unprompted.
- [ ] `zh/ja/fr` complete on Cast/DLNA; no `de/es`-only strings remain.
- [ ] 44px targets; screen-reader order = visual order; `ui-check.cjs` + new nav tests pass on 360/412px.
