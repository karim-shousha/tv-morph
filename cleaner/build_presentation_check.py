from pathlib import Path
import subprocess,json,zipfile
ROOT=Path.cwd();BUILD=ROOT/'.tools/cleaner-presentation-check';BUILD.mkdir(parents=True,exist_ok=True)
TOOLS=ROOT/'.tools/android/sdk/android-11';JAVA=ROOT/'.tools/tizen/sdk/data/jdk/bin';API=list((ROOT/'.tools/android/sdk/platform-19').rglob('android.jar'))[0]
def run(args):
 r=subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding='utf-8',errors='replace')
 if r.returncode:raise RuntimeError((r.stdout+r.stderr)[-2500:])
classes=BUILD/'classes';classes.mkdir(exist_ok=True);dex=BUILD/'dex';dex.mkdir(exist_ok=True)
run([JAVA/'javac.exe','-encoding','UTF-8','-source','8','-target','8','-classpath',TOOLS/'android.jar','-d',classes,ROOT/'cleaner/CleanerPresentationCheck.java',ROOT/'android-tv/src/local/tvmorph/tv/CleanerFiles.java'])
# Only the instrumentation is packaged. Runtime calls use the actual phone APK's CleanerFiles class.
run([JAVA/'java.exe','-cp',TOOLS/'lib/d8.jar','com.android.tools.r8.D8','--lib',API,'--min-api','19','--output',dex,*list((classes/'local/tvmorph/cleanercheck').glob('*.class'))])
manifest=BUILD/'AndroidManifest.xml';manifest.write_text('<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="local.tvmorph.cleanercheck"><uses-sdk android:minSdkVersion="19" android:targetSdkVersion="34"/><application android:label="Cleaner check"/><instrumentation android:name="local.tvmorph.cleanercheck.CleanerPresentationCheck" android:targetPackage="local.cleartv.mobile"/></manifest>')
unsigned=BUILD/'unsigned.apk';aligned=BUILD/'aligned.apk';output=BUILD/'CleanerCheck.apk'
run([TOOLS/'aapt.exe','package','-f','-M',manifest,'-I',API,'-F',unsigned])
with zipfile.ZipFile(unsigned,'a') as z:z.write(dex/'classes.dex','classes.dex')
run([TOOLS/'zipalign.exe','-f','4',unsigned,aligned]);private=ROOT/'.tools/tizen/private';password=json.loads((private/'cleartv-mobile-signing.json').read_text())['password']
run([JAVA/'java.exe','-jar',TOOLS/'lib/apksigner.jar','sign','--ks',private/'cleartv-mobile.jks','--ks-key-alias','cleartv-mobile','--ks-pass','pass:'+password,'--key-pass','pass:'+password,'--out',output,aligned]);print(output)

import os
adb=ROOT/'.tools/android/platform-tools/adb.exe';device='emulator-5558'
def call(args):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=90)
 if p.returncode:raise RuntimeError((p.stdout+p.stderr)[-2000:])
 return p.stdout
print(call([adb,'-s',device,'install','-r',ROOT/'output/Morph-TV-Mobile-1.1.320-Integrated.apk']))
print(call([adb,'-s',device,'install','-r',output]))
value=call([adb,'-s',device,'shell','am','instrument','-w','local.tvmorph.cleanercheck/.CleanerPresentationCheck']);print(value);assert 'PASS native Cleaner:' in value
