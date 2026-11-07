"""Check local assets used by the packaged radio, network and Bridge pages."""
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'android-tv/build/assets'
seen = set()
missing = []

def visit(file):
    file = file.resolve()
    if file in seen:
        return
    seen.add(file)
    text = file.read_text(encoding='utf-8')
    if file.suffix == '.css':
        urls = re.findall(r'url\(\s*[\'\"]?([^\'\"\s)]+)', text)
    else:
        urls = re.findall(r'(?:src|href)=[\'\"]([^\'\"]+)', text)
    for url in urls:
        parsed = urlsplit(url)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        target = (file.parent / unquote(parsed.path)).resolve()
        if not target.is_relative_to(ASSETS.resolve()):
            missing.append((str(file.relative_to(ASSETS)), url, 'outside package'))
        elif not target.is_file():
            missing.append((str(file.relative_to(ASSETS)), url, 'missing'))
        elif target.suffix in {'.css'}:
            visit(target)

for entry in ['radio/index.html', 'tv/network/index.html', 'tv/bridge-receiver/index.html']:
    visit(ASSETS / entry)
assert not missing, missing
print('PASS packaged page assets:', len(seen), 'HTML/CSS files; local backgrounds, fonts, scripts and artwork exist')
