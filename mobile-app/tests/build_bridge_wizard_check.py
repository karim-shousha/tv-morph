from pathlib import Path
import subprocess,zipfile,json,os
root=Path(__file__).resolve().parents[2];build=root/'.tools/bridge-wizard-check';build.mkdir(exist_ok=True)
sdk=root/'.tools/android/sdk/android-11';jdk=Path('C:/Program Files/Android/Android Studio/jbr/bin');jar=sdk/'android.jar'
def run(args,env=None):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True,env=env)
 if p.returncode:raise RuntimeError((p.stdout+p.stderr)[-3000:])
 return p.stdout
(build/'classes').mkdir(exist_ok=True);(build/'dex').mkdir(exist_ok=True)
(build/'AndroidManifest.xml').write_text('<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="local.cleartv.bridgewizardcheck"><uses-sdk android:minSdkVersion="26" android:targetSdkVersion="30"/><application android:label="Bridge Wizard QA"/><instrumentation android:name=".BridgeWizardInstrumentation" android:targetPackage="local.cleartv.mobile"/></manifest>')
run([jdk/'javac.exe','-source','8','-target','8','-encoding','UTF-8','-classpath',jar,'-d',build/'classes',Path(__file__).parent/'BridgeWizardInstrumentation.java'])
with zipfile.ZipFile(build/'classes.jar','w') as z:
 for p in (build/'classes').rglob('*.class'):z.write(p,p.relative_to(build/'classes').as_posix())
run([jdk/'java.exe','-cp',root/'.tools/android/r8-8.3.37.jar','com.android.tools.r8.D8','--lib',jar,'--min-api','26','--output',build/'dex',build/'classes.jar'])
run([sdk/'aapt.exe','package','-f','-M',build/'AndroidManifest.xml','-I',jar,'-F',build/'unsigned.apk'])
with zipfile.ZipFile(build/'unsigned.apk','a') as z:z.write(build/'dex/classes.dex','classes.dex')
run([sdk/'zipalign.exe','-f','4',build/'unsigned.apk',build/'aligned.apk'])
private=root/'.tools/tizen/private';env=os.environ.copy();env['MORPH_QA_SIGN_PASSWORD']=json.loads((private/'cleartv-mobile-signing.json').read_text())['password']
run([jdk/'java.exe','-jar',sdk/'lib/apksigner.jar','sign','--ks',private/'cleartv-mobile.jks','--ks-key-alias','cleartv-mobile','--ks-pass','env:MORPH_QA_SIGN_PASSWORD','--out',build/'check.apk',build/'aligned.apk'],env)
print('Bridge wizard instrumentation built')
