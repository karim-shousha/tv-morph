const {contextBridge,ipcRenderer}=require('electron');
const call=(name,...args)=>ipcRenderer.invoke('pc:'+name,...args);
contextBridge.exposeInMainWorld('MorphPC',{
 cleaner:(action,payload)=>call('cleaner',action,payload),plusIdentity:()=>call('plusIdentity'),clearPlusIdentity:()=>call('clearPlusIdentity'),savePlusIdentity:value=>call('savePlusIdentity',value),apps:()=>call('apps'),launch:id=>call('launch',id),external:url=>call('external',url),
 settings:kind=>call('settings',kind),fullscreen:()=>call('fullscreen'),startup:on=>call('startup',on),
 update:action=>call('update',action),info:()=>call('info'),exit:()=>call('exit'),pickFolder:()=>call('pickFolder'),pickMedia:()=>call('pickMedia'),
 vpn:(action,id)=>call('vpn',action,id),directory:(id,relative)=>call('directory',id,relative),pickSubtitle:()=>call('pickSubtitle'),pickPlaylist:()=>call('pickPlaylist'),network:(action,payload)=>call('network',action,payload)
});
