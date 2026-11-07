Morph Remote integration into Morph TV

Source: E:/Morph-Remote/morph_remote, version 1.1.1+12, copied 2026-11-01.
Provider, discovery and pairing fixes are preserved. Host APK identity, signing key, native IPTV and Studio remain those of Morph TV.
Build: python mobile-app/build_integrated.py

The normal `python mobile-app/build.py` entry point also builds the integrated APK.
Its `--native-stage` mode is internal asset preparation, not a distributable build.
The TV blue/night SVG wallpaper is copied unchanged into the WebView assets and
rendered once for Flutter. Provider and discovery source files remain unchanged.
The host package/signing identity remains `local.cleartv.mobile`, so upgrades keep
the existing encrypted IPTV accounts. Standalone Morph Remote pairing data lives
under its own package; the embedded remote pairs from within Morph TV.
