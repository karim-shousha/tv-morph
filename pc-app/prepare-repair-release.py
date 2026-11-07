"""Build a focused desktop repair from the published host, without pending UI redesign changes."""
from pathlib import Path
import hashlib,json,shutil,zipfile,sys
from player_stage import compose_player
import importlib.util
_art_spec=importlib.util.spec_from_file_location("installer_artwork",Path(__file__).with_name("installer-artwork.py"));_art=importlib.util.module_from_spec(_art_spec);_art_spec.loader.exec_module(_art)
HERE=Path(__file__).resolve().parent;ROOT=HERE.parent
base=HERE/'stable-host-source/published-runtime.zip';dest=HERE/'stable-host-source/release';dest.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(base) as z:
 for member in z.infolist():
  target=(dest/member.filename).resolve();assert target.is_relative_to(dest.resolve())
  if not member.is_dir():target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(member))
# The frontend stays at the published shared source revision. Repairs are in shared player/transport and desktop wrapper sources.
replacements={
 'build/ui/contact.js':ROOT/'tv-project/app/contact.js',
 'build/ui/brand-loader.js':ROOT/'tv-project/app/brand-loader.js',
 'build/ui/packs-tv.js':ROOT/'tv-project/app/packs-tv.js',
 'build/ui/theme-preview.css':ROOT/'tv-project/app/theme-preview.css',
 'vpn.cjs':HERE/'vpn.cjs','main.cjs':HERE/'main.cjs','preload.cjs':HERE/'preload.cjs','lan.cjs':HERE/'lan.cjs','matches.cjs':HERE/'matches.cjs',
 'build/ui/weather.js':ROOT/'tv-project/app/weather.js',
 'build/ui/matches.css':ROOT/'android-tv/iptv/matches-shared.css',
 'build/ui/performance.js':ROOT/'tv-project/app/performance.js',
 'build/ui/matches.js':ROOT/'android-tv/iptv/matches-shared.js',
 'build/ui/network.js':HERE/'network.js','build/ui/media-engine.js':HERE/'media-engine.js',
 'build/ui/desktop-media.js':HERE/'build/ui/desktop-media.js',
 'build/ui/player-chrome.js':ROOT/'tv-project/app/player-chrome.js','build/ui/player-chrome.css':ROOT/'tv-project/app/player-chrome.css',
 'build/ui/plus.js':ROOT/'tv-project/app/plus.js','build/ui/plus-tv.js':ROOT/'tv-project/app/plus-tv.js',

 'build/ui/desktop-frame.js':HERE/'desktop-frame.js',
 'build/ui/desktop.js':HERE/'desktop.js',
 'build/ui/iptv/stream-ui.js':ROOT/'android-tv/iptv/stream-ui.js',
 'build/ui/app-timers.js':ROOT/'mobile-app/samsung-locks.js',
 'build/ui/home-summary.css':ROOT/'tv-project/app/home-summary.css',
 'build/ui/home-summary.js':ROOT/'tv-project/app/home-summary.js',
 'build/ui/desktop-support.js':ROOT/'tv-project/app/desktop-support.js',
 'build/ui/usb.css':ROOT/'tv-project/app/usb.css',
 'build/ui/usb-media.js':ROOT/'tv-project/app/usb-media.js',
 'build/ui/media-app.js':ROOT/'tv-project/app/media-app.js',
 'build/ui/settings-fit.css':ROOT/'tv-project/app/settings-fit.css',
 'build/ui/settings-fit.js':ROOT/'tv-project/app/settings-fit.js',
 'build/ui/settings-nav.js':ROOT/'tv-project/app/settings-nav.js',
 'build/ui/focus.js':ROOT/'tv-project/app/focus.js',
 'build/ui/prayer.js':ROOT/'tv-project/app/prayer.js',
 'build/ui/settings-nav.js':ROOT/'tv-project/app/settings-nav.js',
 'build/ui/focus.js':ROOT/'tv-project/app/focus.js',
 'build/ui/developer-credit.js':ROOT/'android-tv/iptv/developer-credit.js',
 'build/ui/plus-feature-labels.js':ROOT/'android-tv/iptv/plus-feature-labels.js',
 'build/ui/plus.css':ROOT/'tv-project/app/plus.css',
}
for rel,src in replacements.items():shutil.copy2(src,dest/rel)
# Keep the approved host layout, but update its retained About credit/version.
about=dest/'build/ui/app.js';value=about.read_text(encoding='utf-8');value=value.replace("'Developed by Karim Aboushousha'","'Developed by Karim Aboushousha & Hassan Shehata'");value=value.replace("'Version 0.8.68 ·", "'Version '+(document.body.getAttribute('data-build-version')||'1.1.308')+' ·");about.write_text(value,encoding='utf-8')

sys.path.insert(0,str(ROOT))
from iptv_shared import stage_frontend
stage_frontend(dest/'build/ui/iptv',media_root='../',sync_branding=False)
p=dest/'build/ui/iptv/index.html';s=p.read_text(encoding='utf-8').replace('<head>','<head><script src="../network.js"></script><script src="desktop-bridge.js"></script>',1).replace('../tv/','../').replace('<script src="account-keyboard.js"></script>','<script src="desktop-input.js"></script>').replace('</body>','<link rel="stylesheet" href="../desktop.css"></body>');p.write_text(s,encoding='utf-8')
shutil.copy2(HERE/'desktop-input.js',dest/'build/ui/iptv/desktop-input.js')
for source in (dest/'build/ui/iptv').glob('*'):
 if source.suffix in {'.js','.css'}:source.write_text(source.read_text(encoding='utf-8').replace('../tv/','../'),encoding='utf-8')
p=dest/'build/ui/desktop-media.js';p.write_text(compose_player(ROOT,p.read_text(encoding='utf-8')),encoding='utf-8')
p=dest/'build/ui/iptv/desktop-bridge.js';p.write_text((ROOT/'mobile-app/samsung-media-bridge.js').read_text(encoding='utf-8').replace('morph.radio.favorites','morph.pc.radio.favorites')+'\nwindow.MorphPCDesktop=true;\n',encoding='utf-8')
# Preserve every published Home layout rule; append only the scoped fullscreen repair.
css=HERE/'desktop.css';marker='/* Playback must use the physical viewport'
text=css.read_text(encoding='utf-8');assert marker in text
p=dest/'build/ui/desktop.css';p.write_text(p.read_text(encoding='utf-8')+'\n'+text[text.index(marker):],encoding='utf-8')
p=dest/'build/ui/index.html';s=p.read_text(encoding='utf-8').replace('0.1.0-pc','1.1.308-pc').replace('MORPH TV 0.8.68','MORPH LAUNCHER 1.1.308');s=s.replace('<script defer src="desktop.js"></script>','<script defer src="desktop-frame.js"></script><script defer src="desktop.js"></script><script defer src="app-timers.js"></script>');s=s.replace('</body>','<script defer src="media-app.js"></script><script defer src="desktop-support.js"></script><link rel="stylesheet" href="home-summary.css"><script defer src="home-summary.js"></script><link rel="stylesheet" href="settings-fit.css"><script defer src="settings-fit.js"></script><script defer src="developer-credit.js"></script><script defer src="plus-feature-labels.js"></script></body>');p.write_text(s,encoding='utf-8')
package=json.loads((dest/'package.json').read_text());package['version']='1.1.308';_art.render(dest/'build');package['build']['nsis'].update({'installerSidebar':'build/installerSidebar.bmp','uninstallerSidebar':'build/installerSidebar.bmp','installerHeader':'build/installerHeader.bmp'});package['build']['files']=list(dict.fromkeys(package['build']['files']+['vpn.cjs']));package['scripts']={'start':'electron .','test':'node tests/vpn-unit.cjs && node tests/desktop.cjs && node tests/parental.cjs && node tests/live-urls.cjs && node tests/tracks.cjs'}
(dest/'package.json').write_text(json.dumps(package,indent=2),encoding='utf-8')
for name in ['vpn-unit.cjs','desktop.cjs','tracks.cjs','trailer.cjs','final-layout.cjs','parental.cjs','live-urls.cjs']:
 (dest/'tests').mkdir(exist_ok=True);shutil.copy2(HERE/'tests'/name,dest/'tests'/name)
lock=dest/'package-lock.json'
if lock.exists():
 data=json.loads(lock.read_text());data['version']=package['version']
 if '' in data.get('packages',{}):data['packages']['']['version']=package['version']
 lock.write_text(json.dumps(data,indent=2),encoding='utf-8')
receipt={'version':'1.1.308','publishedHostCommit':'45a7cf54bd24db56447c00b210f9b9eb35929d93','publishedHostArchiveSha256':hashlib.sha256(base.read_bytes()).hexdigest(),'repairs':{rel:hashlib.sha256((dest/rel).read_bytes()).hexdigest() for rel in replacements},'homeLayout':'unchanged published host; only fullscreen styles appended','published':False}
(dest/'repair-source.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8')
print('Staged final1.1.308 repairs with the published stable Home UI; no account data included.')

# Canonical public origin also applies to retained host files from the approved archive.
for asset in dest.rglob('*'):
 if asset.is_file() and not any(part in ['node_modules','test-output'] for part in asset.relative_to(dest).parts) and asset.suffix in ['.js','.cjs','.html','.json','.css']:
  value=asset.read_text(encoding='utf-8');updated=value
  for host in ['morphtv.herroshetta.com','tvmorph.zainbot.com','morphtv.zainbot.com']:updated=updated.replace(host,'morph-tv.com')
  if updated!=value:asset.write_text(updated,encoding='utf-8')
