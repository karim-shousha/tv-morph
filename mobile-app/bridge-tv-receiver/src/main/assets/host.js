/* Reuse only the host's platform APIs; no second app instance or launcher exit. */
(function (w) {
  'use strict';
  try {
    if (w.parent !== w) {
      if (w.parent.webapis) w.webapis = w.parent.webapis;
      if (w.parent.tizen) w.tizen = w.parent.tizen;
      if (w.parent.PalmServiceBridge) w.PalmServiceBridge = w.parent.PalmServiceBridge;
    }
  } catch (ignore) {}
  var parentHost = null;
  try { if (w.parent !== w && w.parent.ClearTV) parentHost = w.parent; } catch (ignore) {}
  function mix(a,b,t){function rgb(value){var m=/^#([0-9a-f]{6})$/i.exec(value||'');return m?[parseInt(m[1].slice(0,2),16),parseInt(m[1].slice(2,4),16),parseInt(m[1].slice(4,6),16)]:null;}var x=rgb(a),y=rgb(b);if(!x||!y)return a;return '#'+x.map(function(n,i){var v=Math.round(n+(y[i]-n)*t).toString(16);return v.length<2?'0'+v:v;}).join('');}
  function alpha(hex,opacity){var m=/^#([0-9a-f]{6})$/i.exec(hex||'');return m?'rgba('+parseInt(m[1].slice(0,2),16)+','+parseInt(m[1].slice(2,4),16)+','+parseInt(m[1].slice(4,6),16)+','+opacity+')':hex;}
  function syncTheme() {
    var values = {}, settings = {}, style;
    if (parentHost) {
      style = parentHost.getComputedStyle(parentHost.document.body);
      var names = {'bg':'--ui-bg','surface':'--ui-bg-raised','control':'--ui-control-bg','text':'--ui-text','muted':'--ui-text-muted','accent':'--ui-accent','focus':'--ui-focus-ring','border':'--ui-card-border','primary':'--ui-button-gradient','primary-text':'--ui-button-text'};
      Object.keys(names).forEach(function (key) { values[key] = style.getPropertyValue(names[key]).trim(); });
      document.body.setAttribute('data-launcher-theme', parentHost.document.body.getAttribute('data-ui-theme') || parentHost.document.body.getAttribute('data-theme') || 'night');
    } else {
      try { if (w.MorphDevice && w.MorphDevice.launcherSettings) settings = JSON.parse(w.MorphDevice.launcherSettings()); else return false; } catch (ignore) { return false; }
      values = {bg:settings.uiBg,surface:settings.uiSurface,control:settings.uiSurface,text:settings.uiText,accent:settings.uiAccent,focus:settings.uiAccent};
      document.body.setAttribute('data-launcher-theme', settings.theme || 'night');
    }
    var bg=values.bg||'#171e32',surface=values.surface||bg,accent=values.accent||values.text||'#f7f9ff',dark=mix(bg,'#030610',.65);
    values['page-bg']='radial-gradient(ellipse at 100% 0%,'+alpha(mix(surface,accent,.12),.42)+',transparent 65%),linear-gradient(155deg,transparent 65%,'+alpha(dark,.55)+' 65.2%),linear-gradient(110deg,'+dark+','+mix(bg,surface,.45)+')';
    values['panel']=alpha(surface,.88);values['accent-soft']=alpha(accent,.14);values['accent-border']=alpha(accent,.35);values['shadow']=alpha(dark,.22);
    if(!values.primary)values.primary=accent;if(!values['primary-text'])values['primary-text']=values.text||'#fff';
    Object.keys(values).forEach(function (key) { if (values[key] && document.body.style.getPropertyValue('--bridge-' + key)!==values[key]) document.body.style.setProperty('--bridge-' + key, values[key]); });
    document.body.classList.remove('light');
    document.body.setAttribute('data-launcher-host', 'true');
    return true;
  }
  function billing(){
    if(w.MorphDevice&&MorphDevice.billingJson){try{return JSON.parse(MorphDevice.billingJson());}catch(ignore){}}
    var host=parentHost||w,plus=host.MorphPlus,trial=host.MorphBridgeAccess,state='unknown';
    if(plus&&plus.isActive&&plus.isActive())state='active';else if(plus&&(!plus.isPending||!plus.isPending()))state='inactive';
    var detail=trial?trial.status(false):{};return {plus:state,remainingMs:Number(detail.remainingMs)||0,startedAt:Number(detail.startedAt)||0};
  }
  w.MorphBridgeHost = {syncTheme:syncTheme,billing:billing};
  if (parentHost) {
    ['morphTheme','morphViewer','morphTextSize','morphUIMode','morphPacks'].forEach(function (event) { parentHost.addEventListener(event, syncTheme); });
    var themeObserver=new MutationObserver(syncTheme);themeObserver.observe(parentHost.document.body,{attributes:true,attributeFilter:['style','data-theme','data-ui-theme']});
    w.addEventListener('pagehide', function () { themeObserver.disconnect(); ['morphTheme','morphViewer','morphTextSize','morphUIMode','morphPacks'].forEach(function (event) { parentHost.removeEventListener(event, syncTheme); }); });
  }
  syncTheme();
})(window);
