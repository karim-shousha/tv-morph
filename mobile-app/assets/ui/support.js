(function(){'use strict';window.addEventListener('load',function(){
 var url='https://donate.stripe.com/9B66oI2xb4yCdar0VB6EU03';
 document.querySelectorAll('#page-studio').forEach(function(target){
  var box=document.createElement('div');box.className='morph-support';box.innerHTML='<strong>ادعم Morph TV ♥</strong><p>دعم اختياري لتطوير التطبيق، بالمبلغ اللي تختاره، بدون اشتراك تلقائي.</p><a href="'+url+'" target="_blank" rel="noopener noreferrer">الدعم عبر Stripe ↗</a><a class="support-paypal" href="https://www.paypal.com/donate/?business=lynkomentor%40gmail.com&currency_code=CAD" target="_blank" rel="noopener noreferrer">الدعم عبر PayPal ↗</a>';
  box.querySelector('a').onclick=function(e){if(window.ClearNative&&ClearNative.openSupport){e.preventDefault();ClearNative.openSupport();}};
  box.querySelector('.support-paypal').onclick=function(e){if(window.ClearNative&&ClearNative.openPayPalSupport){e.preventDefault();ClearNative.openPayPalSupport();}};
  target.insertBefore(box,target.firstChild);
 });
});})();
