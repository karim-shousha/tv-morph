/* Phone design pages. Reuse all draft, image picker, theme licensing and Apply handlers. */
(function(w,d){'use strict';
 function init(){
  var studio=d.getElementById('page-studio'),library=d.getElementById('theme-library'),personal=d.getElementById('personal-touch');
  if(!studio||!library||!personal)return;
  var tr=function(ar,en){return w.MorphLocale?MorphLocale.t(ar,en):en;},tabButtons=[];
  var heading=d.getElementById('m30-design-heading'),preview=d.getElementById('preview'),selected=d.getElementById('selected-theme');
  var hero=d.createElement('section');hero.id='studio-design-hero';hero.dataset.noTranslate='';
  var copy=d.createElement('div'),current=d.createElement('p'),caption=d.createElement('span'),themeName=d.createElement('strong'),art=d.createElement('img');
  copy.className='studio-design-copy';current.className='studio-design-current';current.append(caption,themeName);art.className='studio-design-art';art.alt='';art.setAttribute('aria-hidden','true');art.decoding='async';
  heading.before(hero);copy.append(heading,current);hero.append(copy,art);
  var previewCard=d.querySelector('.approved-preview-card');if(previewCard)previewCard.hidden=true;
  preview.hidden=false;preview.removeAttribute('aria-hidden');
  var shortcuts=studio.querySelector('.studio-quick-actions');if(shortcuts)shortcuts.remove();
  var groupTitle=d.getElementById('studio-personal-title');if(groupTitle)groupTitle.hidden=true;
  var group=studio.querySelector('.studio-personal-group');group.classList.add('studio-design-actions');
  [library,personal].forEach(function(detail,index){
   var summary=detail.querySelector('summary'),title=summary.querySelector(index?'strong':'h2'),hint=summary.querySelector(index?'span:not(.approved-photo-art)':'small.approved-library-note'),chosen=index?null:selected;
   if(!hint){hint=d.createElement('small');if(!index)hint.className='approved-library-note';}
   var icon=d.createElement('i'),words=d.createElement('div');icon.className='studio-design-action-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=Morph30.svg(index?'design':'apps',24);words.className='studio-design-action-copy';words.append(title,hint);summary.replaceChildren(icon,words);if(chosen)summary.appendChild(chosen);summary.dataset.personalNavigation='';
  });
  function syncHero(){themeName.textContent=selected.textContent;if(art.getAttribute('src')!=='connect-tv-premium.png')art.src='connect-tv-premium.png';}
  new MutationObserver(syncHero).observe(selected,{childList:true,characterData:true,subtree:true});
  new MutationObserver(syncHero).observe(preview,{subtree:true,attributes:true,attributeFilter:['src','hidden']});
  var tabs=d.createElement('div');tabs.className='studio-design-shortcuts';tabs.dataset.noTranslate='';group.before(tabs);
  function open(name){var detail=name==='library'?library:personal;detail.open=true;detail.scrollIntoView({behavior:'smooth',block:'start'});detail.querySelector('.studio-editor-heading h2').focus({preventScroll:true});}
  [library,personal].forEach(function(detail,index){
   var tab=d.createElement('button');tab.type='button';tab.id='studio-tab-'+index;tab.setAttribute('aria-controls',detail.id);tab.dataset.personalNavigation='';tab.innerHTML=Morph30.svg(index?'design':'apps',20)+'<span></span>';tab.onclick=function(){open(index?'personal':'library');};tabs.appendChild(tab);tabButtons.push(tab);detail.setAttribute('role','region');detail.setAttribute('aria-labelledby',tab.id);
   var header=d.createElement('div');header.className='studio-editor-heading';header.dataset.noTranslate='';
   var title=d.createElement('h2'),hint=d.createElement('p');title.id='studio-inline-title-'+index;title.tabIndex=-1;detail.setAttribute('aria-labelledby',title.id);header.append(title,hint);detail.querySelector('summary').after(header);
   detail._editorLabels=function(){title.textContent=index?tr('تعديل الثيم','Customize your theme'):tr('مكتبة الثيمات','Theme library');tab.querySelector('span').textContent=index?tr('الخلفية والألوان','Background & colors'):tr('مكتبة الثيمات','Theme library');hint.textContent=index?tr('صورة الثيم مجانية. افتح القسم اللي عايز تعدّله.','Theme images are free. Open the section you want to edit.'):tr('اختار ثيمك من المكتبة، ثم طبّقه على التلفزيون.','Choose a theme, then apply it to your TV.');};
  });
  var content=personal.querySelector('.customization-content'),image=d.getElementById('free-theme-image');
  if(image&&content){content.prepend(image);image.open=true;}
  var plusNote=d.createElement('section');plusNote.className='studio-editor-plus';plusNote.dataset.noTranslate='';var plusCopy=d.createElement('p'),plusButton=d.createElement('button');plusButton.type='button';plusButton.dataset.personalNavigation='';plusButton.onclick=function(){MorphPlus.open();};plusNote.append(plusCopy,plusButton);if(content)image?image.after(plusNote):content.prepend(plusNote);
  var folds=[];
  function fold(ar,en){var detail=d.createElement('details'),summary=d.createElement('summary');detail.className='advanced-subsection';summary.dataset.noTranslate='';detail.appendChild(summary);folds.push([summary,ar,en]);return detail;}
  var editor=content&&content.querySelector('.panel.editor');
  if(editor){
   var textFold=fold('العنوان والنصوص','Title & text'),displayFold=fold('العناصر الظاهرة وحجمها','Display & sizing');
   ['custom-title','custom-subtitle'].forEach(function(id){var input=d.getElementById(id),label=editor.querySelector('label[for="'+id+'"]');if(label)textFold.appendChild(label);if(input)textFold.appendChild(input);});
   var existing=Array.prototype.filter.call(editor.children,function(el){return el.classList.contains('advanced-subsection');});
   Array.prototype.slice.call(editor.children).forEach(function(el){if(!el.classList.contains('advanced-subsection'))displayFold.appendChild(el);});
   var colorFold=existing.filter(function(el){return !!el.querySelector('.custom-colors');})[0];
   if(colorFold){plusNote.after(colorFold);colorFold.open=true;}
   var cursor=colorFold||plusNote;cursor.after(textFold);cursor=textFold;
   existing.forEach(function(el){if(el===colorFold)return;cursor.after(el);cursor=el;});cursor.after(displayFold);
   if(!editor.children.length)editor.remove();
  }
  var reset=d.getElementById('reset');if(reset){var resetHeading=reset.closest('.section-title');personal.querySelector('.studio-editor-heading').appendChild(reset);if(resetHeading)resetHeading.remove();}
  function labels(){heading.querySelector('h1').textContent=tr('ثيمات تلفزيونك','Themes for your TV');heading.querySelector('p').textContent=tr('اختار ثيمك وعدّل تفاصيله، ثم طبّقه على التلفزيون.','Choose your theme, make it yours, then apply it to your TV.');caption.textContent=tr('الثيم الحالي','Current theme');[library,personal].forEach(function(el){el._editorLabels();});folds.forEach(function(item){item[0].textContent=tr(item[1],item[2]);});plusNote.hidden=!!(w.MorphPlus&&MorphPlus.isActive());plusCopy.textContent=tr('صورة الثيم مجانية. الألوان والنصوص والتنسيق متاحة مع Morph Plus.','Theme images are free. Colors, text and layout are included with Morph Plus.');plusButton.textContent=tr('عرض Morph Plus','View Morph Plus');syncHero();}
  w.MorphStudio={open:open};
  labels();library.open=false;personal.open=false;['morphLanguage','morphPlus','load'].forEach(function(name){w.addEventListener(name,labels);});

 }
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})(window,document);
