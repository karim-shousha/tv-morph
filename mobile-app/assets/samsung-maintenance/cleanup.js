/* ES5, including Tizen 2.3. Only package files directly in the two install staging folders. */
(function(w){'use strict';
 var dirs=['/home/owner/share/tmp/sdk_tools','/home/owner/share/tmp/sdk_tools/tmp'],snapshot=[],revision=0;
 var state={busy:false,files:[],errors:[],bytes:0,revision:0};
 function allowed(path){for(var i=0;i<dirs.length;i++){var prefix=dirs[i]+'/',name=path.indexOf(prefix)===0?path.slice(prefix.length):'';if(name&&name.indexOf('/')<0&&name.indexOf('\\')<0&&name!=='.'&&name!=='..'&&/\.(wgt|tpk|rpm)$/i.test(name))return true;}return false;}
 function error(e){return String(e&&e.name||'Error')+': '+String(e&&e.message||e||'Unknown error');}
 function scan(){if(state.busy)return;state={busy:true,files:[],errors:[],bytes:0,revision:++revision};w.MorphInstallCleanup.state=state;snapshot=[];var index=0;
  function next(){if(index===dirs.length){snapshot=state.files.slice();state.busy=false;return;}var path=dirs[index++];
   function fail(e){if(!e||e.name!=='NotFoundError')state.errors.push(path+': '+error(e));next();}
   try{tizen.filesystem.resolve(path,function(dir){try{dir.listFiles(function(files){for(var i=0;i<files.length;i++){var f=files[i],full=String(f.fullPath||'');if(!f.isDirectory&&allowed(full)){var row={name:f.name,path:full,size:Number(f.fileSize)||0,modified:f.modified?Number(f.modified):0};state.files.push(row);state.bytes+=row.size;}}next();},fail);}catch(e){fail(e);}},fail,'r');}catch(e){fail(e);}
  }next();
 }
 function clear(expected){if(state.busy)throw Error('Cleanup is busy');if(expected!==state.revision||!snapshot.length)throw Error('Scan again before cleanup');var rows=snapshot.slice(),i=0;state={busy:true,files:[],errors:[],bytes:0,deleted:0,revision:++revision};w.MorphInstallCleanup.state=state;snapshot=[];
  function next(){if(i===rows.length){state.busy=false;return;}var row=rows[i++];if(!allowed(row.path)){state.errors.push('Refused unsafe path');next();return;}var parent=row.path.slice(0,row.path.lastIndexOf('/'));
   function fail(e){state.errors.push(row.name+': '+error(e));next();}
   try{tizen.filesystem.resolve(parent,function(dir){try{dir.listFiles(function(files){var found=null;for(var j=0;j<files.length;j++)if(files[j].fullPath===row.path)found=files[j];if(!found){next();return;}if(found.isDirectory||Number(found.fileSize)!==row.size||(found.modified?Number(found.modified):0)!==row.modified){fail('File changed; scan again');return;}
    var done=function(){state.deleted++;state.bytes+=row.size;next();};try{if(typeof tizen.filesystem.deleteFile==='function')tizen.filesystem.deleteFile(row.path,done,fail);else dir.deleteFile(row.path,done,fail);}catch(e){fail(e);}
   },fail);}catch(e){fail(e);}},fail,'rw');}catch(e){fail(e);}
  }next();
 }
 w.MorphInstallCleanup={state:state,scan:scan,clear:clear};
})(window);
