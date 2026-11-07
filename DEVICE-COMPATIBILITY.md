# TV Morph device coverage audit — 2026-10-22

Support is implemented by OS/protocol family, not a hardcoded household IP or a whitelist of individual model numbers. See device-compatibility.json for machine-readable current status. A detected model is not proof of installation or playback support.

| Family | Discovery | Installation / operation today | Remaining validation |
|---|---|---|---|
| Android / Google TV 8+ across manufacturers | Receiver HTTP, Android remote mDNS, explicit SSDP evidence | Signed APK, paired receiver update, themes, internal controls, IPTV/radio | Test each OS/device/codec family; one Hisense Android 12 user report is not universal certification |
| Samsung Tizen | Samsung device API + SSDP | Experimental device-specific signed WGT installation, independent UI | Device authorization/certificates and model-group testing; no universal public WGT |
| LG webOS | SSDP identification | No working TV Morph receiver/installer yet | Build webOS receiver, deploy with LG Developer Mode/store, test on physical LG |
| VIDAA | Explicit network descriptors where advertised | VIDAA 0.1 hosted web app with themes and direct-media library; optional developer-page install | Physical firmware installation/playback test; phone pairing and production distribution pending |
| Samsung legacy / LG NetCast / Roku / Fire TV | Not certified | Not advertised as supported | Separate adapters, package/deployment and real-device tests |

Automatic identity reads explicit operatingSystem/osName, osVersion and softwareVersion/firmwareVersion fields when advertised. Manufacturer alone is insufficient: Hisense can be Android, VIDAA or Roku. Absence of an advertised version does not trigger a fabricated version or block a compatible receiver.

Primary platform references:
- https://developer.android.com/training/tv/publishing/distribute
- https://developer.samsung.com/smarttv/develop/specifications/tv-model-groups.html
- https://developer.samsung.com/smarttv/develop/guides/fundamentals/retrieving-platform-information.html
- https://webostv.developer.lge.com/develop/getting-started/developer-mode-app
- https://www.vidaa.com/partner-support/

Outstanding: LG receiver is not implemented. VIDAA now has a development web build, but physical installation, phone pairing and production distribution are not verified. Do not show a fake download button or classify discovery as successful installation. A one-tap first install on arbitrary unprepared TV is not established by current code.
