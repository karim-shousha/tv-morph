const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'../assets/samsung-maintenance/cleanup.js'),'utf8');
const root='/home/owner/share/tmp/sdk_tools';
function fixture(modern=true){
 const deleted=[],files=[{name:'MorphImport-old.wgt',fullPath:root+'/MorphImport-old.wgt',fileSize:14000,isDirectory:false,modified:new Date(1000)},{name:'keep.txt',fullPath:root+'/keep.txt',fileSize:30,isDirectory:false},{name:'escape.wgt',fullPath:'/opt/usr/apps/installed.wgt',fileSize:500,isDirectory:false},{name:'nested.wgt',fullPath:root+'/nested/other.wgt',fileSize:500,isDirectory:false},{name:'folder.wgt',fullPath:root+'/folder.wgt',fileSize:500,isDirectory:true}];
 const filesystem={resolve(p,ok,fail){if(p!==root){fail({name:'NotFoundError'});return;}ok({listFiles(ok){ok(files);},deleteFile:del});}};
 function del(p,ok){assert(p===root+'/MorphImport-old.wgt');deleted.push(p);ok();}
 if(modern)filesystem.deleteFile=del;
 const ctx={window:{},tizen:{filesystem}};vm.runInNewContext(script,ctx);return {api:ctx.window.MorphInstallCleanup,files,deleted};
}
for(const modern of [true,false]){const f=fixture(modern);f.api.scan();assert.equal(f.api.state.files.length,1);assert.equal(f.api.state.bytes,14000);assert.equal(f.deleted.length,0);const rev=f.api.state.revision;assert.throws(()=>f.api.clear(rev+1),/Scan again/);f.api.clear(rev);assert.equal(f.api.state.deleted,1);assert.equal(f.api.state.bytes,14000);assert.equal(f.deleted.length,1);assert.throws(()=>f.api.clear(rev),/Scan again/);}
{const f=fixture();f.api.scan();f.files[0].fileSize++;f.api.clear(f.api.state.revision);assert.equal(f.deleted.length,0);assert.match(f.api.state.errors[0],/changed/);}
{const f=fixture();f.api.scan();f.files[0].modified=new Date(2000);f.api.clear(f.api.state.revision);assert.equal(f.deleted.length,0);}
console.log('PASS cleanup: preview only, directory and extension restrictions, stale revision, changed files, modern and old Tizen deletion APIs.');
