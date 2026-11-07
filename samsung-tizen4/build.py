"""Tizen 4.0 package rebuilt from the current stable tv-app.zip. No modern-source mutation."""
from pathlib import Path
import sys,re,json,zipfile,hashlib,shutil
ROOT=Path(__file__).resolve().parents[1];HERE=Path(__file__).resolve().parent;BUILD=HERE/'build';APP=BUILD/'app'
if '--bridge-review' in sys.argv:
 BUILD=ROOT/'.tools/bridge-tizen4-review';APP=BUILD/'app'
sys.path.insert(0,str(ROOT/'legacy-build'))
from guard import load_matrix,assert_source_zip,es5_gate,check_stale,write_validation,eight_digit_hex_to_rgba,scan_forbidden_ast
MATRIX=load_matrix();TARGET=MATRIX['targets']['tizen4'];VERSION=MATRIX['source']['sourceVersion'];MATRIX['source']['sourceVersion']=VERSION
assert APP.resolve() in [(ROOT/'samsung-tizen4/build/app').resolve(),(ROOT/'.tools/bridge-tizen4-review/app').resolve()]
if APP.exists():shutil.rmtree(APP)
APP.mkdir(parents=True,exist_ok=True)
source=ROOT/MATRIX['source']['tvAppZip']
SOURCE_VERSION=assert_source_zip(source,MATRIX)
with zipfile.ZipFile(source) as z:
 for n in z.namelist():
  p=APP/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(n))
# Keep the installed icon current even when the UI comes from the release snapshot.
from PIL import Image
Image.open(ROOT/'tv-project/app/assets/morph-launcher-icon.png').convert('RGBA').resize((512,512)).save(APP/'app-icon.png')
# Keep phone-code pairing and receiver button styling current even when the
# stable launcher snapshot was staged before the Bridge fixes.
shutil.copytree(ROOT/'tv-project/app/bridge-receiver',APP/'bridge-receiver',dirs_exist_ok=True)
for name in ['bridge-reference.css','bridge-reference.js']:
 (APP/name).write_bytes((ROOT/'tv-project/visual-system'/name).read_bytes())
bridge=APP/'bridge-receiver/index.html'
html=bridge.read_text(encoding='utf-8').replace('src="bridge-connect-hero-v1.webp"','src="../reference-assets/bridge-devices-v2.webp"')
html=html.replace('</head>','<link rel="stylesheet" href="../bridge-reference.css"></head>')
html=html.replace('</body>','<script src="../reference-theme.js"></script><script src="../bridge-reference.js"></script></body>')
bridge.write_text(html,encoding='utf-8')
# Tizen4-only input caps (Lite-style, zero modern overhead). Must load first.
(APP/'tizen4-caps.js').write_bytes((HERE/'tizen4-caps.js').read_bytes())
caps_ok=True
try:
 es5_gate(APP/'tizen4-caps.js')
except RuntimeError as e:
 caps_ok=False;print('CAPS-ES5-NOTE: '+str(e)[:200])
for f in sorted(APP.rglob('*.css')):
 css=f.read_text(encoding='utf-8')
 css2=eight_digit_hex_to_rgba(css)
 if css2!=css:f.write_text(css2,encoding='utf-8')
# Chrome 56 cannot parse optional chaining / nullish coalescing. Reject the
# package if the modern intermediate ever leaks them (RC-01 routing failure).
# AST scan: strings/regexes/comments cannot trigger false positives.
bad={}
for f in sorted(APP.rglob('*.js')):
 res=scan_forbidden_ast(f)
 if res:
  bad[f.relative_to(APP).as_posix()]=res[:5]
if bad:
 raise RuntimeError('Tizen4 package rejected: forbidden syntax for Chromium 56: %s' % json.dumps(bad,indent=1)[:2000])
injected=0
for f in APP.rglob('*.html'):
 s=f.read_text(encoding='utf-8');prefix='../' if f.parent!=APP else ''
 tag='<script src="'+prefix+'tizen4-caps.js"></script>'
 if 'tizen4-caps.js' not in s:
  if '<head>' in s:s=s.replace('<head>','<head>'+tag,1)
  else:
   m=re.search(r'<html[^>]*>',s);s=(s[:m.end()]+tag+s[m.end():]) if m else (tag+s)
  f.write_text(s,encoding='utf-8');injected+=1
cfg=APP/'config.xml';s=cfg.read_text(encoding='utf-8')
if 'required_version="4.0"' not in s:
 s=re.sub(r'required_version="[^"]+"','required_version="4.0"',s);cfg.write_text(s,encoding='utf-8')
post=cfg.read_text(encoding='utf-8')
assert 'required_version="4.0"' in post and TARGET['appId'] in post and ('version="%s"'%VERSION) in post,post[:600]
out=(BUILD if '--bridge-review' in sys.argv else HERE)/TARGET['artifact']
if out.exists():out.unlink()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for f in APP.rglob('*'):
  if f.is_file() and f.suffix not in ['.wgt','.p12','.jks','.key']:z.write(f,f.relative_to(APP).as_posix())
report={'version':VERSION+'-tizen4','appId':TARGET['appId'],'target':TARGET['label'],'guardVersion':MATRIX['guardVersion'],'sourceVersion':SOURCE_VERSION,'physicalTVVerified':False,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'source':str(source),'javascriptTarget':'chrome56','forbiddenScan':'pass (no ?. / ?? in shipped JS)','capsInjectedInto':injected,'capsEs5':caps_ok,'defaults':'current feature set; single-package Tizen 4 routing; stale 0.8.170 roots preserved untouched'}
write_validation(BUILD/'validation.json',report)
