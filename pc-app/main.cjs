const {app,BrowserWindow,ipcMain,protocol,net,shell,dialog,Menu,session}=require('electron');
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');const {execFile}=require('node:child_process');
protocol.registerSchemesAsPrivileged([{scheme:'morph',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,corsEnabled:true}}]);
if(process.env.MORPH_PC_TEST_DATA)app.setPath('userData',process.env.MORPH_PC_TEST_DATA);
app.setName('Morph Launcher');
app.commandLine.appendSwitch('enable-blink-features','AudioVideoTracks');
const UI=path.resolve(process.env.MORPH_PC_UI_DIR||path.join(__dirname,'build','ui'));let win;let installed=[];let scanTask;
let matches;
const roots=new Map(),files=new Map();
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.m3u8':'application/vnd.apple.mpegurl','.ts':'video/mp2t','.vtt':'text/vtt','.woff2':'font/woff2'};
const csp="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: http:; media-src 'self' blob: https: http:; connect-src 'self' https: http: blob:; font-src 'self' data:; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'";
function trusted(event){if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame||!event.senderFrame.url.startsWith('morph://app/'))throw Error('Untrusted caller');}
function register(name,fn){ipcMain.handle('pc:'+name,async(e,...args)=>{trusted(e);return fn(...args);});}
function external(raw){const u=new URL(String(raw));if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Unsupported address');return shell.openExternal(u.href);}
function scanApps(){if(scanTask)return scanTask;scanTask=new Promise(resolve=>{
 if(process.platform==='darwin'){
  const found=[];function walk(folder,depth){try{for(const item of fs.readdirSync(folder,{withFileTypes:true})){if(!item.isDirectory())continue;const target=path.join(folder,item.name);if(item.name.endsWith('.app')){if(item.name!=='Morph Launcher.app')found.push({id:'mac:'+target,name:item.name.slice(0,-4),installed:true,launchable:true});}else if(depth>0)walk(target,depth-1);}}catch{}}
  for(const folder of ['/Applications','/System/Applications',path.join(app.getPath('home'),'Applications')])walk(folder,2);installed=[...new Map(found.map(row=>[row.id,row])).values()];resolve(installed);return;
 }
 execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command',"[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; Get-StartApps | Select-Object Name,AppID | ConvertTo-Json -Compress"],{windowsHide:true,timeout:20000,maxBuffer:8*1024*1024,encoding:'utf8'},(error,out)=>{
  if(!error)try{const rows=JSON.parse(out.replace(/^\uFEFF/,''));installed=(Array.isArray(rows)?rows:[rows]).filter(x=>x&&typeof x.Name==='string'&&typeof x.AppID==='string'&&!/morph.launcher.pc|Morph Launcher/i.test(x.Name)).slice(0,3000).map(x=>({id:'windows:'+x.AppID,name:x.Name,installed:true,launchable:true}));}catch{}
  resolve(installed);
 });}).finally(()=>{scanTask=null;});return scanTask;}
function settings(which){const addresses={wifi:'ms-settings:network-wifi',network:'ms-settings:network',display:'ms-settings:display',sound:'ms-settings:sound',apps:'ms-settings:appsfeatures',system:'ms-settings:about',store:'ms-windows-store://home'};if(!addresses[which])throw Error('Unknown settings');if(process.platform==='darwin')return shell.openPath(which==='store'?'/System/Applications/App Store.app':'/System/Applications/System Settings.app').then(error=>{if(error)throw Error(error);});return shell.openExternal(addresses[which]);}
function within(base,target){return target===base||target.startsWith(base+path.sep);}
function rootPath(id,relative=''){const base=roots.get(id);if(!base||typeof relative!=='string')throw Error('Unknown folder');const target=fs.realpathSync(path.resolve(base,relative));if(!within(base,target))throw Error('Folder is outside the selected location');return target;}
function fileURL(target){const token=crypto.randomBytes(24).toString('hex');files.set(token,target);return 'morph://app/__file/'+token+'/'+encodeURIComponent(path.basename(target));}
register('apps',scanApps);
register('launch',async id=>{if(typeof id!=='string'||!installed.some(x=>x.id===id))throw Error('Refresh the application list first');return new Promise((resolve,reject)=>execFile(process.platform==='darwin'?'/usr/bin/open':'explorer.exe',process.platform==='darwin'?['-a',id.slice(4)]:['shell:AppsFolder\\'+id.slice(8)],{windowsHide:true},error=>error?reject(Error('Could not open the application')):resolve(true)));});
register('external',external);register('settings',settings);
register('fullscreen',()=>{const requested=!win.isFullScreen();win.setFullScreen(requested);return requested;});
register('startup',on=>{if(typeof on!=='boolean')throw Error('Invalid startup setting');app.setLoginItemSettings({openAtLogin:on,path:process.execPath});return app.getLoginItemSettings().openAtLogin;});
const updater=require('./updater.cjs').create({app,dialog,shell,net,getWindow:()=>win,launchInstaller:target=>new Promise((resolve,reject)=>{const child=require('node:child_process').spawn(target,[],{detached:true,stdio:'ignore',windowsHide:false});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});})});register('update',updater);
register('info',()=>({version:app.getVersion(),platform:process.platform,startup:app.getLoginItemSettings().openAtLogin,packaged:app.isPackaged}));
register('clearPlusIdentity',()=>{const file=path.join(app.getPath('userData'),'plus-identity-v1.json');if(fs.existsSync(file)){const value=JSON.parse(fs.readFileSync(file,'utf8'));delete value.token;fs.writeFileSync(file+'.tmp',JSON.stringify(value),{mode:0o600});fs.renameSync(file+'.tmp',file);}return true;});
register('plusIdentity',()=>{try{const value=JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'plus-identity-v1.json'),'utf8'));if(!value||!/^[A-Za-z0-9_-]{20,80}$/.test(value.device||'')||(value.token&&!/^[A-Za-z0-9_-]{32,128}$/.test(value.token)))throw Error('Invalid Plus identity');return value;}catch(error){if(error.code==='ENOENT')return null;throw Error('Could not restore Plus identity');}});
register('savePlusIdentity',value=>{if(!value||!/^[A-Za-z0-9_-]{20,80}$/.test(value.device||'')||(value.token&&!/^[A-Za-z0-9_-]{32,128}$/.test(value.token)))throw Error('Invalid Plus identity');const target=path.join(app.getPath('userData'),'plus-identity-v1.json');fs.writeFileSync(target+'.tmp',JSON.stringify({device:value.device,token:value.token||'',scope:'tv'}),{mode:0o600});fs.renameSync(target+'.tmp',target);return true;});
const cleaner=require('./cleaner-files.cjs').create();let cleanerFolder=null;
register('cleaner',async(action,payload)=>{if(action==='storage'){const stats=await fs.promises.statfs(app.getPath('userData'));return {total:stats.blocks*stats.bsize,free:stats.bavail*stats.bsize};}if(action==='remove')return new Promise((resolve,reject)=>cleaner.remove(payload,(e,r)=>e?reject(e):resolve(r)));if(action!=='scan'||!['files','folder','cache','installers'].includes(payload))throw Error('Invalid Cleaner request');if(payload==='folder'||(payload!=='cache'&&!cleanerFolder)){const picked=await dialog.showOpenDialog(win,{properties:['openDirectory'],title:'Choose a folder for Cleaner to review'});if(picked.canceled)return {files:[],errors:[]};const selected=fs.realpathSync(picked.filePaths[0]);const blocked=[app.getPath('exe'),process.env.WINDIR||'/System','/System','/Library','/usr','/bin','/sbin','/etc','/private'];if(selected===path.parse(selected).root||blocked.some(root=>selected===root||selected.startsWith(root+path.sep)))throw Error('Choose a user folder, not a system folder.');cleanerFolder=selected;}const paths=payload==='cache'?[path.join(app.getPath('userData'),'Cache'),path.join(app.getPath('userData'),'GPUCache')]:[cleanerFolder];return new Promise((resolve,reject)=>cleaner.scan(payload,paths,(e,r)=>e?reject(e):resolve(r)));});
register('exit',()=>win.close());
const vpn=require('./vpn.cjs').create({app,dialog,safeStorage:require('electron').safeStorage,getWindow:()=>win});register('vpn',vpn);
register('network',(action,payload)=>require('./lan.cjs').call(action,payload));
register('pickMedia',async()=>{const picked=await dialog.showOpenDialog(win,{properties:['openFile'],title:'Open a media file',filters:[{name:'Media files',extensions:['mp4','mkv','avi','mov','webm','m4v','ts','mpg','mpeg','mp3','aac','m4a','wav','flac','ogg','opus','jpg','jpeg','png','webp','gif']},{name:'All files',extensions:['*']}]});if(picked.canceled||!picked.filePaths.length)return null;const file=fs.realpathSync(picked.filePaths[0]),base=path.dirname(file),id=crypto.randomBytes(24).toString('hex');roots.set(id,base);return {id,name:path.basename(base)||base,selected:path.basename(file)};});
register('pickFolder',async()=>{const picked=await dialog.showOpenDialog(win,{properties:['openDirectory'],title:'Choose a media folder or USB drive'});if(picked.canceled)return null;const base=fs.realpathSync(picked.filePaths[0]),id=crypto.randomBytes(24).toString('hex');roots.set(id,base);return {id,name:path.basename(base)||base};});
register('directory',async(id,relative='')=>{const base=rootPath(id),folder=rootPath(id,relative);const entries=await fs.promises.readdir(folder,{withFileTypes:true});const rows=[];for(const entry of entries.slice(0,10000)){if(!entry.isFile()&&!entry.isDirectory())continue;const target=path.join(folder,entry.name);rows.push({name:entry.name,directory:entry.isDirectory(),relative:path.relative(base,target),url:entry.isFile()?fileURL(target):''});}return rows.sort((a,b)=>Number(b.directory)-Number(a.directory)||a.name.localeCompare(b.name));});
register('pickPlaylist',async()=>{const p=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'IPTV playlists',extensions:['m3u','m3u8']} ]});if(p.canceled)return null;const stat=await fs.promises.stat(p.filePaths[0]);if(stat.size>64*1024*1024)throw Error('Playlist is too large');return {name:path.basename(p.filePaths[0]),text:await fs.promises.readFile(p.filePaths[0],'utf8')};});
register('pickSubtitle',async()=>{const p=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Subtitles',extensions:['srt','vtt']}]});if(p.canceled)return null;const file=p.filePaths[0],stat=await fs.promises.stat(file);if(stat.size>5*1024*1024||!['.srt','.vtt'].includes(path.extname(file).toLowerCase()))throw Error('Unsupported subtitle file');return {name:path.basename(file),text:await fs.promises.readFile(file,'utf8')};});
async function route(request){try{
 const u=new URL(request.url);if(u.host!=='app')return new Response('Not found',{status:404});
 if(u.pathname==='/__matches'){if(!matches)matches=new (require('./matches.cjs').Matches)(app.getPath('userData'),(url,options)=>net.fetch(url,options));return Response.json(await matches.snapshot());}
 if(u.pathname==='/__remote'){
  const target=new URL(u.searchParams.get('url'));if(!['http:','https:'].includes(target.protocol)||target.username||target.password)return new Response('Unsupported URL',{status:400});
  const speedPost=request.method==='POST'&&target.origin==='https://speed.cloudflare.com'&&target.pathname==='/__up';
  const relayPost=request.method==='POST'&&target.origin==='https://morph-tv.com'&&(target.pathname==='/api/iptv-link'||/^\/api\/plus\/(status|activate|devices|remove-device|parent-reset|deactivate)$/.test(target.pathname));
  const plusAsset=target.origin==='https://morph-tv.com'&&/^\/api\/plus\/assets\/[A-Za-z0-9._-]+$/.test(target.pathname);
  if(!['GET','HEAD'].includes(request.method)&&!relayPost&&!speedPost)return new Response('Method not allowed',{status:405});
  const headers={};for(const key of ['range','accept','if-range']){const value=request.headers.get(key);if(value)headers[key]=value;}
  // Paid artwork uses bearer authorization; keep it on the trusted asset route only.
  if(plusAsset){const authorization=request.headers.get('authorization');if(authorization)headers.Authorization=authorization;}
  let body;if(relayPost||speedPost){body=await request.arrayBuffer();if(body.byteLength>(speedPost?4000000:1048576))return new Response('Too large',{status:413});headers['Content-Type']=speedPost?'application/octet-stream':'application/json';}
  const upstream=await net.fetch(target.href,{method:request.method,headers,body,redirect:(relayPost||speedPost||plusAsset)?'error':'follow',signal:request.signal,credentials:'omit'});
  const responseHeaders=new Headers(upstream.headers);responseHeaders.delete('set-cookie');responseHeaders.set('Access-Control-Allow-Origin','*');responseHeaders.set('Access-Control-Expose-Headers','*');responseHeaders.set('X-Morph-Upstream-URL',upstream.url||target.href);return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});
 }
 if(u.pathname.startsWith('/__file/')){const token=u.pathname.split('/')[2],target=files.get(token);if(!target)return new Response('Unknown file',{status:404});return net.fetch(pathToFileURL(target).href,{headers:request.headers});}
 const relative=decodeURIComponent(u.pathname).replace(/^\/+/,''),target=path.resolve(UI,relative||'index.html');if(!within(UI,target))return new Response('Forbidden',{status:403});
 if(!fs.existsSync(target)||!fs.statSync(target).isFile())return new Response('Not found',{status:404});
 const headers={'Content-Type':mime[path.extname(target).toLowerCase()]||'application/octet-stream','Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
 return new Response(await fs.promises.readFile(target),{headers});
 }catch{return new Response('Request failed',{status:502});}}
async function createWindow(){
 if(!app.isPackaged)await session.defaultSession.clearCache();
 protocol.handle('morph',route);Menu.setApplicationMenu(null);
 win=new BrowserWindow({title:'Morph Launcher',width:1440,height:900,minWidth:960,minHeight:600,backgroundColor:'#111c31',icon:path.join(__dirname,'build/icon.ico'),show:false,autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,backgroundThrottling:false,autoplayPolicy:'no-user-gesture-required'}});
 win.webContents.setWindowOpenHandler(({url})=>{external(url).catch(()=>{});return {action:'deny'};});
 win.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('morph://app/')){e.preventDefault();external(url).catch(()=>{});}});
 win.webContents.session.webRequest.onBeforeSendHeaders({urls:['https://www.youtube.com/embed/*','https://www.youtube-nocookie.com/embed/*']},(details,callback)=>{if(details.webContentsId===win.webContents.id)details.requestHeaders.Referer='https://morph-tv.com/';callback({requestHeaders:details.requestHeaders});});
 win.webContents.session.setPermissionRequestHandler((_wc,permission,callback)=>callback(false));
 win.webContents.on('before-input-event',(e,input)=>{if(input.type==='keyDown'&&input.key==='F11'){e.preventDefault();if(!input.isAutoRepeat)win.setFullScreen(!win.isFullScreen());}if(input.type==='keyDown'&&input.key==='Escape'&&win.isFullScreen()){e.preventDefault();if(!input.isAutoRepeat)win.setFullScreen(false);}if(!app.isPackaged&&input.type==='keyDown'&&(input.control||input.meta)&&input.key.toLowerCase()==='r'){e.preventDefault();win.webContents.reload();}});
 win.once('ready-to-show',()=>{win.maximize();win.show();});
 await win.loadURL('morph://app/index.html');
}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.show();win.focus();}});
 app.whenReady().then(createWindow).catch(error=>{dialog.showErrorBox('Morph Launcher',error.message);app.quit();});
 app.on('window-all-closed',()=>app.quit());
}
