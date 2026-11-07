from pathlib import Path
import sys,threading,json,urllib.request,urllib.error,unittest,time
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'distribution/community'))
import qr_link
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_POST(self):qr_link.handle(self,self.path)
 def do_OPTIONS(self):qr_link.handle(self,self.path)
class RelayCheck(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=cls.server.serve_forever,daemon=True).start();cls.url='http://127.0.0.1:'+str(cls.server.server_port)+'/api/iptv-link'
 @classmethod
 def tearDownClass(cls):cls.server.shutdown();cls.server.server_close()
 def request(self,data):
  request=urllib.request.Request(self.url,json.dumps(data).encode(),{'Content-Type':'application/json'})
  try:
   with urllib.request.urlopen(request) as response:return response.status,json.load(response)
  except urllib.error.HTTPError as response:
   with response:return response.code,json.load(response)
 def test_four_methods_and_capability_roles(self):
  for method in ['xtream','m3u','portal','file']:
   status,pair=self.request(dict(action='create',method=method));self.assertEqual(status,200)
   sid=pair['id'];read=pair['read'];write=pair['write']
   self.assertEqual(self.request(dict(action='poll',id=sid,token=write))[0],401)
   self.assertEqual(self.request(dict(action='send',id=sid,token=read,box='A'*24,nonce='N'*32))[0],401)
   self.assertEqual(self.request(dict(action='send',id=sid,token=write,box='A'*64,nonce='N'*32))[0],200)
   self.assertNotIn('password',repr(qr_link._sessions[sid]))
   status,message=self.request(dict(action='poll',id=sid,token=read));self.assertEqual(message['payload']['box'],'A'*64)
   self.assertEqual(self.request(dict(action='send',id=sid,token=write,box='A'*64,nonce='N'*32))[0],409)
   self.assertEqual(self.request(dict(action='ack',id=sid,token=read,connected=True))[0],200)
   self.assertIsNone(qr_link._sessions[sid]['payload'])
   self.assertEqual(self.request(dict(action='ack',id=sid,token=read,connected=True))[0],200)
   self.assertEqual(self.request(dict(action='status',id=sid,token=write))[1]['status'],'connected')
   self.request(dict(action='cancel',id=sid,token=read))
 def test_invalid_expired_and_cancelled(self):
  self.assertEqual(self.request(dict(action='create',method='unknown'))[0],400)
  _,pair=self.request(dict(action='create',method='m3u'));qr_link._sessions[pair['id']]['until']=time.monotonic()-1
  self.assertEqual(self.request(dict(action='poll',id=pair['id'],token=pair['read']))[0],401)
  _,pair=self.request(dict(action='create',method='m3u'));self.request(dict(action='cancel',id=pair['id'],token=pair['read']))
  self.assertEqual(self.request(dict(action='poll',id=pair['id'],token=pair['read']))[0],401)
 def test_retry_after_provider_failure(self):
  _,p=self.request(dict(action='create',method='xtream'))
  for attempt in range(2):
   self.assertEqual(self.request(dict(action='send',id=p['id'],token=p['write'],box='A'*64,nonce='N'*32))[0],200)
   self.request(dict(action='poll',id=p['id'],token=p['read']))
   self.assertEqual(self.request(dict(action='ack',id=p['id'],token=p['read'],connected=False))[0],200)
  self.request(dict(action='cancel',id=p['id'],token=p['read']))
if __name__=='__main__':unittest.main()
