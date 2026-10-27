from pathlib import Path
import shutil,subprocess,json,hashlib,zipfile
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];HERE=Path(__file__).resolve().parent;BUILD=HERE/'build';APP=BUILD/'app';APP.mkdir(parents=True,exist_ok=True)
assert APP.resolve()==(ROOT/'webos-app/build/app').resolve()
if APP.exists():shutil.rmtree(APP)
APP.mkdir(parents=True)
baseline={}
for folder in ['tv-project/app','android-tv/iptv','android-tv/radio','mobile-app']:
 for p in (ROOT/folder).rglob('*'):
  if p.is_file() and not any(x in p.relative_to(ROOT).parts for x in ['build','tests']):baseline[p.relative_to(ROOT).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
(HERE/'baseline.json').write_text(json.dumps(baseline))
excluded=set(json.loads((ROOT/'theme-packs/excluded.json').read_text()));excluded.discard('prayer-pause-v1.webp')
for p in (ROOT/'tv-project/app').rglob('*'):
 if not p.is_file() or p.suffix not in ['.html','.js','.css','.svg','.webp','.png','.jpg','.mp3']:continue
 rel=p.relative_to(ROOT/'tv-project/app')
 if rel.parts[0]=='assets' and p.name in excluded:continue
 target=APP/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
shutil.copy2(ROOT/'mobile-app/assets/ui/locale.js',APP/'locale.js')
shutil.copy2(ROOT/'mobile-app/assets/ui/tvmorph.png',APP/'tvmorph.png')
with (APP/'style.css').open('a',encoding='utf-8') as css:css.write('\n'+(ROOT/'android-tv/home-shelves.css').read_text(encoding='utf-8'))
for name in ['platform.js','catalog.js']:
 shutil.copy2(HERE/name,APP/('lg-'+name))
shutil.copy2(HERE/'appinfo.json',APP/'appinfo.json')
shutil.copy2(ROOT/'.tools/webos-library/webOSTVjs-1.2.13/webOSTV.js',APP/'webOSTV.js')
shutil.copy2(ROOT/'.tools/webos-library/webOSTVjs-1.2.13/LICENSE-2.0.txt',APP/'webOSTV-LICENSE.txt')
for size,name in [(80,'icon.png'),(130,'large-icon.png')]:Image.open(ROOT/'distribution/site-assets/morph-mark.webp').convert('RGBA').resize((size,size)).save(APP/name)
html=(APP/'index.html').read_text(encoding='utf-8')
html=html.replace('<body data-theme=','<body data-fixed-layout="true" data-build-version="0.8.147-lg" data-theme=')
html=html.replace('<span class="brand-icon">C</span> clear<span class="thin">tv</span>','<img src="assets/tvmorph.webp" style="width:64px;height:54px;object-fit:contain;margin-right:12px" alt="">Morph <span class="thin">TV</span>')
html=html.replace('<script src="core.js">','<script src="webOSTV.js"></script><script src="lg-platform.js"></script><script src="locale.js"></script><script src="core.js">')
html=html.replace('<script src="app.js">','<script src="lg-catalog.js"></script><script src="app.js">').replace('</body>','<script src="lg-media-html.js"></script><script src="lg-media.js"></script></body>')

(APP/'index.html').write_text(html,encoding='utf-8')
p=APP/'app.js';s=p.read_text(encoding='utf-8').replace("if(typeof tizen!=='undefined'){tizen.application.getCurrentApplication().exit();}","if(window.MorphLG){MorphLG.exit();}")
s=s.replace('Samsung Apps','LG Apps');p.write_text(s,encoding='utf-8')
media=(ROOT/'mobile-app/samsung-media.js').read_text(encoding='utf-8');start=media.index(' function play(');end=media.index(' function action(',start);media=media[:start]+(HERE/'player.js').read_text(encoding='utf-8')+'\n'+media[end:]
start=media.index(' function radio(id,url)',media.index(' function action('));end=media.index(' window.SamsungMedia=',start);media=media[:start]+media[end:]
media=media.replace('SamsungMedia','MorphMedia').replace('morph.samsung.','morph.webos.')
media=media.replace("frame.src=kind+'/index.html'", "frame.srcdoc=window.MorphLGMediaHTML[kind].replace('<head>','<head><base href=\"'+new URL(kind+'/',location.href).href+'\">')")
media=media.replace('أضف اشتراكك من صفحة Play على الموبايل.','أضف اشتراكك من إعدادات IPTV على التلفزيون.').replace('Add your subscription from Play on your phone.','Add your subscription in IPTV Settings on this TV.')
media=media.replace('/* Samsung implements the same library/radio screens as Android, with AVPlay. */','/* LG: shared subscription library with HTML5 media playback. */')
media+='\n'+"window.addEventListener('load',function(){var old=ClearTV.Catalog.launch;ClearTV.Catalog.launch=function(app){return old.call(this,app);};});"
(APP/'lg-media.js').write_text(media,encoding='utf-8')
media_html={}
for folder in ['iptv','radio']:
 dest=APP/folder;shutil.copytree(ROOT/'android-tv'/folder,dest,dirs_exist_ok=True,ignore=shutil.ignore_patterns('*.cjs','*-preview.png'))
 shutil.copy2(ROOT/'mobile-app/assets/ui/locale.js',dest/'locale.js');shutil.copy2(ROOT/'tv-project/app/tv-compat.js',dest/'tv-compat.js')
 bridge=(ROOT/'mobile-app/samsung-media-bridge.js').read_text(encoding='utf-8').replace('SamsungMedia','MorphMedia').replace('SamsungStations','MorphStations').replace('morph.radio.favorites','morph.webos.radio.favorites').replace("location.pathname.indexOf('/radio/')>=0", "document.documentElement.getAttribute('data-media-kind')==='radio'")
 if folder=='radio':bridge='window.MorphStations='+ (ROOT/'android-tv/radio/stations.json').read_text(encoding='utf-8')+';\n'+bridge
 (dest/'lg-bridge.js').write_text(bridge,encoding='utf-8');p=dest/'index.html';s=p.read_text(encoding='utf-8').replace('<html ', '<html data-media-kind="'+folder+'" ').replace('content="../tv/"','content="../"').replace('<script src="locale.js">','<script src="tv-compat.js"></script><script src="../lg-platform.js"></script><script src="lg-bridge.js"></script><script src="locale.js">');p.write_text(s,encoding='utf-8');media_html[folder]=s
 # Radio uses the platform bridge rather than its standalone browser fallback.
 if folder=='radio':
  p=dest/'app.js';s=p.read_text(encoding='utf-8').replace('crossorigin="anonymous"','');p.write_text(s,encoding='utf-8')
(APP/'lg-media-html.js').write_text('window.MorphLGMediaHTML='+json.dumps(media_html)+';',encoding='utf-8')
esbuild=ROOT/'.tools/samsung-web/node_modules/@esbuild/win32-x64/esbuild.exe'
for p in APP.rglob('*.js'):
 if p.name in ['moment.min.js','moment-timezone.min.js','webOSTV.js']:continue
 temp=BUILD/'compile.js';subprocess.run([str(esbuild),str(p),'--target=chrome68','--outfile='+str(temp),'--log-level=error'],check=True);p.write_bytes(temp.read_bytes())
for p in APP.rglob('*.cjs'):p.unlink()
def run(args):
 result=subprocess.run([str(x) for x in args],capture_output=True,text=True)
 if result.returncode:raise RuntimeError(result.stdout+result.stderr)
 print(result.stdout.strip())
node=Path('C:/Program Files/nodejs/node.exe');cli=ROOT/'.tools/webos/node_modules/@webos-tools/cli/bin/ares-package.js'
run([node,cli,APP,'-o',HERE,'--no-minify'])
ipks=[HERE/'com.zainbot.morphtv.preview_0.8.147_all.ipk'];assert ipks[0].is_file()
result={'package':'com.zainbot.morphtv.preview','version':'0.8.147','physicalTVVerified':False,'target':'webOS 5.0+ initial candidate; older versions unverified','sha256':hashlib.sha256(ipks[0].read_bytes()).hexdigest(),'bytes':ipks[0].stat().st_size,'productionFilesUnchanged':all(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest for name,digest in baseline.items())}
(HERE/'validation.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
