/* TV-only presentation. Uses the existing account, library and native player. */
(function () {
  'use strict';
  const television=/width=1920/.test(document.querySelector('meta[name=viewport]').content);
  if(television)document.documentElement.setAttribute('data-tv-library','');else document.documentElement.setAttribute('data-phone-episodes','');
  const $ = id => document.getElementById(id), api = window.IptvTvBridge, t = api.translate;
  const section = document.querySelector('main>section');
  const preview = document.createElement('aside');
  preview.id = 'tv-live-preview';
  preview.innerHTML = '<div class="tv-preview-art"><img id="tv-channel-logo" alt=""><span>▶</span></div><span class="eyebrow" id="tv-preview-label"></span><h2 id="tv-channel-name" dir="auto"></h2><p id="tv-preview-hint"></p><button id="tv-channel-play"></button><button id="tv-channel-guide"></button><button id="tv-channel-favorite"></button>';
  if(!television)preview.hidden=true;section.appendChild(preview);$('tv-channel-favorite').hidden=true;$('tv-channel-favorite').tabIndex=-1;
  const detailCopy=document.querySelector('.detail-copy'),detailActions=document.querySelector('.detail-actions'),detailScroll=document.createElement('div');detailScroll.className='tv-detail-scroll';detailScroll.tabIndex=0;detailScroll.setAttribute('aria-label',t('تفاصيل العنوان','Title details'));Array.from(detailCopy.children).forEach(node=>{if(node!==detailActions)detailScroll.appendChild(node);});detailCopy.insertBefore(detailScroll,detailActions);
  let previewTimer=null;let channel = null, lastChannel = null, detailId = '', episodePage = 0, episodeGeneration = 0, episodeRows = [], episodeAnchor = '', episodeSeries = null, detailEntry = '';
  const episodePanel = document.createElement('section');
  episodePanel.id = 'tv-series-episodes'; episodePanel.hidden = true;
  episodePanel.innerHTML = '<div class="tv-episode-toolbar"><h3 id="tv-episodes-title"></h3><label for="tv-season" id="tv-season-label"></label><select id="tv-season"></select><button id="tv-episodes-prev"></button><button id="tv-episodes-next"></button></div><p id="tv-episodes-status" role="status"></p><div id="tv-episode-list"></div>';
  document.querySelector('.details-dialog').appendChild(episodePanel);
  const seasonSelect=$('tv-season'),seasonPanel=document.createElement('section');seasonPanel.id='tv-season-panel';seasonPanel.hidden=true;seasonPanel.setAttribute('role','dialog');seasonPanel.setAttribute('aria-modal','true');seasonPanel.innerHTML='<h3 id="tv-season-title"></h3><div id="tv-season-options"></div>';document.querySelector('.details-dialog').appendChild(seasonPanel);
  const seasonControl=television?document.createElement('button'):seasonSelect;
  function closeSeason(restore=true){seasonPanel.hidden=true;seasonControl.setAttribute('aria-expanded','false');if(restore)focus(seasonControl);}
  const seasonChips=document.createElement('nav');seasonChips.id='tv-season-chips';seasonChips.setAttribute('aria-label',t('المواسم','Seasons'));episodePanel.querySelector('.tv-episode-toolbar').prepend(seasonChips);
  function paintSeason(){if(television)seasonControl.textContent=seasonSelect.options[seasonSelect.selectedIndex]?.textContent||t('كل المواسم','All seasons');seasonChips.textContent='';Array.from(seasonSelect.options).forEach(option=>{const button=document.createElement('button');button.textContent=option.textContent;button.setAttribute('aria-pressed',String(option.value===seasonSelect.value));button.onclick=()=>{seasonSelect.value=option.value;seasonSelect.dispatchEvent(new Event('change'));paintSeason();focus(Array.from(seasonChips.children).find(b=>b.getAttribute('aria-pressed')==='true'));};seasonChips.appendChild(button);});}
  seasonControl.addEventListener('keydown',event=>{if(event.keyCode===40&&seasonChips.children.length){event.preventDefault();event.stopImmediatePropagation();focus(seasonChips.querySelector('[aria-pressed=true]')||seasonChips.firstChild);}},true);
  document.addEventListener('keydown',event=>{if(!seasonChips.contains(document.activeElement)||![37,38,39,40].includes(event.keyCode))return;event.preventDefault();event.stopImmediatePropagation();const buttons=Array.from(seasonChips.children),index=buttons.indexOf(document.activeElement);if(event.keyCode===37||event.keyCode===39)focus(buttons[Math.max(0,Math.min(buttons.length-1,index+(event.keyCode===39?1:-1)))]);else if(event.keyCode===38)focus(document.querySelector('.detail-actions button:not([hidden]):not(:disabled)'));else focus(document.querySelector('.tv-episode')||seasonControl);},true);
  if(television){seasonControl.id='tv-season-open';seasonControl.type='button';seasonControl.setAttribute('aria-haspopup','dialog');seasonControl.setAttribute('aria-controls','tv-season-panel');seasonControl.setAttribute('aria-expanded','false');seasonSelect.before(seasonControl);seasonSelect.hidden=true;seasonSelect.tabIndex=-1;$('tv-season-label').htmlFor=seasonControl.id;seasonControl.onclick=()=>{const options=$('tv-season-options');options.textContent='';$('tv-season-title').textContent=t('الموسم','Season');Array.from(seasonSelect.options).forEach(option=>{const button=document.createElement('button');button.textContent=option.textContent;button.dataset.season=option.value;button.setAttribute('aria-pressed',String(option.value===seasonSelect.value));button.onclick=()=>{seasonSelect.value=option.value;paintSeason();closeSeason();seasonSelect.dispatchEvent(new Event('change'));};options.appendChild(button);});seasonPanel.hidden=false;seasonControl.setAttribute('aria-expanded','true');focus(options.querySelector('[aria-pressed="true"]')||options.firstChild);};}
  document.addEventListener('keydown',event=>{if(seasonPanel.hidden)return;const code=event.keyCode;if(![13,27,10009,461,37,38,39,40].includes(code))return;event.preventDefault();event.stopImmediatePropagation();if([27,10009,461].includes(code)){closeSeason();return;}const rows=Array.from($('tv-season-options').children),index=rows.indexOf(document.activeElement);if(code===13){if(!event.repeat&&rows[index])rows[index].click();}else if(code===38||code===40)focus(rows[Math.max(0,Math.min(rows.length-1,index+(code===40?1:-1)))]);},true);
  const detailFavorite = document.createElement('button');
  detailFavorite.id = 'tv-detail-favorite';detailFavorite.hidden=true;detailFavorite.tabIndex=-1;
  document.querySelector('.detail-actions').appendChild(detailFavorite);
  detailFavorite.onclick = () => {
    const item = api.getState().detailItem;
    if (item) { api.toggle(item); detailFavorite.textContent = favoriteLabel(item);detailFavorite.setAttribute('aria-pressed',String(api.isFavorite(item))); focus(detailFavorite); }
  };
  function favoriteLabel(item) { detailFavorite.classList.toggle('favorite-heart-active',api.isFavorite(item));return t('المفضلة', 'Favourite'); }
  const detailTrailer = document.createElement('button');
  detailTrailer.id = 'tv-detail-trailer';detailTrailer.hidden=true;detailTrailer.tabIndex=-1;
  document.querySelector('.detail-actions').appendChild(detailTrailer);
  function trailerTarget(item) {
    if (!item || (item.kind !== 'vod' && item.kind !== 'series')) return null;
    const id = String(item.trailerYoutubeId || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(id)) return { id };
    const name = String(item.seriesName || item.name || '').replace(/\s+/g, ' ').trim();
    if (!name) return null;
    const year = /^\d{4}$/.test(String(item.year || '')) ? ' ' + item.year : '';
    return { query: name + year };
  }
  function openTrailer(item) {
    const target = trailerTarget(item); if (!target) return;
    if (window.IptvNative && typeof IptvNative.openTrailer === 'function') { try { IptvNative.openTrailer(target.id || target.query); } catch (e) { if (api.notice) api.notice(t('تعذّر فتح التريلر.', 'Could not open the trailer.'), 'error'); } return; }
    if (api.notice) api.notice(t('فتح التريلر غير مدعوم على هذا الجهاز.', 'Trailer playback is not supported on this device.'), 'error');
  }
  detailTrailer.onclick = () => { const item = api.getState().detailItem; if (item) { openTrailer(item); focus(detailTrailer); } };
  function trailerLabel(exact) { return 'YouTube · ' + t('تريلر', 'Trailer'); }
  function image(node, value) {
    try { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol)) throw Error(); if(node.getAttribute('src')!==url.href)node.src = url.href; node.hidden = false; }
    catch (e) { node.removeAttribute('src'); node.hidden = true; }
    node.onerror = () => { node.hidden = true; };
  }
  function focus(node) { if(node){const rail=node.closest('main>aside');if(rail){try{node.focus({preventScroll:true});}catch(e){node.focus();}const a=node.getBoundingClientRect(),b=rail.getBoundingClientRect();if(a.top<b.top+12)rail.scrollTop-=b.top+12-a.top;if(a.bottom>b.bottom-12)rail.scrollTop+=a.bottom-b.bottom+12;}else if(node.closest('#items')&&window.IptvCinemaNavigation&&IptvCinemaNavigation.revealCard){try{node.focus({preventScroll:true});}catch(e){node.focus();}IptvCinemaNavigation.revealCard(node);}else{node.focus();node.scrollIntoView({block:'nearest',inline:'nearest'});}}return true;}
  let liveTimer=null,livePreviewId='',previewSupported=false;
  try{previewSupported=television&&window.IptvNative&&typeof IptvNative.preview==='function'&&typeof IptvNative.supportsLivePreview==='function'&&IptvNative.supportsLivePreview();}catch(e){}
  function previewVisible(){return previewSupported&&channel&&api.getState().kind==='live'&&!document.body.classList.contains('channel-grid')&&$('dashboard').hidden&&$('settings-panel').hidden&&$('details-panel').hidden&&$('epg-panel').hidden&&!document.hidden&&preview.getBoundingClientRect().width>0;}
  function stopLivePreview(){clearTimeout(liveTimer);liveTimer=null;if(livePreviewId){livePreviewId='';try{IptvNative.stopPreview();}catch(e){}}preview.classList.remove('tv-preview-playing');}
  function queueLivePreview(){clearTimeout(liveTimer);if(!previewVisible()||window.IptvParental&&(IptvParental.isHidden(channel)||IptvParental.isLocked(channel))){stopLivePreview();return;}const item=channel,id=String(item.id);if(livePreviewId===id)return;stopLivePreview();liveTimer=setTimeout(()=>{if(!previewVisible()||!channel||String(channel.id)!==id)return;const art=preview.querySelector('.tv-preview-art'),box=art.getBoundingClientRect();if(box.width<40||box.height<30)return;livePreviewId=id;$('tv-preview-hint').textContent=t('جاري تحميل معاينة القناة…','Loading channel preview…');try{IptvNative.preview(JSON.stringify({kind:'live',id:item.id,category:item.category||'',x:box.left,y:box.top,width:box.width,height:box.height,viewportWidth:innerWidth,viewportHeight:innerHeight}));}catch(e){livePreviewId='';}},700);}
  document.addEventListener('focusin',event=>{if(!event.target.closest('#items .tile,#tv-live-preview'))stopLivePreview();});
  new MutationObserver(()=>{if(!previewVisible())stopLivePreview();}).observe(document.body,{attributes:true,attributeFilter:['class','data-kind']});
  ['dashboard','settings-panel','details-panel','epg-panel'].forEach(id=>new MutationObserver(()=>{if(!previewVisible())stopLivePreview();}).observe($(id),{attributes:true,attributeFilter:['hidden']}));
  window.addEventListener('focus',()=>{if(document.activeElement.closest('#items .tile,#tv-live-preview'))queueLivePreview();});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLivePreview();});window.addEventListener('resize',()=>{stopLivePreview();if(document.activeElement.closest('#items .tile,#tv-live-preview'))queueLivePreview();});
  function selectChannel(item) {
    channel = item; lastChannel = api.key(item);
    clearTimeout(previewTimer);previewTimer=setTimeout(()=>{if(channel&&api.key(channel)===api.key(item))image($('tv-channel-logo'),item.icon);},120);
    $('tv-channel-name').textContent = item.name;queueLivePreview();
    $('tv-preview-label').textContent = t('القنوات المباشرة', 'LIVE TV');
    $('tv-preview-hint').textContent = t('اضغط OK على القناة للتشغيل بملء الشاشة', 'Press OK on a channel to play full screen');
    $('tv-channel-play').textContent = t('▶ تشغيل القناة', '▶ Play channel');
    $('tv-channel-guide').textContent = t('دليل البرامج', 'Programme guide');
    $('tv-channel-favorite').textContent = t('المفضلة', 'Favourite');$('tv-channel-favorite').classList.toggle('favorite-heart-active',api.isFavorite(item));
  }
  $('tv-channel-play').onclick = () => { if (channel) api.call('play', channel).catch(e => { $('tv-preview-hint').textContent = e.message; }); };
  $('tv-channel-guide').onclick = () => { if (channel) api.openEpg(channel); };
  $('tv-channel-favorite').onclick = () => { if (channel) { api.toggle(channel); selectChannel(channel); } };
  function decorate() {
    if(!television)return;const state = api.getState();
    document.querySelectorAll('#categories button').forEach(b => {
      const active = !!b.dataset.category && b.dataset.category === state.category;
      b.classList.toggle('active', active); b.setAttribute('aria-current', active ? 'true' : 'false');
      if (active) $('section-title').textContent = b.textContent;
    });
    document.querySelectorAll('#items .tile').forEach(b => {
      const item = b._item; if (!item) return;
      b.dir = 'auto';
      if (item.kind === 'live') {
        b.classList.toggle('tv-selected-channel', api.key(item) === lastChannel);
        const favorite = b.parentElement.querySelector('.tv-live-favorite');if(favorite)favorite.remove();
      } else if (item.rating && !b.querySelector('.tv-rating')) {
        const badge = document.createElement('span'); badge.className = 'tv-rating'; badge.textContent = '★ ' + item.rating; b.appendChild(badge);
      }
    });
    if (state.kind === 'live') {
      const visibleTiles = Array.from(document.querySelectorAll('#items .tile')), first = visibleTiles[0];
      if (first && (!channel || !visibleTiles.some(b => api.key(b._item) === lastChannel))) selectChannel(first._item);
      if (!first) { channel = null; $('tv-channel-name').textContent = t('اختر قناة', 'Choose a channel'); $('tv-channel-logo').hidden = true; }
      ['tv-channel-play','tv-channel-guide','tv-channel-favorite'].forEach(id => { $(id).disabled = !channel; });
    }
  }
  new MutationObserver(decorate).observe($('items'), {childList:true});
  new MutationObserver(decorate).observe($('categories'), {childList:true});
  document.addEventListener('focusin', e => {
    const tile = e.target.closest('.tile');
    if (television && tile && tile._item && tile._item.kind === 'live') { selectChannel(tile._item);const previous=document.querySelector('#items .tv-selected-channel');if(previous&&previous!==tile)previous.classList.remove('tv-selected-channel');tile.classList.add('tv-selected-channel'); }
  });
  function paintEpisodeFavorite(row){if(!row||!row._episode)return;const saved=api.isFavorite(row._episode);let star=row.querySelector('.episode-favorite-star');if(!star){star=document.createElement('span');star.className='episode-favorite-star';star.textContent='♥';star.setAttribute('aria-hidden','true');row.appendChild(star);}star.hidden=!saved;row.classList.toggle('episode-is-favorite',saved);row.setAttribute('aria-label',row._episode.name+(saved?t(' · مفضلة',' · Favorite'):''));}
  window.addEventListener('iptvFavoritesChanged',()=>{document.querySelectorAll('.tv-episode').forEach(paintEpisodeFavorite);});
  async function loadEpisodes(item) {
    const generation = ++episodeGeneration;
    $('tv-episode-list').textContent = '';
    $('tv-episodes-status').textContent = t('جاري تحميل الحلقات…', 'Loading episodes…');
    $('tv-episodes-prev').disabled = true; $('tv-episodes-next').disabled = true;
    try {
      const season = $('tv-season').value;
      const saved = api.savedProgress ? await api.savedProgress('episode').catch(()=>[]) : [];
      const continuing = saved.find(episode=>String(episode.seriesId||episode.category||'')===String(item.id));
      const continuingId = continuing ? String(continuing.id) : '';
      let result = await api.call('list', {kind:'episode', category:item.id, page:episodePage, search:season ? 'S' + season + ' · ' : ''});while(episodeAnchor&&!(result.items||[]).some(e=>String(e.id)===episodeAnchor)&&result.hasMore&&episodePage<999){if(generation!==episodeGeneration||detailId!==item.id)return;episodePage++;result=await api.call('list',{kind:'episode',category:item.id,page:episodePage,search:season?'S'+season+' · ':''});}
      if (generation !== episodeGeneration || detailId !== item.id) return;
      episodeRows = (result.items || []).map(episode=>Object.assign({},episode,{seriesId:String(item.id),seriesName:item.name||episode.seriesName||'',seriesPoster:item.seriesPoster||item.icon||'',seriesCategory:item.category_id||item.category||item.seriesCategory||''}));
      episodeRows.forEach(episode => {
        const row = document.createElement('button'); row.className = 'tv-episode'; row.dir = 'auto';row.dataset.episodeId=String(episode.id);const current=String(episode.id)===continuingId;row.classList.toggle('is-continue-episode',current);if(current)row.setAttribute('aria-current','true');
        const art = document.createElement('img'); art.alt = ''; image(art, episode.icon || item.icon);
        const copy = document.createElement('span'), name = document.createElement('strong'), meta = document.createElement('small'), plot = document.createElement('span');
        const code=String(episode.name||'').match(/S(\d+)\s*[· .-]*E?(\d+)?/i),sn=episode.season||(code&&code[1]),en=episode.episode||episode.episode_num||(code&&code[2]);name.textContent = episode.name; meta.textContent = [sn?t('الموسم ','Season ')+sn:'',en?t('الحلقة ','Episode ')+en:'',episode.duration, episode.rating ? '★ ' + episode.rating : '', episode.resumeMs > 0 ? t('استكمال المشاهدة', 'Continue watching') : ''].filter(Boolean).join(' · ');
        plot.textContent = episode.plot || ''; plot.className = 'tv-episode-plot'; copy.append(name, meta, plot);if(current){const badge=document.createElement('span');badge.className='episode-continue-label';badge.textContent=t('متابعة المشاهدة','Continue watching');copy.prepend(badge);} row.append(art, copy);
        row._episode=Object.assign({},episode,{seriesId:String(item.id),category:String(item.id),seriesCategory:item.category_id||item.category||item.seriesCategory||'',seriesName:item.name,icon:episode.icon||item.icon});row.onclick = () => api.call('play', row._episode).catch(e => { $('tv-episodes-status').textContent = e.message; });
        paintEpisodeFavorite(row);$('tv-episode-list').appendChild(row);
      });
      $('tv-episodes-status').textContent = result.total ? result.total + t(' حلقة', ' episodes') : t('المزوّد لم يوفّر حلقات لهذا الموسم.', 'Your provider has no episodes for this season.');
      $('tv-episodes-prev').disabled = episodePage === 0;
      $('tv-episodes-next').disabled = !result.hasMore;if(episodeAnchor){const selected=Array.from($('tv-episode-list').children).find(e=>e.dataset.episodeId===episodeAnchor);episodeAnchor='';if(selected)focus(selected);}
    } catch (e) { if (generation === episodeGeneration) $('tv-episodes-status').textContent = t('تعذّر تحميل الحلقات. استخدم عرض الحلقات للمحاولة من المكتبة.', 'Could not load episodes. Use View episodes to try from the library.')+(String(e.message||'').match(/HTTP [1-5][0-9]{2}/)?' · '+String(e.message).match(/HTTP [1-5][0-9]{2}/)[0]:''); }
  }
  $('tv-season').onchange = () => { paintSeason();episodeAnchor='';episodePage = 0; loadEpisodes(episodeSeries); };
  $('tv-episodes-prev').onclick = () => { if (episodePage > 0) { episodePage--; loadEpisodes(episodeSeries); } };
  $('tv-episodes-next').onclick = () => { episodePage++; loadEpisodes(episodeSeries); };
  let episodeHold=null,episodeHeld=null,episodeLong=false,ignoreEpisodeClickUntil=0;
  function cancelEpisodeHold(){clearTimeout(episodeHold);episodeHold=null;episodeHeld=null;}
  function beginEpisodeHold(row){if(episodeHeld===row)return;cancelEpisodeHold();episodeHeld=row;episodeLong=false;episodeHold=setTimeout(()=>{if(episodeHeld!==row||!row.isConnected||$('details-panel').hidden)return;episodeLong=true;ignoreEpisodeClickUntil=Date.now()+700;api.toggle(row._episode);focus(row);if(api.notice)api.notice(api.isFavorite(row._episode)?t('تم حفظ الحلقة في المفضلة','Episode saved to favorites'):t('تمت إزالة الحلقة من المفضلة','Episode removed from favorites'),'success');},650);}
  document.addEventListener('keydown',e=>{const row=e.target.closest&&e.target.closest('.tv-episode');if(e.keyCode!==13||!row)return;e.preventDefault();e.stopImmediatePropagation();beginEpisodeHold(row);},true);
  document.addEventListener('keyup',e=>{if(e.keyCode!==13||!episodeHeld)return;e.preventDefault();e.stopImmediatePropagation();const row=episodeHeld,held=episodeLong;cancelEpisodeHold();if(!held&&row.isConnected)row.click();},true);
  episodePanel.addEventListener('pointerdown',e=>{const row=e.target.closest('.tv-episode');if(row)beginEpisodeHold(row);});
  episodePanel.addEventListener('contextmenu',e=>{const row=e.target.closest('.tv-episode');if(!row)return;e.preventDefault();if(!episodeLong){cancelEpisodeHold();episodeLong=true;ignoreEpisodeClickUntil=Date.now()+800;api.toggle(row._episode);if(api.notice)api.notice(api.isFavorite(row._episode)?t('تم حفظ الحلقة في المفضلة','Episode saved to favorites'):t('تمت إزالة الحلقة من المفضلة','Episode removed from favorites'),'success');}});episodePanel.addEventListener('pointerup',()=>{cancelEpisodeHold();});episodePanel.addEventListener('pointercancel',cancelEpisodeHold);
  episodePanel.addEventListener('click',e=>{if(Date.now()<ignoreEpisodeClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('focusout',e=>{if(e.target===episodeHeld)cancelEpisodeHold();},true);window.addEventListener('blur',cancelEpisodeHold);
  window.TvIptvLayout = {
    adjacentEpisode(id,delta){const index=episodeRows.findIndex(e=>String(e.id)===String(id));return index<0?null:episodeRows[index+delta]||null;},
    async continueSeries(item){const button=$('detail-episodes');if(button.disabled)return;button.disabled=true;try{const saved=await api.savedProgress('episode');let target=saved.find(e=>String(e.seriesId||e.category||'')===String(item.id));if(!target){target=episodeRows[0];if(!target){const result=await api.call('list',{kind:'episode',category:String(item.id),page:0,search:''});target=(result.items||[])[0];}}if(!target){$('tv-episodes-status').textContent=t('لا توجد حلقات متاحة.','No episodes available.');return;}await api.call('play',Object.assign({},target,{seriesId:String(item.id),category:String(item.id),seriesCategory:item.category_id||item.category||item.seriesCategory||'',seriesName:item.name,icon:target.icon||item.icon}));}catch(e){$('tv-episodes-status').textContent=e.message;}finally{button.disabled=false;}},
    stopLivePreview,
    resumeLivePreview(){if(document.activeElement.closest('#items .tile,#tv-live-preview'))queueLivePreview();},
    previewState(id,state){if(String(id)!==livePreviewId)return;preview.classList.toggle('tv-preview-playing',state==='playing');$('tv-preview-hint').textContent=state==='playing'?t('معاينة مباشرة بدون صوت · اضغط OK لملء الشاشة','Muted live preview · Press OK for full screen'):t('المعاينة غير متاحة لهذه القناة · اضغط OK لتجربة التشغيل','Preview unavailable for this channel · Press OK to try playback');},
    resumeEpisode(item){const parent=api.getState().detailItem;if(!parent||parent.kind!=='series')return;episodeAnchor=String(item.id);episodePage=0;$('tv-season').value='';loadEpisodes(parent);},
    back(){if(!seasonPanel.hidden){closeSeason();return true;}return false;},
    closeDetails() { closeSeason(false);detailId = ''; ++episodeGeneration; episodeRows = []; episodePanel.hidden = true; document.querySelector('.details-dialog').classList.remove('tv-series-detail'); },
    details(item) {$('detail-close').hidden=true;detailFavorite.hidden=!['vod','series','episode'].includes(item.kind);detailFavorite.tabIndex=detailFavorite.hidden?-1:0;detailFavorite.setAttribute('aria-pressed',String(api.isFavorite(item)));
      const trailerSupported = !!(window.IptvNative && typeof IptvNative.openTrailer === 'function');
      const trailer = trailerSupported ? trailerTarget(item) : null;
      detailTrailer.hidden = !trailer;detailTrailer.tabIndex = detailTrailer.hidden ? -1 : 0;
      if (trailer) { detailTrailer.textContent='';const mark=document.createElement('span');mark.className='trailer-youtube-mark';mark.setAttribute('aria-hidden','true');const label=document.createElement('span');label.className='trailer-action-label';label.textContent=t('تريلر','Trailer');detailTrailer.append(mark,label); detailTrailer.setAttribute('aria-label', trailer.id ? t('تشغيل تريلر الفيلم من يوتيوب', 'Play the movie trailer from YouTube') : t('بحث يوتيوب عن تريلر الفيلم', 'Search YouTube for the movie trailer')); }
      const entry=item.kind+':'+item.id;
      detailFavorite.textContent = favoriteLabel(item);
      const parent=String(item.seriesId||item.category||'');const episode=item.kind==='episode'&&/^\d{1,14}$/.test(parent);const series=item.kind==='series'||episode;episodeSeries=episode?{id:parent,kind:'series',name:item.seriesName||'',icon:item.seriesPoster||item.icon||'',seasons:item.seasons||[],episodeAnchor:String(item.id)}:series?item:null;if(series)item=episodeSeries;episodePanel.hidden=!series;
      document.querySelector('.details-dialog').classList.toggle('tv-series-detail', series);
      if (!series) {detailEntry='';detailId='';++episodeGeneration;episodeRows=[];episodeAnchor='';return;}
      $('tv-episodes-title').hidden=true; $('tv-season-label').textContent = t('الموسم', 'Season');
      $('tv-episodes-prev').textContent = t('السابق', 'Previous'); $('tv-episodes-next').textContent = t('التالي', 'Next');
      const newItem = detailId !== item.id || detailEntry!==entry;
      if (newItem) { detailEntry=entry;episodeAnchor=String(item.episodeAnchor||'');detailId = item.id; episodePage = 0; $('tv-season').textContent = ''; }
      const seasons = Array.isArray(item.seasons) ? item.seasons : [];
      const signature = JSON.stringify(seasons);
      if (newItem || $('tv-season').dataset.signature !== signature) {
        const selected = $('tv-season').value; $('tv-season').textContent = '';
        const all = document.createElement('option'); all.value = ''; all.textContent = t('كل المواسم', 'All seasons'); $('tv-season').appendChild(all);
        seasons.forEach(s => { const option = document.createElement('option'); option.value = String(s); option.textContent = t('الموسم ', 'Season ') + s; $('tv-season').appendChild(option); });
        $('tv-season').value = selected; $('tv-season').dataset.signature = signature;
      }
      paintSeason();if (newItem) loadEpisodes(item);
    },
    move(code) {
      const current = document.activeElement;
      if(current===detailScroll&&(code===38||code===40)){const end=detailScroll.scrollHeight-detailScroll.clientHeight;if(code===40&&detailScroll.scrollTop>=end-2)focus(document.querySelector('.detail-actions button:not([hidden]):not(:disabled)'));else detailScroll.scrollTop=Math.max(0,Math.min(end,detailScroll.scrollTop+(code===40?64:-64)));return true;}
      if(!television&&$('details-panel').hidden)return false;
      if (!$('details-panel').hidden) {
        if(code===38&&current.closest('.detail-actions'))return focus(detailScroll);
        const rows = Array.from(document.querySelectorAll('.tv-episode')), index = rows.indexOf(current);
        if(code===38&&current.closest('#tv-season-chips'))return focus(Array.from(document.querySelectorAll('.detail-actions button')).find(b=>!b.hidden&&!b.disabled&&b.id!=='detail-close'&&b!==detailFavorite));
        if(code===40&&current.closest('#tv-season-chips'))return rows.length?focus(rows[0]):false;
        if(code===38&&(current===seasonControl||current===$('tv-episodes-prev')||current===$('tv-episodes-next')))return focus(Array.from(document.querySelectorAll('.detail-actions button')).find(b=>!b.hidden&&!b.disabled&&b.id!=='detail-close'&&b!==detailFavorite));
        if (index >= 0 && (code === 38 || code === 40)) return focus(code === 38 ? rows[index-1] || seasonChips.querySelector('[aria-pressed=true]') || seasonChips.querySelector('button') || seasonControl : rows[index+1] || rows[index]);
        if(code===40&&current.closest('.detail-actions'))return focus(seasonChips.querySelector('[aria-pressed=true]')||seasonChips.querySelector('button')||seasonControl);if(code===40&&current===seasonControl)return rows.length?focus(rows[0]):false;
        return false;
      }
      if (!$('settings-panel').hidden || !$('epg-panel').hidden || !$('dashboard').hidden) return false;
      const tiles = Array.from(document.querySelectorAll('#items .tile'));
      if (code === 38 && tiles.includes(current)) {
        const rowTop = current.parentElement.offsetTop;
        if (!tiles.some(tile => tile.parentElement.offsetTop < rowTop - 2)) return focus($('unified-query'));
      }
      if (code === 40 && (current === $('unified-query') || current === $('unified-go'))) return focus(tiles.find(b => api.key(b._item) === lastChannel) || tiles[0]);
      if (api.getState().kind === 'live' && tiles.includes(current)) {
        const index = tiles.indexOf(current);
        if (code === 38 || code === 40) return focus(tiles[index + (code === 38 ? -1 : 1)] || (code === 38 ? $('unified-query') : current));
        if (code === 39) return focus($('tv-channel-play'));
        if (code === 37) return focus(document.querySelector('#categories button.active') || document.querySelector('#library-special button.active') || $('browse-favorites'));
      }
      if (current.closest('#tv-live-preview') && code === 37) return focus(tiles.find(b => api.key(b._item) === lastChannel) || tiles[0]);
      if (tiles.includes(current)) {
        const a=current.getBoundingClientRect(),ax=a.left+a.width/2,ay=a.top+a.height/2;let best=null,score=Infinity;
        tiles.forEach(tile=>{if(tile===current)return;const b=tile.getBoundingClientRect(),dx=b.left+b.width/2-ax,dy=b.top+b.height/2-ay;if(code===37&&dx>=-2||code===39&&dx<=2||code===38&&dy>=-2||code===40&&dy<=2)return;const horizontal=code===37||code===39,cost=Math.abs(horizontal?dx:dy)+Math.abs(horizontal?dy:dx)*3;if(cost<score){score=cost;best=tile;}});
        if(best)return focus(best);if(code===37)return focus(document.querySelector('#categories button.active')||document.querySelector('#library-special button.active') || $('browse-favorites'));if(code===38)return focus($('unified-query'));if(code===40)return focus(!$('next').hidden?$('next'):!$('prev').hidden?$('prev'):current);return focus(current);
      }

      // Only inspect the next category: measuring every provider category on each
      // D-pad press forces a full layout pass on older Samsung browsers.
      if (current.closest('#library-special,#categories')) {
        const rail = Array.from(document.querySelectorAll('#library-special button,#categories button'));
        const index = rail.indexOf(current);
        if (code === 38 || code === 40) {
          const step=code===38?-1:1;let next=index+step;
          while(next>=0&&next<rail.length){const candidate=rail[next];if(!candidate.hidden&&!candidate.disabled&&!candidate.closest('[hidden]')&&candidate.offsetWidth&&candidate.offsetHeight)return focus(candidate);next+=step;}
          return focus(code===38?$('home-open'):current);
        }
        if (code === 39 && tiles.length) return focus(tiles[0]);
      }
      return false;
    }
  };
})();
