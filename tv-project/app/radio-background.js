(function(){'use strict';window.addEventListener('load',function(){
 var C=window.ClearTV,mini=document.createElement('div');mini.id='radio-mini';mini.hidden=true;mini.setAttribute('data-no-translate','');mini.innerHTML='<button class="radio-mini-open"></button><button class="radio-mini-toggle"></button><button class="radio-mini-stop"></button>';document.body.appendChild(mini);
 function media(){return window.SamsungMedia||window.MorphMedia;}
 function stop(){if(window.TVNative&&TVNative.radioStop)TVNative.radioStop();else if(media())media().radioStop();mini.hidden=true;}
 function text(ar,en){return window.MorphLocale?MorphLocale.t(ar,en):en;}
 mini.querySelector('.radio-mini-open').onclick=function(){if(window.TVNative&&TVNative.radio)TVNative.radio('');else if(media())media().open('radio');};
 mini.querySelector('.radio-mini-toggle').onclick=function(){if(window.TVNative&&TVNative.radioToggle)TVNative.radioToggle();else if(media())media().radioControl();};
 mini.querySelector('.radio-mini-stop').onclick=stop;
 window.addEventListener('morphAudioExclusive',stop);
 function paint(){try{var state=window.TVNative&&TVNative.radioStatus?JSON.parse(TVNative.radioStatus()):media()?media().radioStatus():null;mini.hidden=!state||!state.active;if(mini.hidden)return;mini.querySelector('.radio-mini-open').textContent='♫ '+(state.name||text('الراديو شغال','Radio playing'));mini.querySelector('.radio-mini-toggle').textContent=state.state==='playing'?text('إيقاف مؤقت','Pause'):text('تشغيل','Play');mini.querySelector('.radio-mini-stop').textContent=text('إيقاف','Stop');}catch(e){mini.hidden=true;}}
 setInterval(paint,1000);paint();
});})();
