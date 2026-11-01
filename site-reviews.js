'use strict';
function reviewsPage(){return `<section class="reviews-page section wrap"><div class="eyebrow">رأيكم بيطوّر التجربة</div><h1>جرّبت Morph؟ قول لنا رأيك.</h1><p class="reviews-intro">تقييمات الزوار من الموقع الرسمي. رأيك يساعد غيرك، وملاحظاتك تساعدنا نحسّن MorphTV.</p><div class="reviews-summary"><div><span class="review-large-star" aria-hidden="true">★</span><strong id="reviews-average" dir="ltr">—</strong><span id="reviews-count">جاري تحميل التقييمات…</span></div><div><h2>تجربتك تفرق معانا.</h2><p>شارك تقييمك أو اكتب ملاحظاتك من صفحة التقييمات الأصلية.</p><a class="btn primary" href="#reviews/write">اكتب تقييمك ↗</a></div></div>${reviewFormHTML()}<div class="section-heading"><h2>آراء مجتمع MorphTV</h2><p>تعليقات الزوار المنشورة بعد المراجعة.</p></div><div id="reviews-list" class="reviews-list" aria-live="polite"><p>جاري تحميل التقييمات…</p></div><p class="section-footnote" id="reviews-source"></p></section>`;}
async function loadReviews(){
  const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  try{
    const response=await fetch(local?'community-stats.json':'/api/community',{cache:'no-store',credentials:'same-origin'});
    if(!response.ok)throw Error();
    const data=await response.json();bindReviewForm(data);const list=document.getElementById('reviews-list');if(!list)return;
    document.getElementById('reviews-average').textContent=data.stats.average===null?'—':data.stats.average+' / 5';
    const en=document.documentElement.lang==='en';
    document.getElementById('reviews-count').textContent=data.stats.ratingCount+(en?' visitor ratings':' تقييم من الزوار');
    list.replaceChildren();
    for(const review of data.comments||[]){
      const card=document.createElement('article');card.className='visitor-review';card.dataset.userContent='true';
      const head=document.createElement('div');head.className='visitor-review-header';
      const name=document.createElement('strong');name.dir='auto';name.textContent=review.name==='Visitor'?(en?'Visitor':'زائر'):review.name;
      const stars=document.createElement('span');stars.className='review-stars-display';stars.textContent='★'.repeat(Math.max(0,Math.min(5,review.rating)))+'☆'.repeat(Math.max(0,5-review.rating));stars.setAttribute('aria-label',review.rating+'/5');
      const text=document.createElement('p');text.dir='auto';text.textContent=review.comment;
      const date=document.createElement('time');date.dateTime=new Date(review.updated*1000).toISOString();date.textContent=new Date(review.updated*1000).toLocaleDateString(en?'en-GB':'ar-EG');
      head.append(name,stars);card.append(head,text,date);list.append(card);
    }
    if(!list.children.length)list.textContent=en?'No published comments yet. Be the first to share your experience.':'لسه مفيش تعليقات منشورة. شاركنا أول رأي.';
    document.getElementById('reviews-source').textContent=local?(en?'Official website data · Last updated: ':'بيانات الموقع الرسمي · آخر تحديث: ')+new Date(data.fetchedAt).toLocaleDateString(en?'en-GB':'ar-EG'):(en?'Live ratings from the official website.':'تقييمات مباشرة من الموقع الرسمي.');
    window.applyLanguage?.();
  }catch{const list=document.getElementById('reviews-list');if(list)list.textContent=document.documentElement.lang==='en'?'Reviews are temporarily unavailable. You can still visit the original reviews page.':'التقييمات غير متاحة حاليًا. تقدر تفتح صفحة التقييمات الأصلية.';}
}
