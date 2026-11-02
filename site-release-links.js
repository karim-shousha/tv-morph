'use strict';
(function(){
 let catalog;
 function paint(){
  const en=document.documentElement.lang==='en';
  document.querySelectorAll('[data-mobile-download-label]').forEach(n=>n.textContent=en?'Download MorphTV for mobile':'تحميل MorphTV للموبايل');
  const phone=catalog?.platforms?.find(p=>p.id==='phone');
  document.querySelectorAll('[data-mobile-release]').forEach(n=>n.textContent=(en?'Android 8.0+':'أندرويد 8 أو أحدث')+(phone?.version?' · v'+phone.version:''));
 }
 fetch('/catalog.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(value=>{catalog=value;paint();}).catch(()=>paint());
 window.addEventListener('hashchange',paint);window.addEventListener('morphlanguagechange',paint);
 new MutationObserver(paint).observe(document.getElementById('main'),{childList:true});paint();
})();
