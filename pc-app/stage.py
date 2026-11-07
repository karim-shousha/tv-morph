"""Stage current canonical sources. Never build from another platform's generated copy."""
from pathlib import Path
import hashlib,json,re,shutil,sys
from PIL import Image

HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
sys.path.insert(0,str(ROOT))
from iptv_shared import stage_frontend,stage_brand_assets,stage_tv_fallback,UI_IMAGE_MASTERS,sync_brand_assets

# Synchronize shared helpers before copying the launcher, including on a first desktop build.
sync_brand_assets()
shutil.copy2(ROOT/"cleaner/files.cjs",HERE/"cleaner-files.cjs")
BUILD=HERE/'build'
UI=BUILD/'ui'
if UI.exists():
    assert UI.resolve()==(ROOT/'pc-app/build/ui').resolve()
    shutil.rmtree(UI)
UI.mkdir(parents=True)
version=json.loads((HERE/'package.json').read_text())['version']
excluded=set(json.loads((ROOT/'theme-packs/excluded.json').read_text()))|UI_IMAGE_MASTERS
excluded.discard('prayer-pause-v1.webp')
receipt=[]
for source in (ROOT/'tv-project/app').rglob('*'):
    if not source.is_file() or source.suffix.lower() not in {'.html','.js','.css','.json','.svg','.webp','.png','.jpg','.mp3','.woff2','.woff','.ttf','.txt'}:continue
    rel=source.relative_to(ROOT/'tv-project/app')
    if rel.parts[0]=='assets' and source.name in excluded:continue
    if source.name in {'tvmorph.png','sports.js','sports.css'} or source.name.startswith('sports-hero-'):continue
    target=UI/rel
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,target)
    receipt.append({'source':source.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
stage_brand_assets(UI)
stage_tv_fallback(UI)
stage_frontend(UI/'iptv',media_root='../',sync_branding=False)
for suffix in ['js','css']:
    source=ROOT/'android-tv/iptv'/('matches-shared.'+suffix)
    shutil.copy2(source,UI/('matches.'+suffix))
    receipt.append({'source':source.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
shutil.copytree(ROOT/'android-tv/radio',UI/'radio',ignore=shutil.ignore_patterns('*.cjs','*-preview.png'))
for directory in [UI,UI/'iptv',UI/'radio']:
    shutil.copy2(ROOT/'mobile-app/assets/ui/locale.js',directory/'locale.js')
for name in ['desktop.js','desktop-frame.js','desktop.css','network.js','media-engine.js']:
    shutil.copy2(HERE/name,UI/name)
shutil.copy2(HERE/'desktop-network.js',UI/'network/desktop-network.js')
p=UI/'network/index.html'
network=p.read_text(encoding='utf-8').replace('<head>','<head><script src="../network.js"></script><script src="desktop-network.js"></script>',1)
network=network.replace('<script src="ui.js">','<script src="../vendor/hls.min.js"></script><script src="../vendor/mpegts.js"></script><script src="../media-engine.js"></script><script src="ui.js">')
p.write_text(network,encoding='utf-8')
for name in ['hls.js','mpegts.js']:
    source=HERE/'node_modules'/name/'dist'/('hls.min.js' if name=='hls.js' else 'mpegts.js')
    shutil.copy2(source,UI/'vendor'/source.name)
    license_file=HERE/'node_modules'/name/'LICENSE'
    if license_file.exists():shutil.copy2(license_file,UI/'vendor'/(name+'-LICENSE.txt'))
with (UI/'style.css').open('a',encoding='utf-8') as css:
    css.write('\n'+(ROOT/'android-tv/home-shelves.css').read_text(encoding='utf-8'))
# Reserve real viewport space for desktop navigation, outside the scaled TV canvas.
p=UI/'screen-fit.js'
fit=p.read_text(encoding='utf-8')
# Canonical screen-fit.js reserves desktop toolbar space and uses real CSS pixels.
p.write_text(fit,encoding='utf-8')

html=(UI/'index.html').read_text(encoding='utf-8')
html=html.replace('<head>','<head><script src="network.js"></script>',1)
html=html.replace('<body data-theme=',f'<body id="morph-desktop" data-fixed-layout="true" data-desktop="true" data-platform="windows" data-build-version="{version}-pc" data-theme=',1)
html=html.replace('<script defer src="core.js">','<script defer src="locale.js"></script><script defer src="core.js">')
html=html.replace('<script defer src="app.js">','<script defer src="desktop-catalog.js"></script><script defer src="app.js">')
html=html.replace('<script defer src="developer-credit.js"></script>','')
html=html.replace('</body>','<script defer src="vendor/hls.min.js"></script><script defer src="vendor/mpegts.js"></script><script defer src="media-engine.js"></script><script defer src="desktop-media.js"></script><script defer src="desktop-frame.js"></script><script defer src="samsung-locks.js"></script><script defer src="desktop.js"></script><link rel="stylesheet" href="desktop.css"><script defer src="developer-credit.js"></script></body>')
(UI/'index.html').write_text(html,encoding='utf-8')
shutil.copy2(HERE/'desktop-catalog.js',UI/'desktop-catalog.js')
shutil.copy2(ROOT/'mobile-app/samsung-locks.js',UI/'samsung-locks.js')

# The shared provider/account adapter remains unchanged. Only transport and playback
# are composed here, matching LG's use of this same catalog and HTML5 player.
media=(ROOT/'mobile-app/samsung-media.js').read_text(encoding='utf-8')
from player_stage import compose_player
media=compose_player(ROOT,media)
start=media.index(' function radio(id,url)',media.index(' function action('))
end=media.index(' window.SamsungMedia=',start)
media=media[:start]+media[end:]
media=media.replace('morph.samsung.','morph.pc.')
# Keep the shared TV exit-on-hide policy out of desktop builds.
# Match the callback prefix, not a regex that fails on nested closing braces.
visibility="document.addEventListener('visibilitychange',function(){"
assert media.count(visibility)==1, 'Shared media visibility hook changed: review desktop background policy'
media=media.replace(visibility,visibility+"if(document.body.hasAttribute('data-desktop'))return;",1)
(UI/'desktop-media.js').write_text(media,encoding='utf-8')

for folder in ['iptv','radio']:
    dest=UI/folder
    bridge=(ROOT/'mobile-app/samsung-media-bridge.js').read_text(encoding='utf-8').replace('morph.radio.favorites','morph.pc.radio.favorites')
    if folder=='radio':bridge='window.SamsungStations='+(ROOT/'android-tv/radio/stations.json').read_text(encoding='utf-8')+';\n'+bridge
    bridge+='\nwindow.MorphPCDesktop=true;\n'
    (dest/'desktop-bridge.js').write_text(bridge,encoding='utf-8')
    p=dest/'index.html'
    text=p.read_text(encoding='utf-8').replace('<head>','<head><script src="../network.js"></script><script src="desktop-bridge.js"></script>',1)
    text=text.replace('../tv/','../')
    # Mouse/physical keyboard edition uses native form fields, not remote keyboards.
    if folder=='iptv':
        text=text.replace('<script src="account-keyboard.js"></script>','<script src="desktop-input.js"></script>')
        shutil.copy2(HERE/'desktop-input.js',dest/'desktop-input.js')
    text=text.replace('</body>','<link rel="stylesheet" href="../desktop.css"></body>')
    p.write_text(text,encoding='utf-8')
    for staged in dest.rglob('*'):
        if staged.is_file() and staged.suffix in {'.css','.js'}:
            code=staged.read_text(encoding='utf-8')
            if '../tv/' in code:staged.write_text(code.replace('../tv/','../'),encoding='utf-8')

# A review must load matching HTML, styles and scripts after source updates.
# Keep identity stable while giving changed local UI assets a new cache key.
from urllib.parse import urlsplit
for page in UI.rglob('*.html'):
    def version_asset(match):
        value=match.group(2)
        url=urlsplit(value)
        if url.scheme or url.netloc or not url.path:return match.group(0)
        asset=(page.parent/url.path).resolve()
        if not asset.is_relative_to(UI.resolve()) or not asset.is_file() or asset.suffix not in {'.js','.css','.webp'}:return match.group(0)
        version=hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
        return match.group(1)+'="'+url.path+'?v='+version+('\\#'+url.fragment if url.fragment else '')+'"'
    page.write_text(re.sub(r'(src|href)="([^"]+)"',version_asset,page.read_text(encoding='utf-8')),encoding='utf-8')

Image.open(ROOT/'tv-project/app/assets/morph-launcher-icon.png').convert('RGBA').save(BUILD/'icon.ico',sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
Image.open(ROOT/'tv-project/app/assets/morph-launcher-icon.png').convert('RGBA').save(BUILD/'icon.icns')
(BUILD/'source-receipt.json').write_text(json.dumps({'version':version,'launcherCanonical':'tv-project/app','iptvCanonical':'android-tv/iptv','providerAdapter':'mobile-app/samsung-media.js','playback':'webos-app/player.js','files':receipt},indent=2),encoding='utf-8')
print('Staged Morph Launcher PC '+version+' from current canonical sources.')

# Shared approved presentation is composed after desktop transport/startup.
from launcher_visual import stage_launcher_visual
stage_launcher_visual(UI)


# Desktop uses the canonical iframe owner with its native LAN adapter.
# Do not mount the second TV reference host over that owner.
p=UI/'reference.js'
text=p.read_text(encoding='utf-8')
needle="function mount(){if(w.TVNative)return;var origin,layer;"
assert text.count(needle)==1, 'Review DLNA desktop composition after reference host changes'
p.write_text(text.replace(needle,"function mount(){if(w.TVNative||document.body.hasAttribute('data-desktop'))return;var origin,layer;",1),encoding='utf-8')
