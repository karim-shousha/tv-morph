"""Read-only capability check. Credentials stay in memory and are never printed."""
import os,subprocess,json,urllib.request
env=dict(os.environ,GIT_TERMINAL_PROMPT='0')
p=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',capture_output=True,text=True,env=env)
values=dict(line.split('=',1) for line in p.stdout.splitlines() if '=' in line)
token=values.get('password')
if not token:
    print('No existing GitHub credential available.')
    raise SystemExit(0)
request=urllib.request.Request('https://api.github.com/repos/karim-shousha/tv-morph',headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','User-Agent':'Morph-Desktop-Build'})
with urllib.request.urlopen(request,timeout=20) as response:
    repo=json.load(response)
    print(json.dumps({'private':repo['private'],'archived':repo['archived'],'defaultBranch':repo['default_branch'],'permissions':repo.get('permissions',{}),'tokenScopes':response.headers.get('X-OAuth-Scopes','')},ensure_ascii=True))
for endpoint in ['hooks','actions/secrets','actions/workflows']:
    req=urllib.request.Request('https://api.github.com/repos/karim-shousha/tv-morph/'+endpoint,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','User-Agent':'Morph-Desktop-Build'})
    with urllib.request.urlopen(req,timeout=20) as response:rows=json.load(response)
    if endpoint=='hooks':
        from urllib.parse import urlsplit
        print(json.dumps({'hooks':[{'id':r['id'],'name':r['name'],'active':r['active'],'events':r['events'],'host':urlsplit(r['config'].get('url','')).hostname,'lastResponseCode':r.get('last_response',{}).get('code')} for r in rows]}))
    elif endpoint=='actions/secrets':print(json.dumps({'secretNames':[s['name'] for s in rows.get('secrets',[])]}))
    else:print(json.dumps({'workflows':[{'id':w['id'],'path':w['path'],'state':w['state']} for w in rows.get('workflows',[])]}))
