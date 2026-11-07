/* Windows transport for the shared HTML5 player. No catalog/UI fork. */
(function(w){'use strict';
 const engines=new WeakMap(),jobs=new WeakMap();
 function detach(video){const job=jobs.get(video);if(job&&job.abort)job.abort.abort();if(job&&job.cleanupAudio)job.cleanupAudio();jobs.delete(video);if(document.pictureInPictureElement===video)document.exitPictureInPicture().catch(()=>{});const old=engines.get(video);if(old){try{old.destroy();}catch{}engines.delete(video);}if(video._subtitleURL)URL.revokeObjectURL(video._subtitleURL);}
 function label(ar,en){return w.MorphLocale?MorphLocale.t(ar,en):en;}
 function language(track){let value=String(track.language||track.lang||'').toLowerCase().split('-')[0];return ({eng:'en',ara:'ar',fra:'fr',fre:'fr',spa:'es',deu:'de',ger:'de',ita:'it',hin:'hi',und:''})[value]??value;}
 function audioLabel(track,index){return w.MorphPlayerChrome&&MorphPlayerChrome.audioLabel?MorphPlayerChrome.audioLabel(track,index):track.name||track.label||track.lang||track.language||label('المسار ','Track ')+(index+1);}
 function audioPreference(){try{return JSON.parse(localStorage.getItem('morph.pc.audio-preference')||'null');}catch{return null;}}
 function chooseAudio(video,index,manual){const job=jobs.get(video);if(!job)return false;const engine=engines.get(video),hls=w.Hls&&engine instanceof Hls,tracks=hls?engine.audioTracks:Array.from(video.audioTracks||[]);if(!tracks[index])return false;job.changingAudio=true;try{if(hls)engine.audioTrack=index;else if(w.MorphPlayerChrome&&MorphPlayerChrome.selectAudio)MorphPlayerChrome.selectAudio(video,index);else{tracks.forEach((track,i)=>{if(i!==index&&track.enabled)track.enabled=false;});tracks[index].enabled=true;}if(manual){job.manualAudio=true;job.audioIndex=index;const lang=language(tracks[index]);if(lang)try{localStorage.setItem('morph.pc.audio-preference',JSON.stringify({language:lang}));}catch{}}}finally{job.changingAudio=false;}return true;}
 function wireAudio(video,job,current){
  const nativeList=video.audioTracks;
  function ensure(){if(!current()||job.changingAudio)return;const engine=engines.get(video),hls=w.Hls&&engine instanceof Hls,tracks=hls?engine.audioTracks:Array.from(video.audioTracks||[]);if(!tracks.length)return;const preferred=audioPreference(),desired=!job.manualAudio&&preferred?tracks.findIndex(track=>language(track)===preferred.language):-1;const active=hls?engine.audioTrack:tracks.findIndex(track=>track.enabled);if(!job.audioInitialized){job.audioInitialized=true;chooseAudio(video,job.manualAudio&&tracks[job.audioIndex]?job.audioIndex:desired>=0?desired:active>=0?active:0,false);return;}if(desired>=0&&active!==desired){chooseAudio(video,desired,false);return;}if(active<0)chooseAudio(video,job.manualAudio&&tracks[job.audioIndex]?job.audioIndex:0,false);}
  const events=['loadedmetadata','loadeddata','canplay','playing'];events.forEach(name=>video.addEventListener(name,ensure));if(nativeList&&nativeList.addEventListener)['addtrack','change'].forEach(name=>nativeList.addEventListener(name,ensure));
  job.ensureAudio=ensure;job.cleanupAudio=()=>{events.forEach(name=>video.removeEventListener(name,ensure));if(nativeList&&nativeList.removeEventListener)['addtrack','change'].forEach(name=>nativeList.removeEventListener(name,ensure));};
 }
 function trackRows(video,subtitles){
  const engine=engines.get(video),hls=w.Hls&&engine instanceof Hls,rows=[];
  if(subtitles)rows.push({label:label('إيقاف','Off'),selected:(!hls||engine.subtitleTrack<0)&&!Array.from(video.textTracks||[]).some(t=>t.mode==='showing'),action:()=>{if(hls)engine.subtitleTrack=-1;Array.from(video.textTracks||[]).forEach(t=>t.mode='disabled');}});
  const tracks=hls?(subtitles?engine.subtitleTracks:engine.audioTracks):Array.from((subtitles?video.textTracks:video.audioTracks)||[]);
  tracks.forEach((track,index)=>rows.push({label:subtitles?track.name||track.label||track.lang||track.language||'Track '+(index+1):audioLabel(track,index),selected:hls?(subtitles?engine.subtitleTrack:engine.audioTrack)===index:subtitles?track.mode==='showing':track.enabled,action:()=>{if(!subtitles){chooseAudio(video,index,true);return;}if(hls){if(subtitles){video.querySelectorAll('track[data-local]').forEach(t=>t.track.mode='disabled');engine.subtitleTrack=index;engine.subtitleDisplay=true;}else engine.audioTrack=index;}else tracks.forEach((t,i)=>{if(subtitles)t.mode=i===index?'showing':'disabled';else t.enabled=i===index;});}}));
  if(subtitles&&hls)video.querySelectorAll('track[data-local]').forEach(node=>rows.push({label:node.label,selected:node.track.mode==='showing',action:()=>{engine.subtitleTrack=-1;Array.from(video.textTracks||[]).forEach(t=>t.mode='disabled');node.track.mode='showing';}}));
  if(!tracks.length)rows.push({label:label(subtitles?'المصدر لم يوفّر مسارات ترجمة قابلة للاختيار.':'المصدر لم يوفّر مسارات صوت إضافية قابلة للاختيار.',subtitles?'No selectable subtitle tracks supplied by this source.':'No additional selectable audio tracks supplied by this source.')});
  if(subtitles&&w.MorphPC.pickSubtitle)rows.push({label:label('فتح ملف ترجمة SRT / VTT…','Open subtitle file SRT / VTT…'),action:async()=>{const file=await MorphPC.pickSubtitle();if(!file)return;let text=file.text.replace(/^\uFEFF/,'');if(!/^WEBVTT/.test(text))text='WEBVTT\n\n'+text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g,'$1.$2');const url=URL.createObjectURL(new Blob([text],{type:'text/vtt'}));if(video._subtitleURL)URL.revokeObjectURL(video._subtitleURL);video._subtitleURL=url;video.querySelectorAll('track[data-local]').forEach(t=>t.remove());if(hls){engine.subtitleTrack=-1;engine.subtitleDisplay=false;}Array.from(video.textTracks||[]).forEach(t=>t.mode='disabled');const node=document.createElement('track');node.dataset.local='';node.kind='subtitles';node.label=file.name;node.src=url;node.default=true;video.appendChild(node);node.track.mode='showing';node.onload=()=>{Array.from(video.textTracks||[]).forEach(t=>t.mode=t===node.track?'showing':'disabled');};}});
  return rows;
 }
 function qualityRows(video){const engine=engines.get(video);if(w.Hls&&engine instanceof Hls&&engine.levels.length>1)return [{label:'Auto',selected:engine.autoLevelEnabled,action:()=>engine.currentLevel=-1}].concat(engine.levels.map((level,index)=>({label:level.height?level.height+'p':Math.round(level.bitrate/1000)+' kbps',selected:!engine.autoLevelEnabled&&engine.currentLevel===index,action:()=>engine.currentLevel=index})));return [{label:label('الجودة الأصلية من المصدر','Original source quality')+(video.videoHeight?' · '+video.videoWidth+' × '+video.videoHeight:'')}];}
 function streamType(url,mime){
  if(/mpegurl/i.test(mime||'')||/\.m3u8(?:[?#]|$)/i.test(url))return 'hls';
  if(/(?:mp2t|mpeg-?ts)/i.test(mime||'')||/\.ts(?:[?#]|$)/i.test(url))return 'mpegts';
  if(/(?:x-flv|video\/flv)/i.test(mime||'')||/\.flv(?:[?#]|$)/i.test(url))return 'flv';
  if(/^(?:video|audio)\//i.test(mime||'')||/\.(?:mp4|m4v|webm|mov|mkv|mp3|aac|ogg)(?:[?#]|$)/i.test(url))return 'native';
  return '';
 }
 async function detectStream(url,item,job){
  const controller=new AbortController();job.abort=controller;const timer=setTimeout(()=>controller.abort(),5000);
  try{
   try{const head=await fetch(url,{method:'HEAD',signal:controller.signal});const type=head.ok&&streamType(head.url||url,head.headers.get('content-type'));if(type)return type;}catch(error){if(controller.signal.aborted)throw error;}
   // Some providers reject HEAD or label their stream as octet-stream. Read only
   // a small prefix, then close that probe before the actual player connects.
   const response=await fetch(url,{headers:{Range:'bytes=0-2047'},signal:controller.signal});
   if(!response.ok)throw Error('Stream metadata unavailable');
   const known=streamType(response.url||url,response.headers.get('content-type'));
   if(known){if(response.body)await response.body.cancel();return known;}
   const reader=response.body&&response.body.getReader();if(!reader)return item.kind==='live'?'mpegts':'native';
   try{const chunk=await reader.read(),bytes=chunk.value||new Uint8Array();const text=new TextDecoder().decode(bytes.subarray(0,64)).replace(/^\uFEFF/,'').trimStart();if(text.startsWith('#EXTM3U'))return 'hls';if(bytes[0]===0x47&&(bytes.length<189||bytes[188]===0x47))return 'mpegts';if(bytes[0]===70&&bytes[1]===76&&bytes[2]===86)return 'flv';if(bytes[4]===102&&bytes[5]===116&&bytes[6]===121&&bytes[7]===112)return 'native';return item.kind==='live'?'mpegts':'native';}finally{await reader.cancel().catch(()=>{});}
  }finally{clearTimeout(timer);}
 }
 function attach(video,url,item,fail){
  detach(video);const job={abort:null};jobs.set(video,job);const current=()=>jobs.get(video)===job;wireAudio(video,job,current);
  const message=status=>{if(current())fail(status===401||status===403?'المزوّد رفض طلب الفيديو · Provider refused playback · HTTP '+status:'تعذّر تشغيل البث أو الترميز غير مدعوم · Could not play this stream/codec.');};
  const play=()=>video.play().catch(error=>{if(!current()||error.name==='AbortError')return;if(error.name==='NotAllowedError')fail('اضغط تشغيل لبدء الفيديو · Click Play.');else message();});
  function start(type){if(!current())return;
   if(type==='hls'&&w.Hls&&Hls.isSupported()){
    const engine=new Hls({enableWorker:true,backBufferLength:30,maxBufferLength:item.kind==='live'?20:40});engines.set(video,engine);video.dispatchEvent(new Event('morphdesktopengine'));
    let recovered=false,switched=false;engine.on(Hls.Events.ERROR,(_event,data)=>{if(!current())return;const status=data.response&&data.response.code;if(status===401||status===403){message(status);return;}if(!switched&&item.kind==='live'&&data.type===Hls.ErrorTypes.NETWORK_ERROR&&(data.fatal||status===404||status===410)&&/\/live\/[^?#]+\.m3u8(?:[?#]|$)/i.test(url)){switched=true;attach(video,url.replace(/\.m3u8(?=[?#]|$)/i,'.ts'),item,fail);return;}if(!data.fatal)return;if(data.type===Hls.ErrorTypes.MEDIA_ERROR&&!recovered){recovered=true;engine.recoverMediaError();}else message();});
    engine.on(Hls.Events.AUDIO_TRACKS_UPDATED,job.ensureAudio);engine.on(Hls.Events.AUDIO_TRACK_SWITCHED,job.ensureAudio);engine.on(Hls.Events.MANIFEST_PARSED,()=>{job.ensureAudio();play();});engine.loadSource(url);engine.attachMedia(video);
   }else if((type==='mpegts'||type==='flv')&&w.mpegts&&mpegts.isSupported()){
    const engine=mpegts.createPlayer({type,isLive:item.kind==='live',url:w.MorphDesktopURL?w.MorphDesktopURL(url):url},{enableWorker:true,enableStashBuffer:item.kind!=='live',lazyLoad:item.kind!=='live'});
    engines.set(video,engine);video.dispatchEvent(new Event('morphdesktopengine'));engine.on(mpegts.Events.ERROR,message);engine.attachMediaElement(video);engine.load();play();
   }else{video.dispatchEvent(new Event('morphdesktopengine'));video.src=w.MorphDesktopURL?w.MorphDesktopURL(url):url;play();}
  }
  const known=streamType(url,'');if(known)start(known);else detectStream(url,item,job).then(start).catch(()=>{if(current())start(item.kind==='live'?'mpegts':'native');});
 }

 function controls(overlay,video,wake){
  const toolbar=overlay.querySelector('.morph2-btnrow');if(!toolbar)return;
  // Keep playback presentation in the shared TV chrome; only restore device volume here.
  const saved=Number(localStorage.getItem('morph.pc.volume'));if(localStorage.getItem('morph.pc.volume')!==null&&Number.isFinite(saved))video.volume=Math.max(0,Math.min(1,saved));
  function fullscreen(){wake();return w.MorphPC.fullscreen().catch(()=>{const status=overlay.querySelector('.morph2-status');if(status)status.textContent='تعذّر ملء الشاشة · Could not enter fullscreen';});}
  const full=document.createElement('button');full.className='morph2-btn morph-player-top-tool pc-player-fullscreen';full.textContent='⛶';full.title='ملء الشاشة · Fullscreen (F11)';full.setAttribute('aria-label','Toggle player fullscreen');full.onclick=fullscreen;(overlay.querySelector('.morph3-tools')||toolbar).appendChild(full);video.ondblclick=fullscreen;
  if(document.pictureInPictureEnabled){const pip=document.createElement('button');pip.className='morph2-btn morph-player-top-tool pc-player-pip';pip.textContent='▣';pip.title=label('نافذة عائمة فوق البرامج','Floating video above other apps');pip.setAttribute('aria-label','Picture in picture');pip.onclick=async()=>{try{if(document.pictureInPictureElement===video)await document.exitPictureInPicture();else await video.requestPictureInPicture();wake();}catch{const status=overlay.querySelector('.morph2-status');if(status)status.textContent=label('انتظر تحميل الفيديو ثم جرّب النافذة العائمة.','Wait for the video to load, then open the floating window.');}};(overlay.querySelector('.morph3-tools')||toolbar).appendChild(pip);}
  const sharedBack=overlay.querySelector('[data-player-tool=return]');if(sharedBack)sharedBack.classList.add('pc-player-back');

  function trackControls(){const old=overlay.querySelector('.pc-track-selects');if(old)old.remove();const engine=engines.get(video);if(engine instanceof (w.Hls||Function)){
   const group=document.createElement('div');group.className='pc-track-selects';toolbar.parentElement.appendChild(group);
   function select(label,rows,value,change){const field=document.createElement('select');field.setAttribute('aria-label',label);field.title=label;rows.forEach(row=>{const option=document.createElement('option');option.value=row.value;option.textContent=row.label;field.appendChild(option);});field.value=String(value);field.onchange=()=>{change(Number(field.value));wake();};group.appendChild(field);}
   function tracks(){group.textContent='';if(engine.levels.length>1)select('الجودة · Quality',[{label:'Auto',value:-1}].concat(engine.levels.map((l,i)=>({label:l.height?l.height+'p':Math.round(l.bitrate/1000)+' kbps',value:i}))),engine.currentLevel,i=>engine.currentLevel=i);
    if(engine.audioTracks.length>1)select('الصوت · Audio',engine.audioTracks.map((a,i)=>({label:a.name||a.lang||'Audio '+(i+1),value:i})),engine.audioTrack,i=>engine.audioTrack=i);
    if(engine.subtitleTracks.length)select('الترجمة · Subtitles',[{label:'بدون ترجمة · Off',value:-1}].concat(engine.subtitleTracks.map((a,i)=>({label:a.name||a.lang||'Subtitle '+(i+1),value:i}))),engine.subtitleTrack,i=>engine.subtitleTrack=i);
   }
   engine.on(Hls.Events.MANIFEST_PARSED,tracks);engine.on(Hls.Events.AUDIO_TRACKS_UPDATED,tracks);engine.on(Hls.Events.SUBTITLE_TRACKS_UPDATED,tracks);
  }}video.addEventListener('morphdesktopengine',trackControls);trackControls();
 }
 w.MorphDesktopMedia={attach,detach,controls,trackRows,qualityRows};
})(window);
