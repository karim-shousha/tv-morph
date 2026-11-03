(function(){'use strict';
 var grid=document.querySelector('.plus-grid');if(!grid)return;
 var links=null,plans=null,selected=null;
 var panel=document.createElement('section');panel.id='plus-manual-payment';panel.className='plus-panel manual-payment';panel.hidden=true;
 panel.innerHTML='<h2></h2><p class="manual-plan"></p><p class="manual-term"></p><ol><li class="manual-transfer"></li><li class="manual-receipt"></li><li class="manual-activation"></li></ol><p class="manual-reference" dir="ltr"></p><div class="manual-actions"><a class="manual-pay" target="_blank" rel="noopener noreferrer"></a><a class="manual-email"></a></div><p class="manual-note"></p><p class="manual-address" dir="ltr">support@morph-tv.com</p>';
 grid.after(panel);
 function tr(ar,en,fr){return document.documentElement.lang==='ar'?ar:document.documentElement.lang==='fr'?fr:en;}
 function price(plan,method){return method==='instapay'?(plan==='family'?120:60):plans.plans[plan].usd/100;}
 function title(plan){return plan==='family'?'Plus Family':'Plus';}
 function valid(){return !!(links&&plans&&plans.mode==='live'&&plans.enabled&&plans.offer&&plans.plans&&plans.plans.single&&plans.plans.family);}
 function reference(method,plan){var key='morph.plus.receipt-reference.'+method+'.'+plan,ref;try{ref=localStorage.getItem(key);}catch(e){}if(!ref){var bytes=new Uint8Array(6);crypto.getRandomValues(bytes);ref='MP-'+(method==='instapay'?'IP-':'PP-')+Array.from(bytes,function(b){return b.toString(16).padStart(2,'0');}).join('').toUpperCase();try{localStorage.setItem(key,ref);}catch(e){}}return ref;}
 function term(){return plans.offer.active?tr('مدى الحياة خلال عرض الإطلاق.','Lifetime during the launch offer.','À vie pendant l’offre de lancement.'):tr('تفعيل سنوي؛ التجديد يدوي.','Annual activation; manual renewal.','Activation annuelle ; renouvellement manuel.');}
 function paypalURL(plan,ref){
  // PayPal Payments Standard Buy Now: https://www.paypal.com/en_GB/pdf/PP_WebsitePaymentsStandard_IntegrationGuide.pdf
  var original=new URL(links.paypal),business=original.searchParams.get('business');
  if(original.protocol!=='https:'||!/(^|\.)paypal\.com$/i.test(original.hostname)||!business)throw Error('PayPal recipient unavailable');
  var url=new URL('https://www.paypal.com/cgi-bin/webscr');url.search=new URLSearchParams({cmd:'_xclick',business:business,item_name:'Morph TV '+title(plan)+' - '+(plan==='family'?'5 TVs':'1 TV'),item_number:ref,amount:price(plan,'paypal').toFixed(2),currency_code:'USD',quantity:'1',no_shipping:'1',return:'https://morph-tv.com/plus.html?manual=paypal&plan='+plan,cancel_return:'https://morph-tv.com/plus.html'}).toString();return url.href;
 }
 function instaURL(){var url=new URL(links.instapay);if(url.protocol!=='https:'||!/(^|\.)ipn\.eg$/i.test(url.hostname))throw Error('InstaPay recipient unavailable');return url.href;}
 function show(method,plan,scroll){
  if(!valid()||!['single','family'].includes(plan))return;var ref=reference(method,plan),amount=price(plan,method),currency=method==='instapay'?'EGP':'USD',provider=method==='instapay'?'InstaPay':'PayPal',devices=plan==='family'?5:1;
  var payURL;try{payURL=method==='instapay'?instaURL():paypalURL(plan,ref);}catch(e){return;}
  selected={method:method,plan:plan};panel.hidden=false;panel.querySelector('h2').textContent=tr('شراء Plus عبر ','Buy Plus with ','Acheter Plus avec ')+provider;
  panel.querySelector('.manual-plan').textContent=title(plan)+' · '+amount+' '+currency+' · '+devices+' '+(devices===1?tr('جهاز تلفزيون','TV','téléviseur'):tr('أجهزة تلفزيون','TVs','téléviseurs'));panel.querySelector('.manual-term').textContent=term();
  panel.querySelector('.manual-transfer').textContent=tr('حوّل مبلغ الباقة الموضح إلى حسابنا من زر الدفع أدناه.','Pay the plan amount shown using the payment button below.','Payez le montant indiqué avec le bouton ci-dessous.');
  panel.querySelector('.manual-receipt').textContent=tr('بعد التحويل، افتح رسالة الإيميل وأرفق صورة إيصال الدفع، مع اسم الباقة ورقم المرجع.','After payment, open the email and attach the payment receipt, including the plan and reference.','Après paiement, ouvrez l’e-mail et joignez le reçu avec la formule et la référence.');
  panel.querySelector('.manual-activation').textContent=tr('بعد مراجعة التحويل، نرسل كود التفعيل إلى نفس الإيميل.','After reviewing the payment, we send your activation code to the same email address.','Après vérification du paiement, nous envoyons le code à la même adresse e-mail.');
  panel.querySelector('.manual-reference').textContent=tr('مرجع الطلب: ','Order reference: ','Référence : ')+ref;
  var pay=panel.querySelector('.manual-pay');pay.href=payURL;pay.textContent=tr('فتح ','Open ','Ouvrir ')+provider;
  var body=[tr('طلب تفعيل Morph TV Plus','Morph TV Plus activation request','Demande d’activation Morph TV Plus'),'Plan: '+title(plan),'TV devices: '+devices,'Payment: '+provider,'Amount: '+amount+' '+currency,'Reference: '+ref,term(),'',tr('أرفقت إيصال التحويل. برجاء مراجعة الدفع وإرسال كود التفعيل إلى هذا الإيميل.','Please review the attached payment receipt and send the activation code to this email address.','Veuillez vérifier le reçu joint et envoyer le code à cette adresse e-mail.')].join('\r\n');
  var email=panel.querySelector('.manual-email');email.href='mailto:support@morph-tv.com?subject='+encodeURIComponent('Morph TV '+title(plan)+' - '+provider+' - '+ref)+'&body='+encodeURIComponent(body);email.textContent=tr('إرسال الإيصال بالإيميل','Email the payment receipt','Envoyer le reçu par e-mail');
  panel.querySelector('.manual-note').textContent=tr('أرفق الإيصال قبل إرسال الرسالة. التفعيل بعد المراجعة اليدوية؛ الضغط على زر الدفع لا يصدر كودًا تلقائيًا.','Attach the receipt before sending. Activation follows manual review; opening the payment link does not issue a code automatically.','Joignez le reçu avant l’envoi. L’activation suit une vérification manuelle ; ouvrir le paiement ne génère pas de code.');
  if(scroll){panel.scrollIntoView({behavior:'smooth',block:'start'});panel.querySelector('h2').tabIndex=-1;panel.querySelector('h2').focus({preventScroll:true});}
 }
 function paint(){grid.querySelectorAll('[data-manual-provider]').forEach(function(b){var method=b.dataset.manualProvider,plan=b.dataset.manualPlan;b.disabled=!valid();b.textContent=method==='instapay'?tr('InstaPay — ','InstaPay — ','InstaPay — ')+(plan==='family'?120:60)+' '+tr('جنيه','EGP','EGP'):'PayPal — $'+(plans&&plans.plans?plans.plans[plan].usd/100:plan==='family'?10:5)+' USD';});if(selected)show(selected.method,selected.plan,false);}
 grid.querySelectorAll('[data-plan]').forEach(function(stripe){var plan=stripe.dataset.plan,box=document.createElement('div');box.className='manual-plan-buttons';['paypal','instapay'].forEach(function(method){var b=document.createElement('button');b.type='button';b.dataset.manualProvider=method;b.dataset.manualPlan=plan;b.disabled=true;b.onclick=function(){show(method,plan,true);};box.appendChild(b);});stripe.after(box);});
 new MutationObserver(paint).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});paint();
 Promise.all([fetch('/support-links.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error();return r.json();}),fetch('/api/plus/plans',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error();return r.json();})]).then(function(v){links=v[0];plans=v[1];instaURL();paypalURL('single','CHECK');paint();var q=new URLSearchParams(location.search);if(q.get('manual')==='paypal')show('paypal',q.get('plan'),true);}).catch(function(){links=null;plans=null;paint();});
})();
