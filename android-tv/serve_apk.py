"""Serve only the public Android TV APK, including HEAD and range downloads."""
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import json,re,time
APK=Path(__file__).resolve().parent/'TV-Morph-Android-TV-Preview.apk'
LOG=APK.parent/'download-server.log'
class Handler(BaseHTTPRequestHandler):
 def log_message(self,fmt,*args):
  with LOG.open('a',encoding='utf-8') as f:f.write(time.strftime('%H:%M:%S ')+(fmt%args)+'\n')
 def do_HEAD(self):self.serve(True)
 def do_GET(self):self.serve(False)
 def serve(self,head):
  path=self.path.split('?',1)[0]
  if path=='/':
   data='''<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>TV Morph</title><body style="background:#101522;color:white;font:24px Arial;padding:45px;line-height:2"><h1>TV Morph</h1><p>تطبيق التلفزيون لأجهزة Android / Google TV</p><a href="/tv-morph.apk" download="TV-Morph-TV.apk" style="display:inline-block;background:#d5bdec;color:#211830;border-radius:15px;padding:20px 35px">تنزيل تطبيق التلفزيون</a><p>بعد التنزيل افتح الملف واضغط تثبيت، ثم افتح TV Morph من قائمة التطبيقات.</p></body></html>'''.encode('utf-8')
   self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers()
   if not head:self.wfile.write(data)
   return
  if path!='/tv-morph.apk':self.send_error(404);return
  size=APK.stat().st_size;start=0;end=size-1;partial=False
  if self.headers.get('Range'):
   m=re.fullmatch(r'bytes=(\d+)-(\d*)',self.headers['Range'])
   if not m:self.send_error(416);return
   start=int(m[1]);end=min(int(m[2]) if m[2] else size-1,size-1);partial=True
   if start> end:self.send_error(416);return
  self.send_response(206 if partial else 200)
  for k,v in {'Content-Type':'application/vnd.android.package-archive','Content-Disposition':'attachment; filename="TV-Morph-TV.apk"','Content-Length':str(end-start+1),'Accept-Ranges':'bytes','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}.items():self.send_header(k,v)
  if partial:self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
  self.end_headers()
  if head:return
  try:
   with APK.open('rb') as f:
    f.seek(start);left=end-start+1
    while left:
     data=f.read(min(left,65536));self.wfile.write(data);left-=len(data)
   self.log_message('APK complete: %s bytes',end-start+1)
  except (BrokenPipeError,ConnectionResetError):self.log_message('APK download interrupted')
if __name__=='__main__':ThreadingHTTPServer(('0.0.0.0',8790),Handler).serve_forever()
