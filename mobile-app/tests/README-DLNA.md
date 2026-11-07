# Mobile DLNA cast tests (fixtures only — no physical renderer)

Run from the repository root in PowerShell:

```powershell
node mobile-app/tests/dlna-cast-ui.cjs
& '.tools/tizen/sdk/data/jdk/bin/javac.exe' -encoding UTF-8 -cp .tools/provider164/json.jar -d C:\Users\Admin\AppData\Local\Temp\opencode\dlna-fix\dlna-classes mobile-app/tests/DlnaCastCheck.java mobile-app/src/local/cleartv/mobile/DlnaCast.java mobile-app/src/local/cleartv/mobile/DlnaMediaServer.java
& '.tools/tizen/sdk/data/jdk/bin/java.exe' -cp 'C:\Users\Admin\AppData\Local\Temp\opencode\dlna-fix\dlna-classes;.tools/provider164/json.jar' local.cleartv.mobile.DlnaCastCheck
```

`DlnaCastCheck` starts a mock renderer + mock file client on the machine's
private LAN address and asserts: IP validation, SOAP escaping, description
parse (AVTransport:2 + RenderingControl:3), connect probe, caps, position,
seek, volume, mute, Play/Pause/Stop, SetAVTransportURI metadata, fault
handling, and mini-server GET/HEAD/Range/404/405/416/allowlist behavior.
`dlna-cast-ui.cjs` drives the real `dlna-cast.js` with a fixture bridge and
asserts capability-gated Seek/volume/mute and rescan reset. Neither proves
real-device playback.
