/* Shared TV control motion. Paint only; never changes navigation, layout or playback. */
(function(w,d){'use strict';if(w.MorphControlSystem)return;
 var active=null,hovered=null,ready=false,vars=!!(w.CSS&&CSS.supports&&CSS.supports('color','var(--ui-text)'));
 function matches(e,s){if(!e||e.nodeType!==1)return false;var f=e.matches||e.webkitMatchesSelector||e.msMatchesSelector;return !!(f&&f.call(e,s));}function closest(e,s){while(e&&e.nodeType===1){if(matches(e,s))return e;e=e.parentElement;}return null;}
 var props=['transform','transform-origin','outline','outline-offset','background-image','background-color','border-color','color'];
 function blocked(e){return !e||e.disabled||!!closest(e,'#morph-player,#screen-player,#kids-player,#fitness-player,.fitness-player,[data-player-controls],.player-controls')||d.body.hasAttribute('data-phone-library');}
 function control(e){return closest(e,'button,[role=button]');}
 function motion(){var off=d.body.classList.contains('effect-motion-off')||d.body.classList.contains('reduce-motion')||d.documentElement.classList.contains('morph-legacy-layout')||getComputedStyle(d.body).getPropertyValue('--ui-control-motion').trim()==='0';try{off=off||w.matchMedia('(prefers-reduced-motion:reduce)').matches;var C=w.ClearTV||(w.parent!==w&&w.parent.ClearTV);if(C&&C.Performance&&C.Performance.effects)off=off||C.Performance.effects().motion===false;}catch(ignore){}return !off;}
 function base(e){var value=getComputedStyle(e).transform;if(value==='none')return '';var m=/^matrix\(([^)]+)\)$/.exec(value);if(!m)return value;var a=m[1].split(',').map(Number),x=Math.sqrt(a[0]*a[0]+a[1]*a[1]),y=Math.sqrt(a[2]*a[2]+a[3]*a[3]);if(e===d.activeElement||matches(e,':hover')){if(x){a[0]/=x;a[1]/=x;}if(y){a[2]/=y;a[3]/=y;}}return 'matrix('+a.join(',')+')';}
 function prepare(e){if(blocked(e))return null;var rec=e._morphControlMotion;if(!rec){rec=e._morphControlMotion={base:base(e),saved:null,applied:{}};}e.style.setProperty('transition',motion()?'transform 80ms ease-out,background-color 60ms linear,border-color 60ms linear,outline-color 60ms linear':'none','important');return rec;}
 function snapshot(e){var result={};props.forEach(function(k){result[k]={value:e.style.getPropertyValue(k),priority:e.style.getPropertyPriority(k)};});return result;}
 function write(e,rec,key,value){e.style.setProperty(key,value,'important');rec.applied[key]=e.style.getPropertyValue(key);}
 function token(key,fallback){if(vars)return 'var('+key+','+fallback+')';var v=getComputedStyle(d.body).getPropertyValue(key).trim();return v||fallback;}
 function restore(e){var rec=e&&e._morphControlMotion;if(!rec||!rec.saved)return;props.forEach(function(k){if(e.style.getPropertyValue(k)!==rec.applied[k])return;var old=rec.saved[k];if(old.value)e.style.setProperty(k,old.value,old.priority);else e.style.removeProperty(k);});rec.saved=null;rec.applied={};e.removeAttribute('data-morph-control-active');}
 function apply(e){if(blocked(e)){restore(e);return;}var rec=prepare(e);if(!rec.saved)rec.saved=snapshot(e);var zoom=motion()?1+Math.min(.08,12/Math.max(1,e.offsetWidth,e.offsetHeight)):1;
  write(e,rec,'transform',zoom===1?(rec.base||'none'):(rec.base?rec.base+' ':'')+'scale('+zoom+')');write(e,rec,'transform-origin','center');
  var art=matches(e,'.reference-card,.tile,.app,[data-favourite-id],[data-folder-id]')||!!e.querySelector('.app-icon');
  if(!art){write(e,rec,'outline','2px solid '+token('--ui-focus-ring','#dceaff'));write(e,rec,'outline-offset','2px');write(e,rec,'border-color',token('--ui-focus-ring','#dceaff'));if(!matches(e,'.cleaner-danger,.danger,[data-danger]')){write(e,rec,'background-image',token('--ui-focused-surface','linear-gradient(135deg,rgba(32,61,95,.84),rgba(7,16,30,.76))'));write(e,rec,'background-color','transparent');}write(e,rec,'color',token('--ui-text','#f7f9ff'));}
  e.setAttribute('data-morph-control-active','');
 }
 function scan(root){if(!root||root.nodeType!==1)return;if(matches(root,'button,[role=button]'))prepare(root);Array.prototype.forEach.call(root.querySelectorAll('button,[role=button]'),prepare);}
 function refresh(){if(!ready)return;scan(d.body);if(active)apply(active);if(hovered&&hovered!==active)apply(hovered);}
 function start(){if(ready||!d.body)return;ready=true;scan(d.body);active=control(d.activeElement);if(active)apply(active);
  d.addEventListener('focusin',function(event){var next=control(event.target);if(active&&active!==next&&active!==hovered)restore(active);active=next;if(next)apply(next);},true);
  d.addEventListener('focusout',function(event){var e=control(event.target);if(e&&e!==hovered)restore(e);if(active===e)active=null;},true);
  d.addEventListener('mouseover',function(event){var e=control(event.target);if(e===hovered)return;if(hovered&&hovered!==active)restore(hovered);hovered=e;if(e)apply(e);},true);
  d.addEventListener('mouseout',function(event){var e=control(event.target),next=control(event.relatedTarget);if(e&&e!==next&&hovered===e){if(e!==active)restore(e);hovered=null;}},true);
  new MutationObserver(function(rows){rows.forEach(function(row){if(row.type==='attributes'){var e=control(row.target);if(e){if(blocked(e))restore(e);else prepare(e);}}else Array.prototype.forEach.call(row.addedNodes,scan);});}).observe(d.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
  new MutationObserver(refresh).observe(d.body,{attributes:true,attributeFilter:['class','data-phone-library']});
  w.addEventListener('load',refresh);w.addEventListener('morphTheme',refresh);w.addEventListener('morphViewer',refresh);try{if(w.parent!==w){w.parent.addEventListener('morphTheme',refresh);w.addEventListener('pagehide',function(){w.parent.removeEventListener('morphTheme',refresh);});}}catch(ignore){}
 }
 w.MorphControlSystem={refresh:refresh,excluded:blocked};if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',start);else start();
})(window,document);
