"""Verify public download bytes, filenames and hashes without executing installers."""
from pathlib import Path
import hashlib,json,sys,time,urllib.parse,urllib.request
HERE=Path(__file__).resolve().parent
site='--site' in sys.argv
manifest=json.loads((HERE/'dist/desktop-release.json').read_text())
checks=[]
for platform,suffix in [('windows','.exe'),('mac','.dmg')]:
    expected=next(item for item in manifest['files'] if item['name'].endswith(suffix))
    base='https://morphtv.herroshetta.com/download/'+platform if site else 'https://github.com/karim-shousha/tv-morph/releases/download/desktop-v0.1.0/'+expected['name']
    digest=hashlib.sha256();size=0
    request=urllib.request.Request(base+'?verify='+str(time.time_ns()),headers={'User-Agent':'Morph-Desktop-Download-Verification','Cache-Control':'no-cache'})
    with urllib.request.urlopen(request,timeout=60) as response:
        assert response.status==200
        disposition=response.headers.get('Content-Disposition','')
        assert expected['name'] in disposition,disposition
        while block:=response.read(1024*1024):digest.update(block);size+=len(block)
    assert size==expected['bytes'] and digest.hexdigest()==expected['sha256']
    row={'platform':platform,'url':base,'bytes':size,'sha256':digest.hexdigest(),'attachment':True,'passed':True}
    checks.append(row);print(json.dumps(row),flush=True)
(HERE/'test-output'/('public-downloads.json' if site else 'github-downloads.json')).write_text(json.dumps(checks,indent=2))
