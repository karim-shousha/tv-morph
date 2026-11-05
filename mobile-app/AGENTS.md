# Approved phone application

The user cancelled the dark/gold redesign and full-layout rebuild. The approved
phone is the original white Morph TV 1.1.316 with integrated Bridge, with only the
startup support-card CSS repair.

- Build the approved review with `python mobile-app/build_original_phone_review.py`.
- The baseline APK hash is pinned by that script. It verifies that the only changed
  packaged entry is `assets/ui/welcome-support.css`, and verifies the same signing
  certificate. Keep its baseline APK in `output/`.
- The repair source is `assets/ui/support-invitation-fix.css`.
- Do not use the cancelled `phone-rebuild.js` / `phone-system.css` / Flutter design
  experiments or the ordinary integrated build to prepare the approved phone APK.
  Those mixed source changes must not be silently reintroduced.
- Current handoff and upload files are in `output/ready-to-upload/`.
- No publication or server update was performed or authorized in this save step.
  The next publication chat must read the handoff and check the deployed version
  before choosing release metadata. This APK's actual version is 1.1.316 / 321.
- Preserve unrelated staged and unstaged work. Do not reset or clean the repository.
