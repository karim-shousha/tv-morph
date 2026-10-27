/* Cinematic TV presentation only. Catalog, playback and account ownership
   remain in app.js and the native/platform bridges. */
(function(){'use strict';
 if(!/width=1920/.test(document.querySelector('meta[name=viewport]').content))return;
 var $=function(id){return document.getElementById(id);},api=window.IptvTvBridge,t=api.translate;
 document.documentElement.setAttribute('data-media-cinema','');
 // Keep all account and maintenance controls in the top Settings dialog.
 var tools=document.querySelector('.portal-tools'),dialog=document.querySelector('.settings-dialog');
 $('home-settings').hidden=true;
 dialog.insertBefore($('home-account'),$('account-open'));
 dialog.insertBefore($('home-refresh'),$('account-open'));
 tools.hidden=true;
 $('home-account').onclick=function(){$('account-panel').hidden=false;$('account-status').textContent=t('بيانات اشتراكك الحالي','Your subscription details');$('account-server').focus();};
 $('home-refresh').onclick=function(){$('cache-clear').click();};
 var pulseTimers=new WeakMap();
 document.addEventListener('click',function(event){var button=event.target.closest('.portal-grid button');if(!button)return;clearTimeout(pulseTimers.get(button));button.classList.remove('portal-pressed');void button.offsetWidth;button.classList.add('portal-pressed');pulseTimers.set(button,setTimeout(function(){button.classList.remove('portal-pressed');},240));},true);
 var hero=document.createElement('section');hero.id='cinematic-hero';
 hero.innerHTML='<img class="cinematic-hero-art" alt=""><div class="cinematic-hero-copy"><span class="cinematic-kicker">MORPH · IPTV</span><h1></h1><p></p><button id="cinematic-browse"></button></div><div class="hero-dots" aria-hidden="true"><i></i><i></i><i></i></div>';
 $('dashboard').insertBefore(hero,$('dashboard').firstChild);
 var shelf=document.createElement('h2');shelf.id='continue-heading';$('watch-hero').before(shelf);
 var portals=document.querySelector('.portal-grid');$('dashboard').insertBefore(portals,shelf);
 var music=document.createElement('button');music.id='home-music';music.innerHTML='<span class="music-glyph" aria-hidden="true">♫</span><strong></strong><small></small>';portals.appendChild(music);
 music.onclick=function(){if(window.SamsungMedia&&SamsungMedia.openRadio)SamsungMedia.openRadio();else if(parent!==window&&parent.ClearTV){var apps=parent.ClearTV.Catalog.apps,radio=apps.filter(function(a){return /radio/i.test(a.id+' '+a.name);})[0];if(radio)parent.ClearTV.Catalog.launch(radio);}else if(window.IptvNative&&IptvNative.radio)IptvNative.radio();};
 Array.prototype.forEach.call(portals.children,function(b){var name=b.dataset.open||(b.id==='home-favorites'?'favorites':'music');var art=document.createElement('img');art.className='category-art';art.alt='';art.src='card-'+name+'-v1.webp';b.insertBefore(art,b.firstChild);});
 var heroChoice=null,heroArt=hero.querySelector('.cinematic-hero-art');
 heroArt.setAttribute('data-category-art','true');
 function previewCategory(button){if(!button||button.hidden)return;var art=button.querySelector('.category-art');if(!art)return;heroChoice=button;heroArt.hidden=false;if(heroArt.getAttribute('src')!==art.getAttribute('src'))heroArt.src=art.getAttribute('src');hero.dataset.category=button.dataset.open||(button.id==='home-favorites'?'favorites':'music');}
 portals.addEventListener('focusin',function(event){previewCategory(event.target.closest('button'));});
 portals.addEventListener('pointerover',function(event){previewCategory(event.target.closest('button'));});
 previewCategory(Array.prototype.filter.call(portals.children,function(b){return !b.hidden;})[0]);
 $('cinematic-browse').onclick=function(){var choice=heroChoice&&!heroChoice.hidden?heroChoice:Array.prototype.filter.call(portals.children,function(b){return !b.hidden;})[0];if(choice)choice.click();else $('home-settings').click();};
 var glyphs={live:'<rect x="3" y="6" width="26" height="21" rx="4"/><path d="m10 1 6 5 6-5M11 31h10"/>',vod:'<circle cx="16" cy="16" r="13"/><circle cx="12" cy="9" r="2"/><circle cx="23" cy="12" r="2"/><circle cx="21" cy="23" r="2"/><circle cx="9" cy="22" r="2"/><circle cx="16" cy="16" r="1"/>',series:'<rect x="3" y="4" width="26" height="24" rx="3"/><path d="M8 4v24M24 4v24M3 10h5m-5 6h5m-5 6h5M24 10h5m-5 6h5m-5 6h5"/>',favorites:'<path d="M16 28S2 19 2 10a7 7 0 0 1 14-1 7 7 0 0 1 14 1c0 9-14 18-14 18Z"/>'};
 Array.prototype.forEach.call(portals.children,function(b){var icon=b.querySelector('.portal-icon');if(!icon)return;var id=b.dataset.open||'favorites',span=document.createElement('span');span.className='portal-icon';span.setAttribute('aria-hidden','true');span.innerHTML='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">'+glyphs[id]+'</svg>';icon.parentNode.replaceChild(span,icon);});
 function homeState(){document.body.classList.toggle('cinema-home',!$('dashboard').hidden);}homeState();new MutationObserver(homeState).observe($('dashboard'),{attributes:true,attributeFilter:['hidden']});
 var clock=document.createElement('div');clock.className='media-clock';clock.setAttribute('aria-hidden','true');document.querySelector('header').appendChild(clock);
 function time(){var now=new Date();clock.textContent=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})+' · '+now.toLocaleDateString([], {month:'short',day:'numeric'});}time();setInterval(time,60000);
 function labels(){hero.querySelector('h1').textContent=t('كل اللي بتحب تشوفه.','Your TV. Your world.');hero.querySelector('p').textContent=t('قنوات مباشرة، أفلام ومسلسلات. كل محتواك في مكان واحد.','Live moments. Movie nights. All your entertainment, together.');$('cinematic-browse').textContent=t('▶ شاهد الآن','▶ Watch now');shelf.textContent=t('استكمال المشاهدة','Continue watching');music.querySelector('strong').textContent=t('الموسيقى والراديو','Music & Radio');music.querySelector('small').textContent=t('صوت يرافق يومك','Your daily soundtrack');}
 labels();window.addEventListener('morphLanguage',labels);
 var view=document.createElement('button');view.id='catalog-view-toggle';
 var sort=document.createElement('select');sort.id='catalog-sort';sort.setAttribute('aria-label',t('ترتيب العناوين','Title order'));
 [['provider',t('ترتيب المزوّد','Provider order')],['az',t('أ ← ي · الصفحة','A–Z · this page')],['za',t('ي ← أ · الصفحة','Z–A · this page')]].forEach(function(v){var o=document.createElement('option');o.value=v[0];o.textContent=v[1];sort.appendChild(o);});
 sort.onchange=function(){api.setSort(sort.value);};sort.value=api.getState().sort;
 document.querySelector('.heading').appendChild(sort);document.querySelector('.heading').appendChild(view);
 var grid=true;try{grid=localStorage.getItem('tvmorph.iptv.liveGrid')!=='false';}catch(e){}
 function applyGrid(){document.body.classList.toggle('channel-grid',grid);view.textContent=grid?t('☷ قائمة','☷ List'):t('▦ شبكة','▦ Grid');view.setAttribute('aria-label',view.textContent);view.setAttribute('aria-pressed',String(grid));window.dispatchEvent(new Event('resize'));}
 view.onclick=function(){grid=!grid;try{localStorage.setItem('tvmorph.iptv.liveGrid',String(grid));}catch(e){}applyGrid();};applyGrid();
 var originalMove=window.TvIptvLayout.move;
 window.TvIptvLayout.move=function(code){var current=document.activeElement;
 if(grid&&api.getState().kind==='live'&&$('details-panel').hidden&&$('settings-panel').hidden&&$('epg-panel').hidden&&$('dashboard').hidden&&current.closest('#items')){var tiles=Array.prototype.slice.call(document.querySelectorAll('#items .tile')),index=tiles.indexOf(current),target=null;if(code===38)target=tiles[index-5]||$('unified-query');if(code===40)target=tiles[index+5]||current;if(code===37)target=index%5===0?(document.querySelector('#categories button.active')||$('browse-all')):tiles[index-1];if(code===39)target=index%5===4?current:tiles[index+1]||current;if(target){target.focus();target.scrollIntoView({block:'nearest',inline:'nearest'});}return true;}
 if(!$('dashboard').hidden&&$('settings-panel').hidden&&$('details-panel').hidden&&$('epg-panel').hidden){var groups=[Array.prototype.filter.call(document.querySelectorAll('header button,header input'),function(e){return e.offsetWidth&&!e.closest('[hidden]');}),[$('cinematic-browse')],Array.prototype.slice.call(portals.children),Array.prototype.slice.call(document.querySelectorAll('.watch-card button'))],row=-1,index=-1;groups.forEach(function(g,i){if(g.indexOf(current)>=0){row=i;index=g.indexOf(current);}});if(row>=0){var target;if(code===38||code===40){var next=row+(code===40?1:-1);if(next>=0&&next<groups.length)target=groups[next][Math.min(index,groups[next].length-1)];}else if(code===37||code===39){var ordered=groups[row].slice().sort(function(a,b){return a.getBoundingClientRect().left-b.getBoundingClientRect().left;}),i=ordered.indexOf(current);target=ordered[Math.max(0,Math.min(ordered.length-1,i+(code===39?1:-1)))];}if(target){target.focus();target.scrollIntoView({block:'nearest',inline:'nearest'});}return true;}}return originalMove(code);};
})();
