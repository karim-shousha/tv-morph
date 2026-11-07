"""Retain the phone's functional layout while discarding every legacy skin.

No color, font, border, radius, shadow or decoration from these inputs ships.
Preview artwork belongs to the TV theme editor's content, not the phone skin.
"""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parent
LAYOUT={
 'display','position','inset','inset-inline','inset-inline-start','inset-inline-end','inset-block','inset-block-start','inset-block-end','top','right','bottom','left','z-index','box-sizing',
 'width','height','min-width','min-height','max-width','max-height','aspect-ratio',
 'margin','margin-top','margin-right','margin-bottom','margin-left','margin-inline','margin-inline-start','margin-inline-end','margin-block','margin-block-start','margin-block-end',
 'padding','padding-top','padding-right','padding-bottom','padding-left','padding-inline','padding-inline-start','padding-inline-end','padding-block','padding-block-start','padding-block-end',
 'gap','row-gap','column-gap','flex','flex-grow','flex-shrink','flex-basis','flex-direction','flex-wrap','order','align-items','align-content','align-self','justify-content','justify-items','justify-self','place-items','place-content','place-self',
 'grid','grid-template','grid-template-rows','grid-template-columns','grid-template-areas','grid-area','grid-row','grid-column','grid-row-start','grid-row-end','grid-column-start','grid-column-end','grid-auto-flow','grid-auto-rows','grid-auto-columns',
 'overflow','overflow-x','overflow-y','overflow-wrap','word-break','white-space','text-overflow','text-align','text-align-last','text-indent','direction','unicode-bidi','vertical-align','visibility','opacity','pointer-events','touch-action','overscroll-behavior','overscroll-behavior-y','overscroll-behavior-x','-webkit-overflow-scrolling','scroll-behavior','scroll-margin-top','scroll-padding','scrollbar-width',
 'object-fit','object-position','transform','transform-origin','content','cursor','appearance','-webkit-appearance','resize','user-select','-webkit-user-select','list-style','list-style-type','border-collapse','table-layout'
}
def _split(text,delimiter):
    parts=[];start=0;quote=None;depth=0;escape=False
    for i,c in enumerate(text):
        if escape:escape=False;continue
        if c=='\\':escape=True;continue
        if quote:
            if c==quote:quote=None
        elif c in '\"\'':quote=c
        elif c in '([':depth+=1
        elif c in ')]':depth-=1
        elif c==delimiter and depth==0:parts.append(text[start:i]);start=i+1
    parts.append(text[start:]);return parts
def structural(css):
    css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
    out=[];start=0;i=0;quote=None;escape=False
    while i<len(css):
        c=css[i]
        if escape:escape=False;i+=1;continue
        if c=='\\':escape=True;i+=1;continue
        if quote:
            if c==quote:quote=None
            i+=1;continue
        if c in '\"\'':quote=c;i+=1;continue
        if c==';':start=i+1;i+=1;continue
        if c!='{':i+=1;continue
        head=css[start:i].strip();body_start=i+1;depth=1;i+=1
        while i<len(css) and depth:
            c=css[i]
            if escape:escape=False
            elif c=='\\':escape=True
            elif quote:
                if c==quote:quote=None
            elif c in '\"\'':quote=c
            elif c=='{':depth+=1
            elif c=='}':depth-=1
            i+=1
        body=css[body_start:i-1];start=i
        if head.startswith(('@media','@supports','@container','@keyframes','@-webkit-keyframes')):
            clean=structural(body)
        elif head.startswith('@'):continue
        else:
            art=bool(re.search(r'(?:#preview|\.preview|\.theme-swatch)(?:[\s:>.#\[]|$)',head))
            declarations=[]
            for value in _split(body,';'):
                if ':' not in value:continue
                name,content=value.split(':',1);name=name.strip().lower()
                if name in LAYOUT or art:declarations.append(name+':'+content.strip())
            clean=';'.join(declarations)
        if clean:out.append(head+'{'+clean+'}')
    return '\n'.join(out)
def compile_layout():
    source=ROOT/'phone-layout-source.css'
    target=ROOT/'assets/ui/phone-layout.css'
    target.write_text('/* Generated from the rebuilt phone-layout-source.css. */\n'+source.read_text(encoding='utf-8'),encoding='utf-8')

def prune_legacy_css(ui):
    ui=Path(ui).resolve()
    allowed={(ROOT/'build/assets/ui').resolve(),(ROOT.parent/'.tools/final-tv-stage/assets/ui').resolve()}
    assert ui in allowed, 'Only generated phone staging directories may be pruned'
    keep={'phone-tokens.css','phone-layout.css','phone-system.css','matches-phone.css','matches-screen.css','setup-wizard.css'}
    for path in ui.glob('*.css'):
        if path.name not in keep:path.unlink()
