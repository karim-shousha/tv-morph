"""Build only the isolated five-file Tizen 2 launcher. No shared-build inputs."""
from pathlib import Path
import zipfile,hashlib,json,argparse
HERE=Path(__file__).resolve().parent
parser=argparse.ArgumentParser()
parser.add_argument('--output',type=Path,default=HERE/'dist')
args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
names=['index.html','lite.css','lite.js','config.xml','icon.png','background.jpg','symbol.png','card-iptv.png','card-media.png','card-bridge.png','card-radio.png']
cfg=(HERE/'src/config.xml').read_text(encoding='utf-8')
assert 'MorphLt201.Home' in cfg and 'required_version="2.3"' in cfg
assert 'internet' not in cfg and 'origin="*"' not in cfg
js=(HERE/'src/lite.js').read_text(encoding='utf-8')
assert not any(x in js for x in ['=>','async ','await ','MutationObserver','XMLHttpRequest','setInterval','requestAnimationFrame'])
css=(HERE/'src/lite.css').read_text(encoding='utf-8')
assert not any(x in css for x in ['var(--','backdrop-filter','animation:','transition:','display:grid'])
out=args.output/'Morph-Launcher-Tizen2-Lite-Test-1.0.4.wgt'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name in names:
  entry=zipfile.ZipInfo(name,(2026,11,7,0,0,0));entry.compress_type=zipfile.ZIP_DEFLATED
  z.writestr(entry,(HERE/'src'/name).read_bytes())
receipt={'file':out.name,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'appId':'MorphLt201.Home','minimumTizen':'2.3','version':'1.0.4','files':names,'signed':False,'physicalTizen2Verified':False}
(args.output/'package.json').write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt))
