(function () {
  'use strict';
  var state = null, rating = 0, busy = false, readyAt = 0, comments = [], cursor = null;
  var $ = function (id) { return document.getElementById(id); };
  var words = {
    communityNav: ['التقييمات', 'Reviews'], communityTag: ['رأيكم بيطوّر التجربة', 'Built with your feedback'],
    communityTitle: ['جرّبت Morph TV؟ قول لنا رأيك.', 'Tried Morph TV? Tell us what you think.'],
    communityIntro: ['تقييمك يساعد الناس تختار، وملاحظاتك تساعدنا نحسّن التطبيق.', 'Your rating helps others choose, and your feedback helps us improve.'],
    downloadLabel: ['تنزيلات من الموقع', 'Downloads from this website'], ratingLabel: ['متوسط تقييم الزوار', 'Visitor rating'],
    countingNote: ['العداد بدأ من يوم تفعيله؛ بيحسب طلبات تنزيل الملفات مع استبعاد الروبوتات المعروفة والتكرار خلال ١٠ دقائق. مش عدد التثبيتات أو المستخدمين.', 'Counting starts when this feature was enabled. Counts file download requests, excluding known bots and repeats within ten minutes. This is not an install or user count.'],
    reviewTitle: ['إيه رأيك في التجربة؟', 'How was your experience?'], ratingPrompt: ['اختار تقييمك', 'Choose your rating'],
    reviewName: ['الاسم الظاهر (اختياري)', 'Display name (optional)'], reviewComment: ['تعليقك (اختياري)', 'Your comment (optional)'],
    reviewSubmit: ['إرسال التقييم', 'Submit rating'], reviewPrivacy: ['النجوم بتدخل في المتوسط فورًا. التعليق والاسم الظاهر بيتنشروا بعد المراجعة؛ ما تكتبش بيانات خاصة. بنستخدم ملف ارتباط لحفظ تقييم واحد لكل متصفح، وتقدر تحدّثه.', 'Stars count immediately. Your comment and display name become public after moderation; do not include private information. A cookie keeps one rating per browser, which you can update.'],
    visitorComments: ['تعليقات الزوار', 'Visitor comments'], commentsEmpty: ['لسه مفيش تعليقات منشورة. شاركنا أول رأي.', 'No published comments yet. Share your experience.'],
    moreComments: ['تعليقات أكتر', 'More comments'], visitor: ['زائر', 'Visitor'],
    ratingEmpty: ['لسه مفيش تقييمات', 'No ratings yet'], ratingCount: ['تقييم', 'ratings'], loading: ['جاري تحميل الأرقام…', 'Loading live numbers…'],
    offline: ['الأرقام والتقييمات مش متاحة حاليًا. جرّب التحديث بعد شوية.', 'Numbers and reviews are temporarily unavailable. Try refreshing shortly.'],
    pickRating: ['اختار من نجمة إلى خمس نجوم الأول.', 'Choose one to five stars first.'], wait: ['استنى ثانيتين بعد تحميل الصفحة وبعدين جرّب.', 'Wait two seconds after loading, then try again.'],
    saved: ['اتحفظ تقييمك ودخل في المتوسط. شكرًا لمساعدتنا!', 'Your rating is saved and included in the average. Thank you!'],
    pending: ['اتحفظ تقييمك فورًا، وتعليقك في انتظار المراجعة قبل النشر.', 'Your rating is counted immediately. Your comment is awaiting moderation.'],
    held: ['اتحفظت المشاركة، وهي في انتظار مراجعة الإدارة.', 'Your submission is saved and awaiting moderation.'],
    limited: ['في محاولات كتير دلوقتي؛ جرّب بعد شوية.', 'Too many attempts. Please try again later.'],
    failed: ['تعذّر الحفظ. راجع الاتصال وحاول تاني.', 'Could not save. Check your connection and try again.'],
    moderationPending: ['تعليقك الحالي في انتظار المراجعة.', 'Your current comment is awaiting moderation.'],
    moderationApproved: ['تعليقك الحالي منشور. أي تعديل هيتراجع من جديد.', 'Your comment is published. Edits require moderation again.'],
    started: ['العدّ بدأ: ', 'Counting since: '],
    star: ['نجوم', 'stars']
  };
  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'ar'; }
  function t(key) { return words[key][lang() === 'ar' ? 0 : 1]; }
  function number(value) { return new Intl.NumberFormat(lang() === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 1 }).format(value); }
  function el(tag, text, cls) { var node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (cls) node.className = cls; return node; }
  function paintStars() {
    document.querySelectorAll('#review-stars button').forEach(function (button) {
      var value = Number(button.dataset.rating);
      button.classList.toggle('chosen', value <= rating);
      button.setAttribute('aria-pressed', String(value === rating));
      button.setAttribute('aria-label', number(value) + ' / ' + number(5) + ' ' + t('star'));
    });
    $('rating-selection').textContent = rating ? number(rating) + ' / ' + number(5) : t('ratingPrompt');
  }
  function paint() {
    document.querySelectorAll('[data-community-copy]').forEach(function (node) { node.textContent = t(node.dataset.communityCopy); });
    paintStars();
    if (state) {
      $('download-total').textContent = number(state.stats.downloads);
      $('download-live-count').textContent = number(state.stats.downloads) + ' · ' + t('downloadLabel');
      $('download-started').textContent = t('started') + new Date(state.stats.started * 1000).toLocaleDateString(lang() === 'ar' ? 'ar-EG' : 'en-GB');
      $('rating-average').textContent = state.stats.average === null ? '—' : number(state.stats.average) + ' / ' + number(5);
      $('rating-count').textContent = state.stats.ratingCount ? number(state.stats.ratingCount) + ' ' + t('ratingCount') : t('ratingEmpty');
      $('community-availability').textContent = '';
      var mine = state.mine;
      $('review-current').textContent = mine && mine.comment ? (mine.state === 'approved' ? t('moderationApproved') : mine.state === 'pending' ? t('moderationPending') : '') : '';
    }
    var host = $('community-comments'); host.textContent = '';
    if (!comments.length) host.appendChild(el('p', state ? t('commentsEmpty') : t('loading'), 'comments-empty'));
    comments.forEach(function (review) {
      var article = el('article', undefined, 'visitor-review'), header = el('div', undefined, 'visitor-review-header');
      var name = el('strong', review.name === 'Visitor' ? t('visitor') : review.name); name.dir = 'auto';
      var stars = el('span', '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating), 'review-stars-display');
      stars.setAttribute('aria-label', review.rating + '/5'); header.append(name, stars);
      var text = el('p', review.comment); text.dir = 'auto';
      var date = el('time', new Date(review.updated * 1000).toLocaleDateString(lang() === 'ar' ? 'ar-EG' : 'en-GB'));
      date.dateTime = new Date(review.updated * 1000).toISOString(); article.append(header, text, date); host.appendChild(article);
    });
    $('comments-more').hidden = !cursor;
  }
  async function load(before, preserveForm) {
    var response = await fetch('/api/community' + (before ? '?before=' + before : ''), { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) throw Error();
    var value = await response.json();
    state = value; cursor = value.next;
    comments = before ? comments.concat(value.comments) : value.comments;
    readyAt = Date.now() + 2200;
    if (!before && value.mine && !preserveForm) {
      rating = value.mine.rating; $('review-name').value = value.mine.name === 'Visitor' ? '' : value.mine.name;
      $('review-comment').value = value.mine.comment;
    }
    paint();
  }
  document.querySelectorAll('#review-stars button').forEach(function (button) {
    button.onclick = function () { rating = Number(button.dataset.rating); paintStars(); };
    button.onkeydown = function (event) {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); var direction = (event.key === 'ArrowRight' ? 1 : -1);
      var next = Math.max(1, Math.min(5, Number(button.dataset.rating) + direction));
      var target = document.querySelector('#review-stars [data-rating="' + next + '"]'); target.focus(); target.click();
    };
  });
  $('review-form').onsubmit = async function (event) {
    event.preventDefault(); if (busy) return;
    if (!rating) { $('review-result').textContent = t('pickRating'); return; }
    if (!state) { $('review-result').textContent = t('offline'); return; }
    if (Date.now() < readyAt) { $('review-result').textContent = t('wait'); return; }
    busy = true; $('review-submit').disabled = true; $('review-result').textContent = t('loading');
    try {
      var response = await fetch('/api/community/review', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrf: state.csrf, rating: rating, name: $('review-name').value.trim(), comment: $('review-comment').value.trim(), website: $('review-website').value }) });
      var value = await response.json();
      if (!response.ok) { $('review-result').textContent = response.status === 429 ? t('limited') : value.error === 'refresh_and_wait' ? t('wait') : t('failed'); if (value.error === 'refresh_and_wait') await load(null, true); return; }
      await load(null, true); $('review-result').textContent = !value.ratingVisible ? t('held') : value.commentState === 'pending' ? t('pending') : t('saved');
    } catch (_) { $('review-result').textContent = t('failed'); }
    finally { busy = false; $('review-submit').disabled = false; }
  };
  $('comments-more').onclick = function () {
    if (busy || !cursor) return; busy = true; $('comments-more').disabled = true;
    load(cursor, true).catch(function () { $('community-availability').textContent = t('offline'); }).finally(function () { busy = false; $('comments-more').disabled = false; });
  };
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  paint(); load().catch(function () { $('community-availability').textContent = t('offline'); $('community-comments').textContent = ''; });
})();
