"""Stage the canonical TV Bridge frontend for the existing standalone receivers."""
from pathlib import Path
import shutil,re
from PIL import Image
from launcher_css_compat import selector_fallbacks
ROOT=Path(__file__).resolve().parent

def stage_bridge_frontend(destination):
    target=Path(destination);target.mkdir(parents=True,exist_ok=True)
    shutil.copytree(ROOT/'tv-project/app/bridge-receiver',target,dirs_exist_ok=True)
    art=target/'reference-assets';art.mkdir(exist_ok=True)
    for name in ['bridge-background-v2.webp','bridge-devices-v2.webp']:
        shutil.copy2(ROOT/'tv-project/visual-system/assets'/name,art/name)
    assets=target/'assets';assets.mkdir(exist_ok=True)
    with Image.open(ROOT/'tv-project/app/assets/morph-header-symbol.webp') as image:
        image=image.convert('RGBA');image.thumbnail((256,256),Image.Resampling.LANCZOS);image.save(assets/'morph-header-symbol.webp','WEBP',lossless=True)
    for name in ['reference-theme.js','bridge-reference.css','bridge-reference.js']:
        text=(ROOT/'tv-project/visual-system'/name).read_text(encoding='utf-8')
        if name=='bridge-reference.js':text=text.replace('../reference-assets/','reference-assets/')
        if name.endswith('.css'):text=selector_fallbacks(text)
        (target/name).write_text(text,encoding='utf-8')
    shutil.copy2(ROOT/'tv-project/app/tv-compat.js',target/'tv-compat.js')
    page=target/'index.html';html=page.read_text(encoding='utf-8')
    html=html.replace('<div id="app">','<div id="app" data-no-translate>')
    html=html.replace('../assets/morph-header-symbol.webp','assets/morph-header-symbol.webp').replace('src="bridge-connect-hero-v1.webp"','src="reference-assets/bridge-devices-v2.webp"')
    html=html.replace('</head>','<script src="tv-compat.js"></script><script src="reference-theme.js"></script><link rel="stylesheet" href="bridge-reference.css"></head>')
    html=html.replace('</body>','<script src="bridge-reference.js"></script></body>')
    shutil.copy2(ROOT/'standalone-bridge/standalone-license.js',target/'standalone-license.js')
    # Existing TV Plus activation UI and the same 72-hour policy; no phone licence.
    for name in ['plus.js','plus.css','bridge-access.js']:
        shutil.copy2(ROOT/'tv-project/app'/name,target/name)
    shutil.copy2(ROOT/'mobile-app/assets/ui/locale.js',target/'plus-locale.js')
    shutil.copy2(ROOT/'tv-project/app/assets/plus-purchase.webp',assets/'plus-purchase.webp')
    html=html.replace('<script src="host.js">','<script>if(window.MorphDevice&&MorphDevice.bridgeTrialJson)window.TVNative=MorphDevice;</script><script src="plus-locale.js"></script><script src="plus.js"></script><script src="bridge-access.js"></script><script src="host.js">')
    html=html.replace('<script src="js/app.js"></script>','<script src="standalone-license.js"></script>')
    html=html.replace('</head>','<link rel="stylesheet" href="plus.css"><style>.bridge-license-pending #app{visibility:hidden!important}#bridge-access-gate[hidden]{display:none!important}#bridge-access-gate{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:8vw;text-align:center;color:white;font:26px/1.6 Arial,sans-serif}#bridge-access-gate button{font:inherit;color:white;padding:16px 28px;border:1px solid #e8c48a;border-radius:18px;background:#10233c}#bridge-access-gate button:focus{outline:3px solid #e8c48a}.morph-plus-dialog{background:#081a2ef0!important;max-height:90vh;overflow:auto}</style></head>')
    for file in target.rglob('*.css'):
        css=file.read_text(encoding='utf-8')
        css=re.sub(r'(?:-webkit-)?backdrop-filter\s*:[^;}]+','backdrop-filter:none',css,flags=re.I)
        css=re.sub(r'(?<![\w-])(?:box-shadow|text-shadow)\s*:[^;}]+',lambda m:m[0].split(':',1)[0]+':none',css,flags=re.I)
        css=re.sub(r'blur\([^)]*\)','blur(0px)',css,flags=re.I)
        file.write_text(css,encoding='utf-8')
    (target/'bridge-connect-hero-v1.webp').unlink(missing_ok=True)
    (target/'icon.webp').unlink(missing_ok=True)
    page.write_text(html,encoding='utf-8')
