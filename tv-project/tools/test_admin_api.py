import hashlib,http.client,json,os,secrets,socket,sqlite3,subprocess,sys,tempfile,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
origin='http://127.0.0.1:'+str(port)
password=secrets.token_urlsafe(24);salt=secrets.token_bytes(16)
encoded='pbkdf2_sha256$600000$'+salt.hex()+'$'+hashlib.pbkdf2_hmac('sha256',password.encode(),salt,600000).hex()
with tempfile.TemporaryDirectory() as temp:
 env=dict(os.environ,MORPH_DATA_DIR=temp,MORPH_SITE_ROOT=str(ROOT/'distribution'),MORPH_API_PORT=str(port),MORPH_PUBLIC_ORIGIN=origin,MORPH_ADMIN_PASSWORD_HASH=encoded)
 proc=subprocess.Popen([sys.executable,str(ROOT/'distribution/community/server.py')],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  for _ in range(100):
   try:
    c=http.client.HTTPConnection('127.0.0.1',port,timeout=2);c.request('GET','/api/community/health');r=c.getresponse();r.read();c.close()
    if r.status==200:break
   except OSError:pass
   time.sleep(.05)
  with sqlite3.connect(Path(temp)/'plus.sqlite3') as db:
   now=int(time.time())
   for oid,source,mode,revoked,expires in [('a','stripe','live',0,None),('b','stripe','live',0,now-1),('c','stripe','live',1,None),('d','stripe','test',0,None)]:
    db.execute('INSERT INTO orders(id,proof,plan,paid,revoked,created,source,mode,expires) VALUES (?,?,?,1,?,?,?,?,?)',(oid,'test-proof','single',revoked,now,source,mode,expires))
  db.close()
  env.update(MORPH_TEST_ORIGIN=origin,MORPH_TEST_PASSWORD=password)
  subprocess.run(['node',str(ROOT/'tv-project/tools/check-admin.cjs')],env=env,check=True)
 finally:proc.terminate();proc.wait(timeout=10)
