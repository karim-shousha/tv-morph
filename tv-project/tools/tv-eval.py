import sys,json,urllib.request
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'.tools/python'))
import websocket
port=sys.argv[1]
expr=sys.stdin.read()
w=websocket.create_connection(json.load(urllib.request.urlopen('http://10.0.0.153:'+port+'/json',timeout=5))[0]['webSocketDebuggerUrl'],timeout=25)
w.send(json.dumps({'id':1,'method':'Runtime.evaluate','params':{'expression':expr,'returnByValue':True,'awaitPromise':True}}))
while True:
 r=json.loads(w.recv())
 if r.get('id')==1:
  print(json.dumps(r,ensure_ascii=True));break
w.close()
