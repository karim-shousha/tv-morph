/* Devices shortcuts and Bridge entry. Feature implementations remain independent. */
(function (w, d) {
  'use strict';
  function boot() {
    var host = d.getElementById('mobile-service-map');
    if (!host || d.getElementById('phone-home-shortcuts')) return;
    var nav = d.createElement('nav');
    nav.id = 'phone-home-shortcuts';
    nav.setAttribute('data-no-translate', '');
    var status = d.createElement('p');
    status.id = 'phone-shortcuts-status';
    status.setAttribute('role', 'status');
    status.hidden = true;
    function nativeAction(action) {
      status.hidden = true;
      if (!w.MorphNative) return;
      MorphNative.call(action).catch(function (error) {
        status.textContent = error.message;
        status.hidden = false;
      });
    }
    function shortcut(icon, action) {
      var button = d.createElement('button');
      button.type = 'button';
      button.innerHTML = Morph30.svg(icon, 22) + '<span></span>';
      button.onclick = action;
      nav.appendChild(button);
      return button;
    }
    var matches = shortcut('matches', function () { closeMenu(); nativeAction('matchesOpen'); });
    matches.id = 'phone-home-matches';
    var themes = shortcut('design', function () { closeMenu(); Morph30.show('design'); });
    themes.id = 'phone-home-themes';
    var menu = d.createElement('dialog');
    menu.id = 'phone-home-menu';
    menu.setAttribute('aria-labelledby', 'phone-menu-title');
    menu.innerHTML = '<div class="phone-menu-heading"><h2 id="phone-menu-title"></h2><button id="phone-menu-close" type="button">×</button></div>';
    menu.appendChild(nav);
    d.body.appendChild(menu);
    host.insertBefore(status, host.firstChild);
    var toggle = d.createElement('button');
    toggle.id = 'phone-menu-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-haspopup', 'dialog');
    toggle.setAttribute('aria-controls', menu.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    d.querySelector('body>header').appendChild(toggle);
    function closeMenu() { if (!menu.open) return false; menu.close(); return true; }
    toggle.onclick = function () { menu.showModal(); toggle.setAttribute('aria-expanded', 'true'); };
    menu.querySelector('#phone-menu-close').onclick = closeMenu;
    menu.addEventListener('close', function () { toggle.setAttribute('aria-expanded', 'false'); toggle.focus({preventScroll:true}); });
    menu.addEventListener('click', function (event) { if (event.target === menu) { var rect=menu.getBoundingClientRect(); if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) closeMenu(); } });
    w.MorphHomeMenu = {back:closeMenu};
    var old = d.querySelector('.bottom-nav [data-page=design]');
    if (!old) return;
    var bridge = d.createElement('button');
    bridge.type = 'button';
    bridge.id = 'phone-bridge-open';
    bridge.setAttribute('data-no-translate', '');
    bridge.innerHTML = '<span class="m30-nav-ic">' + Morph30.svg('cast', 24) + '</span><span class="m30-nav-lb">Bridge</span>';
    bridge.onclick = function () { nativeAction('bridgeOpen'); };
    old.replaceWith(bridge);
    // Keep the established bottom order when Prayer settings repaint their nav.
    function labels() {
      var lang = w.MorphLocale ? MorphLocale.get() : 'en';
      var words = lang === 'ar' ? ['المباريات', 'الثيمات'] : lang === 'fr' ? ['Matchs', 'Thèmes'] : ['Matches', 'Themes'];
      bridge.querySelector('.m30-nav-lb').textContent = lang === 'ar' ? 'المشاركة' : 'Bridge';
      matches.querySelector('span').textContent = words[0];
      themes.querySelector('span').textContent = words[1];
      nav.setAttribute('aria-label', words.join(' · '));
      var title = lang === 'ar' ? 'القائمة' : lang === 'fr' ? 'Menu' : 'Menu';
      menu.querySelector('h2').textContent = title;
      toggle.setAttribute('aria-label', title);
      menu.querySelector('#phone-menu-close').setAttribute('aria-label',lang === 'ar' ? 'إغلاق القائمة' : 'Close menu');
      var prayer = d.querySelector('.bottom-nav [data-page=worship]');
      if (prayer) prayer.before(bridge);
    }
    labels();
    w.addEventListener('morphLanguage', labels);
    new MutationObserver(function () {
      var prayer = d.querySelector('.bottom-nav [data-page=worship]');
      if (prayer && bridge.nextElementSibling !== prayer) prayer.before(bridge);
    }).observe(bridge.parentNode, {childList: true});
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot, {once: true});
  else boot();
})(window, document);
