(function(w){function attach(C){if(!C)return;
 'use strict';
 var generation=0,active=[],timer=null;
 function emit(){if(C.weatherChanged){C.weatherChanged(C.Weather.state);}}
 function request(url,callback){var xhr=C.request(url,callback);active.push(xhr);return xhr;}
 function cancel(){generation++;active.forEach(function(xhr){try{xhr.abort();}catch(e){}});active=[];clearTimeout(timer);}
 function validLocation(v){return v&&isFinite(v.latitude)&&isFinite(v.longitude)&&Math.abs(v.latitude)<=90&&Math.abs(v.longitude)<=180&&typeof v.name==='string';}
 function key(location){return location.latitude.toFixed(2)+','+location.longitude.toFixed(2)+','+C.settings.units;}
 function forecast(location,seq,force){
  if(seq!==generation){return;}
  var state=C.Weather.state,cache=C.read('weatherCache',null),cacheKey=key(location);
  state.location=location;state.error='';state.loading=true;
  if(cache&&cache.key===cacheKey&&cache.data&&cache.data.current&&typeof cache.data.current.temperature_2m==='number'){state.data=cache.data;state.updatedAt=cache.at;state.cached=true;emit();if(!force&&Date.now()-cache.at<C.config.weatherTTL){state.loading=false;state.cached=false;emit();schedule();return;}}
  else{state.data=null;emit();}
  var url=C.config.weatherURL+'?latitude='+encodeURIComponent(location.latitude)+'&longitude='+encodeURIComponent(location.longitude)+'&current=temperature_2m,weather_code,is_day,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit='+C.settings.units+'&forecast_days=3&timezone=auto';
  request(url,function(error,data){
   if(seq!==generation){return;}
   state.loading=false;
   if(error||!data||!data.current||typeof data.current.temperature_2m!=='number'||!isFinite(data.current.temperature_2m)){state.error='Weather unavailable. Try again later.';state.cached=!!state.data;emit();schedule();return;}
   state.data=data;state.updatedAt=Date.now();state.cached=false;state.error='';
   C.write('weatherCache',{key:cacheKey,at:state.updatedAt,data:data});emit();schedule();
  });
 }
 function schedule(){clearTimeout(timer);if(!document.hidden&&C.settings.locationMode!=='off'){timer=setTimeout(function(){C.Weather.load(false);},C.config.weatherTTL);}}
 function auto(seq,forceLocation,forceWeather){
  var saved=C.read('autoLocation',null);
  if(!forceLocation&&saved&&validLocation(saved.location)&&Date.now()-saved.at<C.config.locationTTL){forecast(saved.location,seq,forceWeather);return;}
  if(!forceLocation&&C.read('geoBackoffUntil',0)>Date.now()){C.Weather.state.loading=false;C.Weather.state.error='Choose a city to see the weather.';emit();return;}
  function received(error,data,secondary){
   if(seq!==generation){return;}
   var info=data&&data.location?data.location:data||{},latitude=typeof info.latitude==='number'?info.latitude:info.lat,longitude=typeof info.longitude==='number'?info.longitude:info.lon;
   if(error||!data||data.error||data.success===false||typeof latitude!=='number'||typeof longitude!=='number'){
    if(!secondary){request(C.config.locationFallbackURL,function(e,d){received(e,d,true);});return;}
    C.write('geoBackoffUntil',Date.now()+30*60*1000);
    if(saved&&validLocation(saved.location)){forecast(saved.location,seq,forceWeather);return;}
    C.Weather.state.loading=false;C.Weather.state.error='Choose a city to see the weather.';emit();return;
   }
   var location={name:info.city||info.region||'Your area',country:info.country_name||info.country||'',latitude:latitude,longitude:longitude,timezone:typeof info.timezone==='string'?info.timezone:info.timezone&&info.timezone.id||'',approximate:true,provider:secondary?'ipwho.is':'ipapi.is'};
   C.write('autoLocation',{at:Date.now(),location:location});forecast(location,seq,forceWeather);
  }
  request(C.config.locationURL,function(error,data){received(error,data,false);});
 }
 C.Weather={state:{location:null,data:null,loading:false,error:'',updatedAt:0,cached:false},load:function(force,relocate){
  cancel();var seq=generation,state=this.state;
  if(C.settings.locationMode==='off'){state.loading=false;state.data=null;state.location=null;state.error='Weather is off';emit();return;}
  state.loading=true;state.error='';emit();
  if(C.settings.locationMode==='manual'&&validLocation(C.settings.manualLocation)){forecast(C.settings.manualLocation,seq,force);return;}
  auto(seq,!!relocate,!!force);
 },search:function(term,callback){
  term=String(term||'').replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'').trim();if(term.length<2){callback(new Error('Enter at least two characters.'));return;}
  return C.request(C.config.geocodingURL+'?name='+encodeURIComponent(term)+'&count=20&language='+encodeURIComponent(window.MorphLocale?MorphLocale.get():'en')+'&format=json',function(error,data){
   if(error){callback(error);return;}
   var results=data&&Array.isArray(data.results)?data.results:[];
   callback(null,results.map(function(r){return {name:r.name,country:r.country||'',region:r.admin1||'',latitude:r.latitude,longitude:r.longitude,timezone:r.timezone||'',approximate:false};}).filter(validLocation));
  });
 },choose:function(location){if(!validLocation(location)){return;}C.settings.locationMode='manual';C.settings.manualLocation=location;C.saveSettings();this.state.data=null;this.load(true);},automatic:function(){C.settings.locationMode='auto';C.saveSettings();this.state.data=null;this.load(true,true);},condition:function(code,day){
  if(typeof code!=='number'){return {text:'Conditions unavailable',icon:'cloud'};}
  if(code===0){return {text:day===0?'Clear night':'Clear skies',icon:day===0?'moon':'sun'};}
  if(code<=3){return {text:code===3?'Overcast':'Partly cloudy',icon:'cloud'};}
  if(code===45||code===48){return {text:'Foggy',icon:'cloud'};}
  if((code>=71&&code<=77)||code===85||code===86){return {text:'Snow',icon:'snow'};}
  if(code>=95){return {text:'Thunderstorms',icon:'rain'};}
  return {text:'Rain',icon:'rain'};
 }};
 document.addEventListener('visibilitychange',function(){if(document.hidden){clearTimeout(timer);}else{C.Weather.load(false);}});
 window.addEventListener('online',function(){C.Weather.load(true);});
}
w.MorphWeatherEngine=attach;attach(w.ClearTV);
})(window);
