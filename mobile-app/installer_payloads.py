"""Stage distinct, verified Morph IPTV installers in the signed phone app."""
from pathlib import Path
import hashlib,json,shutil,zipfile,re,xml.etree.ElementTree as ET

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
        # A phone-only/Android patch can retain the previously verified webOS/Tizen artifacts.
        # Keep each payload's own version instead of relabeling the whole matrix.
        match=re.search(r'(?:-|_)([0-9]+\.[0-9]+\.[0-9]+)(?:_all)?\.(?:apk|ipk|wgt)$',source.name)
        assert match, 'Missing payload version: '+source.name
        payload_version=match.group(1)
        if target=='tizen4':
            with zipfile.ZipFile(source) as z:
                xml=ET.fromstring(z.read('config.xml'));app=next(e for e in xml.iter() if e.tag.endswith('application'))
                ids[target]=app.attrib['id'];assert app.attrib['package']=='MIptvTz4X1'
                assert xml.attrib['version']==payload_version, 'Tizen payload version mismatch'
        rows[target]={'asset':asset,'id':ids[target],'version':payload_version,'sha256':sha,'bytes':len(data)}
    (assets/'install-products.json').write_text(json.dumps({'schema':1,'iptv':rows},indent=2)+'\n',encoding='utf-8')
    return rows
