# MORPH TV MOBILE — NAVIGATION MAP (Current vs Proposed)

**Legend:** `→` tap · `[decision]` · `*` hidden/conditional · `JS:` injected at runtime

---

## 1. CURRENT navigation (as-built, verified in `index.html` + `app.js`)

```
BOOT → page-studio (only visible .page; bottom-nav: studio=active)
 │
 ├─ header: [brand]  #device-chip ──→ page-connect
 ├─ .language-row: #app-language | #app-appearance (stay on page)
 │
 ├─.bottom-nav (show(name); scroll-to-top; NO history stack)
 │   ├─ studio   → page-studio
 │   ├─ connect  → page-connect
 │   ├─ apps     → page-apps
 │   ├─ remote   → page-remote (+ checkMorphConnection hook)
 │   └─ iptv     → page-iptv
 │
 ├─ page-studio (10+ viewports @412px)
 │   ├─ .banner-action ──→ page-connect
 │   ├─ .studio-shortcuts ──→ page-cast* | page-connect | page-apps | page-remote
 │   │    JS: + #studio-parental (scrolls to #phone-parental) | + Plus upsell
 │   ├─ details#family-panel (load → select → switch/create)
 │   ├─ #preview → #club-details*
 │   ├─ details#theme-library (search → 12 collections → #themes → pricing*)
 │   │    JS: #phone-theme-packs injected BEFORE theme-library
 │   ├─ .font-size-panel (Ar/En selects)
 │   ├─ details#personal-touch (30+ controls, flat)
 │   │    JS: #free-theme-image panel extracted; subsections wrapped in <details>
 │   ├─ JS: details#phone-parental | .morph-support
 │   ├─ details.about-us
 │   └─ #apply (→ native apply/install) | CTA ──→ page-connect
 │
 ├─ page-connect (DOM order ≠ visual order after connect-flow.js reparent)
 │   ├─ #scan → #devices button* → (connect) → #connection-state
 │   ├─ #manual-type-toggle → #manual-system-panel → #device-type
 │   │    [samsung] → Samsung 4-step guide + #guide-phone-card + #install-card(#smart-install)
 │   │    [android/firetv] → Android guide + #android-pair(#pair-code→#pair-android) + #share-android→#download-box
 │   │    [lg] → LG guide; #smart-install disabled ("LG")
 │   │    [vidaa/other/auto] → limited guide; install disabled
 │   ├─ #tv-ip + #connect → #connection-state → #connected-device*
 │   ├─ #guide-prev/next → steps; #guide-check* (last step) → focuses #tv-ip
 │   ├─ #smart-install → native install/updateAndroid branch
 │   ├─ #download-center → external browser; #public-tv-download* → APK link
 │   └─ details.troubleshoot | details.compatibility | .phone-ip
 │
 ├─ page-apps: #refresh-apps → #app-list (checkbox + ↑↓ reorder + jump) → #save-pins
 │
 ├─ page-remote
 │   ├─ #remote-mode [internal|native] → #remote-connect → #remote-status
 │   ├─ tabs: #remote-pad-mode ⇄ #remote-touch-mode → #touchpad | .remote-pad
 │   ├─ keys: UP/LEFT/ENTER/RIGHT/DOWN + SETTINGS* + RETURN/HOME/SOURCE* + VOL×3* + PLAY/PAUSE/CH×2*
 │   │    (* = disabled unless remoteReady && platform/capability match; app.js:58)
 │   └─ #remote-text → #remote-send (focused-field replace; no passwords)
 │
 ├─ page-iptv
 │   ├─ #iptv-phone-open → native phone player | #iptv-tv-show → toggles #iptv-tv-controls
 │   ├─ #iptv-public-card → public phone/tv | #iptv-personal-card → saved sources
 │   ├─ details#iptv-form-details[open] → type/server/user/password/name/format/live/vod/series → #iptv-save-phone | #iptv-connect
 │   └─ details#iptv-tv-controls → #iptv-open/refresh → tabs live/vod/series → #iptv-category/search → #iptv-items → pager → #iptv-clear
 │
 └─ page-cast* (NO bottom-nav; via Studio shortcut only)
      ├─ #cast-open → native CastSettings | #cast-steps (system mirroring help)
      ├─ #dlna-panel: #dlna-scan → #dlna-devices → #dlna-url + #dlna-kind → #dlna-send/play/pause/stop
      └─ #cast-back ──→ page-studio

OVERLAYS (any page): #operation modal (blocks all) | #toast | #reconnect-notice → page-connect | #language-dialog
BACK: Operation? close : (page != studio ? go studio : exit). No step-back.
```

**Current problems visualized:**
- 5 tabs + 1 ghost page. Cast is orphaned.
- Connect has 3 address concepts (`#tv-ip`, `#guide-phone-ip`, `#phone-ip`) + 2 install buttons (`#smart-install` + hidden `#install`) + platform-conditional sections that hide/show without explanation.
- Studio has 8 exits (4 shortcuts + banner + CTA + bottom-nav + chip) and 5 JS injections that reorder DOM after load.
- Remote + Apps + Parental are split across 2 tabs + 1 injected panel, though all are "control my TV".

---

## 2. PROPOSED navigation (preserves every feature, removes no capability)

Principles: one primary task per tab · status always visible · hidden pages become explicit children · settings grouped by user goal, not by code module.

```
BOOT → HOME (ex-connect, rebuilt) — always shows connection status first
 │
 ├─ GLOBAL (all tabs): sticky slim header [logo+name | ● status dot + TV name | settings gear]
 │    status dot: gray idle / amber checking / green connected / red error (reuses connection-state tokens)
 │    gear → SHEET: Language · App appearance · Font size · About · Support · Version (consolidates .language-row + font-size-panel + about-us + support)
 │
 ├─ TAB 1 · HOME  (Connect + status + devices)  [replaces `connect`]
 │   ├─ CARD A · Status (always on top): ● + TV name/IP/system + [Change TV] 
 │   ├─ CARD B · Find TV: [Scan] → device list (name + system badge + signal hint)
 │   ├─ CARD C · Setup guide (stepper 1-2-3-4, per-system; phone-IP vs TV-IP visually distinct cards)
 │   ├─ CARD D · Install / Update (single #smart-install; label reflects system; disabled state explains why)
 │   └─ LINK · Advanced: manual IP · pair code (Android) · download center · troubleshoot · compatibility (collapsed)
 │
 ├─ TAB 2 · DESIGN  (Studio, decluttered)  [replaces `studio`]
 │   ├─ Preview hero (sticky mini-preview while editing)
 │   ├─ SECTION · Theme library (search + collections + packs unified; FREE / Installed / PLUS badges)
 │   ├─ SECTION · Customize (grouped accordions: Text & layout · Colors & style · Images · Sizes · Display toggles · Slideshow)
 │   ├─ SECTION · Family profiles (moved intact)
 │   └─ STICKY FOOTER · [Apply to TV] (disabled reason inline, not toast-only)
 │
 ├─ TAB 3 · CONTROL  (Apps + Remote + Cast, merged)  [replaces `apps` + `remote` + ghost `cast`]
 │   ├─ SEGMENT · [Remote | Apps | Share]  (segmented control, not 3 tabs)
 │   ├─ Remote: mode picker → connect → D-pad OR touchpad → rows → keyboard (unchanged keys, visible capability hints)
 │   ├─ Apps: refresh → list → reorder → save (unchanged; parental panel lives here as "Locks & limits")
 │   └─ Share: Cast Screen (system mirroring) + DLNA Send (URL media) as two explicit cards with "different tools" header
 │
 ├─ TAB 4 · PLAY  (IPTV, clarified)  [replaces `iptv`]
 │   ├─ DESTINATION picker (segmented): [Watch on phone | Watch on TV] — replaces two ambiguous buttons
 │   ├─ SOURCE cards: Public (free news) vs Personal (saved) with ACTIVE badge
 │   ├─ FORM · Subscription (staged: Type → Server → Account → Options; password never echoed)
 │   └─ TV LIBRARY controls (category/tabs/search/list/pager — shown only when "Watch on TV" + connected)
 │
 └─ BACK (fixed): closes dialog → steps back within tab (guide step / segment) → previous tab → Home. Never jumps to Design unexpectedly.
```

**Mapping (nothing removed):**

| Current | Proposed | Notes |
|---|---|---|
| `studio` shortcuts to cast/connect/apps/remote | Removed (redundant with tabs) | One tap saved; shortcuts were duplicating bottom-nav |
| `page-cast` ghost | `Control → Share` segment | Now discoverable; Cast vs DLNA header kept from `cast-screen.js:14-15` |
| `#phone-parental` injected in Studio | `Control → Apps → Locks & limits` | Same `parentalStatus/Action` contract |
| `#phone-theme-packs` + `.theme-pricing` | `Design → Theme library` unified rows | Same `installThemePack` + Plus gating; dead `.theme-pricing` DOM deleted |
| `.morph-support` + `welcome-support` + footer | Gear sheet → Support | Same Stripe/PayPal links, localized |
| `.language-row` + font-size-panel | Gear sheet | Same `setLanguage/setAppearance` + `fontSizeAr/En` |
| Troubleshooting/compatibility/phone-IP blocks | `Home → Advanced` collapsed | Same content, out of critical path |
| Hidden legacy `#install` | Deleted (handler retained in `smart-install`) | UI dedup only; Samsung dev path unchanged |
| All native actions, guide copy, IPTV fields, remote keys | Unchanged, relocated only | Zero contract change |

---

## 3. Before / after IA tree

```
BEFORE (5 tabs + 1 ghost, flat):          AFTER (4 tabs + gear, 2 levels max):
Home? (none; Studio is boot)              ┌ Home (status→find→guide→install)
├ Studio (everything design)               ├ Design (preview→library→customize→family)
├ TV (connect+install+guide)               ├ Control (Remote|Apps|Share segments)
├ Apps                                     └ Play (destination→source→form→library)
├ Remote                                   ＋ Gear sheet (language/appearance/text/support/about)
└ Play (phone+TV mixed)                    Cast ghost → Control/Share (explicit)
＋ Cast (ghost)
```

**Wayfinding guarantees (new):** sticky header shows tab title + connection dot on scroll; each tab has exactly one `h1`; every disabled primary button carries an inline reason (not toast-only); every destructive/paired action confirms in `#operation` with explicit success + "what's next".

---

## 4. Back-button & deep-link spec (proposed)

```
onBack():
  if operation visible → close (unchanged)
  elif sheet/dialog open → close, restore focus
  elif inside Home guide step > 1 → previous step
  elif inside Control segment detail (DLNA results/TV library page 2+) → up one level
  elif current tab != Home → go Home (replaces "go studio")
  else → system back (exit confirm only if download/pairing in progress)
```

No new deep-link scheme required (WebView `file://`); if added later, map `morph://home|design|control|play` 1:1 to tabs.
