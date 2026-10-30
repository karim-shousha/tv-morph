# Morph TV 0.8.229

- IPTV opens Movies, Series and Live using a remembered category or the first available category. All categories remains available explicitly. Search, favourites, Continue Watching and episodes keep their existing paths.
- Home requests provider-order previews capped at 24 items. Native Xtream and Samsung/LG transform only the preview subset; Portal previews use one ordered page. Xtream still downloads and parses the complete provider response, so first-load network/parse cost is not eliminated.
- Native Android includes the OpenCode catalogue-version revalidation and full-catalogue category derivation. Shared frontend/backend Phase A changes ship on supported standard Samsung and LG packages.
- Phone package embeds the exact signed Android TV 0.8.229 APK, Samsung payload 0.8.229 and LG 0.8.229 IPK; its displayed TV installation version is 0.8.229.
- Full Android/phone signed builds and webOS packaging passed. 24 backend checks passed. Actual native JVM checks covered 71,000 cached rows and a 71,000-row HTTP preview with 24 transformed results. Packaged desktop navigation/section/settings checks passed without JavaScript errors. These are not physical-TV tests.
- Saved accounts and existing visuals/features are preserved. No timeouts were extended. Physical Android TV/Tizen/LG playback, memory pressure and 30-minute stability remain unverified. This preview does not claim the reported TV timeout is resolved.
- Legacy Tizen 2/3 and Android Legacy remain their existing separate builds; this release does not falsely relabel them as 229. Samsung certificate automation/file-upload features are not included.
