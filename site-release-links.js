'use strict';
(function(){
 let catalog;
 function paint(){
  const en=document.documentElement.lang==='en';
  document.querySelectorAll('[data-remote-download-label]').forEach(n=>n.textContent=en?'Download Morph Remote':'تحميل Morph Remote');
  document.querySelectorAll('[data-remote-release]').forEach(n=>n.textContent=(en?'Android 7.0+':'أندرويد 7.0 أو أحدث')+(catalog?.remote?.version?' · v'+catalog.remote.version:''));
 }
 fetch('/catalog.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(value=>{catalog=value;paint();}).catch(()=>paint());
 window.addEventListener('hashchange',paint);window.addEventListener('morphlanguagechange',paint);
 new MutationObserver(paint).observe(document.getElementById('main'),{childList:true});paint();
})();
