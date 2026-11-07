"""Stage distinct, verified Morph IPTV installers in the signed phone app."""
from pathlib import Path
import hashlib,json,shutil,zipfile,xml.etree.ElementTree as ET

def stage(root: Path, assets: Path, version: str):
    manifest=json.loads((root/'standalone-iptv/dist/local-build.json').read_text(encoding='utf-8'))
    assert manifest['product']['version']==version, 'Build the current standalone IPTV matrix before the phone APK'
    ids={'android':'local.morph.iptv','webos':'com.morphtv.iptv'}
    targets={'android':'.apk','webos':'.ipk','tizen4':'.wgt'}
    rows={}
    for target,extension in targets.items():
        row=next(item for item in manifest['artifacts'] if item['target']==target)
        source=root/row['file'];data=source.read_bytes();sha=hashlib.sha256(data).hexdigest()
        assert sha==row['sha256'] and len(data)==row['bytes']
        asset='iptv-'+target+extension;shutil.copy2(source,assets/asset)
        if target=='tizen4':
            with zipfile.ZipFile(source) as z:
                xml=ET.fromstring(z.read('config.xml'));app=next(e for e in xml.iter() if e.tag.endswith('application'))
                ids[target]=app.attrib['id'];assert app.attrib['package']=='MIptvTz4X1'
        rows[target]={'asset':asset,'id':ids[target],'version':version,'sha256':sha,'bytes':len(data)}
    (assets/'install-products.json').write_text(json.dumps({'schema':1,'iptv':rows},indent=2)+'\n',encoding='utf-8')
    return rows
