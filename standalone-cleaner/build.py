"""Cleaner: the same review/selection UI and real, permission-limited adapters on each platform."""
from pathlib import Path
import subprocess,shutil,sys,json,zipfile,hashlib
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
HERE=Path(__file__).resolve().parent
BUILD=ROOT/'output/release324/cleaner-build-verified';DIST=ROOT/'output/release324/cleaner';DIST.mkdir(parents=True,exist_ok=True)
VERSION='1.1.324';JAVA=Path('C:/Program Files/Android/Android Studio/jbr/bin');TOOLS=ROOT/'.tools/android/sdk/android-11'
sys.path.insert(0,str(ROOT));sys.path.insert(0,str(ROOT/'mobile-app'))

def run(args):
    r=subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding='utf-8',errors='replace')
    if r.returncode:raise RuntimeError((r.stdout+r.stderr)[-4000:])
    return r.stdout

def stage(target):
    app=BUILD/target
    assert app.resolve().is_relative_to(BUILD.resolve()) and app.resolve()!=BUILD.resolve()
    # Repeated packaging must not embed the previous signed WGT inside itself.
    if app.exists():shutil.rmtree(app)
    app.mkdir(parents=True,exist_ok=True)
    for name in ['cleaner.js','cleaner.css','cleaner-tizen.js','cleaner-platform.js']:shutil.copy2(ROOT/'tv-project/app'/name,app/name)
    shutil.copy2(ROOT/'tv-project/app/ui/control-system.js',app/'control-system.js')
    (app/'assets').mkdir(exist_ok=True)
    shutil.copy2(ROOT/'tv-project/app/assets/morph-header-symbol.webp',app/'assets/morph-header-symbol.webp')
    shutil.copy2(ROOT/'tv-project/visual-system/assets/bridge-background-v2.webp',app/'assets/cleaner-background.webp')
    shutil.copy2(ROOT/'tv-project/app/ui/theme-adapter.js',app/'theme-adapter.js')
    (app/'cleaner-theme.css').write_text('body{--cleaner-system-background:url(assets/cleaner-background.webp)!important}html body #morph-cleaner{background-image:url(assets/cleaner-background.webp)!important}',encoding='utf-8')

    (app/'index.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Morph Cleaner</title><link rel="stylesheet" href="cleaner.css"><link rel="stylesheet" href="cleaner-theme.css"><script src="theme-adapter.js"></script></head><body style="margin:0;background:#0b1a2c"><script>MorphThemeAdapter.apply();</script><script src="control-system.js"></script><script src="cleaner.js"></script><script src="cleaner-tizen.js"></script><script src="cleaner-platform.js"></script><script>window.CleanerStandalone=true;MorphCleaner.open();</script></body></html>',encoding='utf-8')
    image=Image.open(ROOT/'tv-project/app/assets/morph-launcher-icon.png').convert('RGBA').resize((512,512),Image.Resampling.LANCZOS)
    image.save(app/'icon.png')
    if target in ['samsung','webos']:
        from samsung_compat import lower_focus_mask
        p=app/'control-system.js';p.write_text(lower_focus_mask(p.read_text(encoding='utf-8')),encoding='utf-8')
    return app

def android():
    build=stage('android');assets=build/'assets/cleaner';assets.mkdir(parents=True,exist_ok=True)
    for name in ['cleaner-native.html','cleaner.js','cleaner.css']:shutil.copy2(ROOT/'tv-project/app'/name,assets/name)
    shutil.copy2(ROOT/'tv-project/app/ui/control-system.js',assets/'control-system.js')
    (assets/'assets').mkdir(exist_ok=True)
    for name in ['morph-header-symbol.webp','cleaner-background.webp']:shutil.copy2(build/'assets'/name,assets/'assets'/name)
    for name in ['cleaner-theme.css','theme-adapter.js']:shutil.copy2(build/name,assets/name)
    page=assets/'cleaner-native.html';page.write_text(page.read_text(encoding='utf-8').replace('</head>','<link rel="stylesheet" href="cleaner-theme.css"><script src="theme-adapter.js"></script></head>').replace('<script src="cleaner.js">','<script>MorphThemeAdapter.apply();</script><script src="cleaner.js">'),encoding='utf-8')
    res=build/'res/drawable-nodpi';res.mkdir(parents=True,exist_ok=True);shutil.copy2(build/'icon.png',res/'icon.png')
    banner=Image.new('RGBA',(320,180),'#0b1a2c');symbol=Image.open(build/'icon.png').convert('RGBA').resize((96,96),Image.Resampling.LANCZOS);banner.alpha_composite(symbol,(112,12));draw=ImageDraw.Draw(banner);font=ImageFont.load_default(size=24);draw.text((160,136),'Morph Cleaner',anchor='mm',font=font,fill='white');banner.convert('RGB').save(res/'banner.png')
    manifest=build/'AndroidManifest.xml';manifest.write_text('''<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="local.tvmorph.cleaner" android:versionCode="351" android:versionName="1.1.324"><uses-sdk android:minSdkVersion="19" android:targetSdkVersion="34"/><uses-feature android:name="android.hardware.touchscreen" android:required="false"/><uses-feature android:name="android.software.leanback" android:required="false"/><application android:label="Morph Cleaner" android:icon="@drawable/icon" android:banner="@drawable/banner" android:theme="@android:style/Theme.Holo.NoActionBar" android:allowBackup="false"><activity android:name="local.tvmorph.tv.CleanerActivity" android:exported="true" android:configChanges="orientation|screenSize|keyboardHidden"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/><category android:name="android.intent.category.LEANBACK_LAUNCHER"/></intent-filter></activity></application></manifest>''')
    api=list((ROOT/'.tools/android/sdk/platform-19').rglob('android.jar'))[0];classes=build/'classes';classes.mkdir(exist_ok=True)
    run([ROOT/'.tools/tizen/sdk/data/jdk/bin/javac.exe','-encoding','UTF-8','-source','7','-target','7','-bootclasspath',api,'-d',classes,*[ROOT/'android-tv/src/local/tvmorph/tv'/name for name in ['CleanerActivity.java','CleanerFiles.java']]])
    dex=build/'dex';dex.mkdir(exist_ok=True)
    run([JAVA/'java.exe','-cp',TOOLS/'lib/d8.jar','com.android.tools.r8.D8','--lib',api,'--min-api','19','--output',dex,*classes.rglob('*.class')])
    unsigned=build/'unsigned.apk';aligned=build/'aligned.apk';target=DIST/('Cleaner-Android-'+VERSION+'.apk')
    run([Path('C:/Users/Admin/AppData/Local/Android/Sdk/build-tools/35.0.0/aapt.exe'),'package','-f','-M',manifest,'-I',Path('C:/Users/Admin/AppData/Local/Android/Sdk/platforms/android-35/android.jar'),'-S',build/'res','-A',build/'assets','-F',unsigned])
    with zipfile.ZipFile(unsigned,'a',zipfile.ZIP_DEFLATED) as z:z.write(dex/'classes.dex','classes.dex')
    run([TOOLS/'zipalign.exe','-f','4',unsigned,aligned]);private=ROOT/'.tools/tizen/private';password=json.loads((private/'cleartv-mobile-signing.json').read_text())['password']
    run([JAVA/'java.exe','-jar',TOOLS/'lib/apksigner.jar','sign','--ks',private/'cleartv-mobile.jks','--ks-key-alias','cleartv-mobile','--ks-pass','pass:'+password,'--key-pass','pass:'+password,'--min-sdk-version','19','--v1-signing-enabled','true','--out',target,aligned]);run([JAVA/'java.exe','-jar',TOOLS/'lib/apksigner.jar','verify','--min-sdk-version','19',target]);return target

def samsung():
    app=stage('samsung');config='''<?xml version="1.0" encoding="UTF-8"?><widget xmlns="http://www.w3.org/ns/widgets" xmlns:tizen="http://tizen.org/ns/widgets" id="https://morph-tv.com/cleaner" version="1.1.324" viewmodes="maximized"><tizen:application id="MrphCln001.Cleaner" package="MrphCln001" required_version="2.3"/><content src="index.html"/><name>Morph Cleaner</name><icon src="icon.png"/><tizen:profile name="tv-samsung"/><tizen:privilege name="http://tizen.org/privilege/filesystem.read"/><tizen:privilege name="http://tizen.org/privilege/filesystem.write"/><tizen:setting screen-orientation="landscape" context-menu="disable" background-support="disable"/></widget>'''
    (app/'config.xml').write_text(config)
    run(['cmd.exe','/d','/c','C:/tizen-studio/tools/ide/bin/tizen.bat','package','-t','wgt','-s','ClearTV','--',app]);source=app/'Morph Cleaner.wgt';target=DIST/('Cleaner-Samsung-Tizen2-and-newer-'+VERSION+'.wgt');shutil.copy2(source,target);return target

def webos():
    app=stage('webos');(app/'appinfo.json').write_text(json.dumps({'id':'com.morphtv.cleaner','version':VERSION,'vendor':'Morph TV','type':'web','main':'index.html','title':'Morph Cleaner','icon':'icon.png','largeIcon':'icon.png','uiRevision':2,'resolution':'1920x1080'}))
    shutil.copy2(ROOT/'.tools/webos-library/webOSTVjs-1.2.13/webOSTV.js',app/'webOSTV.js');page=app/'index.html';page.write_text(page.read_text().replace('<script src="cleaner.js">','<script src="webOSTV.js"></script><script src="cleaner.js">'))
    service=BUILD/'webos-service';shutil.copytree(ROOT/'webos-app/cleaner-service',service,dirs_exist_ok=True);shutil.copy2(ROOT/'cleaner/files.cjs',service/'files.cjs')
    for name in ['package.json','services.json']:
        p=service/name;p.write_text(p.read_text().replace('com.zainbot.morphtv.preview.cleaner','com.morphtv.cleaner.cleaner'))
    run(['node',ROOT/'.tools/webos/node_modules/@webos-tools/cli/bin/ares-package.js',app,service,'-o',DIST,'--no-minify']);source=DIST/('com.morphtv.cleaner_'+VERSION+'_all.ipk');target=DIST/('Cleaner-LG-'+VERSION+'.ipk');shutil.copy2(source,target);return target

if __name__=='__main__':
    rows=[]
    for target in sys.argv[1:] or ['android','samsung','webos']:
        p=globals()[target]();rows.append({'target':target,'path':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()});print('BUILT',target,p,flush=True)
    known={r['target']:r for r in rows}
    for target,filename in [('android','Cleaner-Android-'+VERSION+'.apk'),('samsung','Cleaner-Samsung-Tizen2-and-newer-'+VERSION+'.wgt'),('webos','Cleaner-LG-'+VERSION+'.ipk')]:
        p=DIST/filename
        if target not in known and p.is_file():known[target]={'target':target,'path':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    (DIST/'manifest.json').write_text(json.dumps({'version':VERSION,'artifacts':list(known.values()),'physicalDeviceVerified':False},indent=2))
