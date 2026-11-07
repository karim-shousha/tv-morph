"""Local Bridge receivers: one frontend and TV Plus policy, preserved identities."""
from pathlib import Path
import sys,os,json,shutil,subprocess,hashlib,re,zipfile,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];HERE=ROOT/'standalone-bridge'
sys.path.insert(0,str(ROOT));sys.path.insert(0,str(ROOT/'mobile-app'));sys.path.insert(0,str(ROOT/'legacy-build'))
from bridge_frontend import stage_bridge_frontend
from samsung_compat import lower_inset
from launcher_css_compat import selector_fallbacks
from guard import eight_digit_hex_to_rgba
from PIL import Image
PRODUCT=json.loads((HERE/'product.json').read_text());VERSION=PRODUCT['version']
BUILD=HERE/'build';DIST=HERE/'dist';DIST.mkdir(exist_ok=True)

def run(args,cwd=None):
    result=subprocess.run([str(x) for x in args],cwd=cwd,capture_output=True,text=True,
        env={**os.environ,'JAVA_HOME':'C:/Program Files/Android/Android Studio/jbr','PYTHONIOENCODING':'utf-8'})
    if result.returncode:raise RuntimeError((result.stdout+result.stderr)[-3500:])
    return result.stdout

def stage(target,engine):
    app=(BUILD/target/'app').resolve()
    assert app.is_relative_to(BUILD.resolve()) and app!=BUILD.resolve()
    if app.exists():shutil.rmtree(app)
    stage_bridge_frontend(app)
    Image.open(ROOT/'tv-project/app/assets/morph-launcher-icon.png').convert('RGBA').resize((512,512)).save(app/'icon.png')
    compiler=ROOT/'.tools/samsung-web/node_modules/@esbuild/win32-x64/esbuild.exe'
    for file in app.rglob('*.js'):
        temp=Path(str(file)+'.tmp');run([compiler,file,'--target='+engine,'--outfile='+str(temp),'--log-level=error']);file.write_bytes(temp.read_bytes());temp.unlink()
    for file in app.rglob('*.css'):
        text=eight_digit_hex_to_rgba(selector_fallbacks(lower_inset(file.read_text(encoding='utf-8'))))
        text=re.sub(r'(?:-webkit-)?backdrop-filter\s*:[^;}]+','backdrop-filter:none',text,flags=re.I)
        text=re.sub(r'(?<![\w-])(?:box-shadow|text-shadow)\s*:[^;}]+',lambda m:m[0].split(':',1)[0]+':none',text,flags=re.I)
        text=re.sub(r'blur\([^)]*\)','blur(0px)',text,flags=re.I)
        file.write_text(text,encoding='utf-8')
    return app

def android():
    module=ROOT/'mobile-app/bridge-tv-receiver'
    stage_bridge_frontend(module/'src/main/assets')
    native=module/'src/main/java/local/tvmorph/tv/BridgeTrial.java';native.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(ROOT/'android-tv/src/local/tvmorph/tv/BridgeTrial.java',native)
    Image.open(ROOT/'tv-project/app/assets/morph-launcher-icon.png').convert('RGBA').resize((512,512)).save(module/'src/main/res/drawable-nodpi/morph_logo.webp','WEBP',lossless=True)
    gradle=module/'build.gradle.kts';text=gradle.read_text();text=re.sub(r'versionName = "[^"]+"','versionName = "'+VERSION+'"',text);gradle.write_text(text)
    run([ROOT/'mobile-app/integrated-remote/android/gradlew.bat',':morph-bridge-receiver:assembleRelease','--console=plain'],ROOT/'mobile-app/integrated-remote/android')
    source=ROOT/'mobile-app/integrated-remote/build/morph-bridge-receiver/outputs/apk/release/morph-bridge-receiver-release.apk'
    assert source.is_file(),source
    java=Path('C:/Program Files/Android/Android Studio/jbr/bin/java.exe');signer=ROOT/'.tools/android/sdk/android-11/lib/apksigner.jar'
    previous=ROOT/'mobile-app/bridge-native/src/main/assets/tv/Morph-Bridge-Android-TV.apk'
    def signer_id(file):
        result=run([java,'-jar',signer,'verify','--print-certs',file])
        return re.search(r'certificate SHA-256 digest: ([0-9a-f]+)',result).group(1)
    assert signer_id(source)==signer_id(previous),'Bridge Android signing identity changed'
    target=DIST/('Morph-Bridge-Android-TV-'+VERSION+'.apk');shutil.copy2(source,target)
    shutil.copy2(source,previous)
    return target

def samsung():
    app=stage('samsung','chrome56')
    from samsung_compat import stage_samsung_layout
    stage_samsung_layout(app)
    config=(HERE/'samsung-config.xml').read_text(encoding='utf-8')
    config=re.sub(r'(<widget[^>]*\s)version="[^"]+"',lambda m:m[1]+'version="'+VERSION+'"',config)
    (app/'config.xml').write_text(config,encoding='utf-8')
    page=app/'index.html';page.write_text(page.read_text(encoding='utf-8').replace('<head>','<head><script src="$WEBAPIS/webapis/webapis.js"></script>',1),encoding='utf-8')
    run(['cmd.exe','/d','/c','C:/tizen-studio/tools/ide/bin/tizen.bat','package','-t','wgt','-s','appbridge','--',app])
    source=app/'Morph Bridge.wgt';assert source.is_file()
    target=DIST/('Morph-Bridge-Samsung-'+VERSION+'.wgt');shutil.copy2(source,target)
    shutil.copy2(source,ROOT/'mobile-app/bridge-native/src/main/assets/tv/AppBridge-Samsung.wgt')
    return target

def webos():
    app=stage('webos','chrome53');
    from samsung_compat import stage_samsung_layout
    stage_samsung_layout(app)
    info=json.loads((HERE/'webos-appinfo.json').read_text());info['version']=VERSION
    (app/'appinfo.json').write_text(json.dumps(info,indent=2),encoding='utf-8')
    run(['node',ROOT/'.tools/webos/node_modules/@webos-tools/cli/bin/ares-package.js',app,'-o',DIST,'--no-minify'])
    source=DIST/(info['id']+'_'+VERSION+'_all.ipk');assert source.is_file()
    target=DIST/('Morph-Bridge-LG-'+VERSION+'.ipk');shutil.copy2(source,target)
    shutil.copy2(source,ROOT/'mobile-app/bridge-native/src/main/assets/tv/Morph-Bridge-LG.ipk')
    return target

if __name__=='__main__':
    targets=sys.argv[1:] or ['android','samsung','webos'];rows=[]
    for name in targets:
        file=globals()[name]();rows.append({'target':name,'file':str(file.relative_to(ROOT)),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
        print('BUILT Bridge',name,file.name,flush=True)
    manifest=DIST/'local-build.json';old=json.loads(manifest.read_text()).get('artifacts',[]) if manifest.exists() else []
    by_target={row['target']:row for row in old};by_target.update({row['target']:row for row in rows})
    manifest.write_text(json.dumps({'product':PRODUCT,'artifacts':list(by_target.values()),'published':False},indent=2))
