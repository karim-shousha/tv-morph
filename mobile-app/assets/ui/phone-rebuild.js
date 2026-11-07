/* Rebuilt product shell: current feature controllers remain the data/action layer. */
(function(w,d){'use strict';function init(){
 if(!w.Morph30)return;var main=d.querySelector('main'),M=w.Morph30;
 var originalShow=M.show,openingIptv=false,iptvOptions=false;
 function showIptvOptions(){return M.show('play',{iptvOptions:true});}
 function openPhoneIptv(){
  if(openingIptv)return true;
  if(!w.ClearNative||!w.MorphNative){showIptvOptions();return false;}
  openingIptv=true;
  MorphNative.call('phoneIptvOpen',{}).then(function(){openingIptv=false;},function(error){openingIptv=false;showIptvOptions();var status=d.getElementById('iptv-account-state');if(status)status.textContent=error.message||String(error);});
  return true;
 }
 M.show=function(name,options){if(name==='play'&&!(options&&options.iptvOptions))return openPhoneIptv();iptvOptions=name==='play'&&!!(options&&options.iptvOptions);return originalShow.apply(M,arguments);};

 var paths={plus:'M12 3l2.6 5.4 6 .9-4.3 4.2 1 5.9-5.3-2.8-5.3 2.8 1-5.9L3.4 9.3l6-.9z',cleaner:'M17 2 9 13M5 11l11 6-5 6-10-6zM5 19l3-5M9 21l3-5',home:'M3 10l9-7 9 7v10H15v-7H9v7H3z',play:'M3 4h18v13H3zM9 21h6M12 17v4M10 8l5 3-5 3z',remote:'M8 3h8a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM12 7h.01M8 13a4 4 0 1 0 8 0 4 4 0 0 0-8 0M12 19h.01',design:'M4 3h6v7H4zM14 3h6v7h-6zM4 14h6v7H4zM14 14h6v7h-6z',bridge:'M2 4h7v16H2zM15 5h8v11h-8zM17 20h4M19 16v4M9 12h6',prayer:'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z',tv:'M3 5h18v13H3zM9 22h6M12 18v4M8 1l4 4 4-4',more:'M5 5h4v4H5zM15 5h4v4h-4zM5 15h4v4H5zM15 15h4v4h-4z',settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1zM8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0',matches:'M8 3h8v7a4 4 0 0 1-8 0zM8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 14v6M8 21h8',share:'M3 5h18v14H3zM8 12h8M12 8l4 4-4 4'};
 function icon(key){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(paths[key]||paths.more)+'"/></svg>';}
 function ar(){return w.MorphLocale&&MorphLocale.get()==='ar';}function tr(a,b){return ar()?a:b;}
 var start=d.createElement('section');start.id='page-start';start.className='page';start.dataset.noTranslate='';start.hidden=true;
 start.innerHTML='<section class="rebuild-hero"><div class="rebuild-hero-copy"><h1></h1><p></p><div class="rebuild-hero-actions"><button type="button" class="primary" id="rebuild-current-tv"></button><button type="button" class="secondary" id="rebuild-connect"></button></div><small id="rebuild-tv-status" role="status" aria-live="polite"></small></div></section><div class="rebuild-grid"></div>';
 main.prepend(start);
 var more=d.createElement('section');more.id='page-more';more.className='page';more.hidden=true;more.dataset.noTranslate='';more.innerHTML='<div class="rebuild-page-title"><h1></h1><p></p></div><div class="rebuild-more"></div>';main.append(more);
 function native(action,fallback){if(w.ClearNative&&w.MorphNative){MorphNative.call(action,{}).catch(function(){if(fallback)fallback();});}else if(fallback)fallback();}
 function remote(){native('remoteOpen',function(){M.show('control');});}
 var entries=[
 ['tv','تثبيت Morph للتلفزيون','Install Morph on TV','اختار نسخة شاشتك وثبّتها','Choose and install your TV version','#65b9ff','#173f69',function(){M.show('devices');}],
 ['bridge','Bridge · تطبيقات APK','Bridge · APK apps','شغّل تطبيقات الموبايل على التلفزيون','Run phone apps on your TV','#16d5e6','#124a58',function(){native('bridgeOpen',function(){M.show('cast');});}],
 ['remote','الريموت','Remote','تحكّم في تلفزيونك','Control your TV','#f4ce79','#5c4123',remote],
 ['play','IPTV','IPTV','قنوات وأفلام ومسلسلات','Live TV, films & series','#1cc8ff','#123e6b',function(){M.show('play');}],
 ['design','الاستوديو','Studio','صمّم شاشة تلفزيونك','Make your TV yours','#b97aff','#3b2260',function(){M.show('design');}],
 ['prayer','عباداتي','Prayer','المواقيت والقرآن والأذكار','Prayer, Quran & adhkar','#edc072','#564029',function(){M.show('worship');}],
 ['plus','Plus','Plus','المزايا والاشتراكات','Features & subscriptions','#f4ce79','#5c4123',function(){if(w.MorphPlus)MorphPlus.open();}],
 ['cleaner','Cleaner','Cleaner','راجع الملفات والمساحة','Review files & storage','#70d7b5','#124a40',function(){native('cleanerOpen');}]
 ];
 entries.forEach(function(e){var b=d.createElement('button');b.className='rebuild-tile';b.dataset.homeFeature=e[0];b.style.setProperty('--tile-color',e[5]);b.style.setProperty('--tile-glow',e[6]);b.style.setProperty('--tile-edge',e[6]);b.innerHTML=icon(e[0])+'<span><strong></strong><small></small></span>';b.onclick=e[7];start.querySelector('.rebuild-grid').append(b);e.push(b);});
 var moreEntries=[['cleaner','Cleaner','Cleaner','راجع الملفات ونظّف المساحة','Review files & free space',function(){native('cleanerOpen');}],['play','خيارات IPTV','IPTV options','على الموبايل أو على التلفزيون','On phone or on TV',showIptvOptions],['settings','الإعدادات','Settings','اللغة والمظهر والحساب','Appearance, language & account',function(){d.querySelector('.m30-gear').click();}],['tv','الأجهزة والاتصال','Connection','ابحث عن تلفزيونك','Find your TV',function(){M.show('devices');}],['matches','المباريات','Matches','مباريات فرقك','Your teams and matches',function(){native('matchesOpen');}],['share','مشاركة الوسائط','Cast media','الملفات وروابط الفيديو','Your files and video links',function(){M.show('cast');}]];
 moreEntries.forEach(function(e){var b=d.createElement('button');b.className='rebuild-card';b.dataset.moreAction=e[0]==='play'?'iptv-options':e[0];b.innerHTML=icon(e[0])+'<span><strong></strong><small></small></span>';b.onclick=e[5];more.querySelector('.rebuild-more').append(b);e.push(b);});
 var nav=d.querySelector('.bottom-nav');nav.innerHTML='';var navEntries=[['home','home','الرئيسية','Home'],['play','play','القنوات','IPTV'],['control','remote','الريموت','Remote'],['matches','matches','المباريات','Matches'],['more','more','المزيد','More']];
 navEntries.forEach(function(e){var b=d.createElement('button');b.dataset.page=e[0];b.innerHTML='<span class="m30-nav-ic">'+icon(e[1])+'</span><span class="m30-nav-lb"></span>';b.onclick=function(){if(e[0]==='matches')native('matchesOpen');else M.show(e[0]);};nav.append(b);e.push(b);});
 d.getElementById('rebuild-connect').onclick=function(){M.show('devices');};
 var currentTV={ip:'',ready:false,busy:false,message:'',noSaved:false},currentTVButton=d.getElementById('rebuild-current-tv'),currentTVStatus=d.getElementById('rebuild-tv-status'),savedTVRequest=0;
 function paintCurrentTV(){
  currentTVStatus.dataset.connected=currentTV.ready&&!currentTV.busy?'true':'false';
  currentTVButton.disabled=currentTV.busy;currentTVButton.setAttribute('aria-busy',currentTV.busy?'true':'false');
  currentTVButton.textContent=currentTV.busy?tr('جارٍ الاتصال…','Connecting…'):currentTV.ready?tr('إعادة الاتصال','Reconnect'):tr('اتصال بالتلفزيون','Connect to TV');
  currentTVStatus.textContent=currentTV.busy?tr('جارٍ التحقق من التلفزيون المحفوظ…','Checking your saved TV…'):currentTV.ready?tr('متصل · ','Connected · ')+currentTV.ip:currentTV.message||(currentTV.ip?tr('آخر تلفزيون · ','Last TV · ')+currentTV.ip:tr('اربط تلفزيونك مرة واحدة من تثبيت نسخة التلفزيون.','Pair a TV once from Install TV version.'));
 }
 async function refreshCurrentTV(){
  if(currentTV.busy||!w.MorphNative)return;var request=++savedTVRequest;
  try{var info=await MorphNative.call('info',{});if(request!==savedTVRequest||currentTV.busy)return;var address=String(info.tvIp||'');if(address!==currentTV.ip){currentTV.ip=address;currentTV.message='';currentTV.ready=false;}currentTV.ready=!!address&&MorphNative.ready();paintCurrentTV();}catch(ignore){}
 }
 currentTVButton.onclick=async function(){
  if(currentTV.busy)return;currentTV.busy=true;currentTV.message='';paintCurrentTV();
  try{
   if(!w.reconnectMorphTV)throw new Error(tr('الاتصال متاح من تطبيق الموبايل.','Connect from the mobile app.'));
   var state=await w.reconnectMorphTV();currentTV.ip=state.ip||'';currentTV.ready=!!state.ready;
   if(!state.ready)currentTV.message=state.noSavedTV?tr('اربط تلفزيونك مرة واحدة من تثبيت نسخة التلفزيون، وبعدها اتصل من هنا.','Pair your TV once from Install TV version, then reconnect here.'):state.unsupported?tr('النظام المحفوظ لا يدعم الاتصال. اختار تلفزيونًا مدعومًا من الأجهزة.','The saved TV platform does not support this connection. Choose a supported TV in Devices.'):(state.message||tr('تعذّر الاتصال بالتلفزيون المحفوظ.','Could not reach the saved TV.'));
  }catch(error){currentTV.ready=false;currentTV.message=tr('تعذّر الاتصال بالتلفزيون الحالي. أعد المحاولة.','Could not connect to the current TV. Please retry.');}
  finally{currentTV.busy=false;paintCurrentTV();}
 };
 w.addEventListener('morphConnectionStatus',function(e){var state=e.detail||{};if(currentTV.busy||state.ip!==currentTV.ip)return;currentTV.ready=!!state.ready;if(state.ready)currentTV.message='';paintCurrentTV();});
 w.addEventListener('morphDeviceConnected',refreshCurrentTV);


 var settingsBasic=d.querySelector('#phone-settings-v2 .s310-group'),languageSelect=d.getElementById('app-language'),appearance=d.querySelector('.appearance-choice');
 var settingsLanguageLabel,settingsAppearanceLabel;
 if(settingsBasic&&languageSelect&&appearance){
   var controls=d.createElement('div');controls.className='rebuild-setting-controls';
   var lr=d.createElement('div'),arow=d.createElement('div');lr.className=arow.className='rebuild-setting-row';
   settingsLanguageLabel=d.createElement('label');settingsLanguageLabel.htmlFor='app-language';lr.append(settingsLanguageLabel,languageSelect);
   settingsAppearanceLabel=d.createElement('span');arow.append(settingsAppearanceLabel,appearance);arow.hidden=true;controls.append(lr,arow);
   var oldLanguage=settingsBasic.querySelector('.language-row');if(oldLanguage)oldLanguage.hidden=true;settingsBasic.append(controls);
 }
 // One Studio route with three explicit tasks; the existing controls own the draft.
 var studio=d.getElementById('page-studio'),editor=d.createElement('div');editor.className='rebuild-studio-editor';editor.hidden=true;
 Array.from(studio.children).forEach(function(el){editor.append(el);});studio.append(editor);
 var studioHome=d.createElement('div');studioHome.id='studio-home';studioHome.dataset.noTranslate='';studioHome.innerHTML='<div class="rebuild-page-title"><h1></h1><p></p></div><div class="rebuild-studio-menu"></div>';studio.prepend(studioHome);
 var currentCard=d.createElement('section');currentCard.id='studio-current';currentCard.dataset.noTranslate='';currentCard.innerHTML='<div class="studio-current-heading"><div><small></small><h2></h2></div><span class="studio-draft-badge"></span></div><p class="studio-current-note"></p><div class="studio-current-actions"><button type="button" class="secondary" data-studio-edit></button><button type="button" class="text-button" data-studio-read></button><button type="button" class="secondary" data-studio-pack hidden></button></div><p id="studio-apply-status" role="status" aria-live="polite"></p>';
 studio.prepend(currentCard);var preview=d.getElementById('preview');preview.hidden=false;preview.removeAttribute('aria-hidden');currentCard.querySelector('.studio-current-note').after(preview);
 var chosen=d.getElementById('selected-theme'),library=d.getElementById('theme-library'),personal=d.getElementById('personal-touch'),downloads=d.getElementById('phone-theme-packs');
 var backEditor=d.createElement('div');backEditor.className='rebuild-surface-heading';backEditor.dataset.noTranslate='';backEditor.innerHTML='<button type="button">←</button><div><h2></h2><p></p></div>';editor.prepend(backEditor);
 var panels={library:library,downloads:downloads,edit:personal},view='home',studioStack=[],applied=false;
 // Keep supplemental controls in a named section, rather than loose below every task.
 var extras=d.createElement('details');extras.id='studio-profile-settings';extras.innerHTML='<summary></summary>';personal.querySelector('.customization-content').append(extras);
 ['family-panel','phone-parental'].forEach(function(id){var el=d.getElementById(id);if(el)extras.append(el);});
 Array.from(editor.children).forEach(function(el){if(el===backEditor||el===library||el===personal||el===downloads)return;if(el.id==='m30-applybar'){studio.append(el);return;}el.hidden=true;});
 Object.keys(panels).forEach(function(key){var el=panels[key];if(!el)return;editor.append(el);el.hidden=true;el.open=true;el.classList.add('studio-task-panel');});
 function setView(name,push){if(!panels[name])name='home';if(push&&name!==view)studioStack.push(view);view=name;studio.dataset.studioView=name;editor.hidden=name==='home';studioHome.hidden=name!=='home';Object.keys(panels).forEach(function(key){if(panels[key])panels[key].hidden=key!==name;});var apply=d.getElementById('m30-applybar');if(apply)apply.hidden=d.body.dataset.mobilePage!=='page-studio';studioLabels();w.scrollTo(0,0);}
 function openEditor(name){setView(name,true);backEditor.querySelector('h2').tabIndex=-1;backEditor.querySelector('h2').focus({preventScroll:true});}
 function studioBack(){if(view==='home')return false;setView(studioStack.pop()||'home',false);return true;}
 backEditor.querySelector('button').onclick=studioBack;
 var studioEntries=[['design','اختيار ثيم','Choose a theme','تصفّح الثيمات الجاهزة','Browse themes and preview your choice','library'],['play','تنزيل الثيمات','Download themes','نزّل الحزم وأدر تحميلاتك','Available packs and downloads on your phone','downloads'],['more','تعديل الثيم','Edit your theme','صورتك وألوانك وتنسيقك','Image, position, colors and layout','edit']];
 studioEntries.forEach(function(entry){var button=d.createElement('button');button.type='button';button.className='rebuild-card';button.dataset.studioTask=entry[5];button.innerHTML=icon(entry[0])+'<span><strong></strong><small></small></span><span class="studio-task-arrow" aria-hidden="true">‹</span>';button.onclick=function(){openEditor(entry[5]);};studioHome.querySelector('.rebuild-studio-menu').append(button);entry.push(button);});
 currentCard.querySelector('[data-studio-edit]').onclick=function(){openEditor('edit');};
 currentCard.querySelector('[data-studio-read]').onclick=async function(){if(!w.MorphStudioDraft)return;try{await MorphNative.operation(tr('قراءة الثيم من التلفزيون','Read theme from TV'),function(){return MorphStudioDraft.loadFromTV();});}catch(ignore){}};currentCard.querySelector('[data-studio-pack]').onclick=function(){var pack=w.ThemePacks&&ThemePacks.forTheme(MorphStudioDraft.get().theme);if(pack&&w.downloadPhonePack)downloadPhonePack(pack.id).catch(function(){});};
 personal.querySelectorAll('.image-editor').forEach(function(el){if(!el.querySelector('input,select,button'))el.hidden=true;});personal.querySelectorAll('.advanced-subsection').forEach(function(el){if(!el.querySelector('input,select,textarea,button'))el.hidden=true;});var fonts=d.querySelector('.font-size-panel');if(fonts){fonts.hidden=false;fonts.removeAttribute('inert');fonts.removeAttribute('aria-hidden');var clock=d.getElementById('show-clock'),sizes=clock&&clock.closest('.advanced-subsection');(sizes||extras).append(fonts);}
 var editSections=personal.querySelectorAll('.advanced-subsection');editSections.forEach(function(el){el.open=false;});
 var image=d.getElementById('free-theme-image');if(image)image.open=true;
 var mode=d.createElement('label');mode.className='studio-image-mode';mode.dataset.noTranslate='';mode.innerHTML='<span></span><select id="studio-image-mode"><option value="auto"></option><option value="background"></option><option value="cutout"></option></select><small class="studio-image-help"></small>';if(image)image.querySelector('.free-image-preview').after(mode);
 mode.querySelector('select').onchange=function(){MorphStudioDraft.change({artMode:this.value});};
 function studioLabels(){
  studioHome.querySelector('h1').textContent=tr('الاستوديو','Studio');studioHome.querySelector('.rebuild-page-title p').textContent=tr('اختار، عدّل، وبعدها طبّق على التلفزيون.','Choose, customize, then apply to your TV.');
  studioEntries.forEach(function(entry){entry[6].querySelector('strong').textContent=tr(entry[1],entry[2]);entry[6].querySelector('small').textContent=tr(entry[3],entry[4]);});
  var entry=studioEntries.filter(function(item){return item[5]===view;})[0];backEditor.querySelector('h2').textContent=entry?tr(entry[1],entry[2]):'';backEditor.querySelector('p').textContent=entry?tr(entry[3],entry[4]):'';backEditor.querySelector('button').setAttribute('aria-label',tr('رجوع للخطوة السابقة','Back to the previous step'));
  currentCard.querySelector('small').textContent=tr('الثيم الحالي في الاستوديو','Current Studio theme');currentCard.querySelector('h2').textContent=chosen.textContent;currentCard.querySelector('.studio-draft-badge').textContent=applied?tr('تم التطبيق','Applied'):tr('مسودة','Draft');
  currentCard.querySelector('.studio-current-note').textContent=tr('دي معاينة تعديلاتك. اضغط تطبيق لإرسالها للتلفزيون.','Preview your changes here. Apply to send them to your TV.');currentCard.querySelector('[data-studio-edit]').textContent=tr('تعديل الثيم الحالي','Edit current theme');currentCard.querySelector('[data-studio-read]').textContent=tr('قراءة الثيم من التلفزيون','Read theme from TV');
  currentCard.querySelector('[data-studio-read]').disabled=!w.MorphNative||!MorphNative.ready();extras.querySelector('summary').textContent=tr('البروفايل والرقابة الأبوية','Profile & parental controls');
  mode.querySelector('span').textContent=tr('طريقة عرض الصورة','Image display');mode.querySelector('small').textContent=tr('الصورة المفرّغة تحتفظ بشكلها. عند تحريك خلفية كاملة، نكبّرها قليلًا لمنع الفراغات.','Cutouts keep their original layout. Full backgrounds zoom slightly while moving to prevent empty edges.');['طبيعي حسب الصورة','خلفية تملأ الشاشة','صورة مفرّغة داخل الثيم'].forEach(function(text,i){mode.querySelector('select').options[i].textContent=tr(text,['Natural image layout','Full-screen background','Cutout inside the theme'][i]);});
  if(w.MorphStudioDraft){var draft=MorphStudioDraft.get();mode.querySelector('select').value=draft.artMode||'auto';var pack=w.ThemePacks&&ThemePacks.forTheme(draft.theme),missing=pack&&!ThemePacks.status(pack.id).installed&&!draft.artImage&&!(draft.backgroundImages||[]).length;currentCard.querySelector('[data-studio-pack]').hidden=!missing;currentCard.querySelector('[data-studio-pack]').textContent=tr('تنزيل حزمة الثيم للمعاينة','Download this theme for preview');if(missing)currentCard.querySelector('.studio-current-note').textContent=tr('نزّل حزمة الثيم لإظهار صورته في المعاينة، ثم طبّقه على التلفزيون.','Download this theme pack to see its artwork here, then apply to your TV.');}
 }
 new MutationObserver(studioLabels).observe(chosen,{childList:true,subtree:true,characterData:true});
 w.addEventListener('morphStudioDraft',function(){applied=false;d.getElementById('studio-apply-status').textContent='';studioLabels();});
 w.addEventListener('morphStudioApplied',function(){applied=true;d.getElementById('studio-apply-status').textContent=tr('التلفزيون أكد تطبيق تعديلاتك.','Your TV confirmed these changes.');studioLabels();});
 w.addEventListener('morphStudioLoaded',function(){applied=true;d.getElementById('studio-apply-status').textContent=tr('تمت قراءة الثيم من التلفزيون.','Theme loaded from your TV.');studioLabels();});
 w.addEventListener('morphPacks',studioLabels);w.addEventListener('morphDeviceConnected',studioLabels);var connection=d.getElementById('connection-state');if(connection)new MutationObserver(studioLabels).observe(connection,{attributes:true,attributeFilter:['data-status']});
 w.MorphStudio={open:function(name){M.show('design');openEditor(name==='personal'?'edit':name);},back:studioBack,view:function(){return view;}};
 setView('home',false);
 function label(){paintCurrentTV();if(settingsLanguageLabel)settingsLanguageLabel.textContent=tr('اللغة','Language');if(settingsAppearanceLabel)settingsAppearanceLabel.textContent=tr('المظهر','Appearance');studioLabels();start.querySelector('.rebuild-hero').dir=ar()?'rtl':'ltr';start.querySelector('h1').innerHTML=tr('اربط موبايلك<br><em>بتلفزيونك</em>','Connect to<br><em>Your TV</em>');start.querySelector('.rebuild-hero p').textContent=tr('تحكّم وشاهد وصمّم شاشتك.','Control, watch and personalize your TV.');d.getElementById('rebuild-connect').textContent=tr('ثبّت نسخة التلفزيون ‹','Install TV version ›');entries.forEach(function(e){e[8].querySelector('strong').textContent=tr(e[1],e[2]);e[8].querySelector('small').textContent=tr(e[3],e[4]);});more.querySelector('h1').textContent=tr('المزيد','More');more.querySelector('.rebuild-page-title p').textContent=tr('إعداداتك وخدمات التطبيق','Your settings and app services');moreEntries.forEach(function(e){e[6].querySelector('strong').textContent=tr(e[1],e[2]);e[6].querySelector('small').textContent=tr(e[3],e[4]);});navEntries.forEach(function(e){e[4].querySelector('.m30-nav-lb').textContent=tr(e[2],e[3]);});}
 function route(){if(d.body.dataset.mobilePage==='page-studio'&&w.ThemePacks&&ThemePacks.loadLibrary)ThemePacks.loadLibrary();nav.hidden=false;var page=d.body.dataset.mobilePage;if(page==='page-start')refreshCurrentTV();nav.querySelectorAll('button').forEach(function(b){var on=iptvOptions&&page==='page-iptv'?b.dataset.page==='more':({home:'page-start',play:'page-iptv',control:'page-remote',design:'page-studio',more:'page-more'})[b.dataset.page]===page;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false');});var back=d.getElementById('m30-page-back');if(back)back.hidden=page==='page-start';label();}
 w.addEventListener('morphLanguage',label);w.addEventListener('morph30page',route);label();M.show('home',{replace:true});route();
 w.MorphPhoneShell={route:route,go:M.show,icon:icon,navigate:function(page){if(page==='iptv-options')showIptvOptions();else if(page==='matches')native('matchesOpen');else M.show(page);}};
}if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();})(window,document);
