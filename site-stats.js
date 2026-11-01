'use strict';
(async function loadCommunityStats(){
  const localPreview=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const status=document.getElementById('stats-status');
  try{
    // The static local preview uses a dated copy of the existing public API.
    // On the official host, always read the original live counters.
    const response=await fetch(localPreview?'community-stats.json':'/api/community',{cache:'no-store',credentials:'same-origin'});
    if(!response.ok)throw new Error('Stats unavailable');
    const data=await response.json(),stats=data.stats;
    if(!stats||!Number.isFinite(stats.downloads)||!Number.isFinite(stats.ratingCount)||!(stats.average===null||Number.isFinite(stats.average)))throw new Error('Invalid stats');
    const number=new Intl.NumberFormat('en-US',{maximumFractionDigits:2});
    function paintStats(){
    const en=document.documentElement.lang==='en';
    document.getElementById('live-downloads').textContent=number.format(stats.downloads);
    document.getElementById('live-rating').textContent=stats.average===null?'—':number.format(stats.average)+' / 5';
    document.getElementById('live-rating-count').textContent=stats.ratingCount?number.format(stats.ratingCount)+(en?' MorphTV visitor ratings':' تقييم من زوار MorphTV'):(en?'No ratings yet':'لسه مفيش تقييمات');
    status.textContent=localPreview?(en?'Official website data · Updated ':'الأرقام من الموقع الرسمي · آخر تحديث ')+new Date(data.fetchedAt).toLocaleString(en?'en-GB':'ar-EG',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):(en?'MorphTV website statistics · Visitor ratings':'أرقام MorphTV من الموقع · التقييمات من الزوار');
    }
    paintStats();window.addEventListener('morphlanguagechange',paintStats);
  }catch{
    status.textContent='الأرقام غير متاحة حاليًا · افتح التقييمات للاطلاع على المصدر';
  }
})();
