"""Pinned Android playback dependencies for the existing no-Gradle APK builders.

Generate library R classes against the SAME resource table as the final APK.
No downloads at build time; every artifact is verified against lock.json.
"""
from pathlib import Path
import hashlib,json,zipfile,xml.etree.ElementTree as ET,shutil,subprocess

def prepare(root,build,manifest,assets,res,unsigned):
    library=root/'android-tv/libs/media3'
    lock=json.loads((library/'lock.json').read_text())
    unpack=build/'media3';unpack.mkdir(exist_ok=True)
    generated=build/'media3-r'
    if generated.exists():shutil.rmtree(generated)
    generated.mkdir()
    jars=[];resources=[];packages=[];native=[]
    wg=root/'android-tv/libs/wireguard/tunnel-1.0.20260102.aar'
    assert hashlib.sha256(wg.read_bytes()).hexdigest()=='2b9c16db026496123e4db695d26d03d1958a201096c7c4c89b21077dc70f3119'
    target=unpack/'wireguard-tunnel'
    if target.exists():shutil.rmtree(target)
    with zipfile.ZipFile(wg) as archive:archive.extractall(target)
    jars.append(target/'classes.jar');packages.append('com.wireguard.android.tunnel')
    if (target/'res').exists():resources.append(target/'res')
    native_root=target/'jni';native=list(native_root.rglob('*.so'))
    merged=build/'vpn-manifest.xml';text=Path(manifest).read_text(encoding='utf-8')
    if 'com.wireguard.android.backend.GoBackend$VpnService' not in text:text=text.replace('</application>','<service android:name="com.wireguard.android.backend.GoBackend$VpnService" android:exported="false" android:permission="android.permission.BIND_VPN_SERVICE"><intent-filter><action android:name="android.net.VpnService"/></intent-filter></service></application>')
    merged.write_text(text,encoding='utf-8');manifest=merged
    for entry in lock['files']:
        source=library/entry['file']
        assert hashlib.sha256(source.read_bytes()).hexdigest()==entry['sha256'],source.name
        if source.suffix=='.jar':jars.append(source);continue
        target=unpack/source.stem
        if target.exists():shutil.rmtree(target)
        with zipfile.ZipFile(source) as archive:archive.extractall(target)
        jars.append(target/'classes.jar')
        packages.append(ET.parse(target/'AndroidManifest.xml').getroot().get('package'))
        if (target/'res').exists():resources.append(target/'res')
        jars.extend((target/'libs').glob('*.jar') if (target/'libs').exists() else [])
    shutil.copy2(library/'THIRD_PARTY_NOTICES.txt',assets/'playback-third-party-notices.txt')
    shutil.copy2(root/'.tools/qr/LICENSE',assets/'zxing-LICENSE.txt')
    sdk=Path('C:/Users/Admin/AppData/Local/Android/Sdk')
    platform=sdk/'platforms/android-35/android.jar'
    aapt=sdk/'build-tools/35.0.0/aapt2.exe'
    compiled=[]
    def run(args):
        result=subprocess.run([str(x) for x in args],capture_output=True,text=True)
        if result.returncode:raise RuntimeError(result.stdout+result.stderr)
    for index,folder in enumerate(resources+[res]):
        output=unpack/('resources-'+str(index)+'.zip')
        run([aapt,'compile','--dir',folder,'-o',output])
        compiled.append(output)
    args=[aapt,'link','--auto-add-overlay','--manifest',manifest,'-I',platform,'-A',assets,'--java',generated,'--extra-packages',':'.join(packages),'-o',unsigned,'-0','zip']
    for output in compiled:args+=['-R',output]
    (assets/'wireguard-NOTICE.txt').write_text('WireGuard Android Tunnel 1.0.20260102. Copyright WireGuard LLC. Apache-2.0. Source: https://git.zx2c4.com/wireguard-android/ ; native source and license details: https://www.wireguard.com/embedding/',encoding='utf-8')
    run(args)
    with zipfile.ZipFile(unsigned,'a',zipfile.ZIP_DEFLATED) as archive:
        for lib in native:archive.write(lib,'lib/'+lib.relative_to(native_root).as_posix())
    qr=root/'.tools/qr/core-3.5.3.jar'
    assert hashlib.sha256(qr.read_bytes()).hexdigest()=='8d8064c1636fdaef7189dd9055c7d59950a8940a12f2293956446ec3c109fd82'
    jars.append(qr)
    return platform,jars,list(generated.rglob('*.java'))
