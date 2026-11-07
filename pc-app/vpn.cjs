/* OS tunnel integration. Never return private keys to the renderer. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFile}=require('node:child_process');
function validate(text){
 if(typeof text!=='string'||Buffer.byteLength(text)>65536||text.includes('\0'))throw Error('Invalid WireGuard configuration');
 let section='',iface=0,peers=0,privateKey=false,publicKey=false,endpoint=false;
 const allowed={Interface:['PrivateKey','Address','DNS','ListenPort','MTU'],Peer:['PublicKey','PresharedKey','AllowedIPs','Endpoint','PersistentKeepalive']};
 for(const raw of text.split(/\r?\n/)){const line=raw.trim();if(!line||line[0]==='#')continue;const header=/^\[(Interface|Peer)\]$/.exec(line);if(header){section=header[1];if(section==='Interface')iface++;else peers++;continue;}const entry=/^([A-Za-z]+)\s*=\s*(.+)$/.exec(line);if(!entry||!allowed[section]||!allowed[section].includes(entry[1]))throw Error('Unsupported WireGuard setting; scripts are not allowed');const key=entry[1],value=entry[2].trim();if(/Key$/.test(key)&&!(/^[A-Za-z0-9+/]{43}=$/.test(value)))throw Error('Invalid WireGuard key');if(key==='PrivateKey')privateKey=true;if(key==='PublicKey')publicKey=true;if(key==='Endpoint')endpoint=true;}
 if(iface!==1||!peers||!privateKey||!publicKey||!endpoint)throw Error('Incomplete WireGuard configuration');return text;
}
function create({app,dialog,safeStorage,getWindow}){
 const folder=()=>path.join(app.getPath('userData'),'vpn-profiles');
 const macEngine=()=>['/opt/homebrew/bin','/usr/local/bin'].map(dir=>path.join(dir,'wg-quick')).find(p=>['wg-quick','wg','wireguard-go','bash'].every(n=>fs.existsSync(path.join(path.dirname(p),n))));
 const engine=()=>process.platform==='darwin'?macEngine():process.platform==='win32'?[path.join(process.env.ProgramW6432||'C:/Program Files','WireGuard','wireguard.exe'),path.join(process.env.ProgramFiles||'C:/Program Files','WireGuard','wireguard.exe')].find(p=>fs.existsSync(p)):null;
 function read(){try{return JSON.parse(fs.readFileSync(path.join(folder(),'index.json'),'utf8'));}catch{return [];}}
 function write(rows){fs.mkdirSync(folder(),{recursive:true});fs.writeFileSync(path.join(folder(),'index.json'),JSON.stringify(rows),{mode:0o600});}
 function execute(file,args){return new Promise((resolve,reject)=>execFile(file,args,{windowsHide:true,timeout:30000,maxBuffer:1024*1024},(e,out)=>e?reject(Error('VPN operation failed or system permission was cancelled')):resolve(out)));}
 async function running(id){if(process.platform==='darwin'){try{const device=fs.readFileSync('/var/run/wireguard/morph'+id.slice(0,8)+'.name','utf8').trim();if(!/^utun[0-9]+$/.test(device))return false;await execute('/sbin/ifconfig',[device]);return true;}catch{return null;}}if(process.platform!=='win32')return false;try{const out=await execute('sc.exe',['query','WireGuardTunnel$Morph'+id]);return /STATE\s*:\s*4\b/.test(out);}catch{return false;}}
 async function elevate(exe,args){const quote=s=>"'"+s.replace(/'/g,"''")+"'";const script='$p=Start-Process -FilePath '+quote(exe)+' -ArgumentList '+quote(args.map(a=>'"'+a+'"').join(' '))+' -Verb RunAs -WindowStyle Hidden -Wait -PassThru; exit $p.ExitCode';return execute('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')]);}
 let busy=false;
 return async function(action,id){
  if(action==='status'){const rows=read();return {available:!!engine(),platform:process.platform,canImport:['win32','darwin'].includes(process.platform)&&safeStorage.isEncryptionAvailable(),profiles:await Promise.all(rows.map(async p=>({id:p.id,name:p.name,requested:!!p.requested,running:await running(p.id)})))};}
  if(busy)throw Error('A VPN operation is already in progress');busy=true;
  try{
   if(!['win32','darwin'].includes(process.platform))throw Error('Integrated VPN is not available on this platform yet');
   if(action==='import'){
    if(!safeStorage.isEncryptionAvailable())throw Error('Secure profile storage is unavailable');
    const picked=await dialog.showOpenDialog(getWindow(),{title:'Import WireGuard configuration',properties:['openFile'],filters:[{name:'WireGuard',extensions:['conf']}]});if(picked.canceled)return;
    const file=picked.filePaths[0];if(fs.statSync(file).size>65536)throw Error('Configuration is too large');const text=validate(fs.readFileSync(file,'utf8')),rows=read(),id=crypto.randomBytes(8).toString('hex');
    fs.mkdirSync(folder(),{recursive:true});fs.writeFileSync(path.join(folder(),id+'.enc'),safeStorage.encryptString(text),{mode:0o600});rows.push({id,name:path.basename(file,'.conf').slice(0,60)});write(rows);return;
   }
   if(!/^[a-f0-9]{16}$/.test(id||'')||!read().some(p=>p.id===id))throw Error('Unknown VPN profile');
   if(process.platform==='darwin'){
    const rows=read(),profile=rows.find(p=>p.id===id),config=path.join(folder(),'morph'+id.slice(0,8)+'.conf');
    if(action==='remove'){if(profile.requested)throw Error('Disconnect the tunnel before deleting it');fs.unlinkSync(path.join(folder(),id+'.enc'));try{fs.unlinkSync(config);}catch{}write(rows.filter(p=>p.id!==id));return;}
    const tool=engine();if(!tool)throw Error('Install WireGuard tools, wireguard-go and Bash 4+ for macOS first');
    const quote=value=>"'"+value.replace(/'/g,"'\"'\"'")+"'";
    if(action==='connect'){
     if(rows.some(p=>p.id!==id&&p.requested))throw Error('Disconnect the active Morph tunnel first');
     const text=validate(safeStorage.decryptString(fs.readFileSync(path.join(folder(),id+'.enc'))));fs.writeFileSync(config,text,{mode:0o600});fs.chmodSync(config,0o600);
     try{await execute('/usr/bin/osascript',['-e','do shell script '+JSON.stringify(quote(tool)+' up '+quote(config))+' with administrator privileges']);profile.requested=true;write(rows);}catch(e){try{fs.unlinkSync(config);}catch{}throw e;}return;
    }
    if(action==='disconnect'){await execute('/usr/bin/osascript',['-e','do shell script '+JSON.stringify(quote(tool)+' down '+quote(config))+' with administrator privileges']);profile.requested=false;write(rows);try{fs.unlinkSync(config);}catch{}return;}
    throw Error('Unknown VPN action');
   }
   if(action==='remove'){if(await running(id))throw Error('Disconnect the tunnel before deleting it');fs.unlinkSync(path.join(folder(),id+'.enc'));try{fs.unlinkSync(path.join(folder(),'Morph'+id+'.conf'));}catch{}write(read().filter(p=>p.id!==id));return;}
   const exe=engine();if(!exe)throw Error('Install official WireGuard for Windows first');
   if(action==='connect'){
    const other=read().filter(p=>p.id!==id);for(const p of other)if(await running(p.id))throw Error('Disconnect the active Morph tunnel first');
    const config=path.join(folder(),'Morph'+id+'.conf'),text=validate(safeStorage.decryptString(fs.readFileSync(path.join(folder(),id+'.enc'))));
    /* The service requires the file for its lifetime. Restrict it to the current user, SYSTEM and administrators. */
    fs.writeFileSync(config,text,{mode:0o600});try{const sid=(await execute('whoami.exe',['/user','/fo','csv','/nh'])).match(/S-1-5-[0-9-]+/);if(!sid)throw Error('Could not secure profile');await execute('icacls.exe',[config,'/inheritance:r','/grant:r','*'+sid[0]+':F','*S-1-5-18:F','*S-1-5-32-544:F']);await elevate(exe,['/installtunnelservice',config]);}catch(e){try{fs.unlinkSync(config);}catch{}throw e;}return;
   }
   if(action==='disconnect'){await elevate(exe,['/uninstalltunnelservice','Morph'+id]);try{fs.unlinkSync(path.join(folder(),'Morph'+id+'.conf'));}catch{}return;}
   throw Error('Unknown VPN action');
  }finally{busy=false;}
 };
}
module.exports={create,validate};
