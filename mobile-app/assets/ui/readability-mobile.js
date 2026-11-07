/* Presentation only: keep the existing subscription stores and native actions. */
(function(w,d){'use strict';
 function init(){
  d.body.classList.add('morph-readable');
  var page=d.getElementById('page-iptv');if(!page)return;
  var choices=page.querySelector('.iptv-destinations'),personal=d.getElementById('iptv-personal-card'),free=d.getElementById('iptv-public-card'),form=d.getElementById('iptv-form-details');
  var title=d.createElement('h2');title.className='iptv-hub-heading';title.dataset.noTranslate='';choices.before(title);
  if(personal&&free)free.before(personal);
  if(form)form.open=false;
  var transport=d.getElementById('dlna-play'),adjust=d.getElementById('dlna-back');if(transport)transport.parentElement.classList.add('dlna-transport');if(adjust)adjust.parentElement.classList.add('dlna-adjustments');
  var paths={phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4M10 19h4"/>',tv:'<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>'};
  function words(){
   var language=w.MorphLocale?MorphLocale.get():'en';if(language!=='ar'&&language!=='en')return;
   var ar=language==='ar';
   title.textContent=ar?'اختار مكان المشاهدة':'Where do you want to watch?';
   d.getElementById('iptv-destination-intro').textContent=ar?'مكتبتك واشتراكاتك في مكان واحد. شاهد هنا، أو تحكّم في التشغيل على التلفزيون.':'Your library and subscriptions in one place. Watch here or control playback on your TV.';
   [['iptv-phone-open','phone',ar?'على الموبايل':'On phone',ar?'افتح المكتبة وشاهد هنا':'Open your library and watch here'],['iptv-tv-show','tv',ar?'على التلفزيون':'On TV',ar?'اعرض مكتبة التلفزيون وتحكّم فيها':'Browse and control your TV library']].forEach(function(row){
    var button=d.getElementById(row[0]);button.innerHTML='<svg class="iptv-hub-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+paths[row[1]]+'</svg><span><strong></strong></span>';
    button.querySelector('strong').textContent=row[2];
   });
   d.getElementById('iptv-personal-title').textContent=ar?'اشتراكاتي ومكتبتي':'My subscriptions & library';
   d.getElementById('iptv-personal-note').textContent=ar?'استخدم حسابك المحفوظ، أو أضف اشتراك Xtream أو رابط M3U أو Portal.':'Use a saved account, or add an Xtream subscription, M3U playlist or Portal.';
   d.getElementById('iptv-public-title').textContent=ar?'قنوات مجانية':'Free channels';
   d.getElementById('iptv-public-note').textContent=ar?'من قوائم IPTV-org العامة. اختار قائمة وشاهد؛ اشتراكك الخاص يفضل محفوظًا.':'Public IPTV-org playlists. Choose one to watch; your own subscription stays saved.';
   if(form)form.querySelector('summary').textContent=ar?'إضافة اشتراك أو تعديل بياناته':'Add or edit a subscription';
   d.getElementById('iptv-phone-note').textContent=ar?'المشاهدة على الموبايل لا تحتاج ربط تلفزيون. محتوى كل مكتبة يعتمد على المصدر الذي تضيفه.':'Phone playback needs no paired TV. Each library shows content from the source you add.';
  }
  ['morphLanguage','morphPlus','morphPacks','load'].forEach(function(event){w.addEventListener(event,words);});if(w.MorphPlus&&MorphPlus.ready)MorphPlus.ready.then(words);words();
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})(window,document);

/* Highlight the existing TV-update action without changing installation/consent. */
(function(){function init(){var b=document.getElementById('smart-install');if(!b)return;function paint(){var on=!b.disabled&&/update|تحديث/i.test(b.textContent);b.classList.toggle('tv-update-highlight',on);if(on)b.setAttribute('aria-description',document.documentElement.lang==='ar'?'اضغط هنا لإرسال التحديث الرسمي إلى التلفزيون.':'Press here to send the official update to your TV.');else b.removeAttribute('aria-description');}new MutationObserver(paint).observe(b,{attributes:true,attributeFilter:['disabled'],childList:true,subtree:true,characterData:true});window.addEventListener('morphLanguage',paint);window.addEventListener('morphDeviceConnected',paint);paint();}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();
