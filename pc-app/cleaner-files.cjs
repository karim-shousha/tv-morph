/* Filesystem adapter shared by desktop and jailed webOS services. ES5 for old webOS Node. */
'use strict';
var fs=require('fs'),path=require('path'),crypto=require('crypto');
exports.create=function(options){
 var records=Object.create(null),scanSerial=0;
 function inside(root,file){return file===root||file.indexOf(root+path.sep)===0;}
 function errorText(e){return String(e&&e.message||e);}
 function scan(scope,roots,done){
  var serial=++scanSerial;records=Object.create(null);var result={files:[],bytes:0,errors:[],truncated:false},queue=[],visited=Object.create(null),started=Date.now(),processed=0;
  roots.forEach(function(root){try{var real=fs.realpathSync(root),stat=fs.lstatSync(root);if(stat.isSymbolicLink()||!stat.isDirectory()||real===path.parse(real).root)throw Error('Not an allowed scan folder');queue.push({file:real,root:real,depth:0});}catch(e){result.errors.push(root+': '+errorText(e));}});
  function next(){if(serial!==scanSerial){done(Error('Scan replaced'));return;}if(!queue.length||processed>=10000||result.files.length>=2000||Date.now()-started>15000){result.truncated=!!queue.length;done(null,result);return;}var batch=0;
   while(queue.length&&batch++<40&&result.files.length<2000){var row=queue.shift();processed++;try{var stat=fs.lstatSync(row.file);if(stat.isSymbolicLink())continue;var real=fs.realpathSync(row.file);if(real!==row.file||!inside(row.root,real))continue;if(stat.isDirectory()){if(row.depth<8){fs.readdirSync(real).forEach(function(name){if(name==='.'||name==='..'||name.indexOf(path.sep)>=0)return;queue.push({file:path.join(real,name),root:row.root,depth:row.depth+1});});}else result.truncated=true;continue;}if(!stat.isFile()||(scope==='installers'&&!/\.(apk|wgt|ipk|tpk|rpm|msi|exe|dmg|pkg)$/i.test(real)))continue;var id=crypto.randomBytes(16).toString('hex'),name=path.basename(real),entry={id:id,name:name,path:real,size:stat.size,modified:stat.mtime.getTime(),hidden:name.charAt(0)==='.',kind:scope==='cache'?'Cache':scope==='installers'?'Install package':'File'};records[id]={row:entry,root:row.root,ino:stat.ino,dev:stat.dev};result.files.push(entry);result.bytes+=stat.size;}catch(e){result.errors.push(row.file+': '+errorText(e));}}
   setImmediate(next);
  }next();
 }
 function remove(ids,done){var result={ids:[],bytes:0,errors:[]};if(!Array.isArray(ids)||ids.length>2000){done(Error('Invalid selection'));return;}var seen=Object.create(null);ids.forEach(function(id){if(typeof id!=='string'||seen[id])return;seen[id]=true;var record=records[id];try{if(!record)throw Error('Selection expired. Scan again.');var row=record.row,stat=fs.lstatSync(row.path);if(!stat.isFile()||stat.isSymbolicLink()||fs.realpathSync(row.path)!==row.path||!inside(record.root,row.path)||stat.size!==row.size||stat.mtime.getTime()!==row.modified||stat.ino!==record.ino||stat.dev!==record.dev)throw Error('File changed. Scan again.');fs.unlinkSync(row.path);delete records[id];result.ids.push(id);result.bytes+=row.size;}catch(e){result.errors.push((record?record.row.name:'Selection')+': '+errorText(e));}});done(null,result);}
 return {scan:scan,remove:remove};
};
