"""Build the full shared launcher for Tizen 5+, without legacy visual overrides."""
from pathlib import Path
import sys,subprocess,zipfile,re,hashlib,json

ROOT=Path(__file__).resolve().parents[1]
BUILD=ROOT/'.tools/tizen5-review-stage'
if '--reuse-stage' not in sys.argv:
    subprocess.run([sys.executable,str(ROOT/'mobile-app/build.py'),'--tv-web-only','--tizen5'],cwd=ROOT,check=True)
source=BUILD/'assets/tv-app.zip'
sys.path.insert(0,str(ROOT/'legacy-build'))
from guard import scan_forbidden_ast
app=BUILD/'samsung-current-ui'
bad={str(p.relative_to(app)):scan_forbidden_ast(p) for p in app.rglob('*.js')}
assert not any(bad.values()),'Unsupported JavaScript in Tizen 5 package'
with zipfile.ZipFile(source) as archive:
    config=archive.read('config.xml').decode('utf-8')
    assert 'required_version="5.0"' in config and 'ClearMob01.Home' in config
    assert 'http://developer.samsung.com/privilege/network.public' in config, 'Bridge discovery requires Samsung network permission'
    assert not any('tizen4-caps.js' in n or 'samsung-layout-fixes.css' in n for n in archive.namelist())
    assert archive.read('tizen5-compat.js')==(ROOT/'samsung-current/tizen5-compat.js').read_bytes()
    assert archive.read('tizen5-compat.css')==(ROOT/'samsung-current/tizen5-compat.css').read_bytes(), 'Staged Tizen 5 styles are outdated'
    version=re.search(r'<widget[^>]+version="([^"]+)"',config).group(1)
    html=archive.read('index.html').decode('utf-8')
    assert 'data-morph-presentation="reference"' in html
    assert 'tizen5-compat.js' in html and 'tizen4-caps.js' not in html
    assert archive.testzip() is None
output=BUILD/('Morph-Launcher-Samsung-Tizen5-'+version+'-Visual-Fix.wgt')
output.write_bytes(source.read_bytes())
report={'version':version,'minimumTizen':'5.0','appId':'ClearMob01.Home','presentation':'Shared Android/TV canonical presentation, compatibility adaptations only','forcedLowMemory':False,'legacyBlueLayout':False,'source':str(source),'chromiumTarget':'63','sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'bytes':output.stat().st_size,'physicalSamsungTested':False}
(BUILD/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('Tizen 5 WGT:',output)
