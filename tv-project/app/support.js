(function(){'use strict';
 window.addEventListener('load',function(){
  var setting=document.getElementById('setting-theme'),panel=setting&&setting.closest('.settings-panel');if(!panel)return;
  var button=document.createElement('button');button.className='setting';button.id='setting-support';
  function lang(){return window.MorphLocale?MorphLocale.get():'en';}
  function words(){return {ar:['♥ ادعم مورف تي في','دعم اختياري لمرة واحدة لتطوير التطبيق. اختر المبلغ المناسب لك.','امسح الرمز بهاتفك لفتح صفحة الدعم.','الدعم عبر '],fr:['♥ Soutenir Morph TV','Soutien facultatif et ponctuel au développement. Choisissez votre montant.','Scannez un code avec votre téléphone pour ouvrir la page de soutien.','Soutenir via '],en:['♥ Support Morph TV','Optional one-time support for app development. Choose your amount.','Scan with your phone to open a support page.','Support via ']}[lang()]||wordsEnglish();}
  function wordsEnglish(){return ['♥ Support Morph TV','Optional one-time support for app development. Choose your amount.','Scan with your phone to open a support page.','Support via '];}
  function paint(){button.textContent=words()[0];}paint();button.setAttribute('data-no-translate','');panel.appendChild(button);
  function fill(box){var labels=words(),h=document.createElement('h3'),p=document.createElement('p'),codes=document.createElement('div');h.textContent=labels[0];p.textContent=labels[1];box.appendChild(h);box.appendChild(p);codes.className='settings-support-codes';['InstaPay','PayPal','Stripe'].forEach(function(name){var item=document.createElement('div'),title=document.createElement('strong'),image=document.createElement('img');title.textContent=name;image.src='assets/support-'+name.toLowerCase()+'.webp';image.width=220;image.height=220;image.alt=name+' QR';item.appendChild(title);item.appendChild(image);codes.appendChild(item);});box.appendChild(codes);p=document.createElement('p');p.textContent=labels[2];box.appendChild(p);}

  button.onclick=function(){var C=window.ClearTV;if(C&&C.InlineMenu)C.InlineMenu.toggleInfo(button,fill);};
  window.addEventListener('morphLanguage',function(){paint();if(window.ClearTV&&ClearTV.InlineMenu)ClearTV.InlineMenu.updateInfo(button,fill);});
 });
})();
