# Approved original phone review

The user cancelled the theme and full-layout redesign and restored the original
white Morph TV phone application with its integrated Bridge (1.1.316).
The current approved repair changes only the startup support invitation.

Build this review with:

    python mobile-app/build_original_phone_review.py

The script uses the saved original signed APK, applies
`assets/ui/support-invitation-fix.css` to its original `welcome-support.css`,
checks that every other packaged entry is unchanged, and signs with the existing
application identity. Output: `output/Morph-TV-Mobile-1.1.316-Support-Fix.apk`.
`mobile-app/TV-Morph-Preview.apk` is the same repaired original application.

The cancelled redesign source files remain in the workspace and are not part of
this approved APK. Do not treat the cancelled design-system build as the approved
phone presentation. Existing application/user data is retained on update.

Final upload handoff: `output/ready-to-upload/HANDOFF.md`.
The saved repair is pinned to the original baseline hash; temporary unsigned and
aligned build files are removed after successful verification. The ordinary
integrated build still contains cancelled design experiments and is not the
approved review build path.
