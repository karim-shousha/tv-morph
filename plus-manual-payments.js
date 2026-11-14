(function () {
  'use strict';
  const grid = document.querySelector('.plus-grid');
  if (!grid) return;
  const tr = (ar,en,fr) => document.documentElement.lang==='ar' ? ar : document.documentElement.lang==='fr' ? fr : en;
  const panel = document.createElement('section');
  panel.className = 'plus-panel manual-payment';
  panel.hidden = true;
  panel.innerHTML = '<h2>InstaPay</h2><p class="manual-plan"></p><a class="manual-pay" target="_blank" rel="noopener noreferrer">InstaPay</a><form class="manual-receipt-form"><label><span></span><input name="email" type="email" autocomplete="email" required maxlength="254"></label><label><span></span><input name="reference" required minlength="6" maxlength="55"></label><label><span></span><input name="receipt" type="file" accept="image/jpeg,image/png,image/webp" required></label><button type="submit"></button></form><p class="manual-status" role="status"></p>';
  grid.after(panel);
  const form = panel.querySelector('form');
  const status = panel.querySelector('.manual-status');
  let plans, transferURL, selected;
  function paint() {
    const labels = [
      tr('البريد لاستلام الكود','Email for the activation code','E-mail pour recevoir le code'),
      tr('رقم العملية في الإيصال','Transfer reference on the receipt','Référence du virement'),
      tr('صورة إيصال التحويل','Transfer receipt image','Image du reçu')
    ];
    form.querySelectorAll('label span').forEach((label,index) => label.textContent=labels[index]);
    form.querySelector('button').textContent=tr('إرسال للمراجعة','Submit for review','Envoyer pour vérification');
    grid.querySelectorAll('[data-manual-provider]').forEach(button=>{
      const method=button.dataset.manualProvider, plan=plans?.plans[button.dataset.manualPlan];
      button.hidden=!plan||!plans.paymentMethods?.[method]||(method==='instapay'&&!transferURL);
      if(plan)button.textContent=method==='paypal'?'PayPal · $'+plan.usd/100:'InstaPay · '+plan.egp+' EGP';
    });
  }
  function openTransfer(plan) {
    selected=plan;
    panel.hidden=false;
    panel.querySelector('.manual-plan').textContent=tr('حوّل ','Transfer ','Virez ')+plans.plans[plan].egp+' EGP. '+tr('أرفق الإيصال بعد التحويل. هنراجعه مع التحويل الوارد.','Attach the receipt after transferring. We check it against the incoming transfer.','Joignez le reçu après le virement. Nous vérifions le paiement reçu.');
    panel.querySelector('.manual-pay').href=transferURL;
    panel.scrollIntoView({block:'start'});
  }
  function readImage(file) {
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=reject;
      reader.onload=()=>resolve(String(reader.result).split(',')[1]);
      reader.readAsDataURL(file);
    });
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const button=form.querySelector('button');
    const file=form.elements.receipt.files[0];
    if(button.disabled||!selected||!file)return;
    if(file.size>2*1024*1024){
      status.textContent=tr('اختار صورة حجمها ٢ ميجابايت أو أقل.','Choose an image up to 2 MB.','Choisissez une image de 2 Mo maximum.');
      return;
    }
    button.disabled=true;
    try{
      await window.MorphPlusPurchase.receipt({plan:selected,planId:plans.plans[selected].id,expectedEntitlement:plans.offer.active?'lifetime':'annual',
        email:form.elements.email.value,reference:form.elements.reference.value,image:await readImage(file)});
      form.reset();
      status.textContent=tr('استلمنا الإيصال. احتفظ برقم العملية لحد ما المراجعة تخلص.','Receipt received. Keep your transfer reference until review is complete.','Reçu reçu. Conservez la référence jusqu’à la fin de la vérification.');
    }catch(error){
      status.textContent=tr('تعذّر إرسال الإيصال. راجع البيانات وحجم الصورة وحاول مرة تانية.','Could not submit the receipt. Check the details and image size, then try again.','Impossible d’envoyer le reçu. Vérifiez les détails et la taille de l’image.');
    }finally{button.disabled=false;}
  });
  grid.querySelectorAll('[data-plan]').forEach(stripe=>{
    const key=stripe.dataset.plan;
    const actions=document.createElement('div');
    actions.className='manual-plan-buttons';
    for(const method of ['paypal','instapay']){
      const button=document.createElement('button');
      button.type='button';
      button.hidden=true;
      button.dataset.manualProvider=method;
      button.dataset.manualPlan=key;
      button.onclick=async()=>{
        if(method==='instapay'){openTransfer(key);return;}
        button.disabled=true;
        try{await window.MorphPlusPurchase.checkout({id:plans.plans[key].id,entitlement:plans.offer.active?'lifetime':'annual'});}
        catch(error){
          document.getElementById('plus-result').textContent=tr('تعذّر فتح PayPal. جرّب تاني.','Could not open PayPal. Try again.','Impossible d’ouvrir PayPal. Réessayez.');
          button.disabled=false;
        }
      };
      actions.append(button);
    }
    stripe.after(actions);
  });
  new MutationObserver(paint).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  paint();
  Promise.all(['/api/plus/plans','/support-links.json'].map(url=>fetch(url,{cache:'no-store'}).then(r=>r.json()))).then(([info,links])=>{
    plans=info;
    try{
      const url=new URL(links.instapay);
      if(url.protocol==='https:'&&/(^|\.)ipn\.eg$/.test(url.hostname))transferURL=url.href;
    }catch(error){}
    paint();
  }).catch(()=>{});
})();
