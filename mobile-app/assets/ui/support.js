(function(){'use strict';
var words={
 ar:['ادعم Morph TV ♥','دعم اختياري لتطوير التطبيق، بالمبلغ اللي تختاره، بدون اشتراك تلقائي.','الدعم عبر Stripe ↗','الدعم عبر PayPal ↗'],
 en:['Support Morph TV ♥','Optional support for app development, any amount you choose, no subscription.','Donate via Stripe ↗','Donate via PayPal ↗'],
 fr:['Soutenez Morph TV ♥','Soutien facultatif au développement, montant libre, sans abonnement.','Don via Stripe ↗','Don via PayPal ↗'],
 zh:['支持 Morph TV ♥','自愿支持应用开发，金额随意，无订阅。','通过 Stripe 捐赠 ↗','通过 PayPal 捐赠 ↗'],
 ja:['Morph TV を応援 ♥','開発への任意支援。金額は自由、サブスクリプションなし。','Stripe で寄付 ↗','PayPal で寄付 ↗']};
function lang(){try{if(window.MorphLocale&&MorphLocale.get()&&words[MorphLocale.get()])return MorphLocale.get();}catch(e){}var h=(document.documentElement.lang||'ar').slice(0,2);return words[h]?h:'ar';}
function paint(){var w=words[lang()],boxes=document.querySelectorAll('.morph-support');boxes.forEach(function(box){var s=box.querySelectorAll('strong,p,a');if(s[0])s[0].textContent=w[0];if(s[1])s[1].textContent=w[1];if(s[2])s[2].textContent=w[2];if(s[3])s[3].textContent=w[3];if(s[4])s[4].textContent=lang()==='ar'?'الدعم عبر InstaPay ↗':'Support via InstaPay ↗';var plus=box.querySelector('.support-plus');if(plus)plus.textContent=lang()==='ar'?'اشترك في Plus':'Subscribe to Plus';});}
window.addEventListener('load',function(){
 var url='https://donate.stripe.com/9B66oI2xb4yCdar0VB6EU03';
 document.querySelectorAll('#page-connect').forEach(function(target){
  var box=document.createElement('div');box.className='morph-support';box.setAttribute('data-no-translate','');box.innerHTML='<strong></strong><p></p><a href="'+url+'" target="_blank" rel="noopener noreferrer"></a><a class="support-paypal" href="https://www.paypal.com/donate/?business=lynkomentor%40gmail.com&currency_code=CAD" target="_blank" rel="noopener noreferrer"></a>';
  var insta=document.createElement('a');insta.className='support-instapay';insta.href='https://ipn.eg/S/hsn.shehata/instapay/5hnldB';insta.target='_blank';insta.rel='noopener noreferrer';insta.onclick=function(e){if(window.ClearNative&&ClearNative.openInstaPaySupport){e.preventDefault();ClearNative.openInstaPaySupport();}};box.appendChild(insta);
  var plus=document.createElement('button');plus.type='button';plus.className='primary full support-plus';plus.onclick=function(){if(window.MorphPlus)MorphPlus.open();};box.insertBefore(plus,box.querySelector('a'));
  box.style.setProperty('--support-button-gap','10px');
  Array.prototype.forEach.call(box.querySelectorAll('a,button'),function(button){button.style.cssText='display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:100%;min-height:48px;margin:10px 0 0;padding:12px 16px;line-height:1.4;text-align:center';});
  box.querySelector('a').onclick=function(e){if(window.ClearNative&&ClearNative.openSupport){e.preventDefault();ClearNative.openSupport();}};
  box.querySelector('.support-paypal').onclick=function(e){if(window.ClearNative&&ClearNative.openPayPalSupport){e.preventDefault();ClearNative.openPayPalSupport();}};
  if(target.id==='page-connect'){box.classList.add('home-support');target.querySelector('.intro').after(box);}else target.insertBefore(box,target.firstChild);
 });
 paint();
});
window.addEventListener('morphLanguage',paint);
})();
