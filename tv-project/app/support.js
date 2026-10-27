(function(){'use strict';
 window.addEventListener('load',function(){
  var panel=document.getElementById('setting-theme').closest('.settings-panel');if(!panel)return;
  var button=document.createElement('button');button.className='setting';button.id='setting-support';function paint(){button.textContent=MorphLocale.t('♥ ادعم مورف تي في →','♥ Support Morph TV →');}paint();window.addEventListener('morphLanguage',paint);button.setAttribute('data-no-translate','');panel.appendChild(button);
  button.onclick=function(){
   var C=window.ClearTV,previous=document.activeElement,overlay=document.createElement('div');overlay.className='overlay';
   overlay.innerHTML='<section class="modal support-modal" role="dialog" aria-modal="true" aria-label="Support Morph TV"><h2>ادعم Morph TV ♥</h2><p>Optional one-time support for app development. Choose your amount.</p><div class="support-codes"><div><strong>Stripe</strong><img src="assets/support-stripe.webp" width="300" height="300" alt="Scan with your phone to support Morph TV through Stripe"></div><div><strong>PayPal</strong><img src="assets/support-paypal.webp" width="300" height="300" alt="Scan to support Morph TV through PayPal"></div></div><p>Scan with your phone to open a support page.</p><div class="support-actions"><button data-pay="stripe">الدعم عبر Stripe ↗</button><button data-pay="paypal">الدعم عبر PayPal ↗</button><button class="primary" data-close>Close</button></div></section>';
   document.body.appendChild(overlay);var close=overlay.querySelector('[data-close]');overlay.querySelectorAll('[data-pay]').forEach(function(b){b.onclick=function(){window.open(b.getAttribute('data-pay')==='stripe'?'https://donate.stripe.com/9B66oI2xb4yCdar0VB6EU03':'https://www.paypal.com/donate/?business=lynkomentor%40gmail.com&currency_code=CAD','_blank','noopener');};});C.Focus.setScope(overlay);C.Focus.focus(close);
   function done(){overlay.remove();C.Focus.setScope(document);C.Focus.focus(previous);document.removeEventListener('keydown',back,true);}
   function back(e){if(e.key==='Escape'||e.keyCode===27||e.keyCode===10009||e.keyCode===461){e.preventDefault();e.stopImmediatePropagation();done();}}
   close.onclick=done;document.addEventListener('keydown',back,true);
  };
 });
})();
