from pathlib import Path
import json,secrets,shutil,subprocess,zipfile,sys
from samsung_compat import fallback,lower_inset
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'mobile-app';BUILD=SOURCE/'build';PRIVATE=ROOT/'.tools/tizen/private'
ANDROID=ROOT/'.tools/android/sdk/android-11';JAVA=ROOT/'.tools/tizen/sdk/data/jdk/bin'
def run(args):
 r=subprocess.run([str(x) for x in args],capture_output=True,text=True)
 if r.returncode:raise RuntimeError((r.stdout+r.stderr)[-5000:])
BUILD.mkdir(exist_ok=True);classes=BUILD/'classes';dex=BUILD/'dex';assets=BUILD/'assets'
assert assets.resolve()==(ROOT/'mobile-app/build/assets').resolve()
if assets.exists():shutil.rmtree(assets)
for d in [classes,dex,assets]:d.mkdir(exist_ok=True)
for old in classes.rglob('*.class'):old.unlink()
if '--phone-only' not in sys.argv:run(['python',ROOT/'android-tv/build.py'])
tv_package=ROOT/'android-tv/TV-Morph-Android-TV-Preview.apk'
shutil.copytree(SOURCE/'assets',assets,dirs_exist_ok=True,ignore=shutil.ignore_patterns('*.jpg','tvmorph.png'))
lg_ipk=ROOT/'webos-app/com.zainbot.morphtv.preview_0.8.153_all.ipk'
assert __import__('hashlib').sha256(lg_ipk.read_bytes()).hexdigest()==json.loads((ROOT/'webos-app/validation.json').read_text())['sha256']
shutil.copy2(lg_ipk,assets/'lg-preview.ipk')
# The installer must authenticate the exact embedded package, never a prior release.
lg_meta=json.loads((ROOT/'webos-app/validation.json').read_text())
lg_protocol=SOURCE/'src/local/cleartv/mobile/LgInstallProtocol.java'
lg_text=lg_protocol.read_text(encoding='utf-8')
lg_text=__import__('re').sub(r'VERSION="[^"]+",SHA="[0-9a-f]{64}"', 'VERSION="'+lg_meta['version']+'",SHA="'+lg_meta['sha256']+'"',lg_text,count=1)
assert 'VERSION="'+lg_meta['version']+'",SHA="'+lg_meta['sha256']+'"' in lg_text
lg_protocol.write_text(lg_text,encoding='utf-8')

dependency=SOURCE/'libs/jsch-0.2.26.jar'
assert __import__('hashlib').sha256(dependency.read_bytes()).hexdigest()=='5ad82d1a9534404d0a519c525e796c8ef69f4fe47b19bc4d16bbd296686ac9f2'
with zipfile.ZipFile(dependency) as library:
 for name in ['LICENSE.txt','LICENSE.JZlib.txt','LICENSE.jBCrypt.txt']:(assets/('jsch-'+name)).write_bytes(library.read('META-INF/'+name))
 android_dependency=BUILD/'jsch-android.jar'
 with zipfile.ZipFile(android_dependency,'w',zipfile.ZIP_DEFLATED) as android_jar:
  for name in library.namelist():
   if name.endswith('.class') and not name.startswith('META-INF/') and name!='module-info.class':android_jar.writestr(name,library.read(name))
# Stamp update checks from the same manifest used by the APK; never a handwritten version.
phone_version=__import__('re').search(r'android:versionName="([^"]+)"',(SOURCE/'AndroidManifest.xml').read_text()).group(1).split('-')[0]
receiver_version=__import__('re').search(r'android:versionName="([^"]+)"',(ROOT/'android-tv/AndroidManifest.xml').read_text()).group(1).split('-')[0]
phone_index=assets/'ui/index.html'
phone_html=phone_index.read_text(encoding='utf-8')
phone_html=__import__('re').sub(r'<body(?: data-build-version="[^"]*")?', '<body data-build-version="'+phone_version+'"',phone_html,count=1)
phone_html=__import__('re').sub(r'Morph TV · Preview \d+\.\d+\.\d+', 'Morph TV · Preview '+phone_version,phone_html)
phone_index.write_text(phone_html,encoding='utf-8')
shutil.copy2(SOURCE/'phone-updates.js',assets/'ui/update-alert.js')

shutil.copy2(tv_package,assets/'android-tv.apk')
excluded=set(json.loads((ROOT/'theme-packs/excluded.json').read_text()))
excluded.discard('prayer-pause-v1.webp')
# Core phone branding is not a downloadable theme asset.
excluded.discard('tvmorph.webp')
for name in excluded:
 stale=assets/'ui'/name
 if stale.exists():stale.unlink()
for f in (ROOT/'tv-project/app/assets').iterdir():
 if f.name not in excluded and f.suffix in ['.png','.svg','.jpg','.webp']:shutil.copy2(f,assets/'ui'/f.name)
for name in ['welcome-support.js','welcome-support.css','theme-packs-manifest.js','theme-packs.js','theme-preview.js','theme-locale.js','theme-preview.css','contact.js','plus.js','plus.css','plus-themes.css']:shutil.copy2(ROOT/'tv-project/app'/name,assets/'ui'/name)
for source,name in [('vd_tizen_dev_author_ca.cer','ca-author.cer'),('vd_tizen_dev_public2.crt','ca-distributor.crt')]:shutil.copy2(ROOT/'.tools/tv-signing/assets/samsung-tv-ca'/source,assets/name)
with zipfile.ZipFile(assets/'tv-app.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in (ROOT/'tv-project/app').rglob('*'):
  rel=f.relative_to(ROOT/'tv-project/app').as_posix()
  if rel.startswith('assets/') and f.name in excluded:continue
  if not f.is_file() or not (f.suffix in ['.js','.css','.html','.xml','.png','.jpg','.webp','.svg','.mp3']) or rel in ['author-signature.xml','signature1.xml']:continue
  data=f.read_bytes()
  if rel=='config.xml':data=data.decode('utf-8').replace('ClearTV001','ClearMob01').replace('<name>Clear TV</name>','<name>Morph TV</name>').replace('version="0.3.8"','version="'+receiver_version+'"').replace('</widget>','<access origin="*" subdomains="true"/></widget>').replace('<name>Morph TV</name>','<name>Morph TV</name><icon src="tvmorph.png"/>').encode('utf-8')
  if rel=='index.html':data=data.decode('utf-8').replace('Clear TV','Morph TV').replace('CLEAR TV','MORPH TV').replace('<body data-theme=', '<body data-fixed-layout="true" data-build-version="'+receiver_version+'" data-theme=').replace('<span class="brand-icon">C</span> clear<span class="thin">tv</span>', '<img src="tvmorph.png" style="width:72px;height:54px;object-fit:contain;margin-right:12px" alt="">Morph <span class="thin">TV</span>').replace('<script src="core.js">','<script src="locale.js"></script><script src="initial-config.js"></script><script src="core.js">').replace('<script src="app.js">','<script src="samsung-catalog.js"></script><script src="app.js">').replace('<script src="about.js"></script>','<script src="about.js"></script><script src="$WEBAPIS/webapis/webapis.js"></script><script src="samsung-media.js"></script><script src="samsung-adapter.js"></script><script src="samsung-locks.js"></script>').encode('utf-8')
  if rel=='app.js':data=data.decode('utf-8').replace('Clear TV','Morph TV').replace('CLEAR TV','MORPH TV').encode('utf-8')
  if rel=='style.css':data+=b'\n'+(ROOT/'android-tv/home-shelves.css').read_bytes()
  if rel=='catalog.js':data=data.decode('utf-8').replace("a.id===own||", "a.id===own||a.id==='ClearMob01.Home'||").encode('utf-8')
  z.writestr(rel,data)
 z.writestr('initial-config.js','window.ClearTVInitial={};')
 z.writestr('locale.js',(SOURCE/'assets/ui/locale.js').read_bytes())
 z.writestr('tvmorph.png',(SOURCE/'assets/ui/tvmorph.png').read_bytes())
 z.writestr('samsung-locks.js',(SOURCE/'samsung-locks.js').read_bytes())
 z.writestr('samsung-adapter.js',(SOURCE/'samsung-adapter.js').read_bytes())
 z.writestr('samsung-media.js',(SOURCE/'samsung-media.js').read_bytes())
 z.writestr('samsung-catalog.js',(SOURCE/'samsung-catalog.js').read_bytes())
 # Reuse the identical player-library and radio UI; only platform bridges differ.
 for media in ['iptv','radio']:
  for f in (ROOT/'android-tv'/media).glob('*'):
   if not f.is_file() or f.suffix not in ['.html','.js','.css','.json','.svg','.webp']:continue
   data=f.read_bytes()
   if f.name=='index.html':
    data=data.decode('utf-8').replace('name="tvm-media-root" content="../tv/"','name="tvm-media-root" content="../"').replace('<script src="locale.js">','<script src="tv-compat.js"></script><script src="locale.js">').replace('<script src="app.js">','<script src="samsung-bridge.js"></script><script src="app.js">').encode('utf-8')
   if f.suffix=='.js':
    output=BUILD/(media+'-samsung.js')
    run([ROOT/'.tools/samsung-web/node_modules/@esbuild/win32-x64/esbuild.exe',f,'--target=chrome56','--outfile='+str(output)])
    data=output.read_bytes()
   z.writestr(media+'/'+f.name,data)
  z.writestr(media+'/tv-compat.js',(ROOT/'tv-project/app/tv-compat.js').read_bytes())
  z.writestr(media+'/locale.js',(SOURCE/'assets/ui/locale.js').read_bytes())
  bridge=(SOURCE/'samsung-media-bridge.js').read_bytes()
  if media=='radio':bridge=b'window.SamsungStations='+ (ROOT/'android-tv/radio/stations.json').read_bytes()+b';\n'+bridge
  z.writestr(media+'/samsung-bridge.js',bridge)

# Every Samsung JavaScript file, including the locale bundle and bridges,
# must go through the same compatibility transform. Never append raw scripts
# after this pass: modern syntax in one dependency can abort platform setup.
samsung_zip=assets/'tv-app.zip'
with zipfile.ZipFile(samsung_zip) as archive:
 samsung_files={name:archive.read(name) for name in archive.namelist()}
for index,name in enumerate(samsung_files):
 if not name.endswith('.js'):continue
 source_js=BUILD/('samsung-source-'+str(index)+'.js')
 output_js=BUILD/('samsung-target-'+str(index)+'.js')
 source_js.write_bytes(samsung_files[name])
 run([ROOT/'.tools/samsung-web/node_modules/@esbuild/win32-x64/esbuild.exe',source_js,'--target=chrome56','--outfile='+str(output_js)])
 samsung_files[name]=output_js.read_bytes()
for name in list(samsung_files):
 if name.endswith('.css'):
  css=samsung_files[name].decode('utf-8')
  samsung_files[name]=(lower_inset(css)+'\n/* Tizen 4 layout fallbacks */\n'+fallback(css)+'\nhtml.morph-legacy-layout *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}').encode('utf-8')
with zipfile.ZipFile(samsung_zip,'w',zipfile.ZIP_DEFLATED) as archive:
 for name,data in samsung_files.items():archive.writestr(name,data)

# Compile the existing TV media library/player for local phone playback too.
shutil.copy2(SOURCE/'assets/ui/tvmorph.webp',assets/'ui/tvmorph.webp')
assert (assets/'ui/tvmorph.webp').read_bytes()==(SOURCE/'assets/ui/tvmorph.webp').read_bytes(), 'Missing phone header logo'
phone_media=assets/'iptv';phone_media.mkdir(exist_ok=True)
for source in (ROOT/'android-tv/iptv').iterdir():
 if source.is_file() and source.suffix in ['.html','.js','.css','.svg','.json']:
  data=source.read_bytes()
  if source.name=='index.html':data=data.decode('utf-8').replace('content="width=1920"','content="width=device-width,initial-scale=1"').replace('</head>','<link rel="stylesheet" href="phone-layout.css"></head>').replace('</body>','<script src="phone-navigation.js"></script></body>').encode('utf-8')
  (phone_media/source.name).write_bytes(data)
shutil.copy2(SOURCE/'assets/ui/locale.js',phone_media/'locale.js')
shutil.copy2(SOURCE/'phone-iptv.css',phone_media/'phone-layout.css')
shutil.copy2(SOURCE/'phone-iptv.js',phone_media/'phone-navigation.js')
jar=ANDROID/'android.jar'
run([JAVA/'javac.exe','-encoding','UTF-8','-source','8','-target','8','-classpath',str(jar)+';'+str(dependency),'-d',classes,*SOURCE.glob('src/**/*.java'),*(ROOT/'android-tv').glob('src/**/*.java')])
run([Path('C:/Program Files/Android/Android Studio/jbr/bin/java.exe'),'-cp',ROOT/'.tools/android/r8-8.3.37.jar','com.android.tools.r8.D8','--lib',jar,'--min-api','26','--output',dex,*classes.glob('**/*.class'),android_dependency])
unsigned=BUILD/'unsigned.apk';aligned=BUILD/'aligned.apk'
share='--share' in sys.argv
manifest=SOURCE/'AndroidManifest.xml'
if share:
 manifest=BUILD/'AndroidManifest.xml'
 manifest.write_text((SOURCE/'AndroidManifest.xml').read_text().replace('android:debuggable="true"','android:debuggable="false"').replace(phone_version+'-preview',phone_version+'-tester'),encoding='utf-8')
run([ANDROID/'aapt.exe','package','-f','-M',manifest,'-I',jar,'-A',assets,'-S',SOURCE/'res','-F',unsigned,'-0','zip'])
with zipfile.ZipFile(unsigned,'a',zipfile.ZIP_DEFLATED) as z:z.write(dex/'classes.dex','classes.dex')
run([ANDROID/'zipalign.exe','-f','4',unsigned,aligned])
key=PRIVATE/'cleartv-mobile.jks';secret=PRIVATE/'cleartv-mobile-signing.json'
if not secret.exists():secret.write_text(json.dumps({'password':secrets.token_urlsafe(24)}))
password=json.loads(secret.read_text())['password']
if not key.exists():run([JAVA/'keytool.exe','-genkeypair','-keystore',key,'-alias','cleartv-mobile','-storepass',password,'-keypass',password,'-keyalg','RSA','-keysize','2048','-validity','3650','-dname','CN=Morph TV Studio'])
output=SOURCE/('TV-Morph-Tester.apk' if share else 'TV-Morph-Preview.apk')
run([JAVA/'java.exe','-jar',ANDROID/'lib/apksigner.jar','sign','--ks',key,'--ks-key-alias','cleartv-mobile','--ks-pass','pass:'+password,'--key-pass','pass:'+password,'--out',output,aligned])
run([JAVA/'java.exe','-jar',ANDROID/'lib/apksigner.jar','verify',output])
with zipfile.ZipFile(output) as z:
 assert not any(name.endswith(('.p12','.key','.pwd','.jks')) for name in z.namelist())
print('APK built and signature verified:',output,'bytes',output.stat().st_size)
