/* The native host owns the appearance choice; phone styling never affects TV. */
(function(){document.documentElement.dataset.appAppearance='dark';document.documentElement.style.colorScheme='dark';})();
window.PhoneIptvPersonalPending=function(){try{return localStorage.getItem('tvmorph.phone.personal-pending.v1')==='1';}catch(e){return false;}};
document.body.setAttribute('data-phone-library','');
document.body.setAttribute('data-phone-readable','');
document.body.setAttribute('data-phone-bottom-tabs','');
/* A phone IPTV hub replaces the TV hero and shelves, reusing the same catalogue actions. */
(function(){'use strict';
const d=document,host=d.getElementById('dashboard'),api=window.IptvTvBridge;if(!host||!api)return;
const home=d.createElement('section');home.id='phone-iptv-home';home.setAttribute('data-no-translate','');
home.innerHTML='<h1 class="phone-screen-reader-title">Morph IPTV</h1><div class="ph-home-grid"></div>';
host.appendChild(home);
const entries=[['live','live'],['vod','vod'],['series','series'],['multiview','multiview']];
entries.forEach(entry=>{const b=d.createElement('button');b.type='button';b.dataset.phoneSection=entry[0];const glyph=d.querySelector('#stream-nav-'+entry[1]+' svg');b.innerHTML='<span class="ph-section-icon">'+(glyph?glyph.outerHTML:'')+'</span><strong></strong><small></small><span class="ph-section-chevron" aria-hidden="true">›</span>';if(entry[0]!=='favorites'){const art=d.createElement('img');art.className='ph-section-art';art.src='../ui/iptv-home-'+({live:'tv',vod:'movies',series:'series',multiview:'multiview-v1'}[entry[0]])+'.png';art.alt='';art.setAttribute('aria-hidden','true');b.prepend(art);}if(entry[0]==='live'){const action=d.createElement('span');action.className='ph-live-action';b.appendChild(action);}b.onclick=()=>{if(entry[0]==='multiview'){const original=d.getElementById('multiview-open');if(original)original.click();return;}if(entry[0]==='favorites'){const kind=['live','vod','series'].find(k=>{const el=d.getElementById('kind-'+k);return el&&!el.disabled;})||'live';api.browseFavorites(kind);return;}const original=d.getElementById('kind-'+entry[0]);if(original&&!original.disabled)original.click();else d.getElementById('stream-sources').click();};home.querySelector('.ph-home-grid').appendChild(b);});
const manage=d.createElement('button');manage.type='button';manage.className='ph-manage-subscription';manage.onclick=()=>d.getElementById('settings-open').click();home.appendChild(manage);const landing=()=>d.body.classList.toggle('phone-iptv-landing',!host.hidden);new MutationObserver(landing).observe(host,{attributes:true,attributeFilter:['hidden']});landing();
function paint(){const ar=d.documentElement.lang==='ar',info=api.homeData().info||{};if(window.IptvFirstSource&&!window.PhoneIptvPersonalPending?.())IptvFirstSource.offer(info,{storageKey:'tvmorph.phone.first-source.v1',rememberAdd:false});decorateChoice();home.dir=ar?'rtl':'ltr';const library=d.getElementById('stream-sources');if(library){library.title=info.name||'';library.setAttribute('aria-label',(ar?'المكتبة':'Library')+(info.name?' — '+info.name:''));}const labels=ar?{live:['قنوات مباشرة','قنواتك جاهزة للمشاهدة'],vod:['أفلام','تصفّح مكتبة الأفلام'],series:['مسلسلات','المواسم والحلقات في مكان واحد'],multiview:['مشاهدة متعددة','شاهد أكثر من قناة معًا'],favorites:['المفضلة','ارجع للمحتوى اللي حفظته']}:{live:['Live TV','Your channels, ready to watch'],vod:['Movies','Explore your movie library'],series:['Series','Explore your series library'],multiview:['Multi-view','Watch multiple channels together'],favorites:['Favorites','Find the titles you saved']};home.querySelectorAll('[data-phone-section]').forEach(b=>{const kind=b.dataset.phoneSection,original=d.getElementById('kind-'+kind),unavailable=original&&original.disabled;let note=labels[kind][1];if(unavailable)note=ar?'أضف مصدرًا يحتوي على هذا القسم':'Add a source with this section';b.querySelector('strong').textContent=labels[kind][0];b.querySelector('small').textContent=note;});home.querySelector('.ph-live-action').textContent=ar?'شاهد القنوات  ‹':'Watch live  ›';home.querySelector('.ph-manage-subscription').textContent=ar?'⚙  إدارة الاشتراك':'⚙  Manage subscription';}
function decorateChoice(){const panel=d.getElementById('iptv-first-source');if(!panel)return;if(!panel.dataset.phoneChoices){panel.dataset.phoneChoices='1';panel.querySelector('[data-choice=add]').addEventListener('click',()=>{localStorage.setItem('tvmorph.phone.personal-pending.v1','1');},true);panel.querySelector('[data-choice=free]').addEventListener('click',()=>{localStorage.removeItem('tvmorph.phone.personal-pending.v1');},true);}if(!d.getElementById('phone-source-back')){const back=d.createElement('button');back.id='phone-source-back';back.type='button';back.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 6l-6 6 6 6"/></svg>';back.setAttribute('aria-label',d.documentElement.lang==='ar'?'العودة إلى Morph TV':'Back to Morph TV');back.setAttribute('data-transient-back','');back.onclick=()=>{if(window.IptvUI&&IptvUI.dismissTransient&&IptvUI.dismissTransient())return;if(window.IptvNative&&IptvNative.exit)IptvNative.exit();};panel.appendChild(back);}const img=panel.querySelector('section>img');if(img){const wrap=d.createElement('span');wrap.className='phone-logo-wrap';img.before(wrap);wrap.appendChild(img);const ink=d.createElement('span');ink.className='phone-logo-ink';ink.setAttribute('aria-hidden','true');wrap.appendChild(ink);}}
new MutationObserver(decorateChoice).observe(d.body,{childList:true});
new MutationObserver(paint).observe(d.getElementById('morph-header'),{subtree:true,attributes:true,attributeFilter:['disabled']});window.addEventListener('morphLanguage',paint);window.addEventListener('iptvHomeRefresh',paint);window.addEventListener('load',paint);paint();
})();
/* Phone presentation uses the approved host palette; provider and TV settings stay shared. */
(function(){'use strict';
const root=document.documentElement,style=document.createElement('style');style.setAttribute('data-iptv-theme-style','phone-pearl');document.head.appendChild(style);
const roles={bg:'#0b1a2c',surface:'#142b45',text:'#f5f8ff',muted:'#c3d0e1',accent:'#e8c48a',border:'#38516d',glow:'#219bff',shadow:'#071524'};
function rgba(hex,alpha){return 'rgba('+[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',')+','+alpha+')';}
function paint(){
 const values={'--media-bg':roles.bg,'--media-home-bg':roles.bg,'--stream-bg':roles.bg,'--media-card':roles.surface,'--iptv-surface':roles.surface,'--iptv-text':roles.text,'--ui-text':roles.text,'--iptv-muted':roles.muted,'--stream-muted':roles.muted,'--ui-text-muted':roles.muted,'--iptv-accent':roles.accent,'--media-accent':roles.accent,'--stream-accent':roles.accent,'--header-accent':roles.accent,'--ui-accent':roles.accent,'--iptv-border':roles.border,'--iptv-input':'#10243b','--iptv-overlay':'rgba(7,21,36,.82)','--iptv-focus-ring':roles.accent,'--ui-focus-ring':roles.accent,'--iptv-idle-surface':'#142b45','--iptv-focus-surface':'#203d5c','--ui-idle-surface':'#142b45','--ui-focused-surface':'#203d5c'};
 (window.IptvThemeTokenMap||[]).forEach(token=>{const alpha=token.role==='text'||token.role==='muted'?Math.max(.84,token.alpha):token.alpha;values[token.name]=rgba(roles[token.role]||roles.surface,alpha);});
 Array.from(root.style).forEach(name=>{const token=name.match(/^--iptv-runtime-(bg|surface|text|muted|accent|border|glow|shadow)-(\d+)$/);if(token)values[name]=rgba(roles[token[1]],token[1]==='text'?Math.max(.84,Number(token[2])/1000):Number(token[2])/1000);});
 const css='html#iptv-theme-root#iptv-theme-root[data-phone-episodes]{'+Object.keys(values).map(name=>name+':'+values[name]+'!important').join(';')+'}';
 if(style.textContent!==css)style.textContent=css;
}
new MutationObserver(paint).observe(root,{attributes:true,attributeFilter:['style']});paint();window.addEventListener('morphTheme',paint);
})();
/* Phone category drawer reuses the library's existing category actions. */
(function(){'use strict';
const rail=document.querySelector('main aside'),heading=document.querySelector('main .heading');
if(!rail||!heading)return;
const words={ar:['الأقسام والقنوات','ابحث عن قسم…','إغلاق','كل المحتوى'],en:['Categories & channels','Find a category…','Close','All content'],fr:['Catégories et chaînes','Chercher une catégorie…','Fermer','Tout le contenu'],de:['Kategorien & Sender','Kategorie suchen…','Schließen','Alle Inhalte'],es:['Categorías y canales','Buscar categoría…','Cerrar','Todo el contenido']};
const get=()=>words[document.documentElement.lang]||words.en;
const trigger=document.createElement('button'),shade=document.createElement('div'),bar=document.createElement('div'),title=document.createElement('strong'),close=document.createElement('button'),filter=document.createElement('input');
trigger.id='phone-categories-open';trigger.dataset.noTranslate='';trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','phone-category-drawer');heading.prepend(trigger);
shade.id='phone-category-shade';shade.hidden=true;rail.parentElement.append(shade);
bar.className='phone-category-bar';bar.dataset.noTranslate='';bar.append(title,close);filter.id='phone-category-filter';filter.dataset.noTranslate='';filter.type='search';filter.dir='auto';rail.prepend(bar,filter);rail.id='phone-category-drawer';rail.setAttribute('aria-label',get()[0]);
let selected='',opened=false;
function paint(){const w=get();title.textContent=w[0];close.textContent='✕ '+w[2];filter.placeholder=w[1];filter.setAttribute('aria-label',w[1]);trigger.textContent='☰ '+(selected||w[0]);}
function search(){const query=filter.value.trim().toLocaleLowerCase();rail.querySelectorAll('#categories button').forEach(b=>{b.hidden=!!query&&!b.textContent.toLocaleLowerCase().includes(query);});}
function dismiss(){if(!opened)return false;opened=false;document.body.classList.remove('phone-categories-visible');shade.hidden=true;rail.setAttribute('aria-hidden','true');rail.inert=true;trigger.setAttribute('aria-expanded','false');trigger.focus();return true;}
trigger.onclick=()=>{opened=true;filter.value='';search();rail.inert=false;rail.setAttribute('aria-hidden','false');document.body.classList.add('phone-categories-visible');shade.hidden=false;trigger.setAttribute('aria-expanded','true');close.focus();};
close.onclick=dismiss;shade.onclick=dismiss;filter.oninput=search;
rail.addEventListener('click',e=>{const b=e.target.closest('#categories button,#library-special button');if(!b)return;selected=b.textContent.trim();rail.querySelectorAll('[aria-current]').forEach(x=>x.removeAttribute('aria-current'));b.setAttribute('aria-current','true');paint();dismiss();});
document.addEventListener('keydown',e=>{if(!opened)return;if(e.key==='Escape'||e.key==='BrowserBack'){e.preventDefault();e.stopImmediatePropagation();dismiss();}else if(e.key==='Tab'){const list=[...rail.querySelectorAll('button,input')].filter(x=>!x.hidden&&x.getClientRects().length);let i=list.indexOf(document.activeElement);if(e.shiftKey&&i===0||!e.shiftKey&&i===list.length-1){e.preventDefault();list[e.shiftKey?list.length-1:0].focus();}}},true);
new MutationObserver(()=>{selected='';paint();}).observe(document.body,{attributes:true,attributeFilter:['data-kind']});
new MutationObserver(search).observe(document.getElementById('categories'),{childList:true});
const grid=document.getElementById('items');grid.addEventListener('scroll',()=>{if(grid.scrollHeight-grid.scrollTop-grid.clientHeight<140&&window.IptvUI)window.IptvUI.phoneLoadMore();},{passive:true});
window.addEventListener('morphLanguage',paint);window.PhoneIptvNavigation={back:dismiss};rail.inert=true;rail.setAttribute('aria-hidden','true');paint();
})();

/* Explicit IPTV identity on the local phone player/library. */
(function(){var brand=document.querySelector('#morph-header .brand,header .brand');if(brand){brand.classList.add('pm-phone-brand');brand.setAttribute('aria-label','Morph IPTV');brand.innerHTML='<img class="phone-brand-symbol" src="morph-header-symbol.webp" alt=""><span class="phone-brand-text">orph IPTV</span>';}
function labels(){var ar=document.documentElement.lang==='ar';[['kind-live',ar?'القنوات':'Live TV'],['stream-sources',ar?'المكتبة ▾':'Library ▾'],['stream-update',ar?'↻ تحديث المكتبة':'↻ Refresh library'],['category-order-open',ar?'ترتيب التصنيفات ↕':'Arrange categories ↕']].forEach(function(row){var el=document.getElementById(row[0]);if(!el)return;var text=row[0]==='stream-update'&&el.disabled?(ar?'جارٍ التحديث…':'Updating…'):row[1];if(el.textContent!==text)el.textContent=text;});}window.addEventListener('morphLanguage',labels);window.addEventListener('load',labels);var utility=document.getElementById('stream-utility');if(utility)new MutationObserver(labels).observe(utility,{childList:true,subtree:true});labels();})();

/* Explain shared source methods in phone terms; original fields and handlers remain authoritative. */
(function(){const panel=document.getElementById('account-panel');if(!panel)return;
function explain(){const ar=document.documentElement.lang==='ar',mode=panel.dataset.sourceScreen;const note=panel.querySelector('.source-form-note');const notes=ar?{xtream:'أدخل رابط السيرفر واسم المستخدم وكلمة المرور. المنفذ اختياري.',m3u:'الصق رابط قائمة M3U أو M3U8 الخاصة بك، ثم اضغط حفظ وربط.',file:'اختر ملف M3U أو M3U8 من ملفات موبايلك لإضافته إلى مكتبتك.',portal:'أدخل رابط بوابة Stalker وعنوان MAC الخاص باشتراكك.'}:{xtream:'Enter your server URL, username and password. Port is optional.',m3u:'Paste your M3U or M3U8 playlist URL, then choose Connect & save.',file:'Choose an M3U or M3U8 playlist from your phone to add it to your library.',portal:'Enter your Stalker portal URL and subscription MAC address.'};if(note&&notes[mode])note.textContent=notes[mode];const file=document.getElementById('account-import-file');if(file)file.textContent=ar?'اختيار ملف من الموبايل':'Choose a file from your phone';}
new MutationObserver(explain).observe(panel,{attributes:true,attributeFilter:['data-source-screen']});window.addEventListener('morphLanguage',explain);explain();})();

/* Mobile settings navigation and source selection labels describe the actual data. */
(function(){const settings=document.getElementById('settings-panel'),badge=document.getElementById('iptv-active-badge');if(!settings)return;
function label(){const ar=document.documentElement.lang==='ar',b=document.getElementById('settings-close');const title=settings.querySelector('.settings-heading h2');if(title)title.textContent=ar?'إعدادات IPTV':'IPTV settings';if(b){b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';b.setAttribute('aria-label',ar?'العودة إلى IPTV':'Back to IPTV');}const remove=document.getElementById('account-delete-file'),actions=settings.querySelector('.iptv-active-actions');if(remove&&actions&&remove.parentNode!==actions)actions.appendChild(remove);const icons={accounts:'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 10h18M15 15h3"/>',add:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',playback:'<path d="M9 5l11 7-11 7zM4 6v12"/>',library:'<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/>'};const names=ar?{accounts:'حساباتي',add:'إضافة حساب',playback:'المشاهدة',library:'المكتبة'}:{accounts:'Accounts',add:'Add account',playback:'Playback',library:'Library'};Object.keys(icons).forEach(key=>{const tab=document.getElementById('iptv-settings-tab-'+key);if(tab&&(!tab.querySelector('svg')||tab.dataset.phoneLocale!==document.documentElement.lang)){tab.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[key]+'</svg><span>'+names[key]+'</span>';tab.dataset.phoneLocale=document.documentElement.lang;}if(tab&&tab.getAttribute('aria-current')==='page')settings.querySelector('.settings-dialog').dataset.phoneSettingsPage=key;});if(badge&&!badge.hidden){const text=ar?'المصدر الحالي':'CURRENT SOURCE';if(badge.textContent!==text)badge.textContent=text;}}
const nav=settings.querySelector('.iptv-settings-nav');if(nav)new MutationObserver(label).observe(nav,{childList:true,subtree:true});if(badge)new MutationObserver(label).observe(badge,{childList:true});window.addEventListener('morphLanguage',label);label();})();

/* Format every line returned by the shared account-details formatter, without dropping values. */
(function(){const info=document.getElementById('account-subscription-info');if(!info)return;function rows(){if(info.querySelector('.ph-data-row,.ph-data-message'))return;const lines=info.textContent.split('\n').map(s=>s.trim()).filter(Boolean);if(!lines.length)return;info.textContent='';lines.forEach(line=>{const split=line.indexOf(':'),row=document.createElement('span');if(split<0){row.className='ph-data-message';row.textContent=line;}else{row.className='ph-data-row';const label=document.createElement('span'),value=document.createElement('strong');label.textContent=line.slice(0,split);value.textContent=line.slice(split+1).trim();if(/^active$/i.test(value.textContent)){value.dataset.subscriptionStatus='active';value.textContent=window.MorphLocale?MorphLocale.t('نشط','Active'):'Active';}row.append(label,value);}info.append(row,document.createTextNode('\n'));});}new MutationObserver(rows).observe(info,{childList:true});rows();})();

/* One compact host-back button; the native activity preserves the current library. */
(function(){const header=document.getElementById('morph-header');if(!header)return;const back=document.createElement('button');back.id='phone-host-back';back.type='button';back.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6l-6 6 6 6"/></svg>';back.setAttribute('data-transient-back','');back.onclick=()=>{if(window.IptvUI&&IptvUI.dismissTransient&&IptvUI.dismissTransient())return;if(window.IptvNative&&IptvNative.exit)IptvNative.exit();};function label(){back.setAttribute('aria-label',document.documentElement.lang==='ar'?'العودة إلى Morph TV':'Back to Morph TV');}window.addEventListener('morphLanguage',label);label();header.appendChild(back);})();

/* Personal selection never silently enters the public catalogue. Reuse the shared add/switch handlers. */
(function(){const key='tvmorph.phone.personal-pending.v1',api=window.IptvTvBridge;let opened=false;
function pending(){const info=api.homeData().info||{};if(info.configured&&!info.publicMode){localStorage.removeItem(key);return false;}return PhoneIptvPersonalPending();}
function add(){Promise.resolve(IptvUI.settings(false)).then(()=>IptvSettingsPages.open('add'));}
function paint(){const on=pending(),ar=document.documentElement.lang==='ar';if(document.body.classList.contains('phone-personal-pending')!==on)document.body.classList.toggle('phone-personal-pending',on);if(!on)return;if(document.getElementById('settings-panel').hidden&&!document.body.classList.contains('cinema-home')){document.getElementById('home-open').click();}const manage=document.querySelector('#phone-iptv-home .ph-manage-subscription');if(manage){manage.textContent=ar?'ربط حسابي':'Connect account';manage.onclick=add;}const summary=document.getElementById('iptv-active-source');if(summary)summary.textContent=ar?'في انتظار ربط حسابك':'Waiting for your account to connect';}
document.addEventListener('click',e=>{if(e.target.closest('#account-open,#iptv-settings-tab-add,#account-save'))localStorage.setItem(key,'1');if(pending()&&e.target.closest('#stream-update')){e.preventDefault();e.stopImmediatePropagation();api.notice(document.documentElement.lang==='ar'?'اربط حسابك أولاً لتحديث مكتبته.':'Connect your account before updating its library.','error');return;}if(e.target.closest('#account-public')){localStorage.removeItem(key);localStorage.setItem('tvmorph.phone.first-source.v1','1');paint();return;}if(pending()&&e.target.closest('#kind-live,#kind-vod,#kind-series,#kind-favorites,[data-phone-section]')){e.preventDefault();e.stopImmediatePropagation();add();}},true);
function ready(){paint();if(pending()&&!opened){opened=true;if(window.IptvFirstSource)IptvFirstSource.cancelOffer();setTimeout(()=>{document.getElementById('home-open').click();add();paint();},0);}}
window.addEventListener('morphIptvReady',ready);window.addEventListener('morphLanguage',paint);window.addEventListener('iptvHomeRefresh',paint);window.addEventListener('load',ready);
new MutationObserver(paint).observe(document.getElementById('settings-panel'),{attributes:true,attributeFilter:['hidden']});
new MutationObserver(paint).observe(document.getElementById('morph-header'),{subtree:true,attributes:true,attributeFilter:['disabled']});paint();})();

/* Keep compact tab symbols when localized labels are refreshed. */
(function(){var nav=document.querySelector('#morph-header nav');if(!nav)return;var mapping={'home-open':'home','kind-live':'live','kind-vod':'vod','kind-series':'series','stream-top-favorites':'favorites'};
function icons(){Object.keys(mapping).forEach(function(id){var button=document.getElementById(id),source=document.querySelector('#stream-nav-'+mapping[id]+' svg');if(!button||!source||button.querySelector('.stream-nav-icon'))return;var icon=document.createElement('span');icon.className='stream-nav-icon';icon.setAttribute('aria-hidden','true');icon.appendChild(source.cloneNode(true));button.insertBefore(icon,button.firstChild);});}
new MutationObserver(icons).observe(nav,{childList:true,subtree:true});window.addEventListener('morphLanguage',icons);icons();})();

(function(){function hideArrange(){var button=document.getElementById('category-order-open');if(button){button.hidden=true;button.disabled=true;button.tabIndex=-1;button.setAttribute('aria-hidden','true');}}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hideArrange);else hideArrange();})();

/* Schedule is a full phone page; returning preserves the current IPTV library/player. */

/* Move the actual shared tabs, keeping their handlers, focus and selected state. */
(function(){'use strict';
 const d=document,header=d.getElementById('morph-header'),nav=header&&header.querySelector('nav');if(!nav)return;
 nav.classList.add('phone-bottom-nav');d.body.appendChild(nav);
 const phoneBrand=header.querySelector('.brand'),phoneLogo=phoneBrand&&phoneBrand.querySelector('img');
 if(phoneBrand){phoneBrand.setAttribute('aria-label','Morph IPTV');phoneBrand.setAttribute('data-no-translate','');phoneBrand.innerHTML='<img class="phone-brand-symbol" src="morph-header-symbol.webp" alt=""><span class="phone-brand-text">orph IPTV</span>';}

 const utility=d.getElementById('stream-utility');
 const libraryButton=d.getElementById('stream-sources');if(libraryButton)libraryButton.onclick=()=>Promise.resolve(IptvUI.settings(false)).then(()=>IptvSettingsPages.open('accounts'));
 function footerTools(){if(utility&&utility.parentElement!==header)header.appendChild(utility);}
 if(utility){utility.setAttribute('role','group');utility.setAttribute('data-no-translate','');footerTools();new MutationObserver(footerTools).observe(header,{childList:true});window.addEventListener('load',footerTools);window.addEventListener('resize',footerTools);}

 function labels(){
  const ar=d.documentElement.lang==='ar';nav.setAttribute('aria-label',ar?'أقسام IPTV':'IPTV sections');if(utility)utility.setAttribute('aria-label',ar?'أدوات المكتبة':'Library tools');
  nav.querySelectorAll('button').forEach(button=>{
   if(button.querySelector('.phone-tab-label'))return;
   const nodes=[...button.childNodes].filter(node=>node.nodeType===3),text=nodes.map(n=>n.textContent).join('').trim();if(!text)return;
   nodes.forEach(n=>n.remove());const label=d.createElement('span');label.className='phone-tab-label';label.textContent=text;button.appendChild(label);
  });
 }
 new MutationObserver(labels).observe(nav,{childList:true,subtree:true});window.addEventListener('morphLanguage',labels);labels();
 const heading=d.querySelector('main .heading'),categories=d.getElementById('categories'),grid=d.getElementById('items');if(!heading||!categories||!grid)return;
 function channelRows(){
  grid.querySelectorAll('.item[data-kind=live] .tile').forEach(tile=>{
   let note=tile.querySelector('.phone-channel-meta');if(!note){note=d.createElement('small');note.className='phone-channel-meta';note.dataset.noTranslate='';tile.appendChild(note);}
   const item=tile._item||{};note.textContent=item.categoryName||item.category_name||item.groupTitle||(d.documentElement.lang==='ar'?'قناة مباشرة':'Live channel');
   if(!tile.querySelector('.phone-channel-play')){const play=d.createElement('span');play.className='phone-channel-play';play.setAttribute('aria-hidden','true');play.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path d="m10 7 7 5-7 5Z" fill="currentColor" stroke="none"/></svg>';tile.appendChild(play);}
  });
 }
 new MutationObserver(channelRows).observe(grid,{childList:true});
 window.addEventListener('morphLanguage',channelRows);channelRows();
})();
