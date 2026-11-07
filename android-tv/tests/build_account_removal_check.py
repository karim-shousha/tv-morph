from pathlib import Path
import subprocess,zipfile,json
root=Path(__file__).resolve().parents[2];build=root/'.tools/account-removal-check';build.mkdir(exist_ok=True)
sdk=root/'.tools/android/sdk/android-11';jdk=root/'.tools/tizen/sdk/data/jdk/bin';jar=sdk/'android.jar'
def run(args):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True)
 if p.returncode:raise RuntimeError((p.stdout+p.stderr)[-3000:])
 return p.stdout
(build/'classes').mkdir(exist_ok=True);(build/'dex').mkdir(exist_ok=True)
(build/'AndroidManifest.xml').write_text('<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="local.morph.iptvcheck"><uses-sdk android:minSdkVersion="26" android:targetSdkVersion="30"/><uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/><application android:label="Player QA"/><instrumentation android:name=".AccountRemovalInstrumentation" android:targetPackage="local.morph.iptv"/></manifest>')
run([jdk/'javac.exe','-source','8','-target','8','-encoding','UTF-8','-classpath',jar,'-d',build/'classes',root/'standalone-iptv/tests/AccountRemovalInstrumentation.java'])
with zipfile.ZipFile(build/'classes.jar','w') as z:
 for p in (build/'classes').rglob('*.class'):z.write(p,p.relative_to(build/'classes').as_posix())
run(['C:/Program Files/Android/Android Studio/jbr/bin/java.exe','-cp',root/'.tools/android/r8-8.3.37.jar','com.android.tools.r8.D8','--lib',jar,'--min-api','26','--output',build/'dex',build/'classes.jar'])
run([sdk/'aapt.exe','package','-f','-M',build/'AndroidManifest.xml','-I',jar,'-F',build/'unsigned.apk'])
with zipfile.ZipFile(build/'unsigned.apk','a') as z:z.write(build/'dex/classes.dex','classes.dex')
run([sdk/'zipalign.exe','-f','4',build/'unsigned.apk',build/'aligned.apk'])
private=root/'.tools/tizen/private';pw=json.loads((private/'cleartv-mobile-signing.json').read_text())['password']
run([jdk/'java.exe','-jar',sdk/'lib/apksigner.jar','sign','--ks',private/'cleartv-mobile.jks','--ks-key-alias','cleartv-mobile','--ks-pass','pass:'+pw,'--out',build/'check.apk',build/'aligned.apk'])
print('QA instrumentation built')
