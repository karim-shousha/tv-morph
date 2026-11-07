# LEGACY INSTALLATION GUIDE

Experimental candidates. No physical-device verification has been completed — report the exact
on-screen message + TV model/firmware if any step fails. Do not install on daily-driver TVs
without reading Rollback first. Nothing here modifies the main Morph TV app or its data
(Lite 2/3 and Legacy APK use separate identities).

## Which package for which TV

| Your TV | Install THIS | Do NOT install |
|---|---|---|
| Samsung 2015–2016 (Tizen 2.3/2.4, NOT Orsay/2.0) | `samsung-legacy2/Morph-TV-Tizen2-Lite-0.8.216-candidate.wgt` + `Install-Tizen2.ps1` | Tizen 3/4/5 bundles, modern WGT |
| Samsung 2017 MU (Tizen 3.0) | `samsung-legacy/Morph-TV-Tizen3-Lite-0.8.187-candidate.zip` + `Install-Tizen3.ps1` | Tizen 2/4/5 bundles, modern WGT |
| Samsung 2018 NU (Tizen 4.0) | `samsung-tizen4/Morph-TV-Samsung-Tizen4-0.8.243.wgt` + `Install-Tizen4.ps1` | Tizen 2/3/5 bundles, stale 0.8.170 root WGT |
| Android 4.4 box/stick (API 19) | `android-legacy/Morph-TV-Legacy-0.1.2.apk` (side-load, keep current Morph TV) | Full `android-tv` APK (API 26+, will not install) |
| Android 4.0–4.3 | NOTHING — unsupported by design | Any APK in this repo |

## Samsung (all three): prerequisites
1. Tizen Studio + TV Extension + Samsung Certificate Extension.
2. TV: Apps → enter `12345` → Developer Mode ON → Host PC IP = this computer → restart TV.
3. Device Manager: connect `sdb connect <TVIP>:26101`, obtain TV DUID, create distributor certificate
   containing it, choose Permit to install applications.

## Samsung install commands
```powershell
# Tizen 2 (ships pre-packed WGT; script re-signs it with YOUR certificate)
.\Install-Tizen2.ps1 -TVIP 192.168.1.2 -CertificateProfile MySamsungProfile
# Tizen 3 (ships ZIP; script packages + signs at install time)
.\Install-Tizen3.ps1 -TVIP 192.168.1.2 -CertificateProfile MySamsungProfile
# Tizen 4 (ships WGT; script re-signs it with YOUR certificate)
.\Install-Tizen4.ps1 -TVIP 192.168.1.2 -CertificateProfile MySamsungProfile
```
Use your own author + distributor certificates; no private keys ship with these candidates.

## Android 4.4 install + acceptance
1. Keep current Morph TV installed. Side-load `Morph-TV-Legacy-0.1.2.apk` → **Morph TV Legacy**.
2. Open Legacy from Apps first; do not set it as default Home until navigation is checked.
3. Check Home buttons (D-pad Up/Down/OK), switch language/color, reopen, verify persistence.
4. Open an installed app and return. Load a small direct M3U URL (final URL if your provider
   redirects more than 3 times). Failure pages now state the category (`[DNS]/[TIMEOUT]/[TLS]/…`).
5. Confirm original Morph TV still opens unchanged.

## First-run expectations (honest limits)
- H.264/AAC over HTTP(S) is the best-supported path; HEVC/VP9/DASH/DRM/multiview/Portal are
  unsupported on Lite/Legacy and fail with an explicit message, not a spinner.
- TLS-incompatible providers fail with `[TLS]` — no certificate checks are bypassed, ever.
- Large libraries load slower than modern; if a catalog stalls, retry with a smaller category
  and capture SDB/ADB logs (see audit report 13) rather than raising timeouts.

## Rollback
- Samsung Lite: uninstall **Morph TV Lite 2/3** (or Morph TV 0.8.243) from Apps — main app and data
  are separate and untouched. Original WGTs/APKs were never overwritten.
- Android Legacy: Settings → Apps → **Morph TV Legacy** → Clear defaults (if set as Home) →
  Uninstall. Removes only Legacy preferences.
- Repo: every file changed in this phase is untracked (tracked tree untouched); delete
  `legacy-build/`, `samsung-tizen4/`, new candidate files, and the 4 `LEGACY_*.md` docs to revert.
  Preserved originals: `*-0.8.186*.zip`, `*-0.8.206*`/`*-0.8.215*.wgt`, `Morph-TV-Legacy-0.1.0/0.1.1.apk`,
  root `*-0.8.170.wgt`.
