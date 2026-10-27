import urllib.request,json,sys
sys.path.insert(0,'.tools/python');import websocket
p=next(p for p in json.load(urllib.request.urlopen('http://127.0.0.1:9223/json',timeout=5)) if 'android_asset' in p.get('url',''))
w=websocket.create_connection(p['webSocketDebuggerUrl'],timeout=10,suppress_origin=True)
w.send(json.dumps({'id':1,'method':'Runtime.evaluate','params':{'expression':sys.stdin.read(),'returnByValue':True,'awaitPromise':True}}))
while True:
 r=json.loads(w.recv())
 if r.get('id')==1:print(json.dumps(r,ensure_ascii=True));break
w.close()
