/* IPTV-only display preference. The launcher's theme is never rewritten. */
(function(w){'use strict';
 var root=document.documentElement,enabled=false;
 function label(){return w.MorphLocale?MorphLocale.t('الوضع الأسود · OLED','OLED black mode'):'OLED black mode';}
 function apply(value){enabled=value===true;root.setAttribute('data-iptv-oled',String(enabled));var input=document.getElementById('setting-oled');if(input)input.checked=enabled;}
 var area=document.getElementById('iptv-settings-page-playback')||document.querySelector('#settings-panel .setting-group');
 if(area){var row=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');row.className='iptv-oled-setting';input.type='checkbox';input.id='setting-oled';text.textContent=label();row.appendChild(input);row.appendChild(text);area.appendChild(row);w.addEventListener('morphLanguage',function(){text.textContent=label();});}
 try{if(w.IptvNative&&IptvNative.settingsJson)enabled=JSON.parse(IptvNative.settingsJson()).oledMode===true;}catch(ignore){}
 w.MorphIptvDisplay={apply:apply};apply(enabled);
})(window);
