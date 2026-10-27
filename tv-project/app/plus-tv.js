(function(C){'use strict';var P=window.MorphPlus;if(!P)return;
 function refresh(){document.querySelectorAll('.theme-option').forEach(function(b){var theme=Array.prototype.filter.call(b.classList,function(c){return c!=='theme-option'&&c!=='plus-locked';})[0];b.classList.toggle('plus-locked',!!theme&&!P.allowed(theme));});}
 function fallback(){if(!P.allowed(C.settings.theme)){C.write('plusSuspendedSettings',JSON.parse(JSON.stringify(C.settings)));C.applyRemoteConfig({theme:'blue'});}}
 P.ready.then(function(){fallback();refresh();});
 window.addEventListener('morphViewer',function(){fallback();refresh();});
 window.addEventListener('morphPlus',function(){if(P.isActive()){var saved=C.read('plusSuspendedSettings',null);if(saved){C.applyRemoteConfig(saved);C.write('plusSuspendedSettings',null);}}else fallback();refresh();});
 var panel=document.getElementById('setting-theme').closest('.settings-panel'),b=C.el('button','setting morph-plus-setting','🔓 Morph TV Plus · شراء الثيمات / Buy themes →');b.setAttribute('data-no-translate','');var badge=C.el('span','morph-plus-active-badge');badge.id='tv-plus-active-badge';badge.setAttribute('data-no-translate','');badge.hidden=true;function label(){badge.hidden=!P.isActive();var stateWords={ar:'مفعّل',en:'Active',fr:'Actif',zh:'已激活',ja:'有効'};badge.textContent='✓ '+(stateWords[MorphLocale.get()]||stateWords.en);badge.setAttribute('aria-label',badge.textContent);b.textContent=P.isActive()?'Morph TV Plus':MorphLocale.t('Morph TV Plus · شراء الثيمات','Morph TV Plus · Buy themes');b.appendChild(badge);}label();P.ready.then(label);window.addEventListener('morphPlus',label);window.addEventListener('morphLanguage',label);b.onclick=P.open;if(panel)panel.insertBefore(b,panel.firstChild);
 // Advanced appearance changes are gated at application time as well as in the picker.
 document.addEventListener('click',function(e){var target=e.target.closest&&e.target.closest('.theme-option');if(target)refresh();},true);
})(window.ClearTV);
