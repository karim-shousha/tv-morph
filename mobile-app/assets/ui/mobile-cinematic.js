(function(){'use strict';
var d=document,$=function(id){return d.getElementById(id);},t=function(ar,en){return window.MorphLocale?MorphLocale.t(ar,en):ar;};
function init(){
 var home=$('page-connect');if(!home||$('mobile-welcome'))return;
 var hero=d.createElement('section');hero.id='mobile-welcome';hero.className='mobile-welcome';hero.setAttribute('data-no-translate','');
 hero.innerHTML='<div class="mc-orbit" aria-hidden="true">'+Morph30.svg('tv',72)+'</div><div class="mc-copy"><p class="mc-welcome"></p><h2 dir="ltr">Morph <span>TV</span></h2><p class="mc-description"></p></div><button id="mc-start" class="primary full"></button>';
 hero.hidden=true;home.insertBefore(hero,home.firstChild);
 var state=$('m30-status');if(state)hero.after(state);
 var shortcuts=d.createElement('div');shortcuts.className='mobile-shortcuts';shortcuts.hidden=true;shortcuts.setAttribute('data-no-translate','');
 [['design','design'],['control','remote'],['apps','apps']].forEach(function(row){var b=d.createElement('button');b.className='mc-shortcut mc-'+row[0];b.innerHTML=Morph30.svg(row[1],30)+'<span></span>';b.onclick=function(){Morph30.show(row[0]);};b.dataset.destination=row[0];shortcuts.appendChild(b);});
 (state||hero).after(shortcuts);
 var small=d.createElement('small');small.id='mc-chip-status';$('device-chip').appendChild(small);
 function paint(){
  var status=$('connection-state').dataset.status,ready=status==='connected';
  hero.querySelector('.mc-welcome').textContent=t('مرحبًا بك في','Welcome to');
  hero.querySelector('.mc-description').textContent=t('تلفزيونك على ذوقك. اتصل، صمّم، واستمتع بكل إمكانيات Morph TV.','Your TV, your way. Connect, design and enjoy Morph TV.');
  $('mc-start').textContent=ready?t('تثبيت / تحديث على التلفزيون ←','Install / update your TV →'):t('ابحث عن تلفزيونك ←','Find your TV →');
  small.textContent=ready?t('متصل الآن','Connected now'):status==='detected'?t('بانتظار الربط','Pairing needed'):status==='checking'?t('جارٍ الفحص','Checking'):t('غير متصل','Not connected');
  shortcuts.querySelector('[data-destination=design] span').textContent=t('تصميم التلفزيون','TV design');
  shortcuts.querySelector('[data-destination=control] span').textContent=t('التحكم','Remote');
  shortcuts.querySelector('[data-destination=apps] span').textContent=t('التطبيقات','Apps');
 }
 $('mc-start').onclick=function(){if($('connection-state').dataset.status==='connected')MorphConnectFlow.open(2,true);else{MorphConnectFlow.open(1,false);$('scan').click();}};
 new MutationObserver(paint).observe($('connection-state'),{attributes:true,attributeFilter:['data-status']});window.addEventListener('morphLanguage',paint);paint();
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})();
