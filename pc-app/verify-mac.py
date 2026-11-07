"""Inspect actual macOS artifacts without executing them on Windows."""
from pathlib import Path
import hashlib,json,os,shutil,struct,sys,zipfile
HERE=Path(__file__).resolve().parent
archive=Path(sys.argv[1]).resolve()
version=json.loads((HERE/'package.json').read_text())['version']
OUT=Path(os.environ.get('MORPH_PC_ARTIFACT_DIR',str(HERE/'dist')))
OUT.mkdir(parents=True,exist_ok=True)
expected={f'Morph-Launcher-Mac-{version}-universal.dmg',f'Morph-Launcher-Mac-{version}-universal.zip'}
with zipfile.ZipFile(archive) as bundle:
    assert set(bundle.namelist())==expected,bundle.namelist()
    for name in expected:
        with bundle.open(name) as source,(OUT/name).open('wb') as target:shutil.copyfileobj(source,target)
dmg=OUT/f'Morph-Launcher-Mac-{version}-universal.dmg'
with dmg.open('rb') as file:file.seek(-512,2);assert file.read(4)==b'koly','Expected a real Apple UDIF disk image'
with zipfile.ZipFile(OUT/f'Morph-Launcher-Mac-{version}-universal.zip') as bundle:
    with bundle.open('Morph Launcher.app/Contents/MacOS/Morph Launcher') as binary:
        magic,count=struct.unpack('>II',binary.read(8));assert magic==0xcafebabe and count==2
        cpus=[struct.unpack('>IIIII',binary.read(20))[0] for _ in range(count)]
        assert set(cpus)=={0x01000007,0x0100000c},cpus
    with bundle.open('Morph Launcher.app/Contents/Resources/app.asar') as source,(OUT/'mac-app.asar').open('wb') as target:shutil.copyfileobj(source,target)
print(json.dumps({'realDmg':True,'universalApp':True,'architectures':['Intel x64','Apple Silicon arm64'],'extracted':sorted(expected)}))
