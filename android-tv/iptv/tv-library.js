/* TV-only presentation. Uses the existing account, library and native player. */
(function () {
  'use strict';
  if (!/width=1920/.test(document.querySelector('meta[name=viewport]').content)) return;
  document.documentElement.setAttribute('data-tv-library', '');
  const $ = id => document.getElementById(id), api = window.IptvTvBridge, t = api.translate;
  const section = document.querySelector('main>section');
  const preview = document.createElement('aside');
  preview.id = 'tv-live-preview';
  preview.innerHTML = '<div class="tv-preview-art"><img id="tv-channel-logo" alt=""><span>▶</span></div><span class="eyebrow" id="tv-preview-label"></span><h2 id="tv-channel-name" dir="auto"></h2><p id="tv-preview-hint"></p><button id="tv-channel-play"></button><button id="tv-channel-guide"></button><button id="tv-channel-favorite"></button>';
  section.appendChild(preview);$('tv-channel-favorite').hidden=true;$('tv-channel-favorite').tabIndex=-1;
  let previewTimer=null;let channel = null, lastChannel = null, detailId = '', episodePage = 0, episodeGeneration = 0, episodeRows = [];
  const episodePanel = document.createElement('section');
  episodePanel.id = 'tv-series-episodes'; episodePanel.hidden = true;
  episodePanel.innerHTML = '<div class="tv-episode-toolbar"><h3 id="tv-episodes-title"></h3><label for="tv-season" id="tv-season-label"></label><select id="tv-season"></select><button id="tv-episodes-prev"></button><button id="tv-episodes-next"></button></div><p id="tv-episodes-status" role="status"></p><div id="tv-episode-list"></div>';
  document.querySelector('.details-dialog').appendChild(episodePanel);
  const detailFavorite = document.createElement('button');
  detailFavorite.id = 'tv-detail-favorite';
  document.querySelector('.detail-actions').appendChild(detailFavorite);
  detailFavorite.onclick = () => {
    const item = api.getState().detailItem;
    if (item) { api.toggle(item); detailFavorite.textContent = favoriteLabel(item); focus(detailFavorite); }
  };
  function favoriteLabel(item) { return (api.getState().favorites.some(f => api.key(f) === api.key(item)) ? '♥ ' : '♡ ') + t('المفضلة', 'Favourite'); }
  function image(node, value) {
    try { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol)) throw Error(); if(node.getAttribute('src')!==url.href)node.src = url.href; node.hidden = false; }
    catch (e) { node.removeAttribute('src'); node.hidden = true; }
    node.onerror = () => { node.hidden = true; };
  }
  function focus(node) { if (node) { node.focus(); node.scrollIntoView({block:'nearest', inline:'nearest'}); } return true; }
  function selectChannel(item) {
    channel = item; lastChannel = api.key(item);
    clearTimeout(previewTimer);previewTimer=setTimeout(()=>{if(channel&&api.key(channel)===api.key(item))image($('tv-channel-logo'),item.icon);},120);
    $('tv-channel-name').textContent = item.name;
    $('tv-preview-label').textContent = t('القنوات المباشرة', 'LIVE TV');
    $('tv-preview-hint').textContent = t('اضغط OK على القناة للتشغيل بملء الشاشة', 'Press OK on a channel to play full screen');
    $('tv-channel-play').textContent = t('▶ تشغيل القناة', '▶ Play channel');
    $('tv-channel-guide').textContent = t('دليل البرامج', 'Programme guide');
    $('tv-channel-favorite').textContent = (api.getState().favorites.some(f => api.key(f) === api.key(item)) ? '★ ' : '☆ ') + t('المفضلة', 'Favourite');
  }
  $('tv-channel-play').onclick = () => { if (channel) api.call('play', channel).catch(e => { $('tv-preview-hint').textContent = e.message; }); };
  $('tv-channel-guide').onclick = () => { if (channel) api.openEpg(channel); };
  $('tv-channel-favorite').onclick = () => { if (channel) { api.toggle(channel); selectChannel(channel); } };
  function decorate() {
    const state = api.getState();
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
    if (tile && tile._item && tile._item.kind === 'live') { selectChannel(tile._item);const previous=document.querySelector('#items .tv-selected-channel');if(previous&&previous!==tile)previous.classList.remove('tv-selected-channel');tile.classList.add('tv-selected-channel'); }
  });
  async function loadEpisodes(item) {
    const generation = ++episodeGeneration;
    $('tv-episode-list').textContent = '';
    $('tv-episodes-status').textContent = t('جاري تحميل الحلقات…', 'Loading episodes…');
    $('tv-episodes-prev').disabled = true; $('tv-episodes-next').disabled = true;
    try {
      const season = $('tv-season').value;
      const result = await api.call('list', {kind:'episode', category:item.id, page:episodePage, search:season ? 'S' + season + ' · ' : ''});
      if (generation !== episodeGeneration || detailId !== item.id) return;
      episodeRows = result.items || [];
      episodeRows.forEach(episode => {
        const row = document.createElement('button'); row.className = 'tv-episode'; row.dir = 'auto';
        const art = document.createElement('img'); art.alt = ''; image(art, episode.icon || item.icon);
        const copy = document.createElement('span'), name = document.createElement('strong'), meta = document.createElement('small'), plot = document.createElement('span');
        name.textContent = episode.name; meta.textContent = [episode.duration, episode.rating ? '★ ' + episode.rating : '', episode.resumeMs > 0 ? t('استكمال المشاهدة', 'Continue watching') : ''].filter(Boolean).join(' · ');
        plot.textContent = episode.plot || ''; plot.className = 'tv-episode-plot'; copy.append(name, meta, plot); row.append(art, copy);
        row.onclick = () => api.call('play', Object.assign({}, episode, {icon:episode.icon || item.icon, category:String(item.id), seriesName:item.name})).catch(e => { $('tv-episodes-status').textContent = e.message; });
        $('tv-episode-list').appendChild(row);
      });
      $('tv-episodes-status').textContent = result.total ? result.total + t(' حلقة', ' episodes') : t('المزوّد لم يوفّر حلقات لهذا الموسم.', 'Your provider has no episodes for this season.');
      $('tv-episodes-prev').disabled = episodePage === 0;
      $('tv-episodes-next').disabled = !result.hasMore;
    } catch (e) { if (generation === episodeGeneration) $('tv-episodes-status').textContent = t('تعذّر تحميل الحلقات. استخدم عرض الحلقات للمحاولة من المكتبة.', 'Could not load episodes. Use View episodes to try from the library.'); }
  }
  $('tv-season').onchange = () => { episodePage = 0; loadEpisodes(api.getState().detailItem); };
  $('tv-episodes-prev').onclick = () => { if (episodePage > 0) { episodePage--; loadEpisodes(api.getState().detailItem); } };
  $('tv-episodes-next').onclick = () => { episodePage++; loadEpisodes(api.getState().detailItem); };
  window.TvIptvLayout = {
    closeDetails() { detailId = ''; ++episodeGeneration; episodeRows = []; episodePanel.hidden = true; document.querySelector('.details-dialog').classList.remove('tv-series-detail'); },
    details(item) {
      detailFavorite.textContent = favoriteLabel(item);
      const series = item.kind === 'series'; episodePanel.hidden = !series;
      document.querySelector('.details-dialog').classList.toggle('tv-series-detail', series);
      if (!series) return;
      $('tv-episodes-title').textContent = t('الحلقات', 'Episodes'); $('tv-season-label').textContent = t('الموسم', 'Season');
      $('tv-episodes-prev').textContent = t('السابق', 'Previous'); $('tv-episodes-next').textContent = t('التالي', 'Next');
      const newItem = detailId !== item.id;
      if (newItem) { detailId = item.id; episodePage = 0; $('tv-season').textContent = ''; }
      const seasons = Array.isArray(item.seasons) ? item.seasons : [];
      const signature = JSON.stringify(seasons);
      if (newItem || $('tv-season').dataset.signature !== signature) {
        const selected = $('tv-season').value; $('tv-season').textContent = '';
        const all = document.createElement('option'); all.value = ''; all.textContent = t('كل المواسم', 'All seasons'); $('tv-season').appendChild(all);
        seasons.forEach(s => { const option = document.createElement('option'); option.value = String(s); option.textContent = t('الموسم ', 'Season ') + s; $('tv-season').appendChild(option); });
        $('tv-season').value = selected; $('tv-season').dataset.signature = signature;
      }
      if (newItem) loadEpisodes(item);
    },
    move(code) {
      const current = document.activeElement;
      if (!$('details-panel').hidden) {
        const rows = Array.from(document.querySelectorAll('.tv-episode')), index = rows.indexOf(current);
        if (index >= 0 && (code === 38 || code === 40)) return focus(code === 38 ? rows[index-1] || $('tv-season') : rows[index+1] || rows[index]);
        if (code === 40 && (current.closest('.detail-actions') || current === $('tv-season'))) return rows.length ? focus(rows[0]) : false;
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
        if (code === 37) return focus(document.querySelector('#categories button.active') || $('browse-all'));
      }
      if (current.closest('#tv-live-preview') && code === 37) return focus(tiles.find(b => api.key(b._item) === lastChannel) || tiles[0]);
      if (tiles.includes(current)) {
        const a=current.getBoundingClientRect(),ax=a.left+a.width/2,ay=a.top+a.height/2;let best=null,score=Infinity;
        tiles.forEach(tile=>{if(tile===current)return;const b=tile.getBoundingClientRect(),dx=b.left+b.width/2-ax,dy=b.top+b.height/2-ay;if(code===37&&dx>=-2||code===39&&dx<=2||code===38&&dy>=-2||code===40&&dy<=2)return;const horizontal=code===37||code===39,cost=Math.abs(horizontal?dx:dy)+Math.abs(horizontal?dy:dx)*3;if(cost<score){score=cost;best=tile;}});
        if(best)return focus(best);if(code===37)return focus(document.querySelector('#categories button.active')||$('browse-all'));if(code===38)return focus($('unified-query'));if(code===40)return focus(!$('next').hidden?$('next'):!$('prev').hidden?$('prev'):current);return focus(current);
      }
      if(current.parentElement===$('categories')&&(code===38||code===40)){let next=code===38?current.previousElementSibling:current.nextElementSibling;while(next&&(next.hidden||next.disabled))next=code===38?next.previousElementSibling:next.nextElementSibling;return focus(next||(code===38?$('browse-all'):current));}
      const rail = Array.from(document.querySelectorAll('#library-special button,#categories button')).filter(b => b.offsetWidth && !b.hidden);
      const index = rail.indexOf(current);
      if (index >= 0) {
        if (code === 38 || code === 40) return focus(rail[index + (code === 38 ? -1 : 1)] || (code === 38 ? $('home-open') : current));
        if (code === 39 && tiles.length) return focus(tiles[0]);
      }
      return false;
    }
  };
})();
