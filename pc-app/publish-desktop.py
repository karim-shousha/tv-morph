"""Publish this task's verified desktop binaries to the existing GitHub repository."""
from pathlib import Path
import argparse,base64,hashlib,json,os,subprocess,time,urllib.error,urllib.parse,urllib.request

HERE=Path(__file__).resolve().parent
parser=argparse.ArgumentParser()
parser.add_argument('--run-id',required=True,type=int)
parser.add_argument('--publish',action='store_true')
args=parser.parse_args()
result=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',capture_output=True,text=True,env=dict(os.environ,GIT_TERMINAL_PROMPT='0'))
token=dict(line.split('=',1) for line in result.stdout.splitlines() if '=' in line).get('password')
if not token:raise SystemExit('Existing GitHub credential unavailable')
BASE='https://api.github.com/repos/karim-shousha/tv-morph/'
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**kw):return None
opener=urllib.request.build_opener(NoRedirect())
def api(path,method='GET',body=None):
    data=json.dumps(body).encode() if body is not None else None
    headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','User-Agent':'Morph-Desktop-Release','Cache-Control':'no-cache'}
    if data is not None:headers['Content-Type']='application/json'
    url=BASE+path
    if method=='GET':url+=('&' if '?' in path else '?')+'_morph='+str(time.time_ns())
    with opener.open(urllib.request.Request(url,data=data,headers=headers,method=method),timeout=60) as response:return json.load(response)
def sha(path):
    digest=hashlib.sha256()
    with path.open('rb') as file:
        while block:=file.read(1024*1024):digest.update(block)
    return digest.hexdigest()

run=api('actions/runs/'+str(args.run_id))
assert run['head_branch']=='codex/desktop-macos' and run['conclusion']=='success','Both Mac architecture jobs must pass first'
jobs=api('actions/runs/'+str(args.run_id)+'/jobs')['jobs']
assert all(any(job['name']==name and job['conclusion']=='success' for job in jobs) for name in ['build','verify-intel'])
metadata=api('contents/desktop-build/runtime.json?ref='+run['head_sha'])
remote=json.loads(base64.b64decode(metadata['content']))
local=json.loads((HERE/'build/mac-ci/runtime.json').read_text())
assert remote['sha256']==local['sha256'],'Mac CI snapshot must match the current staged release'
files=[HERE/'dist/Morph-Launcher-PC-0.1.0-Setup.exe',HERE/'dist/Morph-Launcher-Mac-0.1.0-universal.dmg',HERE/'dist/Morph-Launcher-Mac-0.1.0-universal.zip']
for path in files:assert path.is_file() and path.stat().st_size>10_000_000,path
assert json.loads((HERE/'test-output/packaged-windows-results.json').read_text())['passed']
manifest={'product':'Morph Launcher','version':'0.1.0','embeddedIptv':True,'separateDesktopIptvProduct':False,'preview':True,'macArchitectures':['x64','arm64'],'macCi':run['html_url'],'macCommit':run['head_sha'],'macSnapshot':local['sha256'],'windowsSigned':False,'macAppleNotarized':False,'files':[{'name':path.name,'bytes':path.stat().st_size,'sha256':sha(path)} for path in files]}
manifest_path=HERE/'dist/desktop-release.json';manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
sums=HERE/'dist/desktop-SHA256SUMS.txt';sums.write_text(''.join(row['sha256']+'  '+row['name']+'\n' for row in manifest['files']))
files += [manifest_path,sums]
if not args.publish:
    print(json.dumps(manifest,indent=2));raise SystemExit(0)
tag='desktop-v0.1.0'
try:release=api('releases/tags/'+tag)
except urllib.error.HTTPError as error:
    if error.code!=404:raise
    release=next((item for item in api('releases?per_page=50') if item['tag_name']==tag),None)
if release is None:
    release=api('releases','POST',{'tag_name':tag,'target_commitish':run['head_sha'],'name':'Morph Launcher Desktop 0.1.0 Preview','draft':True,'prerelease':True,'body':'One Morph Launcher app for Windows and macOS, with IPTV embedded. Mouse and keyboard controls.\n\nPreview builds: Windows installer is unsigned; macOS universal app uses an ad hoc signature and is not Apple notarized.\n\nPackaged playback/navigation regression verified on Windows, Apple Silicon and Intel macOS. See desktop-release.json and desktop-SHA256SUMS.txt for verification and file hashes.'})
assert release['draft'],'Do not replace assets of an already published release'
existing={asset['name']:asset for asset in api('releases/'+str(release['id'])+'/assets')}
for path in files:
    if path.name in existing:
        asset=existing[path.name]
        assert asset.get('digest')=='sha256:'+sha(path),'An existing draft asset differs; inspect it before changing it'
        print('Already uploaded',path.name,flush=True);continue
    url=release['upload_url'].split('{')[0]+'?name='+urllib.parse.quote(path.name)
    assert urllib.parse.urlsplit(url).hostname=='uploads.github.com'
    headers={'Authorization':'Bearer '+token,'User-Agent':'Morph-Desktop-Release','Content-Type':'application/octet-stream','Content-Length':str(path.stat().st_size)}
    with path.open('rb') as file,opener.open(urllib.request.Request(url,data=file,headers=headers,method='POST'),timeout=300) as response:asset=json.load(response)
    assert asset['size']==path.stat().st_size and asset.get('digest')=='sha256:'+sha(path)
    print('Uploaded and hash verified',path.name,asset['size'],flush=True)
release=api('releases/'+str(release['id']),'PATCH',{'draft':False})
print(json.dumps({'published':release['html_url'],'files':[path.name for path in files]}))
