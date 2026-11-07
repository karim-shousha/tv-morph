"""Inspect/download this task's macOS CI artifacts. Never persist credentials."""
from pathlib import Path
import hashlib,json,os,subprocess,sys,time,urllib.request,urllib.parse,urllib.error

env=dict(os.environ,GIT_TERMINAL_PROMPT='0')
result=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',capture_output=True,text=True,env=env)
values=dict(line.split('=',1) for line in result.stdout.splitlines() if '=' in line)
token=values.get('password')
if not token:raise SystemExit('Existing GitHub credential unavailable')
BASE='https://api.github.com/repos/karim-shousha/tv-morph/'
def get(endpoint):
    url=BASE+endpoint+('&' if '?' in endpoint else '?')+'_morph='+str(time.time_ns())
    req=urllib.request.Request(url,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','User-Agent':'Morph-Desktop-CI','Cache-Control':'no-cache'})
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*args,**kwargs):return None
    try:return urllib.request.build_opener(NoRedirect()).open(req,timeout=45)
    except urllib.error.HTTPError as error:
        if error.code!=302:raise
        location=error.headers['Location'];target=urllib.parse.urlsplit(location)
        assert target.scheme=='https' and (target.hostname.endswith('.blob.core.windows.net') or target.hostname.endswith('.githubusercontent.com'))
        return urllib.request.urlopen(urllib.request.Request(location,headers={'User-Agent':'Morph-Desktop-CI'}),timeout=45)

if len(sys.argv)>1 and sys.argv[1]=='cancel-obsolete':
    with get('actions/runs?branch=codex%2Fdesktop-macos&per_page=5') as response:runs=json.load(response)['workflow_runs']
    for run in runs:
        if run['head_sha'].startswith('abeae80') and run['status']!='completed':
            req=urllib.request.Request(BASE+'actions/runs/'+str(run['id'])+'/cancel',data=b'',method='POST',headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','User-Agent':'Morph-Desktop-CI'})
            with urllib.request.urlopen(req,timeout=30) as response:print('Cancelled superseded test run',run['id'],response.status)
elif len(sys.argv)>1 and sys.argv[1]=='logs':
    job=sys.argv[2]
    assert job.isdigit()
    with get('actions/jobs/'+job+'/logs') as response:logs=response.read().decode('utf-8',errors='replace')
    limit=min(100000,max(1000,int(sys.argv[3]))) if len(sys.argv)>3 else 9000
    print(logs[-limit:].encode('ascii','backslashreplace').decode())
elif len(sys.argv)>1 and sys.argv[1]=='download':
    artifact=sys.argv[2]
    assert artifact.isdigit()
    with get('actions/artifacts/'+artifact) as response:metadata=json.load(response)
    destination=Path(os.environ.get('MORPH_PC_ARTIFACT_DIR',str(Path(__file__).resolve().parent/'dist')))
    destination.mkdir(parents=True,exist_ok=True)
    dest=destination/('mac-artifact-'+artifact+'.zip')
    with get('actions/artifacts/'+artifact+'/zip') as response,dest.open('wb') as file:
        while block:=response.read(1024*1024):file.write(block)
    digest=hashlib.file_digest(dest.open('rb'),'sha256').hexdigest()
    if metadata.get('digest'):assert metadata['digest']=='sha256:'+digest
    print(json.dumps({'downloaded':str(dest),'name':metadata['name'],'bytes':dest.stat().st_size,'sha256':digest}))
else:
    with get('actions/runs?branch=codex%2Fdesktop-macos&per_page=2') as response:runs=json.load(response)['workflow_runs']
    out=[]
    for run in runs:
        with get('actions/runs/'+str(run['id'])+'/jobs') as response:jobs=json.load(response)['jobs']
        with get('actions/runs/'+str(run['id'])+'/artifacts') as response:artifacts=json.load(response)['artifacts']
        out.append({'id':run['id'],'status':run['status'],'conclusion':run['conclusion'],'url':run['html_url'],'sha':run['head_sha'],'jobs':[{'id':job['id'],'name':job['name'],'status':job['status'],'conclusion':job['conclusion'],'steps':[{'name':s['name'],'status':s['status'],'conclusion':s.get('conclusion')} for s in job['steps']]} for job in jobs],'artifacts':[{'id':a['id'],'name':a['name'],'bytes':a['size_in_bytes']} for a in artifacts]})
    print(json.dumps(out,ensure_ascii=True,indent=2))
