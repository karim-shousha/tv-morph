/* HDMI/input switching suspends webOS media; it is not an IPTV exit. */
 var suspendedMediaPlayer=null,suspendedMediaResume=false;
 function platformMediaVisibility(){
  var hidden=typeof document.hidden==='boolean'?document.hidden:!!document.webkitHidden;
  if(hidden){
   if(frameKind==='radio'){exit(true);return;}
   if(!player||suspendedMediaPlayer===player)return;
   suspendedMediaPlayer=player;suspendedMediaResume=false;
   var activeOverlay=document.getElementById('morph-player');
   if(activeOverlay&&activeOverlay._pauseSeek)activeOverlay._pauseSeek();
   try{suspendedMediaResume=player.getState()==='PLAYING';savePosition();player.pause();}catch(e){}
   return;
  }
  var previous=suspendedMediaPlayer,resume=suspendedMediaResume;
  suspendedMediaPlayer=null;suspendedMediaResume=false;
  if(!previous||previous!==player||!resume)return;
  if(C.Prayer&&!C.Prayer.allowLaunch())return;
  try{var pending=previous.play();if(pending&&pending.catch)pending.catch(function(){});}catch(e){}
 }
 if(typeof document.hidden==='undefined')document.addEventListener('webkitvisibilitychange',platformMediaVisibility);
 document.addEventListener('webOSRelaunch',platformMediaVisibility);

/* ===== MORPH PLAYER 2.0 - premium cinematic UI (theme-aware, no hardcoded brand blue) ===== */
  function morph2CSS(){if(document.getElementById('morph2-style'))return;var st=document.createElement('style');st.id='morph2-style';document.head.appendChild(st);st.textContent=[
  '.morph2-chrome{transition:opacity .22s ease,transform .22s ease}',
  '#morph-player.morph2-hidden .morph2-chrome{opacity:0!important;pointer-events:none!important}',
  '#morph-player.morph2-hidden .morph2-top{transform:translateY(-12px)}',
  '#morph-player.morph2-hidden .morph2-dockwrap{transform:translateY(12px)}',
  '.morph2-topgrad{position:absolute;top:0;left:0;right:0;height:180px;background:linear-gradient(180deg,rgba(2,6,14,.72),transparent);pointer-events:none;z-index:2}',
  '.morph2-botgrad{position:absolute;bottom:0;left:0;right:0;height:420px;background:linear-gradient(0deg,rgba(2,6,14,.82),rgba(2,6,14,.35) 55%,transparent);pointer-events:none;z-index:2}',
  '.morph2-top{position:absolute;top:26px;left:44px;right:44px;display:flex;align-items:center;gap:18px;z-index:5;direction:ltr}',
  '.morph2-brand{display:flex;align-items:center;gap:12px;font-size:30px;font-weight:700;color:#fff}',
  '.morph2-mark{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--media-accent,#7fd4ff),var(--media-secondary,var(--media-card,#223a55)));box-shadow:0 0 16px var(--media-accent,#7fd4ff55);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff}',
  '.morph2-clock{margin-left:auto;text-align:right;color:#fff;line-height:1.1}.morph2-clock b{font-size:34px;font-variant-numeric:tabular-nums}.morph2-clock span{display:block;font-size:17px;opacity:.75}',
  '.morph2-livepill{display:flex;align-items:center;gap:8px;font-size:19px;color:#fff;background:#e0262e;border-radius:999px;padding:6px 16px;font-weight:700}.morph2-livepill i{width:10px;height:10px;border-radius:50%;background:#fff}',
  '.morph2-left{position:absolute;left:28px;top:120px;bottom:330px;width:360px;z-index:6;display:flex;flex-direction:column;background:linear-gradient(160deg,var(--media-card,#0d1a2cee),rgba(5,10,20,.92));border:1px solid var(--media-accent,#7fd4ff55);border-radius:22px;overflow:hidden;box-shadow:0 18px 50px #000a}',
  '.morph2-lefthead{display:flex;align-items:center;gap:10px;padding:16px 18px;color:#fff;font-size:24px;border-bottom:1px solid #ffffff22}',
  '.morph2-lefthead button{background:transparent;border:0;color:#fff;font-size:26px;min-width:52px;min-height:52px;border-radius:12px}',
  '.morph2-lefthead button:focus{outline:3px solid var(--media-accent,#7fd4ff);background:#ffffff18}',
  '.morph2-cats{display:flex;gap:8px;padding:10px 14px;overflow:hidden;flex-wrap:wrap}',
  '.morph2-cats button{font-size:16px;padding:8px 14px;border-radius:999px;border:1px solid #ffffff33;background:#ffffff10;color:#fff}',
  '.morph2-cats button.on{background:var(--media-accent,#7fd4ff);color:#06121f;border-color:transparent;font-weight:700}',
  '.morph2-chanlist{flex:1;overflow:auto;padding:6px 12px 14px}',
  '.morph2-chan{display:flex;align-items:center;gap:12px;width:100%;text-align:start;background:transparent;border:1px solid transparent;border-radius:14px;padding:9px 10px;color:#fff;margin:4px 0}',
  '.morph2-chan img{width:62px;height:40px;object-fit:contain;background:#ffffff12;border-radius:9px;padding:3px}',
  '.morph2-chan .n{flex:1;font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.morph2-chan .hd{font-size:14px;border:1px solid #ffffff44;border-radius:7px;padding:2px 8px;opacity:.85}',
  '.morph2-chan .num{font-size:15px;opacity:.6;width:30px}',
  '.morph2-chan:focus,.morph2-chan.on{background:linear-gradient(115deg,var(--media-accent,#7fd4ff),var(--media-secondary,var(--media-card,#223a55)));color:#06121f;outline:none}',
  '.morph2-chan:focus .hd,.morph2-chan.on .hd{border-color:#06121f66}',
  '.morph2-eq{display:flex;align-items:flex-end;gap:3px;height:22px}.morph2-eq i{width:5px;background:currentColor;border-radius:3px}.morph2-eq i:nth-child(1){height:10px}.morph2-eq i:nth-child(2){height:20px}.morph2-eq i:nth-child(3){height:14px}',
  '.morph2-right{position:absolute;right:28px;top:120px;width:400px;max-height:600px;z-index:6;display:flex;flex-direction:column;gap:14px}',
  '.morph2-card{background:linear-gradient(160deg,var(--media-card,#0d1a2cee),rgba(5,10,20,.92));border:1px solid #ffffff22;border-radius:18px;padding:14px 16px;color:#fff;box-shadow:0 14px 40px #0009}',
  '.morph2-card h3{font-size:19px;margin:0 0 10px;display:flex;align-items:center;gap:10px;font-weight:600}',
  '.morph2-card h3 .v{margin-left:auto;font-size:16px;opacity:.7;font-weight:400}',
  '.morph2-opt{display:flex;align-items:center;gap:10px;width:100%;text-align:start;background:transparent;border:1px solid transparent;color:#fff;border-radius:12px;padding:11px 12px;font-size:19px}',
  '.morph2-opt small{margin-left:auto;opacity:.65}',
  '.morph2-opt:focus,.morph2-opt.sel{background:#ffffff16;border-color:var(--media-accent,#7fd4ff);outline:none}',
  '.morph2-opt .tick{margin-left:auto;color:var(--media-accent,#7fd4ff);font-weight:700}',
  '.morph2-meta{position:absolute;left:400px;right:460px;bottom:262px;z-index:5;display:flex;gap:18px;align-items:center;background:linear-gradient(135deg,var(--media-card,#0d1a2ccc),rgba(6,12,22,.78));border:1px solid #ffffff22;border-radius:20px;padding:16px 22px;color:#fff;box-shadow:0 14px 40px #0008}',
  '.morph2-meta img{width:110px;height:80px;object-fit:contain;background:#ffffff10;border-radius:14px;padding:8px}',
  '.morph2-meta .t{flex:1;min-width:0}.morph2-meta .t b{font-size:30px;display:flex;align-items:center;gap:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.morph2-meta .t b .hd{font-size:15px;border:1px solid #ffffff55;border-radius:7px;padding:2px 9px}',
  '.morph2-meta .s{font-size:21px;opacity:.85;margin-top:2px}.morph2-meta .r{font-size:18px;opacity:.7;margin-top:2px;font-variant-numeric:tabular-nums}',
  '.morph2-meta .side{text-align:right;font-size:18px;line-height:1.5}.morph2-meta .side .now{color:var(--media-accent,#7fd4ff);font-weight:700}',
  '.morph2-meta .bar{height:5px;background:#ffffff26;border-radius:99px;margin-top:8px}.morph2-meta .bar i{display:block;height:100%;background:var(--media-accent,#7fd4ff);border-radius:inherit;width:0}',
  '.morph2-live{display:inline-flex;align-items:center;gap:8px;color:#fff;font-size:17px;font-weight:700}.morph2-live i{width:11px;height:11px;border-radius:50%;background:#ff2d2d;box-shadow:0 0 10px #ff2d2d}',
  '.morph2-dockwrap{position:absolute;left:44px;right:44px;bottom:24px;z-index:5;background:linear-gradient(135deg,var(--media-card,#0d1a2cee),rgba(6,12,22,.88));border:1px solid #ffffff26;border-radius:24px;padding:16px 26px 14px;color:#fff;box-shadow:0 18px 60px #000a}',
  '.morph2-tlrow{display:flex;align-items:center;gap:18px;direction:ltr}.morph2-tlrow small{font-size:20px;font-variant-numeric:tabular-nums;opacity:.9;min-width:110px}.morph2-tlrow small:last-child{text-align:right}',
  '.morph2-track{position:relative;flex:1;height:26px;display:flex;align-items:center}',
  '.morph2-rail{position:relative;height:7px;flex:1;background:#ffffff2b;border-radius:99px}',
  '.morph2-fill{position:absolute;left:0;top:0;bottom:0;width:0;background:var(--media-accent,#7fd4ff);border-radius:inherit}',
  '.morph2-knob{position:absolute;top:50%;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 0 12px var(--media-accent,#7fd4ff);transform:translate(-50%,-50%)}',
  '.morph2-btnrow{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;direction:ltr}',
  '.morph2-btn{min-width:74px;min-height:74px;width:74px;height:74px;border-radius:50%;border:1px solid #ffffff2e;background:#ffffff10;color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center}',
  '.morph2-btn svg{width:30px;height:30px}',
  '.morph2-btn:focus{background:var(--media-accent,#7fd4ff);color:#06121f;border-color:transparent;outline:none;box-shadow:0 0 18px var(--media-accent,#7fd4ff);transform:scale(1.06)}',
  '.morph2-btn.main{width:104px;height:104px;min-width:104px;min-height:104px;font-size:36px;background:transparent;border:3px solid var(--media-accent,#7fd4ff);box-shadow:0 0 22px var(--media-accent,#7fd4ff66),inset 0 0 18px #ffffff14}',
  '.morph2-btn.main svg{width:40px;height:40px}',
  '.morph2-status{position:absolute;top:120px;left:50%;transform:translateX(-50%);z-index:7;background:#071323ee;color:#fff;font-size:22px;padding:12px 26px;border-radius:14px;border:1px solid #ffffff33;max-width:1200px}',
  'body.reduce-motion .morph2-chrome,body.reduce-motion .morph2-btn{transition:none!important}',
  '@media(prefers-reduced-motion:reduce){.morph2-chrome,.morph2-btn{transition:none!important}}'
  ].join('\n')};
  function morph2SVG(n){var s='fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';var m={list:'<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',heart:'<path d="M12 21C7 16 3 12.5 3 8.8 3 6 5 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 19 4 21 6 21 8.8c0 3.7-4 7.2-9 12.2z"/>',prev:'<path d="M19 20 9 12l10-8z"/><line x1="5" y1="19" x2="5" y2="5"/>',next:'<path d="m5 4 10 8-10 8z"/><line x1="19" y1="5" x2="19" y2="19"/>',back10:'<path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>',fwd10:'<path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>',play:'<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>',pause:'<rect x="6" y="4" width="4.5" height="16" rx="1.5" fill="currentColor" stroke="none"/><rect x="13.5" y="4" width="4.5" height="16" rx="1.5" fill="currentColor" stroke="none"/>',aspect:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M9 9v10"/>',cc:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M10 10.5a2.5 2.5 0 0 0-4.5 1.5 2.5 2.5 0 0 0 4.5 1.5M17 10.5a2.5 2.5 0 0 0-4.5 1.5 2.5 2.5 0 0 0 4.5 1.5"/>',gear:'<circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.14-1.4l2-1.55-2-3.46-2.35.95A7 7 0 0 0 14.1 5.1L13.75 2.6h-3.5L9.9 5.1a7 7 0 0 0-2.42 1.42l-2.35-.95-2 3.46 2 1.55a7 7 0 0 0 0 2.8l-2 1.55 2 3.46 2.35-.95a7 7 0 0 0 2.41 1.42l.36 2.54h3.5l.35-2.54a7 7 0 0 0 2.42-1.42l2.35.95 2-3.46-2-1.55c.09-.46.14-.93.14-1.4z"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>'};return '<svg viewBox="0 0 24 24" '+s+' aria-hidden="true">'+(m[n]||m.play)+'</svg>';}
  function morph2Clock(el){function tick(){try{var d=new Date();var hh=String(d.getHours()).padStart(2,'0'),mm=String(d.getMinutes()).padStart(2,'0');el.querySelector('b').textContent=hh+':'+mm;el.querySelector('span').textContent=d.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'});}catch(e){}}tick();var iv=setInterval(tick,20000);el._morph2iv=iv;}
  function play(item,resolvedUrl){try{if(!item.localMedia){if(!frame||frameKind!=='iptv')open('iptv');var controls=frame&&frame.contentWindow.IptvParental;if(!controls){return new Promise(function(resolve,reject){var until=Date.now()+8000;function wait(){if(frame&&frameKind==='iptv'&&frame.contentWindow.IptvParental){resolve();return;}if(Date.now()>=until){reject(Error(t('افتح IPTV وأعد المحاولة.','Open IPTV and retry.')));return;}setTimeout(wait,50);}wait();}).then(function(){return play(item,resolvedUrl);});}if(!controls.granted(item))return controls.guard(item).then(function(allowed){return play(allowed,resolvedUrl);});}}catch(parentalError){return Promise.reject(parentalError);}
  var p=item.localMedia?{type:'local'}:profile();if(p.type==='m3u'&&!resolvedUrl)return M3uSource.load(p.server).then(function(record){return play(item,record.stream(item));});if(!/^\d{1,14}$/.test(String(item.id))||['live','vod','episode'].indexOf(item.kind)<0)throw Error('Invalid content');
  var ext=/^[a-z0-9]{1,8}$/i.test(item.ext||'')?item.ext:'mp4';
  var url=resolvedUrl||p.server+'/'+(item.kind==='live'?'live':item.kind==='vod'?'movie':'series')+'/'+encodeURIComponent(p.username)+'/'+encodeURIComponent(p.password)+'/'+item.id+'.'+(item.kind==='live'?(p.format==='ts'?'ts':'m3u8'):ext);
  stop();playingItem=item;try{if(!item.localMedia)rememberEntry(item);}catch(e){}
  var video=document.createElement('video');video.controls=false;video.preload='auto';video.style.cssText='position:absolute;inset:0;width:1920px;height:1080px;background:black;object-fit:contain';
  player={getDuration:function(){return isFinite(video.duration)?video.duration*1000:0;},getState:function(){return video.paused?'PAUSED':'PLAYING';},pause:function(){video.pause();},play:function(){return video.play();},stop:function(){video.pause();},close:function(){video.removeAttribute('src');video.load();}};
  var overlay=document.createElement('div');overlay.id='morph-player';overlay.className='morph2';overlay.tabIndex=-1;overlay.style.cssText='position:fixed;left:0;top:0;width:1920px;height:1080px;background:black;z-index:70';morph2CSS();overlay.appendChild(video);
 var topGrad=document.createElement('div');topGrad.className='morph2-topgrad morph2-chrome';overlay.appendChild(topGrad);
 var botGrad=document.createElement('div');botGrad.className='morph2-botgrad morph2-chrome';overlay.appendChild(botGrad);
 var header=document.createElement('div');header.className='morph2-top morph2-chrome';
 var brand=document.createElement('div');brand.className='morph2-brand';var mark=document.createElement('span');mark.className='morph2-mark';mark.textContent='\u25B6';brand.appendChild(mark);var bt=document.createElement('span');bt.textContent='Morph TV';brand.appendChild(bt);header.appendChild(brand);
 if(item.kind==='live'){var lp=document.createElement('span');lp.className='morph2-livepill';var dot=document.createElement('i');lp.appendChild(dot);var ltx=document.createElement('span');ltx.textContent='LIVE';lp.appendChild(ltx);header.appendChild(lp);}
 var back=document.createElement('button');back.className='morph2-btn';back.style.cssText='width:64px;height:64px;min-width:64px;min-height:64px';back.innerHTML=morph2SVG('x');back.setAttribute('aria-label',t('Back','Back'));back.onclick=stop;header.appendChild(back);
 var clockEl=document.createElement('div');clockEl.className='morph2-clock';clockEl.innerHTML='<b>--:--</b><span></span>';header.appendChild(clockEl);morph2Clock(clockEl);overlay.appendChild(header);
 var status=document.createElement('p');status.className='morph2-status';status.setAttribute('role','status');status.textContent=t('Loading...','Loading...');overlay.appendChild(status);
 var leftPanel=document.createElement('div');leftPanel.className='morph2-left morph2-chrome';leftPanel.hidden=true;leftPanel.setAttribute('role','dialog');leftPanel.setAttribute('aria-label',t('Channels','Channels'));
 var lh=document.createElement('div');lh.className='morph2-lefthead';var backBtn=document.createElement('button');backBtn.innerHTML='&#8249;';backBtn.setAttribute('aria-label',t('Back','Back'));var lhT=document.createElement('span');lhT.textContent=t('All Channels','All Channels');lh.appendChild(lhT);var lhS=document.createElement('span');lhS.style.cssText='margin-left:auto;font-size:18px;opacity:.7';lh.appendChild(lhS);leftPanel.appendChild(lh);
 var catRow=document.createElement('div');catRow.className='morph2-cats';leftPanel.appendChild(catRow);
 var chanList=document.createElement('div');chanList.className='morph2-chanlist';leftPanel.appendChild(chanList);overlay.appendChild(leftPanel);
 var rightPanel=document.createElement('div');rightPanel.className='morph2-right morph2-chrome';rightPanel.hidden=true;overlay.appendChild(rightPanel);
 var meta=document.createElement('div');meta.className='morph2-meta morph2-chrome';
 var metaLogo=document.createElement('img');metaLogo.alt='';if(item.icon&&/^https?:/.test(item.icon))metaLogo.src=item.icon;else metaLogo.style.display='none';meta.appendChild(metaLogo);
 var metaT=document.createElement('div');metaT.className='t';var metaTitle=document.createElement('b');metaTitle.textContent=item.name;var metaHd=document.createElement('span');metaHd.className='hd';metaHd.textContent='HD';metaTitle.appendChild(metaHd);metaT.appendChild(metaTitle);
 var metaSub=document.createElement('div');metaSub.className='s';metaSub.textContent=item.seriesName||(item.kind==='live'?'Live TV':item.kind==='episode'?'Episode':'Movie');metaT.appendChild(metaSub);
 var metaRange=document.createElement('div');metaRange.className='r';metaT.appendChild(metaRange);
 var metaBar=document.createElement('div');metaBar.className='bar';var metaFill=document.createElement('i');metaBar.appendChild(metaFill);metaT.appendChild(metaBar);meta.appendChild(metaT);
 var metaSide=document.createElement('div');metaSide.className='side';meta.appendChild(metaSide);overlay.appendChild(meta);
 var actions=document.createElement('div');actions.className='morph2-dockwrap morph2-chrome';
 var tlRow=document.createElement('div');tlRow.className='morph2-tlrow';tlRow.style.display=item.kind==='live'?'none':'';actions.appendChild(tlRow);
 var toolbar=document.createElement('div');toolbar.className='morph2-btnrow';actions.appendChild(toolbar);
 function iconBtn(name,labelText,fn,opts){var b=document.createElement('button');b.className='morph2-btn'+((opts&&opts.main)?' main':'');b.innerHTML=morph2SVG(name);b.setAttribute('data-player-tool',name);b.setAttribute('aria-label',labelText);b.title=labelText;b.onclick=function(){fn();showControls();};toolbar.appendChild(b);return b;}
 var toggle=iconBtn('pause',t('Pause','Pause'),function(){if(video.paused)video.play().catch(function(){});else video.pause();},{main:true});
 var controlWords={ar:['Play','Pause'],en:['Play','Pause']}[MorphLocale.get()]||['Play','Pause'];
 function toggleLabel(){var paused=video.paused;toggle.innerHTML=morph2SVG(paused?'play':'pause');toggle.setAttribute('aria-label',paused?t('Play','Play'):t('Pause','Pause'));}toggleLabel();
 var listB=iconBtn('list',t('Channels','Channels'),function(){toggleLeft();});
 var favB=iconBtn('heart',t('Favorite','Favorite'),function(){toggleFav();});
 function toggleFav(){try{var w=frame&&frame.contentWindow;var br=w&&(w.IptvTvBridge||w.IptvUI);if(br&&br.toggle){br.toggle(item);paintFav();}else if(w&&w.IptvUI&&w.IptvUI.toggle){w.IptvUI.toggle(item);paintFav();}}catch(e){}showControls();}
 function paintFav(){try{var w=frame&&frame.contentWindow;var br=w&&(w.IptvTvBridge||w.IptvUI);var on=false;if(br&&br.isFavorite)on=br.isFavorite(item);favB.style.color=on?'#ff6b8d':'';}catch(e){}}
 function switchEpisodeLG(delta){var ui=frame&&frame.contentWindow.IptvUI;if(item.kind==='episode'&&ui&&ui.changeEpisode){ui.changeEpisode(delta,item.id,true).then(function(result){if(!result.sent&&token===playToken)status.textContent=result.message||'';});}else if(ui&&ui.changePlayback){ui.changePlayback(delta,item.id,item.kind).then(function(result){if(!result.sent&&token===playToken)status.textContent=result.message||'';});}}
 function switchLiveLG(delta){var ui=frame&&frame.contentWindow.IptvUI;if(ui&&ui.changeLive)ui.changeLive(delta,item.id);}
 var prevB=iconBtn('prev',t('Previous','Previous'),function(){if(item.kind==='live')switchLiveLG(-1);else switchEpisodeLG(-1);});
 var seekBackB=iconBtn('back10',t('Back 10 seconds','Back 10 seconds'),function(){if(item.kind!=='live'&&isFinite(video.duration))video.currentTime=Math.max(0,Math.min(Math.max(0,video.duration-1),video.currentTime-10));});
 var seekFwdB=iconBtn('fwd10',t('Forward 10 seconds','Forward 10 seconds'),function(){if(item.kind!=='live'&&isFinite(video.duration))video.currentTime=Math.max(0,Math.min(Math.max(0,video.duration-1),video.currentTime+10));});
 seekBackB.disabled=seekFwdB.disabled=item.kind==='live';
 var nextB=iconBtn('next',t('Next','Next'),function(){if(item.kind==='live')switchLiveLG(1);else switchEpisodeLG(1);});
 var aspectModes=['contain','cover','fill'],aspectIdx=0;
 var aspectB=iconBtn('aspect',t('Aspect Ratio','Aspect Ratio'),function(){aspectIdx=(aspectIdx+1)%aspectModes.length;video.style.objectFit=aspectModes[aspectIdx];});
 var setB=iconBtn('gear',t('Settings','Settings'),function(){toggleRight('all');});
 try{paintFav();}catch(e){}
 var rates=C.PlaybackRate.values,rate=1,rateButton=null;
 if(item.kind!=='live'){rateButton=document.createElement('button');rateButton.className='morph2-btn';rateButton.setAttribute('aria-label',t('Playback speed','Playback speed'));toolbar.appendChild(rateButton);
  function rateLabel(){rateButton.textContent=rate+'x';rateButton.title=C.PlaybackRate.words()[0]+' '+rate+'x';}
  rateLabel();rateButton.onclick=function(){if(video.readyState<1){status.textContent=C.PlaybackRate.words()[2];showControls();return;}var next=rates[(rates.indexOf(rate)+1)%rates.length];try{rate=C.PlaybackRate.apply(video,next);status.textContent='';}catch(unsupported){status.textContent=C.PlaybackRate.words()[1];}rateLabel();showControls();};}
 overlay.appendChild(actions);
  function listTracks(subtitle){openRight(subtitle?'subtitles':'audio');}
 function openTrackCard(title,rows){rightPanel.hidden=false;rightOpen=true;rightPanel.querySelectorAll('[data-m2track]').forEach(function(n){n.parentNode.removeChild(n);});
  var card=document.createElement('div');card.setAttribute('data-m2track','');card.className='morph2-card';var h=document.createElement('h3');h.textContent=title;card.appendChild(h);
  var focusPrev=document.activeElement;function close(){if(card.parentNode)card.parentNode.removeChild(card);if(focusPrev&&overlay.contains(focusPrev))focusPrev.focus();showControls();}
  rows.concat([{label:t('Close','Close'),action:close}]).forEach(function(row){if(!row.action){var pp=document.createElement('p');pp.textContent=row.label;pp.style.cssText='font-size:17px;opacity:.8;white-space:pre-wrap';card.appendChild(pp);return;}var bb=document.createElement('button');bb.className='morph2-opt';var sp=document.createElement('span');sp.textContent=row.label;bb.appendChild(sp);bb.onclick=function(){try{row.action();if(row.action!==close)close();}catch(err){h.textContent=t('Unsupported','Unsupported');}};card.appendChild(bb);});
  rightPanel.insertBefore(card,rightPanel.firstChild);var f=card.querySelector('button');if(f)f.focus();}
 var audioBtn=iconBtn('audio',t('Audio','Audio'),function(){listTracks(false);});
 var ccBtn=iconBtn('cc',t('Subtitles','Subtitles'),function(){listTracks(true);});
 var infoBtn=iconBtn('info',t('Stream information','Stream information'),function(){openInfoCard();});
 function openInfoCard(){var ahead=0;try{for(var i=0;i<video.buffered.length;i++)if(video.buffered.start(i)<=video.currentTime&&video.buffered.end(i)>=video.currentTime)ahead=video.buffered.end(i)-video.currentTime;}catch(e){}
  openTrackCard(t('Stream information','Stream information'),[{label:t('Resolution: ','Resolution: ')+(video.videoWidth&&video.videoHeight?video.videoWidth+' x '+video.videoHeight:'-')+'\n'+t('Buffered ahead: ','Buffered ahead: ')+ahead.toFixed(1)+' s'}]);}
 function bridge(){try{var w=frame&&frame.contentWindow;return w&&(w.IptvTvBridge||null);}catch(e){return null;}}
 var leftOpen=false,leftFocus=null,leftCat=String(item.category_id||item.category||''),leftBrowsing=false,leftRun=0;
 backBtn.textContent='‹';backBtn.setAttribute('aria-label',t('الرجوع للأقسام','Back to categories'));backBtn.className='morph2-catback';lh.insertBefore(backBtn,lh.firstChild);backBtn.onclick=function(){leftBrowsing=false;buildCats();};backBtn.hidden=true;
 function toggleLeft(){leftOpen?closeLeft():openLeft();}
 function closeLeft(){leftPanel.hidden=true;leftOpen=false;if(leftFocus&&overlay.contains(leftFocus))leftFocus.focus();else toggle.focus();showControls();}
 function openLeft(){leftBrowsing=false;leftFocus=document.activeElement;leftPanel.hidden=false;leftOpen=true;buildCats();showControls();var f=chanList.querySelector('button')||catRow.querySelector('button')||backBtn;if(f)f.focus();}
 function buildCats(){var run=++leftRun;leftPanel.setAttribute('data-browse',leftBrowsing?'content':'categories');catRow.hidden=false;chanList.hidden=false;backBtn.hidden=!leftBrowsing;catRow.textContent='';chanList.textContent='';lhT.textContent=t('Loading...','Loading...');var br=bridge();
  function doneCats(cats){if(run!==leftRun||!leftOpen)return;catRow.textContent='';var all=document.createElement('button');all.textContent=t('All','All');if(!leftCat)all.className='on';all.onclick=function(){leftCat='';leftBrowsing=true;buildCats();};catRow.appendChild(all);
   cats.filter(function(c){return MorphPlayerChrome.contentVisible({kind:'category',group:item.kind==='vod'?'vod':'live',id:c.id||c.category_id});}).forEach(function(c){var b=document.createElement('button');b.textContent=c.name||c.category_name||c.id;b.dataset.id=c.id||c.category_id||'';if(String(b.dataset.id)===String(leftCat))b.className='on';b.onclick=function(){leftCat=b.dataset.id;leftBrowsing=true;buildCats();};catRow.appendChild(b);});if(leftBrowsing)loadChans();else{lhT.textContent=t('الأقسام','Categories');var first=catRow.querySelector('.on')||catRow.querySelector('button');if(first)first.focus();}}
  if(!br){lhT.textContent=t('Library unavailable','Library unavailable');return;}
  if(item.kind==='episode'&&!leftBrowsing){lhT.textContent=t('الأقسام','Categories');var current=document.createElement('button');current.textContent=item.seriesName||t('حلقات المسلسل','Current series episodes');current.onclick=function(){leftBrowsing=true;buildCats();};catRow.appendChild(current);current.focus();return;}if(item.kind==='episode'){var sid='';try{sid=String(item.seriesId||item.category||'');}catch(e){}br.call('list',{kind:'episode',category:sid,page:0,search:'',order:'provider'}).then(function(r){chanList.textContent='';lhT.textContent=item.seriesName||t('Episodes','Episodes');(r.items||[]).slice(0,60).filter(function(v){return MorphPlayerChrome.contentVisible(Object.assign({},v,{kind:item.kind,category:v.category||leftCat}));}).forEach(function(x){chanList.appendChild(chanBtn({id:x.id,name:x.name,icon:x.icon||'',kind:'episode'}));});var f=chanList.querySelector('button');if(f&&leftOpen)f.focus();}).catch(function(e){lhT.textContent=String(e.message||e).slice(0,80);});return;}
  br.call('categories',{kind:item.kind==='vod'?'vod':'live'}).then(function(r){doneCats(((r&&r.items)||[]).map(function(x){return{id:x.category_id||x.id,name:x.category_name||x.name};}));}).catch(function(){doneCats([]);});}
 function chanBtn(r){var b=document.createElement('button');b.className='morph2-chan'+(String(r.id)===String(item.id)?' on':'');
  var num=document.createElement('span');num.className='num';num.textContent='';b.appendChild(num);
  if(r.icon&&/^https?:/.test(r.icon)){var im=document.createElement('img');im.src=r.icon;im.alt='';im.onerror=function(){this.style.display='none';};b.appendChild(im);}
  var nm=document.createElement('span');nm.className='n';nm.textContent=r.name;b.appendChild(nm);
  if(item.kind==='live'&&String(r.id)===String(item.id)){var eq=document.createElement('span');eq.className='morph2-eq';eq.innerHTML='<i></i><i></i><i></i>';b.appendChild(eq);}
  else{var hd=document.createElement('span');hd.className='hd';hd.textContent='HD';b.appendChild(hd);}
  b.onclick=function(){if(String(r.id)===String(item.id)){closeLeft();return;}closeLeft();var br=bridge();if(br&&br.call){br.call('play',Object.assign({},item,{id:String(r.id),name:r.name,icon:r.icon||'',kind:r.kind||item.kind||'live',category:leftCat})).catch(function(e){status.textContent=String(e.message||e);showControls();});}};return b;}
 function loadChans(){chanList.textContent='';lhS.textContent=t('Loading...','Loading...');var br=bridge();if(!br)return;
  br.call('list',{kind:item.kind==='vod'?'vod':'live',category:String(leftCat||''),page:0,search:'',order:'provider'}).then(function(r){chanList.textContent='';lhT.textContent=t('All Channels','All Channels');var rows=(r.items||[]).slice();if(String(leftCat)===String(item.category_id||item.category||'')&&!rows.some(function(x){return String(x.id||x.stream_id)===String(item.id);})){rows.unshift(item);}lhS.textContent=rows.length+' '+t('channels','channels');
   rows.slice(0,120).filter(function(v){return MorphPlayerChrome.contentVisible(Object.assign({},v,{kind:item.kind,category:v.category||leftCat}));}).forEach(function(x,i){var b=chanBtn({id:x.id||x.stream_id,name:x.name,icon:x.icon||x.stream_icon});b.querySelector('.num').textContent=String(i+1);chanList.appendChild(b);});
   if(!chanList.children.length){var p=document.createElement('p');p.style.cssText='color:#fff;opacity:.7;padding:12px';p.textContent=t('No channels here','No channels here');chanList.appendChild(p);}
   var cur=chanList.querySelector('.on')||chanList.querySelector('button');if(cur&&leftOpen)cur.focus();}).catch(function(e){lhS.textContent=String(e.message||e).slice(0,90);});}
 var rightOpen=false,rightFocus=null;
 function toggleRight(section){(rightOpen&&!rightPanel.hidden)?closeRight():openRight(section);}
 function closeRight(){rightPanel.hidden=true;rightOpen=false;if(rightFocus&&overlay.contains(rightFocus))rightFocus.focus();else setB.focus();showControls();}
 function openRight(section){rightFocus=document.activeElement;rightPanel.hidden=false;rightOpen=true;buildRight(section||'all');showControls();var f=rightPanel.querySelector('button');if(f)f.focus();}
 function ropt(parent,labelText,value,fn,selected){var b=document.createElement('button');b.className='morph2-opt'+(selected?' sel':'');var s1=document.createElement('span');s1.textContent=labelText;b.appendChild(s1);if(value){var v=document.createElement('small');v.textContent=value;b.appendChild(v);}if(selected){var tk=document.createElement('span');tk.className='tick';tk.textContent='\u2713';b.appendChild(tk);}b.onclick=function(){fn();};parent.appendChild(b);return b;}
 function sourceTracks(subtitles){if(window.MorphDesktopMedia&&MorphDesktopMedia.trackRows)return MorphDesktopMedia.trackRows(video,subtitles);var list=subtitles?video.textTracks:video.audioTracks,rows=[];if(subtitles)rows.push({label:t('إيقاف','Off'),selected:!Array.prototype.some.call(list||[],function(x){return x.mode==='showing';}),action:function(){for(var j=0;list&&j<list.length;j++)list[j].mode='disabled';}});for(var i=0;list&&i<list.length;i++)(function(track,index){rows.push({label:!subtitles&&window.MorphPlayerChrome?MorphPlayerChrome.audioLabel(track,index):track.label||track.language||('Track '+(index+1)),selected:subtitles?track.mode==='showing':track.enabled,action:function(){for(var j=0;j<list.length;j++)if(subtitles)list[j].mode=j===index?'showing':'disabled';else if(j!==index)list[j].enabled=false;if(!subtitles&&window.MorphPlayerChrome)MorphPlayerChrome.selectAudio(video,index);else if(!subtitles)list[index].enabled=true;}});})(list[i],i);return rows;}
 function buildRight(section){MorphPlayerChrome.settings(rightPanel,[
 {id:'quality',title:t('جودة الفيديو','Video Quality'),rows:function(){if(window.MorphDesktopMedia&&MorphDesktopMedia.qualityRows)return MorphDesktopMedia.qualityRows(video);return [{label:video.videoHeight?video.videoWidth+' × '+video.videoHeight:t('الجودة يحددها المصدر والتلفزيون','Quality is managed by the source and TV')}];}},
 {id:'audio',title:t('مسار الصوت','Audio Track'),rows:function(){return sourceTracks(false);}},
 {id:'subtitles',title:t('الترجمة','Subtitles'),rows:function(){return sourceTracks(true);}},
 {id:'aspect',title:t('أبعاد الصورة','Aspect Ratio'),rows:function(){return aspectModes.map(function(mode,i){return {label:mode,selected:aspectIdx===i,action:function(){aspectIdx=i;video.style.objectFit=mode;}};});}},
 {id:'speed',title:t('سرعة التشغيل','Playback Speed'),rows:function(){return rates.map(function(value){return {label:value+'×',selected:rate===value,action:function(){rate=C.PlaybackRate.apply(video,value);}};});}},
 {id:'info',title:t('معلومات البث','Stream Information'),rows:function(){return [{label:item.name+'\n'+video.videoWidth+' × '+video.videoHeight+'\n'+(item.genre||'')}];}}
 ],showControls);if(section&&section!=='all'){Array.prototype.forEach.call(rightPanel.querySelectorAll('[data-section]'),function(group){group.hidden=group.getAttribute('data-section')!==section;if(!group.hidden)group.querySelector('button').click();});var heading=rightPanel.querySelector('h3'),active=rightPanel.querySelector('[data-section="'+section+'"] .morph252-title');if(heading&&active)heading.textContent=active.textContent;}}
 function openEpgGuide(){var br=bridge();status.textContent=t('Loading guide...','Loading guide...');showControls();
  function paint(items){var now=Date.now()/1000;var cur=(items||[]).filter(function(x){return x.start<=now&&now<x.end;})[0];var nxt=(items||[]).filter(function(x){return x.start>now;})[0];
   metaSub.textContent=(cur&&cur.title)||metaSub.textContent;
   try{metaRange.textContent=cur?(new Date(cur.start*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' - '+new Date(cur.end*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})):'';}catch(e){}
   metaSide.innerHTML='';var lv=document.createElement('div');lv.className='morph2-live';lv.innerHTML='<i></i><span>Live</span>';metaSide.appendChild(lv);
   if(cur){var np=document.createElement('div');np.className='now';np.textContent=t('Now Playing','Now Playing')+': '+cur.title;metaSide.appendChild(np);}
   if(nxt){var nn=document.createElement('div');nn.textContent=t('Next','Next')+': '+nxt.title;metaSide.appendChild(nn);}
   if(!cur&&!nxt)status.textContent='';else status.textContent='';showControls();}
  if(!br){status.textContent='';return;}
  br.call('epg',{id:item.id}).then(function(r){paint((r&&r.items)||[]);}).catch(function(e){status.textContent=String(e.message||e).slice(0,120);showControls();});}
 try{if(item.kind==='live')openEpgGuide();else{metaSide.innerHTML='';var k=document.createElement('div');k.style.opacity='.75';k.textContent=item.kind==='episode'?(item.seriesName||''):(item.genre||'');metaSide.appendChild(k);}paintFav();}catch(e){}

  var streamStarted=false,alternateTried=false,sourceAttempt=0;var token=playToken,initial=!item.localMedia&&!item.startOver&&item.kind!=='live'?decorate(item).resumeMs/1000:0;
  function ensureNativeAudio(){if(!window.MorphDesktopMedia&&window.MorphPlayerChrome)MorphPlayerChrome.ensureAudio(video);}video.addEventListener('playing',ensureNativeAudio);if(video.audioTracks&&video.audioTracks.addEventListener)video.audioTracks.addEventListener('addtrack',ensureNativeAudio);
  video.onloadedmetadata=function(){ensureNativeAudio();if(initial>0&&isFinite(video.duration)&&initial<video.duration-30)video.currentTime=initial;};
  var timeline=document.createElement('input');timeline.type='range';timeline.min='0';timeline.max='100000';timeline.value='0';timeline.setAttribute('aria-label',t('موضع التشغيل','Playback position'));timeline.className='morph2-range';timeline.onfocus=function(){try{tlRow.classList.add('focus');}catch(e){}};timeline.onblur=function(){try{tlRow.classList.remove('focus');}catch(e){}finishSeek(false,true);};var progress=tlRow;var elapsedEl=document.createElement('small');elapsedEl.textContent='00:00:00';var totalEl=document.createElement('small');totalEl.textContent=item.kind==='live'?'LIVE':'00:00:00';var railWrap=document.createElement('div');railWrap.className='morph2-track';var rail=document.createElement('div');rail.className='morph2-rail';var fillEl=document.createElement('div');fillEl.className='morph2-fill';var knob=document.createElement('div');knob.className='morph2-knob';rail.appendChild(fillEl);rail.appendChild(knob);railWrap.appendChild(rail);railWrap.appendChild(timeline);tlRow.appendChild(elapsedEl);tlRow.appendChild(railWrap);tlRow.appendChild(totalEl);var clock=document.createElement('div');clock.style.display='none';
  var held=0,started=0,last=0,eventAt=0,preview=0,seekFrame=0,wasPlaying=false,heldPaused=false,dragging=false;
  function bounded(value){return Math.max(0,Math.min(Math.max(0,(isFinite(video.duration)?video.duration:0)-1),value));}
  function timeText(value){value=Math.max(0,Math.floor(value||0));return Math.floor(value/60)+':'+('0'+value%60).slice(-2);}
  function paintSeek(value){var duration=isFinite(video.duration)?video.duration:0;timeline.value=duration?Math.round(value/duration*100000):0;clock.textContent=timeText(value)+' / '+timeText(duration);timeline.setAttribute('aria-valuetext',clock.textContent);try{var pct=duration>0?Math.max(0,Math.min(100,value/duration*100)):0;fillEl.style.width=pct+'%';knob.style.left=pct+'%';elapsedEl.textContent=timeText(value);totalEl.textContent=item.kind==='live'?'LIVE':timeText(duration);metaFill.style.width=pct+'%';if(item.kind!=='live'&&duration>0){var rem=Math.max(0,duration-(value||0));metaRange.textContent=timeText(value)+'  \u00B7  -'+timeText(rem)+' '+t('remaining','remaining');}}catch(e){}}
  function finishSeek(commit,resume){if(seekFrame)cancelAnimationFrame(seekFrame);seekFrame=0;if(!held)return;var target=preview,playAgain=heldPaused&&wasPlaying;held=0;heldPaused=false;if(commit&&token===playToken){video.currentTime=bounded(target);position=video.currentTime*1000;}paintSeek(video.currentTime);if(playAgain&&resume!==false&&token===playToken)video.play().catch(function(){});showControls();}
  function animateSeek(now){seekFrame=0;if(!held||token!==playToken)return;if(now-eventAt>1200){finishSeek(true,true);return;}var dt=Math.max(0,Math.min(64,now-Math.max(last,started+200))),speed=Math.min(240,60+Math.max(0,now-started-200)*.02);preview=bounded(preview+(held===39?1:-1)*dt*speed/1000);last=now;if(now-started>=200&&!heldPaused){heldPaused=true;if(wasPlaying)video.pause();}paintSeek(preview);seekFrame=requestAnimationFrame(animateSeek);}
  function beginSeek(code,repeat){if(item.kind==='live'||!isFinite(video.duration)||video.duration<=0)return;var now=performance.now();if(held===code){eventAt=now;return;}if(!held&&repeat)return;var base=held?preview:video.currentTime;if(!held){wasPlaying=!video.paused;heldPaused=false;}held=code;started=last=eventAt=now;preview=bounded(base+(code===39?10:-10));paintSeek(preview);if(!seekFrame)seekFrame=requestAnimationFrame(animateSeek);}
  var hideTimer=null,chrome=[header,status,actions];if(item.kind!=='live')chrome.push(progress);function panelsOpen(){try{if(!leftPanel.hidden||!rightPanel.hidden)return true;if(overlay.querySelector('[data-track-panel]')||overlay.querySelector('[data-m2track]'))return true;}catch(e){}return false;}function showControls(){chrome.forEach(function(e){e.style.visibility='visible';});overlay.classList.remove('morph2-hidden');clearTimeout(hideTimer);if(!panelsOpen()&&!held&&!dragging&&!video.paused&&!status.textContent)hideTimer=setTimeout(function(){if(panelsOpen()||held||dragging)return;chrome.forEach(function(e){e.style.visibility='hidden';});overlay.classList.add('morph2-hidden');},4000);}
  var blurSeek=function(){finishSeek(false,true);};window.addEventListener('blur',blurSeek);overlay._pauseSeek=function(){finishSeek(false,false);};overlay._stopSeek=function(){finishSeek(false,false);clearTimeout(hideTimer);window.removeEventListener('blur',blurSeek);};overlay.addEventListener('focusout',function(e){if(!overlay.contains(e.relatedTarget))finishSeek(false,true);});
  timeline.oninput=function(){finishSeek(false,true);dragging=true;showControls();paintSeek(Number(timeline.value)/100000*(isFinite(video.duration)?video.duration:0));};timeline.onchange=function(){var target=Number(timeline.value)/100000*(isFinite(video.duration)?video.duration:0);dragging=false;video.currentTime=bounded(target);paintSeek(video.currentTime);showControls();};
  overlay.onclick=function(e){if(e.target!==overlay&&e.target!==video)return;if(overlay.classList.contains('morph2-hidden'))showControls();else{leftPanel.hidden=rightPanel.hidden=true;leftOpen=rightOpen=false;clearTimeout(hideTimer);chrome.forEach(function(el){el.style.visibility='hidden';});overlay.classList.add('morph2-hidden');}};overlay.addEventListener('focusin',function(e){if(toolbar.contains(e.target)||e.target===timeline||overlay.querySelector('.morph3-top')&&overlay.querySelector('.morph3-top').contains(e.target)){leftPanel.hidden=rightPanel.hidden=true;leftOpen=rightOpen=false;}});overlay.onpointermove=showControls;video.onpause=function(){toggleLabel();showControls();};video.onplaying=function(){streamStarted=true;toggleLabel();status.textContent='';showControls();};video.ontimeupdate=function(){if(held||dragging)return;position=video.currentTime*1000;paintSeek(video.currentTime);if(position%5000<1000)savePosition();};
  function tryAlternateLive(){if(token!==playToken||window.MorphDesktopMedia||streamStarted||alternateTried||item.localMedia||resolvedUrl||p.type==='m3u'||item.kind!=='live'||!/\/live\/[^?#]+\.m3u8(?:[?#]|$)/i.test(url))return false;alternateTried=true;status.textContent=t('تعذّر بدء HLS، نجرب نفس القناة بصيغة TS…','HLS could not start. Trying the same channel as TS…');video.pause();video.removeAttribute('src');video.load();beginStream(url.replace(/\.m3u8(?=[?#]|$)/i,'.ts'));showControls();return true;}
  function beginStream(source){var attempt=++sourceAttempt;video.src=source;return video.play().catch(function(error){if(token!==playToken||attempt!==sourceAttempt||error.name==='AbortError')return;if(error.name==='NotAllowedError')status.textContent=t('اضغط OK للتشغيل أو رجوع.','Press OK to play, or Back.');else if(!tryAlternateLive())status.textContent=t('تعذّر تشغيل البث أو الترميز غير مدعوم.','Could not play this stream/codec.');showControls();});}
  video.onerror=function(){if(token!==playToken)return;if(tryAlternateLive())return;status.textContent=t('تعذّر تشغيل البث أو الترميز غير مدعوم.','Could not play this stream/codec.');showControls();};video.onended=function(){if(token!==playToken)return;position=0;savePosition();var ui=frame&&frame.contentWindow.IptvUI;if(item.kind==='episode'&&ui&&ui.changeEpisode){ui.changeEpisode(1,item.id,true).then(function(result){if(token===playToken&&(!result||!result.sent))stop();},function(){if(token===playToken)stop();});}else stop();};
  if(!document.getElementById('morph2-style2')){var st2=document.createElement('style');st2.id='morph2-style2';st2.textContent='.morph2-range{position:absolute;inset:-8px 0;width:100%;height:42px;opacity:0;cursor:pointer}.morph2-tlrow.focus .morph2-rail{box-shadow:0 0 0 3px var(--media-accent,#7fd4ff)}';document.head.appendChild(st2);}
 overlay.onkeydown=function(e){if(window.MorphPlayerChrome&&MorphPlayerChrome.key&&MorphPlayerChrome.key(overlay,e))return;var hidden=actions.style.visibility==='hidden',code=e.keyCode;showControls();if(code===13&&item.kind==='live'&&leftPanel.hidden&&rightPanel.hidden&&(hidden||document.activeElement===toggle||document.activeElement===overlay)){e.preventDefault();e.stopPropagation();if(!e.repeat)openLeft();return;}
  var inLeftPanel=!leftPanel.hidden&&leftPanel.contains(document.activeElement);
  var inRightPanel=!rightPanel.hidden&&rightPanel.contains(document.activeElement);
  if(item.kind==='live'&&(code===38||code===40)&&!inLeftPanel&&!inRightPanel){e.preventDefault();e.stopPropagation();var topOptions=overlay.querySelector('.morph3-top'),navTarget=code===38&&topOptions?topOptions.querySelector('button'):toggle;if(navTarget)navTarget.focus();return;}
  if(item.kind==='live'&&!inLeftPanel&&!inRightPanel&&[427,428].indexOf(code)>=0){e.preventDefault();e.stopPropagation();if(!e.repeat){var ui0=frame&&frame.contentWindow.IptvUI;if(ui0&&ui0.changeLive)ui0.changeLive(code===38||code===427?1:-1,item.id);}return;}
  if([27,10009,461,13,37,38,39,40,412,417,413,415,19,10252].indexOf(code)<0)return;e.preventDefault();e.stopPropagation();
  if(code===27||code===10009||code===461){clearTimeout(hideTimer);if(!e.repeat){
   if(!leftPanel.hidden&&leftBrowsing){leftBrowsing=false;buildCats();return;}if(!leftPanel.hidden||!rightPanel.hidden){if(!leftPanel.hidden)closeLeft();if(!rightPanel.hidden)closeRight();showControls();return;}
   finishSeek(false,false);stop();}return;}
  if(code===413){stop();return;}
  if(code===13&&hidden){toggle.focus();return;}
  if((inLeftPanel||inRightPanel)&&[38,40].indexOf(code)>=0){var scope=inLeftPanel?leftPanel:rightPanel;var btns=Array.prototype.slice.call(scope.querySelectorAll('button')).filter(function(b){return b.offsetWidth>0&&b.offsetHeight>0;});var bi=btns.indexOf(document.activeElement);var bn=btns[Math.max(0,Math.min(btns.length-1,bi+(code===40?1:-1)))];if(bn)bn.focus();return;}
  if((inLeftPanel||inRightPanel)&&[37,39].indexOf(code)>=0){if(inLeftPanel&&code===39){closeLeft();}else if(inRightPanel&&code===37){closeRight();}return;}
  if(item.kind!=='live'&&((code===37||code===39)&&(hidden||document.activeElement===timeline)||code===412||code===417)){timeline.focus();beginSeek(code===412?37:code===417?39:code,e.repeat);return;}
  if(code===38&&item.kind!=='live'&&!inLeftPanel&&!inRightPanel){finishSeek(true,true);timeline.focus();return;}
  if(code===40&&document.activeElement===timeline){finishSeek(true,true);toggle.focus();return;}
  if(code===13&&document.activeElement&&document.activeElement.tagName==='BUTTON'){if(!e.repeat)document.activeElement.click();return;}
  if((code===37||code===39)&&document.activeElement&&document.activeElement.tagName==='BUTTON'&&!inLeftPanel&&!inRightPanel){var buttons=Array.prototype.slice.call(toolbar.querySelectorAll('button:not([disabled])')),index=buttons.indexOf(document.activeElement);if(index>=0){var next=index+(code===39?1:-1);if(next>=0&&next<buttons.length)buttons[next].focus();}else{var ob=Array.prototype.slice.call(overlay.querySelectorAll('button'));var oi=ob.indexOf(document.activeElement),on=oi+(code===39?1:-1);if(on>=0&&on<ob.length)ob[on].focus();}return;}
  if(code===13||code===10252){if(video.paused)video.play().catch(function(){});else video.pause();}else if(code===415)video.play().catch(function(){});else if(code===19)video.pause();};
 overlay.onkeyup=function(e){var code=e.keyCode===412?37:e.keyCode===417?39:e.keyCode;if(code===held){e.preventDefault();e.stopPropagation();finishSeek(true,true);}};
  [aspectB,rateButton,audioBtn].forEach(function(b){if(b&&b.parentNode)b.parentNode.removeChild(b);});MorphPlayerChrome.mount(overlay,item,showControls);document.body.classList.add('morph-playing');document.documentElement.classList.add('morph-playing');document.body.appendChild(overlay);if(frame)frame.style.visibility='hidden';toggle.focus();beginStream(url);return {sent:true};
 }
 function radio(id,url){stop();var audio=new Audio(),w=frame.contentWindow;player={getState:function(){return audio.paused?'PAUSED':'PLAYING';},pause:function(){audio.pause();},play:function(){return audio.play();},stop:function(){audio.pause();},close:function(){audio.removeAttribute('src');audio.load();}};audio.onplaying=function(){w.RadioUI.state(id,'playing',t('على الهواء','On air'));};audio.onerror=function(){w.RadioUI.state(id,'stopped',t('تعذر التشغيل. لم تتم إعادة المحاولة.','Playback failed. No retry was made.'));};audio.onended=function(){w.RadioUI.state(id,'stopped','Stream ended.');};audio.src=url;audio.play().catch(function(){w.RadioUI.state(id,'stopped','Press Play to try playback.');});}
