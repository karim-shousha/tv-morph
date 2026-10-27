/* Phone category drawer reuses the library's existing category actions. */
(function(){'use strict';
const rail=document.querySelector('main aside'),heading=document.querySelector('main .heading');
if(!rail||!heading)return;
const words={ar:['الأقسام والقنوات','ابحث عن قسم…','إغلاق','كل المحتوى'],en:['Categories & channels','Find a category…','Close','All content'],fr:['Catégories et chaînes','Chercher une catégorie…','Fermer','Tout le contenu'],de:['Kategorien & Sender','Kategorie suchen…','Schließen','Alle Inhalte'],es:['Categorías y canales','Buscar categoría…','Cerrar','Todo el contenido']};
const get=()=>words[document.documentElement.lang]||words.en;
const trigger=document.createElement('button'),shade=document.createElement('div'),bar=document.createElement('div'),title=document.createElement('strong'),close=document.createElement('button'),filter=document.createElement('input');
trigger.id='phone-categories-open';trigger.dataset.noTranslate='';trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','phone-category-drawer');heading.prepend(trigger);
shade.id='phone-category-shade';shade.hidden=true;document.body.append(shade);
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
