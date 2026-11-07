/* Public filesystem API, shared by all Samsung editions. Scan results are not guesses. */
(function(w){'use strict';if(!w.tizen||!tizen.filesystem)return;
 w.CleanerBackend=function(){var scanned={},serial=0,roots=['/home/owner/share/tmp/sdk_tools','/home/owner/share/tmp/sdk_tools/tmp'];
 function message(e){return String(e&&e.name||'Error')+': '+String(e&&e.message||e||'Unavailable');}
 function read(scope,done){scanned={};var output={files:[],bytes:0,errors:[],truncated:false},queue=[],visited={},deadline=Date.now()+15000,finished=false;var timer=setTimeout(function(){if(!finished){finished=true;output.truncated=true;output.errors.push('Scan time limit reached.');done(null,output);}},16000);function finish(){if(finished)return;finished=true;clearTimeout(timer);done(null,output);}
  function begin(){var left=scope==='installers'?roots:scope==='cache'?['cache']:['downloads','documents','images','music','videos'];for(var i=0;i<left.length;i++)queue.push({path:left[i],depth:0});if(scope==='files'&&tizen.filesystem.listStorages){try{tizen.filesystem.listStorages(function(stores){if(finished)return;for(var j=0;j<stores.length;j++)if(stores[j].type==='EXTERNAL'&&stores[j].state==='MOUNTED')queue.push({path:stores[j].label,depth:0});next();},function(){next();});}catch(e){next();}}else next();}
  function next(){if(finished)return;if(!queue.length||output.files.length>=2000||Date.now()>deadline){output.truncated=!!queue.length;finish();return;}var item=queue.shift();if(visited[item.path]){next();return;}visited[item.path]=true;
   function failed(e){if(!e||e.name!=='NotFoundError')output.errors.push(item.path+': '+message(e));next();}
   try{tizen.filesystem.resolve(item.path,function(dir){if(finished)return;try{dir.listFiles(function(files){if(finished)return;for(var i=0;i<files.length&&output.files.length<2000;i++){var f=files[i],p=String(f.fullPath||''),base=String(dir.fullPath||'').replace(/\/$/,'')+'/';if(p.indexOf(base)!==0||p.slice(base.length).indexOf('/')>=0||p.indexOf('/../')>=0)continue;if(f.isDirectory){if(scope!=='installers'&&item.depth<8)queue.push({path:p,depth:item.depth+1});continue;}if(scope==='installers'&&!/\.(wgt|tpk|rpm)$/i.test(f.name))continue;var id='t'+(++serial)+'-'+Math.random().toString(36).slice(2),row={id:id,name:f.name,path:p,size:Number(f.fileSize)||0,modified:f.modified?Number(f.modified):0,hidden:String(f.name).charAt(0)==='.',kind:scope==='installers'?'Install package':scope==='cache'?'Cache':'File'};scanned[id]=row;output.files.push(row);output.bytes+=row.size;}next();},failed);}catch(e){failed(e);}},failed,'r');}catch(e){failed(e);}
  }begin();
 }
 function remove(ids,done){var result={ids:[],bytes:0,errors:[]},i=0;if(ids.length>2000){done(Error('Selection is too large.'));return;}
  function next(){if(i===ids.length){done(null,result);return;}var id=ids[i++],row=scanned[id];if(!row){result.errors.push('Selection expired. Scan again.');next();return;}var parent=row.path.slice(0,row.path.lastIndexOf('/'));
   function fail(e){result.errors.push(row.name+': '+message(e));next();}
   try{tizen.filesystem.resolve(parent,function(dir){dir.listFiles(function(files){var f=null;for(var j=0;j<files.length;j++)if(files[j].fullPath===row.path)f=files[j];if(!f||f.isDirectory||Number(f.fileSize)!==row.size||(f.modified?Number(f.modified):0)!==row.modified){fail('File changed. Scan again.');return;}var ok=function(){result.ids.push(id);result.bytes+=row.size;delete scanned[id];next();};try{if(typeof tizen.filesystem.deleteFile==='function')tizen.filesystem.deleteFile(row.path,ok,fail);else dir.deleteFile(row.path,ok,fail);}catch(e){fail(e);}},fail);},fail,'rw');}catch(e){fail(e);}
  }next();
 }
 return {scan:read,remove:remove};};
})(window);
