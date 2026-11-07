"""Isolated Tizen 3 candidate from the tested Samsung release. No main-build mutation."""
from pathlib import Path
import sys,re,json,subprocess,zipfile,hashlib,shutil
ROOT=Path(__file__).resolve().parents[1];HERE=Path(__file__).resolve().parent;BUILD=HERE/'build';APP=BUILD/'app'
sys.path.insert(0,str(ROOT/'mobile-app'));sys.path.insert(0,str(ROOT/'legacy-build'))
from samsung_compat import fallback,lower_inset,variable_rules
from guard import load_matrix,assert_source_zip,es5_gate,assert_html_order,check_stale,write_validation,eight_digit_hex_to_rgba,inject_compat
from build_polyfills import build as build_polyfills
MATRIX=load_matrix();TARGET=MATRIX['targets']['tizen3'];VERSION=MATRIX['source']['sourceVersion']
assert APP.resolve()==(ROOT/'samsung-legacy/build/app').resolve()
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
# The shared build predates the Kidsy WebView aperture correction.
for n in ['kids.js','kids.css']:(APP/n).write_bytes((ROOT/'tv-project/app'/n).read_bytes())
esbuild=ROOT/'.tools/samsung-web/node_modules/@esbuild/win32-x64/esbuild.exe'
def run(args):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True)
 if p.returncode:raise RuntimeError((p.stdout+p.stderr)[-2500:])
# Regenerate the polyfill as real ES5 so header/runtime/caps/polyfill share one gate.
build_polyfills(ROOT/'legacy-build'/'polyfills-entry.js',APP/'legacy-polyfills.js')
for name in ['legacy-es5-header.js','legacy-runtime.js','legacy-caps.js','legacy-light.css']:(APP/name).write_bytes((HERE/name).read_bytes())
for name in ['legacy-es5-header.js','legacy-polyfills.js','legacy-runtime.js','legacy-caps.js']:es5_gate(APP/name)
rules=[]
def declarations(css):
 rules.extend(variable_rules(css))
for f in sorted(APP.rglob('*.css')):
 css=f.read_text(encoding='utf-8');declarations(css)
 # Original generated fallbacks are retained, along with pre-Grid flex layouts.
 css=lower_inset(css)+'\n'+fallback(css)
 css=re.sub(r'\binset-inline-start\s*:', 'left:',css);css=re.sub(r'\binset-inline-end\s*:', 'right:',css)
 css=eight_digit_hex_to_rgba(css)
 temp=BUILD/'style-source.css';temp.write_text(css,encoding='utf-8');run([esbuild,temp,'--target=chrome47','--outfile='+str(f)])
(APP/'legacy-variable-rules.js').write_text('window.MorphLegacyVariableRules='+json.dumps(rules,separators=(',',':'))+';',encoding='utf-8')
run(['node',HERE/'transpile.cjs'])
order=['legacy-es5-header.js','legacy-polyfills.js','legacy-variable-rules.js','legacy-runtime.js','legacy-caps.js']
for f in APP.rglob('*.html'):
 s=f.read_text(encoding='utf-8');prefix='../' if f.parent!=APP else ''
 # Compatibility must precede even the synchronous boot/theme/locale scripts.
 s,_=inject_compat(s,prefix,order)
 f.write_text(s,encoding='utf-8')
for f in APP.rglob('*.html'):assert_html_order(f)
cfg=APP/'config.xml';s=cfg.read_text(encoding='utf-8')
s=re.sub(r'required_version="[^"]+"','required_version="%s"'%TARGET['requiredVersion'],s)
s=s.replace('ClearMob01',TARGET['package'])
s=re.sub(r'(<widget[^>]*\s)version="[^"]+"',r'\1version="%s"'%VERSION,s)
s=re.sub(r'<name>[^<]*</name>','<name>%s</name>'%TARGET['displayName'],s,count=1)
cfg.write_text(s,encoding='utf-8')
post=cfg.read_text(encoding='utf-8')
assert ('required_version="%s"'%TARGET['requiredVersion']) in post and TARGET['appId'] in post and ('version="%s"'%VERSION) in post,post[:600]
# Keep license notices inside every candidate; no remote runtime dependencies.
licenses=APP/'legacy-licenses';licenses.mkdir(exist_ok=True)
for package,file in [('core-js','LICENSE'),('css-vars-ponyfill','LICENSE'),('whatwg-fetch','LICENSE')]:
 p=ROOT/'.tools/tizen3-build/node_modules'/package/file
 if p.exists():shutil.copy2(p,licenses/(package+'-LICENSE.txt'))
out=HERE/TARGET['artifact']
if out.exists():out.unlink()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for f in APP.rglob('*'):
  if f.is_file() and f.suffix not in ['.wgt','.p12','.jks','.key']:z.write(f,f.relative_to(APP).as_posix())
stale=check_stale(VERSION,SOURCE_VERSION)
report={'version':VERSION+'-tizen3','appId':TARGET['appId'],'target':TARGET['label'],'guardVersion':MATRIX['guardVersion'],'sourceVersion':SOURCE_VERSION,'sourceStale':stale,'physicalTVVerified':False,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'source':str(source),'javascriptTarget':'chrome47','es5Gate':['legacy-es5-header.js','legacy-polyfills.js','legacy-runtime.js','legacy-caps.js'],'htmlOrder':'legacy-first','defaults':'fixed artwork, no blur/glow/animation, modest focus scale','dependencies':{'core-js':'3.39.0','css-vars-ponyfill':'2.4.9','whatwg-fetch':'3.6.20'}}
write_validation(BUILD/'validation.json',report)
