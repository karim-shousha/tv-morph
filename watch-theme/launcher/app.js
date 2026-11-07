(function () {
 'use strict';
 var grid = document.getElementById('grid'), viewport = document.getElementById('viewport');
 var zoom = 1, pan = {x:0,y:0}, drag = null, apps = [], preview = typeof tizen === 'undefined';
 var noticeTimer, moved = false, extent = 0;
 function fallbackIcon(name) {
  var shapes = {
   clock:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
   messages:'<path d="M4 5h16v12H9l-5 4zM8 9h8M8 13h5"/>',
   phone:'<path d="M7 3l4 5-3 3c1 3 2 4 5 5l3-3 5 4c-2 7-8 4-12 0S0 5 7 3z"/>',
   health:'<path d="M12 20C-2 11 3 0 12 7c9-7 14 4 0 13zM5 12h4l2-3 2 6 2-3h4"/>',
   music:'<path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
   weather:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
   calendar:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h2M14 14h2M8 17h2"/>',
   settings:'<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3"/>',
   gallery:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="2"/><path d="M4 19l6-6 4 4 3-4 4 4"/>',
   contacts:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-3c0-6 16-6 16 0v3"/>',
   alarm:'<circle cx="12" cy="13" r="7"/><path d="M12 9v5h3M4 3L1 6M20 3l3 3M7 19l-2 3M17 19l2 3"/>',
   timer:'<circle cx="12" cy="14" r="7"/><path d="M9 2h6M12 2v5M12 10v5M17 8l3-3"/>',
   workout:'<path d="M3 9v6M6 6v12M6 12h12M18 6v12M21 9v6"/>',
   reminders:'<path d="M7 4h13v17H4V4h3M8 3h8v4H8zM8 12l2 2 5-4M8 18h8"/>'
  };
  var key=name.toLowerCase(), shape=shapes[key] || '<circle cx="12" cy="12" r="7"/><path d="M12 1v7M12 16v7M1 12h7M16 12h7"/>';
  return '<svg viewBox="0 0 24 24" aria-hidden="true">'+shape+'</svg>';
 }
 function notice(message) {
  var el = document.getElementById('status');
  clearTimeout(noticeTimer); el.textContent = message; el.style.display = 'block';
  noticeTimer = setTimeout(function () { el.style.display = 'none'; }, 2800);
 }
 function transform() {
  var bound = Math.max(80, extent * zoom);
  pan.x = Math.max(-bound, Math.min(bound, pan.x));
  pan.y = Math.max(-bound, Math.min(bound, pan.y));
  grid.style.transform = 'translate(' + pan.x + 'px,' + pan.y + 'px) scale(' + zoom + ')';
 }
 function changeZoom(delta) { zoom = Math.max(0.55, Math.min(1.8, zoom + delta)); transform(); }
 function positionList(count) {
  var positions = [{x:0,y:0}], ring = 1, directions = [[-1,1],[-1,0],[0,-1],[1,-1],[1,0],[0,1]];
  while (positions.length < count) {
   var q = ring, r = 0;
   for (var side=0; side<6; side++) {
    for (var step=0; step<ring; step++) {
     positions.push({x:68*(q+r/2),y:59*r});
     q += directions[side][0]; r += directions[side][1];
    }
   }
   ring++;
  }
  return positions;
 }
 function launch(app) {
  if (moved) { return; }
  if (preview) { notice(app.name + ' / preview only'); return; }
  try { tizen.application.launch(app.id, function () {}, function (error) { notice('Cannot open ' + app.name + ': ' + error.name); }); }
  catch (error) { notice('Cannot open this application: ' + error.name); }
 }
 function render(list) {
  apps = list; grid.textContent = ''; extent = 0;
  var positions = positionList(apps.length);
  apps.forEach(function (app,index) {
   var button = document.createElement('button'), p = positions[index];
   button.className = 'app'; button.title = app.name; button.setAttribute('aria-label',app.name);
   button.style.left = p.x + 'px'; button.style.top = p.y + 'px';
   button.innerHTML = fallbackIcon(app.name);
   if (app.iconPath) {
    var img = document.createElement('img'); img.alt = '';
    img.onerror = function () { if (img.parentNode) { img.parentNode.removeChild(img); } };
    img.onload = function () { var fallback=button.querySelector('svg');if(fallback){button.removeChild(fallback);}button.style.padding='7px'; };
    img.src = app.iconPath; button.appendChild(img);
   }
   button.addEventListener('click',function () { launch(app); }); grid.appendChild(button);
   extent = Math.max(extent, Math.abs(p.x), Math.abs(p.y));
  });
  document.getElementById('mode').textContent = preview ? 'BROWSER PREVIEW' : apps.length + ' APPLICATIONS';
  if (!apps.length) { notice('No launchable applications found'); }
  transform();
 }
 document.getElementById('plus').onclick = function () { changeZoom(0.12); };
 document.getElementById('minus').onclick = function () { changeZoom(-0.12); };
 document.getElementById('reset').onclick = function () { zoom=1;pan={x:0,y:0};transform(); };
 document.addEventListener('rotarydetent',function (event) { changeZoom(event.detail.direction === 'CW' ? 0.12 : -0.12); });
 viewport.addEventListener('pointerdown',function (event) {
  moved=false;
  if (event.target.closest('footer')) { return; }
  drag={x:event.clientX,y:event.clientY,px:pan.x,py:pan.y};
  viewport.classList.add('dragging');
 });
 window.addEventListener('pointermove',function (event) {
  if (!drag) { return; }
  var dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if (Math.abs(dx)+Math.abs(dy)>8) { moved=true; }
  if (moved) { pan.x=drag.px+dx;pan.y=drag.py+dy;transform(); }
 });
 window.addEventListener('pointerup',function () { drag=null;viewport.classList.remove('dragging'); });
 window.addEventListener('pointercancel',function () { drag=null;viewport.classList.remove('dragging'); });
 document.addEventListener('visibilitychange',function () { document.body.classList.toggle('paused',document.hidden); });
 window.addEventListener('keydown',function (event) {
  if (event.key==='+' || event.key==='=') { changeZoom(0.12); }
  if (event.key==='-') { changeZoom(-0.12); }
 });
 document.addEventListener('tizenhwkey',function (event) {
  if (event.keyName==='back' && !preview) { tizen.application.getCurrentApplication().exit(); }
 });
 if (preview) {
  render(['Clock','Messages','Phone','Health','Music','Weather','Calendar','Alarm','Settings','Gallery','Timer','Contacts','Reminders','Barometer','Find phone','Workout','Voice memo','World clock','Flashlight'].map(function (name) { return {name:name,id:''}; }));
 } else {
  try {
   var self=tizen.application.getCurrentApplication().appInfo.id;
   tizen.application.getAppsInfo(function (list) {
    render(list.filter(function (app) { return app.show && app.id!==self; }).sort(function (a,b) { return a.name.localeCompare(b.name); }));
   },function (error) { notice('Application list unavailable: '+error.name); });
  } catch (error) { notice('Cannot read applications: '+error.name); }
 }
}());
