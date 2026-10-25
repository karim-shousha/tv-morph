# Morph TV · Preview 0.8.82

Developed by Karim Aboushousha & Hassan Shehata.

Download and installation guides: https://morphtv.zainbot.com/

- Android phone: 0.8.82, Android 8 or newer.
- Android TV / Google TV and compatible Fire TV: 0.8.81.
- Samsung Tizen: 0.8.81 receiver installed through the phone, with Developer Mode and a suitable device certificate. No public Samsung Store release or default Home replacement.
- LG webOS: separate Preview 0.1.1, initial target webOS 5+. Phone installation/pairing requires Developer Mode and Key Server. See /lg-install.html.
- Android 4.4 Legacy remains an isolated, locally validated candidate and is not a public download yet. Current UI and application identity are preserved.
- Non-Android Hisense VIDAA is not covered by the Android APK.

This update removes automatic TV update prompts, corrects display branding, adds optional PayPal/Stripe support, sports radio, in-app radio continuation and Android/Fire official store search. The user completes app installation in the official store.

The LG app checks known installed IDs, including Shahid, with the documented installation-check API. External launch depends on LG permissions. Current changes are locally tested with mocked devices; a user confirmed the previous LG UI on webOS 25. This is not a claim that every TV or codec was physically tested.

Background radio continues while navigating within Morph TV. Stop controls remain available. Video, Adhan, app exit and supported foreground-loss events stop audio. ON Sport FM is marked unavailable because its checked audio endpoint returned an error; no failed station is labeled verified.

Release hashes: /SHA256SUMS.txt. Validation and limitations: /release-notes-0.8.81.json and /lg-preview-validation.json.

Install updates over the existing app to retain its identity and settings. Existing diagnostic packages and evidence are not changed. To stop radio, use Stop. To disable LG phone access, use Forget LG; remove LG Preview separately from the TV if desired.

Phone 0.8.82 fixes update detection using native HTTPS and checks again when the app resumes. Manual checks remain available. TV receivers remain 0.8.81 and LG Preview remains 0.1.1; automatic TV update prompts stay disabled. Older phone builds need this patch installed manually once.
