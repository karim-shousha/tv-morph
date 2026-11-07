# MORPHTV TEST DEPLOYMENT REPORT

Date: 28 October 2026 (America/New_York). Status: **DEPLOYED AND REMOTELY VERIFIED — manual test only**.

## 1. Source state and preservation

- Actual source directory: `C:\Users\Admin\Documents\Codex\2026-10-22\ui-ux`. The chat working directory is an attachments/output directory, not the source repository.
- Branch: `codex/perf-recovery-impl`. Baseline commit: `fff41ebc52025826c894dc6de84ea8b867a9ab46`. This commit alone is NOT the built source: all current working-tree changes and relevant ignored files were included.
- The initial tree had 69 modified tracked files. Important new files are ignored by the checkpoint repository's `*` ignore rule, including Mobile 3.0 assets and QA reports. They were inspected and included, rather than relying on `git status` alone.
- Other branches inspected: `master`, `codex/usb-media-repair`, `codex/modern-ui-phase1-2`, `codex/reference-neon-focus`, `codex/premium-catalog-refinement`. No branch checkout, merge, reset, clean, or source commit was performed.
- Pre-release source fingerprint: `6adfc59b33b98e718d104732df55da8f271043a0575639373996316715908e85` (420 preserved files).
- Final build-source fingerprint: `c5a9de1e809e91f24350adff140d915e0f9ab6828f45ff28bfe9957c6a6c906f`.
- Private preservation archive: `.tools/opencode-test-20261028/source-before.zip`; hash inventory: `source-before.json`; original dirty diff: `working-tree-before.patch`; initial Git status: `git-status-before.txt`.
- OpenCode application source files remained byte-identical to the preservation inventory. Only the release inputs/generated outputs listed in section 5 changed during this task.

## 2. OpenCode work detected

Read the Mobile 3.0 implementation/QA reports, TV performance implementation report, TV Settings implementation report, and final TV QA report in this directory. Their claims were checked against current source and fresh test results.

- Mobile 3.0: Home / Design / Control / Play navigation, settings gear sheet, navigation history and scroll memory, remote/apps/share segments, IP cards/copy actions, explicit connection steps, onboarding, TV-inspired visual tokens, light/dark appearance and five-language support. `mobile-app/assets/ui/morph30.js` and `morph30.css` are present in the built APK with exact source-byte parity.
- TV: focus geometry caching/invalidation, dock/rail caching, lifecycle cleanup for background work, reflection gating, deferred body scripts, seven Settings categories, and Quality / Balanced / Performance tiers with migration and the existing native light/full bridge contract.
- Existing prior work in the same dirty tree, including IPTV, USB player, phone pairing, platform bridges, themes and native changes, was preserved. Reports identify the OpenCode-scoped changes; attribution of every older uncommitted line to an individual tool cannot be established from Git.
- No UI redesign, theme/artwork change, runtime refactor, new dependency or business-logic change was made for this release.

## 3. Existing infrastructure and deployment isolation

- Existing public server: `https://morphtv.herroshetta.com`.
- Existing artifact Git repository: `https://github.com/karim-shousha/tv-morph.git`, local checkout `.tools/release-push`.
- Existing Coolify application: `TV Morph / production / tv-morph-downloads`, ID `gn1px3ahbeik1gxkxoeha3mv`. Existing Docker/nginx/Python service was reused.
- No separate staging service or test channel was present. A new static, isolated manual-test directory was added under the existing server, as authorized: `test-releases/20261028-opencode-6adfc59b33b9/`.
- Test page: [https://morphtv.herroshetta.com/test-releases/20261028-opencode-6adfc59b33b9/](https://morphtv.herroshetta.com/test-releases/20261028-opencode-6adfc59b33b9/). Separate test manifest and checksums are in that directory.
- Only an additive `COPY` in the release repository Dockerfile and Docker-context allowlist entries were needed. No nginx configuration, DNS, domains, credentials, production download routes, production manifests, update channel or application API changed.
- The original production `catalog.json` still identifies version **0.8.170**. Test version **0.8.171** is discoverable only through the isolated test URLs, not through the production update manifest.
- No automatic installation, app-store submission or physical-device installation was triggered.

## 4. Builds and exact downloads

Mobile UX 3.0 is the experience version; the existing native version sequence is retained as 0.8.171 for this test. Version codes were incremented to permit a manual update over 0.8.170 with the same IDs/signatures.

| Platform | Result / identity | Version | Bytes | Download |
|---|---|---|---:|---|
| phone | Built; `local.cleartv.mobile` | 0.8.171-tester / code 183 | 23632830 | [Morph-TV-Mobile-3.0-0.8.171-test.apk](https://morphtv.herroshetta.com/test-releases/20261028-opencode-6adfc59b33b9/Morph-TV-Mobile-3.0-0.8.171-test.apk) |
| android-tv-firetv | Built; `local.tvmorph.tv` | 0.8.171-preview / code 172 | 9138323 | [Morph-TV-Android-TV-0.8.171-test.apk](https://morphtv.herroshetta.com/test-releases/20261028-opencode-6adfc59b33b9/Morph-TV-Android-TV-0.8.171-test.apk) |
| lg-webos | Built; `com.zainbot.morphtv.preview` | 0.8.171 | 4243988 | [Morph-TV-LG-0.8.171-test.ipk](https://morphtv.herroshetta.com/test-releases/20261028-opencode-6adfc59b33b9/Morph-TV-LG-0.8.171-test.ipk) |
| samsung-tizen | Built; `ClearMob01.Home` | 0.8.171 | 4305116 | [Morph-TV-Samsung-0.8.171-test.wgt](https://morphtv.herroshetta.com/test-releases/20261028-opencode-6adfc59b33b9/Morph-TV-Samsung-0.8.171-test.wgt) |
| samsung-computer | Built; `ClearMob01.Home` | 0.8.171 | 4286083 | [Morph-TV-Samsung-Computer-0.8.171-test.zip](https://morphtv.herroshetta.com/test-releases/20261028-opencode-6adfc59b33b9/Morph-TV-Samsung-Computer-0.8.171-test.zip) |

Android TV / Google TV and compatible Fire TV devices use the same APK, as before (minimum Android API 26 / Android 8). No separate invented Fire TV binary was produced. LG remains the existing webOS 5+ initial test target, with older versions unverified.

Samsung WGT uses the existing developer signing profile; installation is governed by author/distributor certificate and device/DUID permissions. It is not a universal unsigned installer or USB TMG package. The computer project allows the owner to use the original author certificate; it includes the existing experimental Tizen 4 configuration option. Physical model compatibility remains unverified.

VIDAA: no supported runtime download exists in the verified distribution; existing VIDAA URLs return 410. OpenCode's discovery/manual-selection UI does not create a VIDAA runtime. No VIDAA binary was invented or published. Legacy Android 0.1.1 was unrelated to the updated code and was not rebuilt, restamped or republished.

### Signing and package integrity

- phone: APK signature verified; certificate SHA-256 `47cc6e1a0c9242e3c5bbc5a16b4d64c353ee5e8ef060b802459fbf0e74909fd8` matches the previously published 0.8.170 APK. The package is not debuggable.
- android: APK signature verified; certificate SHA-256 `47cc6e1a0c9242e3c5bbc5a16b4d64c353ee5e8ef060b802459fbf0e74909fd8` matches the previously published 0.8.170 APK. The package is not debuggable.
- Samsung: author certificate SHA-256 `ca4b4cd26e6f345b49041880e4bcc1ea1e610d764ebcfdaca4a9590e2b48bb3a`; matches existing author: `True`. Java XML-DSig validation passed for both RSA-SHA512 signatures, certificate validity and all 184 author / 185 distributor references.
- LG: existing IPK packaging succeeded; package identity/version and SHA-256 verified. The existing phone installer pins the exact embedded IPK hash; no new IPK signing scheme was introduced.
- All ZIP-based packages passed CRC integrity checks and exclusion checks for private keys, keystores, signing passwords and credential JSON. The signed phone embeds byte-identical fresh Android TV/LG packages and the current Samsung prepared source.

## 5. Minimal release edits and build side effects

1. Android manifests: 0.8.170 → 0.8.171, phone code 182 → 183, TV code 171 → 172; existing application IDs, SDK targets and signing identities retained.
2. LG appinfo/build metadata and phone's embedded-IPK path: 0.8.171. No production 0.8.170 file was overwritten.
3. Packaging-only bridge fix: OpenCode changed body tags to `<script defer src=...>`, while existing packagers used exact matches for `<script src=...>`. Packaging substitutions were made defer-aware in `android-tv/build.py`, `mobile-app/build.py`, and `webos-app/build.py`. Injected locale/platform/initial-config scripts retain deferred execution and order. This prevents silently missing platform bridges without changing application code or visual design.
4. The existing mobile build invokes the Android TV build unless `--phone-only`, compiles shared TV native media classes, embeds the TV/LG/Samsung payloads, and updates `LgInstallProtocol.java` VERSION/SHA. These side effects were expected and verified; the new LG hash is consistent with the signed APK.
5. LG build regenerates `webos-app/baseline.json` and `validation.json`. Locale QA regenerates `mobile-app/locale-audit.json` and screenshots. These are generated validation outputs, with originals preserved in the private snapshot.
6. The old `tv-project/tools/build.py` has stale asset assumptions and a shallow source copy. Instead of using a stale WGT or changing application source, the existing Tizen SDK packager signed the current complete Samsung bundle generated by the established phone pipeline in a new isolated build directory. The existing `tv-project/ClearTV.wgt` was not replaced.

Exact observed changed inventory:

- `android-tv/AndroidManifest.xml`
- `android-tv/build.py`
- `mobile-app/AndroidManifest.xml`
- `mobile-app/build.py`
- `mobile-app/locale-audit.json`
- `mobile-app/src/local/cleartv/mobile/LgInstallProtocol.java`
- `webos-app/appinfo.json`
- `webos-app/baseline.json`
- `webos-app/build.py`
- `webos-app/validation.json`

## 6. Fresh verification

- Phone: 12/12 current suites passed: ui-check, locales, connect-flow, appearance, bright, editor-directions, family-phone, header, languages, library-polish, reconnect and morph30-check. Native transport was mocked; these are browser UI/contract checks, not physical-device evidence.
- TV: 4/4 suites passed: performance regression (18 checks), lifecycle (6), Settings navigation (4), tier migration/cycling. Desktop Chrome/file URLs, not TV hardware.
- Additional release check: the actual generated Android/Samsung/LG pages booted without page errors; each platform bridge was present, Performance tier API available and Settings reachable.
- Current Mobile 3.0 files were compared to APK asset bytes. Phone embedded Android/LG payloads were compared byte-for-byte to freshly built artifacts. Public/private signing-material exclusion was checked.
- No physical TV, provider playback, pairing/install transport or hardware soak certification is claimed. Existing out-of-scope TV fixture failures documented in the OpenCode Mobile QA report were not rewritten or hidden.

## 7. Download hashes and remote results

| Artifact | Local SHA-256 | Remote SHA-256 | HTTP / size |
|---|---|---|---|
| Morph-TV-Mobile-3.0-0.8.171-test.apk | `a9f0c7a23faa60b21fcc68e723633dc9539f06eb44b46e4975e57e228d4e0ba2` | `a9f0c7a23faa60b21fcc68e723633dc9539f06eb44b46e4975e57e228d4e0ba2` | 200 / 23632830 bytes |
| Morph-TV-Android-TV-0.8.171-test.apk | `7fcead9c753a0de1c814b688a7ac90ca6cf099c4872cb0743162cc0070659870` | `7fcead9c753a0de1c814b688a7ac90ca6cf099c4872cb0743162cc0070659870` | 200 / 9138323 bytes |
| Morph-TV-LG-0.8.171-test.ipk | `94139ec0bb33e41647503e353aa4c82445a4d45ace134d4e580c9c764a014c95` | `94139ec0bb33e41647503e353aa4c82445a4d45ace134d4e580c9c764a014c95` | 200 / 4243988 bytes |
| Morph-TV-Samsung-0.8.171-test.wgt | `96a7b09a1bafad4f7faf8cd298ac7062cea1cb40607c32682dbbdb977615efe1` | `96a7b09a1bafad4f7faf8cd298ac7062cea1cb40607c32682dbbdb977615efe1` | 200 / 4305116 bytes |
| Morph-TV-Samsung-Computer-0.8.171-test.zip | `b36e1e2c0fafbbee2ce7dedac0aa129bf09ef8ee68220ad215127da58fea5350` | `b36e1e2c0fafbbee2ce7dedac0aa129bf09ef8ee68220ad215127da58fea5350` | 200 / 4286083 bytes |

Remote verification finished: `2026-10-28T13:33:38.643088+00:00`. Every test file was downloaded in full from its exact URL; size and SHA-256 matched the local build. The test HTML, manifest and checksum file were also verified. Unique versioned paths avoid stale-name reuse. Production catalog bytes were unchanged, latest stayed 0.8.170, all 7 catalog-listed production artifacts still matched their pre-deployment checksums, production download routes were checked, and community health remained available.

## 8. Blockers, failures and final scope

- Build blockers: none for the five listed test deliverables; the initially unavailable-toolchain statement in the OpenCode TV report did not apply to the installed Windows toolchains discovered here.
- Unsupported/unbuilt: VIDAA runtime and unrelated legacy Android release, for the reasons above.
- Physical installation/playback and Samsung device certificate permissions remain real-device test gates.
- Production application/release files and update metadata were preserved. The only deployment configuration change is serving an additional static test directory from the same existing container.
- Local evidence directory: `.tools/opencode-test-20261028/` (source snapshots, Git status/diff, build/signature/test results and remote verification). This private evidence directory was not published.
