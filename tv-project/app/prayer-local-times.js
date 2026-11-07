/* Local mosque preferences. Adjust raw calculated times once, before scheduling. */
(function(w){'use strict';
 var context,form,status,prayers=['Fajr','Dhuhr','Asr','Maghrib','Isha'];
 function normalize(value){var v=value||{},offset=Number(v.offsetMinutes),minutes=Number(v.iqamaMinutes);return {offsetMinutes:isFinite(offset)?Math.max(-120,Math.min(120,Math.round(offset))):0,iqamaMode:['after','fixed'].indexOf(v.iqamaMode)>=0?v.iqamaMode:'off',iqamaMinutes:isFinite(minutes)?Math.max(0,Math.min(180,Math.round(minutes))):10,iqamaTime:/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v.iqamaTime||'')?v.iqamaTime:''};}
 function clock(at,zone,api){var p=api.parts(at,zone);return String(p.hour).padStart(2,'0')+':'+String(p.minute).padStart(2,'0');}
 function adjust(item,date,zone,api){
  if(item.name==='Sunrise')return item;
  var value=normalize((api.config.localTimes||{})[item.name]);
  item.baseAt=item.at;item.at+=value.offsetMinutes*60000;item.time=clock(item.at,zone,api);
  var iqama=NaN;
  if(value.iqamaMode==='after')iqama=item.at+value.iqamaMinutes*60000;
  else if(value.iqamaMode==='fixed'&&value.iqamaTime){
   iqama=api.timeAt(date,value.iqamaTime,zone);
   if(isFinite(iqama)&&iqama<item.at){var bits=date.split('-').map(Number),next=new Date(Date.UTC(bits[2],bits[1]-1,bits[0]+1));iqama=api.timeAt(api.dateKey({year:next.getUTCFullYear(),month:next.getUTCMonth()+1,day:next.getUTCDate()}),value.iqamaTime,zone);}
  }
  item.iqamaAt=isFinite(iqama)?iqama:null;item.iqamaTime=isFinite(iqama)?clock(iqama,zone,api):'';item.iqamaNextDay=isFinite(iqama)&&api.dateKey(api.parts(iqama,zone))!==date;return item;
 }
 function el(tag,cls,text){var node=document.createElement(tag);if(cls)node.className=cls;if(text)node.textContent=text;return node;}
 function words(ar,en){var french={'Check minutes and enter a 24-hour time such as 13:15.':'Vérifiez les minutes et saisissez une heure sur 24 h, par exemple 13:15.','Local mosque times saved.':'Horaires de la mosquée enregistrés.','Calculated times restored; city and calculation method retained.':'Horaires calculés rétablis ; ville et méthode conservées.','Local Adhan & Iqama times ▾':'Adhan et iqama de la mosquée ▾','Positive minutes delay Adhan; negative minutes bring it earlier. Iqama follows your mosque and does not change Adhan.':'Les minutes positives retardent l’adhan ; les négatives l’avancent. L’iqama suit votre mosquée sans modifier l’adhan.','Adhan offset · minutes':'Décalage de l’adhan · minutes','Iqama timing':'Horaire de l’iqama','Minutes after Adhan':'Minutes après l’adhan','Iqama time · 24 hour':'Heure de l’iqama · 24 h','Not set':'Non défini','Minutes after Adhan':'Minutes après l’adhan','Fixed local time':'Heure locale fixe','Save local times':'Enregistrer les horaires','Reset local times':'Rétablir les horaires'};return context.language()==='ar'?ar:context.language()==='fr'?(french[en]||en):en;}
 function input(name,field){return document.getElementById('prayer-local-'+name+'-'+field);}
 function mount(api){
  if(form)return;context=api;var panel=document.getElementById('prayer-settings');if(!panel)return;
  var toggle=el('button','prayer-button');toggle.id='prayer-local-toggle';toggle.type='button';toggle.setAttribute('aria-expanded','false');
  form=el('section','prayer-local-form');form.id='prayer-local-form';form.hidden=true;
  toggle.onclick=function(){form.hidden=!form.hidden;toggle.setAttribute('aria-expanded',String(!form.hidden));if(api.invalidate)api.invalidate();};panel.appendChild(toggle);panel.appendChild(form);form.appendChild(el('p','prayer-local-note'));
  prayers.forEach(function(name){
   var row=el('section','prayer-local-row');row.setAttribute('data-local-prayer',name);row.appendChild(el('h3'));
   ['offset','mode','minutes','time'].forEach(function(field){var label=el('label'),caption=el('span'),control=el(field==='mode'?'select':'input');caption.setAttribute('data-local-label',field);control.id='prayer-local-'+name+'-'+field;
    if(field==='mode')['off','after','fixed'].forEach(function(value){var option=el('option');option.value=value;control.appendChild(option);});
    else if(field==='time'){control.type='text';control.placeholder='HH:mm';control.maxLength=5;control.setAttribute('inputmode','text');control.setAttribute('autocomplete','off');}
    else{control.type='number';control.min=field==='offset'?'-120':'0';control.max=field==='offset'?'120':'180';control.step='1';}
    label.appendChild(caption);label.appendChild(control);row.appendChild(label);
   });
   inputMode(row,name);form.appendChild(row);
  });
  status=el('p');status.id='prayer-local-status';status.setAttribute('role','status');form.appendChild(status);
  var save=el('button','prayer-button');save.id='prayer-local-save';save.type='button';save.onclick=function(){var result={},invalid=false;prayers.forEach(function(name){var offset=input(name,'offset').value,mode=input(name,'mode').value,minutes=input(name,'minutes').value,time=input(name,'time').value,n=Number(offset),m=Number(minutes);
   if(!offset.trim()||!isFinite(n)||Math.round(n)!==n||n< -120||n>120||mode==='after'&&(!minutes.trim()||!isFinite(m)||Math.round(m)!==m||m<0||m>180)||mode==='fixed'&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)){invalid=true;return;}
   result[name]={offsetMinutes:n,iqamaMode:mode,iqamaMinutes:isFinite(m)?m:10,iqamaTime:time};
  });if(invalid){status.textContent=words('راجع الدقائق واكتب الساعة بصيغة 24 ساعة مثل 13:15.','Check minutes and enter a 24-hour time such as 13:15.');return;}
   context.save({localTimes:result});status.textContent=words('تم حفظ مواقيت المسجد.','Local mosque times saved.');
  };form.appendChild(save);
  var reset=el('button','prayer-button');reset.id='prayer-local-reset';reset.type='button';reset.onclick=function(){context.save({localTimes:{}});status.textContent=words('تمت استعادة المواقيت المحسوبة؛ المدينة وطريقة الحساب لم تتغير.','Calculated times restored; city and calculation method retained.');};form.appendChild(reset);render();
 }
 function inputMode(row,name){var mode=row.querySelector('select');mode.onchange=function(){['minutes','time'].forEach(function(field){var control=row.querySelector('#prayer-local-'+name+'-'+field),visible=field==='minutes'?mode.value==='after':mode.value==='fixed';var label=control.closest('label');label.hidden=!visible;control.disabled=!visible;Array.prototype.forEach.call(label.querySelectorAll('button'),function(button){button.disabled=!visible;});});if(context.invalidate)context.invalidate();};}
 function render(){
  if(!form)return;
  // A background refresh must not overwrite a half-entered time.
  if(form.contains(document.activeElement)&&/^(INPUT|SELECT)$/.test(document.activeElement.tagName))return;
  document.getElementById('prayer-local-toggle').textContent=words('ضبط الأذان والإقامة حسب المسجد ▾','Local Adhan & Iqama times ▾');
  form.querySelector('.prayer-local-note').textContent=words('الدقائق الموجبة تؤخّر الأذان والسالبة تقدّمه. الإقامة تُضبط حسب مسجدك ولا تغيّر وقت الأذان.','Positive minutes delay Adhan; negative minutes bring it earlier. Iqama follows your mosque and does not change Adhan.');
  prayers.forEach(function(name){var row=form.querySelector('[data-local-prayer='+name+']'),v=normalize((context.config().localTimes||{})[name]);row.querySelector('h3').textContent=context.prayerName(name);
   var captions={offset:words('تعديل الأذان · دقائق','Adhan offset · minutes'),mode:words('طريقة الإقامة','Iqama timing'),minutes:words('دقائق بعد الأذان','Minutes after Adhan'),time:words('ساعة الإقامة · 24 ساعة','Iqama time · 24 hour')};
   Array.prototype.forEach.call(row.querySelectorAll('[data-local-label]'),function(caption){caption.textContent=captions[caption.getAttribute('data-local-label')];});
   var mode=input(name,'mode');Array.prototype.forEach.call(mode.options,function(option){option.textContent=option.value==='off'?words('بدون إقامة','Not set'):option.value==='after'?words('بعد الأذان بدقائق','Minutes after Adhan'):words('ساعة ثابتة','Fixed local time');});
   input(name,'offset').value=v.offsetMinutes;mode.value=v.iqamaMode;input(name,'minutes').value=v.iqamaMinutes;input(name,'time').value=v.iqamaTime;mode.onchange();
  });document.getElementById('prayer-local-save').textContent=words('حفظ مواقيت المسجد','Save local times');document.getElementById('prayer-local-reset').textContent=words('استعادة المواقيت المحسوبة','Reset local times');
 }
 w.MorphPrayerLocal={normalize:normalize,adjust:adjust,mount:mount,render:render};
})(window);
