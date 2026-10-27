(function(){'use strict';
 var media=parent.SamsungMedia;
 if(location.pathname.indexOf('/radio/')>=0){
  window.RadioNative={catalogJson:function(){return JSON.stringify(window.SamsungStations);},favoritesJson:function(){return localStorage.getItem('morph.radio.favorites'+(parent.ClearTV.Profiles.active()==='default'?'':'@'+parent.ClearTV.Profiles.active()))||'[]';},favorite:function(id,on){var all=JSON.parse(this.favoritesJson()),i=all.indexOf(id);if(on&&i<0)all.push(id);if(!on&&i>=0)all.splice(i,1);localStorage.setItem('morph.radio.favorites'+(parent.ClearTV.Profiles.active()==='default'?'':'@'+parent.ClearTV.Profiles.active()),JSON.stringify(all));},play:function(id){window.radioStation=id;var s=SamsungStations.filter(function(s){return s.id===id;})[0];media.radio(id,s.streamUrl);},toggle:function(){media.radioToggle(window.radioStation);},stop:media.radioStop,exit:function(){media.exit(false);},initialStation:function(){return '';}};
 }else{
  window.IptvNative={request:function(id,action,payload){media.action(action,JSON.parse(payload)).then(function(result){window.iptvResult(id,true,result);},function(error){window.iptvResult(id,false,error.message);});},settingsJson:function(){return JSON.stringify(media.settings());},exit:media.exit};
  document.addEventListener('keydown',function(e){if(e.keyCode===10009){e.preventDefault();IptvUI.back();}},false);
 }
 window.addEventListener('load',function(){document.querySelector('button').focus();});
})();
