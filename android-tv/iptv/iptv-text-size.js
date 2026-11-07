/* IPTV owns its typography preference, independently of the launcher/profile. */
(function(w){'use strict';
 // Phone staging uses a device-width viewport. Its existing typography and
 // launcher integration are intentionally untouched by this TV/desktop setting.
 var viewport=document.querySelector('meta[name=viewport]');
 if(viewport&&/width=device-width/.test(viewport.content))return;
 var key='morph.iptv.text-size.v1',levels=['normal','large','largest'],level='normal';
 try{var saved=localStorage.getItem(key);if(levels.indexOf(saved)>=0)level=saved;}catch(e){}
 var label=document.createElement('label'),select=document.createElement('select'),hint=document.createElement('p');
 label.htmlFor=select.id='setting-iptv-text-size';label.id='iptv-text-size-label';
 hint.id='iptv-text-size-hint';select.setAttribute('aria-describedby',hint.id);
 [label,select,hint].forEach(function(node){node.setAttribute('data-no-translate','');});
 levels.forEach(function(value){var option=document.createElement('option');option.value=value;select.appendChild(option);});
 function paint(){
  var t=function(ar,en){return w.MorphLocale?MorphLocale.t(ar,en):en;};
  label.textContent=t('حجم خط IPTV','IPTV text size');
  var names=[t('عادي','Normal'),t('كبير','Large'),t('كبير جدًا','Extra large')];
  levels.forEach(function(value,i){select.options[i].textContent=names[i];});select.value=level;
  hint.textContent=t('يشمل كل قوائم IPTV. يُحفظ تلقائيًا ومستقل عن إعدادات اللانشر.','Applies to every IPTV menu. Saved automatically, independently of launcher settings.');
 }
 function apply(){queueHeader();document.documentElement.setAttribute('data-iptv-text-size',level);if(w.MorphTextSize)w.MorphTextSize.apply();}
 select.onchange=function(){if(levels.indexOf(select.value)<0)return;level=select.value;try{localStorage.setItem(key,level);}catch(e){}apply();};
 var host=document.querySelector('#iptv-settings-page-library .setting-group')||document.querySelector('.settings-grid .setting-group:last-child');
 if(host){var anchor=host.querySelector('label');host.insertBefore(label,anchor);host.insertBefore(select,anchor);host.insertBefore(hint,anchor);}
 var headerQueued=false;
 function fitHeader(){headerQueued=false;var header=document.getElementById('morph-header'),quick=document.getElementById('cinema-quick-nav'),brand=header&&header.querySelector('.brand'),status=header&&header.querySelector('.header-status');if(!quick||!brand||!status)return;var root=document.documentElement,style=getComputedStyle(header),mid=innerWidth/2,brandRect=brand.getBoundingClientRect(),statusRect=status.getBoundingClientRect(),needed=Array.prototype.reduce.call(quick.children,function(total,node){var css=getComputedStyle(node);return total+node.offsetWidth+(parseFloat(css.marginLeft)||0)+(parseFloat(css.marginRight)||0);},0)+(parseFloat(getComputedStyle(quick).columnGap)||0)*Math.max(0,quick.children.length-1)+12,available=2*Math.max(0,Math.min(mid-brandRect.right-18,statusRect.left-mid-18)),stacked=needed>available+2;if(root.hasAttribute('data-iptv-header-stacked')!==stacked){if(stacked)root.setAttribute('data-iptv-header-stacked','');else root.removeAttribute('data-iptv-header-stacked');}var height=(stacked?Math.max(160,Math.ceil(Math.max(brand.offsetHeight,status.offsetHeight)+quick.offsetHeight+32)):104)+'px';if(root.style.getPropertyValue('--cinema-header')!==height)root.style.setProperty('--cinema-header',height,'important');['height','min-height'].forEach(function(name){if(header.style.getPropertyValue(name)!==height)header.style.setProperty(name,height,'important');});['dashboard'].forEach(function(id){var node=document.getElementById(id);if(node&&node.style.getPropertyValue('top')!==height)node.style.setProperty('top',height,'important');});var main=document.querySelector('main');if(main&&main.style.getPropertyValue('top')!==height)main.style.setProperty('top',height,'important');if(w.IptvTvBridge&&IptvTvBridge.refreshLayout)IptvTvBridge.refreshLayout();}
 function queueHeader(){if(headerQueued)return;headerQueued=true;(w.requestAnimationFrame||function(fn){setTimeout(fn,16);})(function(){(w.requestAnimationFrame||function(fn){setTimeout(fn,16);})(fitHeader);});}
 w.addEventListener('load',function(){var header=document.getElementById('morph-header');if(header)new MutationObserver(queueHeader).observe(header,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['style']});queueHeader();});w.addEventListener('resize',queueHeader);w.addEventListener('morphHeaderWeather',queueHeader);w.addEventListener('morphLanguage',queueHeader);
 w.IptvTextSize={factor:function(){return level==='largest'?1.4:level==='large'?1.2:1;},get:function(){return level;}};
 w.addEventListener('morphLanguage',paint);w.addEventListener('resize',function(){if(w.MorphTextSize)w.MorphTextSize.apply();});
 w.addEventListener('storage',function(event){if(event.key!==key)return;level=levels.indexOf(event.newValue)>=0?event.newValue:'normal';paint();apply();});
 paint();apply();
})(window);
