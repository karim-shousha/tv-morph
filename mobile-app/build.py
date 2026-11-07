from pathlib import Path
import json,secrets,shutil,subprocess,zipfile,sys
from samsung_compat import fallback,lower_inset,lower_focus_mask
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'mobile-app';BUILD=SOURCE/'build';PRIVATE=ROOT/'.tools/tizen/private'
from phone_design_system import sync as sync_phone_design_system
sync_phone_design_system()
tv_stage_only='--tv-web-only' in sys.argv
samsung_js_target='chrome63' if '--tizen5' in sys.argv else 'chrome56'
if tv_stage_only:BUILD=ROOT/'.tools/final-tv-stage'
if tv_stage_only and '--tizen5' in sys.argv:BUILD=ROOT/'.tools/tizen5-review-stage'
if '--native-stage' not in sys.argv and not tv_stage_only:
 subprocess.run([sys.executable,str(SOURCE/'build_integrated.py'),*sys.argv[1:]],check=True)
 raise SystemExit(0)
sys.path.insert(0,str(ROOT))
from iptv_shared import stage_frontend,source_files,source_receipt,stage_adhan_assets,stage_brand_assets,sync_brand_assets
sync_brand_assets()
ANDROID=ROOT/'.tools/android/sdk/android-11';JAVA=ROOT/'.tools/tizen/sdk/data/jdk/bin'
def run(args):
 r=subprocess.run([str(x) for x in args],capture_output=True,text=True)
 if r.returncode:raise RuntimeError((r.stdout+r.stderr)[-5000:])
BUILD.mkdir(exist_ok=True);classes=BUILD/'classes';dex=BUILD/'dex';assets=BUILD/'assets'
assert assets.resolve() in [(ROOT/name).resolve() for name in ['.tools/final-tv-stage/assets','.tools/tizen5-review-stage/assets','mobile-app/build/assets']]
if assets.exists():shutil.rmtree(assets)
for d in [classes,dex,assets]:d.mkdir(exist_ok=True)
for old in classes.rglob('*.class'):old.unlink()
if '--phone-only' not in sys.argv and not tv_stage_only:run(['python',ROOT/'android-tv/build.py'])
tv_package=ROOT/'android-tv/TV-Morph-Android-TV-Preview.apk'
if '--receiver-apk' in sys.argv:
 tv_package=Path(sys.argv[sys.argv.index('--receiver-apk')+1]).resolve()
# Read identity from the exact payload, not a manifest another build may advance.
shutil.copy2(tv_package,assets/'android-tv.apk')
receiver_badging=subprocess.check_output([str(ANDROID/'aapt.exe'),'dump','badging',str(assets/'android-tv.apk')],text=True,encoding='utf-8')
assert "package: name='local.tvmorph.tv'" in receiver_badging,'Expected the full Morph Launcher receiver'
receiver_version=__import__('re').search(r"versionName='([^']+)'",receiver_badging).group(1).split('-')[0]
shutil.copytree(SOURCE/'assets',assets,dirs_exist_ok=True,ignore=shutil.ignore_patterns('*.jpg','tvmorph.png','morph-logo-hq.png'))

cleaner_assets=assets/'cleaner';cleaner_assets.mkdir(exist_ok=True)
for name in ['cleaner-native.html','cleaner.js','cleaner.css']:shutil.copy2(ROOT/'tv-project/app'/name,cleaner_assets/name)
shutil.copy2(ROOT/'tv-project/app/ui/control-system.js',cleaner_assets/'control-system.js')
(cleaner_assets/'assets').mkdir(exist_ok=True)
shutil.copy2(ROOT/'tv-project/app/assets/morph-header-symbol.webp',cleaner_assets/'assets/morph-header-symbol.webp')
shutil.copy2(SOURCE/'cleaner-mobile.css',cleaner_assets/'cleaner-mobile.css')
shutil.copy2(SOURCE/'cleaner-mobile.js',cleaner_assets/'cleaner-mobile.js')
p=cleaner_assets/'cleaner-native.html';p.write_text(p.read_text(encoding='utf-8').replace('</head>','<link rel="stylesheet" href="../ui/phone-tokens.css"><link rel="stylesheet" href="cleaner-mobile.css"></head>').replace('</body>','<script src="cleaner-mobile.js"></script></body>'),encoding='utf-8')

# NetworkActivity uses the shared local-network browser on phone as well as TV.
network_assets=assets/'tv';network_assets.mkdir(exist_ok=True)
(network_assets/'assets').mkdir(exist_ok=True)
shutil.copy2(ROOT/'tv-project/app/assets/premium-reference-background.svg',network_assets/'assets/premium-reference-background.svg')
(network_assets/'reference-assets').mkdir(exist_ok=True)
shutil.copy2(ROOT/'tv-project/visual-system/assets/bridge-background-v2.webp',network_assets/'reference-assets/bridge-background-v2.webp')
shared=ROOT/'tv-project/app'
for filename in ['core.js','club-themes.js','locale.js','focus.js','playback-rate.js','usb-media.js','usb.css']:
 shutil.copy2((SOURCE/'assets/ui/locale.js') if filename=='locale.js' else shared/filename,network_assets/filename)
shutil.copytree(shared/'network',network_assets/'network',dirs_exist_ok=True)
# Phone-only presentation; shared TV network discovery and browser are unchanged.
for name in ['phone-network.css','phone-network.js']:
 shutil.copy2(SOURCE/name,network_assets/'network'/name)
network_document=network_assets/'network/index.html'
network_document.write_text(network_document.read_text(encoding='utf-8').replace('</head>','<link rel="stylesheet" href="phone-network.css"><script src="phone-network.js"></script></head>'),encoding='utf-8')

# The shared TV network page retains phone branding when embedded on the phone.
phone_network=network_assets/'network/premium-network.js'
phone_network.write_text(phone_network.read_text(encoding='utf-8').replace('morph-launcher-wordmark.webp','morph-wordmark.webp').replace('Morph Launcher','Morph TV'),encoding='utf-8')
shutil.copy2(shared/'club-themes.js',network_assets/'club-themes.js')
(network_assets/'ui').mkdir(exist_ok=True)
for filename in ['tokens.css','theme-adapter.js','control-system.js']:
 shutil.copy2(shared/'ui'/filename,network_assets/'ui'/filename)
lg_version=json.loads((ROOT/'webos-app/validation.json').read_text())['version'];lg_ipk=ROOT/('webos-app/com.zainbot.morphtv.preview_'+lg_version+'_all.ipk')
assert __import__('hashlib').sha256(lg_ipk.read_bytes()).hexdigest()==json.loads((ROOT/'webos-app/validation.json').read_text())['sha256']
shutil.copy2(lg_ipk,assets/'lg-preview.ipk')
# The installer must authenticate the exact embedded package, never a prior release.
lg_meta=json.loads((ROOT/'webos-app/validation.json').read_text())
lg_protocol=SOURCE/'src/local/cleartv/mobile/LgInstallProtocol.java'
lg_text=lg_protocol.read_text(encoding='utf-8')
lg_text=__import__('re').sub(r'VERSION="[^"]+",SHA="[0-9a-f]{64}"', 'VERSION="'+lg_meta['version']+'",SHA="'+lg_meta['sha256']+'"',lg_text,count=1)
assert 'VERSION="'+lg_meta['version']+'",SHA="'+lg_meta['sha256']+'"' in lg_text
if not tv_stage_only:lg_protocol.write_text(lg_text,encoding='utf-8')
if not tv_stage_only:
 from installer_payloads import stage as stage_install_products
 stage_install_products(ROOT,assets,receiver_version)


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
phone_index=assets/'ui/index.html'
phone_html=phone_index.read_text(encoding='utf-8')
phone_html=__import__('re').sub(r'<body(?: data-build-version="[^"]*")?', '<body data-build-version="'+phone_version+'"',phone_html,count=1)
phone_html=phone_html.replace('<body data-build-version="'+phone_version+'"','<body data-tv-version="'+receiver_version+'" data-build-version="'+phone_version+'"')
phone_html=__import__('re').sub(r'Morph TV · Preview \d+\.\d+\.\d+', 'Morph TV · Preview '+phone_version,phone_html)
update_channel='test' if '--test-channel' in sys.argv else 'public'
phone_html=phone_html.replace('<body ', '<body data-update-channel="'+update_channel+'" ',1)
(assets/'phone-update-channel.json').write_text(json.dumps({'channel':update_channel}))
phone_index.write_text(phone_html,encoding='utf-8')
shutil.copy2(SOURCE/'phone-updates.js',assets/'ui/update-alert.js')

excluded=set(json.loads((ROOT/'theme-packs/excluded.json').read_text()))
from iptv_shared import UI_IMAGE_MASTERS
excluded.update(UI_IMAGE_MASTERS)
excluded.discard('prayer-pause-v1.webp')
# Core phone branding is not a downloadable theme asset.
excluded.discard('tvmorph.webp')
for name in excluded:
 stale=assets/'ui'/name
 if stale.exists():stale.unlink()
for f in (ROOT/'tv-project/app/assets').iterdir():
 if f.name not in excluded and f.suffix in ['.png','.svg','.jpg','.webp']:shutil.copy2(f,assets/'ui'/f.name)
shutil.copy2(ROOT/'tv-project/visual-system/assets/bridge-background-v2.webp',assets/'ui/morph-loading-background.webp')
for name in ['welcome-support.css','theme-packs-manifest.js','theme-packs.js','theme-preview.js','theme-locale.js','theme-preview.css','contact.js','plus.js','plus.css','plus-themes.css']:shutil.copy2(ROOT/'tv-project/app'/name,assets/'ui'/name)
for source,name in [('vd_tizen_dev_author_ca.cer','ca-author.cer'),('vd_tizen_dev_public2.crt','ca-distributor.crt'),('vd_tizen_dev_partner2.crt','ca-distributor-partner.crt')]:shutil.copy2(ROOT/'.tools/tv-signing/assets/samsung-tv-ca'/source,assets/name)
with zipfile.ZipFile(assets/'tv-app.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in (ROOT/'tv-project/app').rglob('*'):
  rel=f.relative_to(ROOT/'tv-project/app').as_posix()
  if rel in ['tvmorph.png','tvmorph.webp'] or f.name in ['sports.js','sports.css'] or f.name.startswith('sports-hero-'):continue
  if rel.startswith('assets/') and f.name in excluded:continue
  if not f.is_file() or not (f.suffix in ['.js','.css','.html','.xml','.png','.jpg','.webp','.svg','.mp3','.ttf','.woff','.woff2','.txt']) or rel in ['author-signature.xml','signature1.xml']:continue
  data=f.read_bytes()
  if rel=='config.xml':data=data.decode('utf-8').replace('ClearTV001','ClearMob01').replace('<name>Clear TV</name>','<name>Morph Launcher</name>').replace('version="0.3.8"','version="'+receiver_version+'"').replace('</widget>','<access origin="*" subdomains="true"/></widget>').replace('<name>Morph Launcher</name>','<name>Morph Launcher</name><icon src="app-icon.png"/>').encode('utf-8')
  if rel=='config.xml':data=__import__('re').sub(rb'(<widget\b[^>]*\bversion=")[^"]+',lambda match:match.group(1)+receiver_version.encode('utf-8'),data,count=1)
  if rel=='index.html':data=data.decode('utf-8').replace('Clear TV','Morph TV').replace('CLEAR TV','MORPH TV').replace('<body data-theme=', '<body data-fixed-layout="true" data-build-version="'+receiver_version+'" data-theme=').replace('<span class="brand-icon">C</span> clear<span class="thin">tv</span>', '<img src="tvmorph.webp" style="width:72px;height:54px;object-fit:contain;margin-right:12px" alt="">Morph <span class="thin">TV</span>').replace('<script defer src="core.js">','<script defer src="locale.js"></script><script defer src="initial-config.js"></script><script defer src="core.js">').replace('<script defer src="app.js">','<script defer src="samsung-catalog.js"></script><script defer src="app.js">').replace('<script defer src="about.js"></script>','<script defer src="about.js"></script><script defer src="$WEBAPIS/webapis/webapis.js"></script><script defer src="samsung-media.js"></script><script defer src="samsung-adapter.js"></script><script defer src="samsung-locks.js"></script>').encode('utf-8')
  if rel=='app.js':data=data.decode('utf-8').replace('Clear TV','Morph TV').replace('CLEAR TV','MORPH TV').encode('utf-8')
  if rel=='style.css':data+=b'\n'+(ROOT/'android-tv/home-shelves.css').read_bytes()
  if rel=='catalog.js':data=data.decode('utf-8').replace("a.id===own||", "a.id===own||a.id==='ClearMob01.Home'||").encode('utf-8')
  z.writestr(rel,data)
 z.writestr('initial-config.js','window.ClearTVInitial={};')
 z.writestr('locale.js',(SOURCE/'assets/ui/locale.js').read_bytes())
 from iptv_shared import tv_fallback_bytes
 z.writestr('tvmorph.webp',tv_fallback_bytes())
 z.writestr('assets/morph-launcher-wordmark.png',(ROOT/'tv-project/app/assets/morph-launcher-wordmark.png').read_bytes())
 z.writestr('app-icon.png',(SOURCE/'app-icon.png').read_bytes())
 z.writestr('samsung-locks.js',(SOURCE/'samsung-locks.js').read_bytes())
 z.writestr('samsung-adapter.js',(SOURCE/'samsung-adapter.js').read_bytes())
 z.writestr('samsung-media.js',(SOURCE/'samsung-media.js').read_bytes())
 z.writestr('samsung-catalog.js',(SOURCE/'samsung-catalog.js').read_bytes())
 # Reuse the identical player-library and radio UI; only platform bridges differ.
 for media in ['iptv','radio']:
  for f in (source_files() if media=='iptv' else (ROOT/'android-tv'/media).glob('*')):
   if not f.is_file() or f.suffix not in ['.html','.js','.css','.json','.svg','.webp','.png']:continue
   data=f.read_bytes()
   if f.name=='index.html':
    data=data.decode('utf-8').replace('../tv/','../').replace('<script src="locale.js">','<script src="tv-compat.js"></script><script src="locale.js">').replace('<script src="app.js">','<script src="samsung-bridge.js"></script><script src="app.js">').encode('utf-8')
   if media=='iptv' and f.suffix in ['.js','.css']:data=data.decode('utf-8').replace('../tv/','../').encode('utf-8')
   if f.suffix=='.js':
    output=BUILD/(media+'-samsung.js')
    run([ROOT/'.tools/samsung-web/node_modules/@esbuild/win32-x64/esbuild.exe',f,'--target='+samsung_js_target,'--outfile='+str(output)])
    data=output.read_bytes()
   z.writestr(media+'/'+f.name,data)
  if media=='iptv':z.writestr('iptv/shared-source.json',json.dumps(source_receipt()))
 # IPTV's normalized stylesheet is already included by the source-tree loop.
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
# Compose the same approved TV presentation before platform compatibility transforms.
# Without this stage Samsung packages retain the older raw app theme.
from launcher_visual import stage_launcher_visual
samsung_current=BUILD/'samsung-current-ui'
assert samsung_current.resolve().is_relative_to(BUILD.resolve())
if samsung_current.exists():shutil.rmtree(samsung_current)
samsung_current.mkdir()
for name,data in samsung_files.items():
 target=samsung_current/name
 assert target.resolve().is_relative_to(samsung_current.resolve())
 target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
stage_launcher_visual(samsung_current)
samsung_files={p.relative_to(samsung_current).as_posix():p.read_bytes() for p in samsung_current.rglob('*') if p.is_file()}
for index,name in enumerate(samsung_files):
 if not name.endswith('.js'):continue
 source_js=BUILD/('samsung-source-'+str(index)+'.js')
 output_js=BUILD/('samsung-target-'+str(index)+'.js')
 # Old engines also ignore inset in dynamically-created inline CSS strings.
 source_js.write_bytes(__import__('re').sub(rb'\binset\s*:\s*0(?:px)?(?=[;\"\'])',b'top:0;right:0;bottom:0;left:0',lower_focus_mask(samsung_files[name].decode('utf-8')).encode('utf-8')))
 run([ROOT/'.tools/samsung-web/node_modules/@esbuild/win32-x64/esbuild.exe',source_js,'--target='+samsung_js_target,'--outfile='+str(output_js)])
 samsung_files[name]=output_js.read_bytes()
for name in list(samsung_files):
 if name.endswith('.css'):
  css=samsung_files[name].decode('utf-8')
  from launcher_css_compat import selector_fallbacks
  css=selector_fallbacks(css)
  samsung_files[name]=(lower_inset(css)+('' if '--tizen5' in sys.argv else '\n/* Tizen layout fallbacks: Grid and flex-gap are separate capabilities. */\n'+fallback(css)+'\nhtml.morph-legacy-layout *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}')).encode('utf-8')
 elif name.endswith('.html'):
  html=samsung_files[name].decode('utf-8')
  if not __import__('re').search(r'src=[\"\'][^\"\']*tv-compat\.js',html):
   prefix='../' * name.count('/')
   html=html.replace('</head>','<script src="'+prefix+'tv-compat.js"></script></head>')
  samsung_files[name]=html.encode('utf-8')
from samsung_compat import stage_samsung_layout,stage_samsung_ime
# The shared corrections are inserted after the ordinary transform and staged only for Samsung.
for name,data in samsung_files.items():
 target=samsung_current/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
stage_samsung_ime(samsung_current)
if '--tizen5' not in sys.argv:
 stage_samsung_layout(samsung_current)
else:
 from samsung_visual_compat import prepare_tizen5
 prepare_tizen5(samsung_current)
samsung_files={p.relative_to(samsung_current).as_posix():p.read_bytes() for p in samsung_current.rglob('*') if p.is_file()}
with zipfile.ZipFile(samsung_zip,'w',zipfile.ZIP_DEFLATED) as archive:
 for name,data in samsung_files.items():archive.writestr(name,data)

if tv_stage_only:
 print('Samsung TV web bundle staged:',samsung_zip)
 raise SystemExit(0)

# Compile the existing TV media library/player for local phone playback too.
shutil.copy2(ROOT/'tv-project/app/text-size.js',assets/'ui/text-size.js')
shutil.copy2(SOURCE/'assets/ui/tvmorph.webp',assets/'ui/tvmorph.webp')
assert (assets/'ui/tvmorph.webp').read_bytes()==(SOURCE/'assets/ui/tvmorph.webp').read_bytes(), 'Missing phone header logo'
stage_adhan_assets(network_assets)
stage_brand_assets(network_assets)
phone_media=assets/'iptv';phone_media.mkdir(exist_ok=True)
stage_frontend(phone_media,phone=True)
from phone_layout import prune_legacy_css
prune_legacy_css(assets/'ui')
shutil.copy2(ROOT/'android-tv/iptv/protocol-help.js',assets/'ui/protocol-help.js')
shutil.copy2(ROOT/'tv-project/app/ui/header-shared.css',network_assets/'ui/header-shared.css')
share='--share' in sys.argv
manifest=SOURCE/'AndroidManifest.xml'
if share:
 manifest=BUILD/'AndroidManifest.xml'
 manifest.write_text((SOURCE/'AndroidManifest.xml').read_text().replace('android:debuggable="true"','android:debuggable="false"').replace(phone_version+'-preview',phone_version+'-tester'),encoding='utf-8')
import importlib.util
spec=importlib.util.spec_from_file_location('media3_build',ROOT/'android-tv/media3_build.py');playback_build=importlib.util.module_from_spec(spec);spec.loader.exec_module(playback_build)
unsigned=BUILD/'unsigned.apk';aligned=BUILD/'aligned.apk'
jar,playback_jars,resource_java=playback_build.prepare(ROOT,BUILD,manifest,assets,SOURCE/'res',unsigned)
run([Path('C:/Program Files/Android/Android Studio/jbr/bin/javac.exe'),'-encoding','UTF-8','-source','8','-target','8','-classpath',';'.join(str(x) for x in [jar,dependency]+playback_jars),'-d',classes,*SOURCE.glob('src/**/*.java'),*(ROOT/'android-tv').glob('src/**/*.java'),*resource_java])
compiled_jar=BUILD/'compiled.jar'
with zipfile.ZipFile(compiled_jar,'w',zipfile.ZIP_DEFLATED) as archive:
 for item in classes.rglob('*.class'):archive.write(item,item.relative_to(classes).as_posix())
for old in dex.glob('*.dex'):old.unlink()
run([Path('C:/Program Files/Android/Android Studio/jbr/bin/java.exe'),'-cp',ROOT/'.tools/android/r8-8.3.37.jar','com.android.tools.r8.D8','--lib',jar,'--min-api','26','--output',dex,compiled_jar,android_dependency,*playback_jars])
with zipfile.ZipFile(unsigned,'a',zipfile.ZIP_DEFLATED) as z:
 for item in dex.glob('*.dex'):z.write(item,item.name)
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
