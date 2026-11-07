(function(){window.addEventListener('load',function(){
 var home=document.getElementById('view-home'),prayer=document.getElementById('home-next-prayer'),matches=document.getElementById('home-matches');
 if(!home||!prayer||!matches)return;
 home.classList.add('pc-summary');
 var prayerIcon=prayer.querySelector('svg');if(prayerIcon)prayerIcon.outerHTML='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 28h26M6 28V16c0-6 10-7 10-12 0 5 10 6 10 12v12M16 2v2M12 28v-8h8v8"/></svg>';
 var heading=matches.querySelector('.home-match-heading');if(heading){var mark=document.createElement('span');mark.className='summary-match-symbol';mark.setAttribute('aria-hidden','true');mark.innerHTML='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="16" cy="16" r="13"/><path d="m16 9 7 5-3 8h-8l-3-8ZM16 3v6M4 12l5 2M8 27l4-5M24 27l-4-5M28 12l-5 2"/></svg>';heading.insertBefore(mark,heading.firstChild);var arrow=document.createElement('span');arrow.className='summary-match-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='›';heading.appendChild(arrow);var meta=heading.querySelector('time');if(meta){meta.classList.add('summary-match-link');matches.insertBefore(meta,heading.nextSibling);}}

 var panel=document.getElementById('pc-home-summary')||document.createElement('div');panel.id='pc-home-summary';panel.removeAttribute('aria-hidden');panel.setAttribute('role','group');
 var divider=document.getElementById('pc-home-summary-divider')||document.createElement('span');divider.id='pc-home-summary-divider';divider.setAttribute('aria-hidden','true');
 home.appendChild(panel);panel.appendChild(prayer);panel.appendChild(divider);panel.appendChild(matches);
 function fit(){var cfg=window.ClearTV&&ClearTV.settings||{};function factor(lang){var custom=Number(cfg['fontScale'+lang]);if(custom>=80&&custom<=130)return custom/100;return cfg['fontSize'+lang]==='large'?1.1:cfg['fontSize'+lang]==='small'?.9:1;}var height=Math.ceil(220+(Math.max(1,factor('Ar'),factor('En'))-1)*200)+'px';if(panel.style.getPropertyValue('height')!==height)panel.style.setProperty('height',height,'important');}
 ['morphTextSize','morphViewer','morphLanguage','resize'].forEach(function(name){window.addEventListener(name,fit);});
 function paint(){fit();var a=!prayer.hidden,b=!matches.hidden,state=a&&b?'both':a?'prayer':'matches',hidden=!a&&!b;
  if(panel.hidden!==hidden)panel.hidden=hidden;
  if(divider.hidden!==!(a&&b))divider.hidden=!(a&&b);
  if(panel.getAttribute('data-content')!==state)panel.setAttribute('data-content',state);
 }
 paint();new MutationObserver(paint).observe(panel,{attributes:true,attributeFilter:['hidden'],subtree:true});
});})();
