(function(C){
 'use strict';
 var own='ClearTV001.Home';
 var canonical={'com.samsung.tv.cobalt-yt':'YouTube','org.tizen.netflix-app':'Netflix','com.samsung.tv.aria-video':'Apple TV','org.tizen.apple.apple-music':'Apple Music','com.samsung.tv.gallery':'Gallery','org.tizen.browser':'Internet','com.samsung.tv.store':'Samsung Apps'};
 var demo=[{id:'com.samsung.tv.cobalt-yt',name:'YouTube'},{id:'rKpKZvmSog.IPTVSmartersPro',name:'IPTV Smarters Pro'},{id:'org.tizen.netflix-app',name:'Netflix'},{id:'evKhCgZelL.AmazonIgnitionLauncher2',name:'Prime Video'},{id:'MCmYXNxgcu.DisneyPlus',name:'Disney+'},{id:'rJeHak5zRg.Spotify',name:'Spotify - Music and Podcasts'},{id:'com.samsung.tv.aria-video',name:'Apple TV'},{id:'org.tizen.browser',name:'Internet'},{id:'com.samsung.tv.store',name:'Samsung Apps'}];
 function normalise(apps){
  var map={},output=[];
  apps.forEach(function(a){
   if(a.id===own||a.show===false||!a.name){return;}
   var name=a.name.trim(),generated=/^[A-Za-z0-9]{10}\./.test(a.id),known=canonical[a.id];
   if(!known&&(!generated||/service|recommendations|preview|testsuite|dummy|daemon|popup/i.test(a.id+' '+name))){return;}
   if(/PrivacyChoices|TVDeviceManager/i.test(name)){return;}
   var item={id:a.id,name:known||name,icon:a.iconPath||a.icon||'',known:!!known};
   var key=item.name.toLowerCase().replace(/[^a-z0-9]/g,'');
   if(map[key]){if(item.known){var i=output.indexOf(map[key]);output[i]=item;map[key]=item;}return;}
   map[key]=item;output.push(item);
  });
  output.push({id:'local.tvmorph.tv.kids',name:'Kids World'});return output.sort(function(a,b){return a.name.localeCompare(b.name);});
 }
 C.Catalog={apps:[],preview:typeof tizen==='undefined',load:function(callback){
  var self=this;
  if(this.preview){this.apps=normalise(demo);callback(null,this.apps);return;}
  try{tizen.application.getAppsInfo(function(apps){self.apps=normalise(apps);callback(null,self.apps);},function(error){callback(error);});}catch(e){callback(e);}
 },get:function(id){return this.apps.filter(function(a){return a.id===id;})[0];},launch:function(app){
  if(!app){C.toast('This app is no longer installed. Refresh your apps.');return;}
  if(app.id==='local.tvmorph.tv.kids'){C.Kids.open();return;}if(this.preview){C.toast('Browser preview: '+app.name);return;}
  try{tizen.application.launch(app.id,function(){var recent=C.read('recent',[]).filter(function(id){return id!==app.id;});recent.unshift(app.id);C.write('recent',recent.slice(0,5));},function(error){C.toast('Could not open '+app.name+'. Try opening it from Samsung Apps.');});}catch(e){C.toast('Could not open '+app.name+'.');}
 },icon:function(app){
  if(app.id==='local.tvmorph.tv.kids'){var kid=C.el('span','app-icon branded-icon tvm-kids'),image=document.createElement('img');image.src='assets/tvm-kids.svg';image.alt='';kid.appendChild(image);return kid;}if(app.id==='local.tvmorph.tv.play'||app.id==='local.tvmorph.tv.radio'){var builtin=C.el('span','app-icon branded-icon '+(app.id==='local.tvmorph.tv.radio'?'tvm-radio':'tvm-iptv')),art=document.createElement('img');art.alt='';art.src='assets/'+(app.id==='local.tvmorph.tv.radio'?'tvm-radio.svg':'tvm-iptv.svg');builtin.appendChild(art);return builtin;}
  if(app.id==='local.tvmorph.tv.prayer'){var prayer=C.el('span','app-icon prayer-icon');prayer.innerHTML=C.icon('moon');return prayer;}var type=/youtube/i.test(app.name)?'youtube':/netflix/i.test(app.name)?'netflix':/prime|amazon.*video/i.test(app.name)?'prime':/disney/i.test(app.name)?'disney':/apple.*tv/i.test(app.name)?'apple-tv':/spotify/i.test(app.name)?'spotify':/settings/i.test(app.name)?'settings':/iptv|live|tv/i.test(app.name)?'television':/spotify|music/i.test(app.name)?'music':/internet/i.test(app.name)?'internet':/apps/i.test(app.name)?'store':'generic';
  var node=C.el('span','app-icon '+type);
  if(type==='youtube'){node.innerHTML=C.icon('play');}else if(type==='netflix'){node.textContent='N';}else if(type==='prime'){node.textContent='prime\nvideo';}else if(type==='disney'){node.textContent='Disney+';}else if(type==='apple-tv'){node.textContent='tv+';}else if(type==='spotify'){node.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="#20d779"/><g fill="none" stroke="#092c20" stroke-width="4" stroke-linecap="round"><path d="M16 24q18-7 34 3M19 33q15-5 27 3M22 41q11-3 21 3"/></g></svg>';}else if(type==='settings'){node.innerHTML=C.icon('settings');}else if(type==='television'){node.innerHTML=C.icon('tv');}else if(type==='music'){node.innerHTML=C.icon('music');}else if(type==='internet'){node.innerHTML=C.icon('globe');}else if(type==='store'){node.innerHTML=C.icon('store');}else{node.textContent=app.name.slice(0,2).toUpperCase();}
  if(app.icon&&!/youtube|netflix/.test(type)){var image=document.createElement('img');image.alt='';image.onload=function(){node.textContent='';node.appendChild(image);};image.onerror=function(){};image.src=app.icon.charAt(0)==='/'?'file://'+app.icon:app.icon;}
  return node;
 }};
})(window.ClearTV);
