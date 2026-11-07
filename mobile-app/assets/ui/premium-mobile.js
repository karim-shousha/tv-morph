/* Clear destinations: device setup, TV remote, and local/TV IPTV. */
(function(w,d){'use strict';
 var $=function(id){return d.getElementById(id);};
 function init(){
  if(!w.Morph30)return;
  d.body.setAttribute('data-premium-mobile','');
  var devices=$('page-connect'),remote=$('page-remote'),iptv=$('page-iptv');
  var map=d.createElement('section');map.id='mobile-service-map';map.setAttribute('data-no-translate','');
  map.innerHTML='<div class="pm-page-intro"><span class="pm-overline"></span><h1></h1><p></p></div><div class="pm-service-cards"><button type="button" data-service="remote">'+Morph30.svg('remote',26)+'<span><strong></strong><small></small></span>'+Morph30.svg('chev',16)+'</button><button type="button" data-service="iptv">'+Morph30.svg('play',26)+'<span><strong></strong><small></small></span>'+Morph30.svg('chev',16)+'</button></div><h2 class="pm-setup-title"></h2>';
  devices.insertBefore(map,devices.firstChild);
  var homeSupport=d.querySelector('.home-support');if(homeSupport&&$('m30-sheet-body'))$('m30-sheet-body').appendChild(homeSupport);
  map.querySelector('[data-service=remote]').onclick=function(){Morph30.show('control');};
  map.querySelector('[data-service=iptv]').onclick=function(){Morph30.show('play');};
  // Keep legacy handlers available to existing platform code, out of the new remote UI.
  var legacy=d.createElement('div');legacy.id='legacy-companion-remote';legacy.hidden=false;
  Array.prototype.slice.call(remote.children).forEach(function(n){if(n.id!=='m30-control-segment')legacy.appendChild(n);});remote.appendChild(legacy);
  var hub=d.createElement('div');hub.id='integrated-remote-hub';hub.setAttribute('data-no-translate','');
  hub.innerHTML='<div class="pm-page-intro"><span class="pm-overline">MORPH REMOTE</span><h1></h1><p></p></div><div class="pm-remote-showcase" aria-hidden="true"><div class="pm-remote-device"><div class="pm-remote-dot"></div><div class="pm-mini-pad"><span>⌃</span><span>‹</span><b>OK</b><span>›</span><span>⌄</span></div><div class="pm-mini-actions">'+Morph30.svg('home',18)+Morph30.svg('back',18)+Morph30.svg('gear',18)+'</div></div><div class="pm-remote-copy"><span>MORPH</span><strong>remote.</strong><small>Samsung · LG<br>Android TV · Fire TV</small></div></div><div class="pm-remote-info"><h2></h2><p></p><button id="integrated-remote-open" class="primary full" type="button"></button><p id="integrated-remote-state" role="status" aria-live="polite"></p></div>';
  remote.insertBefore(hub,legacy);
  // Preserve connection settings and text entry; only the obsolete remote controller is removed.
  var classic=d.createElement('button');classic.type='button';classic.id='classic-companion-open';classic.className='secondary full';classic.setAttribute('data-no-translate','');hub.querySelector('.pm-remote-info').appendChild(classic);
  // Original text-and-send field stays inline. It never claims the TV input method.
  var keyboardPanel=$('remote-text').closest('.panel');keyboardPanel.id='companion-text-panel';
  hub.appendChild(keyboardPanel);keyboardPanel.appendChild($('remote-status'));
  w.MorphClassicRemote={open:function(){Morph30.show('control');if(w.connectMorphKeyboard)w.connectMorphKeyboard();$('remote-text').focus();keyboardPanel.scrollIntoView({block:'center',behavior:'smooth'});return true;},close:function(){return false;},isOpen:function(){return false;}};
  classic.onclick=function(){MorphClassicRemote.open();};
  function keyboardWords(){var ar=MorphLocale.get()==='ar';classic.textContent=ar?'اكتب وأرسل للتلفزيون':'Type and send to TV';}w.addEventListener('morphLanguage',keyboardWords);keyboardWords();

  var remoteIntro=hub.querySelector('.pm-page-intro');remote.insertBefore(remoteIntro,hub);
  var opening=false;
  $('integrated-remote-open').onclick=async function(){if(opening)return;opening=true;this.disabled=true;try{await MorphNative.call('remoteOpen',{});$('integrated-remote-state').textContent='';}catch(e){$('integrated-remote-state').textContent=e.message;}finally{opening=false;this.disabled=false;}};
  var intro=iptv.querySelector('h1');intro.setAttribute('data-no-translate','');intro.innerHTML='Morph <span>IPTV</span>';
  var feature=d.createElement('div');feature.className='pm-iptv-feature';feature.setAttribute('data-no-translate','');
  feature.innerHTML='<div class="pm-iptv-icon">'+Morph30.svg('play',30)+'</div><div><strong></strong><p></p></div><span class="pm-iptv-badge">IPTV</span>';
  intro.after(feature);
  $('iptv-form-details').open=false;
  var phoneNote=$('iptv-phone-note');if(phoneNote)iptv.querySelector('.iptv-destinations').after(phoneNote);
  function text(selector,value,scope){var el=(scope||d).querySelector(selector);if(el)el.textContent=value;}
  function paint(){var lang=MorphLocale.get(),ar=lang==='ar';
   var support=d.querySelector('#page-connect .home-support');if(support&&$('m30-sheet-body'))$('m30-sheet-body').appendChild(support);
   var names={ar:['الأجهزة','الريموت','IPTV'],en:['Devices','Remote','IPTV'],fr:['Appareils','Télécommande','IPTV'],zh:['设备','遥控','IPTV'],ja:['デバイス','リモコン','IPTV']}[lang]||['Devices','Remote','IPTV'];
   text('.pm-overline',ar?'الأجهزة · الربط والتحديث':'DEVICES · CONNECT & UPDATE',map);
   text('h1',ar?'ربط الأجهزة وتحديثها':'Connect & update your TV',map);
   text('.pm-page-intro p',ar?'اربط الموبايل بتلفزيونك، وثبّت Morph TV أو حدّث النسخة الموجودة.':'Connect your phone to your TV, then install Morph TV or update your existing version.',map);
   text('[data-service=remote] strong',ar?'ريموت التلفزيون':'TV remote',map);text('[data-service=remote] small',ar?'تحكّم في شاشتك':'Control your TV',map);
   text('[data-service=iptv] strong',ar?'IPTV على الموبايل':'IPTV on your phone',map);text('[data-service=iptv] small',ar?'قنوات وأفلام ومسلسلات':'Channels, movies & series',map);
   text('.pm-setup-title',ar?'ابدأ ربط تلفزيونك':'Set up your TV',map);
   text('h1',ar?'ريموت التلفزيون':'Your TV remote',remote);
   text('.pm-page-intro p',ar?'اختار شاشتك واربطها بالموبايل للتحكم بسهولة.':'A dedicated remote for your TV. Choose your device and complete pairing; the Morph TV companion is not required.',remote);
   text('.pm-remote-info h2',ar?'تحكّم من مكانك':'Everything within reach',hub);
   text('.pm-remote-info p',ar?'الاتجاهات والصوت والكتابة من موبايلك. وصّل الجهازين بنفس شبكة الواي فاي.':'Navigation, volume, touchpad and keyboard depend on TV support. Keep your phone and TV on the same Wi-Fi.',hub);
   $('integrated-remote-open').textContent=ar?'افتح الريموت واربط التلفزيون':'Open remote & pair your TV';
   text('.eyebrow',ar?'قنوات · أفلام · مسلسلات':'CHANNELS · MOVIES · SERIES',iptv);
   text('strong',ar?'IPTV على الموبايل والتلفزيون':'IPTV on your phone & TV',feature);
   text('p',ar?'كل مكتبتك، على الشاشة اللي تختارها.':'Your library, on the screen you choose.',feature);
   text('#iptv-destination-intro',ar?'اختار مكان المشاهدة. IPTV على الموبايل بيشتغل من غير تلفزيون متصل.':'Choose where to watch. Phone IPTV works without a connected TV.');
   text('#iptv-phone-open',ar?'افتح IPTV على الموبايل':'Open IPTV on phone');
   text('#iptv-tv-show',ar?'IPTV على التلفزيون':'IPTV on TV');
   text('#iptv-phone-note',ar?'على الموبايل: استخدم اشتراكك الخاص أو القنوات العامة، وشاهد مباشرة هنا. بيانات الاشتراك ومشاهدة الموبايل مستقلّة عن التلفزيون.':'On your phone: use your own subscription or public channels and watch here. Phone subscriptions and viewing progress are independent from your TV.');
   text('#iptv-public-title',ar?'قنوات IPTV العامة':'Public IPTV channels');
   text('#iptv-personal-title',ar?'اشتراك IPTV الخاص بي':'My IPTV subscription');
   text('#iptv-form-details>summary',ar?'إضافة أو تعديل اشتراك IPTV':'Add or edit IPTV subscription');
  }
  w.addEventListener('morphLanguage',paint);w.addEventListener('load',paint);paint();
 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})(window,document);
