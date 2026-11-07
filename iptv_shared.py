"""Single IPTV frontend source for Morph TV, its phone player and standalone builds."""
from pathlib import Path
import hashlib,json,re,shutil,io

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'android-tv/iptv'
PHONE_CSS=ROOT/'mobile-app/phone-iptv.css'
PHONE_JS=ROOT/'mobile-app/phone-iptv.js'
EXTENSIONS={'.html','.js','.css','.json','.svg','.webp','.png','.jpg','.jpeg'}
UI_IMAGE_MASTERS={'ahly-home-2026-v1.webp','al-ahly-team-v2.webp','dock.webp','morph-bridge-icon.png','morph-bridge-icon.webp','morph-tv-icon.png','morph-tv-icon.webp','morph-launcher-icon.png','morph-iptv-icon.png','morph-launcher-icon.webp','morph-iptv-icon.webp','morph-launcher-wordmark.png','morph-iptv-wordmark.png','ppp.png','ppp.webp','sports-hero-user.jpg'}


def sync_webp_artwork():
    """Editable PNG masters remain intact; header artwork uses lossless WebP at an appropriate size."""
    from PIL import Image
    assets=ROOT/'tv-project/app/assets'
    dest=ROOT/'output/webp-artwork-report.json'
    try:previous={r['source']:r for r in json.loads(dest.read_text(encoding='utf-8'))['images']}
    except (FileNotFoundError,ValueError,KeyError):previous={}
    report=[]
    for source in sorted(assets.iterdir()):
        if source.suffix.lower() not in {'.png','.jpg','.jpeg'}:continue
        target=source.with_suffix('.webp')
        digest=hashlib.sha256(source.read_bytes()).hexdigest();cached=previous.get(source.relative_to(ROOT).as_posix())
        if cached and cached.get('encodingProfile')=='ui-webp-v2-header1086' and cached.get('sourceSha256')==digest and target.exists() and cached.get('webpSha256')==hashlib.sha256(target.read_bytes()).hexdigest():
            report.append(cached);continue
        image=Image.open(source).convert('RGBA' if source.suffix.lower()=='.png' else 'RGB')
        original_size=image.size
        if source.name in {'morph-launcher-wordmark.png','morph-iptv-wordmark.png'}:image.thumbnail((1086,362),Image.Resampling.LANCZOS)
        encoded=io.BytesIO()
        image.save(encoded,format='WEBP',lossless=source.suffix.lower()=='.png',quality=92,method=6,exact=True)
        data=encoded.getvalue()
        if source.suffix.lower() in {'.jpg','.jpeg'}:
            for quality in [88,84,80,76,72]:
                encoded=io.BytesIO();image.save(encoded,format='WEBP',quality=quality,method=6);data=encoded.getvalue()
                if len(data)<=source.stat().st_size*.9:break
        if not target.exists() or target.read_bytes()!=data:target.write_bytes(data)
        if source.suffix.lower()=='.png':
            assert Image.open(io.BytesIO(data)).convert('RGBA').tobytes()==image.convert('RGBA').tobytes(),source.name+' changed pixels'
        report.append({'source':source.relative_to(ROOT).as_posix(),'runtime':target.relative_to(ROOT).as_posix(),'sourceBytes':source.stat().st_size,'webpBytes':len(data),'sourceSize':original_size,'runtimeSize':image.size,'lossless':source.suffix.lower()=='.png','sourceSha256':digest,'webpSha256':hashlib.sha256(data).hexdigest(),'encodingProfile':'ui-webp-v2-header1086'})
    dest.parent.mkdir(exist_ok=True);content=json.dumps({'images':report,'editableMastersPreserved':True,'platformInstallIconsRemainPNG':True,'loadingLogoOriginalPNG':True},indent=2)+'\n'
    if not dest.exists() or dest.read_text(encoding='utf-8')!=content:dest.write_text(content,encoding='utf-8')


def tv_fallback_bytes():
    from PIL import Image
    encoded=io.BytesIO();Image.open(ROOT/'tv-project/app/assets/morph-launcher-icon.png').convert('RGBA').resize((512,512)).save(encoded,format='WEBP',lossless=True,method=6)
    return encoded.getvalue()


def stage_tv_fallback(root):
    (Path(root)/'tvmorph.webp').write_bytes(tv_fallback_bytes())

def sync_brand_assets():
    """Synchronize shared assets from their canonical source masters."""
    for name in ["brand-loader.js","brand-loader.css"]:
        target=ROOT/"tv-project/app"/name
        if not target.exists() or target.read_bytes()!=(SOURCE/name).read_bytes():shutil.copy2(SOURCE/name,target)
    update=SOURCE/"product-update.js"
    if update.exists():shutil.copy2(update,ROOT/"tv-project/app/product-update.js")
    for name in ('js','css'):
        canonical=SOURCE/('matches-shared.'+name)
        if canonical.exists():
            target=ROOT/'tv-project/app'/('matches.'+name)
            if not target.exists() or target.read_bytes()!=canonical.read_bytes():target.write_bytes(canonical.read_bytes())
    shutil.copy2(SOURCE/'developer-credit.js',ROOT/'tv-project/app/developer-credit.js')
    shutil.copy2(SOURCE/'plus-feature-labels.js',ROOT/'tv-project/app/plus-feature-labels.js')
    # Loading uses the same approved M as the header, with its own full-size
    # runtime asset so header thumbnail staging cannot soften the startup logo.
    for name,source in [('morph-loading-symbol.webp',ROOT/'tv-project/app/assets/morph-header-symbol.webp'),('morph-loading-background.webp',ROOT/'tv-project/visual-system/assets/bridge-background-v2.webp')]:
        for target in [SOURCE/name,ROOT/'tv-project/app/assets'/name]:
            if not target.exists() or target.read_bytes()!=source.read_bytes():shutil.copy2(source,target)
    background=ROOT/'tv-project/visual-system/assets/bridge-background-v2.webp'
    target=SOURCE/'assets/launcher-background.webp';target.parent.mkdir(parents=True,exist_ok=True)
    if not target.exists() or target.read_bytes()!=background.read_bytes():shutil.copy2(background,target)
    for name in ('matches-stadium-v1.webp','main-mountains-wave-v1.webp'):
        source=ROOT/'tv-project/app/assets'/name
        if source.exists():shutil.copy2(source,SOURCE/'assets'/name)
    sync_webp_artwork()
    sync_product_icons()
    source=ROOT/'tv-project/app/assets/morph-wordmark.webp'
    for target in [SOURCE/'morph-wordmark.webp',ROOT/'mobile-app/assets/ui/morph-wordmark.webp']:
        if not target.exists() or target.read_bytes()!=source.read_bytes():shutil.copy2(source,target)
    source=ROOT/'tv-project/app/assets/morph-header-symbol.webp';target=SOURCE/source.name
    if not target.exists() or target.read_bytes()!=source.read_bytes():shutil.copy2(source,target)
    source=ROOT/'tv-project/app/assets/morph-iptv-wordmark.webp';target=SOURCE/'morph-iptv-wordmark.webp'
    if not target.exists() or target.read_bytes()!=source.read_bytes():shutil.copy2(source,target)
    source=ROOT/'tv-project/app/assets/morph-iptv-wordmark.png';target=SOURCE/source.name
    if not target.exists() or target.read_bytes()!=source.read_bytes():shutil.copy2(source,target)

def stage_product_icon(resources,standalone=False,phone=False):
    """Package the shared user-approved installed icon for each product wrapper."""
    from PIL import Image,ImageOps
    name='logo.webp' if phone else 'morph-iptv-icon.png' if standalone else 'morph-launcher-icon.png'
    source=ROOT/'tv-project/app/assets'/name
    target=Path(resources)/'drawable-nodpi';target.mkdir(parents=True,exist_ok=True)
    extension='.webp'
    for stale in ['.webp','.png','.jpg']:
        if stale!=extension:(target/('tvmorph'+stale)).unlink(missing_ok=True)
    icon=target/('tvmorph'+extension)
    art=Image.open(source).convert('RGBA')
    if phone:data=source.read_bytes()
    else:
        encoded=io.BytesIO();art.resize((512,512)).save(encoded,format='WEBP',lossless=True);data=encoded.getvalue()
    if not icon.exists() or icon.read_bytes()!=data:icon.write_bytes(data)
    banner=Image.new('RGBA',(320,180),art.getpixel((0,0)) if not standalone and not phone else 'white');tile=ImageOps.contain(art,(180,180));banner.alpha_composite(tile,((320-tile.width)//2,(180-tile.height)//2));encoded=io.BytesIO();banner.save(encoded,format='WEBP',lossless=True);dest=target/'tvmorph_banner.webp'
    if not dest.exists() or dest.read_bytes()!=encoded.getvalue():dest.write_bytes(encoded.getvalue())

def stage_bridge_entry_background(resources):
    """Resource required by shared native Bridge and navigation themes."""
    from PIL import Image,ImageOps
    target=Path(resources)/'drawable-nodpi/bridge_entry_background.webp'
    target.parent.mkdir(parents=True,exist_ok=True)
    with Image.open(ROOT/'tv-project/visual-system/assets/bridge-background-v2.webp') as image:
        ImageOps.fit(image.convert('RGB'),(1920,1080),centering=(.5,.5)).save(target,'WEBP',quality=90)


def sync_product_icons():
    from PIL import Image
    stage_product_icon(ROOT/'android-tv/res')
    stage_product_icon(ROOT/'mobile-app/res',phone=True)
    encoded=io.BytesIO();Image.open(ROOT/'tv-project/app/assets/morph-launcher-icon.png').convert('RGBA').resize((512,512)).save(encoded,format='PNG');dest=ROOT/'mobile-app/app-icon.png'
    if not dest.exists() or dest.read_bytes()!=encoded.getvalue():dest.write_bytes(encoded.getvalue())

def stage_brand_assets(root):
    assets=Path(root)/'assets';assets.mkdir(parents=True,exist_ok=True)
    (assets/'morph-launcher-wordmark.png').unlink(missing_ok=True)
    for name in ['morph-wordmark.webp','morph-launcher-wordmark.webp','morph-loading-symbol.webp','morph-loading-background.webp','premium-reference-background.svg']:
        shutil.copy2(ROOT/'tv-project/app/assets'/name,assets/name)

def stage_adhan_assets(tv_root):
    """Native prayer interruption must retain its local artwork/audio in every consumer."""
    assets=Path(tv_root)/'assets';assets.mkdir(parents=True,exist_ok=True)
    for name in ['prayer-pause-v1.webp','prayer-egypt.mp3','prayer-makka.mp3']:
        shutil.copy2(ROOT/'tv-project/app/assets'/name,assets/name)

def source_files():
    return [p for p in sorted(SOURCE.rglob('*')) if p.is_file() and p.suffix in EXTENSIONS and not p.name.endswith('-preview.png') and p.name not in {'morph-iptv-wordmark.png','morph-launcher-wordmark.png'}]

def source_receipt(phone=False,standalone=False):
    files=[{'source':p.relative_to(ROOT).as_posix(),'target':p.relative_to(SOURCE).as_posix(),'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in source_files()]
    return {'canonical':'android-tv/iptv','phone':phone,'standalone':standalone,'files':files}

def document(text,phone=False,media_root='../tv/',standalone=False):
    # Static shared styles must follow the same root as runtime assets. Web
    # standalone hosts stage these under ../shared/, Android under ../tv/.
    text=text.replace('../tv/',media_root)
    text=re.sub(r'(<meta name="tvm-media-root" content=")[^"]+',lambda m:m[1]+media_root,text)
    if phone:
        # TV/desktop typography stays independent; preserve the phone UI as-is.
        for name in ('iptv-text-size.css','cinema-shell.css'):
            text=text.replace('<link rel="stylesheet" href="'+name+'">','')
        text=text.replace('<script src="iptv-text-size.js"></script>','').replace('<script src="header-weather.js"></script>','')
        text=text.replace('<script src="brand-loader.js"></script>','<script>window.MorphPhoneNoBoot=true;window.MorphPlusClient="studio";</script>')
        text=re.sub(r'(<meta name="viewport" content=")[^"]+',lambda m:m[1]+'width=device-width,initial-scale=1',text)
        if 'href="phone-layout.css"' not in text:text=text.replace('</head>','<link rel="stylesheet" href="phone-layout.css"></head>')
        if 'src="phone-navigation.js"' not in text:text=text.replace('</body>','<script src="phone-navigation.js"></script></body>')
    if standalone:text=text.replace('<head>','<head><script>window.MorphIptvStandalone=true;</script>',1)
    return text

def stage_frontend(destination,phone=False,media_root='../tv/',standalone=False,sync_branding=True):
    if sync_branding:sync_brand_assets()
    destination=Path(destination);destination.mkdir(parents=True,exist_ok=True)
    records=[]
    for source in source_files():
        relative=source.relative_to(SOURCE);target=destination/relative;target.parent.mkdir(parents=True,exist_ok=True)
        data=source.read_bytes()
        if relative.as_posix()=='index.html':data=document(data.decode('utf-8'),phone,media_root,standalone).encode('utf-8')
        elif media_root!='../tv/' and source.suffix in ('.css','.js'):
            data=data.decode('utf-8').replace('../tv/',media_root).encode('utf-8')
        target.write_bytes(data)
        records.append({'source':source.relative_to(ROOT).as_posix(),'target':relative.as_posix(),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest()})
    shutil.copy2(ROOT/'mobile-app/assets/ui/locale.js',destination/'locale.js')
    shutil.copy2(ROOT/'tv-project/app/tv-compat.js',destination/'tv-compat.js')
    if phone:
        shutil.copy2(PHONE_CSS,destination/'phone-layout.css');shutil.copy2(PHONE_JS,destination/'phone-navigation.js')
        shutil.copytree(ROOT/'mobile-app/assets/ui/fonts',destination/'fonts',dirs_exist_ok=True)
    (destination/'shared-source.json').write_text(json.dumps({'canonical':'android-tv/iptv','phone':phone,'standalone':standalone,'files':records},indent=2),encoding='utf-8')
    return records


def stage_prayer_ui(destination):
    """Standalone-only host uses the exact Launcher prayer UI, settings and engine."""
    destination=Path(destination)
    destination.mkdir(parents=True,exist_ok=True)
    for name in ['core.js','weather.js','prayer-local-times.js','prayer-gold.js','prayer-gold.css','prayer-settings-dialog.js','prayer-settings-dialog.css','prayer.js','prayer.css','prayer-premium.css','prayer-duas.js','prayer-duas-data.js','plus.js','plus.css']:
        shutil.copy2(ROOT/'tv-project/app'/name,destination/name)
    assets=destination/'assets';assets.mkdir(exist_ok=True);shutil.copy2(ROOT/'tv-project/app/assets/plus-purchase.webp',assets/'plus-purchase.webp')
    for name in ['moment.min.js','moment-timezone.min.js']:
        folder=destination/'vendor';folder.mkdir(exist_ok=True)
        shutil.copy2(ROOT/'tv-project/app/vendor'/name,folder/name)
    stage_adhan_assets(destination)
    assets=destination/'assets';assets.mkdir(exist_ok=True)
    shutil.copy2(ROOT/'tv-project/app/assets/premium-reference-background.svg',assets/'premium-reference-background.svg')
    shutil.copy2(ROOT/'tv-project/app/ui/theme-adapter.js', destination/'theme-adapter.js')
    for name in ['prayer-mosque-gold-v1.webp','prayer-glass-overview.svg','prayer-gold-ornament.svg','prayer-gold-dua-frame.svg']:
        shutil.copy2(ROOT/'tv-project/app/assets'/name,assets/name)
