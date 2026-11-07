'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ORIGIN='https://morph-tv.com',RELEASE='https://github.com/karim-shousha/tv-morph/releases/download/';
function version(v){if(!/^\d{1,9}\.\d{1,9}\.\d{1,9}$/.test(v||''))throw Error('Invalid update version');return v.split('.').map(Number);}
function newer(a,b){const x=version(a),y=version(b);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]>y[i];return false;}
function allowedURL(raw){const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&(u.origin===ORIGIN||u.hostname==='github.com'&&u.pathname.startsWith('/karim-shousha/tv-morph/releases/download/')||u.hostname==='release-assets.githubusercontent.com');}
function asset(manifest,platform){
 version(manifest.version);const name=platform==='win32'?`Morph-Launcher-PC-${manifest.version}-Setup.exe`:platform==='darwin'?`Morph-Launcher-Mac-${manifest.version}-universal.dmg`:'';
 const row=(manifest.assets||[]).find(a=>a.file===name);
 if(!name||!row||row.url!==RELEASE+`desktop-v${manifest.version}/`+name||!Number.isSafeInteger(row.bytes)||row.bytes<=0||row.bytes>1024*1024*1024||!/^[0-9a-f]{64}$/.test(row.sha256||''))throw Error('Invalid update package');
 return row;
}
function create({app,dialog,shell,net,getWindow,launchInstaller}){
 let busy=false;
 async function get(url){for(let i=0;i<6;i++){if(!allowedURL(url))throw Error('Untrusted update address');const response=await net.fetch(url,{redirect:'manual',headers:{'User-Agent':'MorphTV/Updates','Accept-Encoding':'identity'},signal:AbortSignal.timeout(900000)});if([301,302,303,307,308].includes(response.status)){const next=response.headers.get('location');await response.body?.cancel();if(!next)throw Error('Missing update address');url=new URL(next,url).href;continue;}if(!response.ok)throw Error('Update service unavailable');return response;}throw Error('Too many update redirects');}
 async function check(){const response=await get(ORIGIN+'/desktop-release.json?check='+Date.now());let size=0;const chunks=[];for await(const b of response.body){size+=b.length;if(size>262144)throw Error('Update manifest too large');chunks.push(Buffer.from(b));}const manifest=JSON.parse(Buffer.concat(chunks).toString('utf8')),row=asset(manifest,process.platform);return {installed:app.getVersion(),latest:manifest.version,available:newer(manifest.version,app.getVersion()),platform:process.platform,bytes:row.bytes,row};}
 async function download(row){
  const folder=path.join(app.getPath('userData'),'updates');await fs.promises.mkdir(folder,{recursive:true});const target=path.join(folder,row.file),partial=target+'.partial',hash=crypto.createHash('sha256');let handle,total=0;
  try{const response=await get(row.url);handle=await fs.promises.open(partial,'w',0o600);for await(const b of response.body){total+=b.length;if(total>row.bytes)throw Error('Update exceeds its verified size');hash.update(b);await handle.writeFile(b);getWindow()?.setProgressBar(total/row.bytes);}await handle.close();handle=null;if(total!==row.bytes||hash.digest('hex')!==row.sha256)throw Error('Update checksum rejected');await fs.promises.rename(partial,target);return target;}
  catch(e){if(handle)await handle.close();await fs.promises.rm(partial,{force:true});throw e;}finally{getWindow()?.setProgressBar(-1);}
 }
 return async function(action){
  if(!['check','install'].includes(action))throw Error('Unknown update action');if(busy)return {busy:true};busy=true;
  try{const info=await check();if(action==='check'||!info.available)return {...info,row:undefined};
   const choice=await dialog.showMessageBox(getWindow(),{type:'info',title:'Morph Launcher update',message:`Update to ${info.latest}?`,detail:process.platform==='darwin'?'The verified installer will download here and open. Follow the macOS installation steps; your profiles and settings are kept.':'The verified update will download here, then the installer will open. Windows may ask you to approve installation. Your profiles and settings are kept.',buttons:['Download update','Later'],defaultId:1,cancelId:1});if(choice.response!==0)return {cancelled:true};
   const target=await download(info.row);
   if(process.platform==='win32'){await launchInstaller(target);app.quit();return {installing:true};}
   const error=await shell.openPath(target);if(error)throw Error('Could not open the verified installer');return {installerOpened:true,latest:info.latest};
  }finally{busy=false;}
 };
}
module.exports={create,asset,allowedURL,newer};
