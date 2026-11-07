/* Seekable responses for files already authorized by the desktop file picker. */
const fs=require('node:fs');
const {Readable}=require('node:stream');

async function localMediaResponse(request,target,contentType='application/octet-stream'){
 const method=request.method||'GET';
 if(method!=='GET'&&method!=='HEAD')return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
 const stat=await fs.promises.stat(target);
 if(!stat.isFile())return new Response(null,{status:404});
 const size=stat.size,headers={'Content-Type':contentType,'Accept-Ranges':'bytes','Cache-Control':'no-store'};
 let start=0,end=size-1,status=200;
 // Range applies to GET. Ignore malformed/multipart ranges; never label a
 // partial body as 200, which makes Chromium lose the file's seekable duration.
 const range=method==='GET'&&request.headers.get('range'),match=range&&/^bytes=(\d*)-(\d*)$/.exec(range.trim());
 if(match&&(match[1]||match[2])){
  if(match[1]){start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
  else start=Math.max(0,size-Number(match[2]));
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size||!size){
   return new Response(null,{status:416,headers:{...headers,'Content-Range':'bytes */'+size,'Content-Length':'0'}});
  }
  status=206;headers['Content-Range']='bytes '+start+'-'+end+'/'+size;
 }
 headers['Content-Length']=String(size?end-start+1:0);
 const body=method==='HEAD'||!size?null:Readable.toWeb(fs.createReadStream(target,{start,end,signal:request.signal}));
 return new Response(body,{status,headers});
}
module.exports={localMediaResponse};
