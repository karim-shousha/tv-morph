from pathlib import Path
import subprocess,json,zipfile
ROOT=Path.cwd();BUILD=ROOT/'output/release320/android-check';BUILD.mkdir(parents=True,exist_ok=True)
TOOLS=ROOT/'.tools/android/sdk/android-11';JAVA=ROOT/'.tools/tizen/sdk/data/jdk/bin';API=list((ROOT/'.tools/android/sdk/platform-19').rglob('android.jar'))[0]
def run(args):
 r=subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding='utf-8',errors='replace')
 if r.returncode:raise RuntimeError((r.stdout+r.stderr)[-2500:])
classes=BUILD/'classes';classes.mkdir(exist_ok=True);dex=BUILD/'dex';dex.mkdir(exist_ok=True)
run([JAVA/'javac.exe','-encoding','UTF-8','-source','7','-target','7','-bootclasspath',API,'-d',classes,ROOT/'cleaner/AndroidCleanerCheck.java',ROOT/'android-tv/src/local/tvmorph/tv/CleanerFiles.java'])
# Only the instrumentation is packaged. Runtime calls use the actual phone APK's CleanerFiles class.
run([JAVA/'java.exe','-cp',TOOLS/'lib/d8.jar','com.android.tools.r8.D8','--lib',API,'--min-api','19','--output',dex,*list((classes/'local/tvmorph/cleanercheck').glob('*.class'))])
manifest=BUILD/'AndroidManifest.xml';manifest.write_text('<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="local.tvmorph.cleanercheck"><uses-sdk android:minSdkVersion="19" android:targetSdkVersion="34"/><application android:label="Cleaner check"/><instrumentation android:name="local.tvmorph.cleanercheck.AndroidCleanerCheck" android:targetPackage="local.cleartv.mobile"/></manifest>')
unsigned=BUILD/'unsigned.apk';aligned=BUILD/'aligned.apk';output=BUILD/'CleanerCheck.apk'
run([TOOLS/'aapt.exe','package','-f','-M',manifest,'-I',API,'-F',unsigned])
with zipfile.ZipFile(unsigned,'a') as z:z.write(dex/'classes.dex','classes.dex')
run([TOOLS/'zipalign.exe','-f','4',unsigned,aligned]);private=ROOT/'.tools/tizen/private';password=json.loads((private/'cleartv-mobile-signing.json').read_text())['password']
run([JAVA/'java.exe','-jar',TOOLS/'lib/apksigner.jar','sign','--ks',private/'cleartv-mobile.jks','--ks-key-alias','cleartv-mobile','--ks-pass','pass:'+password,'--key-pass','pass:'+password,'--out',output,aligned]);print(output)
