from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import re,time
root=Path(__file__).resolve().parents[2]/'.tools/player251-check'
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  name=self.path.split('?')[0].lstrip('/')
  if name not in ['sample.mp4','layout.mp4']:self.send_error(404);return
  path=root/name;size=path.stat().st_size;start=0;end=size-1
  match=re.fullmatch(r'bytes=(\d+)-(\d*)',self.headers.get('Range',''))
  if match:start=int(match[1]);end=min(size-1,int(match[2])) if match[2] else size-1
  if start>=size:self.send_error(416);return
  self.send_response(206 if match else 200);self.send_header('Content-Type','video/mp4');self.send_header('Accept-Ranges','bytes');self.send_header('Content-Length',str(end-start+1))
  if match:self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
  self.end_headers();sent=0;begin=time.monotonic()
  try:
   with path.open('rb') as source:
    source.seek(start)
    while sent<end-start+1:
     data=source.read(min(32768,end-start+1-sent))
     if not data:break
     self.wfile.write(data);self.wfile.flush();sent+=len(data)
     if name=='sample.mp4':time.sleep(max(0,sent/1000000-(time.monotonic()-begin)))
  except (BrokenPipeError,ConnectionResetError):pass
ThreadingHTTPServer(('127.0.0.1',8766),Handler).serve_forever()
