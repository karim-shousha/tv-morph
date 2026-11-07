# Sports visual update — supplied reference

The user requested the attached cinematic football dashboard style after reviewing the first implementation. The Sports screen was rebuilt as an actual remote-operable dashboard, not a screenshot embedded into the app.

- Original stadium/athlete hero, Arabic headline and restrained cyan/violet treatment.
- Left navigation within Sports for Home, Sports, IPTV, Apps and Settings, using the existing handlers and Focus Engine. The approved Home layout remains unchanged.
- Horizontal provider-discovered competition rail with real permitted logos when present; colourful trophy emblems otherwise.
- Three compact match panels: live, selected-day fixtures and next-day upcoming fixtures.
- Three lower panels: available standings preview, favourite teams and favourite competitions.
- Provider team logos display when supplied by the approved backend. Absent/failed logos use clearly generic coloured shields. No official crest is fabricated.
- All controls are real DOM buttons with existing D-pad focus scrolling; View all opens the relevant fixture list, and existing details/favourites/table workflows remain available.
- Backend normalisation now includes competition logo fields behind the same explicit logo-approval gate. Six provider tests pass.
- Western timezones fetch one additional shared UTC day to complete the next-day preview. The validated API date window is ±32 days to accommodate the local calendar plus preview.

Files changed for this update: `tv-project/app/sports.js`, `sports.css`, `distribution/community/sports.py`, `tv-project/tools/test_sports_api.py`, and the existing Sports reports. New files: `tv-project/app/assets/sports-hero-v2.webp`, `tv-project/tools/check-sports-dashboard.cjs`, this report.

## Artwork provenance

Built-in image generation was used; no API/CLI fallback or paid API configuration was used. The first generation attempt failed. The final generated banner uses original fictional athletes, not a claim to be licensed player photography. No team/league/sponsor logos were requested in the artwork.

Saved project asset:
`C:/Users/Admin/Documents/Codex/2026-10-22/ui-ux/tv-project/app/assets/sports-hero-v2.webp`

Original output retained:
`C:/Users/Admin/.codex/generated_images/01a18432-3b03-74c0-93d2-4c8a3d9c7cb7/exec-5c9f5cfd-bd84-4f4e-bc44-8b644f3ccaf4.png`

The PNG was encoded to WebP for the existing TV asset pipeline; no compositional alteration was applied during encoding. Layout cropping is performed by CSS.

Exact final prompt:

> Create a cinematic football stadium background banner for a smart TV sports dashboard. Wide panoramic 3:1 landscape. Four fictional adult male professional football athletes, original faces not based on real people, shown chest-up in a dramatic montage occupying the left 65 percent. One has curly dark hair and beard in a plain red jersey, one short dark hair in a plain white-and-pale-blue jersey, one short brown hair in a plain white jersey, one long blond hair in a plain sky-blue jersey. A grand floodlit night stadium, rich navy blue shadows, luminous cyan and violet lights, realistic sports photography, impressive premium sports-broadcast atmosphere. Right 35 percent fades smoothly into clean almost black navy space for headline typography added later by the application. No typography, no text, no numbers, no watermarks, no brands or logos, no league emblems, no UI. Deliver the background artwork only.

## Verification

- Existing Sports regression: pass, including five locales, offline/cache, rate limiting, favourites and three performance modes.
- New dashboard regression: pass, including icon visibility, logo rendering, league rail scrolling, three match panels, three lower panels and navigation.
- API adapter: six passing cases, including suppression/enablement of competition logos.
- Captured and visually inspected `output/sports-reference-dashboard-ar.png` at 1920×1080. Synthetic scores and generic teams are explicitly labelled as test data in the screenshot; they are not in production bundles.
- Samsung/Android/webOS packages rebuilt locally and generated-asset smoke tests rerun. No deployment or physical installation.

Live teams, supported leagues and official crests still require backend provider configuration and the relevant permissions. Missing credentials produce the same honest configuration-required state while retaining the new visual shell.

## User-supplied full-width header

The user subsequently supplied `1000157132.jpg` and requested that it fill the entire header. The exact attached JPEG is now copied unchanged to `tv-project/app/assets/sports-hero-user.jpg` and used by the Sports header. Its background covers the full width from the sidebar edge to the right screen edge, with no top/right padding gap. Header height/crop were adjusted for faces; the title has a local translucent scrim instead of masking the entire right side. The earlier generated banner is retained but is no longer the active header asset. Updated screenshot: `output/sports-reference-dashboard-ar.png` (explicitly labelled test data).

The generated-package smoke check exposed focus loss when the dock reinserted the already-focused Sports button ahead of HDMI. `ensureDock` now preserves focus when moving that same node, without an extra timer or navigation system. Source Sports/dashboard regressions pass after this correction.
