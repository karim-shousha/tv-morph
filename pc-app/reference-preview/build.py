"""Build an isolated visual review from a preserved launcher snapshot."""
from pathlib import Path
import hashlib,json,re,shutil

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
BASE=ROOT/'output/launcher-before-gold-preview'
DEST=ROOT/'output/gold-reference-preview/ui'
if not BASE.exists():
    BASE.mkdir(parents=True)
    shutil.copytree(ROOT/'pc-app/build/ui',BASE/'ui')
    for name in ['main.cjs','package.json','stage.py']:
        shutil.copy2(ROOT/'pc-app'/name,BASE/name)
    files={str(p.relative_to(BASE/'ui')):hashlib.sha256(p.read_bytes()).hexdigest() for p in (BASE/'ui').rglob('*') if p.is_file()}
    (BASE/'preserved.json').write_text(json.dumps({'purpose':'Restore the user-approved current launcher before gold visual preview','files':files},indent=2),encoding='utf-8')
shutil.copytree(BASE/'ui',DEST,dirs_exist_ok=True)
VISUAL=ROOT/'tv-project/visual-system'
shutil.copytree(VISUAL/'assets',DEST/'reference-assets',dirs_exist_ok=True)
for name in ['reference.css','reference.js','navigation-sound.js','settings-reference.css','settings-reference.js','reference-theme.js','surfaces-reference.css','bridge-reference.css','bridge-reference.js','radio-reference.css','radio-reference.js','themes-reference.css','themes-reference.js','network-reference.css','network-reference.js','settings-expand.js']:
    shutil.copy2(VISUAL/name,DEST/name)
p=DEST/'index.html'
html=p.read_text(encoding='utf-8').replace('</body>','<link rel="stylesheet" href="reference.css"><script defer src="reference-theme.js"></script><script defer src="reference.js"></script><script defer src="navigation-sound.js"></script><link rel="stylesheet" href="settings-reference.css"><link rel="stylesheet" href="surfaces-reference.css"><link rel="stylesheet" href="themes-reference.css"><script defer src="settings-reference.js"></script><script defer src="themes-reference.js"></script><script defer src="settings-expand.js"></script></body>')
p.write_text(html,encoding='utf-8')
p=DEST/'radio/index.html'
html=p.read_text(encoding='utf-8').replace('</body>','<link rel="stylesheet" href="../radio-reference.css"><script src="../radio-reference.js"></script></body>')
p.write_text(html,encoding='utf-8')
p=DEST/'network/index.html'
html=p.read_text(encoding='utf-8').replace('</body>','<link rel="stylesheet" href="../network-reference.css"><script src="../reference-theme.js"></script><script src="../network-reference.js"></script></body>')
p.write_text(html,encoding='utf-8')
# The receiver uses the same preview palette and artwork, isolated from production sources.
p=DEST/'bridge-receiver/index.html'
html=p.read_text(encoding='utf-8').replace('</head>','<link rel="stylesheet" href="../bridge-reference.css"></head>').replace('</body>','<script src="../bridge-reference.js"></script></body>')
p.write_text(html,encoding='utf-8')
# Extend the shared focus candidates only in this preview, retaining the existing engine.
p=DEST/'focus.js'
text=p.read_text(encoding='utf-8').replace("'#home-continue,.home-tools,","'#reference-cards,#reference-card-controls,#home-continue,.home-tools,")
text=text.replace("current.id==='viewer-button'","current.id==='viewer-button'&&!current.closest('.home-tools')")
text=text.replace('  var current=document.activeElement;', '''  var current=document.activeElement;
  if(scope===document&&!modalOpen()&&activeViewId()==='view-home'&&current&&document.body.hasAttribute('data-reference-preview')){
   var row=code===40&&current.closest('#reference-cards')?'#favourites':code===38&&current.closest('#favourites')?'#reference-cards':null;
   if(row){var origin=rect(current),nearest=null,gap=Infinity;Array.prototype.forEach.call(document.querySelectorAll(row+' button:not([disabled])'),function(node){if(!stateVisible(node))return;var box=rect(node);if(!box.w)return;var distance=Math.abs(box.x-origin.x);if(distance<gap){gap=distance;nearest=node;}});if(nearest){focus(nearest);return;}}
  }''')
p.write_text(text,encoding='utf-8')
# Keep the existing two-layer slideshow, with the reference image first.
p=DEST/'app.js'
text=p.read_text(encoding='utf-8').replace("if(builtinNight)images=['assets/launcher-main-background-v1.webp'", "if(builtinNight)images=['reference-assets/background.webp','assets/launcher-main-background-v1.webp'")
p.write_text(text,encoding='utf-8')
shutil.copy2(ROOT/'pc-app/desktop-network.js',DEST/'network/desktop-network.js')
# Merge text/icon options into Home, preserving the original settings controls.
p=DEST/'settings-nav.js'
text=p.read_text(encoding='utf-8').replace("appearance:['#setting-header-size','#setting-text-size-ar','#setting-text-size-en','#setting-dock-size']", "appearance:[]").replace("home:['#setting-home-fitness'", "home:['#setting-header-size','#setting-text-size-ar','#setting-text-size-en','#setting-dock-size','#setting-home-fitness'").replace("function open(key,enter){", "function open(key,enter){if(key==='appearance')key='home';")
p.write_text(text,encoding='utf-8')
p=DEST/'home-refinements.js'
text=p.read_text(encoding='utf-8').replace("function fitOptionalRows(){", "function fitOptionalRows(){if(document.body.hasAttribute('data-reference-preview')){if(inputRow)inputRow.style.setProperty('top','810px','important');return;}")
p.write_text(text,encoding='utf-8')
p=DEST/'samsung-locks.js'
text=p.read_text(encoding='utf-8').replace("overlay=C.el('div','overlay'),panel=", "overlay=C.el('div','overlay reference-parent-dialog'),panel=").replace("function close(){overlay.remove();", "function close(){if(!overlay.isConnected)return;overlay.remove();").replace("e.keyCode===27||e.keyCode===10009", "[4,27,461,10009].indexOf(e.keyCode)>=0").replace("cancel.onclick=close;", "cancel.classList.add('reference-parent-close');cancel.onclick=close;")
p.write_text(text,encoding='utf-8')
p=DEST/'launcher-chrome.js'
text=p.read_text(encoding='utf-8').replace("C.back=function(){if(overlay){close();return;}", "C.back=function(){if(overlay){var form=overlay.querySelector('.launcher-profile-form');if(form&&!form.hidden){var buttons=form.querySelectorAll('button');if(buttons.length){buttons[buttons.length-1].click();return;}}close();return;}")
p.write_text(text,encoding='utf-8')
# Full account dialogs must not be squeezed into anchored setting menus.
p=DEST/'inline-menu.js'
text=p.read_text(encoding='utf-8').replace("node===layer||node.id==='launcher-profiles'", "node===layer||node.classList.contains('reference-inline-expanded')||node.classList.contains('reference-parent-dialog')||node.classList.contains('morph-plus-overlay')||node.id==='prayer-settings-overlay'||node.id==='launcher-profiles'")
p.write_text(text,encoding='utf-8')
# Refresh CSS image URLs too: the user edits shared backgrounds in place.
for p in DEST.rglob('*.css'):
    def stamp_image(m):
        url=m[2].split('?')[0]
        if ':' in url or url.startswith('//'):return m[0]
        asset=(p.parent/url).resolve()
        if not asset.is_relative_to(DEST.resolve()) or not asset.is_file() or asset.suffix!='.webp':return m[0]
        return 'url('+m[1]+url+'?v='+hashlib.sha256(asset.read_bytes()).hexdigest()[:12]+m[1]+')'
    p.write_text(re.sub(r'''url\((['"]?)([^)'"\s]+)\1\)''',stamp_image,p.read_text(encoding='utf-8')),encoding='utf-8')
# Content hashes prevent a running review from mixing old and new assets.
for p in DEST.rglob('*.html'):
    def stamp(m):
        url=m[2].split('?')[0]
        if ':' in url or url.startswith('//'):return m[0]
        asset=(p.parent/url).resolve()
        if not asset.is_relative_to(DEST.resolve()) or not asset.is_file() or asset.suffix not in {'.css','.js','.webp'}:return m[0]
        return m[1]+'="'+url+'?v='+hashlib.sha256(asset.read_bytes()).hexdigest()[:12]+'"'
    p.write_text(re.sub(r'(src|href)="([^"]+)"',stamp,p.read_text(encoding='utf-8')),encoding='utf-8')
print('Preview:',DEST)
print('Preserved current UI:',BASE/'ui')
