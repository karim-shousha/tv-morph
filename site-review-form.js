'use strict';
let reviewData,reviewReadyAt=0;
const reviewText=(ar,en)=>document.documentElement.lang==='en'?en:ar;
function reviewFormHTML(){return '<form id="public-review-form" class="public-review-form" data-user-content="true"><h2 id="write"></h2><p class="public-review-intro"></p><div class="public-review-stars" role="group" aria-label="Rating">'+[1,2,3,4,5].map(n=>'<button type="button" data-score="'+n+'" aria-pressed="false" aria-label="'+n+' / 5">★</button>').join('')+'</div><label for="public-review-name"></label><input id="public-review-name" maxlength="50" autocomplete="nickname" dir="auto"><label for="public-review-comment"></label><textarea id="public-review-comment" maxlength="1500" rows="4" dir="auto"></textarea><div class="public-review-trap" aria-hidden="true"><label for="public-review-website">Website</label><input id="public-review-website" autocomplete="off" tabindex="-1"></div><small class="public-review-privacy"></small><button class="btn primary" type="submit"></button><p class="public-review-result" role="status" aria-live="polite"></p></form>';}
function labelReviewForm(){
 const f=document.getElementById('public-review-form');if(!f)return;
 f.querySelector('h2').textContent=reviewText('شاركنا تجربتك','Share your experience');
 f.querySelector('.public-review-intro').textContent=reviewText('اختار تقييمك، واكتب تعليقًا لو حابب.','Choose a rating and add a comment if you like.');
 f.querySelector('label[for=public-review-name]').textContent=reviewText('الاسم الظاهر (اختياري)','Display name (optional)');
 f.querySelector('label[for=public-review-comment]').textContent=reviewText('تعليقك (اختياري)','Your comment (optional)');
 f.querySelector('.public-review-privacy').textContent=reviewText('التقييم يدخل في المتوسط فورًا؛ التعليقات تُراجع قبل النشر. لا تكتب بيانات شخصية أو بيانات اشتراكك.','Ratings count immediately; comments are moderated before publication. Do not include personal information or IPTV credentials.');
 f.querySelector('[type=submit]').textContent=reviewText('إرسال التقييم','Submit review');
}
function bindReviewForm(data){
 const f=document.getElementById('public-review-form');if(!f)return;reviewData=data;reviewReadyAt=Date.now()+2100;labelReviewForm();if(f.dataset.bound)return;f.dataset.bound='1';let score=data.mine?.rating||0,busy=false;
 const paint=()=>f.querySelectorAll('[data-score]').forEach(b=>{b.classList.toggle('chosen',Number(b.dataset.score)<=score);b.setAttribute('aria-pressed',String(Number(b.dataset.score)===score));});
 if(data.mine){f.querySelector('input').value=data.mine.name==='Visitor'?'':data.mine.name||'';f.querySelector('textarea').value=data.mine.comment||'';}
 f.querySelectorAll('[data-score]').forEach(b=>b.onclick=()=>{score=Number(b.dataset.score);paint();});paint();
 f.onsubmit=async e=>{
  e.preventDefault();if(busy)return;const result=f.querySelector('.public-review-result'),submit=f.querySelector('[type=submit]');
  if(!score){result.textContent=reviewText('اختار من نجمة إلى خمس نجوم.','Choose one to five stars.');return;}
  if(Date.now()<reviewReadyAt){result.textContent=reviewText('انتظر ثانيتين وحاول مرة أخرى.','Please wait two seconds and retry.');return;}
  if(!reviewData?.csrf){result.textContent=reviewText('تعذّر تحميل نموذج التقييم. حدّث الصفحة.','The review form could not load. Refresh the page.');return;}
  busy=true;submit.disabled=true;result.textContent=reviewText('جاري الحفظ…','Saving…');
  try{
   const response=await fetch('/api/community/review',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({csrf:reviewData.csrf,rating:score,name:f.querySelector('input').value.trim(),comment:f.querySelector('textarea').value.trim(),website:document.getElementById('public-review-website').value})});
   const value=await response.json();if(!response.ok){result.textContent=response.status===429?reviewText('محاولات كثيرة. حاول لاحقًا.','Too many attempts. Please try later.'):value.error==='refresh_and_wait'?reviewText('حدّث الصفحة وانتظر ثانيتين ثم أعد المحاولة.','Refresh, wait two seconds and retry.'):reviewText('تعذّر الحفظ. حاول مرة أخرى.','Could not save. Please retry.');return;}
   await loadReviews();result.textContent=!value.ratingVisible?reviewText('تم الحفظ، والمشاركة في انتظار المراجعة.','Saved. Your submission is awaiting moderation.'):value.commentState==='pending'?reviewText('تم تسجيل تقييمك. تعليقك في انتظار المراجعة قبل النشر.','Your rating is saved. Your comment is awaiting moderation.'):reviewText('تم تسجيل تقييمك. شكرًا لمساعدتنا!','Your rating is saved. Thank you!');
  }catch{result.textContent=reviewText('تعذّر الحفظ. راجع الاتصال وحاول مجددًا.','Could not save. Check your connection and retry.');}
  finally{busy=false;submit.disabled=false;}
 };
}
window.addEventListener('morphlanguagechange',labelReviewForm);
