# Universal IPTV device matrix

**No physical TV was available in this task** (`adb`/`sdb` empty; webOS CLI localhost only).
Every hardware row below is NOT TESTED unless a fixture column says otherwise. Do not read
simulation rows as device passes.

| Platform / build | Engine / OS | What was tested | Navigation / section latency | Long session | Actual vs sim | Result |
|---|---|---|---|---|---|---|
| Samsung Tizen 4.x / 5.x | Chromium M56 / M63 (vendor spec) | esbuild chrome56 + tv-compat audit | Not measured on TV | Not run | No device | NOT TESTED |
| Samsung newer (M80+) | per Samsung spec | desktop fixture (Edge, 4× throttle) | nav P95 ~37 ms (sim) | 20 s smoke; 15-min pending | Simulation | SIM-ONLY improvement |
| LG webOS 5+ (`0.8.227-lg` target) | Chromium 68 | splice + chrome68 transform re-verified | Not measured on TV | Not run | No device | NOT TESTED |
| LG webOS 4.x | Chromium 53 | — (outside declared 5+ target) | Unknown | Not run | — | NOT CERTIFIED |
| Android TV / Google TV / Fire TV (vCode 227) | Android 8+, WebView varies | `javac` closure 0 errors; protocol review | Not measured on device | Not run | No device | NOT TESTED |
| Tizen 3 lite | legacy engine | backend file shared; chrome47 CSS target | Unknown | Not run | No device | NOT TESTED |
| VIDAA hosted / android-legacy | web shell / SDK 19 | confirmed no IPTV catalog path | N/A | N/A | — | Out of scope |

Required per-platform scenario list (cold start, IPTV start, Live/Movies/Series, 50k+ stress,
rapid D-pad, category switch, search, playback, resume, cache persistence, network cut, low-memory,
30-min stability) is defined in `ANDROID_TV_IPTV_RECOVERY_VALIDATION.md` §2 and applies to every
row above. None is marked passed. Engine sources: Samsung/LG vendor spec pages (cited in the
earlier root-cause report).
