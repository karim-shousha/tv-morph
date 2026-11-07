"""Verify product identities, current shared sources and native Adhan assets in local artifacts."""
from pathlib import Path
import hashlib,io,json,subprocess,tarfile,zipfile,re,xml.etree.ElementTree as ET
import sys
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from iptv_shared import source_receipt
EXPECTED={p['target']:p['sourceSha256'] for p in source_receipt()['files']}

def check_receipt(raw,label):
    receipt=json.loads(raw);actual={p['target']:p['sourceSha256'] for p in receipt['files']}
    assert actual==EXPECTED,label+' contains a stale or forked IPTV frontend'
    return len(actual)

def check_native(z,label):
    for name in ['prayer-pause-v1.webp','prayer-egypt.mp3','prayer-makka.mp3']:
        assert z.read('assets/tv/assets/'+name)==(ROOT/'tv-project/app/assets'/name).read_bytes(),label+' missing or changed Adhan asset '+name
    assert not [n for n in z.namelist() if n.endswith(('.p12','.jks','.key','.pwd'))],label+' contains private signing material'
    assert z.read('assets/iptv/morph-iptv-wordmark.webp')==(ROOT/'tv-project/app/assets/morph-iptv-wordmark.webp').read_bytes(),label+' has stale IPTV branding'
    assert z.read('assets/tv/assets/morph-launcher-wordmark.webp')==(ROOT/'tv-project/app/assets/morph-launcher-wordmark.webp').read_bytes(),label+' missing staged launcher wordmark'
    for path in ['assets/iptv/morph-loading-symbol.webp','assets/tv/assets/morph-loading-symbol.webp']:assert z.read(path)==(ROOT/'tv-project/app/assets/morph-header-symbol.webp').read_bytes(),label+' loading symbol differs from the current approved M'
    for path in ['assets/iptv/morph-loading-background.webp','assets/tv/assets/morph-loading-background.webp']:assert z.read(path)==(ROOT/'tv-project/visual-system/assets/bridge-background-v2.webp').read_bytes(),label+' loading background is missing or stale'
    assert 'assets/iptv/morph-iptv-wordmark.png' not in z.namelist() and 'assets/tv/assets/morph-launcher-wordmark.png' not in z.namelist(),label+' packages obsolete loading wordmarks' 
    if label=='phone':assert z.read('assets/ui/morph-wordmark.webp')==(ROOT/'tv-project/app/assets/morph-wordmark.webp').read_bytes(),'Phone host branding changed'
    icon='logo.webp' if label=='phone' else 'morph-iptv-icon.png' if label=='standalone-android' else 'morph-launcher-icon.png'
    badging=subprocess.run([str(ROOT/'.tools/android/sdk/android-11/aapt.exe'),'dump','badging',str(z.filename)],check=True,capture_output=True).stdout.decode('utf-8',errors='replace')
    icon_path=re.search(r"application:.* icon='([^']+)'",badging).group(1)
    from PIL import Image
    expected=Image.open(ROOT/'tv-project/app/assets'/icon).convert('RGBA')
    if label!='phone':expected=expected.resize((512,512))
    actual=Image.open(io.BytesIO(z.read(icon_path))).convert('RGBA')
    assert actual.size==expected.size and actual.tobytes()==expected.tobytes(),label+' has the wrong product icon'
    assert any(b'Provider catalog field too large.' in z.read(n) for n in z.namelist() if n.endswith('.dex')),label+' missing streaming catalog implementation'


def check_web_icon(raw):
    from PIL import Image
    expected=Image.open(ROOT/'tv-project/app/assets/morph-iptv-icon.png').convert('RGBA').resize((512,512))
    actual=Image.open(io.BytesIO(raw)).convert('RGBA')
    assert actual.size==expected.size and actual.tobytes()==expected.tobytes(),'Standalone TV widget has the wrong IPTV product icon'

def ar_data(file):
    data=Path(file).read_bytes();assert data[:8]==b'!<arch>\n';pos=8
    while pos+60<=len(data):
        header=data[pos:pos+60];name=header[:16].decode().strip().rstrip('/');size=int(header[48:58]);body=data[pos+60:pos+60+size];pos+=60+size+(size%2)
        if name.startswith('data.tar'):return tarfile.open(fileobj=io.BytesIO(body),mode='r:*')
    raise AssertionError('IPK has no payload')

def main():
    report=[];dist=ROOT/'standalone-iptv/dist';product=json.loads((ROOT/'standalone-iptv/product.json').read_text());version=product['version']
    for target in ['tizen2','tizen3','tizen4','tizen5']:
        file=dist/('Morph-IPTV-'+target+'-'+version+'.wgt')
        with zipfile.ZipFile(file) as z:
            assert z.read('iptv/morph-iptv-wordmark.webp')==(ROOT/'tv-project/app/assets/morph-iptv-wordmark.webp').read_bytes();check_web_icon(z.read('icon.png'));count=check_receipt(z.read('iptv/shared-source.json'),target);xml=ET.fromstring(z.read('config.xml'));ns={'w':'http://www.w3.org/ns/widgets','t':'http://tizen.org/ns/widgets'}
            app=xml.find('t:application',ns);assert app.get('package')==product['samsung'][target]['package'];assert app.get('id')==app.get('package')+'.Main';assert xml.get('version')==version;assert xml.find('w:name',ns).text=='Morph IPTV';assert {'author-signature.xml','signature1.xml'}.issubset(z.namelist());assert 'tv/index.html' not in z.namelist()
        report.append({'target':target,'bytes':file.stat().st_size,'sharedFiles':count,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
    file=dist/(product['webos']['id']+'_'+version+'_all.ipk')
    with ar_data(file) as archive:
        check_web_icon(archive.extractfile(next(n for n in archive.getnames() if n.endswith('/icon.png'))).read());name=next(n for n in archive.getnames() if n.endswith('/iptv/shared-source.json'));count=check_receipt(archive.extractfile(name).read(),'webos');info=json.load(archive.extractfile(next(n for n in archive.getnames() if n.endswith('/appinfo.json'))));assert info['id']==product['webos']['id'] and info['title']=='Morph IPTV'
    report.append({'target':'webos','bytes':file.stat().st_size,'sharedFiles':count,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
    for target,file in [('standalone-android',dist/('Morph-IPTV-Android-TV-'+version+'.apk')),('embedded-tv',ROOT/'android-tv/TV-Morph-Android-TV-Preview.apk'),('phone',ROOT/'mobile-app/TV-Morph-Preview.apk')]:
        # A TV-only publication explicitly preserves the independently reviewed phone APK.
        if target=='phone' and '--tv-only' in sys.argv:continue
        with zipfile.ZipFile(file) as z:
            count=check_receipt(z.read('assets/iptv/shared-source.json'),target);check_native(z,target)
            if target=='standalone-android':assert 'assets/tv/index.html' not in z.namelist(),'Standalone unexpectedly includes the Morph TV launcher'
            if target=='phone':
                assert z.read('assets/iptv/phone-layout.css')==(ROOT/'mobile-app/phone-iptv.css').read_bytes();assert z.read('assets/iptv/phone-navigation.js')==(ROOT/'mobile-app/phone-iptv.js').read_bytes()
                with zipfile.ZipFile(io.BytesIO(z.read('assets/tv-app.zip'))) as embedded:check_receipt(embedded.read('iptv/shared-source.json'),'embedded-samsung')
        subprocess.run([str(ROOT/'.tools/tizen/sdk/data/jdk/bin/java.exe'),'-jar',str(ROOT/'.tools/android/sdk/android-11/lib/apksigner.jar'),'verify',str(file)],check=True,capture_output=True)
        report.append({'target':target,'bytes':file.stat().st_size,'sharedFiles':count,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'adhanAssets':'exact canonical image and voices'})
    result={'checks':report,'scope':'tv-only' if '--tv-only' in sys.argv else 'all-products','canonicalFrontendFiles':len(EXPECTED),'published':False,'landingChanged':False,'physicalTVVerified':False}
    (ROOT/'output/iptv-shared-build-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps({'passed':len(report),'sharedFiles':len(EXPECTED),'published':False}))

if __name__=='__main__':main()

