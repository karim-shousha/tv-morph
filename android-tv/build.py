from pathlib import Path
import subprocess,shutil,zipfile,json
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'android-tv';BUILD=SOURCE/'build';BUILD.mkdir(exist_ok=True)
import sys;sys.path.insert(0,str(ROOT))
from iptv_shared import stage_frontend,stage_product_icon,sync_brand_assets
sync_brand_assets()
JAVA=ROOT/'.tools/tizen/sdk/data/jdk/bin';ANDROID=ROOT/'.tools/android/sdk/android-11'
def run(args):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True)
 if p.returncode:raise RuntimeError((p.stdout+p.stderr)[-4000:])
staging=BUILD/'assets'
assert staging.resolve()==(ROOT/'android-tv/build/assets').resolve()
if staging.exists():shutil.rmtree(staging)
assets=BUILD/'assets';tv=assets/'tv';classes=BUILD/'classes';dex=BUILD/'dex'
for d in [tv,classes,dex]:d.mkdir(parents=True,exist_ok=True)
for old in classes.rglob('*.class'):old.unlink()
excluded=set(json.loads((ROOT/'theme-packs/excluded.json').read_text()))
from iptv_shared import UI_IMAGE_MASTERS
excluded.update(UI_IMAGE_MASTERS)
excluded.discard('prayer-pause-v1.webp')
for name in excluded:
 stale=tv/'assets'/name
 if stale.exists():stale.unlink()
for f in (ROOT/'tv-project/app').rglob('*'):
 rel=f.relative_to(ROOT/'tv-project/app')
 if f.name in ['sports.js','sports.css','tvmorph.png'] or f.name.startswith('sports-hero-'):continue
 if rel.parts[0]=='assets' and f.name in excluded:continue
 if not f.is_file() or f.suffix not in ['.html','.js','.css','.png','.jpg','.webp','.svg','.mp3','.ttf','.woff','.woff2','.txt']:continue
 data=f.read_bytes()
 if rel.as_posix()=='index.html':
  data=data.decode('utf-8').replace('<body data-theme=', '<body data-fixed-layout="true" data-build-version="'+__import__('re').search(r'android:versionName="([^"]+)"',(SOURCE/'AndroidManifest.xml').read_text()).group(1).replace('-preview','')+'" data-theme=').replace('Clear TV','Morph TV').replace('CLEAR TV','MORPH TV').replace('Samsung Apps','App store').replace('HDMI &amp; Live TV','HDMI &amp; Inputs').replace('<span class="brand-icon">C</span> clear<span class="thin">tv</span>','<img src="tvmorph.webp" style="width:72px;height:54px;object-fit:contain;border-radius:9px;margin-right:12px" alt="">Morph <span class="thin">TV</span>').replace('<script defer src="app.js">','<script defer src="locale.js"></script><script defer src="android-adapter.js"></script><script defer src="app.js">').encode('utf-8')
 if rel.as_posix()=='app.js':data=data.decode('utf-8').replace("if(typeof tizen!=='undefined'){tizen.application.getCurrentApplication().exit();}","if(typeof TVNative!=='undefined'){TVNative.exit();}else if(typeof tizen!=='undefined'){tizen.application.getCurrentApplication().exit();}").replace('Samsung Apps','App store').replace('Samsung Home','Android TV Home').replace('byName(/^App store$/i)','byName(/Google Play|Play Store/i)').replace('Clear TV','Morph TV').encode('utf-8')
 out=tv/rel;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data)
from iptv_shared import stage_brand_assets
stage_brand_assets(tv)
stage_frontend(assets/'iptv')
shutil.copy2(ROOT/'android-tv/iptv/nav-system.css',assets/'iptv/nav-system.css')
shutil.copytree(SOURCE/'radio',assets/'radio',dirs_exist_ok=True,ignore=shutil.ignore_patterns('*.cjs','*-preview.png'))
for folder in [assets/'iptv',assets/'radio']:
 for stale in folder.glob('*'):
  if stale.is_file() and (stale.suffix=='.cjs' or stale.name.endswith('-preview.png')):stale.unlink()
for folder in [tv,assets/'iptv',assets/'radio']:shutil.copy2(ROOT/'mobile-app/assets/ui/locale.js',folder/'locale.js')
# IPTV also runs on Android 8 devices whose system WebView predates optional
# chaining. Match the conservative Samsung syntax target instead of copying
# modern source directly into the native activity's WebView.
iptv_assets=assets/'iptv'
shutil.copy2(ROOT/'tv-project/app/tv-compat.js',iptv_assets/'tv-compat.js')
iptv_index=iptv_assets/'index.html'
iptv_index.write_text(iptv_index.read_text(encoding='utf-8').replace('<script src="locale.js">','<script src="tv-compat.js"></script><script src="locale.js">'),encoding='utf-8')
for script in iptv_assets.glob('*.js'):
 compiled=BUILD/'iptv-compat.js'
 run([ROOT/'.tools/samsung-web/node_modules/@esbuild/win32-x64/esbuild.exe',script,'--target=chrome56','--outfile='+str(compiled),'--log-level=error'])
 script.write_bytes(compiled.read_bytes())
shutil.copy2(SOURCE/'android-adapter.js',tv/'android-adapter.js')
with (tv/'style.css').open('a',encoding='utf-8') as css:css.write((SOURCE/'home-shelves.css').read_text(encoding='utf-8'))

cleaner_assets=assets/'cleaner';cleaner_assets.mkdir(exist_ok=True)
for name in ['cleaner-native.html','cleaner.js','cleaner.css']:shutil.copy2(ROOT/'tv-project/app'/name,cleaner_assets/name)
shutil.copy2(ROOT/'tv-project/app/ui/control-system.js',cleaner_assets/'control-system.js')
(cleaner_assets/'assets').mkdir(exist_ok=True)
shutil.copy2(ROOT/'tv-project/app/assets/morph-header-symbol.webp',cleaner_assets/'assets/morph-header-symbol.webp')

from iptv_shared import stage_tv_fallback
stage_tv_fallback(tv)
from launcher_visual import stage_launcher_visual
stage_launcher_visual(tv,assets/'radio')
shutil.copytree(SOURCE/'res',BUILD/'res',dirs_exist_ok=True)
# Match CSS center/cover before Bridge's WebView has its first committed frame.
from iptv_shared import stage_bridge_entry_background
stage_bridge_entry_background(BUILD/'res')
stage_product_icon(BUILD/'res')
from media3_build import prepare
unsigned=BUILD/'unsigned.apk';aligned=BUILD/'aligned.apk';output=SOURCE/'TV-Morph-Android-TV-Preview.apk'
jar,playback_jars,resource_java=prepare(ROOT,BUILD,SOURCE/'AndroidManifest.xml',assets,BUILD/'res',unsigned)
run([Path('C:/Program Files/Android/Android Studio/jbr/bin/javac.exe'),'-encoding','UTF-8','-source','8','-target','8','-classpath',';'.join(str(x) for x in [jar]+playback_jars),'-d',classes,*SOURCE.glob('src/**/*.java'),ROOT/'mobile-app/src/local/cleartv/mobile/LanHttp.java',*resource_java])
compiled_jar=BUILD/'compiled.jar'
with zipfile.ZipFile(compiled_jar,'w',zipfile.ZIP_DEFLATED) as archive:
 for item in classes.rglob('*.class'):archive.write(item,item.relative_to(classes).as_posix())
for old in dex.glob('*.dex'):old.unlink()
run([Path('C:/Program Files/Android/Android Studio/jbr/bin/java.exe'),'-cp',ROOT/'.tools/android/r8-8.3.37.jar','com.android.tools.r8.D8','--lib',jar,'--min-api','26','--output',dex,compiled_jar,*playback_jars])
with zipfile.ZipFile(unsigned,'a',zipfile.ZIP_DEFLATED) as z:
 for item in dex.glob('*.dex'):z.write(item,item.name)
run([ANDROID/'zipalign.exe','-f','4',unsigned,aligned])
private=ROOT/'.tools/tizen/private';password=json.loads((private/'cleartv-mobile-signing.json').read_text())['password']
run([JAVA/'java.exe','-jar',ANDROID/'lib/apksigner.jar','sign','--ks',private/'cleartv-mobile.jks','--ks-key-alias','cleartv-mobile','--ks-pass','pass:'+password,'--key-pass','pass:'+password,'--out',output,aligned])
run([JAVA/'java.exe','-jar',ANDROID/'lib/apksigner.jar','verify',output])
print('Android TV APK built and verified:',output)
