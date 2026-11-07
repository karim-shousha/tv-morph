/* Presentation-only settings pages. Existing controls, profile IDs and save/connect handlers are reused. */
(function(){'use strict';
 var $=function(id){return document.getElementById(id);},dialog=document.querySelector('#settings-panel .settings-dialog');if(!dialog)return;
 var tvSettings=!/width=device-width/.test(document.querySelector('meta[name=viewport]').content);
 var current='accounts',panels={},buttons={},title=document.createElement('h3'),hint=document.createElement('p'),summary=document.createElement('p');dialog.classList.add('iptv-settings-pages');
 var shell=document.createElement('div'),nav=document.createElement('nav'),content=document.createElement('div'),foot=document.createElement('div');shell.className='iptv-settings-shell';nav.className='iptv-settings-nav';content.className='iptv-settings-content';foot.className='iptv-settings-footer';title.className='iptv-settings-page-title';hint.className='iptv-settings-page-hint';summary.id='iptv-active-source';summary.setAttribute('role','status');summary.setAttribute('data-no-translate','');dialog.querySelector('.settings-heading').appendChild(summary);
 var labels={ar:[['الحسابات والمصدر','اشتراكاتي أو القنوات المجانية. اختار المصدر ثم اضغط تشغيل.'],['إضافة حساب','اختار الطريقة المناسبة: بيانات Xtream، رابط M3U، ملف M3U، أو بوابة Stalker.'],['المشاهدة والصوت','لغة التطبيق، مقاس الفيديو وحفظ موضع المشاهدة.'],['المكتبة والترتيب','حجم الكروت، ترتيب العناوين وتحديث بيانات المكتبة.'],['الرقابة الأبوية · Plus','قفل المحتوى، المؤقّتات وإدارة العناصر المخفية من مكان واحد.']],en:[['Accounts & source','Choose a saved subscription or free channels, then press Open.'],['Add an account','Choose Xtream credentials, an M3U link, an M3U file, or a Stalker portal.'],['Playback','App language, video size and remembered playback position.'],['Library & sorting','Card size, title order and library updates.'],['Parent Control · Plus','Content locks, timers and hidden items in one place.']]};
 labels.ar.push(['اختبار السرعة وVPN','اختبار سرعة الاتصال وإدارة إعدادات VPN.']);labels.en.push(['Speed Test & VPN','Connection speed test and VPN profiles.']);
 labels.fr=[['Comptes et sources','Choisissez un abonnement enregistré ou les chaînes gratuites, puis ouvrez la source.'],['Ajouter un compte','Identifiants Xtream, lien ou fichier M3U, ou portail Stalker.'],['Lecture et affichage','Langue, format vidéo et reprise de la lecture.'],['Bibliothèque et classement','Taille du texte et des affiches, classement et actualisation du catalogue.'],['Contrôle parental · Plus','Verrouillage du contenu, limites de temps et éléments masqués.'],['Connexion et VPN','Mesurez votre connexion et gérez vos profils VPN.']];
 if(tvSettings){var networkLabels={ar:['اختبار السرعة','سرعة التنزيل والرفع، الاستجابة ومعلومات الاتصال.'],en:['Speed test','Download, upload, latency and connection information.'],fr:['Test de débit','Débit, latence et informations de connexion.']},vpnLabels={ar:['VPN','إدارة ملفات اتصال WireGuard.'],en:['VPN','Manage your WireGuard connection profiles.'],fr:['VPN','Gérez vos profils de connexion WireGuard.']};['ar','en','fr'].forEach(function(lang){labels[lang][4][0]=labels[lang][4][0].replace(' · Plus','');labels[lang][5]=networkLabels[lang];labels[lang].push(vpnLabels[lang]);});}
 var keys=['accounts','add','playback','library','parental','network'];if(tvSettings)keys.push('vpn');keys.forEach(function(key){var tab=document.createElement('button');tab.type='button';tab.id='iptv-settings-tab-'+key;tab.setAttribute('data-no-translate','');tab.onclick=function(){open(key);};nav.appendChild(tab);buttons[key]=tab;var area=document.createElement('section');area.className='iptv-settings-page';area.id='iptv-settings-page-'+key;area.hidden=true;content.appendChild(area);panels[key]=area;});
 shell.appendChild(nav);shell.appendChild(content);dialog.appendChild(shell);
 function move(id,target){var node=$(id);if(node)target.appendChild(node);}
 var cards=document.createElement('div'),mine=document.createElement('article'),free=document.createElement('article'),mineTitle=document.createElement('h4'),freeTitle=document.createElement('h4');cards.className='iptv-source-cards';mine.className=free.className='iptv-source-card';mine.appendChild(mineTitle);free.appendChild(freeTitle);cards.appendChild(mine);cards.appendChild(free);panels.accounts.appendChild(cards);move('iptv-saved-accounts',mine);['account-public-source','account-public','account-source-note'].forEach(function(id){var node=$(id);if(id==='account-public-source'&&node&&node.previousElementSibling&&node.previousElementSibling.tagName==='LABEL')free.appendChild(node.previousElementSibling);move(id,free);});
 ['home-account','home-refresh'].forEach(function(id){var node=$(id);if(node){panels[id==='home-account'?'accounts':'library'].appendChild(node);node.hidden=id==='home-account';}});
 var add=$('account-open');panels.accounts.appendChild(add);add.onclick=function(){open('add');};move('account-panel',panels.add);$('account-panel').hidden=false;
 var groups=dialog.querySelectorAll('.settings-grid .setting-group');if(groups[0])panels.playback.appendChild(groups[0]);if(groups[1])panels.library.appendChild(groups[1]);move('clear-progress',panels.library);var oldGrid=dialog.querySelector('.settings-grid');if(oldGrid)oldGrid.remove();content.insertBefore(hint,content.firstChild);content.insertBefore(title,content.firstChild);shell.appendChild(nav);shell.appendChild(content);dialog.appendChild(shell);['settings-save','settings-close','settings-status'].forEach(function(id){move(id,foot);});dialog.appendChild(foot);
 var identity=document.createElement('div');identity.className='iptv-settings-identity';var logo=document.createElement('img');logo.src='morph-iptv-wordmark.webp';logo.alt='Morph IPTV';identity.appendChild(logo);nav.insertBefore(identity,nav.firstChild);var hero=document.createElement('div');hero.className='iptv-settings-hero';hero.appendChild(title);hero.appendChild(hint);content.insertBefore(hero,content.firstChild);var heading=dialog.querySelector('.settings-heading h2');if(heading){heading.textContent='IPTV settings';heading.setAttribute('data-no-translate','');}var close=$('settings-close');close.setAttribute('aria-label',tr('إغلاق الإعدادات','Close settings'));close.title=close.getAttribute('aria-label');close.textContent='×';close.classList.add('iptv-settings-dismiss');dialog.appendChild(close);
 var sourceSelect=$('account-type'),sourceChoices=document.createElement('div'),sourceButtons={};sourceChoices.className='iptv-source-methods';sourceChoices.setAttribute('role','group');sourceSelect.before(sourceChoices);sourceSelect.hidden=true;sourceSelect.tabIndex=-1;var sourceLabel=document.querySelector('label[for="account-type"]');if(sourceLabel)sourceLabel.hidden=true;
 ['xtream','m3u','portal'].forEach(function(type){var button=document.createElement('button');button.type='button';button.id='account-method-'+type;button.setAttribute('data-no-translate','');button.onclick=function(){sourceSelect.value=type;sourceSelect.dispatchEvent(new Event('change',{bubbles:true}));syncMethods();};sourceButtons[type]=button;sourceChoices.appendChild(button);});
 var fileButton=document.createElement('button');fileButton.type='button';fileButton.id='account-method-file';fileButton.setAttribute('data-no-translate','');fileButton.onclick=function(){sourceSelect.value='m3u';sourceSelect.dispatchEvent(new Event('change',{bubbles:true}));syncMethods();var choose=$('account-import-file');if(choose){choose.focus();choose.click();}else $('account-status').textContent=tr('اختيار الملف متاح على جهاز التلفزيون. استخدم رابط M3U هنا أو افتح الإعدادات من التلفزيون.','File selection is available on the TV. Use an M3U URL here or open settings on the TV.');};sourceButtons.file=fileButton;sourceChoices.appendChild(fileButton);
 function syncMethods(){var names={xtream:tr('Xtream: سيرفر + مستخدم + كلمة سر','Xtream: server + username + password'),m3u:tr('رابط M3U','M3U link'),file:tr('ملف M3U من الجهاز','M3U file from device'),portal:tr('بوابة Stalker + MAC','Stalker portal + MAC')};Object.keys(sourceButtons).forEach(function(type){sourceButtons[type].textContent=names[type];sourceButtons[type].setAttribute('aria-pressed',String(type==='file'?false:sourceSelect.value===type));});Array.prototype.forEach.call(document.querySelectorAll('.account-keyboard-open'),function(button){var field=$(button.getAttribute('data-field'));if(field)button.hidden=field.hidden;});}
 sourceSelect.addEventListener('change',syncMethods);
 function tr(ar,en){return window.MorphLocale?MorphLocale.t(ar,en):en;}
 function featureLabel(label){var p;try{p=(window.parent!==window&&window.parent.MorphPlus&&window.parent.MorphPlus.isActive()?window.parent.MorphPlus:window.MorphPlus||window.parent.MorphPlus);}catch(ignore){}return p&&p.isActive()?label.replace(/ · Plus$/,''):label;}window.addEventListener('morphPlus',refresh);try{if(window.parent!==window)window.parent.addEventListener('morphPlus',refresh);}catch(ignore){}
 function refresh(){dialog.setAttribute('data-settings-section',current);syncMethods();var text=labels[MorphLocale.get()]||labels.en;keys.forEach(function(key,index){buttons[key].textContent=featureLabel(text[index][0]);if(index<keys.length-1){var divider=document.createElement('span');divider.className='settings-menu-divider';divider.setAttribute('aria-hidden','true');buttons[key].appendChild(divider);}buttons[key].setAttribute('data-section',key);buttons[key].setAttribute('aria-current',current===key?'page':'false');panels[key].hidden=current!==key;});var index=keys.indexOf(current);title.textContent=featureLabel(text[index][0]);hint.textContent=text[index][1];mineTitle.textContent=tr('اشتراكاتي المحفوظة','My saved subscriptions');freeTitle.textContent=tr('قنوات مجانية','Free channels');var state=window.IptvTvBridge&&IptvTvBridge.settingsState(),info=state&&state.info||{};if((info.accounts||[]).filter(function(a){return !a.publicMode;}).length>=2)buttons.add.setAttribute('data-plus-feature','');else buttons.add.removeAttribute('data-plus-feature');summary.textContent=info.configured?tr('المصدر الحالي: ','Current source: ')+(info.publicMode?tr('مجاني — ','Free — '):'')+(info.name||tr('اشتراكي','My subscription')):tr('لم تختَر مصدرًا بعد. أضف اشتراكك أو افتح القنوات المجانية.','No source selected yet. Add a subscription or open free channels.');mine.classList.toggle('source-current',!!info.configured&&!info.publicMode);free.classList.toggle('source-current',!!info.publicMode);$('settings-save').hidden=current==='accounts'||current==='add'||current==='parental'||current==='network'||current==='vpn';}
 function open(key,focusOnly,preserveEdit){if(keys.indexOf(key)<0)return;if(key==='add'&&!preserveEdit&&window.IptvTvBridge&&IptvTvBridge.resetAccountEdit)IptvTvBridge.resetAccountEdit();if(key==='parental'&&!tvSettings&&!focusOnly&&window.IptvParental){window.IptvParental.settings();return;}if(document.querySelector('.iptv-parental-embedded')&&window.IptvParental)IptvParental.back();current=key;refresh();content.scrollTop=0;buttons[key].focus();var event=document.createEvent('Event');event.initEvent('morphIptvSettingsSection',false,false);event.detail={key:key};window.dispatchEvent(event);}
 function focusControl(node){if(node){node.focus();node.scrollIntoView({block:'nearest',inline:'nearest'});}return true;}
 var lastControls={},selectPopup=null,selectReturn=null;
 function visibleControl(node){return !!(node&&!node.disabled&&!node.closest('[hidden]')&&node.offsetWidth&&node.offsetHeight);}
 function controls(){return Array.prototype.filter.call(panels[current].querySelectorAll('button,input,select'),visibleControl);}
 function closeSelect(){if(!selectPopup)return false;selectPopup.remove();selectPopup=null;var origin=selectReturn;selectReturn=null;if(origin)origin.setAttribute('aria-expanded','false');focusControl(origin);return true;}
 function placeInlineSelect(){if(!selectPopup||!selectPopup.classList.contains('iptv-inline-select')||!selectReturn)return;var r=selectReturn.getBoundingClientRect(),b=dialog.getBoundingClientRect(),width=Math.min(Math.max(280,r.width),b.width-24,innerWidth-24),left=Math.max(b.left+12,Math.min(r.left,b.right-width-12)),below=Math.min(b.bottom-12,innerHeight-12)-r.bottom-5,above=r.top-Math.max(b.top+12,12)-5,up=below<220&&above>below,height=Math.max(80,Math.min(400,up?above:below));selectPopup.style.width=width+'px';selectPopup.style.left=left+'px';selectPopup.style.maxHeight=height+'px';selectPopup.style.top=(up?r.top-Math.min(selectPopup.scrollHeight,height)-5:r.bottom+5)+'px';}
 function inlineSelect(node){closeSelect();selectReturn=node;selectPopup=document.createElement('div');selectPopup.id='iptv-settings-select';selectPopup.className='iptv-inline-select';selectPopup.setAttribute('role','listbox');var label=dialog.querySelector('label[for="'+node.id+'"]');selectPopup.setAttribute('aria-label',label?label.textContent:tr('اختار','Choose'));node.setAttribute('aria-expanded','true');Array.prototype.forEach.call(node.options,function(option){if(option.disabled)return;var button=document.createElement('button');button.type='button';button.textContent=option.text;button.dataset.value=option.value;button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.selected));button.onclick=function(){node.value=option.value;node.dispatchEvent(new Event('change',{bubbles:true}));closeSelect();};selectPopup.appendChild(button);});document.body.appendChild(selectPopup);placeInlineSelect();focusControl(selectPopup.querySelector('[aria-selected=true]')||selectPopup.querySelector('button'));requestAnimationFrame(placeInlineSelect);return true;}
 window.addEventListener('resize',placeInlineSelect);document.addEventListener('pointerdown',function(e){if(selectPopup&&selectPopup.classList.contains('iptv-inline-select')&&!selectPopup.contains(e.target)&&e.target!==selectReturn)closeSelect();},true);dialog.addEventListener('mousedown',function(e){if(e.target.tagName==='SELECT'&&!/width=device-width/.test(document.querySelector('meta[name=viewport]').content)){e.preventDefault();inlineSelect(e.target);}});
 function activate(node){if($('settings-panel').hidden||!node||!dialog.contains(node))return false;if(node.tagName==='INPUT'&&(node.type==='checkbox'||node.type==='radio')){node.click();return true;}if(node.tagName!=='SELECT')return false;if(!/width=device-width/.test(document.querySelector('meta[name=viewport]').content))return inlineSelect(node);if(selectPopup)closeSelect();selectReturn=node;selectPopup=document.createElement('div');selectPopup.id='iptv-settings-select';selectPopup.className='settings-overlay';selectPopup.setAttribute('role','dialog');selectPopup.setAttribute('aria-modal','true');var panel=document.createElement('section');panel.className='settings-dialog';var h=document.createElement('h3'),label=dialog.querySelector('label[for="'+node.id+'"]');h.textContent=label?label.textContent:tr('اختار','Choose');panel.appendChild(h);Array.prototype.forEach.call(node.options,function(option){if(option.disabled)return;var b=document.createElement('button');b.type='button';b.textContent=(option.selected?'✓ ':'')+option.text;b.dataset.value=option.value;b.onclick=function(){node.value=option.value;node.dispatchEvent(new Event('change',{bubbles:true}));closeSelect();};panel.appendChild(b);});selectPopup.appendChild(panel);document.body.appendChild(selectPopup);var selected=Array.prototype.filter.call(panel.querySelectorAll('button'),function(b){return b.dataset.value===node.value;})[0];focusControl(selected||panel.querySelector('button'));return true;}
 function navigate(code){if($('settings-panel').hidden||code<37||code>40)return false;if(document.querySelector('.home-order-overlay')||window.IptvAccountKeyboard&&IptvAccountKeyboard.isOpen())return false;var active=document.activeElement;
  if(selectPopup){var options=Array.prototype.slice.call(selectPopup.querySelectorAll('button')),option=options.indexOf(active);if(code===38||code===40)focusControl(options[Math.max(0,Math.min(options.length-1,option+(code===40?1:-1)))]);return true;}
  var pageControls=controls(),tabs=keys.map(function(k){return buttons[k];}),tabIndex=tabs.indexOf(active),towardContent=nav.getBoundingClientRect().left<content.getBoundingClientRect().left?39:37,towardNav=towardContent===39?37:39,save=$('settings-save'),dismiss=$('settings-close');
  if(tabIndex>=0){if(code===38){if(tabIndex>0)open(keys[tabIndex-1],true);else focusControl(dismiss);}else if(code===40){if(tabIndex<keys.length-1)open(keys[tabIndex+1],true);else focusControl(visibleControl(save)?save:dismiss);}else if(code===towardContent)focusControl(visibleControl(lastControls[current])?lastControls[current]:pageControls[0]||active);return true;}
  if(active===dismiss){if(code===40||code===towardNav)focusControl(buttons[current]);else if(code===38)focusControl(visibleControl(save)?save:buttons[current]);return true;}
  if(active===save){if(code===38)focusControl(visibleControl(lastControls[current])?lastControls[current]:pageControls[pageControls.length-1]||buttons[current]);else if(code===towardNav)focusControl(buttons[current]);else if(code===towardContent||code===40)focusControl(dismiss);return true;}
  if(pageControls.indexOf(active)<0)return focusControl(buttons[current]);lastControls[current]=active;
  var rect=active.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2,best=null,score=Infinity;pageControls.forEach(function(node){if(node===active)return;var r=node.getBoundingClientRect(),dx=r.left+r.width/2-x,dy=r.top+r.height/2-y,horizontal=code===37||code===39;if(code===37&&dx>=-4||code===39&&dx<=4||code===38&&dy>=-4||code===40&&dy<=4)return;if(horizontal&&Math.abs(dy)>Math.max(rect.height,r.height)*.75)return;var cross=horizontal?Math.max(0,rect.top-r.bottom,r.top-rect.bottom):Math.max(0,rect.left-r.right,r.left-rect.right),distance=Math.abs(horizontal?dx:dy)+cross*2.5;if(distance<score){score=distance;best=node;}});
  if(best){lastControls[current]=best;return focusControl(best);}if(code===towardNav||code===38)return focusControl(buttons[current]);if(code===40&&visibleControl(save))return focusControl(save);return true;
 }
 window.IptvSettingsPages={open:open,move:navigate,activate:activate,refresh:refresh,reset:function(){closeSelect();current='accounts';lastControls={};},back:function(){return closeSelect();}};
 document.addEventListener('keydown',function(event){if($('settings-panel').hidden)return;if(document.querySelector('.home-order-overlay')||window.IptvAccountKeyboard&&IptvAccountKeyboard.isOpen())return;if(selectPopup&&[4,27,461,10009].indexOf(event.keyCode)>=0){event.preventDefault();event.stopImmediatePropagation();closeSelect();return;}if(event.keyCode===13&&!selectPopup&&activate(document.activeElement)){event.preventDefault();event.stopImmediatePropagation();return;}if(event.keyCode>=37&&event.keyCode<=40&&navigate(event.keyCode)){event.preventDefault();event.stopImmediatePropagation();}},true);
 window.addEventListener('morphLanguage',refresh);refresh();
if(window.IptvNative&&typeof IptvNative.subscriptionQr==='function'&&typeof IptvNative.supportsSubscriptionQr==='function'&&IptvNative.supportsSubscriptionQr()){var qr=document.createElement('button');qr.id='iptv-subscription-qr';qr.setAttribute('data-no-translate','');qr.textContent=window.MorphLocale?MorphLocale.t('إضافة الاشتراك من الموبايل · QR','Add subscription from phone · QR'):'Add subscription · QR';qr.onclick=function(){IptvNative.subscriptionQr();};panels.add.insertBefore(qr,panels.add.firstChild);}

 if(window.MorphProductUpdates&&MorphProductUpdates.supported()){var updateApp=document.createElement('button');updateApp.id='iptv-app-update';updateApp.textContent=tr('تحديث التطبيق','Update application');updateApp.onclick=function(){MorphProductUpdates.run();};panels.library.appendChild(updateApp);}
 var homeOrderButton=document.createElement('button');homeOrderButton.id='iptv-home-order';homeOrderButton.textContent=tr('ترتيب أقسام الرئيسية','Arrange home sections');homeOrderButton.onclick=function(){if(window.IptvHomeOrder)IptvHomeOrder.open();};panels.library.appendChild(homeOrderButton);
 var orderDefaults=['stream-continue','stream-featured','stream-most-popular','stream-popular','stream-series','stream-live'],orderNames=[['استكمال المشاهدة','Continue Watching'],['التريند الآن','Trending Now'],['الأكثر شعبية','Most Popular'],['أحدث الأفلام','Recent Movies'],['مسلسلات تُعرض الآن','Series Airing Now'],['الرياضة المباشرة','Live Sports']];
 function orderKey(){var state=window.IptvTvBridge&&IptvTvBridge.homeData(),info=state&&state.info||{};return 'tvmorph.home.order.v1.'+String(info.publicMode?'free.'+(info.publicSource||'default'):info.profileId||info.id||'default');}
 function savedOrder(){try{var ids=JSON.parse(localStorage.getItem(orderKey())||'[]');return ids.filter(function(id,i){return orderDefaults.indexOf(id)>=0&&ids.indexOf(id)===i;}).concat(orderDefaults.filter(function(id){return ids.indexOf(id)<0;}));}catch(e){return orderDefaults.slice();}}
 function applyOrder(){var box=$('stream-rows');if(box)savedOrder().forEach(function(id){var row=$(id);if(row&&row.parentNode===box)box.appendChild(row);});}
 var orderOverlay=null,orderDraft=[],orderReturn=null;
 function closeOrder(){if(orderOverlay)orderOverlay.remove();orderOverlay=null;if(orderReturn&&orderReturn.isConnected)orderReturn.focus();}
 function paintOrder(selected){var list=orderOverlay.querySelector('.home-order-list');list.textContent='';orderDraft.forEach(function(id,index){var row=document.createElement('button');row.dataset.orderIndex=String(index);row.textContent=(index+1)+'. '+tr.apply(null,orderNames[orderDefaults.indexOf(id)]);row.onclick=function(){shiftOrder(index,-1);};list.appendChild(row);});if(selected!=null)list.children[selected].focus();}
 function shiftOrder(index,delta){var next=index+delta;if(next<0||next>=orderDraft.length)return;var value=orderDraft[index];orderDraft[index]=orderDraft[next];orderDraft[next]=value;paintOrder(next);}
 function openOrder(){if(orderOverlay)return;orderReturn=document.activeElement;orderDraft=savedOrder();orderOverlay=document.createElement('div');orderOverlay.className='settings-overlay home-order-overlay';orderOverlay.setAttribute('role','dialog');orderOverlay.setAttribute('aria-modal','true');var panel=document.createElement('section');panel.className='settings-dialog';var h=document.createElement('h2');h.textContent=tr('ترتيب أقسام الرئيسية','Arrange home sections');var help=document.createElement('p');help.textContent=tr('فوق وتحت للاختيار · يسار للتحريك لأعلى · يمين لأسفل · رجوع للإلغاء','Up/Down: select · Left: move up · Right: move down · Back: Cancel');var list=document.createElement('div');list.className='home-order-list';panel.appendChild(h);panel.appendChild(help);panel.appendChild(list);[['save','حفظ','Save'],['reset','الترتيب الافتراضي','Reset order'],['cancel','إلغاء','Cancel']].forEach(function(row){var b=document.createElement('button');b.dataset.homeOrderAction=row[0];b.textContent=tr(row[1],row[2]);b.onclick=function(){if(row[0]==='reset'){orderDraft=orderDefaults.slice();paintOrder(0);return;}if(row[0]==='save'){try{localStorage.setItem(orderKey(),JSON.stringify(orderDraft));applyOrder();}catch(e){help.textContent=tr('تعذّر حفظ الترتيب.','Could not save order.');return;}}closeOrder();};panel.appendChild(b);});orderOverlay.appendChild(panel);document.body.appendChild(orderOverlay);paintOrder(0);}
 window.addEventListener('keydown',function(e){if(!orderOverlay)return;var active=document.activeElement,code=e.keyCode,buttons=Array.prototype.slice.call(orderOverlay.querySelectorAll('button')),index=buttons.indexOf(active);if([4,27,461,10009].indexOf(code)>=0){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)closeOrder();return;}if(code>=37&&code<=40){e.preventDefault();e.stopImmediatePropagation();if((code===37||code===39)&&active.hasAttribute('data-order-index'))shiftOrder(Number(active.dataset.orderIndex),code===37?-1:1);else if(code===38||code===40)buttons[Math.max(0,Math.min(buttons.length-1,index+(code===40?1:-1)))].focus();}},true);
 window.IptvHomeOrder={open:openOrder,apply:applyOrder,back:function(){if(!orderOverlay)return false;closeOrder();return true;}};
})();
/* Active Account hero + Saved Accounts rows. Presentation only: switching,
   persistence, credentials and provider settings stay in app.js / native store. */
(function(){'use strict';
var FLAG='tvmorph.iptv.returnAccounts',busy=false,built=false;
function tr(ar,en){if(window.MorphLocale&&MorphLocale.t)return MorphLocale.t(ar,en);return en;}
function $(id){return document.getElementById(id);}
function bridge(){return window.IptvTvBridge;}
function state(){try{var b=bridge();return b&&b.settingsState?b.settingsState():null;}catch(e){return null;}}
function typeLabel(type){type=String(type||'').toLowerCase();if(type==='m3u')return 'M3U';if(type==='portal')return 'Stalker';return 'Xtream';}
function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
function subState(sub){sub=sub||{};var raw=String(sub.status||'').trim().toLowerCase(),exp=Number(sub.expires)||0;if(exp>1e11)exp/=1000;var expired=exp>0&&exp<=Date.now()/1000;return{raw:raw,exp:exp,expired:expired,active:raw==='active'&&!expired};}
function validityWord(st){if(!st.raw)return '';if(st.active)return tr('صالحة','Valid');if(st.expired||st.raw==='expired')return tr('منتهية','Expired');return tr('غير نشطة','Inactive');}
function expiryWord(exp){try{return new Date(exp*1000).toLocaleDateString();}catch(e){return '';}}
function build(){
 if(built)return true;
 var saved=$('iptv-saved-accounts');if(!saved||!saved.parentNode)return false;
 var select=$('account-saved-select'),label=saved.querySelector('label[for="account-saved-select"]'),badge=$('account-active-status'),restore=$('account-restore-personal'),info=$('account-subscription-info'),refresh=$('account-info-refresh');
 var hero=el('section');hero.id='iptv-active-account';hero.setAttribute('aria-label',tr('الحساب النشط','Active Account'));
 hero.appendChild(el('p','iptv-eyebrow',tr('الحساب النشط','Active Account')));
 var top=el('div','iptv-active-top'),name=el('h4','iptv-active-name');name.id='iptv-active-name';name.dir='auto';
 var active=el('span','iptv-active-badge',tr('نشط','ACTIVE'));active.id='iptv-active-badge';active.setAttribute('role','status');
 top.appendChild(name);top.appendChild(active);hero.appendChild(top);
 var provider=el('p','iptv-active-provider');provider.id='iptv-active-provider';hero.appendChild(provider);
 var validity=el('p','iptv-active-validity');validity.id='iptv-active-validity';validity.hidden=true;hero.appendChild(validity);
 var expiry=el('p','iptv-active-expiry');expiry.id='iptv-active-expiry';expiry.hidden=true;hero.appendChild(expiry);
 if(info&&info.parentNode!==hero)hero.appendChild(info);
 var actions=el('div','iptv-active-actions');
 var manage=el('button','iptv-active-manage',tr('إدارة الحساب','Manage'));manage.id='iptv-active-manage';manage.type='button';
 manage.onclick=function(){var st=state(),id=st&&st.info&&st.info.profileId,b=bridge();if(!b||!b.editAccount)return;if(!id||st.info.publicMode){IptvSettingsPages.open('add');var field=$('account-server');if(field)field.focus();return;}b.editAccount(id).catch(function(err){if(b.notice)b.notice(err.message||String(err),'error');});};
 actions.appendChild(manage);
 if(refresh&&refresh.parentNode!==actions)actions.appendChild(refresh);
 hero.appendChild(actions);
 saved.parentNode.insertBefore(hero,saved);
 var list=el('div');list.id='iptv-saved-list';
 list.appendChild(el('h4','iptv-saved-heading',tr('الحسابات المحفوظة','Saved Accounts')));
 var rows=el('div');rows.id='iptv-saved-rows';list.appendChild(rows);
 saved.parentNode.insertBefore(list,saved.nextSibling);
 var remove=$('account-remove-selected');if(remove)remove.hidden=true;if(select)select.hidden=true;if(label)label.hidden=true;if(badge)badge.hidden=true;if(restore)restore.hidden=true;
 built=true;return true;
}
function setBusy(on){busy=on;var rows=$('iptv-saved-rows');if(rows)Array.prototype.forEach.call(rows.querySelectorAll('button'),function(b){b.disabled=on;});var m=$('iptv-active-manage');if(m)m.disabled=on;}
function switchTo(id,btn){
 var b=bridge();if(!b||!b.switchSavedSource||busy||!id)return;
 setBusy(true);
 try{sessionStorage.setItem(FLAG,id);}catch(e){}
 b.switchSavedSource(id,false).then(function(){/* native reloads on success */}).catch(function(err){
  try{sessionStorage.removeItem(FLAG);}catch(e){}
  setBusy(false);
  var message=err&&(err.message||err)||tr('تعذر التبديل إلى الحساب المحدد.','Could not switch to the selected account.');
  if(b.notice){try{b.notice(message,'error');}catch(e){}}
  var status=$('settings-status');if(status)status.textContent=message;
  if(btn&&btn.isConnected)btn.focus();
 });
}
function render(){
 if(!build())return;
 var st=state(),info=st&&st.info||{},accounts=st&&st.accounts||[];
 var name=$('iptv-active-name'),badge=$('iptv-active-badge'),provider=$('iptv-active-provider'),validity=$('iptv-active-validity'),expiryEl=$('iptv-active-expiry'),manage=$('iptv-active-manage');
 var configured=!!info.configured;$('iptv-saved-list').hidden=!accounts.length;
 if(!configured){
  name.textContent=tr('لا يوجد حساب محدد','No account selected');
  badge.hidden=true;provider.textContent=tr('أضف اشتراكك أو افتح القنوات المجانية.','Add a subscription or open free channels.');
  validity.hidden=true;expiryEl.hidden=true;
  manage.textContent=tr('إضافة حساب','Add account');
 }else{
  name.textContent=info.publicMode?(info.name||tr('القنوات المجانية','Free channels')):(info.name||tr('اشتراكي','My subscription'));
  badge.hidden=false;badge.textContent=tr('نشط','ACTIVE');
  provider.textContent=info.publicMode?tr('قنوات مجانية','Free channels'):typeLabel(info.type);
  var sub=subState(info.subscription),word=validityWord(sub);
  if(word){validity.hidden=false;validity.textContent='';var pill=el('span','iptv-validity iptv-validity-'+(sub.active?'ok':(sub.expired||sub.raw==='expired')?'bad':'warn'),word);validity.appendChild(pill);}
  else validity.hidden=true;
  if(!info.publicMode&&sub.exp>0){expiryEl.hidden=false;expiryEl.textContent=tr('تنتهي في: ','Expires: ')+expiryWord(sub.exp);}
  else expiryEl.hidden=true;
  manage.textContent=tr('إدارة الحساب','Manage');
 }
 var box=$('iptv-saved-rows');if(!box)return;box.textContent='';
 if(!accounts.length){
  var empty=el('p','iptv-saved-empty',configured&&info.publicMode?tr('اشتراكك الشخصي محفوظ. بدّل إليه من زر الاشتراك.','Your personal subscription is saved. Switch back to it from the subscription button.'):tr('لا توجد حسابات محفوظة بعد.','No saved accounts yet.'));
  box.appendChild(empty);return;
 }
 accounts.forEach(function(row){
  var wrap=el('div','iptv-account-row'+(row.active?' is-active':''));
  var main=el('button','iptv-account-main');main.type='button';main.setAttribute('data-account-id',row.id);
  if(row.active)main.setAttribute('aria-current','true');
  var copy=el('span','iptv-account-copy'),nm=el('strong','iptv-account-name',row.name||tr('اشتراكي','My subscription'));nm.dir='auto';
  var meta=el('small','iptv-account-type',typeLabel(row.type));
  copy.appendChild(nm);copy.appendChild(meta);main.appendChild(copy);
  var act=el('span','iptv-account-state',row.active?tr('✓ نشط','✓ ACTIVE'):tr('○ تبديل','○ Switch'));
  main.appendChild(act);
  main.onclick=function(){if(!row.active)switchTo(row.id,main);};
  if(row.active)main.disabled=false;
  wrap.appendChild(main);
  var remove=el('button','iptv-account-remove',tr('حذف','Delete'));remove.type='button';remove.setAttribute('data-remove-account-id',row.id);remove.setAttribute('aria-label',tr('حذف الحساب: ','Delete account: ')+(row.name||row.id));remove.onclick=function(){var b=bridge();if(b&&b.confirmRemoveAccount)b.confirmRemoveAccount(row.id,remove);};wrap.appendChild(remove);box.appendChild(wrap);
 });
}
function bootReturn(){
 var id=null;try{id=sessionStorage.getItem(FLAG);sessionStorage.removeItem(FLAG);}catch(e){}
 if(!id)return;
 setTimeout(function(){
  try{
   if(window.IptvUI&&IptvUI.settings)Promise.resolve(window.IptvUI.settings(sessionStorage.getItem('morph.iptv.settingsOrigin')==='launcher')).catch(function(){}).then(function(){
    if(window.IptvSettingsPages)IptvSettingsPages.open('accounts');
    render();
    var btn=document.querySelector('#iptv-saved-rows [data-account-id="'+id+'"]')||document.querySelector('#iptv-saved-rows [aria-current="true"]');
    if(btn)btn.focus();
   });
  }catch(e){}
 },900);
}
var saved=$('iptv-saved-accounts');
if(saved)new MutationObserver(function(){render();}).observe(saved,{childList:true,subtree:true,characterData:true});
window.addEventListener('morphLanguage',render);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){render();bootReturn();});
else{render();bootReturn();}
window.IptvAccountRedesign={render:render};
})();
