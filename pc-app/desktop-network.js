(function(w){'use strict';
if(!w.MorphPC&&w.parent!==w)w.MorphPC=w.parent.MorphPC;
let cleanup=null;
w.NetworkNative={capabilities:()=>JSON.stringify({discovery:true,transport:true,credentials:true,rtsp:false,playback:'Desktop HTML5 / HLS / MPEG-TS'}),settingsJson:()=>localStorage.getItem('cleartv.settings')||'{}',showKeyboard:id=>{const input=document.getElementById(id);if(input){input.readOnly=false;input.focus();}},cancel:()=>MorphPC.network('cancel',{}).catch(()=>{}),exit:()=>{if(w.parent!==w&&w.parent.ClearTV&&w.parent.ClearTV.NetworkScreen){w.parent.ClearTV.NetworkScreen.close();return;}location.href='../index.html';},request:(id,action,value)=>{
 const payload=JSON.parse(value||'{}');let task;
 if(action==='play'){
  const box=document.getElementById('media');if(cleanup)cleanup();box.hidden=false;box.textContent='';const close=()=>{if(cleanup){cleanup();cleanup=null;}box.textContent='';box.hidden=true;};cleanup=ClearTV.USBMedia.open(box,payload.url,payload.name||'Network media','video',close);
  const video=box.querySelector('video');if(video)MorphDesktopMedia.attach(video,payload.url,{kind:payload.live?'live':'vod'},text=>ClearTV.toast(text));
  task=Promise.resolve({sent:true});
 }else task=MorphPC.network(action,payload);
 task.then(result=>w.networkResult(id,true,result),error=>w.networkResult(id,false,error.message));
}};
w.addEventListener('pagehide',()=>{if(cleanup)cleanup();MorphPC.network('cancel',{}).catch(()=>{});});
})(window);
