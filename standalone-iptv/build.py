"""Local product builds. Shared IPTV UI/native engines are read from the main source tree."""
from pathlib import Path
import sys,json,shutil,subprocess,hashlib,zipfile,re,xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1];HERE=ROOT/'standalone-iptv';BUILD=HERE/'build';OUTPUT=HERE/'dist'
sys.path.insert(0,str(ROOT));sys.path.insert(0,str(ROOT/'android-tv'));sys.path.insert(0,str(ROOT/'mobile-app'));sys.path.insert(0,str(ROOT/'legacy-build'))
from iptv_shared import stage_frontend,stage_adhan_assets,stage_brand_assets,stage_product_icon,stage_prayer_ui,stage_bridge_entry_background
PRODUCT=json.loads((HERE/'product.json').read_text(encoding='utf-8'));VERSION=PRODUCT['version']
JAVA=ROOT/'.tools/tizen/sdk/data/jdk/bin';SDK=ROOT/'.tools/android/sdk/android-11';ESBUILD=ROOT/'.tools/samsung-web/node_modules/@esbuild/win32-x64/esbuild.exe'

def run(args,cwd=None):
    result=subprocess.run([str(a) for a in args],cwd=cwd,capture_output=True,text=True)
    if result.returncode:raise RuntimeError((result.stdout+result.stderr)[-3500:])
    return result.stdout

def clean_stage(path):
    path=path.resolve()
    assert path.is_relative_to(BUILD.resolve()) and path!=BUILD.resolve(),path
    if path.exists():shutil.rmtree(path)
    path.mkdir(parents=True)

def shared_style(root):
    stage_brand_assets(root)
    stage_prayer_ui(root)
    shutil.copy2(ROOT/'tv-project/app/club-themes.js',root/'club-themes.js')
    for name in ['header-shared.css','tokens.css','theme-adapter.js','control-system.js']:
        target=root/'ui'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/'tv-project/app/ui'/name,target)

def sign_android(build,unsigned,target):
    aligned=build/'aligned.apk';run([SDK/'zipalign.exe','-f','4',unsigned,aligned])
    private=ROOT/'.tools/tizen/private';password=json.loads((private/'cleartv-mobile-signing.json').read_text())['password']
    run([JAVA/'java.exe','-jar',SDK/'lib/apksigner.jar','sign','--ks',private/'cleartv-mobile.jks','--ks-key-alias','cleartv-mobile','--ks-pass','pass:'+password,'--out',target,aligned])
    run([JAVA/'java.exe','-jar',SDK/'lib/apksigner.jar','verify',target])

def android():
    from media3_build import prepare
    build=BUILD/'android';clean_stage(build);assets=build/'assets';assets.mkdir();stage_frontend(assets/'iptv',standalone=True);shared_style(assets/'tv');stage_adhan_assets(assets/'tv')
    html=assets/'iptv/index.html';html.write_text(html.read_text(encoding='utf-8').replace('<script src="locale.js">','<script src="tv-compat.js"></script><script src="locale.js">'),encoding='utf-8')
    for script in (assets/'iptv').glob('*.js'):run([ESBUILD,script,'--target=chrome56','--outfile='+str(script)+'.tmp','--log-level=error']);script.write_bytes(Path(str(script)+'.tmp').read_bytes());Path(str(script)+'.tmp').unlink()
    manifest=ET.Element('manifest',{'xmlns:android':'http://schemas.android.com/apk/res/android','package':PRODUCT['android']['id'],'android:versionCode':str(PRODUCT['versionCode']),'android:versionName':VERSION})
    ET.SubElement(manifest,'uses-sdk',{'android:minSdkVersion':'26','android:targetSdkVersion':str(PRODUCT['android']['targetSdk'])})
    for permission in ['INTERNET','ACCESS_NETWORK_STATE','ACCESS_WIFI_STATE','CHANGE_WIFI_MULTICAST_STATE','MODIFY_AUDIO_SETTINGS','REQUEST_INSTALL_PACKAGES']:
        ET.SubElement(manifest,'uses-permission',{'android:name':'android.permission.'+permission})
    for feature in ['android.hardware.touchscreen','android.software.leanback']:ET.SubElement(manifest,'uses-feature',{'android:name':feature,'android:required':'false'})
    app=ET.SubElement(manifest,'application',{'android:label':PRODUCT['name'],'android:icon':'@drawable/tvmorph','android:banner':'@drawable/tvmorph_banner','android:allowBackup':'false','android:usesCleartextTraffic':'true','android:theme':'@android:style/Theme.Material.NoActionBar'})
    ET.SubElement(app,'provider',{'android:name':'local.tvmorph.tv.UpdateProvider','android:authorities':PRODUCT['android']['id']+'.updates','android:exported':'false','android:grantUriPermissions':'true'})
    entry=ET.SubElement(app,'activity',{'android:name':'local.morph.iptv.MainActivity','android:exported':'true','android:launchMode':'singleTask','android:screenOrientation':'landscape','android:configChanges':'keyboardHidden|orientation|screenSize'})
    intent=ET.SubElement(entry,'intent-filter');ET.SubElement(intent,'action',{'android:name':'android.intent.action.MAIN'})
    for category in ['LAUNCHER','LEANBACK_LAUNCHER']:ET.SubElement(intent,'category',{'android:name':'android.intent.category.'+category})
    for name in ['PlayerActivity','MultiViewActivity','ParentRemoteActivity','TimeUpActivity']:
        attrs={'android:name':'local.tvmorph.tv.'+name,'android:exported':'false','android:screenOrientation':'landscape','android:configChanges':'keyboardHidden|orientation|screenSize|smallestScreenSize|screenLayout'}
        if name=='PlayerActivity':attrs.update({'android:supportsPictureInPicture':'true','android:resizeableActivity':'true'})
        ET.SubElement(app,'activity',attrs)
    path=build/'AndroidManifest.xml';ET.ElementTree(manifest).write(path,encoding='utf-8',xml_declaration=True)
    res=build/'res';shutil.copytree(ROOT/'android-tv/res',res);stage_product_icon(res,standalone=True);stage_bridge_entry_background(res)
    unsigned=build/'unsigned.apk';jar,jars,resource_java=prepare(ROOT,build,path,assets,res,unsigned)
    classes=build/'classes';classes.mkdir();sources=list((ROOT/'android-tv/src').rglob('*.java'))+list((HERE/'src').rglob('*.java'))+[ROOT/'mobile-app/src/local/cleartv/mobile/LanHttp.java']+resource_java
    run([Path('C:/Program Files/Android/Android Studio/jbr/bin/javac.exe'),'-encoding','UTF-8','-source','8','-target','8','-classpath',';'.join(str(p) for p in [jar]+jars),'-d',classes,*sources])
    compiled=build/'compiled.jar'
    with zipfile.ZipFile(compiled,'w',zipfile.ZIP_DEFLATED) as z:
        for source in classes.rglob('*.class'):z.write(source,source.relative_to(classes).as_posix())
    dex=build/'dex';dex.mkdir();run(['C:/Program Files/Android/Android Studio/jbr/bin/java.exe','-cp',ROOT/'.tools/android/r8-8.3.37.jar','com.android.tools.r8.D8','--lib',jar,'--min-api','26','--output',dex,compiled,*jars])
    with zipfile.ZipFile(unsigned,'a',zipfile.ZIP_DEFLATED) as z:
        for source in dex.glob('*.dex'):z.write(source,source.name)
    target=OUTPUT/('Morph-IPTV-Android-TV-'+VERSION+'.apk');sign_android(build,unsigned,target);return target

def web_stage(platform):
    app=BUILD/platform/'app';clean_stage(app);stage_frontend(app/'iptv',media_root='../shared/',standalone=True);shared_style(app/'shared')
    for name in ['core.js','remote.js','tv-compat.js','m3u-source.js','player-chrome.js','player-chrome.css','samsung-cast-worker.js','playback-rate.js','clock-adjust.js','screen-fit.js']:
        shutil.copy2(ROOT/'tv-project/app'/name,app/name)
    shutil.copy2(ROOT/'mobile-app/assets/ui/locale.js',app/'locale.js')
    from PIL import Image
    Image.open(ROOT/'tv-project/app/assets/morph-iptv-icon.png').convert('RGBA').resize((512,512)).save(app/'icon.png')
    shutil.copy2(HERE/'shell.js',app/'shell.js')
    media=(ROOT/'mobile-app/samsung-media.js').read_text(encoding='utf-8')
    if platform=='webos':
        start=media.index(' function play(');end=media.index(' function action(',start);media=media[:start]+(ROOT/'webos-app/player.js').read_text(encoding='utf-8')+'\n'+media[end:]
        start=media.index(' function radio(id,url)',media.index(' function action('));end=media.index(' window.SamsungMedia=',start);media=media[:start]+media[end:]
        media=media.replace('SamsungMedia','MorphMedia').replace('morph.samsung.','morph.webos.')
        media=media.replace("frame.src=kind+'/index.html'", "frame.srcdoc=window.MorphLGMediaHTML[kind].replace('<head>','<head><base href=\"'+new URL(kind+'/',location.href).href+'\">')")
        shutil.copy2(ROOT/'webos-app/platform.js',app/'platform.js');shutil.copy2(ROOT/'.tools/webos-library/webOSTVjs-1.2.13/webOSTV.js',app/'webOSTV.js')
    else:media=media.replace('width:1920px;height:1080px','width:1920px;height:1080px')
    (app/'media.js').write_text(media,encoding='utf-8')
    bridge=(ROOT/'mobile-app/samsung-media-bridge.js').read_text(encoding='utf-8')
    if platform=='webos':bridge=bridge.replace('SamsungMedia','MorphMedia')
    (app/'iptv/platform-bridge.js').write_text(bridge,encoding='utf-8')
    html=app/'iptv/index.html';text=html.read_text(encoding='utf-8').replace('<script src="locale.js">','<script src="tv-compat.js"></script><script src="locale.js">').replace('<script src="app.js">','<script src="platform-bridge.js"></script><script src="app.js">')
    html.write_text(text,encoding='utf-8')
    if platform=='webos':(app/'media-html.js').write_text('window.MorphLGMediaHTML='+json.dumps({'iptv':text})+';',encoding='utf-8')
    scripts=['tv-compat.js','locale.js','core.js','remote.js','m3u-source.js','playback-rate.js','clock-adjust.js','player-chrome.js','screen-fit.js']
    if platform=='webos':scripts+=['webOSTV.js','platform.js','media-html.js']
    scripts+=['media.js','shell.js']
    external='<script src="$WEBAPIS/webapis/webapis.js"></script>' if platform!='webos' else ''
    (app/'index.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1920"><title>Morph IPTV</title><style>html,body{margin:0;background:#171e32;overflow:hidden;color:#f7f9ff}body{transform-origin:0 0}#toast{position:fixed;bottom:40px;left:25%;z-index:100;background:#26334a;padding:20px;font:24px Arial}</style><link rel="stylesheet" href="player-chrome.css">'+external+''.join('<script defer src="'+s+'"></script>' for s in scripts)+'</head><body><div id="toast" hidden></div></body></html>',encoding='utf-8')
    return app

def compile_web(app,target,legacy=False):
    for source in app.rglob('*.js'):
        if legacy:continue
        if source.name=='webOSTV.js':continue
        temp=source.with_suffix('.compiled');run([ESBUILD,source,'--target='+target,'--outfile='+str(temp),'--log-level=error']);source.write_bytes(temp.read_bytes());temp.unlink()
    if not legacy:
        # Match the embedded TV build: Chromium 56 (Tizen4) and older webOS
        # cannot lay out CSS Grid. tv-compat.js scopes these rules at runtime.
        from samsung_compat import fallback,lower_inset
        from guard import eight_digit_hex_to_rgba
        for source in app.rglob('*.css'):
            css=eight_digit_hex_to_rgba(lower_inset(source.read_text(encoding='utf-8')))
            if '/* Shared TV layout fallbacks */' not in css:
                css+='\n/* Shared TV layout fallbacks */\n'+fallback(css)
            source.write_text(css,encoding='utf-8')
    if legacy:
        # Use the same pinned polyfills, CSS lowering and ES5 gate as the embedded legacy builds.
        from build_polyfills import build as polyfill
        from samsung_compat import fallback,lower_inset
        from guard import eight_digit_hex_to_rgba,inject_compat
        from legacy_web import finish_legacy
        finish_legacy(ROOT,app,polyfill,fallback,lower_inset,eight_digit_hex_to_rgba,inject_compat)

def samsung(target):
    settings=PRODUCT['samsung'][target];app=web_stage(target)
    from samsung_compat import stage_samsung_ime
    stage_samsung_ime(app)
    config=(ROOT/'tv-project/app/config.xml').read_text(encoding='utf-8')
    config=config.replace('ClearTV001',settings['package']).replace('.Home','.Main').replace('<name>Morph Launcher</name>','<name>Morph IPTV</name><icon src="icon.png"/>')
    config=re.sub(r'required_version="[^"]+"','required_version="'+settings['required']+'"',config)
    config=re.sub(r'(<widget[^>]*\s)version="[^"]+"',lambda m:m[1]+'version="'+VERSION+'"',config)
    config=config.replace('https://local.example/clear-tv','https://morphtv.herroshetta.com/iptv').replace('</widget>','<access origin="*" subdomains="true"/></widget>');(app/'config.xml').write_text(config,encoding='utf-8')
    compile_web(app,'chrome56' if not settings['legacy'] else 'chrome47',settings['legacy'])
    from samsung_compat import stage_samsung_layout
    stage_samsung_layout(app)
    sdk=ROOT/'.tools/tizen/sdk/data';ide=sdk/'tools/ide';cp=';'.join([str(ide/'conf-ncli')]+[str(p) for p in (ide/'lib-ncli').glob('*.jar')])
    run([JAVA/'java.exe','-Dlog4j.configurationFile='+str(ide/'conf-ncli/log4j-info.xml'),'-cp',cp,'org.tizen.ncli.ide.shell.Main','package','-t','wgt','-s','ClearTV','--',app],cwd=ide/'bin')
    widget=app/'Morph IPTV.wgt';target_file=OUTPUT/('Morph-IPTV-'+target+'-'+VERSION+'.wgt');shutil.copy2(widget,target_file);return target_file

def webos():
    app=web_stage('webos');info=json.loads((ROOT/'webos-app/appinfo.json').read_text(encoding='utf-8'));info.update({'id':PRODUCT['webos']['id'],'version':VERSION,'title':'Morph IPTV','icon':'icon.png','largeIcon':'icon.png'});(app/'appinfo.json').write_text(json.dumps(info),encoding='utf-8');compile_web(app,'chrome53')
    run(['node',ROOT/'.tools/webos/node_modules/@webos-tools/cli/bin/ares-package.js',app,'-o',OUTPUT,'--no-minify'])
    return OUTPUT/(PRODUCT['webos']['id']+'_'+VERSION+'_all.ipk')

def main():
    OUTPUT.mkdir(parents=True,exist_ok=True);BUILD.mkdir(parents=True,exist_ok=True)
    targets=sys.argv[1:] or ['android','webos','tizen2','tizen3','tizen4','tizen5'];results=[]
    for target in targets:
        result=android() if target=='android' else webos() if target=='webos' else samsung(target)
        results.append({'target':target,'file':str(result.relative_to(ROOT)),'bytes':result.stat().st_size,'sha256':hashlib.sha256(result.read_bytes()).hexdigest()});print('BUILT',target,result.name,result.stat().st_size,flush=True)
    report=OUTPUT/'local-build.json';previous={}
    if report.exists():previous={row['target']:row for row in json.loads(report.read_text())['artifacts']}
    previous.update({row['target']:row for row in results})
    report.write_text(json.dumps({'product':PRODUCT,'artifacts':list(previous.values()),'published':False,'physicalTVVerified':False},indent=2),encoding='utf-8')

if __name__=='__main__':main()
