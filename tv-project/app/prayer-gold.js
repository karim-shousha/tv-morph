/* Reference-matched presentation only. Timetable, local adjustments and audio stay shared. */
(function(w){'use strict';
 var mounted=null,signature='',queued=false;
 var sun='<svg viewBox="0 0 120 90" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" aria-hidden="true"><path d="M8 68h104M29 66a31 31 0 0 1 62 0M60 17v-9M35 24l-6-8M20 43l-9-3M85 24l6-8M100 43l9-3"/><path d="M16 73h88" opacity=".35"/></svg>';
 var actions={'prayer-settings-open':'<path d="m9 3-1 3-3 1-2 3 2 3-2 3 2 3 3 1 1 3h6l1-3 3-1 2-3-2-3 2-3-2-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>','prayer-refresh':'<path d="M20 8a8 8 0 1 0 0 8M20 2v6h-6"/>','prayer-back':'<path d="m14 5-7 7 7 7M7 12h14"/>','prayer-stop':'<path d="M8 5h8v14H8Z"/>'};
 var moon='<svg viewBox="0 0 100 90" fill="currentColor" aria-hidden="true"><path d="M66 10a34 34 0 1 0 15 59A31 31 0 0 1 66 10Z"/><path d="m80 13 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/></svg>';
 function mount(root){
  if(mounted===root)return;mounted=root;root.classList.add('prayer-gold');
  var overview=root.querySelector('.prayer-overview'),clock=root.querySelector('.prayer-clock');if(overview&&clock)overview.insertBefore(clock,overview.firstChild);
  var heading=root.querySelector('.prayer-upcoming-heading'),icon=document.createElement('span');icon.className='prayer-gold-next-icon';icon.setAttribute('aria-hidden','true');if(heading)heading.insertBefore(icon,heading.firstChild);
  refresh();w.addEventListener('resize',schedule);w.addEventListener('morphLanguage',schedule);w.addEventListener('morphTextSize',schedule);
 }
 function fitText(node,max,min){if(!node||!node.offsetWidth||node.hidden)return;node.style.setProperty('font-size',max+'px','important');for(var size=max;size>min&&(node.scrollWidth>node.clientWidth+1||node.scrollHeight>node.clientHeight+1);size-=1)node.style.setProperty('font-size',Math.max(min,size-1)+'px','important');}
 function refresh(){
  var root=mounted;if(!root||root.hidden)return;theme();
  var width=root.clientWidth,height=root.clientHeight,unit=Math.max(.25,Math.min(width/1920,height/1080));root.style.setProperty('--prayer-unit',String(unit));document.documentElement.style.setProperty('--prayer-unit',String(unit));
  var config=w.ClearTV&&ClearTV.settings||{},language=document.documentElement.lang||'en',custom=Number(config[language==='ar'?'fontScaleAr':'fontScaleEn']),preset=config[language==='ar'?'fontSizeAr':'fontSizeEn'],scale=w.IptvTextSize?IptvTextSize.factor():custom>=80&&custom<=130?custom/100:preset==='small'?.9:preset==='large'?1.1:1;root.style.setProperty('--prayer-font-unit',String(unit*scale));document.documentElement.style.setProperty('--prayer-font-unit',String(unit*scale));
  var status=document.getElementById('prayer-error'),place=document.getElementById('prayer-place');if(status&&place)status.classList.toggle('prayer-status-duplicate',status.textContent.trim()===place.textContent.trim());
  var title=document.getElementById('prayer-heading');if(title&&!title.querySelector('.prayer-title-main')){var words=title.textContent.trim().split(/\s+/),last=words.pop(),main=document.createElement('span'),accent=document.createElement('span');main.className='prayer-title-main';accent.className='prayer-title-accent';main.textContent=words.join(' ');accent.textContent=last;title.textContent='';title.appendChild(main);title.appendChild(document.createTextNode(' '));title.appendChild(accent);}
  var ar=document.getElementById('dua-arabic'),meaning=document.getElementById('dua-meaning'),lang=document.documentElement.lang||'en';
  root.classList.toggle('prayer-oled',document.documentElement.getAttribute('data-iptv-oled')==='true');
  var C=w.ClearTV,next=C&&C.Prayer&&C.Prayer.next(),name=next&&next.name||'',icon=root.querySelector('.prayer-gold-next-icon');if(icon&&icon.getAttribute('data-prayer')!==name){icon.setAttribute('data-prayer',name);icon.innerHTML=name==='Fajr'||name==='Isha'?moon:sun;}
  Array.prototype.forEach.call(root.querySelectorAll('#prayer-actions button'),function(button){button.classList.add('prayer-has-svg-icon');button.setAttribute('aria-label',button.textContent);button.title=button.textContent;if(actions[button.id]&&!button.querySelector('.prayer-action-icon'))button.insertAdjacentHTML('afterbegin','<svg class="prayer-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+actions[button.id]+'</svg>');});
  var key=[width,height,lang,scale,ar&&ar.textContent,meaning&&meaning.textContent,root.getAttribute('data-size')].join('|');if(signature===key)return;signature=key;
  fitText(document.getElementById('prayer-heading'),(lang==='ar'?72:lang==='fr'?60:66)*unit*scale,32*unit);
  fitText(document.getElementById('prayer-place'),28*unit*scale,20*unit);
  fitText(document.getElementById('prayer-countdown'),68*unit*scale,46*unit);
  fitText(document.getElementById('prayer-clock'),112*unit*scale,72*unit);
  fitText(document.getElementById('prayer-clock-label'),22*unit*scale,16*unit);fitText(document.getElementById('prayer-date'),22*unit*scale,16*unit);fitText(document.getElementById('prayer-hijri'),21*unit*scale,16*unit);
  fitText(document.getElementById('prayer-next-name'),(lang==='ar'?110:98)*unit*scale,62*unit);
  Array.prototype.forEach.call(root.querySelectorAll('.prayer-time'),function(card){fitText(card.querySelector('.prayer-time-heading span'),(lang==='fr'?25:30)*unit*scale,21*unit);fitText(card.querySelector('strong'),58*unit*scale,36*unit);fitText(card.querySelector('.prayer-iqama'),23*unit*scale,18*unit);});
  fitText(ar,(lang==='ar'?42:32)*unit*scale,24*unit);fitText(meaning,22*unit*scale,18*unit);
 }
 function theme(){if(!w.MorphThemeAdapter)return;var config=w.ClearTV&&ClearTV.settings||{},t=MorphThemeAdapter.resolve(config).tokens,color=t['--ui-bg']||'#07101e',rgb=[1,3,5].map(function(i){return parseInt(color.substr(i,2),16);}),values={'--prayer-theme-card':'rgba('+rgb.join(',')+',.94)','--prayer-theme-panel':t['--ui-panel-bg'],'--prayer-theme-control':t['--ui-control-bg'],'--prayer-theme-text':t['--ui-text'],'--prayer-theme-accent':t['--ui-dock-focus-ring'],'--prayer-theme-line':t['--ui-card-border'],'--prayer-theme-secondary':t['--ui-accent-secondary'],'--prayer-theme-focus':t['--ui-focus-ring'],'--prayer-theme-selected':t['--ui-selected-bg'],'--prayer-theme-selected-text':t['--ui-selected-text'],'--prayer-theme-button':t['--ui-button-gradient'],'--prayer-theme-button-text':t['--ui-button-text']};Object.keys(values).forEach(function(k){document.documentElement.style.setProperty(k,values[k]);if(mounted)mounted.style.setProperty(k,values[k]);});}
 function schedule(){signature='';if(queued)return;queued=true;(w.requestAnimationFrame||function(fn){setTimeout(fn,16);})(function(){queued=false;refresh();});}
 w.MorphPrayerGold={mount:mount,refresh:refresh,theme:theme};
})(window);
