(function(){
 'use strict';
 const $=id=>document.getElementById(id),page=$('page-connect');
 const t=(ar,en)=>window.MorphLocale?MorphLocale.t(ar,en):ar;
 const intro=page.querySelector('.intro');
 const labels=[['ابحث عن التلفزيون','Find your TV'],['اختار جهازك','Choose your device'],['جهّز الاتصال','Prepare the connection'],['ثبّت التطبيق واربطه','Install and pair']];
 const notes=[['وصّل الموبايل والتلفزيون بنفس شبكة Wi-Fi، ثم ابدأ البحث.','Connect your phone and TV to the same Wi-Fi, then search.'],['اضغط على تلفزيونك من النتائج. مش ظاهر؟ اختار نظامه واكتب عنوان التلفزيون يدويًا.','Select your TV below. Missing? Choose its system and enter the TV address manually.'],['الخطوات هنا بتتغيّر حسب نظام التلفزيون اللي اخترته.','These instructions match the TV system you selected.'],['بعد التجهيز اضغط التثبيت، واتبع النتيجة الظاهرة هنا.','After setup, press install and follow the result shown here.']];
 const flow=document.createElement('div');flow.className='connect-flow';intro.after(flow);
 const steps=labels.map((_,i)=>{const section=document.createElement('details');section.className='connect-step';section.id='connect-step-'+(i+1);section.open=i===0;section.innerHTML='<summary><span class="connect-number">'+(i+1)+'</span><span class="connect-step-title"></span><span class="connect-chevron" aria-hidden="true">⌄</span></summary><div class="connect-step-body"><p class="connect-step-note"></p></div>';flow.appendChild(section);section.addEventListener('toggle',()=>{if(section.open)steps.forEach(other=>{if(other!==section)other.open=false;});});return section;});
 const bodies=steps.map(s=>s.querySelector('.connect-step-body'));
 const guide=page.querySelector('.guide'),guideHeading=$('guide-count').parentElement;
 bodies[0].appendChild(page.querySelector('.connection-card'));
 bodies[1].appendChild($('devices'));
 const empty=document.createElement('p');empty.id='connect-results-note';empty.className='fine';bodies[1].appendChild(empty);
 bodies[1].appendChild(page.querySelector('.manual-type'));
 bodies[1].appendChild(page.querySelector('.manual'));
 const tvHelp=document.createElement('p');tvHelp.id='setup-tv-help';tvHelp.className='fine';page.querySelector('.manual').prepend(tvHelp);
 const phone=page.querySelector('.phone-ip');phone.classList.add('setup-phone-ip');
 const phoneHelp=document.createElement('p');phoneHelp.id='setup-phone-help';phone.appendChild(phoneHelp);
 bodies[2].appendChild(phone);bodies[2].appendChild(guideHeading);bodies[2].appendChild(guide);bodies[2].appendChild($('connection-state'));
 const proceed=document.createElement('button');proceed.className='primary full';proceed.id='setup-continue';bodies[2].appendChild(proceed);
 bodies[3].appendChild($('install-card'));bodies[3].appendChild($('android-pair'));
 const account=document.createElement('p');account.id='setup-account-note';account.className='setup-account-note';$('smart-install').before(account);
 const tools=document.createElement('details');tools.className='connection-extras';const toolTitle=document.createElement('summary');tools.appendChild(toolTitle);page.appendChild(tools);
 tools.appendChild($('download-center'));tools.appendChild(page.querySelector('.troubleshoot'));tools.appendChild(page.querySelector('.compatibility'));
 if($('compatibility-panel'))tools.appendChild($('compatibility-panel'));
 tools.appendChild($('platform-disclaimer'));
 function open(n,scroll){steps[n-1].open=true;steps.forEach((s,i)=>{if(i!==n-1)s.open=false;});if(scroll)steps[n-1].scrollIntoView({behavior:'smooth',block:'start'});}
 function render(){
  intro.textContent=t('٤ خطوات واضحة، من البحث لحد التثبيت. افتح أي خطوة للرجوع لها.','Four clear steps from discovery to installation. Reopen any step to review it.');
  page.querySelector('h1').textContent=t('وصّل تلفزيونك','Connect your TV');
  steps.forEach((s,i)=>{s.querySelector('.connect-step-title').textContent=t(...labels[i]);s.querySelector('.connect-step-note').textContent=t(...notes[i]);});
  const type=MorphGuide.type(),samsung=type==='samsung';phone.hidden=!samsung;
  phone.querySelector('span').textContent=t('عنوان الموبايل — اكتبه على تلفزيون Samsung','Phone address — enter this on your Samsung TV');
  phoneHelp.textContent=t('ده IP الموبايل، مش التلفزيون. في التلفزيون افتح Apps واكتب 12345، فعّل Developer Mode، واكتب الرقم ده في Host PC IP. احفظ وأعد تشغيل التلفزيون.','This is the phone IP, not the TV IP. On the TV open Apps, enter 12345, enable Developer Mode, and enter this number in Host PC IP. Save and restart the TV.');
  tvHelp.textContent=t('هنا عنوان التلفزيون نفسه من إعدادات الشبكة، مش عنوان الموبايل. اختيار نتيجة البحث بيملأه تلقائيًا.','This is the TV address from its network settings, not the phone address. Selecting a search result fills it automatically.');
  account.hidden=!samsung;account.textContent=t('حساب Samsung: زر التثبيت هيفتح تسجيل الدخول الرسمي لو الشهادة محتاجاه. سجّل دخول، وبعدها ارجع هنا؛ التجهيز هيكمل قبل إرسال التطبيق.','Samsung account: installation opens the official sign-in if your certificate needs it. Sign in and return here; preparation continues before the app is sent.');
  proceed.textContent=t('كمّلت التجهيز · انتقل للتثبيت','Setup reviewed · continue to installation');
  toolTitle.textContent=t('مساعدة وروابط تنزيل بديلة','Help and alternative downloads');
  empty.hidden=$('devices').children.length>0;empty.textContent=t('نتائج البحث هتظهر هنا. تقدر كمان تدخل الجهاز يدويًا.','Search results appear here. You can also enter the device manually.');
  const ready=$('connection-state').dataset.status==='connected';steps[2].classList.toggle('is-complete',ready);
 }
 proceed.onclick=()=>open(4,true);
 // Keep the existing transport handlers; only advance after their real state changes.
 new MutationObserver(()=>{render();if($('devices').children.length)open(2,true);}).observe($('devices'),{childList:true});
 new MutationObserver(()=>{render();const status=$('connection-state').dataset.status;if(status==='detected'||status==='connected'||status==='error')open(3,true);}).observe($('connection-state'),{attributes:true,attributeFilter:['data-status']});
 window.addEventListener('morphPlatform',()=>{render();open(3,true);});
 window.addEventListener('morphDiscovery',()=>open(2,true));
 window.addEventListener('morphLanguage',render);
 // Guide's last check needs the IP field in step 2 to be visible.
 $('guide-check').addEventListener('click',()=>{open(2,false);$('tv-ip').focus();},true);
 $('smart-install').addEventListener('click',()=>{if(MorphGuide.type()==='samsung'&&$('connection-state').dataset.status!=='connected')open(3,false);},true);
 window.MorphConnectFlow={open,render};render();
})();
