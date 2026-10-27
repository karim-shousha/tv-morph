/* Same views and launch handlers in both modes. No second navigation system. */
(function(w){'use strict';
 var C=w.ClearTV,body=document.body,button,search,queued=false,failed=false;
 function t(ar,en){return w.MorphLocale?MorphLocale.t(ar,en):en;}
 function get(){if(failed)return 'classic';return C.settings.uiMode==='modern'?'modern':'classic';}
 function paint(){if(button){button.textContent=t('وضع الواجهة','UI mode')+' · '+(get()==='modern'?t('حديث','Modern'):t('كلاسيكي','Classic'));button.setAttribute('aria-label',button.textContent);}if(search){var label=t('البحث في التطبيقات','Search apps');search.title=label;search.setAttribute('aria-label',label);}}
 function home(){return !!document.getElementById('view-home')&&!document.getElementById('view-home').hidden;}
 function decorateSidebar(){
  var names={'home-fitness':'fitness','open-prayer':'prayer','home-inputs':'inputs','home-store':'store','home-internet':'internet','home-appearance':'appearance','home-help':'help'};
  Object.keys(names).forEach(function(id){var node=document.getElementById(id);if(!node||!w.MorphIcons)return;if(node.querySelector('.ui-sidebar-icon svg'))return;var previous=node.querySelector('.ui-sidebar-icon');if(previous)previous.remove();var icon=C.el('i','ui-icon ui-sidebar-icon');icon.setAttribute('data-no-translate','');icon.hidden=true;icon.setAttribute('aria-hidden','true');icon.innerHTML=MorphIcons.svg(names[id]);node.classList.add('ui-has-icon');node.insertBefore(icon,node.firstChild);});
 }
 function fitHero(){
  if(body.getAttribute('data-ui-mode')!=='modern'||!home())return;
  var lang=w.MorphLocale?MorphLocale.get():'en',preset=C.settings[lang==='ar'?'fontSizeAr':'fontSizeEn'],factor=1;
  var custom=Math.max(.7,Math.min(1.2,(Number(C.settings.heroTitleSize)||100)/100)),size=64*custom*(lang==='ar'?1:1.25)*factor;
  body.style.setProperty('--ui-hero-title-size',size+'px');body.style.setProperty('--ui-hero-subtitle-size',(30*Math.max(.7,Math.min(1.2,(Number(C.settings.heroSubtitleSize)||100)/100))*factor)+'px');
  var title=document.querySelector('#view-home .club-hero h1');if(!title)return;
  while((!w.MorphTextSize)&&title.scrollHeight>title.clientHeight+2&&size>40){size-=2;body.style.setProperty('--ui-hero-title-size',size+'px');}
 }
 function sync(){queued=false;try{
  decorateSidebar();var mode=failed?'classic':get(),modern=mode==='modern';if(modern){if(!w.MorphThemeAdapter||!w.MorphIcons)throw Error('Modern foundation unavailable');w.MorphThemeAdapter.apply();}
  body.setAttribute('data-ui-mode',mode);if(modern&&!getComputedStyle(body).getPropertyValue('--ui-radius-md'))throw Error('Modern styles unavailable');body.setAttribute('data-ui-home',modern&&home()?'true':'false');
  var weak=w.MorphTVCompatibility&&MorphTVCompatibility.legacyLayout||/Tizen[ \/][1-6](?:\.|\b)/i.test(navigator.userAgent),light=C.Performance&&C.Performance.isLight()||!C.settings.motion||weak||w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  body.setAttribute('data-ui-effects',light?'light':'full');if(search)search.hidden=!(modern&&home());
  var hdmi=document.getElementById('dock-hdmi');if(hdmi&&w.MorphIcons){var glyph=hdmi.querySelector('.ui-dock-icon');if(!glyph){glyph=C.el('span','app-icon ui-dock-icon');glyph.setAttribute('aria-hidden','true');glyph.innerHTML=MorphIcons.svg('inputs');hdmi.appendChild(glyph);}glyph.hidden=!(modern&&home());var original=hdmi.querySelector('img.app-icon');if(original)original.hidden=modern&&home();}
  var sidebar=document.querySelector('#view-home .home-tools');if(sidebar){if(modern&&home())sidebar.setAttribute('data-scroll','vertical');else sidebar.removeAttribute('data-scroll');}
  var nav=document.querySelector('main>header nav');if(nav){if(modern&&home())nav.setAttribute('data-scroll','horizontal');else nav.removeAttribute('data-scroll');}
  Array.prototype.forEach.call(document.querySelectorAll('.ui-sidebar-icon'),function(icon){icon.hidden=!(modern&&home());});paint();fitHero();w.dispatchEvent(new Event('morphTheme'));if(C.Focus&&C.Focus.invalidate)C.Focus.invalidate();
 }catch(e){failed=true;body.setAttribute('data-ui-mode','classic');body.setAttribute('data-ui-home','false');if(search)search.hidden=true;Array.prototype.forEach.call(document.querySelectorAll('.ui-sidebar-icon,.ui-dock-icon'),function(icon){icon.hidden=true;});var picture=document.querySelector('#dock-hdmi>img.app-icon');if(picture)picture.hidden=false;Array.prototype.forEach.call(document.querySelectorAll('main>header nav,#view-home .home-tools'),function(node){node.removeAttribute('data-scroll');});paint();if(w.console)console.warn('Modern UI unavailable; Classic retained.',e);}}
 function schedule(){if(queued)return;queued=true;(w.requestAnimationFrame||function(fn){setTimeout(fn,16);})(sync);}
 function set(mode){if(mode!=='classic'&&mode!=='modern')return false;failed=false;var previous=C.settings.uiMode;C.settings.uiMode=mode;sync();if(mode==='modern'&&failed){C.settings.uiMode=previous;return false;}C.saveSettings();try{if(w.TVNative&&TVNative.saveSettings)TVNative.saveSettings(JSON.stringify({uiMode:mode}));}catch(ignore){}w.dispatchEvent(new Event('morphUIMode'));return true;}
 function mount(){
  var panel=document.querySelector('#settings-category-appearance .settings-panel')||document.querySelector('#view-settings .settings-panel');
  if(panel&&!document.getElementById('setting-ui-mode')){button=C.el('button','setting');button.id='setting-ui-mode';button.setAttribute('data-no-translate','');button.onclick=function(){set(get()==='classic'?'modern':'classic');};panel.appendChild(button);}
  var header=document.querySelector('main>header .header-status');if(header){search=C.el('button','ui-home-search');search.id='modern-search';search.hidden=true;search.setAttribute('data-no-translate','');search.innerHTML=w.MorphIcons?w.MorphIcons.svg('search'):'';search.onclick=function(){var apps=document.getElementById('nav-apps');if(apps)apps.click();var input=document.getElementById('app-search');if(input)C.Focus.edit(input);};header.insertBefore(search,header.firstChild);}
  decorateSidebar();
  var apply=C.applyRemoteConfig;C.applyRemoteConfig=function(){var result=apply.apply(this,arguments);sync();return result;};
  new MutationObserver(schedule).observe(document.getElementById('favourites'),{childList:true});
  new MutationObserver(schedule).observe(document.querySelector('#view-home .home-tools'),{childList:true,subtree:true});
  new MutationObserver(schedule).observe(document.getElementById('view-home'),{attributes:true,attributeFilter:['hidden']});
  new MutationObserver(schedule).observe(body,{attributes:true,attributeFilter:['data-theme']});
  sync();
 }
 w.MorphUIMode={get:get,set:set,refresh:sync};
 ['morphViewer','morphLanguage','morphPerformance','morphUIMode','morphTextSize'].forEach(function(name){w.addEventListener(name,schedule);});
 if(document.readyState==='complete')mount();else w.addEventListener('load',mount);
})(window);
