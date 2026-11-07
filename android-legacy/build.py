from pathlib import Path
import subprocess,zipfile,json,hashlib,shutil,argparse,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];HERE=Path(__file__).resolve().parent
JAVA=ROOT/'.tools/tizen/sdk/data/jdk/bin';TOOLS=ROOT/'.tools/android/sdk/android-11'
jars=list((ROOT/'.tools/android/sdk/platform-19').rglob('android.jar'))
if len(jars)!=1:raise RuntimeError('Install official Android SDK Platform 19 first')
parser=argparse.ArgumentParser();parser.add_argument('--product',choices=['launcher','iptv'],default='launcher');args=parser.parse_args();iptv=args.product=='iptv'
API=jars[0];BUILD=HERE/('build-iptv' if iptv else 'build')
for name in ['classes','dex']:(BUILD/name).mkdir(parents=True,exist_ok=True)
def run(args):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True)
 if p.returncode:raise RuntimeError((p.stdout+p.stderr)[-5000:])
RES=BUILD/'res';shutil.copytree(HERE/'res',RES,dirs_exist_ok=True)
(RES/'drawable-nodpi').mkdir(parents=True,exist_ok=True)
(RES/'drawable-nodpi/launcher_wordmark.png').unlink(missing_ok=True)
wordmark='morph-iptv-wordmark.webp' if iptv else 'morph-launcher-wordmark.webp'
shutil.copy2(ROOT/'tv-project/app/assets'/wordmark,RES/'drawable-nodpi/launcher_wordmark.webp')
from PIL import Image
(RES/'drawable-nodpi/mark.png').unlink(missing_ok=True)
Image.open(ROOT/'tv-project/app/assets'/('morph-iptv-icon.png' if iptv else 'morph-launcher-icon.png')).convert('RGBA').resize((512,512)).save(RES/'drawable-nodpi/mark.webp',format='WEBP',lossless=True)
manifest=(HERE/'AndroidManifest.xml').read_text(encoding='utf-8')
if iptv:
 manifest=manifest.replace('package="local.morphtv.legacy"','package="local.morph.iptv.legacy"').replace('android:label="Morph Launcher"','android:label="Morph IPTV"').replace('android:name=".HomeActivity"','android:name="local.morphtv.legacy.HomeActivity"').replace('android:name=".PlayerActivity"','android:name="local.morphtv.legacy.PlayerActivity"')
 manifest=manifest.replace('<intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.HOME"/><category android:name="android.intent.category.DEFAULT"/></intent-filter>','')
if iptv:manifest=manifest.replace('local.morphtv.legacy.updates','local.morph.iptv.legacy.updates')
manifest=manifest.replace('android:launchMode="singleTask"','android:launchMode="singleTask" android:windowSoftInputMode="stateAlwaysHidden"')
MANIFEST=BUILD/'AndroidManifest.xml';MANIFEST.write_text(manifest,encoding='utf-8')
ASSETS=BUILD/'assets';cleaner_assets=ASSETS/'cleaner';cleaner_assets.mkdir(parents=True,exist_ok=True)
for name in ['cleaner-native.html','cleaner.js','cleaner.css']:shutil.copy2(ROOT/'tv-project/app'/name,cleaner_assets/name)
(cleaner_assets/'assets').mkdir(exist_ok=True)
shutil.copy2(ROOT/'tv-project/app/assets/morph-header-symbol.webp',cleaner_assets/'assets/morph-header-symbol.webp')
shutil.copy2(ROOT/'tv-project/app/ui/control-system.js',cleaner_assets/'control-system.js')
cleaner_java=[ROOT/'android-tv/src/local/tvmorph/tv'/name for name in ['CleanerActivity.java','CleanerFiles.java']]
for p in (BUILD/'classes').rglob('*.class'):p.unlink()
run([JAVA/'javac.exe','-encoding','UTF-8','-source','7','-target','7','-bootclasspath',API,'-d',BUILD/'classes',*HERE.glob('src/**/*.java'),*cleaner_java])
run([JAVA/'java.exe','-cp',TOOLS/'lib/d8.jar','com.android.tools.r8.D8','--lib',API,'--min-api','19','--output',BUILD/'dex',*(BUILD/'classes').rglob('*.class')])
run([TOOLS/'aapt.exe','package','-f','-M',MANIFEST,'-I',API,'-S',RES,'-A',ASSETS,'-F',BUILD/'unsigned.apk'])
with zipfile.ZipFile(BUILD/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as z:z.write(BUILD/'dex/classes.dex','classes.dex')
run([TOOLS/'zipalign.exe','-f','4',BUILD/'unsigned.apk',BUILD/'aligned.apk'])
# Separate local test signing identity; never touch current app signing material.
private=ROOT/'.private/legacy-signing';private.mkdir(parents=True,exist_ok=True)
secret=private/'password.txt'
if not secret.exists():
 import secrets
 secret.write_text(secrets.token_hex(24))
password=secret.read_text().strip();key=private/'legacy.jks'
if not key.exists():run([JAVA/'keytool.exe','-genkeypair','-keystore',key,'-storepass',password,'-keypass',password,'-alias','legacy','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Morph TV Legacy Local Test'])
version=ET.fromstring(manifest).attrib['{http://schemas.android.com/apk/res/android}versionName']
output=HERE/(('Morph-IPTV-Legacy-' if iptv else 'Morph-TV-Legacy-')+version+'.apk')
run([JAVA/'java.exe','-jar',TOOLS/'lib/apksigner.jar','sign','--ks',key,'--ks-pass','file:'+str(secret),'--min-sdk-version','19','--v1-signing-enabled','true','--out',output,BUILD/'aligned.apk'])
run([JAVA/'java.exe','-jar',TOOLS/'lib/apksigner.jar','verify','--min-sdk-version','19',output])
report={'apk':str(output),'product':args.product,'package':'local.morph.iptv.legacy' if iptv else 'local.morphtv.legacy','version':version,'versionCode':int(ET.fromstring(manifest).attrib['{http://schemas.android.com/apk/res/android}versionCode']),'minSdk':19,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'bytes':output.stat().st_size,'compiledAgainstAPI':19,'sharedLegacyEngine':'android-legacy/src','features':['M3U playlists','native playback','D-pad'],'notIncluded':['Xtream account login','EPG','modern UI'],'physicalAndroid44Verified':False};(BUILD/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))

