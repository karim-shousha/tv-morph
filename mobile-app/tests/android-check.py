from pathlib import Path
import subprocess,json,zipfile
root=Path(__file__).resolve().parents[2]
java=root/'.tools/tizen/sdk/data/jdk/bin';android=root/'.tools/android/sdk/android-11'
folder=root/'mobile-app/tests/android-test';folder.mkdir(exist_ok=True)
classes=folder/'classes';dex=folder/'dex';classes.mkdir(exist_ok=True);dex.mkdir(exist_ok=True)
def run(args):
    p=subprocess.run([str(x) for x in args],capture_output=True,text=True)
    if p.returncode:raise RuntimeError((p.stdout+p.stderr)[-3000:])
sources=[root/'mobile-app/src/local/cleartv/mobile'/name for name in ['Network.java','LgDiscovery.java','AndroidTv.java','Vault.java','AndroidDiscovery.java','SamsungRemote.java','Inspector.java','SdbClient.java','LanHttp.java','ImageAsset.java']]
sources += [root/'mobile-app/tests'/name for name in ['LgDiscoveryCheck.java','LgInstrumentation.java','RemoteCheck.java','ImageAssetCheck.java','XtreamCheck.java','PlaybackMemoryCheck.java','RadioPlaybackCheck.java','UpdaterCheck.java']]
sources += [root/'android-tv/src/local/tvmorph/tv'/name for name in ['Xtream.java','IptvStore.java','PlaybackMemory.java','UiSettings.java','RadioActivity.java','TvUpdater.java','UpdateProvider.java']]
run([java/'javac.exe','-encoding','UTF-8','-source','8','-target','8','-classpath',android/'android.jar','-d',classes,*sources])
run([java/'java.exe','-cp',android/'lib/d8.jar','com.android.tools.r8.D8','--lib',android/'android.jar','--min-api','26','--output',dex,*classes.rglob('*.class')])
manifest=folder/'AndroidManifest.xml'
manifest.write_text('''<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="local.tvmorph.tests050"><uses-sdk android:minSdkVersion="26" android:targetSdkVersion="30"/><uses-permission android:name="android.permission.INTERNET"/><uses-permission android:name="android.permission.ACCESS_WIFI_STATE"/><uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE"/><application android:usesCleartextTraffic="true" android:label="TV Morph test harness"/><instrumentation android:name="local.cleartv.mobile.LgInstrumentation" android:targetPackage="local.tvmorph.tests050"/></manifest>''')
import shutil
shutil.copytree(root/'android-tv/radio',folder/'assets/radio',dirs_exist_ok=True)
unsigned=folder/'unsigned.apk';aligned=folder/'aligned.apk';output=folder/'checks.apk'
run([android/'aapt.exe','package','-f','-M',manifest,'-I',android/'android.jar','-A',folder/'assets','-F',unsigned])
with zipfile.ZipFile(unsigned,'a',zipfile.ZIP_DEFLATED) as z:z.write(dex/'classes.dex','classes.dex')
run([android/'zipalign.exe','-f','4',unsigned,aligned])
private=root/'.tools/tizen/private';secret=json.loads((private/'cleartv-mobile-signing.json').read_text())['password']
run([java/'java.exe','-jar',android/'lib/apksigner.jar','sign','--ks',private/'cleartv-mobile.jks','--ks-key-alias','cleartv-mobile','--ks-pass','pass:'+secret,'--key-pass','pass:'+secret,'--out',output,aligned])
print('Android test harness built; it is separate from the distributed APK.')
