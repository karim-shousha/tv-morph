/* TV/desktop presentation only. The existing source, Save and Back handlers own state. */
(function(w){'use strict';
 var viewport=document.querySelector('meta[name=viewport]');
 if(viewport&&/width=device-width/.test(viewport.content))return;
 var panel=document.getElementById('settings-panel'),dialog=panel&&panel.querySelector('.iptv-settings-pages');if(!dialog)return;
 document.documentElement.setAttribute('data-iptv-readable-settings','');
 function node(tag,cls){var e=document.createElement(tag);e.className=cls;return e;}
 function tile(id,host,hint){var control=document.getElementById(id);if(!control||control.closest('.iptv-setting-tile'))return;var box=node('article','iptv-setting-tile'),label=dialog.querySelector('label[for="'+id+'"]')||control.closest('label');host.appendChild(box);if(label)box.appendChild(label);if(!label||!label.contains(control))box.appendChild(control);if(hint&&document.getElementById(hint))box.appendChild(document.getElementById(hint));}
 function organise(){['library','playback'].forEach(function(key){var page=document.getElementById('iptv-settings-page-'+key),group=page&&page.querySelector('.setting-group');if(!group)return;group.classList.add('iptv-settings-tiles');var fields=key==='library'?['setting-iptv-text-size','setting-density','setting-sort','setting-motion']:['setting-language','setting-scale','setting-resume','setting-oled'];fields.forEach(function(id){tile(id,group,id==='setting-iptv-text-size'?'iptv-text-size-hint':null);});if(key==='library'){var actions=node('div','iptv-settings-actions');page.appendChild(actions);['home-refresh','iptv-home-order','cache-clear','clear-progress','iptv-app-update'].forEach(function(id){tile(id,actions,id==='cache-clear'?'cache-note':null);});}});}
 function fit(){var scale=Math.min(innerWidth*.95/1760,innerHeight*.94/940),value='translate(-50%,-50%) scale('+scale+')';dialog.style.setProperty('transform',value,'important');dialog.style.setProperty('-webkit-transform',value,'important');}
 function labels(){var lang=w.MorphLocale?MorphLocale.get():'en',title=document.getElementById('settings-title');if(title)title.textContent=lang==='ar'?'إعدادات IPTV':lang==='fr'?'Réglages IPTV':'IPTV settings';}
 function focus(event){if(panel.hidden||!dialog.contains(event.target))return;var content=dialog.querySelector('.iptv-settings-content'),nav=dialog.querySelector('.iptv-settings-nav'),box=content.contains(event.target)?content:nav.contains(event.target)?nav:null;if(!box)return;var r=event.target.getBoundingClientRect(),b=box.getBoundingClientRect(),scale=dialog.getBoundingClientRect().width/1760;if(r.bottom>b.bottom-10)box.scrollTop+=(r.bottom-b.bottom+14)/scale;if(r.top<b.top+10)box.scrollTop-=(b.top-r.top+14)/scale;}
 dialog.addEventListener('focusin',focus);w.addEventListener('resize',fit);w.addEventListener('morphLanguage',labels);
 new MutationObserver(function(){if(!panel.hidden){fit();labels();}}).observe(panel,{attributes:true,attributeFilter:['hidden']});
 organise();fit();labels();
})(window);
