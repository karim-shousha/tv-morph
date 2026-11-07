(function(C){'use strict';
 var last,inputs,inputRow,toggles=[];
 function t(ar,en){return window.MorphLocale?MorphLocale.t(ar,en):en;}
 function focusBeforeHide(node){if(node&&node.contains(document.activeElement))C.Focus.focus(document.getElementById('nav-home'));}
 var inputStamp='',lastStamp='',pending=false;
 function put(node,value){if(node.textContent!==value)node.textContent=value;}
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;render();});}
 function fitOptionalRows(){if(!inputRow||inputRow.hidden)return;var home=document.getElementById('view-home'),cta=document.getElementById('home-continue'),dock=document.getElementById('favourites');if(!home||home.hidden||!cta||!dock||!cta.offsetWidth)return;var parent=inputRow.offsetParent||document.body,parentBox=parent.getBoundingClientRect(),scale=parentBox.width/parent.offsetWidth||1,start=cta.getBoundingClientRect().bottom+20*scale,end=dock.getBoundingClientRect().top-18*scale,total=112,available=Math.max(0,(end-start)/scale),size=Math.min(1,available/total);home.style.setProperty('--home-extra-scale',String(Math.max(.55,size)));inputRow.style.setProperty('top',((end-parentBox.top)/scale-total*Math.max(.55,size))+'px','important');inputRow.style.setProperty('bottom','auto','important');}
 window.addEventListener('resize',function(){requestAnimationFrame(fitOptionalRows);});new MutationObserver(function(){requestAnimationFrame(fitOptionalRows);}).observe(document.body,{attributes:true,attributeFilter:['data-dock-icon-size','data-ui-home','data-ui-mode']});
 function render(){if(!inputRow)return;requestAnimationFrame(fitOptionalRows);var fit=document.getElementById('home-fitness');if(fit){fit.hidden=C.settings.showFitnessApp!==true;if(fit.hidden)focusBeforeHide(fit);}var language=window.MorphLocale?MorphLocale.get():'en',stamp;
  var source=C.read('lastHdmi',null),hasHdmi=(C.Inputs.state.sources||[]).some(function(row){return row.type==='HDMI';});last.hidden=C.settings.showHomeHdmi!==true;if(last.hidden)focusBeforeHide(last);stamp=JSON.stringify([language,source,last.hidden,hasHdmi]);if(stamp!==lastStamp){lastStamp=stamp;put(last.querySelector('small'),hasHdmi?t('آخر مدخل HDMI','Last HDMI input'):t('مداخل HDMI','HDMI inputs'));put(last.querySelector('strong'),source?(source.title||'HDMI '+source.number):hasHdmi?t('اختار مدخل أولًا','Choose an input first'):t('اختيار المدخل','Choose input'));last.onclick=function(){if(source)C.Inputs.watch(source);else C.showView('inputs');};}
  var rows=(C.Inputs.state.sources||[]).filter(function(s){return s.type==='HDMI';}),show=C.settings.showHomeHdmi===true;stamp=JSON.stringify([language,show,rows]);
  if(stamp!==inputStamp){inputStamp=stamp;if(!show)focusBeforeHide(inputs);var selected=document.activeElement&&document.activeElement.getAttribute('data-home-input');inputs.textContent='';inputs.hidden=!show;if(show)rows.forEach(function(s){var b=C.el('button','home-hdmi-shortcut');b.setAttribute('data-home-input',s.id||s.type+':'+s.number);var icon=C.el('span','home-input-icon');icon.innerHTML=window.MorphIcons?MorphIcons.svg('inputs'):C.icon('tv');icon.setAttribute('aria-hidden','true');b.appendChild(icon);var copy=C.el('span','home-input-copy');copy.appendChild(C.el('strong','',C.Inputs.label(s)));copy.appendChild(C.el('small','',s.connected?t('متصل','Connected'):t('مدخل التلفزيون','TV input')));b.appendChild(copy);b.onclick=function(){C.Inputs.watch(s);};inputs.appendChild(b);if(selected===b.getAttribute('data-home-input'))C.Focus.focus(b);});}
  if(last.parentNode!==inputs||inputs.lastChild!==last)inputs.appendChild(last);
  if(inputRow)inputRow.hidden=C.settings.showHomeHdmi!==true;
  toggles.forEach(function(row){put(row.button.querySelector('span'),t(row.ar,row.en));var on=C.settings[row.key]===true;put(row.button.querySelector('strong'),on?t('ظاهر','Shown'):t('مخفي','Hidden'));row.button.setAttribute('aria-pressed',String(on));});
 }
 window.addEventListener('load',function(){
  if(!C.read('home-hdmi-row-v2',false)){C.settings.showHomeHdmi=true;C.settings.showLastHdmi=true;C.write('home-hdmi-row-v2',true);C.saveSettings();}

  var home=document.getElementById('view-home'),all=document.getElementById('manage-apps');if(all)all.hidden=true;
  last=C.el('button','last-hdmi-card');last.id='home-last-hdmi';last.setAttribute('data-no-translate','');last.innerHTML=C.icon('tv')+'<span><small></small><strong></strong></span>';home.appendChild(last);
  inputs=C.el('div','home-hdmi-shortcuts');inputs.id='home-hdmi-shortcuts';inputs.setAttribute('data-scroll','horizontal');home.appendChild(inputs);
  inputRow=C.el('div','home-input-row');inputRow.id='home-input-row';inputRow.appendChild(inputs);inputs.appendChild(last);home.appendChild(inputRow);
  var host=document.getElementById('setting-favourites').parentNode;
  [['showHomeServices','setting-home-services','إظهار الكروت الكبيرة على الرئيسية','Show large program cards on Home'],['showFitnessApp','setting-home-fitness','إظهار التمارين في القائمة الجانبية','Show Fitness in the sidebar'],['showHomeHdmi','setting-home-hdmi','مدخلات HDMI وآخر مدخل على الهوم','HDMI inputs and last input on Home']].forEach(function(row){var b=C.el('button','setting');b.id=row[1];b.setAttribute('data-no-translate','');b.innerHTML='<span></span><strong></strong>';b.onclick=function(){C.settings[row[0]]=C.settings[row[0]]!==true;if(row[0]==='showHomeHdmi')C.settings.showLastHdmi=C.settings.showHomeHdmi;C.saveSettings();render();};host.appendChild(b);toggles.push({key:row[0],button:b,ar:row[2],en:row[3]});});
  var write=C.write;C.write=function(key,value){var result=write.apply(C,arguments);if(key==='lastHdmi')schedule();return result;};
  var changed=C.inputsChanged;C.inputsChanged=function(state){if(changed)changed(state);schedule();};
  C.refreshHomeInputs=schedule;render();
 });
 ['morphViewer','morphLanguage','morphAppsChanged'].forEach(function(name){window.addEventListener(name,render);});
})(window.ClearTV);
