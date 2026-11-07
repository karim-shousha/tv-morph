from pathlib import Path
import subprocess,zipfile,json,os
root=Path(__file__).resolve().parents[2];build=root/'.tools/player-back-check';build.mkdir(exist_ok=True)
sdk=root/'.tools/android/sdk/android-11';jdk=root/'.tools/tizen/sdk/data/jdk/bin';jar=sdk/'android.jar'
def run(args):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True,timeout=90)
 if p.returncode:raise RuntimeError((p.stdout+p.stderr)[-3000:])
 return p.stdout
(build/'classes').mkdir(exist_ok=True);(build/'dex').mkdir(exist_ok=True)
target=os.environ.get('PLAYER_QA_PACKAGE','local.tvmorph.tv')
(build/'AndroidManifest.xml').write_text('<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="local.tvmorph.playerbackcheck"><uses-sdk android:minSdkVersion="26" android:targetSdkVersion="30"/><uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/><application android:label="Player QA"/><instrumentation android:name=".PlayerBackInstrumentation" android:targetPackage="'+target+'"/></manifest>')
run([jdk/'javac.exe','-source','8','-target','8','-encoding','UTF-8','-classpath',jar,'-d',build/'classes',Path(__file__).parent/'PlayerBackInstrumentation.java'])
with zipfile.ZipFile(build/'classes.jar','w') as z:
 for p in (build/'classes').rglob('*.class'):z.write(p,p.relative_to(build/'classes').as_posix())
run(['C:/Program Files/Android/Android Studio/jbr/bin/java.exe','-cp',root/'.tools/android/r8-8.3.37.jar','com.android.tools.r8.D8','--lib',jar,'--min-api','26','--output',build/'dex',build/'classes.jar'])
run([sdk/'aapt.exe','package','-f','-M',build/'AndroidManifest.xml','-I',jar,'-F',build/'unsigned.apk'])
with zipfile.ZipFile(build/'unsigned.apk','a') as z:z.write(build/'dex/classes.dex','classes.dex')
run([sdk/'zipalign.exe','-f','4',build/'unsigned.apk',build/'aligned.apk'])
private=root/'.tools/tizen/private';pw=json.loads((private/'cleartv-mobile-signing.json').read_text())['password']
run([jdk/'java.exe','-jar',sdk/'lib/apksigner.jar','sign','--ks',private/'cleartv-mobile.jks','--ks-key-alias','cleartv-mobile','--ks-pass','pass:'+pw,'--out',build/'check.apk',build/'aligned.apk'])
print('QA instrumentation built')

# Use generated local media; no user playlists, credentials or physical devices.
import http.server,threading,os
sample=root/'pc-app/test-output/audio-startup/two-audio-tracks.mp4'
assert sample.is_file()
class Handler(http.server.BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  data=sample.read_bytes();self.send_response(200);self.send_header('Content-Type','video/mp4');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
adb=root/'.tools/android/platform-tools/adb.exe';device=os.environ.get('PLAYER_QA_DEVICE','emulator-5558')
try:
 apk=root/os.environ.get('PLAYER_QA_APK','android-tv/TV-Morph-Android-TV-Preview.apk')
 with zipfile.ZipFile(apk) as archive:assert any(b'player-back' in archive.read(n) for n in archive.namelist() if n.endswith('.dex'))
 print(run([adb,'-s',device,'install','-r',apk]))
 print(run([adb,'-s',device,'install','-r',build/'check.apk']))
 value=run([adb,'-s',device,'shell','am','instrument','-w','-e','entry',os.environ.get('PLAYER_QA_ENTRY','local.tvmorph.tv.TvActivity'),'-e','url','http://10.0.2.2:'+str(server.server_port)+'/sample.mp4','local.tvmorph.playerbackcheck/.PlayerBackInstrumentation']);print(value);assert 'PASS native Android:' in value,value
finally:server.shutdown()
