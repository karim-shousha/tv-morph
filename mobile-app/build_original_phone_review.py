"""Build the user's original Bridge-integrated phone APK with the isolated support-card fix.
Preserve the original native/Flutter code and all other frontend assets byte-for-byte.
"""
from pathlib import Path
from zipfile import ZipFile
import hashlib,json,os,re,shutil,subprocess
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'output/Morph-TV-Mobile-1.1.316-Integrated.apk'
BASE_SHA256='57079ae5fc2900f97d15cd9d86c18c686050cde30fc10cd867ca87eafb287edc'
assert hashlib.sha256(BASE.read_bytes()).hexdigest()==BASE_SHA256, 'Original approved APK baseline has changed'
OUT=ROOT/'output/original-card-fix';OUT.mkdir(exist_ok=True)
FIX=ROOT/'mobile-app/assets/ui/support-invitation-fix.css'
CSS='assets/ui/welcome-support.css'
unsigned=OUT/'unsigned.apk';aligned=OUT/'aligned.apk'
signed=ROOT/'output/Morph-TV-Mobile-1.1.316-Support-Fix.apk'
def signature_entry(name):
 return name=='META-INF/MANIFEST.MF' or bool(re.match(r'^META-INF/[^/]+\.(SF|RSA|DSA|EC)$',name,re.I))
with ZipFile(BASE) as old,ZipFile(unsigned,'w') as new:
 for info in old.infolist():
  if signature_entry(info.filename):continue
  data=old.read(info.filename)
  if info.filename==CSS:data+=b'\n'+FIX.read_bytes()
  new.writestr(info,data)
sdk=Path('C:/Users/Admin/AppData/Local/Android/Sdk/build-tools/35.0.0')
java=Path('C:/Program Files/Android/Android Studio/jbr/bin/java.exe')
subprocess.run([str(sdk/'zipalign.exe'),'-f','4',str(unsigned),str(aligned)],check=True)
password=json.loads((ROOT/'.tools/tizen/private/cleartv-mobile-signing.json').read_text())['password']
env=os.environ.copy();env['MORPH_REVIEW_SIGN_PASSWORD']=password
subprocess.run([str(java),'-jar',str(sdk/'lib/apksigner.jar'),'sign','--ks',str(ROOT/'.tools/tizen/private/cleartv-mobile.jks'),'--ks-key-alias','cleartv-mobile','--ks-pass','env:MORPH_REVIEW_SIGN_PASSWORD','--key-pass','env:MORPH_REVIEW_SIGN_PASSWORD','--out',str(signed),str(aligned)],check=True,env=env)
def certificate(apk):
 result=subprocess.run([str(java),'-jar',str(sdk/'lib/apksigner.jar'),'verify','--print-certs',str(apk)],capture_output=True,text=True,check=True).stdout
 return re.search(r'Signer #1 certificate SHA-256 digest: (\w+)',result).group(1)
assert certificate(BASE)==certificate(signed),'Signing identity must remain unchanged'
with ZipFile(BASE) as old,ZipFile(signed) as new:
 changed=[n for n in old.namelist() if not signature_entry(n) and old.read(n)!=new.read(n)]
 assert changed==[CSS],changed
 assert new.read(CSS)==old.read(CSS)+b'\n'+FIX.read_bytes()
record={'base':str(BASE),'apk':str(signed),'sha256':hashlib.sha256(signed.read_bytes()).hexdigest(),'changedEntries':changed,'nativeAndFlutterUnchanged':True,'sameSigningIdentity':True}
(OUT/'verification.json').write_text(json.dumps(record,indent=2))
shutil.copy2(signed,ROOT/'mobile-app/TV-Morph-Preview.apk')
idsig=Path(str(signed)+'.idsig')
if idsig.exists():shutil.copy2(idsig,ROOT/'mobile-app/TV-Morph-Preview.apk.idsig')
for temporary in [unsigned,aligned]:temporary.unlink(missing_ok=True)
print(json.dumps(record,indent=2))
