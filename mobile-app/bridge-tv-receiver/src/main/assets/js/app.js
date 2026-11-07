/* AppBridge TV client — Tizen 4.0 / ES5 compatible.
   No fetch-streaming assumptions beyond guarded capability checks;
   every failure lands on screen + diagnostics, never silent. */
(function () {
  'use strict';

  var WS_PORT = 8187, HTTP_PORT = 8188;
  var state = {
    ip: '', ws: null, paired: false, token: '',
    apps: [], query: '', lastRunning: '', pendingLaunch: '', leavingApp: false, focusIdx: 0, screen: 'pair',
    video: { supported: false, firstFrameAt: 0, initAt: 0, errors: [], mse: null, sb: null }
  };

  var launchTimer = 0;
  function launchMessage(text){var node=$('appsError');if(node){node.classList.remove('connection-success');node.textContent=text||'';node.hidden=!text;}}
  function $(id) { return document.getElementById(id); }
  function applyTheme(theme) {
    if (window.MorphBridgeHost && window.MorphBridgeHost.syncTheme()) return;
    if (theme !== 'light' && theme !== 'dark') return;
    if (document.body && document.body.classList) {
      if (theme === 'light') document.body.classList.add('light');
      else document.body.classList.remove('light');
    }
    try { localStorage.setItem('morph_bridge_theme', theme); } catch (e) {}
  }
  // Android TV forwards remote keys here, preserving keyup and repeat timing.
  window.MorphReceiverKey = function (code, up, repeat) {
    var event = document.createEvent('Event');
    event.initEvent(up ? 'keyup' : 'keydown', true, true);
    event.keyCode = code; event.repeat = repeat;
    document.dispatchEvent(event);
  };
  function log() {
    try {
      var s = Array.prototype.join.call(arguments, ' ');
      state.video.errors.push(new Date().toISOString().substr(11, 8) + ' ' + s);
      if (state.video.errors.length > 80) state.video.errors.splice(0, state.video.errors.length - 80);
      renderDiag();
    } catch (e) {}
  }

  /* ---------- screens + focus ---------- */
  var focusables = { pair: ['btnDiag', 'bridge-back'], setup: ['inPhoneSetupCode','btnPhoneSetupSubmit','btnPhoneSetupCancel'], apps: [], play: [], diag: ['btnDiagBack', 'btnDiagTechnical', 'btnTestOutput','btnDisconnect'], help: ['btnHelpBack'] };
  var savedFocus={},savedAppPkg='';
  function currentFocusables(name) {
    return (focusables[name || state.screen] || []).filter(function (id) {
      var node = $(id);
      return node && !node.hidden && !node.disabled && node.getClientRects().length > 0;
    });
  }
  function show(name) {
    var previousList=currentFocusables();if(previousList[state.focusIdx]){savedFocus[state.screen]=previousList[state.focusIdx];if(state.screen==='apps'){var selectedNode=$(previousList[state.focusIdx]);if(selectedNode&&selectedNode.getAttribute('data-pkg'))savedAppPkg=selectedNode.getAttribute('data-pkg');}}
    stopPointerMotion();
    editing = false;
    if (document.activeElement && document.activeElement.tagName === 'INPUT') document.activeElement.blur();
    state.screen = name;
    ['pair', 'setup', 'apps', 'play', 'diag', 'help'].forEach(function (s) {
      $('screen-' + s).classList.add('hidden');
    });
    $('screen-' + name).classList.remove('hidden');
    if (name === 'diag') renderDiag();
    var nextList=currentFocusables(name),remembered=nextList.indexOf(savedFocus[name]);
    if(name==='apps'&&savedAppPkg)for(var focusIndex=1;focusIndex<nextList.length;focusIndex++){var focusNode=$(nextList[focusIndex]);if(focusNode&&focusNode.getAttribute('data-pkg')===savedAppPkg){remembered=focusIndex;break;}}
    state.focusIdx=remembered>=0?remembered:name==='apps'&&nextList.length>1?1:0;
    if(name==='apps')updateAppColumns();
    paintFocus();
    if (name === 'diag') renderDiag();
  }
  function paintFocus() {
    var list = currentFocusables();
    for (var screen in focusables) {
      (focusables[screen] || []).forEach(function (id) {
        var el = $(id);
        if (el && el.classList) el.classList.remove('focus');
      });
    }
    var cur = list[state.focusIdx % Math.max(list.length, 1)];
    var el = cur && $(cur);
    if (el) {
      if (el.classList) el.classList.add('focus');
      try { var grid=$('grid');if(state.screen==='apps'&&grid.contains(el)){var top=el.offsetTop-grid.offsetTop,bottom=top+el.offsetHeight;if(top<grid.scrollTop)grid.scrollTop=top;else if(bottom>grid.scrollTop+grid.clientHeight)grid.scrollTop=bottom-grid.clientHeight;}else if(el.scrollIntoViewIfNeeded)el.scrollIntoViewIfNeeded(false); } catch(e) {}
    }
    if (state.screen === 'apps' && $('selectedApp')) $('selectedApp').textContent =
      el && el.getAttribute('data-label') || (cur === 'btnAddApp' ? 'ضيف تطبيقات من موبايلك' : 'ابحث أو اختار تطبيق بالريموت');
  }
  function moveFocus(dx, dy) {
    var list = currentFocusables();
    if (!list.length) return;
    if (state.screen === 'diag') {
      // Follow the visual row in either language, skipping hidden Disconnect
      // and disabled media tests instead of landing on invisible controls.
      var origin = $(list[state.focusIdx % list.length]).getBoundingClientRect();
      var x = origin.left + origin.width / 2, y = origin.top + origin.height / 2;
      var best = -1, distance = Infinity;
      for (var f = 0; f < list.length; f++) {
        var rect = $(list[f]).getBoundingClientRect();
        var ax = rect.left + rect.width / 2 - x, ay = rect.top + rect.height / 2 - y;
        var ahead = dx ? ax * dx : ay * dy;
        if (ahead < 2) continue;
        var score = ahead + Math.abs(dx ? ay : ax) * 4;
        if (score < distance) { distance = score; best = f; }
      }
      if (best >= 0) state.focusIdx = best;
      paintFocus(); return;
    }
    if (state.screen === 'apps') {
      if (state.focusIdx === 0) {
        if (dy > 0 && list.length > 1) state.focusIdx = 1;
        paintFocus();
        return;
      }
      var cols = state.appColumns || 4, n = list.length - 1, ai = state.focusIdx - 1;
      if (dx !== 0) ai = (ai + dx + n) % n;
      if (dy !== 0) {
        var nai = ai + dy * cols;
        if (nai < 0) { state.focusIdx = 0; paintFocus(); return; }
        if (nai < n) ai = nai;
      }
      state.focusIdx = ai + 1;
    } else {
      state.focusIdx = (state.focusIdx + dy + dx + list.length) % list.length;
    }
    paintFocus();
  }
  function activate() {
    var list = currentFocusables();
    var id = list[state.focusIdx % Math.max(list.length, 1)];
    if (!id) return;
    if (id.indexOf('app_') === 0) {
      var el = $(id);
      var pkg = el && el.getAttribute('data-pkg');
      if (pkg) openAppPkg(pkg);
      return;
    }
    var el = $(id);
    if (el && el.disabled) return;
    if (el && el.tagName === 'INPUT') { editInput(el); return; }
    if(el&&el.disabled)return;
    if (id === 'bridge-back') onBack('button', false);
    else if (id === 'btnConnect') doConnect();
    else if (id === 'btnPhoneSetupSubmit' || id === 'btnPhoneSetupCancel') el.click();
    else if (id === 'btnDiag') show('diag');
    else if (id === 'btnDiagTechnical') el.click();
    else if (id === 'btnDiagBack') show(state.paired ? 'apps' : 'pair');
    else if (id === 'btnTestOutput') testOutput();
    else if (id === 'btnAddApp') show('help');
    else if (id === 'btnHelpBack') show('apps');
  }

  /* Use the platform keyboard; Android routes D-pad activation to its native editor. */
  var editing = false, ignoreEditorEnterUntil = 0;
  function editInput(el) {
    if (el.disabled || setupPending) return;
    if (window.MorphDevice && window.MorphDevice.editInput) {
      editing=false;el.blur();editing=true;
      window.MorphDevice.editInput(el.id, el.value);
    } else { editing=true;el.focus(); }
  }
  window.MorphReceiverInput = function (id, value, cancelled) {
    var input = $(id);
    editing = false;
    if (!input || input.disabled) return;
    if (!cancelled) {
      input.value = value;
      var event = document.createEvent('Event');event.initEvent('input', true, false);input.dispatchEvent(event);
      var inputList = focusables[state.screen] || [];var index = inputList.indexOf(id);if(index >= 0)state.focusIdx=Math.min(index+1,inputList.length-1);
    }
    editing = false; input.blur(); paintFocus();
    ignoreEditorEnterUntil = Date.now() + 600;
    if (!cancelled && id === 'inPhoneSetupCode') submitPhoneSetup();
  };
  ['inPhoneSetupCode'].forEach(function(id){
    $(id).addEventListener('click',function(){if(!editing)editInput(this);});
    $(id).addEventListener('blur',function(){
      if(editing && !setupPending && /^[0-9]{6}$/.test(digits(this.value))){editing=false;ignoreEditorEnterUntil=Date.now()+600;submitPhoneSetup();}
    });
  });

  /* ---------- websocket ---------- */
  function setConn(on, text) {
    $('connDot').className = 'dot ' + (on ? 'on' : 'off');
    $('connText').textContent = text;
  }
  function send(obj) {
    if (!state.ws) return;
    if (obj.t === 'pair' || obj.t === 'heartbeat') obj.phoneSetupVersion = '1';
    if((obj.t==='pair'||obj.t==='heartbeat')&&window.MorphBridgeHost&&MorphBridgeHost.billing){var license=MorphBridgeHost.billing();obj.tvPlus=String(license.plus||'unknown');obj.trialRemainingMs=String(license.remainingMs||0);obj.trialStartedAt=String(license.startedAt||0);}
    try { state.ws.send(JSON.stringify(obj)); } catch (e) { log('send failed: ' + e); }
  }
  function digits(value){return value.replace(/[\u0660-\u0669\u06f0-\u06f9]/g,function(ch){var n=ch.charCodeAt(0);return String(n>=0x6f0?n-0x6f0:n-0x660);});}
  function doConnect() {
    var ip = digits($('inIp').value).replace(/^\s+|\s+$/g, '');
    var code = digits($('inCode').value).replace(/^\s+|\s+$/g, '');
    if (!/^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)||ip.split('.').some(function(n){return Number(n)>255;})||!/^[0-9]{6}$/.test(code)) { $('pairError').textContent = 'اكتب عنوان IP الموبايل الصحيح وكود الربط المكوّن من 6 أرقام.'; return; }
    state.ip = ip;
    try { localStorage.setItem('appbridge_phone_ip', ip); } catch (e) {}
    $('pairError').textContent = '';
    try { if (state.ws) state.ws.close(); } catch (e) {}
    var ws;
    try { ws = new WebSocket('ws://' + ip + ':' + WS_PORT); }
    catch (e) { $('pairError').textContent = 'WebSocket unavailable: ' + e; return; }
    state.ws = ws;
    state.pendingCode = code;
    ws.onopen = function () { log('ws open'); };
    ws.onclose = function () {
      if (state.ws !== ws) return;
      stopPlayer();
      setConn(false, 'غير متصل'); state.paired = false;$('btnDisconnect').hidden=true;
      log('ws closed');
      if (state.screen !== 'pair') { $('pairError').textContent = 'Connection lost.'; show('pair'); }
    };
    ws.onerror = function () { $('pairError').textContent = 'Connection failed. Check IP, Wi-Fi, and the phone app.'; };
    ws.onmessage = function (ev) { onMsg(ev.data); };
  }
  function onMsg(raw) {
    var m;
    try { m = JSON.parse(raw); } catch (e) { log('bad json'); return; }
    if (m.t === 'hello') { send({ t: 'pair', code: state.pendingCode || '' }); }
    else if (m.t === 'paired') {
      state.paired = true; state.token = m.token || '';
      setConn(true, 'متصل بالموبايل');$('btnDisconnect').hidden=false;
      send({ t: 'apps', token: state.token });
      show('apps');
      send({t:'heartbeat',token:state.token});
    }
    else if (m.t === 'disconnected') { disconnectPhone(false); }
    else if (m.t === 'apps') { state.apps = m.list || []; renderApps(); }
    else if (m.t === 'status') { onStatus(m); }
    else if (m.t === 'stream') { startStream(m); }
    else if (m.t === 'error') {
      if (m.code === 'phone_setup') { $('phoneSetupStatus').textContent = 'اكتب نفس الستة أرقام الظاهرة في إعدادات أندرويد.'; return; }
      if (m.code === 'auth') {
        state.paired = false; state.token = '';
        stopPlayer(); setConn(false, 'جاري إعادة الاتصال');
        show('pair');
        $('pairError').textContent = 'Reconnecting to your phone…';
        try { if (state.ws) state.ws.close(); } catch (e) {}
        setTimeout(discoverPhone, 350);
        return;
      }
      log('server error: ' + m.code + ' ' + (m.message || ''));
      $('pairError').textContent = m.code + ': ' + (m.message || '');
      if((state.pendingLaunch&&m.code==='launch')||m.code==='capture-blocked'){
        clearTimeout(launchTimer);state.pendingLaunch='';stopPlayer();show('apps');
        launchMessage(m.message||'تعذّر تشغيل التطبيق. افتح Bridge على الموبايل لمراجعة السبب.');
      }else if(state.screen==='play'){$('playState').textContent=m.message||'تعذّر تنفيذ الأمر. حاول مرة أخرى.';}
    }
  }
  function setupBusy(busy) {
    $('screen-setup').classList.toggle('connecting',busy);
    $('phoneSetupEntry').hidden=busy;
    $('btnPhoneSetupSubmit').hidden=busy;
    $('phoneSetupSpinner').hidden=!busy;
    focusables.setup=busy?['btnPhoneSetupCancel']:['inPhoneSetupCode','btnPhoneSetupSubmit','btnPhoneSetupCancel'];
    state.focusIdx=0;
  }
  function disconnectPhone(notify) {
    clearTimeout(setupRequestTimer); setupPending=false; editing=false;
    if(notify)send({t:'bye',token:state.token});
    state.paired=false;state.token='';state.apps=[];stopPlayer();
    var socket=state.ws;state.ws=null;if(socket)socket.close();
    $('btnDisconnect').hidden=true;setConn(false,'غير متصل');show('pair');
  }
  $('btnDisconnect').onclick=function(){disconnectPhone(true);};
  var setupPending = false, setupRequestAt = 0, setupRequestTimer = 0;
  function phoneSetupStatus(m) {
    if (!state.paired || m.phoneSetupVersion !== '1') return;
    var mode = m.phoneSetup || 'idle';
    if (mode === 'idle') { if (state.screen === 'setup' && !setupPending) show('apps'); return; }
    if (setupPending && mode === 'waiting' && Date.now()-setupRequestAt < 90000) return;
    if (mode !== 'pairing') clearTimeout(setupRequestTimer);
    if (mode === 'expired' && state.screen !== 'setup') return;
    if (mode === 'waiting' || mode === 'no_port' || mode === 'pairing' || mode === 'failed' || state.screen === 'setup') {
      if (state.screen !== 'setup') { $('inPhoneSetupCode').value = ''; show('setup'); }
      $('phoneSetupIp').textContent = state.ip;
      var messages = {
        waiting:'اكتب كود أندرويد الظاهر على الموبايل، ثم اضغط اتصال.',
        no_port:'افتح نافذة كود أندرويد على الموبايل وانتظر لحظة، ثم اضغط اتصال مرة أخرى.',
        pairing:'جاري الاقتران وتشغيل المساعد… سيب نافذة الكود مفتوحة.',
        failed:'الاقتران لم يكتمل. افتح كود جديد على الموبايل واكتبه هنا.',
        start_failed:'الكود اتقبل، لكن الاتصال لم يكتمل. ارجع لـBridge على الموبايل وافتح التصحيح اللاسلكي.',
        paired:'الاقتران نجح ✓ ارجع لـBridge على الموبايل لإكمال تشغيل المساعد.',
        ready:'الاتصال نجح ✓ ارجع لـBridge على الموبايل واختار تطبيقاتك.',
        expired:'انتهى وقت المحاولة. ارجع لخطوة التجهيز على الموبايل وابدأ مرة أخرى.'
      };
      $('phoneSetupStatus').textContent = messages[mode] || '';
      $('phoneSetupStatus').setAttribute('data-phase',mode);
      setupBusy(mode === 'pairing');
      var done = mode === 'paired' || mode === 'ready' || mode === 'start_failed';
      $('inPhoneSetupCode').disabled = mode === 'pairing' || done || mode === 'expired';
      $('btnPhoneSetupSubmit').disabled = mode === 'pairing' || mode === 'expired';
      $('btnPhoneSetupSubmit').textContent = done ? 'الرجوع للتطبيقات' : 'اتصال';
      setupPending = mode === 'pairing';
      if(mode !== 'pairing') focusables.setup = done || mode === 'expired' ? ['btnPhoneSetupSubmit','btnPhoneSetupCancel'].filter(function(id){return !$(id).disabled;}) : ['inPhoneSetupCode','btnPhoneSetupSubmit','btnPhoneSetupCancel'];
      if (done) { $('inPhoneSetupCode').value = ''; state.focusIdx = 0; paintFocus(); }
      if (mode === 'ready') {
        editing=false;$('inPhoneSetupCode').blur();show('apps');
        launchMessage('تم الاتصال ✓ اختار تطبيقًا من القائمة، أو ضيف تطبيقات من الموبايل.');
        $('appsError').classList.add('connection-success');
        setTimeout(function(){if($('appsError').classList.contains('connection-success'))launchMessage('');},5000);
      }
    }
  }
  function submitPhoneSetup() {
    if (setupPending || $('btnPhoneSetupSubmit').disabled) return;
    if (!state.paired || !state.ws || state.ws.readyState !== 1) { $('phoneSetupStatus').textContent='الاتصال بالموبايل انقطع. افتح Bridge على الموبايل واربط التلفزيون مرة أخرى.'; return; }
    if ($('inPhoneSetupCode').disabled) { send({t:'phone_setup_cancel',token:state.token}); show('apps'); return; }
    var code = digits($('inPhoneSetupCode').value).replace(/\s/g,'');
    if (!/^[0-9]{6}$/.test(code)) { $('phoneSetupStatus').textContent = 'اكتب نفس الستة أرقام الظاهرة في إعدادات أندرويد.'; return; }
    setupPending=true;setupRequestAt=Date.now();editing=false;
    $('inPhoneSetupCode').value='';$('inPhoneSetupCode').blur();$('inPhoneSetupCode').disabled=true;
    $('btnPhoneSetupSubmit').disabled=true;setupBusy(true);
    $('phoneSetupStatus').setAttribute('data-phase','pairing');
    $('phoneSetupStatus').textContent='جاري الاقتران وتشغيل المساعد… سيب نافذة الكود مفتوحة.';
    state.focusIdx=0;paintFocus();
    send({t:'phone_setup',token:state.token,code:code});
    clearTimeout(setupRequestTimer);setupRequestTimer=setTimeout(function(){
      if(!setupPending)return;setupPending=false;setupBusy(false);
      $('inPhoneSetupCode').disabled=false;$('btnPhoneSetupSubmit').disabled=false;
      $('phoneSetupStatus').setAttribute('data-phase','failed');
      $('phoneSetupStatus').textContent='لم يصل تأكيد من الموبايل. ارجع لـBridge وتحقق من الاتصال ثم افتح كودًا جديدًا.';
    },90000);
  }
  $('btnPhoneSetupSubmit').onclick=submitPhoneSetup;
  $('btnPhoneSetupCancel').onclick = function () { setupBusy(false); clearTimeout(setupRequestTimer);send({t:'phone_setup_cancel',token:state.token});setupPending=false;editing=false;$('phoneSetupSpinner').hidden=true;$('inPhoneSetupCode').value='';show('apps'); };
  function onStatus(m) {
    applyTheme(m.theme);
    phoneSetupStatus(m);
    if (m.streaming === 'true' || m.streaming === true) {
      // server-driven stream info; player pulls /stream itself
    }
    // Phone launched something (tap-to-add on the phone): open it here
    // right away so the TV remote drives it immediately.
    if (!state.leavingApp && m.running && (m.streaming==='true'||m.streaming===true) && (state.screen === 'apps' || state.screen === 'play') && m.running !== state.lastRunning) {
      openAppPkg(m.running, false);
      return;
    }
    if (m.running !== undefined && !m.running) {
      state.leavingApp=false;state.lastRunning = '';
      if (state.screen === 'play') { stopPlayer(); show('apps'); }
    }
    renderDiagExtra(m);
  }

  /* ---------- apps grid ---------- */
  function updateAppColumns() {
    var grid=$('grid'),cards=grid.children;if(!grid.clientWidth||!cards.length)return;
    var top=cards[0].offsetTop,count=0;
    while(count<cards.length&&cards[count].offsetTop===top)count++;
    state.appColumns=Math.max(1,count);
  }
  function renderApps() {
    var oldList=focusables.apps||[],oldId=oldList[state.focusIdx],oldNode=oldId&&$(oldId),oldPkg=oldNode&&oldNode.getAttribute('data-pkg'),wasSearch=state.screen==='apps'&&oldId==='inSearch'&&document.activeElement===$('inSearch');
    var grid = $('grid');
    grid.innerHTML = '';
    focusables.apps = ['inSearch'];
    var q = (state.query || '').toLowerCase();
    var shown = 0;
    state.apps.forEach(function (a) {
      if (q && a.label.toLowerCase().indexOf(q) < 0 && a.pkg.toLowerCase().indexOf(q) < 0) return;
      var i = shown;
      var d = document.createElement('button');
      d.className = 'card';
      var pkgLower = String(a.pkg).toLowerCase();
      ['netflix', 'youtube', 'shahid', 'ostora', 'spotify', 'vlc'].forEach(function (brand) {
        if (pkgLower.indexOf(brand) >= 0) d.className += ' ' + brand;
      });
      if (pkgLower.indexOf('amazon') >= 0) d.className += ' prime';
      d.id = 'app_' + i;
      d.setAttribute('data-pkg', a.pkg);
      d.setAttribute('data-label', a.label);
      d.setAttribute('aria-label', 'فتح ' + a.label);
      d.innerHTML = '<div class="app-label" data-no-translate>' + escapeHtml(a.label) + '</div>';
      if (a.icon && a.icon.indexOf('data:image/png;base64,') === 0) {
        var icon = document.createElement('img');
        icon.src = a.icon;
        icon.className = 'app-icon';
        d.insertBefore(icon, d.firstChild);
      } else {
        var fallback = document.createElement('div');
        fallback.className = 'app-fallback'; fallback.textContent = String(a.label).charAt(0);
        d.insertBefore(fallback, d.firstChild);
      }
      d.onclick = (function (pkg) { return function () { openAppPkg(pkg); }; })(a.pkg);
      grid.appendChild(d);
      focusables.apps.push('app_' + i);
      shown++;
    });
    var add = document.createElement('button');
    add.id = 'btnAddApp'; add.className = 'card add-app';
    add.innerHTML = '<span class="add-symbol">+</span><span>إضافة تطبيق</span>';
    add.onclick = function () { show('help'); };
    grid.appendChild(add); focusables.apps.push('btnAddApp','btnDisconnect');
    $('appsTitle').textContent = q ? 'نتائج البحث' : 'كل تطبيقاتك، في مكان واحد.';
    if ($('appsCount')) $('appsCount').textContent = shown + ' تطبيقات من موبايلك';
    updateAppColumns();
    if(state.screen==='apps'){var restore=-1;if(oldPkg)for(var j=1;j<focusables.apps.length;j++){var candidate=$(focusables.apps[j]);if(candidate&&candidate.getAttribute('data-pkg')===oldPkg){restore=j;break;}}state.focusIdx=wasSearch?0:restore>=0?restore:Math.min(Math.max(1,state.focusIdx),focusables.apps.length-1);}
    paintFocus();
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function openAppPkg(pkg, launch) {
    if (!state.paired || !state.ws || state.ws.readyState !== 1) {
      $('pairError').textContent = 'Reconnect your phone before opening an app.';
      show('pair'); return;
    }
    var found = null;
    for (var k = 0; k < state.apps.length; k++) {
      if (state.apps[k].pkg === pkg) { found = state.apps[k]; break; }
    }
    var a = found || { label: pkg, pkg: pkg };
    $('playTitle').textContent = a.label;
    $('playState').textContent = 'starting…';
    if (launch !== false) {
      clearTimeout(launchTimer);state.leavingApp=false;state.pendingLaunch=a.pkg;
      launchMessage('جاري فتح التطبيق على التلفزيون…');
      send({ t: 'launch', pkg: a.pkg, token: state.token });
      launchTimer=setTimeout(function(){if(state.pendingLaunch){state.pendingLaunch='';launchMessage('لم يكتمل تشغيل التطبيق. راجع رسالة Bridge على الموبايل ثم حاول مرة أخرى.');}},20000);
      return;
    }
    clearTimeout(launchTimer);state.pendingLaunch='';state.lastRunning=pkg;launchMessage('');
    show('play');
    // Stream URL is fixed; server answers video or an honest 503.
    startPlayer('http://' + state.ip + ':' + HTTP_PORT + '/stream');
    startAudio();
  }

  /* ---------- video (MSE fMP4, guarded) ---------- */
  function startStream(m) {
    if (state.screen === 'play') startPlayer('http://' + state.ip + ':' + HTTP_PORT + '/stream');
  }
  var playerGeneration = 0;
  var streamReader = null;
  var playerUrl = null;
  function mseSupported() {
    try {
      return typeof window.MediaSource !== 'undefined' &&
        !!window.MediaSource.isTypeSupported &&
        window.MediaSource.isTypeSupported('video/mp4; codecs="avc1.42801F"');
    } catch (e) { return false; }
  }
  function startPlayer(url) {
    var v = $('video');
    stopPlayer();
    var loading=$('bridgePlayLoading');if(!loading){loading=document.createElement('div');loading.id='bridgePlayLoading';loading.setAttribute('role','status');loading.innerHTML='<img src="../assets/morph-header-symbol.webp" alt="M"><strong>Morph Bridge</strong><span class="phone-setup-spinner"></span><p></p>';$('videoWrap').appendChild(loading);}loading.querySelector('p').textContent=document.documentElement.lang==='ar'?'جاري فتح التطبيق…':'Opening your app…';loading.hidden=false;
    state.video = { supported: mseSupported(), firstFrameAt: 0, initAt: Date.now(), errors: [], mse: null, sb: null };
    if (!state.video.supported) {
      $('playState').textContent = 'error: MSE fMP4 not supported on this TV';
      log('MSE unsupported');
      return;
    }
    if (typeof window.fetch !== 'function' || typeof window.ReadableStream === 'undefined') {
      // Some 4.0 firmwares lack streaming fetch; report instead of hanging.
      $('playState').textContent = 'error: streaming fetch unavailable on this firmware';
      log('no streaming fetch');
      return;
    }
    var ms = new MediaSource();
    state.video.mse = ms;
    playerUrl = window.URL.createObjectURL(ms);
    v.src = playerUrl;
    var playResult = v.play && v.play();
    if (playResult && playResult.catch) playResult.catch(function (e) { log('play: ' + e); });
    var generation = playerGeneration;
    ms.addEventListener('sourceopen', function () {
      if (generation !== playerGeneration) return;
      var sb;
      try {
        sb = ms.addSourceBuffer('video/mp4; codecs="avc1.42801F"');
      } catch (e) {
        $('playState').textContent = 'error: SourceBuffer failed';
        log('addSourceBuffer failed: ' + e);
        return;
      }
      state.video.sb = sb;
      sb.mode = 'segments';
      pump(url, sb, ms);
      v.addEventListener('playing', function onPlay() {
        if (!state.video.firstFrameAt) {
          state.video.firstFrameAt = Date.now();if($('bridgePlayLoading'))$('bridgePlayLoading').hidden=true;
          $('playState').textContent = 'playing';
          log('first frame after ' + (state.video.firstFrameAt - state.video.initAt) + 'ms');
        }
      });
    });
  }
  function pump(url, sb, ms) {
    var generation = playerGeneration;
    var queue = [];
    var appending = false;
    function shift() {
      if (generation !== playerGeneration) return;
      if (appending) return;
      if (sb.updating) { setTimeout(shift, 50); return; }
      // Older TVs have a small media memory budget. Retain only a short
      // live window instead of accumulating the entire phone session.
      var cutoff = $('video').currentTime - 2;
      if (sb.buffered.length && cutoff > 1 && sb.buffered.start(0) < cutoff - 1) {
        appending = true;
        try { sb.remove(sb.buffered.start(0), cutoff); }
        catch (e) { appending = false; log('trim: ' + e); }
        return;
      }
      if (!queue.length) return;
      appending = true;
      try { sb.appendBuffer(queue.shift()); }
      catch (e) { appending = false; stopPlayer(); $('playState').textContent = 'Decoder stopped. Press Red and reopen the app.'; log('append failed: ' + e); return; }
    }
    if (sb.addEventListener) sb.addEventListener('updateend', function () {
      appending = false;
      var video = $('video');
      if (generation === playerGeneration && sb.buffered.length) {
        var start = sb.buffered.start(sb.buffered.length - 1);
        var end = sb.buffered.end(sb.buffered.length - 1);
        var lag = end - video.currentTime;
        // A short stable cushion absorbs Wi-Fi/decoder jitter. Frequent live
        // seeks cut visible motion; catch up gently unless far behind/gapped.
        if (video.currentTime < start || lag > 3.5) {
          try { video.currentTime = Math.max(start, end - 0.6); } catch (e) {}
        } else video.playbackRate = lag > 1.4 ? 1.04 : 1;
        if (video.paused) { var result = video.play(); if (result && result.catch) result.catch(function () {}); }
      }
      shift();
    });
    window.fetch(url).then(function (resp) {
      if (generation !== playerGeneration) { if (resp.body) resp.body.cancel(); return; }
      if (!resp.ok) {
        return resp.text().then(function (t) {
          $('playState').textContent = 'stream unavailable: ' + t;
          log('stream http ' + resp.status + ' ' + t);
        });
      }
      $('playState').textContent = 'receiving…';
      var reader = resp.body.getReader();
      streamReader = reader;
      function read() {
        reader.read().then(function (r) {
          if (r.done || generation !== playerGeneration) return;
          queue.push(r.value);
          // Fetch chunks are arbitrary byte ranges. Dropping one corrupts MP4 boxes.
          if (queue.length > 256) { stopPlayer(); $('playState').textContent = 'TV decoder is too slow. Reopen the app.'; return; }
          shift();
          read();
        }, function (e) { log('stream read error: ' + e); });
      }
      read();
    }, function (e) {
      $('playState').textContent = 'error: fetch failed';
      log('fetch failed: ' + e);
    });
  }
  function stopPlayer() {
    stopPointerMotion();
    stopAudio();
    playerGeneration++;
    if (streamReader) { try { streamReader.cancel(); } catch (e) {} streamReader = null; }
    try {
      var v = $('video');
      v.removeAttribute('src');
      if (playerUrl) { try { window.URL.revokeObjectURL(playerUrl); } catch (e) {} playerUrl = null; }
      v.load && v.load();
    } catch (e) {}
  }

  /* Selected-app AAC stream; its on-phone output is routed to this TV only. */
  var audioGeneration = 0, audioReader = null, audioUrl = null;
  function stopAudio() {
    audioGeneration++;
    if (audioReader) { try { audioReader.cancel(); } catch (e) {} audioReader = null; }
    var audio = $('appAudio');
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
    if (audioUrl) { window.URL.revokeObjectURL(audioUrl); audioUrl = null; }
  }
  function startAudio() {
    stopAudio();
    var generation = audioGeneration, attempts = 0;
    var audio = $('appAudio');
    var mime = 'audio/mp4; codecs="mp4a.40.2"';
    if (!window.MediaSource || !MediaSource.isTypeSupported(mime)) { log('AAC audio is unsupported on this TV'); return; }
    var ms = new MediaSource();
    audioUrl = window.URL.createObjectURL(ms);
    audio.src = audioUrl;
    audio.muted = false; audio.volume = 1;
    ms.addEventListener('sourceopen', function () {
      if (generation !== audioGeneration) return;
      var sb;
      try { sb = ms.addSourceBuffer(mime); sb.mode = 'segments'; }
      catch (e) { log('AAC SourceBuffer: ' + e); return; }
      var queue = [], busy = false;
      function shift() {
        if (generation !== audioGeneration || busy || sb.updating) return;
        if (sb.buffered.length && audio.currentTime > 3 && sb.buffered.start(0) < audio.currentTime - 3) {
          busy = true; sb.remove(sb.buffered.start(0), audio.currentTime - 2); return;
        }
        if (!queue.length) return;
        busy = true;
        try { sb.appendBuffer(queue.shift()); } catch (e) { busy = false; log('AAC append: ' + e); stopAudio(); }
      }
      sb.addEventListener('updateend', function () {
        busy = false;
        if (generation !== audioGeneration) return;
        if (sb.buffered.length) {
          var start = sb.buffered.start(sb.buffered.length - 1), end = sb.buffered.end(sb.buffered.length - 1);
          var lag = end - audio.currentTime;
          if (audio.currentTime < start || lag > 3.5) {
            try { audio.currentTime = Math.max(start, end - 0.6); } catch (e) {}
          } else audio.playbackRate = lag > 1.4 ? 1.04 : 1;
          if (audio.paused) {
            var playing = audio.play();
            if (playing && playing.catch) playing.catch(function (e) { log('AAC play: ' + e); });
          }
        }
        shift();
      });
      function connect() {
        if (generation !== audioGeneration) return;
        window.fetch('http://' + state.ip + ':' + HTTP_PORT + '/audio').then(function (response) {
          if (generation !== audioGeneration) { if (response.body) response.body.cancel(); return; }
          if (!response.ok) {
            if (++attempts < 30) setTimeout(connect, 200);
            else log('Selected-app audio unavailable');
            return;
          }
          var reader = response.body.getReader(); audioReader = reader;
          function read() {
            reader.read().then(function (packet) {
              if (packet.done || generation !== audioGeneration) return;
              if (queue.length > 200) { log('AAC decoder backlog'); stopAudio(); return; }
              queue.push(packet.value); shift(); read();
            }, function (e) { if (generation === audioGeneration) log('AAC read: ' + e); });
          }
          read();
        }, function (e) { if (generation === audioGeneration) log('AAC network: ' + e); });
      }
      connect();
    });
  }

  /* ---------- remote keys ---------- */
  var pointerMode = true;
  var lastScrollAt = 0;
  var pointerX = 0.5, pointerY = 0.5;
  var pointerMotion = new AppBridgePointerMotion(pointerX, pointerY);
  var pointerFrame = null;
  function stopPointerMotion() {
    if (pointerMotion) pointerMotion.stop();
    if (pointerFrame !== null) {
      if (window.cancelAnimationFrame) window.cancelAnimationFrame(pointerFrame);
      else window.clearTimeout(pointerFrame);
      pointerFrame = null;
    }
  }
  function syncPointer() { pointerX = pointerMotion.x; pointerY = pointerMotion.y; paintPointer(); }
  function animatePointer() {
    pointerFrame = null;
    if (!pointerMode || state.screen !== 'play') { stopPointerMotion(); return; }
    var video = $('video');
    pointerMotion.advance(Date.now(), video.videoWidth || 1280, video.videoHeight || 720);
    syncPointer();
    var now=Date.now(),down=pointerMotion.keys['40'],up=pointerMotion.keys['38'];
    if(down&&pointerY>=.94&&now-down.start>500)scrollApp(1);
    else if(up&&pointerY<=.06&&now-up.start>500)scrollApp(-1);
    if (pointerMotion.active()) {
      pointerFrame = window.requestAnimationFrame ? window.requestAnimationFrame(animatePointer) : window.setTimeout(animatePointer, 16);
    }
  }
  window.addEventListener('blur', stopPointerMotion);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopPointerMotion(); });
  document.addEventListener('keyup', function (e) {
    var key = e.keyCode || e.which;
    if (key >= 37 && key <= 40) {
      var video = $('video');
      pointerMotion.release(key, Date.now(), video.videoWidth || 1280, video.videoHeight || 720);
      syncPointer();
      if (!pointerMotion.active()) stopPointerMotion();
    }
  });
  function paintPointer() {
    var cursor = $('appCursor'), video = $('video');
    if (!cursor) return;
    cursor.style.display = pointerMode && state.screen === 'play' ? 'block' : 'none';
    cursor.textContent = '';
    cursor.style.borderColor = '#ffffff';
    var scale = Math.min(video.clientWidth / (video.videoWidth || 1280), video.clientHeight / (video.videoHeight || 720));
    var w = (video.videoWidth || 1280) * scale, h = (video.videoHeight || 720) * scale;
    cursor.style.left = (video.offsetLeft + (video.clientWidth - w) / 2 + pointerX * w) + 'px';
    cursor.style.top = (video.offsetTop + (video.clientHeight - h) / 2 + pointerY * h) + 'px';
  }
  $('video').addEventListener('loadedmetadata', paintPointer);
  $('video').addEventListener('click', function (e) {
    var v = $('video'), rect = v.getBoundingClientRect();
    var scale = Math.min(rect.width / (v.videoWidth || 1280), rect.height / (v.videoHeight || 720));
    var w = (v.videoWidth || 1280) * scale, h = (v.videoHeight || 720) * scale;
    var x = (e.clientX - rect.left - (rect.width - w) / 2) / w;
    var y = (e.clientY - rect.top - (rect.height - h) / 2) / h;
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      stopPointerMotion(); pointerMotion.setPosition(x, y); syncPointer();
      send({ t: 'pointer', x: String(x), y: String(y), token: state.token });
    }
  });
  var KEYMAP = { 37: 'LEFT', 38: 'UP', 39: 'RIGHT', 40: 'DOWN', 13: 'OK', 415: 'PLAY_PAUSE', 19: 'PLAY_PAUSE' };
  function scrollApp(direction) {
    var now = Date.now();
    if (now - lastScrollAt < 300) return;
    lastScrollAt = now;
    send({ t: 'scroll', dy: String(direction), x:String(pointerX), token: state.token });
  }
  $('video').addEventListener('wheel', function (e) {
    if (state.screen === 'play' && e.deltaY) { scrollApp(e.deltaY > 0 ? 1 : -1); e.preventDefault(); }
  });
  document.addEventListener('keydown', function (e) {
    var kc = e.keyCode || e.which;
    if (kc === 13 && (Date.now() < ignoreEditorEnterUntil || state.screen === 'setup' && (setupPending || e.repeat))) { e.preventDefault(); return; }
    if (editing) {
      if (kc === 13 || kc === 10009 || kc === 461 || kc === 27) {
        var completeInput=document.activeElement;
        editing = false;
        if (completeInput) completeInput.blur();
        ignoreEditorEnterUntil=Date.now()+600;
        if (kc===13 && state.screen==='setup') submitPhoneSetup(); else paintFocus();
        e.preventDefault();
      }
      return;
    }
    if (kc === 10009 || kc === 8 || kc === 461 || kc === 27 || e.key === 'GoBack' || e.key === 'BrowserBack') {
      onBack('keydown', !!e.repeat); e.preventDefault(); return;
    }
    if (state.screen === 'play') {
      if (kc === 404) { stopPointerMotion(); scrollApp(1); e.preventDefault(); return; }
      if (kc === 427 || kc === 33) { scrollApp(-1); e.preventDefault(); return; }
      if (kc === 428 || kc === 34) { scrollApp(1); e.preventDefault(); return; }
      if (kc === 405) { stopPointerMotion(); pointerMode = !pointerMode; paintPointer(); e.preventDefault(); return; }
      if (pointerMode && (kc === 37 || kc === 38 || kc === 39 || kc === 40 || kc === 13)) {
        if (kc === 13) {
          stopPointerMotion();
          send({ t: 'pointer', x: String(pointerX), y: String(pointerY), token: state.token });
        } else {
          var video = $('video');
          pointerMotion.press(kc, Date.now(), video.videoWidth || 1280, video.videoHeight || 720);
          syncPointer();
          if (pointerFrame === null) animatePointer();
        }
        e.preventDefault(); return;
      }
      var k = KEYMAP[kc];
      if (k === 'OK') { send({ t: 'key', k: 'OK', token: state.token }); }
      else if (k) { send({ t: 'key', k: k, token: state.token }); }
      else if (kc === 68 || kc === 406) { show('diag'); }
      e.preventDefault();
      return;
    }
    if (kc === 37) moveFocus(-1, 0);
    else if (kc === 39) moveFocus(1, 0);
    else if (kc === 38) moveFocus(0, -1);
    else if (kc === 40) moveFocus(0, 1);
    else if (kc === 13) activate();
    else if (kc === 68 || kc === 406) show('diag');
    else return;
    e.preventDefault();
  });
  window.MorphReceiverBack = function () { onBack('host', false); };
  if($('bridge-back'))$('bridge-back').onclick=function(){onBack('button',false);};
  var lastBackAt = 0, lastBackSource = '', backArmedAt = 0;
  function leaveApp() {
    stopPointerMotion();
    state.leavingApp=true;clearTimeout(launchTimer);state.pendingLaunch='';
    var previous=state.lastRunning;state.lastRunning='';show('apps');launchMessage('');backArmedAt=0;
    for(var i=0;i<state.apps.length;i++)if(state.apps[i].pkg===previous){state.focusIdx=i+1;paintFocus();break;}
    // Paint the launcher before decoder/audio teardown, and ignore stale running
    // statuses until the phone acknowledges stop instead of reopening black video.
    var cleanup=function(){stopPlayer();send({t:'stop',token:state.token});};
    if(window.requestAnimationFrame)window.requestAnimationFrame(function(){setTimeout(cleanup,0);});else setTimeout(cleanup,0);
  }
  function onBack(source, repeat) {
    stopPointerMotion();
    var now = Date.now();
    // Some firmwares emit both keydown and tizenhwkey for one press.
    if (repeat || (source !== lastBackSource && now - lastBackAt < 250)) return;
    lastBackAt = now; lastBackSource = source;
    if (state.screen === 'play') {
      if (backArmedAt && now - backArmedAt < 750) { leaveApp(); return; }
      backArmedAt = now;
      send({ t: 'key', k: 'BACK', token: state.token });
    }
    else if (state.screen === 'setup') { $('btnPhoneSetupCancel').click(); }
    else if (state.screen === 'diag' || state.screen === 'help') { show(state.paired ? 'apps' : 'pair'); }
    else if (state.screen === 'apps') { show('pair'); }
    else {
      try {
        if (window.MorphPlatform && window.MorphPlatform.exit) window.MorphPlatform.exit();
        else if (typeof tizen !== 'undefined') tizen.application.getCurrentApplication().exit();
      } catch (e) { window.close(); }
    }
  }
  document.addEventListener('tizenhwkey', function (e) {
    if (e.keyName === 'back') { onBack('tizenhwkey', false); if (e.preventDefault) e.preventDefault(); }
  });

  if($('btnDiagTechnical'))$('btnDiagTechnical').onclick=function(){$('diagText').hidden=!$('diagText').hidden;};
  /* ---------- diagnostics ---------- */
  var lastStatus = null;
  function renderDiagExtra(m) { lastStatus = m; renderDiag(); }
  function renderDiag() {
    var v = $('video');
    var lines = [
      'screen=' + state.screen + ' paired=' + state.paired,
      'ws=' + (state.ws ? state.ws.readyState : 'none') + ' (0=open? use 1) ip=' + state.ip,
      'mse=' + state.video.supported +
        ' readyState=' + (v ? v.readyState : '?') +
        ' size=' + (v ? v.videoWidth + 'x' + v.videoHeight : '?'),
      'firstFrameMs=' + (state.video.firstFrameAt ? (state.video.firstFrameAt - state.video.initAt) : 'n/a'),
      'status=' + (lastStatus ? JSON.stringify(lastStatus) : 'none')
    ];
    if (state.video.errors.length) lines.push('--- log ---\n' + state.video.errors.slice(-12).join('\n'));
    else lines.push('(no errors logged)');
    if($('diagConnection'))$('diagConnection').textContent=state.paired?'متصل بالموبايل':'غير متصل';
    if($('diagPhoneIP'))$('diagPhoneIP').textContent=state.ip||'—';
    if($('diagStream'))$('diagStream').textContent=lastStatus&&(lastStatus.streaming===true||lastStatus.streaming==='true')?'جاهز':'لم يبدأ';
    if($('diagSummary'))$('diagSummary').textContent=state.paired?'الاتصال جاهز. افتح تطبيقًا من قائمة التطبيقات.':'افتح Bridge على الموبايل، وابحث عن هذا التلفزيون واضغط عليه للاتصال.';
    if($('btnTestOutput'))$('btnTestOutput').disabled=!state.paired;
    var el = $('diagText');
    if (el) el.textContent = lines.join('\n');
  }

  $('btnConnect').onclick = doConnect;
  function testOutput() {
    if (!state.paired) return;
    state.lastRunning = '';
    show('apps');
    send({ t: 'test', token: state.token });
  }
  $('btnTestOutput').onclick = testOutput;
  $('btnDiag').onclick = function () { show('diag'); };
  $('btnDiagBack').onclick = function () { show(state.paired ? 'apps' : 'pair'); };
  $('btnHelpBack').onclick = function () { show(state.paired ? 'apps' : 'pair'); };
  // Exit playback with the remote's red key; Return stays Android Back.
  document.addEventListener('keydown', function (e) {
    if (state.screen === 'play' && e.keyCode === 403) leaveApp();
  });
  try {
    if (typeof tizen !== 'undefined' && tizen.tvinputdevice) {
      ['ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue', 'ChannelUp', 'ChannelDown', 'MediaPlayPause', 'MediaPlay', 'MediaPause'].forEach(function (key) {
        try { tizen.tvinputdevice.registerKey(key); } catch (e) {}
      });
    }
  } catch (e) {}
  function updateTvAddress() {
    var ip = '';try { ip = window.MorphPlatform ? MorphPlatform.getIp() : ''; } catch(e) {}
    $('tvLocalIp').textContent = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip) ? ip : 'غير متاح · اتصل بشبكة Wi-Fi';
  }
  var discovering = false;
  function discoverPhone() {
    if (discovering || state.paired) return;
    var tvIp = '';
    try {
      tvIp = window.MorphPlatform ? window.MorphPlatform.getIp() : webapis.network.getIp();
    } catch (e) {}
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(tvIp)) return;
    discovering = true;
    $('pairError').textContent = 'في انتظار الموبايل… اختار التلفزيون واضغط اتصال في Morph Bridge.';
    var subnet = tvIp.substring(0, tvIp.lastIndexOf('.') + 1);
    var next = 1, active = 0, finished = false;
    function fill() {
      if (finished || state.paired) { discovering = false; return; }
      while (active < 10 && next < 255) probe(subnet + next++);
      if (next >= 255 && active === 0) discovering = false;
    }
    function probe(ip) {
      active++;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'http://' + ip + ':' + HTTP_PORT + '/discover', true);
      xhr.timeout = 700;
      var done = false;
      function complete() {
        if (done) return;
        done = true; active--;
        if (!finished && xhr.status === 200) {
          try {
            var match = JSON.parse(xhr.responseText);
            if (match.code && match.ip) {
              finished = true; discovering = false;
              $('inIp').value = match.ip; $('inCode').value = match.code;
              doConnect(); return;
            }
          } catch (e) {}
        }
        fill();
      }
      xhr.onload = complete; xhr.onerror = complete; xhr.ontimeout = complete;
      try { xhr.send(); } catch (e) { complete(); }
    }
    var remembered = '';
    try { remembered = localStorage.getItem('appbridge_phone_ip') || ''; } catch (e) {}
    if (/^\d+\.\d+\.\d+\.\d+$/.test(remembered)) probe(remembered);
    else fill();
  }
  try { applyTheme(localStorage.getItem('morph_bridge_theme') || 'light'); } catch (e) { applyTheme('light'); }
  show('pair');
  updateTvAddress();
  document.addEventListener('morph-network-ready', function(){updateTvAddress();discoverPhone();});
  setInterval(updateTvAddress,20000);
  // Paint the themed receiver before beginning the LAN request burst.
  setTimeout(discoverPhone,350);
  setInterval(function () { if (state.screen === 'pair' && !state.paired) discoverPhone(); }, 20000);
  setInterval(function () { if (state.paired) send({ t: 'heartbeat', token: state.token }); }, 15000);
  document.addEventListener('input', function (e) {
    if (e && e.target && e.target.id === 'inSearch') {
      state.query = e.target.value || '';
      if (state.screen === 'apps') { state.focusIdx = 0; renderApps(); }
    }
  });
})();
