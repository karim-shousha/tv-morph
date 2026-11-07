# Morph TV phone architecture

Feature behavior belongs with its feature. Keep shared navigation and transport contracts small; do not add Bridge or remote business logic to `app.js` or `MainActivity.java`.

## Web host

| Responsibility | Source | Contract |
| --- | --- | --- |
| Host setup, draft and existing transport dispatcher | `assets/ui/app.js` | `MorphNative.call`, `operation`, `ready`, `platform` |
| Device selection and platform-specific setup labels | `assets/ui/device-controller.js` | `MorphDeviceController.select(brand, ready)` returns selection state |
| Discovery and connection presentation | `assets/ui/connect-flow.js`, `setup-options.js`, `lg-connect.js` | Use host/native discovery; do not implement another scanner |
| Remote connection, commands, text, long press and disconnect state | `assets/ui/remote-controller.js` | `MorphRemoteController.create(context)`; existing keyboard/reset hooks remain compatible |
| Remote button artwork | `assets/ui/remote-visual.js`, `remote.css`, `remote-visual.css` | Presentation only |
| Navigation and phone shell | `assets/ui/morph30.js` | `Morph30.show` |
| IPTV | Canonical `../android-tv/iptv/`, phone adapters `phone-iptv.js/css` | Stage the shared frontend; do not fork catalog or player behavior |
| Prayer | `assets/ui/worship-phone.js/css` | Separate feature |
| Matches | `assets/ui/matches-phone.js/css`, `matches-entry.js` | Separate feature |
| Settings | `assets/ui/settings-mobile.js`, `appearance.js` | Separate feature |

Load `device-controller.js` and `remote-controller.js` before `app.js`. The remote receives transport and selected-platform getters explicitly; it owns its mutable remote state. The device controller returns state to the host, which commits it before resetting the remote.

## Integrated native remote

`integrated-remote/lib/features/` already separates `devices`, `discovery`, `pairing`, `remote`, `onboarding` and `settings`. Shared primitives live under `core`, platform providers under `providers`, and common services under `services`.

The Java host already has separate platform components such as `LgDiscovery`, `LgControl`, `SdbClient` and `DlnaCast`. `src/local/cleartv/mobile/MainActivity.java` remains a substantial dispatcher/lifecycle class; it is not yet a minimal shell. Extract responsibilities by behavior with regression checks, rather than moving arbitrary line ranges or duplicating providers.

## Bridge integration boundary

The supplied Bridge source is at `E:/AppBridgeTV`. Its baseline snapshot is integrated as `bridge-native/`, with original source hashes in `bridge-native/upstream-source.json`. The original workspace stays unchanged. The integrated module owns local Morph TV shell changes; do not overwrite them by copying the upstream workspace again. `BridgeLaunch.java` opens the library after checking API 29 support. Pairing, ADB, streaming, providers and permissions stay inside the module.

`MorphHostShell.kt` uses the host's `cleartv` appearance preference, wordmark, fonts and semantic colors for both Bridge and helper setup. Bridge has no independent appearance setting. `SessionManager.statusJson()` sends the same host appearance to its TV receiver. Header Back and Android Back share one step history: settings return to their caller, installation returns to TV setup, and Apps returns to the existing Morph TV activity. Background operation callbacks must not render a destroyed activity. Session notifications reopen the embedded page and expose an explicit Stop action.

`PhoneUiLaunch.java` handles local Bridge, Remote and Matches launches before the network executor. These launches must never wait behind TV discovery or connection requests. `BridgeAppCatalog.kt` loads app metadata and icons off the UI thread, caps icon cache memory at 2 MB, and cancels work on page destruction. `home-shortcuts.js/css` owns the phone navigation additions. The installed Bridge app artwork is separate from the line icon in the bottom navigation.

## Checks for the controller extraction

- `node mobile-app/tests/remote-controller.cjs`: Android, Samsung and LG command eligibility, text, Android long press, command failure and reconnection.
- `node mobile-app/tests/controllers-integration.cjs`: real phone HTML/script load with fixture transport, selected-platform state, keyboard/text compatibility and integrated remote launch. Missing shared assets are served from the existing staged bundle.

These checks validate application behavior with fixture transport; they do not replace physical TV or phone testing. Generated language tables and artwork size are separate concerns from feature modularity.

Bridge helper availability checks must remain nonblocking. `awaitBinder` belongs only in explicit helper setup/binding work, never in Activity startup. The native regression instrumentation holds the TV network executor and verifies Bridge can still open and draw.
