(function(){'use strict';
 var media=parent.SamsungMedia;
 if(location.pathname.indexOf('/radio/')>=0){
  window.RadioNative={catalogJson:function(){return JSON.stringify(window.SamsungStations);},favoritesJson:function(){return localStorage.getItem('morph.radio.favorites'+(parent.ClearTV.Profiles.active()==='default'?'':'@'+parent.ClearTV.Profiles.active()))||'[]';},favorite:function(id,on){var all=JSON.parse(this.favoritesJson()),i=all.indexOf(id);if(on&&i<0)all.push(id);if(!on&&i>=0)all.splice(i,1);localStorage.setItem('morph.radio.favorites'+(parent.ClearTV.Profiles.active()==='default'?'':'@'+parent.ClearTV.Profiles.active()),JSON.stringify(all));},play:function(id){window.radioStation=id;var s=SamsungStations.filter(function(s){return s.id===id;})[0];media.radio(id,s.streamUrl);},toggle:function(){media.radioToggle(window.radioStation);},stop:media.radioStop,exit:function(){media.exit(false);},initialStation:function(){return '';}};
 }else{
  window.IptvNative={openTrailer:function(value){parent.MorphPlayerChrome.openTrailer(value);},request:function(id,action,payload){media.action(action,JSON.parse(payload)).then(function(result){window.iptvResult(id,true,result);},function(error){window.iptvResult(id,false,error.message);});},settingsJson:function(){return JSON.stringify(media.settings());},kids:function(){parent.ClearTV.Kids.open();},exit:media.exit};
  // A hidden IPTV iframe can regain focus after an asynchronous episode/detail update.
  // Route physical remote input to the active parent player before the library consumes it.
  function restorePlaybackFocus(){var player=parent.document.getElementById('morph-player');if(!player||parent.document.getElementById('prayer-adhan-overlay'))return;var previous=player._morphRemoteFocus;if(!previous||!player.contains(previous)||!previous.offsetHeight)previous=player.querySelector('.morph2-btn.main,button');if(previous)previous.focus();}
  document.addEventListener('focusin',function(){if(parent.document.getElementById('morph-player'))setTimeout(restorePlaybackFocus,0);},true);
  ['keydown','keyup'].forEach(function(type){document.addEventListener(type,function(e){if(parent.MorphPlayerChrome&&parent.MorphPlayerChrome.handleBackEvent&&parent.MorphPlayerChrome.handleBackEvent(e))return;var player=parent.document.getElementById('morph-player');if(!player||parent.document.getElementById('prayer-adhan-overlay')||[13,19,27,37,38,39,40,461,10009,10252,412,413,415,417,427,428].indexOf(e.keyCode)<0)return;var handle=player['on'+type];if(typeof handle!=='function')return;e.preventDefault();e.stopImmediatePropagation();if(type==='keydown'&&!player.contains(parent.document.activeElement))restorePlaybackFocus();handle(e);},true);});
  document.addEventListener('keydown',function(e){if(parent.MorphTrailer&&parent.MorphTrailer.isOpen()&&[27,10009,461].indexOf(e.keyCode)>=0){e.preventDefault();e.stopImmediatePropagation();parent.MorphTrailer.back();}},true);
  document.addEventListener('keydown',function(e){if(e.keyCode===10009){e.preventDefault();IptvUI.back();}},false);
 }
 window.addEventListener('load',function(){document.querySelector('button').focus();});
})();
