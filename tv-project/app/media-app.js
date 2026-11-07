/* A visible launcher app for the existing shared local-file player. */
(function(C){'use strict';
 var id='local.tvmorph.tv.media',themesId='local.tvmorph.tv.themes',baseLaunch,baseLoad,baseIcon;
 function t(a,b){return window.MorphLocale?MorphLocale.t(a,b):b;}
 function ensure(){
  var app=C.Catalog.get(id);
  if(!app){app={id:id,name:'Media Player',installed:true,launchable:true,platform:'builtin',discoverySource:'Morph Launcher'};C.Catalog.apps.push(app);}
  app.name=t('مشغّل الوسائط','Media Player');
  var themes=C.Catalog.get(themesId);if(!themes){themes={id:themesId,installed:true,launchable:true,platform:'builtin',discoverySource:'Morph Launcher'};C.Catalog.apps.push(themes);}themes.name=t('الثيمات','Themes');
 }
 function pin(){ensure();if(C.refreshAppViews)C.refreshAppViews();}
 function open(){
  if(C.Prayer&&!C.Prayer.allowLaunch())return;
  if(window.TVNative&&TVNative.mediaOpen){TVNative.mediaOpen();return;}
  if(C.ParentControls&&C.ParentControls.mediaGuard&&!C.ParentControls.mediaGuard(id,open))return;
  if(window.MorphPC&&C.USB){C.USB.open();return;}
  if(C.USB&&C.USB.openBrowser){C.USB.openBrowser();return;}
  C.toast(t('متصفح الملفات غير متاح على هذا الجهاز.','The file browser is unavailable on this device.'));
 }
 window.addEventListener('load',function(){
  baseLoad=C.Catalog.load;baseLaunch=C.Catalog.launch;baseIcon=C.Catalog.icon;
  var commit=C.AppCatalog.commit;C.AppCatalog.commit=function(catalog,rows,platform,source){var value=commit.call(this,catalog,rows,platform,source);if(catalog===C.Catalog)ensure();return value;};
  C.Catalog.load=function(callback){return baseLoad.call(this,function(error,rows){if(!error){ensure();rows=C.Catalog.apps;}callback(error,rows);});};
  C.Catalog.launch=function(app){if(app&&app.id===themesId){var themeButton=document.getElementById('home-appearance');if(themeButton)themeButton.click();return {sent:!!themeButton};}if(app&&app.id===id){open();return {sent:true};}return baseLaunch.call(this,app);};
  C.Catalog.icon=function(app){if(app&&app.id===themesId){var themes=C.el('span','app-icon ui-owned-app');themes.setAttribute('data-owned-app',themesId);themes.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="14" height="14" rx="3"/><path d="M8 20h10a3 3 0 0 0 3-3V8"/></svg>';return themes;}if(app&&app.id===id){var icon=C.el('span','app-icon ui-owned-app');icon.setAttribute('data-owned-app',id);icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="17" rx="3.5" fill="currentColor" fill-opacity=".16"/><path d="m10 7 6 4.5-6 4.5Z" fill="currentColor" stroke="none"/><path d="M6 18h12" stroke-width="1" opacity=".6"/></svg>';return icon;}return baseIcon.call(this,app);};
  pin();window.addEventListener('morphViewer',pin);window.addEventListener('morphLanguage',pin);
 });
})(window.ClearTV);
