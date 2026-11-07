/* Shared cinematic startup. Readiness remains driven by the real application. */
(function (w, d) {
  'use strict';
  var iptv = /\/iptv\//.test(location.pathname) || !!d.querySelector('meta[name="tvm-media-root"]');
  var finished = false, check = null, fallback = null;
  function el(tag, cls, text) {
    var node = d.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }
  var layer = el('div'); layer.id = 'morph-brand-loader';
  layer.setAttribute('role', 'status');
  layer.setAttribute('aria-label', iptv ? 'Loading Morph IPTV' : 'Loading Morph Launcher');
  var stage = el('div', 'morph-boot-stage');
  var brand = el('div', 'morph-boot-brand');
  brand.setAttribute('aria-label', iptv ? 'Morph IPTV' : 'Morph Launcher');
  var image = el('img', 'morph-boot-logo');
  image.src = iptv ? 'morph-loading-symbol.webp' : 'assets/morph-loading-symbol.webp';
  layer.style.setProperty('--morph-boot-background', 'url("' + (iptv ? 'morph-loading-background.webp' : 'assets/morph-loading-background.webp') + '")');
  // Inline image and a solid base also work before old TV CSS-variable polyfills run.
  layer.style.backgroundColor = '#07101e';
  layer.style.backgroundImage = 'url("' + (iptv ? 'morph-loading-background.webp' : 'assets/morph-loading-background.webp') + '")';
  image.alt = '';
  brand.appendChild(image);
  brand.appendChild(el('span', 'morph-boot-name', iptv ? 'orph IPTV' : 'orph Launcher'));
  var rule = el('div', 'morph-boot-rule'), slogan = el('p', 'morph-boot-slogan');
  var bar = el('div', 'morph-boot-progress'); bar.setAttribute('aria-hidden', 'true');
  bar.appendChild(el('i'));
  var text = el('p', 'morph-boot-status');
  var credit = el('p', 'morph-boot-credit', 'Developed by Karim Aboushousha');
  credit.id = 'morph-loading-credit';
  var website = el('p', 'morph-boot-website', 'morph-tv.com');
  [brand, rule, slogan,bar, text, credit, website].forEach(function (node) { stage.appendChild(node); });
  layer.appendChild(stage);
  d.documentElement.appendChild(layer);
  function settings() {
    var cfg = {};
    try {
      var viewer = localStorage.getItem('cleartv.activeViewer') || 'default';
      if (!/^(default|v[0-9a-z]+)$/.test(viewer)) viewer = 'default';
      cfg = JSON.parse(localStorage.getItem('cleartv.' + (viewer === 'default' ? '' : 'viewer.' + viewer + '.') + 'settings') || '{}');
      if (w.ClearTV) cfg = Object.assign({}, ClearTV.settings);
      else if (parent !== w && parent.ClearTV) cfg = Object.assign({}, parent.ClearTV.settings);
    } catch (ignore) {}
    try {
      var bridge = w.IptvNative || w.TVNative;
      if (bridge && bridge.settingsJson) {
        var nativeCfg = JSON.parse(bridge.settingsJson());
        Object.keys(nativeCfg).forEach(function (key) { if (cfg[key] == null || cfg[key] === '') cfg[key] = nativeCfg[key]; });
      }
    } catch (ignore) {}
    return cfg;
  }
  function paint() {
    var cfg = settings(), lang = cfg.language || d.documentElement.lang || 'en';
    var ar = lang === 'ar', fr = lang === 'fr';
    slogan.textContent = iptv ? (ar ? 'كل ترفيهك. في مكان واحد.' : fr ? 'Tous vos divertissements. Au même endroit.' : 'All your entertainment. One place.') : (ar ? 'شاشتك. عالمك. بطريقتك.' : fr ? 'Votre écran. Votre univers. À votre façon.' : 'Your screen. Your world. Your way.');
    text.textContent = iptv ? (ar ? 'جارٍ تجهيز مكتبتك…' : fr ? 'Préparation de votre bibliothèque…' : 'Preparing your library…') : (ar ? 'جارٍ تجهيز شاشتك…' : fr ? 'Préparation de votre écran…' : 'Preparing your screen…');
    slogan.dir = text.dir = ar ? 'rtl' : 'ltr';
    var scale = Math.min(w.innerWidth / 1920, w.innerHeight / 1080);
    stage.style.transform = 'translate(-50%,-50%) scale(' + scale + ')';
    var noMotion = cfg.visualEffects && cfg.visualEffects.motion === false || w.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (noMotion) layer.setAttribute('data-no-motion', ''); else layer.removeAttribute('data-no-motion');
  }
  paint();
  w.addEventListener('resize', paint); w.addEventListener('morphTheme', paint); w.addEventListener('storage', paint);
  function done() {
    if (finished) return;
    finished = true;
    w.removeEventListener('resize', paint); w.removeEventListener('morphTheme', paint); w.removeEventListener('storage', paint);
    clearInterval(check); clearTimeout(fallback);
    if (layer.parentNode) layer.parentNode.removeChild(layer);
    w.dispatchEvent(new Event('morphLoadingComplete'));
  }
  if (!iptv) w.addEventListener('morphIptvReady', done);
  w.addEventListener('pagehide', done);
  check = setInterval(function () {
    if (!iptv && d.readyState === 'complete' && !d.documentElement.classList.contains('theme-starting') && w.ClearTV && ClearTV.settings) done();
  }, 80);
  fallback = iptv ? null : setTimeout(done, 14000);
  w.MorphBrandLoader = {done: done, status: function (message, actions) {
    if (finished) return;
    text.textContent = message;
    var old = layer.querySelector('.morph-loading-actions'); if (old) old.remove();
    if (actions) {
      var row = el('div', 'morph-loading-actions');
      actions.forEach(function (action) { var button = el('button', '', action.label); button.onclick = action.run; row.appendChild(button); });
      stage.appendChild(row); if (row.firstChild) row.firstChild.focus();
    }
  }};
})(window, document);
