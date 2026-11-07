(function(){'use strict';window.addEventListener('load',function(){
 var C=window.ClearTV,mini=document.createElement('div');mini.id='radio-mini';mini.hidden=true;mini.setAttribute('data-no-translate','');mini.innerHTML='<button class="radio-mini-open"></button><button class="radio-mini-toggle"></button><button class="radio-mini-stop"></button>';document.body.appendChild(mini);
 function media(){return window.SamsungMedia||window.MorphMedia;}
 function hide(){if(mini.contains(document.activeElement)&&C&&C.Focus)C.Focus.focus(document.getElementById('nav-home'));mini.hidden=true;if(C&&C.Focus)C.Focus.invalidate();}
 function stop(){if(window.TVNative&&TVNative.radioStop)TVNative.radioStop();else if(media())media().radioStop();hide();}
 function text(ar,en){return window.MorphLocale?MorphLocale.t(ar,en):en;}
 mini.querySelector('.radio-mini-open').onclick=function(){if(window.TVNative&&TVNative.radio)TVNative.radio('');else if(media())media().open('radio');};
 mini.querySelector('.radio-mini-toggle').onclick=function(){if(window.TVNative&&TVNative.radioToggle)TVNative.radioToggle();else if(media())media().radioControl();};
 mini.querySelector('.radio-mini-stop').onclick=stop;
 window.addEventListener('morphAudioExclusive',stop);
 var signature='';function paint(){try{var state=window.TVNative&&TVNative.radioStatus?JSON.parse(TVNative.radioStatus()):media()?media().radioStatus():null;if(!state||!state.active){if(!mini.hidden)hide();return;}var next=JSON.stringify([state.name,state.state,text('الراديو شغال','Radio playing')]);if(next===signature&&!mini.hidden)return;signature=next;mini.hidden=false;var open=mini.querySelector('.radio-mini-open'),toggle=mini.querySelector('.radio-mini-toggle'),stopButton=mini.querySelector('.radio-mini-stop');open.textContent='♫ '+(state.name||text('الراديو شغال','Radio playing'));open.setAttribute('aria-label',text('فتح الراديو','Open radio')+' · '+(state.name||''));toggle.innerHTML=state.state==='playing'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>':'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 4 12 8-12 8Z"/></svg>';toggle.setAttribute('aria-label',state.state==='playing'?text('إيقاف مؤقت','Pause radio'):text('تشغيل','Play radio'));stopButton.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';stopButton.setAttribute('aria-label',text('إيقاف الراديو','Stop radio'));if(C&&C.Focus)C.Focus.invalidate();}catch(e){hide();}}
  // Adaptive poll: 1s while radio is active, 5s idle probe, paused while hidden.
  // Preserves mini visibility behavior; only the poll cadence changes.
  var paintTimer=null;
  function idleMs(){try{if(window.ClearTV&&ClearTV.Performance&&ClearTV.Performance.radioIdleMs)return ClearTV.Performance.radioIdleMs();}catch(e){}return 5000;}
  function loop(){if(paintTimer)clearTimeout(paintTimer);paintTimer=null;if(document.hidden)return;var active=!mini.hidden;paintTimer=setTimeout(function(){paintTimer=null;if(!document.hidden)paint();loop();},active?1000:idleMs());}
  document.addEventListener('visibilitychange',function(){if(!document.hidden)paint();loop();});
  window.addEventListener('morphPerformance',loop);
  window.addEventListener('morphStorageChanged',function(){paint();loop();});
  loop();paint();
});})();
