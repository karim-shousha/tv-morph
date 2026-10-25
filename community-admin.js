(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); }, csrf = '', next = null, busy = false;
  function node(tag, text, cls) { var e = document.createElement(tag); e.textContent = text; if (cls) e.className = cls; return e; }
  async function request(path, body) {
    var r = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) } : { credentials: 'same-origin', cache: 'no-store' });
    var value = await r.json(); if (!r.ok) { var error = new Error(value.error); error.status = r.status; throw error; } return value;
  }
  async function load(append) {
    try {
      var data = await request('/api/admin/reviews?state=' + $('admin-filter').value + (append && next ? '&before=' + next : ''));
      csrf = data.csrf; next = data.next; $('admin-login').hidden = true; $('admin-content').hidden = false;
      $('admin-summary').textContent = 'تنزيلات: ' + data.stats.downloads + ' · التقييم: ' + (data.stats.average === null ? 'لا يوجد' : data.stats.average + '/5') + ' · عدد التقييمات: ' + data.stats.ratingCount + ' · تعليقات معلّقة: ' + data.pending;
      if (!append) $('admin-reviews').textContent = '';
      if (!data.reviews.length && !append) $('admin-reviews').appendChild(node('p', 'لا توجد مشاركات في هذا القسم.'));
      data.reviews.forEach(function (review) {
        var article = node('article', '', 'visitor-review');
        var title = node('h3', review.name + ' · ' + review.rating + '/5'); title.dir = 'auto';
        var comment = node('p', review.comment || '(تقييم بدون تعليق)'); comment.dir = 'auto';
        var metadata = node('small', review.state + ' · ' + new Date(review.updated * 1000).toLocaleString('ar-EG') + (review.rating_visible ? '' : ' · التقييم مخفي'));
        var buttons = node('div', '', 'admin-toolbar');
        [['approve', 'نشر التعليق'], ['reject', 'إخفاء التعليق'], ['spam', 'إخفاء كسبام (التقييم والتعليق)'], ['restore_rating', 'إعادة إظهار التقييم']].forEach(function (action) {
          if (action[0] === 'approve' && !review.comment) return;
          if (action[0] === 'restore_rating' && review.rating_visible) return;
          var button = node('button', action[1], 'secondary'); button.type = 'button';
          button.onclick = async function () {
            if (busy) return; busy = true; button.disabled = true;
            try { await request('/api/admin/moderate', { id: review.id, action: action[0], csrf: csrf }); await load(); $('admin-status').textContent = 'تم الحفظ.'; }
            catch (_) { $('admin-status').textContent = 'تعذّر الحفظ. أعد تسجيل الدخول إذا انتهت الجلسة.'; }
            finally { busy = false; button.disabled = false; }
          }; buttons.appendChild(button);
        }); article.append(title, metadata, comment, buttons); $('admin-reviews').appendChild(article);
      }); $('admin-more').hidden = !next;
    } catch (e) { if (e.status === 401) { $('admin-login').hidden = false; $('admin-content').hidden = true; } else $('admin-status').textContent = 'الخدمة غير متاحة حاليًا.'; }
  }
  $('admin-login').onsubmit = async function (event) {
    event.preventDefault(); if (busy) return; busy = true;
    try { await request('/api/admin/login', { password: $('admin-password').value }); $('admin-password').value = ''; $('admin-status').textContent = ''; await load(); }
    catch (e) { $('admin-status').textContent = e.status === 429 ? 'محاولات كثيرة. انتظر ١٥ دقيقة.' : e.message === 'admin_not_configured' ? 'كلمة مرور الإدارة لم تُضبط على السيرفر بعد.' : 'تعذّر الدخول. راجع كلمة المرور.'; }
    finally { busy = false; }
  };
  $('admin-filter').onchange = function () { load(); }; $('admin-refresh').onclick = function () { load(); };
  $('admin-more').onclick = function () { load(true); };
  $('admin-logout').onclick = async function () { try { await request('/api/admin/logout', { csrf: csrf }); location.reload(); } catch (_) { $('admin-status').textContent = 'تعذّر تسجيل الخروج. أعد المحاولة.'; } };
  load();
})();
