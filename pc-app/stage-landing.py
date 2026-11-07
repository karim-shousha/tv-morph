"""Stage only desktop download additions into the isolated existing-site checkout."""
from pathlib import Path
import shutil

ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'landing-preview'
DEST=ROOT/'.tools/desktop-landing'
assert (DEST/'.git').is_file()
for suffix in ['css','js']:
    content=(SOURCE/('desktop-downloads.'+suffix)).read_text(encoding='utf-8')
    if suffix=='js':content=content.replace('src="assets/','src="landing-assets/')
    (DEST/('site-desktop-downloads.'+suffix)).write_text(content,encoding='utf-8')
for name in ['windows-platform.svg','apple-platform.svg','desktop-icons-LICENSE.txt']:
    shutil.copy2(SOURCE/'assets'/name,DEST/'landing-assets'/name)
path=DEST/'index.html';html=path.read_text(encoding='utf-8')
if 'site-desktop-downloads.js' not in html:
    html=html.replace('</head>','<link rel="stylesheet" href="site-desktop-downloads.css?v=desktop-0.1.0"><script src="site-desktop-downloads.js?v=desktop-0.1.0" defer></script></head>',1)
path.write_text(html,encoding='utf-8')
path=DEST/'Dockerfile';content=path.read_text(encoding='utf-8')
if 'COPY site-desktop-downloads.js' not in content:
    content=content.replace('COPY fitness-music/','COPY site-desktop-downloads.js site-desktop-downloads.css /usr/share/nginx/html/\nCOPY fitness-music/',1)
path.write_text(content,encoding='utf-8')
path=DEST/'.dockerignore';content=path.read_text(encoding='utf-8')
if '!site-desktop-downloads.js' not in content:content+='\n!site-desktop-downloads.js\n!site-desktop-downloads.css\n'
path.write_text(content,encoding='utf-8')
path=DEST/'nginx.conf';content=path.read_text(encoding='utf-8')
if 'location = /download/windows' not in content:
    locations=''
    for platform,filename in [('windows','Morph-Launcher-PC-0.1.0-Setup.exe'),('mac','Morph-Launcher-Mac-0.1.0-universal.dmg')]:
        locations+=' location = /download/'+platform+' {\n  add_header Cache-Control "no-store" always;\n  return 302 https://github.com/karim-shousha/tv-morph/releases/download/desktop-v0.1.0/'+filename+';\n }\n'
    content=content.replace(' location = /download/remote {',locations+' location = /download/remote {',1)
path.write_text(content,encoding='utf-8')
print('Staged desktop buttons, platform artwork and two direct download routes; existing downloads preserved.')
