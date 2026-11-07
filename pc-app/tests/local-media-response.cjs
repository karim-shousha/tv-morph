const {localMediaResponse}=require('../local-media-response.cjs');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'morph-range-')),file=path.join(folder,'fixture.bin'),data=Buffer.from(Array.from({length:4096},(_,i)=>i%251));
 try{
  await fs.writeFile(file,data);
  for(const [range,status,start,end] of [[null,200,0,4095],['bytes=100-199',206,100,199],['bytes=4000-',206,4000,4095],['bytes=-20',206,4076,4095],['bytes=4090-9999',206,4090,4095],['bytes=9999-',416],['bytes=8-2',416],['bytes=-0',416],['bytes=bad',200,0,4095]]){
   const response=await localMediaResponse(new Request('https://local.test/file',{headers:range?{Range:range}:{}}),file,'video/mp4');
   assert.equal(response.status,status,range);assert.equal(response.headers.get('accept-ranges'),'bytes');
   if(status===416){assert.equal(response.headers.get('content-range'),'bytes */4096');continue;}
   assert.deepEqual(Buffer.from(await response.arrayBuffer()),data.subarray(start,end+1));assert.equal(Number(response.headers.get('content-length')),end-start+1);
   if(status===206)assert.equal(response.headers.get('content-range'),`bytes ${start}-${end}/4096`);
  }
  const head=await localMediaResponse(new Request('https://local.test/file',{method:'HEAD'}),file);assert.equal(head.headers.get('content-length'),'4096');assert.equal((await head.arrayBuffer()).byteLength,0);
  await fs.writeFile(file,'');const empty=await localMediaResponse(new Request('https://local.test/file'),file);assert.equal(empty.status,200);assert.equal((await empty.arrayBuffer()).byteLength,0);
  console.log('PASS local media full/partial/open/suffix/clamped/invalid ranges, HEAD and empty files');
 }finally{await fs.unlink(file);await fs.rmdir(folder);}
})().catch(e=>{console.error(e);process.exitCode=1});
