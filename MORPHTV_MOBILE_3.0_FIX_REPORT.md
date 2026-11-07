# MorphTV Mobile 3.0 — UI fixes, test release 0.8.172

Date: 2026-10-28. Scope: phone UI, versionCode 184, package `local.cleartv.mobile`. TV test builds remain 0.8.171. Production remains 0.8.170.

## Changes

- Unified readable light and Midnight dark surfaces, text contrast, cyan/violet action colors and touch spacing. Loaded the mobile override styles after legacy styles to prevent conflicting cascades.
- Home opens first. Design starts with the theme preview and open theme library; less frequent customization/family controls sit farther down.
- The existing Apply action stays above the bottom navigation on Design. Its native handler and connection gating are preserved.
- Preview sizing now fits 320px phones without widening the entire page. Remote controls fit narrow screens.
- Closed Settings is genuinely hidden. Added a visible close button, dialog focus containment and consistent language/appearance controls.
- Back dismisses Plus/errors/onboarding before navigating; ongoing native operations consume Back without navigating underneath the overlay. Removed duplicate first-run welcome behavior.
- Legacy page callbacks now synchronize with the Mobile 3.0 navigation controller.

## Files

`mobile-app/assets/ui/{morph30.js,morph30.css,app.js,index.html,mobile-polish.css}` and phone `AndroidManifest.xml`. New presentation overrides add no dependencies. Existing TV, licensing, transport and playback engines were retained.

## Verification

- 48 automated browser screen cases: 320/390/412px, Arabic/English, light/dark, four tabs. Checked overflow, preview position, selected navigation, Apply visibility, Settings close/focus, modal Back and first launch.
- Connected scan/select/apply path exercises the actual JavaScript/native request contract using a mocked native transport.
- 12 existing phone suites passed using a separate fixture adapter. The adapter enters Design explicitly, opens Settings before interacting with hidden selectors and seeds the legacy welcome notice. Two visual expectations were updated for the intentional 260px remote pad and solid dark card color. Original suite files were not edited.
- Signed APK version is `0.8.172-tester`, code 184. Built assets exactly match source. Embedded TV payloads retain 0.8.171 hashes.
- APK SHA-256: `5a30869badaaa2f42cc014c97e7f5b522e093d3799dc94a06af3365f14467497` (23,636,999 bytes).
- Signing certificate SHA-256: `47cc6e1a0c9242e3c5bbc5a16b4d64c353ee5e8ef060b802459fbf0e74909fd8`, matching the existing app.

These are browser/native-contract and package checks, not a physical phone/TV connection test. Device-specific native problems still require real-device reproduction.

## Distribution

Isolated manual test page: https://morphtv.herroshetta.com/test-releases/20261028-mobile-0.8.172/

Release commit: `968308ce3980191f0434492a56e78ac109f8bd83`. The main website points to this test page. Normal production download/update routes remain unchanged. Evidence: `.tools/mobile172-tests/{package-validation.json,adapted-results.json,remote-verification.json}`; final screenshots are in the chat workspace `outputs/mobile172-final-*`.
