/* TV/desktop header uses the same weather engine and saved location as the launcher. */
(function(w){'use strict';if(document.querySelector('meta[name=viewport][content*="device-width"]'))return;
 var status=document.querySelector('#morph-header .header-status'),clock=status&&status.querySelector('.header-clock');if(!clock)return;
 var box=document.createElement('div'),temp=document.createElement('span'),city=document.createElement('span');box.id='iptv-header-weather';box.setAttribute('data-no-translate','');temp.id='iptv-header-temperature';city.id='iptv-header-location';box.appendChild(temp);box.appendChild(city);status.insertBefore(box,clock);
 function t(ar,en){return w.MorphLocale?MorphLocale.t(ar,en):en;}
 function paint(state){state=state||{};var location=state.location,data=state.data;box.hidden=!!state.off;temp.textContent=data&&data.current&&isFinite(data.current.temperature_2m)?Math.round(data.current.temperature_2m)+'\u00b0':'--\u00b0';city.textContent=location&&location.name||t('\u0627\u0644\u0637\u0642\u0633','Your weather');box.title=city.textContent;w.dispatchEvent(new Event('morphHeaderWeather'));}
 var parentHost,C;
 function paintClock(){var config=parentHost?parentHost.settings:C&&C.settings||{clock24:true},d=w.MorphClock?MorphClock.now():new Date(),h=d.getHours(),m=d.getMinutes(),suffix='';if(config.clock24===false){suffix=h>=12?' PM':' AM';h=h%12||12;}var value=(config.clock24!==false&&h<10?'0':'')+h+':'+(m<10?'0':'')+m+suffix,node=document.getElementById('stream-clock'),date=document.getElementById('stream-header-date'),lang=w.MorphLocale?MorphLocale.get():'en';if(node.textContent!==value)node.textContent=value;var day=d.toLocaleDateString(({ar:'ar-EG',en:'en-CA',fr:'fr-FR'}[lang]||'en-CA'),{weekday:'short',month:'short',day:'numeric'});if(date.textContent!==day)date.textContent=day;}
 paint();paintClock();setInterval(paintClock,60000);w.addEventListener('morphClockChanged',paintClock);w.addEventListener('morphLanguage',paintClock);new MutationObserver(paintClock).observe(clock,{childList:true,subtree:true});
 function begin(){try{if(parent!==w&&parent.ClearTV&&parent.ClearTV.Weather)parentHost=parent.ClearTV;}catch(ignore){}
 if(!parentHost&&w.MorphIptvStandalone&&w.ClearTV&&w.ClearTV.Weather)parentHost=w.ClearTV;
 if(parentHost){function sync(){paintClock();paint(Object.assign({},parentHost.Weather.state,{off:parentHost.settings.locationMode==='off'}));}sync();var old=parentHost.weatherChanged;parentHost.weatherChanged=function(s){if(old)old.apply(parentHost,arguments);sync();};w.addEventListener('morphLanguage',sync);return;}
 var family='default';try{family=localStorage.getItem('cleartv.activeViewer')||'default';}catch(ignore){}
 function settings(){var s={};try{s=JSON.parse(localStorage.getItem('cleartv.'+(family!=='default'?'viewer.'+family+'.':'')+'settings')||'{}');if(w.IptvNative&&IptvNative.launcherWeatherJson)Object.assign(s,JSON.parse(IptvNative.launcherWeatherJson()));}catch(ignore){}return Object.assign({locationMode:'auto',units:'celsius'},s);}
 C={settings:settings(),config:{locationURL:'https://api.ipapi.is/',locationFallbackURL:'https://ipwho.is/',geocodingURL:'https://geocoding-api.open-meteo.com/v1/search',weatherURL:'https://api.open-meteo.com/v1/forecast',weatherTTL:1800000,locationTTL:86400000}};
 C.read=function(key,fallback){try{return JSON.parse(localStorage.getItem('cleartv.'+key)||'null')||fallback;}catch(ignore){return fallback;}};
 C.write=function(key,value){try{localStorage.setItem('cleartv.'+key,JSON.stringify(value));}catch(ignore){}};
 C.request=function(url,done){var xhr=new XMLHttpRequest();xhr.open('GET',url,true);xhr.timeout=12000;xhr.onload=function(){try{if(xhr.status<200||xhr.status>=300)throw Error('weather');done(null,JSON.parse(xhr.responseText));}catch(e){done(e);}};xhr.onerror=xhr.ontimeout=function(){done(Error('weather'));};xhr.send();return xhr;};
 C.weatherChanged=function(state){paint(Object.assign({},state,{off:C.settings.locationMode==='off'}));};
 function start(){paintClock();w.MorphWeatherEngine(C);C.Weather.load(false);w.MorphIptvHeaderWeather={refresh:function(){C.settings=settings();C.Weather.load(false);},state:C.Weather.state};w.addEventListener('morphLanguage',function(){C.weatherChanged(C.Weather.state);});w.addEventListener('storage',function(){C.settings=settings();C.Weather.load(false);});}
 if(w.MorphWeatherEngine)start();else{var meta=document.querySelector('meta[name=tvm-media-root]'),base=meta?meta.content:'../tv/',script=document.createElement('script');script.src=new URL(base.replace(/\/?$/,'/')+'weather.js',document.baseURI).href;script.onload=start;document.head.appendChild(script);}
 }
 if(w.MorphIptvStandalone&&document.readyState!=='complete')w.addEventListener('load',begin);else begin();
})(window);
