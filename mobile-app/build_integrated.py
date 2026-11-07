"""Build native Morph TV and its embedded Flutter remote as one signed APK."""
from pathlib import Path
import hashlib,json,re,shutil,subprocess,sys,os,zipfile
ROOT=Path(__file__).resolve().parents[1]
PHONE=ROOT/'mobile-app';REMOTE=PHONE/'integrated-remote'
from phone_design_system import sync as sync_phone_design_system
sync_phone_design_system()

# A successful Gradle build alone does not prove that the independent-display
# runtime ships. This extensionless asset was absent from a source snapshot.
runtime_asset=PHONE/'bridge-native/src/main/assets/scrcpy-server-v5.0.1'
runtime_sha256='764eb6f79811d5211fe9df341120882ba9994c7a61b897d7bf3fb662e53bc536'
assert runtime_asset.is_file(), 'Missing Bridge independent-display runtime'
assert hashlib.sha256(runtime_asset.read_bytes()).hexdigest()==runtime_sha256, 'Unexpected Bridge runtime binary'
def run(args,cwd=ROOT):
    subprocess.run([str(x) for x in args],cwd=cwd,check=True)
if '--reuse-assets' not in sys.argv:
    run([sys.executable,PHONE/'build.py','--native-stage','--phone-only',*[x for x in sys.argv[1:] if x in ['--share','--test-channel']]])
# A phone-only repair can retain the exact previously published TV installers.
if '--preserve-tv-bundles' in sys.argv:
    previous=Path(sys.argv[sys.argv.index('--preserve-tv-bundles')+1]).resolve()
    with zipfile.ZipFile(previous) as archive:
        for name in ['android-tv.apk','iptv-android.apk','iptv-tizen4.wgt','iptv-webos.ipk','lg-preview.ipk','tv-app.zip','install-products.json']:
            target=PHONE/'build/assets'/name
            assert target.is_file(), 'Missing staged installer: '+name
            target.write_bytes(archive.read('assets/'+name))
# Android-only patches can retain approved Samsung/LG installers while refreshing
# the two Android payloads. Never ship an older Android installer accidentally.
if '--refresh-android-installers' in sys.argv:
    receiver_manifest=(ROOT/'android-tv/AndroidManifest.xml').read_text(encoding='utf-8')
    receiver_version=re.search(r'android:versionName="([^"]+)"',receiver_manifest).group(1)
    shutil.copy2(ROOT/'android-tv/TV-Morph-Android-TV-Preview.apk',PHONE/'build/assets/android-tv.apk')
    from installer_payloads import stage as stage_install_products
    stage_install_products(ROOT,PHONE/'build/assets',receiver_version)

manifest=(PHONE/'AndroidManifest.xml').read_text(encoding='utf-8')
version=re.search(r'android:versionName="([^"]+)"',manifest).group(1)
if '--share' in sys.argv:version=version.replace('-preview','-tester')
code=int(re.search(r'android:versionCode="(\d+)"',manifest).group(1))
manifest=re.sub(r' package="[^"]+"| android:versionCode="[^"]+"| android:versionName="[^"]+"','',manifest,count=3)
manifest=re.sub(r'\s*<uses-sdk[^>]+/>','',manifest)
manifest=manifest.replace(' android:debuggable="true"','')
manifest=manifest.replace('<manifest ', '<manifest xmlns:tools="http://schemas.android.com/tools" ',1)
# Bridge is gated at its launch boundary (API 29); retain the phone host's API 26 support.
manifest=manifest.replace('<application ', '<uses-sdk tools:overrideLibrary="tv.appbridge.phase0"/><application ',1)
manifest=manifest.replace('<application ', '<uses-permission android:name="android.permission.VIBRATE"/><application ',1)
manifest=manifest.replace('</application>','''<activity android:name="local.cleartv.mobile.RemoteActivity" android:exported="false" android:screenOrientation="portrait" android:theme="@style/NormalTheme" android:hardwareAccelerated="true" android:windowSoftInputMode="adjustResize" android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"/>
<meta-data android:name="flutterEmbedding" android:value="2"/></application>''')
(REMOTE/'android/app/src/main/AndroidManifest.xml').write_text(manifest,encoding='utf-8')
(REMOTE/'android/local.properties').write_text('sdk.dir=C:/Users/Admin/AppData/Local/Android/Sdk\nflutter.sdk=C:/flutter/src/Flutter\n',encoding='utf-8')
(REMOTE/'android/host-version.properties').write_text(f'code={code}\nname={version}\n',encoding='utf-8')
run(['C:/flutter/src/Flutter/bin/flutter.bat','build','apk','--release','--target-platform','android-arm,android-arm64,android-x64','--dart-define=BUILD_ID=morph-tv-'+version],REMOTE)
unsigned=REMOTE/'build/app/outputs/flutter-apk/app-release.apk'
with zipfile.ZipFile(unsigned) as packaged:
    assert hashlib.sha256(packaged.read('assets/scrcpy-server-v5.0.1')).hexdigest()==runtime_sha256, 'Bridge runtime missing or modified in APK'
    assert packaged.read('assets/scrcpy-audio-appbridge.jar')==(PHONE/'bridge-native/src/main/assets/scrcpy-audio-appbridge.jar').read_bytes(), 'Bridge audio runtime missing or modified in APK'
    for required in ['assets/ui/setup-wizard.css','assets/ui/matches-screen.html','assets/ui/matches-phone.css','assets/ui/matches-screen.css','assets/ui/matches-navigation.js']:
        assert required in packaged.namelist(), 'Missing sports presentation asset: '+required

aligned=PHONE/'build/integrated-aligned.apk'
sdk=Path('C:/Users/Admin/AppData/Local/Android/Sdk/build-tools/35.0.0')
run([sdk/'zipalign.exe','-f','4',unsigned,aligned])
secret=ROOT/'.tools/tizen/private/cleartv-mobile-signing.json'
password=json.loads(secret.read_text())['password']
java=Path('C:/Program Files/Android/Android Studio/jbr/bin/java.exe')
signed=PHONE/('TV-Morph-Tester.apk' if '--share' in sys.argv else 'TV-Morph-Preview.apk')
env=os.environ.copy();env['MORPH_SIGN_PASSWORD']=password
sign=[str(java),'-jar',str(sdk/'lib/apksigner.jar'),'sign','--ks',str(ROOT/'.tools/tizen/private/cleartv-mobile.jks'),'--ks-key-alias','cleartv-mobile','--ks-pass','env:MORPH_SIGN_PASSWORD','--key-pass','env:MORPH_SIGN_PASSWORD','--out',str(signed),str(aligned)]
subprocess.run(sign,check=True,env=env)
run([java,'-jar',sdk/'lib/apksigner.jar','verify',signed])
out=ROOT/'output'/('Morph-TV-Mobile-'+version.split('-')[0]+'-Integrated.apk')
shutil.copy2(signed,out)
print('Integrated APK:',out,'SHA256',hashlib.sha256(out.read_bytes()).hexdigest())
