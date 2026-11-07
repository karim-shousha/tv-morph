(function(C){
 'use strict';
 var timeout=null,controlsTimer=null,watchTimer=null,watchToken=0,starting=false;
 function wake(){clearTimeout(controlsTimer);document.body.classList.remove('controls-asleep');controlsTimer=setTimeout(function(){if(C.Inputs.state.watching){document.body.classList.add('controls-asleep');}},7000);}
 function notify(){if(C.inputsChanged){C.inputsChanged(C.Inputs.state);}}
 function label(s){return s.type==='TV'?'Live TV':s.type+' '+s.number;}
 function same(a,b){return a&&b&&a.type===b.type&&a.number===b.number;}
 function current(){var state=C.Inputs.state;try{state.current=tizen.tvwindow.getSource();}catch(e){state.current=null;}
  state.channel=null;state.program=null;
  if(state.current&&state.current.type==='TV'&&typeof tizen.tvchannel!=='undefined'){
   try{state.channel=tizen.tvchannel.getCurrentChannel();state.program=tizen.tvchannel.getCurrentProgram();}catch(e){state.guideError='Programme information is unavailable on this TV.';}
  }
 }
 C.Inputs={state:{sources:[],current:null,channel:null,program:null,loading:false,error:'',watching:false,guideError:''},label:label,same:same,
 load:function(){var state=this.state;if(typeof tizen==='undefined'){state.error='Connect to a Samsung TV to read its HDMI inputs.';notify();return;}
  state.loading=true;state.error='';current();notify();clearTimeout(timeout);timeout=setTimeout(function(){state.loading=false;state.error='Inputs did not respond. Try Refresh inputs.';notify();},8000);
  try{tizen.systeminfo.getPropertyValue('VIDEOSOURCE',function(info){clearTimeout(timeout);state.loading=false;var sources=[];['connected','disconnected'].forEach(function(group){(info[group]||[]).forEach(function(s){if(['TV','AV','SVIDEO','COMP','PC','HDMI','SCART','DVI','MEDIA'].indexOf(s.type)>=0){if(!sources.some(function(v){return same(v,s);})){sources.push({type:s.type,number:s.number,connected:group==='connected',native:s});}}});});state.sources=sources.sort(function(a,b){return a.type===b.type?a.number-b.number:a.type==='TV'?-1:b.type==='TV'?1:a.type.localeCompare(b.type);});current();notify();},function(error){clearTimeout(timeout);state.loading=false;state.error='Inputs are unavailable ('+error.name+').';notify();});}catch(e){clearTimeout(timeout);state.loading=false;state.error='This TV does not provide input controls.';notify();}
 },watch:function(source){
  var state=this.state;if(C.Prayer&&!C.Prayer.allowLaunch())return;if(typeof tizen==='undefined'){C.toast('Input playback is available on the television.');return;}if(state.watching||starting){return;}
  if(!source||['TV','AV','SVIDEO','COMP','PC','HDMI','SCART','DVI','MEDIA'].indexOf(source.type)<0){C.toast('Choose an available TV input.');return;}
  if(C.Kids&&C.Kids.close)C.Kids.close();if(window.SamsungMedia){if(SamsungMedia.exit)SamsungMedia.exit(true);else{if(SamsungMedia.parentalStop)SamsungMedia.parentalStop();if(SamsungMedia.radioStop)SamsungMedia.radioStop();}}
  starting=true;var token=++watchToken;
  function active(){return token===watchToken;}
  function fail(error){if(!active())return;watchToken++;clearTimeout(watchTimer);starting=false;state.watching=false;try{tizen.tvwindow.hide(function(){},function(){});}catch(ignore){}document.body.classList.remove('watching');document.documentElement.classList.remove('watching-input');state.error='Could not open '+label(source)+(error&&error.name?' ('+error.name+')':'')+'.';C.toast(state.error+' Check the device and cable.');notify();}
  watchTimer=setTimeout(function(){fail({name:'TimeoutError'});},12000);
  /* Full-screen inputs must own the front video plane. BEHIND is for HTML PiP
     overlays and can leave source audio playing behind an opaque app surface. */
  function show(){if(!active())return;document.documentElement.classList.add('watching-input');document.body.classList.add('watching');try{tizen.tvwindow.show(function(){if(!active())return;clearTimeout(watchTimer);starting=false;state.watching=true;state.error='';current();if(C.rememberHdmi&&source.type==='HDMI')C.rememberHdmi(source);wake();if(C.watchStarted)C.watchStarted();notify();},fail,['0%','0%','100%','100%'],'MAIN','FRONT');}catch(error){fail(error);}}
  /* Re-read the native source descriptor, rather than inventing an HDMI number or launching a model-specific app ID. */
  try{tizen.systeminfo.getPropertyValue('VIDEOSOURCE',function(info){if(!active())return;var available=(info.connected||[]).concat(info.disconnected||[]),nativeSource=available.filter(function(value){return same(value,source);})[0];if(!nativeSource){fail({name:'NotFoundError'});return;}try{var selected=tizen.tvwindow.getSource('MAIN');if(same(selected,nativeSource)){show();return;}tizen.tvwindow.setSource(nativeSource,show,fail,'MAIN');}catch(error){fail(error);}},fail);}catch(error){fail(error);}
 },stop:function(){if(!this.state.watching&&!starting){return;}watchToken++;starting=false;clearTimeout(watchTimer);try{tizen.tvwindow.hide(function(){},function(){});}catch(e){}this.state.watching=false;clearTimeout(controlsTimer);document.body.classList.remove('controls-asleep');document.body.classList.remove('watching');document.documentElement.classList.remove('watching-input');if(C.watchStopped){C.watchStopped();}this.load();},refreshProgramme:function(){if(typeof tizen!=='undefined'){current();notify();}}
 };
 document.addEventListener('keydown',function(e){if(C.Inputs.state.watching){var asleep=document.body.classList.contains('controls-asleep');wake();if(asleep&&e.keyCode!==10009&&e.keyCode!==27){e.stopImmediatePropagation();e.preventDefault();}}},true);
 document.addEventListener('visibilitychange',function(){if(!document.hidden){C.Inputs.load();}});
})(window.ClearTV);
