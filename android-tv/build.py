from pathlib import Path
import subprocess,shutil,zipfile,json
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'android-tv';BUILD=SOURCE/'build';BUILD.mkdir(exist_ok=True)
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
excluded.discard('prayer-pause-v1.webp')
for name in excluded:
 stale=tv/'assets'/name
 if stale.exists():stale.unlink()
for f in (ROOT/'tv-project/app').rglob('*'):
 rel=f.relative_to(ROOT/'tv-project/app')
 if rel.parts[0]=='assets' and f.name in excluded:continue
 if not f.is_file() or f.suffix not in ['.html','.js','.css','.png','.jpg','.webp','.svg','.mp3']:continue
 data=f.read_bytes()
 if rel.as_posix()=='index.html':
  data=data.decode('utf-8').replace('<body data-theme=', '<body data-fixed-layout="true" data-build-version="'+__import__('re').search(r'android:versionName="([^"]+)"',(SOURCE/'AndroidManifest.xml').read_text()).group(1).replace('-preview','')+'" data-theme=').replace('Clear TV','Morph TV').replace('CLEAR TV','MORPH TV').replace('Samsung Apps','App store').replace('HDMI &amp; Live TV','HDMI &amp; Inputs').replace('<span class="brand-icon">C</span> clear<span class="thin">tv</span>','<img src="tvmorph.png" style="width:72px;height:54px;object-fit:contain;border-radius:9px;margin-right:12px" alt="">Morph <span class="thin">TV</span>').replace('<script src="app.js">','<script src="locale.js"></script><script src="android-adapter.js"></script><script src="app.js">').encode('utf-8')
 if rel.as_posix()=='app.js':data=data.decode('utf-8').replace("if(typeof tizen!=='undefined'){tizen.application.getCurrentApplication().exit();}","if(typeof TVNative!=='undefined'){TVNative.exit();}else if(typeof tizen!=='undefined'){tizen.application.getCurrentApplication().exit();}").replace('Samsung Apps','App store').replace('Samsung Home','Android TV Home').replace('byName(/^App store$/i)','byName(/Google Play|Play Store/i)').replace('Clear TV','Morph TV').encode('utf-8')
 out=tv/rel;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data)
shutil.copytree(SOURCE/'iptv',assets/'iptv',dirs_exist_ok=True,ignore=shutil.ignore_patterns('*.cjs','*-preview.png'))
shutil.copytree(SOURCE/'radio',assets/'radio',dirs_exist_ok=True,ignore=shutil.ignore_patterns('*.cjs','*-preview.png'))
for folder in [assets/'iptv',assets/'radio']:
 for stale in folder.glob('*'):
  if stale.is_file() and (stale.suffix=='.cjs' or stale.name.endswith('-preview.png')):stale.unlink()
for folder in [tv,assets/'iptv',assets/'radio']:shutil.copy2(ROOT/'mobile-app/assets/ui/locale.js',folder/'locale.js')
shutil.copy2(SOURCE/'android-adapter.js',tv/'android-adapter.js')
with (tv/'style.css').open('a',encoding='utf-8') as css:css.write((SOURCE/'home-shelves.css').read_text(encoding='utf-8'))
shutil.copy2(ROOT/'mobile-app/assets/ui/tvmorph.png',tv/'tvmorph.png')
shutil.copytree(SOURCE/'res',BUILD/'res',dirs_exist_ok=True)
res=BUILD/'res/drawable-nodpi';res.mkdir(parents=True,exist_ok=True);(res/'tvmorph.jpg').unlink(missing_ok=True);(res/'tvmorph.png').unlink(missing_ok=True)
run([JAVA/'javac.exe','-encoding','UTF-8','-source','8','-target','8','-classpath',ANDROID/'android.jar','-d',classes,*SOURCE.glob('src/**/*.java'),ROOT/'mobile-app/src/local/cleartv/mobile/LanHttp.java'])
run([JAVA/'java.exe','-cp',ANDROID/'lib/d8.jar','com.android.tools.r8.D8','--lib',ANDROID/'android.jar','--min-api','26','--output',dex,*classes.rglob('*.class')])
unsigned=BUILD/'unsigned.apk';aligned=BUILD/'aligned.apk';output=SOURCE/'TV-Morph-Android-TV-Preview.apk'
run([ANDROID/'aapt.exe','package','-f','-M',SOURCE/'AndroidManifest.xml','-I',ANDROID/'android.jar','-A',assets,'-S',BUILD/'res','-F',unsigned])
with zipfile.ZipFile(unsigned,'a',zipfile.ZIP_DEFLATED) as z:z.write(dex/'classes.dex','classes.dex')
run([ANDROID/'zipalign.exe','-f','4',unsigned,aligned])
private=ROOT/'.tools/tizen/private';password=json.loads((private/'cleartv-mobile-signing.json').read_text())['password']
run([JAVA/'java.exe','-jar',ANDROID/'lib/apksigner.jar','sign','--ks',private/'cleartv-mobile.jks','--ks-key-alias','cleartv-mobile','--ks-pass','pass:'+password,'--key-pass','pass:'+password,'--out',output,aligned])
run([JAVA/'java.exe','-jar',ANDROID/'lib/apksigner.jar','verify',output])
print('Android TV APK built and verified:',output)
