from pathlib import Path
import http.client,json,os,socket,subprocess,sys,tempfile,time
ROOT=Path(__file__).resolve().parents[2]
NGINX=ROOT/'.tools/nginx-validation/nginx-1.28.0/nginx.exe'
def port():
    with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]
front,back=port(),port();temporary=tempfile.TemporaryDirectory();base=Path(temporary.name);site=base/'site';site.mkdir();(base/'logs').mkdir();(base/'temp').mkdir()
catalog=json.loads((ROOT/'distribution/catalog.json').read_text(encoding='utf-8'))
for row in catalog['releases']:(site/row['file']).write_bytes(b'test-only');row['bytes']=9
(site/'catalog.json').write_text(json.dumps(catalog));(site/'index.html').write_text('isolated test')
config=(ROOT/'distribution/nginx.conf').read_text().replace('listen 80;','listen '+str(front)+';').replace('/usr/share/nginx/html',site.as_posix()).replace('127.0.0.1:8081','127.0.0.1:'+str(back))

for name in ['admin.html','admin.js','admin.css','plus-admin.js','plus-admin.css','community-admin.js']:
    (site/name).write_bytes((ROOT/'distribution'/name).read_bytes())
(base/'site.conf').write_text(config)
(base/'nginx.conf').write_text('events {}\nhttp { include "'+(NGINX.parent/'conf/mime.types').as_posix()+'"; include "'+(base/'site.conf').as_posix()+'"; }\n')
args=[str(NGINX),'-p',base.as_posix()+'/', '-c',str(base/'nginx.conf')]
check=subprocess.run(args+['-t'],capture_output=True,text=True)
assert check.returncode==0,check.stderr
env=dict(os.environ,MORPH_DATA_DIR=str(base/'data'),MORPH_SITE_ROOT=str(site),MORPH_API_PORT=str(back),MORPH_PUBLIC_ORIGIN='http://127.0.0.1:'+str(front))
api=subprocess.Popen([sys.executable,str(ROOT/'distribution/community/server.py')],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
nginx=subprocess.Popen(args,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def get(method,path,headers=None):
    c=http.client.HTTPConnection('127.0.0.1',front,timeout=10);c.request(method,path,headers={'User-Agent':'MorphBrowserTest/1',**(headers or {})});r=c.getresponse();body=r.read();status=r.status;h=dict(r.getheaders());c.close();return status,h,body
try:
    for _ in range(100):
        try:
            if get('GET','/api/community/health')[0]==200:break
        except OSError:pass
        time.sleep(.05)
    else:raise AssertionError('nginx/API not ready')
    status,h,body=get('GET','/admin');assert status==200 and b'overview-metrics' in body
    assert 'no-store' in h['Cache-Control'] and "frame-ancestors 'none'" in h['Content-Security-Policy']
    for route,fragment in [('/plus-admin','#plus'),('/community-admin','#reviews')]:
        status,h,_=get('GET',route);assert status==302 and h['Location'].endswith('/admin'+fragment)
    assert get('GET','/api/admin/overview')[0]==401
    status,h,body=get('GET','/api/sports/competitions');assert status==503 and json.loads(body)['error']=='configuration_required'
    assert h['Access-Control-Allow-Origin']=='*'
    for name in ['admin.js','admin.css']:assert get('GET','/'+name)[0]==200
    print('PASS real nginx: unified admin document/assets, old route redirects, no-store/CSP, protected metrics, TV Sports CORS/configuration state')
finally:
    if api.poll() is None:api.terminate();api.wait(timeout=5)
    subprocess.run(args+['-s','quit'],capture_output=True);nginx.wait(timeout=10);time.sleep(.2);temporary.cleanup()
