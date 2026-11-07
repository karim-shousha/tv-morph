/* Thin IPTV host for the shared matches page. Catalog and playback stay untouched. */
(function(w){'use strict';
 if(!w.MorphIptvStandalone)return;
 var api=w.IptvUI,quick=document.getElementById('cinema-quick-nav'),dashboard=document.getElementById('dashboard');if(!api||!quick||!dashboard)return;
 var page=document.createElement('section');page.id='view-matches';page.hidden=true;page.setAttribute('role','dialog');page.setAttribute('aria-modal','true');document.body.appendChild(page);
 var scope=null,C={},family='default';try{family=localStorage.getItem('cleartv.activeViewer')||'default';}catch(ignore){}
 function key(k){return 'cleartv.'+(family!=='default'&&(k==='settings'||k==='matchesFavorites')?'viewer.'+family+'.':'')+k;}
 C.read=function(k,fallback){try{var value=localStorage.getItem(key(k));return value===null?fallback:JSON.parse(value);}catch(ignore){return fallback;}};
 C.write=function(k,value){try{localStorage.setItem(key(k),JSON.stringify(value));}catch(ignore){}};
 C.settings=C.read('settings',{});C.saveSettings=function(){C.write('settings',C.settings);};C.config={};
 C.el=function(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined&&text!==null)e.textContent=text;return e;};
 C.matchesHome=dashboard;C.matchesOverlayClosed=function(){return true;};
 C.matchesFit=function(card){card.style.top='150px';};
 C.matchesSettingsHost=document.createElement('div');C.matchesSettingsHost.className='matches-setting-host';var settings=document.getElementById('iptv-settings-page-library');if(settings)settings.appendChild(C.matchesSettingsHost);
 function focus(e){if(!e)return;try{e.focus({preventScroll:true});}catch(ignore){e.focus();}}
 C.Focus={setScope:function(value){scope=value===document?null:value;},focus:focus,invalidate:function(){}};
 C.showView=function(name){page.hidden=name!=='matches';if(page.hidden)scope=null;};C.back=api.back;C.applyRemoteConfig=function(value){Object.keys(value||{}).forEach(function(k){C.settings[k]=value[k];});C.saveSettings();};
 var tab=document.createElement('button');tab.type='button';tab.id='cinema-matches';tab.setAttribute('data-no-translate','');tab._cinemaWords=['المباريات','Matches'];tab.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 5h-5L8 10ZM12 3v4M3.5 9l4.5 1M5.5 19l4-4M18.5 19l-4-4M20.5 9 16 10"/></svg>';tab.onclick=function(){if(C.Matches)C.Matches.open();};(document.querySelector('#stream-sidebar .cinema-nav-stack')||quick).appendChild(tab);
 function labels(){var name=w.MorphLocale?MorphLocale.t('المباريات','Matches'):'Matches';tab.setAttribute('aria-label',name);tab.title=name;}labels();w.addEventListener('morphLanguage',labels);
 function move(code){var root=scope||page,nodes=Array.prototype.slice.call(root.querySelectorAll('button:not([disabled])')).filter(function(e){return e.offsetWidth&&e.offsetHeight&&!e.closest('[hidden]');}),current=document.activeElement;if(nodes.indexOf(current)<0){focus(nodes[0]);return;}var a=current.getBoundingClientRect(),best=null,cost=Infinity,horizontal=code===37||code===39;nodes.forEach(function(e){if(e===current)return;var b=e.getBoundingClientRect(),dx=b.left+b.width/2-a.left-a.width/2,dy=b.top+b.height/2-a.top-a.height/2;if(code===37&&dx>=-2||code===39&&dx<=2||code===38&&dy>=-2||code===40&&dy<=2)return;var overlap=horizontal?Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top):Math.min(a.right,b.right)-Math.max(a.left,b.left);var value=(horizontal?Math.abs(dx)+Math.abs(dy)*3:Math.abs(dy)+Math.abs(dx)*3)+(overlap>0?0:700);if(value<cost){cost=value;best=e;}});focus(best);if(best&&page.scrollHeight>page.clientHeight)best.scrollIntoView({block:'nearest',inline:'nearest'});}
 var nav=w.IptvCinemaNavigation,oldBack=nav.back,oldMove=nav.move;nav.back=function(){if(!page.hidden){C.back();return true;}return oldBack.apply(nav,arguments);};nav.move=function(code){if(!page.hidden){move(code);return true;}return oldMove.apply(nav,arguments);};
 w.addEventListener('keydown',function(e){if(page.hidden)return;var code=e.keyCode;if([4,27,10009,461].indexOf(code)>=0){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)C.back();}else if(code>=37&&code<=40){e.preventDefault();e.stopImmediatePropagation();move(code);}else if(code===13){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&document.activeElement.tagName==='BUTTON')document.activeElement.click();}},true);
 var remote=api.remote;api.remote=function(method,value){if(!page.hidden&&method==='key'){if(value==='ENTER'){if(document.activeElement.tagName==='BUTTON')document.activeElement.click();return {sent:true};}if(value==='RETURN'||value==='HOME'){C.back();return {sent:true};}var code={UP:38,DOWN:40,LEFT:37,RIGHT:39}[value];if(code){move(code);return {sent:true};}}return remote.apply(api,arguments);};
 w.MorphMatchesHost=C;
})(window);
