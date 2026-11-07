"""Build the experimental companion APK with the local Android/Tizen tools."""
from pathlib import Path
import json
import secrets
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).resolve().parent
ANDROID = ROOT / '.tools/android/sdk/android-11'
JAVA = ROOT / '.tools/tizen/sdk/data/jdk/bin'
BUILD = SOURCE / 'build'
PRIVATE = ROOT / '.tools/tizen/private'


def run(args):
    result = subprocess.run([str(x) for x in args], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError((result.stdout + result.stderr)[-3000:])


BUILD.mkdir(exist_ok=True)
PRIVATE.mkdir(exist_ok=True)
classes = BUILD / 'classes'
dex = BUILD / 'dex'
assets = BUILD / 'assets'
for folder in (classes, dex, assets):
    folder.mkdir(exist_ok=True)
payload = ROOT / 'watch-theme/launcher/141 App Grid.wgt'
shutil.copy2(payload, assets / 'watcher.wgt')
jar = ANDROID / 'android.jar'
run([JAVA / 'javac.exe', '-encoding', 'UTF-8', '-source', '8', '-target', '8',
     '-bootclasspath', jar, '-d', classes, *SOURCE.glob('src/**/*.java')])
run([JAVA / 'java.exe', '-cp', ANDROID / 'lib/d8.jar', 'com.android.tools.r8.D8',
     '--lib', jar, '--min-api', '23', '--output', dex, *classes.glob('**/*.class')])
unsigned = BUILD / 'unsigned.apk'
run([ANDROID / 'aapt.exe', 'package', '-f', '-M', SOURCE / 'AndroidManifest.xml',
     '-I', jar, '-A', assets, '-F', unsigned, '-0', 'wgt'])
with zipfile.ZipFile(unsigned, 'a', zipfile.ZIP_DEFLATED) as apk:
    apk.write(dex / 'classes.dex', 'classes.dex')
aligned = BUILD / 'aligned.apk'
run([ANDROID / 'zipalign.exe', '-f', '4', unsigned, aligned])
key = PRIVATE / 'phone-installer.jks'
secret = PRIVATE / 'phone-signing.json'
if not secret.exists():
    secret.write_text(json.dumps({'password': secrets.token_urlsafe(24)}))
password = json.loads(secret.read_text())['password']
if not key.exists():
    run([JAVA / 'keytool.exe', '-genkeypair', '-keystore', key, '-alias', 'taskforce141',
         '-storepass', password, '-keypass', password, '-keyalg', 'RSA', '-keysize', '2048',
         '-validity', '3650', '-dname', 'CN=Personal Watch Installer'])
output = ROOT / 'watch-theme/141-Watch-Installer-Test.apk'
run([JAVA / 'java.exe', '-jar', ANDROID / 'lib/apksigner.jar', 'sign', '--ks', key,
     '--ks-key-alias', 'taskforce141', '--ks-pass', 'pass:' + password,
     '--key-pass', 'pass:' + password, '--out', output, aligned])
run([JAVA / 'java.exe', '-jar', ANDROID / 'lib/apksigner.jar', 'verify', output])
print('Built APK; Android signature verified:', output)
