"""Create an auditable runtime snapshot for an isolated macOS build branch."""
from pathlib import Path
import hashlib,json,zipfile

HERE=Path(__file__).resolve().parent
OUT=HERE/'build/mac-ci'
OUT.mkdir(parents=True,exist_ok=True)
package=json.loads((HERE/'package.json').read_text())
package['scripts']={'start':'electron .','test':'node tests/local-media-response.cjs && node tests/updater.cjs && node tests/shared-ui-layout.cjs && node tests/prayer.cjs && node tests/settings-readable.cjs && node tests/matches.cjs && node tests/desktop.cjs && node tests/cleaner.cjs && node tests/review-parity.cjs && node tests/home-visibility.cjs && node tests/theme-art-position.cjs'}
package['build']['mac'].update({'identity':'-','hardenedRuntime':False,'notarize':False})
files=[HERE/name for name in ['main.cjs','preload.cjs','lan.cjs','matches.cjs','vpn.cjs','updater.cjs','cleaner-files.cjs','local-media-response.cjs','package-lock.json','tests/local-media-response.cjs','tests/desktop.cjs','tests/matches.cjs','tests/shared-ui-layout.cjs','tests/prayer.cjs','tests/settings-readable.cjs','tests/updater.cjs','tests/cleaner.cjs','tests/review-parity.cjs','tests/home-visibility.cjs','tests/theme-art-position.cjs']]
files += [p for p in (HERE/'build/ui').rglob('*') if p.is_file()]
files += [HERE/'build/icon.ico',HERE/'build/icon.icns']
# Every explicit desktop runtime member must also ship in the isolated Mac snapshot.
for member in package['build']['files']:
    if '*' not in member and member!='package.json':
        assert HERE/member in files, 'Missing desktop runtime member in Mac snapshot: '+member

receipt=json.loads((HERE/'build/source-receipt.json').read_text())
archive=OUT/'morph-desktop-runtime.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for file in files:
        assert file.is_file(),file
        relative=file.relative_to(HERE).as_posix()
        assert not any(p in relative for p in ['user-data','test-output','node_modules','.private'])
        z.write(file,relative)
    z.writestr('package.json',json.dumps(package,indent=2))
    z.writestr('source-receipt.json',json.dumps(receipt,indent=2))
metadata={'file':archive.name,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'version':package['version'],'canonicalLauncher':'tv-project/app','embeddedIptv':'android-tv/iptv','separateIptvProduct':False}
(OUT/'runtime.json').write_text(json.dumps(metadata,indent=2))
print(json.dumps(metadata))
