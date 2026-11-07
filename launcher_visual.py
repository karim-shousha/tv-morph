"""Shared approved launcher presentation. Never replaces native catalog/playback adapters."""
from pathlib import Path
import hashlib,json,re,shutil
from launcher_css_compat import selector_fallbacks
ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'tv-project/visual-system'
FILES='reference.css reference.js settings-reference.css settings-reference.js reference-theme.js surfaces-reference.css bridge-reference.css bridge-reference.js themes-reference.css themes-reference.js network-reference.css network-reference.js settings-expand.js focus-reference.css focus-reference.js'.split()
# Keep editable references and retired card variants out of installed applications.
RUNTIME_ASSETS=('main-mountains-wave-v1.webp','bridge-background-v2.webp', 'bridge-devices-v2.webp', 'home-prayer-card-v1.webp', 'home-matches-card-v1.webp', 'program-card-iptv-v4.webp', 'program-card-media-v4.webp', 'program-card-bridge-v4.webp', 'program-card-radio-v4.webp', 'program-card-themes-v4.webp')
def stage_launcher_visual(destination, radio=None):
    DEST=Path(destination)
    if (DEST/'reference.js').exists():return
    radio=Path(radio) if radio else DEST/'radio'
    radio_prefix='../tv/' if radio.parent==DEST.parent else '../'
    artwork=DEST/'reference-assets'
    artwork.mkdir(parents=True,exist_ok=True)
    for name in RUNTIME_ASSETS:shutil.copy2(SOURCE/'assets'/name,artwork/name)
    for source in (SOURCE/'assets').iterdir():
        if source.is_file() and source.name not in RUNTIME_ASSETS:
            (artwork/source.name).unlink(missing_ok=True)
    for name in FILES:shutil.copy2(SOURCE/name,DEST/name)
    # Header-only derivative: keep the editable master intact, decode a small
    # transparent bitmap at runtime instead of a 1024px image for a 74px mark.
    symbol=DEST/'assets/morph-header-symbol.webp'
    if symbol.exists():
        from PIL import Image
        with Image.open(symbol) as original:
            if max(original.size)>256:
                header=original.convert('RGBA')
                header.thumbnail((256,256),Image.Resampling.LANCZOS)
                header.save(symbol,format='WEBP',lossless=True)
    p=DEST/'index.html'
    html=p.read_text(encoding='utf-8').replace('<html ', '<html data-morph-presentation="reference" ',1).replace('</body>','<link rel="stylesheet" href="reference.css"><script defer src="reference-theme.js"></script><script defer src="reference.js"></script><link rel="stylesheet" href="settings-reference.css"><link rel="stylesheet" href="surfaces-reference.css"><link rel="stylesheet" href="themes-reference.css"><script defer src="settings-reference.js"></script><script defer src="themes-reference.js"></script><script defer src="settings-expand.js"></script></body>')
    p.write_text(html,encoding='utf-8')
    p=radio/'index.html'
    # The radio ships its final DOM and one stylesheet. Never mount the old
    # cinematic/premium shells before the current presentation.
    html=p.read_text(encoding='utf-8').replace('</head>',f'<script src="{radio_prefix}club-themes.js"></script><script src="{radio_prefix}ui/theme-adapter.js"></script><script src="{radio_prefix}reference-theme.js"></script></head>')
    html=html.replace('../tv/',radio_prefix)
    p.write_text(html,encoding='utf-8')
    css=radio/'radio.css'
    css.write_text(css.read_text(encoding='utf-8').replace('../tv/',radio_prefix),encoding='utf-8')
    for name in ['style.css','radio-layout.css','cinematic-radio.css','cinematic-theme.js','premium-radio.css','premium-radio.js','media-theme.js']:
        (radio/name).unlink(missing_ok=True)
    p=DEST/'network/index.html'
    # The older TV-only shell rearranges the same DOM before this presentation
    # mounts. Keep NetworkUI and adapters; use exactly one layout owner.
    html=p.read_text(encoding='utf-8')
    html=re.sub(r'<script src="premium-network\.js(?:\?[^"]*)?"></script>','',html)
    html=re.sub(r'<link rel="stylesheet" href="premium-network\.css(?:\?[^"]*)?">','',html)
    html=html.replace('<html lang=', '<html id="reference-network" lang=')
    html=html.replace('</head>','<link rel="stylesheet" href="../network-reference.css"></head>')
    html=html.replace('</body>','<script src="../club-themes.js"></script><script src="../ui/theme-adapter.js"></script><script src="../reference-theme.js"></script><script src="../network-reference.js"></script></body>')
    p.write_text(html,encoding='utf-8')
    for name in ['premium-network.js','premium-network.css']:
        (DEST/'network'/name).unlink(missing_ok=True)
    # The receiver uses the same preview palette and artwork, isolated from production sources.
    p=DEST/'bridge-receiver/index.html'
    html=p.read_text(encoding='utf-8').replace('src="bridge-connect-hero-v1.webp"','src="../reference-assets/bridge-devices-v2.webp"').replace('</head>','<link rel="stylesheet" href="../bridge-reference.css"></head>').replace('</body>','<script src="../club-themes.js"></script><script src="../ui/theme-adapter.js"></script><script src="../reference-theme.js"></script><script src="../bridge-reference.js"></script></body>')
    p.write_text(html,encoding='utf-8')
    (DEST/'bridge-receiver/bridge-connect-hero-v1.webp').unlink(missing_ok=True)
    # Extend the shared focus candidates only in this preview, retaining the existing engine.
    p=DEST/'focus.js'
    text=p.read_text(encoding='utf-8').replace("'#home-continue,.home-tools,","'#reference-cards,#reference-card-controls,#home-continue,.home-tools,")
    text=text.replace("C.DockArrow&&C.DockArrow(code,current)","C.DockArrow&&C.DockArrow(code,current)")
    text=text.replace("current.id==='viewer-button'","current.id==='viewer-button'&&!current.closest('.home-tools')")
    text=text.replace('  var current=document.activeElement;', '''  var current=document.activeElement;
      if(scope===document&&!modalOpen()&&activeViewId()==='view-home'&&current&&document.body.hasAttribute('data-reference-preview')){
       var row=code===40&&current.closest('#reference-cards')?'#favourites':code===38&&current.closest('#favourites')?'#reference-cards':code===38&&current.closest('#reference-cards')?'#home-input-row':code===40&&current.closest('#home-input-row')?'#reference-cards':null;
       if(row){var origin=rect(current),nearest=null,gap=Infinity;Array.prototype.forEach.call(document.querySelectorAll(row+' button:not([disabled])'),function(node){if(!stateVisible(node))return;var box=rect(node);if(!box.w)return;var distance=Math.abs(box.x-origin.x);if(distance<gap){gap=distance;nearest=node;}});if(nearest){focus(nearest);return;}}
      }''')
    p.write_text(text,encoding='utf-8')
    # Artwork/license refresh must not hold a usable Home behind a long cover.
    p=DEST/'boot-theme.js'
    text=p.read_text(encoding='utf-8').replace('},5000);','},1600);').replace('},7000);','},2500);')
    p.write_text(text,encoding='utf-8')
    # Keep the existing two-layer slideshow, with the reference image first.
    p=DEST/'ui/ui-mode.js'
    text=p.read_text(encoding='utf-8').replace("uiAccent:tokens['--ui-focus-ring']", "uiAccent:tokens['--ui-accent']")
    p.write_text(text,encoding='utf-8')
    p=DEST/'app.js'
    text=p.read_text(encoding='utf-8').replace("document.getElementById('refresh-apps').onclick=function(){loadApps(true);","document.getElementById('refresh-apps').onclick=function(){if(window.TVNative&&TVNative.invalidateApps)TVNative.invalidateApps();loadApps(true);")
    p.write_text(text,encoding='utf-8')
    
    # Keep text/icon controls directly accessible in their dedicated category.
    p=DEST/'settings-nav.js'
    text=p.read_text(encoding='utf-8')
    text=text.replace("launcher:['#pc-startup']", "launcher:['#pc-startup','#setting-startup','#setting-boot','#setting-quick-return']")
    p.write_text(text,encoding='utf-8')
    p=DEST/'home-refinements.js'
    text=p.read_text(encoding='utf-8').replace("function fitOptionalRows(){", "function fitOptionalRows(){if(document.body.hasAttribute('data-reference-preview')){if(inputRow)inputRow.style.setProperty('top','530px','important');return;}")
    p.write_text(text,encoding='utf-8')
    for lock_file in ['samsung-locks.js','lg-locks.js']:
        p=DEST/lock_file
        if not p.exists():continue
        text=p.read_text(encoding='utf-8').replace("overlay=C.el('div','overlay'),panel=", "overlay=C.el('div','overlay reference-parent-dialog'),panel=").replace("function close(){overlay.remove();", "function close(){if(!overlay.isConnected)return;overlay.remove();").replace("e.keyCode===27||e.keyCode===10009", "[4,27,461,10009].indexOf(e.keyCode)>=0").replace("cancel.onclick=close;", "cancel.classList.add('reference-parent-close');cancel.onclick=close;")
        p.write_text(text,encoding='utf-8')
    p=DEST/'launcher-chrome.js'
    text=p.read_text(encoding='utf-8').replace("C.back=function(){if(overlay){close();return;}", "C.back=function(){if(overlay){var form=overlay.querySelector('.launcher-profile-form');if(form&&!form.hidden){var buttons=form.querySelectorAll('button');if(buttons.length){buttons[buttons.length-1].click();return;}}close();return;}")
    p.write_text(text,encoding='utf-8')
    # Full account dialogs must not be squeezed into anchored setting menus.
    p=DEST/'inline-menu.js'
    text=p.read_text(encoding='utf-8').replace("node===layer||node.id==='launcher-profiles'", "node===layer||node.classList.contains('reference-inline-expanded')||node.classList.contains('reference-parent-dialog')||node.classList.contains('morph-plus-overlay')||node.id==='prayer-settings-overlay'||node.id==='launcher-profiles'")
    p.write_text(text,encoding='utf-8')
    # Bridge owns its remote focus and button contrast. Launcher-wide focus
    # selectors override its selected buttons and can hide dark labels on navy.
    for entry in [DEST/'index.html',radio/'index.html',DEST/'network/index.html']:
        prefix='' if entry.parent==DEST else radio_prefix if entry.parent==radio else '../'
        html=entry.read_text(encoding='utf-8').replace('</body>',f'<link rel="stylesheet" href="{prefix}focus-reference.css"><script defer src="{prefix}focus-reference.js"></script></body>')
        entry.write_text(html,encoding='utf-8')
    # Every TV service consumes one control-motion implementation. Player DOM is excluded.
    for entry,prefix in [(DEST/'index.html',''),(radio/'index.html',radio_prefix),(DEST/'network/index.html','../'),(DEST/'bridge-receiver/index.html','../')]:
        content=entry.read_text(encoding='utf-8').replace('</body>',f'<script defer src="{prefix}ui/control-system.js"></script></body>')
        entry.write_text(content,encoding='utf-8')
    # Refresh CSS image URLs too: the user edits shared backgrounds in place.
    for p in sorted({p for folder in [DEST,radio] for p in folder.rglob('*.css')}):
        def stamp_image(m):
            url=m[2].split('?')[0]
            if ':' in url or url.startswith('//'):return m[0]
            asset=(p.parent/url).resolve()
            if not any(asset.is_relative_to(folder.resolve()) for folder in [DEST,radio]) or not asset.is_file() or asset.suffix!='.webp':return m[0]
            return 'url('+m[1]+url+'?v='+hashlib.sha256(asset.read_bytes()).hexdigest()[:12]+m[1]+')'
        p.write_text(re.sub(r'''url\((['"]?)([^)'"\s]+)\1\)''',stamp_image,p.read_text(encoding='utf-8')),encoding='utf-8')
    # User requires no shadow or blur in ANY performance preset.
    for folder in [DEST,radio]:
        for p in folder.rglob('*.css'):
            if 'iptv' in p.relative_to(folder).parts:continue
            css=p.read_text(encoding='utf-8')
            css=re.sub(r'(?<![\w-])(?:box-shadow|text-shadow|-webkit-backdrop-filter|backdrop-filter)\s*:[^;{}]+',lambda m:m[0].split(':',1)[0]+':none!important',css,flags=re.I)
            css=re.sub(r'(?<![\w-])filter\s*:[^;{}]*blur\([^;{}]+','filter:none!important',css,flags=re.I)
            p.write_text(selector_fallbacks(css),encoding='utf-8')
    # Content hashes prevent a running review from mixing old and new assets.
    for p in sorted({p for folder in [DEST,radio] for p in folder.rglob('*.html')}):
        def stamp(m):
            url=m[2].split('?')[0]
            if ':' in url or url.startswith('//'):return m[0]
            asset=(p.parent/url).resolve()
            if not any(asset.is_relative_to(folder.resolve()) for folder in [DEST,radio]) or not asset.is_file() or asset.suffix not in {'.css','.js','.webp'}:return m[0]
            return m[1]+'="'+url+'?v='+hashlib.sha256(asset.read_bytes()).hexdigest()[:12]+'"'
        p.write_text(re.sub(r'(src|href)="([^"]+)"',stamp,p.read_text(encoding='utf-8')),encoding='utf-8')
