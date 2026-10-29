# Morph TV Lite 2 — 0.8.206 candidate

Experimental compatibility build for Samsung Tizen **2.3 / 2.4**, not Orsay or Tizen 2.0. No physical TV installation or playback verification has been completed. ES5 syntax and a modern-browser simulation with missing legacy APIs passed; this is not verification on the old WebKit engine.

Download the WGT. It is already a package; do not rename it or manually convert it to a folder. It requires signing with your Samsung author certificate and a distributor certificate containing your TV DUID. No private keys are included.

On Windows install Tizen Studio, Main SDK → Certificate Manager, Extension SDK → TV Extension / Web app tools and Samsung Certificate Extension. On the TV open Apps, enter 12345, enable Developer Mode, enter the computer IPv4 (CMD → `ipconfig`, Wi-Fi/Ethernet IPv4), and restart the TV. Connect Device Manager to the TV IP on port 26101. Create a Samsung TV certificate profile including its DUID and permit application installation.

Put Install-Tizen2.ps1 beside Morph-TV-Tizen2-Lite-0.8.206-candidate.wgt. In PowerShell in that folder run:

```powershell
.\Install-Tizen2.ps1 -TVIP 192.168.1.2 -CertificateProfile MySamsungProfile
```

Replace both example values. The script extracts to a unique temporary folder and signs a new WGT automatically. It installs separately as Morph TV Lite 2. Keep the original app and certificate backup.

Fixed wallpaper, no blur/glow/motion, ES5/polyfills and old-layout fallbacks are enabled. Codec/TLS/DRM and AVPlay support remain model dependent. Portal/Stalker and multiview are not supported on this Samsung candidate. Local M3U file import and native quality selection are Android features, not enabled here. Test Home, remote focus/Back, themes, installed apps, then an authorized H.264/AAC HTTP/HLS stream. Report the exact model and error if installation or playback fails.
